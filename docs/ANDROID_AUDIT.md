# Colage Android — Comprehensive Codebase Audit

**Date:** 2026-03-28  
**Scope:** Every Kotlin file in the Android app  
**Auditor:** Automated deep-dive  

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture Overview](#architecture-overview)
3. [File-by-File Analysis](#file-by-file-analysis)
4. [Cross-Cutting Concerns](#cross-cutting-concerns)
5. [iOS Parity Check](#ios-parity-check)
6. [Issue Tracker](#issue-tracker)
7. [Recommendations](#recommendations)

---

## Executive Summary

The Colage Android app is a Jetpack Compose + Hilt application that mirrors the iOS app closely in features: .edu email verification, onboarding flow, live Mapbox-based campus map, list/AR discovery modes, profile management, WebSocket-based real-time location, and local ads. The codebase is well-structured with clean separation of concerns, but **shares many of the same bugs that were found and fixed in iOS**. Several issues are Android-specific and need attention.

**Critical Issues:** 4  
**High Issues:** 9  
**Medium Issues:** 8  
**Low Issues:** 5  

---

## Architecture Overview

### Stack
- **UI:** Jetpack Compose (Material 3)
- **DI:** Hilt (`@HiltViewModel`, `@Singleton`, `@Module`)
- **Navigation:** Compose Navigation (`NavHost`) for onboarding; state-driven screen switching for authenticated state
- **Networking:** OkHttp (raw, no Retrofit despite being in dependencies) + Gson
- **Map:** Mapbox Maps SDK
- **Location:** Google Fused Location Provider + barometer for floor detection
- **Storage:** `EncryptedSharedPreferences` (tokens) + plain `SharedPreferences` (profile, prefs)
- **State:** `StateFlow` / `MutableStateFlow` throughout ViewModels
- **WebSocket:** OkHttp WebSocket with manual reconnection

### Module Structure
```
com.colageclub.colage/
├── ColageApplication.kt        # Hilt app + Mapbox init
├── MainActivity.kt             # Single activity, edge-to-edge
├── app/
│   ├── AppViewModel.kt         # Global state (auth, profile, discovery mode)
│   ├── Navigation.kt           # ColageApp + OnboardingNavHost
│   └── HomeScreen.kt           # Main discovery screen
├── di/
│   └── AppModule.kt            # SharedPreferences provider
├── core/
│   ├── design/                 # Colors, fonts, components, haptics, state views
│   ├── networking/             # ApiClient, WebSocketManager
│   ├── location/               # LocationService (GPS + barometer)
│   ├── storage/                # SecureStorage (EncryptedSharedPreferences)
│   └── university/             # UniversityService
├── data/
│   └── models/                 # All data models in one file
└── features/
    ├── auth/                   # AuthViewModel, OnboardingData, 12 screens
    ├── discovery/              # NearbyStudentsViewModel, MiniProfileSheet, FullProfileView
    ├── map/                    # MapDiscoveryView (Mapbox)
    ├── list/                   # ListDiscoveryView
    ├── ar/                     # ARDiscoveryView (simulated)
    ├── ads/                    # AdService, AdBannerView
    └── profile/                # OwnProfile, EditProfile, Settings screens
```

---

## File-by-File Analysis

### App Core

#### `ColageApplication.kt`
- **Purpose:** Hilt application entry point + Mapbox token initialization
- **Quality:** Clean. Reads Mapbox token from BuildConfig (sourced from `local.properties`)
- **Issue:** No crash reporting, no analytics initialization

#### `MainActivity.kt`
- **Purpose:** Single Activity, sets up edge-to-edge + Compose content
- **Quality:** Minimal and correct. Uses `@AndroidEntryPoint`
- **Issue:** No `onNewIntent` handling; no deep link support

#### `AppViewModel.kt`
- **Purpose:** Central ViewModel holding auth state, profile, discovery mode, visibility, floor, university
- **State:** `MutableStateFlow` for all state; `StateFlow` exposed to UI
- **Issues:**
  - **🔴 CRITICAL — Profile stored in plain SharedPreferences** (`prefs.getString("user_profile", null)`) — not in `SecureStorage`. Contains userId, displayName, universityDomain, social links. See `updateProfile()` line: `prefs.edit().putString("user_profile", json).apply()`
  - **🔴 CRITICAL — Fire-and-forget profile update** — `updateProfileOnServer()` catches all exceptions silently (`catch (_: Exception) { // Fire-and-forget }`). User gets no feedback if server update fails
  - **🟡 HIGH — No auth state restoration on app restart** — `checkExistingSession()` only checks for profile JSON or access token, but never validates the token or calls `/auth/me`. A stale/expired token leads to silent 401s
  - **🟡 HIGH — `refreshProfileFromServer()` uses email from prefs** — queries `/auth/me?email=...` which is unauthenticated by design (public path starting with `/auth/`)
  - `onHomeReady()` connects WebSocket and resolves university — good lifecycle awareness
  - `logout()` properly clears both secure and regular storage

#### `Navigation.kt`
- **Purpose:** Root composable (`ColageApp`) + onboarding `NavHost`
- **State:** Auth state drives top-level screen selection; NavHost for onboarding flow
- **Issues:**
  - **🟠 MEDIUM — `AdService()` created with `remember`** in `ColageApp` instead of Hilt injection: `val adService = remember { AdService() }`. This bypasses DI
  - `AuthViewModel` is scoped to `OnboardingNavHost` composable via `hiltViewModel()` — correct scoping for onboarding, but means it's recreated on config changes if the host recomposes
  - Phone auth screens (PhoneEntry, PhoneOTP) are registered in NavHost but **never navigated to** from the normal flow. ServerType → PhotoUpload skips them

#### `HomeScreen.kt`
- **Purpose:** Main discovery screen with mode switching (Map/List/AR), overlays, floor picker
- **State:** Collects flows from `AppViewModel` and `NearbyStudentsViewModel`
- **Issues:**
  - **🟡 HIGH — No periodic refresh** — `LaunchedEffect(Unit)` fetches nearby students once with a 2-second delay. No timer or periodic re-fetch. WebSocket handles real-time updates, but initial fetch is one-shot
  - **🟠 MEDIUM — `nearbyVM.mapStudents()` called in composition** — called directly in `Text("${nearbyVM.mapStudents().size} nearby")` during composition. This recalculates the filtered list on every recomposition. Should use `derivedStateOf` or a collected flow
  - `LaunchedEffect(currentFloor)` syncs floor filter — good
  - Uses `AnimatedContent` for mode transitions — clean

### DI

#### `AppModule.kt`
- **Purpose:** Provides `SharedPreferences` as singleton
- **Quality:** Minimal. Only provides plain `SharedPreferences`
- **Issue:** Uses `getSharedPreferences("colage_prefs", MODE_PRIVATE)` — plain storage. `SecureStorage` is `@Singleton @Inject constructor` so it self-provides via Hilt, which is correct

### Design System

#### `ColageColors.kt`
- **Purpose:** Color constants + `CompositionLocal` for theme color/accent
- **Quality:** Clean dark theme palette. `LocalThemeColor` and `LocalThemeAccent` enable university theming

#### `ColageFonts.kt`
- **Purpose:** Typography definitions
- **Issues:**
  - **🟠 MEDIUM — Fixed `sp` sizes, no font scaling consideration** — All sizes are hardcoded `sp` (which does scale with system font size), but no `maxLines` or overflow handling at the typography level. Some UI may break with large font sizes
  - Uses `FontFamily.Default` everywhere — no custom fonts

#### `Components.kt`
- **Purpose:** Reusable UI components — button, text field, OTP field, avatar, onboarding progress, string extensions
- **Quality:** Well-built. `ColagePrimaryButton` handles loading/disabled states. `OTPCodeField` auto-completes. `AvatarView` handles photo/initials/fallback
- **Issues:**
  - **🟠 MEDIUM — OTP field has visible hidden TextField** — The hidden `BasicTextField` has styling (background, height) making it visible below the boxes. Should be truly hidden (`Modifier.size(0.dp)` or `alpha(0f)`)
  - `formattedDistance()` uses feet — inconsistent if backend sends meters. Needs verification

#### `Haptics.kt`
- **Purpose:** View-based haptic feedback helpers
- **Quality:** Good. Uses `HapticFeedbackConstants` with API-level checks for Android R+

#### `StateViews.kt`
- **Purpose:** Loading, Error, Empty, and StaleData state views
- **Quality:** Well-designed empty states. `ErrorStateView` has retry. `StaleDataBanner` is available but never used in the app

### Networking & Services

#### `ApiClient.kt`
- **Purpose:** HTTP client with auth token management and auto-refresh
- **Issues:**
  - **🔴 CRITICAL — Hardcoded API base URL** — `private val baseUrl = "https://wn7mxcdxca.execute-api.us-east-2.amazonaws.com/dev"` — hardcoded production/dev URL directly in source code
  - **🟡 HIGH — Token refresh race condition** — If multiple API calls fail with 401 simultaneously, each one independently tries to refresh the token. No mutex/lock. The refresh token could be used multiple times or invalidated
  - **🟡 HIGH — `/auth/me` is treated as public** — `publicPaths = listOf("/auth/", "/universities/")` means any path starting with `/auth/` (including `/auth/me`) won't send an auth token. The profile fetch endpoint is unauthenticated
  - **🟡 HIGH — Logging interceptor at BODY level in production** — `HttpLoggingInterceptor.Level.BODY` logs full request/response bodies including tokens, emails, profile data. Should be `NONE` in release
  - `request()` runs on `Dispatchers.IO` — correct
  - Uses OkHttp directly (not Retrofit) despite Retrofit being in dependencies — mild code smell
  - `execute()` (synchronous) used instead of `enqueue()` — fine since wrapped in `withContext(Dispatchers.IO)`

#### `WebSocketManager.kt`
- **Purpose:** WebSocket client with reconnection and ping keep-alive
- **Issues:**
  - **🟡 HIGH — WebSocket auth via query parameter** — `urlBuilder.append("&token=$it")` passes the access token as a URL query parameter. This is logged in server access logs, visible in network monitoring tools, and may be cached. Should use a subprotocol header or post-connect auth message
  - **🟡 HIGH — WebSocket distance always 0** — When a new student joins via WebSocket (`handleLocationUpdate` in `NearbyStudentsViewModel`), `distance` is hardcoded to `0.0`: `current.add(NearbyStudent(profile = profile, location = location, distance = 0.0))`. No client-side distance calculation
  - **🟠 MEDIUM — Handler-based ping on main thread** — Uses `android.os.Handler(Looper.getMainLooper())` for ping scheduling. Should use coroutines or a dedicated thread
  - **🟠 MEDIUM — No WebSocket close on app background** — WebSocket stays connected when app goes to background. Should disconnect (or reduce to keep-alive only) to save battery
  - Exponential backoff reconnection — good (max 5 retries, capped at 30s)
  - Callback-based (`onLocationUpdate`, `onStudentJoined`, `onStudentLeft`) — not flow-based, slightly less composable

#### `LocationService.kt`
- **Purpose:** GPS + barometer-based location tracking with movement-based broadcasting
- **Quality:** Excellent. Well-documented displacement-based updates (5m trigger, 3m broadcast minimum, 3s throttle, 30s heartbeat)
- **Issues:**
  - **🟡 HIGH — `serviceScope` leaks** — Uses `CoroutineScope(Dispatchers.Main + SupervisorJob())` which is never cancelled. `stopTracking()` cancels `heartbeatJob` but not `serviceScope`. Since `LocationService` is `@Singleton`, it lives for the app's lifetime, so this is a minor leak
  - **🟠 MEDIUM — No foreground service** — Location tracking runs without a foreground service. On Android 10+ (API 29), background location access requires either `ACCESS_BACKGROUND_LOCATION` permission or a foreground service. The app only requests `ACCESS_FINE_LOCATION`. Location updates will stop when the app is in the background
  - Floor detection via barometer is well-implemented (dead zone, multi-floor support)
  - `@SuppressLint("MissingPermission")` on `startTracking` — permission is checked in UI before calling

#### `SecureStorage.kt`
- **Purpose:** EncryptedSharedPreferences wrapper for tokens
- **Quality:** Good. Uses `AES256_GCM` for values, `AES256_SIV` for keys. Auto-generates device ID
- **Issue:** Only stores tokens (access, id, refresh, device_id). Profile data goes to plain `SharedPreferences` (see AppViewModel issue)

#### `UniversityService.kt`
- **Purpose:** University resolution, theming
- **Quality:** Clean. Falls back to mock data on API failure. Provides theme colors as `StateFlow`
- **Issue:** Mock data in production code — `mockUniversity()` is called as fallback even in release builds if API fails

### Auth & Onboarding

#### `AuthViewModel.kt`
- **Purpose:** Onboarding state machine — email OTP, phone OTP, profile creation, login, token management
- **State:** `MutableStateFlow` for loading, error, onboarding data, verification status
- **Issues:**
  - **🔴 CRITICAL — Fire-and-forget profile creation** — `createProfile()` calls `onResult(true)` immediately, then launches a coroutine to create the profile on the server. If the server call fails, the user proceeds with a local-only profile and a client-generated UUID as userId. The server-assigned userId may never be stored
  - **🟡 HIGH — Login doesn't restore profile from server** — `confirmLoginOTP()` calls `fetchAndStoreTokens()` but doesn't fetch the profile from the server. The user logs in but has no profile data (no name, no photo, no social links) until `refreshProfileFromServer()` runs later in `onHomeReady()`
  - **🟡 HIGH — Token fetch silently fails** — `fetchAndStoreTokens()` catches all exceptions: `catch (e: Exception) { // Silently fail token fetch }`. If login token exchange fails, the user appears authenticated but has no valid token
  - `extractDomain()` correctly parses `.edu` domains
  - `deleteAccount()` cleans up server then local — handles server failure gracefully
  - `switchServerType()` updates server then local — good

#### `OnboardingData.kt`
- **Purpose:** Data class holding onboarding form state + profile builder
- **Quality:** Clean. `buildProfile()` generates a local UUID for userId — this is the fire-and-forget issue source

#### Auth Screens

##### `WelcomeScreen.kt`
- **Quality:** Clean welcome screen with feature highlights. No accessibility issues beyond missing `contentDescription` on decorative icons

##### `EmailEntryScreen.kt`
- **Quality:** Good. Validates `.edu` email, shows extracted domain. Error messages displayed
- **Issue:** `onContinue()` callback called from within `sendEmailOTP` lambda — runs on main thread, correct

##### `EmailOTPScreen.kt`
- **Quality:** Good. Resend countdown, auto-verify on code completion. Shows error messages

##### `PhoneEntryScreen.kt` / `PhoneOTPScreen.kt`
- **🟡 HIGH — Dead code** — These screens exist and are registered in the NavHost but are **never navigated to**. The flow goes `EmailOTP → ServerType → PhotoUpload`, skipping phone verification entirely. The phone fields exist but are never used
- Country code is hardcoded to `+1` (US only)

##### `ServerTypeScreen.kt`
- **Quality:** Clean selection between Student and Alumni servers

##### `PhotoUploadScreen.kt`
- **Quality:** Good. Photo picker + camera support via `ActivityResultContracts`. Skip option available
- **Issue:** Camera URI uses `System.currentTimeMillis()` in `remember` — the URI is stable across recompositions (correct), but the timestamp is set at composition time

##### `ProfileInfoScreen.kt`
- **Quality:** Good. Name required, bio with character limit, major autocomplete from common list
- **Issue:** Bio character limit (160) enforced client-side only

##### `SocialLinksScreen.kt`
- **Quality:** Good. Expandable rows for 7 platforms. Skip option available
- **Issue:** No input validation on social handles (could contain invalid characters)

##### `PermissionsScreen.kt`
- **Quality:** Good. Sequential permission requests (location → camera → notifications). Uses Accompanist permissions
- **Issue:** Skip option bypasses location permission which is essential for the app

##### `UniversityWelcomeScreen.kt`
- **Quality:** Good animations (spring bounce). Shows alumni vs student variant
- **Issue:** Member count not shown (label says "Alumni/Students already here" but no count)

##### `LoginScreen.kt`
- **Quality:** Good two-step login (email → OTP). Back navigation between steps
- **Issue:** In dev mode, auto-confirms with "000000" — bypasses OTP step entirely. This is intentional for dev but the UX is abrupt

##### `SplashScreen.kt`
- **Quality:** Simple loading screen with logo and spinner. No timeout or error handling

### Discovery

#### `NearbyStudentsViewModel.kt`
- **Purpose:** Manages nearby student list, distance filtering, WebSocket listening
- **Issues:**
  - **🟡 HIGH — WebSocket distance always 0** — `handleLocationUpdate()` creates new students with `distance = 0.0`. No client-side distance calculation from current user position
  - **🟡 HIGH — No periodic refresh** — `fetchNearbyStudents()` is called once. No timer to re-fetch. Only WebSocket updates keep the list fresh
  - `mapStudents()`, `filteredStudents()`, `arFilteredStudents()` compute on every call — should be cached with `derivedStateOf`
  - `loadMockData()` generates realistic test data — good for development
  - `sliderToFeet()` uses exponential mapping (10–500 ft) — nice UX

#### `MiniProfileSheet.kt`
- **Purpose:** Bottom sheet showing student profile summary
- **Quality:** Good. Shows avatar, name, major, distance, floor, bio, social links
- **Issue:** Social link buttons open URLs via `Intent.ACTION_VIEW` — no fallback if app not installed

#### `FullProfileView.kt`
- **Purpose:** Full-screen profile view
- **Quality:** Good. Scrollable, all profile fields, social links
- **Issue:** Close button overlaps with status bar — `padding(16.dp)` may not account for system bars

### Map

#### `MapDiscoveryView.kt`
- **Purpose:** Mapbox map with student annotations, location puck, avatar markers
- **Issues:**
  - **🟡 HIGH — Mapbox attribution hidden** — `logo.enabled = false`, `attribution.enabled = false` — This violates Mapbox ToS. Attribution is shown in Settings screen ("Map Data © Mapbox, OpenStreetMap") but the in-map attribution is required
  - **🟠 MEDIUM — `createPointAnnotationManager()` called on every update** — In the `update` lambda of `AndroidView`, a new `PointAnnotationManager` is created on every recomposition/update. Should be created once and reused
  - **🟠 MEDIUM — Bitmap creation on every update** — `createAvatarBitmap()` is called for every student on every map update. The `avatarCache` only caches downloaded photos, not initials bitmaps
  - Smooth position lerping (70% toward target) matches iOS — good
  - Recenter button with GPS location — good
  - Student tap → bottom sheet — good

### List

#### `ListDiscoveryView.kt`
- **Purpose:** Grid list view with distance slider, floor chips, student cards
- **Quality:** Good. `LazyVerticalGrid` with stable keys. Distance slider with exponential mapping
- **Issue:** `EmptyStateView` used correctly for empty state

### AR

#### `ARDiscoveryView.kt`
- **Purpose:** Simulated AR view with floating student bubbles
- **Quality:** Placeholder implementation. No actual ARCore integration despite the dependency
- **Issue:** Random positions are stable per-student — good. "SIMULATOR" label shown — appropriate

### Ads

#### `AdService.kt`
- **Purpose:** Fetches and rotates ads from a separate backend
- **Issues:**
  - **🟡 HIGH — Hardcoded ad server URL** — `private val baseUrl = "https://main.dcinq8hq6li09.amplifyapp.com"` — different from main API URL, also hardcoded
  - **🟠 MEDIUM — Timer-based rotation with `CoroutineScope(Dispatchers.IO)`** — Creates a new `CoroutineScope` inside each `TimerTask.run()`. These scopes are never cancelled. Should use a single scope with `delay`
  - **🟠 MEDIUM — No `@Inject constructor`** — `AdService` has `@Inject constructor()` but is instantiated with `remember { AdService() }` in `Navigation.kt`, bypassing Hilt entirely
  - Ad rotation every 30 seconds — reasonable

#### `AdBannerView.kt`
- **Purpose:** Ad banner composable with detail sheet
- **Quality:** Good design with emoji watermark, deal card, distance
- **Issue:** "Get Directions" and "Save Screenshot" buttons are no-ops (`onClick = { /* Open maps */ }`)

### Profile

#### `OwnProfileScreen.kt`
- **Purpose:** View own profile with edit/settings navigation
- **Quality:** Good. Shows all profile info, visibility toggle, social links
- **Issues:**
  - **🟢 LOW — No contentDescription on decorative elements** — Most icons lack meaningful content descriptions

#### `EditProfileScreen.kt`
- **Purpose:** Edit profile form with photo picker
- **Quality:** Good. All fields editable. Photo picker integration
- **Issues:**
  - **🟠 MEDIUM — No input validation** — Name can be whitespace-only, bio limit is client-side only, social handles have no format validation
  - Save button triggers `updateProfileOnServer()` which is fire-and-forget (see AppViewModel issue)

#### `SettingsScreen.kt`
- **Purpose:** Settings with server info, privacy, appearance, about, danger zone
- **Quality:** Comprehensive. Logout/delete confirmations. Theme switching. Dev mode section
- **Issues:**
  - **🟠 MEDIUM — Hardcoded account info** — Email shows `"student@umich.edu"` and phone shows `"••••••1234"` — these are hardcoded strings, not actual user data
  - **🟠 MEDIUM — `authViewModel` is nullable** — `SettingsScreen` accepts `authViewModel: AuthViewModel? = null` and it's never passed in from `HomeScreen`. Delete account and alumni switch use fallback paths that only update locally
  - Mapbox attribution text in About section — partial compliance with ToS

---

## Cross-Cutting Concerns

### Architecture & Navigation
- **Good:** Clean Hilt DI with `@Singleton` services, `@HiltViewModel` ViewModels
- **Good:** StateFlow-based state management throughout
- **Issue:** Navigation is split — state-driven for auth states, NavHost for onboarding. This works but means the onboarding NavHost is recreated if auth state oscillates
- **Issue:** `AppViewModel` is too large — handles auth state, profile, discovery mode, visibility, floor, university theme, profile sync. Should be split

### State Management
- Consistent use of `MutableStateFlow` / `StateFlow` pattern
- `collectAsState()` used correctly in composables
- **Issue:** Some computed values (filtered student lists) are not cached — recalculated on every access

### Auth Flow End-to-End
1. Welcome → Email Entry → Email OTP → Server Type → Photo Upload → Profile Info → Social Links → Permissions → University Welcome → Home
2. Login → Email → OTP → Home
- **Issue:** Phone verification screens exist but are dead code
- **Issue:** Login flow doesn't fetch profile from server (fixed later in `onHomeReady`)
- **Issue:** Profile creation is fire-and-forget — user proceeds regardless of server success

### Backend Communication
- Same API endpoints as iOS (`/auth/email/verify`, `/auth/email/confirm`, `/auth/login`, `/users`, `/auth/me`, `/nearby`, `/universities`)
- Same WebSocket URL structure
- Ad service uses a different backend URL (Amplify)

### Offline Behavior
- **Poor.** No offline detection. No cached data. No retry UI. All failures are silently swallowed

### Security Posture
| Aspect | Status |
|--------|--------|
| Token storage | ✅ EncryptedSharedPreferences (AES-256) |
| Profile storage | ❌ Plain SharedPreferences |
| Certificate pinning | ❌ Not implemented |
| ProGuard/R8 | ❌ `isMinifyEnabled = false` in release |
| Cleartext traffic | ✅ `usesCleartextTraffic="false"` |
| API URLs | ❌ Hardcoded in source |
| Logging | ❌ Full body logging in all builds |
| Token in URL | ❌ WebSocket token as query param |

### Performance
- **Map:** Bitmap creation on every update is expensive. `createPointAnnotationManager()` recreated each update
- **Recomposition:** `nearbyVM.mapStudents()` called directly in composition triggers unnecessary work
- **Location:** Displacement-based updates are battery-efficient

### Dead Code
- `PhoneEntryScreen.kt` and `PhoneOTPScreen.kt` — never navigated to
- `FullProfileView.kt` — imported nowhere except its own package; never shown in the app
- Retrofit dependency — imported but never used (using raw OkHttp instead)
- `StaleDataBanner` — defined but never used

### Accessibility
- **No `contentDescription` on interactive elements** — "Toggle visibility", "Recenter", avatar buttons use generic or null descriptions
- **No TalkBack testing apparent** — clickable elements lack semantic descriptions
- **Fixed font sizes** — Using `sp` which scales, but no overflow handling for large font sizes
- **No `semantics` modifiers** — Compose accessibility semantics not used
- **Color contrast** — Dark theme with sufficient contrast ratios for most text

### Android-Specific
- **No `configChanges` handling** — Activity recreates on rotation (default). ViewModel state survives, but NavHost state resets
- **No back navigation handling** — System back button behavior is default. No `BackHandler` composables for custom navigation
- **No process death recovery** — `SavedStateHandle` not used. Full app state lost on process death
- **Single Activity** — correct modern pattern

---

## iOS Parity Check

| # | iOS Issue | Severity (iOS) | Android Status | Details |
|---|-----------|----------------|----------------|---------|
| 1 | Hardcoded API URLs | CRITICAL | **🔴 SAME BUG** | `ApiClient.kt` line: `private val baseUrl = "https://wn7mxcdxca.execute-api.us-east-2.amazonaws.com/dev"`. `AdService.kt` has a second hardcoded URL: `"https://main.dcinq8hq6li09.amplifyapp.com"`. `WebSocketManager.kt`: `"wss://w0m7jw00ak.execute-api.us-east-2.amazonaws.com/dev"`. All three are hardcoded in source. |
| 2 | Thread-unsafe global profile | CRITICAL | **🟡 PARTIALLY PRESENT** | Android uses `MutableStateFlow` for `_currentProfile` which is thread-safe for reads/writes. However, the profile is also read/written via `SharedPreferences` in `updateProfile()` without synchronization — `prefs.edit().putString("user_profile", json).apply()` can race with `loadProfileFromStorage()`. Less severe than iOS's global mutable state, but still a concern. |
| 3 | Unauthenticated `/auth/me` | CRITICAL | **🔴 SAME BUG** | `ApiClient.kt` line: `publicPaths = listOf("/auth/", "/universities/")`. The path `/auth/me` starts with `/auth/` so the auth token is never sent. `refreshProfileFromServer()` calls `getProfile(email)` which hits `/auth/me?email=...` unauthenticated. Anyone with an email address could query profiles. |
| 4 | Fire-and-forget profile creation | CRITICAL | **🔴 SAME BUG** | `AuthViewModel.kt` `createProfile()`: calls `onResult(true)` immediately, then launches coroutine to POST to `/users`. Exception caught silently: `catch (e: Exception) { // Fire-and-forget — silently fail }`. User proceeds to home screen with potentially no server-side profile. |
| 5 | Login doesn't restore profile | HIGH | **🟡 PARTIALLY FIXED** | `confirmLoginOTP()` fetches tokens but doesn't fetch profile from server. Profile is restored later in `AppViewModel.onHomeReady()` → `refreshProfileFromServer()`. The delay means the home screen initially shows stale/empty profile data. Better than iOS (which never fetched), but still a gap. |
| 6 | No WebSocket authentication | HIGH | **🟡 DIFFERENT BUT STILL BAD** | Android passes token as URL query parameter: `urlBuilder.append("&token=$it")`. This is better than no auth at all (iOS original), but query param tokens are logged in server access logs, browser history (N/A here), and proxy logs. Should use a header or post-connect auth message. |
| 7 | Dead phone auth screens | HIGH | **🔴 SAME BUG** | `PhoneEntryScreen.kt` and `PhoneOTPScreen.kt` exist and are registered in the NavHost (routes `"phone_entry"` and `"phone_otp"`) but are never navigated to. The flow goes `EmailOTP → ServerType → PhotoUpload`. ~200 lines of dead code. |
| 8 | Token refresh race condition | HIGH | **🔴 SAME BUG** | `ApiClient.kt` `request()`: on 401, synchronously attempts refresh with no mutex. If multiple concurrent requests fail, each independently calls `/auth/refresh`. The refresh token may be used multiple times or invalidated by the first refresh. |
| 9 | Mapbox attribution hidden | HIGH | **🔴 SAME BUG** | `MapDiscoveryView.kt`: `logo.enabled = false`, `attribution.enabled = false`, `scalebar.enabled = false`, `compass.enabled = false`. The Settings screen shows "Map Data © Mapbox, OpenStreetMap" but in-map attribution is required by Mapbox ToS. |
| 10 | No periodic nearby refresh | HIGH | **🔴 SAME BUG** | `HomeScreen.kt` `LaunchedEffect(Unit)`: `fetchNearbyStudents()` called once with a 2-second delay. No periodic re-fetch. WebSocket handles real-time updates, but if WebSocket disconnects, the list goes stale with no recovery. |
| 11 | WebSocket distance always 0 | HIGH | **🔴 SAME BUG** | `NearbyStudentsViewModel.kt` `handleLocationUpdate()`: new students from WebSocket are created with `distance = 0.0`. No client-side distance calculation using the user's current GPS position. Students joining via WebSocket show "nearby" (0 ft). |
| 12 | No font scaling / Dynamic Type | MEDIUM | **🟢 NOT AN ISSUE** | Android Compose uses `sp` for text sizes which automatically scales with system font size. However, some layouts may clip or overflow at very large font scales — no explicit testing apparent. |
| 13 | No accessibility labels | MEDIUM | **🟡 PARTIALLY PRESENT** | Most `contentDescription` params are either `null` or generic ("Avatar", "Close"). Interactive elements like the visibility toggle, floor picker, and discovery mode picker lack meaningful descriptions. `Icon` and `AsyncImage` components frequently use `contentDescription = null`. |
| 14 | Profile in unencrypted storage | MEDIUM | **🔴 SAME BUG** | `AppViewModel.kt` `updateProfile()`: `prefs.edit().putString("user_profile", json).apply()` — stores full profile JSON (userId, displayName, bio, major, socialLinks, universityDomain) in plain `SharedPreferences`. Tokens are in `EncryptedSharedPreferences` but profile is not. |
| 15 | No error feedback to users | MEDIUM | **🔴 SAME BUG** | Throughout the codebase, API failures are caught and silently ignored: `catch (_: Exception) {}`. Examples: `refreshProfileFromServer()`, `updateProfileOnServer()`, `createProfile()`, `handleMessage()`, `fetchAd()`, `resolveUniversity()`. Users see no error toasts, snackbars, or retry prompts. |

**Summary:** 9 of 15 iOS issues are **identically present** in Android. 3 are partially present/different. 1 is not applicable. 2 have the same root cause with different manifestation.

---

## Issue Tracker

### 🔴 CRITICAL

| ID | Issue | File | Line/Context |
|----|-------|------|-------------|
| C1 | Hardcoded API URLs | `ApiClient.kt`, `WebSocketManager.kt`, `AdService.kt` | `baseUrl = "https://..."` — 3 different hardcoded URLs |
| C2 | Unauthenticated `/auth/me` endpoint | `ApiClient.kt` | `publicPaths = listOf("/auth/", "/universities/")` — `/auth/me` treated as public |
| C3 | Fire-and-forget profile creation | `AuthViewModel.kt` | `createProfile()` — `onResult(true)` called before server responds |
| C4 | Profile stored in plain SharedPreferences | `AppViewModel.kt` | `prefs.edit().putString("user_profile", json).apply()` |

### 🟡 HIGH

| ID | Issue | File | Line/Context |
|----|-------|------|-------------|
| H1 | Token refresh race condition | `ApiClient.kt` | No mutex on 401 → refresh flow |
| H2 | WebSocket token in query parameter | `WebSocketManager.kt` | `urlBuilder.append("&token=$it")` |
| H3 | Dead phone auth screens | `PhoneEntryScreen.kt`, `PhoneOTPScreen.kt` | ~200 lines never navigated to |
| H4 | Mapbox attribution hidden | `MapDiscoveryView.kt` | `attribution.enabled = false` |
| H5 | No periodic nearby refresh | `HomeScreen.kt` | One-shot fetch in `LaunchedEffect(Unit)` |
| H6 | WebSocket distance always 0 | `NearbyStudentsViewModel.kt` | `distance = 0.0` for new students |
| H7 | Login doesn't restore profile immediately | `AuthViewModel.kt` | `confirmLoginOTP` doesn't fetch profile |
| H8 | Token fetch silently fails | `AuthViewModel.kt` | `fetchAndStoreTokens()` catch-all |
| H9 | Full body HTTP logging in all builds | `ApiClient.kt` | `Level.BODY` unconditionally |

### 🟠 MEDIUM

| ID | Issue | File | Line/Context |
|----|-------|------|-------------|
| M1 | No error feedback to users | Multiple files | All `catch (_: Exception) {}` blocks |
| M2 | Accessibility labels missing | Multiple files | `contentDescription = null` throughout |
| M3 | Settings shows hardcoded account info | `SettingsScreen.kt` | `"student@umich.edu"`, `"••••••1234"` |
| M4 | AdService bypasses Hilt DI | `Navigation.kt` | `remember { AdService() }` |
| M5 | No foreground service for location | `LocationService.kt` | Background location will be killed |
| M6 | PointAnnotationManager recreated on update | `MapDiscoveryView.kt` | `annotations.createPointAnnotationManager()` in update lambda |
| M7 | AuthViewModel nullable in SettingsScreen | `SettingsScreen.kt` | `authViewModel: AuthViewModel? = null` — delete/alumni broken |
| M8 | OTP hidden TextField visible | `Components.kt` | Styled `BasicTextField` visible below OTP boxes |

### 🟢 LOW

| ID | Issue | File | Line/Context |
|----|-------|------|-------------|
| L1 | ProGuard/R8 disabled in release | `build.gradle.kts` | `isMinifyEnabled = false` |
| L2 | No certificate pinning | `ApiClient.kt` | Plain OkHttpClient |
| L3 | Retrofit dependency unused | `build.gradle.kts` | `implementation(libs.retrofit)` but using raw OkHttp |
| L4 | StaleDataBanner never used | `StateViews.kt` | Defined but no callers |
| L5 | No process death recovery | Multiple | `SavedStateHandle` not used |

---

## Recommendations

### Immediate (Before Launch)

1. **Move API URLs to BuildConfig** — Define `API_BASE_URL`, `WS_URL`, `AD_API_URL` in `build.gradle.kts` per build type
2. **Fix `/auth/me` authentication** — Either rename the endpoint to not start with `/auth/` in the public paths list, or explicitly check for `/auth/me` as authenticated
3. **Await profile creation** — Make `createProfile()` suspend and await the server response before proceeding. Show error if it fails
4. **Move profile to EncryptedSharedPreferences** — Use `SecureStorage` for profile JSON
5. **Add token refresh mutex** — Use `Mutex` from `kotlinx.coroutines.sync` to prevent concurrent refresh attempts
6. **Restore Mapbox attribution** — At minimum, keep `attribution.enabled = true` (can be compact)
7. **Disable HTTP logging in release** — `if (BuildConfig.DEBUG) Level.BODY else Level.NONE`
8. **Remove or integrate phone auth screens** — Either wire them into the flow or delete them

### Short-Term (Post-Launch)

1. **Add periodic nearby refresh** — Timer-based re-fetch every 30-60 seconds as fallback
2. **Calculate WebSocket distances client-side** — Use `Location.distanceTo()` with current GPS position
3. **Add error UI** — Snackbar or Toast for API failures. Use `ErrorStateView` and `StaleDataBanner`
4. **Fix SettingsScreen** — Pass `AuthViewModel` from Hilt; show actual user email/phone
5. **Inject AdService via Hilt** — Remove manual `remember { AdService() }`
6. **Add foreground service for location** — Required for reliable background tracking on Android 10+
7. **Enable R8/ProGuard** — `isMinifyEnabled = true` with proper keep rules

### Long-Term

1. **Add certificate pinning** — Pin the API server certificates in OkHttp
2. **Migrate to Retrofit** — Already in dependencies; cleaner API definitions
3. **Add accessibility** — `contentDescription` on all interactive elements, test with TalkBack
4. **Add SavedStateHandle** — Survive process death in ViewModels
5. **Split AppViewModel** — Extract ProfileRepository, AuthRepository, DiscoveryRepository
6. **Add offline support** — Room database for caching profiles and nearby students
7. **Implement real AR** — Replace simulated AR with ARCore SceneView integration

---

*This audit covers every Kotlin source file in the Android app. The Android codebase is well-structured but shares the same fundamental issues as the pre-fix iOS version, particularly around security (hardcoded URLs, unauthenticated endpoints, unencrypted profile storage), reliability (fire-and-forget operations, silent failures), and completeness (dead code, missing features).*

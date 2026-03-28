# Colage iOS App — Comprehensive Code Audit

**Generated:** 2026-03-28
**Codebase:** ~40 Swift files, SwiftUI + Mapbox Maps + ARKit
**Target:** iOS 17.0+, Swift 5.9, XcodeGen
**Architecture:** Single-target app with feature-based folder structure

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture Overview](#architecture-overview)
3. [File-by-File Analysis](#file-by-file-analysis)
4. [Cross-Cutting Analysis](#cross-cutting-analysis)
5. [Issue Tracker](#issue-tracker)
6. [Recommendations](#recommendations)

---

## Executive Summary

Colage is a campus discovery app that lets university students see each other on a live map, browse a list view, or use AR to find nearby people. The app uses email-based .edu verification, WebSocket real-time location broadcasting, and Mapbox for mapping.

### What's Working Well
- **Clean design system** — `ColageColors`, `ColageFonts`, reusable components are well-organized and consistently applied
- **University theming** — Environment-based theming (`@Environment(\.themeColor)`) is elegant and pervasive
- **Onboarding flow** — NavigationStack-based, well-structured multi-step flow
- **WebSocket architecture** — Proper reconnection with exponential backoff, ping keepalive
- **Location intelligence** — Movement-based broadcasting with barometric floor detection is sophisticated
- **Token refresh** — Automatic 401 retry with refresh token is correctly implemented in APIClient

### Critical Concerns
- **Hardcoded API URLs** in production code (AWS endpoints, Amplify ad server)
- **Dev mode tied to DEBUG flag** — `devMode` is true for ALL debug builds, not a separate dev config
- **Phone auth screens are dead code** — Backend removed phone verification but screens remain
- **No certificate pinning** — All network calls use default URLSession
- **UserProfile.current is a mutable static** — Global mutable state, not thread-safe
- **Ad service uses a completely different backend** than the main API

---

## Architecture Overview

### Navigation Flow
```
ColageApp (@main)
  └─ RootView
       ├─ LaunchScreen (.loading)
       ├─ OnboardingFlow (.onboarding)
       │    ├─ WelcomeScreen
       │    ├─ EmailEntryScreen
       │    ├─ EmailOTPScreen
       │    ├─ ServerTypeScreen (student/alumni)
       │    ├─ PhotoUploadScreen
       │    ├─ ProfileInfoScreen
       │    ├─ SocialLinksScreen
       │    ├─ PermissionsScreen
       │    └─ UniversityWelcomeScreen
       └─ HomeView (.authenticated)
            ├─ MapDiscoveryView (Mapbox)
            ├─ ListDiscoveryView (grid)
            ├─ ARDiscoveryView (ARKit/simulator)
            ├─ OwnProfileView (sheet)
            │    ├─ EditProfileView
            │    └─ SettingsView
            ├─ MiniProfileSheet (tapped student)
            └─ AdBannerView (bottom)
```

### State Management Pattern
- **App-level:** `AppState`, `AuthService`, `LocationService`, `UniversityService` as `@StateObject` in `ColageApp`, injected via `.environmentObject()`
- **Singletons:** `APIClient.shared`, `WebSocketManager.shared`, `NotificationService.shared`, `MapThemeManager.shared`, `AdService.shared`
- **View-local:** `@State` for UI-only state, `@StateObject` for view-owned view models (`NearbyStudentsViewModel`, `OnboardingData`)
- **Global mutable:** `UserProfile.current` (static var on struct)

### Backend Communication
| Layer | URL | Protocol |
|-------|-----|----------|
| Main API | `https://wn7mxcdxca.execute-api.us-east-2.amazonaws.com/dev` | REST (APIClient) |
| WebSocket | `wss://w0m7jw00ak.execute-api.us-east-2.amazonaws.com/dev` | WebSocket |
| Ad Server | `https://main.dcinq8hq6li09.amplifyapp.com` | REST (direct URLSession) |
| Photo Upload | S3 via presigned URLs | PUT to S3 |

---

## File-by-File Analysis

### App Core

#### `ColageApp.swift`
**Purpose:** App entry point. Creates and injects 4 `@StateObject` environment objects.

- State: `@StateObject` for `AppState`, `AuthService`, `LocationService`, `UniversityService`
- Injects `themeColor` and `themeAccent` custom environment values from `UniversityService`
- Forces `.preferredColorScheme(.dark)` — dark mode only

**Issues:**
- ⚠️ **MEDIUM** — No `AppDelegate` adapter for push notification token registration. `NotificationService.registerDeviceToken()` is never called.
- ⚠️ **LOW** — No `scenePhase` handling for background/foreground transitions (WebSocket disconnect/reconnect, location tracking pause)

#### `AppState.swift`
**Purpose:** Central navigation state. Controls auth state, discovery mode, visibility, floor.

- `AuthState` enum: `.loading` → `.onboarding` → `.authenticated`
- `checkExistingSession()`: Checks UserDefaults + Keychain for stored profile/tokens
- `refreshProfileFromServer()`: Fetches latest profile from `/auth/me?email=` on launch

**Issues:**
- 🔴 **CRITICAL** — `refreshProfileFromServer()` sends user email as a query parameter to `/auth/me?email=`. This endpoint appears unauthenticated (it falls through the `publicPaths` check since it starts with `/auth/`). **Anyone could fetch any user's profile by email.**
- ⚠️ **HIGH** — `AuthState` doesn't conform to `Equatable` but is used with `.animation(.easeInOut, value: appState.authState)` in RootView. This compiles because SwiftUI's animation modifier uses `Equatable` protocol, but `AuthState` likely falls back to identity comparison. Should add `Equatable` conformance.
- ⚠️ **MEDIUM** — Profile stored in UserDefaults under key `"dev_profile"` — the "dev_" prefix is misleading since this is used in production too.
- ⚠️ **LOW** — `var isVisible` and `var currentFloor` are not persisted — they reset to defaults on relaunch.

#### `RootView.swift`
**Purpose:** Root view switch between launch screen, onboarding, and home.

- Clean conditional rendering based on `appState.authState`
- `LaunchScreen` has pulsing animation — nice touch
- Calls `appState.checkExistingSession()` on appear

**Issues:**
- ⚠️ **LOW** — LaunchScreen pulse animation runs forever even after transitioning away (view isn't removed, just hidden by Group switch)

---

### Design System

#### `ColageColors.swift`
**Purpose:** Color system + theme environment keys.

- Well-organized: base, brand, text, status, university defaults
- Custom `EnvironmentKey` for `themeColor` and `themeAccent` — excellent pattern
- `Color(hex:)` extension handles 6-digit and 8-digit hex

**Quality:** ✅ Excellent. Consistent, well-documented, properly extensible.

#### `ColageFonts.swift`
**Purpose:** Typography scale using SF Pro system fonts.

- Fixed-size fonts throughout (no `Font.TextStyle` or Dynamic Type)
- Uses `.rounded` design for display fonts

**Issues:**
- ⚠️ **MEDIUM** — **No Dynamic Type support.** All fonts use fixed `size:` values. Users who need larger text (accessibility settings) won't see any change. Should use `Font.system(.body)` or apply `.dynamicTypeSize()` modifiers.

#### `Components.swift`
**Purpose:** Reusable UI components — buttons, text fields, OTP input, avatars, pickers, progress indicator.

- `ColagePrimaryButton`: Haptic feedback on tap, loading/disabled states
- `OTPCodeField`: Visual digit boxes + hidden TextField for input. Auto-completes on length match.
- `AvatarView`: AsyncImage with placeholder initials
- `DiscoveryModePicker`: Segmented control with spring animation + haptic
- Extensions: `Double.formattedDistance`, `String.initials`

**Issues:**
- ⚠️ **MEDIUM** — `OTPCodeField` has both visual digit boxes AND a visible TextField below them. The TextField is styled and visible to the user — this is confusing UX. Typically the TextField would be invisible (opacity 0) and focused programmatically.
- ⚠️ **LOW** — `AvatarView` uses `AsyncImage` without caching — every recompose re-downloads. For a list of students this could be expensive.
- ⚠️ **LOW** — `UIImpactFeedbackGenerator` is created inline on every tap. Should be prepared in advance for better performance.

#### `MapboxConfig.swift`
**Purpose:** Loads Mapbox access token from Info.plist.

- Simple, correct implementation
- Token comes from `Secrets.xcconfig` → Info.plist

**Quality:** ✅ Good. Token not hardcoded in source.

#### `StateViews.swift`
**Purpose:** Loading, error, empty, and stale-data states.

- `LoadingStateView`, `ErrorStateView` (with retry), `EmptyStateView`, `StaleDataBanner`
- `Date.timeAgoDisplay` extension

**Quality:** ✅ Good. Consistent pattern for state handling. `StaleDataBanner` exists but doesn't appear to be used anywhere yet.

---

### Networking & Services

#### `APIClient.swift`
**Purpose:** Singleton REST client. Handles all API requests, token attachment, 401 auto-refresh.

- Base URL hardcoded: `https://wn7mxcdxca.execute-api.us-east-2.amazonaws.com/dev`
- Generic `request<T: Decodable>()` method
- Public paths skip auth: `/auth/`, `/universities/`
- Auto-refresh: On 401, attempts token refresh with stored `refresh_token`, retries original request
- Device ID: Generated UUID stored in Keychain
- `requestVoid()` for fire-and-forget
- `EmptyResponse` accepts any JSON

**Issues:**
- 🔴 **CRITICAL** — **Hardcoded production API URL.** The `/dev` stage suffix and the full AWS API Gateway URL are baked into the binary. Should use build configuration or Info.plist.
- 🔴 **CRITICAL** — **No certificate pinning.** All requests go through `URLSession.shared` with default SSL validation. MITM attacks on campus WiFi could intercept tokens.
- ⚠️ **HIGH** — **Public path check is prefix-based.** `publicPaths.contains(where: { path.hasPrefix($0) })` means ANY path starting with `/auth/` skips auth — including `/auth/me` which returns profile data. This is a design flaw.
- ⚠️ **HIGH** — **Token refresh race condition.** If multiple requests hit 401 simultaneously, each will attempt its own token refresh. No mutex/lock. Could result in refresh token being used multiple times (may fail on server).
- ⚠️ **MEDIUM** — No request timeout configuration. Uses URLSession defaults (60s).
- ⚠️ **MEDIUM** — No retry logic for transient network errors (only retries on 401).
- ⚠️ **LOW** — `device_mismatch` check parses the response body string. Fragile — should use structured error responses.

#### `NotificationService.swift`
**Purpose:** Push notification permission + local notification helpers.

- `requestPermission()`: Requests authorization, registers for remote notifications
- `registerDeviceToken()`: Converts token to hex string, prints it... and does nothing. `// TODO: POST token to backend`
- `notifyStudentNearby()`: Schedules local notification

**Issues:**
- ⚠️ **HIGH** — **Push notifications are non-functional.** `registerDeviceToken()` is never called (no AppDelegate), and even if it were, the TODO is unimplemented. The `requestPermission()` flow in onboarding gives users a false expectation.
- ⚠️ **LOW** — `scheduleLocalNotification` doesn't check authorization status before scheduling.

#### `WebSocketManager.swift`
**Purpose:** Real-time location updates via WebSocket with auto-reconnection.

- Singleton with callbacks: `onLocationUpdate`, `onStudentJoined`, `onStudentLeft`
- Exponential backoff reconnection (1s → 2s → 4s → ... → 30s cap, max 10 attempts)
- 30s ping keepalive timer
- Handles message types: `location.update`, `location.batch`, `student.joined`, `student.left`
- In dev mode, sets `isConnected = true` immediately without actually connecting

**Issues:**
- ⚠️ **HIGH** — **WebSocket URL is hardcoded** with full AWS API Gateway URL including `/dev` stage.
- ⚠️ **MEDIUM** — **Ping timer and reconnect timer use `Timer.scheduledTimer` on unknown thread.** These should be on the main RunLoop explicitly or use `DispatchSourceTimer`.
- ⚠️ **MEDIUM** — `performConnect()` sets `isConnected = true` immediately after `resume()`, before the connection is actually established. Should use `URLSessionWebSocketDelegate` to detect open/close events.
- ⚠️ **MEDIUM** — No authentication on WebSocket connection. The URL includes `userId` but no token. Anyone could connect and impersonate any user.
- ⚠️ **LOW** — `@Published var isConnected` is updated from background threads via `DispatchQueue.main.async` — correct, but the initial set in `performConnect()` is also on main, creating a brief moment where UI shows "connected" before it actually is.

#### `LocationService.swift`
**Purpose:** GPS tracking + barometric floor detection + broadcast throttling.

- Movement-based broadcasting: `distanceFilter = 5m`, broadcast only if moved ≥3m AND ≥3s since last
- Barometric altimeter for floor detection with dead-zone filtering (±1.5m)
- Heartbeat broadcast every 30s for keep-alive
- Manual floor override + recalibration
- `activityType = .fitness` for pedestrian optimization

**Issues:**
- ⚠️ **MEDIUM** — `allowsBackgroundLocationUpdates = false` but `showsBackgroundLocationIndicator = true`. These are contradictory — the indicator is meaningless without background updates enabled. The app's Info.plist requests "always" permission but never uses it.
- ⚠️ **MEDIUM** — `heartbeatBroadcast()` always sends, even if the user hasn't moved at all. Over 30 minutes that's 60 unnecessary broadcasts for a stationary user.
- ⚠️ **LOW** — `groundAltitude` is captured from relative altimeter on first reading. If the user starts the app on a non-ground floor, all floor calculations will be wrong until manual recalibration.
- ⚠️ **LOW** — No handling of location authorization denial/restriction after initial check.

#### `KeychainWrapper.swift`
**Purpose:** Simple Keychain CRUD for token storage.

- Uses `kSecAttrAccessibleAfterFirstUnlock` — tokens accessible after first device unlock
- `clearAll()` deletes all items for the service
- Simple, correct implementation

**Issues:**
- ⚠️ **LOW** — `set()` ignores the return value of `SecItemAdd`. If the add fails silently, the app won't know.
- ⚠️ **LOW** — No error reporting. All operations silently succeed or fail.

---

### University

#### `Models.swift`
**Purpose:** Core data models — University, Theme, UserProfile, SocialLink, StudentLocation, NearbyStudent.

- `UserProfile` has a `static var current: UserProfile?` — global mutable state
- `SocialLink.url` computed property constructs URLs for each platform
- `NearbyStudent.mock()` generates test data with realistic names/majors
- `StudentLocation` includes optional profile snapshot fields (`displayName`, `profilePhotoURL`, `major`)

**Issues:**
- 🔴 **CRITICAL** — **`UserProfile.current` is a global mutable static on a struct.** It's read/written from multiple threads (main thread UI + background async tasks) with no synchronization. This is a data race.
- ⚠️ **MEDIUM** — `SocialLink` uses `platform.rawValue` as `id`, meaning you can only have one link per platform. The model has `custom1`/`custom2`/`custom3` as separate platforms to work around this, but it's awkward.
- ⚠️ **LOW** — `NearbyStudent` is a struct but `location` is a `var` — mutation requires the parent collection to be mutable. This works but could be cleaner as a class or with an ID-based update pattern.

#### `UniversityService.swift`
**Purpose:** Resolves university from domain, manages themes.

- Fetches from `/universities/{domain}` API
- Falls back to mock data on error (even in production!)
- Mock data for umich, harvard, stanford

**Issues:**
- ⚠️ **HIGH** — **Falls back to mock data on API failure in production.** If the API is down, users get fake university data with fake member counts. Should show an error instead.
- ⚠️ **MEDIUM** — `setUniversity()` always picks the first theme. No persistence of theme preference.
- ⚠️ **LOW** — Mock data hardcodes member counts that will never be accurate.

#### `MapThemeManager.swift`
**Purpose:** Mapbox style customization per university.

- Defines `MapThemeConfig` with colors for roads, water, buildings, labels
- Themes for umich, harvard, stanford
- `styleURI()` always returns `.dark` — custom styles are TODO

**Issues:**
- ⚠️ **LOW** — `MapThemeConfig` is defined but never actually applied to the map. The config exists but `styleURI()` ignores it and returns `.dark`. The colors in `MapThemeConfig` are unused.

---

### Auth & Onboarding

#### `AuthService.swift`
**Purpose:** Full auth lifecycle — email OTP, phone OTP, profile CRUD, token management, account deletion.

- `extractDomain()`: Collapses subdomains (e.g., `engineering.umich.edu` → `umich.edu`)
- `sendEmailOTP()` / `confirmEmailOTP()`: Email verification via `/auth/email/verify` and `/auth/email/confirm`
- `sendPhoneOTP()` / `confirmPhoneOTP()`: Phone verification via `/auth/phone/verify` and `/auth/phone/confirm`
- `createProfile()`: Creates user on server, uploads photo via presigned S3 URL, updates local
- `updateProfile()`: Full profile update with optional photo re-upload
- `fetchAndStoreTokens()`: POST to `/auth/login` with email + deviceId, stores tokens in Keychain
- `refreshTokensIfNeeded()`: Checks expiry, refreshes if within 60s of expiration
- `switchServerType()`: PUT to change student↔alumni
- `deleteAccount()`: DELETE user, clears local data (logs out even if server delete fails)
- `logout()`: Clears Keychain, UserDefaults, resets state

**Issues:**
- 🔴 **CRITICAL** — **`createProfile()` is not async and fires a `Task {}` internally.** The caller has no way to know when server-side profile creation completes or fails. The onboarding flow proceeds to "authenticated" immediately after local profile creation, before the server even responds. If profile creation fails server-side, the user has a local profile but no server record.
- ⚠️ **HIGH** — **Race condition in onboarding completion.** `OnboardingFlow.onEnter` calls `authService.createProfile()` (fire-and-forget Task) then immediately calls `authService.fetchAndStoreTokens()`. But `fetchAndStoreTokens()` calls `/auth/login` which may fail if the profile hasn't been created server-side yet (the previous Task hasn't completed).
- ⚠️ **HIGH** — **`enteredEmail` is an in-memory `var`, not `@Published`.** If the app is backgrounded and the process is killed during onboarding, `enteredEmail` is lost. `fetchAndStoreTokens()` has a fallback to `UserDefaults.string(forKey: "user_email")` to mitigate this, but it's fragile.
- ⚠️ **MEDIUM** — `confirmEmailOTP()` response includes `universityDomain` but it's ignored. The domain is later re-extracted from the email client-side.
- ⚠️ **MEDIUM** — Phone auth methods (`sendPhoneOTP`, `confirmPhoneOTP`) still exist and are fully implemented but the backend has removed phone verification. Dead code.
- ⚠️ **LOW** — `selectedServerType` is a `var` on the service class — could be overwritten between onboarding steps.

#### `OnboardingData.swift`
**Purpose:** Shared data container for onboarding flow.

- `@Published` properties for each onboarding field
- `buildProfile()` helper (not currently used — profile is built in `OnboardingFlow` instead)

**Issues:**
- ⚠️ **LOW** — `buildProfile()` is never called. Profile construction is duplicated in `OnboardingFlow.onEnter`.

#### `OnboardingFlow.swift`
**Purpose:** NavigationStack-based multi-step onboarding.

- 10-step enum (`OnboardingStep`), but `.phone` and `.phoneOTP` render `EmptyView()`
- Login available as sheet from welcome screen
- Profile creation + token fetch on final step

**Issues:**
- ⚠️ **MEDIUM** — **Dead enum cases.** `.phone` and `.phoneOTP` cases exist in `OnboardingStep` but render `EmptyView()`. Should be removed.
- ⚠️ **MEDIUM** — Progress indicators show "step X of 10" but only 8 steps are functional. The progress bar is misleading.
- ⚠️ **LOW** — `OnboardingData` is `@StateObject` in the flow but never passed to `LoginScreen`. If a user starts signup, goes back, then logs in, the data container is orphaned.

#### Auth Screens

##### `WelcomeScreen.swift`
Clean welcome page with feature rows, "Get Started" and "Log In" CTAs. No issues.

##### `EmailEntryScreen.swift`
- Validates `.edu` suffix client-side
- Shows extracted domain as confirmation
- Resolves university on submit (sets theme before OTP)
- **No issues.**

##### `EmailOTPScreen.swift`
- 6-digit OTP with auto-submit on completion
- 60s resend countdown timer
- **Issue:** ⚠️ **MEDIUM** — `startCountdown()` creates a `Timer.scheduledTimer` that captures `self` implicitly. If the view is dismissed during countdown, the timer keeps firing. Not a retain cycle (struct view), but the timer closure references `@State` vars that may be invalid.

##### `PhoneEntryScreen.swift` / `PhoneOTPScreen.swift`
- 🔴 **HIGH** — **Dead code.** These screens are fully implemented but never navigated to. The onboarding flow maps `.phone` and `.phoneOTP` to `EmptyView()`. The backend has removed phone verification. These files should be deleted.

##### `ProfileInfoScreen.swift`
- Name (required), bio (160 char limit), major (with autocomplete suggestions)
- Hardcoded list of 24 common majors for suggestions
- **No significant issues.** Clean implementation.

##### `PhotoUploadScreen.swift`
- PhotosPicker + camera capture
- "Skip for now" option
- **No issues.**

##### `SocialLinksScreen.swift`
- Expandable accordion for 7 platforms
- "Skip for now" option
- **No issues.** Nice interaction pattern.

##### `PermissionsScreen.swift`
- Sequential permission requests: location → camera → notifications
- In dev mode, simulates grants
- **Issue:** ⚠️ **MEDIUM** — Location permission check only updates `locationGranted` in dev mode. On real devices, the grant state is never updated because `CLLocationManagerDelegate` changes happen asynchronously but the view doesn't observe `locationService.authorizationStatus`.

##### `ServerTypeScreen.swift`
- Student vs Alumni selection
- Clean card-based UI with selection state
- **No issues.**

##### `UniversityWelcomeScreen.swift`
- Dynamic content based on student/alumni selection
- Shows member count from resolved university
- **No issues.** Well-themed.

##### `LoginScreen.swift`
- Email → OTP two-step login in a sheet
- Reuses same email OTP endpoints as signup
- On success: resolves university, fetches tokens, sets authenticated
- **Issue:** ⚠️ **MEDIUM** — After login, `UserProfile.current` is not restored. The user logs in successfully but their profile data isn't fetched — only tokens are stored. The profile is loaded on next app launch via `checkExistingSession()`, but the current session will have `UserProfile.current == nil` until then.

---

### Discovery Features

#### `HomeView.swift` + `NearbyStudentsViewModel`
**Purpose:** Main authenticated screen. Hosts map/list/AR modes + overlay controls.

- `NearbyStudentsViewModel`: Fetches from `/nearby` API, receives WebSocket updates, filters by floor/distance
- Logarithmic distance slider (10ft → 500ft)
- WebSocket listeners for real-time updates
- Floor picker synced to view model filter

**Issues:**
- ⚠️ **HIGH** — **No periodic refresh of nearby students.** Initial fetch happens 2s after appear, then only WebSocket updates. If WebSocket disconnects and reconnects, there's no re-fetch of the full student list.
- ⚠️ **MEDIUM** — `NearbyStudentsViewModel` is `@StateObject` in `HomeView` — it's recreated if `HomeView` is recreated (e.g., theme change that rebuilds the environment). All WebSocket listeners would be re-registered.
- ⚠️ **MEDIUM** — `distance` on `NearbyStudent` from WebSocket updates is always `0` because the WebSocket handler sets `distance: 0`. Only the initial API fetch provides real distances.
- ⚠️ **LOW** — `DispatchQueue.main.asyncAfter(deadline: .now() + 2.0)` for initial fetch is a fragile timing hack. Should use a location update callback instead.

#### `MapDiscoveryView.swift`
**Purpose:** Mapbox-powered map with student markers, puck, and recenter.

- `MapboxMapView` (UIViewRepresentable) wraps Mapbox `MapView`
- Student markers: Circular avatars with initials placeholder, async photo download
- Position interpolation (70% lerp) for smooth marker movement
- Tap handling via `AnnotationInteractionDelegate`
- Puck color changes based on visibility toggle
- Hides all Mapbox ornaments (logo, attribution, compass, scale bar)

**Issues:**
- ⚠️ **HIGH** — **Mapbox attribution hidden.** The code explicitly hides logo and attribution button by setting margins to -1000. This violates Mapbox ToS which requires visible attribution. The Settings screen mentions "Map Data © Mapbox, OpenStreetMap" but ToS typically requires in-map attribution.
- ⚠️ **MEDIUM** — **Avatar image cache is in the Coordinator** which is recreated on view updates. The `imageCache` dictionary persists for the life of the Coordinator but `pendingDownloads` tracking could lose state if the coordinator is recreated.
- ⚠️ **MEDIUM** — `updateUIView` is called on every SwiftUI state change and rebuilds ALL annotations every time. For 20+ students, this creates, positions, and registers annotations on every frame that triggers a state change.
- ⚠️ **LOW** — `downloadAvatar` uses `URLSession.shared.dataTask` (completion handler) mixed with the rest of the codebase using async/await. Inconsistent but functional.
- ⚠️ **LOW** — Position lerp (70%) means markers never fully reach their target position until the next update. Acceptable for smooth movement but could accumulate drift.

#### `ListDiscoveryView.swift`
**Purpose:** 2-column grid of nearby students sorted by distance.

- Distance slider with logarithmic scale
- Floor filter chips (All Floors / Current Floor)
- `StudentCard` with avatar, name, major, distance, floor
- Empty state when no students match filters

**Quality:** ✅ Clean implementation, good UX. No significant issues.

#### `ARDiscoveryView.swift`
**Purpose:** AR camera view with floating student bubbles.

- **Simulator:** `SimulatedARView` with floating bubbles on a dark grid background
- **Device:** `LiveARView` using RealityKit — places colored spheres at randomized positions

**Issues:**
- ⚠️ **HIGH** — **AR mode is basically non-functional on device.** `LiveARView.updateStudentEntities()` is empty — student positions never update after initial placement. The spheres are placed at random positions unrelated to actual student locations. AR is essentially a demo/prototype.
- ⚠️ **MEDIUM** — Simulator AR bubbles use random positions that don't correlate to real student locations. This is fine for preview but could mislead testers.
- ⚠️ **LOW** — `ARWorldTrackingConfiguration` with no plane detection — correct for this use case, but geo-anchoring would require `ARGeoTrackingConfiguration` for real AR discovery.

---

### Ads

#### `AdModels.swift`
**Purpose:** Ad data model.

- CodingKeys maps `emoji` → `logoEmoji`
- `displayEmoji` and `displayDistance` fallbacks

**Quality:** ✅ Clean, simple model.

#### `AdBannerView.swift` + `AdDetailSheet`
**Purpose:** Bottom banner showing rotating local business ads.

- Tappable banner opens detail sheet
- Detail sheet with deal info, directions button, screenshot button
- Tracks tap events

**Issues:**
- ⚠️ **MEDIUM** — "Get Directions" button has no implementation (empty action closure)
- ⚠️ **MEDIUM** — "Save Screenshot" button just prints a log message
- ⚠️ **LOW** — `hasFetched` guard prevents re-fetch on reappear but also prevents refresh if the first fetch failed

#### `AdService.swift`
**Purpose:** Fetches and rotates ads from a separate Amplify-hosted backend.

- Different base URL than main API: `https://main.dcinq8hq6li09.amplifyapp.com`
- 30s rotation timer
- Distance calculation from user location to ad lat/lng
- Impression tracking via POST

**Issues:**
- ⚠️ **HIGH** — **Separate backend with no auth.** Ad requests go to a completely different server (Amplify) with no authentication. The student_id is passed as a query parameter.
- ⚠️ **MEDIUM** — **Double fetch on error.** In the `catch` block, it makes ANOTHER request to log the raw response. This is debug code left in production.
- ⚠️ **MEDIUM** — `AdService.shared` is `@ObservedObject` in `AdBannerView` — should be `@StateObject` or the shared instance should be injected via environment. `@ObservedObject` doesn't own the lifecycle.
- ⚠️ **LOW** — Rotation timer is not invalidated if the view is backgrounded. Ads keep fetching even when the app isn't visible.

---

### Profile

#### `OwnProfileView.swift`
**Purpose:** User's own profile display.

- Avatar, name, major, visibility status, university
- Edit and Settings buttons
- Bio section, social links list, visibility toggle

**Quality:** ✅ Well-structured. Good use of section headers.

#### `EditProfileView.swift`
**Purpose:** Edit profile form.

- Photo change (library + camera)
- Name, bio (160 char), major, social links
- Async save with loading state
- Dismisses on save

**Issues:**
- ⚠️ **MEDIUM** — `init()` reads from `UserProfile.current` to populate fields. If `UserProfile.current` is nil (edge case), all fields start empty with no indication that profile data is missing.
- ⚠️ **LOW** — Bio character limit (160) is enforced in `ProfileInfoScreen` during onboarding but not in `EditProfileView`. Users could paste longer text.

#### `SettingsView.swift`
**Purpose:** App settings — account info, server switch, privacy, themes, danger zone.

- Shows email, masked phone number
- Server type display + alumni switch option
- Theme picker from university themes
- Logout + delete account with confirmation alerts
- Dev mode section with "Reset Onboarding"

**Issues:**
- ⚠️ **MEDIUM** — Phone number display shows `authService.enteredPhone` which is empty string after app relaunch (it's in-memory only). Will show "••••••" with no actual digits.
- ⚠️ **LOW** — Privacy policy and ToS links point to `colage.app` domain — should verify these pages exist.
- ⚠️ **LOW** — `isSwitchingServer` and `isDeletingAccount` loading states are tracked but not displayed in the UI.

#### `CameraCapture.swift`
**Purpose:** Camera capture + circular crop overlay.

- `CameraCaptureView`: UIImagePickerController wrapper (front camera default)
- `CircularCropView`: Custom crop UI with drag/pinch gestures
- `CircleCutoutOverlay`: Visual overlay

**Issues:**
- ⚠️ **MEDIUM** — `CircularCropView` is defined but **never used**. The `CameraCaptureView` uses `UIImagePickerController.allowsEditing = true` which provides its own crop UI. The custom crop view is dead code.
- ⚠️ **LOW** — "Use Photo" button in `CircularCropView` has `// TODO: Actually crop to circle` — it just passes the full uncropped image.

---

### Shared / Discovery

#### `FullProfileView.swift`
**Purpose:** Full-screen expanded profile view for another student.

- Avatar, name, university badge, distance, major, bio, social links with deep links
- Opens platform URLs via `UIApplication.shared.open(url)`

**Issues:**
- ⚠️ **LOW** — This view doesn't appear to be navigated to from anywhere in the current code. `MiniProfileSheet` is used for tapped students, and it has its own expanded content. `FullProfileView` may be dead code or planned for future use.

#### `MiniProfileSheet.swift`
**Purpose:** Bottom sheet for tapped students — mini (35%) and expanded (full) states.

- Mini: Avatar, name, major, distance, floor
- Full: Bio + social links
- Uses `.presentationDetents([.fraction(0.35), .large])`
- `SocialLinkButton` opens platform URLs

**Quality:** ✅ Clean implementation. Good use of presentation detents.

---

## Cross-Cutting Analysis

### 1. App Architecture & Navigation

**Pattern:** Environment-injected ObservableObjects + NavigationStack
**Verdict:** Mostly good for an app this size. The main concern is scalability — as features grow, 4 environment objects in every view hierarchy becomes unwieldy.

**Strengths:**
- Clean separation between app core, features, and shared components
- Feature folders are well-organized
- NavigationStack with typed paths is modern and correct

**Weaknesses:**
- No formal dependency injection — everything is singleton or environment
- No coordinator/router pattern — navigation is embedded in views
- `UserProfile.current` static var breaks the otherwise clean dependency flow

### 2. State Management

| Pattern | Usage | Assessment |
|---------|-------|------------|
| `@EnvironmentObject` | AppState, AuthService, LocationService, UniversityService | ✅ Correct |
| `@StateObject` | NearbyStudentsViewModel, OnboardingData | ✅ Correct |
| Singleton `.shared` | APIClient, WebSocketManager, NotificationService, AdService, MapThemeManager | ⚠️ Testability concern |
| Static `var current` | UserProfile | 🔴 Thread-unsafe global state |
| UserDefaults | Profile persistence, email, onboarding flag, token expiry | ⚠️ Sensitive data in UserDefaults |

### 3. Auth Flow End-to-End

```
Signup:
  Email → OTP verify → Server type → Photo → Profile info → Social links → Permissions → Welcome
  └─ createProfile() fires async Task (server create + photo upload)
  └─ fetchAndStoreTokens() runs concurrently (race condition with profile creation)
  └─ appState.authState = .authenticated

Login:
  Email → OTP verify → fetchAndStoreTokens() → authenticated
  └─ Profile NOT restored (UserProfile.current remains nil until next launch)

Session restore:
  checkExistingSession() → loads profile from UserDefaults + checks Keychain token
  └─ refreshProfileFromServer() fetches latest from /auth/me?email= (unauthenticated!)
```

**Critical gap:** Login flow doesn't restore the user profile, only tokens. The user sees an empty profile until the app is relaunched.

### 4. Backend Communication

- **APIClient:** Well-structured generic request handler with auto-refresh
- **WebSocket:** Proper reconnection, but no auth on connection
- **Ad Service:** Completely separate backend, different auth model (none)
- **Photo Upload:** Presigned S3 URLs — good pattern

**Missing:** No request logging/debugging infrastructure. No network reachability checking.

### 5. Offline Behavior / Error Recovery

- **Offline:** No offline support. No cached data. If the network is down, the app shows nothing.
- **Error recovery:** `ErrorStateView` exists but is only used in `ListDiscoveryView` (empty state). Most errors are `print()`-ed and silently ignored.
- **Stale data:** `StaleDataBanner` component exists but is never used anywhere.

### 6. Data Models vs Backend Contract

| iOS Field | Backend Field | Status |
|-----------|--------------|--------|
| `AdData.logoEmoji` | `emoji` | ✅ CodingKey mapping |
| `UserProfile` | Server profile | ⚠️ Different structs used inline (ServerProfile, CreateProfileResponse, etc.) — no single source of truth |
| `TokenResponse` | `/auth/login` response | ✅ Matches |
| `NearbyResponse` | `/nearby` response | ⚠️ Inline struct definitions make it hard to verify |

**Pattern:** Almost every API call defines its own inline request/response struct. This means there's no single definition of the API contract. Changes to the backend require searching through multiple files.

### 7. Security Posture

| Concern | Status | Severity |
|---------|--------|----------|
| Token storage | Keychain with `afterFirstUnlock` | ✅ Good |
| Certificate pinning | None | 🔴 CRITICAL |
| Jailbreak detection | None | ⚠️ MEDIUM |
| API URL exposure | Hardcoded AWS URLs in binary | 🔴 CRITICAL |
| WebSocket auth | userId in URL, no token | ⚠️ HIGH |
| Profile endpoint | `/auth/me?email=` unauthenticated | 🔴 CRITICAL |
| Token refresh | Implemented but racy | ⚠️ HIGH |
| Data at rest | Profile in UserDefaults (unencrypted) | ⚠️ MEDIUM |
| Input validation | Minimal client-side (email format only) | ⚠️ MEDIUM |

### 8. Performance Concerns

- **Map annotations:** Rebuilt entirely on every `updateUIView` call — O(n) per state change
- **Avatar downloads:** No shared image cache (map coordinator has its own, AsyncImage has none)
- **Location broadcasting:** Heartbeat every 30s even when stationary — battery concern over long sessions
- **WebSocket:** Always connected while app is foreground — reasonable for the use case
- **Ad rotation:** 30s timer continues when app is backgrounded
- **Memory:** No obvious leaks. `[weak self]` used consistently in closures. Timer invalidation in `stopTracking()`/`disconnect()`.

### 9. Dead Code / Unused Features

| Item | Location | Status |
|------|----------|--------|
| `PhoneEntryScreen.swift` | Features/Auth/Screens/ | 🔴 Dead — backend removed phone auth |
| `PhoneOTPScreen.swift` | Features/Auth/Screens/ | 🔴 Dead — never navigated to |
| `OnboardingStep.phone/.phoneOTP` | OnboardingFlow.swift | 🔴 Dead — renders EmptyView |
| `AuthService.sendPhoneOTP/confirmPhoneOTP` | AuthService.swift | 🔴 Dead — never called |
| `CircularCropView` | CameraCapture.swift | ⚠️ Dead — UIImagePickerController handles crop |
| `FullProfileView.swift` | Shared/Discovery/ | ⚠️ Possibly dead — no navigation to it |
| `OnboardingData.buildProfile()` | OnboardingData.swift | ⚠️ Dead — profile built inline in OnboardingFlow |
| `StaleDataBanner` | StateViews.swift | ⚠️ Dead — never used |
| `MapThemeConfig` colors | MapThemeManager.swift | ⚠️ Dead — defined but never applied to map |
| `StatCard` | OwnProfileView.swift | ⚠️ Possibly dead — defined but not used in view body |

### 10. Accessibility

- **VoiceOver:** No explicit accessibility labels, hints, or traits on any interactive elements. System defaults will provide some coverage (button labels from text content) but custom components like `AvatarView`, `FloorPicker`, `OTPCodeField` will be opaque to VoiceOver.
- **Dynamic Type:** Not supported. All fonts use fixed sizes via `ColageFonts`. Text will not scale with system accessibility settings.
- **Color contrast:** Dark theme with white text on dark backgrounds is generally high contrast. `textTertiary` (#666666) on `background` (#0A0A0A) fails WCAG AA for small text.
- **Reduce Motion:** No `@Environment(\.accessibilityReduceMotion)` checks. Animations play regardless.
- **Haptics:** Present on buttons — good for feedback, but no alternative for users with haptics disabled.

**Verdict:** Accessibility is essentially unimplemented. This would be a blocker for App Store review if Apple tests with VoiceOver.

---

## Issue Tracker

### 🔴 CRITICAL

| # | Issue | Location | Description |
|---|-------|----------|-------------|
| C1 | Unauthenticated profile endpoint | AppState.swift:45 | `/auth/me?email=` is treated as a public path — anyone can fetch any user's profile by email |
| C2 | Global mutable static UserProfile | Models.swift:34 | `UserProfile.current` read/written from multiple threads without synchronization |
| C3 | Hardcoded API URLs | APIClient.swift:10, WebSocketManager.swift:43, AdService.swift:14 | AWS API Gateway URLs (including `/dev` stage) baked into binary |
| C4 | No certificate pinning | APIClient.swift | All network calls use default URLSession — vulnerable to MITM on campus WiFi |
| C5 | Fire-and-forget profile creation | AuthService.swift:89-140 | `createProfile()` launches async Task with no completion signal — caller can't know if it succeeded |

### ⚠️ HIGH

| # | Issue | Location | Description |
|---|-------|----------|-------------|
| H1 | Dead phone auth code | PhoneEntryScreen.swift, PhoneOTPScreen.swift, AuthService.swift | ~300 lines of dead code for removed feature |
| H2 | Login doesn't restore profile | LoginScreen.swift:128 | After login, `UserProfile.current` is nil — no profile fetch |
| H3 | Token refresh race condition | APIClient.swift:65-80 | Multiple concurrent 401s each attempt independent refresh |
| H4 | Push notifications non-functional | NotificationService.swift | Token registration unimplemented, AppDelegate missing |
| H5 | No WebSocket authentication | WebSocketManager.swift:43 | Connection uses userId in URL with no token verification |
| H6 | AR mode non-functional on device | ARDiscoveryView.swift | `updateStudentEntities()` is empty — positions never update |
| H7 | University fallback to mock data | UniversityService.swift:18 | API failure silently returns mock data in production |
| H8 | Ad service unauthenticated | AdService.swift | Separate backend with no auth, student_id in URL |
| H9 | Mapbox attribution hidden | MapDiscoveryView.swift:105-108 | Violates Mapbox ToS |
| H10 | No nearby student refresh | HomeView.swift | Only initial fetch + WebSocket — no periodic re-fetch |
| H11 | Race condition in onboarding | OnboardingFlow.swift:72-80 | `createProfile()` and `fetchAndStoreTokens()` race — tokens may be fetched before profile exists |

### ⚠️ MEDIUM

| # | Issue | Location | Description |
|---|-------|----------|-------------|
| M1 | No Dynamic Type support | ColageFonts.swift | All fonts fixed-size — accessibility concern |
| M2 | OTP field UX | Components.swift:68-95 | Visible TextField below digit boxes — confusing |
| M3 | Profile in UserDefaults | AppState.swift:41 | Sensitive profile data in unencrypted UserDefaults |
| M4 | Timer leak in OTP screens | EmailOTPScreen.swift:80 | Timer not invalidated on view dismissal |
| M5 | WebSocket isConnected premature | WebSocketManager.swift:41 | Set true before connection established |
| M6 | Location contradictions | LocationService.swift:43-44 | Background indicator enabled but background updates disabled |
| M7 | Heartbeat always broadcasts | LocationService.swift:70 | Sends every 30s even when stationary |
| M8 | Map annotations rebuilt every update | MapDiscoveryView.swift:138 | O(n) annotation rebuild on every state change |
| M9 | Inline API response structs | AuthService.swift (throughout) | No single API contract — structs defined per-call |
| M10 | Dead onboarding steps | OnboardingFlow.swift | Progress shows 10 steps but only 8 are active |
| M11 | Permission screen location check | PermissionsScreen.swift:93 | Only updates in dev mode |
| M12 | Phone display in Settings | SettingsView.swift:12 | Shows empty string after relaunch |
| M13 | Ad debug code in production | AdService.swift:52-55 | Double-fetch in catch block |
| M14 | CircularCropView dead code | CameraCapture.swift:60-130 | Defined but never used |
| M15 | No error feedback to users | Throughout | Most errors are `print()`-ed, not shown in UI |
| M16 | Distance always 0 from WebSocket | HomeView.swift:170 | WebSocket handler sets distance: 0 for new students |
| M17 | Bio limit not enforced in edit | EditProfileView.swift | No 160-char enforcement in edit profile |

### ℹ️ LOW

| # | Issue | Location | Description |
|---|-------|----------|-------------|
| L1 | Keychain ops ignore errors | KeychainWrapper.swift | `SecItemAdd` return value not checked |
| L2 | Visibility/floor not persisted | AppState.swift | Reset to defaults on relaunch |
| L3 | AsyncImage no caching | Components.swift:107 | Re-downloads on every recompose |
| L4 | Haptic generator created inline | Components.swift:12 | Should be prepared for performance |
| L5 | Ground altitude assumption | LocationService.swift:102 | Assumes first reading is ground floor |
| L6 | StaleDataBanner unused | StateViews.swift:88 | Component exists but never displayed |
| L7 | FullProfileView unused | FullProfileView.swift | No navigation path leads to it |
| L8 | StatCard unused | OwnProfileView.swift:176 | Defined but not in view body |
| L9 | Privacy/ToS links unverified | SettingsView.swift:74-77 | colage.app pages may not exist |
| L10 | Color contrast fails WCAG | ColageColors.swift:17 | textTertiary on background too low |

---

## Recommendations

### Immediate (Pre-Launch Blockers)

1. **Fix the `/auth/me` endpoint access** — Either add authentication or move it to a non-public path prefix
2. **Make `UserProfile.current` thread-safe** — Use an actor, `@MainActor` wrapper, or move to an ObservableObject
3. **Move API URLs to configuration** — Use `Secrets.xcconfig` or Info.plist entries, not hardcoded strings
4. **Add certificate pinning** — At minimum for auth and profile endpoints
5. **Fix login flow** — Fetch and restore `UserProfile` after successful login
6. **Fix onboarding race condition** — Make `createProfile()` async, await it before fetching tokens
7. **Remove dead phone auth code** — Delete `PhoneEntryScreen`, `PhoneOTPScreen`, phone methods in `AuthService`, dead enum cases

### Short-Term (v1.1)

8. **Add Dynamic Type support** — Use `Font.TextStyle` or `.dynamicTypeSize()` modifier
9. **Add VoiceOver labels** — At minimum for custom interactive components
10. **Implement push notification registration** — Add AppDelegate adapter, implement token POST
11. **Add WebSocket authentication** — Send JWT as a connection parameter
12. **Fix Mapbox attribution** — Show required attribution per ToS
13. **Add periodic nearby student refresh** — Timer or pull-to-refresh
14. **Consolidate API response types** — Single model file for all API contracts
15. **Add network error UI** — Show `ErrorStateView` when requests fail, not just `print()`

### Medium-Term (v1.2+)

16. **Implement real AR positioning** — Use compass + GPS offset for actual student directions
17. **Add offline caching** — Cache last-known student list for immediate display
18. **Add image caching layer** — Shared NSCache or Kingfisher/SDWebImage for avatar downloads
19. **Add analytics/crash reporting** — No observability currently exists
20. **Add unit tests** — `ColageTests` target exists but appears to have no tests
21. **Implement jailbreak detection** — For a location-sharing app, this is important for user trust
22. **Add App Store compliance** — Data deletion timeline, privacy nutrition labels, etc.

---

*This audit covers the complete iOS codebase as of 2026-03-28. It should be treated as a living document — update it as issues are resolved.*

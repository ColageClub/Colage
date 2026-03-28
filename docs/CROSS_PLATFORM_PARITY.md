# Colage — Cross-Platform Parity Report

**Generated:** 2026-03-28  
**Scope:** iOS (Swift/SwiftUI) vs Android (Kotlin/Jetpack Compose)  
**Based on:** IOS_AUDIT.md, ANDROID_AUDIT.md, and direct source comparison

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Feature Parity Matrix](#feature-parity-matrix)
3. [API Contract Alignment](#api-contract-alignment)
4. [Data Model Comparison](#data-model-comparison)
5. [Design System Comparison](#design-system-comparison)
6. [Security Posture Comparison](#security-posture-comparison)
7. [Platform-Exclusive Features](#platform-exclusive-features)
8. [Remaining Issues Comparison](#remaining-issues-comparison)
9. [Recommended Actions](#recommended-actions)

---

## Executive Summary

The iOS and Android codebases are **closely aligned** — they share the same architecture patterns, feature set, API endpoints, data models, and design system. Both platforms went through fix waves that addressed several original audit issues, but **some fixes were applied inconsistently**, creating new divergences.

### Fix Status Overview

| Fix | iOS | Android | Notes |
|-----|-----|---------|-------|
| API URLs moved to config | ✅ Info.plist with fallback | ✅ BuildConfig (no fallback) | Android is stricter |
| `/auth/me` public path fix | ❌ Still uses `/auth/` prefix | ✅ Uses specific paths | **iOS still vulnerable** |
| Token refresh race condition | ✅ Actor-based serialization | ✅ Mutex-based serialization | Both fixed, different approach |
| Profile creation async/await | ✅ Now `async throws` | ✅ Now awaits server response | Both fixed |
| Login profile restoration | ✅ `fetchAndRestoreProfile()` | ✅ Fetches via `/auth/me` after login | Both fixed |
| Profile storage security | ⚠️ Keychain primary, UserDefaults legacy | ✅ EncryptedSharedPreferences | iOS has legacy paths |
| Dead phone auth screens | ✅ Removed | ✅ Removed | Both clean |
| HTTP body logging in release | N/A (no interceptor) | ✅ Conditional on DEBUG | Both OK |
| WebSocket authentication | ✅ Token in query param | ✅ Token in query param | Same approach |
| Settings hardcoded info | ⚠️ `enteredEmail` (empty after relaunch) | ✅ Uses persisted `userEmail` | iOS worse |
| `UserProfile.current` thread safety | ✅ `@MainActor` | ✅ `MutableStateFlow` | Both fixed |

---

## Feature Parity Matrix

### Legend
- ✅ = Implemented and working
- ⚠️ = Implemented but has issues
- ❌ = Missing or non-functional
- 🔶 = Partial implementation

| Feature | iOS | Android | Parity | Severity | Notes |
|---------|-----|---------|--------|----------|-------|
| **Onboarding Flow** | | | | | |
| Welcome screen | ✅ | ✅ | ✅ Match | — | Same feature rows, CTAs |
| Email entry + .edu validation | ✅ | ✅ | ✅ Match | — | Same domain extraction logic |
| Email OTP verification | ✅ | ✅ | ✅ Match | — | Same 6-digit, auto-submit, resend timer |
| Server type selection | ✅ | ✅ | ✅ Match | — | Student/Alumni card selection |
| Photo upload | ✅ | ✅ | ✅ Match | — | Camera + library, skip option |
| Profile info | ✅ | ✅ | ✅ Match | — | Name required, bio 160 char, major autocomplete |
| Social links | ✅ | ✅ | ✅ Match | — | Same 7 platforms + 3 custom |
| Permissions screen | ✅ | ✅ | ✅ Match | — | Location → Camera → Notifications |
| University welcome | ✅ | ✅ | ⚠️ Minor | LOW | iOS shows member count; Android says "already here" without count |
| Onboarding progress | ✅ 8 steps | ✅ 8 steps | ✅ Match | — | Both show correct step count |
| Splash/Launch screen | ✅ Pulsing logo | ✅ Spinner | ⚠️ Minor | LOW | Different animations, same purpose |
| Phone auth screens | ✅ Removed | ✅ Removed | ✅ Match | — | Both cleaned up |
| **Login Flow** | | | | | |
| Email → OTP login | ✅ | ✅ | ✅ Match | — | Same 2-step flow |
| Profile restoration on login | ✅ | ✅ | ✅ Match | — | Both now fetch from `/auth/me` |
| Token storage | ✅ Keychain | ✅ EncryptedSharedPreferences | ✅ Match | — | Platform-appropriate secure storage |
| **Map Discovery** | | | | | |
| Mapbox map | ✅ | ✅ | ✅ Match | — | Same dark style |
| Student annotations (avatar) | ✅ | ✅ | ✅ Match | — | Circular avatars with initials fallback |
| Position interpolation (70% lerp) | ✅ | ✅ | ✅ Match | — | Same smooth movement |
| Location puck | ✅ | ✅ | ✅ Match | — | Color changes with visibility |
| Recenter button | ✅ | ✅ | ✅ Match | — | |
| Tap → mini sheet | ✅ | ✅ | ✅ Match | — | |
| Mapbox attribution hidden | ⚠️ Violates ToS | ⚠️ Violates ToS | ✅ Match (both wrong) | HIGH | Both hide required attribution |
| **List Discovery** | | | | | |
| 2-column grid | ✅ | ✅ | ✅ Match | — | |
| Distance slider (log scale) | ✅ 10–500 ft | ✅ 10–500 ft | ✅ Match | — | Same exponential mapping |
| Floor filter chips | ✅ | ✅ | ✅ Match | — | All Floors / Current Floor |
| Student cards | ✅ | ✅ | ✅ Match | — | Avatar, name, major, distance, floor |
| **AR Discovery** | | | | | |
| Simulator mode | ✅ Floating bubbles | ✅ Floating bubbles | ✅ Match | — | Same concept, platform-specific rendering |
| Device AR | ⚠️ Non-functional (ARKit) | ❌ Simulated only (no ARCore) | ⚠️ Minor | MEDIUM | iOS has shell code; Android doesn't even try |
| **Floor Detection** | | | | | |
| Barometer-based | ✅ | ✅ | ✅ Match | — | Same dead-zone filtering, altitude-based |
| Manual floor picker | ✅ | ✅ | ✅ Match | — | |
| Floor filtering | ✅ | ✅ | ✅ Match | — | |
| **Visibility Toggle** | ✅ | ✅ | ✅ Match | — | Same behavior, puck color change |
| **Distance Slider** | ✅ Log scale 10–500 ft | ✅ Log scale 10–500 ft | ✅ Match | — | |
| **Profile Viewing** | | | | | |
| Mini profile sheet | ✅ | ✅ | ✅ Match | — | Expandable, avatar/name/major/distance/floor/bio/social |
| Full profile view | ❌ Dead code (removed) | ❌ Dead code (removed) | ✅ Match | — | Both removed it |
| **Own Profile + Edit** | | | | | |
| Own profile view | ✅ | ✅ | ✅ Match | — | Same sections |
| Edit profile | ✅ | ✅ | ✅ Match | — | Same fields, photo change |
| **Settings** | | | | | |
| Account info (email) | ⚠️ In-memory only | ✅ Persisted from prefs | ⚠️ Divergent | MEDIUM | iOS shows blank after relaunch |
| Server type display | ✅ | ✅ | ✅ Match | — | |
| Alumni switch | ✅ | ✅ | ✅ Match | — | |
| Theme picker | ✅ | ✅ | ✅ Match | — | |
| Logout | ✅ | ✅ | ✅ Match | — | |
| Delete account | ✅ | ✅ | ✅ Match | — | |
| Dev mode section | ✅ | ✅ | ✅ Match | — | |
| Privacy/ToS links | ✅ | ✅ | ✅ Match | — | Same colage.app links |
| Mapbox attribution (text) | ✅ | ✅ | ✅ Match | — | Both in About section |
| **Ad System** | | | | | |
| Banner ad | ✅ | ✅ | ✅ Match | — | Bottom banner, tappable |
| Detail sheet | ✅ | ✅ | ✅ Match | — | Emoji, deal info, distance |
| 30s rotation | ✅ | ✅ | ✅ Match | — | |
| Impression tracking | ✅ | ✅ | ✅ Match | — | POST to ad server |
| "Get Directions" button | ❌ No-op | ❌ No-op | ✅ Match (both broken) | MEDIUM | Neither implemented |
| "Save Screenshot" button | ❌ No-op | ❌ No-op | ✅ Match (both broken) | LOW | |
| **WebSocket** | | | | | |
| Real-time location updates | ✅ | ✅ | ✅ Match | — | Same message types |
| Reconnection w/ exp backoff | ✅ Max 10 attempts | ✅ Max 5 attempts | ⚠️ Minor | LOW | Different max attempts |
| Ping keepalive (30s) | ✅ | ✅ | ✅ Match | — | |
| Auth token in connection | ✅ Query param | ✅ Query param | ✅ Match | — | |
| **Location Broadcasting** | | | | | |
| Movement-based (5m filter, 3m min) | ✅ | ✅ | ✅ Match | — | Same thresholds |
| 30s heartbeat | ✅ | ✅ | ✅ Match | — | |
| **University Theming** | | | | | |
| Theme from server | ✅ | ✅ | ✅ Match | — | |
| Environment/CompositionLocal | ✅ `@Environment(\.themeColor)` | ✅ `LocalThemeColor.current` | ✅ Match | — | Platform-appropriate |
| Mock fallback on API failure | ✅ | ✅ | ✅ Match (both wrong) | MEDIUM | Both fall back to mock data |
| **Camera Capture** | ✅ | ✅ | ✅ Match | — | Profile photo camera |
| **Push Notifications** | ⚠️ Token TODO | ❌ No implementation | ⚠️ Minor | MEDIUM | iOS has shell; Android has nothing |

---

## API Contract Alignment

### Endpoints

| Endpoint | iOS | Android | Match |
|----------|-----|---------|-------|
| `POST /auth/email/verify` | ✅ | ✅ | ✅ |
| `POST /auth/email/confirm` | ✅ | ✅ | ✅ |
| `POST /auth/login` | ✅ | ✅ | ✅ |
| `POST /auth/refresh` | ✅ | ✅ | ✅ |
| `GET /auth/me` | ✅ | ✅ | ✅ |
| `POST /users` | ✅ | ✅ | ✅ |
| `PUT /users/{userId}` | ✅ | ✅ | ✅ |
| `DELETE /users/{userId}` | ✅ | ✅ | ✅ |
| `GET /universities/{domain}` | ✅ | ✅ | ✅ |
| `POST /photos/upload-url` | ✅ | ✅ | ✅ |
| `PUT {s3PresignedUrl}` | ✅ | ✅ | ✅ |
| `GET /nearby` | ✅ | ✅ | ✅ |
| `GET /api/ads/serve` (ad server) | ✅ | ✅ | ✅ |
| `POST /api/ads/track` (ad server) | ✅ | ✅ | ✅ |

**Verdict:** Both platforms hit the same endpoints. ✅

### Public Path Lists (Token Skip)

| | iOS | Android |
|---|-----|---------|
| Public paths | `/auth/`, `/universities/` | `/auth/email/`, `/auth/login`, `/auth/refresh`, `/universities/` |
| `/auth/me` authenticated? | **❌ NO** — matches `/auth/` prefix | **✅ YES** — not in specific list |

> **🔴 CRITICAL DIVERGENCE:** iOS treats ALL `/auth/*` paths as public (prefix match). Android fixed this by listing specific paths. On iOS, `/auth/me` requests go out **without an auth token**. The server may still respond (if it doesn't require auth), but this means iOS can't rely on server-side authentication for that endpoint. This was flagged as CRITICAL in the iOS audit but **was not fixed**.

### Request/Response Models

Both platforms use inline struct definitions for most API calls. Android consolidates all models in `data/models/Models.kt`; iOS defines them inline in each service file.

| Model | iOS | Android | Match |
|-------|-----|---------|-------|
| `EmailVerifyRequest` | Inline in AuthService | Named in Models.kt | ✅ Same fields |
| `EmailConfirmRequest/Response` | Inline | Named | ✅ Same fields |
| `LoginRequest` | Inline | Named | ✅ Same fields (`email`, `deviceId`) |
| `TokenResponse` | Inline | Named with `@SerializedName` | ✅ Same fields |
| `CreateProfileRequest` | Inline | Named | ✅ Same fields |
| `CreateProfileResponse` | Inline | Named | ✅ Same structure (`.profile.userId`) |
| `UpdateProfileRequest` | Inline | Named | ✅ Same fields |
| `ProfileResponseWrapper` | Inline `ServerProfile` | Named | ✅ Same structure |
| `NearbyResponse` | Inline | Named | ✅ Same structure |

### Auth Token Handling

| Aspect | iOS | Android | Match |
|--------|-----|---------|-------|
| Token storage | Keychain (`access_token`, `id_token`, `refresh_token`) | EncryptedSharedPreferences (same keys) | ✅ |
| Token attachment | `Authorization: Bearer {token}` | `Authorization: Bearer {token}` | ✅ |
| Device ID header | `X-Device-Id` on authenticated requests | Not sent | ⚠️ **iOS only** |
| 401 auto-refresh | Actor-serialized | Mutex-serialized | ✅ Different approach, same behavior |
| Refresh endpoint | `POST /auth/refresh` | `POST /auth/refresh` | ✅ |

> **⚠️ MEDIUM DIVERGENCE:** iOS sends `X-Device-Id` header on authenticated requests; Android does not. If the backend enforces device checking, Android requests could fail. If it doesn't, iOS is sending unnecessary data.

### Error Handling

| Aspect | iOS | Android |
|--------|-----|---------|
| Custom error types | `APIError` enum (6 cases) | `ApiException` class (code + message) |
| Device mismatch detection | ✅ Checks response body for `device_mismatch` | ❌ Not implemented |
| Error propagation | Throws to caller | Throws to caller |
| Decoding strategy | `JSONDecoder` + `iso8601` | `Gson` (default dates) |

> **⚠️ MEDIUM DIVERGENCE:** iOS handles `device_mismatch` 401 responses (clears tokens, throws specific error). Android doesn't check for this case — a device mismatch would be treated as a generic error, potentially causing an infinite refresh loop.

---

## Data Model Comparison

### Core Models

| Field | iOS (`Models.swift`) | Android (`Models.kt`) | Match |
|-------|---------------------|----------------------|-------|
| **University** | | | |
| `id` | `String` | `String` | ✅ |
| `domain` | `String` | `String` | ✅ |
| `name` | `String` | `String` | ✅ |
| `memberCount` | `Int` (var) | `Int` (default 0) | ✅ |
| `brandingThemes` | `[UniversityTheme]` | `List<UniversityTheme>` (default empty) | ✅ |
| **UniversityTheme** | | | |
| `id` | `String` | `String` | ✅ |
| `name` | `String` | `String` | ✅ |
| `primaryColor` | `String` | `String` | ✅ |
| `accentColor` | `String` | `String` | ✅ |
| `textColor` | `String` | `String` | ✅ |
| `backgroundAsset` | `String?` | `String?` | ✅ |
| Default theme | `#A51C30`, `#00CEC9`, `#FFFFFF` | Same | ✅ |
| **UserProfile** | | | |
| `userId` | `String` | `String` | ✅ |
| `universityDomain` | `String` | `String` | ✅ |
| `displayName` | `String` | `String` | ✅ |
| `profilePhotoURL` | `String?` | `String?` | ✅ |
| `bio` | `String?` | `String?` | ✅ |
| `major` | `String?` | `String?` | ✅ |
| `socialLinks` | `[SocialLink]` | `List<SocialLink>` (default empty) | ✅ |
| `isVisible` | `Bool` | `Boolean` (default true) | ✅ |
| `serverType` | `ServerType` | `ServerType` (default STUDENT) | ✅ |
| `createdAt` | `Date` | `Long` (epoch millis) | ⚠️ **Type mismatch** |
| `updatedAt` | `Date` | `Long` (epoch millis) | ⚠️ **Type mismatch** |
| **SocialLink** | | | |
| `platform` | `SocialPlatform` | `SocialPlatform` | ✅ |
| `handle` | `String` | `String` | ✅ |
| URL construction | Same logic for all 10 platforms | Same logic | ✅ |
| **SocialPlatform** | | | |
| Values | `instagram, tiktok, x, snapchat, facebook, bereal, linkedin, custom1, custom2, custom3` | Same (uppercase enum) | ✅ |
| Raw values | Lowercase strings | Uppercase enum names | ⚠️ **Serialization difference** |
| **ServerType** | | | |
| Values | `student, alumni` | `STUDENT, ALUMNI` | ✅ |
| Serialization | `.rawValue` (lowercase) | `.name.lowercase()` | ✅ Both serialize lowercase |
| **StudentLocation** | | | |
| `userId` | `String` | `String` | ✅ |
| `latitude` | `Double` | `Double` | ✅ |
| `longitude` | `Double` | `Double` | ✅ |
| `altitude` | `Double` | `Double` (default 0.0) | ✅ |
| `floor` | `Int` | `Int` (default 1) | ✅ |
| `timestamp` | `Date` | `Long` (epoch millis) | ⚠️ **Type mismatch** |
| `displayName` | `String?` | `String?` | ✅ |
| `profilePhotoURL` | `String?` | `String?` | ✅ |
| `major` | `String?` | `String?` | ✅ |
| **NearbyStudent** | | | |
| `profile` | `UserProfile` | `UserProfile` | ✅ |
| `location` | `StudentLocation` | `StudentLocation` | ✅ |
| `distance` | `Double` (feet) | `Double` (feet) | ✅ |
| **AdData** | | | |
| `id` | `String` | `String` | ✅ |
| `businessName` | `String` | `String` | ✅ |
| `bio` | `String` | `String` (default "") | ✅ |
| `deal` | `String` | `String` | ✅ |
| `emoji` / `logoEmoji` | `logoEmoji` (CodingKey: `emoji`) | `emoji` (direct field name) | ⚠️ **Different field names** |
| `logoUrl` | `String?` | `String?` | ✅ |
| `distance` | `String?` | `String?` (var) | ✅ |
| `lat`/`lng` | `Double?` | `Double?` | ✅ |

### Potential Bug: Date/Timestamp Handling

| Concern | Severity |
|---------|----------|
| iOS uses `Date` (decoded with `.iso8601`); Android uses `Long` (epoch millis). If the backend sends ISO 8601 strings, Android may fail to parse them for `createdAt`/`updatedAt`/`timestamp` fields. If the backend sends epoch millis, iOS may fail. | **MEDIUM** — depends on actual backend format. Both platforms generate these values locally for most use cases, so it may not manifest. |

### Potential Bug: SocialPlatform Serialization

| Concern | Severity |
|---------|----------|
| iOS serializes `SocialPlatform` as lowercase (`instagram`, `tiktok`). Android's Gson serializes enum names as uppercase (`INSTAGRAM`, `TIKTOK`) by default. If the backend expects a specific case, one platform's social links may not deserialize correctly on the other. | **MEDIUM** — Android has `SocialPlatform.fromString()` that does case-insensitive matching, but the `@SerializedName` annotation is not present on enum values. |

### Potential Bug: AdData Field Name

| Concern | Severity |
|---------|----------|
| iOS maps backend field `emoji` to local field `logoEmoji` via `CodingKey`. Android uses `emoji` directly as the field name. Both work with the same backend response, but the local field name differs — any shared logic or cross-platform debugging would be confusing. | **LOW** — cosmetic, both parse correctly. |

---

## Design System Comparison

### Colors

| Color | iOS Hex | Android Hex | Match |
|-------|---------|-------------|-------|
| Background | `#0A0A0A` | `0xFF0A0A0A` | ✅ |
| Surface | `#1A1A1A` | `0xFF1A1A1A` | ✅ |
| SurfaceElevated | `#252525` | `0xFF252525` | ✅ |
| Border | `#333333` | `0xFF333333` | ✅ |
| Primary (Crimson) | `#A51C30` | `0xFFA51C30` | ✅ |
| PrimaryLight | `#D43B50` | `0xFFD43B50` | ✅ |
| Secondary (Teal) | `#00CEC9` | `0xFF00CEC9` | ✅ |
| TextPrimary | White | White | ✅ |
| TextSecondary | `#A0A0A0` | `0xFFA0A0A0` | ✅ |
| TextTertiary | `#666666` | `0xFF666666` | ✅ |
| Online | `#00E676` | `0xFF00E676` | ✅ |
| Offline | `#555555` | `0xFF555555` | ✅ |
| Error | `#FF5252` | `0xFFFF5252` | ✅ |
| Warning | `#FFD740` | `0xFFFFD740` | ✅ |

**Verdict:** Colors are **pixel-perfect identical.** ✅

### Fonts

| Style | iOS | Android | Match |
|-------|-----|---------|-------|
| LargeTitle | `.largeTitle, .rounded, .bold` | `Bold, 34.sp` | ⚠️ iOS uses `.rounded` design; Android uses default |
| Title | `.title, .rounded, .bold` | `Bold, 28.sp` | ⚠️ Same diff |
| Title2 | `.title2, .rounded, .semibold` | `SemiBold, 22.sp` | ⚠️ Same diff |
| Title3 | `.title3, .semibold` | `SemiBold, 20.sp` | ✅ |
| Body | `.body` | `Normal, 17.sp` | ✅ |
| BodyBold | `.body, .semibold` | `SemiBold, 17.sp` | ✅ |
| Callout | `.callout` | `Normal, 16.sp` | ✅ |
| Subheadline | `.subheadline` | `Normal, 15.sp` | ✅ |
| Footnote | `.footnote` | `Normal, 13.sp` | ✅ |
| Caption | `.caption` | `Normal, 12.sp` | ✅ |
| CaptionBold | `.caption, .semibold` | `SemiBold, 12.sp` | ✅ |
| Mono | `.body, .monospaced, .medium` | `Monospace, Medium, 17.sp` | ✅ |
| MonoSmall | `.footnote, .monospaced, .medium` | `Monospace, Medium, 13.sp` | ✅ |

| Concern | Details | Severity |
|---------|---------|----------|
| Display fonts use `.rounded` on iOS | iOS LargeTitle/Title/Title2 use SF Pro Rounded; Android uses the system default font (typically Roboto). This gives iOS a slightly softer aesthetic for headings. | **LOW** — subtle visual difference |
| Dynamic Type | iOS now uses `Font.system(.body)` etc. which scale; Android uses `sp` which scales | ✅ Both support font scaling now |

### Theming

| Aspect | iOS | Android | Match |
|--------|-----|---------|-------|
| Mechanism | `@Environment(\.themeColor)` | `LocalThemeColor.current` | ✅ Platform-appropriate |
| Default fallback | `#A51C30` / `#00CEC9` | Same | ✅ |
| Theme switching | `UniversityService` sets environment | `UniversityService` sets CompositionLocal | ✅ |

### Components

| Component | iOS | Android | Match |
|-----------|-----|---------|-------|
| `ColagePrimaryButton` | ✅ Haptic, loading, disabled | ✅ Haptic, loading, disabled | ✅ |
| `ColageTextField` | ✅ | ✅ | ✅ |
| `OTPCodeField` | ⚠️ Visible hidden TextField | ⚠️ Visible hidden TextField | ✅ Match (both same bug) |
| `AvatarView` | ✅ AsyncImage + initials | ✅ AsyncImage + initials | ✅ |
| `DiscoveryModePicker` | ✅ Segmented + spring | ✅ Segmented + animation | ✅ |
| `OnboardingProgress` | ✅ | ✅ | ✅ |
| `LoadingStateView` | ✅ | ✅ | ✅ |
| `ErrorStateView` | ✅ | ✅ | ✅ |
| `EmptyStateView` | ✅ | ✅ | ✅ |
| `StaleDataBanner` | ❌ Dead code | ❌ Dead code | ✅ Match (both unused) |
| `CircularCropView` | ❌ Dead code (removed?) | N/A | ✅ |

---

## Security Posture Comparison

| Aspect | iOS | Android | Match | Severity |
|--------|-----|---------|-------|----------|
| **Token storage** | Keychain (`afterFirstUnlock`) | EncryptedSharedPreferences (AES-256) | ✅ Both secure | — |
| **Profile storage** | Keychain (primary) ⚠️ UserDefaults (login paths) | EncryptedSharedPreferences | ⚠️ iOS has legacy paths | MEDIUM |
| **API URL config** | Info.plist with hardcoded fallback | BuildConfig (no fallback) | ⚠️ Android stricter | LOW |
| **Public path list** | `/auth/`, `/universities/` (broad prefix) | `/auth/email/`, `/auth/login`, `/auth/refresh`, `/universities/` (specific) | **🔴 iOS still vulnerable** | CRITICAL |
| **WebSocket auth** | Token in query param | Token in query param | ✅ Match (both weak) | MEDIUM |
| **Certificate pinning** | ❌ None | ❌ None | ✅ Match (both missing) | HIGH |
| **Token refresh serialization** | ✅ Actor-based | ✅ Mutex-based | ✅ Both fixed | — |
| **Device mismatch handling** | ✅ Detects and clears tokens | ❌ Not implemented | ⚠️ iOS only | MEDIUM |
| **HTTP body logging** | No interceptor (safe) | Conditional on `BuildConfig.DEBUG` | ✅ Both OK | — |
| **ProGuard/R8** | N/A (iOS has bitcode) | ❌ `isMinifyEnabled = false` | ⚠️ Android only | LOW |
| **Cleartext traffic** | N/A (ATS default) | `usesCleartextTraffic="false"` | ✅ Both block | — |
| **Jailbreak/Root detection** | ❌ None | ❌ None | ✅ Match (both missing) | MEDIUM |

### Key Security Divergences

1. **🔴 CRITICAL — `/auth/me` authentication on iOS:** iOS still uses broad `/auth/` prefix matching for public paths. The `/auth/me` endpoint is called without an auth token. Android fixed this by listing only specific auth sub-paths. If the backend requires auth for `/auth/me`, iOS calls will fail. If it doesn't, the endpoint is open to unauthenticated access on both platforms (but iOS never even sends the token).

2. **⚠️ MEDIUM — iOS profile in UserDefaults:** Two paths in iOS `AuthService.swift` (lines 343, 457 — login flow restore methods) still write profile data to `UserDefaults` under key `"dev_profile"`. The primary storage was moved to Keychain, but these legacy paths create an inconsistency where profile data exists in both secure and insecure storage.

3. **⚠️ MEDIUM — Device mismatch handling:** iOS checks for `device_mismatch` in 401 responses and clears tokens. Android has no such check — a device mismatch on Android would cause repeated failed refresh attempts.

---

## Platform-Exclusive Features

### iOS Has, Android Doesn't

| Feature | Details | Severity |
|---------|---------|----------|
| `NotificationService` shell | iOS has the class with `requestPermission()`, `registerDeviceToken()` (with TODO), and local notification helpers. Android has nothing — not even a service stub. | MEDIUM |
| Device mismatch detection | `APIClient` checks for `device_mismatch` in 401 responses | MEDIUM |
| `X-Device-Id` header | Sent on all authenticated API requests | LOW — depends on backend |
| `MapThemeManager` | Defines per-university map theme configs (unused but exists) | LOW — dead code on both |
| `onReconnect` WebSocket callback | iOS has `onReconnect` callback used to trigger re-fetch after reconnection | LOW |
| Launch screen animation | Pulsing brand animation | LOW — cosmetic |

### Android Has, iOS Doesn't

| Feature | Details | Severity |
|---------|---------|----------|
| `SplashScreen.kt` | Dedicated splash screen composable (iOS uses inline `LaunchScreen` struct) | LOW — cosmetic |
| Hilt dependency injection | Full DI framework; iOS uses singletons + `@EnvironmentObject` | LOW — architectural |
| `AdService` injected via Hilt | `@Singleton @Inject constructor()` (though previously bypassed with `remember`) | LOW |
| `NearbyResponse` / `NearbyStudentResponse` models | Android has explicit typed models for the `/nearby` endpoint response; iOS uses inline structs | LOW — organizational |
| `onReconnected` callback in WebSocket | Android's WebSocket has a reconnect callback that triggers re-fetch | LOW |

**Verdict:** No significant feature gaps. The differences are architectural (DI approach) and minor implementation details. Both platforms have the same user-facing feature set.

---

## Remaining Issues Comparison

### Shared Issues (Both Platforms)

| Issue | Severity | Notes |
|-------|----------|-------|
| Mapbox attribution hidden | HIGH | Both violate ToS |
| No certificate pinning | HIGH | Both vulnerable to MITM |
| No periodic nearby student refresh | HIGH | One-shot fetch + WebSocket only |
| WebSocket distance always 0 for new students | HIGH | No client-side distance calculation |
| University fallback to mock data in production | MEDIUM | Both show fake data on API failure |
| "Get Directions" button is a no-op | MEDIUM | Both unimplemented |
| Ad service uses separate unauthenticated backend | MEDIUM | student_id in URL, no auth |
| OTP field has visible hidden TextField | MEDIUM | Both show the extra field |
| `StaleDataBanner` is dead code | LOW | Both define it, neither use it |
| No jailbreak/root detection | MEDIUM | Both missing |
| WebSocket token in query parameter | MEDIUM | Both use same weak pattern |
| No offline support / caching | MEDIUM | Both show nothing when offline |
| Accessibility incomplete | MEDIUM | Both lack proper labels/descriptions |

### iOS-Only Remaining Issues

| Issue | Severity | Notes |
|-------|----------|-------|
| **`/auth/me` treated as public path** | **CRITICAL** | Broad `/auth/` prefix — auth token not sent for `/auth/me` |
| Profile data in UserDefaults (legacy paths) | MEDIUM | Lines 343, 457 in AuthService still write to UserDefaults |
| Settings email shows `enteredEmail` (empty after relaunch) | MEDIUM | In-memory variable lost on restart |
| `UserProfile.current` static on struct | LOW | Now `@MainActor` but still global mutable state pattern |
| `AdService.shared` is singleton, not injected | LOW | Less testable than Android's Hilt version |
| AR mode non-functional on device (empty `updateStudentEntities`) | MEDIUM | ARKit shell code exists but doesn't work |

### Android-Only Remaining Issues

| Issue | Severity | Notes |
|-------|----------|-------|
| No device mismatch handling | MEDIUM | 401 device_mismatch not detected |
| ProGuard/R8 disabled in release | LOW | APK not obfuscated |
| No foreground service for background location | MEDIUM | Location stops when app backgrounded (Android 10+) |
| `serviceScope` never cancelled in LocationService | LOW | Minor coroutine leak (singleton lifetime) |
| No `SavedStateHandle` for process death | LOW | ViewModels don't survive process death |
| Retrofit dependency imported but unused | LOW | Using raw OkHttp |
| No back navigation handling (`BackHandler`) | LOW | Default system back behavior |

---

## Recommended Actions

### 🔴 Critical (Do Immediately)

| # | Action | Platform | Details |
|---|--------|----------|---------|
| 1 | **Fix iOS public paths** | iOS | Change `publicPaths` from `["/auth/", "/universities/"]` to match Android's specific list: `["/auth/email/", "/auth/login", "/auth/refresh", "/universities/"]` |
| 2 | **Remove iOS UserDefaults profile writes** | iOS | Lines 343 and 457 in `AuthService.swift` still write to `UserDefaults("dev_profile")`. Change to `KeychainWrapper.set(key: "user_profile", ...)` |

### ⚠️ High (Before Launch)

| # | Action | Platform | Details |
|---|--------|----------|---------|
| 3 | Restore Mapbox attribution | Both | Re-enable `attribution.enabled = true` |
| 4 | Add certificate pinning | Both | Pin API server certificates |
| 5 | Add periodic nearby refresh | Both | Timer or pull-to-refresh as fallback when WebSocket drops |
| 6 | Calculate WebSocket distances client-side | Both | Use haversine from user's GPS to incoming student location |
| 7 | Add device mismatch detection to Android | Android | Check 401 response body for `device_mismatch` like iOS does |

### ⚠️ Medium (Soon After Launch)

| # | Action | Platform | Details |
|---|--------|----------|---------|
| 8 | Fix iOS Settings email display | iOS | Persist email and read from storage, not in-memory var |
| 9 | Implement push notification token registration | Both | iOS: implement TODO in `registerDeviceToken()`. Android: add FCM service |
| 10 | Implement "Get Directions" button | Both | Open native maps app with coordinates |
| 11 | Add foreground service for Android background location | Android | Required for Android 10+ |
| 12 | Align date/timestamp types | Both | Decide on ISO 8601 string or epoch millis consistently |
| 13 | Align SocialPlatform serialization casing | Both | Add `@SerializedName` on Android or verify backend handles both |
| 14 | Add offline / error state UI | Both | Show errors to users instead of silently catching |
| 15 | Enable ProGuard/R8 for Android release | Android | `isMinifyEnabled = true` |

---

*This report is based on direct source code comparison as of 2026-03-28. It should be updated as fixes are applied.*

# Colage — Launch Plan

Everything needed to go from current state → live on App Store + Play Store with real users.

---

## Current State Summary

### ✅ Done
- iOS app: 10-screen onboarding, 3 discovery modes (Map/List/AR), profiles, ads, settings
- Android app: Feature parity with iOS (Kotlin/Compose)
- Backend: SAM stack deployed (Cognito, DynamoDB, Lambda, API Gateway, WebSocket)
- Website: Dark theme homepage, ad manager with Stripe billing
- Ad system: DynamoDB tables, Stripe prepaid billing, nightly billing Lambda
- CI/CD: GitHub → Amplify auto-deploy (website)

### ❌ Not Done
- Both apps run in **dev mode** (mock data, skipped auth)
- No real user has ever signed up
- No privacy policy or terms of service
- No app store listings
- No Apple/Google developer accounts
- Domain (colageclub.com) not connected to Amplify yet
- Webhook not pointing to production URL
- No push notifications backend
- No real Mapbox styles per university
- Ads use hardcoded mock data on mobile

---

## Phase 1: Legal & Accounts (Week 1)
*No code needed — just setup*

- [ ] **Apple Developer Account** — $99/year, enroll at developer.apple.com
- [ ] **Google Play Developer Account** — $25 one-time, play.google.com/console
- [ ] **Privacy Policy** — build at colageclub.com/privacy
  - What data you collect (location, email, profile info)
  - How you use it (discovery only, not sold)
  - Data retention (location never stored permanently)
  - COPPA compliance (13+ or 17+ age gate)
  - Contact info for privacy questions
- [ ] **Terms of Service** — build at colageclub.com/terms
  - Acceptable use, .edu requirement, no harassment
  - Disclaimer on user interactions
  - Account termination rights
- [ ] **Support page** — colageclub.com/support (contact form or email)

---

## Phase 2: Backend Production-Ready (Week 1-2)
*Make the backend actually work for real users*

### Auth Flow
- [ ] Wire iOS app to real Cognito auth (remove dev mode bypass in release builds)
- [ ] Wire Android app to real Cognito auth
- [ ] Test .edu email verification flow end-to-end
- [ ] Add email domain collapsing (engineering.umich.edu → umich.edu) — already done backend

### Location & Discovery
- [ ] Wire iOS `get-nearby` Lambda to real location data (currently mock)
- [ ] Wire Android to same endpoint
- [ ] Test WebSocket real-time updates (ws-location-update Lambda exists but untested with real clients)
- [ ] Set location update frequency (every 30s when app is active?)
- [ ] Handle background location (iOS: significant location changes only)

### Profiles
- [ ] Test profile photo upload flow (S3 presigned URLs exist)
- [ ] Wire profile creation to backend (create-profile Lambda exists)
- [ ] Wire profile updates
- [ ] Test profile retrieval (get-profile Lambda)

### Push Notifications
- [ ] Set up AWS SNS for push
- [ ] Wire iOS NotificationService (currently has TODO for token registration)
- [ ] Wire Android FCM
- [ ] Send notifications for: "X students near you", weekly engagement

### Ad System (Mobile)
- [ ] Replace mock ads in iOS with `GET /ads/serve?school=X&student_id=Y`
- [ ] Replace mock ads in Android with same endpoint
- [ ] Wire impression logging (POST on ad view)
- [ ] Client-side distance calculation (haversine from student location + business lat/lng)

---

## Phase 3: Polish & Testing (Week 2-3)
*Make it feel real*

### iOS
- [ ] Remove all dev mode / mock data paths for release builds
- [ ] Test on real devices (not just simulator)
- [ ] Handle edge cases: no location permission, no students nearby, poor connection
- [ ] App icon finalized (1024x1024)
- [ ] Launch screen / splash screen
- [ ] Deep links (colageclub.com/download → App Store)
- [ ] Test Mapbox on real device (simulator doesn't render properly)
- [ ] Handle app backgrounding / foregrounding (pause/resume location)

### Android
- [ ] Same as iOS checklist above
- [ ] Test on multiple screen sizes
- [ ] Verify Gradle build in Android Studio
- [ ] Generate signed AAB for Play Store

### Website
- [ ] Connect colageclub.com domain to Amplify
- [ ] Update Stripe webhook URL to production domain
- [ ] Add privacy policy page (/privacy)
- [ ] Add terms of service page (/terms)
- [ ] Add support page (/support)
- [ ] Test ad manager full flow on production (signup → add funds → create ad → see it served)
- [ ] Address geocoding (Mapbox API) for ad creation

### Backend
- [ ] Load testing — simulate 50-100 concurrent users
- [ ] Rate limiting on auth endpoints
- [ ] Monitor CloudWatch logs
- [ ] Set up alarms (error rate, latency)
- [ ] Test nightly billing Lambda manually

---

## Phase 4: App Store Assets (Week 3)
*Create everything needed for store listings*

### Screenshots (both platforms)
Generate from real app running with test data:
1. **Map view** — students as dots on campus, school colors
2. **Profile card** — tapping a student, seeing their info + socials
3. **List view** — proximity list with distance slider
4. **AR mode** — camera view with floating profiles
5. **Ad banner** — showing a local business deal
6. Add marketing frames around screenshots (device mockup + headline text)

### App Store (iOS)
- [ ] Screenshots: 6.7" (required), 6.5", 5.5" (optional)
- [ ] App name: "Colage" / Subtitle: "Discover Your Campus"
- [ ] Description (4000 chars)
- [ ] Keywords (100 chars)
- [ ] Category: Social Networking
- [ ] Age rating questionnaire
- [ ] App Review notes + demo account credentials
- [ ] Privacy nutrition labels (what data you collect)

### Play Store (Android)
- [ ] Screenshots: 1080x1920 minimum
- [ ] Feature graphic: 1024x500 banner
- [ ] Short description (80 chars)
- [ ] Full description (4000 chars)
- [ ] Content rating (IARC questionnaire)
- [ ] Data safety section
- [ ] Contact email (public)

---

## Phase 5: Submit & Launch (Week 4)

### TestFlight (iOS)
- [ ] Upload build to App Store Connect
- [ ] Internal testing (your devices)
- [ ] External TestFlight beta (invite ~20 students at UMich)
- [ ] Collect feedback, fix bugs
- [ ] Submit for App Store review (takes 1-3 days)

### Play Store
- [ ] Upload AAB to Play Console
- [ ] Internal testing track
- [ ] Closed testing (same ~20 students)
- [ ] Submit for review (takes 1-7 days)

### Launch Day
- [ ] Both apps approved and live
- [ ] Website download links point to real store listings
- [ ] Social media announcement
- [ ] Seed initial users (friends at UMich?)

---

## Priority Blockers (Must Fix First)

| # | Blocker | Why |
|---|---------|-----|
| 1 | Apple Developer Account | Can't build, sign, or submit iOS app without it |
| 2 | Google Play Account | Can't submit Android app |
| 3 | Privacy Policy | Both stores reject without one |
| 4 | Real auth flow | App is useless in dev mode with mock data |
| 5 | Domain working | Webhook, store URLs, everything needs colageclub.com |

---

## Estimated Timeline

| Phase | Duration | Can Start Now? |
|-------|----------|:-:|
| 1. Legal & Accounts | 1-3 days | ✅ |
| 2. Backend Production | 1 week | ✅ |
| 3. Polish & Testing | 1 week | After Phase 2 |
| 4. Store Assets | 2-3 days | After Phase 3 |
| 5. Submit & Launch | 1 week | After Phase 4 |
| **Total** | **~4 weeks** | |

Phases 1 and 2 can run in parallel. Most of Phase 2 is wiring — the backend Lambda functions already exist, they just need the mobile apps connected to them instead of mock data.

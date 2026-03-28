# Colage Website — Admin Panel & Ad Manager Audit

> Generated: 2026-03-28  
> Scope: All admin pages, admin API routes, ad manager pages, ad manager API routes, shared libraries, admin UI components  
> Methodology: Full source-level review of every file in scope

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Architecture Overview](#2-architecture-overview)
3. [Data Model](#3-data-model)
4. [Admin Auth Flow](#4-admin-auth-flow)
5. [Ad Manager Auth Flow](#5-ad-manager-auth-flow)
6. [Admin Panel — File-by-File Analysis](#6-admin-panel--file-by-file-analysis)
7. [Admin API Routes — File-by-File Analysis](#7-admin-api-routes--file-by-file-analysis)
8. [Ad Manager Pages — File-by-File Analysis](#8-ad-manager-pages--file-by-file-analysis)
9. [Ad Manager API Routes — File-by-File Analysis](#9-ad-manager-api-routes--file-by-file-analysis)
10. [Shared Libraries — File-by-File Analysis](#10-shared-libraries--file-by-file-analysis)
11. [Admin UI Components](#11-admin-ui-components)
12. [Ad Lifecycle](#12-ad-lifecycle)
13. [Billing Flow](#13-billing-flow)
14. [Security Posture](#14-security-posture)
15. [Cross-Cutting Issues](#15-cross-cutting-issues)
16. [Missing Functionality & TODOs](#16-missing-functionality--todos)
17. [Issues Summary](#17-issues-summary)

---

## 1. Executive Summary

The Colage website is a Next.js (App Router) application with two major subsystems:

- **Admin Panel** (`/admin/*`) — Internal dashboard for managing users, schools, ads, and revenue
- **Ad Manager** (`/ads/*`) — Self-service portal for business advertisers to create/manage ads and billing

The codebase is functional and well-structured for an early-stage product. However, there are several **critical and high-severity security issues**, primarily around:

1. **Admin login bypasses proper authentication** — a GET endpoint sets session cookies with no password
2. **Session cookies store plain JSON** — no signing, encryption, or JWT verification
3. **Admin auth uses a different cookie name than what's being read** — the admin login sets `colage_session` but `getSession()` reads `colage_biz_session`
4. **Ads skip the "pending" review state** — new ads go directly to "active", bypassing admin review
5. **No balance deduction** — ad impressions are tracked and spending recorded, but the business's prepaid balance is never decremented

**Total Issues Found: 38** (4 Critical, 9 High, 14 Medium, 11 Low)

---

## 2. Architecture Overview

```
┌──────────────────────────────────────────────────┐
│                  Next.js App Router               │
│                                                    │
│  /admin/*          /ads/*          /api/*          │
│  (Admin Panel)     (Ad Manager)    (API Routes)    │
│                                                    │
├──────────────────────────────────────────────────┤
│  src/lib/                                          │
│  ├── admin-auth.ts    (admin session check)        │
│  ├── auth.ts          (business session cookies)   │
│  ├── cognito-business.ts (Cognito SDK wrapper)     │
│  ├── db.ts            (DynamoDB client + tables)   │
│  ├── stripe.ts        (Stripe checkout sessions)   │
│  └── models/          (data access layer)          │
│      ├── ad.ts        ├── business.ts              │
│      ├── daily-spend.ts ├── impression.ts          │
│      ├── location.ts  ├── university.ts            │
│      └── user.ts                                   │
├──────────────────────────────────────────────────┤
│  External Services                                 │
│  ├── AWS DynamoDB (us-east-2)                      │
│  ├── AWS Cognito (business user pool)              │
│  ├── Stripe (payment processing)                   │
│  └── Mapbox (geocoding)                            │
└──────────────────────────────────────────────────┘
```

**Stack:** Next.js 14+ (App Router), React, TypeScript, Tailwind CSS, DynamoDB, Cognito, Stripe, Mapbox

---

## 3. Data Model

### DynamoDB Tables

All tables are in region `us-east-2`, AWS account `788365607175`.

| Table | PK | SK | GSIs | Purpose |
|-------|----|----|------|---------|
| `colage-businesses-dev` | `id` (string) | — | `email-index` (PK: email) | Business advertiser accounts |
| `colage-ads-dev` | `id` (string) | — | `businessId-index` (PK: businessId), `school-status-index` (PK: school, SK: status) | Ad campaigns |
| `colage-impressions-dev` | `ad_id#student_id` (string) | `timestamp` (number) | — | Impression tracking with 30-day TTL |
| `colage-daily-spend-dev` | `ad_id` (string) | `date` (string, YYYY-MM-DD) | — | Daily spend aggregation per ad |
| `colage-users-dev` | `userId` (string) | — | `by-university` (PK: universityDomain) | Student/app users |
| `colage-universities-dev` | `domain` (string) | — | — | Registered universities |
| `colage-locations-dev` | `universityDomain` (string) | `userId` (string) | — | Student locations |
| `colage-connections-dev` | ? | ? | — | Referenced in `Tables` but no model file |

### Key Schemas

**Business:**
```typescript
{
  id: string;           // Cognito sub or "biz-{timestamp}"
  email: string;
  name: string;
  address: string;
  category: string;
  logoUrl: string | null;
  stripeCustomerId: string | null;
  balance: number;      // Prepaid balance in dollars
  createdAt: string;
}
```

**Ad:**
```typescript
{
  id: string;           // "ad-{timestamp}"
  businessId: string;
  school: string;       // University domain (single school per ad)
  emoji: string;
  businessName: string;
  bio: string;
  deal: string;
  address: string;
  lat: number;
  lng: number;
  dailyBudget: number;  // $1-$100
  status: "draft" | "pending" | "active" | "paused" | "completed" | "rejected";
  impressions: number;
  taps: number;
  totalSpend: number;
  createdAt: string;
}
```

**User:**
```typescript
{
  userId: string;
  email: string;
  name: string;
  displayName?: string;
  universityDomain: string;
  major?: string;
  bio?: string;
  photoUrl?: string;
  profilePhotoURL?: string;      // Alternative field name from mobile app
  socialLinks?: Array<{ platform: string; handle: string }>;
  socials?: Record<string, string>; // Alternative format
  status: "active" | "suspended" | "banned";
  isVisible?: boolean;
  createdAt: string;
  updatedAt?: string;
  lastActive?: string;
}
```

### Relationships

- `Business.id` → `Ad.businessId` (one-to-many)
- `University.domain` → `Ad.school` (one-to-many)
- `University.domain` → `User.universityDomain` (one-to-many)
- `Ad.id` + `User.userId` → `Impression.pk` composite key
- `Ad.id` → `DailySpend.ad_id` (one-to-many by date)

---

## 4. Admin Auth Flow

### How It Works

1. Admin navigates to `/api/admin/login?email=amcarbonaro@icloud.com`
2. The GET handler checks if the email is in `ADMIN_EMAILS` hardcoded list
3. If valid, sets a cookie `colage_session` with `{ businessId: "admin", email, businessName: "Admin" }`
4. Redirects to `/admin`
5. `/admin/layout.tsx` calls `checkAdmin()` → `getSession()` → reads `colage_biz_session` cookie

### 🔴 CRITICAL: Cookie Name Mismatch

The admin login route (`/api/admin/login`) sets cookie **`colage_session`**, but `getSession()` in `auth.ts` reads **`colage_biz_session`**.

```typescript
// api/admin/login/route.ts — SETS:
cookieStore.set("colage_session", JSON.stringify(session), { ... });

// lib/auth.ts — READS:
const session = cookieStore.get("colage_biz_session");
```

**This means the admin login endpoint doesn't actually work as written.** The admin can only access the panel if they also have a valid `colage_biz_session` cookie (e.g., by logging in as a business first via Cognito with an admin email).

### Admin Email Whitelist

Hardcoded in `src/lib/admin-auth.ts`:
- `amcarbonaro@icloud.com`
- `admin@colageclub.com`

Also displayed (read-only) in the Settings page.

### Session Check Flow

```
requireAdmin() → getSession() → parse colage_biz_session cookie → isAdmin(email)
```

No token verification, no signature check, no expiry validation beyond cookie `maxAge`.

---

## 5. Ad Manager Auth Flow

### How It Works

1. Business visits `/ads` → sees landing page with login/signup form
2. **Sign Up:** Client-side Cognito `signUp()` → email verification → `confirmSignUp()`
3. **Sign In:** Client-side Cognito `signIn()` → gets JWT tokens → POST to `/api/auth` with `action: "cognito-login"`
4. Server creates/finds business in DynamoDB, sets `colage_biz_session` cookie
5. All subsequent requests use `getSession()` which reads this cookie

### Cognito Configuration

```
Pool ID:   us-east-2_jeryfm6Xs
Client ID: jffa9jhioo8adpvtq5bv2r9ks
```

⚠️ These are hardcoded as fallbacks in `cognito-business.ts`, though environment variables can override.

### Session Cookie

```typescript
cookieStore.set("colage_biz_session", JSON.stringify(session), {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge: 60 * 60 * 24 * 30, // 30 days
});
```

The session payload is `{ businessId, email, businessName }` — **plain JSON, no signing or encryption**.

---

## 6. Admin Panel — File-by-File Analysis

### `/admin/layout.tsx`

**Purpose:** Server-side layout that gates all admin pages behind `checkAdmin()`.

**Auth:** Calls `checkAdmin()` on every render. If not admin, redirects to `/ads`.

**Flow:** Renders `AdminSidebar` + child content in a dark-themed layout.

**Issues:**
- **LOW:** Redirects to `/ads` instead of a dedicated access-denied page. An unauthorized user might be confused.
- **MEDIUM:** The auth check depends on the cookie issue described above. If `colage_biz_session` isn't set for the admin, they get silently redirected.

### `/admin/page.tsx` (Dashboard)

**Purpose:** Overview page showing stats (users, schools, active ads, revenue) plus recent users and schools tables.

**Data Operations:**
- `GET /api/admin/stats` — aggregate counts
- `GET /api/admin/users?limit=10` — recent users
- `GET /api/admin/schools` — all schools with user counts

**UI/UX:**
- Shows stat cards for total users, schools, active ads, revenue
- Recent users table with avatar, email, school, join date, status
- Schools table with name, domain, user count
- Clickable rows navigate to detail pages

**Issues:**
- **LOW:** Empty `catch(() => {})` swallows errors silently. Failed API calls show stale/default data with no error indication.
- **LOW:** No loading skeleton — just "Loading..." text.

### `/admin/AdminSidebar.tsx`

**Purpose:** Navigation sidebar with mobile responsive hamburger menu.

**Nav Items:** Overview, Schools, Users, Ads, Revenue, Settings

**Issues:**
- **LOW:** No active user display or logout button in the sidebar.

### `/admin/ads/page.tsx`

**Purpose:** Ad review queue and all-ads browser.

**Flow:**
- Two tabs: "Review Queue" (pending ads) and "All Ads"
- Expandable ad cards showing details (budget, spend, impressions, taps)
- Approve/reject buttons for pending ads

**Data Operations:**
- `GET /api/admin/ads/review` — pending ads
- `GET /api/admin/ads` — all ads
- `POST /api/admin/ads/{adId}/review` — approve or reject

**Issues:**
- **MEDIUM:** No rejection reason UI — the `handleReview` function sends `{ decision }` but never prompts for a reason. The API supports `reason` but it's never collected.
- **LOW:** Empty `catch { /* empty */ }` blocks.

### `/admin/users/page.tsx`

**Purpose:** Paginated user list with search, school filter, and status filter.

**Data Operations:**
- `GET /api/admin/users?search=&school=&status=&limit=50&lastKey=`
- `GET /api/admin/schools` — for filter dropdown

**UI/UX:**
- Debounced search, school dropdown, status dropdown
- "Load More" pagination
- Clickable rows → user detail

**Issues:**
- **MEDIUM:** Status filtering is done client-side on `users.filter(u => u.status === statusFilter)` after the API already returned data. The API doesn't accept a `status` parameter, so server-side filtering isn't available.
- **LOW:** `lastKey` is passed as a serialized JSON string in the URL, which works but is fragile.

### `/admin/users/[userId]/page.tsx`

**Purpose:** User detail view with profile, school info, account info, socials, and danger zone.

**Data Operations:**
- `GET /api/admin/users/{userId}` — user + location
- `POST /api/admin/users/{userId}/action` — suspend/unsuspend/ban/delete

**UI/UX:**
- Profile card with avatar, name, email, bio, status badge
- School info (university, major)
- Account info (ID, joined date, last active, last location)
- Social links (handles both `socialLinks` array and `socials` object formats)
- Danger zone with confirmation modal

**Issues:**
- **MEDIUM:** Deleting a user only removes from `colage-users-dev`. Does NOT clean up: impressions, locations, connections. Orphaned data remains.
- **LOW:** Location shows raw lat/lng coordinates — no reverse geocoding to human-readable address.

### `/admin/schools/page.tsx`

**Purpose:** School list with search and "Add School" modal.

**Data Operations:**
- `GET /api/admin/schools` — all schools + user counts
- `POST /api/admin/schools` — create new school

**UI/UX:**
- Table with name, domain, user count, color swatches
- Client-side search filtering
- Modal for adding new school with color pickers

**Issues:**
- **LOW:** No ability to edit or delete schools from this page.
- **LOW:** No validation that domain is a valid domain format.

### `/admin/schools/[domain]/page.tsx`

**Purpose:** School detail showing university info and all users at that school.

**Data Operations:**
- `GET /api/admin/schools/{domain}` — university + users

**Issues:**
- **LOW:** No edit/delete capabilities for the school itself.
- **LOW:** Loads ALL users for a school without pagination. Could be slow for large schools.

### `/admin/revenue/page.tsx`

**Purpose:** Revenue dashboard with bar chart and daily breakdown table.

**Data Operations:**
- `GET /api/admin/revenue` — last 30 days of daily revenue

**UI/UX:**
- Stat cards: This Month, Last 30 Days, Total Impressions
- Bar chart with hover tooltips
- Sortable revenue table

**Issues:**
- **MEDIUM:** Revenue data comes from `colage-daily-spend-dev` which only tracks ad spend. There's no concept of platform revenue vs. cost. The "revenue" is really just "total ad spend by advertisers," which equals revenue only if there's no cost basis.
- **LOW:** Bar chart is a simple CSS implementation — no charting library. Works but limited.

### `/admin/settings/page.tsx`

**Purpose:** Settings page with "Add School" form, admin email display, and feature flags.

**Issues:**
- **HIGH:** Feature flags are **completely hardcoded and non-functional**. The toggles render but don't toggle anything. The page even admits: *"Feature flags are display-only placeholders."*
- **MEDIUM:** Duplicate "Add School" functionality — same form exists on both `/admin/schools` and `/admin/settings`. Code is duplicated, not shared.
- **LOW:** Admin emails are hardcoded in the page source, duplicating the list from `admin-auth.ts`.

---

## 7. Admin API Routes — File-by-File Analysis

### `POST /api/admin/login/route.ts`

**Purpose:** Dev-only admin login shortcut via GET request.

**Auth:** Checks email against `ADMIN_EMAILS` list.

**Issues:**
- 🔴 **CRITICAL:** This is a **GET endpoint that authenticates users**. Anyone who knows an admin email can log in by visiting `GET /api/admin/login?email=amcarbonaro@icloud.com`. **No password required.** This is accessible in production.
- 🔴 **CRITICAL:** Sets cookie `colage_session` but `getSession()` reads `colage_biz_session` — **cookie name mismatch means this endpoint doesn't actually grant admin access** unless the admin also has a `colage_biz_session`. This is a bug-on-top-of-a-bug situation: the security flaw doesn't currently work because of a separate bug.
- **HIGH:** `secure` flag is not set on the cookie (unlike `auth.ts` which checks `NODE_ENV`).
- **MEDIUM:** No rate limiting.

### `GET /api/admin/stats/route.ts`

**Purpose:** Returns aggregate stats (total users, schools, active ads, revenue).

**Auth:** `requireAdmin()` — properly gated.

**Data Operations:**
- `getTotalUserCount()` — DynamoDB Scan with COUNT
- `getTotalUniversityCount()` — DynamoDB Scan with COUNT
- Active ads count — Scan with filter `status = "active"`
- Revenue total — Full Scan of `DAILY_SPEND`, sum all `spend` values

**Issues:**
- **HIGH:** Full table scan of `DAILY_SPEND` on every dashboard load to compute total revenue. No caching, no aggregation table. Will become expensive and slow as data grows.
- **MEDIUM:** Three separate Scan operations on every page load. Consider caching or a stats table.

### `GET /api/admin/ads/route.ts`

**Purpose:** Returns all ads (no filtering).

**Auth:** `requireAdmin()` — properly gated.

**Data Operations:** Full Scan of `colage-ads-dev`.

**Issues:**
- **MEDIUM:** No pagination. Full table scan returns everything.

### `GET /api/admin/ads/review/route.ts`

**Purpose:** Returns all ads with status "pending".

**Auth:** `requireAdmin()` — properly gated.

**Data Operations:** Scan with filter `status = "pending"`.

**Issues:**
- **MEDIUM:** Uses Scan with FilterExpression instead of the `school-status-index` GSI. Could query the GSI across schools for better performance, though pending ads are likely few.

### `POST /api/admin/ads/[adId]/review/route.ts`

**Purpose:** Approve or reject an ad.

**Auth:** `requireAdmin()` — properly gated.

**Input Validation:**
- Checks `decision` is "approve" or "reject"
- Optional `reason` for rejection

**Data Operations:**
- `updateAd(adId, { status, rejectionReason? })`

**Issues:**
- **MEDIUM:** Approval sets status to "active" directly. No check on whether the business has sufficient balance. An ad with $0 balance goes active and can serve impressions that won't be paid for.
- **LOW:** No audit trail — who approved/rejected, when.

### `GET /api/admin/users/route.ts`

**Purpose:** Paginated user list with search and school filter.

**Auth:** `requireAdmin()` — properly gated.

**Input Validation:**
- Parses `limit` with `parseInt`, falls back to 50
- `lastKey` is `JSON.parse`'d from query param

**Issues:**
- **HIGH:** `JSON.parse(lastKeyParam)` on untrusted user input with no try/catch around it. Malformed `lastKey` will crash the handler. While the outer try/catch returns `{ users: [], lastKey: null }`, this masks real errors.
- **MEDIUM:** Search filtering happens **after** the DynamoDB query/scan. If scanning with a limit of 50, you get 50 items then filter — potentially returning 0 results even though matches exist beyond the first page.

### `GET /api/admin/users/[userId]/route.ts`

**Purpose:** Single user detail with location.

**Auth:** `requireAdmin()` — properly gated.

**Data Operations:**
- `getUser(userId)` — single GetItem
- `getUserLocation(user.universityDomain, userId)` — single GetItem

**Issues:**
- **LOW:** Location lookup silently swallows errors, which is appropriate.

### `POST /api/admin/users/[userId]/action/route.ts`

**Purpose:** Suspend/unsuspend/ban/delete users.

**Auth:** `requireAdmin()` — properly gated.

**Input Validation:**
- Checks action is one of: suspend, unsuspend, ban, delete
- Verifies user exists before acting

**Issues:**
- **HIGH:** Delete is permanent with no soft-delete. `deleteUser()` calls `DeleteCommand` directly. No confirmation beyond the client-side modal. No way to recover.
- **MEDIUM:** No cascade delete — user's impressions, location data, connections remain orphaned.
- **LOW:** No audit log of admin actions.

### `GET /api/admin/revenue/route.ts`

**Purpose:** Last 30 days of daily revenue data.

**Auth:** `requireAdmin()` — properly gated.

**Data Operations:** Scan `DAILY_SPEND` with filter `date >= cutoff`, group by date.

**Issues:**
- **MEDIUM:** Full table scan with date filter. As spend data grows, this becomes expensive. Should use a Query on the date sort key.

### `GET /api/admin/schools/route.ts` & `POST`

**Purpose:** List all schools with user counts / create new school.

**Auth:** `requireAdmin()` — properly gated.

**GET Issues:**
- **MEDIUM:** For each university, makes a separate `getUserCountBySchool()` call. N+1 query pattern. With 100 schools, that's 101 DynamoDB operations.

**POST Input Validation:**
- Checks `domain` and `name` are present
- Defaults colors if missing

**POST Issues:**
- **MEDIUM:** No validation that `domain` is a valid domain format (e.g., contains a TLD).
- **MEDIUM:** No duplicate check — can create schools with the same domain, which would overwrite (PutCommand is unconditional).
- **LOW:** No sanitization of input strings.

### `GET /api/admin/schools/[domain]/route.ts`

**Purpose:** School detail with all users.

**Auth:** `requireAdmin()` — properly gated.

**Data Operations:**
- `getUniversity(domain)` — single GetItem
- `getUsersBySchool(domain)` — Query on `by-university` GSI

**Issues:**
- **LOW:** No pagination for users. Large schools will return massive payloads.

---

## 8. Ad Manager Pages — File-by-File Analysis

### `/ads/page.tsx`

**Purpose:** Marketing landing page + login/signup form for business advertisers.

**Auth:** Server-side `getSession()` check — if already logged in, redirects to `/ads/dashboard`.

**UI/UX:** Well-designed landing page with:
- Hero section with value proposition
- Comparison vs. Facebook Ads
- Map mockup with phone screenshot
- How-it-works steps
- Pricing section ($1-$100/day)
- Login/signup form at bottom

**Issues:**
- **LOW:** Inline styles throughout instead of Tailwind. Inconsistent with admin panel which uses Tailwind.
- **LOW:** Phone mockup references `/screenshots/map.png` — needs to exist in public folder.

### `/ads/LoginForm.tsx`

**Purpose:** Multi-view form handling login, signup, email verification, forgot password, and password reset.

**Auth Flow:**
- Signup: `signUp()` (Cognito SDK) → verify view
- Login: `signIn()` (Cognito SDK) → POST `/api/auth` with `action: "cognito-login"` → redirect to dashboard
- Verify: `confirmSignUp()` (Cognito SDK) → redirect to login
- Forgot: `forgotPassword()` (Cognito SDK) → reset view
- Reset: `confirmNewPassword()` (Cognito SDK) → redirect to login

**Input Validation:**
- Password min 8 chars
- Password confirmation match
- Required fields enforced via `required` attribute

**Issues:**
- **HIGH:** Cognito SDK operations happen **client-side**. The Cognito Pool ID and Client ID are in `NEXT_PUBLIC_*` env vars (or hardcoded), which is expected for Cognito, but means the signup flow relies entirely on Cognito's password policies.
- **MEDIUM:** After successful Cognito sign-in, the full JWT tokens are sent to `/api/auth` but **the server never verifies the ID token**. It trusts the email and sub from the client payload. A malicious client could POST arbitrary email/sub values to `/api/auth` with `action: "cognito-login"`.
- **LOW:** Phone field in signup is optional and unvalidated.

### `/ads/dashboard/page.tsx`

**Purpose:** Server component that checks session and renders `DashboardClient`.

**Auth:** `getSession()` → redirect to `/ads` if not logged in.

### `/ads/dashboard/DashboardClient.tsx`

**Purpose:** Main business dashboard showing balance, stats, and ad list.

**Features:**
- Prepaid balance display with low-balance warnings
- "Add Funds" modal with preset amounts ($25, $50, $100, $250, $500) and custom input ($5-$1000)
- Stats: Active Ads, Impressions, Taps, Total Spend
- Ad cards with status, metrics, spend bar, pause/resume/edit/delete actions

**Data Operations:**
- `GET /api/ads` — business's ads with today's spend
- `GET /api/billing/balance` — prepaid balance
- `POST /api/billing/add-funds` — Stripe checkout
- `PUT /api/ads` — update ad (toggle status)
- `DELETE /api/ads?id=` — delete ad

**Issues:**
- **LOW:** `toggleAdStatus` allows toggling even rejected/pending ads to active without re-review.
- **LOW:** Delete confirmation is `window.confirm()` — not consistent with admin panel's modal approach.

### `/ads/create/page.tsx` & `CreateAdClient.tsx`

**Purpose:** Multi-step ad creation wizard (School → Details → Budget → Preview).

**Steps:**
1. Select school from list
2. Enter emoji, business name, bio (50 char limit), deal, address
3. Set daily budget ($1-$100 slider)
4. Preview and submit

**Data Operations:**
- `GET /api/ads` — to get school list and for edit mode
- `POST /api/ads` — create new ad
- `PUT /api/ads` — update existing ad (edit mode via `?edit={id}`)

**Issues:**
- **HIGH:** School list comes from `AdModel.getSchools()` which is a **hardcoded array** in `ad.ts`, NOT from the `colage-universities-dev` table. Schools added via admin panel won't appear in the ad creation wizard.
- **MEDIUM:** Edit mode loads existing ad data from the `GET /api/ads` response (which returns all business ads), then finds the matching one by ID client-side. No dedicated edit endpoint.
- **LOW:** Bio is limited to 50 chars client-side but not enforced server-side.
- **LOW:** Address geocoding happens server-side (good) but if Mapbox fails, lat/lng default to 0,0.

### `/ads/billing/page.tsx` & `BillingClient.tsx`

**Purpose:** Billing overview showing balance, today's spend, total spend, per-ad breakdown.

**Data Operations:**
- `GET /api/billing/balance` — balance
- `GET /api/ads` — ad spend data

**Features:**
- Current balance, today's spend, total spend cards
- Per-ad spend breakdown
- "Auto-Reload" placeholder (Coming Soon)

**Issues:**
- **LOW:** No transaction history. Businesses can't see past fund additions or individual charges.
- **LOW:** "Coming Soon" auto-reload feature has no implementation.

---

## 9. Ad Manager API Routes — File-by-File Analysis

### `GET/POST/PUT/DELETE /api/ads/route.ts`

**Purpose:** Full CRUD for business ads.

**Auth:** `getSession()` on all methods.

**GET:**
- Returns all ads for the business + schools list + today's spend per ad
- School list from hardcoded `getSchools()`

**POST (Create):**
- Required: `school`, `businessName`, `deal`, `dailyBudget`
- Geocodes address via Mapbox
- Budget clamped to 1-100
- **Ad ID:** `"ad-${Date.now()}"` — timestamp-based, not UUID

**Issues:**
- 🔴 **CRITICAL:** New ads are created with `status: "active"` — **bypasses the admin review queue entirely**. The admin review page exists but will always be empty because no ads ever reach "pending" status.
- **HIGH:** Ad IDs use `Date.now()` which can collide if two ads are created in the same millisecond. Should use UUID.
- **MEDIUM:** No check on business balance before creating an active ad. A business with $0 balance can create active ads.

**PUT (Update):**
- Validates ownership (`ad.businessId !== session.businessId`)
- Allowlists updateable fields (good security practice)
- Status can be updated to anything — no state machine validation

**Issues:**
- **MEDIUM:** A business can set status to "active" on a rejected ad, bypassing admin rejection.
- **LOW:** No re-geocoding when address is updated.

**DELETE:**
- Validates ownership
- Hard delete, no soft delete

### `GET/POST /api/ads/serve/route.ts`

**Purpose:** Ad serving endpoint called by the mobile app.

**Auth:** **None** — this is a public endpoint (intentional for mobile app access).

**GET Flow:**
1. Takes `school` and `student_id` params
2. Queries `school-status-index` for active ads at that school
3. Calculates CPM based on number of active ads (demand-based pricing)
4. Filters by remaining daily budget and frequency caps
5. Weighted random selection by remaining budget
6. Records impression, increments daily spend, updates ad counters
7. Returns minimal ad data (id, emoji, businessName, bio, deal, lat, lng)

**CPM Tiers:**
| Active Ads | CPM |
|-----------|-----|
| ≤ 10 | $2 |
| ≤ 30 | $3 |
| ≤ 60 | $4 |
| ≤ 100 | $5 |
| > 100 | $6 |

**POST Flow:**
- Handles "tap" events (increment tap counter)
- Handles additional "impression" events with CPM charging

**Issues:**
- 🔴 **CRITICAL:** **No balance check.** The serve endpoint charges impressions to the ad's `totalSpend` and to `DAILY_SPEND`, but **never checks or deducts from the business's prepaid balance**. A business with $0 balance will still have their ads served and incur spend.
- **HIGH:** `student_id` defaults to `"anonymous"` if not provided. All anonymous impressions share the same frequency cap bucket, meaning frequency caps are effectively broken for unauthenticated users.
- **MEDIUM:** The POST endpoint for `action: "impression"` duplicates charge logic from the GET endpoint. A malicious client could call POST with fake impression data to inflate charges on a competitor's ad.
- **MEDIUM:** No authentication on the POST endpoint — anyone can send tap/impression events for any ad.
- **LOW:** Race condition on `updateAd({ impressions: ad.impressions + 1 })` — concurrent requests could lose counts. Should use DynamoDB atomic increment.

### `POST /api/auth/route.ts`

**Purpose:** Multi-action auth endpoint for login, signup, and logout.

**Actions:**
- `cognito-login`: Creates/finds business, sets session cookie
- `login`: Legacy dev login by email only (no password!)
- `signup`: Legacy dev signup
- `logout`: Deletes session cookie

**Issues:**
- **HIGH:** `action: "login"` allows **passwordless login** — just provide an email and if a business exists, you're in. This is labeled as "dev fallback" but there's no guard against production use.
- **HIGH:** `action: "cognito-login"` **does not verify the JWT tokens**. It receives `idToken`, `email`, `sub` from the client and trusts them entirely. A malicious request could log in as any business by providing a known sub/email.
- **MEDIUM:** `action: "signup"` allows creating business accounts without any email verification (bypasses Cognito).
- **LOW:** Legacy login cookie doesn't set `secure: process.env.NODE_ENV === "production"`.

### `POST /api/billing/add-funds/route.ts`

**Purpose:** Creates a Stripe Checkout session for adding prepaid credits.

**Auth:** `getSession()` — properly gated.

**Input Validation:**
- Amount must be number, $5-$1000
- Checks `STRIPE_SECRET_KEY` exists

**Data Operations:**
- `createCheckoutSession(businessId, email, amount)` — creates Stripe session

**Issues:**
- **LOW:** Good validation and error handling here. Stripe key check is appropriate.

### `GET /api/billing/balance/route.ts`

**Purpose:** Returns the business's prepaid balance.

**Auth:** `getSession()` — properly gated.

**Data Operations:**
- `getBusiness(session.businessId)` → returns `balance` field

**Issues:**
- **LOW:** Returns 0 if business not found instead of 404. Minor.

### `POST /api/billing/webhook/route.ts`

**Purpose:** Stripe webhook handler for `checkout.session.completed` events.

**Auth:** Stripe signature verification (correct approach).

**Flow:**
1. Verify webhook signature
2. Extract `businessId` and `creditAmount` from session metadata
3. Add `creditAmount` to business's `balance` field

**Issues:**
- **HIGH:** **Non-atomic balance update.** Reads current balance, adds credit, writes new balance. Concurrent webhooks for the same business could lose credits. Should use DynamoDB `ADD` atomic operation or conditional write.
- **MEDIUM:** No idempotency check. If Stripe retries the webhook (which it does), the same payment could be credited multiple times.
- **MEDIUM:** `STRIPE_WEBHOOK_SECRET!` uses non-null assertion — if the env var is missing, the app crashes on first webhook.
- **LOW:** Only handles `checkout.session.completed`. No handling for refunds, disputes, or failed payments.

---

## 10. Shared Libraries — File-by-File Analysis

### `lib/admin-auth.ts`

**Purpose:** Admin authorization checks.

**Functions:**
- `isAdmin(email)` — checks against hardcoded `ADMIN_EMAILS`
- `requireAdmin()` — gets session + checks admin; throws Response on failure
- `checkAdmin()` — safe boolean check, swallows errors

**Issues:**
- **MEDIUM:** Admin list is hardcoded. No way to add/remove admins without code deploy.
- **LOW:** `requireAdmin()` throws `Response` objects, which is an unusual pattern for Next.js App Router. Works with the try/catch pattern used in routes but is non-standard.

### `lib/auth.ts`

**Purpose:** Business session cookie management.

**Functions:**
- `getSession()` — reads and parses `colage_biz_session` cookie
- `setSession(session)` — writes session cookie
- `setTokens(access, id, refresh?)` — stores Cognito tokens in separate cookies
- `getAccessToken()` / `getRefreshToken()` — read token cookies
- `logout()` — deletes all cookies

**Issues:**
- **HIGH:** Session cookie is plain JSON. No signing (HMAC), no encryption, no JWT. Anyone who can read/modify cookies can impersonate any business by crafting a `colage_biz_session` cookie.
- **MEDIUM:** `setTokens()` is called from `LoginForm` but the tokens are never used anywhere. They're stored but never read or refreshed.
- **LOW:** 30-day session expiry with no renewal mechanism.

### `lib/cognito-business.ts`

**Purpose:** Cognito SDK wrapper for business auth operations.

**Functions:** signUp, confirmSignUp, resendCode, signIn, forgotPassword, confirmNewPassword, getCurrentSession, signOut

**Issues:**
- **MEDIUM:** Pool ID and Client ID are hardcoded as fallbacks. If env vars aren't set, falls back silently to hardcoded values.
- **LOW:** `getCurrentSession()` returns `Promise<AuthResult | null>` but is never called anywhere in the codebase. Dead code.

### `lib/db.ts`

**Purpose:** DynamoDB client configuration and table name constants.

**Config:** Region `us-east-2`, default credential chain, `removeUndefinedValues: true`.

**Tables constant:** 8 tables defined including `CONNECTIONS` which has no model.

**Issues:**
- **LOW:** All tables use `-dev` suffix. No environment-based table naming (dev/staging/prod).

### `lib/stripe.ts`

**Purpose:** Stripe client and checkout session creation.

**Functions:**
- `createOrGetCustomer(businessId, email)` — creates/caches Stripe customer ID on business
- `createCheckoutSession(businessId, email, creditAmount)` — creates checkout with fee calculation
- `getCustomerBalance(stripeCustomerId)` — **always returns 0** (dead function)

**Fee Calculation:**
```
total = (creditAmount + 0.30) / (1 - 0.029)
fee = total - creditAmount
```
Passes Stripe's 2.9% + $0.30 fee to the customer via a separate line item.

**Issues:**
- **MEDIUM:** `getCustomerBalance()` always returns 0 and has a comment saying "We use our own balance tracking in DynamoDB instead." Dead function.
- **LOW:** `stripe` is initialized even if `STRIPE_SECRET_KEY` is missing (uses `"sk_missing"`). Will fail on first API call.
- **LOW:** `session.url!` non-null assertion — could be null if checkout session creation fails in certain modes.

### `lib/models/ad.ts`

**Purpose:** Ad CRUD with DynamoDB + in-memory fallback.

**Key Pattern:** Every model uses a `tryDynamo(dynamoFn, memoryFn)` pattern that falls back to an in-memory `Map` if DynamoDB is unavailable. This is clever for local dev but dangerous in production.

**Functions:** getAd, getAdsByBusiness, getAdsBySchoolAndStatus, createAd, updateAd, deleteAd, getSchools

**Issues:**
- **HIGH:** `getSchools()` returns a **hardcoded array** of 4 schools with fake student counts. This is used by the ad creation flow instead of querying `colage-universities-dev`. New schools added by admins won't appear.
- **MEDIUM:** In-memory fallback persists for the lifetime of the server process. If DynamoDB is temporarily down, the app switches to in-memory and stays there permanently. Data will be lost on restart.
- **MEDIUM:** `useMemory` is module-level state. In serverless environments (Vercel), this could behave unexpectedly as instances are reused.
- **LOW:** Demo seed data (`demo-ad-1` for "Blue Brew Coffee") is always loaded into the in-memory store.

### `lib/models/business.ts`

**Purpose:** Business CRUD with same DynamoDB/memory fallback pattern.

**Issues:** Same as ad.ts regarding in-memory fallback risks.

### `lib/models/daily-spend.ts`

**Purpose:** Daily spend tracking per ad.

**Functions:** getDailySpend, incrementDailySpend, getSpendForAds

**Issues:**
- **MEDIUM:** `getSpendForAds()` loops through ad IDs sequentially (`for...of` with `await`). Should use BatchGetItem or parallel Promise.all for performance.

### `lib/models/impression.ts`

**Purpose:** Impression recording and frequency cap checking.

**Frequency Caps:**
- Max 200 impressions per student per ad per hour
- Max 1000 impressions per student per ad per day

**Issues:**
- **MEDIUM:** Frequency caps are extremely generous (200/hour, 1000/day per student per ad). Labeled "generous for early testing." Should be tightened before production.
- **LOW:** Two separate DynamoDB queries per frequency check (hourly + daily). Could be combined.

### `lib/models/location.ts`

**Purpose:** Read-only location model.

**Issues:**
- **LOW:** No write operations — locations are presumably written by the Lambda backend/mobile app.

### `lib/models/university.ts`

**Purpose:** University CRUD.

**Functions:** getUniversity, getAllUniversities, getTotalUniversityCount, createUniversity

**Issues:**
- **LOW:** `getAllUniversities()` uses Scan — fine for small number of schools but won't paginate.

### `lib/models/user.ts`

**Purpose:** User model with comprehensive CRUD + search.

**Functions:** getUser, getUsersBySchool, getUserCountBySchool, scanUsers, getTotalUserCount, updateUserStatus, deleteUser

**Notable:** `getUserDisplayName()` helper handles both `displayName` and `name` fields — accounts for mobile app field naming inconsistency.

**Issues:**
- **MEDIUM:** `scanUsers` with search does client-side filtering after DynamoDB returns results. Search doesn't work well with pagination.
- **LOW:** Two different photo fields (`photoUrl`, `profilePhotoURL`) — mobile app inconsistency.

---

## 11. Admin UI Components

### `AdminModal.tsx`

Clean modal with overlay click-to-close and Escape key handler. No issues.

### `AdminSearch.tsx`

Debounced search input (300ms default). Clean implementation. No issues.

### `AdminStatCard.tsx`

Simple stat card with optional trend indicator. Clean. No issues.

### `AdminTable.tsx`

Generic sortable table component. Client-side sort using `localeCompare` with numeric option.

**Issues:**
- **LOW:** Sort uses string comparison for all values. Numeric columns sort correctly due to `{ numeric: true }` option, but dates may not sort correctly if not in ISO format.

---

## 12. Ad Lifecycle

### Expected Flow
```
Draft → Pending → [Admin Review] → Active ←→ Paused
                                  → Rejected
                 Active → Completed (budget exhausted?)
```

### Actual Flow
```
[Business creates ad] → Active (immediately!)
                      ← → Paused (toggle by business)
                      
[Admin can review] → but nothing is ever "pending"
```

**Major Gap:** The review workflow exists in the admin UI but is **never triggered** because `POST /api/ads` creates ads with `status: "active"`. There's no code path that sets `status: "pending"`.

### Status Transitions
- Business can toggle: `active ↔ paused`
- Business can set **any** status via PUT (no state machine)
- Admin can set: `pending → active` or `pending → rejected`
- No "completed" transition exists anywhere

---

## 13. Billing Flow

### Fund Addition
```
Business clicks "Add Funds" → selects amount
→ POST /api/billing/add-funds (creates Stripe Checkout)
→ Stripe Checkout page
→ Payment success → redirect to /ads/dashboard?funded=true
→ Stripe webhook → POST /api/billing/webhook
→ checkout.session.completed → credit business.balance
```

### Spend Tracking
```
Mobile app calls GET /api/ads/serve?school=X&student_id=Y
→ Ad selected by weighted random (remaining budget)
→ recordImpression() — writes to colage-impressions-dev
→ incrementDailySpend() — increments colage-daily-spend-dev
→ updateAd({ impressions++, totalSpend+= }) — updates colage-ads-dev
```

### 🔴 Missing: Balance Deduction

**The business's `balance` field is ONLY modified by the webhook (adding funds). It is NEVER decremented when impressions are served.** This means:
- A business adds $50, balance shows $50
- Ads serve and accumulate $50 in totalSpend
- Balance still shows $50
- Business can continue spending infinitely

The `daily_spend` table and `ad.totalSpend` track what was spent, but the business's available balance is never reduced.

### Fee Passthrough

Stripe's 2.9% + $0.30 is passed to the advertiser as a separate "Processing Fee" line item in the checkout. So if they want $25 in credits, they pay ~$26.03.

---

## 14. Security Posture

### Authentication Summary

| System | Method | Strength |
|--------|--------|----------|
| Admin login | GET request with email only | 🔴 Critical — no password |
| Admin session | Check `colage_biz_session` cookie | 🟡 Medium — requires Cognito login with admin email |
| Business login | Cognito (client-side) → cookie | 🟡 Medium — JWT not verified server-side |
| Business session | Plain JSON cookie | 🔴 Critical — forgeable |
| Ad serving | No auth | ✅ Expected (public API) |
| Billing webhook | Stripe signature | ✅ Good |

### Session Security

- **No CSRF protection** — SameSite=Lax mitigates some attacks but not all
- **No cookie signing** — plain JSON can be forged
- **30-day session** — very long, no renewal or rotation
- **No token refresh** — Cognito tokens stored but never refreshed

### Input Validation

| Route | Validation |
|-------|-----------|
| Ad creation | Missing field check, budget clamped 1-100 |
| Ad review | Decision must be approve/reject |
| User action | Action must be suspend/unsuspend/ban/delete |
| Billing | Amount 5-1000, must be number |
| School creation | Domain and name required |
| Auth | Varies by action, generally minimal |

### What's Missing

- **No rate limiting** on any endpoint
- **No CORS configuration** visible (relies on Next.js defaults)
- **No Content-Security-Policy headers**
- **No request size limits** (beyond Next.js defaults)
- **No SQL/NoSQL injection protection** (DynamoDB SDK handles this, but no input sanitization)
- **No XSS prevention** beyond React's default escaping
- **No audit logging** for admin actions

---

## 15. Cross-Cutting Issues

### Code Duplication

1. **Add School form** — duplicated in `/admin/schools/page.tsx` and `/admin/settings/page.tsx`
2. **School list** — `getSchools()` hardcoded in `ad.ts` vs. `getAllUniversities()` from DynamoDB
3. **Admin email list** — hardcoded in `admin-auth.ts` AND displayed in `/admin/settings/page.tsx`
4. **CPM calculation** — `getCPM()` defined only in `/api/ads/serve/route.ts`, not reusable
5. **Display name logic** — `getDisplayName()` / `getUserDisplayName()` implemented in multiple places

### In-Memory Fallback Pattern

Every model has a `tryDynamo / memoryFn` pattern. Once the `useMemory` flag is set (on first DynamoDB error), it stays set for the process lifetime. This means:
- Data written to memory store will be lost on restart
- Data in DynamoDB won't be read once fallback is active
- In serverless, different instances may have different states

### Website vs. Lambda Backend

The mobile app likely has its own Lambda backend (separate repo). There's potential overlap:
- User and location management probably lives in the Lambda
- Ad serving endpoint (`/api/ads/serve`) could duplicate Lambda ad logic
- The `colage-connections-dev` table is referenced but has no model — probably managed by Lambda
- User fields like `profilePhotoURL` vs `photoUrl` suggest different backends writing to the same table

### Inconsistent Styling

- Admin panel: Tailwind CSS with dark theme (#0A0A0A, #1A1A1A, etc.)
- Ad manager: Inline styles with warm cream theme (#F9F6F2, #E8E3DB, etc.)
- These are intentionally different audiences but the ad manager should probably use Tailwind too

---

## 16. Missing Functionality & TODOs

1. **Balance deduction on impression** — Critical missing business logic
2. **Ad review workflow** — Pending status never set
3. **Ad completion** — No mechanism to mark ads as "completed"
4. **Auto-reload** — UI placeholder exists, no implementation
5. **Transaction history** — No record of individual charges or fund additions
6. **Notification system** — No email notifications for ad approval/rejection, low balance
7. **Business profile editing** — No way to update business info after signup
8. **School editing/deletion** — Admin can add but not edit or delete schools
9. **Admin management** — No way to add/remove admins without code changes
10. **Feature flags** — Display-only placeholders, non-functional
11. **Reporting/export** — No CSV/PDF export of revenue or analytics data
12. **Ad analytics** — No time-series view of individual ad performance
13. **Logo/image upload** — `logoUrl` field exists on Business but no upload mechanism
14. **Proper admin auth** — Need password-based or OAuth admin login
15. **Token refresh** — Cognito tokens stored but never refreshed

---

## 17. Issues Summary

### 🔴 CRITICAL (4)

| # | Location | Issue |
|---|----------|-------|
| C1 | `/api/admin/login` | GET endpoint authenticates admins with no password — anyone with the email can log in |
| C2 | `/api/admin/login` | Cookie name mismatch (`colage_session` vs `colage_biz_session`) — admin login is broken |
| C3 | `/api/ads` POST | New ads created as `status: "active"` — bypasses entire admin review workflow |
| C4 | `/api/ads/serve` | No balance check or deduction — businesses can spend infinitely regardless of prepaid balance |

### 🟠 HIGH (9)

| # | Location | Issue |
|---|----------|-------|
| H1 | `lib/auth.ts` | Session cookie is unsigned plain JSON — trivially forgeable |
| H2 | `/api/auth` | `cognito-login` action doesn't verify JWT — trusts client-provided email/sub |
| H3 | `/api/auth` | `login` action allows passwordless access with just an email |
| H4 | `/api/admin/login` | `secure` flag not set on session cookie |
| H5 | `/api/admin/stats` | Full table scan of DAILY_SPEND on every dashboard load — will become expensive |
| H6 | `/api/admin/users/[userId]/action` | Hard delete with no soft-delete, no cascade, no undo |
| H7 | `/api/billing/webhook` | Non-atomic balance update — concurrent webhooks can lose credits |
| H8 | `lib/models/ad.ts` | `getSchools()` is hardcoded — admin-added schools don't appear in ad creation |
| H9 | `/api/ads` POST | Ad IDs use `Date.now()` — collision risk under concurrent requests |

### 🟡 MEDIUM (14)

| # | Location | Issue |
|---|----------|-------|
| M1 | `/api/auth` | Cognito signup creates unverified business accounts (legacy flow) |
| M2 | `/api/ads/serve` POST | No auth — anyone can send fake tap/impression events |
| M3 | `/api/ads` PUT | Business can set rejected ad back to "active" |
| M4 | `/api/admin/ads/[adId]/review` | Approval doesn't check business balance |
| M5 | `/api/admin/schools` POST | No duplicate domain check, no domain format validation |
| M6 | `/api/admin/schools` GET | N+1 query pattern for user counts |
| M7 | `/api/admin/users` | Search filters client-side after DynamoDB limit |
| M8 | `/api/billing/webhook` | No idempotency — Stripe retries can double-credit |
| M9 | `/api/billing/webhook` | `STRIPE_WEBHOOK_SECRET!` crashes if env var missing |
| M10 | Admin settings | Feature flags are non-functional display-only |
| M11 | Admin settings + schools | Add School form duplicated in two pages |
| M12 | User detail | Delete doesn't cascade to impressions, locations, connections |
| M13 | `lib/models/impression.ts` | Frequency caps very generous (200/hr, 1000/day) |
| M14 | All models | In-memory fallback is permanent once triggered, causes data loss |

### 🟢 LOW (11)

| # | Location | Issue |
|---|----------|-------|
| L1 | All pages | Empty `catch(() => {})` blocks hide errors from users |
| L2 | Multiple | No loading skeletons — plain "Loading..." text |
| L3 | Admin sidebar | No logout button or active user display |
| L4 | Admin ads | No rejection reason UI despite API support |
| L5 | User detail | Location shows raw coordinates, no reverse geocoding |
| L6 | School detail | No pagination for users at a school |
| L7 | `lib/db.ts` | All tables use `-dev` suffix with no environment switching |
| L8 | `lib/stripe.ts` | `getCustomerBalance()` always returns 0 — dead code |
| L9 | Ad creation | Bio length enforced client-side only |
| L10 | `/api/ads/serve` | Race condition on impression counter increment |
| L11 | Billing | No transaction history for businesses |

---

*End of audit. This document covers the complete admin panel and ad manager system as of the current codebase state.*

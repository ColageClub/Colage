# Colage Ad System — Full Plan

## Overview

Daily-budget ad platform. Businesses prepay funds, set a daily budget, and their ads show to students at their chosen school. Server picks which ad to show based on budget weight + frequency capping. Stripe handles all money.

---

## 1. The Ad Creative (Keep As-Is)

Simple — no images, no URLs, no click-throughs:

- **Logo emoji** (☕🍕🏋️📚 — from a picker)
- **Business name** ("Blue Brew Coffee")
- **Bio/tagline** ("Student-favorite coffee shop since 2019" — 50 char max)
- **Deal** ("15% off any drink — show this ad")
- **Business address** — street, city, state, zip → geocoded to lat/lng via Mapbox
- **Distance** (calculated client-side from student location + business lat/lng)

**Banner on map:** Shows emoji + name + deal in a compact glass row
**Tap to expand:** Full detail sheet with deal card, "Get Directions" button, "Screenshot to redeem"

No links. No websites. Screenshot the deal, show it at checkout.

---

## 2. What Changes from Current Website

1. **School selection → ONE school only** (currently allows multiple)
2. **Business address field** (new — needed for distance calculation)
3. **Daily budget with Stripe prepaid balance** (currently just a slider with no payment)
4. **Real persistence** (currently in-memory, resets on deploy)
5. **Served to mobile apps** (currently hardcoded MockAds)

---

## 3. Business Flow

1. **Sign up** on `colageclub.com/ads` (email + password)
2. **Create Business Profile** — name, category
3. **Add Funds** — prepaid balance via Stripe Checkout ($25 / $50 / $100 / $250 / $500 / custom)
4. **Create Ad:**
   - Step 1: Pick ONE school from active schools list
   - Step 2: Emoji, business name, bio (50 chars), deal, **business address**
   - Step 3: Set daily budget ($1–$100/day slider)
   - Step 4: Preview (the exact banner + expanded sheet students see) → Launch
5. **Ad goes live** after review

---

## 4. Daily Budget & Serving (50-100 Businesses Per School)

### Ad Serving

Each time a student needs an ad:

```
App → GET /ads/serve?school=umich.edu&student_id=abc123
```

Server:
1. Pull all **active** ads for that school with remaining daily budget
2. Check **frequency cap** (student hasn't seen this ad 3+ times this hour)
3. **Weight by remaining daily budget** — $50/day ad gets ~10x the picks of a $5/day ad
4. Weighted random pick → return one ad (includes business lat/lng)
5. Log impression, deduct from that ad's daily budget allocation

App:
- Calculates distance client-side: `haversine(student lat/lng, business lat/lng)`
- Displays distance badge on banner
- "Get Directions" opens native Maps to business address

### Pacing

Daily budget spread across 16 hours (7am–11pm school timezone). Unspent hourly budget rolls forward. Prevents blowing entire budget by 9am.

### Frequency Caps

- Max 3 impressions per student per ad per hour
- Max 10 per student per ad per day
- Guarantees variety across 50-100 advertisers

### Rotation

App requests new ad every 30 seconds while the banner is visible.

---

## 5. Billing

- **Prepaid balance** on Stripe (Customer Balance)
- Business loads funds → Stripe Checkout → webhook credits balance
- **Nightly job** tallies each ad's impressions, calculates cost (impressions × CPM ÷ 1000), deducts from balance
- **Base CPM scales with demand per school:**
  - 1-10 advertisers: $2
  - 11-30: $3
  - 31-60: $4
  - 61-100: $5
  - 100+: $6
- Daily charge capped at the ad's daily budget (never overspend)
- **Auto-reload option:** "Add $X when balance drops below $Y"
- Balance < $10 → email warning
- Balance = $0 → all ads pause
- **No contracts** — pause or stop anytime

### Prepaid Fund Tiers

$25 / $50 / $100 / $250 / $500 / Custom amount

Why prepaid: Fewer Stripe fees (one $100 charge vs twenty $5 charges), businesses feel invested, no daily charge failures.

---

## 6. Ad Lifecycle

| Status | Meaning |
|--------|---------|
| **Draft** | Created, not submitted |
| **Pending Review** | Submitted, awaiting approval |
| **Active** | Live, spending budget |
| **Paused** | By business or auto (no funds) |
| **Completed** | End date reached |
| **Rejected** | Failed review |

---

## 7. Business Dashboard

- **Balance** (big number) + "Add Funds" button
- **Active ads** with today's spend / remaining budget / impressions
- **Per-ad stats:** daily impressions, taps, CTR, chart over time
- **Billing history:** deposits + daily charges
- Pause / Resume / Edit / End buttons per ad
- Auto-reload settings

---

## 8. Admin/Moderation (Our Side)

- Review queue for pending ads
- Approve / reject with reason
- See all active ads by school
- Revenue dashboard: total daily revenue, revenue per school, top spenders
- Ability to pause/ban a business

---

## 9. Technical Architecture

### New DynamoDB Tables

- `businesses` — profile, Stripe customer ID, balance cache
- `ads` — emoji, name, bio, deal, school, daily budget, status, schedule, **address, lat, lng**
- `impressions` — student_id, ad_id, timestamp (TTL: 30 days)
- `daily_spend` — ad_id, date, impressions count, amount charged

### New/Updated Lambda Functions

- `POST /ads` — create ad (update existing)
- `GET /ads/serve` — serve one ad to student (weighted picker + frequency cap)
- `POST /ads/{id}/impression` — log impression
- `POST /billing/add-funds` — Stripe Checkout session
- `POST /billing/webhook` — Stripe webhook → credit balance
- **EventBridge cron** — nightly billing job

### Address Geocoding

- On ad creation, geocode business address to lat/lng via Mapbox Geocoding API
- Store lat/lng in the ads table
- Serve lat/lng with the ad so app can calculate distance client-side

### Stripe Objects

- Customer (per business)
- Checkout Session (add funds)
- Customer Balance Transactions (credits/debits)

### S3

No new bucket needed — no images, just emojis

### EventBridge

- Nightly billing cron (midnight per timezone)
- Hourly budget pacing check

---

## 10. Pricing Summary for Businesses

| | |
|---|---|
| **Minimum daily budget** | $1/day |
| **Minimum fund deposit** | $25 |
| **Base CPM** | $2–$6 (scales with demand) |
| **Billing** | Prepaid balance, charged daily |
| **Auto-reload** | Optional |
| **Contract** | None — pause or stop anytime |

---

## 11. Build Order

1. **DynamoDB tables** — businesses, ads, impressions, daily_spend
2. **Stripe setup** — Customer creation, Checkout for prepaid balance, webhook
3. **Ad CRUD API** — create/update/list/pause with real persistence
4. **Ad serving endpoint** — weighted picker + frequency capping
5. **Nightly billing Lambda** — tally impressions, charge balances via Stripe
6. **Update website** — single school selection, address field, Stripe payment, real dashboard stats
7. **Wire mobile apps** — replace MockAds with `GET /ads/serve`, client-side distance calc
8. **Admin panel** — approve/reject queue

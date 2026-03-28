# Colage Landing Page — Comprehensive Audit

> Generated: 2026-03-28
> Scope: Landing page (`/`), all landing components, shared components
> Codebase: `/Users/amcarbonaro/Projects/Colage/website/`

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Page Structure & Section Ordering](#page-structure--section-ordering)
3. [File-by-File Analysis](#file-by-file-analysis)
   - [Core Files](#core-files)
   - [Landing Components](#landing-components)
   - [Shared Components](#shared-components)
4. [Cross-Cutting Analysis](#cross-cutting-analysis)
5. [Issue Tracker](#issue-tracker)
6. [Recommendations](#recommendations)

---

## Executive Summary

The Colage landing page is a well-designed, modern marketing site built with **Next.js (App Router)**, **Framer Motion**, and **Three.js** (for the hero). The design language is premium — Cormorant Garamond serif headings, DM Sans body text, crimson accent color (#A51C30), and generous whitespace. The page follows a clear narrative arc: Hero → About → How It Works → Feature deep-dives → Alumni → Privacy → Schools → Testimonials → Business → FAQ → Footer CTA.

**What's working well:**
- Strong visual identity with consistent typography and color
- Good use of scroll-triggered animations via Framer Motion's `useInView`
- Clean component architecture with reusable `SectionWrapper`, `SectionHeading`, `FeatureRow`
- Proper Next.js font optimization with `next/font/google`
- OpenGraph and Twitter Card metadata
- Mobile menu implementation
- All referenced screenshot assets exist in `/public`

**What needs attention:**
- 6 dead/unused components (including FeatureSection, all shared components)
- Two duplicate PhoneMockup components (neither is used on landing)
- Accessibility gaps (no skip-nav, missing aria labels, emoji-only icons)
- `<img>` tags used instead of `next/image` (no optimization)
- Inline styles everywhere instead of Tailwind or CSS modules
- Three.js LogoTunnel creates textures via DOM canvas (hydration-sensitive)
- No lazy loading of below-fold sections
- Download/store links are all `href="#"` placeholders

---

## Page Structure & Section Ordering

```
<main>
  1. Navbar           — Fixed, transparent → white on scroll
  2. HeroSection      — Full-viewport, Three.js tunnel + color blobs
  3. AboutSection     — FeatureRow: text + phone screenshot (profile)
  4. HowItWorksSection — 3-step grid on off-white bg
  5. MapSection       — FeatureRow reversed: text + phone screenshot (map)
  6. ListSection      — FeatureRow: text + phone screenshot (list)
  7. ARSection        — FeatureRow reversed: text + phone screenshot (AR)
  8. AlumniSection    — Dark bg, text + animated globe visual
  9. PrivacySection   — 2x2 grid of privacy features, off-white bg
  10. SchoolShowcase  — Interactive school pill selector + colored card
  11. TestimonialsSection — 3-column testimonial cards
  12. BusinessSection — Centered CTA for advertisers
  13. FAQSection      — Accordion FAQ
  14. FooterCTA       — Dark footer with download buttons + footer links
</main>
```

The flow is logical: hook (hero) → what is it (about) → how it works → feature showcase → trust (alumni, privacy) → social proof (schools, testimonials) → monetization (business) → objection handling (FAQ) → final CTA.

---

## File-by-File Analysis

### Core Files

#### `src/app/layout.tsx`

**Purpose:** Root layout. Sets up fonts and metadata.

**Fonts:**
- Cormorant Garamond (serif, `--font-cormorant`) — weights 300-700
- DM Sans (sans, `--font-dm-sans`) — weights 300-700
- Both use `display: "swap"` ✅

**Metadata:**
- Title: "Colage — Be You."
- Description: Social discovery app for college students
- OpenGraph: title, description, url, siteName, type ✅
- Twitter: card (summary_large_image), title, description ✅

**Issues:**
- ⚠️ **MEDIUM** — No `og:image` or `twitter:image` defined. Social sharing will have no preview image.
- ⚠️ **LOW** — No `viewport` meta tag (Next.js App Router provides a default, but explicit is better for mobile).
- ⚠️ **LOW** — No `robots` meta, no `canonical` link.
- ⚠️ **LOW** — No favicon link (relies on Next.js default `/favicon.ico`).

---

#### `src/app/page.tsx`

**Purpose:** Home page. Imports and composes all landing sections.

**Props:** None (server component by default — no `"use client"`).

**Observations:**
- Clean composition — each section is its own component
- No props drilling, each component is self-contained
- `FeatureSection` is NOT imported here (dead code)
- Uses `<main>` as root element ✅

**Issues:**
- ⚠️ **LOW** — No `<h1>` visible at page level; the `<h1>` is inside HeroSection. Semantically fine but worth noting.

---

#### `src/app/globals.css`

**Purpose:** Global styles, Tailwind import, theme tokens, utility classes.

**Theme tokens:**
- `--color-crimson: #A51C30` (primary)
- `--color-crimson-dark: #8C1515`
- `--color-crimson-light: #C23B4A`
- `--color-dark: #1E1E1E`
- `--color-warm-gray: #6B6B6B`
- `--color-off-white: #F9F6F2`
- `--color-light-gray: #E8E3DB`
- Font variables for serif and sans

**Utility classes:** `section-inner`, `grid-3`, `grid-2`, `flex-row-wrap`, `flex-row-wrap-reverse`, `flex-child`

**Responsive:** Breakpoint at 768px collapses grids to single column, reduces padding, hides `.hide-mobile`.

**Issues:**
- ⚠️ **MEDIUM** — Custom utility classes (`grid-3`, `flex-row-wrap`) duplicate what Tailwind already provides. Mixed paradigm: some components use Tailwind classes, others use these globals, others use inline styles.
- ⚠️ **LOW** — `!important` used on `.section-wrapper` padding at mobile breakpoint.
- ⚠️ **LOW** — Custom scrollbar styling only works in WebKit browsers.
- ⚠️ **LOW** — `* { margin: 0; padding: 0 }` reset is redundant with Tailwind's preflight.

---

### Landing Components

#### `Navbar.tsx`

**Purpose:** Fixed navigation bar that transitions from transparent to white on scroll.

**State:** `scrolled` (boolean, scroll > 50px), `open` (mobile menu toggle)

**Links:** About, Features (#map), Alumni, Schools, FAQ, Ad Manager (/ads), Download (#)

**Animations:**
- Initial slide-down via Framer Motion (`y: -80 → 0`)
- Background/shadow transition on scroll via inline styles
- Mobile menu fade in/out via AnimatePresence

**Mobile handling:**
- Hamburger button hidden on desktop via `nav-mobile-btn` class
- Desktop links hidden on mobile via `nav-desktop` class
- Full-screen mobile overlay menu
- Uses `<style jsx global>` for media queries

**Issues:**
- 🔴 **HIGH** — Mobile hamburger button has no `aria-label`, no `aria-expanded` attribute. Screen readers can't identify it.
- 🔴 **HIGH** — Mobile menu overlay has no close button visible (must click links or the hamburger behind it). The hamburger is behind the overlay (`z-index: 40` overlay vs `z-index: 50` nav).
- ⚠️ **MEDIUM** — `onMouseEnter`/`onMouseLeave` inline style manipulation for hover effects. Should use CSS `:hover` or Tailwind.
- ⚠️ **MEDIUM** — Download button `href="#"` is a placeholder — no actual link.
- ⚠️ **LOW** — `<style jsx global>` is a styled-jsx pattern; mixing it with Tailwind and inline styles adds a third styling paradigm.
- ⚠️ **LOW** — Logo link `href="#"` should be `href="/"` for proper home navigation.

---

#### `HeroSection.tsx`

**Purpose:** Full-viewport hero with animated color blobs, Three.js LogoTunnel, headline "Be You.", subtitle, and CTA buttons.

**Animations:**
- 5 animated gradient blobs (Framer Motion, infinite loop, 18-25s cycles)
- Three.js LogoTunnel (dynamically imported, SSR disabled) ✅
- Content fade-in with staggered delays (0.3s, 0.7s, 1.1s)
- Scroll indicator with bounce animation

**Dependencies:** `framer-motion`, `./LogoTunnel` (dynamic import)

**Issues:**
- ⚠️ **MEDIUM** — 5 animated blobs with `filter: blur(80px)` on large `vw` elements is GPU-intensive. On lower-end devices this could cause jank.
- ⚠️ **MEDIUM** — No `<h1>` semantic consideration — the "Be You." heading IS the page's `<h1>`, which is correct, but it's buried in a section rather than being prominent in the document flow.
- ⚠️ **LOW** — CTA buttons use `<a>` tags with hover effects but no keyboard focus styles.
- ⚠️ **LOW** — Scroll indicator is decorative but has no `aria-hidden="true"`.

---

#### `LogoTunnel.tsx`

**Purpose:** Three.js scene showing university name labels flying through a tunnel toward the camera.

**Dependencies:** `@react-three/fiber`, `three`

**Universities listed:** 40 (MIT, Stanford, Harvard, Yale, etc.)

**Technical details:**
- Creates canvas textures via `document.createElement("canvas")` for each university
- Renders plane geometries with transparent text sprites
- Continuous `useFrame` animation loop moving planes toward camera, recycling at z > 2

**Issues:**
- 🔴 **HIGH** — `makeTexture()` uses `document.createElement("canvas")` which is called during render/useMemo. While the component is dynamically imported with `ssr: false`, this is still fragile. If SSR were ever enabled, it would crash.
- ⚠️ **MEDIUM** — 40 textures created upfront. Each is a 256×128 canvas. Not enormous but not trivial.
- ⚠️ **MEDIUM** — No cleanup of Three.js textures/geometries on unmount. Potential memory leak.
- ⚠️ **LOW** — Font in canvas (`DM Sans`) may not be loaded when texture is created, causing fallback font rendering.
- ⚠️ **LOW** — The `ref` callback `ref={(el) => { if (el) meshRefs.current[i] = el; }}` is fine but creates a new function each render.

---

#### `AboutSection.tsx`

**Purpose:** "Discover the people around you." section with profile screenshot.

**Uses:** `FeatureRow` from `Section.tsx`, `ScreenshotPhone`

**Screenshot:** `/screenshots/profile.png` ✅ (exists, 179KB)

**Issues:** None significant. Clean delegation to reusable components.

---

#### `Section.tsx` (SectionWrapper, SectionHeading, FeatureRow)

**Purpose:** Reusable layout primitives for the landing page. This is the backbone.

**Exports:**
- `SectionWrapper` — Padded section with background color
- `SectionHeading` — Centered badge + title + subtitle with scroll animation
- `FeatureRow` — Two-column text + visual layout with scroll animations

**Animations:** All use `useInView` with `once: true` and `-80px` margin.

**Issues:**
- ⚠️ **LOW** — `textTransform: "uppercase" as const` — the `as const` is unnecessary for a string literal in a style object.
- ✅ Good abstraction — most sections use these primitives consistently.

---

#### `FeatureSection.tsx`

**Purpose:** Alternative feature row component using Tailwind classes.

**Status:** 🔴 **DEAD CODE** — Not imported anywhere in the codebase. This appears to be an earlier version of `FeatureRow` from `Section.tsx` that was replaced but never deleted.

**Differences from FeatureRow:**
- Uses Tailwind classes instead of CSS utility classes
- Has a `subtitle` prop (unused in FeatureRow)
- Uses `bgClass` string instead of `bg` color value
- Has a `cormorant` font-family inline reference (`var(--font-cormorant)`) vs FeatureRow using `var(--font-serif)`

**Issues:**
- 🔴 **HIGH** — Dead code. Should be deleted.

---

#### `HowItWorksSection.tsx`

**Purpose:** Three-step onboarding explanation (sign up → join school → discover).

**Uses:** `SectionWrapper`, `SectionHeading`, `grid-3` CSS class.

**Animations:** Cards fade-in with staggered delays (0.15s each).

**Issues:**
- ⚠️ **MEDIUM** — Emoji used as icons (📧, 🎓, 📍). These render differently across platforms and are not accessible to screen readers as meaningful icons. Consider using SVG icons with `aria-label`.
- ⚠️ **LOW** — Step numbers rendered with very low opacity (`rgba(165,28,48,0.2)`) — decorative, which is fine, but adds visual noise.

---

#### `MapSection.tsx`

**Purpose:** "See who's around you in real time." feature row with map screenshot.

**Uses:** `FeatureRow` (reversed), `ScreenshotPhone`

**Screenshot:** `/screenshots/map.png` ✅ (exists, 769KB)

**Issues:**
- ⚠️ **MEDIUM** — `map.png` is 769KB. Should be optimized (WebP/AVIF) or served via `next/image`.

---

#### `ListSection.tsx`

**Purpose:** "Browse your campus." feature row with list screenshot.

**Uses:** `FeatureRow`, `ScreenshotPhone`

**Screenshot:** `/screenshots/list.png` ✅ (exists, 369KB)

**Issues:** None significant.

---

#### `ARSection.tsx`

**Purpose:** "Discover in augmented reality." feature row with AR screenshot.

**Uses:** `FeatureRow` (reversed), `ScreenshotPhone`

**Screenshot:** `/screenshots/ar.png` ✅ (exists, 893KB)

**Issues:**
- ⚠️ **MEDIUM** — `ar.png` is 893KB — the largest screenshot. Should be optimized.

---

#### `ScreenshotPhone.tsx`

**Purpose:** Phone frame mockup that displays a screenshot image inside it.

**Props:** `{ src: string; alt: string }`

**Dimensions:** 300×620px frame with 44px border-radius.

**Issues:**
- 🔴 **HIGH** — Uses `<img>` tag instead of `next/image`. No lazy loading, no srcset, no format optimization. These are 180-893KB PNGs loaded eagerly.
- ⚠️ **MEDIUM** — Fixed width (300px) with no responsive sizing. On very small screens the phone may overflow or be awkwardly sized.
- ✅ Good: Has `alt` prop passed through properly.

---

#### `PhoneMockup.tsx` (landing)

**Purpose:** Generic phone frame with gradient background, icon, and label. No screenshot.

**Props:** `{ label?: string; gradient?: string; icon?: string }`

**Status:** 🔴 **DEAD CODE** — Not imported anywhere. Was likely a placeholder before `ScreenshotPhone` was created.

**Issues:**
- 🔴 **HIGH** — Dead code. Should be deleted.

---

#### `AlumniSection.tsx`

**Purpose:** Alumni Network section with dark background and animated orbit visual.

**Visual:** Three concentric rotating circles with dots (globe metaphor) and a 🌍 emoji center.

**Animations:**
- Text slide-in from left
- Globe scale-in with delay
- Three orbit rings rotating at different speeds (20s, 30s, 40s)

**Stats displayed:** "1" (Separate server), "All" (Schools represented), "0" (Student crossover)

**Issues:**
- ⚠️ **LOW** — The orbit animation runs infinitely with `ease: "linear"` which is correct for rotation.
- ⚠️ **LOW** — Stats are hard-coded. The values "1", "All", "0" are more conceptual than numerical — creative but could be confusing.

---

#### `PrivacySection.tsx`

**Purpose:** Privacy & Safety section with 4 feature cards in a 2×2 grid.

**Features:** .edu Verified, No In-App Messaging, Location When You Want, Your Data Your Control.

**Animations:** Cards fade-in with staggered delays, hover shadow effect.

**Issues:**
- ⚠️ **MEDIUM** — Emoji icons (🔒, 💬, 📍, 🛡️) — same platform-inconsistency concern as HowItWorksSection.
- ✅ Good card layout with hover effects.

---

#### `SchoolShowcase.tsx`

**Purpose:** Interactive school selector. Click a university pill → see a styled card with that school's colors.

**Schools:** UMich, Harvard, Stanford, MIT, UCLA, NYU, Columbia, Duke (8 total).

**Animations:**
- Pill buttons with active state scaling/shadow
- Card animate on school change (opacity + scale)

**Issues:**
- ⚠️ **MEDIUM** — Button color logic `sel.accent.startsWith("#F") || sel.accent === "#FFFFFF"` is fragile. It tries to determine if the accent is "light" to choose white text, but this heuristic will fail for colors like `#FEDCBA`.
- ⚠️ **LOW** — The card shows placeholder skeleton rows (gray bars) — intentional design choice but could show more realistic content.
- ⚠️ **LOW** — School emoji (🎓) is the same for all schools. The data has no school-specific logo/icon.

---

#### `TestimonialsSection.tsx`

**Purpose:** Three testimonial cards in a grid.

**Testimonials:** Jordan K. (UMich, Junior), Sofia R. (Stanford, Sophomore), Marcus T. (NYU, Alumni '25)

**Issues:**
- ⚠️ **LOW** — These appear to be fictional testimonials. Fine for MVP/pre-launch but should be replaced with real ones.
- ⚠️ **LOW** — No photos for testimonial authors. Adding headshots would increase trust.

---

#### `BusinessSection.tsx`

**Purpose:** CTA section targeting businesses who want to advertise on Colage.

**CTA link:** `/ads/dashboard`

**Issues:**
- ⚠️ **LOW** — Links to `/ads/dashboard` which assumes an authenticated state. Might want to link to `/ads` (the public ads page) instead for a landing page CTA.
- ⚠️ **LOW** — Does not use `SectionWrapper`/`SectionHeading` — inconsistent with other sections.

---

#### `FAQSection.tsx`

**Purpose:** Accordion FAQ with 7 questions.

**Interactions:** Click to expand/collapse with AnimatePresence height animation.

**Questions covered:** Pricing (free), supported schools, differentiation, location data, graduation, messaging, platforms.

**Issues:**
- ⚠️ **MEDIUM** — FAQ accordion buttons have no `aria-expanded` attribute. Screen readers can't determine open/closed state.
- ⚠️ **LOW** — Does not use `SectionWrapper` — has its own inline section styling with different `maxWidth: 800`.
- ✅ Good: Smooth height animation, clean expand/collapse.

---

#### `FooterCTA.tsx`

**Purpose:** Final CTA with app store download buttons and footer navigation links.

**Footer links:** Privacy (/privacy), Terms (/terms), FAQ (#faq), Advertise (/ads/dashboard)

**Download buttons:** App Store and Google Play (both `href="#"` — placeholder).

**Issues:**
- 🔴 **HIGH** — Download buttons are `href="#"` placeholders. These are the primary conversion action.
- ⚠️ **MEDIUM** — Footer uses emoji (🍎, ▶️) for App Store/Google Play icons instead of official badge images. This looks unprofessional for a shipping product.
- ⚠️ **MEDIUM** — No actual `<footer>` HTML element used — it's all inside a `<section>`. Should be `<footer>` for semantics.
- ⚠️ **LOW** — `new Date().getFullYear()` in a server-compatible component — works fine in client component but worth noting.
- ⚠️ **LOW** — Privacy and Terms links assume those pages exist at `/privacy` and `/terms`.

---

### Shared Components (Non-Landing)

All five shared components are **DEAD CODE** — none are imported by any file in the landing page or (based on grep) anywhere else in the app.

#### `components/FeatureShowcase.tsx`

**Purpose:** Tabbed phone mockup showing Map, List, and AR views with animated mock UIs.

**Status:** 🔴 **DEAD CODE**

**Observations:** This is a sophisticated component with three fully-built mock UIs (MapView, ListView, ARView). Uses Tailwind classes and a purple/teal color scheme (#6C5CE7, #00CEC9) that differs from the landing page's crimson palette. Likely from an earlier design iteration or intended for a different page.

**Issues:**
- References CSS classes `glass-card`, `animate-scan`, `animate-float` that may not be defined.
- Uses a completely different color scheme than the landing page.

---

#### `components/FloatingStudents.tsx`

**Purpose:** Animated visualization with student bubbles connected to a central "You" node, cycling through active highlights.

**Status:** 🔴 **DEAD CODE**

**Observations:** Another sophisticated component with SVG connection lines, auto-cycling active student, and social link pills. Uses the purple/teal color scheme. Previously part of a different landing page design.

---

#### `components/PhoneMockup.tsx` (shared)

**Purpose:** Full phone mockup with interactive map, mode switcher (Map/List/AR), student dots, hover interactions, and an ad banner.

**Status:** 🔴 **DEAD CODE**

**Observations:** This is the most complex phone mockup — it's a fully interactive mini-app. Has hover states on map dots, mode switching, animated ad banner. Uses UMich branding. Completely different from `landing/PhoneMockup.tsx` (which is a simple gradient frame) and `landing/ScreenshotPhone.tsx` (which shows a screenshot).

**Duplicate note:** There are now THREE phone mockup components:
1. `landing/PhoneMockup.tsx` — Simple gradient frame (dead)
2. `landing/ScreenshotPhone.tsx` — Screenshot in a frame (active, used by About/Map/List/AR sections)
3. `components/PhoneMockup.tsx` — Interactive mock app (dead)

---

#### `components/SchoolCarousel.tsx`

**Purpose:** Three side-by-side phone mockups showing different schools (UMich, Harvard, Stanford) with mini map views.

**Status:** 🔴 **DEAD CODE**

**Observations:** Uses the purple/teal color scheme. References CSS animation classes `animate-float-1/2/3` that may not be defined. Has a "Request Access" CTA.

---

#### `components/StatsCounter.tsx`

**Purpose:** Animated count-up statistics (1982 Students, 3 Campuses, 847 Online Now, 98% Satisfaction).

**Status:** 🔴 **DEAD CODE**

**Observations:** Uses IntersectionObserver for scroll-triggered count-up animation. References a `gradient-text` CSS class that may not be defined. The stats values are hardcoded.

**Issues:**
- ⚠️ **LOW** — `useCountUp` hook is called inside a `.map()` callback, which violates React's Rules of Hooks (hooks must not be called conditionally or in loops). However, since the array is static, it works in practice — but a linter would flag it.

---

## Cross-Cutting Analysis

### Design System Consistency

| Aspect | Status | Notes |
|--------|--------|-------|
| **Primary color** | ✅ Consistent | `#A51C30` (crimson) used throughout |
| **Dark color** | ✅ Consistent | `#1E1E1E` for text |
| **Muted text** | ✅ Consistent | `#6B6B6B` |
| **Off-white bg** | ✅ Consistent | `#F9F6F2` |
| **Serif font** | ⚠️ Inconsistent | Sometimes `var(--font-serif)`, sometimes `var(--font-cormorant)`. They resolve to the same font but the variable names differ. |
| **Spacing** | ⚠️ Inconsistent | Sections mostly use `120px 0` padding, but some vary. |
| **Border radius** | ✅ Consistent | Buttons: `999px` (pill), Cards: `20px`, Phone: `44-48px` |
| **Badge pattern** | ✅ Consistent | Crimson text on 10% crimson bg, uppercase, rounded pill |
| **Styling approach** | 🔴 Inconsistent | Mix of inline styles, CSS utility classes, Tailwind classes, and styled-jsx |

### Image/Asset Dependencies

All referenced screenshots exist:

| Path | Size | Used By |
|------|------|---------|
| `/screenshots/profile.png` | 179KB | AboutSection |
| `/screenshots/map.png` | 769KB | MapSection |
| `/screenshots/list.png` | 369KB | ListSection |
| `/screenshots/ar.png` | 893KB | ARSection |

**Total screenshot weight: ~2.2MB** — loaded eagerly with no optimization.

**Missing assets:**
- No OG image for social sharing
- No favicon (relies on default)
- No App Store / Google Play badge images

### SEO

| Check | Status |
|-------|--------|
| Title tag | ✅ "Colage — Be You." |
| Meta description | ✅ Present |
| `<html lang>` | ✅ `lang="en"` |
| OG tags | ⚠️ Missing `og:image` |
| Twitter card | ⚠️ Missing `twitter:image` |
| Heading hierarchy | ⚠️ Multiple `<h2>` tags (expected for landing page), single `<h1>` in hero |
| Canonical URL | ❌ Missing |
| Structured data (JSON-LD) | ❌ Missing |
| Sitemap | ❌ Not checked |
| `robots.txt` | ❌ Not checked |

### Performance

| Concern | Severity | Details |
|---------|----------|---------|
| **Three.js bundle** | 🔴 HIGH | `three` + `@react-three/fiber` adds ~150-200KB gzipped to the client bundle. It's only used for the hero tunnel effect. |
| **Framer Motion bundle** | ⚠️ MEDIUM | Used in every section. ~30KB gzipped. Justified by usage. |
| **Screenshot images** | 🔴 HIGH | 2.2MB of PNGs loaded with `<img>` instead of `next/image`. No lazy loading, no WebP/AVIF, no responsive srcset. |
| **Hero blob animations** | ⚠️ MEDIUM | 5 large blurred animated elements. GPU-intensive on low-end devices. |
| **40 canvas textures** | ⚠️ MEDIUM | Created synchronously in LogoTunnel. Blocks main thread briefly on mount. |
| **No code splitting** | ⚠️ MEDIUM | Only LogoTunnel uses `dynamic()`. Other heavy sections could benefit from lazy loading. |
| **Inline styles** | ⚠️ LOW | Every component uses extensive inline `style={{}}` objects which are recreated on every render. Not a major perf issue but prevents CSS caching. |

### Accessibility Audit

| Check | Status | Details |
|-------|--------|---------|
| **Skip navigation** | ❌ Missing | No "skip to content" link |
| **Keyboard navigation** | ⚠️ Partial | Links are focusable, but no visible focus indicators on most elements |
| **Screen reader labels** | 🔴 Missing | Hamburger button has no `aria-label`; FAQ buttons have no `aria-expanded` |
| **Alt text** | ✅ Present | `ScreenshotPhone` passes through `alt` props |
| **Semantic HTML** | ⚠️ Partial | Uses `<section>`, `<main>`, `<nav>`, but no `<footer>`, no `<article>` for testimonials |
| **Color contrast** | ⚠️ Needs audit | Muted text (#6B6B6B on #fff) may fail WCAG AA for small text (ratio ~5.5:1, passes AA but not AAA) |
| **Emoji as content** | ⚠️ Concern | Emojis used as functional icons throughout (steps, privacy, store buttons). Inconsistent rendering across platforms, no aria-labels. |
| **Reduced motion** | ❌ Missing | No `prefers-reduced-motion` check. All animations play regardless of user preference. |
| **Focus trapping** | ❌ Missing | Mobile nav overlay doesn't trap focus |

### Mobile Responsiveness

| Component | Mobile Handling |
|-----------|----------------|
| Navbar | ✅ Mobile menu overlay, hamburger toggle |
| Hero | ✅ `clamp()` font sizing, blobs scale with viewport |
| Grid sections | ✅ `grid-3` → single column at 768px |
| Feature rows | ✅ `flex-row-wrap` → column at 768px |
| SchoolShowcase | ✅ Pill buttons wrap, card is narrow enough |
| FAQ | ✅ Max-width container, full-width on mobile |
| Footer | ✅ `flex-wrap` on footer bar |
| ScreenshotPhone | ⚠️ Fixed 300px width — may be tight on small screens |
| AlumniSection | ⚠️ Globe visual is 340px fixed — may overflow narrow screens |

### Duplicate Components

| Component | Location | Status |
|-----------|----------|--------|
| `PhoneMockup` | `landing/PhoneMockup.tsx` | 🔴 Dead code |
| `PhoneMockup` | `components/PhoneMockup.tsx` | 🔴 Dead code |
| `ScreenshotPhone` | `landing/ScreenshotPhone.tsx` | ✅ Active — used by 4 sections |
| `FeatureSection` | `landing/FeatureSection.tsx` | 🔴 Dead code (replaced by `FeatureRow` in `Section.tsx`) |

### Dead/Unused Components

| File | Confidence | Reason |
|------|------------|--------|
| `landing/FeatureSection.tsx` | 100% dead | Not imported anywhere. Superseded by `Section.tsx > FeatureRow`. |
| `landing/PhoneMockup.tsx` | 100% dead | Not imported anywhere. Superseded by `ScreenshotPhone.tsx`. |
| `components/FeatureShowcase.tsx` | 100% dead | Not imported anywhere. Different color scheme. |
| `components/FloatingStudents.tsx` | 100% dead | Not imported anywhere. Different color scheme. |
| `components/PhoneMockup.tsx` | 100% dead | Not imported anywhere. Different color scheme. |
| `components/SchoolCarousel.tsx` | 100% dead | Not imported anywhere. Different color scheme. |
| `components/StatsCounter.tsx` | 100% dead | Not imported anywhere. Different color scheme. |

**Total dead code: 7 files**, approximately 600+ lines.

The 5 shared components all use a purple/teal (#6C5CE7/#00CEC9) color scheme, suggesting they're from a previous design iteration that was replaced with the current crimson aesthetic.

---

## Issue Tracker

### 🔴 CRITICAL

None.

### 🔴 HIGH

| # | Issue | File(s) | Details |
|---|-------|---------|---------|
| H1 | Screenshots use `<img>` instead of `next/image` | `ScreenshotPhone.tsx` | 2.2MB of PNGs loaded eagerly with no optimization, lazy loading, or responsive sizing |
| H2 | Three.js bundle for hero effect | `LogoTunnel.tsx` | ~150-200KB gzipped added to client bundle for a decorative effect |
| H3 | Download/CTA links are placeholders | `Navbar.tsx`, `FooterCTA.tsx` | `href="#"` on primary conversion buttons |
| H4 | 7 dead/unused component files | Multiple | ~600 lines of dead code cluttering the codebase |
| H5 | Mobile hamburger has no aria-label | `Navbar.tsx` | Critical accessibility failure |
| H6 | Missing `og:image` / `twitter:image` | `layout.tsx` | Social shares will have no preview image |

### ⚠️ MEDIUM

| # | Issue | File(s) | Details |
|---|-------|---------|---------|
| M1 | Mixed styling paradigms | All | Inline styles + CSS utility classes + Tailwind + styled-jsx in the same codebase |
| M2 | No `prefers-reduced-motion` support | All animated components | Users who need reduced motion get full animations |
| M3 | FAQ buttons lack `aria-expanded` | `FAQSection.tsx` | Screen readers can't determine accordion state |
| M4 | Emoji used as functional icons | `HowItWorksSection`, `PrivacySection`, `FooterCTA` | Platform-inconsistent rendering, no accessibility labels |
| M5 | Hero blobs are GPU-intensive | `HeroSection.tsx` | 5 animated blurred elements on large viewports |
| M6 | Three.js textures not cleaned up | `LogoTunnel.tsx` | Potential memory leak on unmount |
| M7 | Font variable naming inconsistency | Multiple | `var(--font-serif)` vs `var(--font-cormorant)` for same font |
| M8 | SchoolShowcase color logic is fragile | `SchoolShowcase.tsx` | `startsWith("#F")` heuristic for light/dark determination |
| M9 | ScreenshotPhone has fixed 300px width | `ScreenshotPhone.tsx` | No responsive sizing |
| M10 | No `<footer>` semantic element | `FooterCTA.tsx` | Uses `<section>` for footer content |
| M11 | BusinessSection inconsistent with section pattern | `BusinessSection.tsx` | Doesn't use SectionWrapper/SectionHeading like other sections |

### 💡 LOW

| # | Issue | File(s) | Details |
|---|-------|---------|---------|
| L1 | No skip-to-content link | `layout.tsx` / `page.tsx` | Standard accessibility feature missing |
| L2 | No visible focus indicators | Global | Custom focus styles needed for keyboard nav |
| L3 | Logo link uses `href="#"` | `Navbar.tsx` | Should be `href="/"` |
| L4 | Mobile menu doesn't trap focus | `Navbar.tsx` | Tab key can escape overlay |
| L5 | `StatsCounter` calls hooks in map | `StatsCounter.tsx` | Violates Rules of Hooks (dead code anyway) |
| L6 | Shared components reference undefined CSS classes | `FeatureShowcase`, `SchoolCarousel`, `StatsCounter` | `glass-card`, `animate-scan`, `animate-float`, `gradient-text` |
| L7 | No canonical URL | `layout.tsx` | Missing for SEO |
| L8 | No JSON-LD structured data | `layout.tsx` | Missing for rich search results |
| L9 | AlumniSection globe is 340px fixed | `AlumniSection.tsx` | May overflow on narrow screens |
| L10 | `!important` in globals.css | `globals.css` | On `.section-wrapper` mobile override |

---

## Recommendations

### Immediate (Before Launch)

1. **Replace `<img>` with `next/image`** in ScreenshotPhone — easy win for 60%+ image size reduction and lazy loading.
2. **Add real App Store / Google Play links** to Navbar and FooterCTA download buttons.
3. **Add `og:image`** to metadata for social sharing.
4. **Add `aria-label="Toggle menu"` and `aria-expanded`** to the mobile hamburger button.
5. **Add `aria-expanded`** to FAQ accordion buttons.
6. **Delete dead components** — all 7 files identified above.

### Short-Term

7. **Consolidate styling approach** — pick either inline styles or Tailwind and migrate. The current mix makes maintenance harder.
8. **Add `prefers-reduced-motion` media query** — disable or simplify animations for users who prefer it.
9. **Evaluate Three.js necessity** — the LogoTunnel is visually cool but adds significant bundle weight. Consider a CSS-only or canvas 2D alternative, or at minimum ensure it's code-split (it already is via `dynamic()`).
10. **Add semantic `<footer>`** element in FooterCTA.
11. **Convert emoji icons to SVGs** with proper aria-labels.
12. **Add skip-to-content link** and visible focus indicators.

### Long-Term

13. **Add real testimonials** with photos when available.
14. **Implement JSON-LD structured data** for better SEO.
15. **Add a proper footer** with links to Privacy Policy, Terms of Service, Contact, etc. (and ensure those pages exist).
16. **Consider replacing the custom phone mockup** with actual device frame images for more realistic appearance.
17. **Performance monitoring** — add Core Web Vitals tracking to measure real-world impact of Three.js and animations.

# eavi.eavii — UI Error Analysis Report & Fix Plan

**Date:** 2026-05-09
**Project:** braxton0054/eavi.eavii
**Analyst:** Krish

---

## Summary

- **Total errors found:** 25
- **Critical:** 4
- **Major:** 12
- **Minor:** 9

---

## Category 1 — Critical (Breaks the app or makes it unusable)

### C1. Admin sidebar links to non-existent routes
- **Location:** `app/admin/layout.tsx` — navSections
- **Description:** The sidebar links to `/admin/fee-structure`, `/admin/system-logs`, `/admin/fee-structure` but these routes do not exist in the app directory. Clicking them will show the Next.js 404 page.
- **Impact:** Admin users cannot access fee structure, system logs, and financial reports sections. Navigation breaks for these critical features.
- **Category:** Critical

### C2. No role-based route protection middleware
- **Location:** `lib/middleware.ts` (if exists) / Entire app
- **Description:** There is no middleware enforcing authentication. Users can navigate directly to `/admin/dashboard`, `/lecturer/dashboard`, `/student/dashboard` without logging in. The auth check happens client-side after render, leaving a flash of unprotected content.
- **Impact:** Sensitive data exposed before auth check completes. Users can bookmark and access protected pages.
- **Category:** Critical

### C3. Supabase client initialization error — SSR vs client mismatch
- **Location:** `app/layout.tsx` creates server component layout, but several pages use `createClient()` from `@/lib/client` which uses `@supabase/ssr` — this breaks in server contexts.
- **Description:** The root layout is NOT marked `'use client'` but many child pages use browser-only Supabase client. This causes hydration errors and potential white screens.
- **Impact:** App may fail to render on initial load in production build.
- **Category:** Critical

### C4. Favicon version mismatch causing 404 for icons
- **Location:** `app/layout.tsx`
- **Description:** Metadata sets `favicon.ico?v=2` while the `<head>` link sets `favicon.ico?v=3`. Browsers may fail to load or use the wrong icon. Additionally, no actual favicon file was found in `public/`.
- **Impact:** No favicon displays in browser tabs. Looks unprofessional.
- **Category:** Critical

---

## Category 2 — Major (Visible and affects user experience badly)

### M1. Massive student dashboard component (2188+ lines)
- **Location:** `app/student/dashboard/page.tsx`
- **Description:** Single file exceeds 2100 lines with exam marks, fees, courses, payment receipts, PDF generation all in one component. Impossible to maintain.
- **Impact:** Slow code navigation, difficult debugging, poor performance due to unnecessary re-renders.
- **Category:** Major

### M2. Duplicate font loading — 5 font families loaded
- **Location:** `app/layout.tsx`
- **Description:** Loads Poppins, Inter, Geist, Playfair Display, AND DM Sans. Multiple variable fonts are being downloaded. Tailwind is configured to use multiple font families unnecessarily.
- **Impact:** ~200KB+ of font files loaded on every page. Slows initial page load significantly.
- **Category:** Major

### M3. Inconsistent theme — dark homepage vs light admin
- **Location:** `app/globals.css` / `app/page.tsx` / `app/admin/layout.tsx`
- **Description:** Public homepage uses a dark purple/gold theme with custom CSS variables. Admin panel and login pages use a white/blue theme with Tailwind. Switching between public and admin creates a jarring visual discontinuity.
- **Impact:** Confusing user experience, feels like two different apps.
- **Category:** Major

### M4. Admin dashboard has no loading/error states for individual widgets
- **Location:** `app/admin/dashboard/page.tsx`
- **Description:** The dashboard fetches stats, applications, payments, and logs in parallel but has no skeleton loaders or error boundaries per widget. If one API fails, the whole page may break or show nothing.
- **Impact:** Poor UX during loading, no feedback when data fails to load.
- **Category:** Major

### M5. No empty states for data tables
- **Location:** Admin pages (students, payments, results, etc.)
- **Description:** When lists are empty (no students, no payments), the pages show blank tables with headers only — no "No data" message, no illustration, no call-to-action.
- **Impact:** Users don't know if data is loading, empty, or broken.
- **Category:** Major

### M6. Login page uses inline styles alongside Tailwind
- **Location:** `app/login/admin/page.tsx`, `app/login/lecturer/page.tsx`, `app/login/student/page.tsx`
- **Description:** Mixes Tailwind utility classes with inline `style={{ fontFamily: 'Playfair Display, serif' }}`. Inconsistent and harder to maintain.
- **Impact:** Styling inconsistencies, harder theme switching.
- **Category:** Major

### M7. unused `showPassword` state in login
- **Location:** `app/login/admin/page.tsx` line: `const [showPassword, setShowPassword] = useState(false);`
- **Description:** State is declared but never used anywhere — no show/hide password toggle exists in the UI.
- **Impact:** Dead code, confusing for future developers.
- **Category:** Major

### M8. Duplicate `@keyframes spin` definition
- **Location:** `app/globals.css` and `app/loading.tsx` (inline style)
- **Description:** The spin animation is defined both in globals.css AND used inline in loading.tsx via a style tag. This creates duplicate keyframe definitions.
- **Impact:** Potential animation conflicts, wasted CSS.
- **Category:** Major

### M9. Missing favicon files in public/
- **Location:** `public/`
- **Description:** No actual favicon files found. Layout references `/favicon.ico?v=2` and `/favicon.ico?v=3` but neither file exists.
- **Impact:** 404 errors for favicon requests. Browser tab shows no icon.
- **Category:** Major

### M10. Mobile menu doesn't close on route change in some views
- **Location:** `app/admin/layout.tsx`
- **Description:** The sidebar menu closes on `isMobile` but the hamburger icon state doesn't sync with route changes via the pathname.
- **Impact:** On mobile, navigating between sidebar items may leave overlay active.
- **Category:** Major

### M11. No 404 / not-found page
- **Location:** Missing `app/not-found.tsx`
- **Description:** No custom 404 page exists. Users navigating to non-existent routes see a bare Next.js error page.
- **Impact:** Unprofessional error experience.
- **Category:** Major

### M12. Admin layout logout redirects to `/login` instead of `/login/admin`
- **Location:** `app/admin/layout.tsx`
- **Description:** On logout, router pushes to `/login` which does not exist (catch-all not configured). Should redirect to `/login/admin`.
- **Impact:** Logout shows a blank page or 404.
- **Category:** Major

---

## Category 3 — Minor (Cosmetic or low impact)

### m1. Homepage decorative images missing alt text
- **Location:** `app/page.tsx`
- **Description:** Logo image has `alt="EAVI Logo"` but the decorative program ticket icons on the hero section have no accessible labels.
- **Impact:** Minor accessibility issue for screen reader users.
- **Category:** Minor

### m2. Admin sidebar has duplicate Reports links
- **Location:** `app/admin/layout.tsx`
- **Description:** Both "Financial Reports" (to `/admin/financial-reports`) and "Reports" (to `/admin/reports`) appear in the sidebar under FINANCE. These may be different pages but the naming is confusing.
- **Impact:** Minor user confusion about which link to click.
- **Category:** Minor

### m3. Loading spinner text is not translated for Swahili context
- **Location:** `app/loading.tsx`
- **Description:** Loading text shows "LOADING..." in English only. For a Kenyan institution, adding Swahili ("INAPAKIA...") would be more inclusive.
- **Impact:** Minor inclusivity issue.
- **Category:** Minor

### m4. No skip-to-content link for keyboard users
- **Location:** `app/layout.tsx`
- **Description:** No skip navigation link is provided for keyboard/screen reader users.
- **Impact:** Accessibility concern for users navigating via keyboard.
- **Category:** Minor

### m5. Hero section program cards rotate on hover but are not clickable
- **Location:** `app/page.tsx`
- **Description:** Program cards have hover effects (translateY) suggesting they are interactive, but they are not links.
- **Impact:** Users may expect to click and get more info, creating confusion.
- **Category:** Minor

### m6. Hero section ticker timer memory leak
- **Location:** `app/page.tsx`
- **Description:** `setInterval` is set to 3000ms to cycle through programs but clears on unmount. If component re-renders unexpectedly, interval may restart without clearing previous one.
- **Impact:** Potential memory leak on rapid navigation.
- **Category:** Minor

### m7. Hardcoded year in footer
- **Location:** `app/page.tsx`
- **Description:** `new Date().getFullYear()` is dynamic, so this is actually fine — but checking the pattern across pages revealed some copyright texts that may not all use dynamic years.
- **Impact:** Stale copyright on some pages.
- **Category:** Minor

### m8. Button hover effects without `prefers-reduced-motion` support
- **Location:** Various components
- **Description:** Multiple hover animations (translateY, scale) and marquee scroll animations lack `@media (prefers-reduced-motion)` fallbacks.
- **Impact:** Users with motion sensitivity may experience discomfort.
- **Category:** Minor

### m9. Console.log statements left in production code
- **Location:** `app/login/admin/page.tsx`
- **Description:** Multiple `console.log` calls remain in the login handler (`'Attempting login with:'`, `'Login response:'`, etc.). These expose credentials in browser console.
- **Impact:** Security concern — sensitive data logged to console. Performance overhead.
- **Category:** Minor

---

## Fix Plan

### Step 1 — Add favicon files to public/
- **Files:** Create `public/favicon.ico`
- **Why:** Fixes Critical C4 — browser tab shows no icon
- **Effort:** Small

### Step 2 — Add Next.js auth middleware
- **Files:** Create `middleware.ts` at project root
- **Why:** Fixes Critical C2 — unprotected routes
- **Effort:** Medium

### Step 3 — Fix Supabase SSR client initialization
- **Files:** `app/layout.tsx`, `lib/client.ts`, `lib/server.ts`
- **Why:** Fixes Critical C3 — hydration errors
- **Effort:** Medium

### Step 4 — Fix admin sidebar broken links
- **Files:** `app/admin/layout.tsx`
- **Why:** Fixes Critical C1 — navigation broken
- **Effort:** Small

### Step 5 — Create missing admin pages (fee-structure, system-logs, financial-reports)
- **Files:** Create routes + pages
- **Why:** Supports Step 4 — without these, sidebar links lead to 404
- **Effort:** Large

### Step 6 — Fix logout redirect
- **Files:** `app/admin/layout.tsx`
- **Why:** Fixes Major M12 — logout shows 404
- **Effort:** Small

### Step 7 — Add custom 404 page
- **Files:** Create `app/not-found.tsx`
- **Why:** Fixes Major M11 — improves error experience
- **Effort:** Small

### Step 8 — Clean up font loading
- **Files:** `app/layout.tsx`
- **Why:** Fixes Major M2 — reduces font overload, improves performance
- **Effort:** Small

### Step 9 — Remove console.log statements
- **Files:** `app/login/admin/page.tsx`, other pages
- **Why:** Fixes Minor m9 — security concern
- **Effort:** Small

### Step 10 — Add empty state components to data tables
- **Files:** All admin list pages
- **Why:** Fixes Major M5 — improves UX when no data
- **Effort:** Medium

### Step 11 — Remove duplicate Reports links and clean up sidebar
- **Files:** `app/admin/layout.tsx`
- **Why:** Fixes Minor m2 — reduces confusion
- **Effort:** Small

### Step 12 — Break up student dashboard into components
- **Files:** `app/student/dashboard/page.tsx`
- **Why:** Fixes Major M1 — improves maintainability
- **Effort:** Large

### Step 13 — Add loading skeletons to admin dashboard widgets
- **Files:** `app/admin/dashboard/page.tsx`
- **Why:** Fixes Major M4 — better loading UX
- **Effort:** Medium

### Step 14 — Remove unused showPassword state
- **Files:** `app/login/admin/page.tsx`
- **Why:** Fixes Major M7 — removes dead code
- **Effort:** Small

### Step 15 — Clean up duplicate spin animation
- **Files:** `app/globals.css`, `app/loading.tsx`
- **Why:** Fixes Major M8 — eliminates duplicate
- **Effort:** Small

### Step 16 — Add reduced-motion support
- **Files:** `app/globals.css`
- **Why:** Fixes Minor m8 — accessibility
- **Effort:** Small

### Step 17 — Add skip-to-content link
- **Files:** `app/layout.tsx`
- **Why:** Fixes Minor m4 — keyboard accessibility
- **Effort:** Small

### Step 18 — Make program cards clickable or remove hover hint
- **Files:** `app/page.tsx`
- **Why:** Fixes Minor m5 — removes false affordance
- **Effort:** Small

### Step 19 — Align theme (dark vs light) across public and admin sections
- **Files:** `app/globals.css`, admin layouts, login pages
- **Why:** Fixes Major M3 — visual consistency
- **Effort:** Large (design decision)

### Step 20 — Add aria-labels and alt text for accessibility
- **Files:** `app/page.tsx`, components
- **Why:** Fixes Minor m1 — screen reader support
- **Effort:** Medium

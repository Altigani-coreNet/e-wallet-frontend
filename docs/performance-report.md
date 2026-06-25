# Payment Project — Performance Report

**Date:** 2026-06-24  
**App:** Vite + React 19 (`Payment/`)

## Executive Summary

The Payment app loads nearly all merchant, sales, and admin UI in the **initial JavaScript bundle**. That is the primary performance bottleneck. Secondary issues include duplicate axios interceptor work (fixed in this pass), production `console.log` calls, and Metronic sidebar re-initialization on every route change.

## Critical findings

### 1. No route-level code splitting (Critical)

**Evidence:** [`App.jsx`](../src/App.jsx) statically imports 60+ page components (merchant dashboard, sales POS, inventory, admin). Only `PaymentLinkRedirect` / `PaymentLinkRedirectV2` use `React.lazy`.

**Impact:**

- Large initial JS parse/compile time
- Poor LCP on first visit to login or landing (user downloads admin + sales code they may never open)
- Slow TTI on mobile / 3G

**Fix applied:**

- Lazy-load admin via [`AdminRoutesLazy.jsx`](../src/routes/AdminRoutesLazy.jsx) (separate chunk)
- Lazy-load sales/POS heavy routes in `App.jsx`
- `manualChunks` in [`vite.config.js`](../vite.config.js) for vendor libraries

**Pages / areas most affected:**

| Area | Representative routes | Why heavy |
|------|----------------------|-----------|
| Admin | `/admin/*` | 100+ admin components, tables, filters, TipTap, charts |
| Sales POS | `/sales/sale`, `/sales/dashboard` | ApexCharts, product search, cart state |
| Sales inventory | `/sales/products`, `/sales/warehouse` | Large CRUD tables, import modals |
| Payment gateway admin | `/admin/partners`, `/admin/services` | Rich forms, previews, mockups |
| Merchant dashboard | `/merchant/dashboard` | Charts + multiple parallel API calls |

### 2. Vendor libraries not chunked (High)

**Evidence:** [`vite.config.js`](../vite.config.js) had no `rollupOptions.output.manualChunks`.

Heavy dependencies in `package.json`:

- `apexcharts` / `react-apexcharts` — dashboards
- `firebase` — notifications
- `@tiptap/*` — rich text admin
- `@stripe/*` — payment checkout (partially lazy)
- `html2pdf.js` — invoice export
- `framer-motion` — animations

**Fix applied:** Manual chunks for `charts`, `editor`, `firebase`, `stripe`, `pdf`.

### 3. Duplicate axios interceptors (Medium — fixed)

**Evidence:** Previously `api.js` and `axiosConfig.js` each ran full request/response interceptor chains.

**Impact:** Every API call ran locale/region/scope header logic twice when using `apiClient` + global axios.

**Fix:** Shared logic in [`apiInterceptors.js`](../src/utils/apiInterceptors.js); single attach per instance.

### 4. Production console noise (Low — partially fixed)

| Location | Issue |
|----------|-------|
| ~~`constants.js:18`~~ | Removed `console.log` on import |
| ~~`axiosConfig.js:316`~~ | Removed startup log |
| `App.jsx` unauthorized handler | `console.log` on 401 — removed |
| ~~`apiUtils.js`~~ | Verbose request/response logs — removed with adapter rewrite |

### 5. Sidebar Metronic re-init (Low)

**Evidence:** [`Sidebar.jsx`](../src/components/layout/Sidebar.jsx) `useEffect` calls `KTMenu.createInstances()` and `KTScroll.createInstances()` on every `location` + `i18n.language` change.

**Impact:** Extra main-thread work on navigation; possible layout thrash.

**Recommendation:** Debounce or run only when sidebar menu structure changes (permissions loaded), not every pathname change.

### 6. Merchant dashboard parallel fetches (Medium)

**Evidence:** [`MerchantDashboard.jsx`](../src/components/merchant/MerchantDashboard.jsx) + [`useDashboardQueries.js`](../src/hooks/useDashboardQueries.js) fire statistics, charts, and latest-transactions queries.

**Impact:** Multiple concurrent requests on dashboard load — acceptable with React Query caching but spikes network on first paint.

**Recommendation:** Ensure React Query `staleTime` aligns with [`reactQueryDefaults.js`](../src/utils/reactQueryDefaults.js); consider single aggregate endpoint if backend supports it.

### 7. Large constants module (Low)

**Evidence:** [`constants.js`](../src/utils/constants.js) ~850 lines, imported widely.

**Impact:** Parsed on many chunks; deduplication reduces size slightly.

**Fix applied:** Removed ~50 duplicate endpoint keys from `ADMIN_SYSTEM_ENDPOINTS`.

## React Query configuration

[`App.jsx`](../src/App.jsx) QueryClient uses `staleTime: 5min`, `refetchOnWindowFocus: false` — good defaults. Note: `cacheTime` is v4 naming; TanStack Query v5 uses `gcTime` (harmless if ignored).

## Recommended next steps (not in this pass)

1. Lazy-load [`AdminRoutes.jsx`](../src/routes/AdminRoutes.jsx) internal sections (merchants, sales admin) into sub-chunks
2. Virtualize long admin/merchant tables (100+ rows)
3. Add `vite-plugin-compression` + CDN for static assets
4. Lighthouse CI on `/login`, `/merchant/dashboard`, `/admin/dashboard`
5. Replace Metronic jQuery menu with React-native accordion where feasible

## Measurement

After build, compare chunk sizes:

```bash
cd Payment && npm run build
```

Inspect `dist/assets/*.js` — expect separate `admin-*`, `sales-*`, `charts-*` chunks after this pass.

## Summary table

| Issue | Severity | Status |
|-------|----------|--------|
| Monolithic App.jsx imports | Critical | Mitigated (lazy admin + sales) |
| No manualChunks | High | Fixed |
| Duplicate interceptors | Medium | Fixed |
| console.log in prod | Low | Fixed |
| Sidebar KTMenu re-init | Low | Documented |
| Dashboard multi-fetch | Medium | Documented |

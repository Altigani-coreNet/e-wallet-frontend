# Payment Project — Data Code Report

**File:** `Payment/src/utils/constants.js`  
**Date:** 2026-06-24  
**Scope:** Endpoint constants, base URLs, app config

## Executive Summary

`constants.js` is 893 lines and acts as a monolithic API registry for Auth, SoftPOS, POS, Admin, and Public endpoints. It is functional but carries dead code, production logging, duplicated endpoint blocks, and one likely broken PayTabs URL. Cleanup reduces bundle parse cost slightly and removes confusion; the file should eventually be split by domain (auth, pos, admin).

## Issues Found

### P0 — Production side effects

| Line | Issue | Action |
|------|-------|--------|
| 18 | `console.log(AUTH_SERVICE_BASE, SOFTPOS_API_BASE, POS_API_BASE)` runs on every import | **Remove** |

### P1 — Dead / commented code

| Lines | Issue | References | Action |
|-------|-------|------------|--------|
| 3–6 | Three duplicate commented `AUTH_SERVICE_BASE` lines + commented `SOFTPOS_API_BASE` | 0 | **Remove** |
| 12 | Commented alternate `POS_API_BASE` | 0 | **Remove** |

### P1 — Duplicated endpoint blocks

`ADMIN_SYSTEM_ENDPOINTS` (lines 813–863) re-declares blocks already defined in `ADMIN_ENDPOINTS` (lines 682–738):

- `SERVICE_CATEGORIES`, `SERVICE_SUB_CATEGORIES`
- `SERVICE_TYPES`, `PRODUCT_SERVICE_FORMS`
- `OPERATORS`, `SERVICES`, `PRODUCTS`

**Reference check:** No file imports these keys via `ADMIN_SYSTEM_ENDPOINTS.*` (grep: 0 matches). All service-catalog code uses `ADMIN_ENDPOINTS.*`.

**Action:** Remove duplicate block from `ADMIN_SYSTEM_ENDPOINTS`; keep system-only keys (roles, admins, countries, cities, advertisements, service-fees settings, currencies settings, contract terms, notifications).

### P1 — Likely broken PayTabs path

```javascript
export const PAYTABS_API_BASE = `${BASE_DOMAIN}/api/paytabs`;
// ...
PAYTABS: {
  GENERATE_QR: `${PAYTABS_API_BASE}/api/paytabs/generate-qr`,  // double /api/paytabs
  CHECK_STATUS: (tranRef) => `${PAYTABS_API_BASE}/api/paytabs/status/${tranRef}`,
}
```

Resolved URL: `http://localhost:8000/api/paytabs/api/paytabs/generate-qr` — almost certainly wrong.

**Used by:** `services/paytabsService.js` (2 call sites).

**Action:** Fix to `${PAYTABS_API_BASE}/generate-qr` and `${PAYTABS_API_BASE}/status/${tranRef}`.

### P2 — Unused exports

| Export | References outside constants.js |
|--------|--------------------------------|
| `API_V1` | 0 |
| `API_V2` | 0 |

**Action:** Keep for now (may be used by future env-based builders); documented as unused.

### P2 — Formatting / consistency

| Lines | Issue | Action |
|-------|-------|--------|
| 881–882 | `REGISTRATION_TOKEN_KEY` / `REGISTRATION_USER_KEY` mis-indented in `APP_CONFIG` | **Fix** |
| 813–863 | Inconsistent 5-space indent in duplicate block | Removed with dedup |

### P2 — Base URL inconsistency

```javascript
export const BASE_DOMAIN = 'http://localhost:8000';
export const SOFTPOS_API_BASE = `http://localhost:8000/api`;  // hardcoded, ignores BASE_DOMAIN
export const AUTH_SERVICE_BASE = `http://localhost:8000/api`;
export const PAYTABS_API_BASE = `${BASE_DOMAIN}/api/paytabs`;  // uses BASE_DOMAIN
export const POS_API_BASE = `${BASE_DOMAIN}/api/cashier`;
```

**Risk:** Changing `BASE_DOMAIN` alone does not update Auth/SoftPOS bases.

**Recommendation (future): Derive all bases from `BASE_DOMAIN` + env (`import.meta.env.VITE_API_BASE`).

### P3 — Cross-object duplication (intentional, not removed)

These appear in multiple endpoint objects by design (different API hosts):

- `CURRENCIES` / `CURRENCIES_SELECT` — in `AUTH_ENDPOINTS`, `SOFTPOS_ENDPOINTS`, `ADMIN_SYSTEM_ENDPOINTS`
- `BRANCHES` — in `SOFTPOS_ENDPOINTS`, `POS_ENDPOINTS`, `ADMIN_ENDPOINTS`
- `USERS` — in `SOFTPOS_ENDPOINTS`, `POS_ENDPOINTS`, `ADMIN_ENDPOINTS`
- `PRODUCTS` — auth catalog vs POS inventory (`ADMIN_ENDPOINTS.PRODUCTS` vs `POS_PRODUCTS`)

No change in this pass; split files would clarify ownership.

## Endpoint inventory (post-cleanup)

| Object | Approx. keys | Primary consumer |
|--------|-------------|------------------|
| `AUTH_ENDPOINTS` | ~40 | authStore, registration, profile |
| `SOFTPOS_ENDPOINTS` | ~55 | merchant dashboard, transactions, payment links |
| `POS_ENDPOINTS` | ~120 | sales, inventory, purchases |
| `ADMIN_ENDPOINTS` | ~200 | admin pages + services |
| `ADMIN_SYSTEM_ENDPOINTS` | ~45 (after dedup) | system admin services |
| `PUBLIC_ENDPOINTS` | 2 | landing, plans |
| `APP_CONFIG` | 7 | api.js, auth storage |

## Changes applied

1. Removed dead comments and `console.log`
2. Removed duplicate service-catalog block from `ADMIN_SYSTEM_ENDPOINTS`
3. Fixed PayTabs URL paths
4. Normalized `APP_CONFIG` indentation

## Recommended follow-ups

1. Split into `constants/auth.js`, `constants/pos.js`, `constants/admin.js`, `constants/index.js`
2. Use `import.meta.env.VITE_*` for all base URLs
3. Remove unused `API_V1` / `API_V2` or wire into path builders
4. Add a script to grep endpoint key usage and flag orphans

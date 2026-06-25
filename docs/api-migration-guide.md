# Unified API Migration Guide

**Project:** Payment (`Payment/src`)  
**Canonical client:** [`utils/api.js`](../src/utils/api.js) — `http`, `get`, `post`, `put`, `patch`, `del`, `uploadFile`, `apiClient`

## Current state (after unification pass)

| Pattern | Files (approx.) | Status |
|---------|-----------------|--------|
| `import { get, post } from '../utils/api'` | ~80 services | Preferred |
| `import axios from 'axios'` + manual headers | ~150 files | Legacy — works via global interceptors |
| `import './utils/axiosConfig'` in App.jsx | 1 | Bootstraps global axios |
| `utils/apiUtils.js` `apiRequest` | ~14 POS/payment pages | Deprecated adapter → uses unified client |
| `authStore.js` raw axios | 0 | Migrated to `get`/`post` |

## Architecture

```
Pages / Stores / Services
        ↓
  utils/api.js  (http.get/post/… + apiClient)  ← USE THIS
        ↓
  utils/apiInterceptors.js  (shared logic)
        ↓
  axios instance

Legacy: import axios from 'axios'
        ↓
  utils/axiosConfig.js  (same interceptors via attachApiInterceptors)
```

## How to migrate a file

### Before (raw axios)

```javascript
import axios from 'axios';
import { AUTH_ENDPOINTS } from '../utils/constants';
import { getToken } from '../utils/api';

const token = getToken();
const response = await axios.get(AUTH_ENDPOINTS.PROFILE_ME, {
  headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
});
const data = response.data;
```

### After (unified client)

```javascript
import { get } from '../utils/api';
import { AUTH_ENDPOINTS } from '../utils/constants';

const response = await get(AUTH_ENDPOINTS.PROFILE_ME);
const data = response.data;
```

Auth token, locale (`Accept-Language`, `X-App-Locale`), regions (`X-Regions`), merchant scopes (`X-Scope`), and test mode (`X-Test-Mode`) are applied automatically.

### File uploads

```javascript
import { uploadFile } from '../utils/api';

const formData = new FormData();
formData.append('file', file);
await uploadFile(url, formData);
```

### Registration / onboarding (separate token)

Use `getJsonFetchHeaders({ token: getRegistrationAuthToken() })` for raw `fetch()` calls, or pass a one-off header override:

```javascript
import { post, getRegistrationAuthToken } from '../utils/api';

await post(url, body, {
  headers: { Authorization: `Bearer ${getRegistrationAuthToken()}` },
});
```

### apiUtils compatibility (POS checkout)

Existing code using `apiRequest` / `apiGet` continues to work; the adapter now delegates to the unified client. Migrate when touching those files:

```javascript
// Old
import { apiGet } from '../utils/apiUtils';
const result = await apiGet(url, params);
if (!result.success) { ... }

// New
import { get } from '../utils/api';
try {
  const { data } = await get(url, { params });
} catch (error) { ... }
```

## Migration priority

1. **Done:** `authStore.js`, `apiUtils.js` adapter
2. **High:** Admin pages calling `axios.get` with manual `Authorization` (e.g. `AdminSidebar.jsx`, merchant tabs)
3. **Medium:** Service files still using `import axios` (most already use constants + axios; interceptors cover them)
4. **Low:** One-off page fetches — migrate opportunistically

## Files still using raw axios (sample)

Run to list all:

```bash
rg "import axios from 'axios'" Payment/src --files-with-matches
```

Notable clusters:

- `components/admin/**` — filters, import modals, merchant tabs
- `services/admin*.js` — can switch to `get`/`post` from `utils/api`
- `pages/payment-getway/**` — service catalog admin UI

## Do not

- Add new manual `Authorization` headers when using `utils/api` helpers (interceptor handles it)
- Import `axiosConfig` outside `App.jsx` entry (once is enough)
- Create a fourth API wrapper — extend `http` in `api.js` if needed

## Testing interceptors

See `src/utils/__tests__/apiInterceptors.test.js` for `isAuthEndpoint`, `isMerchantEndpoint`, and `buildContextHeaders` coverage.

## Registration fetch() calls

`registrationAuth.js` and onboarding hooks may use `fetch` + `getJsonFetchHeaders`. That is acceptable for public/form flows; ensure locale headers are included via `getJsonFetchHeaders`.

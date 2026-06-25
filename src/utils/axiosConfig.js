/**
 * Global Axios bootstrap — applies the same interceptors as `utils/api.js` to the
 * default axios instance so legacy direct `import axios from 'axios'` calls still
 * receive auth, locale, region, scope, and test-mode headers.
 *
 * Prefer `import { http } from './utils/api'` or `import { get, post } from './utils/api'`
 * in new code. See Payment/docs/api-migration-guide.md.
 */

import axios from 'axios';
import { attachApiInterceptors } from './apiInterceptors';
import { getToken } from './api';

axios.defaults.headers.common['Content-Type'] = 'application/json';
axios.defaults.headers.common['Accept'] = 'application/json';

attachApiInterceptors(axios, { getToken });

export default axios;

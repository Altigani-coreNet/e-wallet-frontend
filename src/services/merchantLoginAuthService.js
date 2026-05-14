import { buildPrefixedPath, getStoredOrDefaultLocale } from '../i18n/localePaths';
import { getToken } from '../utils/api';

const POS_SCOPE_TYPES = ['users', 'branches', 'terminals', 'transactions', 'batches', 'settlements', 'payment_links'];
const SALES_SCOPE_TYPES = ['categories', 'products', 'customers', 'suppliers', 'purchases', 'sales'];

/**
 * @param {{ email: string, password: string }} form
 * @param {{ emailRequired: string, emailInvalid: string, passwordRequired: string }} labels
 * @returns {Record<string, string>}
 */
export function validateMerchantLoginForm(form, labels) {
    const errors = {};
    const email = typeof form.email === 'string' ? form.email.trim() : '';
    const password = form.password ?? '';

    if (!email) {
        errors.email = labels.emailRequired;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
        errors.email = labels.emailInvalid;
    }

    if (!password) {
        errors.password = labels.passwordRequired;
    }

    return errors;
}

/**
 * When the session flag is true but no token exists in storage, treat persisted UI state as stale.
 * @param {boolean} isAuthenticated
 * @returns {'none' | 'clear'}
 */
export function getStaleAuthResolution(isAuthenticated) {
    if (!isAuthenticated) return 'none';
    const token = getToken();
    if (!token) return 'clear';
    return 'none';
}

/**
 * Single rule: user must complete onboarding (step 2) when the backend says so.
 * Prefers the explicit `onboarding_completed` flag from the user object; only
 * falls back to inferring from merchant/merchant_id when the flag is missing
 * (older API responses or non-authenticated callers).
 * @param {object|null|undefined} user
 * @param {object|null|undefined} merchant
 * @returns {boolean}
 */
export function shouldSendToMerchantOnboarding(user, merchant) {
    if (user && typeof user === 'object' && user.onboarding_completed !== undefined) {
        return user.onboarding_completed === false;
    }
    const m = merchant || user?.merchant || null;
    if (m) return false;
    if (!user || typeof user !== 'object') return false;
    return !user.merchant_id;
}

/**
 * Already-authenticated users on login: onboarding if no merchant, else dashboard when approved, else profile.
 * @param {object|null|undefined} merchant
 * @param {string} [locale]
 * @param {object|null|undefined} [user]
 * @returns {string}
 */
export function getAuthenticatedSessionPath(merchant, locale, user = null) {
    const lng = locale ?? getStoredOrDefaultLocale();
    if (shouldSendToMerchantOnboarding(user, merchant)) {
        return '/merchant/register?step=2';
    }
    const status = merchant?.status ? String(merchant.status).toLowerCase() : null;
    if (status === 'approved') {
        return buildPrefixedPath('/merchant/dashboard', lng);
    }
    return buildPrefixedPath('/merchant/profile', lng);
}

/**
 * @param {object|null|undefined} merchantFromResponse
 * @returns {{ hasAnyPosScopesEnabled: boolean, hasAnySalesScopesEnabled: boolean }}
 */
function computeScopeDestinations(merchantFromResponse) {
    const merchantScopes = Array.isArray(merchantFromResponse?.scopes) ? merchantFromResponse.scopes : [];
    const hasSoftPosScope = merchantScopes.includes('softpos');
    const hasCashierScope = merchantScopes.includes('cashier');

    const planScopes = Array.isArray(merchantFromResponse?.plan?.plan_scopes)
        ? merchantFromResponse.plan.plan_scopes
        : [];

    const posScopes = planScopes.filter(
        (scope) => scope.module === 'pos' && POS_SCOPE_TYPES.includes(scope.scope_type)
    );
    const salesScopes = planScopes.filter(
        (scope) => scope.module === 'cashier' && SALES_SCOPE_TYPES.includes(scope.scope_type)
    );

    const hasAnyPosScopesEnabled =
        planScopes.length === 0
            ? hasSoftPosScope
            : posScopes.length > 0 && posScopes.some((scope) => scope.is_enabled === true);

    const hasAnySalesScopesEnabled =
        planScopes.length === 0
            ? hasCashierScope
            : salesScopes.length > 0 && salesScopes.some((scope) => scope.is_enabled === true);

    return { hasAnyPosScopesEnabled, hasAnySalesScopesEnabled };
}

/**
 * Target route after a successful merchant login (store `login` already ran).
 * @param {{
 *   loginResult: object,
 *   currentMerchant: object|null|undefined,
 *   locale?: string
 * }} params
 * @returns {{ path: string, replace: boolean }}
 */
export function getPostLoginNavigation({ loginResult, currentMerchant, locale }) {
    const lng = locale ?? getStoredOrDefaultLocale();

    const user = loginResult?.user;
    const merchantFromResponse = loginResult?.merchant || loginResult?.user?.merchant || currentMerchant;

    // ONE rule for the onboarding decision. authStore guarantees that
    // `loginResult.onboarding_completed` is set to a boolean after login/exchange.
    const onboardingCompleted =
        loginResult?.onboarding_completed
        ?? user?.onboarding_completed
        ?? !shouldSendToMerchantOnboarding(user, merchantFromResponse);

    if (onboardingCompleted === false) {
        return { path: '/merchant/register?step=2', replace: true };
    }

    // Onboarding done → standard routing based on merchant status / scopes.
    const status = merchantFromResponse?.status ? String(merchantFromResponse.status).toLowerCase() : null;

    if (status !== 'approved') {
        return { path: buildPrefixedPath('/merchant/profile', lng), replace: true };
    }

    const { hasAnyPosScopesEnabled, hasAnySalesScopesEnabled } = computeScopeDestinations(merchantFromResponse);

    if (hasAnyPosScopesEnabled) {
        return { path: buildPrefixedPath('/merchant/dashboard', lng), replace: true };
    }
    if (hasAnySalesScopesEnabled) {
        return { path: buildPrefixedPath('/sales/dashboard', lng), replace: true };
    }
    return { path: buildPrefixedPath('/merchant/profile', lng), replace: true };
}

/**
 * @param {unknown} err
 * @param {string|null|undefined} storeError
 * @param {string} fallbackMessage
 * @returns {string}
 */
export function getMerchantLoginErrorMessage(err, storeError, fallbackMessage) {
    if (err && typeof err === 'object' && 'response' in err) {
        const message = err.response?.data?.message;
        if (typeof message === 'string' && message) return message;
    }
    if (typeof storeError === 'string' && storeError) return storeError;
    return fallbackMessage;
}

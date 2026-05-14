/**
 * Central registry for static asset URLs (Payment app).
 * Files live in `public/`; Vite serves them from the site root.
 * Add or change paths here instead of hardcoding `src="/…"` across components.
 *
 * @see https://vitejs.dev/guide/assets.html#the-public-directory
 */

/** @param {string} path - path relative to public root, e.g. "icons/foo.png" or "/icons/foo.png" */
export function publicAssetUrl(path) {
    const normalized = path.startsWith('/') ? path : `/${path}`;
    return normalized.replace(/\/{2,}/g, '/');
}

/** Extend with new top-level keys (e.g. `dashboard`, `landing`) as the app grows. */
export const APP_ASSETS = {
    auth: {
        google: publicAssetUrl('google.png'),
        merchantLogin: {
            brandLogo: publicAssetUrl('faspay_logo_1.png'),
            featureInstantSettlements: publicAssetUrl('shop.png'),
            featureSecure: publicAssetUrl('shiled.png'),
            featureTrackGrow: publicAssetUrl('growth.png'),
        },
    },
    /** Full-page backgrounds, shared chrome, etc. */
    layout: {
        merchantLoginBackground: publicAssetUrl('login_background.png'),
        /** Mobile uses a pure-CSS gradient + SVG waves (no image file). See merchantLogin.css @media max-width 991.98px */
    },
};

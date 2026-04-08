/**
 * SoftPos routes that use the admin dashboard JWT (same token as /api/v2/admin/*),
 * not merchant X-Scope — whether the URL is bare (localhost:8001/partners) or behind a gateway (.../api/softpos/partners).
 */
export const isSoftPosAdminJwtRoute = (url) => {
    if (!url || typeof url !== 'string') return false;
    const path = url.split('?')[0];
    if (/\/v\d+\/merchant\//i.test(path)) return false;
    return (
        /\/partners(\/|$)/.test(path) ||
        /\/service-categories(\/|$)/.test(path) ||
        /\/service-sub-categories(\/|$)/.test(path) ||
        /\/service-types(\/|$)/.test(path) ||
        /\/services(\/|$)/.test(path) ||
        /\/products(\/|$)/.test(path)
    );
};

/**
 * Localized labels for merchant business types (API values from BusinessType enum).
 */
export function getBusinessTypeLabel(value, t, fallback = '') {
    if (!value) return fallback;
    const key = `auth.businessTypes.${value}`;
    const translated = t(key);
    return translated !== key ? translated : fallback || value;
}

export function getBusinessTypeOptionLabel(type, t) {
    const value = type?.value ?? type?.id;
    const fallback = type?.text ?? type?.label ?? type?.name ?? '';
    return getBusinessTypeLabel(value, t, fallback);
}

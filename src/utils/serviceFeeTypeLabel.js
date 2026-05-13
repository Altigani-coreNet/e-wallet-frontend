/**
 * Map stored service fee `type` values to i18n labels under admin.settings.serviceFees.types.<slug>.
 * Unknown values fall back to the original string (defaultValue).
 */
export function serviceFeeTypeSlug(raw) {
    if (raw == null || raw === '') return '';
    return String(raw)
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '');
}

export function translateServiceFeeType(t, raw) {
    if (raw == null || raw === '') return '';
    const slug = serviceFeeTypeSlug(raw);
    if (!slug) return String(raw).trim();
    return t(`admin.settings.serviceFees.types.${slug}`, { defaultValue: String(raw).trim() });
}

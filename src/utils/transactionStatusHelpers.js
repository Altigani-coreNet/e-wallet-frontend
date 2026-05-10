/**
 * Maps server-side transaction status values to i18n keys under `merchant.filters`.
 * Unknown values are returned as-is for display (e.g. new API values still in English).
 */

/** Status values shown in merchant transaction filters (must match API). */
export const MERCHANT_TRANSACTION_STATUS_FILTER_VALUES = [
    'APPROVED',
    'DECLINED',
    'PENDING',
    'CAPTURED',
    'VOIDED',
    'REFUNDED',
];

const STATUS_TO_I18N_KEY = {
    APPROVED: 'merchant.filters.statusApproved',
    DECLINED: 'merchant.filters.statusDeclined',
    PENDING: 'merchant.filters.statusPending',
    FAILED: 'merchant.filters.statusFailed',
    PROCESSED: 'merchant.filters.statusProcessed',
    REFUNDED: 'merchant.filters.statusRefunded',
    CAPTURED: 'merchant.filters.statusCaptured',
    VOIDED: 'merchant.filters.statusVoided',
    CANCELLED: 'merchant.filters.statusCancelled',
    EXPIRED: 'merchant.filters.statusExpired',
    REVERSED: 'merchant.filters.statusReversed',
};

/**
 * @param {string | null | undefined} status
 * @returns {string} Uppercase normalized key, or '' if empty
 */
export function normalizeTransactionStatusKey(status) {
    if (status == null || status === '') return '';
    return String(status)
        .trim()
        .toUpperCase()
        .replace(/\s+/g, '_');
}

/**
 * Localized label for a transaction status from the API.
 * @param {string | null | undefined} status - Raw value from server (any casing)
 * @param {(key: string) => string} t - i18next `t` function
 * @returns {string} Translated label, or original trimmed string if unmapped
 */
export function getTransactionStatusLabel(status, t) {
    const key = normalizeTransactionStatusKey(status);
    if (!key) return '';
    const i18nKey = STATUS_TO_I18N_KEY[key];
    if (i18nKey) return t(i18nKey);
    return String(status).trim();
}

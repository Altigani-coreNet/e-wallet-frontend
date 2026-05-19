const STATUS_TO_I18N_KEY = {
    PENDING: 'admin.serviceTransactionsIndex.statusPending',
    COMPLETED: 'admin.serviceTransactionsIndex.statusCompleted',
    FAILED: 'admin.serviceTransactionsIndex.statusFailed',
    SKIPPED: 'admin.serviceTransactionsIndex.statusSkipped',
};

/**
 * @param {string | null | undefined} status
 * @returns {string}
 */
export function normalizeServiceTransactionStatusKey(status) {
    if (status == null || status === '') return '';
    return String(status).trim().toUpperCase();
}

/**
 * Localized label for a service transaction status from the API.
 * @param {string | null | undefined} status
 * @param {(key: string) => string} t
 * @returns {string}
 */
export function getServiceTransactionStatusLabel(status, t) {
    const key = normalizeServiceTransactionStatusKey(status);
    if (!key) return '';
    const i18nKey = STATUS_TO_I18N_KEY[key];
    if (i18nKey) return t(i18nKey);
    return String(status).trim();
}

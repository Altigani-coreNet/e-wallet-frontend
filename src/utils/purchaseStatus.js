/**
 * Purchase `status` is stored as boolean 0|1 in MySQL, not a string label.
 * @param {unknown} status
 * @returns {0|1}
 */
export function normalizePurchaseStatus(status) {
    if (status === 'received') {
        return 0;
    }
    const n = Number(status);
    if (!Number.isFinite(n)) {
        return 0;
    }
    return n ? 1 : 0;
}

/**
 * @param {unknown} status
 * @returns {'Received'|'Completed'}
 */
export function formatPurchaseStatusLabel(status) {
    return normalizePurchaseStatus(status) === 1 ? 'Completed' : 'Received';
}

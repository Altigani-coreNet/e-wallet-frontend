/**
 * Batch list/detail helpers (no React dependencies).
 */

export const BATCH_STATUS_COLORS = {
    settled: 'success',
    pending: 'warning',
    failed: 'danger',
};

export function getBatchStatusColor(status) {
    return BATCH_STATUS_COLORS[status?.toLowerCase()] || 'secondary';
}

/**
 * @param {string} status
 * @param {(key: string) => string} t
 * @param {string} [namespace] - i18n prefix, e.g. `merchant.batches` or `admin.batchDetail`
 */
export function getBatchStatusLabel(status, t, namespace = 'merchant.batches') {
    const useShortKeys = namespace === 'admin.batchesIndex';
    const keyMap = useShortKeys
        ? { settled: 'settled', pending: 'pending', failed: 'failed' }
        : { settled: 'statusSettled', pending: 'statusPending', failed: 'statusFailed' };
    const key = keyMap[status?.toLowerCase()];
    if (key) return t(`${namespace}.${key}`);
    return status
        ? status.charAt(0).toUpperCase() + status.slice(1)
        : t('merchant.common.na');
}

/**
 * @param {string} status
 * @param {(key: string) => string} t
 * @param {string} [namespace] - i18n prefix, e.g. `merchant.settlements` or `admin.settlementsIndex`
 */
export function getSettlementStatusLabel(status, t, namespace = 'merchant.settlements') {
    const keyMap = {
        settled: namespace.startsWith('admin.') ? 'settled' : 'statusSettled',
        pending: namespace.startsWith('admin.') ? 'pending' : 'statusPending',
        failed: namespace.startsWith('admin.') ? 'failed' : 'statusFailed',
    };
    const mapped = keyMap[status?.toLowerCase()];
    if (mapped) return t(`${namespace}.${mapped}`);
    return status
        ? status.charAt(0).toUpperCase() + status.slice(1)
        : t('merchant.common.na');
}

export function getPaginationNumbers(currentPage, lastPage, maxVisible = 5) {
    const pages = [];

    if (lastPage <= maxVisible) {
        for (let i = 1; i <= lastPage; i++) {
            pages.push(i);
        }
        return pages;
    }

    if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(lastPage);
    } else if (currentPage >= lastPage - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = lastPage - 3; i <= lastPage; i++) pages.push(i);
    } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(lastPage);
    }

    return pages;
}

export function getPageRange(currentPage, perPage, totalRows, rowCount) {
    const from = rowCount > 0 ? (currentPage - 1) * perPage + 1 : 0;
    const to = Math.min(currentPage * perPage, totalRows);
    return { from, to };
}

export const DEFAULT_BATCH_FILTERS = {
    search: '',
    status: '',
    from_date: '',
    to_date: '',
};

import axios from 'axios';
import { ADMIN_ENDPOINTS } from './constants';
import { getToken } from './api';
import { exportToExcel } from './excelExport';
import { fetchMerchantCountryInfo } from '../services/adminMerchantLookupService';

const DEFAULT_LABELS = {
    batchNumber: 'Batch Number',
    merchantName: 'Merchant Name',
    merchantCountry: 'Merchant Country',
    status: 'Status',
    totalAmount: 'Total Amount',
    currency: 'Currency',
    transactionCount: 'Transaction Count',
    createdDate: 'Created Date',
    updatedDate: 'Updated Date',
    na: 'N/A',
};

const DEFAULT_MESSAGES = {
    authRequired: 'Authentication required. Please login again.',
    noData: 'No batches found to export.',
    fetching: 'Fetching batches...',
    fetchedCount: 'Fetched {{count}} batches...',
    loadingMerchants: 'Loading merchant information...',
    preparing: 'Preparing export data...',
    generating: 'Generating Excel file...',
};

/**
 * Export batches to Excel
 * @param {Object} filters - Filter parameters
 * @param {Object} [options]
 * @param {Function} [options.progressCallback]
 * @param {Object} [options.labels] - Localized Excel column headers
 * @param {Object} [options.messages] - Localized progress/error messages
 * @param {Function} [options.formatDate]
 * @param {Function} [options.formatStatus]
 * @param {Function} [options.formatProgressCount]
 * @returns {Promise<Object>}
 */
export const exportBatches = async (filters = {}, options = {}) => {
    const {
        progressCallback = null,
        labels: labelsInput = {},
        messages: messagesInput = {},
        formatDate = (date) => (date ? new Date(date).toLocaleString() : DEFAULT_LABELS.na),
        formatStatus = (status) => status || DEFAULT_LABELS.na,
        formatProgressCount = (count) => String(count),
    } = options;

    const labels = { ...DEFAULT_LABELS, ...labelsInput };
    const messages = { ...DEFAULT_MESSAGES, ...messagesInput };

    const token = getToken();
    if (!token) {
        throw new Error(messages.authRequired);
    }

    const MAX_EXPORT_LIMIT = 1000;
    const EXPORT_PER_PAGE = 100;

    const exportFilters = { ...filters };

    Object.keys(exportFilters).forEach((key) => {
        if (exportFilters[key] === '' || exportFilters[key] === null || exportFilters[key] === undefined) {
            delete exportFilters[key];
        }
    });

    let allBatches = [];
    let currentPage = 1;
    let hasMore = true;

    if (progressCallback) {
        progressCallback(messages.fetching);
    }

    while (hasMore && allBatches.length < MAX_EXPORT_LIMIT) {
        const params = {
            page: currentPage,
            per_page: EXPORT_PER_PAGE,
            ...exportFilters,
        };

        const response = await axios.get(ADMIN_ENDPOINTS.BATCHES, {
            params,
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/json',
            },
        });

        const batchesData = response.data?.data?.data || [];
        allBatches = [...allBatches, ...batchesData];

        const totalPages = response.data?.data?.last_page || 1;
        hasMore = currentPage < totalPages && allBatches.length < MAX_EXPORT_LIMIT;
        currentPage++;

        if (progressCallback) {
            progressCallback(
                messages.fetchedCount.replace('{{count}}', formatProgressCount(allBatches.length))
            );
        }
    }

    allBatches = allBatches.slice(0, MAX_EXPORT_LIMIT);

    if (allBatches.length === 0) {
        throw new Error(messages.noData);
    }

    if (progressCallback) {
        progressCallback(messages.loadingMerchants);
    }

    const merchantIds = [
        ...new Set(
            allBatches
                .map((b) => b.merchant_id || b.merchant?.id)
                .filter((id) => id !== null && id !== undefined && id !== '')
                .map((id) => String(id))
        ),
    ];

    const merchantInfoMap = await fetchMerchantCountryInfo(merchantIds);

    if (progressCallback) {
        progressCallback(messages.preparing);
    }

    const exportData = allBatches.map((batch) => {
        const merchantId = String(batch.merchant_id || batch.merchant?.id || '');
        const merchantInfo = merchantInfoMap[merchantId] || {};

        return {
            [labels.batchNumber]: batch.batch_number || labels.na,
            [labels.merchantName]:
                merchantInfo.name ||
                batch.merchant?.business_name ||
                batch.merchant?.name ||
                labels.na,
            [labels.merchantCountry]:
                merchantInfo.countryName || batch.merchant?.country?.name || labels.na,
            [labels.status]: formatStatus(batch.status) || labels.na,
            [labels.totalAmount]: parseFloat(batch.total_amount || 0).toFixed(2),
            [labels.currency]: batch.currency || batch.currency_symbol || '$',
            [labels.transactionCount]: batch.transaction_count || 0,
            [labels.createdDate]: formatDate(batch.created_at) || labels.na,
            [labels.updatedDate]: formatDate(batch.updated_at) || labels.na,
        };
    });

    if (progressCallback) {
        progressCallback(messages.generating);
    }

    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '_');
    const filename = `admin_batches_${timestamp}.xlsx`;

    exportToExcel(exportData, filename);

    return {
        count: exportData.length,
        filename,
    };
};

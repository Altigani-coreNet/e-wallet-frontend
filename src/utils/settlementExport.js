import axios from 'axios';
import { ADMIN_ENDPOINTS } from './constants';
import { getToken } from './api';
import { exportToExcel } from './excelExport';
import { fetchMerchantCountryInfo } from '../services/adminMerchantLookupService';

const DEFAULT_LABELS = {
    settlementId: 'Settlement ID',
    settlementNumber: 'Settlement Number',
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
    noData: 'No settlements found to export.',
    fetching: 'Fetching settlements...',
    fetchedCount: 'Fetched {{count}} settlements...',
    loadingMerchants: 'Loading merchant information...',
    preparing: 'Preparing export data...',
    generating: 'Generating Excel file...',
};

/**
 * Export settlements to Excel
 * @param {Object} filters - Filter parameters
 * @param {Object} [options]
 * @param {Function} [options.progressCallback] - Progress updates
 * @param {Object} [options.labels] - Localized Excel column headers
 * @param {Object} [options.messages] - Localized progress/error messages
 * @param {Function} [options.formatDate] - Format ISO date for export cells
 * @param {Function} [options.formatStatus] - Localized settlement status label
 * @param {Function} [options.formatProgressCount] - Localize counts in progress text
 * @returns {Promise<Object>} - Returns count and filename
 */
export const exportSettlements = async (filters = {}, options = {}) => {
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

    let allSettlements = [];
    let currentPage = 1;
    let hasMore = true;

    if (progressCallback) {
        progressCallback(messages.fetching);
    }

    while (hasMore && allSettlements.length < MAX_EXPORT_LIMIT) {
        const params = {
            page: currentPage,
            per_page: EXPORT_PER_PAGE,
            ...exportFilters,
        };

        const response = await axios.get(ADMIN_ENDPOINTS.SETTLEMENTS, {
            params,
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/json',
            },
        });

        const settlementsData = response.data?.data?.data || [];
        allSettlements = [...allSettlements, ...settlementsData];

        const totalPages = response.data?.data?.last_page || 1;
        hasMore = currentPage < totalPages && allSettlements.length < MAX_EXPORT_LIMIT;
        currentPage++;

        if (progressCallback) {
            progressCallback(
                messages.fetchedCount.replace('{{count}}', formatProgressCount(allSettlements.length))
            );
        }
    }

    allSettlements = allSettlements.slice(0, MAX_EXPORT_LIMIT);

    if (allSettlements.length === 0) {
        throw new Error(messages.noData);
    }

    if (progressCallback) {
        progressCallback(messages.loadingMerchants);
    }

    const merchantIds = [
        ...new Set(
            allSettlements
                .map((s) => s.merchant_id || s.merchant?.id)
                .filter((id) => id !== null && id !== undefined && id !== '')
                .map((id) => String(id))
        ),
    ];

    const merchantInfoMap = await fetchMerchantCountryInfo(merchantIds);

    if (progressCallback) {
        progressCallback(messages.preparing);
    }

    const exportData = allSettlements.map((settlement) => {
        const merchantId = String(settlement.merchant_id || settlement.merchant?.id || '');
        const merchantInfo = merchantInfoMap[merchantId] || {};

        return {
            [labels.settlementId]: settlement.id || labels.na,
            [labels.settlementNumber]: settlement.settlement_id || labels.na,
            [labels.batchNumber]: settlement.batch?.batch_number || settlement.batch_number || labels.na,
            [labels.merchantName]:
                merchantInfo.name ||
                settlement.merchant?.business_name ||
                settlement.merchant?.name ||
                labels.na,
            [labels.merchantCountry]:
                merchantInfo.countryName || settlement.merchant?.country?.name || labels.na,
            [labels.status]: formatStatus(settlement.status) || labels.na,
            [labels.totalAmount]: parseFloat(settlement.total_amount || 0).toFixed(2),
            [labels.currency]: settlement.currency || settlement.currency_symbol || '$',
            [labels.transactionCount]: settlement.transaction_count || 0,
            [labels.createdDate]: formatDate(settlement.created_at) || labels.na,
            [labels.updatedDate]: formatDate(settlement.updated_at) || labels.na,
        };
    });

    if (progressCallback) {
        progressCallback(messages.generating);
    }

    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '_');
    const filename = `admin_settlements_${timestamp}.xlsx`;

    exportToExcel(exportData, filename);

    return {
        count: exportData.length,
        filename,
    };
};

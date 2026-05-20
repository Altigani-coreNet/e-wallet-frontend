import axios from 'axios';
import { ADMIN_ENDPOINTS } from './constants';
import { getToken } from './api';
import { exportToExcel } from './excelExport';
import { fetchMerchantCountryInfo } from '../services/adminMerchantLookupService';
import { fetchUserInfoByIdsV2 } from '../services/userLookupService';

/**
 * Export transactions to Excel
 * @param {Object} filters - Filter parameters
 * @param {string} urlType - Optional transaction type filter
 * @param {Function} progressCallback - Optional callback for progress updates
 * @returns {Promise<void>}
 */
export const exportTransactions = async (filters = {}, urlType = null, progressCallback = null) => {
    const token = getToken();
    if (!token) {
        throw new Error('Authentication required. Please login again.');
    }

    // Set max limit for export
    const MAX_EXPORT_LIMIT = 1000;
    const EXPORT_PER_PAGE = 100;

    // Build query parameters for fetching transactions
    const exportFilters = { ...filters };
    if (urlType) {
        exportFilters.type = urlType;
    }

    // Remove empty filter values
    Object.keys(exportFilters).forEach(key => {
        if (exportFilters[key] === '' || exportFilters[key] === null || exportFilters[key] === undefined) {
            delete exportFilters[key];
        }
    });

    // Fetch transactions in batches
    let allTransactions = [];
    let currentPage = 1;
    let hasMore = true;

    if (progressCallback) {
        progressCallback('Fetching transactions...');
    }

    while (hasMore && allTransactions.length < MAX_EXPORT_LIMIT) {
        const params = {
            page: currentPage,
            per_page: EXPORT_PER_PAGE,
            ...exportFilters
        };

        const response = await axios.get(ADMIN_ENDPOINTS.TRANSACTIONS, {
            params,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        const transactionsData = response.data?.data?.data || [];
        allTransactions = [...allTransactions, ...transactionsData];

        const totalPages = response.data?.data?.last_page || 1;
        hasMore = currentPage < totalPages && allTransactions.length < MAX_EXPORT_LIMIT;
        currentPage++;

        // Update progress
        if (progressCallback) {
            progressCallback(`Fetched ${allTransactions.length} transactions...`);
        }
    }

    // Limit to MAX_EXPORT_LIMIT
    allTransactions = allTransactions.slice(0, MAX_EXPORT_LIMIT);

    if (allTransactions.length === 0) {
        throw new Error('No transactions found to export.');
    }

    const needsMerchantLookup = allTransactions.some(
        (t) => !t.merchant_name && t.merchant_id
    );
    const needsUserLookup = allTransactions.some((t) => !t.user_name && t.user_id);

    let merchantInfoMap = {};
    let userInfoMap = {};

    if (needsMerchantLookup || needsUserLookup) {
        if (progressCallback) {
            progressCallback('Loading merchant and user information...');
        }

        const merchantIds = needsMerchantLookup
            ? [...new Set(
                  allTransactions
                      .map((t) => t.merchant_id)
                      .filter((id) => id !== null && id !== undefined && id !== '')
                      .map((id) => String(id))
              )]
            : [];

        const userIds = needsUserLookup
            ? [...new Set(
                  allTransactions
                      .map((t) => t.user_id)
                      .filter((id) => id !== null && id !== undefined && id !== '')
                      .map((id) => String(id))
              )]
            : [];

        const [merchants, users] = await Promise.all([
            needsMerchantLookup ? fetchMerchantCountryInfo(merchantIds) : Promise.resolve({}),
            needsUserLookup ? fetchUserInfoByIdsV2(userIds) : Promise.resolve({}),
        ]);
        merchantInfoMap = merchants;
        userInfoMap = users;
    }

    if (progressCallback) {
        progressCallback('Preparing export data...');
    }

    // Transform transactions to export format with merchant and user names
    const exportData = allTransactions.map(transaction => {
        const merchantId = String(transaction.merchant_id || '');
        const userId = String(transaction.user_id || '');
        
        const merchantInfo = merchantInfoMap[merchantId] || {};
        const userInfo = userInfoMap[userId] || {};

        return {
            'Transaction ID': transaction.transaction_id || transaction.id || 'N/A',
            'RRN': transaction.rrn || 'N/A',
            'Merchant Name': transaction.merchant_name || merchantInfo.name || 'N/A',
            'Merchant Country': transaction.country_name || merchantInfo.countryName || 'N/A',
            'User Name': transaction.user_name || userInfo.name || 'N/A',
            'Terminal ID': transaction.terminal_id || 'N/A',
            'Payment Method': transaction.payment_method?.name || transaction.payment_method || 'N/A',
            'Card Number': transaction.card_number 
                ? `**** **** **** ${transaction.card_number.slice(-4)}` 
                : 'N/A',
            'Amount': parseFloat(transaction.amount || 0).toFixed(2),
            'Currency': transaction.currency || transaction.currency_symbol || '$',
            'Batch No': transaction.batch_no || 'N/A',
            'SDK': transaction.sdk_id || 'N/A',
            'Payment Type': transaction.payment_type || 'N/A',
            'Status': transaction.status || 'N/A',
            'Created Date': transaction.created_at 
                ? new Date(transaction.created_at).toLocaleString() 
                : 'N/A',
            'Description': transaction.description || 'N/A',
        };
    });

    if (progressCallback) {
        progressCallback('Generating Excel file...');
    }

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '_');
    const filename = `admin_transactions_${timestamp}.xlsx`;

    // Export to Excel
    exportToExcel(exportData, filename);

    return {
        count: exportData.length,
        filename
    };
};


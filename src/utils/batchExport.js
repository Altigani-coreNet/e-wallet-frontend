import axios from 'axios';
import { ADMIN_ENDPOINTS } from './constants';
import { getToken } from './api';
import { exportToExcel } from './excelExport';
import { fetchMerchantCountryInfo } from '../services/adminMerchantLookupService';

/**
 * Export batches to Excel
 * @param {Object} filters - Filter parameters
 * @param {Function} progressCallback - Optional callback for progress updates
 * @returns {Promise<Object>} - Returns count and filename
 */
export const exportBatches = async (filters = {}, progressCallback = null) => {
    const token = getToken();
    if (!token) {
        throw new Error('Authentication required. Please login again.');
    }

    // Set max limit for export
    const MAX_EXPORT_LIMIT = 1000;
    const EXPORT_PER_PAGE = 100;

    // Build query parameters for fetching batches
    const exportFilters = { ...filters };

    // Remove empty filter values
    Object.keys(exportFilters).forEach(key => {
        if (exportFilters[key] === '' || exportFilters[key] === null || exportFilters[key] === undefined) {
            delete exportFilters[key];
        }
    });

    // Fetch batches in batches (pagination)
    let allBatches = [];
    let currentPage = 1;
    let hasMore = true;

    if (progressCallback) {
        progressCallback('Fetching batches...');
    }

    while (hasMore && allBatches.length < MAX_EXPORT_LIMIT) {
        const params = {
            page: currentPage,
            per_page: EXPORT_PER_PAGE,
            ...exportFilters
        };

        const response = await axios.get(ADMIN_ENDPOINTS.BATCHES, {
            params,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        const batchesData = response.data?.data?.data || [];
        allBatches = [...allBatches, ...batchesData];

        const totalPages = response.data?.data?.last_page || 1;
        hasMore = currentPage < totalPages && allBatches.length < MAX_EXPORT_LIMIT;
        currentPage++;

        // Update progress
        if (progressCallback) {
            progressCallback(`Fetched ${allBatches.length} batches...`);
        }
    }

    // Limit to MAX_EXPORT_LIMIT
    allBatches = allBatches.slice(0, MAX_EXPORT_LIMIT);

    if (allBatches.length === 0) {
        throw new Error('No batches found to export.');
    }

    if (progressCallback) {
        progressCallback('Loading merchant information...');
    }

    // Extract merchant IDs for lookup
    const merchantIds = [...new Set(
        allBatches
            .map(b => b.merchant_id || b.merchant?.id)
            .filter(id => id !== null && id !== undefined && id !== '')
            .map(id => String(id))
    )];

    // Fetch merchant info
    const merchantInfoMap = await fetchMerchantCountryInfo(merchantIds);

    if (progressCallback) {
        progressCallback('Preparing export data...');
    }

    // Transform batches to export format with merchant names
    const exportData = allBatches.map(batch => {
        const merchantId = String(batch.merchant_id || batch.merchant?.id || '');
        const merchantInfo = merchantInfoMap[merchantId] || {};

        return {
            'Batch Number': batch.batch_number || 'N/A',
            'Merchant Name': merchantInfo.name || batch.merchant?.business_name || batch.merchant?.name || 'N/A',
            'Merchant Country': merchantInfo.countryName || batch.merchant?.country?.name || 'N/A',
            'Status': batch.status || 'N/A',
            'Total Amount': parseFloat(batch.total_amount || 0).toFixed(2),
            'Currency': batch.currency || batch.currency_symbol || '$',
            'Transaction Count': batch.transaction_count || 0,
            'Created Date': batch.created_at 
                ? new Date(batch.created_at).toLocaleString() 
                : 'N/A',
            'Updated Date': batch.updated_at 
                ? new Date(batch.updated_at).toLocaleString() 
                : 'N/A',
        };
    });

    if (progressCallback) {
        progressCallback('Generating Excel file...');
    }

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '_');
    const filename = `admin_batches_${timestamp}.xlsx`;

    // Export to Excel
    exportToExcel(exportData, filename);

    return {
        count: exportData.length,
        filename
    };
};


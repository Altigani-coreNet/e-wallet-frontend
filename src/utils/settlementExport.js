import axios from 'axios';
import { ADMIN_ENDPOINTS } from './constants';
import { getToken } from './api';
import { exportToExcel } from './excelExport';
import { fetchMerchantCountryInfo } from '../services/adminMerchantLookupService';

/**
 * Export settlements to Excel
 * @param {Object} filters - Filter parameters
 * @param {Function} progressCallback - Optional callback for progress updates
 * @returns {Promise<Object>} - Returns count and filename
 */
export const exportSettlements = async (filters = {}, progressCallback = null) => {
    const token = getToken();
    if (!token) {
        throw new Error('Authentication required. Please login again.');
    }

    // Set max limit for export
    const MAX_EXPORT_LIMIT = 1000;
    const EXPORT_PER_PAGE = 100;

    // Build query parameters for fetching settlements
    const exportFilters = { ...filters };

    // Remove empty filter values
    Object.keys(exportFilters).forEach(key => {
        if (exportFilters[key] === '' || exportFilters[key] === null || exportFilters[key] === undefined) {
            delete exportFilters[key];
        }
    });

    // Fetch settlements in batches (pagination)
    let allSettlements = [];
    let currentPage = 1;
    let hasMore = true;

    if (progressCallback) {
        progressCallback('Fetching settlements...');
    }

    while (hasMore && allSettlements.length < MAX_EXPORT_LIMIT) {
        const params = {
            page: currentPage,
            per_page: EXPORT_PER_PAGE,
            ...exportFilters
        };

        const response = await axios.get(ADMIN_ENDPOINTS.SETTLEMENTS, {
            params,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        const settlementsData = response.data?.data?.data || [];
        allSettlements = [...allSettlements, ...settlementsData];

        const totalPages = response.data?.data?.last_page || 1;
        hasMore = currentPage < totalPages && allSettlements.length < MAX_EXPORT_LIMIT;
        currentPage++;

        // Update progress
        if (progressCallback) {
            progressCallback(`Fetched ${allSettlements.length} settlements...`);
        }
    }

    // Limit to MAX_EXPORT_LIMIT
    allSettlements = allSettlements.slice(0, MAX_EXPORT_LIMIT);

    if (allSettlements.length === 0) {
        throw new Error('No settlements found to export.');
    }

    if (progressCallback) {
        progressCallback('Loading merchant information...');
    }

    // Extract merchant IDs for lookup
    const merchantIds = [...new Set(
        allSettlements
            .map(s => s.merchant_id || s.merchant?.id)
            .filter(id => id !== null && id !== undefined && id !== '')
            .map(id => String(id))
    )];

    // Fetch merchant info
    const merchantInfoMap = await fetchMerchantCountryInfo(merchantIds);

    if (progressCallback) {
        progressCallback('Preparing export data...');
    }

    // Transform settlements to export format with merchant names
    const exportData = allSettlements.map(settlement => {
        const merchantId = String(settlement.merchant_id || settlement.merchant?.id || '');
        const merchantInfo = merchantInfoMap[merchantId] || {};

        return {
            'Settlement ID': settlement.id || 'N/A',
            'Settlement Number': settlement.settlement_id || 'N/A',
            'Batch Number': settlement.batch?.batch_number || settlement.batch_number || 'N/A',
            'Merchant Name': merchantInfo.name || settlement.merchant?.business_name || settlement.merchant?.name || 'N/A',
            'Merchant Country': merchantInfo.countryName || settlement.merchant?.country?.name || 'N/A',
            'Status': settlement.status || 'N/A',
            'Total Amount': parseFloat(settlement.total_amount || 0).toFixed(2),
            'Currency': settlement.currency || settlement.currency_symbol || '$',
            'Transaction Count': settlement.transaction_count || 0,
            'Created Date': settlement.created_at 
                ? new Date(settlement.created_at).toLocaleString() 
                : 'N/A',
            'Updated Date': settlement.updated_at 
                ? new Date(settlement.updated_at).toLocaleString() 
                : 'N/A',
        };
    });

    if (progressCallback) {
        progressCallback('Generating Excel file...');
    }

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '_');
    const filename = `admin_settlements_${timestamp}.xlsx`;

    // Export to Excel
    exportToExcel(exportData, filename);

    return {
        count: exportData.length,
        filename
    };
};


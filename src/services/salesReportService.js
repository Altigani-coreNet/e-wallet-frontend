import api from '../utils/api';
import { useQuery } from '@tanstack/react-query';
import { POS_API_BASE } from '../utils/constants';
import { LIST_QUERY_DEFAULTS } from '../utils/reactQueryDefaults';
import axios from 'axios';
import { getToken } from '../utils/api';

/**
 * Fetch sales (for React Query)
 * @param {Object} params - Query parameters
 * @returns {Promise} - API response data
 */
export const fetchSales = async (params = {}) => {
    const response = await api.get(`${POS_API_BASE}/v2/sales`, { params });
    return response.data;
};

export const salesReportService = {
    // Get completed sales
    getSales: (params) => api.get(`${POS_API_BASE}/v2/sales`, { params }),
    
    // Get draft sales
    getDrafts: (params) => api.get(`${POS_API_BASE}/v2/sales/drafts`, { params }),
    
    // Get return sales
    getReturns: (params) => api.get(`${POS_API_BASE}/v2/sales/returns`, { params }),
    
    // Get sale details by normal ID
    getSaleDetails: (id) => api.get(`${POS_API_BASE}/v2/sales/${id}`),
    
    // Delete a sale by normal ID
    deleteSale: (id) => api.del(`${POS_API_BASE}/v2/sales/${id}`),
    
    // Export sales to CSV
    exportSales: async (params) => {
        const token = getToken();
        const response = await axios.get(`${POS_API_BASE}/v2/sales/export`, {
            params: params,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            },
            responseType: 'blob'
        });
        
        // Create download link
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `sales_export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        
        return { success: true };
    },
    
    // Export drafts to CSV
    exportDrafts: async (params) => {
        const token = getToken();
        const response = await axios.get(`${POS_API_BASE}/v2/sales/drafts/export`, {
            params: params,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            },
            responseType: 'blob'
        });
        
        // Create download link
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `drafts_export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        
        return { success: true };
    },
    
    // Export returns to CSV
    exportReturns: async (params) => {
        const token = getToken();
        const response = await axios.get(`${POS_API_BASE}/v2/sales/returns/export`, {
            params: params,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            },
            responseType: 'blob'
        });
        
        // Create download link
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `returns_export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        
        return { success: true };
    },
    
    // Search sale by invoice number for return
    searchSaleByInvoice: (invoiceNo) => api.post(`${POS_API_BASE}/v1/sale-returns/search`, { invoice_no: invoiceNo }),
    
    // Process return sale
    processReturnSale: (saleId, returnData) => api.post(`${POS_API_BASE}/v1/sale-return/product/store/${saleId}`, returnData),
};

// ==================== REACT QUERY HOOKS ====================

/**
 * React Query keys for sales
 */
export const salesKeys = {
    all: ['sales'],
    list: (params) => ['sales', 'list', params],
    detail: (id) => ['sales', 'detail', id],
};

/**
 * React Query hook for fetching sales list
 */
export const useSales = (params = {}, options = {}) => {
    return useQuery({
        queryKey: salesKeys.list(params),
        queryFn: () => fetchSales(params),
        ...LIST_QUERY_DEFAULTS,
        ...options,
    });
};


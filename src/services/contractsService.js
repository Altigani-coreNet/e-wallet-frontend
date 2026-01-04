import { get } from '../utils/api';
import { SOFTPOS_ENDPOINTS } from '../utils/constants';

/**
 * Get contract terms and merchant information
 * @returns {Promise} - API response
 */
export const getContractTerms = async () => {
    try {
        const response = await get(SOFTPOS_ENDPOINTS.CONTRACTS);
        
        return {
            success: true,
            data: response.data?.data || response.data
        };
    } catch (error) {
        console.error('Error in getContractTerms:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to fetch contract terms'
        };
    }
};

/**
 * Download contract PDF
 * @returns {Promise} - Download file
 */
export const downloadContractPDF = async () => {
    try {
        const { getToken } = await import('../utils/api');
        const token = getToken();
        
        const response = await fetch(SOFTPOS_ENDPOINTS.CONTRACTS_DOWNLOAD, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `merchant_agreement_${new Date().toISOString().split('T')[0]}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            return { success: true };
        } else {
            return { success: false, error: 'Failed to download contract' };
        }
    } catch (error) {
        console.error('Error in downloadContractPDF:', error);
        return {
            success: false,
            error: error.message || 'Failed to download contract'
        };
    }
};


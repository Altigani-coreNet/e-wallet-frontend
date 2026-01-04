import axios from 'axios';
import { ADMIN_SYSTEM_ENDPOINTS } from '../utils/constants';
import { getToken } from '../utils/api';

const getApiToken = () => getToken();

export const getContractTerms = async () => {
    try {
        const token = getApiToken();
        const response = await axios.get(ADMIN_SYSTEM_ENDPOINTS.CONTRACT_TERMS, {
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        });
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: error.response?.data?.message || 'Failed to fetch contract terms' };
    }
};

export const updateContractTerms = async (data) => {
    try {
        const token = getApiToken();
        const response = await axios.post(ADMIN_SYSTEM_ENDPOINTS.CONTRACT_TERMS_UPDATE, data, {
            headers: { 
                'Authorization': `Bearer ${token}`, 
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        return { success: true, data: response.data };
    } catch (error) {
        return { 
            success: false, 
            error: error.response?.data?.message || 'Failed to update contract terms',
            errors: error.response?.data?.errors
        };
    }
};

export const previewTerms = async (lang) => {
    try {
        const token = getApiToken();
        const response = await axios.get(ADMIN_SYSTEM_ENDPOINTS.CONTRACT_TERMS_PREVIEW(lang), {
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        });
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: error.response?.data?.message || 'Failed to preview terms' };
    }
};

export const downloadTerms = async (lang) => {
    try {
        const token = getApiToken();
        const response = await axios.get(ADMIN_SYSTEM_ENDPOINTS.CONTRACT_TERMS_DOWNLOAD(lang), {
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'text/html' },
            responseType: 'blob'
        });
        
        // Create download link
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `contract_terms_${lang}.html`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        
        return { success: true };
    } catch (error) {
        return { success: false, error: error.response?.data?.message || 'Failed to download terms' };
    }
};



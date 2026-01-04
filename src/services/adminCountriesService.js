import axios from 'axios';
import { ADMIN_SYSTEM_ENDPOINTS } from '../utils/constants';
import { getToken } from '../utils/api';

const getApiToken = () => getToken();

export const getCountries = async (params = {}) => {
    try {
        const token = getApiToken();
        const response = await axios.get(ADMIN_SYSTEM_ENDPOINTS.COUNTRIES, {
            params: { page: params.page || 1, per_page: params.per_page || 15, ...params },
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        });
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: error.response?.data?.message || 'Failed to fetch countries' };
    }
};

export const getCountriesData = async (params = {}) => {
    try {
        const token = getApiToken();
        const response = await axios.get(ADMIN_SYSTEM_ENDPOINTS.COUNTRIES_DATA, {
            params: params,
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        });
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: error.response?.data?.message || 'Failed to fetch countries data' };
    }
};

export const getCountry = async (countryId) => {
    try {
        const token = getApiToken();
        const response = await axios.get(ADMIN_SYSTEM_ENDPOINTS.COUNTRY_DETAILS(countryId), {
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        });
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: error.response?.data?.message || 'Failed to fetch country' };
    }
};

export const createCountry = async (countryData) => {
    try {
        const token = getApiToken();
        const response = await axios.post(ADMIN_SYSTEM_ENDPOINTS.COUNTRIES, countryData, {
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
            error: error.response?.data?.message || 'Failed to create country',
            errors: error.response?.data?.errors
        };
    }
};

export const updateCountry = async (countryId, countryData) => {
    try {
        const token = getApiToken();
        const response = await axios.put(ADMIN_SYSTEM_ENDPOINTS.COUNTRY_DETAILS(countryId), countryData, {
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
            error: error.response?.data?.message || 'Failed to update country',
            errors: error.response?.data?.errors
        };
    }
};

export const deleteCountry = async (countryId) => {
    try {
        const token = getApiToken();
        const response = await axios.delete(ADMIN_SYSTEM_ENDPOINTS.COUNTRY_DETAILS(countryId), {
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        });
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: error.response?.data?.message || 'Failed to delete country' };
    }
};

export const bulkDeleteCountries = async (ids) => {
    try {
        const token = getApiToken();
        const response = await axios.post(ADMIN_SYSTEM_ENDPOINTS.COUNTRY_BULK_DELETE, { ids: ids.join(',') }, {
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        });
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: error.response?.data?.message || 'Failed to delete countries' };
    }
};

export const changeCountryStatus = async (countryId) => {
    try {
        const token = getApiToken();
        const response = await axios.post(ADMIN_SYSTEM_ENDPOINTS.COUNTRY_CHANGE_STATUS(countryId), {}, {
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        });
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: error.response?.data?.message || 'Failed to change country status' };
    }
};

export const getCountriesSelect = async (search = '') => {
    try {
        const token = getApiToken();
        const response = await axios.get(ADMIN_SYSTEM_ENDPOINTS.COUNTRIES_SELECT, {
            params: { search },
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        });
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: error.response?.data?.message || 'Failed to fetch countries for select' };
    }
};



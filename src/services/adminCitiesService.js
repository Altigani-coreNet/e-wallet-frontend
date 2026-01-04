import axios from 'axios';
import { ADMIN_SYSTEM_ENDPOINTS } from '../utils/constants';
import { getToken } from '../utils/api';

const getApiToken = () => getToken();

export const getCities = async (params = {}) => {
    try {
        const token = getApiToken();
        const response = await axios.get(ADMIN_SYSTEM_ENDPOINTS.CITIES, {
            params: { page: params.page || 1, per_page: params.per_page || 15, ...params },
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        });
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: error.response?.data?.message || 'Failed to fetch cities' };
    }
};

export const getCitiesData = async (params = {}) => {
    try {
        const token = getApiToken();
        const response = await axios.get(ADMIN_SYSTEM_ENDPOINTS.CITIES_DATA, {
            params: params,
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        });
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: error.response?.data?.message || 'Failed to fetch cities data' };
    }
};

export const getCity = async (cityId) => {
    try {
        const token = getApiToken();
        const response = await axios.get(ADMIN_SYSTEM_ENDPOINTS.CITY_DETAILS(cityId), {
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        });
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: error.response?.data?.message || 'Failed to fetch city' };
    }
};

export const createCity = async (cityData) => {
    try {
        const token = getApiToken();
        const response = await axios.post(ADMIN_SYSTEM_ENDPOINTS.CITIES, cityData, {
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
            error: error.response?.data?.message || 'Failed to create city',
            errors: error.response?.data?.errors
        };
    }
};

export const updateCity = async (cityId, cityData) => {
    try {
        const token = getApiToken();
        const response = await axios.put(ADMIN_SYSTEM_ENDPOINTS.CITY_DETAILS(cityId), cityData, {
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
            error: error.response?.data?.message || 'Failed to update city',
            errors: error.response?.data?.errors
        };
    }
};

export const deleteCity = async (cityId) => {
    try {
        const token = getApiToken();
        const response = await axios.delete(ADMIN_SYSTEM_ENDPOINTS.CITY_DETAILS(cityId), {
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        });
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: error.response?.data?.message || 'Failed to delete city' };
    }
};

export const bulkDeleteCities = async (ids) => {
    try {
        const token = getApiToken();
        const response = await axios.post(ADMIN_SYSTEM_ENDPOINTS.CITY_BULK_DELETE, { ids: ids.join(',') }, {
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        });
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: error.response?.data?.message || 'Failed to delete cities' };
    }
};

export const changeCityStatus = async (cityId) => {
    try {
        const token = getApiToken();
        const response = await axios.post(ADMIN_SYSTEM_ENDPOINTS.CITY_CHANGE_STATUS(cityId), {}, {
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        });
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: error.response?.data?.message || 'Failed to change city status' };
    }
};

export const getCitiesSelect = async (params = {}) => {
    try {
        const token = getApiToken();
        const response = await axios.get(ADMIN_SYSTEM_ENDPOINTS.CITIES_SELECT, {
            params: params,
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        });
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: error.response?.data?.message || 'Failed to fetch cities for select' };
    }
};



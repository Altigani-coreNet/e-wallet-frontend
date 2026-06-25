/**
 * @deprecated Use `import { http, get, post } from './api'` instead.
 * Compatibility adapter — preserves the `{ success, data, error }` return shape.
 */
import { get, post, put, del, patch } from './api';

const METHOD_MAP = {
    GET: get,
    POST: post,
    PUT: put,
    PATCH: patch,
    DELETE: del,
};

const emptySuccessPayload = {
    success: true,
    data: { success: true, data: [] },
};

export const apiRequest = async (url, method = 'GET', data = null, params = null, customHeaders = {}) => {
    try {
        const verb = method.toUpperCase();
        const requestFn = METHOD_MAP[verb] || get;
        const config = { headers: customHeaders };
        if (params) {
            config.params = params;
        }

        const response =
            verb === 'GET' || verb === 'DELETE'
                ? await requestFn(url, config)
                : await requestFn(url, data, config);

        if (response.status === 204 || !response.data) {
            return { ...emptySuccessPayload, status: response.status };
        }

        return {
            success: true,
            data: response.data,
            status: response.status,
        };
    } catch (error) {
        let errorMessage = error.message;
        let validationErrors = null;

        if (error.response?.data) {
            if (error.response.status === 422 && error.response.data.data) {
                validationErrors = error.response.data.data;
                errorMessage = validationErrors;
            } else if (typeof error.response.data === 'string') {
                errorMessage = error.response.data;
            } else if (error.response.data.message) {
                errorMessage = error.response.data.message;
            } else if (error.response.data.error) {
                errorMessage = error.response.data.error;
            } else if (error.response.data.data && typeof error.response.data.data === 'object') {
                validationErrors = error.response.data.data;
                errorMessage = validationErrors;
            }
        }

        return {
            success: false,
            error: errorMessage,
            details: error.response?.data,
            validationErrors,
            status: error.response?.status || 500,
        };
    }
};

export const apiGet = (url, params = null, headers = {}) => apiRequest(url, 'GET', null, params, headers);
export const apiPost = (url, data, params = null, headers = {}) => apiRequest(url, 'POST', data, params, headers);
export const apiPut = (url, data, params = null, headers = {}) => apiRequest(url, 'PUT', data, params, headers);
export const apiDelete = (url, params = null, headers = {}) => apiRequest(url, 'DELETE', null, params, headers);

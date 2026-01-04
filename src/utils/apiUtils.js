import axios from 'axios';
import { getToken as getApiToken } from './api';

// Get token from localStorage
const getToken = () => {
    return getApiToken() || '';
};

// API utility function
export const apiRequest = async (url, method = 'GET', data = null, params = null, customHeaders = {}) => {
    try {
        const token = getToken();
        
        // Log request details for debugging
        console.log('📤 API Request:', {
            url,
            method,
            hasToken: !!token,
            params
        });
        
        const config = {
            url,
            method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...customHeaders
            }
        };

        // Add data for POST, PUT, PATCH requests
        if (data && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
            config.data = data;
        }

        // Add query parameters
        if (params) {
            config.params = params;
        }

        const response = await axios(config);
        
        // Log successful response
        console.log('✅ API Response:', {
            url,
            status: response.status,
            hasData: !!response.data,
            dataKeys: response.data ? Object.keys(response.data) : null
        });
        
        // Handle 204 No Content responses (shouldn't happen for GET requests, but handle gracefully)
        if (response.status === 204) {
            console.warn('⚠️ 204 No Content received - this is unusual for a GET request:', {
                url: url,
                method: method,
                status: response.status
            });
            // Return empty data structure that matches expected format
            return {
                success: true,
                data: {
                    success: true,
                    data: [] // Return empty array for consistency
                },
                status: response.status
            };
        }
        
        // Handle empty responses (but status is 200)
        if (!response.data) {
            console.warn('⚠️ Empty response body received (but status 200):', {
                url: url,
                status: response.status,
                headers: response.headers
            });
            // Return structure that matches expected format
            return {
                success: true,
                data: {
                    success: true,
                    data: [] // Return empty array for consistency
                },
                status: response.status
            };
        }
        
        return {
            success: true,
            data: response.data,
            status: response.status
        };
    } catch (error) {
        // Log detailed error information
        console.error('❌ API Request Error:', {
            url: url,
            method: method,
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            headers: error.response?.headers,
            message: error.message,
            request: error.request ? 'Request made but no response' : 'No request made'
        });
        
        // Check if it's a CORS error
        if (error.message && (error.message.includes('CORS') || error.message.includes('Network Error'))) {
            console.error('🚫 CORS Error detected - Check backend CORS configuration');
        }
        
        // Handle 401 Unauthorized - redirect to appropriate login
        if (error.response?.status === 401) {
            console.warn('🔒 Unauthorized - Token may be invalid or expired');
            
            // Determine redirect path based on current route
            const currentPath = window.location.pathname;
            const isAdminRoute = currentPath.startsWith('/admin');
            const redirectPath = isAdminRoute ? '/admin/login' : '/login';
            
            // Trigger logout event with redirect path
            window.dispatchEvent(new CustomEvent('unauthorized', { 
                detail: { redirectPath } 
            }));
            
            // Clear token from localStorage
            localStorage.removeItem('admin_dashboard_token');
            localStorage.removeItem('admin_dashboard_user');
            localStorage.removeItem('admin_dashboard_merchant');
        }
        
        // Extract error message and validation errors
        let errorMessage = error.message;
        let validationErrors = null;
        
        if (error.response?.data) {
            // Check for validation errors (422 status)
            if (error.response.status === 422 && error.response.data.data) {
                validationErrors = error.response.data.data;
                errorMessage = validationErrors; // Pass the whole validation object
            } else if (typeof error.response.data === 'string') {
                errorMessage = error.response.data;
            } else if (error.response.data.message) {
                errorMessage = error.response.data.message;
            } else if (error.response.data.error) {
                errorMessage = error.response.data.error;
            } else if (error.response.data.data && typeof error.response.data.data === 'object') {
                // Laravel validation errors format
                validationErrors = error.response.data.data;
                errorMessage = validationErrors;
            }
        }
        
        return {
            success: false,
            error: errorMessage,
            details: error.response?.data,
            validationErrors: validationErrors,
            status: error.response?.status || 500
        };
    }
};


// Specific API methods for convenience
export const apiGet = (url, params = null, headers = {}) => apiRequest(url, 'GET', null, params, headers);
export const apiPost = (url, data, params = null, headers = {}) => apiRequest(url, 'POST', data, params, headers);
export const apiPut = (url, data, params = null, headers = {}) => apiRequest(url, 'PUT', data, params, headers);
export const apiDelete = (url, params = null, headers = {}) => apiRequest(url, 'DELETE', null, params, headers);


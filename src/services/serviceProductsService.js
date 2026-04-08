import axios from 'axios';
import { ADMIN_ENDPOINTS } from '../utils/constants';
import { getToken } from '../utils/api';

/**
 * Get API token
 */
const getApiToken = () => {
    return getToken();
};

/** Match backend Accept-Language resolution (ar vs en). */
const getAcceptLanguageHeader = () => {
    if (typeof window === 'undefined') {
        return 'en';
    }
    const stored = window.localStorage?.getItem('i18nextLng') || window.localStorage?.getItem('lang');
    const fromDoc = document.documentElement?.lang;
    const raw = stored || fromDoc || (typeof navigator !== 'undefined' ? navigator.language : 'en') || 'en';
    const code = String(raw).toLowerCase().split('-')[0];
    return code === 'ar' ? 'ar' : 'en';
};

/**
 * Map mobile form builder state to API payload (form_name, fields, options).
 */
export const mapProductFormsToApiPayload = (forms) => {
    return (forms || []).map((f) => ({
        form_name: f.form_name ?? f.title ?? '',
        form_url: f.form_url ?? '',
        country_id: f.country_id ?? null,
        fields: (f.fields || []).map((field, idx) => ({
            label_en: field.label_en ?? '',
            label_ar: field.label_ar ?? '',
            key: field.key ?? '',
            type: field.type ?? 'Text Field',
            options: (field.options || []).map((o) => ({
                label_en: o.label_en ?? '',
                label_ar: o.label_ar ?? '',
                value: o.value ?? '',
            })),
            sort_order: field.sort_order ?? idx,
            is_required: field.is_required !== false,
            status: field.status !== false,
            country_id: field.country_id ?? null,
        })),
    }));
};

const buildProductFormData = (data = {}, options = {}) => {
    const fd = new FormData();
    if (options.methodOverride) {
        fd.append('_method', options.methodOverride);
    }

    Object.entries(data || {}).forEach(([key, value]) => {
        if (value === undefined || value === null) return;

        if (key === 'name' && typeof value === 'object') {
            if (value.en !== undefined) fd.append('name[en]', value.en ?? '');
            if (value.ar !== undefined) fd.append('name[ar]', value.ar ?? '');
            return;
        }

        if (key === 'description' && typeof value === 'object') {
            if (value.en !== undefined) fd.append('description[en]', value.en ?? '');
            if (value.ar !== undefined) fd.append('description[ar]', value.ar ?? '');
            return;
        }

        if (key === 'forms') {
            fd.append('forms', typeof value === 'string' ? value : JSON.stringify(value));
            return;
        }

        if (key === 'image') {
            if (typeof File !== 'undefined' && value instanceof File) {
                fd.append('image', value);
            }
            return;
        }

        if (typeof value === 'boolean') {
            fd.append(key, value ? '1' : '0');
            return;
        }

        fd.append(key, value);
    });

    return fd;
};

/**
 * Fetch products
 */
/**
 * Export products (service catalog) — same query params as list.
 */
export const exportGatewayProducts = async (params = {}) => {
    const token = getApiToken();
    const response = await axios.get(ADMIN_ENDPOINTS.AUTH_PRODUCTS_EXPORT, {
        params,
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
        },
    });
    return response.data;
};

export const fetchProducts = async (params = {}) => {
    const token = getApiToken();
    
    try {
        const response = await axios.get(ADMIN_ENDPOINTS.PRODUCTS, {
            params: params,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Accept-Language': getAcceptLanguageHeader(),
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching products:', error);
        throw error;
    }
};

/**
 * Fetch product details
 */
export const fetchProductDetails = async (id) => {
    const token = getApiToken();
    
    try {
        const response = await axios.get(ADMIN_ENDPOINTS.PRODUCT_DETAILS(id), {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Accept-Language': getAcceptLanguageHeader(),
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching product details:', error);
        throw error;
    }
};

/**
 * Create product
 */
export const createProduct = async (data) => {
    const token = getApiToken();
    
    try {
        const payload = buildProductFormData(data);

        const response = await axios.post(ADMIN_ENDPOINTS.PRODUCT_CREATE, payload, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Content-Type': 'multipart/form-data',
            }
        });
        
        if (response.data?.success) {
            return {
                success: true,
                data: response.data.data || response.data
            };
        } else {
            return {
                success: false,
                error: response.data?.message || 'Failed to create product',
                statusCode: response.status,
                errors: response.data?.errors || {}
            };
        }
    } catch (error) {
        console.error('Error creating product:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to create product',
            statusCode: error.response?.status,
            errors: error.response?.data?.errors || {}
        };
    }
};

/**
 * Update product
 */
export const updateProduct = async (id, data) => {
    const token = getApiToken();
    
    try {
        // Use POST + _method=PUT for reliable multipart file handling in Laravel.
        const payload = buildProductFormData(data, { methodOverride: 'PUT' });

        const response = await axios.post(ADMIN_ENDPOINTS.PRODUCT_UPDATE(id), payload, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Content-Type': 'multipart/form-data',
            }
        });
        return {
            success: true,
            data: response.data
        };
    } catch (error) {
        console.error('Error updating product:', error);
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to update product',
            statusCode: error.response?.status,
            errors: error.response?.data?.errors || {}
        };
    }
};

/**
 * Delete product
 */
export const deleteProduct = async (id) => {
    const token = getApiToken();
    
    try {
        const response = await axios.delete(ADMIN_ENDPOINTS.PRODUCT_DELETE(id), {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error deleting product:', error);
        throw error;
    }
};

/**
 * Toggle product status
 */
export const toggleProductStatus = async (id) => {
    const token = getApiToken();
    
    try {
        const response = await axios.patch(ADMIN_ENDPOINTS.PRODUCT_TOGGLE_STATUS(id), {}, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error toggling product status:', error);
        throw error;
    }
};

/**
 * Bulk delete products
 */
export const bulkDeleteProducts = async (ids) => {
    const token = getApiToken();
    
    try {
        const response = await axios.post(ADMIN_ENDPOINTS.PRODUCT_BULK_DELETE, {
            ids: ids
        }, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error bulk deleting products:', error);
        throw error;
    }
};

/**
 * Fetch products by service ID
 */
export const fetchProductsByService = async (serviceId, params = {}) => {
    return fetchProducts({
        ...params,
        service_id: serviceId
    });
};

export const fetchProductServiceForms = async (productId) => {
    const token = getApiToken();
    const response = await axios.get(ADMIN_ENDPOINTS.PRODUCT_SERVICE_FORMS(productId), {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
        }
    });
    return response.data;
};

export const saveProductServiceForms = async (productId, forms) => {
    const token = getApiToken();
    const response = await axios.post(ADMIN_ENDPOINTS.PRODUCT_SERVICE_FORMS(productId), { forms }, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        }
    });
    return response.data;
};

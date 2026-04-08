// Service Model for mapping API response (Telecom Services)
export class ServiceModel {
    constructor(data) {
        this.id = data.id || null;
        
        // Telecom Service specific fields
        this.category_id = data.category_id || null;
        this.category = typeof data.category === 'object' ? data.category : null;
        this.category_name = data.category?.name_en || data.category_name || '';
        this.category_name_ar = data.category?.name_ar || '';
        
        this.merchant_id = data.merchant_id || null;
        this.merchant = typeof data.merchant === 'object' ? data.merchant : null;
        this.merchant_name = data.merchant?.name || data.merchant_name || '';
        this.partner = typeof data.partner === 'object' ? data.partner : this.merchant;
        this.partner_name = data.partner?.name || this.merchant_name || '';
        
        this.content_provider_id = data.content_provider_id || data.merchant_id || null;
        this.content_provider = data.content_provider || data.merchant || null;
        
        this.country_id = data.country_id || null;
        this.country = typeof data.country === 'object' ? data.country : null;
        this.country_name = data.country?.name || '';
        
        this.service_type = data.service_type || null;
        this.service_type_display = data.service_type_display || data.service_type || '';
        this.service_name_en = data.service_name_en ?? '';
        this.service_name_ar = data.service_name_ar ?? '';
        const legacyName =
            typeof data.service_name === 'object' && data.service_name !== null
                ? (data.service_name.en || data.service_name.ar || '')
                : (data.service_name || '');
        this.service_name =
            this.service_name_en ||
            this.service_name_ar ||
            legacyName ||
            data.service_name_text ||
            '';
        this.short_code = data.short_code || '';
        
        this.status = data.status || 'active';
        this.is_active = data.is_active !== undefined ? data.is_active : true;
        
        // Stored in the DB as JSON (translatable)
        this.description = data.description ?? '';
        this.description_en =
            data.description_en ??
            (data.description && typeof data.description === 'object' ? (data.description.en ?? '') : '');
        this.description_ar =
            data.description_ar ??
            (data.description && typeof data.description === 'object' ? (data.description.ar ?? '') : '');
        
        this.products = data.products || [];
        this.products_count = data.products_count || (Array.isArray(this.products) ? this.products.length : 0);
        
        this.created_at = data.created_at || null;
        this.updated_at = data.updated_at || null;
        
        // Legacy fields for backward compatibility
        this.name = data.name || this.service_name_en || this.service_name_ar || this.service_name || this.id || '';
        this.code = data.code || this.id || '';
    }

    // Static method to map single service
    static fromApiResponse(apiData) {
        return new ServiceModel(apiData);
    }

    // Static method to map array of services
    static fromApiResponseArray(apiDataArray) {
        if (!Array.isArray(apiDataArray)) {
            console.warn('Expected array but got:', typeof apiDataArray);
            return [];
        }
        
        return apiDataArray.map(item => ServiceModel.fromApiResponse(item));
    }

    // Method to convert back to plain object
    toPlainObject() {
        return {
            id: this.id,
            category_id: this.category_id,
            category: this.category,
            category_name: this.category_name,
            category_name_ar: this.category_name_ar,
            merchant_id: this.merchant_id,
            merchant: this.merchant,
            merchant_name: this.merchant_name,
            country_id: this.country_id,
            country: this.country,
            country_name: this.country_name,
            service_type: this.service_type,
            service_type_display: this.service_type_display,
            service_name_en: this.service_name_en,
            service_name_ar: this.service_name_ar,
            service_name: this.service_name,
            short_code: this.short_code,
            status: this.status,
            is_active: this.is_active,
            description: this.description,
            description_en: this.description_en,
            description_ar: this.description_ar,
            products: this.products,
            products_count: this.products_count,
            created_at: this.created_at,
            updated_at: this.updated_at,
            // Legacy fields
            name: this.name,
            code: this.code
        };
    }

    // Method to check if service is active
    isActive() {
        return this.status === 'active' && this.is_active === true;
    }

    // Method to get display name
    getDisplayName() {
        return (
            this.service_name_en ||
            this.service_name_ar ||
            this.service_name ||
            this.id ||
            this.name
        );
    }

    // Method to check if service has category
    hasCategory() {
        return this.category_id !== null && this.category !== null;
    }

    // Method to check if service has country
    hasCountry() {
        return this.country_id !== null && this.country !== null;
    }

    // Method to check if service has products
    hasProducts() {
        return this.products && this.products.length > 0;
    }

    // Method to get service type display name
    getServiceTypeDisplay() {
        const typeMap = {
            'digital': 'Digital',
            'ivr': 'IVR',
            'sms': 'SMS'
        };
        return typeMap[this.service_type] || this.service_type || '';
    }
}

// Export default for convenience
export default ServiceModel;

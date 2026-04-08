// Service Product Model for mapping API response (Telecom Service Products)
export class ServiceProductModel {
    constructor(data) {
        this.id = data.id || null;
        
        this.service_id = data.service_id || null;
        this.service = typeof data.service === 'object' ? data.service : null;

        this.service_sub_category_id = data.service_sub_category_id || null;
        this.type_id = data.type_id || null;
        this.country_id = data.country_id || null;

        this.name = data.name || null;
        const parsedName = (() => {
            if (this.name && typeof this.name === 'object') return this.name;
            if (typeof this.name === 'string') {
                try {
                    const parsed = JSON.parse(this.name);
                    if (parsed && typeof parsed === 'object') return parsed;
                } catch (_) {
                    return { en: this.name, ar: '' };
                }
            }
            return {};
        })();
        this.name_en = data.name_en || parsedName.en || data.product_name || '';
        this.name_ar = data.name_ar || parsedName.ar || '';
        
        this.service_url = data.service_url || '';
        this.notify_url = data.notify_url || '';
        this.prepay_url = data.prepay_url || '';
        this.image = data.image || '';
        this.image_url = data.image_url || '';
        this.status = data.status !== undefined ? !!data.status : true;
        this.service_forms = Array.isArray(data.service_forms) ? data.service_forms : [];
        this.forms_count = data.forms_count !== undefined
            ? Number(data.forms_count || 0)
            : this.service_forms.length;
        
        this.created_at = data.created_at || null;
        this.updated_at = data.updated_at || null;
    }

    // Static method to map single product
    static fromApiResponse(apiData) {
        return new ServiceProductModel(apiData);
    }

    // Static method to map array of products
    static fromApiResponseArray(apiDataArray) {
        if (!Array.isArray(apiDataArray)) {
            console.warn('Expected array but got:', typeof apiDataArray);
            return [];
        }
        
        return apiDataArray.map(item => ServiceProductModel.fromApiResponse(item));
    }

    // Method to convert back to plain object
    toPlainObject() {
        return {
            id: this.id,
            service_id: this.service_id,
            service: this.service,
            service_sub_category_id: this.service_sub_category_id,
            type_id: this.type_id,
            country_id: this.country_id,
            name: this.name,
            name_en: this.name_en,
            name_ar: this.name_ar,
            service_url: this.service_url,
            notify_url: this.notify_url,
            prepay_url: this.prepay_url,
            image: this.image,
            image_url: this.image_url,
            status: this.status,
            service_forms: this.service_forms,
            forms_count: this.forms_count,
            created_at: this.created_at,
            updated_at: this.updated_at
        };
    }

    // Method to check if product is active
    isActive() {
        return this.status === true;
    }

    // Method to check if product is linked to a service
    hasService() {
        return this.service_id !== null && this.service !== null;
    }
}

// Export default for convenience
export default ServiceProductModel;


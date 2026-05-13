// Service Model — maps SoftPos service API payloads (flat localized fields + legacy nested shapes).

import i18n from 'i18next';

export class ServiceModel {
    constructor(data) {
        const raw = data && typeof data === 'object' ? data : {};

        this.id = raw.id || null;
        this.partner_id = raw.partner_id ?? raw.merchant_id ?? null;

        this.category_id = raw.category_id || null;
        this.category = typeof raw.category === 'object' && raw.category !== null ? raw.category : null;
        this.category_name =
            raw.category_name ||
            this.category?.name_en ||
            (typeof this.category?.name === 'string' ? this.category.name : '') ||
            '';
        this.category_name_ar = this.category?.name_ar || '';

        this.sub_category_id = raw.sub_category_id || null;
        this.sub_category =
            typeof raw.sub_category === 'object' && raw.sub_category !== null ? raw.sub_category : null;
        this.sub_category_name =
            raw.sub_category_name ||
            this.sub_category?.name_en ||
            (typeof this.sub_category?.name === 'string' ? this.sub_category.name : '') ||
            '';

        this.merchant_id = raw.merchant_id || null;
        this.merchant = typeof raw.merchant === 'object' && raw.merchant !== null ? raw.merchant : null;
        this.merchant_name =
            raw.merchant?.name || raw.partner_name || raw.merchant_name || '';
        this.partner = typeof raw.partner === 'object' && raw.partner !== null ? raw.partner : this.merchant;
        this.partner_name = raw.partner_name || this.partner?.name || this.merchant_name || '';

        this.content_provider_id = raw.content_provider_id || this.merchant_id || null;
        this.content_provider =
            typeof raw.content_provider === 'object' && raw.content_provider !== null
                ? raw.content_provider
                : this.merchant;

        this.country_id = raw.country_id || null;
        this.country = typeof raw.country === 'object' && raw.country !== null ? raw.country : null;
        this.country_short_name = raw.country_short_name || this.country?.short_name || '';
        this.country_name =
            raw.country_name ||
            (typeof this.country?.name === 'string' ? this.country.name : '') ||
            '';

        this.operator = raw.operator || null;

        this.service_type = raw.service_type || null;
        this.service_type_display = raw.service_type_display || raw.service_type || '';

        let nameEn = '';
        let nameAr = '';
        const sn = raw.service_name;
        if (sn && typeof sn === 'object' && !Array.isArray(sn)) {
            nameEn = sn.en ?? '';
            nameAr = sn.ar ?? '';
        }
        if (nameEn === '' && nameAr === '') {
            nameEn = raw.service_name_en ?? '';
            nameAr = raw.service_name_ar ?? '';
        }
        if (nameEn === '' && nameAr === '' && typeof sn === 'string' && sn.trim()) {
            const t = sn.trim();
            nameEn = t;
            nameAr = t;
        }
        this.service_name_en = nameEn;
        this.service_name_ar = nameAr;

        this.short_code = raw.short_code || '';

        this.image = raw.image ?? null;
        this.image_url = raw.image_url ?? null;

        this.status = raw.status || 'active';
        this.is_active = raw.is_active !== undefined ? raw.is_active : true;

        this.description = raw.description ?? '';
        this.description_text = raw.description_text ?? '';
        this.description_en =
            raw.description_en ??
            (raw.description && typeof raw.description === 'object' ? (raw.description.en ?? '') : '');
        this.description_ar =
            raw.description_ar ??
            (raw.description && typeof raw.description === 'object' ? (raw.description.ar ?? '') : '');

        this.products = raw.products || [];
        this.products_count =
            raw.products_count ?? (Array.isArray(this.products) ? this.products.length : 0);

        this.created_at = raw.created_at || null;
        this.updated_at = raw.updated_at || null;

        this.name = raw.name || this.service_name_en || this.service_name_ar || this.id || '';
        this.code = raw.code || this.id || '';
    }

    /** @param {unknown} apiData */
    static fromApiResponse(apiData) {
        return new ServiceModel(apiData);
    }

    /** @param {unknown[]|null|undefined} apiDataArray */
    static fromApiResponseArray(apiDataArray) {
        if (!Array.isArray(apiDataArray)) {
            console.warn('ServiceModel.fromApiResponseArray: expected array, got', typeof apiDataArray);
            return [];
        }
        return apiDataArray.map((item) => new ServiceModel(item));
    }

    /**
     * Accepts a ServiceModel instance or a raw API / partial object (e.g. catalog rows).
     * @param {unknown} serviceLike
     */
    static displayName(serviceLike) {
        if (!serviceLike) return '';
        if (serviceLike instanceof ServiceModel) {
            return serviceLike.getDisplayName();
        }
        return new ServiceModel(serviceLike).getDisplayName();
    }

    /**
     * @param {unknown} serviceLike
     */
    static categoryName(serviceLike) {
        if (!serviceLike) return '';
        if (serviceLike instanceof ServiceModel) {
            return serviceLike.category_name || '';
        }
        return new ServiceModel(serviceLike).category_name;
    }

    /**
     * @param {unknown} serviceLike
     */
    static countryName(serviceLike) {
        if (!serviceLike) return null;
        const flat = serviceLike.country_name;
        if (flat != null && String(flat).trim() !== '') return flat;
        const c = serviceLike.country;
        if (!c) return null;
        const n = c.name;
        if (typeof n === 'string') return n;
        if (n && typeof n === 'object') return n.en || n.ar || null;
        return null;
    }

    /**
     * @param {unknown} serviceLike
     */
    static partnerDisplayName(serviceLike) {
        if (!serviceLike) return '';
        if (serviceLike.partner_name) return serviceLike.partner_name;
        const partner =
            serviceLike.partner || serviceLike.merchant || serviceLike.contentProvider || null;
        if (!partner) return '';
        const subName = partner.name || '';
        const parentName = partner.parent_name || null;
        if (parentName) return `${subName} - ${parentName}`;
        return subName;
    }

    getImagePreviewUrl() {
        if (this.image_url) return this.image_url;
        if (!this.image) return null;
        const img = String(this.image);
        if (img.startsWith('http')) return img;
        if (img.startsWith('/')) return img;
        return `/${img}`;
    }

    toPlainObject() {
        return {
            id: this.id,
            partner_id: this.partner_id,
            category_id: this.category_id,
            category: this.category,
            category_name: this.category_name,
            category_name_ar: this.category_name_ar,
            sub_category_id: this.sub_category_id,
            sub_category: this.sub_category,
            sub_category_name: this.sub_category_name,
            merchant_id: this.merchant_id,
            merchant: this.merchant,
            merchant_name: this.merchant_name,
            partner: this.partner,
            partner_name: this.partner_name,
            content_provider_id: this.content_provider_id,
            content_provider: this.content_provider,
            country_id: this.country_id,
            country: this.country,
            country_name: this.country_name,
            country_short_name: this.country_short_name,
            operator: this.operator,
            service_type: this.service_type,
            service_type_display: this.service_type_display,
            service_name: {
                en: this.service_name_en,
                ar: this.service_name_ar,
            },
            short_code: this.short_code,
            image: this.image,
            image_url: this.image_url,
            status: this.status,
            is_active: this.is_active,
            description: this.description,
            description_text: this.description_text,
            description_en: this.description_en,
            description_ar: this.description_ar,
            products: this.products,
            products_count: this.products_count,
            created_at: this.created_at,
            updated_at: this.updated_at,
            name: this.name,
            code: this.code,
        };
    }

    isActive() {
        return this.status === 'active' && this.is_active === true;
    }

    getDisplayName() {
        const en = this.service_name_en || '';
        const ar = this.service_name_ar || '';
        const lang = ((i18n && i18n.language) || 'en').split(/[-_]/)[0];
        if (lang === 'ar' && ar) return ar;
        return en || ar || String(this.id || '') || this.name || '';
    }

    hasCategory() {
        return this.category_id != null && this.category_id !== '';
    }

    hasCountry() {
        return this.country_id != null && this.country_id !== '';
    }

    hasProducts() {
        return this.products && this.products.length > 0;
    }

    getServiceTypeDisplay() {
        const typeMap = {
            digital: 'Digital',
            ivr: 'IVR',
            sms: 'SMS',
        };
        return typeMap[this.service_type] || this.service_type || '';
    }
}

export default ServiceModel;

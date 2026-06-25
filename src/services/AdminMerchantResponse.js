import { resolveLocaleText } from '../utils/localeText';

export class AdminMerchantResponse {
    constructor(data = {}) {
        this.id = data.id ?? null;
        this.name = data.name ?? '';
        this.business_name = data.business_name ?? '';
        this.owner_name = data.owner_name ?? '';
        this.email = data.email ?? '';
        this.phone = data.phone ?? '';
        this.logo = data.logo ?? null;
        this.status = data.status ?? 'pending';
        this.is_active = Boolean(data.is_active);
        this.business_type = resolveLocaleText(data.business_type);
        this.country_id = data.country_id ?? null;
        this.city_id = data.city_id ?? null;
        this.country_name =
            resolveLocaleText(data.country_name) ||
            resolveLocaleText(data.country?.name) ||
            '';
        this.city_name =
            resolveLocaleText(data.city_name) ||
            resolveLocaleText(data.city?.name) ||
            '';
        this.plan = data.plan ?? null;
        this.user_id = data.user_id ?? data.user?.id ?? null;
        this.user = data.user ?? null;
    }

    static fromApi(item) {
        return new AdminMerchantResponse(item);
    }

    static fromApiArray(items) {
        if (!Array.isArray(items)) return [];
        return items.map((item) => AdminMerchantResponse.fromApi(item));
    }
}

export default AdminMerchantResponse;


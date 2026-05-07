const resolveLocaleText = (value) => {
    if (value === null || value === undefined) return '';

    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed) return '';

        if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
            try {
                const parsed = JSON.parse(trimmed);
                return resolveLocaleText(parsed);
            } catch {
                return trimmed;
            }
        }

        return trimmed;
    }

    if (typeof value === 'object') {
        if (Array.isArray(value)) {
            for (const item of value) {
                const normalized = resolveLocaleText(item);
                if (normalized) return normalized;
            }
            return '';
        }

        const preferredLocales = ['en', 'ar'];
        for (const locale of preferredLocales) {
            if (value[locale]) {
                return resolveLocaleText(value[locale]);
            }
        }

        for (const key of Object.keys(value)) {
            const normalized = resolveLocaleText(value[key]);
            if (normalized) return normalized;
        }

        return '';
    }

    return String(value);
};

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


import { resolveLocaleText } from '../utils/localeText';

const normalizePlace = (place) => {
    if (!place || typeof place !== 'object') {
        return null;
    }

    const name = resolveLocaleText(place.name ?? place.text);

    return {
        id: place.id ?? null,
        name,
        text: name,
        code: place.code ?? null,
    };
};

/**
 * Maps admin customer API payloads into flat, render-safe view models.
 */
export class AdminCustomerModel {
    constructor(data = {}) {
        this.id = data.id ?? null;
        this.name = resolveLocaleText(data.name);
        this.email = data.email ?? '';
        this.phone = data.phone ?? data.phone_number ?? '';
        this.national_id = data.national_id ?? null;
        this.address = data.address ?? '';
        this.country_id = data.country_id ?? null;
        this.city_id = data.city_id ?? null;
        this.state = data.state ?? '';
        this.zip = data.zip ?? '';
        this.status = data.status ?? 'active';
        this.balance = Number(data.balance ?? 0);
        this.profile_image_url = data.profile_image_url ?? data.profile_image ?? null;
        this.profile_completed = Boolean(data.profile_completed);
        this.merchant_id = data.merchant_id ?? null;
        this.created_at = data.created_at ?? null;
        this.updated_at = data.updated_at ?? null;

        this.country = normalizePlace(data.country);
        this.city = normalizePlace(data.city);

        this.country_name =
            resolveLocaleText(data.country_name) ||
            this.country?.name ||
            '';
        this.city_name =
            resolveLocaleText(data.city_name) ||
            this.city?.name ||
            '';
    }

    get countryName() {
        return this.country_name;
    }

    get cityName() {
        return this.city_name;
    }

    static fromApi(data) {
        if (!data) return null;
        if (data instanceof AdminCustomerModel) return data;
        return new AdminCustomerModel(data);
    }

    static fromApiArray(items = []) {
        if (!Array.isArray(items)) return [];
        return items.map((item) => AdminCustomerModel.fromApi(item)).filter(Boolean);
    }
}

export const mapAdminCustomersPaginated = (payload) => {
    if (!payload || typeof payload !== 'object') {
        return payload;
    }

    if (Array.isArray(payload.data)) {
        return {
            ...payload,
            data: AdminCustomerModel.fromApiArray(payload.data),
        };
    }

    if (Array.isArray(payload)) {
        return AdminCustomerModel.fromApiArray(payload);
    }

    return payload;
};

export default AdminCustomerModel;

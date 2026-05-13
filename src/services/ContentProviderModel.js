/**
 * Maps SoftPos partner / content-provider API payloads (admin list, select, detail)
 * so UI and modals never depend on raw response shape.
 */
export class ContentProviderModel {
    constructor(raw = {}) {
        const r = raw && typeof raw === 'object' ? raw : {};

        this.id = r.id ?? null;
        this.content_provider_id = r.content_provider_id ?? this.id;
        this.merchant_id = r.merchant_id ?? this.id;

        this.name = r.name ?? '';
        this.business_name = r.business_name ?? '';
        this.owner_name = r.owner_name ?? '';
        this.email = r.email ?? '';
        this.phone = r.phone ?? '';
        this.business_phone = r.business_phone ?? '';
        this.address = r.address ?? '';

        this.status = r.status ?? '';
        this.merchant_code = r.merchant_code ?? '';
        this.is_active = r.is_active !== undefined ? Boolean(r.is_active) : true;
        this.is_parent = Boolean(r.is_parent);
        this.parent_id = r.parent_id ?? null;

        this.country_id = r.country_id ?? null;
        this.partner_category_id = r.partner_category_id ?? null;

        this.business_type = r.business_type ?? null;

        this.logo = r.logo ?? null;
        this.logo_url = r.logo_url ?? null;
        this.image = r.image ?? null;
        this.image_url = r.image_url ?? null;
        this.avatar_url = r.avatar_url ?? null;
        this.avatar = r.avatar ?? null;
        this.profile_image_url = r.profile_image_url ?? null;
        this.profile_image = r.profile_image ?? null;

        this.user_id = r.user_id ?? r.user?.id ?? null;
        this.user = typeof r.user === 'object' && r.user !== null ? r.user : null;

        this.country_name = r.country_name ?? r.countryName ?? null;
        this.country_short_name = r.country_short_name ?? r.countryCode ?? null;

        const c = r.country;
        if (c && typeof c === 'object') {
            const n = c.name;
            if (this.country_name == null || this.country_name === '') {
                this.country_name =
                    typeof n === 'string' ? n : n?.en ?? n?.ar ?? c.name_en ?? c.label ?? null;
            }
            if (this.country_short_name == null || this.country_short_name === '') {
                this.country_short_name = c.short_name ?? c.code ?? c.iso2 ?? c.alpha2 ?? null;
            }
        }

        this.partner_category_name =
            r.partner_category_name ??
            r.partner_category?.name_en ??
            r.partner_category?.name_ar ??
            r.partnerCategory?.name_en ??
            r.partnerCategory?.name_ar ??
            null;

        this.partner_category = r.partner_category ?? r.partnerCategory ?? null;
        this.country = r.country ?? null;

        const pp = r.parent_partner ?? r.parentPartner ?? r.parent ?? null;
        this.parent_partner = pp && typeof pp === 'object' && pp.id ? { ...pp } : null;
        this.parent_partner_name =
            r.parent_partner_name ??
            (this.parent_partner
                ? this.parent_partner.business_name || this.parent_partner.name || null
                : null);

        this.sub_partners_count =
            r.sub_partners_count !== undefined && r.sub_partners_count !== null
                ? Number(r.sub_partners_count)
                : null;

        this.created_at = r.created_at ?? null;
        this.updated_at = r.updated_at ?? null;

        this.text = r.text ?? null;
        this.has_sub_partners = r.has_sub_partners;
    }

    /** @param {unknown} data */
    static fromApiResponse(data) {
        return new ContentProviderModel(data);
    }

    /** @param {unknown[]|null|undefined} list */
    static fromApiResponseArray(list) {
        if (!Array.isArray(list)) return [];
        return list.map((item) => new ContentProviderModel(item));
    }

    /**
     * @param {unknown} data
     * @returns {ContentProviderModel}
     */
    static ensure(data) {
        if (data instanceof ContentProviderModel) return data;
        return new ContentProviderModel(data);
    }

    /** @param {unknown} data */
    static displayName(data) {
        return ContentProviderModel.ensure(data).getDisplayName();
    }

    getDisplayName() {
        return (this.business_name || this.name || '').trim() || String(this.id || '');
    }

    getLogoCandidate() {
        const candidates = [
            this.logo_url,
            this.logo,
            this.image_url,
            this.image,
            this.avatar_url,
            this.avatar,
            this.profile_image_url,
            this.profile_image,
        ];
        for (const v of candidates) {
            if (v != null && v !== '') return v;
        }
        return null;
    }

    getCategoryLabel() {
        return this.partner_category_name || '—';
    }

    /**
     * @param {string|null|undefined} lookupCountryName
     * @param {string|null|undefined} lookupCountryCode
     */
    resolveCountryDisplay(lookupCountryName, lookupCountryCode) {
        const name =
            lookupCountryName ||
            this.country_name ||
            (typeof this.country?.name === 'string'
                ? this.country.name
                : this.country?.name?.en ||
                  this.country?.name?.ar ||
                  this.country?.name_en ||
                  this.country?.label ||
                  null);
        const code =
            lookupCountryCode ||
            this.country_short_name ||
            this.country?.code ||
            this.country?.short_name ||
            this.country?.iso2 ||
            this.country?.alpha2 ||
            null;
        return { name, code };
    }

    getParentForLink() {
        if (!this.parent_partner?.id) return null;
        return {
            id: this.parent_partner.id,
            name:
                this.parent_partner_name ||
                this.parent_partner.business_name ||
                this.parent_partner.name ||
                '',
        };
    }

    get resetPasswordEmail() {
        return this.user?.email || this.email || '';
    }

    get hasLinkedUser() {
        return Boolean(this.user_id || this.user?.id);
    }
}

export default ContentProviderModel;

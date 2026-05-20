/**
 * Maps AdminTransactionResource API payloads to a stable frontend shape.
 */

import ContentProviderModel from './ContentProviderModel';
import ServiceModel from './ServiceModel';

const STATUS_BADGE_BY_STATUS = {
    APPROVED: 'badge-light-success',
    DECLINED: 'badge-light-danger',
    PENDING: 'badge-light-warning',
    FAILED: 'badge-light-danger',
    VOIDED: 'badge-light-secondary',
    REFUNDED: 'badge-light-info',
    PROCESSED: 'badge-light-success',
    CAPTURED: 'badge-light-info',
    CANCELLED: 'badge-light-secondary',
    EXPIRED: 'badge-light-dark',
    REVERSED: 'badge-light-dark',
};

export class AdminTransactionModel {
    constructor(data) {
        const raw = data && typeof data === 'object' ? data : {};

        this.id = raw.id ?? null;
        this.transaction_id = raw.transaction_id ?? null;
        this.amount = Number(raw.amount ?? 0);
        this.status = raw.status ?? null;
        this.created_at = raw.created_at ?? null;
        this.currency_symbol = raw.currency_symbol ?? '$';
        this.country_name = raw.country_name ?? null;
        this.partner_name = raw.partner_name ?? null;
        this.merchant_name = raw.merchant_name ?? null;
        this.service_category_name = raw.service_category_name ?? null;
        this.payment_type = raw.payment_type ?? null;
        this.method = raw.method ?? null;
    }

    static fromApiResponse(apiData) {
        return new AdminTransactionModel(apiData);
    }

    static fromApiResponseArray(apiDataArray) {
        if (!Array.isArray(apiDataArray)) {
            return [];
        }
        return apiDataArray.map((item) => new AdminTransactionModel(item));
    }

    static ensure(data) {
        if (data instanceof AdminTransactionModel) return data;
        return new AdminTransactionModel(data);
    }

    getCountryName(fallback = 'N/A') {
        return this.country_name || fallback;
    }

    getPartnerName(fallback = 'N/A') {
        return this.partner_name || fallback;
    }

    getMerchantName(fallback = 'N/A') {
        return this.merchant_name || fallback;
    }

    getServiceCategoryName(fallback = 'N/A') {
        return this.service_category_name || fallback;
    }

    getPaymentMethodLabel(fallback = 'N/A') {
        return this.method || this.payment_type || fallback;
    }

    getDisplayTransactionId(fallback = 'N/A') {
        return this.transaction_id || (this.id != null ? String(this.id) : fallback);
    }

    getFormattedAmount() {
        const numeric = Number(this.amount ?? 0);
        return Number.isNaN(numeric) ? '0.00' : numeric.toFixed(2);
    }

    getStatusBadgeClass() {
        const key = (this.status ?? '').toString().toUpperCase();
        return STATUS_BADGE_BY_STATUS[key] ?? 'badge-light-secondary';
    }

    getFormattedCreatedAt(locale, fallback = 'N/A') {
        if (!this.created_at) return fallback;
        try {
            return new Date(this.created_at).toLocaleString(locale);
        } catch {
            return fallback;
        }
    }
}

/**
 * Admin transaction detail (AdminTransactionDetailResource).
 */
export class AdminTransactionDetailModel {
    constructor(data) {
        const raw = data && typeof data === 'object' ? data : {};

        this.id = raw.id ?? null;
        this.transaction_id = raw.transaction_id ?? null;
        this.amount = Number(raw.amount ?? 0);
        this.original_amount = raw.original_amount != null ? Number(raw.original_amount) : null;
        this.refundable_amount = raw.refundable_amount != null ? Number(raw.refundable_amount) : null;
        this.status = raw.status ?? null;
        this.state = raw.state ?? null;
        this.transaction_type = raw.transaction_type ?? null;
        this.payment_type = raw.payment_type ?? null;
        this.method = raw.method ?? null;
        this.created_at = raw.created_at ?? null;
        this.timestamp = raw.timestamp ?? null;
        this.currency_symbol = raw.currency_symbol ?? '$';
        this.currency_id = raw.currency_id ?? null;
        this.currency = raw.currency ?? null;
        this.merchant_id = raw.merchant_id ?? null;
        this.partner_id = raw.partner_id ?? null;
        this.service_id = raw.service_id ?? null;
        this.service_category_id = raw.service_category_id ?? null;
        this.service_category_name = raw.service_category_name ?? null;
        this.service_name = raw.service_name ?? null;
        this.partner_name = raw.partner_name ?? null;
        this.terminal_id = raw.terminal_id ?? null;
        this.user_id = raw.user_id ?? null;
        this.rrn = raw.rrn ?? null;
        this.batch_no = raw.batch_no ?? null;
        this.trace_no = raw.trace_no ?? null;
        this.auth_code = raw.auth_code ?? null;
        this.sdk = raw.sdk ?? null;
        this.sdk_id = raw.sdk_id ?? null;
        this.invoice_no = raw.invoice_no ?? null;
        this.mid = raw.mid ?? null;
        this.tid = raw.tid ?? null;
        this.atc = raw.atc ?? null;
        this.tvr = raw.tvr ?? null;
        this.tsi = raw.tsi ?? null;
        this.app_name = raw.app_name ?? null;
        this.card_number = raw.card_number ?? null;
        this.expiry = raw.expiry ?? null;
        this.decline_reason = raw.decline_reason ?? null;
        this.error_message = raw.error_message ?? null;
        this.transaction_encrypted_id = raw.transaction_encrypted_id ?? null;
        this.invoice_url = raw.invoice_url ?? null;
        this.country = raw.country ?? null;
        this.user = raw.user ?? null;
        this.batch = raw.batch ?? null;

        this.merchant =
            typeof raw.merchant === 'object' && raw.merchant !== null ? raw.merchant : null;

        this.partnerModel = raw.partner
            ? ContentProviderModel.fromApiResponse(raw.partner)
            : null;
        this.partner = this.partnerModel;

        this.serviceModel = raw.service ? ServiceModel.fromApiResponse(raw.service) : null;
        this.service = this.serviceModel;

        this.service_category =
            typeof raw.service_category === 'object' && raw.service_category !== null
                ? raw.service_category
                : null;

        const pm = raw.payment_method ?? raw.paymentMethod ?? null;
        this.payment_method = pm;
        this.paymentMethod = pm;
    }

    static fromApiResponse(apiData) {
        return new AdminTransactionDetailModel(apiData);
    }

    static ensure(data) {
        if (data instanceof AdminTransactionDetailModel) return data;
        return new AdminTransactionDetailModel(data);
    }

    getPartner() {
        return this.partnerModel;
    }

    getService() {
        return this.serviceModel;
    }

    getMerchantName(fallback = 'N/A') {
        return (
            this.merchant?.business_name ||
            this.merchant?.name ||
            fallback
        );
    }

    getMerchantCountryName(lang, fallback = 'N/A') {
        const c = this.merchant?.country;
        if (!c?.name && c?.name !== '') return fallback;
        const n = c.name;
        if (typeof n === 'string') return n;
        if (n && typeof n === 'object') {
            if (lang === 'ar') return n.ar || n.en || fallback;
            return n.en || n.ar || fallback;
        }
        return fallback;
    }
}

export class AdminTransactionStatisticsModel {
    constructor(data) {
        const raw = data && typeof data === 'object' ? data : {};

        this.sale = {
            count: Number(raw.sale?.count ?? 0),
            amount: Number(raw.sale?.amount ?? 0),
        };
        this.refund = {
            count: Number(raw.refund?.count ?? 0),
            amount: Number(raw.refund?.amount ?? 0),
        };
        this.void = {
            count: Number(raw.void?.count ?? 0),
            amount: Number(raw.void?.amount ?? 0),
        };
    }

    static fromApiResponse(apiData) {
        return new AdminTransactionStatisticsModel(apiData);
    }
}

export default AdminTransactionModel;

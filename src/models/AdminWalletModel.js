import { fmtMoney } from '../utils/walletMoney';

export const WALLET_STATUSES = ['active', 'frozen', 'closed'];
export const WALLET_TYPES = ['master', 'user'];
export const WALLET_TRANSACTION_TYPES = ['topup', 'payment', 'transfer', 'refund', 'adjustment'];
export const WALLET_DIRECTIONS = ['debit', 'credit'];

/**
 * Maps admin wallet API payloads into render-safe view models.
 */
export class AdminWalletModel {
    constructor(data = {}) {
        this.id = data.id ?? null;
        this.wallet_id = data.wallet_id ?? '';
        this.user_number = data.user_number ?? '';
        this.type = data.type ?? (data.is_master ? 'master' : 'user');
        this.is_master = Boolean(data.is_master ?? this.type === 'master');
        this.status = data.status ?? 'active';
        this.balance = Number(data.balance ?? 0);
        this.available_balance = Number(data.available_balance ?? 0);
        this.currency_code = data.currency_code ?? 'SDG';
        this.merchant_id = data.merchant_id ?? null;
        this.customer_id = data.customer_id ?? null;
        this.owner = data.owner ?? null;
        this.summary = data.summary ?? null;
        this.created_at = data.created_at ?? null;
        this.updated_at = data.updated_at ?? null;
    }

    get isMaster() {
        return this.is_master === true || this.type === 'master';
    }

    get ownerDisplayName() {
        return this.owner?.name || '-';
    }

    get statusBadgeClass() {
        switch (this.status) {
            case 'active':
                return 'badge-light-success';
            case 'frozen':
                return 'badge-light-warning';
            case 'closed':
                return 'badge-light-danger';
            default:
                return 'badge-light-secondary';
        }
    }

    get typeBadgeClass() {
        switch (this.type) {
            case 'master':
                return 'badge-light-info';
            case 'user':
                return 'badge-light-primary';
            default:
                return 'badge-light-secondary';
        }
    }

    get typeLabelKey() {
        switch (this.type) {
            case 'master':
                return 'admin.wallets.typeMaster';
            case 'user':
                return 'admin.wallets.typeUser';
            default:
                return 'admin.wallets.typeUnknown';
        }
    }

    formatBalance() {
        return `${fmtMoney(this.balance)} ${this.currency_code}`;
    }

    static fromApi(data) {
        if (!data) return null;
        if (data instanceof AdminWalletModel) return data;
        return new AdminWalletModel(data);
    }

    static fromApiArray(items = []) {
        if (!Array.isArray(items)) return [];
        return items.map((item) => AdminWalletModel.fromApi(item)).filter(Boolean);
    }
}

export const mapAdminWalletsPaginated = (payload) => {
    if (!payload || typeof payload !== 'object') {
        return payload;
    }

    if (Array.isArray(payload.data)) {
        return {
            ...payload,
            data: AdminWalletModel.fromApiArray(payload.data),
        };
    }

    return payload;
};

export const mapAdminWalletAction = (payload) => {
    if (!payload || typeof payload !== 'object') {
        return payload;
    }

    return {
        ...payload,
        wallet: AdminWalletModel.fromApi(payload.wallet),
    };
};

export const isMasterWallet = (wallet) => {
    if (wallet instanceof AdminWalletModel) {
        return wallet.isMaster;
    }
    return wallet?.is_master === true || wallet?.type === 'master';
};

export default AdminWalletModel;

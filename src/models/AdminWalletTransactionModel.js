import { fmtMoney } from '../utils/walletMoney';
import AdminWalletModel from './AdminWalletModel';

/**
 * Maps admin wallet transaction API payloads into view models.
 */
export class AdminWalletTransactionModel {
    constructor(data = {}) {
        this.id = data.id ?? null;
        this.type = data.type ?? '';
        this.direction = data.direction ?? '';
        this.amount = Number(data.amount ?? 0);
        this.signed_amount = data.signed_amount != null
            ? Number(data.signed_amount)
            : (this.direction === 'debit' ? -Math.abs(this.amount) : Math.abs(this.amount));
        this.balance_after = Number(data.balance_after ?? 0);
        this.reference = data.reference ?? null;
        this.reference_id = data.reference_id ?? null;
        this.description = data.description ?? '';
        this.note = data.note ?? null;
        this.created_by = data.created_by ?? null;
        this.counterparty = data.counterparty ?? null;
        this.created_at = data.created_at ?? null;
        this.owner = data.owner ?? null;
        this.wallet = data.wallet ? AdminWalletModel.fromApi(data.wallet) : null;
    }

    signedDisplay(currencyCode = 'SDG') {
        const isDebit = this.signed_amount < 0 || this.direction === 'debit';
        const formatted = fmtMoney(this.amount);
        return {
            isDebit,
            text: `${isDebit ? '-' : '+'}${formatted} ${currencyCode}`,
            className: isDebit ? 'text-danger fw-bold' : 'text-success fw-bold',
        };
    }

    static fromApi(data) {
        if (!data) return null;
        if (data instanceof AdminWalletTransactionModel) return data;
        return new AdminWalletTransactionModel(data);
    }

    static fromApiArray(items = []) {
        if (!Array.isArray(items)) return [];
        return items.map((item) => AdminWalletTransactionModel.fromApi(item)).filter(Boolean);
    }
}

export const mapAdminWalletTransactionsPaginated = (payload) => {
    if (!payload || typeof payload !== 'object') {
        return payload;
    }

    if (Array.isArray(payload.data)) {
        return {
            ...payload,
            data: AdminWalletTransactionModel.fromApiArray(payload.data),
        };
    }

    return payload;
};

export default AdminWalletTransactionModel;

export class AdminWalletTransactionDetailModel {
    constructor(data = {}) {
        this.transaction = AdminWalletTransactionModel.fromApi(data.transaction);
        this.related_transactions = AdminWalletTransactionModel.fromApiArray(data.related_transactions || []);
        this.operation = data.operation ?? {};
    }

    allEntries() {
        const current = this.transaction;
        if (!current) return this.related_transactions;
        return [current, ...this.related_transactions];
    }

    static fromApi(data) {
        if (!data) return null;
        if (data instanceof AdminWalletTransactionDetailModel) return data;
        return new AdminWalletTransactionDetailModel(data);
    }
}

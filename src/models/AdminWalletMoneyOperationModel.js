import AdminWalletModel from './AdminWalletModel';
import AdminWalletTransactionModel from './AdminWalletTransactionModel';

/**
 * Maps cash-in, cash-out, and opening-capital API responses.
 */
export class AdminWalletMoneyOperationModel {
    constructor(data = {}) {
        this.amount = Number(data.amount ?? 0);
        this.description = data.description ?? null;
        this.posting_reference = data.posting_reference ?? null;
        this.wallet = data.wallet ? AdminWalletModel.fromApi(data.wallet) : null;
        this.transaction = data.transaction
            ? AdminWalletTransactionModel.fromApi(data.transaction)
            : null;
    }

    get balanceAfter() {
        return this.wallet?.balance ?? null;
    }

    static fromApi(data) {
        if (!data) return null;
        if (data instanceof AdminWalletMoneyOperationModel) return data;
        return new AdminWalletMoneyOperationModel(data);
    }
}

export class AdminOpeningCapitalModel {
    constructor(data = {}) {
        this.amount = Number(data.amount ?? 0);
        this.description = data.description ?? null;
        this.posting_reference = data.posting_reference ?? null;
    }

    static fromApi(data) {
        if (!data) return null;
        if (data instanceof AdminOpeningCapitalModel) return data;
        return new AdminOpeningCapitalModel(data);
    }
}

export default AdminWalletMoneyOperationModel;

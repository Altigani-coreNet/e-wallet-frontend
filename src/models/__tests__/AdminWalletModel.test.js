import { describe, it, expect } from 'vitest';
import AdminWalletModel, {
    mapAdminWalletsPaginated,
    mapAdminWalletAction,
    isMasterWallet,
} from '../AdminWalletModel';
import AdminWalletTransactionModel, {
    mapAdminWalletTransactionsPaginated,
} from '../AdminWalletTransactionModel';
import AdminWalletMoneyOperationModel from '../AdminWalletMoneyOperationModel';
import { fmtMoney } from '../../utils/walletMoney';

describe('AdminWalletModel', () => {
    it('maps wallet resource fields from API', () => {
        const model = AdminWalletModel.fromApi({
            id: 'uuid-1',
            wallet_id: 'WAL-00000001',
            type: 'user',
            is_master: false,
            status: 'active',
            balance: 150.25,
            available_balance: 150.25,
            currency_code: 'SDG',
            owner: { name: 'Owner', merchant_name: 'Shop' },
            summary: { transaction_count: 3 },
        });

        expect(model.wallet_id).toBe('WAL-00000001');
        expect(model.isMaster).toBe(false);
        expect(model.ownerDisplayName).toBe('Owner');
        expect(model.statusBadgeClass).toBe('badge-light-success');
        expect(model.typeBadgeClass).toBe('badge-light-primary');
        expect(model.typeLabelKey).toBe('admin.wallets.typeUser');
    });

    it('detects master wallet', () => {
        const model = AdminWalletModel.fromApi({
            wallet_id: 'WAL-MASTER',
            type: 'master',
            is_master: true,
        });
        expect(model.isMaster).toBe(true);
        expect(model.typeBadgeClass).toBe('badge-light-info');
        expect(isMasterWallet(model)).toBe(true);
    });

    it('maps paginated wallet list', () => {
        const mapped = mapAdminWalletsPaginated({
            data: [{ id: '1', wallet_id: 'WAL-1' }],
            total: 1,
        });
        expect(mapped.data[0]).toBeInstanceOf(AdminWalletModel);
        expect(mapped.total).toBe(1);
    });

    it('maps wallet action responses', () => {
        const mapped = mapAdminWalletAction({
            message: 'ok',
            wallet: { id: '1', wallet_id: 'WAL-1' },
        });
        expect(mapped.wallet).toBeInstanceOf(AdminWalletModel);
    });
});

describe('AdminWalletTransactionModel', () => {
    it('computes signed display for debits and credits', () => {
        const debit = AdminWalletTransactionModel.fromApi({
            amount: 50,
            direction: 'debit',
            signed_amount: -50,
        });
        const credit = AdminWalletTransactionModel.fromApi({
            amount: 75,
            direction: 'credit',
        });

        expect(debit.signedDisplay('SDG').isDebit).toBe(true);
        expect(debit.signedDisplay('SDG').text).toMatch(/^-/);
        expect(credit.signedDisplay('SDG').isDebit).toBe(false);
        expect(credit.signedDisplay('SDG').text).toMatch(/^\+/);
    });

    it('maps paginated transactions', () => {
        const mapped = mapAdminWalletTransactionsPaginated({
            data: [{ id: 'tx-1', type: 'topup', direction: 'credit', amount: 10 }],
            total: 1,
        });
        expect(mapped.data[0]).toBeInstanceOf(AdminWalletTransactionModel);
    });
});

describe('AdminWalletMoneyOperationModel', () => {
    it('maps cash-in response with nested wallet and transaction', () => {
        const model = AdminWalletMoneyOperationModel.fromApi({
            amount: 200,
            posting_reference: 'WALLET_CASH_IN',
            wallet: { id: 'w1', wallet_id: 'WAL-1', balance: 400 },
            transaction: { id: 't1', type: 'topup', direction: 'credit', amount: 200 },
        });

        expect(model.amount).toBe(200);
        expect(model.wallet).toBeInstanceOf(AdminWalletModel);
        expect(model.transaction).toBeInstanceOf(AdminWalletTransactionModel);
        expect(model.balanceAfter).toBe(400);
    });
});

describe('fmtMoney', () => {
    it('formats with two decimals', () => {
        expect(fmtMoney(1234.5)).toMatch(/1,234\.50|1\.234,50/);
        expect(fmtMoney(null)).toBe('0.00');
    });
});

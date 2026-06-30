import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import AdminWalletModel from '../../models/AdminWalletModel';
import AdminWalletTransactionModel from '../../models/AdminWalletTransactionModel';
import AdminWalletMoneyOperationModel from '../../models/AdminWalletMoneyOperationModel';
import {
    fetchAdminWallets,
    fetchAdminWallet,
    fetchWalletTransactions,
    fetchAllWalletTransactions,
    suspendWallet,
    activateWallet,
    deleteWallet,
    cashInWallet,
    adminWalletsKeys,
    WALLET_STATUSES,
    WALLET_DIRECTIONS,
    isMasterWallet,
} from '../adminWalletsService';

vi.mock('axios');

vi.mock('../../utils/api', () => ({
    getToken: vi.fn(() => 'test-token'),
}));

describe('adminWalletsService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('query keys', () => {
        it('builds stable react-query keys', () => {
            expect(adminWalletsKeys.list({ page: 1 })).toEqual(['admin', 'wallets', 'list', { page: 1 }]);
            expect(adminWalletsKeys.detail('abc')).toEqual(['admin', 'wallets', 'detail', 'abc']);
        });
    });

    describe('constants re-export', () => {
        it('exports wallet filter constants', () => {
            expect(WALLET_STATUSES).toEqual(['active', 'frozen', 'closed']);
            expect(WALLET_DIRECTIONS).toEqual(['debit', 'credit']);
            expect(isMasterWallet({ type: 'master' })).toBe(true);
        });
    });

    describe('API functions', () => {
        it('fetchAdminWallets returns mapped pagination', async () => {
            axios.get.mockResolvedValue({
                data: {
                    status: true,
                    data: {
                        data: [{ id: 'w1', wallet_id: 'WAL-1', type: 'user' }],
                        total: 1,
                    },
                },
            });

            const result = await fetchAdminWallets({ page: 1 });
            expect(result.data[0]).toBeInstanceOf(AdminWalletModel);
            expect(result.total).toBe(1);
        });

        it('fetchAdminWallet returns AdminWalletModel', async () => {
            axios.get.mockResolvedValue({
                data: { status: true, data: { id: 'w1', wallet_id: 'WAL-1' } },
            });

            const result = await fetchAdminWallet('w1');
            expect(result).toBeInstanceOf(AdminWalletModel);
            expect(result.wallet_id).toBe('WAL-1');
        });

        it('fetchWalletTransactions returns mapped models', async () => {
            axios.get.mockResolvedValue({
                data: {
                    status: true,
                    data: {
                        data: [{ id: 'tx1', type: 'topup', direction: 'credit', amount: 10 }],
                        total: 1,
                    },
                },
            });

            const result = await fetchWalletTransactions('w1', { page: 1 });
            expect(result.data[0]).toBeInstanceOf(AdminWalletTransactionModel);
        });

        it('fetchAllWalletTransactions calls global endpoint', async () => {
            axios.get.mockResolvedValue({
                data: { status: true, data: { data: [], total: 0 } },
            });

            await fetchAllWalletTransactions({ direction: 'debit' });
            expect(axios.get).toHaveBeenCalledWith(
                expect.stringContaining('/v2/admin/wallets/transactions'),
                expect.objectContaining({ params: { direction: 'debit' } })
            );
        });

        it('suspendWallet maps action response', async () => {
            axios.post.mockResolvedValue({
                data: {
                    status: true,
                    data: { message: 'ok', wallet: { id: 'w1', status: 'frozen' } },
                },
            });

            const result = await suspendWallet('w1');
            expect(result.wallet).toBeInstanceOf(AdminWalletModel);
            expect(result.wallet.status).toBe('frozen');
        });

        it('activateWallet posts to activate endpoint', async () => {
            axios.post.mockResolvedValue({
                data: { status: true, data: { message: 'ok', wallet: { id: 'w1' } } },
            });

            await activateWallet('w1');
            expect(axios.post).toHaveBeenCalledWith(
                expect.stringContaining('/v2/admin/wallets/w1/activate'),
                {},
                expect.any(Object)
            );
        });

        it('deleteWallet deletes wallet endpoint', async () => {
            axios.delete.mockResolvedValue({
                data: { status: true, data: { message: 'closed', wallet: { id: 'w1' } } },
            });

            await deleteWallet('w1');
            expect(axios.delete).toHaveBeenCalledWith(
                expect.stringContaining('/v2/admin/wallets/w1'),
                expect.any(Object)
            );
        });

        it('cashInWallet returns money operation model', async () => {
            axios.post.mockResolvedValue({
                data: {
                    status: true,
                    data: {
                        amount: 100,
                        wallet: { id: 'w1', balance: 200 },
                        transaction: { id: 't1', type: 'topup', direction: 'credit', amount: 100 },
                    },
                },
            });

            const result = await cashInWallet('w1', { amount: 100 }, 'idem-1');
            expect(result).toBeInstanceOf(AdminWalletMoneyOperationModel);
            expect(result.amount).toBe(100);
            expect(axios.post).toHaveBeenCalledWith(
                expect.stringContaining('/v2/admin/wallets/w1/cash-in'),
                { amount: 100, idempotency_key: 'idem-1' },
                expect.objectContaining({
                    headers: expect.not.objectContaining({ 'Idempotency-Key': expect.anything() }),
                })
            );
        });
    });
});

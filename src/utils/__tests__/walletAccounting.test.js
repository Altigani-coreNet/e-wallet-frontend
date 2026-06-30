import { describe, it, expect } from 'vitest';
import {
    ACCOUNT_CODE,
    expectedWalletOperationDelta,
    zeroAccountingDelta,
} from '../walletAccounting';

describe('walletAccounting', () => {
    describe('expectedWalletOperationDelta', () => {
        it('transfer with fee moves liabilities to fee income', () => {
            const delta = expectedWalletOperationDelta('transfer', { amount: 50, fee: 2 });

            expect(delta.accounts[ACCOUNT_CODE.CUSTOMER_LIABILITY]).toBe(-2);
            expect(delta.accounts[ACCOUNT_CODE.FEE_INCOME]).toBe(2);
            expect(delta.summary.total_assets).toBe(0);
            expect(delta.summary.total_liabilities).toBe(-2);
            expect(delta.summary.total_equity).toBe(2);
            expect(delta.balanceSheet.total_liabilities_and_equity).toBe(0);
        });

        it('transfer with zero fee has no ledger movement', () => {
            const delta = expectedWalletOperationDelta('transfer', { amount: 50, fee: 0 });

            expect(delta.accounts).toEqual({});
            expect(delta.summary.total_assets).toBe(0);
            expect(delta.summary.total_liabilities).toBe(0);
            expect(delta.summary.total_equity).toBe(0);
        });

        it('masterCashIn increases bank and master liability', () => {
            const delta = expectedWalletOperationDelta('masterCashIn', { amount: 1000 });

            expect(delta.accounts[ACCOUNT_CODE.BANK]).toBe(1000);
            expect(delta.accounts[ACCOUNT_CODE.MASTER_LIABILITY]).toBe(1000);
            expect(delta.summary.total_assets).toBe(1000);
            expect(delta.summary.total_liabilities).toBe(1000);
        });

        it('customerCashIn shifts master to customer liability', () => {
            const delta = expectedWalletOperationDelta('customerCashIn', { amount: 200 });

            expect(delta.accounts[ACCOUNT_CODE.MASTER_LIABILITY]).toBe(-200);
            expect(delta.accounts[ACCOUNT_CODE.CUSTOMER_LIABILITY]).toBe(200);
            expect(delta.summary.total_liabilities).toBe(0);
        });

        it('customerCashOut shifts customer to master liability', () => {
            const delta = expectedWalletOperationDelta('customerCashOut', { amount: 120 });

            expect(delta.accounts[ACCOUNT_CODE.CUSTOMER_LIABILITY]).toBe(-120);
            expect(delta.accounts[ACCOUNT_CODE.MASTER_LIABILITY]).toBe(120);
        });

        it('billPayment accrues provider payable and fee income', () => {
            const delta = expectedWalletOperationDelta('billPayment', {
                amount: 100,
                fee: 2,
                providerPayableCode: 2110,
            });

            expect(delta.accounts[ACCOUNT_CODE.CUSTOMER_LIABILITY]).toBe(-102);
            expect(delta.accounts[2110]).toBe(100);
            expect(delta.accounts[ACCOUNT_CODE.FEE_INCOME]).toBe(2);
            expect(delta.summary.total_liabilities).toBe(-2);
            expect(delta.summary.total_equity).toBe(2);
        });

        it('providerSettlement moves payable to bank', () => {
            const delta = expectedWalletOperationDelta('providerSettlement', {
                amount: 100,
                providerPayableCode: 2110,
            });

            expect(delta.accounts[2110]).toBe(-100);
            expect(delta.accounts[ACCOUNT_CODE.BANK]).toBe(-100);
            expect(delta.summary.total_assets).toBe(-100);
            expect(delta.summary.total_liabilities).toBe(-100);
        });
    });

    describe('zeroAccountingDelta', () => {
        it('returns all-zero deltas', () => {
            const delta = zeroAccountingDelta();

            expect(delta.accounts).toEqual({});
            expect(delta.summary).toEqual({
                total_assets: 0,
                total_liabilities: 0,
                total_equity: 0,
            });
            expect(delta.balanceSheet.total_liabilities_and_equity).toBe(0);
        });
    });
});

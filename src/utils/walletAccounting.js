import { roundMoney } from './walletTransferFee';

/** System chart-of-account codes (see Fast_Pay_Soft_Pos AccountCode). */
export const ACCOUNT_CODE = {
    BANK: 1000,
    CUSTOMER_LIABILITY: 2000,
    MASTER_LIABILITY: 2050,
    FEE_INCOME: 4000,
    PROVIDER_PAYABLE_CONTROL: 2100,
};

/**
 * Expected ledger / report deltas for a wallet money operation.
 * @param {object} options
 * @param {number} options.amount
 * @param {number} [options.fee=0]
 * @param {number} [options.providerPayableCode] — required for billPayment / providerSettlement
 */
export function expectedWalletOperationDelta(operation, { amount, fee = 0, providerPayableCode = null }) {
    const value = roundMoney(amount);
    const feeValue = roundMoney(fee);

    switch (operation) {
        case 'masterCashIn':
            return {
                accounts: {
                    [ACCOUNT_CODE.BANK]: value,
                    [ACCOUNT_CODE.MASTER_LIABILITY]: value,
                },
                summary: {
                    total_assets: value,
                    total_liabilities: value,
                    total_equity: 0,
                },
                balanceSheet: {
                    total_assets: value,
                    total_liabilities: value,
                    total_equity: 0,
                    total_liabilities_and_equity: value,
                },
            };
        case 'masterCashOut':
            return {
                accounts: {
                    [ACCOUNT_CODE.BANK]: -value,
                    [ACCOUNT_CODE.MASTER_LIABILITY]: -value,
                },
                summary: {
                    total_assets: -value,
                    total_liabilities: -value,
                    total_equity: 0,
                },
                balanceSheet: {
                    total_assets: -value,
                    total_liabilities: -value,
                    total_equity: 0,
                    total_liabilities_and_equity: -value,
                },
            };
        case 'customerCashIn':
            return {
                accounts: {
                    [ACCOUNT_CODE.MASTER_LIABILITY]: -value,
                    [ACCOUNT_CODE.CUSTOMER_LIABILITY]: value,
                },
                summary: {
                    total_assets: 0,
                    total_liabilities: 0,
                    total_equity: 0,
                },
                balanceSheet: {
                    total_assets: 0,
                    total_liabilities: 0,
                    total_equity: 0,
                    total_liabilities_and_equity: 0,
                },
            };
        case 'customerCashOut':
            return {
                accounts: {
                    [ACCOUNT_CODE.CUSTOMER_LIABILITY]: -value,
                    [ACCOUNT_CODE.MASTER_LIABILITY]: value,
                },
                summary: {
                    total_assets: 0,
                    total_liabilities: 0,
                    total_equity: 0,
                },
                balanceSheet: {
                    total_assets: 0,
                    total_liabilities: 0,
                    total_equity: 0,
                    total_liabilities_and_equity: 0,
                },
            };
        case 'transfer':
            if (feeValue > 0) {
                return {
                    accounts: {
                        [ACCOUNT_CODE.CUSTOMER_LIABILITY]: -feeValue,
                        [ACCOUNT_CODE.FEE_INCOME]: feeValue,
                    },
                    summary: {
                        total_assets: 0,
                        total_liabilities: -feeValue,
                        total_equity: feeValue,
                    },
                    balanceSheet: {
                        total_assets: 0,
                        total_liabilities: -feeValue,
                        total_equity: feeValue,
                        total_liabilities_and_equity: 0,
                    },
                };
            }

            return {
                accounts: {},
                summary: {
                    total_assets: 0,
                    total_liabilities: 0,
                    total_equity: 0,
                },
                balanceSheet: {
                    total_assets: 0,
                    total_liabilities: 0,
                    total_equity: 0,
                    total_liabilities_and_equity: 0,
                },
            };
        case 'billPayment': {
            if (providerPayableCode == null) {
                throw new Error('billPayment requires providerPayableCode');
            }

            const totalDebited = roundMoney(value + feeValue);

            return {
                accounts: {
                    [ACCOUNT_CODE.CUSTOMER_LIABILITY]: -totalDebited,
                    [providerPayableCode]: value,
                    ...(feeValue > 0 ? { [ACCOUNT_CODE.FEE_INCOME]: feeValue } : {}),
                },
                summary: {
                    total_assets: 0,
                    total_liabilities: -feeValue,
                    total_equity: feeValue,
                },
                balanceSheet: {
                    total_assets: 0,
                    total_liabilities: -feeValue,
                    total_equity: feeValue,
                    total_liabilities_and_equity: 0,
                },
            };
        }
        case 'providerSettlement': {
            if (providerPayableCode == null) {
                throw new Error('providerSettlement requires providerPayableCode');
            }

            return {
                accounts: {
                    [providerPayableCode]: -value,
                    [ACCOUNT_CODE.BANK]: -value,
                },
                summary: {
                    total_assets: -value,
                    total_liabilities: -value,
                    total_equity: 0,
                },
                balanceSheet: {
                    total_assets: -value,
                    total_liabilities: -value,
                    total_equity: 0,
                    total_liabilities_and_equity: -value,
                },
            };
        }
        default:
            throw new Error(`Unknown wallet operation: ${operation}`);
    }
}

/** Expected zero delta — rejected ops must not move the balance sheet. */
export function zeroAccountingDelta() {
    return {
        accounts: {},
        summary: {
            total_assets: 0,
            total_liabilities: 0,
            total_equity: 0,
        },
        balanceSheet: {
            total_assets: 0,
            total_liabilities: 0,
            total_equity: 0,
            total_liabilities_and_equity: 0,
        },
    };
}

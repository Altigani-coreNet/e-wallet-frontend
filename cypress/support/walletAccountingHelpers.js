/**
 * Shared helpers for wallet accounting E2E specs (ACCOUNTING_WORKFLOW_PRD.md).
 */

export const WALLET_ACCOUNTING_PASSWORD = 'WalletAcct1!';

/** System chart-of-account codes (see Fast_Pay_Soft_Pos AccountCode). */
export const ACCOUNT_CODE = {
    BANK: 1000,
    CUSTOMER_LIABILITY: 2000,
    MASTER_LIABILITY: 2050,
    FEE_INCOME: 4000,
};

export function uniqueWalletPhone(runId = Date.now()) {
    return `+2499${String(runId).slice(-7)}${Math.floor(Math.random() * 10)}`;
}

/** Default balance-sheet filter: first day of current month through today (UTC). */
export function currentMonthDateRange(referenceDate = new Date()) {
    const iso = referenceDate.toISOString().slice(0, 10);

    return {
        startDate: `${iso.slice(0, 7)}-01`,
        endDate: iso,
    };
}

export function unwrapAdminList(response) {
    const body = response.body;
    if (Array.isArray(body?.data?.data)) {
        return body.data.data;
    }
    if (Array.isArray(body?.data)) {
        return body.data;
    }
    if (Array.isArray(body)) {
        return body;
    }

    return [];
}

export function unwrapAdminPayload(response) {
    return response.body?.data ?? response.body;
}

function roundMoney(value) {
    return Math.round(Number(value || 0) * 100) / 100;
}

function indexAccountsByCode(groups = []) {
    const accountsByCode = {};

    for (const group of groups) {
        for (const subType of group.sub_types || []) {
            for (const account of subType.accounts || []) {
                if (account.code != null) {
                    accountsByCode[account.code] = roundMoney(
                        account.cumulative_balance ?? account.balance ?? 0
                    );
                }
            }
        }
    }

    return accountsByCode;
}

/**
 * Snapshot chart-of-accounts summary + per-account balances and balance-sheet totals.
 */
export function buildAccountingSnapshot({ chartOfAccountsPayload, balanceSheetPayload, label }) {
    const coa = chartOfAccountsPayload?.data ?? chartOfAccountsPayload ?? {};
    const bs = balanceSheetPayload?.data ?? balanceSheetPayload ?? {};

    return {
        label: label || 'snapshot',
        summary: {
            total_assets: roundMoney(coa.summary?.total_assets),
            total_liabilities: roundMoney(coa.summary?.total_liabilities),
            total_equity: roundMoney(coa.summary?.total_equity),
            is_balanced: coa.summary?.is_balanced,
        },
        balanceSheet: {
            total_assets: roundMoney(bs.totals?.total_assets),
            total_liabilities: roundMoney(bs.totals?.total_liabilities),
            total_equity: roundMoney(bs.totals?.total_equity),
            total_liabilities_and_equity: roundMoney(bs.totals?.total_liabilities_and_equity),
            is_balanced: bs.is_balanced,
            difference: roundMoney(bs.difference),
        },
        accountsByCode: indexAccountsByCode(coa.groups),
        filter: coa.filter ?? bs.filter ?? {},
    };
}

const DELTA_TOLERANCE = 0.01;

function assertDelta(actual, expected, message) {
    expect(actual, message).to.be.closeTo(expected, DELTA_TOLERANCE);
}

/**
 * Expected ledger / report deltas for a wallet money operation.
 */
export function expectedWalletOperationDelta(operation, { amount, fee = 0 }) {
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

/**
 * Seeded PRNG (mulberry32) for reproducible chaos sequences.
 */
export function mulberry32(seed) {
    let state = seed >>> 0;

    return () => {
        state += 0x6d2b79f5;
        let t = state;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);

        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/**
 * Pick a random invalid transfer payload for chaos / fault-injection tests.
 *
 * @param {() => number} rng - seeded PRNG returning [0, 1)
 * @param {{ senderWalletId: string, recipientWalletId: string, senderBalance: number }} ctx
 */
export function buildInvalidTransferPayload(rng, ctx) {
    const variants = [
        () => ({
            label: 'zero amount',
            body: { recipient_wallet_id: ctx.recipientWalletId, amount: 0 },
        }),
        () => ({
            label: 'negative amount',
            body: { recipient_wallet_id: ctx.recipientWalletId, amount: -10 },
        }),
        () => ({
            label: 'non-numeric amount',
            body: { recipient_wallet_id: ctx.recipientWalletId, amount: 'abc' },
        }),
        () => ({
            label: 'missing recipient_wallet_id',
            body: { amount: 5 },
        }),
        () => ({
            label: 'empty recipient_wallet_id',
            body: { recipient_wallet_id: '', amount: 5 },
        }),
        () => ({
            label: 'non-existent recipient wallet id',
            body: { recipient_wallet_id: 'WALLET-DOES-NOT-EXIST-999', amount: 5 },
        }),
        () => ({
            label: 'amount above sender balance',
            body: {
                recipient_wallet_id: ctx.recipientWalletId,
                amount: ctx.senderBalance + 1000,
            },
        }),
        () => ({
            label: 'negative fee',
            body: { recipient_wallet_id: ctx.recipientWalletId, amount: 5, fee: -1 },
        }),
        () => ({
            label: 'fee greater than amount',
            body: { recipient_wallet_id: ctx.recipientWalletId, amount: 5, fee: 10 },
        }),
        () => ({
            label: 'self-transfer to own wallet',
            body: { recipient_wallet_id: ctx.senderWalletId, amount: 5 },
        }),
    ];

    const index = Math.floor(rng() * variants.length);

    return variants[index]();
}

/**
 * Compare before/after snapshots against expected deltas and assert books stay balanced.
 */
export function assertAccountingDelta(before, after, expected, context = '') {
    const label = context ? `[${context}] ` : '';

    expect(after.balanceSheet.is_balanced, `${label}balance sheet is balanced`).to.eq(true);
    expect(after.summary.is_balanced, `${label}chart of accounts is balanced`).to.eq(true);
    assertDelta(
        after.balanceSheet.total_assets,
        after.balanceSheet.total_liabilities_and_equity,
        `${label}assets = liabilities + equity`
    );

    const summaryDelta = expected.summary || {};
    for (const key of ['total_assets', 'total_liabilities', 'total_equity']) {
        if (summaryDelta[key] !== undefined) {
            assertDelta(
                after.summary[key] - before.summary[key],
                summaryDelta[key],
                `${label}summary.${key} delta`
            );
        }
    }

    const balanceSheetDelta = expected.balanceSheet || {};
    for (const key of [
        'total_assets',
        'total_liabilities',
        'total_equity',
        'total_liabilities_and_equity',
    ]) {
        if (balanceSheetDelta[key] !== undefined) {
            assertDelta(
                after.balanceSheet[key] - before.balanceSheet[key],
                balanceSheetDelta[key],
                `${label}balanceSheet.${key} delta`
            );
        }
    }

    const accountDelta = expected.accounts || {};
    for (const [code, delta] of Object.entries(accountDelta)) {
        const codeNum = Number(code);
        const beforeBalance = before.accountsByCode[codeNum] ?? 0;
        const afterBalance = after.accountsByCode[codeNum] ?? 0;

        assertDelta(
            afterBalance - beforeBalance,
            delta,
            `${label}account ${code} delta (before ${beforeBalance}, after ${afterBalance})`
        );
    }
}

/** Pretty-print an apiRequest / cy.request response in the Cypress command log. */
export function logServerResponse(label, response) {
    const status = response?.status ?? '(unknown)';
    const body = response?.body ?? response;
    const pretty = JSON.stringify(body, null, 2);

    Cypress.log({
        name: 'API response',
        displayName: label,
        message: `HTTP ${status}`,
        consoleProps() {
            return { label, status, body };
        },
    });

    cy.then(() => {
        // eslint-disable-next-line no-console
        console.log(`[${label}] HTTP ${status}\n`, pretty);
    });

    cy.log(`${label} (HTTP ${status}):\n${pretty}`);
}

Cypress.Commands.add('logServerResponse', logServerResponse);

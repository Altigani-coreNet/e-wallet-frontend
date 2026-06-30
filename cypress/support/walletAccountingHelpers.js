/**
 * Shared helpers for wallet accounting E2E specs (ACCOUNTING_WORKFLOW_PRD.md).
 */

import {
    DEFAULT_TRANSFER_FEE,
    resolveTransferFee,
    transferRecipientNet as transferRecipientNetShared,
    roundMoney,
} from '../../src/utils/walletTransferFee';
import {
    ACCOUNT_CODE,
    expectedWalletOperationDelta,
    zeroAccountingDelta,
} from '../../src/utils/walletAccounting';

export { ACCOUNT_CODE, expectedWalletOperationDelta, zeroAccountingDelta };

export const WALLET_ACCOUNTING_PASSWORD = 'WalletAcct1!';

export function uniqueWalletPhone(runId = Date.now()) {
    return `+2499${String(runId).slice(-7)}${Math.floor(Math.random() * 10)}`;
}

/** Dev OTP code — must match Fast_Pay_Soft_Pos OTP_MOCK_CODE / config services.otp.mock_code */
export const MOCK_OTP_CODE = 111111;

/** Resolve mock OTP from Cypress env (default 111111). */
export function mockOtpCode() {
    const fromEnv = Cypress.env('otpMockCode');

    return fromEnv === undefined || fromEnv === '' ? MOCK_OTP_CODE : Number(fromEnv);
}

/** Configured transfer fee (SDG) — mirrors WALLET_TRANSFER_FEE on the API. */
export function configuredTransferFee() {
    return resolveTransferFee(Cypress.env('walletTransferFee'), DEFAULT_TRANSFER_FEE);
}

/** Net amount credited to recipient after the platform transfer fee. */
export function transferRecipientNet(grossAmount) {
    return transferRecipientNetShared(grossAmount, configuredTransferFee());
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

/**
 * True when the API rejected the operation.
 * Admin routes may return HTTP 200 with `{ status: false }`; customer routes use `{ success: false }` or 4xx.
 */
export function isApiErrorResponse(response) {
    const httpStatus = response?.status ?? response?.statusCode ?? 0;

    if (httpStatus >= 400 && httpStatus < 500) {
        return true;
    }

    const body = response?.body ?? response;

    return body?.status === false || body?.success === false;
}

/**
 * Assert a wallet/accounting API call was rejected (422 or semantic error body on HTTP 200).
 */
export function assertApiRejects(response, options = {}) {
    const label = options.label || 'API should reject';
    const body = response?.body ?? {};

    expect(isApiErrorResponse(response), label).to.eq(true);

    if (options.messageIncludes != null) {
        expect(String(body.message || '')).to.include(options.messageIncludes);
    }

    if (options.message != null) {
        expect(body.message).to.eq(options.message);
    }
}

/** Normalize cy.request / intercept bodies (may be JSON strings). */
export function parseApiBody(body) {
    if (typeof body === 'string') {
        try {
            return JSON.parse(body);
        } catch {
            return {};
        }
    }

    return body ?? {};
}

/**
 * Assert customer login/auth failed — HTTP 401 or HTTP 200 with success:false.
 */
export function assertApiAuthFailure(response, options = {}) {
    const httpStatus = response?.status ?? response?.statusCode ?? 0;
    const body = parseApiBody(response?.body ?? response);

    if (httpStatus === 401) {
        if (options.messageIncludes != null) {
            expect(String(body.message || '')).to.include(options.messageIncludes);
        }
        return;
    }

    expect(body.success, options.label || 'login should fail').to.eq(false);

    if (options.messageIncludes != null) {
        expect(String(body.message || '')).to.include(options.messageIncludes);
    }
}

/** Assert admin DELETE intercept succeeded (success or status flag in body). */
export function assertAdminDeleteSuccess(interceptResponse) {
    const httpStatus = interceptResponse?.statusCode ?? interceptResponse?.status ?? 0;
    const body = parseApiBody(interceptResponse?.body);

    expect(httpStatus).to.be.oneOf([200, 204]);
    expect(body.success ?? body.status, 'delete should succeed').to.eq(true);
}

/** Assert customer self-delete account succeeded. */
export function assertCustomerDeleteAccountSuccess(response, options = {}) {
    const httpStatus = response?.status ?? response?.statusCode ?? 0;
    const body = parseApiBody(response?.body ?? response);

    expect(httpStatus, options.label || 'delete account HTTP status').to.eq(200);
    expect(body.success, options.label || 'delete account success flag').to.eq(true);
    expect(String(body.message || '')).to.match(/account deleted successfully/i);
    expect(String(body.data?.message || '')).to.match(/account deleted successfully/i);
}

/** Assert customer self-delete was rejected (wrong password, validation, etc.). */
export function assertCustomerDeleteAccountRejected(response, options = {}) {
    const httpStatus = response?.status ?? response?.statusCode ?? 0;
    const body = parseApiBody(response?.body ?? response);

    if (httpStatus === 401) {
        if (options.messageIncludes != null) {
            expect(String(body.message || '')).to.include(options.messageIncludes);
        }
        return;
    }

    if (isApiErrorResponse(response)) {
        if (options.messageIncludes != null) {
            expect(String(body.message || '')).to.include(options.messageIncludes);
        }
        return;
    }

    expect(httpStatus, options.label || 'delete account should be rejected').to.be.oneOf([400, 401, 422]);
    expect(body.success, options.label || 'delete account success flag').to.eq(false);

    if (options.messageIncludes != null) {
        expect(String(body.message || '')).to.include(options.messageIncludes);
    }
}

/**
 * Assert idempotent admin money-operation replay (cash-in / cash-out).
 * Compares stable fields only — ignores updated_at and nested owner hydration drift.
 */
export function assertIdempotentMoneyOperationReplay(firstResponse, secondResponse) {
    const first = unwrapAdminPayload(firstResponse);
    const second = unwrapAdminPayload(secondResponse);

    expect(second.amount, 'replay amount').to.eq(first.amount);
    expect(second.posting_reference, 'replay posting_reference').to.eq(first.posting_reference);
    expect(second.wallet?.id, 'replay wallet id').to.eq(first.wallet?.id);
    expect(second.wallet?.balance, 'replay wallet balance').to.eq(first.wallet?.balance);
    expect(second.transaction?.id, 'replay transaction id').to.eq(first.transaction?.id);
    expect(second.transaction?.amount, 'replay transaction amount').to.eq(first.transaction?.amount);
    expect(second.transaction?.type, 'replay transaction type').to.eq(first.transaction?.type);
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
            label: 'self-transfer to own wallet',
            body: { recipient_wallet_id: ctx.senderWalletId, amount: 5 },
        }),
        () => ({
            label: 'missing otp_token and otp',
            body: { recipient_wallet_id: ctx.recipientWalletId, amount: 5 },
        }),
        () => ({
            label: 'invalid otp_token',
            body: {
                recipient_wallet_id: ctx.recipientWalletId,
                amount: 5,
                otp_token: 'not-a-valid-transfer-otp-token',
                otp: 111111,
            },
        }),
    ];

    const index = Math.floor(rng() * variants.length);

    return variants[index]();
}

/** Stable slug for idempotency keys in chaos tests (avoids replay across payload types). */
export function chaosPayloadKeySlug(label = '') {
    return String(label).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
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
Cypress.Commands.add('assertApiRejects', (response, options = {}) => {
    assertApiRejects(response, options);
});
Cypress.Commands.add('assertApiAuthFailure', (response, options = {}) => {
    assertApiAuthFailure(response, options);
});
Cypress.Commands.add('assertAdminDeleteSuccess', (interceptResponse) => {
    assertAdminDeleteSuccess(interceptResponse);
});
Cypress.Commands.add('assertIdempotentMoneyOperationReplay', (firstResponse, secondResponse) => {
    assertIdempotentMoneyOperationReplay(firstResponse, secondResponse);
});

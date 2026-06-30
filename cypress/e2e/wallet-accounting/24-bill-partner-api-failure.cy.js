/**
 * Partner API failure — catalog payload sent, partner returns 500, zero accounting delta.
 */

import { mockOtpCode, zeroAccountingDelta } from '../../support/walletAccountingHelpers';

describe('Wallet accounting — bill partner API failure', () => {
    let customer;
    let billContext;

    before(() => {
        cy.setupBillPaymentTestContext({
            runId: Date.now(),
            label: 'BillFail',
            customerAmount: 150,
            billAmount: 60,
            partnerStatusCode: 500,
            partnerResponseBody: { error: 'partner down' },
        }).then((ctx) => {
            customer = ctx.customer;
            billContext = ctx.billContext;
        });
    });

    it('does not move ledger when partner API fails', () => {
        cy.captureAccountingSnapshot({ adminToken: customer.adminToken, label: 'before partner fail' }).then((before) => {
            cy.apiWalletBillPayment({
                token: customer.token,
                serviceId: billContext.serviceId,
                productId: billContext.productId,
                amount: billContext.amount,
                servicePayload: billContext.servicePayload,
                description: billContext.description,
                idempotencyKey: `bill-fail-${Date.now()}`,
                otp: mockOtpCode(),
                failOnStatusCode: false,
            }).then((response) => {
                expect(response.status).to.eq(502);
            });

            cy.captureAccountingSnapshot({ adminToken: customer.adminToken, label: 'after partner fail' }).then((after) => {
                const expected = zeroAccountingDelta();
                expect(after.summary.total_assets - before.summary.total_assets).to.eq(expected.summary.total_assets);
                expect(after.summary.total_liabilities - before.summary.total_liabilities).to.eq(expected.summary.total_liabilities);
            });
        });
    });
});

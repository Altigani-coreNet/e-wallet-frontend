/**
 * 05 — Partner API failure: 502 response, no ledger movement
 *
 * Local dev: description contains [MOCK_PARTNER_FAIL] → bill-mock.test/fail stub.
 */

import { mockOtpCode, zeroAccountingDelta } from '../../support/walletAccountingHelpers';

describe('Bill payment [05] partner API failure', () => {
    it('does not move ledger when partner API fails', () => {
        cy.setupOneBillPayment({ billAmount: 60, customerAmount: 150 }).then(({ customer, billContext }) => {
            const description = '[MOCK_PARTNER_FAIL] Bill payment E2E';

            cy.captureAccountingSnapshot({ adminToken: customer.adminToken, label: 'before partner fail' }).then((before) => {
                cy.apiWalletBillPayment({
                    token: customer.token,
                    serviceId: billContext.serviceId,
                    productId: billContext.productId,
                    amount: billContext.amount,
                    servicePayload: billContext.servicePayload,
                    description,
                    idempotencyKey: `bill-fail-${Date.now()}`,
                    otp: mockOtpCode(),
                    failOnStatusCode: false,
                }).then((response) => {
                    expect(response.status).to.eq(502);
                });

                cy.captureAccountingSnapshot({ adminToken: customer.adminToken, label: 'after partner fail' }).then((after) => {
                    const delta = zeroAccountingDelta();
                    expect(after.summary.total_assets - before.summary.total_assets).to.eq(delta.summary.total_assets);
                    expect(after.summary.total_liabilities - before.summary.total_liabilities).to.eq(delta.summary.total_liabilities);
                });
            });
        });
    });
});

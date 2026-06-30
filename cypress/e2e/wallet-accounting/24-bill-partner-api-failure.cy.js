/**
 * Partner API failure — zero accounting delta.
 */

import { mockOtpCode, zeroAccountingDelta } from '../../support/walletAccountingHelpers';

describe('Wallet accounting — bill partner API failure', () => {
    let customer;
    let catalog;

    before(() => {
        catalog = Cypress.env('billPaymentCatalog');
        if (!catalog?.serviceId) {
            return;
        }

        cy.intercept('POST', '**/bill-mock.test/pay', {
            statusCode: 500,
            body: { error: 'partner down' },
        });

        cy.setupWalletAccountingCustomer({ runId: Date.now(), label: 'BillFail' }).then((ctx) => {
            customer = ctx;
            cy.apiAdminGetMasterWallet(ctx.adminToken).then((master) => {
                cy.apiAdminWalletCashIn({
                    adminToken: ctx.adminToken,
                    walletUuid: master.id,
                    amount: 200,
                    idempotencyKey: `seed-fail-${Date.now()}`,
                });
                cy.apiAdminWalletCashIn({
                    adminToken: ctx.adminToken,
                    walletUuid: customer.walletUuid,
                    amount: 150,
                    idempotencyKey: `fund-fail-${Date.now()}`,
                });
            });
        });
    });

    it('does not move ledger when partner API fails', function () {
        if (!catalog?.serviceId) {
            this.skip();
        }

        cy.captureAccountingSnapshot({ adminToken: customer.adminToken, label: 'before partner fail' }).then((before) => {
            cy.apiWalletBillPayment({
                token: customer.token,
                serviceId: catalog.serviceId,
                productId: catalog.productId,
                amount: 60,
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

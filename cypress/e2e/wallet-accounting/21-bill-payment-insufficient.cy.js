/**
 * Bill payment insufficient balance — zero accounting delta.
 */

import { zeroAccountingDelta } from '../../support/walletAccountingHelpers';

describe('Wallet accounting — bill payment insufficient', () => {
    let customer;
    let catalog;

    before(() => {
        catalog = Cypress.env('billPaymentCatalog');
        if (!catalog?.serviceId) {
            return;
        }

        cy.setupWalletAccountingCustomer({ runId: Date.now(), label: 'BillInsufficient' }).then((ctx) => {
            customer = ctx;
            cy.apiAdminGetMasterWallet(ctx.adminToken).then((master) => {
                cy.apiAdminWalletCashIn({
                    adminToken: ctx.adminToken,
                    walletUuid: master.id,
                    amount: 100,
                    idempotencyKey: `seed-insuf-${Date.now()}`,
                });
                cy.apiAdminWalletCashIn({
                    adminToken: ctx.adminToken,
                    walletUuid: customer.walletUuid,
                    amount: 30,
                    idempotencyKey: `fund-insuf-${Date.now()}`,
                });
            });
        });
    });

    it('rejects bill payment when balance is too low', function () {
        if (!catalog?.serviceId) {
            this.skip();
        }

        cy.captureAccountingSnapshot({ adminToken: customer.adminToken, label: 'before insufficient bill' }).then((before) => {
            cy.apiWalletBillPaymentOtp({
                token: customer.token,
                serviceId: catalog.serviceId,
                productId: catalog.productId,
                amount: 100,
                failOnStatusCode: false,
            }).then((response) => {
                expect(response.status).to.eq(422);
            });

            cy.captureAccountingSnapshot({ adminToken: customer.adminToken, label: 'after insufficient bill' }).then((after) => {
                const expected = zeroAccountingDelta();
                expect(after.summary.total_assets - before.summary.total_assets).to.eq(expected.summary.total_assets);
            });
        });
    });
});

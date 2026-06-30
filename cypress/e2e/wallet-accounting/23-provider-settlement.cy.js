/**
 * Provider settlement lifecycle — bill accrual then admin settle.
 */

import { expectedWalletOperationDelta, mockOtpCode } from '../../support/walletAccountingHelpers';

describe('Wallet accounting — provider settlement', () => {
    let adminToken;
    let customer;
    let catalog;

    before(() => {
        catalog = Cypress.env('billPaymentCatalog');
        if (!catalog?.serviceId || !catalog?.partnerId) {
            return;
        }

        cy.intercept('POST', '**/bill-mock.test/pay', {
            statusCode: 200,
            body: { success: true, reference: 'MOCK-SETTLE' },
        });

        cy.setupWalletAccountingCustomer({ runId: Date.now(), label: 'Settle' }).then((ctx) => {
            customer = ctx;
            adminToken = ctx.adminToken;

            cy.apiAdminGetMasterWallet(adminToken).then((master) => {
                cy.apiAdminWalletCashIn({
                    adminToken,
                    walletUuid: master.id,
                    amount: 300,
                    idempotencyKey: `seed-settle-${Date.now()}`,
                });
                cy.apiAdminWalletCashIn({
                    adminToken,
                    walletUuid: customer.walletUuid,
                    amount: 200,
                    idempotencyKey: `fund-settle-${Date.now()}`,
                });
            });
        });
    });

    it('settles provider payable after customer bill payment', function () {
        if (!catalog?.serviceId) {
            this.skip();
        }

        const amount = 80;

        cy.apiWalletBillPayment({
            token: customer.token,
            serviceId: catalog.serviceId,
            productId: catalog.productId,
            amount,
            idempotencyKey: `bill-settle-${Date.now()}`,
            otp: mockOtpCode(),
        }).then((pay) => {
            expect(pay.status).to.eq(200);
        });

        cy.captureAccountingSnapshot({ adminToken, label: 'before settlement' }).then((before) => {
            cy.apiAdminProviderSettlement({
                adminToken,
                partnerId: catalog.partnerId,
                amount,
                idempotencyKey: `settle-${Date.now()}`,
            }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body.data.payable_balance_after).to.eq(0);
            });

            cy.assertAccountingReflectsOperation({
                before,
                adminToken,
                operation: 'providerSettlement',
                amount,
                providerPayableCode: catalog.partnerPayableCode,
                context: 'provider settlement',
            });
        });
    });
});

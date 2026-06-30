/**
 * Bill payment idempotency — single debit on retry.
 */

import { mockOtpCode } from '../../support/walletAccountingHelpers';

describe('Wallet accounting — bill payment idempotency', () => {
    let customer;
    let catalog;

    before(() => {
        catalog = Cypress.env('billPaymentCatalog');
        if (!catalog?.serviceId) {
            return;
        }

        cy.intercept('POST', '**/bill-mock.test/pay', {
            statusCode: 200,
            body: { success: true, reference: 'MOCK-IDEM' },
        });

        cy.setupWalletAccountingCustomer({ runId: Date.now(), label: 'BillIdem' }).then((ctx) => {
            customer = ctx;
            cy.apiAdminGetMasterWallet(ctx.adminToken).then((master) => {
                cy.apiAdminWalletCashIn({
                    adminToken: ctx.adminToken,
                    walletUuid: master.id,
                    amount: 200,
                    idempotencyKey: `seed-idem-${Date.now()}`,
                });
                cy.apiAdminWalletCashIn({
                    adminToken: ctx.adminToken,
                    walletUuid: customer.walletUuid,
                    amount: 150,
                    idempotencyKey: `fund-idem-${Date.now()}`,
                });
            });
        });
    });

    it('returns cached response on duplicate Idempotency-Key', function () {
        if (!catalog?.serviceId) {
            this.skip();
        }

        const idempotencyKey = `bill-idem-${Date.now()}`;
        const payload = {
            token: customer.token,
            serviceId: catalog.serviceId,
            productId: catalog.productId,
            amount: 50,
            idempotencyKey,
            otp: mockOtpCode(),
        };

        cy.apiWalletBillPayment(payload).then((first) => {
            expect(first.status).to.eq(200);
            cy.apiWalletBillPayment(payload).then((second) => {
                expect(second.status).to.eq(200);
                expect(second.body.data.bill_payment.id).to.eq(first.body.data.bill_payment.id);
            });
        });
    });
});

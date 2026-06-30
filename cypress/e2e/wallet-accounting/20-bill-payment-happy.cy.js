/**
 * Bill payment happy path — OTP, pay, accrual snapshot (bank unchanged).
 * Requires Cypress.env('billPaymentCatalog') = { serviceId, productId, partnerPayableCode, partnerId, formUrl }
 * or run with bill catalog seeded in the test database.
 */

import {
    expectedWalletOperationDelta,
    mockOtpCode,
    zeroAccountingDelta,
} from '../../support/walletAccountingHelpers';

describe('Wallet accounting — bill payment happy', () => {
    let adminToken;
    let customer;
    let catalog;

    before(() => {
        const fromEnv = Cypress.env('billPaymentCatalog');
        if (!fromEnv?.serviceId || !fromEnv?.productId) {
            cy.log('Skipping: set Cypress.env billPaymentCatalog with serviceId, productId, partnerPayableCode');
            return;
        }

        catalog = fromEnv;

        cy.intercept('POST', '**/bill-mock.test/pay', {
            statusCode: 200,
            body: { success: true, reference: 'MOCK-E2E-1' },
        }).as('partnerBillPay');

        cy.setupWalletAccountingCustomer({ runId: Date.now(), label: 'BillPay' }).then((ctx) => {
            customer = ctx;
            adminToken = ctx.adminToken;

            cy.apiAdminGetMasterWallet(adminToken).then((master) => {
                cy.apiAdminWalletCashIn({
                    adminToken,
                    walletUuid: master.id,
                    amount: 300,
                    idempotencyKey: `seed-bill-${Date.now()}`,
                });
                cy.apiAdminWalletCashIn({
                    adminToken,
                    walletUuid: customer.walletUuid,
                    amount: 200,
                    idempotencyKey: `fund-bill-${Date.now()}`,
                });
            });
        });
    });

    it('pays bill with OTP and accrues provider payable without moving bank', function () {
        if (!catalog?.serviceId) {
            this.skip();
        }

        const amount = 100;
        const fee = Number(Cypress.env('walletBillPaymentFee') ?? 0);

        cy.captureAccountingSnapshot({ adminToken, label: 'before bill pay' }).then((before) => {
            cy.apiWalletBillPayment({
                token: customer.token,
                serviceId: catalog.serviceId,
                productId: catalog.productId,
                amount,
                servicePayload: { account_number: '12345' },
                idempotencyKey: `bill-happy-${Date.now()}`,
                otp: mockOtpCode(),
            }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body.data.transaction.type).to.eq('bill_payment');
            });

            cy.assertAccountingReflectsOperation({
                before,
                adminToken,
                operation: 'billPayment',
                amount,
                fee,
                providerPayableCode: catalog.partnerPayableCode,
                context: 'bill payment accrual',
            });
        });
    });
});

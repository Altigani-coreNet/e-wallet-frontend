/**
 * Provider settlement — bill pay from catalog payload, then admin settle payable.
 */

import { mockOtpCode } from '../../support/walletAccountingHelpers';

describe('Wallet accounting — provider settlement', () => {
    let adminToken;
    let customer;
    let billContext;

    before(() => {
        cy.setupBillPaymentTestContext({
            runId: Date.now(),
            label: 'BillSettle',
            customerAmount: 200,
            billAmount: 80,
        }).then((ctx) => {
            customer = ctx.customer;
            adminToken = ctx.customer.adminToken;
            billContext = ctx.billContext;
        });
    });

    it('settles provider payable after customer bill payment', () => {
        const { amount, servicePayload, description, partnerId } = billContext;

        cy.apiWalletBillPayment({
            token: customer.token,
            serviceId: billContext.serviceId,
            productId: billContext.productId,
            amount,
            servicePayload,
            description,
            idempotencyKey: `bill-settle-${Date.now()}`,
            otp: mockOtpCode(),
        }).then((pay) => {
            expect(pay.status).to.eq(200);
        });

        cy.captureAccountingSnapshot({ adminToken, label: 'before settlement' }).then((before) => {
            cy.apiAdminProviderSettlement({
                adminToken,
                partnerId,
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
                providerPayableCode: billContext.partnerPayableCode,
                context: 'provider settlement',
            });
        });
    });
});

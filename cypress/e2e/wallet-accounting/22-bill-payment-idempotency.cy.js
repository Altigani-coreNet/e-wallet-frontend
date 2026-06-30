/**
 * Bill payment idempotency — same catalog payload + Idempotency-Key returns cached response.
 */

import { mockOtpCode } from '../../support/walletAccountingHelpers';

describe('Wallet accounting — bill payment idempotency', () => {
    let customer;
    let billContext;

    before(() => {
        cy.setupBillPaymentTestContext({
            runId: Date.now(),
            label: 'BillIdem',
            customerAmount: 150,
            billAmount: 50,
        }).then((ctx) => {
            customer = ctx.customer;
            billContext = ctx.billContext;
        });
    });

    it('returns cached response on duplicate Idempotency-Key', () => {
        const idempotencyKey = `bill-idem-${Date.now()}`;
        const payload = {
            token: customer.token,
            serviceId: billContext.serviceId,
            productId: billContext.productId,
            amount: billContext.amount,
            servicePayload: billContext.servicePayload,
            description: billContext.description,
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

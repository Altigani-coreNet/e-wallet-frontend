/**
 * 01 — Bill payment happy path
 *
 * Flow: services/home → approve partner → OTP → pay → completed
 */

import { mockOtpCode } from '../../support/walletAccountingHelpers';

describe('Bill payment [01] happy path', () => {
    it('pays a bill with OTP and completes', () => {
        cy.setupOneBillPayment({ billAmount: 100, customerAmount: 200 }).then(({ customer, billContext }) => {
            cy.apiWalletBillPayment({
                token: customer.token,
                serviceId: billContext.serviceId,
                productId: billContext.productId,
                amount: billContext.amount,
                servicePayload: billContext.servicePayload,
                description: billContext.description,
                idempotencyKey: `bill-happy-${Date.now()}`,
                otp: mockOtpCode(),
            }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body.data.transaction.type).to.eq('bill_payment');
                expect(response.body.data.bill_payment.status).to.eq('completed');
            });
        });
    });
});

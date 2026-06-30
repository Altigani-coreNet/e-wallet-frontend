/**
 * One bill payment — happy path only.
 *
 * 1. Ensure partner payable accounts exist
 * 2. Customer login + funded wallet
 * 3. GET /customer/services/home → first product
 * 4. POST bill-payment/otp + POST bill-payment
 */

import { mockOtpCode } from '../../support/walletAccountingHelpers';

describe('Bill payment — one successful pay', () => {
    it('pays a bill with OTP and completes', () => {
        cy.setupOneBillPayment({ billAmount: 100 }).then(({ customer, billContext }) => {
            const idempotencyKey = `bill-one-${Date.now()}`;

            cy.apiWalletBillPayment({
                token: customer.token,
                serviceId: billContext.serviceId,
                productId: billContext.productId,
                amount: billContext.amount,
                servicePayload: billContext.servicePayload,
                description: billContext.description,
                idempotencyKey,
                otp: mockOtpCode(),
            }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body.data.transaction.type).to.eq('bill_payment');
                expect(response.body.data.bill_payment.status).to.eq('completed');
            });
        });
    });
});

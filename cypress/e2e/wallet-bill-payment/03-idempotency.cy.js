/**
 * 03 — Duplicate Idempotency-Key returns the same bill payment record
 */

import { mockOtpCode } from '../../support/walletAccountingHelpers';

describe('Bill payment [03] idempotency', () => {
    it('returns cached response on duplicate Idempotency-Key', () => {
        cy.setupOneBillPayment({ billAmount: 50, customerAmount: 150 }).then(({ customer, billContext }) => {
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
});

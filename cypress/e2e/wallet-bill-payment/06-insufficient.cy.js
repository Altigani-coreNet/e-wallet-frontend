/**
 * 06 — Insufficient balance (OTP step)
 *
 * Requires latest CustomerWalletService balance check on bill-payment/otp.
 */

import { zeroAccountingDelta } from '../../support/walletAccountingHelpers';

describe('Bill payment [06] insufficient balance', () => {
    it('rejects bill payment OTP when amount exceeds funded balance', () => {
        cy.setupOneBillPayment({ billAmount: 50, customerAmount: 50 }).then(({ customer, billContext }) => {
            cy.captureAccountingSnapshot({ adminToken: customer.adminToken, label: 'before insufficient' }).then((before) => {
                cy.apiWalletBillPaymentOtp({
                    token: customer.token,
                    serviceId: billContext.serviceId,
                    productId: billContext.productId,
                    amount: 500,
                    servicePayload: billContext.servicePayload,
                    description: billContext.description,
                    failOnStatusCode: false,
                }).then((response) => {
                    expect(response.status).to.eq(422);
                    expect(response.body.message).to.match(/insufficient|balance/i);
                });

                cy.captureAccountingSnapshot({ adminToken: customer.adminToken, label: 'after insufficient' }).then((after) => {
                    const delta = zeroAccountingDelta();
                    expect(after.summary.total_assets - before.summary.total_assets).to.eq(delta.summary.total_assets);
                });
            });
        });
    });
});

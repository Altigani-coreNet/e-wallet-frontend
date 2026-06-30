/**
 * 02 — Invalid OTP: pay step rejected, no ledger movement
 */

import { mockOtpCode, zeroAccountingDelta } from '../../support/walletAccountingHelpers';

describe('Bill payment [02] invalid OTP', () => {
    it('rejects bill payment when OTP code is wrong', () => {
        cy.setupOneBillPayment({ billAmount: 50, customerAmount: 150 }).then(({ customer, billContext }) => {
            cy.captureAccountingSnapshot({ adminToken: customer.adminToken, label: 'before invalid otp' }).then((before) => {
                cy.apiWalletBillPaymentOtp({
                    token: customer.token,
                    serviceId: billContext.serviceId,
                    productId: billContext.productId,
                    amount: billContext.amount,
                    servicePayload: billContext.servicePayload,
                    description: billContext.description,
                    idempotencyKey: `bill-otp-${Date.now()}`,
                }).then((otpResponse) => {
                    expect(otpResponse.status).to.be.oneOf([200, 201]);

                    cy.apiWalletBillPayment({
                        token: customer.token,
                        serviceId: billContext.serviceId,
                        productId: billContext.productId,
                        amount: billContext.amount,
                        servicePayload: billContext.servicePayload,
                        description: billContext.description,
                        idempotencyKey: `bill-invalid-${Date.now()}`,
                        otpToken: otpResponse.body.data.otp_token,
                        otp: mockOtpCode() === 111111 ? 999999 : 111111,
                        failOnStatusCode: false,
                    }).then((payResponse) => {
                        expect(payResponse.status).to.eq(422);
                    });
                });

                cy.captureAccountingSnapshot({ adminToken: customer.adminToken, label: 'after invalid otp' }).then((after) => {
                    const delta = zeroAccountingDelta();
                    expect(after.summary.total_assets - before.summary.total_assets).to.eq(delta.summary.total_assets);
                });
            });
        });
    });
});

/**
 * 04 — Bill pay accrues provider payable, then admin settles it
 */

import { mockOtpCode } from '../../support/walletAccountingHelpers';

describe('Bill payment [04] provider settlement', () => {
    it('settles provider payable after a successful bill payment', () => {
        cy.setupOneBillPayment({ billAmount: 80, customerAmount: 200 }).then(({ customer, billContext }) => {
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

            cy.apiAdminListProviderPayables({ adminToken: customer.adminToken }).then((beforePayables) => {
                const rows = beforePayables.body?.data?.data ?? [];
                const row = rows.find(
                    (entry) => String(entry.partner_id).toLowerCase() === String(partnerId).toLowerCase()
                );
                const payableBefore = Number(row?.payable_balance ?? 0);

                cy.captureAccountingSnapshot({ adminToken: customer.adminToken, label: 'before settlement' }).then((before) => {
                    cy.apiAdminProviderSettlement({
                        adminToken: customer.adminToken,
                        partnerId,
                        amount,
                        idempotencyKey: `settle-${Date.now()}`,
                    }).then((response) => {
                        expect(response.status).to.eq(200);
                        expect(response.body.data.amount).to.eq(amount);
                        expect(response.body.data.payable_balance_after).to.eq(payableBefore - amount);
                    });

                    cy.assertAccountingReflectsOperation({
                        before,
                        adminToken: customer.adminToken,
                        operation: 'providerSettlement',
                        amount,
                        providerPayableCode: billContext.partnerPayableCode,
                        context: 'provider settlement after bill pay',
                    });
                });
            });
        });
    });
});

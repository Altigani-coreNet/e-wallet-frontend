/**
 * Bill payment insufficient balance — catalog-driven payload, OTP rejected, zero accounting delta.
 */

import { zeroAccountingDelta } from '../../support/walletAccountingHelpers';

describe('Wallet accounting — bill payment insufficient', () => {
    let customer;
    let billContext;

    before(() => {
        cy.setupWalletAccountingCustomer({ runId: Date.now(), label: 'BillInsufficient' }).then((ctx) => {
            customer = ctx;

            cy.fundWalletAccountingCustomerForBillPay({
                adminToken: ctx.adminToken,
                walletUuid: customer.walletUuid,
                masterAmount: 100,
                customerAmount: 30,
            });

            return cy.prepareBillPaymentFromCatalog({
                token: customer.token,
                adminToken: ctx.adminToken,
                phone: customer.phone,
                amount: 100,
            }).then((resolved) => {
                billContext = resolved;
            });
        });
    });

    it('rejects bill payment when balance is too low', () => {
        cy.captureAccountingSnapshot({ adminToken: customer.adminToken, label: 'before insufficient bill' }).then((before) => {
            cy.apiWalletBillPaymentOtp({
                token: customer.token,
                serviceId: billContext.serviceId,
                productId: billContext.productId,
                amount: billContext.amount,
                servicePayload: billContext.servicePayload,
                description: billContext.description,
                failOnStatusCode: false,
            }).then((response) => {
                expect(response.status).to.eq(422);
            });

            cy.captureAccountingSnapshot({ adminToken: customer.adminToken, label: 'after insufficient bill' }).then((after) => {
                const expected = zeroAccountingDelta();
                expect(after.summary.total_assets - before.summary.total_assets).to.eq(expected.summary.total_assets);
            });
        });
    });
});

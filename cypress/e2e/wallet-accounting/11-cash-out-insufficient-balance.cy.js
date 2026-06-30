/**
 * PRD Gherkin: Cash-out exceeding balance is rejected
 */

import { assertApiRejects } from '../../support/walletAccountingHelpers';

describe('Wallet accounting — cash-out insufficient balance', () => {
    let adminToken;
    let customer;

    before(() => {
        cy.setupWalletAccountingCustomer({ runId: Date.now(), label: 'CashOutFail' }).then((ctx) => {
            customer = ctx;
            adminToken = ctx.adminToken;

            cy.apiAdminGetMasterWallet(adminToken).then((master) => {
                cy.apiAdminWalletCashIn({
                    adminToken,
                    walletUuid: master.id,
                    amount: 200,
                    description: 'E2E seed master',
                    idempotencyKey: `seed-cashout-fail-${Date.now()}`,
                });

                cy.apiAdminWalletCashIn({
                    adminToken,
                    walletUuid: customer.walletUuid,
                    amount: 10,
                    description: 'Small customer balance',
                    idempotencyKey: `fund-small-${Date.now()}`,
                });
            });
        });
    });

    it('rejects cash-out above customer balance with 422', () => {
        cy.captureAccountingSnapshot({ adminToken, label: 'before failed cash-out' }).then((before) => {
            cy.apiAdminWalletCashOut({
                adminToken,
                walletUuid: customer.walletUuid,
                amount: 48,
                description: 'Should fail',
                failOnStatusCode: false,
            }).then((response) => {
                assertApiRejects(response, { messageIncludes: 'Insufficient wallet balance' });
            });

            cy.apiAdminWalletShow({ adminToken, walletUuid: customer.walletUuid }).then((show) => {
                expect(show.body.data.balance).to.eq(10);
            });

            cy.apiWalletDashboard(customer.token).then((dash) => {
                expect(dash.body.data.wallet.balance).to.eq(10);
            });

            cy.assertAccountingUnchanged({
                before,
                adminToken,
                context: 'cash-out insufficient balance',
            });
        });
    });
});

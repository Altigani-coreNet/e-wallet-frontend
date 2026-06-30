/**
 * PRD Gherkin: Cash-in rejected when master float is insufficient
 */

import { assertApiRejects } from '../../support/walletAccountingHelpers';

describe('Wallet accounting — customer cash-in insufficient master float', () => {
    let adminToken;
    let masterUuid;
    let customer;

    before(() => {
        cy.setupWalletAccountingCustomer({ runId: Date.now(), label: 'CashInFail' }).then((ctx) => {
            customer = ctx;
            adminToken = ctx.adminToken;

            cy.apiAdminGetMasterWallet(adminToken).then((master) => {
                masterUuid = master.id;
            });
        });
    });

    it('rejects customer cash-in when master float is too low', () => {
        cy.captureAccountingSnapshot({ adminToken, label: 'before failed customer cash-in' }).then((before) => {
            cy.apiAdminWalletShow({ adminToken, walletUuid: masterUuid }).then((masterBefore) => {
                const masterBalance = Number(masterBefore.body.data.balance);
                const attemptAmount = masterBalance + 500;

                cy.apiAdminWalletCashIn({
                    adminToken,
                    walletUuid: customer.walletUuid,
                    amount: attemptAmount,
                    description: 'Should fail — master float too low',
                    failOnStatusCode: false,
                }).then((response) => {
                    assertApiRejects(response, { messageIncludes: 'insufficient' });
                });

                cy.apiAdminWalletShow({ adminToken, walletUuid: customer.walletUuid }).then((walletShow) => {
                    expect(walletShow.body.data.balance).to.eq(0);
                });

                cy.apiWalletDashboard(customer.token).then((dash) => {
                    expect(dash.body.data.wallet.balance).to.eq(0);
                });

                cy.assertAccountingUnchanged({
                    before,
                    adminToken,
                    context: 'customer cash-in insufficient master float',
                });
            });
        });
    });
});

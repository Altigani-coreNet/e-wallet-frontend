/**
 * PRD Gherkin: Successful customer cash-in (master issues e-money)
 */

describe('Wallet accounting — customer cash-in', () => {
    let adminToken;
    let masterUuid;
    let customer;

    before(() => {
        cy.setupWalletAccountingCustomer({ runId: Date.now(), label: 'CashIn' }).then((ctx) => {
            customer = ctx;
            adminToken = ctx.adminToken;

            cy.apiAdminGetMasterWallet(adminToken).then((master) => {
                masterUuid = master.id;
                cy.apiAdminWalletCashIn({
                    adminToken,
                    walletUuid: masterUuid,
                    amount: 1000,
                    description: 'E2E seed master for customer cash-in',
                    idempotencyKey: `seed-cashin-${Date.now()}`,
                });
            });
        });
    });

    it('admin cash-in credits customer wallet and debits master float', () => {
        const amount = 200;

        cy.captureAccountingSnapshot({ adminToken, label: 'before customer cash-in' }).then((before) => {
            cy.apiAdminWalletShow({ adminToken, walletUuid: masterUuid }).then((masterBefore) => {
                const masterBalanceBefore = masterBefore.body.data.balance;

                cy.apiAdminWalletCashIn({
                    adminToken,
                    walletUuid: customer.walletUuid,
                    amount,
                    description: 'E2E customer buy balance',
                    idempotencyKey: `customer-cashin-${Date.now()}`,
                }).then((response) => {
                    expect(response.status).to.eq(200);
                    expect(response.body.data.amount).to.eq(amount);
                    expect(response.body.data.wallet.balance).to.eq(amount);
                });

                cy.apiAdminWalletShow({ adminToken, walletUuid: customer.walletUuid }).then((walletShow) => {
                    expect(walletShow.body.data.balance).to.eq(amount);
                });

                cy.apiWalletDashboard(customer.token).then((dash) => {
                    expect(dash.body.data.wallet.balance).to.eq(amount);
                });

                cy.apiAdminWalletShow({ adminToken, walletUuid: masterUuid }).then((masterAfter) => {
                    expect(masterAfter.body.data.balance).to.eq(masterBalanceBefore - amount);
                });

                cy.assertAccountingReflectsOperation({
                    before,
                    adminToken,
                    operation: 'customerCashIn',
                    amount,
                    context: 'customer cash-in',
                });
            });
        });
    });
});

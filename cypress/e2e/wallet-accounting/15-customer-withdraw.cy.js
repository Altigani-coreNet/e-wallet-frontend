/**
 * PRD UC-C4: Customer withdraw (cash-out via customer API)
 */

describe('Wallet accounting — customer withdraw', () => {
    let adminToken;
    let masterUuid;
    let customer;

    before(() => {
        cy.setupWalletAccountingCustomer({ runId: Date.now(), label: 'Withdraw' }).then((ctx) => {
            customer = ctx;
            adminToken = ctx.adminToken;

            cy.apiAdminGetMasterWallet(adminToken).then((master) => {
                masterUuid = master.id;
                cy.apiAdminWalletCashIn({
                    adminToken,
                    walletUuid: masterUuid,
                    amount: 500,
                    description: 'E2E seed master for withdraw',
                    idempotencyKey: `seed-withdraw-${Date.now()}`,
                });

                cy.apiAdminWalletCashIn({
                    adminToken,
                    walletUuid: customer.walletUuid,
                    amount: 80,
                    description: 'Fund customer before withdraw',
                    idempotencyKey: `fund-withdraw-${Date.now()}`,
                });
            });
        });
    });

    it('customer withdraw reduces balance and returns to master float', () => {
        const amount = 80;

        cy.captureAccountingSnapshot({ adminToken, label: 'before customer withdraw' }).then((before) => {
            cy.apiAdminWalletShow({ adminToken, walletUuid: masterUuid }).then((masterBefore) => {
                const masterBalanceBefore = masterBefore.body.data.balance;

                cy.apiWalletWithdraw({
                    token: customer.token,
                    amount,
                    description: 'E2E customer withdraw',
                    idempotencyKey: `withdraw-${Date.now()}`,
                }).then((response) => {
                    expect(response.status).to.eq(200);
                    expect(response.body.data.amount).to.eq(amount);
                    expect(response.body.data.wallet.balance).to.eq(0);
                });

                cy.apiWalletDashboard(customer.token).then((dash) => {
                    expect(dash.body.data.wallet.balance).to.eq(0);
                });

                cy.apiAdminWalletShow({ adminToken, walletUuid: customer.walletUuid }).then((show) => {
                    expect(show.body.data.balance).to.eq(0);
                });

                cy.apiAdminWalletShow({ adminToken, walletUuid: masterUuid }).then((masterAfter) => {
                    expect(masterAfter.body.data.balance).to.eq(masterBalanceBefore + amount);
                });

                cy.assertAccountingReflectsOperation({
                    before,
                    adminToken,
                    operation: 'customerCashOut',
                    amount,
                    context: 'customer withdraw',
                });
            });
        });
    });
});

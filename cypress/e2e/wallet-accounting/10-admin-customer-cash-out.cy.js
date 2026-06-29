/**
 * PRD Gherkin: Successful customer cash-out (admin redeems to master)
 */

describe('Wallet accounting — admin customer cash-out', () => {
    let adminToken;
    let masterUuid;
    let customer;

    before(() => {
        cy.setupWalletAccountingCustomer({ runId: Date.now(), label: 'CashOut' }).then((ctx) => {
            customer = ctx;
            adminToken = ctx.adminToken;

            cy.apiAdminGetMasterWallet(adminToken).then((master) => {
                masterUuid = master.id;
                cy.apiAdminWalletCashIn({
                    adminToken,
                    walletUuid: masterUuid,
                    amount: 800,
                    description: 'E2E seed master for cash-out',
                    idempotencyKey: `seed-cashout-${Date.now()}`,
                });

                cy.apiAdminWalletCashIn({
                    adminToken,
                    walletUuid: customer.walletUuid,
                    amount: 48,
                    description: 'Fund customer before cash-out',
                    idempotencyKey: `fund-cashout-${Date.now()}`,
                });
            });
        });
    });

    it('redeems customer balance back to master float', () => {
        const amount = 48;

        cy.captureAccountingSnapshot({ adminToken, label: 'before admin customer cash-out' }).then((before) => {
            cy.apiAdminWalletShow({ adminToken, walletUuid: masterUuid }).then((masterBefore) => {
                const masterBalanceBefore = masterBefore.body.data.balance;

                cy.apiAdminWalletCashOut({
                    adminToken,
                    walletUuid: customer.walletUuid,
                    amount,
                    description: 'E2E customer cash-out',
                    idempotencyKey: `customer-cashout-${Date.now()}`,
                }).then((response) => {
                    expect(response.status).to.eq(200);
                    expect(response.body.data.amount).to.eq(amount);
                    expect(response.body.data.wallet.balance).to.eq(0);
                });

                cy.apiAdminWalletShow({ adminToken, walletUuid: customer.walletUuid }).then((walletShow) => {
                    expect(walletShow.body.data.balance).to.eq(0);
                });

                cy.apiWalletDashboard(customer.token).then((dash) => {
                    expect(dash.body.data.wallet.balance).to.eq(0);
                });

                cy.apiAdminWalletShow({ adminToken, walletUuid: masterUuid }).then((masterAfter) => {
                    expect(masterAfter.body.data.balance).to.eq(masterBalanceBefore + amount);
                });

                cy.assertAccountingReflectsOperation({
                    before,
                    adminToken,
                    operation: 'customerCashOut',
                    amount,
                    context: 'admin customer cash-out',
                });
            });
        });
    });
});

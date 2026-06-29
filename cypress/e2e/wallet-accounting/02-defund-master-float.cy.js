/**
 * PRD Gherkin: Defund the master float
 */

describe('Wallet accounting — defund master float', () => {
    let adminToken;
    let masterUuid;

    before(() => {
        cy.apiAdminLogin().then(({ token }) => {
            adminToken = token;
            cy.apiAdminGetMasterWallet(adminToken).then((master) => {
                masterUuid = master.id;

                cy.apiAdminWalletCashIn({
                    adminToken,
                    walletUuid: masterUuid,
                    amount: 1000,
                    description: 'E2E seed master for defund test',
                    idempotencyKey: `seed-defund-${Date.now()}`,
                });
            });
        });
    });

    it('records cash-out for master wallet and balance decreases', () => {
        cy.apiAdminWalletShow({ adminToken, walletUuid: masterUuid }).then((before) => {
            const balanceBefore = before.body.data.balance;
            const amount = 300;

            cy.captureAccountingSnapshot({ adminToken, label: 'before master cash-out' }).then((accountingBefore) => {
                cy.apiAdminWalletCashOut({
                    adminToken,
                    walletUuid: masterUuid,
                    amount,
                    description: 'E2E defund master float',
                    idempotencyKey: `defund-master-${Date.now()}`,
                }).then((response) => {
                    expect(response.status).to.eq(200);
                    expect(response.body.data.amount).to.eq(amount);
                    expect(response.body.data.wallet.balance).to.eq(balanceBefore - amount);
                });

                cy.apiAdminWalletShow({ adminToken, walletUuid: masterUuid }).then((after) => {
                    expect(after.body.data.balance).to.eq(balanceBefore - amount);
                });

                cy.assertAccountingReflectsOperation({
                    before: accountingBefore,
                    adminToken,
                    operation: 'masterCashOut',
                    amount,
                    context: 'master cash-out',
                });
            });
        });
    });
});

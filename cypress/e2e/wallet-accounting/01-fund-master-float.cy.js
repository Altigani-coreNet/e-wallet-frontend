/**
 * PRD Gherkin: Fund the master float (happy path)
 */

describe('Wallet accounting — fund master float', () => {
    let adminToken;
    let masterUuid;
    let startBalance;

    before(() => {
        cy.apiAdminLogin().then(({ token }) => {
            adminToken = token;
            cy.apiAdminGetMasterWallet(adminToken).then((master) => {
                masterUuid = master.id;
                startBalance = master.balance;
            });
        });
    });

    it('records cash-in for master wallet and balance increases', () => {
        const amount = 500;

        cy.captureAccountingSnapshot({ adminToken, label: 'before master cash-in' }).then((before) => {
            cy.apiAdminWalletCashIn({
                adminToken,
                walletUuid: masterUuid,
                amount,
                description: 'E2E fund master float',
                idempotencyKey: `fund-master-${Date.now()}`,
            }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body.data.amount).to.eq(amount);
                expect(response.body.data.wallet.balance).to.eq(startBalance + amount);
            });

            cy.apiAdminWalletShow({ adminToken, walletUuid: masterUuid }).then((show) => {
                expect(show.body.data.balance).to.eq(startBalance + amount);
            });

            cy.assertAccountingReflectsOperation({
                before,
                adminToken,
                operation: 'masterCashIn',
                amount,
                context: 'master cash-in',
            });
        });
    });
});

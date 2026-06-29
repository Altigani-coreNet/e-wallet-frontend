/**
 * PRD Gherkin: Defund rejected when float is insufficient
 */

describe('Wallet accounting — defund master insufficient float', () => {
    let adminToken;
    let masterUuid;

    before(() => {
        cy.apiAdminLogin().then(({ token }) => {
            adminToken = token;
            cy.apiAdminGetMasterWallet(adminToken).then((master) => {
                masterUuid = master.id;
            });
        });
    });

    it('rejects master cash-out above available float with 422 and no balance change', () => {
        cy.apiAdminWalletShow({ adminToken, walletUuid: masterUuid }).then((before) => {
            const balanceBefore = before.body.data.balance;
            const attemptAmount = balanceBefore + 5000;

            cy.apiAdminWalletCashOut({
                adminToken,
                walletUuid: masterUuid,
                amount: attemptAmount,
                description: 'Should fail — insufficient float',
                failOnStatusCode: false,
            }).then((response) => {
                expect(response.status).to.eq(422);
            });

            cy.apiAdminWalletShow({ adminToken, walletUuid: masterUuid }).then((after) => {
                expect(after.body.data.balance).to.eq(balanceBefore);
            });
        });
    });
});

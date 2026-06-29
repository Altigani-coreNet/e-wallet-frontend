/**
 * PRD Gherkin: Opening capital recorded as equity
 */

describe('Wallet accounting — opening capital', () => {
    let adminToken;

    before(() => {
        cy.apiAdminLogin().then(({ token }) => {
            adminToken = token;
        });
    });

    it('posts opening capital and returns the recorded amount', () => {
        const amount = 1000;

        cy.apiAdminOpeningCapital({
            adminToken,
            amount,
            description: 'E2E owner seed capital',
            idempotencyKey: `opening-capital-${Date.now()}`,
        }).then((response) => {
            expect(response.status).to.eq(200);
            expect(response.body.data.amount).to.eq(amount);
            expect(response.body.data.posting_reference).to.be.a('string');
        });
    });
});

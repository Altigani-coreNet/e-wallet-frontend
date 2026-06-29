/**
 * PRD Gherkin: Resolve recipient not found
 */

describe('Wallet accounting — resolve recipient not found', () => {
    let sender;

    before(() => {
        cy.setupWalletAccountingCustomer({ runId: Date.now(), label: 'Resolver' }).then((ctx) => {
            sender = ctx;
        });
    });

    it('returns 422 when identifier does not match any wallet', () => {
        cy.apiWalletResolveRecipient({
            token: sender.token,
            identifier: 'does-not-exist-99999',
            failOnStatusCode: false,
        }).then((response) => {
            expect(response.status).to.eq(422);
            expect(response.body.message).to.include('not found');
        });
    });
});

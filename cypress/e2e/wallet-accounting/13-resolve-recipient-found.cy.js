/**
 * PRD Gherkin: Resolve recipient by identifier (happy path)
 */

describe('Wallet accounting — resolve recipient found', () => {
    let sender;
    let recipient;

    before(() => {
        cy.setupWalletAccountingPair(Date.now()).then((pair) => {
            sender = pair.sender;
            recipient = pair.recipient;
        });
    });

    it('returns recipient wallet data when searching by phone', () => {
        cy.apiWalletResolveRecipient({
            token: sender.token,
            identifier: recipient.phone,
        }).then((response) => {
            expect(response.status).to.eq(200);
            expect(response.body.data.recipient_wallet_id).to.eq(recipient.walletId);
            expect(response.body.data.wallet_id).to.eq(recipient.walletId);
            expect(response.body.data.owner_name).to.be.a('string');
            expect(response.body.data.status).to.eq('active');
            expect(response.body.data.currency).to.be.a('string');
        });
    });
});

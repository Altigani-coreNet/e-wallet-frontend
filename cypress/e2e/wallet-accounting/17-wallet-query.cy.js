/**
 * PRD: Wallet query by phone or wallet_id returns recipient basics
 */

describe('Wallet accounting — wallet query', () => {
    let sender;
    let recipient;

    before(() => {
        cy.setupWalletAccountingPair(Date.now()).then((pair) => {
            sender = pair.sender;
            recipient = pair.recipient;
        });
    });

    it('returns wallet_id, name, and email when querying by phone', () => {
        cy.apiWalletQuery({
            token: sender.token,
            identifier: recipient.phone,
        }).then((response) => {
            expect(response.status).to.eq(200);
            expect(response.body.data.wallet_id).to.eq(recipient.walletId);
            expect(response.body.data.name).to.be.a('string').and.not.be.empty;
            expect(response.body.data.email).to.eq(recipient.email);
            expect(response.body.data.status).to.eq('active');
        });
    });

    it('returns wallet_id, name, and email when querying by wallet_id', () => {
        cy.apiWalletQuery({
            token: sender.token,
            identifier: recipient.walletId,
        }).then((response) => {
            expect(response.status).to.eq(200);
            expect(response.body.data.wallet_id).to.eq(recipient.walletId);
            expect(response.body.data.name).to.be.a('string').and.not.be.empty;
            expect(response.body.data.status).to.eq('active');
        });
    });

    it('rejects querying your own phone number', () => {
        cy.apiWalletQuery({
            token: sender.token,
            identifier: sender.phone,
            failOnStatusCode: false,
        }).then((response) => {
            expect(response.status).to.eq(422);
            expect(response.body.message).to.eq(
                'You cannot use your own wallet or phone number as the recipient.'
            );
        });
    });

    it('rejects querying your own wallet_id', () => {
        cy.apiWalletQuery({
            token: sender.token,
            identifier: sender.walletId,
            failOnStatusCode: false,
        }).then((response) => {
            expect(response.status).to.eq(422);
            expect(response.body.message).to.eq(
                'You cannot use your own wallet or phone number as the recipient.'
            );
        });
    });
});

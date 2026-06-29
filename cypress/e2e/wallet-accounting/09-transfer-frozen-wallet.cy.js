/**
 * PRD Gherkin: Transfer to frozen wallet is rejected
 */

describe('Wallet accounting — transfer to frozen wallet', () => {
    let adminToken;
    let sender;
    let recipient;

    before(() => {
        cy.setupWalletAccountingPair(Date.now()).then((pair) => {
            sender = pair.sender;
            recipient = pair.recipient;
            adminToken = sender.adminToken;

            cy.apiAdminGetMasterWallet(adminToken).then((master) => {
                cy.apiAdminWalletCashIn({
                    adminToken,
                    walletUuid: master.id,
                    amount: 300,
                    description: 'E2E seed master for frozen test',
                    idempotencyKey: `seed-frozen-${Date.now()}`,
                });

                cy.apiAdminWalletCashIn({
                    adminToken,
                    walletUuid: sender.walletUuid,
                    amount: 100,
                    description: 'Fund sender',
                    idempotencyKey: `fund-frozen-${Date.now()}`,
                });
            });

            cy.apiAdminWalletSetStatus({
                adminToken,
                walletUuid: recipient.walletUuid,
                action: 'suspend',
            }).then((suspendResponse) => {
                expect(suspendResponse.body.data.wallet.status).to.eq('frozen');
            });
        });
    });

    it('rejects transfer to a frozen recipient wallet', () => {
        cy.captureAccountingSnapshot({ adminToken, label: 'before frozen transfer' }).then((before) => {
            cy.apiWalletResolveRecipient({
                token: sender.token,
                identifier: recipient.phone,
                failOnStatusCode: false,
            }).then((resolveResponse) => {
                expect(resolveResponse.status).to.eq(422);
            });

            cy.apiWalletTransfer({
                token: sender.token,
                recipientWalletId: recipient.walletId,
                amount: 10,
                description: 'Should fail — frozen recipient',
                failOnStatusCode: false,
            }).then((response) => {
                expect(response.status).to.eq(422);
            });

            cy.apiAdminWalletShow({ adminToken, walletUuid: sender.walletUuid }).then((senderShow) => {
                expect(senderShow.body.data.balance).to.eq(100);
            });

            cy.apiAdminWalletShow({ adminToken, walletUuid: recipient.walletUuid }).then((recipientShow) => {
                expect(recipientShow.body.data.balance).to.eq(0);
                expect(recipientShow.body.data.status).to.eq('frozen');
            });

            cy.assertAccountingUnchanged({
                before,
                adminToken,
                context: 'transfer to frozen wallet',
            });
        });
    });
});

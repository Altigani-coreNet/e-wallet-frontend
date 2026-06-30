/**
 * PRD Gherkin: Transfer rejected for insufficient balance
 * Rejection happens at transfer OTP step (balance check before code is sent).
 */

import { assertApiRejects } from '../../support/walletAccountingHelpers';

describe('Wallet accounting — transfer insufficient balance', () => {
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
                    amount: 200,
                    description: 'E2E seed master',
                    idempotencyKey: `seed-insuf-${Date.now()}`,
                });

                cy.apiAdminWalletCashIn({
                    adminToken,
                    walletUuid: sender.walletUuid,
                    amount: 40,
                    description: 'Fund sender with low balance',
                    idempotencyKey: `fund-low-${Date.now()}`,
                });
            });
        });
    });

    it('rejects transfer above balance and leaves balances unchanged', () => {
        cy.captureAccountingSnapshot({ adminToken, label: 'before insufficient transfer' }).then((before) => {
            cy.apiWalletResolveRecipient({
                token: sender.token,
                identifier: recipient.phone,
            }).then((resolveResponse) => {
                const recipientWalletId = resolveResponse.body.data.recipient_wallet_id;

                cy.apiWalletTransfer({
                    token: sender.token,
                    recipientWalletId,
                    amount: 50,
                    description: 'Should fail',
                    failOnStatusCode: false,
                }).then((response) => {
                    assertApiRejects(response, { messageIncludes: 'Insufficient wallet balance' });
                });

                cy.apiAdminWalletShow({ adminToken, walletUuid: sender.walletUuid }).then((senderShow) => {
                    expect(senderShow.body.data.balance).to.eq(40);
                });

                cy.apiAdminWalletShow({ adminToken, walletUuid: recipient.walletUuid }).then((recipientShow) => {
                    expect(recipientShow.body.data.balance).to.eq(0);
                });

                cy.assertAccountingUnchanged({
                    before,
                    adminToken,
                    context: 'transfer insufficient balance',
                });
            });
        });
    });
});

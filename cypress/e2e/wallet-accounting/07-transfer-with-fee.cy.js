/**
 * PRD Gherkin: Transfer with fee (money correctness)
 */

import { configuredTransferFee } from '../../support/walletAccountingHelpers';

describe('Wallet accounting — transfer with fee', () => {
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
                    amount: 500,
                    description: 'E2E seed master for fee transfer',
                    idempotencyKey: `seed-fee-${Date.now()}`,
                });

                cy.apiAdminWalletCashIn({
                    adminToken,
                    walletUuid: sender.walletUuid,
                    amount: 150,
                    description: 'Fund sender for fee transfer',
                    idempotencyKey: `fund-sender-fee-${Date.now()}`,
                });
            });
        });
    });

    it('queries recipient then transfers with fee and note', () => {
        const amount = 50;
        const fee = configuredTransferFee();
        const note = 'E2E fee transfer note';

        cy.captureAccountingSnapshot({ adminToken, label: 'before transfer with fee' }).then((before) => {
            cy.apiWalletQuery({
                token: sender.token,
                identifier: recipient.phone,
            }).then((queryResponse) => {
                const recipientWalletId = queryResponse.body.data.wallet_id;

                cy.apiWalletTransfer({
                    token: sender.token,
                    recipientWalletId,
                    amount,
                    description: 'E2E transfer with fee',
                    note,
                    idempotencyKey: `fee-transfer-${Date.now()}`,
                }).then((transferResponse) => {
                    expect(transferResponse.status).to.eq(200);
                    expect(transferResponse.body.data.fee).to.eq(fee);
                    expect(transferResponse.body.data.recipient_amount).to.eq(amount - fee);
                    expect(transferResponse.body.data.note).to.eq(note);
                    expect(transferResponse.body.data.sender_wallet.balance).to.eq(150 - amount);
                });

                cy.apiAdminWalletShow({ adminToken, walletUuid: sender.walletUuid }).then((senderShow) => {
                    expect(senderShow.body.data.balance).to.eq(100);
                });

                cy.apiAdminWalletShow({ adminToken, walletUuid: recipient.walletUuid }).then((recipientShow) => {
                    expect(recipientShow.body.data.balance).to.eq(48);
                });

                cy.apiWalletDashboard(recipient.token).then((dash) => {
                    expect(dash.body.data.wallet.balance).to.eq(48);
                    expect(dash.body.data.recent_transactions).to.be.an('array');
                    expect(dash.body.data.recent_transactions.length).to.be.lte(5);
                    expect(dash.body.data.recent_transactions[0].note).to.eq(note);
                });

                cy.assertAccountingReflectsOperation({
                    before,
                    adminToken,
                    operation: 'transfer',
                    amount,
                    fee,
                    context: 'transfer with fee',
                });
            });
        });
    });
});

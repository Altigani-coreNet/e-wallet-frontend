/**
 * PRD UC-C3: Query recipient then unified transfer (fee deducted per WALLET_TRANSFER_FEE)
 */

import { configuredTransferFee, transferRecipientNet } from '../../support/walletAccountingHelpers';

describe('Wallet accounting — query and transfer', () => {
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
                    description: 'E2E seed master for transfer',
                    idempotencyKey: `seed-transfer-${Date.now()}`,
                });

                cy.apiAdminWalletCashIn({
                    adminToken,
                    walletUuid: sender.walletUuid,
                    amount: 100,
                    description: 'Fund sender',
                    idempotencyKey: `fund-transfer-${Date.now()}`,
                });
            });
        });
    });

    it('queries recipient by phone then transfers by wallet_id with note', () => {
        const amount = 15;
        const fee = configuredTransferFee();
        const recipientNet = transferRecipientNet(amount);
        const note = 'E2E unified transfer note';

        cy.captureAccountingSnapshot({ adminToken, label: 'before query and transfer' }).then((before) => {
            cy.apiWalletDashboard(sender.token).then((dashBefore) => {
                const balanceBefore = dashBefore.body.data.wallet.balance;

                cy.apiWalletQuery({
                    token: sender.token,
                    identifier: recipient.phone,
                }).then((queryResponse) => {
                    expect(queryResponse.body.data.wallet_id).to.eq(recipient.walletId);
                    expect(queryResponse.body.data.name).to.be.a('string').and.not.be.empty;

                    cy.apiWalletTransfer({
                        token: sender.token,
                        recipientWalletId: queryResponse.body.data.wallet_id,
                        amount,
                        description: 'E2E unified transfer',
                        note,
                        idempotencyKey: `transfer-${Date.now()}`,
                    }).then((transferResponse) => {
                        expect(transferResponse.status).to.eq(200);
                        expect(transferResponse.body.data.amount).to.eq(amount);
                        expect(transferResponse.body.data.fee).to.eq(fee);
                        expect(transferResponse.body.data.recipient_amount).to.eq(recipientNet);
                        expect(transferResponse.body.data.note).to.eq(note);
                        expect(transferResponse.body.data.sender_wallet.balance).to.eq(balanceBefore - amount);
                    });

                    cy.apiAdminWalletShow({ adminToken, walletUuid: sender.walletUuid }).then((senderShow) => {
                        expect(senderShow.body.data.balance).to.eq(balanceBefore - amount);
                    });

                    cy.apiAdminWalletShow({ adminToken, walletUuid: recipient.walletUuid }).then((recipientShow) => {
                        expect(recipientShow.body.data.balance).to.eq(recipientNet);
                    });

                    cy.apiWalletDashboard(recipient.token).then((recipientDash) => {
                        expect(recipientDash.body.data.wallet.balance).to.eq(recipientNet);
                        expect(recipientDash.body.data.recent_transactions).to.be.an('array');
                        expect(recipientDash.body.data.recent_transactions.length).to.be.lte(5);
                        expect(recipientDash.body.data.recent_transactions[0].type).to.eq('transfer');
                    });

                    cy.assertAccountingReflectsOperation({
                        before,
                        adminToken,
                        operation: 'transfer',
                        amount,
                        context: 'query and transfer',
                    });
                });
            });
        });
    });
});

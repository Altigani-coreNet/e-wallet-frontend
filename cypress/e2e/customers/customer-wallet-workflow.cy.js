/**
 * Customer wallet transfer E2E (real backend — no API mocking)
 *
 * Transfer flow: POST /wallet/transfer/otp → POST /wallet/transfer with otp_token + OTP mock 111111.
 *
 * Run:
 *   npm run cy:run:e2e -- --spec cypress/e2e/customers/customer-wallet-workflow.cy.js
 */

import { assertApiAuthFailure, assertApiRejects, transferRecipientNet } from '../../support/walletAccountingHelpers';

describe('Customer wallet workflow (real backend)', () => {
    let sender;
    let recipient;
    let senderToken;
    let recipientToken;
    let recipientWalletId;
    let adminToken;
    const runId = Date.now();

    before(() => {
        cy.setupWalletAccountingPair(runId).then((pair) => {
            sender = pair.sender;
            recipient = pair.recipient;
            senderToken = pair.sender.token;
            recipientToken = pair.recipient.token;
            adminToken = pair.sender.adminToken;

            cy.apiAdminGetMasterWallet(adminToken).then((master) => {
                cy.apiAdminWalletCashIn({
                    adminToken,
                    walletUuid: master.id,
                    amount: 500,
                    description: 'E2E seed master for wallet workflow',
                    idempotencyKey: `seed-workflow-master-${runId}`,
                });

                cy.apiAdminWalletCashIn({
                    adminToken,
                    walletUuid: sender.walletUuid,
                    amount: 500,
                    description: 'Fund sender for wallet workflow',
                    idempotencyKey: `fund-sender-workflow-${runId}`,
                });
            });
        });
    });

    it('returns wallet dashboard with balance and last transaction fields', () => {
        cy.apiWalletDashboard(senderToken).then((response) => {
            expect(response.status).to.eq(200);
            expect(response.body.success).to.eq(true);
            expect(response.body.data.wallet).to.include.keys(
                'wallet_id',
                'balance',
                'available_balance',
                'currency_code',
                'status'
            );
            expect(response.body.data.wallet.balance).to.be.at.least(0);
        });
    });

    it('transfers money by wallet id and updates balances', () => {
        const amount = 25;

        cy.captureAccountingSnapshot({ adminToken, label: 'before transfer by wallet id' }).then((before) => {
            cy.apiWalletDashboard(senderToken).then((dashBefore) => {
                const senderBalanceBefore = dashBefore.body.data.wallet.balance;

                cy.apiWalletDashboard(recipientToken).then((recipientDashboard) => {
                    recipientWalletId = recipientDashboard.body.data.wallet.wallet_id;

                    cy.apiWalletTransferByWalletId({
                        token: senderToken,
                        recipientWalletId,
                        amount,
                        description: 'Cypress transfer by wallet id',
                    }).then((transferResponse) => {
                        expect(transferResponse.status).to.eq(200);
                        expect(transferResponse.body.success).to.eq(true);
                        expect(transferResponse.body.data.amount).to.eq(amount);
                        expect(transferResponse.body.data.sender_wallet.balance).to.eq(
                            senderBalanceBefore - amount
                        );
                        expect(transferResponse.body.data.recipient.wallet_id).to.eq(recipientWalletId);
                        expect(transferResponse.body.data.transaction.type).to.eq('transfer');
                        expect(transferResponse.body.data.transaction.direction).to.eq('debit');
                    });

                    cy.apiWalletDashboard(recipientToken).then((afterRecipient) => {
                        expect(afterRecipient.body.data.last_transaction.type).to.eq('transfer');
                        expect(afterRecipient.body.data.last_transaction.direction).to.eq('credit');
                        expect(afterRecipient.body.data.last_transaction.amount).to.eq(
                            transferRecipientNet(amount)
                        );
                    });

                    cy.assertAccountingReflectsOperation({
                        before,
                        adminToken,
                        operation: 'transfer',
                        amount,
                        context: 'transfer by wallet id',
                    });
                });
            });
        });
    });

    it('transfers money by phone number', () => {
        const amount = 15;

        cy.captureAccountingSnapshot({ adminToken, label: 'before transfer by phone' }).then((before) => {
            cy.apiWalletTransferByPhone({
                token: senderToken,
                recipientPhone: recipient.phone,
                amount,
                description: 'Cypress transfer by phone',
            }).then((response) => {
                expect(response.status).to.eq(200);
                expect(response.body.data.amount).to.eq(amount);
                expect(response.body.data.recipient.name).to.be.a('string');
            });

            cy.assertAccountingReflectsOperation({
                before,
                adminToken,
                operation: 'transfer',
                amount,
                context: 'transfer by phone',
            });
        });
    });

    it('rejects transfer when balance is insufficient', () => {
        cy.apiWalletDashboard(recipientToken).then((recipientDashboard) => {
            const walletId = recipientDashboard.body.data.wallet.wallet_id;

            cy.apiWalletTransferByWalletId({
                token: senderToken,
                recipientWalletId: walletId,
                amount: 999999999,
                description: 'Should fail',
                failOnStatusCode: false,
            }).then((response) => {
                assertApiRejects(response, { messageIncludes: 'Insufficient wallet balance' });
            });
        });
    });

    it('rejects self transfer', () => {
        cy.apiWalletDashboard(senderToken).then((dashboard) => {
            const ownWalletId = dashboard.body.data.wallet.wallet_id;

            cy.apiWalletTransferByWalletId({
                token: senderToken,
                recipientWalletId: ownWalletId,
                amount: 10,
                failOnStatusCode: false,
            }).then((response) => {
                assertApiRejects(response, {
                    messageIncludes: 'You cannot use your own wallet or phone number as the recipient.',
                });
            });
        });
    });

    it('rejects unauthenticated wallet requests', () => {
        cy.request({
            method: 'GET',
            url: `${Cypress.env('apiUrl')}/api/v1/customer/wallet/dashboard`,
            failOnStatusCode: false,
        }).then((response) => {
            assertApiAuthFailure(response);
        });
    });

    it('honours idempotency key and does not double-spend', () => {
        const idempotencyKey = `cypress-idem-${runId}`;
        const amount = 5;

        cy.captureAccountingSnapshot({ adminToken, label: 'before idempotent transfer' }).then((before) => {
            cy.apiWalletDashboard(recipientToken).then((recipientDashboard) => {
                recipientWalletId = recipientDashboard.body.data.wallet.wallet_id;

                cy.apiWalletDashboard(senderToken).then((dashBefore) => {
                    const balanceBefore = dashBefore.body.data.wallet.balance;

                    cy.apiWalletTransferByWalletId({
                        token: senderToken,
                        recipientWalletId,
                        amount,
                        idempotencyKey,
                        description: 'Idempotent transfer',
                    }).then((first) => {
                        cy.apiWalletTransferByWalletId({
                            token: senderToken,
                            recipientWalletId,
                            amount,
                            idempotencyKey,
                            description: 'Idempotent transfer',
                        }).then((second) => {
                            expect(first.body.data).to.deep.eq(second.body.data);

                            cy.apiWalletDashboard(senderToken).then((after) => {
                                expect(after.body.data.wallet.balance).to.eq(balanceBefore - amount);
                            });

                            cy.assertAccountingReflectsOperation({
                                before,
                                adminToken,
                                operation: 'transfer',
                                amount,
                                context: 'idempotent transfer',
                            });
                        });
                    });
                });
            });
        });
    });
});

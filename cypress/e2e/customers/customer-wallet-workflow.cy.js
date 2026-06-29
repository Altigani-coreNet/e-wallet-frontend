/**
 * Customer wallet transfer E2E (real backend — no API mocking)
 *
 * Prerequisites:
 * - Laravel backend running on port 8000 (see cypress.config.js apiUrl)
 * - Migrations applied (wallets, wallet_transactions, wallet_idempotency_keys)
 * - Chart of accounts seeded (WalletE2eSeeder runs this automatically via cy.task)
 *
 * Run:
 *   npm run cy:run:e2e -- --spec cypress/e2e/customers/customer-wallet-workflow.cy.js
 */

describe('Customer wallet workflow (real backend)', () => {
    const senderPhone = Cypress.env('walletE2eSenderPhone');
    const recipientPhone = Cypress.env('walletE2eRecipientPhone');
    const password = Cypress.env('walletE2ePassword');

    let senderToken;
    let recipientToken;
    let recipientWalletId;
    let adminToken;

    before(() => {
        cy.task('seedWalletE2e');
        cy.apiAdminLogin().then(({ token }) => {
            adminToken = token;
        });
    });

    beforeEach(() => {
        cy.apiCustomerLogin({ phone: senderPhone, password }).then((response) => {
            senderToken = response.body.data.token;
        });

        cy.apiCustomerLogin({ phone: recipientPhone, password }).then((response) => {
            recipientToken = response.body.data.token;
            recipientWalletId = null;
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
                        expect(afterRecipient.body.data.last_transaction.amount).to.eq(amount);
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
                recipientPhone,
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
                expect(response.status).to.eq(422);
                expect(response.body.success).to.eq(false);
                expect(response.body.message).to.eq('Insufficient wallet balance for this transfer.');
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
                expect(response.status).to.eq(422);
                expect(response.body.message).to.eq('You cannot transfer money to your own wallet.');
            });
        });
    });

    it('rejects unauthenticated wallet requests', () => {
        cy.request({
            method: 'GET',
            url: `${Cypress.env('apiUrl')}/api/v1/customer/wallet/dashboard`,
            failOnStatusCode: false,
        }).then((response) => {
            expect(response.status).to.eq(401);
        });
    });

    it('honours idempotency key and does not double-spend', () => {
        const idempotencyKey = `cypress-idem-${Date.now()}`;
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

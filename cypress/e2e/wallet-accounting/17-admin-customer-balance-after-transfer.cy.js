/**
 * Admin customer management — wallet balance reflects transfers
 *
 * Flow:
 * 1. Fund sender wallet via admin API
 * 2. Transfer between two customer wallets
 * 3. Assert admin customer API balance matches wallet balance
 * 4. Assert admin dashboard list + detail pages show the same balances
 *
 * Run:
 *   npm run cy:open:dev
 *   → wallet-accounting/17-admin-customer-balance-after-transfer.cy.js
 */

describe('Wallet accounting — admin customer balance after transfer', () => {
    let adminToken;
    let adminPayload;
    let sender;
    let recipient;

    const transferAmount = 15;
    const senderFundAmount = 100;

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
                    description: 'E2E seed master for admin balance check',
                    idempotencyKey: `seed-admin-balance-${Date.now()}`,
                });

                cy.apiAdminWalletCashIn({
                    adminToken,
                    walletUuid: sender.walletUuid,
                    amount: senderFundAmount,
                    description: 'Fund sender for admin balance check',
                    idempotencyKey: `fund-sender-admin-balance-${Date.now()}`,
                });
            });
        });
    });

    it('shows updated wallet balances in admin customer management after transfer', () => {
        const senderBalanceAfter = senderFundAmount - transferAmount;
        const recipientBalanceAfter = transferAmount;

        cy.captureAccountingSnapshot({ adminToken, label: 'before admin balance transfer' }).then((before) => {
            cy.apiWalletResolveRecipient({
                token: sender.token,
                identifier: recipient.phone,
            }).then((resolveResponse) => {
                cy.apiWalletTransfer({
                    token: sender.token,
                    recipientWalletId: resolveResponse.body.data.recipient_wallet_id,
                    amount: transferAmount,
                    description: 'E2E admin balance visibility transfer',
                    idempotencyKey: `admin-balance-transfer-${Date.now()}`,
                }).then((transferResponse) => {
                    expect(transferResponse.status).to.eq(200);
                    expect(transferResponse.body.data.sender_wallet.balance).to.eq(senderBalanceAfter);
                });
            });

            cy.assertAccountingReflectsOperation({
                before,
                adminToken,
                operation: 'transfer',
                amount: transferAmount,
                context: 'admin customer balance after transfer',
            });
        });

        cy.apiAdminLogin().then(({ token, payload }) => {
            adminToken = token;
            adminPayload = payload;

            cy.assertAdminCustomerBalanceMatchesWallet({
                adminToken,
                customerId: sender.customerId,
                walletUuid: sender.walletUuid,
                expectedBalance: senderBalanceAfter,
            });

            cy.assertAdminCustomerBalanceMatchesWallet({
                adminToken,
                customerId: recipient.customerId,
                walletUuid: recipient.walletUuid,
                expectedBalance: recipientBalanceAfter,
            });

            cy.assertAdminCustomerBalanceInList({
                phone: sender.phone,
                expectedBalance: senderBalanceAfter,
                adminPayload,
            });

            cy.assertAdminCustomerBalanceInList({
                phone: recipient.phone,
                expectedBalance: recipientBalanceAfter,
                adminPayload,
                skipVisit: true,
            });

            cy.assertAdminCustomerBalanceInDetail({
                customerId: sender.customerId,
                expectedBalance: senderBalanceAfter,
                adminPayload,
            });

            cy.assertAdminCustomerBalanceInDetail({
                customerId: recipient.customerId,
                expectedBalance: recipientBalanceAfter,
                adminPayload,
            });
        });
    });
});

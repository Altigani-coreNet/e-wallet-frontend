/**
 * Admin customer view — wallet transaction history (real backend)
 *
 * Flow:
 * 1. Create funded sender + recipient via wallet accounting helpers
 * 2. Seed multiple transfers on sender wallet (OTP + mock 111111 via cy.apiWalletTransfer)
 * 3. Visit admin customer detail — Overview shows latest 5 transactions
 * 4. Transactions tab shows paginated list + direction filter
 *
 * Run:
 *   npm run cy:run:e2e -- --spec cypress/e2e/customers/admin-customer-wallet-transactions.cy.js
 */

describe('Admin customer wallet transaction history (real backend)', () => {
    let sender;
    let recipient;
    const transferAmount = 5;
    const transferCount = 8;

    before(() => {
        cy.setupWalletAccountingPair(Date.now()).then((pair) => {
            sender = pair.sender;
            recipient = pair.recipient;

            cy.apiAdminGetMasterWallet(sender.adminToken).then((master) => {
                cy.apiAdminWalletCashIn({
                    adminToken: sender.adminToken,
                    walletUuid: master.id,
                    amount: 500,
                    description: 'E2E seed master for customer tx history',
                    idempotencyKey: `seed-customer-tx-master-${Date.now()}`,
                });

                cy.apiAdminWalletCashIn({
                    adminToken: sender.adminToken,
                    walletUuid: sender.walletUuid,
                    amount: transferAmount * transferCount + 50,
                    description: 'Fund sender for customer tx history',
                    idempotencyKey: `fund-sender-customer-tx-${Date.now()}`,
                });
            });
        });
    });

    beforeEach(() => {
        cy.intercept('GET', '**/v2/admin/customers/*/transactions*').as('customerTransactions');
        cy.intercept('GET', '**/v2/admin/customers/*').as('customerDetails');
    });

    it('seeds transfers and shows latest five on overview plus paginated transactions tab', () => {
        cy.apiWalletResolveRecipient({
            token: sender.token,
            identifier: recipient.phone,
        }).then((resolveResponse) => {
            const recipientWalletId = resolveResponse.body.data.recipient_wallet_id;

            Cypress._.times(transferCount, (index) => {
                cy.apiWalletTransfer({
                    token: sender.token,
                    recipientWalletId,
                    amount: transferAmount,
                    description: `E2E customer tx history ${index + 1}`,
                    idempotencyKey: `customer-tx-history-${Date.now()}-${index}`,
                });
            });
        });

        cy.apiAdminLogin().then(({ token, payload }) => {
            const paymentBaseUrl =
                Cypress.env('PAYMENT_BASE_URL') || Cypress.config('baseUrl') || 'http://localhost:5173';
            const admin = payload.admin || payload.user || {};
            const permissions = payload.permissions || payload.scopes || [];

            cy.visit(`${paymentBaseUrl}/en/admin/customers/${sender.customerId}`, {
                onBeforeLoad(win) {
                    const user = {
                        ...admin,
                        is_admin: true,
                        role: 'admin',
                        permissions,
                    };

                    win.localStorage.setItem('merchant_dashboard_token', token);
                    win.localStorage.setItem('dashboard_user', JSON.stringify(user));
                    win.localStorage.setItem(
                        'auth-storage',
                        JSON.stringify({
                            state: {
                                token,
                                user,
                                merchant: null,
                                roles: payload.roles || ['admin'],
                                permissions,
                                custom_region: false,
                                regions: [],
                                isAuthenticated: true,
                                testMode: false,
                            },
                            version: 0,
                        })
                    );
                    win.localStorage.setItem('i18nextLng', 'en');
                },
            });
        });

        cy.wait('@customerDetails', { timeout: 30000 });
        cy.wait('@customerTransactions', { timeout: 30000 });

        cy.get('[data-testid="customer-latest-transactions"]', { timeout: 20000 }).should('be.visible');
        cy.get('[data-testid="customer-latest-transactions"] tbody tr').should('have.length.at.least', 5);
        cy.get('[data-testid="customer-latest-transactions"] tbody tr').should('have.length.at.most', 5);

        cy.contains('button', 'View all transactions').click();
        cy.get('[data-testid="customer-transactions-tab-link"]').should('have.class', 'active');
        cy.get('[data-testid="customer-transactions-tab"]').should('be.visible');

        cy.wait('@customerTransactions', { timeout: 30000 });
        cy.get('[data-testid="customer-tx-row"]', { timeout: 20000 }).should('have.length.at.least', 8);

        cy.get('[data-testid="customer-tx-per-page"]').select('10');
        cy.wait('@customerTransactions', { timeout: 30000 });
        cy.get('[data-testid="customer-tx-row"]').should('have.length', 10);

        cy.get('[data-testid="customer-tx-next"]').should('not.be.disabled').click();
        cy.wait('@customerTransactions', { timeout: 30000 });
        cy.get('[data-testid="customer-tx-row"]').should('have.length.at.least', 1);

        cy.contains('button', 'Filter').click();
        cy.get('select[name="direction"]').select('debit');
        cy.wait('@customerTransactions', { timeout: 30000 });
        cy.get('[data-testid="customer-tx-row"]').each(($row) => {
            cy.wrap($row).contains('debit');
        });
    });
});

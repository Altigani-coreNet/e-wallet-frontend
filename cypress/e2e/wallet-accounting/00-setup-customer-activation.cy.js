/**
 * Integrated E2E: customer registers → admin activates in panel → wallet works
 *
 * Flow:
 * 1. Customer registers + completes profile (API)
 * 2. Admin opens dashboard, finds customer, clicks Activate
 * 3. Customer wallet dashboard returns balance
 * 4. Admin wallets list reflects the new wallet
 *
 * Run:
 *   npm run cy:open:dev
 *   → wallet-accounting/00-setup-customer-activation.cy.js
 */

describe('Wallet accounting — integrated onboarding and admin activation', () => {
    const runId = Date.now();
    const password = 'WalletAcct1!';
    const firstName = `Wallet E2E ${runId}`;
    const email = `wallet.e2e.${runId}@example.com`;
    let phone;

    before(() => {
        phone = `+2499${String(runId).slice(-7)}${Math.floor(Math.random() * 10)}`;
        // Aliases only — real admin API responses (no stubbing).
        cy.intercept('GET', '**/v2/admin/customers*', (req) => req.continue()).as('customersList');
        cy.intercept('POST', '**/v2/admin/customers/*/status', (req) => req.continue()).as(
            'customerStatusUpdate'
        );
    });

    it('registers customer, admin activates in panel, then wallet is accessible', () => {
        // Step 1 — customer self-registration + profile
        cy.apiOnboardCustomer({ phone, password }).then(({ customer, token }) => {
            expect(customer.phone).to.eq(phone);

            cy.apiCompleteCustomerProfileWithCityLookup({
                token,
                firstName,
                email,
                nationalId: `WA-${runId}`,
            }).then(() => {
                cy.apiCustomerProfile(token).then((profileResponse) => {
                    expect(profileResponse.body.data.customer.name).to.eq(firstName);
                });
            });
        });

        // Step 2 — admin activates in the dashboard UI
        cy.adminActivateCustomerInPanel({ phone });

        // Step 3 — customer wallet works after activation
        cy.apiCustomerLogin({ phone, password }).then((login) => {
            cy.apiWalletDashboard(login.body.data.token).then((dash) => {
                expect(dash.status).to.eq(200);
                expect(dash.body.data.wallet.balance).to.eq(0);
                expect(dash.body.data.wallet.status).to.eq('active');
            });
        });

        // Step 4 — admin sees wallet for this customer
        cy.apiAdminFindWallet({ search: phone }).then(({ wallet }) => {
            expect(wallet.status).to.eq('active');
            expect(wallet.balance).to.eq(0);
        });
    });
});

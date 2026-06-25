/**
 * Admin customer lifecycle E2E (real backend — no API mocking)
 *
 * Prerequisites:
 * - Laravel backend running: `php artisan serve` on port 8000
 * - Migrations applied (including customers soft deletes)
 * - OTP mock enabled: OTP_MOCK_CODE=111111
 * - Admin account matching cypress.config.js env (adminEmail / adminPassword)
 * - Payment dev server on http://localhost:5173
 *
 * Run:
 *   npm run cy:run:e2e -- --spec cypress/e2e/customers/admin-customer-lifecycle.cy.js
 */

describe('Admin customer lifecycle (real backend)', () => {
    const initialPassword = 'Lifecycle1!';
    const updatedPassword = 'UpdatedPass1!';
    let phone;
    let customerId;

    beforeEach(() => {
        phone = `+2499${Date.now().toString().slice(-8)}`;
        cy.on('window:confirm', () => true);
        cy.intercept('GET', '**/v2/admin/customers*').as('customersList');
        cy.intercept('DELETE', '**/v2/admin/customers/**').as('deleteCustomer');
    });

    it('onboards, lists in admin dashboard, changes password, soft-deletes, blocks re-login, allows re-register', () => {
        cy.apiOnboardCustomer({ phone, password: initialPassword }).then(({ customer, token }) => {
            expect(customer.phone).to.eq(phone);
            expect(token).to.be.a('string');
            customerId = customer.id;
        });

        cy.apiCustomerLogin({ phone, password: initialPassword }).its('status').should('eq', 200);

        cy.loginAdmin();
        cy.wait('@customersList', { timeout: 60000 });
        cy.get('input[placeholder="Search customers..."]', { timeout: 15000 }).should('be.visible');
        cy.contains(phone, { timeout: 15000 }).should('be.visible');

        cy.apiChangePassword({ phone, newPassword: updatedPassword }).its('status').should('eq', 200);
        cy.apiCustomerLogin({ phone, password: updatedPassword }).its('status').should('eq', 200);
        cy.apiCustomerLogin({ phone, password: initialPassword, failOnStatusCode: false }).its('status').should('eq', 401);

        cy.contains('tr', phone).within(() => {
            cy.contains('button', 'Actions').click();
        });
        cy.contains('a', 'Delete').click();
        cy.confirmSwal();
        cy.wait('@deleteCustomer', { timeout: 30000 }).then(({ response }) => {
            expect(response.statusCode).to.be.oneOf([200, 204]);
            expect(response.body?.success).to.eq(true);
        });
        cy.wait('@customersList', { timeout: 60000 });
        cy.contains(phone).should('not.exist');

        cy.apiCustomerLogin({ phone, password: updatedPassword, failOnStatusCode: false }).its('status').should('eq', 401);

        cy.apiOnboardCustomer({ phone, password: 'ReRegister1!' }).then(({ customer }) => {
            expect(customer.phone).to.eq(phone);
            expect(customer.id).to.not.eq(customerId);
        });
    });
});

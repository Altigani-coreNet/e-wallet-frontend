/**
 * Admin customer create + update E2E (real backend — aliases only, no response stubbing)
 *
 * Mirrors the admin merchant create flow: UI login, create, list verification,
 * view details, edit (multipart POST + _method=PUT), verify updated data.
 *
 * Prerequisites:
 * - Laravel backend: `php artisan serve` on port 8000 (routes at /api/v2/admin/customers)
 * - Payment dev server: http://localhost:5173
 * - Admin credentials in cypress.config.js env
 *
 * Run:
 *   npm run cy:run:e2e -- --spec cypress/e2e/customers/admin-customer-crud.cy.js
 */

const paymentBaseUrl = Cypress.env('PAYMENT_BASE_URL') || Cypress.config('baseUrl') || 'http://localhost:5173';

describe('Admin Customer Create Flow (Real API)', () => {
    const runId = Date.now();
    const adminEmail = Cypress.env('ADMIN_EMAIL') || Cypress.env('adminEmail') || 'admin@corenet-tech.com';
    const adminPassword = Cypress.env('ADMIN_PASSWORD') || Cypress.env('adminPassword') || '12345678';
    const apiUrl = Cypress.env('apiUrl') || 'http://localhost:8000';

    const customerInput = {
        name: `Admin E2E Customer ${runId}`,
        email: `admin.customer.${runId}@example.com`,
        phone: `+2499${`${runId}`.slice(-7)}`,
        address: 'Khartoum, Sudan',
    };

    const customerUpdate = {
        name: `Admin E2E Customer UPDATED ${runId}`,
        address: `Khartoum, Sudan - UPDATED ${runId}`,
    };

    let customerUuid;

    beforeEach(() => {
        // Aliases only (no stubbing): all calls continue to real backend.
        cy.intercept('POST', '**/v2/admin/auth/login').as('adminLogin');
        cy.intercept('GET', '**/v2/admin/customers*').as('customersList');
        cy.intercept('GET', '**/v2/admin/customers/*').as('customerDetails');
        cy.intercept('GET', '**/countries/select*').as('countriesSelect');
        cy.intercept('GET', '**/cities/select*').as('citiesSelect');
        cy.intercept('POST', '**/v2/admin/customers').as('createCustomer');
        cy.intercept('POST', '**/v2/admin/customers/*', (req) => {
            const pathname = new URL(req.url).pathname;
            const lastSegment = pathname.split('/').pop() || '';
            const isCustomerUuid = /^[0-9a-f-]{36}$/i.test(lastSegment);
            if (isCustomerUuid) {
                req.alias = 'updateCustomer';
            }
            req.continue();
        });
    });

    afterEach(function () {
        if (!customerUuid) {
            return;
        }

        const token = Cypress.env('adminToken');
        if (!token) {
            return;
        }

        cy.request({
            method: 'DELETE',
            url: `${apiUrl}/api/v2/admin/customers/${customerUuid}`,
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/json',
            },
            failOnStatusCode: false,
        });
    });

    it('logs in, creates customer, verifies index and view data, then updates', () => {
        cy.visit(`${paymentBaseUrl}/admin/login`);

        cy.get('input[name="email"]', { timeout: 30000 })
            .should('be.visible')
            .and('not.be.disabled')
            .clear()
            .type(adminEmail);
        cy.get('input[name="password"]', { timeout: 30000 })
            .should('be.visible')
            .and('not.be.disabled')
            .clear()
            .type(adminPassword);
        cy.contains('button', 'Sign In').click();

        cy.wait('@adminLogin', { timeout: 30000 }).then(({ response }) => {
            expect(response.statusCode).to.be.oneOf([200, 201]);
            const payload = response.body?.data || response.body;
            const token = payload?.token || payload?.access_token;
            if (token) {
                Cypress.env('adminToken', token);
            }
        });

        cy.visit(`${paymentBaseUrl}/admin/customers`);
        cy.wait('@customersList', { timeout: 60000 });

        cy.contains('a,button', 'Add Customer', { timeout: 30000 }).click({ force: true });
        cy.url({ timeout: 30000 }).should('include', '/admin/customers/create');
        cy.url().should('not.include', '/401');
        cy.url().should('not.include', '/admin/login');

        cy.wait('@countriesSelect', { timeout: 30000 });

        const formTimeout = { timeout: 30000 };
        cy.get('#kt_content_container form', formTimeout).should('be.visible').within(() => {
            cy.get('input[name="name"]', formTimeout).should('be.visible').type(customerInput.name);
            cy.get('input[name="email"]', formTimeout).type(customerInput.email);
            cy.get('input[name="phone"]', formTimeout).type(customerInput.phone);
            cy.get('input[name="address"]', formTimeout).type(customerInput.address);
        });

        cy.get('#customer-profile-image-upload', formTimeout).selectFile('public/card.png', { force: true });

        cy.contains('label', 'Country')
            .parent()
            .find('div.form-control')
            .first()
            .click({ force: true });
        cy.get('input[placeholder="Search countries..."]', { timeout: 30000 })
            .should('be.visible')
            .clear()
            .type('Sudan', { delay: 30 });
        cy.wait(3000);
        cy.wait('@countriesSelect', { timeout: 30000 });
        cy.get('input[placeholder="Search countries..."]')
            .closest('.position-absolute')
            .find('div.cursor-pointer')
            .first()
            .click({ force: true });
        cy.wait('@citiesSelect', { timeout: 30000 });
        cy.wait(3000);

        cy.contains('label', 'City')
            .parent()
            .find('div.form-control')
            .first()
            .click({ force: true });
        cy.wait('@citiesSelect', { timeout: 30000 });
        cy.get('input[placeholder="Search cities..."]', { timeout: 30000 }).should('be.visible');
        cy.get('input[placeholder="Search cities..."]')
            .closest('.position-absolute')
            .find('div.cursor-pointer')
            .first()
            .click({ force: true });

        cy.contains('button', 'Save Customer').click();
        cy.wait('@createCustomer', { timeout: 60000 }).then(({ response }) => {
            expect(response.statusCode).to.be.oneOf([200, 201]);
            customerUuid =
                response.body?.data?.uuid ||
                response.body?.data?.data?.uuid ||
                customerUuid;
        });

        cy.contains('Customer created successfully', { timeout: 30000 }).should('be.visible');
        cy.url({ timeout: 60000 }).should('match', /\/admin\/customers\/[0-9a-f-]+$/i);

        cy.url().then((url) => {
            if (!customerUuid) {
                customerUuid = url.split('/').pop();
            }
        });

        cy.visit(`${paymentBaseUrl}/admin/customers`);
        cy.wait('@customersList', { timeout: 60000 });

        cy.contains('a', customerInput.name, { timeout: 60000 }).should('be.visible').click();
        cy.wait('@customerDetails', { timeout: 60000 });

        cy.contains('h2', 'Customer Information', { timeout: 30000 }).should('be.visible');
        cy.contains(customerInput.name, { timeout: 30000 }).should('be.visible');
        cy.contains(customerInput.email).should('be.visible');
        cy.contains(customerInput.phone).should('be.visible');
        cy.contains(customerInput.address).should('be.visible');

        cy.contains('a', 'Edit Customer', { timeout: 30000 })
            .should('exist')
            .scrollIntoView()
            .click({ force: true });
        cy.url({ timeout: 30000 }).should('match', /\/admin\/customers\/[^/]+\/edit$/);

        cy.get('#kt_content_container form', { timeout: 30000 }).should('be.visible').within(() => {
            cy.get('input[name="name"]', { timeout: 30000 })
                .should('be.visible')
                .clear()
                .type(customerUpdate.name);
            cy.get('input[name="address"]', { timeout: 30000 })
                .should('be.visible')
                .clear()
                .type(customerUpdate.address);

            cy.contains('button', 'Save Customer', { timeout: 30000 }).should('be.enabled').click();
        });

        cy.wait('@updateCustomer', { timeout: 60000 }).then(({ response }) => {
            expect(response.statusCode).to.be.oneOf([200, 201]);
        });

        cy.contains('Customer updated successfully', { timeout: 30000 }).should('be.visible');
        cy.contains('The name field is required', { timeout: 1000 }).should('not.exist');
        cy.contains('The email field is required').should('not.exist');
        cy.contains('The phone field is required').should('not.exist');

        cy.url({ timeout: 60000 }).should('match', /\/admin\/customers\/[^/]+$/);
        cy.wait('@customerDetails', { timeout: 60000 });

        cy.contains('h2', 'Customer Information', { timeout: 30000 }).should('be.visible');
        cy.contains(customerUpdate.name, { timeout: 30000 }).should('be.visible');
        cy.contains(customerUpdate.address).should('be.visible');
        cy.contains(customerInput.email).should('be.visible');
        cy.contains(customerInput.phone).should('be.visible');
    });
});

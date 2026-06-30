/**
 * Customer registration lifecycle E2E (real backend — no API mocking)
 *
 * Flow:
 * 1. Register customer via public API (pending, empty name/email)
 * 2. API login + profile — confirm missing name/email
 * 3. Lookup country from GET /api/v1/countries, then cities from GET /api/v1/countries/{dialCode}/cities, then complete profile
 * 4. API login + profile — confirm completed data
 * 5. Admin dashboard — verify data visible, then update name/email
 * 6. API login + profile — confirm admin update reflected
 * 7. Admin delete customer
 * 8. API login fails (401) after soft delete
 *
 * Prerequisites:
 * - Backend deployed at apiUrl (see cypress.config.js)
 * - OTP mock enabled on server: OTP_MOCK_CODE=111111
 * - Admin account matching cypress.config.js env (adminEmail / adminPassword)
 * - Payment dev server with VITE_API_BASE pointing at the same backend as apiUrl
 *
 * Run:
 *   npm run cy:run:e2e -- --spec cypress/e2e/customers/customer-registration-lifecycle.cy.js
 */

import { assertAdminDeleteSuccess, assertApiAuthFailure } from '../../support/walletAccountingHelpers';

describe('Customer registration lifecycle (real backend)', () => {
    const password = 'Lifecycle1!';
    const runId = Date.now();

    let phone;
    let profileName;
    let profileEmail;
    let nationalId;
    let updatedName;
    let updatedEmail;

    beforeEach(() => {
        phone = `+2499${runId.toString().slice(-7)}${Math.floor(Math.random() * 10)}`;
        profileName = `Profile Customer ${runId}`;
        profileEmail = `profile.${runId}@example.com`;
        nationalId = `NID-LC-${runId}`;
        updatedName = `Lifecycle Customer ${runId}`;
        updatedEmail = `lifecycle.${runId}@example.com`;
        cy.on('window:confirm', () => true);

        cy.intercept('GET', '**/v2/admin/customers*').as('customersList');
        cy.intercept('GET', '**/countries/select*').as('countriesLookup');
        cy.intercept('GET', '**/cities/select*').as('citiesLookup');
        cy.intercept('GET', '**/v2/admin/customers/*').as('customerDetails');
        cy.intercept('POST', '**/v2/admin/customers/*', (req) => {
            const pathname = new URL(req.url).pathname;
            const lastSegment = pathname.split('/').pop() || '';
            const isCustomerUuid = /^[0-9a-f-]{36}$/i.test(lastSegment);
            if (isCustomerUuid) {
                req.alias = 'updateCustomer';
            }
            req.continue();
        });
        cy.intercept('DELETE', '**/v2/admin/customers/**').as('deleteCustomer');
    });

    it('registers, completes profile via API, admin updates, delete blocks login', () => {
        cy.apiOnboardCustomer({ phone, password }).then(({ customer, token }) => {
            expect(customer.phone).to.eq(phone);
            expect(token).to.be.a('string');
            expect(customer.name || '').to.eq('');
            expect(customer.email || '').to.eq('');
        });

        cy.apiCustomerLogin({ phone, password }).then((loginResponse) => {
            expect(loginResponse.status).to.eq(200);
            const authToken = loginResponse.body.data.token;

            cy.apiCustomerProfile(authToken).then((profileResponse) => {
                expect(profileResponse.status).to.eq(200);
                const profile = profileResponse.body.data.customer;
                expect(profile.phone).to.eq(phone);
                expect(profile.name || '').to.eq('');
                expect(profile.email || '').to.eq('');
            });
        });

        cy.apiCustomerLogin({ phone, password }).then((loginResponse) => {
            const authToken = loginResponse.body.data.token;

            // 1) Country for +249 phone → 2) First city in that country → 3) Complete profile
            cy.apiLookupCountry({ search: 'Sudan' }).then((country) => {
                cy.apiLookupCity({ dialCode: country.code, countryId: country.id }).then((city) => {
                    cy.apiCompleteCustomerProfile({
                        token: authToken,
                        firstName: profileName,
                        email: profileEmail,
                        nationalId,
                        cityId: city.id,
                        countryCode: country.code,
                    }).then((completeResponse) => {
                        expect(completeResponse.status).to.be.oneOf([200, 201]);
                        expect(completeResponse.body.data.profile_completed).to.eq(true);
                        expect(completeResponse.body.data.customer.name).to.eq(profileName);
                        expect(completeResponse.body.data.customer.email).to.eq(profileEmail);
                        expect(completeResponse.body.data.customer.nationalId).to.eq(nationalId);
                        expect(completeResponse.body.data.customer.cityId).to.eq(city.id);
                        expect(completeResponse.body.data.customer.countryId).to.eq(country.id);
                    });
                });
            });
        });

        cy.apiCustomerLogin({ phone, password }).then((loginResponse) => {
            const authToken = loginResponse.body.data.token;

            cy.apiCustomerProfile(authToken).then((profileResponse) => {
                const profile = profileResponse.body.data.customer;
                expect(profile.name).to.eq(profileName);
                expect(profile.email).to.eq(profileEmail);
                expect(profile.nationalId).to.eq(nationalId);
                expect(profile.profileCompleted).to.eq(true);
            });
        });

        cy.loginAdmin();
        cy.wait('@customersList', { timeout: 60000 });
        cy.get('input[placeholder="Search customers..."]', { timeout: 15000 }).should('be.visible');
        cy.contains(phone, { timeout: 15000 }).should('be.visible');
        cy.contains(profileName, { timeout: 15000 }).should('be.visible');
        cy.contains(profileEmail).should('be.visible');

        cy.contains('tr', phone).within(() => {
            cy.contains('button', 'Actions').click();
        });
        cy.contains('a', 'Edit').click();
        cy.url({ timeout: 30000 }).should('match', /\/admin\/customers\/[^/]+\/edit$/);

        cy.get('#kt_content_container form', { timeout: 30000 }).should('be.visible').within(() => {
            cy.get('input[name="name"]')
                .should('have.value', profileName)
                .setReactInputValue(updatedName)
                .should('have.value', updatedName);
            cy.get('input[name="email"]')
                .should('have.value', profileEmail)
                .setReactInputValue(updatedEmail)
                .should('have.value', updatedEmail);
            cy.get('input[name="phone"]').should('have.value', phone);
            cy.contains('button', 'Save Customer').click();
        });

        cy.wait('@updateCustomer', { timeout: 60000 }).then(({ response }) => {
            expect(response.statusCode).to.be.oneOf([200, 201]);
        });
        cy.contains('Customer updated successfully', { timeout: 30000 }).should('be.visible');

        cy.apiCustomerLogin({ phone, password }).then((loginResponse) => {
            const authToken = loginResponse.body.data.token;

            cy.apiCustomerProfile(authToken).then((profileResponse) => {
                const profile = profileResponse.body.data.customer;
                expect(profile.name).to.eq(updatedName);
                expect(profile.email).to.eq(updatedEmail);
                expect(profile.phone).to.eq(phone);
            });
        });

        cy.visit('/en/admin/customers');
        cy.wait('@customersList', { timeout: 60000 });
        cy.contains('tr', phone).within(() => {
            cy.contains('button', 'Actions').click();
        });
        cy.contains('a', 'Delete').click();
        cy.confirmSwal();
        cy.wait('@deleteCustomer', { timeout: 30000 }).then(({ response }) => {
            assertAdminDeleteSuccess(response);
        });
        cy.wait('@customersList', { timeout: 60000 });
        cy.contains(phone).should('not.exist');

        cy.apiCustomerLogin({ phone, password, failOnStatusCode: false }).then((response) => {
            assertApiAuthFailure(response);
        });
    });
});

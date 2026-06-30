/**
 * Customer self-delete account API E2E (real backend — no dashboard UI)
 *
 * Flow:
 * 1. Register + login
 * 2. DELETE /api/v1/customer/account with password — soft delete + identifier corruption
 * 3. Login fails after delete
 * 4. Re-register with same phone succeeds
 * 5. Wrong password / missing password / missing auth are rejected
 *
 * Prerequisites:
 * - Backend at apiUrl with OTP_MOCK_CODE=111111
 *
 * Run:
 *   npm run cy:run:e2e -- --spec cypress/e2e/customers/customer-delete-account.cy.js
 */

import {
    assertApiAuthFailure,
    assertCustomerDeleteAccountRejected,
    assertCustomerDeleteAccountSuccess,
} from '../../support/walletAccountingHelpers';

describe('Customer delete account API (real backend)', () => {
    const password = 'DeleteAcct1!';
    const newPassword = 'ReRegister1!';

    let phone;

    beforeEach(() => {
        phone = `+2499${Date.now().toString().slice(-7)}${Math.floor(Math.random() * 10)}`;
    });

    it('soft-deletes account, blocks login, and allows re-registration with same phone', () => {
        cy.apiOnboardCustomer({ phone, password }).then(({ token }) => {
            expect(token).to.be.a('string').and.not.be.empty;

            cy.apiCustomerDeleteAccount({ token, password }).then((deleteResponse) => {
                assertCustomerDeleteAccountSuccess(deleteResponse);
            });
        });

        cy.apiCustomerLogin({ phone, password, failOnStatusCode: false }).then((loginResponse) => {
            assertApiAuthFailure(loginResponse);
        });

        cy.apiSendAndVerifyOtp(phone).then((otpToken) => {
            cy.request({
                method: 'POST',
                url: `${Cypress.env('apiUrl')}/api/v1/customer/auth/register`,
                headers: { Accept: 'application/json' },
                body: {
                    phone,
                    password: newPassword,
                    password_confirmation: newPassword,
                    otp_token: otpToken,
                },
                failOnStatusCode: true,
            }).then((registerResponse) => {
                expect(registerResponse.status).to.be.oneOf([200, 201]);
                expect(registerResponse.body.success).to.eq(true);
                expect(registerResponse.body.data.customer.phone).to.eq(phone);
                expect(registerResponse.body.data.customer.status).to.eq('pending');
            });
        });

        cy.apiCustomerLogin({ phone, password: newPassword }).then((loginResponse) => {
            expect(loginResponse.body.success).to.eq(true);
            expect(loginResponse.body.data.customer.phone).to.eq(phone);
            expect(loginResponse.body.data.customer.status).to.eq('pending');
            expect(loginResponse.body.data.customer).to.not.have.property('merchantId');
            expect(loginResponse.body.data.customer).to.not.have.property('merchantCountryId');
        });
    });

    it('rejects wrong password, missing password, and unauthenticated delete', () => {
        cy.apiOnboardCustomer({ phone, password }).then(({ token }) => {
            cy.apiCustomerDeleteAccount({
                token,
                password: 'WrongPass1!',
                failOnStatusCode: false,
            }).then((wrongPassword) => {
                assertCustomerDeleteAccountRejected(wrongPassword, {
                    messageIncludes: 'Password is incorrect',
                });

                return cy.apiCustomerProfile(token);
            }).then((profileResponse) => {
                expect(profileResponse.body.success).to.eq(true);
                expect(profileResponse.body.data.customer.phone).to.eq(phone);

                return cy.apiCustomerDeleteAccount({
                    token,
                    failOnStatusCode: false,
                });
            }).then((missingPassword) => {
                assertCustomerDeleteAccountRejected(missingPassword);
            });
        });

        cy.request({
            method: 'DELETE',
            url: `${Cypress.env('apiUrl')}/api/v1/customer/account`,
            headers: { Accept: 'application/json' },
            body: { password },
            failOnStatusCode: false,
        }).then((unauthResponse) => {
            assertApiAuthFailure(unauthResponse, {
                label: 'unauthenticated delete',
            });
        });
    });
});

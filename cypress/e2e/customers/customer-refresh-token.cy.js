/**
 * Customer refresh token API E2E (real backend — no dashboard UI)
 *
 * Run:
 *   npm run cy:run:e2e -- --spec cypress/e2e/customers/customer-refresh-token.cy.js
 */

describe('Customer refresh token API (real backend)', () => {
    const password = 'RefreshApi1!';
    const runId = Date.now();
    let phone;

    beforeEach(() => {
        phone = `+2499${runId.toString().slice(-7)}${Math.floor(Math.random() * 10)}`;
    });

    it('returns refresh_token on register/login and refreshes access token', () => {
        cy.apiOnboardCustomer({ phone, password })
            .then(({ customer, response: registerResponse }) => {
                expect(registerResponse.body.success).to.eq(true);
                expect(registerResponse.body.data.token).to.be.a('string').and.not.be.empty;
                expect(registerResponse.body.data.refresh_token).to.be.a('string').and.not.be.empty;
                expect(registerResponse.body.data.expires_in).to.be.a('number');
                expect(registerResponse.body.data.refresh_token_expires_in).to.be.a('number');

                return cy.apiAdminLogin().then(({ token: adminToken }) =>
                    cy.apiAdminActivateCustomer({ adminToken, customerId: customer.id })
                );
            })
            .then(() => cy.apiCustomerLogin({ phone, password }))
            .then((loginResponse) => {
                expect(loginResponse.body.success).to.eq(true);

                const { token, refresh_token: refreshToken } = loginResponse.body.data;
                expect(token).to.be.a('string').and.not.be.empty;
                expect(refreshToken).to.be.a('string').and.not.be.empty;

                return cy.apiCustomerRefreshToken(refreshToken).then((refreshResponse) => {
                    expect(refreshResponse.body.success).to.eq(true);

                    const newToken = refreshResponse.body.data.token;
                    const newRefreshToken = refreshResponse.body.data.refresh_token;

                    expect(newToken).to.be.a('string').and.not.be.empty;
                    expect(newRefreshToken).to.be.a('string').and.not.be.empty;
                    expect(newRefreshToken).to.not.eq(refreshToken);

                    return cy.apiCustomerProfile(newToken).then((profileResponse) => {
                        expect(profileResponse.body.success).to.eq(true);
                        expect(profileResponse.body.data.customer.phone).to.eq(phone);
                    }).then(() =>
                        cy.apiCustomerRefreshToken(token, { failOnStatusCode: false }).then((badRefresh) => {
                            expect(badRefresh.body.success).to.eq(false);
                        })
                    );
                });
            });
    });
});

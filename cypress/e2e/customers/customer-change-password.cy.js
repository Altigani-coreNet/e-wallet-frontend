/**
 * Customer change password API E2E (real backend — no dashboard UI)
 *
 * Run:
 *   npm run cy:run:e2e -- --spec cypress/e2e/customers/customer-change-password.cy.js
 */

describe('Customer change password API (real backend)', () => {
    const initialPassword = 'ChangePw1!';
    const newPassword = 'NewChange1!';
    const runId = Date.now();
    let phone;

    beforeEach(() => {
        phone = `+2499${runId.toString().slice(-7)}${Math.floor(Math.random() * 10)}`;
    });

    it('changes password when authenticated and rejects wrong current password', () => {
        cy.apiOnboardCustomer({ phone, password: initialPassword }).then(() => {
            cy.apiCustomerLogin({ phone, password: initialPassword }).then((loginResponse) => {
                expect(loginResponse.body.success).to.eq(true);
                const token = loginResponse.body.data.token;

                cy.apiCustomerChangePassword({
                    token,
                    currentPassword: 'WrongPass1!',
                    newPassword: 'Another1!',
                    failOnStatusCode: false,
                })
                    .then((wrongCurrent) => {
                        expect(wrongCurrent.body.success).to.eq(false);
                        expect(wrongCurrent.body.message).to.match(/current password/i);

                        return cy.apiCustomerChangePassword({
                            token,
                            currentPassword: initialPassword,
                            newPassword,
                        });
                    })
                    .then((changeResponse) => {
                        expect(changeResponse.body.success).to.eq(true);
                        expect(changeResponse.body.data.token).to.be.a('string').and.not.be.empty;
                        expect(changeResponse.body.data.refresh_token).to.be.a('string').and.not.be.empty;

                        return cy.apiCustomerLogin({
                            phone,
                            password: initialPassword,
                            failOnStatusCode: false,
                        });
                    })
                    .then((oldLogin) => {
                        expect(oldLogin.body.success).to.eq(false);

                        return cy.apiCustomerLogin({ phone, password: newPassword });
                    })
                    .then((newLogin) => {
                        expect(newLogin.body.success).to.eq(true);
                        expect(newLogin.body.data.token).to.be.a('string').and.not.be.empty;
                    });
            });
        });
    });
});

/**
 * Customer WebSocket listen test — YOU send from admin dashboard manually.
 *
 * 1. Customer logs in (or use CYPRESS_customerToken).
 * 2. Subscribes to private-customer-notifications.{customerId}.
 * 3. Waits for notification.customer.
 *
 * While waiting: Admin → Notifications → target CUSTOMER → pick this customer.
 */
describe('Customer WebSocket broadcast', () => {
    const apiUrl = Cypress.env('apiUrl');
    const phone = Cypress.env('walletE2eSenderPhone');
    const password = Cypress.env('walletE2ePassword');
    const providedToken = Cypress.env('customerToken');
    const listenTimeoutMs = Number(Cypress.env('wsListenTimeoutMs') || 120000);

    const buildWsUrl = () => {
        const host = Cypress.env('reverbHost');
        const port = Cypress.env('reverbPort');
        const scheme = Cypress.env('reverbScheme') || 'ws';
        const key = Cypress.env('reverbAppKey');
        return `${scheme}://${host}:${port}/app/${key}?protocol=7&client=js&version=8.4.0`;
    };

    const resolveCustomerToken = () => {
        if (providedToken) {
            return cy.wrap(providedToken, { log: false });
        }
        return cy.apiCustomerLogin({ phone, password }).then((loginResponse) => {
            expect(loginResponse.status, 'customer login status').to.eq(200);
            return loginResponse.body.data.token;
        });
    };

    const customerChannel = (customerId) => `customer-notifications.${customerId}`;

    it('customer profile + customer channel subscription (auth check)', () => {
        resolveCustomerToken().then((customerToken) => {
            cy.apiCustomerProfile(customerToken).then((profileResponse) => {
                expect(profileResponse.status).to.eq(200);
                const customerId = profileResponse.body.data.customer.id;

                cy.task(
                    'wsCustomerListen',
                    {
                        wsUrl: buildWsUrl(),
                        apiUrl,
                        customerToken,
                        channel: customerChannel(customerId),
                        subscribeOnly: true,
                    },
                    { timeout: 30000 },
                ).then((result) => {
                    cy.log(`subscribe result: ${JSON.stringify(result)}`);
                    expect(result.subscribed, result.reason || 'subscribe failed').to.eq(true);
                });
            });
        });
    });

    it('receives customer notification sent manually from admin dashboard', () => {
        resolveCustomerToken().then((customerToken) => {
            cy.apiCustomerProfile(customerToken).then((profileResponse) => {
                const customerId = profileResponse.body.data.customer.id;

                cy.log(
                    `>>> Admin → Notifications → target CUSTOMER → customer id ${customerId} — send NOW <<<`,
                );

                cy.task(
                    'wsCustomerListen',
                    {
                        wsUrl: buildWsUrl(),
                        apiUrl,
                        customerToken,
                        channel: customerChannel(customerId),
                        eventName: 'notification.customer',
                        subscribeOnly: false,
                        timeoutMs: listenTimeoutMs,
                    },
                    { timeout: listenTimeoutMs + 15000 },
                ).then((result) => {
                    cy.log(`listen result: ${JSON.stringify(result)}`);

                    expect(result.subscribed, `subscribed (${result.reason})`).to.eq(true);
                    expect(result.received, `event received (${result.reason})`).to.eq(true);
                    expect(result.payload, 'payload').to.exist;
                });
            });
        });
    });
});

const DEFAULT_PERMISSIONS = [
    'view_customers',
    'create_customers',
    'customers',
    'customers.delete',
    'pos.customers.view_customers',
    'pos.customers.create_customers',
    'pos.customers.delete_customers',
];

const DEFAULT_USER = {
    id: 1,
    name: 'Test Merchant',
    email: 'merchant@test.com',
    permissions: DEFAULT_PERMISSIONS,
    roles: ['merchant'],
    onboarding_completed: true,
    merchant_id: 1,
};

const DEFAULT_MERCHANT = {
    id: 1,
    name: 'Test Store',
    currency: 'USD',
    status: 'approved',
    plan: { plan_scopes: ['customers', 'users', 'branches', 'terminals'] },
};

function buildAuthStorage(options = {}) {
    const permissions = options.permissions || DEFAULT_PERMISSIONS;
    const user = { ...DEFAULT_USER, permissions, ...(options.user || {}) };
    const merchant = { ...DEFAULT_MERCHANT, ...(options.merchant || {}) };
    const token = options.token || 'cypress-test-token';

    return {
        token,
        user,
        merchant,
        locale: options.locale || 'en',
        authStorage: {
            state: {
                token,
                user,
                merchant,
                roles: user.roles || ['merchant'],
                permissions,
                custom_region: false,
                regions: [],
                isAuthenticated: true,
                testMode: false,
            },
            version: 0,
        },
    };
}

function applyAuthToWindow(win, auth) {
    win.localStorage.setItem('merchant_dashboard_token', auth.token);
    win.localStorage.setItem('dashboard_user', JSON.stringify(auth.user));
    win.localStorage.setItem('admin_dashboard_merchant', JSON.stringify(auth.merchant));
    win.localStorage.setItem('auth-storage', JSON.stringify(auth.authStorage));
    win.localStorage.setItem('i18nextLng', auth.locale);
}

/**
 * Register auth seeding for the next cy.visit() call.
 */
Cypress.Commands.add('seedAuth', (options = {}) => {
    const auth = buildAuthStorage(options);

    Cypress.on('window:before:load', (win) => {
        applyAuthToWindow(win, auth);
    });
});

/**
 * Visit a URL with auth localStorage pre-seeded.
 */
Cypress.Commands.add('visitWithAuth', (url, options = {}) => {
    const auth = buildAuthStorage(options);

    cy.visit(url, {
        onBeforeLoad(win) {
            applyAuthToWindow(win, auth);
        },
    });
});

/**
 * Stub profile + customer API endpoints used across customer module tests.
 */
Cypress.Commands.add('stubCustomerModuleApis', (options = {}) => {
    cy.intercept('GET', '**/api/profile/me', {
        fixture: 'profile.json',
    }).as('getProfile');

    cy.intercept('GET', '**/api/cashier/v1/customer/groups*', {
        fixture: 'customerGroups.json',
    }).as('getCustomerGroups');

    cy.intercept('GET', '**/api/cashier/v1/customers/export*', {
        statusCode: 200,
        headers: { 'content-type': 'text/csv' },
        body: 'id,name,email\n1,John Doe,john@example.com\n',
    }).as('exportCustomers');

    cy.intercept('GET', '**/api/cashier/v1/customers/export-template*', {
        statusCode: 200,
        headers: { 'content-type': 'text/csv' },
        body: 'name,email,phone\n',
    }).as('exportTemplate');

    if (options.customersFixture) {
        cy.intercept('GET', '**/api/cashier/v1/customers*', {
            fixture: options.customersFixture,
        }).as('getCustomers');
    } else {
        cy.intercept('GET', '**/api/cashier/v1/customers*', {
            fixture: 'customers.json',
        }).as('getCustomers');
    }
});

Cypress.Commands.add('visitCustomersIndex', (locale = 'en', module = 'merchant') => {
    cy.stubCustomerModuleApis();
    cy.visitWithAuth(`/${locale}/${module}/customers`, { locale });
    cy.contains('Customer Management', { timeout: 15000 }).should('be.visible');
    cy.wait('@getCustomers');
});

Cypress.Commands.add('confirmSwal', () => {
    cy.get('.swal2-popup').should('be.visible');
    cy.get('.swal2-confirm').click();
});

Cypress.Commands.add('cancelSwal', () => {
    cy.get('.swal2-popup').should('be.visible');
    cy.get('.swal2-cancel').click();
});

const DEFAULT_ADMIN_PERMISSIONS = [
    'sales.customers.view_customers',
    'sales.customers.create_customers',
    'sales.customers.edit_customers',
    'sales.customers.delete_customers',
    'sales.customers.import_customers',
    'sales.customers.export_customers',
];

function getApiUrl() {
    return Cypress.env('apiUrl') || 'http://localhost:8000';
}

function applyAdminAuthToWindow(win, loginPayload) {
    const token = loginPayload.token || loginPayload.access_token;
    const admin = loginPayload.admin || loginPayload.user || {};
    const permissions = loginPayload.permissions || loginPayload.scopes || DEFAULT_ADMIN_PERMISSIONS;
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
                roles: loginPayload.roles || ['admin'],
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
}

/**
 * POST /api/v1/customer/otp/sms then verify with mock code 111111.
 * @returns Cypress chainable resolving to otp_token string.
 */
Cypress.Commands.add('apiSendAndVerifyOtp', (phone) => {
    const apiUrl = getApiUrl();

    return cy
        .request({
            method: 'POST',
            url: `${apiUrl}/api/v1/customer/otp/sms`,
            body: { phone },
            failOnStatusCode: true,
        })
        .then((smsResponse) => {
            const rawToken = smsResponse.body.data.token;

            return cy
                .request({
                    method: 'POST',
                    url: `${apiUrl}/api/v1/customer/otp/verify`,
                    body: { token: rawToken, code: 111111 },
                    failOnStatusCode: true,
                })
                .then((verifyResponse) => verifyResponse.body.data.otp_token);
        });
});

/**
 * Verify OTP and register a customer via the real backend API.
 */
Cypress.Commands.add('apiOnboardCustomer', ({ phone, password }) => {
    const apiUrl = getApiUrl();

    return cy.apiSendAndVerifyOtp(phone).then((otpToken) => {
        return cy
            .request({
                method: 'POST',
                url: `${apiUrl}/api/v1/customer/auth/register`,
                body: {
                    phone,
                    password,
                    password_confirmation: password,
                    otp_token: otpToken,
                },
                failOnStatusCode: true,
            })
            .then((registerResponse) => ({
                customer: registerResponse.body.data.customer,
                token: registerResponse.body.data.token,
                response: registerResponse,
            }));
    });
});

/**
 * Customer login against the real backend API.
 */
Cypress.Commands.add('apiCustomerLogin', ({ phone, password, failOnStatusCode = true }) => {
    const apiUrl = getApiUrl();

    return cy.request({
        method: 'POST',
        url: `${apiUrl}/api/v1/customer/auth/login`,
        body: { phone, password },
        failOnStatusCode,
    });
});

/**
 * Change customer password via forgot + reset OTP flow (mock code 111111).
 */
Cypress.Commands.add('apiChangePassword', ({ phone, newPassword }) => {
    const apiUrl = getApiUrl();

    return cy
        .request({
            method: 'POST',
            url: `${apiUrl}/api/v1/customer/password/forgot`,
            body: { phone },
            failOnStatusCode: true,
        })
        .then((forgotResponse) => {
            const rawToken = forgotResponse.body.data.token;

            return cy
                .request({
                    method: 'POST',
                    url: `${apiUrl}/api/v1/customer/otp/verify`,
                    body: { token: rawToken, code: 111111 },
                    failOnStatusCode: true,
                })
                .then((verifyResponse) => {
                    const otpToken = verifyResponse.body.data.otp_token;

                    return cy.request({
                        method: 'POST',
                        url: `${apiUrl}/api/v1/customer/password/reset`,
                        body: {
                            phone,
                            password: newPassword,
                            password_confirmation: newPassword,
                            otp_token: otpToken,
                        },
                        failOnStatusCode: true,
                    });
                });
        });
});

/**
 * Login as admin via real backend and seed Payment admin auth storage.
 */
Cypress.Commands.add('loginAdmin', (overrides = {}) => {
    const apiUrl = getApiUrl();
    const email = overrides.email || Cypress.env('adminEmail');
    const password = overrides.password || Cypress.env('adminPassword');

    if (!email || !password) {
        throw new Error(
            'Admin credentials missing. Set Cypress.env adminEmail and adminPassword in cypress.config.js.'
        );
    }

    return cy
        .request({
            method: 'POST',
            url: `${apiUrl}/api/v2/admin/auth/login`,
            body: { email, password },
            failOnStatusCode: true,
        })
        .then((loginResponse) => {
            const payload = loginResponse.body.data || loginResponse.body;
            const token = payload.token || payload.access_token;

            Cypress.env('adminToken', token);
            cy.wrap(payload).as('adminLoginPayload');

            return payload;
        })
        .then((payload) => {
            cy.visit('/en/admin/customers', {
                onBeforeLoad(win) {
                    applyAdminAuthToWindow(win, payload);
                },
            });
        });
});

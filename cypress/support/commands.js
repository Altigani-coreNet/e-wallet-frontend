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
    cy.get('.swal2-popup', { timeout: 10000 }).should('be.visible');
    cy.get('.swal2-confirm').should('be.visible').click();
    cy.get('.swal2-popup').should('not.exist');
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
 * GET /api/v1/customer/profile for the authenticated customer.
 */
Cypress.Commands.add('apiCustomerProfile', (token) => {
    const apiUrl = getApiUrl();

    return cy.request({
        method: 'GET',
        url: `${apiUrl}/api/v1/customer/profile`,
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
        },
        failOnStatusCode: true,
    });
});

function unwrapApiList(response) {
    const body = response.body;
    if (Array.isArray(body)) {
        return body;
    }
    if (Array.isArray(body?.data)) {
        return body.data;
    }

    return [];
}

/**
 * Lookup a country from GET /api/countries/select (search defaults to Sudan for +249 phones).
 */
Cypress.Commands.add('apiLookupCountry', (options = {}) => {
    const apiUrl = getApiUrl();
    const search = options.search || 'Sudan';

    return cy
        .request({
            method: 'GET',
            url: `${apiUrl}/api/countries/select`,
            qs: { lang: 'en', search },
            failOnStatusCode: true,
        })
        .then((countriesResponse) => {
            const countries = unwrapApiList(countriesResponse);
            expect(countries.length, `countries matching "${search}" from /api/countries/select`).to.be.greaterThan(0);

            const country = countries[0];
            expect(country.id, 'country id').to.exist;
            expect(country.code, 'country code').to.exist;

            return country;
        });
});

/**
 * Lookup the first city from GET /api/cities/select (real cities API).
 * Pass countryId so the city belongs to the same country used in profile complete.
 */
Cypress.Commands.add('apiLookupCity', (options = {}) => {
    const apiUrl = getApiUrl();
    const qs = { lang: 'en' };

    expect(options.countryId, 'countryId is required for city lookup').to.exist;
    qs.country_id = options.countryId;

    return cy
        .request({
            method: 'GET',
            url: `${apiUrl}/api/cities/select`,
            qs,
            failOnStatusCode: true,
        })
        .then((citiesResponse) => {
            const cities = unwrapApiList(citiesResponse);
            expect(
                cities.length,
                `cities for country ${options.countryId} from /api/cities/select`
            ).to.be.greaterThan(0);

            const city = cities[0];
            expect(city.id, 'city id').to.exist;
            expect(city.country_id, 'city country_id').to.eq(options.countryId);

            return city;
        });
});

/**
 * Resolve country `code` from country UUID via GET /api/countries (full list).
 * Note: /api/countries/select is limited to 20 rows and must not be used for id lookup.
 */
Cypress.Commands.add('apiResolveCountryCode', (countryId) => {
    const apiUrl = getApiUrl();

    return cy
        .request({
            method: 'GET',
            url: `${apiUrl}/api/countries`,
            failOnStatusCode: true,
        })
        .then((countriesResponse) => {
            const countries = unwrapApiList(countriesResponse);
            const country = countries.find((item) => item.id === countryId);
            expect(country, `country for id ${countryId} from /api/countries`).to.exist;
            expect(country.code, 'country code').to.exist;

            return country.code;
        });
});

/**
 * POST multipart/form-data to customer profile endpoints (XHR — reliable file upload).
 */
function apiCustomerProfileMultipartPost({ path, token, fields, pictureFixture = 'corenet.png' }) {
    const apiUrl = getApiUrl();

    return cy.fixture(pictureFixture, 'binary').then((fileBinary) => {
        const blob = Cypress.Blob.binaryStringToBlob(fileBinary, 'image/png');
        const formData = new FormData();

        Object.entries(fields).forEach(([key, value]) => {
            formData.append(key, String(value));
        });
        formData.append('picture', blob, pictureFixture.split('/').pop());

        return cy.wrap(
            new Cypress.Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open('POST', `${apiUrl}${path}`);
                xhr.setRequestHeader('Authorization', `Bearer ${token}`);
                xhr.setRequestHeader('Accept', 'application/json');
                xhr.onload = () => {
                    let body = xhr.responseText;
                    try {
                        body = JSON.parse(xhr.responseText);
                    } catch {
                        // keep raw text
                    }
                    resolve({
                        status: xhr.status,
                        body,
                    });
                };
                xhr.onerror = () => reject(new Error(`Multipart POST failed: ${xhr.statusText || 'network error'}`));
                xhr.send(formData);
            }),
            { timeout: 30000 }
        ).then((response) => {
            expect(response.status, `multipart ${path} status`).to.be.oneOf([200, 201]);
            expect(response.body?.success, `multipart ${path} success flag`).to.eq(true);
            return response;
        });
    });
}

/**
 * POST /api/v1/customer/profile/complete — multipart/form-data with picture upload.
 */
Cypress.Commands.add('apiCompleteCustomerProfileMultipart', ({
    token,
    firstName,
    email,
    cityId,
    countryCode = '249',
    birthDate = '1990-05-15',
    gender = 'male',
    pictureFixture = 'corenet.png',
}) =>
    apiCustomerProfileMultipartPost({
        path: '/api/v1/customer/profile/complete',
        token,
        pictureFixture,
        fields: {
            firstName,
            email,
            birthDate,
            gender,
            cityId,
            country_code: countryCode,
        },
    })
);

/**
 * POST /api/v1/customer/profile/update — multipart/form-data with picture upload.
 */
Cypress.Commands.add('apiUpdateCustomerProfileMultipart', ({
    token,
    firstName,
    cityId,
    countryCode = '249',
    birthDate = '1992-03-20',
    gender = 'female',
    pictureFixture = 'corenet.png',
}) =>
    apiCustomerProfileMultipartPost({
        path: '/api/v1/customer/profile/update',
        token,
        pictureFixture,
        fields: {
            firstName,
            birthDate,
            gender,
            cityId,
            country_code: countryCode,
        },
    })
);

/**
 * POST /api/v1/customer/profile/complete — fill customer profile after registration.
 */
Cypress.Commands.add('apiCompleteCustomerProfile', ({ token, firstName, email, cityId, countryCode = '249' }) => {
    const apiUrl = getApiUrl();

    return cy.request({
        method: 'POST',
        url: `${apiUrl}/api/v1/customer/profile/complete`,
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
        },
        body: {
            firstName,
            email,
            birthDate: '1990-05-15',
            gender: 'male',
            cityId,
            country_code: countryCode,
        },
        failOnStatusCode: true,
    });
});

/**
 * Lookup country + city from APIs, then complete profile.
 * 1. GET /api/countries/select?search=Sudan
 * 2. GET /api/cities/select?country_id=...
 * 3. POST /api/v1/customer/profile/complete
 */
Cypress.Commands.add('apiCompleteCustomerProfileWithCityLookup', ({ token, firstName, email, countrySearch = 'Sudan' }) => {
    return cy.apiLookupCountry({ search: countrySearch }).then((country) => {
        return cy.apiLookupCity({ countryId: country.id }).then((city) => {
            return cy
                .apiCompleteCustomerProfile({
                    token,
                    firstName,
                    email,
                    cityId: city.id,
                    countryCode: country.code,
                })
                .then((completeResponse) => ({
                    completeResponse,
                    country,
                    city,
                }));
        });
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

            cy.visit('/en/admin/customers', {
                onBeforeLoad(win) {
                    applyAdminAuthToWindow(win, payload);
                },
            });

            return cy.wrap(payload).as('adminLoginPayload');
        });
});

/**
 * Seed deterministic wallet E2E customers via Laravel (WalletE2eSeeder).
 */
Cypress.Commands.add('seedWalletE2eFixtures', () => {
    return cy.task('seedWalletE2e');
});

/**
 * GET /api/v1/customer/wallet/dashboard
 */
Cypress.Commands.add('apiWalletDashboard', (token) => {
    const apiUrl = getApiUrl();

    return cy.request({
        method: 'GET',
        url: `${apiUrl}/api/v1/customer/wallet/dashboard`,
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
        },
        failOnStatusCode: true,
    });
});

/**
 * POST /api/v1/customer/wallet/transfer/by-wallet-id
 */
Cypress.Commands.add('apiWalletTransferByWalletId', ({
    token,
    recipientWalletId,
    amount,
    description,
    idempotencyKey,
    failOnStatusCode = true,
}) => {
    const apiUrl = getApiUrl();
    const headers = {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
    };

    if (idempotencyKey) {
        headers['Idempotency-Key'] = idempotencyKey;
    }

    return cy.request({
        method: 'POST',
        url: `${apiUrl}/api/v1/customer/wallet/transfer/by-wallet-id`,
        headers,
        body: {
            recipient_wallet_id: recipientWalletId,
            amount,
            description,
        },
        failOnStatusCode,
    });
});

/**
 * POST /api/v1/customer/wallet/transfer/by-phone
 */
Cypress.Commands.add('apiWalletTransferByPhone', ({
    token,
    recipientPhone,
    amount,
    description,
    idempotencyKey,
    failOnStatusCode = true,
}) => {
    const apiUrl = getApiUrl();
    const headers = {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
    };

    if (idempotencyKey) {
        headers['Idempotency-Key'] = idempotencyKey;
    }

    return cy.request({
        method: 'POST',
        url: `${apiUrl}/api/v1/customer/wallet/transfer/by-phone`,
        headers,
        body: {
            recipient_phone: recipientPhone,
            amount,
            description,
        },
        failOnStatusCode,
    });
});

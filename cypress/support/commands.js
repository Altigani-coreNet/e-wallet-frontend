import {
    assertAccountingDelta,
    billPaymentInterceptPattern,
    buildAccountingSnapshot,
    buildBillPaymentContextFromCatalog,
    pickFirstHomeBillProduct,
    unwrapCustomerCatalog,
    buildServicePayloadFromFormFields,
    configuredBillPaymentFee,
    configuredTransferFee,
    currentMonthDateRange,
    expectedWalletOperationDelta,
    mockOtpCode,
    zeroAccountingDelta,
} from './walletAccountingHelpers';
import { buildProfitLossSnapshot } from './accountingHelpers';

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

function getApiRequestDelayMs() {
    const configured = Cypress.env('apiRequestDelayMs');
    if (configured === undefined || configured === null || configured === '') {
        return 0;
    }

    return Math.max(0, Number(configured) || 0);
}

function shouldLogAllApiCalls() {
    return Cypress.env('logAllApiCalls') === true;
}

function sanitizeHeadersForLog(headers = {}) {
    const copy = { ...headers };

    if (copy.Authorization) {
        const token = String(copy.Authorization).replace(/^Bearer\s+/i, '');
        copy.Authorization = token.length > 12 ? `Bearer ${token.slice(0, 8)}…` : 'Bearer [set]';
    }

    return copy;
}

function buildRequestUrl(options = {}) {
    const baseUrl = options.url || '';
    const qs = options.qs;

    if (!qs || typeof qs !== 'object' || Object.keys(qs).length === 0) {
        return baseUrl;
    }

    const query = new URLSearchParams(
        Object.fromEntries(Object.entries(qs).map(([key, value]) => [key, String(value)]))
    ).toString();

    return `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}${query}`;
}

function logApiToConsole(phase, payload) {
    if (!shouldLogAllApiCalls()) {
        return;
    }

    const method = payload.method || 'GET';
    const url = payload.url || '(unknown url)';

    console.log(`\n========== API ${phase}: ${method} ${url} ==========`);
    console.log(JSON.stringify(payload, null, 2));
}

function delayBeforeNextApiCall(response) {
    const delayMs = getApiRequestDelayMs();

    if (delayMs <= 0) {
        return cy.wrap(response, { log: false });
    }

    cy.log(`API pause ${delayMs}ms before next request`);
    return cy.wait(delayMs, { log: false }).then(() => response);
}

/**
 * Laravel often returns JSON with Content-Type text/html; normalize so .body is always parsed.
 */
function parseResponseBody(body) {
    if (typeof body === 'string') {
        try {
            return JSON.parse(body);
        } catch {
            return body;
        }
    }

    return body;
}

/**
 * Set value on a React-controlled <input> (plain .clear().type() often appends).
 */
Cypress.Commands.add('setReactInputValue', { prevSubject: 'element' }, (subject, value) => {
    const input = subject[0];
    const nativeSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value'
    )?.set;

    if (nativeSetter) {
        nativeSetter.call(input, value);
    } else {
        input.value = value;
    }

    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));

    return cy.wrap(subject);
});

function apiRequest(options = {}) {
    const headers = {
        Accept: 'application/json',
        ...(options.headers || {}),
    };
    const method = (options.method || 'GET').toUpperCase();
    const url = buildRequestUrl(options);

    logApiToConsole('REQUEST', {
        method,
        url,
        headers: sanitizeHeadersForLog(headers),
        body: options.body ?? null,
        qs: options.qs ?? null,
        failOnStatusCode: options.failOnStatusCode ?? true,
    });

    Cypress.log({
        name: 'API →',
        displayName: `${method} ${url}`,
        message: 'request',
        consoleProps() {
            return {
                method,
                url,
                requestHeaders: sanitizeHeadersForLog(headers),
                requestBody: options.body ?? null,
            };
        },
    });

    return cy.request({ ...options, headers }).then((response) => {
        const normalized = {
            ...response,
            body: parseResponseBody(response.body),
        };

        logApiToConsole('RESPONSE', {
            method,
            url,
            status: normalized.status,
            body: normalized.body,
        });

        Cypress.log({
            name: 'API ←',
            displayName: `${method} ${url}`,
            message: `${normalized.status}`,
            consoleProps() {
                return {
                    method,
                    url,
                    status: normalized.status,
                    responseBody: normalized.body,
                };
            },
        });

        return delayBeforeNextApiCall(normalized);
    });
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

    return apiRequest({
            method: 'POST',
            url: `${apiUrl}/api/v1/customer/otp/sms`,
            body: { phone },
            failOnStatusCode: true,
        })
        .then((smsResponse) => {
            const rawToken = smsResponse.body.data.token;

            return apiRequest({
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
        return apiRequest({
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
                refreshToken: registerResponse.body.data.refresh_token,
                response: registerResponse,
            }));
    });
});

/**
 * Customer login against the real backend API.
 */
Cypress.Commands.add('apiCustomerLogin', ({ phone, password, failOnStatusCode = true }) => {
    const apiUrl = getApiUrl();

    return apiRequest({
        method: 'POST',
        url: `${apiUrl}/api/v1/customer/auth/login`,
        body: { phone, password },
        failOnStatusCode,
    });
});

/**
 * Login as a Wallet E2E fixture customer (+249977700001 sender, +249977700002 recipient).
 */
Cypress.Commands.add('apiWalletE2eLogin', ({ phone, password, role = 'customer' } = {}) => {
    const apiUrl = getApiUrl();
    const resolvedPhone = phone
        ?? (role === 'recipient' ? Cypress.env('walletE2eRecipientPhone') : Cypress.env('walletE2eSenderPhone'))
        ?? (role === 'recipient' ? '+249977700002' : '+249977700001');
    const resolvedPassword = password ?? Cypress.env('walletE2ePassword') ?? 'WalletE2e1!';

    return cy.apiCustomerLogin({
        phone: resolvedPhone,
        password: resolvedPassword,
        failOnStatusCode: false,
    }).then((response) => {
        const hint = `apiUrl=${apiUrl}`;

        expect(response.status, `${role} login HTTP (${hint})`).to.eq(200);
        expect(response.body, `${role} login JSON body (${hint})`).to.be.an('object').and.not.be.a('string');
        expect(response.body.success, `${role} login success (${hint})`).to.eq(true);
        expect(
            response.body.data?.token,
            `${role} login token (${hint})`
        ).to.be.a('string').and.not.be.empty;

        return cy.wrap(response.body.data.token, { log: false });
    });
});

/**
 * Refresh customer access token using a refresh_token.
 */
Cypress.Commands.add('apiCustomerRefreshToken', (refreshToken, { failOnStatusCode = true } = {}) => {
    const apiUrl = getApiUrl();

    return apiRequest({
        method: 'POST',
        url: `${apiUrl}/api/v1/customer/auth/refresh-token`,
        body: { refresh_token: refreshToken },
        failOnStatusCode,
    });
});

/**
 * Change password for the authenticated customer.
 */
Cypress.Commands.add(
    'apiCustomerChangePassword',
    ({ token, currentPassword, newPassword, failOnStatusCode = true }) => {
        const apiUrl = getApiUrl();

        return apiRequest({
            method: 'POST',
            url: `${apiUrl}/api/v1/customer/password/change`,
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/json',
            },
            body: {
                current_password: currentPassword,
                password: newPassword,
                password_confirmation: newPassword,
            },
            failOnStatusCode,
        });
    }
);

/**
 * DELETE /api/v1/customer/account — soft-delete with identifier corruption.
 */
Cypress.Commands.add('apiCustomerDeleteAccount', ({ token, password, failOnStatusCode = true }) => {
    const apiUrl = getApiUrl();

    return apiRequest({
        method: 'DELETE',
        url: `${apiUrl}/api/v1/customer/account`,
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
        },
        body: { password },
        failOnStatusCode,
    });
});

/**
 * GET /api/v1/customer/profile for the authenticated customer.
 */
Cypress.Commands.add('apiCustomerProfile', (token) => {
    const apiUrl = getApiUrl();

    return apiRequest({
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
    const body = parseResponseBody(response.body);
    if (Array.isArray(body)) {
        return body;
    }
    if (Array.isArray(body?.data)) {
        return body.data;
    }
    if (Array.isArray(body?.data?.data)) {
        return body.data.data;
    }

    return [];
}

function pickPreferredCountry(countries, preferredCode = '249') {
    if (!countries.length) {
        return null;
    }

    return (
        countries.find((c) => String(c.code) === preferredCode) ||
        countries.find((c) => c.shortName === 'SD' || c.short_name === 'SD') ||
        countries[0]
    );
}

function filterCountriesBySearch(countries, search) {
    const term = String(search).toLowerCase();

    return countries.filter(
        (c) =>
            String(c.name || '')
                .toLowerCase()
                .includes(term) ||
            String(c.code || '').includes(term) ||
            String(c.shortName || c.short_name || '')
                .toLowerCase()
                .includes(term)
    );
}

function getPreferredCountryCode(options = {}) {
    return options.preferredCode || Cypress.env('defaultCountryCode') || '249';
}

/**
 * cy.intercept alias only — request continues to the real backend (no stubbed response).
 */
function aliasRealRequest(method, urlPattern, alias) {
    cy.intercept(method, urlPattern, (req) => req.continue()).as(alias);
}

/**
 * GET /api/v1/countries — real API only; no synthetic fallbacks.
 */
Cypress.Commands.add('apiLookupCountry', (options = {}) => {
    const apiUrl = getApiUrl();
    const preferredCode = getPreferredCountryCode(options);

    return apiRequest({
            method: 'GET',
            url: `${apiUrl}/api/v1/countries`,
            failOnStatusCode: true,
        })
        .then((response) => {
            const countries = unwrapApiList(response);
            expect(countries.length, 'GET /api/v1/countries').to.be.greaterThan(0);

            if (options.countryId) {
                const byId = countries.find((c) => c.id === options.countryId);
                expect(byId, `country ${options.countryId} from GET /api/v1/countries`).to.exist;
                return byId;
            }

            if (options.search) {
                const matched = filterCountriesBySearch(countries, options.search);
                if (matched.length) {
                    const picked = pickPreferredCountry(matched, preferredCode);
                    expect(picked, `country matching "${options.search}"`).to.exist;
                    return picked;
                }
            }

            const picked = pickPreferredCountry(countries, preferredCode);
            expect(picked, `country with dial code ${preferredCode} from GET /api/v1/countries`).to.exist;
            return picked;
        });
});

/**
 * GET /api/v1/countries/{dialCode}/cities — real API only; no synthetic fallbacks.
 */
Cypress.Commands.add('apiLookupCity', (options = {}) => {
    const apiUrl = getApiUrl();
    const dialCode = String(
        options.dialCode || options.countryCode || getPreferredCountryCode(options)
    ).replace(/^\+/, '');

    return apiRequest({
            method: 'GET',
            url: `${apiUrl}/api/v1/countries/${encodeURIComponent(dialCode)}/cities`,
            failOnStatusCode: true,
        })
        .then((citiesResponse) => {
            const cities = unwrapApiList(citiesResponse);
            expect(cities.length, `GET /api/v1/countries/${dialCode}/cities`).to.be.greaterThan(0);

            if (options.cityId) {
                const byId = cities.find((c) => c.id === options.cityId);
                expect(byId, `city ${options.cityId} from GET /api/v1/countries/${dialCode}/cities`).to.exist;
                return byId;
            }

            const city = cities[0];
            if (options.countryId) {
                const cityCountryId = city.countryId ?? city.country_id;
                expect(
                    cityCountryId,
                    `city belongs to country ${options.countryId}`
                ).to.eq(options.countryId);
            }

            return city;
        });
});

/**
 * Resolve country dial code from UUID via GET /api/v1/countries.
 */
Cypress.Commands.add('apiResolveCountryCode', (countryId) => {
    const apiUrl = getApiUrl();

    return apiRequest({
            method: 'GET',
            url: `${apiUrl}/api/v1/countries`,
            failOnStatusCode: true,
        })
        .then((countriesResponse) => {
            const countries = unwrapApiList(countriesResponse);
            const country = countries.find((item) => item.id === countryId);
            expect(country?.code, `dial code for country ${countryId}`).to.exist;
            return country.code;
        });
});

/**
 * POST multipart/form-data to customer profile endpoints (XHR — reliable file upload).
 */
function apiCustomerProfileMultipartPost({ path, token, fields, pictureFixture = 'corenet.png' }) {
    const apiUrl = getApiUrl();
    const fullUrl = `${apiUrl}${path}`;

    logApiToConsole('REQUEST', {
        method: 'POST',
        url: fullUrl,
        headers: sanitizeHeadersForLog({
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
        }),
        body: { ...fields, picture: `[file: ${pictureFixture}]` },
    });

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
                xhr.open('POST', fullUrl);
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
            logApiToConsole('RESPONSE', {
                method: 'POST',
                url: fullUrl,
                status: response.status,
                body: response.body,
            });

            expect(response.status, `multipart ${path} status`).to.be.oneOf([200, 201]);
            expect(response.body?.success, `multipart ${path} success flag`).to.eq(true);

            return delayBeforeNextApiCall(response);
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
    nationalId,
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
            nationalId,
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
    nationalId,
    countryCode = '249',
    birthDate = '1992-03-20',
    gender = 'female',
    pictureFixture = 'corenet.png',
}) => {
    const fields = {
        firstName,
        birthDate,
        gender,
        cityId,
        country_code: countryCode,
    };

    if (nationalId !== undefined) {
        fields.nationalId = nationalId;
    }

    return apiCustomerProfileMultipartPost({
        path: '/api/v1/customer/profile/update',
        token,
        pictureFixture,
        fields,
    });
});

/**
 * POST /api/v1/customer/profile/complete — fill customer profile after registration.
 */
Cypress.Commands.add('apiCompleteCustomerProfile', ({ token, firstName, email, cityId, nationalId, countryCode = '249' }) => {
    const apiUrl = getApiUrl();

    return apiRequest({
        method: 'POST',
        url: `${apiUrl}/api/v1/customer/profile/complete`,
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
        },
        body: {
            firstName,
            nationalId,
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
 * Lookup country + city from v1 onboarding APIs, then complete profile.
 * 1. GET /api/v1/countries
 * 2. GET /api/v1/countries/{dialCode}/cities
 * 3. POST /api/v1/customer/profile/complete
 */
Cypress.Commands.add('apiCompleteCustomerProfileWithCityLookup', ({
    token,
    firstName,
    email,
    nationalId,
    countryId,
    countrySearch,
}) => {
    const lookupOptions = {};
    if (countryId) {
        lookupOptions.countryId = countryId;
    }
    if (countrySearch) {
        lookupOptions.search = countrySearch;
    }

    return cy.apiLookupCountry(lookupOptions).then((country) => {
        return cy
            .apiLookupCity({ dialCode: country.code, countryId: country.id })
            .then((city) => {
            return cy
                .apiCompleteCustomerProfile({
                    token,
                    firstName,
                    email,
                    nationalId,
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

    return apiRequest({
            method: 'POST',
            url: `${apiUrl}/api/v1/customer/password/forgot`,
            body: { phone },
            failOnStatusCode: true,
        })
        .then((forgotResponse) => {
            const rawToken = forgotResponse.body.data.token;

            return apiRequest({
                    method: 'POST',
                    url: `${apiUrl}/api/v1/customer/otp/verify`,
                    body: { token: rawToken, code: 111111 },
                    failOnStatusCode: true,
                })
                .then((verifyResponse) => {
                    const otpToken = verifyResponse.body.data.otp_token;

                    return apiRequest({
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

    return apiRequest({
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
 * GET /api/v1/customer/wallet/dashboard
 */
Cypress.Commands.add('apiWalletDashboard', (token, options = {}) => {
    const apiUrl = getApiUrl();

    return apiRequest({
        method: 'GET',
        url: `${apiUrl}/api/v1/customer/wallet/dashboard`,
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
        },
        failOnStatusCode: options.failOnStatusCode !== false,
    });
});

/**
 * GET /api/v1/customer/wallet/transactions
 */
Cypress.Commands.add('apiWalletTransactions', ({
    token,
    page,
    per_page: perPage,
    search,
    date_from: dateFrom,
    date_to: dateTo,
    type,
    direction,
    failOnStatusCode = true,
}) => {
    const apiUrl = getApiUrl();
    const qs = {};

    if (page !== undefined) qs.page = page;
    if (perPage !== undefined) qs.per_page = perPage;
    if (search !== undefined) qs.search = search;
    if (dateFrom !== undefined) qs.date_from = dateFrom;
    if (dateTo !== undefined) qs.date_to = dateTo;
    if (type !== undefined) qs.type = type;
    if (direction !== undefined) qs.direction = direction;

    return apiRequest({
        method: 'GET',
        url: `${apiUrl}/api/v1/customer/wallet/transactions`,
        qs,
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
        },
        failOnStatusCode,
    });
});

/**
 * GET /api/v1/customer/wallet/query?identifier=
 */
Cypress.Commands.add('apiWalletQuery', ({ token, identifier, failOnStatusCode = true }) => {
    const apiUrl = getApiUrl();

    return apiRequest({
        method: 'GET',
        url: `${apiUrl}/api/v1/customer/wallet/query`,
        qs: { identifier },
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
        },
        failOnStatusCode,
    });
});

/**
 * GET /api/v1/customer/wallet/resolve-recipient?identifier=
 */
Cypress.Commands.add('apiWalletResolveRecipient', ({ token, identifier, failOnStatusCode = true }) => {
    const apiUrl = getApiUrl();

    return apiRequest({
        method: 'GET',
        url: `${apiUrl}/api/v1/customer/wallet/resolve-recipient`,
        qs: { identifier },
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
        },
        failOnStatusCode,
    });
});

function isTransferOtpSuccess(response) {
    return [200, 201].includes(response.status)
        && response.body?.success === true
        && typeof response.body?.data?.otp_token === 'string'
        && response.body.data.otp_token.length > 0;
}

/**
 * POST /api/v1/customer/wallet/transfer/otp
 * Issues a transfer OTP bound to the payload. Use before apiWalletTransfer.
 */
Cypress.Commands.add('apiWalletTransferOtp', ({
    token,
    recipientWalletId,
    amount,
    description,
    note,
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

    return apiRequest({
        method: 'POST',
        url: `${apiUrl}/api/v1/customer/wallet/transfer/otp`,
        headers,
        body: {
            recipient_wallet_id: recipientWalletId,
            amount,
            description,
            note,
        },
        failOnStatusCode,
    });
});

/**
 * POST /api/v1/customer/wallet/transfer
 * Requests transfer OTP first, then completes transfer with mock OTP (111111 by default).
 */
Cypress.Commands.add('apiWalletTransfer', ({
    token,
    recipientWalletId,
    amount,
    fee,
    description,
    note,
    idempotencyKey,
    otpToken,
    otp,
    skipOtp = false,
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

    const transferBody = {
        recipient_wallet_id: recipientWalletId,
        amount,
        description,
        note,
        otp: otp ?? mockOtpCode(),
    };

    if (fee !== undefined) {
        transferBody.fee = fee;
    }

    const postTransfer = (resolvedOtpToken) => apiRequest({
        method: 'POST',
        url: `${apiUrl}/api/v1/customer/wallet/transfer`,
        headers,
        body: {
            ...transferBody,
            otp_token: resolvedOtpToken,
        },
        failOnStatusCode,
    });

    if (skipOtp) {
        return postTransfer(otpToken);
    }

    if (otpToken) {
        return postTransfer(otpToken);
    }

    return cy
        .apiWalletTransferOtp({
            token,
            recipientWalletId,
            amount,
            description,
            note,
            idempotencyKey,
            failOnStatusCode,
        })
        .then((otpResponse) => {
            if (!isTransferOtpSuccess(otpResponse)) {
                if (!failOnStatusCode) {
                    return cy.wrap(otpResponse, { log: false });
                }

                expect(isTransferOtpSuccess(otpResponse), 'transfer OTP issued').to.eq(true);
            }

            return postTransfer(otpResponse.body.data.otp_token);
        });
});

/**
 * @deprecated Use apiWalletTransfer after apiWalletResolveRecipient
 */
Cypress.Commands.add('apiWalletTransferByWalletId', ({
    token,
    recipientWalletId,
    amount,
    description,
    idempotencyKey,
    failOnStatusCode = true,
}) => cy.apiWalletTransfer({
    token,
    recipientWalletId,
    amount,
    description,
    idempotencyKey,
    failOnStatusCode,
}));

/**
 * GET /api/v1/customer/notifications
 */
Cypress.Commands.add('apiCustomerNotifications', ({
    token,
    page,
    per_page: perPage,
    failOnStatusCode = true,
} = {}) => {
    const apiUrl = getApiUrl();
    const qs = {};

    if (page !== undefined) qs.page = page;
    if (perPage !== undefined) qs.per_page = perPage;

    return apiRequest({
        method: 'GET',
        url: `${apiUrl}/api/v1/customer/notifications`,
        qs,
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
        },
        failOnStatusCode,
    });
});

/**
 * GET /api/v1/customer/notifications/unread-count
 */
Cypress.Commands.add('apiCustomerNotificationsUnreadCount', ({ token, failOnStatusCode = true } = {}) => {
    const apiUrl = getApiUrl();

    return apiRequest({
        method: 'GET',
        url: `${apiUrl}/api/v1/customer/notifications/unread-count`,
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
        },
        failOnStatusCode,
    });
});

function unwrapCustomerNotificationTitles(response) {
    const body = parseResponseBody(response.body);
    const rows = body?.data?.data || body?.data || [];

    return Array.isArray(rows) ? rows.map((row) => row.title).filter(Boolean) : [];
}

/**
 * Assert customer inbox total and that expected notification titles are present.
 */
Cypress.Commands.add('assertCustomerNotificationsInclude', ({
    token,
    total,
    titles = [],
    descriptions = [],
}) => {
    return cy.apiCustomerNotifications({ token }).then((response) => {
        expect(response.status, 'notifications list status').to.eq(200);
        expect(response.body.success, 'notifications success flag').to.eq(true);

        if (total !== undefined) {
            expect(response.body.data.total, 'notifications total').to.eq(total);
        }

        const actualTitles = unwrapCustomerNotificationTitles(response);
        titles.forEach((title) => {
            expect(actualTitles, `notification titles (got: ${actualTitles.join(', ')})`).to.include(title);
        });

        const serialized = JSON.stringify(response.body.data?.data || response.body.data || []);
        descriptions.forEach((fragment) => {
            expect(serialized, `notification descriptions contain "${fragment}"`).to.include(fragment);
        });

        return cy.wrap(response, { log: false });
    });
});

/**
 * POST /api/v2/admin/auth/login — returns token only (no UI visit).
 */
Cypress.Commands.add('apiAdminLogin', (overrides = {}) => {
    const apiUrl = getApiUrl();
    const email = overrides.email || Cypress.env('adminEmail');
    const password = overrides.password || Cypress.env('adminPassword');

    if (!email || !password) {
        throw new Error('Admin credentials missing. Set adminEmail and adminPassword in cypress.config.js.');
    }

    return apiRequest({
            method: 'POST',
            url: `${apiUrl}/api/v2/admin/auth/login`,
            body: { email, password },
            failOnStatusCode: true,
        })
        .then((loginResponse) => {
            const payload = loginResponse.body.data || loginResponse.body;
            const token = payload.token || payload.access_token;
            Cypress.env('adminToken', token);

            return cy.wrap({ token, payload });
        });
});

/**
 * POST /api/v2/admin/customers/{id}/status — activate / suspend customer account.
 */
Cypress.Commands.add('apiAdminUpdateCustomerStatus', ({ adminToken, customerId, status, failOnStatusCode = true }) => {
    const apiUrl = getApiUrl();
    const token = adminToken || Cypress.env('adminToken');

    return apiRequest({
        method: 'POST',
        url: `${apiUrl}/api/v2/admin/customers/${customerId}/status`,
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        body: { status },
        failOnStatusCode,
    });
});

/**
 * GET /api/v2/admin/customers/{id}
 */
Cypress.Commands.add('apiAdminGetCustomer', ({ adminToken, customerId, failOnStatusCode = true }) => {
    const apiUrl = getApiUrl();
    const token = adminToken || Cypress.env('adminToken');

    return apiRequest({
        method: 'GET',
        url: `${apiUrl}/api/v2/admin/customers/${customerId}`,
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
        },
        failOnStatusCode,
    });
});

/**
 * Activate a pending customer — tries POST /status, falls back to PUT /customers/{id}.
 */
Cypress.Commands.add('apiAdminActivateCustomer', ({ adminToken, customerId }) => {
    const apiUrl = getApiUrl();
    const token = adminToken || Cypress.env('adminToken');

    return cy
        .apiAdminUpdateCustomerStatus({
            adminToken: token,
            customerId,
            status: 'active',
            failOnStatusCode: false,
        })
        .then((statusResponse) => {
            if (statusResponse.status >= 200 && statusResponse.status < 300) {
                return cy.wrap(statusResponse);
            }

            return cy.apiAdminGetCustomer({ adminToken: token, customerId }).then((showResponse) => {
                const customer = showResponse.body.data;

                return apiRequest({
                    method: 'PUT',
                    url: `${apiUrl}/api/v2/admin/customers/${customerId}`,
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                    },
                    body: {
                        name: customer.name || 'E2E Wallet Customer',
                        email: customer.email,
                        phone: customer.phone,
                        status: 'active',
                    },
                    failOnStatusCode: true,
                });
            });
        });
});

/**
 * GET /api/v2/admin/wallets — find first wallet matching search query.
 */
Cypress.Commands.add('apiAdminFindWallet', ({
    adminToken,
    search,
    walletType,
    customerId,
    failOnStatusCode = true,
}) => {
    const apiUrl = getApiUrl();
    const token = adminToken || Cypress.env('adminToken');
    const qs = { per_page: 15 };

    if (search) {
        qs.search = search;
    }
    if (walletType) {
        qs.wallet_type = walletType;
    }
    if (customerId) {
        qs.customer_id = customerId;
    }

    return apiRequest({
            method: 'GET',
            url: `${apiUrl}/api/v2/admin/wallets`,
            qs,
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/json',
            },
            failOnStatusCode,
        })
        .then((response) => {
            const rows = response.body?.data?.data || response.body?.data || [];
            const wallet = Array.isArray(rows) ? rows[0] : null;

            if (failOnStatusCode) {
                expect(
                    wallet,
                    `wallet search="${search || ''}" customer_id="${customerId || ''}" type="${walletType || ''}"`
                ).to.exist;
            }

            return cy.wrap({ response, wallet });
        });
});

/**
 * Resolve a customer's wallet UUID via admin customer show, customer_id filter, or search.
 */
Cypress.Commands.add('apiResolveCustomerWallet', ({ adminToken, customerToken, customerId: explicitCustomerId }) => {
    return cy.apiCustomerProfile(customerToken).then((profileResponse) => {
        const customer = profileResponse.body?.data?.customer;
        const publicWalletId = customer?.walletId;
        const customerId = explicitCustomerId || customer?.id;
        const phone = customer?.phone;

        expect(publicWalletId, 'customer profile walletId').to.be.a('string').and.not.be.empty;
        expect(customerId, 'customer id').to.exist;

        const wrapWallet = (wallet) =>
            cy.wrap({
                walletUuid: wallet.id,
                walletPublicId: wallet.wallet_id || publicWalletId,
                customerId,
            });

        return cy.apiAdminGetCustomer({ adminToken, customerId }).then((showResponse) => {
            const adminCustomer = showResponse.body?.data;
            const walletUuid = adminCustomer?.wallet_uuid;
            const walletPublicId = adminCustomer?.wallet_public_id || publicWalletId;

            if (walletUuid) {
                return cy.wrap({
                    walletUuid,
                    walletPublicId,
                    customerId,
                });
            }

            return cy
                .apiAdminFindWallet({
                    adminToken,
                    customerId,
                    failOnStatusCode: false,
                })
                .then(({ wallet }) => {
                    if (wallet) {
                        return wrapWallet(wallet);
                    }

                    return cy
                        .apiAdminFindWallet({
                            adminToken,
                            search: phone || publicWalletId,
                            failOnStatusCode: false,
                        })
                        .then(({ wallet: bySearch }) => {
                            expect(bySearch, `wallet for customer ${customerId} (${phone})`).to.exist;
                            return wrapWallet(bySearch);
                        });
                });
        });
    });
});

/**
 * Ensure the master float wallet has enough balance for customer cash-ins.
 */
Cypress.Commands.add('apiEnsureMasterFloat', (adminToken, amount = 1000000) => {
    return cy.apiAdminGetMasterWallet(adminToken).then((master) =>
        cy
            .apiAdminWalletCashIn({
                adminToken,
                walletUuid: master.id,
                amount,
                description: 'Workflow master float',
                idempotencyKey: `master-float-${Date.now()}`,
                failOnStatusCode: false,
            })
            .then(() => cy.wrap(master))
    );
});

/**
 * GET /api/v2/admin/wallets/{uuid}
 */
Cypress.Commands.add('apiAdminWalletShow', ({ adminToken, walletUuid, failOnStatusCode = true }) => {
    const apiUrl = getApiUrl();
    const token = adminToken || Cypress.env('adminToken');

    return apiRequest({
        method: 'GET',
        url: `${apiUrl}/api/v2/admin/wallets/${walletUuid}`,
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
        },
        failOnStatusCode,
    });
});

/**
 * POST /api/v2/admin/wallets/opening-capital
 */
Cypress.Commands.add('apiAdminOpeningCapital', ({
    adminToken,
    amount,
    description,
    idempotencyKey,
    failOnStatusCode = true,
}) => {
    const apiUrl = getApiUrl();
    const token = adminToken || Cypress.env('adminToken');
    const headers = {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
    };

    if (idempotencyKey) {
        headers['Idempotency-Key'] = idempotencyKey;
    }

    return apiRequest({
        method: 'POST',
        url: `${apiUrl}/api/v2/admin/wallets/opening-capital`,
        headers,
        body: { amount, description },
        failOnStatusCode,
    });
});

/**
 * POST /api/v2/admin/wallets/{uuid}/cash-in
 */
Cypress.Commands.add('apiAdminWalletCashIn', ({
    adminToken,
    walletUuid,
    amount,
    description,
    idempotencyKey,
    failOnStatusCode = true,
}) => {
    const apiUrl = getApiUrl();
    const token = adminToken || Cypress.env('adminToken');
    const headers = {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
    };

    if (idempotencyKey) {
        headers['Idempotency-Key'] = idempotencyKey;
    }

    return apiRequest({
        method: 'POST',
        url: `${apiUrl}/api/v2/admin/wallets/${walletUuid}/cash-in`,
        headers,
        body: { amount, description },
        failOnStatusCode,
    });
});

/**
 * POST /api/v2/admin/wallets/{uuid}/cash-out
 */
Cypress.Commands.add('apiAdminWalletCashOut', ({
    adminToken,
    walletUuid,
    amount,
    description,
    idempotencyKey,
    failOnStatusCode = true,
}) => {
    const apiUrl = getApiUrl();
    const token = adminToken || Cypress.env('adminToken');
    const headers = {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
    };

    if (idempotencyKey) {
        headers['Idempotency-Key'] = idempotencyKey;
    }

    return apiRequest({
        method: 'POST',
        url: `${apiUrl}/api/v2/admin/wallets/${walletUuid}/cash-out`,
        headers,
        body: { amount, description },
        failOnStatusCode,
    });
});

/**
 * GET /api/v2/admin/accounting/chart-of-accounts
 */
Cypress.Commands.add('apiAdminChartOfAccounts', ({
    adminToken,
    startDate,
    endDate,
    failOnStatusCode = true,
} = {}) => {
    const apiUrl = getApiUrl();
    const token = adminToken || Cypress.env('adminToken');
    const { startDate: defaultStart, endDate: defaultEnd } = currentMonthDateRange();

    return apiRequest({
        method: 'GET',
        url: `${apiUrl}/api/v2/admin/accounting/chart-of-accounts`,
        qs: {
            start_date: startDate || defaultStart,
            end_date: endDate || defaultEnd,
        },
        headers: {
            Authorization: `Bearer ${token}`,
        },
        failOnStatusCode,
    });
});

/**
 * GET /api/v2/admin/accounting/reports/balance-sheet
 */
Cypress.Commands.add('apiAdminBalanceSheet', ({
    adminToken,
    startDate,
    endDate,
    failOnStatusCode = true,
} = {}) => {
    const apiUrl = getApiUrl();
    const token = adminToken || Cypress.env('adminToken');
    const { startDate: defaultStart, endDate: defaultEnd } = currentMonthDateRange();

    return apiRequest({
        method: 'GET',
        url: `${apiUrl}/api/v2/admin/accounting/reports/balance-sheet`,
        qs: {
            start_date: startDate || defaultStart,
            end_date: endDate || defaultEnd,
        },
        headers: {
            Authorization: `Bearer ${token}`,
        },
        failOnStatusCode,
    });
});

/**
 * GET /api/v2/admin/accounting/reports/profit-loss
 */
Cypress.Commands.add('apiAdminProfitAndLoss', ({
    adminToken,
    startDate,
    endDate,
    failOnStatusCode = true,
} = {}) => {
    const apiUrl = getApiUrl();
    const token = adminToken || Cypress.env('adminToken');
    const { startDate: defaultStart, endDate: defaultEnd } = currentMonthDateRange();

    return apiRequest({
        method: 'GET',
        url: `${apiUrl}/api/v2/admin/accounting/reports/profit-loss`,
        qs: {
            start_date: startDate || defaultStart,
            end_date: endDate || defaultEnd,
        },
        headers: {
            Authorization: `Bearer ${token}`,
        },
        failOnStatusCode,
    });
});

/**
 * Capture profit & loss totals for the current month date range.
 */
Cypress.Commands.add('captureProfitLossSnapshot', ({
    adminToken,
    startDate,
    endDate,
    label,
} = {}) => {
    const { startDate: defaultStart, endDate: defaultEnd } = currentMonthDateRange();

    return cy
        .apiAdminProfitAndLoss({
            adminToken,
            startDate: startDate || defaultStart,
            endDate: endDate || defaultEnd,
        })
        .then((response) => {
            const snapshot = buildProfitLossSnapshot(response.body, label);

            Cypress.log({
                name: 'P&L snapshot',
                displayName: label || 'profit-loss',
                message: `net ${snapshot.netProfit}, gross ${snapshot.grossProfit}, income ${snapshot.incomeTotal}`,
                consoleProps() {
                    return snapshot;
                },
            });

            return cy.wrap(snapshot, { log: false });
        });
});

/**
 * Visit an admin route with auth seeded in localStorage.
 */
Cypress.Commands.add('visitAdminAuthenticated', (path, adminPayload) => {
    const paymentBaseUrl =
        Cypress.env('PAYMENT_BASE_URL') || Cypress.config('baseUrl') || 'http://localhost:5173';
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;

    return cy.visit(`${paymentBaseUrl}/en${normalizedPath}`, {
        onBeforeLoad(win) {
            applyAdminAuthToWindow(win, adminPayload);
        },
    });
});

/**
 * Capture chart-of-accounts + balance-sheet totals before or after an operation.
 */
Cypress.Commands.add('captureAccountingSnapshot', ({
    adminToken,
    startDate,
    endDate,
    label,
} = {}) => {
    const { startDate: defaultStart, endDate: defaultEnd } = currentMonthDateRange();

    return cy
        .apiAdminChartOfAccounts({
            adminToken,
            startDate: startDate || defaultStart,
            endDate: endDate || defaultEnd,
        })
        .then((chartResponse) =>
            cy
                .apiAdminBalanceSheet({
                    adminToken,
                    startDate: startDate || defaultStart,
                    endDate: endDate || defaultEnd,
                })
                .then((balanceSheetResponse) => {
                    const snapshot = buildAccountingSnapshot({
                        chartOfAccountsPayload: chartResponse.body,
                        balanceSheetPayload: balanceSheetResponse.body,
                        label,
                    });

                    Cypress.log({
                        name: 'Accounting snapshot',
                        displayName: label || 'snapshot',
                        message: `assets ${snapshot.summary.total_assets}, liabilities ${snapshot.summary.total_liabilities}, equity ${snapshot.summary.total_equity}`,
                        consoleProps() {
                            return snapshot;
                        },
                    });

                    return cy.wrap(snapshot, { log: false });
                })
        );
});

/**
 * Re-fetch accounting totals and assert the operation moved balances as expected.
 */
Cypress.Commands.add('assertAccountingReflectsOperation', ({
    before,
    adminToken,
    expected,
    operation,
    amount,
    fee,
    providerPayableCode,
    context,
    startDate,
    endDate,
} = {}) => {
    const resolvedFee = fee !== undefined
        ? fee
        : (operation === 'transfer'
            ? configuredTransferFee()
            : operation === 'billPayment'
                ? configuredBillPaymentFee()
                : 0);
    const resolvedExpected = expected
        ?? (operation ? expectedWalletOperationDelta(operation, {
            amount,
            fee: resolvedFee,
            providerPayableCode,
        }) : null);

    if (!before || !resolvedExpected) {
        throw new Error('assertAccountingReflectsOperation requires before snapshot and expected or operation');
    }

    return cy
        .captureAccountingSnapshot({
            adminToken,
            startDate,
            endDate,
            label: context ? `${context} after` : 'after operation',
        })
        .then((after) => {
            assertAccountingDelta(before, after, resolvedExpected, context);
            return cy.wrap(after, { log: false });
        });
});

/**
 * Re-fetch accounting totals and assert nothing changed (rejected operations).
 */
Cypress.Commands.add('assertAccountingUnchanged', ({
    before,
    adminToken,
    context,
    startDate,
    endDate,
} = {}) => {
    if (!before) {
        throw new Error('assertAccountingUnchanged requires before snapshot');
    }

    return cy
        .captureAccountingSnapshot({
            adminToken,
            startDate,
            endDate,
            label: context ? `${context} unchanged check` : 'unchanged check',
        })
        .then((after) => {
            assertAccountingDelta(before, after, zeroAccountingDelta(), context);
            return cy.wrap(after, { log: false });
        });
});

/**
 * POST transfer with arbitrary body (chaos / validation tests).
 */
Cypress.Commands.add('apiWalletTransferRaw', ({
    token,
    body,
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

    return apiRequest({
        method: 'POST',
        url: `${apiUrl}/api/v1/customer/wallet/transfer`,
        headers,
        body,
        failOnStatusCode,
    });
});

/**
 * Assert the admin balance sheet is balanced after wallet money operations.
 */
Cypress.Commands.add('assertBalanceSheetBalanced', ({
    adminToken,
    startDate,
    endDate,
    context,
} = {}) => {
    return cy.captureAccountingSnapshot({
        adminToken,
        startDate,
        endDate,
        label: context ? `${context} balance check` : 'balance check',
    }).then((snapshot) => {
        const label = context ? `[${context}] ` : '';

        expect(snapshot.balanceSheet.is_balanced, `${label}balance sheet is_balanced`).to.eq(true);
        expect(snapshot.summary.is_balanced, `${label}chart of accounts is_balanced`).to.eq(true);
        expect(
            snapshot.balanceSheet.total_assets,
            `${label}assets = liabilities + equity`
        ).to.be.closeTo(snapshot.balanceSheet.total_liabilities_and_equity, 0.01);

        return cy.wrap(snapshot, { log: false });
    });
});

/**
 * POST /api/v2/admin/wallets/{uuid}/suspend|activate
 */
Cypress.Commands.add('apiAdminWalletSetStatus', ({ adminToken, walletUuid, action }) => {
    const apiUrl = getApiUrl();
    const token = adminToken || Cypress.env('adminToken');

    return apiRequest({
        method: 'POST',
        url: `${apiUrl}/api/v2/admin/wallets/${walletUuid}/${action}`,
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
        },
        failOnStatusCode: true,
    });
});

/**
 * POST /api/v1/customer/wallet/withdraw
 */
Cypress.Commands.add('apiWalletWithdraw', ({
    token,
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

    return apiRequest({
        method: 'POST',
        url: `${apiUrl}/api/v1/customer/wallet/withdraw`,
        headers,
        body: { amount, description },
        failOnStatusCode,
    });
});

function formatBalanceForAdminUi(amount) {
    return Number(amount).toFixed(2);
}

function visitAdminCustomersAuthenticated(adminPayload) {
    const paymentBaseUrl =
        Cypress.env('PAYMENT_BASE_URL') || Cypress.config('baseUrl') || 'http://localhost:5173';

    return cy.visit(`${paymentBaseUrl}/en/admin/customers`, {
        onBeforeLoad(win) {
            applyAdminAuthToWindow(win, adminPayload);
        },
    });
}

function openAdminCustomerSearchIfNeeded() {
    cy.get('body').then(($body) => {
        if ($body.find('input[name="search"]:visible').length === 0) {
            cy.contains('button', 'Filter').click({ force: true });
        }
    });
}

/**
 * Assert GET /v2/admin/customers/{id} balance matches wallet show balance.
 */
Cypress.Commands.add('assertAdminCustomerBalanceMatchesWallet', ({
    adminToken,
    customerId,
    walletUuid,
    expectedBalance,
}) => {
    const formatted = formatBalanceForAdminUi(expectedBalance);

    return cy.apiAdminGetCustomer({ adminToken, customerId }).then((customerResponse) => {
        expect(Number(customerResponse.body.data.balance), 'admin customer API balance').to.eq(
            Number(formatted)
        );

        return cy.apiAdminWalletShow({ adminToken, walletUuid }).then((walletResponse) => {
            expect(Number(walletResponse.body.data.balance), 'wallet API balance').to.eq(Number(formatted));
            expect(Number(customerResponse.body.data.balance), 'customer balance equals wallet balance').to.eq(
                Number(walletResponse.body.data.balance)
            );
        });
    });
});

/**
 * Admin customers list: search by phone and assert wallet balance column.
 */
Cypress.Commands.add('assertAdminCustomerBalanceInList', ({
    phone,
    expectedBalance,
    adminPayload,
    skipVisit = false,
}) => {
    aliasRealRequest('GET', '**/v2/admin/customers*', 'customersList');

    const chain = skipVisit ? cy.wrap(null) : visitAdminCustomersAuthenticated(adminPayload);

    return chain.then(() => {
        openAdminCustomerSearchIfNeeded();
        cy.get('input[name="search"]', { timeout: 15000 }).clear().type(phone);
        cy.wait('@customersList', { timeout: 30000 });

        return cy
            .contains('tr', phone, { timeout: 20000 })
            .should('contain.text', formatBalanceForAdminUi(expectedBalance));
    });
});

/**
 * Admin customer detail page: assert displayed wallet balance.
 */
Cypress.Commands.add('assertAdminCustomerBalanceInDetail', ({
    customerId,
    expectedBalance,
    adminPayload,
}) => {
    aliasRealRequest('GET', '**/v2/admin/customers/*', 'customerDetails');

    const paymentBaseUrl =
        Cypress.env('PAYMENT_BASE_URL') || Cypress.config('baseUrl') || 'http://localhost:5173';

    return cy
        .visit(`${paymentBaseUrl}/en/admin/customers/${customerId}`, {
            onBeforeLoad(win) {
                applyAdminAuthToWindow(win, adminPayload);
            },
        })
        .then(() => {
            cy.wait('@customerDetails', { timeout: 30000 });
            return cy
                .contains(formatBalanceForAdminUi(expectedBalance), { timeout: 20000 })
                .should('be.visible');
        });
});

/**
 * Admin panel: search customer by phone → Actions → Activate → confirm.
 */
Cypress.Commands.add('adminActivateCustomerInPanel', ({ phone, skipLogin = false }) => {
    aliasRealRequest('POST', '**/v2/admin/customers/*/status', 'customerStatusUpdate');
    aliasRealRequest('GET', '**/v2/admin/customers*', 'customersList');

    const activateInList = () => {
        cy.get('input[placeholder="Search customers..."]', { timeout: 15000 })
            .clear()
            .type(phone);
        cy.wait('@customersList', { timeout: 30000 });

        cy.contains('tr', phone, { timeout: 20000 }).within(() => {
            cy.contains('button', 'Actions').click();
        });
        cy.contains('a', 'Activate', { timeout: 10000 }).click();
        cy.confirmSwal();

        return cy.wait('@customerStatusUpdate', { timeout: 30000 }).then(({ response }) => {
            expect(response.statusCode).to.be.oneOf([200, 201]);
            const body = parseResponseBody(response.body);
            expect(body?.data?.status || body?.data?.customer?.status).to.eq('active');
            return cy.wrap(Cypress.env('adminToken'));
        });
    };

    if (skipLogin) {
        return activateInList();
    }

    return cy.loginAdmin().then(() => {
        cy.wait('@customersList', { timeout: 60000 });
        return activateInList();
    });
});

/**
 * Integrated onboarding: register → profile → admin panel activate → wallet ready.
 */
Cypress.Commands.add('setupWalletAccountingCustomer', (options = {}) => {
    const runId = options.runId || Date.now();
    const password = options.password || 'WalletAcct1!';
    const phone = options.phone || `+2499${String(runId).slice(-7)}${Math.floor(Math.random() * 10)}`;
    const label = options.label || 'WalletAcct';
    const useAdminPanel = options.useAdminPanel === true;
    const skipLogin = options.skipLogin === true;

    return cy.apiOnboardCustomer({ phone, password }).then(({ customer, token: pendingToken }) =>
        cy
            .apiCompleteCustomerProfileWithCityLookup({
                token: pendingToken,
                firstName: `${label} ${runId}`,
                email: `wallet.acct.${runId}@example.com`,
                nationalId: `WA-${runId}`,
            })
            .then(() => {
                const activateStep = useAdminPanel
                    ? cy.adminActivateCustomerInPanel({ phone, skipLogin })
                    : cy.apiAdminLogin().then(({ token: adminToken }) =>
                          cy.apiAdminActivateCustomer({ adminToken, customerId: customer.id }).then(() =>
                              cy.wrap(adminToken)
                          )
                      );

                return activateStep.then((adminToken) =>
                    cy.apiAdminFindWallet({ adminToken, search: phone }).then(({ wallet }) =>
                        cy.apiCustomerLogin({ phone, password }).then((loginResponse) => {
                            const activeToken = loginResponse.body.data.token;

                            return cy.apiWalletDashboard(activeToken).then((dashResponse) => {
                                expect(dashResponse.status).to.eq(200);
                                expect(dashResponse.body.data.wallet.wallet_id).to.eq(wallet.wallet_id);

                                return {
                                    phone,
                                    password,
                                    email: `wallet.acct.${runId}@example.com`,
                                    customerId: customer.id,
                                    token: activeToken,
                                    walletUuid: wallet.id,
                                    walletId: wallet.wallet_id,
                                    balance: dashResponse.body.data.wallet.balance,
                                    adminToken,
                                };
                            });
                        })
                    )
                );
            })
    );
});

/**
 * Two activated customers (sender + recipient) for transfer scenarios.
 */
Cypress.Commands.add('setupWalletAccountingPair', (runId = Date.now()) => {
    return cy
        .setupWalletAccountingCustomer({ runId, label: 'Sender' })
        .then((sender) =>
            cy
                .setupWalletAccountingCustomer({ runId: runId + 1, label: 'Recipient', skipLogin: true })
                .then((recipient) => ({ sender, recipient }))
        );
});

/**
 * Resolve master float wallet via admin API.
 */
Cypress.Commands.add('apiAdminGetMasterWallet', (adminToken) => {
    return cy
        .apiAdminFindWallet({ adminToken, walletType: 'master' })
        .then(({ wallet }) => cy.wrap(wallet));
});

/**
 * @deprecated Use apiWalletQuery + apiWalletTransfer
 */
Cypress.Commands.add('apiWalletTransferByPhone', ({
    token,
    recipientPhone,
    amount,
    description,
    note,
    idempotencyKey,
    failOnStatusCode = true,
}) => {
    return cy.apiWalletQuery({ token, identifier: recipientPhone, failOnStatusCode }).then((resolveResponse) => {
        return cy.apiWalletTransfer({
            token,
            recipientWalletId: resolveResponse.body.data.wallet_id,
            amount,
            description,
            note,
            idempotencyKey,
            failOnStatusCode,
        });
    });
});

/**
 * Minimal bill-payment setup: partner payables + customer + services/home.
 */
Cypress.Commands.add('setupOneBillPayment', ({
    runId = Date.now(),
    label = 'BillPayOne',
    customerAmount = 200,
    billAmount = 100,
    skipFunding = false,
} = {}) => {
    const normalizePayableRows = (body) => {
        const raw = body?.data?.data ?? body?.data ?? [];

        return Array.isArray(raw) ? raw : [];
    };

    return cy.setupWalletAccountingCustomer({ runId, label }).then((customer) => {
        const fundingStep = skipFunding
            ? cy.wrap(null)
            : cy.fundWalletAccountingCustomerForBillPay({
                adminToken: customer.adminToken,
                walletUuid: customer.walletUuid,
                customerAmount,
                runId,
            });

        return fundingStep.then(() => cy.apiCustomerServicesHome({ token: customer.token }).then((homeRes) => {
            const picked = pickFirstHomeBillProduct(unwrapCustomerCatalog(homeRes.body));

            if (!picked) {
                throw new Error(
                    'services/home has no product. Add a service to the home screen in admin.'
                );
            }

            return cy.apiAdminApprovePartner({
                adminToken: customer.adminToken,
                partnerId: picked.partnerId,
            }).then(() => cy.apiAdminListProviderPayables({ adminToken: customer.adminToken }).then((payablesRes) => {
                const payableRows = normalizePayableRows(payablesRes.body);
                const partnerPayableCode = payableRows.find(
                    (row) => String(row.partner_id).toLowerCase() === String(picked.partnerId).toLowerCase()
                )?.account_code;

                const billContext = {
                    serviceId: picked.serviceId,
                    productId: picked.productId,
                    partnerId: picked.partnerId,
                    partnerPayableCode: partnerPayableCode != null ? Number(partnerPayableCode) : null,
                    formUrl: picked.formUrl,
                    servicePayload: buildServicePayloadFromFormFields(picked.product, {
                        phone: customer.phone,
                        amount: billAmount,
                    }),
                    description: 'Bill payment E2E',
                    amount: billAmount,
                    product: picked.product,
                    form: picked.form,
                };

                return cy.wrap({ customer, billContext }, { log: false });
            }));
        }));
    });
});

/**
 * Step 2–4: customer services/home → first product form fields → bill-payment context.
 */
Cypress.Commands.add('prepareBillPaymentFromCatalog', ({
    token,
    adminToken,
    phone,
    amount = 100,
    description = 'Bill payment E2E',
} = {}) => {
    return cy.apiAdminListProviderPayables({ adminToken }).then((payablesRes) => {
        const payableRows = payablesRes.body?.data?.data ?? payablesRes.body?.data ?? [];

        return cy.apiCustomerServicesHome({ token }).then((homeRes) => cy.wrap(
            buildBillPaymentContextFromCatalog({
                catalogBody: homeRes.body,
                payableRows,
                phone,
                amount,
                description,
            }),
            { log: false }
        ));
    });
});

/**
 * Full bill-payment test setup:
 * 1) customer credentials + funded wallet
 * 2) services/home
 * 3) first product form fields → service_payload
 * 4) partner payable code for accounting assertions
 */
Cypress.Commands.add('setupBillPaymentTestContext', ({
    runId = Date.now(),
    label = 'BillPay',
    customerAmount = 200,
    billAmount = 100,
    partnerStatusCode = 200,
    partnerResponseBody = { success: true, reference: 'MOCK-E2E' },
} = {}) => {
    return cy.setupWalletAccountingCustomer({ runId, label }).then((customer) => {
        cy.fundWalletAccountingCustomerForBillPay({
            adminToken: customer.adminToken,
            walletUuid: customer.walletUuid,
            customerAmount,
            runId,
        });

        return cy.prepareBillPaymentFromCatalog({
            token: customer.token,
            adminToken: customer.adminToken,
            phone: customer.phone,
            amount: billAmount,
        }).then((billContext) => {
            cy.intercept('POST', billPaymentInterceptPattern(billContext.formUrl), {
                statusCode: partnerStatusCode,
                body: partnerResponseBody,
            }).as('partnerBillPay');

            return cy.wrap({
                customer,
                billContext,
            }, { log: false });
        });
    });
});

/** @deprecated use prepareBillPaymentFromCatalog */
Cypress.Commands.add('resolveBillPaymentCatalog', ({ token, adminToken, phone, amount = 100 } = {}) => {
    return cy.prepareBillPaymentFromCatalog({ token, adminToken, phone, amount });
});

Cypress.Commands.add('apiCustomerServicesCatalog', ({ token, failOnStatusCode = true } = {}) => {
    const apiUrl = getApiUrl();

    return apiRequest({
        method: 'GET',
        url: `${apiUrl}/api/v1/customer/services/catalog`,
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
        },
        failOnStatusCode,
    });
});

Cypress.Commands.add('apiCustomerServicesHome', ({ token, limit = 50, failOnStatusCode = true } = {}) => {
    const apiUrl = getApiUrl();

    return apiRequest({
        method: 'GET',
        url: `${apiUrl}/api/v1/customer/services/home?limit=${limit}`,
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
        },
        failOnStatusCode,
    });
});

Cypress.Commands.add('apiCustomerServiceDetails', ({ token, serviceId, failOnStatusCode = true }) => {
    const apiUrl = getApiUrl();

    return apiRequest({
        method: 'GET',
        url: `${apiUrl}/api/v1/customer/services/${serviceId}`,
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
        },
        failOnStatusCode,
    });
});

Cypress.Commands.add('apiAdminApprovePartner', ({ adminToken, partnerId, failOnStatusCode = true } = {}) => {
    const apiUrl = getApiUrl();

    return apiRequest({
        method: 'POST',
        url: `${apiUrl}/api/v1/admin/partners/${partnerId}/approve`,
        headers: {
            Authorization: `Bearer ${adminToken}`,
            Accept: 'application/json',
        },
        failOnStatusCode,
    });
});

Cypress.Commands.add('apiAdminListProviderPayables', ({ adminToken, search, failOnStatusCode = true } = {}) => {
    const apiUrl = getApiUrl();
    const query = search ? `?search=${encodeURIComponent(search)}` : '';

    return apiRequest({
        method: 'GET',
        url: `${apiUrl}/api/v2/admin/provider-settlements${query}`,
        headers: {
            Authorization: `Bearer ${adminToken}`,
            Accept: 'application/json',
        },
        failOnStatusCode,
    });
});

Cypress.Commands.add('fundWalletAccountingCustomerForBillPay', ({
    adminToken,
    walletUuid,
    masterAmount = 300,
    customerAmount = 200,
    runId = Date.now(),
} = {}) => {
    return cy.apiAdminGetMasterWallet(adminToken).then((master) => {
        cy.apiAdminWalletCashIn({
            adminToken,
            walletUuid: master.id,
            amount: masterAmount,
            idempotencyKey: `seed-bill-${runId}`,
        });

        return cy.apiAdminWalletCashIn({
            adminToken,
            walletUuid,
            amount: customerAmount,
            idempotencyKey: `fund-bill-${runId}`,
        });
    });
});

Cypress.Commands.add('apiWalletBillPaymentOtp', ({
    token,
    serviceId,
    productId,
    amount,
    servicePayload,
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

    return apiRequest({
        method: 'POST',
        url: `${apiUrl}/api/v1/customer/wallet/bill-payment/otp`,
        headers,
        body: {
            service_id: serviceId,
            product_id: productId,
            amount,
            service_payload: servicePayload,
            description,
        },
        failOnStatusCode,
    });
});

Cypress.Commands.add('apiWalletBillPayment', ({
    token,
    serviceId,
    productId,
    amount,
    servicePayload,
    description,
    idempotencyKey,
    otpToken,
    otp,
    skipOtp = false,
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

    const postBillPayment = (resolvedOtpToken) => apiRequest({
        method: 'POST',
        url: `${apiUrl}/api/v1/customer/wallet/bill-payment`,
        headers,
        body: {
            service_id: serviceId,
            product_id: productId,
            amount,
            service_payload: servicePayload,
            description,
            otp_token: resolvedOtpToken,
            otp: otp ?? mockOtpCode(),
        },
        failOnStatusCode,
    });

    if (skipOtp || otpToken) {
        return postBillPayment(otpToken);
    }

    return cy.apiWalletBillPaymentOtp({
        token,
        serviceId,
        productId,
        amount,
        servicePayload,
        description,
        idempotencyKey,
        failOnStatusCode,
    }).then((otpResponse) => {
        const otpToken = otpResponse.body?.data?.otp_token;
        if (!otpToken) {
            throw new Error(
                `Bill payment OTP failed (${otpResponse.status}): ${JSON.stringify(otpResponse.body)}`
            );
        }

        return postBillPayment(otpToken);
    });
});

Cypress.Commands.add('apiAdminProviderSettlement', ({
    adminToken,
    partnerId,
    amount,
    description,
    idempotencyKey,
    failOnStatusCode = true,
}) => {
    const apiUrl = getApiUrl();
    const headers = {
        Authorization: `Bearer ${adminToken}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
    };

    if (idempotencyKey) {
        headers['Idempotency-Key'] = idempotencyKey;
    }

    return apiRequest({
        method: 'POST',
        url: `${apiUrl}/api/v2/admin/provider-settlements`,
        headers,
        body: {
            partner_id: partnerId,
            amount,
            description,
        },
        failOnStatusCode,
    });
});

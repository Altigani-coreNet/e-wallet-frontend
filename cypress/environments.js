/**
 * Cypress E2E environment profiles.
 *
 * Active profile: CYPRESS_TARGET_ENV (default: development)
 * Per-key overrides: CYPRESS_<key> env vars (e.g. CYPRESS_apiUrl)
 *
 * Local secrets: copy cypress/.env.development.example → cypress/.env.development
 */

const sharedWalletFixtures = {
    walletE2eSenderPhone: '+249977700001',
    walletE2eRecipientPhone: '+249977700002',
    walletE2ePassword: 'WalletE2e1!',
    /** Must match Fast_Pay_Soft_Pos WALLET_TRANSFER_FEE / config services.wallet.transfer_fee */
    walletTransferFee: 2,
    /** Must match Fast_Pay_Soft_Pos OTP_MOCK_CODE — used for auth + wallet transfer OTP */
    otpMockCode: 111111,
    /** Must match Fast_Pay_Soft_Pos WALLET_BILL_PAYMENT_FEE / config services.wallet.bill_payment_fee */
    walletBillPaymentFee: 0,
    /** Partner bill-pay URL stubbed in Cypress (must match product form form_url in admin) */
    billPaymentMockUrl: 'https://bill-mock.test/pay',
};

/** Preferred dial code when picking country/city from real GET /api/v1/countries APIs. */
const sharedGeoFixtures = {
    defaultCountryCode: '249',
};

/** @type {Record<string, Record<string, unknown>>} */
export const environments = {
    /**
     * Local dev — Laravel `php artisan serve` + Payment `npm run dev`
     */
    development: {
        environmentName: 'development',
        apiUrl: 'http://localhost:8000',
        PAYMENT_BASE_URL: 'http://localhost:5173',
        adminEmail: 'admin@corenet-tech.com',
        adminPassword: '12345678',
        ADMIN_EMAIL: 'admin@corenet-tech.com',
        ADMIN_PASSWORD: '12345678',
        reverbHost: 'localhost',
        reverbPort: 8080,
        reverbScheme: 'ws',
        reverbAppKey: 'cp_live_v1_9f4a2d1b7c8e3f6a',
        /** Pause between cy.request API calls (ms) — set CYPRESS_apiRequestDelayMs to override */
        apiRequestDelayMs: 0,
        logAllApiCalls: true,
        ...sharedWalletFixtures,
        ...sharedGeoFixtures,
    },

    /**
     * Shared remote dev/staging server (deployed API, local or remote UI)
     */
    staging: {
        environmentName: 'staging',
        apiUrl: 'http://193.123.83.134:91',
        PAYMENT_BASE_URL: 'http://localhost:5173',
        adminEmail: 'admin@corenet-tech.com',
        adminPassword: '12345678',
        ADMIN_EMAIL: 'admin@corenet-tech.com',
        ADMIN_PASSWORD: '12345678',
        reverbHost: '193.123.83.134',
        reverbPort: 91,
        reverbScheme: 'ws',
        reverbAppKey: 'cp_live_v1_9f4a2d1b7c8e3f6a',
        apiRequestDelayMs: 0,
        logAllApiCalls: false,
        ...sharedWalletFixtures,
        ...sharedGeoFixtures,
    },
};

const VALID_ENVIRONMENTS = Object.keys(environments);

/**
 * @param {string} [name]
 * @returns {{ baseUrl: string, env: Record<string, unknown> }}
 */
export function resolveCypressEnvironment(name = 'development') {
    const key = name.trim().toLowerCase();

    if (!environments[key]) {
        throw new Error(
            `Unknown CYPRESS_TARGET_ENV "${name}". Valid: ${VALID_ENVIRONMENTS.join(', ')}`
        );
    }

    const profile = { ...environments[key] };
    const baseUrl = profile.PAYMENT_BASE_URL || profile.baseUrl || 'http://localhost:5173';

    /** @type {Record<string, unknown>} */
    const env = { ...profile, PAYMENT_BASE_URL: baseUrl };

    // Cypress auto-injects process.env.CYPRESS_* — merge explicit overrides here too.
    for (const [envKey, value] of Object.entries(process.env)) {
        if (!envKey.startsWith('CYPRESS_') || value === undefined || value === '') {
            continue;
        }
        const cypressKey = envKey.slice('CYPRESS_'.length);
        if (cypressKey === 'TARGET_ENV') {
            continue;
        }
        env[cypressKey] = value;
    }

    return { baseUrl, env };
}

export { VALID_ENVIRONMENTS };

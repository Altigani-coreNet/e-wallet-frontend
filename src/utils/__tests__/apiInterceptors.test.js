import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    isAuthEndpoint,
    isMerchantEndpoint,
    buildContextHeaders,
    resolveUiLocale,
} from '../apiInterceptors';
import { APP_CONFIG } from '../constants';

describe('apiInterceptors', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    describe('resolveUiLocale', () => {
        it('returns en by default', () => {
            expect(resolveUiLocale()).toBe('en');
        });

        it('returns ar when i18next storage is ar', () => {
            localStorage.setItem('i18nextLng', 'ar');
            expect(resolveUiLocale()).toBe('ar');
        });
    });

    describe('isAuthEndpoint', () => {
        it('matches login and register paths', () => {
            expect(isAuthEndpoint('http://localhost/api/login')).toBe(true);
            expect(isAuthEndpoint('http://localhost/api/register/user')).toBe(true);
        });

        it('does not match merchant dashboard paths', () => {
            expect(isAuthEndpoint('http://localhost/api/v2/merchant/dashboard')).toBe(false);
        });
    });

    describe('isMerchantEndpoint', () => {
        it('matches merchant API paths', () => {
            expect(isMerchantEndpoint('http://localhost/api/v1/merchant/terminals')).toBe(true);
        });

        it('does not match admin paths', () => {
            expect(isMerchantEndpoint('http://localhost/api/v2/admin/merchants')).toBe(false);
        });
    });

    describe('buildContextHeaders', () => {
        it('includes locale headers', () => {
            const headers = buildContextHeaders('/api/v1/merchant/transactions', 'token-123');
            expect(headers['Accept-Language']).toBe('en');
            expect(headers['X-App-Locale']).toBe('en');
            expect(headers.Authorization).toBe('Bearer token-123');
        });

        it('omits region and scope headers on auth endpoints', () => {
            localStorage.setItem(
                'auth-storage',
                JSON.stringify({
                    state: {
                        custom_region: true,
                        regions: [1, 2],
                        merchant: { scopes: ['softpos'] },
                    },
                })
            );
            localStorage.setItem(APP_CONFIG.MERCHANT_KEY, JSON.stringify({ scopes: ['softpos'] }));

            const headers = buildContextHeaders('/api/login', 'token');
            expect(headers['X-Regions']).toBeUndefined();
            expect(headers['X-Scope']).toBeUndefined();
        });

        it('adds region and scope headers for merchant endpoints', () => {
            localStorage.setItem(
                'auth-storage',
                JSON.stringify({
                    state: {
                        custom_region: true,
                        regions: [{ id: 5 }],
                        merchant: { scopes: ['softpos'] },
                    },
                })
            );
            localStorage.setItem(APP_CONFIG.MERCHANT_KEY, JSON.stringify({ scopes: ['softpos'] }));

            const headers = buildContextHeaders('/api/v1/merchant/transactions', 'token');
            expect(headers['X-Regions']).toBe(JSON.stringify([5]));
            expect(headers['X-Scope']).toBe(JSON.stringify(['softpos']));
        });

        it('adds test mode header when enabled', () => {
            localStorage.setItem('testMode', 'true');
            const headers = buildContextHeaders('/api/profile', null);
            expect(headers['X-Test-Mode']).toBe('true');
        });
    });
});

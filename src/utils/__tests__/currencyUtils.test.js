import { describe, it, expect } from 'vitest';
import {
    getLanguageCode,
    getCurrencyLocale,
    resolveTranslatable,
    resolveCurrencySymbol,
    formatAmountWithSymbol,
} from '../currencyUtils';

describe('currencyUtils', () => {
    describe('getLanguageCode', () => {
        it('extracts base language code', () => {
            expect(getLanguageCode('ar-SA')).toBe('ar');
            expect(getLanguageCode('en-US')).toBe('en');
        });
    });

    describe('resolveTranslatable', () => {
        it('returns string values as-is', () => {
            expect(resolveTranslatable('USD', 'en')).toBe('USD');
        });

        it('picks language from translation object', () => {
            expect(resolveTranslatable({ en: 'Dollar', ar: 'دولار' }, 'ar')).toBe('دولار');
        });

        it('falls back to en then ar', () => {
            expect(resolveTranslatable({ en: 'Only EN' }, 'ar')).toBe('Only EN');
        });
    });

    describe('resolveCurrencySymbol', () => {
        it('reads symbol from currency object', () => {
            const symbol = resolveCurrencySymbol({ symbol: 'ر.س' }, 'ar');
            expect(symbol).toBe('ر.س');
        });
    });

    describe('formatAmountWithSymbol', () => {
        it('formats English amounts with symbol prefix', () => {
            const result = formatAmountWithSymbol(1234.5, '$', 'en');
            expect(result).toContain('$');
            expect(result).toContain('1,234.50');
        });

        it('formats Arabic amounts with symbol suffix', () => {
            const result = formatAmountWithSymbol(100, 'ر.س', 'ar');
            expect(result).toContain('ر.س');
        });
    });

    describe('getCurrencyLocale', () => {
        it('returns ar-SA for Arabic', () => {
            expect(getCurrencyLocale('ar')).toBe('ar-SA');
        });

        it('returns en-US for English', () => {
            expect(getCurrencyLocale('en')).toBe('en-US');
        });
    });
});

import { describe, it, expect } from 'vitest';
import {
    getTranslatedText,
    truncateText,
    getStatusBadgeClass,
    formatCurrency,
} from '../helpers';

describe('helpers', () => {
    describe('getTranslatedText', () => {
        it('returns empty string for falsy values', () => {
            expect(getTranslatedText(null)).toBe('');
        });

        it('returns string values directly', () => {
            expect(getTranslatedText('hello')).toBe('hello');
        });

        it('extracts language from object', () => {
            expect(getTranslatedText({ en: 'Hello', ar: 'مرحبا' }, 'ar')).toBe('مرحبا');
        });
    });

    describe('truncateText', () => {
        it('returns full text when under limit', () => {
            expect(truncateText('short', 10)).toBe('short');
        });

        it('truncates with ellipsis', () => {
            expect(truncateText('abcdefghij', 5)).toBe('abcde...');
        });
    });

    describe('getStatusBadgeClass', () => {
        it('maps known statuses', () => {
            expect(getStatusBadgeClass('active')).toBe('badge-light-success');
            expect(getStatusBadgeClass('inactive')).toBe('badge-light-warning');
        });

        it('returns default for unknown status', () => {
            expect(getStatusBadgeClass('unknown')).toBe('badge-light-secondary');
        });
    });

    describe('formatCurrency', () => {
        it('formats USD amount', () => {
            const result = formatCurrency(99.5, 'USD', 'en-US');
            expect(result).toContain('99.50');
        });
    });
});

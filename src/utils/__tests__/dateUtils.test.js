import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    getDisplayLocale,
    formatMerchantDateTime,
    formatDate,
    formatDateShort,
    getRelativeTime,
    isToday,
} from '../dateUtils';

describe('dateUtils', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-06-24T12:00:00Z'));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('getDisplayLocale', () => {
        it('returns ar-SA for Arabic', () => {
            expect(getDisplayLocale('ar')).toBe('ar-SA');
        });

        it('returns en-US for English', () => {
            expect(getDisplayLocale('en')).toBe('en-US');
        });
    });

    describe('formatMerchantDateTime', () => {
        it('returns empty string for missing date', () => {
            expect(formatMerchantDateTime(null, 'en')).toBe('');
        });

        it('formats valid ISO date', () => {
            const result = formatMerchantDateTime('2026-06-24T10:30:00Z', 'en');
            expect(result.length).toBeGreaterThan(0);
        });
    });

    describe('formatDate', () => {
        it('returns N/A for empty input', () => {
            expect(formatDate('')).toBe('N/A');
        });

        it('formats a valid date string', () => {
            expect(formatDate('2026-06-24T10:00:00Z')).not.toBe('N/A');
        });
    });

    describe('formatDateShort', () => {
        it('returns N/A for empty input', () => {
            expect(formatDateShort('')).toBe('N/A');
        });
    });

    describe('getRelativeTime', () => {
        it('returns Just now for recent timestamps', () => {
            expect(getRelativeTime(new Date().toISOString())).toBe('Just now');
        });

        it('returns minutes ago for timestamps within an hour', () => {
            const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
            expect(getRelativeTime(fiveMinAgo)).toBe('5 minutes ago');
        });
    });

    describe('isToday', () => {
        it('returns true for today', () => {
            expect(isToday(new Date().toISOString())).toBe(true);
        });

        it('returns false for yesterday', () => {
            const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
            expect(isToday(yesterday)).toBe(false);
        });
    });
});

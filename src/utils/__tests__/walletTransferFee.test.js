import { describe, it, expect } from 'vitest';
import {
    DEFAULT_TRANSFER_FEE,
    resolveTransferFee,
    transferRecipientNet,
    roundMoney,
} from '../walletTransferFee';

describe('walletTransferFee', () => {
    describe('resolveTransferFee', () => {
        it('returns default fee when env is unset', () => {
            expect(resolveTransferFee(undefined)).toBe(DEFAULT_TRANSFER_FEE);
            expect(resolveTransferFee(null)).toBe(DEFAULT_TRANSFER_FEE);
            expect(resolveTransferFee('')).toBe(DEFAULT_TRANSFER_FEE);
        });

        it('returns zero when env is explicitly 0', () => {
            expect(resolveTransferFee(0)).toBe(0);
            expect(resolveTransferFee('0')).toBe(0);
        });

        it('clamps negative env values to zero', () => {
            expect(resolveTransferFee(-5)).toBe(0);
        });

        it('uses explicit env override', () => {
            expect(resolveTransferFee(3)).toBe(3);
        });
    });

    describe('transferRecipientNet', () => {
        it('deducts fee from gross amount', () => {
            expect(transferRecipientNet(50, 2)).toBe(48);
        });

        it('returns zero when fee exceeds gross', () => {
            expect(transferRecipientNet(1, 2)).toBe(0);
        });

        it('uses default fee when not specified', () => {
            expect(transferRecipientNet(50)).toBe(48);
        });
    });

    describe('roundMoney', () => {
        it('rounds to two decimal places', () => {
            expect(roundMoney(10.005)).toBe(10.01);
            expect(roundMoney('2.999')).toBe(3);
        });
    });
});

/** Default transfer fee (SDG) — mirrors WALLET_TRANSFER_FEE / cypress/environments.js */
export const DEFAULT_TRANSFER_FEE = 2;

export function roundMoney(value) {
    return Math.round(Number(value || 0) * 100) / 100;
}

/**
 * Resolve configured transfer fee from env override (Cypress env or explicit value).
 * @param {unknown} envFee - e.g. Cypress.env('walletTransferFee')
 * @param {number} [defaultFee=DEFAULT_TRANSFER_FEE] - used when envFee is unset
 */
export function resolveTransferFee(envFee, defaultFee = DEFAULT_TRANSFER_FEE) {
    if (envFee === undefined || envFee === null || envFee === '') {
        return roundMoney(defaultFee);
    }

    return Math.max(0, roundMoney(envFee));
}

/** Net amount credited to recipient after the platform transfer fee. */
export function transferRecipientNet(grossAmount, fee = DEFAULT_TRANSFER_FEE) {
    const gross = roundMoney(grossAmount);
    const feeValue = Math.max(0, roundMoney(fee));

    return Math.max(0, roundMoney(gross - feeValue));
}

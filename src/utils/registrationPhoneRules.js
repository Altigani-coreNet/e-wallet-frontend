/**
 * Shared registration phone rules (merchant & partner).
 * Adjust onlyCountries, byDialCode, and patterns here only.
 *
 * nationalDigitLength: digits after the country calling code.
 * nationalPatternSource: RegExp source for the national part only (no /flags).
 */

export const REGISTRATION_PHONE = {
    onlyCountries: ['ae', 'sd'],
    defaultCountry: 'ae',

    byDialCode: {
        '971': {
            nationalDigitLength: 9,
            nationalPatternSource: '^(?:50|52|54|55|56|58)\\d{7}$',
            invalidMessage:
                'Enter a valid UAE mobile number (9 digits: 50, 52, 54, 55, 56, or 58).',
        },
        '249': {
            nationalDigitLength: 9,
            nationalPatternSource: '^(?:(?:90|91|92|96|99)\\d{7}|12\\d{7})$',
            invalidMessage:
                'Enter a valid Sudan mobile number (9 digits after +249).',
        },
    },
};

/**
 * @param {string} phone E.164 or digits-only international string
 * @returns {{ ok: true } | { ok: false, message: string }}
 */
export function validateRegistrationPhone(phone) {
    const raw = (phone || '').trim();
    if (!raw) {
        return { ok: false, message: 'Phone number is required.' };
    }

    const digits = raw.replace(/\D/g, '');
    if (!digits) {
        return { ok: false, message: 'Phone number is required.' };
    }

    const rules = REGISTRATION_PHONE.byDialCode;
    const sortedCodes = Object.keys(rules).sort((a, b) => b.length - a.length);

    for (const code of sortedCodes) {
        if (!digits.startsWith(code)) continue;

        const rule = rules[code];
        const national = digits.slice(code.length);

        if (national.length !== rule.nationalDigitLength) {
            return { ok: false, message: rule.invalidMessage };
        }

        const re = new RegExp(rule.nationalPatternSource);
        if (!re.test(national)) {
            return { ok: false, message: rule.invalidMessage };
        }

        return { ok: true };
    }

    return {
        ok: false,
        message: 'Please choose UAE or Sudan and enter a valid mobile number.',
    };
}

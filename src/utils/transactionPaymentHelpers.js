/**
 * Display labels for payment channel, entry mode, and payment type fields from the API.
 * Unknown values are returned as trimmed strings (e.g. card brands stay as sent).
 */

function norm(value) {
    if (value == null || value === '') return '';
    return String(value)
        .trim()
        .toUpperCase()
        .replace(/\s+/g, '_')
        .replace(/-/g, '_');
}

const PAYMENT_CHANNEL_MAP = {
    NFC: 'merchant.transactionDetail.channelNfc',
    SWIPE: 'merchant.transactionDetail.channelSwipe',
    SWIPED: 'merchant.transactionDetail.channelSwipe',
    MAGSTRIPE: 'merchant.transactionDetail.channelSwipe',
    MAG_STRIPE: 'merchant.transactionDetail.channelSwipe',
    MSR: 'merchant.transactionDetail.channelSwipe',
    CONTACTLESS: 'merchant.transactionDetail.channelContactless',
    CONTACT_LESS: 'merchant.transactionDetail.channelContactless',
    CHIP: 'merchant.transactionDetail.channelChip',
    INSERT: 'merchant.transactionDetail.channelChip',
    ICC: 'merchant.transactionDetail.channelChip',
    EMV: 'merchant.transactionDetail.channelChip',
    MANUAL: 'merchant.transactionDetail.channelManual',
    KEYED: 'merchant.transactionDetail.channelManual',
    KEY_ENTRY: 'merchant.transactionDetail.channelManual',
    KEYENTRY: 'merchant.transactionDetail.channelManual',
    QR: 'merchant.transactionDetail.channelQr',
    QR_CODE: 'merchant.transactionDetail.channelQr',
    BARCODE: 'merchant.transactionDetail.channelBarcode',
    MOBILE: 'merchant.transactionDetail.channelMobile',
    ECOMMERCE: 'merchant.transactionDetail.channelEcommerce',
    E_COMMERCE: 'merchant.transactionDetail.channelEcommerce',
    WEB: 'merchant.transactionDetail.channelWeb',
    MOTO: 'merchant.transactionDetail.channelMoto',
};

const ENTRY_MODE_MAP = {
    NFC: 'merchant.transactionDetail.entryNfc',
    SWIPE: 'merchant.transactionDetail.entrySwipe',
    SWIPED: 'merchant.transactionDetail.entrySwipe',
    MAGSTRIPE: 'merchant.transactionDetail.entrySwipe',
    CHIP: 'merchant.transactionDetail.entryChip',
    ICC: 'merchant.transactionDetail.entryChip',
    CONTACTLESS: 'merchant.transactionDetail.entryContactless',
    CONTACT_LESS: 'merchant.transactionDetail.entryContactless',
    MANUAL: 'merchant.transactionDetail.entryManual',
    KEYED: 'merchant.transactionDetail.entryManual',
    QR: 'merchant.transactionDetail.entryQr',
    FALLBACK: 'merchant.transactionDetail.entryFallback',
    UNKNOWN: 'merchant.transactionDetail.entryUnknown',
};

const METHOD_GENERIC_MAP = {
    CARD: 'merchant.transactionDetail.methodCard',
    DEBIT: 'merchant.transactionDetail.methodDebit',
    CREDIT: 'merchant.transactionDetail.methodCredit',
};

/**
 * @param {string | null | undefined} raw
 * @param {(key: string) => string} t
 */
export function getPaymentChannelLabel(raw, t) {
    const k = norm(raw);
    if (!k) return '';
    const i18nKey = PAYMENT_CHANNEL_MAP[k];
    if (i18nKey) return t(i18nKey);
    return String(raw).trim();
}

/**
 * @param {string | null | undefined} raw
 * @param {(key: string) => string} t
 */
export function getEntryModeLabel(raw, t) {
    const k = norm(raw);
    if (!k) return '';
    const i18nKey = ENTRY_MODE_MAP[k];
    if (i18nKey) return t(i18nKey);
    return String(raw).trim();
}

/**
 * payment_type / transaction_type style values: card, web, bank…
 * @param {string | null | undefined} raw
 * @param {(key: string) => string} t
 */
export function getTransactionPaymentTypeFieldLabel(raw, t) {
    const k = String(raw || '')
        .trim()
        .toLowerCase();
    const map = {
        card: 'merchant.transactions.typeCard',
        web: 'merchant.transactions.typeWeb',
        bank: 'merchant.transactions.typeBank',
        mobile: 'merchant.transactions.typeMobile',
        qr: 'merchant.transactions.typeQr',
        other: 'merchant.transactions.typeOther',
    };
    if (map[k]) return t(map[k]);
    if (!raw) return '';
    return String(raw).trim();
}

/**
 * Card type / method (VISA, MASTERCARD, CARD, …). Maps generic terms; brands pass through uppercased.
 * @param {string | null | undefined} raw
 * @param {(key: string) => string} t
 */
export function getPaymentCardBrandOrMethodLabel(raw, t) {
    if (raw == null || raw === '') return '';
    const k = norm(raw);
    const i18nKey = METHOD_GENERIC_MAP[k];
    if (i18nKey) return t(i18nKey);
    return String(raw).trim().toUpperCase();
}

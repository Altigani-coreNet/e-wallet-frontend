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

const PAYMENT_CHANNEL_SUFFIX = {
    NFC: 'channelNfc',
    SWIPE: 'channelSwipe',
    SWIPED: 'channelSwipe',
    MAGSTRIPE: 'channelSwipe',
    MAG_STRIPE: 'channelSwipe',
    MSR: 'channelSwipe',
    CONTACTLESS: 'channelContactless',
    CONTACT_LESS: 'channelContactless',
    CHIP: 'channelChip',
    INSERT: 'channelChip',
    ICC: 'channelChip',
    EMV: 'channelChip',
    MANUAL: 'channelManual',
    KEYED: 'channelManual',
    KEY_ENTRY: 'channelManual',
    KEYENTRY: 'channelManual',
    QR: 'channelQr',
    QR_CODE: 'channelQr',
    BARCODE: 'channelBarcode',
    MOBILE: 'channelMobile',
    ECOMMERCE: 'channelEcommerce',
    E_COMMERCE: 'channelEcommerce',
    WEB: 'channelWeb',
    MOTO: 'channelMoto',
};

const ENTRY_MODE_SUFFIX = {
    NFC: 'entryNfc',
    SWIPE: 'entrySwipe',
    SWIPED: 'entrySwipe',
    MAGSTRIPE: 'entrySwipe',
    CHIP: 'entryChip',
    ICC: 'entryChip',
    CONTACTLESS: 'entryContactless',
    CONTACT_LESS: 'entryContactless',
    MANUAL: 'entryManual',
    KEYED: 'entryManual',
    QR: 'entryQr',
    FALLBACK: 'entryFallback',
    UNKNOWN: 'entryUnknown',
};

const METHOD_GENERIC_SUFFIX = {
    CARD: 'methodCard',
    DEBIT: 'methodDebit',
    CREDIT: 'methodCredit',
};

/**
 * @param {string | null | undefined} raw
 * @param {(key: string) => string} t
 * @param {string} [detailNs='merchant.transactionDetail']
 */
export function getPaymentChannelLabel(raw, t, detailNs = 'merchant.transactionDetail') {
    const k = norm(raw);
    if (!k) return '';
    const suffix = PAYMENT_CHANNEL_SUFFIX[k];
    if (suffix) return t(`${detailNs}.${suffix}`);
    return String(raw).trim();
}

/**
 * @param {string | null | undefined} raw
 * @param {(key: string) => string} t
 * @param {string} [detailNs='merchant.transactionDetail']
 */
export function getEntryModeLabel(raw, t, detailNs = 'merchant.transactionDetail') {
    const k = norm(raw);
    if (!k) return '';
    const suffix = ENTRY_MODE_SUFFIX[k];
    if (suffix) return t(`${detailNs}.${suffix}`);
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
/**
 * @param {string | null | undefined} raw
 * @param {(key: string) => string} t
 * @param {string} [detailNs='merchant.transactionDetail']
 */
export function getPaymentCardBrandOrMethodLabel(raw, t, detailNs = 'merchant.transactionDetail') {
    if (raw == null || raw === '') return '';
    const k = norm(raw);
    const suffix = METHOD_GENERIC_SUFFIX[k];
    if (suffix) return t(`${detailNs}.${suffix}`);
    return String(raw).trim().toUpperCase();
}

import i18n from '../i18n/config';

/** Current UI language code (`en` | `ar`). */
export const getLanguageCode = (lng = i18n.language) => (lng || 'en').split('-')[0];

/** `Intl` locale for number/currency formatting. */
export const getCurrencyLocale = (lng = i18n.language) =>
    getLanguageCode(lng) === 'ar' ? 'ar-SA' : 'en-US';

/**
 * Resolve API values that may be a plain string or `{ en, ar }` translations.
 */
export const resolveTranslatable = (value, lang = getLanguageCode()) => {
    if (value == null || value === '') return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'object' && !Array.isArray(value)) {
        return value[lang] ?? value.en ?? value.ar ?? Object.values(value).find(Boolean) ?? '';
    }
    return String(value);
};

/** Pick symbol from a currency-like object for the active language. */
export const resolveCurrencySymbol = (currencyObj, lang = getLanguageCode()) => {
    if (!currencyObj) return '';
    if (currencyObj.symbol_translations && typeof currencyObj.symbol_translations === 'object') {
        const fromTrans = resolveTranslatable(currencyObj.symbol_translations, lang);
        if (fromTrans) return fromTrans;
    }
    const fromSymbol = resolveTranslatable(currencyObj.symbol, lang);
    if (fromSymbol) return fromSymbol;
    return resolveTranslatable(currencyObj.currency_symbol, lang);
};

const numberFormatOptions = (lang) => ({
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...(getLanguageCode(lang) === 'ar' ? { numberingSystem: 'arab' } : {}),
});

/**
 * Format amount with merchant symbol and locale-aware digits/grouping.
 * Arabic: `1,234.56 ج.س.` — English: `ج.س.1,234.56`
 */
export const formatAmountWithSymbol = (amount, symbol, lang = getLanguageCode()) => {
    const value = Number(amount) || 0;
    const locale = getCurrencyLocale(lang);
    const formattedNumber = new Intl.NumberFormat(locale, numberFormatOptions(lang)).format(value);

    const sym = (symbol || '').trim();
    if (!sym) return formattedNumber;

    if (getLanguageCode(lang) === 'ar') {
        return `${formattedNumber}\u00A0${sym}`;
    }
    return `${sym}${formattedNumber}`;
};

const isIsoCurrencyCode = (value) =>
    typeof value === 'string' && /^[A-Z]{3}$/i.test(value.trim());

/**
 * Sale / invoice currency symbol — uses `currency_symbol` saved on the sale first.
 */
export const getSaleCurrencySymbol = (invoice, lang = getLanguageCode()) => {
    if (!invoice) return '';

    const code = getLanguageCode(lang);

    const objectSymbol = invoice.currency_object
        ? resolveCurrencySymbol(invoice.currency_object, code)
        : '';

    const saleSymbol = invoice.currency_symbol;
    if (typeof saleSymbol === 'string' && saleSymbol.trim()) {
        const trimmed = saleSymbol.trim();
        if (isIsoCurrencyCode(trimmed) && objectSymbol && !isIsoCurrencyCode(objectSymbol)) {
            return objectSymbol;
        }
        return trimmed;
    }
    if (saleSymbol && typeof saleSymbol === 'object') {
        const resolved = resolveTranslatable(saleSymbol, code);
        if (resolved) return resolved;
    }

    if (objectSymbol) return objectSymbol;

    if (typeof invoice.shop?.currency_symbol === 'string' && invoice.shop.currency_symbol.trim()) {
        return invoice.shop.currency_symbol.trim();
    }
    if (invoice.shop?.currency_object) {
        const fromShop = resolveCurrencySymbol(invoice.shop.currency_object, code);
        if (fromShop) return fromShop;
    }

    return '';
};

/** @deprecated alias */
export const resolveInvoiceCurrencySymbol = getSaleCurrencySymbol;

/** Format invoice amounts — prefers SoftPos API currency when provided. */
export const formatInvoiceCurrency = (
    amount,
    invoice,
    lang = getLanguageCode(),
    softposCurrency = null
) => {
    if (softposCurrency) {
        const apiSymbol = resolveCurrencySymbol(softposCurrency, lang) || softposCurrency.symbol;
        if (apiSymbol) {
            return formatAmountWithSymbol(amount, apiSymbol, lang);
        }
    }

    const symbol = getSaleCurrencySymbol(invoice, lang);
    return formatAmountWithSymbol(amount, symbol, lang);
};

/**
 * Resolve symbol from a transaction / batch / settlement row.
 */
export const getRecordCurrencySymbol = (record, lang = getLanguageCode()) => {
    if (!record) return '';

    const code = getLanguageCode(lang);
    const objectSymbol = record.currency_object
        ? resolveCurrencySymbol(record.currency_object, code)
        : '';

    const rowSymbol = record.currency_symbol;
    if (typeof rowSymbol === 'string' && rowSymbol.trim()) {
        const trimmed = rowSymbol.trim();
        if (isIsoCurrencyCode(trimmed) && objectSymbol && !isIsoCurrencyCode(objectSymbol)) {
            return objectSymbol;
        }
        return trimmed;
    }
    if (rowSymbol && typeof rowSymbol === 'object') {
        const resolved = resolveTranslatable(rowSymbol, code);
        if (resolved) return resolved;
    }

    if (objectSymbol) return objectSymbol;

    if (record.currency) {
        const fromCurrency = resolveCurrencySymbol(record.currency, code);
        if (fromCurrency) return fromCurrency;
    }

    return '';
};

/** Format row amount using its currency_symbol, else merchant fallback symbol. */
export const formatRecordCurrency = (
    amount,
    record,
    lang = getLanguageCode(),
    fallbackSymbol = ''
) => {
    const symbol = getRecordCurrencySymbol(record, lang) || fallbackSymbol;
    return formatAmountWithSymbol(amount, symbol, lang);
};

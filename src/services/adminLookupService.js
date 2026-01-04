import { getMerchantDetails } from './adminMerchantsService';
import { getTranslatedText } from '../utils/helpers';

const merchantCache = new Map();
const countryCache = new Map();
const failedMerchantIds = new Set();

const normalizeCountryName = (country) => {
    if (!country) return '';

    if (typeof country === 'string') {
        return country;
    }

    if (typeof country === 'object') {
        if (country.name) {
            const translatedName = getTranslatedText(country.name);
            if (translatedName) {
                return translatedName;
            }
        }

        if (country.short_name) {
            return country.short_name;
        }

        if (country.code) {
            return country.code;
        }
    }

    return '';
};

const buildMerchantRecord = (merchantData, fallbackId) => {
    if (!merchantData) {
        return null;
    }

    const merchant = merchantData?.merchant ?? merchantData;

    if (!merchant) {
        return null;
    }

    const merchantId = merchant.id ?? fallbackId;
    const businessName = merchant.business_name || merchant.name || merchant.owner_name || (merchantId ? `Merchant #${merchantId}` : 'Unknown Merchant');

    const countryEntity = merchant.country ?? merchantData.country ?? null;
    const countryId = merchant.country_id ?? countryEntity?.id ?? merchantData.country_id ?? null;
    let countryName = normalizeCountryName(countryEntity);

    if (!countryName && merchant.country_name) {
        countryName = merchant.country_name;
    }

    if (!countryName && countryId && countryCache.has(countryId)) {
        countryName = countryCache.get(countryId);
    }

    if (countryId && countryName) {
        countryCache.set(countryId, countryName);
    }

    return {
        id: merchantId,
        name: businessName,
        businessName,
        merchant,
        countryId,
        countryName,
    };
};

export const fetchMerchantLookups = async (ids = []) => {
    const uniqueIds = Array.from(new Set(
        ids
            .filter((id) => id !== null && id !== undefined)
            .map((id) => Number.isNaN(Number(id)) ? id : Number(id))
    ));

    if (!uniqueIds.length) {
        return {
            merchants: {},
            countries: {},
        };
    }

    const missingIds = uniqueIds.filter((id) => !merchantCache.has(id) && !failedMerchantIds.has(id));

    if (missingIds.length) {
        const responses = await Promise.allSettled(missingIds.map((id) => getMerchantDetails(id)));

        responses.forEach((response, index) => {
            const merchantId = missingIds[index];

            if (response.status === 'fulfilled' && response.value) {
                merchantCache.set(merchantId, response.value);
                failedMerchantIds.delete(merchantId);
            } else {
                merchantCache.set(merchantId, null);
                failedMerchantIds.add(merchantId);
            }
        });
    }

    const merchants = {};
    const countries = {};

    uniqueIds.forEach((id) => {
        const cachedValue = merchantCache.get(id);
        const record = buildMerchantRecord(cachedValue, id);

        if (!record) {
            return;
        }

        merchants[id] = record;

        if (record.countryId && record.countryName) {
            countries[record.countryId] = record.countryName;
        }
    });

    return {
        merchants,
        countries,
    };
};

export const clearMerchantLookupCache = () => {
    merchantCache.clear();
    countryCache.clear();
    failedMerchantIds.clear();
};


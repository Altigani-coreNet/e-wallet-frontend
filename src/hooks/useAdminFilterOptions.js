import { useMemo, useCallback } from 'react';
import useAdminReferenceData from './useAdminReferenceData';

const PREFERRED_LOCALES = ['en', 'en_US', 'en-US', 'ar', 'ar_SA', 'ar-SA'];

const normalizeLocaleString = (value) => {
    if (!value) return '';

    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
            try {
                const parsed = JSON.parse(trimmed);
                return normalizeLocaleString(parsed);
            } catch (error) {
                return trimmed;
            }
        }
        return value;
    }

    if (typeof value === 'object') {
        for (const locale of PREFERRED_LOCALES) {
            if (value[locale]) {
                return String(value[locale]);
            }
        }
        const firstNonEmpty = Object.values(value).find((entry) => !!entry);
        if (firstNonEmpty) {
            return String(firstNonEmpty);
        }
    }

    return '';
};

const normalizeOption = (item) => {
    if (!item || typeof item !== 'object') {
        return null;
    }

    const id = item.id ?? item.value ?? item.key;
    if (id === undefined || id === null) {
        return null;
    }

    const labelCandidates = [
        item.label,
        item.text,
        item.name,
        item.business_name,
        item.merchant_name,
        item.title,
    ];

    let label = '';
    for (const candidate of labelCandidates) {
        label = normalizeLocaleString(candidate);
        if (label) {
            break;
        }
    }

    if (!label) {
        label = typeof item.code === 'string' ? item.code.toUpperCase() : `#${id}`;
    }

    return {
        id,
        value: String(id),
        label,
        code: item.code,
        country_code: item.country_code,
        raw: item,
    };
};

const buildOptions = (list) => {
    if (!Array.isArray(list)) {
        return [];
    }

    return list
        .map(normalizeOption)
        .filter(Boolean)
        .sort((a, b) => a.label.localeCompare(b.label));
};

const useAdminFilterOptions = ({ autoLoad = true } = {}) => {
    const {
        merchantsMap,
        countriesMap,
        merchantsList,
        countriesList,
        loading,
        error,
        loadReferenceData,
        hasLoaded,
    } = useAdminReferenceData({ autoLoad });

    const merchantOptions = useMemo(() => buildOptions(merchantsList), [merchantsList]);
    const countryOptions = useMemo(() => buildOptions(countriesList), [countriesList]);

    const resolveMerchantName = useCallback(
        (id, fallback = 'N/A') => {
            if (!id) return fallback;
            const key = typeof id === 'number' ? id : String(id);
            return merchantsMap[key] || merchantsMap[Number(key)] || fallback;
        },
        [merchantsMap]
    );

    const resolveCountryName = useCallback(
        (id, fallback = 'N/A') => {
            if (!id) return fallback;
            const key = typeof id === 'number' ? id : String(id);
            return countriesMap[key] || countriesMap[Number(key)] || fallback;
        },
        [countriesMap]
    );

    const getCountryOption = useCallback(
        (id) => countryOptions.find((option) => String(option.value) === String(id)),
        [countryOptions]
    );

    const getMerchantOption = useCallback(
        (id) => merchantOptions.find((option) => String(option.value) === String(id)),
        [merchantOptions]
    );

    return {
        merchantOptions,
        countryOptions,
        loading,
        error,
        resolveMerchantName,
        resolveCountryName,
        getMerchantOption,
        getCountryOption,
        loadReferenceData,
        hasLoaded,
    };
};

export default useAdminFilterOptions;


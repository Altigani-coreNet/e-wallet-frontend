import { useState, useEffect } from 'react';
import axios from 'axios';
import { ADMIN_ENDPOINTS, ADMIN_SYSTEM_ENDPOINTS } from '../utils/constants';
import { getToken } from '../utils/api';

let cachedMerchants = null;
let cachedCountries = null;
let cachedMerchantsList = null;
let cachedCountriesList = null;
let cacheError = null;
let cachePromise = null;

const PREFERRED_LOCALES = ['en', 'en_US', 'en-US', 'ar', 'ar_SA', 'ar-SA'];

const extractLocaleString = (value) => {
    if (!value) return '';

    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
            try {
                const parsed = JSON.parse(trimmed);
                return extractLocaleString(parsed);
            } catch (error) {
                return trimmed;
            }
        }
        return value;
    }

    if (typeof value === 'object') {
        for (const localeKey of PREFERRED_LOCALES) {
            if (value[localeKey]) {
                return String(value[localeKey]);
            }
        }

        const firstNonEmpty = Object.values(value).find((entry) => !!entry);
        if (firstNonEmpty) {
            return String(firstNonEmpty);
        }
    }

    return '';
};

const resolveDisplayName = (item = {}) => {
    if (typeof item === 'string') return extractLocaleString(item);
    if (!item || typeof item !== 'object') return '';

    const candidates = [
        item.label,
        item.text,
        item.name,
        item.business_name,
        item.merchant_name,
        item.title,
    ];

    for (const candidate of candidates) {
        const resolved = extractLocaleString(candidate);
        if (resolved) return resolved;
    }

    if (typeof item.code === 'string') {
        return item.code.toUpperCase();
    }

    if (item.id !== undefined && item.id !== null) {
        return `#${item.id}`;
    }

    return '';
};

const mapArrayToDictionary = (items) => {
    if (!Array.isArray(items)) return {};
    return items.reduce((acc, item) => {
        if (item?.id === undefined || item?.id === null) {
            return acc;
        }

        acc[item.id] = resolveDisplayName(item);
        return acc;
    }, {});
};

export const useAdminReferenceData = ({ autoLoad = true } = {}) => {
    const [shouldLoad, setShouldLoad] = useState(
        autoLoad && !(cachedMerchants && cachedCountries) && !cacheError
    );

    const [state, setState] = useState({
        merchantsMap: cachedMerchants || {},
        countriesMap: cachedCountries || {},
        merchantsList: cachedMerchantsList || [],
        countriesList: cachedCountriesList || [],
        loading: shouldLoad,
        error: cacheError,
    });

    useEffect(() => {
        if (!shouldLoad || (cachedMerchants && cachedCountries)) {
            setState((prev) => ({
                ...prev,
                merchantsMap: cachedMerchants || prev.merchantsMap,
                countriesMap: cachedCountries || prev.countriesMap,
                merchantsList: cachedMerchantsList || prev.merchantsList,
                countriesList: cachedCountriesList || prev.countriesList,
                loading: false,
                error: cacheError,
            }));
            return;
        }

        let cancelled = false;

        const loadData = async () => {
            try {
                if (cachePromise) {
                    await cachePromise;
                } else {
                    const token = getToken();
                    cachePromise = Promise.all([
                        axios.get(ADMIN_ENDPOINTS.MERCHANTS_SELECT, {
                            headers: { Authorization: `Bearer ${token}` },
                        }),
                        axios.get(ADMIN_SYSTEM_ENDPOINTS.COUNTRIES_SELECT, {
                            headers: { Authorization: `Bearer ${token}` },
                        }),
                    ]);
                    const [merchantsRes, countriesRes] = await cachePromise;

                    const merchantsData = Array.isArray(merchantsRes.data?.data)
                        ? merchantsRes.data.data
                        : Array.isArray(merchantsRes.data)
                            ? merchantsRes.data
                            : [];

                    const countriesData = Array.isArray(countriesRes.data?.data)
                        ? countriesRes.data.data
                        : Array.isArray(countriesRes.data)
                            ? countriesRes.data
                            : [];

                    cachedMerchantsList = merchantsData;
                    cachedCountriesList = countriesData;
                    cachedMerchants = mapArrayToDictionary(merchantsData);
                    cachedCountries = mapArrayToDictionary(countriesData);
                    cacheError = null;
                }

                if (!cancelled) {
                    setState({
                        merchantsMap: cachedMerchants,
                        countriesMap: cachedCountries,
                        merchantsList: cachedMerchantsList,
                        countriesList: cachedCountriesList,
                        loading: false,
                        error: null,
                    });
                }
            } catch (error) {
                console.error('Failed to fetch reference data', error);
                cacheError = error;
                cachedMerchants = cachedMerchants || {};
                cachedCountries = cachedCountries || {};
                cachedMerchantsList = cachedMerchantsList || [];
                cachedCountriesList = cachedCountriesList || [];
                if (!cancelled) {
                    setState({
                        merchantsMap: cachedMerchants,
                        countriesMap: cachedCountries,
                        merchantsList: cachedMerchantsList,
                        countriesList: cachedCountriesList,
                        loading: false,
                        error,
                    });
                }
            } finally {
                cachePromise = null;
                setShouldLoad(false);
            }
        };

        loadData();

        return () => {
            cancelled = true;
        };
    }, [shouldLoad]);

    const loadReferenceData = () => {
        if (cachedMerchants && cachedCountries) {
            setState((prev) => ({
                ...prev,
                merchantsMap: cachedMerchants,
                countriesMap: cachedCountries,
                merchantsList: cachedMerchantsList,
                countriesList: cachedCountriesList,
                loading: false,
                error: cacheError,
            }));
            return;
        }

        setShouldLoad(true);
        setState((prev) => ({
            ...prev,
            loading: true,
            error: null,
        }));
    };

    return {
        ...state,
        loadReferenceData,
        hasLoaded: Boolean(cachedMerchants && cachedCountries),
    };
};

export default useAdminReferenceData;

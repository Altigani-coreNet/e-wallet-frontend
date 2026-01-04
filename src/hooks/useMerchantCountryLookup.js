import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchMerchantLookups } from '../services/adminLookupService';

const sortAndSerializeIds = (ids = []) => {
    if (!Array.isArray(ids) || ids.length === 0) {
        return '';
    }

    return [...new Set(ids.filter((id) => id !== null && id !== undefined))]
        .map((id) => (Number.isNaN(Number(id)) ? String(id) : String(Number(id))))
        .sort((a, b) => {
            if (a === b) return 0;
            return a < b ? -1 : 1;
        })
        .join(',');
};

const initialState = {
    merchants: {},
    countries: {},
    loading: false,
};

const useMerchantCountryLookup = (merchantIds = []) => {
    const [state, setState] = useState(initialState);

    const idsKey = useMemo(() => sortAndSerializeIds(merchantIds), [merchantIds]);

    useEffect(() => {
        const ids = idsKey ? idsKey.split(',') : [];

        if (!ids.length) {
            setState((prev) => ({
                ...prev,
                loading: false,
            }));
            return;
        }

        let isActive = true;

        setState((prev) => ({
            ...prev,
            loading: true,
        }));

        fetchMerchantLookups(ids)
            .then((result) => {
                if (!isActive || !result) return;

                setState((prev) => ({
                    loading: false,
                    merchants: { ...prev.merchants, ...result.merchants },
                    countries: { ...prev.countries, ...result.countries },
                }));
            })
            .catch(() => {
                if (!isActive) return;
                setState((prev) => ({
                    ...prev,
                    loading: false,
                }));
            });

        return () => {
            isActive = false;
        };
    }, [idsKey]);

    const getMerchantRecord = useCallback((merchantId) => {
        if (merchantId === null || merchantId === undefined) {
            return null;
        }

        return state.merchants[merchantId] ?? null;
    }, [state.merchants]);

    const getMerchantName = useCallback((merchantId) => {
        const record = getMerchantRecord(merchantId);
        return record?.name ?? '';
    }, [getMerchantRecord]);

    const getCountryName = useCallback((countryId, merchantId) => {
        if (merchantId !== null && merchantId !== undefined) {
            const record = getMerchantRecord(merchantId);
            if (record?.countryName) {
                return record.countryName;
            }
        }

        if (countryId === null || countryId === undefined) {
            return '';
        }

        return state.countries[countryId] ?? '';
    }, [getMerchantRecord, state.countries]);

    return {
        loading: state.loading,
        merchants: state.merchants,
        countries: state.countries,
        getMerchantRecord,
        getMerchantName,
        getCountryName,
    };
};

export default useMerchantCountryLookup;


import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchMerchantCountryInfo } from '../services/adminMerchantLookupService';

const cache = new Map();

const serializeIds = (ids = []) => {
    if (!Array.isArray(ids) || ids.length === 0) {
        return '';
    }

    return Array.from(
        new Set(
            ids
                .filter((id) => id !== null && id !== undefined && id !== '')
                .map((id) => String(id))
        )
    )
        .sort((a, b) => {
            if (a === b) return 0;
            return a < b ? -1 : 1;
        })
        .join(',');
};

const buildRecordsFromCache = (ids = []) => {
    return ids.reduce((acc, id) => {
        const key = String(id);
        if (cache.has(key)) {
            acc[key] = cache.get(key);
        }
        return acc;
    }, {});
};

const useMerchantCountryInfo = (shopIds = []) => {
    const [state, setState] = useState({
        loading: false,
        records: {},
        pending: [],
    });

    const idsKey = useMemo(() => serializeIds(shopIds), [shopIds]);

    useEffect(() => {
        const ids = idsKey ? idsKey.split(',') : [];

        if (!ids.length) {
            setState({
                loading: false,
                records: {},
                pending: [],
            });
            return;
        }

        const cachedRecords = buildRecordsFromCache(ids);
        const missingIds = ids.filter((id) => !cache.has(id));

        setState({
            loading: missingIds.length > 0,
            records: cachedRecords,
            pending: missingIds,
        });

        if (!missingIds.length) {
            return;
        }

        let isActive = true;

        fetchMerchantCountryInfo(missingIds)
            .then((result) => {
                if (!isActive || !result) return;

                Object.entries(result).forEach(([id, record]) => {
                    cache.set(String(id), {
                        name: record?.name || '',
                        countryName: record?.countryName || '',
                    });
                });

                setState({
                    loading: false,
                    records: buildRecordsFromCache(ids),
                    pending: [],
                });
            })
            .catch(() => {
                if (!isActive) return;
                setState((prev) => ({
                    ...prev,
                    loading: false,
                    pending: [],
                }));
            });

        return () => {
            isActive = false;
        };
    }, [idsKey]);

    const getMerchantInfoById = useCallback((shopId) => {
        if (shopId === null || shopId === undefined || shopId === '') {
            return null;
        }

        const key = String(shopId);
        if (cache.has(key)) {
            return cache.get(key);
        }

        return state.records[key] ?? null;
    }, [state.records]);

    const hasPendingRequest = useCallback(
        (shopId) => {
            if (shopId === null || shopId === undefined || shopId === '') {
                return false;
            }

            const key = String(shopId);
            if (cache.has(key)) {
                return false;
            }

            return state.pending.includes(key);
        },
        [state.pending]
    );

    return {
        loading: state.loading,
        getMerchantInfoById,
        hasPendingRequest,
    };
};

export default useMerchantCountryInfo;


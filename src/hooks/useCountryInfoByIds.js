import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchCountryRecordsByIds } from '../services/countryLookupService';

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

/**
 * Resolve country display names (and codes) by UUID from Auth `GET /countries`,
 * using the same batch + cache pattern as `useMerchantCountryInfo`.
 *
 * @param {string[]} countryIds — typically derived from table rows (e.g. product.country_id)
 */
const useCountryInfoByIds = (countryIds = []) => {
    const [state, setState] = useState({
        loading: false,
        records: {},
        pending: [],
    });

    const idsKey = useMemo(() => serializeIds(countryIds), [countryIds]);

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

        fetchCountryRecordsByIds(missingIds)
            .then((result) => {
                if (!isActive || !result) return;

                Object.entries(result).forEach(([id, record]) => {
                    cache.set(String(id), {
                        name: record?.name || '',
                        code: record?.code || '',
                        short_name: record?.short_name || '',
                    });
                });
                // Avoid refetch loops when Auth has no row for a UUID
                missingIds.forEach((id) => {
                    const key = String(id);
                    if (!cache.has(key)) {
                        cache.set(key, { name: '', code: '', short_name: '' });
                    }
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

    const getCountryById = useCallback(
        (countryId) => {
            if (countryId === null || countryId === undefined || countryId === '') {
                return null;
            }

            const key = String(countryId);
            if (cache.has(key)) {
                return cache.get(key);
            }

            return state.records[key] ?? null;
        },
        [state.records]
    );

    const hasPendingRequest = useCallback(
        (countryId) => {
            if (countryId === null || countryId === undefined || countryId === '') {
                return false;
            }

            const key = String(countryId);
            if (cache.has(key)) {
                return false;
            }

            return state.pending.includes(key);
        },
        [state.pending]
    );

    return {
        loading: state.loading,
        getCountryById,
        hasPendingRequest,
    };
};

export default useCountryInfoByIds;

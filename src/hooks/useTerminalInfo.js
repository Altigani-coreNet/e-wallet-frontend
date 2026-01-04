import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchTerminalInfoByIds } from '../services/terminalLookupService';

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
        .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
        .join(',');
};

const buildRecordsFromCache = (ids = []) =>
    ids.reduce((acc, id) => {
        const key = String(id);
        if (cache.has(key)) {
            acc[key] = cache.get(key);
        }
        return acc;
    }, {});

const useTerminalInfo = (terminalIds = []) => {
    const [state, setState] = useState({
        loading: false,
        records: {},
        pending: [],
    });

    const idsKey = useMemo(() => serializeIds(terminalIds), [terminalIds]);

    useEffect(() => {
        const ids = idsKey ? idsKey.split(',') : [];

        if (!ids.length) {
            setState({ loading: false, records: {}, pending: [] });
            return;
        }

        const cachedRecords = buildRecordsFromCache(ids);
        const missingIds = ids.filter((id) => !cache.has(id));

        setState({
            loading: missingIds.length > 0,
            records: cachedRecords,
            pending: missingIds,
        });

        if (!missingIds.length) return;

        let isActive = true;

        fetchTerminalInfoByIds(missingIds)
            .then((result) => {
                if (!isActive || !result) return;

                Object.entries(result).forEach(([id, record]) => {
                    cache.set(String(id), {
                        name: record?.name || '',
                        terminal_id: record?.terminal_id || '',
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
                setState((prev) => ({ ...prev, loading: false, pending: [] }));
            });

        return () => {
            isActive = false;
        };
    }, [idsKey]);

    const getTerminalInfoById = useCallback(
        (terminalId) => {
            if (terminalId === null || terminalId === undefined || terminalId === '') {
                return null;
            }

            const key = String(terminalId);
            if (cache.has(key)) {
                return cache.get(key);
            }

            return state.records[key] ?? null;
        },
        [state.records]
    );

    const hasPendingRequest = useCallback(
        (terminalId) => {
            if (terminalId === null || terminalId === undefined || terminalId === '') {
                return false;
            }

            const key = String(terminalId);
            if (cache.has(key)) {
                return false;
            }

            return state.pending.includes(key);
        },
        [state.pending]
    );

    return {
        loading: state.loading,
        getTerminalInfoById,
        hasPendingRequest,
    };
};

export default useTerminalInfo;


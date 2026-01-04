import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchUserInfo, fetchTerminalInfo } from '../services/adminUserTerminalLookupService';

// Cache for user info
const userCache = new Map();

// Cache for terminal info
const terminalCache = new Map();

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

const buildUserRecordsFromCache = (ids = []) => {
    return ids.reduce((acc, id) => {
        const key = String(id);
        if (userCache.has(key)) {
            acc[key] = userCache.get(key);
        }
        return acc;
    }, {});
};

const buildTerminalRecordsFromCache = (ids = []) => {
    return ids.reduce((acc, id) => {
        const key = String(id);
        if (terminalCache.has(key)) {
            acc[key] = terminalCache.get(key);
        }
        return acc;
    }, {});
};

export const useUserTerminalInfo = (userIds = [], terminalIds = []) => {
    const [userState, setUserState] = useState({
        loading: false,
        records: {},
        pending: [],
    });

    const [terminalState, setTerminalState] = useState({
        loading: false,
        records: {},
        pending: [],
    });

    const userIdsKey = useMemo(() => serializeIds(userIds), [userIds]);
    const terminalIdsKey = useMemo(() => serializeIds(terminalIds), [terminalIds]);

    // Fetch user info
    useEffect(() => {
        const ids = userIdsKey ? userIdsKey.split(',') : [];

        if (!ids.length) {
            setUserState({
                loading: false,
                records: {},
                pending: [],
            });
            return;
        }

        const cachedRecords = buildUserRecordsFromCache(ids);
        const missingIds = ids.filter((id) => !userCache.has(id));

        setUserState({
            loading: missingIds.length > 0,
            records: cachedRecords,
            pending: missingIds,
        });

        if (!missingIds.length) {
            return;
        }

        let isActive = true;

        fetchUserInfo(missingIds)
            .then((result) => {
                if (!isActive || !result) return;

                Object.entries(result).forEach(([id, record]) => {
                    userCache.set(String(id), record);
                });

                setUserState({
                    loading: false,
                    records: buildUserRecordsFromCache(ids),
                    pending: [],
                });
            })
            .catch(() => {
                if (!isActive) return;
                setUserState((prev) => ({
                    ...prev,
                    loading: false,
                    pending: [],
                }));
            });

        return () => {
            isActive = false;
        };
    }, [userIdsKey]);

    // Fetch terminal info
    useEffect(() => {
        const ids = terminalIdsKey ? terminalIdsKey.split(',') : [];

        if (!ids.length) {
            setTerminalState({
                loading: false,
                records: {},
                pending: [],
            });
            return;
        }

        const cachedRecords = buildTerminalRecordsFromCache(ids);
        const missingIds = ids.filter((id) => !terminalCache.has(id));

        setTerminalState({
            loading: missingIds.length > 0,
            records: cachedRecords,
            pending: missingIds,
        });

        if (!missingIds.length) {
            return;
        }

        let isActive = true;

        fetchTerminalInfo(missingIds)
            .then((result) => {
                if (!isActive || !result) return;

                Object.entries(result).forEach(([id, record]) => {
                    terminalCache.set(String(id), record);
                });

                setTerminalState({
                    loading: false,
                    records: buildTerminalRecordsFromCache(ids),
                    pending: [],
                });
            })
            .catch(() => {
                if (!isActive) return;
                setTerminalState((prev) => ({
                    ...prev,
                    loading: false,
                    pending: [],
                }));
            });

        return () => {
            isActive = false;
        };
    }, [terminalIdsKey]);

    const getUserInfoById = useCallback(
        (userId) => {
            if (userId === null || userId === undefined || userId === '') {
                return null;
            }

            const key = String(userId);
            if (userCache.has(key)) {
                return userCache.get(key);
            }

            return userState.records[key] ?? null;
        },
        [userState.records]
    );

    const getTerminalInfoById = useCallback(
        (terminalId) => {
            if (terminalId === null || terminalId === undefined || terminalId === '') {
                return null;
            }

            const key = String(terminalId);
            if (terminalCache.has(key)) {
                return terminalCache.get(key);
            }

            return terminalState.records[key] ?? null;
        },
        [terminalState.records]
    );

    const hasPendingUserRequest = useCallback(
        (userId) => {
            if (userId === null || userId === undefined || userId === '') {
                return false;
            }

            const key = String(userId);
            if (userCache.has(key)) {
                return false;
            }

            return userState.pending.includes(key);
        },
        [userState.pending]
    );

    const hasPendingTerminalRequest = useCallback(
        (terminalId) => {
            if (terminalId === null || terminalId === undefined || terminalId === '') {
                return false;
            }

            const key = String(terminalId);
            if (terminalCache.has(key)) {
                return false;
            }

            return terminalState.pending.includes(key);
        },
        [terminalState.pending]
    );

    return {
        userLoading: userState.loading,
        terminalLoading: terminalState.loading,
        getUserInfoById,
        getTerminalInfoById,
        hasPendingUserRequest,
        hasPendingTerminalRequest,
    };
};

export default useUserTerminalInfo;


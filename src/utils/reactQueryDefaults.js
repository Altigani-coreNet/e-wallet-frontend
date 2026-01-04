const ONE_MINUTE = 60 * 1000;
const FIVE_MINUTES = 5 * ONE_MINUTE;
const TEN_MINUTES = 10 * ONE_MINUTE;
const THIRTY_MINUTES = 30 * ONE_MINUTE;

export const LIST_QUERY_DEFAULTS = Object.freeze({
    staleTime: ONE_MINUTE,
    cacheTime: FIVE_MINUTES,
    keepPreviousData: true,
});

export const DETAIL_QUERY_DEFAULTS = Object.freeze({
    staleTime: FIVE_MINUTES,
    cacheTime: THIRTY_MINUTES,
});

export const REPORT_QUERY_DEFAULTS = Object.freeze({
    staleTime: ONE_MINUTE,
    cacheTime: TEN_MINUTES,
    keepPreviousData: true,
});



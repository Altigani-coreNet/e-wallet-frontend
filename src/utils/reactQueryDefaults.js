import { keepPreviousData } from '@tanstack/react-query';

const ONE_MINUTE = 60 * 1000;
const FIVE_MINUTES = 5 * ONE_MINUTE;
const TEN_MINUTES = 10 * ONE_MINUTE;
const THIRTY_MINUTES = 30 * ONE_MINUTE;

export const LIST_QUERY_DEFAULTS = Object.freeze({
    staleTime: ONE_MINUTE,
    gcTime: FIVE_MINUTES,
    placeholderData: keepPreviousData,
});

export const DETAIL_QUERY_DEFAULTS = Object.freeze({
    staleTime: FIVE_MINUTES,
    gcTime: THIRTY_MINUTES,
});

export const REPORT_QUERY_DEFAULTS = Object.freeze({
    staleTime: ONE_MINUTE,
    gcTime: TEN_MINUTES,
    placeholderData: keepPreviousData,
});



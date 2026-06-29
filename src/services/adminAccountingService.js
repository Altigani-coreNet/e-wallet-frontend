import axios from 'axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ADMIN_ENDPOINTS } from '../utils/constants';
import { get, getToken } from '../utils/api';
import { LIST_QUERY_DEFAULTS, REPORT_QUERY_DEFAULTS } from '../utils/reactQueryDefaults';

const authHeaders = (accept = 'application/json') => ({
    Authorization: `Bearer ${getToken()}`,
    Accept: accept,
});

const unwrap = (response) => {
    const body = response.data ?? {};
    return body.data ?? body;
};

const cleanQueryParams = (params = {}) =>
    Object.fromEntries(
        Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '')
    );

const normalizeChartOfAccountsPayload = (payload) => {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
        throw new Error('Invalid chart of accounts response');
    }

    if (payload.status === false) {
        throw new Error(payload.message || 'Failed to load chart of accounts');
    }

    if (payload.message && !payload.groups && !payload.summary) {
        throw new Error(payload.message);
    }

    return {
        ...payload,
        summary: payload.summary ?? {},
        groups: Array.isArray(payload.groups) ? payload.groups : [],
    };
};

export const fetchChartOfAccounts = async (params = {}) => {
    const response = await get(ADMIN_ENDPOINTS.ACCOUNTING_CHART_OF_ACCOUNTS, {
        params: cleanQueryParams(params),
        headers: authHeaders(),
    });

    return normalizeChartOfAccountsPayload(unwrap(response));
};

export const fetchChartOfAccount = async (id, params = {}) => {
    const response = await axios.get(ADMIN_ENDPOINTS.ACCOUNTING_CHART_OF_ACCOUNT_DETAILS(id), {
        params,
        headers: authHeaders(),
    });
    return unwrap(response);
};

export const fetchAccountTypes = async () => {
    const response = await axios.get(ADMIN_ENDPOINTS.ACCOUNTING_ACCOUNT_TYPES, {
        headers: authHeaders(),
    });
    return unwrap(response);
};

export const fetchNextAccountCode = async (typeId) => {
    const response = await axios.get(ADMIN_ENDPOINTS.ACCOUNTING_CHART_OF_ACCOUNTS_NEXT_CODE, {
        params: typeId ? { type_id: typeId } : {},
        headers: authHeaders(),
    });
    return unwrap(response);
};

export const createChartOfAccount = async (payload) => {
    const response = await axios.post(ADMIN_ENDPOINTS.ACCOUNTING_CHART_OF_ACCOUNTS, payload, {
        headers: authHeaders(),
    });
    return unwrap(response);
};

export const updateChartOfAccount = async ({ id, ...payload }) => {
    const response = await axios.put(ADMIN_ENDPOINTS.ACCOUNTING_CHART_OF_ACCOUNT_DETAILS(id), payload, {
        headers: authHeaders(),
    });
    return unwrap(response);
};

export const deleteChartOfAccount = async (id) => {
    const response = await axios.delete(ADMIN_ENDPOINTS.ACCOUNTING_CHART_OF_ACCOUNT_DETAILS(id), {
        headers: authHeaders(),
    });
    return unwrap(response);
};

export const importChartOfAccounts = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axios.post(ADMIN_ENDPOINTS.ACCOUNTING_CHART_OF_ACCOUNTS_IMPORT, formData, {
        headers: {
            ...authHeaders(),
            'Content-Type': 'multipart/form-data',
        },
    });
    return unwrap(response);
};

export const downloadChartOfAccountsExport = async (params = {}) => {
    const response = await axios.get(ADMIN_ENDPOINTS.ACCOUNTING_CHART_OF_ACCOUNTS_EXPORT, {
        params,
        headers: authHeaders('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'),
        responseType: 'blob',
    });
    return response.data;
};

export const downloadChartOfAccountsSample = async () => {
    const response = await axios.get(ADMIN_ENDPOINTS.ACCOUNTING_CHART_OF_ACCOUNTS_SAMPLE, {
        headers: authHeaders('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'),
        responseType: 'blob',
    });
    return response.data;
};

export const fetchLedgerSummary = async (params = {}) => {
    const response = await axios.get(ADMIN_ENDPOINTS.ACCOUNTING_LEDGER, {
        params: cleanQueryParams(params),
        headers: authHeaders(),
    });
    return unwrap(response);
};

export const fetchLedgerCustomers = async () => {
    const response = await axios.get(ADMIN_ENDPOINTS.ACCOUNTING_LEDGER_CUSTOMERS, {
        headers: authHeaders(),
    });
    return unwrap(response);
};

export const downloadLedgerExport = async (params = {}) => {
    const response = await axios.get(ADMIN_ENDPOINTS.ACCOUNTING_LEDGER_EXPORT, {
        params: cleanQueryParams(params),
        headers: authHeaders('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'),
        responseType: 'blob',
    });
    return response.data;
};

export const fetchBalanceSheet = async (params = {}) => {
    const response = await axios.get(ADMIN_ENDPOINTS.ACCOUNTING_BALANCE_SHEET, {
        params: cleanQueryParams(params),
        headers: authHeaders(),
    });
    return unwrap(response);
};

export const downloadBalanceSheetExport = async (params = {}) => {
    const response = await axios.get(ADMIN_ENDPOINTS.ACCOUNTING_BALANCE_SHEET_EXPORT, {
        params: cleanQueryParams(params),
        headers: authHeaders('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'),
        responseType: 'blob',
    });
    return response.data;
};

export const fetchProfitAndLoss = async (params = {}) => {
    const response = await axios.get(ADMIN_ENDPOINTS.ACCOUNTING_PROFIT_LOSS, {
        params,
        headers: authHeaders(),
    });
    return unwrap(response);
};

export const fetchTrialBalance = async (params = {}) => {
    const response = await axios.get(ADMIN_ENDPOINTS.ACCOUNTING_TRIAL_BALANCE, {
        params,
        headers: authHeaders(),
    });
    return unwrap(response);
};

export const adminAccountingKeys = {
    base: ['admin-accounting'],
    chartOfAccounts: (params) => ['admin-accounting', 'chart-of-accounts', params],
    chartOfAccount: (id, params) => ['admin-accounting', 'chart-of-account', id, params],
    accountTypes: ['admin-accounting', 'account-types'],
    ledger: (params) => ['admin-accounting', 'ledger', params],
    ledgerCustomers: ['admin-accounting', 'ledger-customers'],
    balanceSheet: (params) => ['admin-accounting', 'balance-sheet', params],
    profitLoss: (params) => ['admin-accounting', 'profit-loss', params],
    trialBalance: (params) => ['admin-accounting', 'trial-balance', params],
};

export const useChartOfAccounts = (params = {}, options = {}) => {
    const cleanedParams = cleanQueryParams(params);
    const hasToken = Boolean(getToken());
    const { enabled: enabledOption, ...restOptions } = options;

    return useQuery({
        queryKey: adminAccountingKeys.chartOfAccounts(cleanedParams),
        queryFn: () => fetchChartOfAccounts(cleanedParams),
        ...LIST_QUERY_DEFAULTS,
        ...restOptions,
        enabled: hasToken && (enabledOption !== undefined ? enabledOption : true),
    });
};

export const useAccountTypes = (options = {}) =>
    useQuery({
        queryKey: adminAccountingKeys.accountTypes,
        queryFn: fetchAccountTypes,
        staleTime: 5 * 60 * 1000,
        ...options,
    });

export const useLedgerSummary = (params = {}, options = {}) => {
    const cleanedParams = cleanQueryParams(params);
    const hasToken = Boolean(getToken());
    const { enabled: enabledOption, ...restOptions } = options;

    return useQuery({
        queryKey: adminAccountingKeys.ledger(cleanedParams),
        queryFn: () => fetchLedgerSummary(cleanedParams),
        ...REPORT_QUERY_DEFAULTS,
        ...restOptions,
        enabled: hasToken && (enabledOption !== undefined ? enabledOption : true),
    });
};

export const useLedgerCustomers = (options = {}) =>
    useQuery({
        queryKey: adminAccountingKeys.ledgerCustomers,
        queryFn: fetchLedgerCustomers,
        staleTime: 5 * 60 * 1000,
        ...options,
    });

export const useBalanceSheet = (params = {}, options = {}) => {
    const cleanedParams = cleanQueryParams(params);
    const hasToken = Boolean(getToken());
    const { enabled: enabledOption, ...restOptions } = options;

    return useQuery({
        queryKey: adminAccountingKeys.balanceSheet(cleanedParams),
        queryFn: () => fetchBalanceSheet(cleanedParams),
        ...REPORT_QUERY_DEFAULTS,
        ...restOptions,
        enabled: hasToken && (enabledOption !== undefined ? enabledOption : true),
    });
};

export const useProfitAndLoss = (params = {}, options = {}) =>
    useQuery({
        queryKey: adminAccountingKeys.profitLoss(params),
        queryFn: () => fetchProfitAndLoss(params),
        ...REPORT_QUERY_DEFAULTS,
        ...options,
    });

export const useChartOfAccountMutations = () => {
    const queryClient = useQueryClient();

    const invalidate = () =>
        queryClient.invalidateQueries({ queryKey: adminAccountingKeys.base });

    const createMutation = useMutation({
        mutationFn: createChartOfAccount,
        onSuccess: invalidate,
    });

    const updateMutation = useMutation({
        mutationFn: updateChartOfAccount,
        onSuccess: invalidate,
    });

    const deleteMutation = useMutation({
        mutationFn: deleteChartOfAccount,
        onSuccess: invalidate,
    });

    const importMutation = useMutation({
        mutationFn: importChartOfAccounts,
        onSuccess: invalidate,
    });

    return { createMutation, updateMutation, deleteMutation, importMutation };
};

export const triggerBlobDownload = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
};

export const fmtMoney = (value) => {
    const num = Number(value ?? 0);
    return new Intl.NumberFormat(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(num);
};

export const fmtCompact = (value) => {
    const num = Number(value ?? 0);
    if (Math.abs(num) >= 1_000_000) {
        return `${(num / 1_000_000).toFixed(1)}M`;
    }
    if (Math.abs(num) >= 1_000) {
        return `${(num / 1_000).toFixed(1)}K`;
    }
    return fmtMoney(num);
};

export const TYPE_CONFIG = {
    asset: { label: 'Assets', color: 'text-primary', bg: 'bg-light-primary', icon: 'ki-chart-line-up' },
    liability: { label: 'Liabilities', color: 'text-danger', bg: 'bg-light-danger', icon: 'ki-chart-line-down' },
    equity: { label: 'Equity', color: 'text-info', bg: 'bg-light-info', icon: 'ki-chart-pie-simple' },
    income: { label: 'Income', color: 'text-success', bg: 'bg-light-success', icon: 'ki-dollar' },
    cogs: { label: 'COGS', color: 'text-warning', bg: 'bg-light-warning', icon: 'ki-basket' },
    expense: { label: 'Expenses', color: 'text-gray-700', bg: 'bg-light', icon: 'ki-wallet' },
};

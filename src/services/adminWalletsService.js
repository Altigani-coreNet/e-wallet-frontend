import axios from 'axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ADMIN_ENDPOINTS } from '../utils/constants';
import { getToken } from '../utils/api';
import { LIST_QUERY_DEFAULTS } from '../utils/reactQueryDefaults';
import AdminWalletModel, {
    mapAdminWalletsPaginated,
    mapAdminWalletAction,
    WALLET_STATUSES,
    WALLET_TYPES,
    WALLET_TRANSACTION_TYPES,
    WALLET_DIRECTIONS,
    isMasterWallet,
} from '../models/AdminWalletModel';
import AdminWalletTransactionModel, {
    mapAdminWalletTransactionsPaginated,
    AdminWalletTransactionDetailModel,
} from '../models/AdminWalletTransactionModel';
import AdminWalletMoneyOperationModel, {
    AdminOpeningCapitalModel,
} from '../models/AdminWalletMoneyOperationModel';

export {
    WALLET_STATUSES,
    WALLET_TYPES,
    WALLET_TRANSACTION_TYPES,
    WALLET_DIRECTIONS,
    isMasterWallet,
};

export { fmtMoney } from '../utils/walletMoney';

const authHeaders = (accept = 'application/json') => ({
    Authorization: `Bearer ${getToken()}`,
    Accept: accept,
});

const cleanQueryParams = (params = {}) =>
    Object.fromEntries(
        Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '')
    );

const unwrap = (response) => {
    const body = response.data ?? {};
    return body.data ?? body;
};

export const fetchAdminWallets = async (params = {}) => {
    const response = await axios.get(ADMIN_ENDPOINTS.WALLETS, {
        params: cleanQueryParams(params),
        headers: authHeaders(),
    });
    return mapAdminWalletsPaginated(unwrap(response));
};

export const fetchAdminWallet = async (walletId) => {
    const response = await axios.get(ADMIN_ENDPOINTS.WALLET_DETAILS(walletId), {
        headers: authHeaders(),
    });
    return AdminWalletModel.fromApi(unwrap(response));
};

export const fetchWalletTransactions = async (walletId, params = {}) => {
    const response = await axios.get(ADMIN_ENDPOINTS.WALLET_TRANSACTIONS(walletId), {
        params: cleanQueryParams(params),
        headers: authHeaders(),
    });
    return mapAdminWalletTransactionsPaginated(unwrap(response));
};

export const fetchAllWalletTransactions = async (params = {}) => {
    const response = await axios.get(ADMIN_ENDPOINTS.WALLET_TRANSACTIONS_ALL, {
        params: cleanQueryParams(params),
        headers: authHeaders(),
    });
    return mapAdminWalletTransactionsPaginated(unwrap(response));
};

export const fetchWalletTransaction = async (transactionId) => {
    const response = await axios.get(ADMIN_ENDPOINTS.WALLET_TRANSACTION_DETAILS(transactionId), {
        headers: authHeaders(),
    });
    return AdminWalletTransactionDetailModel.fromApi(unwrap(response));
};

export const suspendWallet = async (walletId) => {
    const response = await axios.post(ADMIN_ENDPOINTS.WALLET_SUSPEND(walletId), {}, {
        headers: authHeaders(),
    });
    return mapAdminWalletAction(unwrap(response));
};

export const activateWallet = async (walletId) => {
    const response = await axios.post(ADMIN_ENDPOINTS.WALLET_ACTIVATE(walletId), {}, {
        headers: authHeaders(),
    });
    return mapAdminWalletAction(unwrap(response));
};

export const deleteWallet = async (walletId) => {
    const response = await axios.delete(ADMIN_ENDPOINTS.WALLET_DELETE(walletId), {
        headers: authHeaders(),
    });
    return mapAdminWalletAction(unwrap(response));
};

export const downloadWalletsExport = async (params = {}) => {
    const response = await axios.get(ADMIN_ENDPOINTS.WALLETS_EXPORT, {
        params: cleanQueryParams(params),
        headers: authHeaders('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'),
        responseType: 'blob',
    });
    return response.data;
};

export const downloadWalletTransactionsExport = async (params = {}) => {
    const response = await axios.get(ADMIN_ENDPOINTS.WALLET_TRANSACTIONS_ALL_EXPORT, {
        params: cleanQueryParams(params),
        headers: authHeaders('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'),
        responseType: 'blob',
    });
    return response.data;
};

export const cashInWallet = async (walletId, payload, idempotencyKey) => {
    const headers = authHeaders();
    if (idempotencyKey) {
        headers['Idempotency-Key'] = idempotencyKey;
    }
    const response = await axios.post(ADMIN_ENDPOINTS.WALLET_CASH_IN(walletId), payload, { headers });
    return AdminWalletMoneyOperationModel.fromApi(unwrap(response));
};

export const cashOutWallet = async (walletId, payload, idempotencyKey) => {
    const headers = authHeaders();
    if (idempotencyKey) {
        headers['Idempotency-Key'] = idempotencyKey;
    }
    const response = await axios.post(ADMIN_ENDPOINTS.WALLET_CASH_OUT(walletId), payload, { headers });
    return AdminWalletMoneyOperationModel.fromApi(unwrap(response));
};

export const recordOpeningCapital = async (payload, idempotencyKey) => {
    const headers = authHeaders();
    if (idempotencyKey) {
        headers['Idempotency-Key'] = idempotencyKey;
    }
    const response = await axios.post(ADMIN_ENDPOINTS.WALLET_OPENING_CAPITAL, payload, { headers });
    return AdminOpeningCapitalModel.fromApi(unwrap(response));
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

export const adminWalletsKeys = {
    all: ['admin', 'wallets'],
    list: (params) => ['admin', 'wallets', 'list', params],
    detail: (id) => ['admin', 'wallets', 'detail', id],
    transactions: (walletId, params) => ['admin', 'wallets', walletId, 'transactions', params],
    allTransactions: (params) => ['admin', 'wallets', 'all-transactions', params],
    transactionDetail: (id) => ['admin', 'wallets', 'transaction', id],
};

export const useAdminWallets = (params = {}, options = {}) => {
    const cleanedParams = cleanQueryParams(params);
    return useQuery({
        queryKey: adminWalletsKeys.list(cleanedParams),
        queryFn: () => fetchAdminWallets(cleanedParams),
        ...LIST_QUERY_DEFAULTS,
        ...options,
    });
};

export const useAdminWallet = (walletId, options = {}) => {
    return useQuery({
        queryKey: adminWalletsKeys.detail(walletId),
        queryFn: () => fetchAdminWallet(walletId),
        enabled: Boolean(walletId),
        ...LIST_QUERY_DEFAULTS,
        ...options,
    });
};

export const useWalletTransactions = (walletId, params = {}, options = {}) => {
    const cleanedParams = cleanQueryParams(params);
    return useQuery({
        queryKey: adminWalletsKeys.transactions(walletId, cleanedParams),
        queryFn: () => fetchWalletTransactions(walletId, cleanedParams),
        enabled: Boolean(walletId),
        ...LIST_QUERY_DEFAULTS,
        ...options,
    });
};

export const useAllWalletTransactions = (params = {}, options = {}) => {
    const cleanedParams = cleanQueryParams(params);
    return useQuery({
        queryKey: adminWalletsKeys.allTransactions(cleanedParams),
        queryFn: () => fetchAllWalletTransactions(cleanedParams),
        ...LIST_QUERY_DEFAULTS,
        ...options,
    });
};

export const useWalletTransaction = (transactionId, options = {}) => {
    return useQuery({
        queryKey: adminWalletsKeys.transactionDetail(transactionId),
        queryFn: () => fetchWalletTransaction(transactionId),
        enabled: Boolean(transactionId),
        ...LIST_QUERY_DEFAULTS,
        ...options,
    });
};

export const useWalletMutations = () => {
    const queryClient = useQueryClient();

    const invalidate = () => {
        queryClient.invalidateQueries({ queryKey: adminWalletsKeys.all });
    };

    const suspendMutation = useMutation({
        mutationFn: suspendWallet,
        onSuccess: invalidate,
    });

    const activateMutation = useMutation({
        mutationFn: activateWallet,
        onSuccess: invalidate,
    });

    const deleteMutation = useMutation({
        mutationFn: deleteWallet,
        onSuccess: invalidate,
    });

    const cashInMutation = useMutation({
        mutationFn: ({ walletId, payload, idempotencyKey }) =>
            cashInWallet(walletId, payload, idempotencyKey),
        onSuccess: invalidate,
    });

    const cashOutMutation = useMutation({
        mutationFn: ({ walletId, payload, idempotencyKey }) =>
            cashOutWallet(walletId, payload, idempotencyKey),
        onSuccess: invalidate,
    });

    const openingCapitalMutation = useMutation({
        mutationFn: ({ payload, idempotencyKey }) =>
            recordOpeningCapital(payload, idempotencyKey),
        onSuccess: invalidate,
    });

    return {
        suspendMutation,
        activateMutation,
        deleteMutation,
        cashInMutation,
        cashOutMutation,
        openingCapitalMutation,
    };
};

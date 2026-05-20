import axios from 'axios';
import { ADMIN_ENDPOINTS } from '../utils/constants';
import { getToken } from '../utils/api';
import AdminTransactionModel, {
    AdminTransactionDetailModel,
    AdminTransactionStatisticsModel,
} from './AdminTransactionModel';

const getApiToken = () => getToken();

const stripEmptyParams = (params) => {
    const cleaned = { ...params };
    Object.keys(cleaned).forEach((key) => {
        const value = cleaned[key];
        if (value === '' || value === null || value === undefined) {
            delete cleaned[key];
        }
    });
    return cleaned;
};

/**
 * Fetch paginated admin transactions (AdminTransactionResource).
 */
export const fetchAdminTransactions = async ({ page, perPage, filters = {}, type = null }) => {
    const token = getApiToken();

    const params = stripEmptyParams({
        page,
        per_page: perPage,
        ...filters,
        ...(type ? { type } : {}),
    });

    const response = await axios.get(ADMIN_ENDPOINTS.TRANSACTIONS, {
        params,
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
        },
    });

    const paginated = response.data?.data ?? response.data ?? {};
    const rows = AdminTransactionModel.fromApiResponseArray(paginated.data ?? []);

    return {
        data: rows,
        current_page: paginated.current_page ?? page,
        per_page: paginated.per_page ?? perPage,
        total: paginated.total ?? 0,
        last_page: paginated.last_page ?? 1,
    };
};

/**
 * Fetch admin transaction statistics cards.
 */
export const fetchAdminTransactionStatistics = async (filters = {}) => {
    const token = getApiToken();

    const params = stripEmptyParams({
        merchant_id: filters.merchant_id,
        date_from: filters.start_date ?? filters.date_from,
        date_to: filters.end_date ?? filters.date_to,
        type: filters.type,
    });

    const response = await axios.get(ADMIN_ENDPOINTS.TRANSACTION_STATISTICS, {
        params,
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
        },
    });

    const payload = response.data?.data ?? response.data;
    return AdminTransactionStatisticsModel.fromApiResponse(payload);
};

/**
 * Export admin transactions - server-side export
 */
export const exportAdminTransactions = async (filters) => {
    const token = getApiToken();
    const params = new URLSearchParams(stripEmptyParams(filters)).toString();

    const response = await axios.get(`${ADMIN_ENDPOINTS.TRANSACTION_EXPORT}?${params}`, {
        responseType: 'blob',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    return response.data;
};

/**
 * Fetch admin transaction details
 */
export const fetchAdminTransactionDetails = async (transactionId) => {
    const token = getApiToken();

    const response = await axios.get(ADMIN_ENDPOINTS.TRANSACTION_DETAILS(transactionId), {
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
        },
    });

    const payload = response.data?.data ?? response.data;
    return AdminTransactionDetailModel.fromApiResponse(payload);
};

export const sendAdminTransactionReceipt = async (transactionId, { email, message }) => {
    const token = getApiToken();
    const response = await axios.post(
        ADMIN_ENDPOINTS.TRANSACTION_SEND_RECEIPT(transactionId),
        { email, message },
        {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/json',
            },
        }
    );
    return response.data;
};

export const refundAdminTransaction = async (transactionId, { amount, reason }) => {
    const token = getApiToken();
    const response = await axios.post(
        ADMIN_ENDPOINTS.TRANSACTION_REFUND(transactionId),
        { amount, reason },
        {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/json',
            },
        }
    );
    return response.data;
};

export const voidAdminTransaction = async (transactionId, { reason }) => {
    const token = getApiToken();
    const response = await axios.post(
        ADMIN_ENDPOINTS.TRANSACTION_VOID(transactionId),
        { reason },
        {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/json',
            },
        }
    );
    return response.data;
};

/**
 * Bulk delete admin transactions
 */
export const bulkDeleteAdminTransactions = async (ids) => {
    const token = getApiToken();

    const response = await axios.post(
        ADMIN_ENDPOINTS.TRANSACTION_BULK_DELETE || `${ADMIN_ENDPOINTS.TRANSACTIONS}/bulk-delete`,
        { ids },
        {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/json',
            },
        }
    );

    return response.data;
};

import axios from 'axios';
import { SOFTPOS_ENDPOINTS } from '../utils/constants';
import { getToken } from '../utils/api';
import MerchantDashboardLatestTransactionModel from './MerchantDashboardLatestTransactionModel';

const buildDashboardParams = (filters = {}) => {
    const params = {};
    if (filters.datetime_from) params.datetime_from = filters.datetime_from;
    if (filters.datetime_to) params.datetime_to = filters.datetime_to;
    if (filters.transaction_status) params.transaction_status = filters.transaction_status;
    if (filters.limit) params.limit = filters.limit;
    return params;
};

/**
 * Fetch latest transactions from a single resource endpoint
 * and normalize rows through a frontend model.
 */
export const fetchMerchantDashboardLatestTransactions = async (filters = {}) => {
    const token = getToken();
    if (!token) {
        throw new Error('Authentication token not found');
    }

    const response = await axios.get(SOFTPOS_ENDPOINTS.DASHBOARD_LATEST_TRANSACTIONS, {
        params: buildDashboardParams(filters),
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
    });

    if (!response.data?.success) {
        throw new Error(response.data?.message || 'Failed to load transactions');
    }

    const payload = response.data?.data;
    const rows = Array.isArray(payload?.latestTransactions)
        ? payload.latestTransactions
        : Array.isArray(payload)
            ? payload
            : [];

    return MerchantDashboardLatestTransactionModel.fromApiResponseArray(rows);
};


import { apiClient } from '../utils/api';
import { ADMIN_ENDPOINTS } from '../utils/constants';

const extractData = (response) => response?.data?.data ?? response?.data ?? response;

const buildParams = (filters = {}) => {
    const params = {};

    if (filters.datetime_from) {
        params.datetime_from = filters.datetime_from;
    }

    if (filters.datetime_to) {
        params.datetime_to = filters.datetime_to;
    }

    if (filters.transaction_status) {
        params.transaction_status = filters.transaction_status;
    }

    if (filters.limit) {
        params.limit = filters.limit;
    }

    if (filters.period) {
        params.period = filters.period;
    }

    return params;
};

export const fetchAdminDashboardOverview = async (filters = {}) => {
    const response = await apiClient.get(ADMIN_ENDPOINTS.DASHBOARD_OVERVIEW, {
        params: buildParams(filters),
    });

    return extractData(response);
};

export const fetchAdminDashboardTerminalStatus = async (filters = {}) => {
    const response = await apiClient.get(ADMIN_ENDPOINTS.DASHBOARD_TERMINAL_STATUS, {
        params: buildParams(filters),
    });

    return extractData(response);
};

export const fetchAdminDashboardCharts = async (filters = {}) => {
    const response = await apiClient.get(ADMIN_ENDPOINTS.DASHBOARD_CHARTS, {
        params: buildParams(filters),
    });

    return extractData(response);
};

export const fetchAdminDashboardLatestTransactions = async (filters = {}) => {
    const response = await apiClient.get(ADMIN_ENDPOINTS.DASHBOARD_LATEST_TRANSACTIONS, {
        params: buildParams(filters),
    });

    return extractData(response);
};

export default {
    fetchAdminDashboardOverview,
    fetchAdminDashboardTerminalStatus,
    fetchAdminDashboardCharts,
    fetchAdminDashboardLatestTransactions,
};


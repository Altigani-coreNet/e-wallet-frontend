import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ADMIN_ENDPOINTS } from '../utils/constants';
import { getToken } from '../utils/api';

const DEFAULT_STALE_MS = 10 * 60 * 1000; // 10 minutes

const useAdminMerchantFullDetails = (merchantId, { enabled = true, toastOnError = true } = {}) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [updatedAt, setUpdatedAt] = useState(0);

    const fetchDetails = useCallback(async () => {
        if (!merchantId || !enabled) {
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const token = getToken();
            const response = await axios.get(ADMIN_ENDPOINTS.MERCHANT_DETAILS(merchantId), {
                headers: { Authorization: `Bearer ${token}` },
            });

            const payload = response.data?.data ?? response.data ?? {};
            setData(payload);
            setUpdatedAt(Date.now());
        } catch (err) {
            setError(err);
            if (toastOnError) {
                toast.error('Failed to load merchant details');
            }
            // eslint-disable-next-line no-console
            console.error('Failed to load merchant details', err);
        } finally {
            setLoading(false);
        }
    }, [merchantId, enabled, toastOnError]);

    useEffect(() => {
        fetchDetails();
    }, [fetchDetails]);

    const shouldRefetch = () => {
        if (!updatedAt) return true;
        return Date.now() - updatedAt > DEFAULT_STALE_MS;
    };

    return {
        data,
        loading,
        error,
        updatedAt,
        refetch: fetchDetails,
        shouldRefetch,
    };
};

export default useAdminMerchantFullDetails;



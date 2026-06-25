import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { getMerchantDetails } from '../services/adminMerchantsService';

const DEFAULT_STALE_TIME = 10 * 60 * 1000; // 10 minutes
const DEFAULT_GC_TIME = 30 * 60 * 1000; // 30 minutes

const useAdminMerchantDetails = (
    merchantId,
    {
        enabled = true,
        staleTime = DEFAULT_STALE_TIME,
        gcTime = DEFAULT_GC_TIME,
        toastOnError = true,
        onError,
    } = {}
) => {
    return useQuery({
        queryKey: ['admin-merchant-detail', merchantId],
        queryFn: () => getMerchantDetails(merchantId),
        enabled: enabled && !!merchantId,
        staleTime,
        gcTime,
        onError: (error) => {
            console.error('Error fetching merchant details:', error);
            if (toastOnError) {
                toast.error('Failed to load merchant details');
            }
            if (typeof onError === 'function') {
                onError(error);
            }
        },
    });
};

export default useAdminMerchantDetails;


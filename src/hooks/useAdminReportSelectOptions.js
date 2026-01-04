import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import useAdminFilterOptions from './useAdminFilterOptions';
import {
    fetchAdminMerchantSelectOptions,
    fetchAdminSupplierSelectOptions,
    fetchAdminWarehouseSelectOptions,
    fetchAdminCustomerSelectOptions,
} from '../services/adminSelectOptionsService';

const DEFAULT_STALE_TIME = 5 * 60 * 1000;

const useAdminReportSelectOptions = ({
    countryId,
    shopId,
    includeCustomers = false,
    loadSuppliers = false,
    loadWarehouses = false,
    loadCustomers = false,
    supplierSearch = '',
    warehouseSearch = '',
    customerSearch = '',
    autoLoadMerchants = true,
}) => {
    const [merchantLoadRequested, setMerchantLoadRequested] = useState(autoLoadMerchants);

    const {
        merchantOptions: cachedMerchantOptions,
        resolveCountryName,
        getMerchantOption,
        loadReferenceData,
        hasLoaded,
        loading: referenceLoading,
    } = useAdminFilterOptions({ autoLoad: merchantLoadRequested });

    const {
        data: merchantsSelectData,
        isLoading: isMerchantsLoading,
        isFetching: isMerchantsFetching,
    } = useQuery({
        queryKey: ['admin-report-selects', 'merchants', countryId || 'all'],
        queryFn: () =>
            fetchAdminMerchantSelectOptions(
                countryId ? { country_id: countryId } : {}
            ),
        enabled: Boolean(countryId) && merchantLoadRequested,
        staleTime: DEFAULT_STALE_TIME,
        gcTime: DEFAULT_STALE_TIME,
    });

    const merchantOptions = useMemo(() => {
        if (countryId && Array.isArray(merchantsSelectData)) {
            return merchantsSelectData;
        }
        return cachedMerchantOptions;
    }, [countryId, merchantsSelectData, cachedMerchantOptions]);

    const merchantOptionsForCountry = useMemo(() => {
        if (!countryId) {
            return merchantOptions;
        }

        return merchantOptions.filter((option) => {
            const optionCountryId =
                option?.raw?.country_id ??
                option?.raw?.countryId ??
                option?.raw?.country?.id ??
                option?.raw?.country_code ??
                option?.raw?.countryCode ??
                null;

            return (
                optionCountryId !== null &&
                optionCountryId !== undefined &&
                String(optionCountryId) === String(countryId)
            );
        });
    }, [merchantOptions, countryId]);

    const countryMerchantIds = useMemo(() => {
        if (!countryId) {
            return [];
        }

        return merchantOptionsForCountry
            .map((option) => option?.id ?? option?.value ?? null)
            .filter((value) => value !== null && value !== undefined)
            .map(String);
    }, [merchantOptionsForCountry, countryId]);

    const supplierParams = useMemo(() => {
        const params = {};
        if (countryId) {
            params.country_id = countryId;
        }
        if (shopId) {
            params.merchant_id = shopId;
        } else if (countryId && countryMerchantIds.length > 0) {
            params.merchant_ids = countryMerchantIds;
        }
        if (supplierSearch) {
            params.search = supplierSearch;
        }
        return params;
    }, [countryId, shopId, countryMerchantIds, supplierSearch]);

    const warehouseParams = useMemo(() => {
        const params = {};
        if (countryId) {
            params.country_id = countryId;
        }
        if (shopId) {
            params.merchant_id = shopId;
        } else if (countryId && countryMerchantIds.length > 0) {
            params.merchant_ids = countryMerchantIds;
        }
        if (warehouseSearch) {
            params.search = warehouseSearch;
        }
        return params;
    }, [countryId, shopId, countryMerchantIds, warehouseSearch]);

    const customerParams = useMemo(() => {
        const params = {};
        if (countryId) {
            params.country_id = countryId;
        }
        if (shopId) {
            params.shop_id = shopId;
        }
        if (customerSearch) {
            params.search = customerSearch;
        }
        return params;
    }, [countryId, shopId, customerSearch]);

    const {
        data: supplierSelectData,
        isLoading: isSuppliersLoading,
        isFetching: isSuppliersFetching,
    } = useQuery({
        queryKey: ['admin-report-selects', 'suppliers', supplierParams],
        queryFn: () => fetchAdminSupplierSelectOptions(supplierParams),
        enabled: loadSuppliers,
        staleTime: DEFAULT_STALE_TIME,
        gcTime: DEFAULT_STALE_TIME,
    });

    const {
        data: warehouseSelectData,
        isLoading: isWarehousesLoading,
        isFetching: isWarehousesFetching,
    } = useQuery({
        queryKey: ['admin-report-selects', 'warehouses', warehouseParams],
        queryFn: () => fetchAdminWarehouseSelectOptions(warehouseParams),
        enabled: loadWarehouses,
        staleTime: DEFAULT_STALE_TIME,
        gcTime: DEFAULT_STALE_TIME,
    });

    const {
        data: customerSelectData,
        isLoading: isCustomersLoading,
        isFetching: isCustomersFetching,
    } = useQuery({
        queryKey: ['admin-report-selects', 'customers', customerParams],
        queryFn: () => fetchAdminCustomerSelectOptions(customerParams),
        enabled: includeCustomers && loadCustomers,
        staleTime: DEFAULT_STALE_TIME,
        gcTime: DEFAULT_STALE_TIME,
    });

    return {
        merchantOptions,
        merchantOptionsForCountry,
        countryMerchantIds,
        supplierOptions:
            loadSuppliers && Array.isArray(supplierSelectData)
                ? supplierSelectData
                : [],
        warehouseOptions:
            loadWarehouses && Array.isArray(warehouseSelectData)
                ? warehouseSelectData
                : [],
        customerOptions:
            includeCustomers &&
            loadCustomers &&
            Array.isArray(customerSelectData)
                ? customerSelectData
                : [],
        isMerchantsLoading: (isMerchantsLoading || isMerchantsFetching || referenceLoading) && merchantLoadRequested,
        isSuppliersLoading:
            loadSuppliers && (isSuppliersLoading || isSuppliersFetching),
        isWarehousesLoading:
            loadWarehouses && (isWarehousesLoading || isWarehousesFetching),
        isCustomersLoading:
            includeCustomers &&
            loadCustomers &&
            (isCustomersLoading || isCustomersFetching),
        resolveCountryName,
        getMerchantOption,
        ensureMerchantOptionsLoaded: () => {
            if (!merchantLoadRequested) {
                setMerchantLoadRequested(true);
            }
            if (!hasLoaded) {
                loadReferenceData();
            }
        },
        merchantOptionsLoaded: hasLoaded || merchantLoadRequested,
    };
};

export default useAdminReportSelectOptions;


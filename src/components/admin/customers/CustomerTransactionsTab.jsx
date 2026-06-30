import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAdminCustomerTransactions } from '../../../services/adminCustomersService';
import WalletTransactionsPanel from '../wallets/WalletTransactionsPanel';

const EMPTY_FILTERS = {
    search: '',
    direction: '',
    type: '',
    date_from: '',
    date_to: '',
    min_amount: '',
    max_amount: '',
};

const CustomerTransactionsTab = ({ customerId, currencyCode = 'SDG' }) => {
    const { t } = useTranslation();

    const [filters, setFilters] = useState(EMPTY_FILTERS);
    const [pagination, setPagination] = useState({
        current_page: 1,
        per_page: 15,
        total: 0,
        last_page: 1,
    });
    const [debouncedFilters, setDebouncedFilters] = useState(filters);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedFilters(filters);
            setPagination((prev) => ({ ...prev, current_page: 1 }));
        }, 500);
        return () => clearTimeout(timer);
    }, [filters]);

    const queryParams = useMemo(
        () => ({
            page: pagination.current_page,
            per_page: pagination.per_page,
            ...debouncedFilters,
        }),
        [pagination.current_page, pagination.per_page, debouncedFilters]
    );

    const {
        data: txResponse,
        isLoading,
        isFetching,
        error: queryError,
        refetch,
    } = useAdminCustomerTransactions(customerId, queryParams);

    useEffect(() => {
        if (txResponse?.current_page !== undefined) {
            setPagination({
                current_page: txResponse.current_page,
                per_page: txResponse.per_page,
                total: txResponse.total,
                last_page: txResponse.last_page || Math.ceil(txResponse.total / txResponse.per_page),
            });
        }
    }, [txResponse]);

    const transactions = useMemo(() => txResponse?.data || [], [txResponse]);

    return (
        <div data-testid="customer-transactions-tab">
            <WalletTransactionsPanel
                transactions={transactions}
                isLoading={isLoading}
                isFetching={isFetching}
                error={queryError}
                errorMessage={t('customers.failedToLoadTransactions')}
                emptyMessage={t('customers.noTransactionHistory')}
                pagination={pagination}
                onPaginationChange={setPagination}
                filters={filters}
                onFiltersChange={setFilters}
                onClearFilters={() => setFilters(EMPTY_FILTERS)}
                onRefetch={refetch}
                currencyCode={currencyCode}
                getTransactionLink={(tx) => `/admin/customers/${customerId}/transactions/${tx.id}`}
                testIdPrefix="customer"
            />
        </div>
    );
};

export default CustomerTransactionsTab;

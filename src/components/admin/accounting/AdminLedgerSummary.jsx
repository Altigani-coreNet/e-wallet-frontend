import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { useToolbar } from '../../../contexts/ToolbarContext';
import LoadingSpinner from '../../common/LoadingSpinner';
import ErrorAlert from '../../common/ErrorAlert';
import SearchableDropdown from '../../common/filters/SearchableDropdown';
import {
    downloadLedgerExport,
    fmtMoney,
    triggerBlobDownload,
    useChartOfAccounts,
    useLedgerCustomers,
    useLedgerSummary,
} from '../../../services/adminAccountingService';

const defaultFilters = () => {
    const today = new Date().toISOString().slice(0, 10);
    return {
        account_id: '',
        customer_id: '',
        start_date: `${today.slice(0, 7)}-01`,
        end_date: today,
    };
};

const AdminLedgerSummary = () => {
    const { t } = useTranslation();
    const { setTitle, setBreadcrumbs } = useToolbar();
    const [searchParams] = useSearchParams();

    const [draftFilters, setDraftFilters] = useState(() => ({
        ...defaultFilters(),
        account_id: searchParams.get('account_id') || '',
    }));
    const [appliedFilters, setAppliedFilters] = useState(draftFilters);
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        setTitle(t('admin.accounting.ledger.title'));
        setBreadcrumbs([
            { label: t('admin.sidebar.dashboard'), path: '/admin/dashboard' },
            { label: t('admin.sidebar.accounting'), path: '/admin/accounting/chart-of-accounts' },
            { label: t('admin.accounting.ledger.title') },
        ]);
    }, [setTitle, setBreadcrumbs, t]);

    const { data: coaData } = useChartOfAccounts({
        start_date: appliedFilters.start_date,
        end_date: appliedFilters.end_date,
    });

    const { data: customersData } = useLedgerCustomers();

    const accountOptions = useMemo(() => {
        const options = [];
        (coaData?.groups || []).forEach((group) => {
            (group.sub_types ?? []).forEach((subType) => {
                (subType.accounts ?? []).forEach((account) => {
                    options.push({
                        value: String(account.id),
                        label: `${account.code} - ${account.name}`,
                    });
                });
            });
        });
        return options;
    }, [coaData]);

    const customerOptions = useMemo(
        () => (customersData?.customers || []).map((customer) => ({
            value: String(customer.id),
            label: customer.name,
        })),
        [customersData]
    );

    const selectedAccountOption = useMemo(
        () => accountOptions.find((option) => option.value === draftFilters.account_id) || null,
        [accountOptions, draftFilters.account_id]
    );

    const selectedCustomerOption = useMemo(
        () => customerOptions.find((option) => option.value === draftFilters.customer_id) || null,
        [customerOptions, draftFilters.customer_id]
    );

    const queryParams = useMemo(
        () => ({
            start_date: appliedFilters.start_date,
            end_date: appliedFilters.end_date,
            account_id: appliedFilters.account_id || undefined,
            customer_id: appliedFilters.customer_id || undefined,
        }),
        [appliedFilters]
    );

    const { data, isLoading, isError, error, refetch, isFetching } = useLedgerSummary(queryParams);

    const handleApply = () => {
        setAppliedFilters({ ...draftFilters });
    };

    const handleReset = () => {
        const reset = defaultFilters();
        setDraftFilters(reset);
        setAppliedFilters(reset);
    };

    const handleExport = async () => {
        try {
            setExporting(true);
            const blob = await downloadLedgerExport(queryParams);
            triggerBlobDownload(blob, `ledger_summary_${appliedFilters.end_date}.xlsx`);
        } catch (exportError) {
            console.error(exportError);
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="post d-flex flex-column-fluid" id="kt_post">
            <div className="container-xxl">
                <div className="card mb-5 mb-xl-8">
                    <div className="card-header border-0 pt-6">
                        <div className="card-title w-100">
                            <div className="row g-3 w-100 align-items-end">
                                <div className="col-lg-2 col-md-4">
                                    <label className="form-label fs-7 fw-semibold text-gray-700">
                                        {t('admin.accounting.filters.startDate')}
                                    </label>
                                    <input
                                        type="date"
                                        className="form-control form-control-sm"
                                        value={draftFilters.start_date}
                                        onChange={(e) => setDraftFilters((prev) => ({
                                            ...prev,
                                            start_date: e.target.value,
                                        }))}
                                    />
                                </div>
                                <div className="col-lg-2 col-md-4">
                                    <label className="form-label fs-7 fw-semibold text-gray-700">
                                        {t('admin.accounting.filters.endDate')}
                                    </label>
                                    <input
                                        type="date"
                                        className="form-control form-control-sm"
                                        value={draftFilters.end_date}
                                        onChange={(e) => setDraftFilters((prev) => ({
                                            ...prev,
                                            end_date: e.target.value,
                                        }))}
                                    />
                                </div>
                                <div className="col-lg-3 col-md-4">
                                    <SearchableDropdown
                                        label={t('admin.accounting.ledger.account')}
                                        placeholder={t('admin.accounting.ledger.allAccounts')}
                                        searchPlaceholder={t('admin.accounting.ledger.searchAccount')}
                                        options={accountOptions}
                                        selected={selectedAccountOption}
                                        onSelect={(option) => setDraftFilters((prev) => ({
                                            ...prev,
                                            account_id: option.value,
                                        }))}
                                        onClear={() => setDraftFilters((prev) => ({
                                            ...prev,
                                            account_id: '',
                                        }))}
                                        emptyText={t('admin.accounting.ledger.noAccountResults')}
                                    />
                                </div>
                                <div className="col-lg-3 col-md-4">
                                    <SearchableDropdown
                                        label={t('admin.accounting.ledger.customer')}
                                        placeholder={t('admin.accounting.ledger.selectCustomer')}
                                        searchPlaceholder={t('admin.accounting.ledger.searchCustomer')}
                                        options={customerOptions}
                                        selected={selectedCustomerOption}
                                        onSelect={(option) => setDraftFilters((prev) => ({
                                            ...prev,
                                            customer_id: option.value,
                                        }))}
                                        onClear={() => setDraftFilters((prev) => ({
                                            ...prev,
                                            customer_id: '',
                                        }))}
                                        emptyText={t('admin.accounting.ledger.noCustomerResults')}
                                    />
                                </div>
                                <div className="col-lg-2 col-md-12">
                                    <div className="d-flex flex-wrap gap-2">
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-primary"
                                            onClick={handleApply}
                                        >
                                            <i className="ki-duotone ki-magnifier fs-5 me-1">
                                                <span className="path1" />
                                                <span className="path2" />
                                            </i>
                                            {t('admin.accounting.ledger.apply')}
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-light"
                                            onClick={handleReset}
                                        >
                                            {t('admin.accounting.ledger.reset')}
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-light-primary"
                                            onClick={handleExport}
                                            disabled={exporting}
                                        >
                                            <i className="ki-duotone ki-file-down fs-5 me-1">
                                                <span className="path1" />
                                                <span className="path2" />
                                            </i>
                                            {exporting ? t('common.loading') : t('admin.accounting.ledger.export')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card-body pt-0">
                        {isError ? (
                            <ErrorAlert
                                message={error?.response?.data?.message || error?.message || t('admin.accounting.loadFailed')}
                                onRetry={refetch}
                            />
                        ) : isLoading ? (
                            <LoadingSpinner />
                        ) : (
                            <div className="table-responsive">
                                <table className="table align-middle table-row-dashed fs-6 gy-5 mb-0">
                                    <thead>
                                        <tr className="text-start text-gray-400 fw-bold fs-7 text-uppercase gs-0">
                                            <th>{t('admin.accounting.ledger.accountName')}</th>
                                            <th>{t('admin.accounting.ledger.name')}</th>
                                            <th>{t('admin.accounting.ledger.transactionType')}</th>
                                            <th>{t('admin.accounting.ledger.transactionDate')}</th>
                                            <th className="text-end">{t('admin.accounting.ledger.debit')}</th>
                                            <th className="text-end">{t('admin.accounting.ledger.credit')}</th>
                                            <th className="text-end">{t('admin.accounting.ledger.balance')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-gray-600 fw-semibold">
                                        {(data?.rows || []).length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="text-center py-10 text-muted">
                                                    {t('admin.accounting.ledger.noRows')}
                                                </td>
                                            </tr>
                                        ) : (
                                            data.rows.map((row) => (
                                                <tr key={row.id}>
                                                    <td>{row.account_name}</td>
                                                    <td>{row.name || '-'}</td>
                                                    <td>{row.transaction_type}</td>
                                                    <td>{row.date}</td>
                                                    <td className="text-end">{fmtMoney(row.debit)}</td>
                                                    <td className="text-end">{fmtMoney(row.credit)}</td>
                                                    <td className="text-end">{fmtMoney(row.balance)}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                    {(data?.rows || []).length > 0 && data?.totals ? (
                                        <tfoot>
                                            <tr className="fw-bold text-gray-800 border-top">
                                                <td colSpan={4} className="text-end">
                                                    {t('admin.accounting.ledger.totals')}
                                                </td>
                                                <td className="text-end">{fmtMoney(data.totals.debit)}</td>
                                                <td className="text-end">{fmtMoney(data.totals.credit)}</td>
                                                <td />
                                            </tr>
                                        </tfoot>
                                    ) : null}
                                </table>
                            </div>
                        )}

                        {isFetching && !isLoading ? (
                            <div className="text-muted fs-8 mt-3">{t('common.loading')}</div>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminLedgerSummary;

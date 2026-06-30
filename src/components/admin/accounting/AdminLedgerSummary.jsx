import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { useToolbar } from '../../../contexts/ToolbarContext';
import LoadingSpinner from '../../common/LoadingSpinner';
import ErrorAlert from '../../common/ErrorAlert';
import {
    downloadLedgerExport,
    fmtMoney,
    triggerBlobDownload,
    useChartOfAccounts,
    useLedgerCustomers,
    useLedgerSummary,
} from '../../../services/adminAccountingService';
import AccountingReportToolbar from './shared/AccountingReportToolbar';
import LedgerSummaryFiltersCard from './shared/LedgerSummaryFiltersCard';

const toDatetimeLocal = (date) => {
    const pad = (value) => String(value).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const defaultFilters = () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 0, 0);

    return {
        account_id: '',
        customer_id: '',
        start_datetime: toDatetimeLocal(startOfMonth),
        end_datetime: toDatetimeLocal(endOfDay),
    };
};

const AdminLedgerSummary = () => {
    const { t, i18n } = useTranslation();
    const { setTitle, setBreadcrumbs, setActions } = useToolbar();
    const [searchParams] = useSearchParams();

    const [showFilters, setShowFilters] = useState(true);
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

    const coaDateRange = useMemo(
        () => ({
            start_date: appliedFilters.start_datetime.slice(0, 10),
            end_date: appliedFilters.end_datetime.slice(0, 10),
        }),
        [appliedFilters.start_datetime, appliedFilters.end_datetime]
    );

    const { data: coaData } = useChartOfAccounts(coaDateRange);

    const { data: customersData, isLoading: customersLoading } = useLedgerCustomers();

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
            label: customer.name || String(customer.id),
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
            start_datetime: appliedFilters.start_datetime,
            end_datetime: appliedFilters.end_datetime,
            account_id: appliedFilters.account_id || undefined,
            customer_id: appliedFilters.customer_id || undefined,
        }),
        [appliedFilters]
    );

    const { data, isLoading, isError, error, refetch, isFetching } = useLedgerSummary(queryParams);

    const handleFilterChange = useCallback((patch) => {
        setDraftFilters((prev) => ({ ...prev, ...patch }));
    }, []);

    const handleApply = () => {
        setAppliedFilters({ ...draftFilters });
    };

    const handleReset = () => {
        const reset = defaultFilters();
        setDraftFilters(reset);
        setAppliedFilters(reset);
    };

    const handleExport = useCallback(async () => {
        try {
            setExporting(true);
            const blob = await downloadLedgerExport(queryParams);
            const stamp = appliedFilters.end_datetime.slice(0, 10);
            triggerBlobDownload(blob, `ledger_summary_${stamp}.xlsx`);
        } catch (exportError) {
            console.error(exportError);
        } finally {
            setExporting(false);
        }
    }, [queryParams, appliedFilters.end_datetime]);

    useEffect(() => {
        setActions(
            <div className="d-flex align-items-center gap-2 gap-lg-3">
                <button
                    type="button"
                    className="btn btn-sm btn-flex btn-secondary fw-bold"
                    onClick={() => setShowFilters((prev) => !prev)}
                    aria-label={showFilters ? t('admin.common.hideFilters') : t('admin.common.showFilters')}
                >
                    <i className="ki-duotone ki-filter fs-6 text-muted me-0 me-lg-1">
                        <span className="path1" />
                        <span className="path2" />
                    </i>
                    <span className="d-none d-lg-inline ms-lg-1">
                        {showFilters ? t('admin.common.hideFilters') : t('admin.common.showFilters')}
                    </span>
                </button>
                <AccountingReportToolbar
                    onExport={handleExport}
                    exporting={exporting}
                    exportLabel={t('admin.accounting.ledger.export')}
                />
            </div>
        );

        return () => setActions(null);
    }, [setActions, showFilters, handleExport, exporting, t, i18n.language]);

    const periodLabel = data?.filter
        ? `${data.filter.start_datetime || data.filter.start_date} – ${data.filter.end_datetime || data.filter.end_date}`
        : '';

    return (
        <div className="post d-flex flex-column-fluid" id="kt_post">
            <div className="container-xxl">
                {showFilters ? (
                    <LedgerSummaryFiltersCard
                        draftFilters={draftFilters}
                        onFilterChange={handleFilterChange}
                        onApply={handleApply}
                        onReset={handleReset}
                        accountOptions={accountOptions}
                        customerOptions={customerOptions}
                        selectedAccountOption={selectedAccountOption}
                        selectedCustomerOption={selectedCustomerOption}
                        customersLoading={customersLoading}
                    />
                ) : null}

                <div className="card mb-5 mb-xl-8">
                    <div className="card-header border-0 pt-6">
                        <h3 className="card-title align-items-start flex-column">
                            <span className="card-label fw-bold fs-3 mb-1">
                                {t('admin.accounting.ledger.title')}
                            </span>
                            {periodLabel ? (
                                <span className="text-muted fs-7 fw-semibold">{periodLabel}</span>
                            ) : null}
                        </h3>
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
                                <table className="table align-middle table-row-dashed fs-7 gy-4 mb-0">
                                    <thead>
                                        <tr className="text-start text-gray-500 fw-semibold text-uppercase gs-0">
                                            <th>{t('admin.accounting.ledger.accountName')}</th>
                                            <th>{t('admin.accounting.ledger.customer')}</th>
                                            <th>{t('admin.accounting.ledger.transactionType')}</th>
                                            <th>{t('admin.accounting.ledger.transactionDate')}</th>
                                            <th className="text-end">{t('admin.accounting.ledger.debit')}</th>
                                            <th className="text-end">{t('admin.accounting.ledger.credit')}</th>
                                            <th className="text-end">{t('admin.accounting.ledger.balance')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-gray-700 fw-normal">
                                        {(data?.rows || []).length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="text-center py-10 text-muted fs-7">
                                                    {t('admin.accounting.ledger.noRows')}
                                                </td>
                                            </tr>
                                        ) : (
                                            data.rows.map((row) => (
                                                <tr key={row.id}>
                                                    <td className="text-gray-800">{row.account_name}</td>
                                                    <td className="text-gray-800">{row.name || '-'}</td>
                                                    <td>{row.transaction_type}</td>
                                                    <td className="text-nowrap">{row.date}</td>
                                                    <td className="text-end">{fmtMoney(row.debit)}</td>
                                                    <td className="text-end">{fmtMoney(row.credit)}</td>
                                                    <td className="text-end fw-semibold">{fmtMoney(row.balance)}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                    {(data?.rows || []).length > 0 && data?.totals ? (
                                        <tfoot>
                                            <tr className="fw-semibold text-gray-800 border-top fs-7">
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

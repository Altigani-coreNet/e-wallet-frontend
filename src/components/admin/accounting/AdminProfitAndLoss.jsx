import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useToolbar } from '../../../contexts/ToolbarContext';
import LoadingSpinner from '../../common/LoadingSpinner';
import ErrorAlert from '../../common/ErrorAlert';
import {
    downloadProfitAndLossExport,
    triggerBlobDownload,
    useProfitAndLoss,
} from '../../../services/adminAccountingService';
import {
    ReportHeaderRow,
    SectionBlock,
    SummaryRow,
    useReportExpandState,
} from './shared/ReportSectionBlocks';
import AccountingReportFiltersCard from './shared/AccountingReportFiltersCard';
import AccountingReportToolbar from './shared/AccountingReportToolbar';

const defaultFilters = () => {
    const today = new Date().toISOString().slice(0, 10);
    return {
        start_date: `${today.slice(0, 7)}-01`,
        end_date: today,
    };
};

const ProfitAndLossContent = ({
    data,
    viewMode,
    expandAll,
    isSectionExpanded,
    expandedSubTypes,
    onToggleSection,
    onToggleSubType,
    totalLabelPrefix,
    t,
}) => {
    const sections = data?.sections || {};
    const grossProfit = data?.gross_profit ?? 0;
    const netProfit = data?.net_profit ?? 0;
    const netLabel = Number(netProfit) < 0
        ? t('admin.accounting.profitLoss.netLoss')
        : t('admin.accounting.profitLoss.netProfit');

    const renderSection = (sectionKey) => {
        const section = sections[sectionKey];
        if (!section) return null;

        return (
            <SectionBlock
                key={sectionKey}
                section={section}
                sectionKey={sectionKey}
                sectionExpanded={isSectionExpanded(sectionKey)}
                expandAll={expandAll}
                expandedSubTypes={expandedSubTypes}
                onToggleSection={onToggleSection}
                onToggleSubType={onToggleSubType}
                totalLabelPrefix={totalLabelPrefix}
            />
        );
    };

    const headerRow = (
        <ReportHeaderRow
            accountLabel={t('admin.accounting.profitLoss.account')}
            amountLabel={t('admin.accounting.profitLoss.amount')}
        />
    );

    const grossProfitRow = (
        <SummaryRow
            label={t('admin.accounting.profitLoss.grossProfit')}
            amount={grossProfit}
            highlight
            dataTestId="profit-loss-gross-profit"
        />
    );

    const netProfitRow = (
        <SummaryRow
            label={netLabel}
            amount={netProfit}
            large
            dataTestId="profit-loss-net-profit"
        />
    );

    if (viewMode === 'horizontal') {
        return (
            <div>
                <div className="row g-0">
                    <div className="col-md-6 border-end">
                        <div className="py-2 px-3 border-bottom bg-light">
                            <h5 className="mb-0 fw-bold">{t('admin.accounting.profitLoss.income')}</h5>
                        </div>
                        <div className="px-3">
                            {headerRow}
                            {renderSection('income')}
                        </div>
                    </div>
                    <div className="col-md-6">
                        <div className="py-2 px-3 border-bottom bg-light">
                            <h5 className="mb-0 fw-bold">{t('admin.accounting.profitLoss.costsAndExpenses')}</h5>
                        </div>
                        <div className="px-3">
                            {headerRow}
                            {renderSection('costs_of_goods_sold')}
                            {renderSection('expenses')}
                        </div>
                    </div>
                </div>
                <div className="px-3">
                    {grossProfitRow}
                    {netProfitRow}
                </div>
            </div>
        );
    }

    return (
        <div>
            {headerRow}
            {renderSection('income')}
            {renderSection('costs_of_goods_sold')}
            {grossProfitRow}
            {renderSection('expenses')}
            {netProfitRow}
        </div>
    );
};

const AdminProfitAndLoss = () => {
    const { t } = useTranslation();
    const { setTitle, setBreadcrumbs, setActions } = useToolbar();

    const [draftFilters, setDraftFilters] = useState(defaultFilters);
    const [appliedFilters, setAppliedFilters] = useState(defaultFilters);
    const [viewMode, setViewMode] = useState('vertical');
    const [exporting, setExporting] = useState(false);

    const {
        expandAll,
        expandedSubTypes,
        isSectionExpanded,
        handleExpandCollapseAll,
        handleToggleSection,
        handleToggleSubType,
    } = useReportExpandState(['income', 'costs_of_goods_sold', 'expenses']);

    useEffect(() => {
        setTitle(t('admin.accounting.profitLoss.title'));
        setBreadcrumbs([
            { label: t('admin.sidebar.dashboard'), path: '/admin/dashboard' },
            { label: t('admin.sidebar.accounting'), path: '/admin/accounting/chart-of-accounts' },
            { label: t('admin.accounting.profitLoss.title') },
        ]);
    }, [setTitle, setBreadcrumbs, t]);

    const queryParams = useMemo(() => ({ ...appliedFilters }), [appliedFilters]);
    const totalLabelPrefix = t('admin.accounting.profitLoss.total');

    const { data, isLoading, isError, error, refetch, isFetching } = useProfitAndLoss(queryParams);

    const handleApply = () => setAppliedFilters({ ...draftFilters });

    const handleReset = () => {
        const reset = defaultFilters();
        setDraftFilters(reset);
        setAppliedFilters(reset);
    };

    const handleExport = useCallback(async () => {
        try {
            setExporting(true);
            const blob = await downloadProfitAndLossExport(queryParams);
            triggerBlobDownload(blob, `profit_and_loss_${appliedFilters.end_date}.xlsx`);
        } catch (exportError) {
            console.error(exportError);
        } finally {
            setExporting(false);
        }
    }, [queryParams, appliedFilters.end_date]);

    const handlePrint = useCallback(() => {
        window.print();
    }, []);

    const handleToggleExpandAll = useCallback(() => {
        handleExpandCollapseAll(!expandAll);
    }, [expandAll, handleExpandCollapseAll]);

    useEffect(() => {
        setActions(
            <AccountingReportToolbar
                onExport={handleExport}
                exporting={exporting}
                onPrint={handlePrint}
                onExpandCollapseAll={handleToggleExpandAll}
                expandAll={expandAll}
                expandAllLabel={t('admin.accounting.profitLoss.expandAll')}
                collapseAllLabel={t('admin.accounting.profitLoss.collapseAll')}
                exportLabel={t('admin.accounting.profitLoss.export')}
                printLabel={t('admin.accounting.profitLoss.print')}
            />
        );

        return () => setActions(null);
    }, [
        setActions,
        handleExport,
        handlePrint,
        handleToggleExpandAll,
        exporting,
        expandAll,
        t,
    ]);

    const periodLabel = data?.filter
        ? `${data.filter.start_date} – ${data.filter.end_date}`
        : '';

    return (
        <div className="post d-flex flex-column-fluid" id="kt_post">
            <div className="container-xxl">
                <AccountingReportFiltersCard
                    draftFilters={draftFilters}
                    onStartDateChange={(start_date) => setDraftFilters((prev) => ({ ...prev, start_date }))}
                    onEndDateChange={(end_date) => setDraftFilters((prev) => ({ ...prev, end_date }))}
                    onApply={handleApply}
                    onReset={handleReset}
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                    verticalLabel={t('admin.accounting.profitLoss.vertical')}
                    horizontalLabel={t('admin.accounting.profitLoss.horizontal')}
                />

                <div className="card mb-5 mb-xl-8">
                    <div className="card-header border-0 pt-6">
                        <h3 className="card-title align-items-start flex-column">
                            <span className="card-label fw-bold fs-3 mb-1">
                                {t('admin.accounting.reports.reportTitle')}
                            </span>
                            {periodLabel ? (
                                <span className="text-muted fs-7 fw-semibold">{periodLabel}</span>
                            ) : null}
                        </h3>
                    </div>
                    <div className="card-body pt-0" id="printableArea" data-testid="profit-loss-report">
                        {isError ? (
                            <ErrorAlert
                                message={error?.response?.data?.message || error?.message || t('admin.accounting.loadFailed')}
                                onRetry={refetch}
                            />
                        ) : isLoading ? (
                            <LoadingSpinner />
                        ) : (
                            <ProfitAndLossContent
                                data={data}
                                viewMode={viewMode}
                                expandAll={expandAll}
                                isSectionExpanded={isSectionExpanded}
                                expandedSubTypes={expandedSubTypes}
                                onToggleSection={handleToggleSection}
                                onToggleSubType={handleToggleSubType}
                                totalLabelPrefix={totalLabelPrefix}
                                t={t}
                            />
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

export default AdminProfitAndLoss;

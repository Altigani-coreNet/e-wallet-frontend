import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useToolbar } from '../../../contexts/ToolbarContext';
import LoadingSpinner from '../../common/LoadingSpinner';
import ErrorAlert from '../../common/ErrorAlert';
import {
    downloadBalanceSheetExport,
    fmtMoney,
    triggerBlobDownload,
    useBalanceSheet,
} from '../../../services/adminAccountingService';
import {
    ReportHeaderRow,
    SectionBlock,
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

const BalanceSheetContent = ({
    data,
    viewMode,
    expandAll,
    isSectionExpanded,
    isMasterExpanded,
    expandedSubTypes,
    onToggleSection,
    onToggleSubType,
    onToggleMaster,
    totalLabelPrefix,
    t,
}) => {
    const sections = data?.sections || {};
    const totals = data?.totals || {};

    const renderSection = (sectionKey, options = {}) => {
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
                {...options}
            />
        );
    };

    const combinedTotalRow = (
        <div className="d-flex align-items-center justify-content-between py-3 border-top fw-bold fs-5 text-gray-900">
            <span>{t('admin.accounting.balanceSheet.totalLiabilitiesAndEquity')}</span>
            <span>{fmtMoney(totals.total_liabilities_and_equity)}</span>
        </div>
    );

    const headerRow = (
        <ReportHeaderRow
            accountLabel={t('admin.accounting.balanceSheet.account')}
            amountLabel={t('admin.accounting.balanceSheet.amount')}
        />
    );

    if (viewMode === 'horizontal') {
        return (
            <div className="row g-0">
                <div className="col-md-6 border-end">
                    <div className="py-2 px-3 border-bottom bg-light">
                        <h5 className="mb-0 fw-bold">{t('admin.accounting.balanceSheet.assets')}</h5>
                    </div>
                    <div className="px-3">
                        {headerRow}
                        {renderSection('assets')}
                        <div className="d-flex justify-content-between py-2 fw-bold border-top">
                            <span>{t('admin.accounting.balanceSheet.totalAssets')}</span>
                            <span>{fmtMoney(totals.total_assets)}</span>
                        </div>
                    </div>
                </div>
                <div className="col-md-6">
                    <div className="py-2 px-3 border-bottom bg-light">
                        <h5 className="mb-0 fw-bold">{t('admin.accounting.balanceSheet.liabilitiesAndEquity')}</h5>
                    </div>
                    <div className="px-3">
                        {headerRow}
                        {isMasterExpanded ? (
                            <>
                                {renderSection('liabilities')}
                                {renderSection('equity')}
                            </>
                        ) : null}
                        {combinedTotalRow}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div>
            {headerRow}
            {renderSection('assets')}
            {renderSection('liabilities', {
                showMasterHeader: true,
                masterExpanded: isMasterExpanded,
                onToggleMaster,
                masterTotal: totals.total_liabilities_and_equity,
                masterHeaderLabel: t('admin.accounting.balanceSheet.liabilitiesAndEquity'),
            })}
            {isMasterExpanded ? renderSection('equity') : null}
            {combinedTotalRow}
        </div>
    );
};

const AdminBalanceSheet = () => {
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
        isMasterExpanded,
        handleExpandCollapseAll,
        handleToggleSection,
        handleToggleSubType,
        handleToggleMaster,
    } = useReportExpandState(['assets', 'liabilities', 'equity']);

    useEffect(() => {
        setTitle(t('admin.accounting.balanceSheet.title'));
        setBreadcrumbs([
            { label: t('admin.sidebar.dashboard'), path: '/admin/dashboard' },
            { label: t('admin.sidebar.accounting'), path: '/admin/accounting/chart-of-accounts' },
            { label: t('admin.accounting.balanceSheet.title') },
        ]);
    }, [setTitle, setBreadcrumbs, t]);

    const queryParams = useMemo(() => ({ ...appliedFilters }), [appliedFilters]);
    const totalLabelPrefix = t('admin.accounting.balanceSheet.total');

    const { data, isLoading, isError, error, refetch, isFetching } = useBalanceSheet(queryParams);

    const handleApply = () => setAppliedFilters({ ...draftFilters });

    const handleReset = () => {
        const reset = defaultFilters();
        setDraftFilters(reset);
        setAppliedFilters(reset);
    };

    const handleExport = useCallback(async () => {
        try {
            setExporting(true);
            const blob = await downloadBalanceSheetExport(queryParams);
            triggerBlobDownload(blob, `balance_sheet_${appliedFilters.end_date}.xlsx`);
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
                expandAllLabel={t('admin.accounting.balanceSheet.expandAll')}
                collapseAllLabel={t('admin.accounting.balanceSheet.collapseAll')}
                exportLabel={t('admin.accounting.balanceSheet.export')}
                printLabel={t('admin.accounting.balanceSheet.print', { defaultValue: 'Print' })}
                isBalanced={data?.is_balanced}
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
        data?.is_balanced,
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
                    verticalLabel={t('admin.accounting.balanceSheet.vertical')}
                    horizontalLabel={t('admin.accounting.balanceSheet.horizontal')}
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
                    <div className="card-body pt-0" id="printableArea" data-testid="balance-sheet-report">
                        {isError ? (
                            <ErrorAlert
                                message={error?.response?.data?.message || error?.message || t('admin.accounting.loadFailed')}
                                onRetry={refetch}
                            />
                        ) : isLoading ? (
                            <LoadingSpinner />
                        ) : (
                            <BalanceSheetContent
                                data={data}
                                viewMode={viewMode}
                                expandAll={expandAll}
                                isSectionExpanded={isSectionExpanded}
                                isMasterExpanded={isMasterExpanded}
                                expandedSubTypes={expandedSubTypes}
                                onToggleSection={handleToggleSection}
                                onToggleSubType={handleToggleSubType}
                                onToggleMaster={handleToggleMaster}
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

export default AdminBalanceSheet;

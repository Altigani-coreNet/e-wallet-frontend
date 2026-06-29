import React, { useEffect, useMemo, useState } from 'react';
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

const defaultFilters = () => {
    const today = new Date().toISOString().slice(0, 10);
    return {
        start_date: `${today.slice(0, 7)}-01`,
        end_date: today,
    };
};

const subTypeKey = (sectionKey, subTypeName, index) => `${sectionKey}::${subTypeName}::${index}`;

const ChevronIcon = ({ expanded }) => (
    <i className={`ki-duotone ki-${expanded ? 'down' : 'right'} fs-4`}>
        <span className="path1" />
        <span className="path2" />
    </i>
);

const AccountRow = ({ account, indent = 0 }) => (
    <div
        className="d-flex align-items-center justify-content-between py-2 border-bottom"
        style={{ paddingLeft: `${indent}px` }}
    >
        <div className="d-flex align-items-center gap-3 flex-grow-1">
            <span className="text-muted fs-8" style={{ minWidth: 48 }}>{account.code ?? '-'}</span>
            <span className="text-gray-700 fw-semibold">{account.name}</span>
        </div>
        <span className="text-gray-800 fw-semibold text-end">{fmtMoney(account.balance)}</span>
    </div>
);

const SubTypeBlock = ({
    subType,
    subTypeId,
    expanded,
    onToggle,
    t,
    indent = 32,
}) => (
    <div className="border-bottom">
        <div
            className="d-flex align-items-center justify-content-between py-2 cursor-pointer"
            style={{ paddingLeft: `${indent}px`, cursor: 'pointer' }}
            onClick={onToggle}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onToggle()}
        >
            <div className="d-flex align-items-center gap-2">
                <ChevronIcon expanded={expanded} />
                <span className="fw-bold text-gray-800">{subType.sub_type_name}</span>
            </div>
            {!expanded ? (
                <span className="fw-bold text-gray-800 me-3">{fmtMoney(subType.subtotal)}</span>
            ) : null}
        </div>
        {expanded ? (
            <div className="pb-2">
                {(subType.accounts || []).map((account, idx) => (
                    <AccountRow
                        key={account.id ?? `${subTypeId}-${idx}`}
                        account={account}
                        indent={indent + 24}
                    />
                ))}
                <div
                    className="d-flex align-items-center justify-content-between py-2 border-top fw-bold text-gray-800"
                    style={{ paddingLeft: `${indent + 24}px`, paddingRight: 12 }}
                >
                    <span>{t('admin.accounting.balanceSheet.total')} {subType.sub_type_name}</span>
                    <span>{fmtMoney(subType.subtotal)}</span>
                </div>
            </div>
        ) : null}
    </div>
);

const SectionBlock = ({
    section,
    sectionKey,
    sectionExpanded,
    expandAll,
    expandedSubTypes,
    onToggleSection,
    onToggleSubType,
    t,
    showMasterHeader = false,
    masterExpanded,
    onToggleMaster,
    masterTotal,
}) => (
    <div className="py-2 account-main-inner">
        {showMasterHeader ? (
            <div
                className="d-flex align-items-center justify-content-between mb-3 cursor-pointer"
                style={{ cursor: 'pointer' }}
                onClick={onToggleMaster}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && onToggleMaster()}
            >
                <div className="d-flex align-items-center gap-2">
                    <ChevronIcon expanded={masterExpanded} />
                    <p className="mb-0 fw-bold">{t('admin.accounting.balanceSheet.liabilitiesAndEquity')}</p>
                </div>
                {!masterExpanded ? (
                    <p className="mb-0 fw-bold text-end">{fmtMoney(masterTotal)}</p>
                ) : null}
            </div>
        ) : null}

        <div
            className="d-flex align-items-center justify-content-between mb-2 cursor-pointer"
            style={{ cursor: 'pointer' }}
            onClick={() => onToggleSection(sectionKey)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onToggleSection(sectionKey)}
        >
            <div className="d-flex align-items-center gap-2">
                <ChevronIcon expanded={sectionExpanded} />
                <p className="mb-0 fw-bold ps-1">{section.name}</p>
            </div>
            {!sectionExpanded ? (
                <p className="mb-0 fw-bold text-end">{fmtMoney(section.total)}</p>
            ) : null}
        </div>

        {sectionExpanded ? (
            <div className="section-content">
                {(section.sub_types || []).map((subType, index) => {
                    const id = subTypeKey(sectionKey, subType.sub_type_name, index);
                    return (
                        <SubTypeBlock
                            key={id}
                            subType={subType}
                            subTypeId={id}
                            expanded={expandAll || expandedSubTypes[id] !== false}
                            onToggle={() => onToggleSubType(id)}
                            t={t}
                        />
                    );
                })}
                <div className="d-flex align-items-center justify-content-between py-2 border-top border-bottom fw-bold text-gray-900 mt-1">
                    <span>{t('admin.accounting.balanceSheet.total')} {section.name}</span>
                    <span>{fmtMoney(section.total)}</span>
                </div>
            </div>
        ) : null}
    </div>
);

const BalanceSheetContent = ({
    data,
    viewMode,
    expandAll,
    expandedSections,
    expandedSubTypes,
    expandedMaster,
    onToggleSection,
    onToggleSubType,
    onToggleMaster,
    t,
}) => {
    const sections = data?.sections || {};
    const totals = data?.totals || {};

    const isSectionExpanded = (sectionKey) => {
        if (expandAll) return true;
        return expandedSections[sectionKey] !== false;
    };

    const isMasterExpanded = expandAll || expandedMaster;

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
                t={t}
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
        <div className="py-2 border-top border-bottom d-flex align-items-center justify-content-between text-gray-500 fw-bold fs-7 text-uppercase">
            <span className="flex-grow-1">{t('admin.accounting.balanceSheet.account')}</span>
            <span style={{ minWidth: 120 }} className="text-end">{t('admin.accounting.balanceSheet.amount')}</span>
        </div>
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
            })}
            {isMasterExpanded ? renderSection('equity') : null}
            {combinedTotalRow}
        </div>
    );
};

const AdminBalanceSheet = () => {
    const { t } = useTranslation();
    const { setTitle, setBreadcrumbs } = useToolbar();

    const [draftFilters, setDraftFilters] = useState(defaultFilters);
    const [appliedFilters, setAppliedFilters] = useState(defaultFilters);
    const [viewMode, setViewMode] = useState('vertical');
    const [exporting, setExporting] = useState(false);
    const [expandedSections, setExpandedSections] = useState({});
    const [expandedSubTypes, setExpandedSubTypes] = useState({});
    const [expandedMaster, setExpandedMaster] = useState(true);
    const [expandAll, setExpandAll] = useState(true);

    useEffect(() => {
        setTitle(t('admin.accounting.balanceSheet.title'));
        setBreadcrumbs([
            { label: t('admin.sidebar.dashboard'), path: '/admin/dashboard' },
            { label: t('admin.sidebar.accounting'), path: '/admin/accounting/chart-of-accounts' },
            { label: t('admin.accounting.balanceSheet.title') },
        ]);
    }, [setTitle, setBreadcrumbs, t]);

    const queryParams = useMemo(() => ({ ...appliedFilters }), [appliedFilters]);

    const { data, isLoading, isError, error, refetch, isFetching } = useBalanceSheet(queryParams);

    const handleApply = () => setAppliedFilters({ ...draftFilters });

    const handleReset = () => {
        const reset = defaultFilters();
        setDraftFilters(reset);
        setAppliedFilters(reset);
    };

    const handleExpandCollapseAll = (shouldExpand) => {
        setExpandAll(shouldExpand);
        if (shouldExpand) {
            setExpandedSections({});
            setExpandedSubTypes({});
            setExpandedMaster(true);
        } else {
            setExpandedSections({ assets: false, liabilities: false, equity: false });
            setExpandedSubTypes({});
            setExpandedMaster(false);
        }
    };

    const handleToggleSection = (sectionKey) => {
        setExpandAll(false);
        setExpandedSections((prev) => ({
            ...prev,
            [sectionKey]: prev[sectionKey] === false,
        }));
    };

    const handleToggleSubType = (id) => {
        setExpandAll(false);
        setExpandedSubTypes((prev) => ({
            ...prev,
            [id]: prev[id] === false,
        }));
    };

    const handleToggleMaster = () => {
        setExpandAll(false);
        setExpandedMaster((prev) => !prev);
    };

    const handleExport = async () => {
        try {
            setExporting(true);
            const blob = await downloadBalanceSheetExport(queryParams);
            triggerBlobDownload(blob, `balance_sheet_${appliedFilters.end_date}.xlsx`);
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
                                <div className="col-lg-4 col-md-8">
                                    <div className="d-flex flex-wrap gap-2 align-items-center">
                                        <div className="btn-group btn-group-sm">
                                            <button
                                                type="button"
                                                className={`btn ${viewMode === 'vertical' ? 'btn-primary' : 'btn-light'}`}
                                                onClick={() => setViewMode('vertical')}
                                            >
                                                {t('admin.accounting.balanceSheet.vertical')}
                                            </button>
                                            <button
                                                type="button"
                                                className={`btn ${viewMode === 'horizontal' ? 'btn-primary' : 'btn-light'}`}
                                                onClick={() => setViewMode('horizontal')}
                                            >
                                                {t('admin.accounting.balanceSheet.horizontal')}
                                            </button>
                                        </div>
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-light"
                                            onClick={() => handleExpandCollapseAll(!expandAll)}
                                        >
                                            {expandAll
                                                ? t('admin.accounting.balanceSheet.collapseAll')
                                                : t('admin.accounting.balanceSheet.expandAll')}
                                        </button>
                                    </div>
                                </div>
                                <div className="col-lg-4 col-md-12">
                                    <div className="d-flex flex-wrap gap-2 justify-content-lg-end">
                                        <button type="button" className="btn btn-sm btn-primary" onClick={handleApply}>
                                            {t('admin.accounting.ledger.apply')}
                                        </button>
                                        <button type="button" className="btn btn-sm btn-light" onClick={handleReset}>
                                            {t('admin.accounting.ledger.reset')}
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-light-primary"
                                            onClick={handleExport}
                                            disabled={exporting}
                                        >
                                            {exporting ? t('common.loading') : t('admin.accounting.balanceSheet.export')}
                                        </button>
                                        {data ? (
                                            <span className={`badge ${data.is_balanced ? 'badge-light-success' : 'badge-light-danger'} align-self-center`}>
                                                {data.is_balanced
                                                    ? t('admin.accounting.systemBalanced')
                                                    : t('admin.accounting.systemUnbalanced')}
                                            </span>
                                        ) : null}
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
                            <BalanceSheetContent
                                data={data}
                                viewMode={viewMode}
                                expandAll={expandAll}
                                expandedSections={expandedSections}
                                expandedSubTypes={expandedSubTypes}
                                expandedMaster={expandedMaster}
                                onToggleSection={handleToggleSection}
                                onToggleSubType={handleToggleSubType}
                                onToggleMaster={handleToggleMaster}
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

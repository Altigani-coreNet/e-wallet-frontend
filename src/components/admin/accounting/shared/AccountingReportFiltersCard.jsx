import React from 'react';
import { useTranslation } from 'react-i18next';

const AccountingReportFiltersCard = ({
    draftFilters,
    onStartDateChange,
    onEndDateChange,
    onApply,
    onReset,
    viewMode,
    onViewModeChange,
    verticalLabel,
    horizontalLabel,
}) => {
    const { t } = useTranslation();

    return (
        <div className="card mb-5 mb-xl-8">
            <div className="card-header border-0 pt-6">
                <h3 className="card-title align-items-start flex-column">
                    <span className="card-label fw-bold fs-3 mb-1">
                        {t('admin.accounting.reports.filtersTitle')}
                    </span>
                </h3>
            </div>
            <div className="card-body pt-0">
                <div className="row g-3 align-items-end">
                    <div className="col-lg-3 col-md-4">
                        <label className="form-label fs-7 fw-semibold text-gray-700">
                            {t('admin.accounting.filters.startDate')}
                        </label>
                        <input
                            type="date"
                            className="form-control form-control-sm"
                            value={draftFilters.start_date}
                            onChange={(e) => onStartDateChange(e.target.value)}
                        />
                    </div>
                    <div className="col-lg-3 col-md-4">
                        <label className="form-label fs-7 fw-semibold text-gray-700">
                            {t('admin.accounting.filters.endDate')}
                        </label>
                        <input
                            type="date"
                            className="form-control form-control-sm"
                            value={draftFilters.end_date}
                            onChange={(e) => onEndDateChange(e.target.value)}
                        />
                    </div>
                    {onViewModeChange ? (
                        <div className="col-lg-3 col-md-4">
                            <label className="form-label fs-7 fw-semibold text-gray-700 d-block">
                                {t('admin.accounting.reports.layout')}
                            </label>
                            <div className="btn-group btn-group-sm">
                                <button
                                    type="button"
                                    className={`btn ${viewMode === 'vertical' ? 'btn-primary' : 'btn-light'}`}
                                    onClick={() => onViewModeChange('vertical')}
                                >
                                    {verticalLabel}
                                </button>
                                <button
                                    type="button"
                                    className={`btn ${viewMode === 'horizontal' ? 'btn-primary' : 'btn-light'}`}
                                    onClick={() => onViewModeChange('horizontal')}
                                >
                                    {horizontalLabel}
                                </button>
                            </div>
                        </div>
                    ) : null}
                    <div className="col-lg-3 col-md-12">
                        <div className="d-flex flex-wrap gap-2">
                            <button type="button" className="btn btn-sm btn-primary" onClick={onApply}>
                                {t('admin.accounting.ledger.apply')}
                            </button>
                            <button type="button" className="btn btn-sm btn-light" onClick={onReset}>
                                {t('admin.accounting.ledger.reset')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AccountingReportFiltersCard;

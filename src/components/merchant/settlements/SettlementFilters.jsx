import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';

const SettlementFilters = ({ filters, onFilterChange, onClearFilters }) => {
    const { t } = useTranslation();
    const fromDateRef = useRef(null);
    const toDateRef = useRef(null);

    const statusLabel = (value) => {
        const m = { settled: 'statusSettled', pending: 'statusPending', failed: 'statusFailed' }[value?.toLowerCase()];
        return m ? t(`merchant.settlements.${m}`) : value;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        onFilterChange({ [name]: value });
    };

    const handleDateInputClick = (ref) => {
        if (ref && ref.current) {
            if (ref.current.showPicker && typeof ref.current.showPicker === 'function') {
                ref.current.showPicker().catch(() => {
                    ref.current.focus();
                });
            } else {
                ref.current.focus();
                setTimeout(() => {
                    ref.current.click();
                }, 10);
            }
        }
    };

    return (
        <div className="card bg-white card-xl-stretch mb-5">
            <div className="card-body">
                <div className="row">
                    <div className="col-md-3">
                        <label className="form-label">{t('merchant.common.search')}</label>
                        <input
                            type="text"
                            name="search"
                            className="form-control form-control-sm"
                            placeholder={t('merchant.settlements.filterSearchPlaceholder')}
                            value={filters.search || ''}
                            onChange={handleInputChange}
                        />
                    </div>

                    <div className="col-md-3">
                        <label className="form-label">{t('merchant.common.status')}</label>
                        <select
                            name="status"
                            className="form-select form-select-sm"
                            value={filters.status || ''}
                            onChange={handleInputChange}
                        >
                            <option value="">{t('merchant.common.all')}</option>
                            <option value="settled">{t('merchant.settlements.statusSettled')}</option>
                            <option value="pending">{t('merchant.settlements.statusPending')}</option>
                            <option value="failed">{t('merchant.settlements.statusFailed')}</option>
                        </select>
                    </div>
                
                    <div className="col-md-3">
                        <label className="form-label">{t('merchant.common.fromDate')}</label>
                        <input
                            ref={fromDateRef}
                            type="date"
                            name="from_date"
                            className="form-control form-control-sm"
                            value={filters.from_date || ''}
                            onChange={handleInputChange}
                            onClick={() => handleDateInputClick(fromDateRef)}
                            onFocus={() => handleDateInputClick(fromDateRef)}
                        />
                    </div>
                    <div className="col-md-3">
                        <label className="form-label">{t('merchant.common.toDate')}</label>
                        <input
                            ref={toDateRef}
                            type="date"
                            name="to_date"
                            className="form-control form-control-sm"
                            value={filters.to_date || ''}
                            onChange={handleInputChange}
                            onClick={() => handleDateInputClick(toDateRef)}
                            onFocus={() => handleDateInputClick(toDateRef)}
                        />
                    </div>
                </div>

                <div className="row mt-3">
                    <div className="col-8">
                        {(filters.search || filters.status || filters.from_date || filters.to_date) && (
                            <div className="text-muted fs-7">
                                <i className="ki-duotone ki-filter fs-6 text-muted me-1">
                                    <span className="path1"></span>
                                    <span className="path2"></span>
                                </i>
                                <span>
                                    {[
                                        filters.search && t('merchant.settlements.filterSummarySearch', { value: filters.search }),
                                        filters.status && t('merchant.settlements.filterSummaryStatus', { value: statusLabel(filters.status) }),
                                        filters.from_date && t('merchant.settlements.filterSummaryFrom', { value: filters.from_date }),
                                        filters.to_date && t('merchant.settlements.filterSummaryTo', { value: filters.to_date })
                                    ].filter(Boolean).join(', ')}
                                </span>
                            </div>
                        )}
                    </div>
                    <div className="col-4 text-end">
                        <button 
                            type="button" 
                            className="btn btn-secondary btn-sm"
                            onClick={onClearFilters}
                        >
                            <i className="ki-duotone ki-filter-remove fs-3">
                                <span className="path1"></span>
                                <span className="path2"></span>
                            </i>
                            {t('merchant.settlements.clearFilters')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettlementFilters;

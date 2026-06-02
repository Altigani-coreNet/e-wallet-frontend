import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';

const BranchesFilters = ({ filters, onFilterChange, onClear }) => {
    const { t } = useTranslation();
    const dateFromRef = useRef(null);
    const dateToRef = useRef(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        onFilterChange(prev => ({
            ...prev,
            [name]: value
        }));
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
        <div className="card bg-white card-xl-stretch mb-5 mb-xl-8">
            <div className="card-header border-0 pt-6">
                <div className="card-title">
                    <h3 className="fw-bold m-0">{t('merchant.branchesIndex.filters')}</h3>
                </div>
                <div className="card-toolbar">
                    <button 
                        type="button" 
                        className="btn btn-sm btn-light-primary"
                        onClick={onClear}
                    >
                        <i className="ki-duotone ki-refresh fs-2">
                            <span className="path1"></span>
                            <span className="path2"></span>
                        </i>
                        {t('merchant.branchesIndex.clearFilters')}
                    </button>
                </div>
            </div>

            <div className="card-body">
                <div className="row g-4">
                    <div className="col-md-3">
                        <label className="form-label fw-bold">{t('merchant.branchesIndex.search')}</label>
                        <input
                            type="text"
                            className="form-control"
                            name="search"
                            placeholder={t('merchant.branchesIndex.searchPlaceholder')}
                            value={filters.search || ''}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="col-md-3">
                        <label className="form-label fw-bold">{t('merchant.branchesIndex.status')}</label>
                        <select
                            className="form-select"
                            name="status"
                            value={filters.status || ''}
                            onChange={handleChange}
                        >
                            <option value="">{t('merchant.branchesIndex.allStatuses')}</option>
                            <option value="pending">{t('merchant.branchesIndex.statusPending')}</option>
                            <option value="approved">{t('merchant.branchesIndex.statusApproved')}</option>
                            <option value="rejected">{t('merchant.branchesIndex.statusRejected')}</option>
                        </select>
                    </div>

                    <div className="col-md-3">
                        <label className="form-label fw-bold">{t('merchant.branchesIndex.dateFrom')}</label>
                        <input
                            ref={dateFromRef}
                            type="date"
                            className="form-control"
                            name="date_from"
                            value={filters.date_from || ''}
                            onChange={handleChange}
                            onClick={() => handleDateInputClick(dateFromRef)}
                        />
                    </div>

                    <div className="col-md-3">
                        <label className="form-label fw-bold">{t('merchant.branchesIndex.dateTo')}</label>
                        <input
                            ref={dateToRef}
                            type="date"
                            className="form-control"
                            name="date_to"
                            value={filters.date_to || ''}
                            onChange={handleChange}
                            onClick={() => handleDateInputClick(dateToRef)}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BranchesFilters;

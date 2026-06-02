import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';

const TerminalsFilters = ({ filters, setFilters, onClear, onClose }) => {
    const { t } = useTranslation();
    const dateFromRef = useRef(null);
    const dateToRef = useRef(null);

    const handleChange = (field, value) => {
        setFilters(prev => ({ ...prev, [field]: value }));
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
        <div className="card card-flush mb-5">
            <div className="card-header">
                <h3 className="card-title">{t('merchant.terminalsIndex.filters')}</h3>
                <div className="card-toolbar">
                    <button 
                        type="button" 
                        className="btn btn-sm btn-light-primary me-2"
                        onClick={onClear}
                    >
                        <i className="ki-duotone ki-refresh fs-2">
                            <span className="path1"></span>
                            <span className="path2"></span>
                        </i>
                        {t('merchant.terminalsIndex.clearFilters')}
                    </button>
                    <button 
                        type="button" 
                        className="btn btn-sm btn-icon btn-active-light-primary"
                        onClick={onClose}
                        aria-label={t('merchant.importBranches.close')}
                    >
                        <i className="ki-duotone ki-cross fs-1">
                            <span className="path1"></span>
                            <span className="path2"></span>
                        </i>
                    </button>
                </div>
            </div>
            <div className="card-body">
                <div className="row g-5">
                    <div className="col-md-6">
                        <label className="form-label">{t('merchant.terminalsIndex.search')}</label>
                        <input
                            type="text"
                            className="form-control"
                            placeholder={t('merchant.terminalsIndex.searchPlaceholder')}
                            value={filters.search || ''}
                            onChange={(e) => handleChange('search', e.target.value)}
                        />
                    </div>

                    <div className="col-md-6">
                        <label className="form-label">{t('merchant.terminalsIndex.status')}</label>
                        <select
                            className="form-select"
                            value={filters.status || ''}
                            onChange={(e) => handleChange('status', e.target.value)}
                        >
                            <option value="">{t('merchant.terminalsIndex.allStatuses')}</option>
                            <option value="active">{t('merchant.common.active')}</option>
                            <option value="inactive">{t('merchant.common.inactive')}</option>
                        </select>
                    </div>

                    <div className="col-md-6">
                        <label className="form-label">{t('merchant.terminalsIndex.dateFrom')}</label>
                        <input
                            ref={dateFromRef}
                            type="date"
                            className="form-control"
                            value={filters.date_from || ''}
                            onChange={(e) => handleChange('date_from', e.target.value)}
                            onClick={() => handleDateInputClick(dateFromRef)}
                        />
                    </div>

                    <div className="col-md-6">
                        <label className="form-label">{t('merchant.terminalsIndex.dateTo')}</label>
                        <input
                            ref={dateToRef}
                            type="date"
                            className="form-control"
                            value={filters.date_to || ''}
                            onChange={(e) => handleChange('date_to', e.target.value)}
                            onClick={() => handleDateInputClick(dateToRef)}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TerminalsFilters;

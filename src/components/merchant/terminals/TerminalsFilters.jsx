import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';

const TerminalsFilters = ({ isVisible, filters, onFilterChange, onClearFilters, onApply }) => {
    const { t } = useTranslation();
    const dateFromRef = useRef(null);
    const dateToRef = useRef(null);

    if (!isVisible) {
        return null;
    }

    const handleChange = (field, value) => {
        onFilterChange({ ...filters, [field]: value });
    };

    const handleDateInputClick = (ref) => {
        if (ref?.current?.showPicker) {
            ref.current.showPicker().catch(() => ref.current.focus());
        } else {
            ref?.current?.focus();
        }
    };

    return (
        <div className="card mb-5 mb-xl-8">
            <div className="card-body py-6">
                <div className="row g-5">
                    <div className="col-md-4">
                        <label className="form-label fw-bold">{t('merchant.terminalsIndex.status')}</label>
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

                    <div className="col-md-4">
                        <label className="form-label fw-bold">{t('merchant.terminalsIndex.terminalStatus', { defaultValue: 'Terminal Status' })}</label>
                        <select
                            className="form-select"
                            value={filters.terminal_status || ''}
                            onChange={(e) => handleChange('terminal_status', e.target.value)}
                        >
                            <option value="">{t('merchant.terminalsIndex.allStatuses')}</option>
                            <option value="online">{t('merchant.common.online', { defaultValue: 'Online' })}</option>
                            <option value="offline">{t('merchant.common.offline', { defaultValue: 'Offline' })}</option>
                            <option value="testing">{t('merchant.common.testing', { defaultValue: 'Testing' })}</option>
                            <option value="maintenance">{t('merchant.common.maintenance', { defaultValue: 'Maintenance' })}</option>
                        </select>
                    </div>

                    <div className="col-md-4">
                        <label className="form-label fw-bold">{t('merchant.terminalsIndex.dateFrom')}</label>
                        <input
                            ref={dateFromRef}
                            type="date"
                            className="form-control"
                            value={filters.date_from || ''}
                            onChange={(e) => handleChange('date_from', e.target.value)}
                            onClick={() => handleDateInputClick(dateFromRef)}
                        />
                    </div>

                    <div className="col-md-4">
                        <label className="form-label fw-bold">{t('merchant.terminalsIndex.dateTo')}</label>
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

                <div className="d-flex justify-content-end gap-2 mt-6">
                    <button type="button" className="btn btn-light" onClick={onClearFilters}>
                        {t('merchant.terminalsIndex.clearFilters')}
                    </button>
                    <button type="button" className="btn btn-primary" onClick={onApply}>
                        {t('merchant.common.applyFilters', { defaultValue: 'Apply Filters' })}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TerminalsFilters;

import React from 'react';
import { useTranslation } from 'react-i18next';

const AdminDashboardFilters = ({ filters, onFilterChange, onApplyFilters, onClearFilters, isCollapsed }) => {
    const { t } = useTranslation();
    if (isCollapsed) return null;

    return (
        <div className="card mb-5">
            <div className="card-body">
                <div className="row g-3 align-items-end">
                    <div className="col-6">
                        <label className="form-label">{t('admin.paymentGetway.fromDateTime')}</label>
                        <input
                            type="datetime-local"
                            className="form-control"
                            step="60"
                            value={filters.datetime_from}
                            onChange={(e) => onFilterChange({ datetime_from: e.target.value })}
                        />
                    </div>
                    <div className="col-6">
                        <label className="form-label">{t('admin.paymentGetway.toDateTime')}</label>
                        <input
                            type="datetime-local"
                            className="form-control"
                            step="60"
                            value={filters.datetime_to}
                            onChange={(e) => onFilterChange({ datetime_to: e.target.value })}
                        />
                    </div>
                    <div className="col-12 d-flex gap-2 justify-content-end">
                        <button className="btn btn-secondary" onClick={onClearFilters}>
                            {t('admin.paymentGetway.clearFilters')}
                        </button>
                        <button className="btn btn-primary" onClick={onApplyFilters}>
                            {t('admin.paymentGetway.applyFilters')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboardFilters;




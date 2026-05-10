import React from 'react';
import { useTranslation } from 'react-i18next';

const AdminDashboardFilters = ({ filters, onFilterChange, onApplyFilters, onClearFilters, isCollapsed }) => {
    const { t } = useTranslation();
    if (isCollapsed) return null;

    return (
        <div className="card mb-5">
            <div className="card-body">
                <div className="row g-3">
                    <div className="col-md-3">
                        <label className="form-label">{t('admin.dashboard.dateFrom')}</label>
                        <input
                            type="date"
                            className="form-control"
                            value={filters.datetime_from}
                            onChange={(e) => onFilterChange({ datetime_from: e.target.value })}
                        />
                    </div>
                    <div className="col-md-3">
                        <label className="form-label">{t('admin.dashboard.dateTo')}</label>
                        <input
                            type="date"
                            className="form-control"
                            value={filters.datetime_to}
                            onChange={(e) => onFilterChange({ datetime_to: e.target.value })}
                        />
                    </div>
                    <div className="col-md-3">
                        <label className="form-label">{t('admin.dashboard.transactionStatus')}</label>
                        <select
                            className="form-select"
                            value={filters.transaction_status}
                            onChange={(e) => onFilterChange({ transaction_status: e.target.value })}
                        >
                            <option value="">{t('admin.dashboard.allStatuses')}</option>
                            <option value="approved">{t('admin.dashboard.approved')}</option>
                            <option value="declined">{t('admin.dashboard.declined')}</option>
                            <option value="pending">{t('admin.dashboard.pending')}</option>
                        </select>
                    </div>
                    <div className="col-12 d-flex gap-2 justify-content-end">
                        <button className="btn btn-secondary" onClick={onClearFilters}>
                            {t('admin.dashboard.clearFilters')}
                        </button>
                        <button className="btn btn-primary" onClick={onApplyFilters}>
                            {t('admin.dashboard.applyFilters')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboardFilters;




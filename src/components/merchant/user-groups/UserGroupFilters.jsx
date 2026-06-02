import React from 'react';
import { useTranslation } from 'react-i18next';

const UserGroupFilters = ({ filters, onFilterChange, onClearFilters }) => {
    const { t } = useTranslation();

    const handleInputChange = (field, value) => {
        onFilterChange({ [field]: value });
    };

    const hasActiveFilters = filters.search || filters.status || filters.branch_id || filters.date_from || filters.date_to;

    return (
        <div className="card bg-white card-xl-stretch mb-5 mb-xl-8">
            <div className="card-body">
                <div className="row">
                    <div className="col-md-4 mb-3">
                        <label htmlFor="search" className="form-label">{t('merchant.userGroupsUI.filters.search')}</label>
                        <input
                            type="text"
                            className="form-control"
                            id="search"
                            placeholder={t('merchant.userGroupsUI.filters.searchPlaceholder')}
                            value={filters.search || ''}
                            onChange={(e) => handleInputChange('search', e.target.value)}
                        />
                    </div>

                    <div className="col-md-4 mb-3">
                        <label htmlFor="status" className="form-label">{t('merchant.userGroupsUI.filters.status')}</label>
                        <select
                            className="form-select"
                            id="status"
                            value={filters.status || ''}
                            onChange={(e) => handleInputChange('status', e.target.value)}
                        >
                            <option value="">{t('merchant.userGroupsUI.filters.allStatus')}</option>
                            <option value="active">{t('merchant.userGroupsUI.filters.active')}</option>
                            <option value="inactive">{t('merchant.userGroupsUI.filters.inactive')}</option>
                        </select>
                    </div>

                    <div className="col-md-4 mb-3">
                        <label htmlFor="date_from" className="form-label">{t('merchant.userGroupsUI.filters.dateFrom')}</label>
                        <input
                            type="date"
                            className="form-control"
                            id="date_from"
                            value={filters.date_from || ''}
                            onChange={(e) => handleInputChange('date_from', e.target.value)}
                        />
                    </div>

                    <div className="col-md-4 mb-3">
                        <label htmlFor="date_to" className="form-label">{t('merchant.userGroupsUI.filters.dateTo')}</label>
                        <input
                            type="date"
                            className="form-control"
                            id="date_to"
                            value={filters.date_to || ''}
                            onChange={(e) => handleInputChange('date_to', e.target.value)}
                        />
                    </div>
                </div>

                {hasActiveFilters && (
                    <div className="d-flex justify-content-between align-items-center mt-4">
                        <div className="text-muted fs-7">
                            <i className="ki-duotone ki-information fs-5 text-primary me-1">
                                <span className="path1"></span>
                                <span className="path2"></span>
                                <span className="path3"></span>
                            </i>
                            {t('merchant.userGroupsUI.filters.filtersAutoApply')}
                        </div>
                        <button
                            type="button"
                            className="btn btn-sm btn-light-primary"
                            onClick={onClearFilters}
                        >
                            <i className="ki-duotone ki-arrows-circle fs-3">
                                <span className="path1"></span>
                                <span className="path2"></span>
                            </i>
                            {t('merchant.userGroupsUI.filters.clearFilters')}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserGroupFilters;

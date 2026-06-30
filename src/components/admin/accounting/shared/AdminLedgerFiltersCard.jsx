import React from 'react';
import { useTranslation } from 'react-i18next';
import SearchableDropdown from '../../../common/filters/SearchableDropdown';

const AdminLedgerFiltersCard = ({
    draftFilters,
    accountOptions,
    customerOptions,
    selectedAccountOption,
    selectedCustomerOption,
    onStartDateChange,
    onEndDateChange,
    onStartTimeChange,
    onEndTimeChange,
    onAccountSelect,
    onAccountClear,
    onCustomerSelect,
    onCustomerClear,
    onApply,
    onReset,
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
                    <div className="col-lg-3 col-md-6">
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
                    <div className="col-lg-3 col-md-6">
                        <label className="form-label fs-7 fw-semibold text-gray-700">
                            {t('admin.accounting.filters.startTime')}
                        </label>
                        <input
                            type="time"
                            className="form-control form-control-sm"
                            value={draftFilters.start_time}
                            onChange={(e) => onStartTimeChange(e.target.value)}
                        />
                    </div>
                    <div className="col-lg-3 col-md-6">
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
                    <div className="col-lg-3 col-md-6">
                        <label className="form-label fs-7 fw-semibold text-gray-700">
                            {t('admin.accounting.filters.endTime')}
                        </label>
                        <input
                            type="time"
                            className="form-control form-control-sm"
                            value={draftFilters.end_time}
                            onChange={(e) => onEndTimeChange(e.target.value)}
                        />
                    </div>
                    <div className="col-lg-6 col-md-6">
                        <SearchableDropdown
                            label={t('admin.accounting.ledger.account')}
                            placeholder={t('admin.accounting.ledger.allAccounts')}
                            searchPlaceholder={t('admin.accounting.ledger.searchAccount')}
                            options={accountOptions}
                            selected={selectedAccountOption}
                            onSelect={onAccountSelect}
                            onClear={onAccountClear}
                            emptyText={t('admin.accounting.ledger.noAccountResults')}
                        />
                    </div>
                    <div className="col-lg-6 col-md-6">
                        <SearchableDropdown
                            label={t('admin.accounting.ledger.customer')}
                            placeholder={t('admin.accounting.ledger.selectCustomer')}
                            searchPlaceholder={t('admin.accounting.ledger.searchCustomer')}
                            options={customerOptions}
                            selected={selectedCustomerOption}
                            onSelect={onCustomerSelect}
                            onClear={onCustomerClear}
                            emptyText={t('admin.accounting.ledger.noCustomerResults')}
                        />
                    </div>
                    <div className="col-12">
                        <div className="d-flex flex-wrap gap-2">
                            <button type="button" className="btn btn-sm btn-primary" onClick={onApply}>
                                <i className="ki-duotone ki-magnifier fs-5 me-1">
                                    <span className="path1" />
                                    <span className="path2" />
                                </i>
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

export default AdminLedgerFiltersCard;

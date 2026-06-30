import React from 'react';
import { useTranslation } from 'react-i18next';

const CustomerTransactionFiltersPanel = ({ filters, onChange, onClear }) => {
    const { t } = useTranslation();

    const handleChange = (e) => {
        const { name, value } = e.target;
        onChange({ ...filters, [name]: value });
    };

    return (
        <div className="card mb-5">
            <div className="card-header border-0 pt-6">
                <div className="card-title">
                    <h3 className="fw-bold m-0">{t('admin.wallets.filters')}</h3>
                </div>
                <div className="card-toolbar">
                    <button type="button" className="btn btn-sm btn-light" onClick={onClear}>
                        {t('common.clearFilters')}
                    </button>
                </div>
            </div>
            <div className="card-body">
                <div className="row g-4">
                    <div className="col-md-4">
                        <label className="form-label fw-bold">{t('common.search')}</label>
                        <input
                            type="text"
                            className="form-control form-control-solid"
                            name="search"
                            value={filters.search}
                            onChange={handleChange}
                            placeholder={t('admin.wallets.txSearchPlaceholder')}
                        />
                    </div>
                    <div className="col-md-4">
                        <label className="form-label fw-bold">{t('admin.wallets.direction')}</label>
                        <select
                            className="form-select form-select-solid"
                            name="direction"
                            value={filters.direction}
                            onChange={handleChange}
                        >
                            <option value="">{t('common.all')}</option>
                            <option value="debit">{t('admin.wallets.debit')}</option>
                            <option value="credit">{t('admin.wallets.credit')}</option>
                        </select>
                    </div>
                    <div className="col-md-4">
                        <label className="form-label fw-bold">{t('admin.wallets.type')}</label>
                        <select
                            className="form-select form-select-solid"
                            name="type"
                            value={filters.type}
                            onChange={handleChange}
                        >
                            <option value="">{t('common.all')}</option>
                            <option value="topup">Top-up</option>
                            <option value="payment">Payment</option>
                            <option value="transfer">Transfer</option>
                            <option value="refund">Refund</option>
                            <option value="adjustment">Adjustment</option>
                        </select>
                    </div>
                    <div className="col-md-4">
                        <label className="form-label fw-bold">{t('common.dateFrom')}</label>
                        <input
                            type="date"
                            className="form-control form-control-solid"
                            name="date_from"
                            value={filters.date_from}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="col-md-4">
                        <label className="form-label fw-bold">{t('common.dateTo')}</label>
                        <input
                            type="date"
                            className="form-control form-control-solid"
                            name="date_to"
                            value={filters.date_to}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="col-md-4">
                        <label className="form-label fw-bold">{t('admin.wallets.minAmount')}</label>
                        <input
                            type="number"
                            step="0.01"
                            className="form-control form-control-solid"
                            name="min_amount"
                            value={filters.min_amount}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="col-md-4">
                        <label className="form-label fw-bold">{t('admin.wallets.maxAmount')}</label>
                        <input
                            type="number"
                            step="0.01"
                            className="form-control form-control-solid"
                            name="max_amount"
                            value={filters.max_amount}
                            onChange={handleChange}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomerTransactionFiltersPanel;

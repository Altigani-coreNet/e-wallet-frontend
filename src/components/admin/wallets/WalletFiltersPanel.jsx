import React from 'react';
import { useTranslation } from 'react-i18next';

const WalletFiltersPanel = ({ filters, onChange, onClear }) => {
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
                            placeholder={t('admin.wallets.searchPlaceholder')}
                        />
                    </div>
                    <div className="col-md-4">
                        <label className="form-label fw-bold">{t('admin.wallets.walletType')}</label>
                        <select
                            className="form-select form-select-solid"
                            name="wallet_type"
                            value={filters.wallet_type}
                            onChange={handleChange}
                        >
                            <option value="">{t('common.all')}</option>
                            <option value="master">{t('admin.wallets.typeMaster')}</option>
                            <option value="user">{t('admin.wallets.typeUser')}</option>
                        </select>
                    </div>
                    <div className="col-md-4">
                        <label className="form-label fw-bold">{t('common.status')}</label>
                        <select
                            className="form-select form-select-solid"
                            name="status"
                            value={filters.status}
                            onChange={handleChange}
                        >
                            <option value="">{t('common.all')}</option>
                            <option value="active">{t('admin.wallets.statusActive')}</option>
                            <option value="frozen">{t('admin.wallets.statusFrozen')}</option>
                            <option value="closed">{t('admin.wallets.statusClosed')}</option>
                        </select>
                    </div>
                    <div className="col-md-4">
                        <label className="form-label fw-bold">{t('admin.wallets.currency')}</label>
                        <input
                            type="text"
                            className="form-control form-control-solid"
                            name="currency_code"
                            value={filters.currency_code}
                            onChange={handleChange}
                            placeholder="SDG"
                        />
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
                        <label className="form-label fw-bold">{t('admin.wallets.minBalance')}</label>
                        <input
                            type="number"
                            step="0.01"
                            className="form-control form-control-solid"
                            name="min_balance"
                            value={filters.min_balance}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="col-md-4">
                        <label className="form-label fw-bold">{t('admin.wallets.maxBalance')}</label>
                        <input
                            type="number"
                            step="0.01"
                            className="form-control form-control-solid"
                            name="max_balance"
                            value={filters.max_balance}
                            onChange={handleChange}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WalletFiltersPanel;

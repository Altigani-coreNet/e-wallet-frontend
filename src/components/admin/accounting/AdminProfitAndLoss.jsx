import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import LoadingSpinner from '../../common/LoadingSpinner';
import ErrorAlert from '../../common/ErrorAlert';
import { fmtMoney, useProfitAndLoss } from '../../../services/adminAccountingService';
import styles from './AdminChartOfAccounts.module.css';

const AdminProfitAndLoss = () => {
    const { t } = useTranslation();
    const today = new Date().toISOString().slice(0, 10);
    const yearStart = `${new Date().getFullYear()}-01-01`;

    const [filters, setFilters] = useState({
        start_date: yearStart,
        end_date: today,
    });

    const { data, isLoading, isError, error, refetch } = useProfitAndLoss(filters);

    const renderSection = (title, section) => (
        <div className={styles.reportCard}>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h3 className={styles.reportSectionTitle}>{title}</h3>
                <span className="fw-bold fs-5">{fmtMoney(section?.total)}</span>
            </div>
            <div className="table-responsive">
                <table className="table table-row-dashed mb-0">
                    <thead>
                        <tr className="text-muted fs-8 text-uppercase">
                            <th>{t('admin.accounting.columns.code')}</th>
                            <th>{t('admin.accounting.columns.name')}</th>
                            <th className="text-end">{t('admin.accounting.columns.balance')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(section?.accounts || []).length === 0 ? (
                            <tr>
                                <td colSpan={3} className="text-center text-muted py-6">
                                    {t('admin.accounting.reports.noAccounts')}
                                </td>
                            </tr>
                        ) : (
                            section.accounts.map((account) => (
                                <tr key={account.id}>
                                    <td>{account.code}</td>
                                    <td>{account.name}</td>
                                    <td className="text-end fw-semibold">{fmtMoney(account.balance)}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );

    return (
        <div className="container-fluid py-4">
            <div className={styles.pageHeader}>
                <div>
                    <h1 className={styles.pageTitle}>{t('admin.accounting.profitLoss.title')}</h1>
                    <p className={styles.pageSubtitle}>{t('admin.accounting.profitLoss.subtitle')}</p>
                </div>
            </div>

            <div className="card mb-4">
                <div className="card-body">
                    <div className="row g-3">
                        <div className="col-md-3">
                            <label className="form-label">{t('admin.accounting.filters.startDate')}</label>
                            <input
                                type="date"
                                className="form-control"
                                value={filters.start_date}
                                onChange={(e) => setFilters((prev) => ({ ...prev, start_date: e.target.value }))}
                            />
                        </div>
                        <div className="col-md-3">
                            <label className="form-label">{t('admin.accounting.filters.endDate')}</label>
                            <input
                                type="date"
                                className="form-control"
                                value={filters.end_date}
                                onChange={(e) => setFilters((prev) => ({ ...prev, end_date: e.target.value }))}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {isError ? (
                <ErrorAlert message={error?.message || t('admin.accounting.loadFailed')} onRetry={refetch} />
            ) : isLoading ? (
                <LoadingSpinner />
            ) : (
                <>
                    <div className="row g-3 mb-4">
                        <div className="col-md-4">
                            <div className={styles.summaryCard}>
                                <div>
                                    <p className={styles.summaryLabel}>{t('admin.accounting.profitLoss.grossProfit')}</p>
                                    <p className={`${styles.summaryValue} text-success`}>{fmtMoney(data?.gross_profit)}</p>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className={styles.summaryCard}>
                                <div>
                                    <p className={styles.summaryLabel}>{t('admin.accounting.profitLoss.netProfit')}</p>
                                    <p className={`${styles.summaryValue} ${Number(data?.net_profit) >= 0 ? 'text-success' : 'text-danger'}`}>
                                        {fmtMoney(data?.net_profit)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {renderSection(t('admin.accounting.profitLoss.income'), data?.income)}
                    {renderSection(t('admin.accounting.profitLoss.cogs'), data?.costs_of_goods_sold)}
                    {renderSection(t('admin.accounting.profitLoss.expenses'), data?.expenses)}
                </>
            )}
        </div>
    );
};

export default AdminProfitAndLoss;

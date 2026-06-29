import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import LoadingSpinner from '../../common/LoadingSpinner';
import ErrorAlert from '../../common/ErrorAlert';
import {
    TYPE_CONFIG,
    downloadChartOfAccountsExport,
    downloadChartOfAccountsSample,
    fmtCompact,
    fmtMoney,
    triggerBlobDownload,
    useChartOfAccountMutations,
    useChartOfAccounts,
} from '../../../services/adminAccountingService';
import AdminChartOfAccountForm from './AdminChartOfAccountForm';
import ChartAccountImportModal from './ChartAccountImportModal';
import styles from './AdminChartOfAccounts.module.css';

const flattenAccounts = (groups = []) => {
    const accounts = [];
    (Array.isArray(groups) ? groups : []).forEach((group) => {
        (group.sub_types ?? []).forEach((subType) => {
            (subType.accounts ?? []).forEach((account) => {
                accounts.push({
                    ...account,
                    groupTypeKey: group.type_key,
                    groupTypeName: group.type_name,
                    subTypeName: subType.sub_type_name,
                });
            });
        });
    });
    return accounts;
};

const filterAccounts = (accounts = [], filters) => {
    const search = (filters.search || '').trim().toLowerCase();

    return accounts.filter((account) => {
        const name = String(account?.name ?? '').toLowerCase();
        const code = String(account?.code ?? '');
        const matchesSearch =
            !search ||
            name.includes(search) ||
            code.includes(search);
        const matchesType = filters.type === 'all' || account?.type_key === filters.type;
        const matchesStatus =
            filters.status === 'all' ||
            (filters.status === 'active' && account?.status === 'active') ||
            (filters.status === 'inactive' && account?.status === 'inactive');
        return matchesSearch && matchesType && matchesStatus;
    });
};

const ChartAccountDetailPanel = ({ account, onClose, t }) => {
    if (!account) {
        return (
            <div className={styles.detailEmpty}>
                <i className="ki-duotone ki-book fs-2x text-gray-400 mb-3">
                    <span className="path1" /><span className="path2" /><span className="path3" /><span className="path4" />
                </i>
                <p className="fw-semibold mb-1">{t('admin.accounting.detail.emptyTitle')}</p>
                <p className="text-muted fs-7">{t('admin.accounting.detail.emptySubtitle')}</p>
            </div>
        );
    }

    const cfg = TYPE_CONFIG[account.type_key] || TYPE_CONFIG.asset;

    return (
        <div className={styles.detailPanel}>
            <div className="d-flex align-items-start justify-content-between gap-2">
                <div>
                    <div className="text-muted fs-8 fw-bold">{account.code}</div>
                    <h4 className="fs-5 fw-bold mb-1">{account.name}</h4>
                    <span className={`badge ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                </div>
                <button type="button" className="btn btn-sm btn-icon btn-light d-lg-none" onClick={onClose}>
                    <i className="ki-duotone ki-cross fs-2"><span className="path1" /><span className="path2" /></i>
                </button>
            </div>

            <div className="separator my-2" />

            <div className="d-flex flex-column gap-2 fs-7">
                <div className="d-flex justify-content-between">
                    <span className="text-muted">{t('admin.accounting.detail.subType')}</span>
                    <span className="fw-semibold">{account.sub_type_name || '-'}</span>
                </div>
                <div className="d-flex justify-content-between">
                    <span className="text-muted">{t('admin.accounting.detail.periodBalance')}</span>
                    <span className="fw-bold">{fmtMoney(account.balance)}</span>
                </div>
                <div className="d-flex justify-content-between">
                    <span className="text-muted">{t('admin.accounting.detail.cumulativeBalance')}</span>
                    <span className="fw-bold">{fmtMoney(account.cumulative_balance)}</span>
                </div>
                <div className="d-flex justify-content-between">
                    <span className="text-muted">{t('admin.accounting.detail.status')}</span>
                    <span className={`badge ${account.status === 'active' ? 'badge-light-success' : 'badge-light-danger'}`}>
                        {account.status === 'active' ? t('admin.accounting.status.active') : t('admin.accounting.status.inactive')}
                    </span>
                </div>
            </div>

            {account.description ? (
                <p className="text-muted fs-8 mb-0">{account.description}</p>
            ) : null}

            <div className="mt-auto d-grid gap-2">
                <Link
                    to={`/admin/accounting/ledger-summary?account_id=${account.id}`}
                    className="btn btn-sm btn-light-primary"
                >
                    {t('admin.accounting.detail.viewLedger')}
                </Link>
            </div>
        </div>
    );
};

const TreeAccountRow = ({ account, depth, selectedId, onSelect, onEdit, onDelete, canEdit, canDelete }) => (
    <div
        className={`${styles.treeRow} ${selectedId === account.id ? styles.treeRowSelected : ''}`}
        style={{ paddingLeft: `${12 + depth * 18}px` }}
        onClick={() => onSelect(account)}
    >
        <span className={styles.treeToggle} />
        <span className={styles.accountCode}>{account.code}</span>
        <span className={styles.accountName}>{account.name}</span>
        <span className={`${styles.accountBalance} d-none d-sm-block`}>{fmtMoney(account.balance)}</span>
        <div className="d-flex gap-1 ms-2" onClick={(e) => e.stopPropagation()}>
            {canEdit ? (
                <button type="button" className="btn btn-icon btn-sm btn-light-primary" onClick={() => onEdit(account)}>
                    <i className="ki-duotone ki-pencil fs-5"><span className="path1" /><span className="path2" /></i>
                </button>
            ) : null}
            {canDelete ? (
                <button type="button" className="btn btn-icon btn-sm btn-light-danger" onClick={() => onDelete(account)}>
                    <i className="ki-duotone ki-trash fs-5"><span className="path1" /><span className="path2" /><span className="path3" /><span className="path4" /><span className="path5" /></i>
                </button>
            ) : null}
        </div>
    </div>
);

const AdminChartOfAccountsIndex = () => {
    const { t } = useTranslation();
    const today = new Date().toISOString().slice(0, 10);
    const yearStart = `${new Date().getFullYear()}-01-01`;

    const [filters, setFilters] = useState({
        start_date: yearStart,
        end_date: today,
        search: '',
        type: 'all',
        status: 'all',
    });
    const [expanded, setExpanded] = useState({});
    const [selected, setSelected] = useState(null);
    const [detailOpen, setDetailOpen] = useState(false);
    const [formOpen, setFormOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState(null);
    const [importOpen, setImportOpen] = useState(false);

    const queryParams = useMemo(() => {
        const params = {
            start_date: filters.start_date,
            end_date: filters.end_date,
        };
        if (filters.search?.trim()) {
            params.search = filters.search.trim();
        }
        if (filters.type !== 'all') {
            params.type = filters.type;
        }
        if (filters.status !== 'all') {
            params.status = filters.status;
        }
        return params;
    }, [filters]);

    const { data, isLoading, isError, error, refetch } = useChartOfAccounts(queryParams);
    const { deleteMutation } = useChartOfAccountMutations();

    const summary = data?.summary || {};
    const groups = data?.groups || [];
    const allAccounts = useMemo(() => flattenAccounts(groups), [groups]);

    const visibleGroups = useMemo(() => {
        const safeGroups = Array.isArray(groups) ? groups : [];

        if (!filters.search && filters.type === 'all' && filters.status === 'all') {
            return safeGroups;
        }

        return safeGroups
            .map((group) => ({
                ...group,
                sub_types: (group.sub_types ?? [])
                    .map((subType) => ({
                        ...subType,
                        accounts: filterAccounts(subType.accounts, filters),
                    }))
                    .filter((subType) => subType.accounts?.length),
            }))
            .filter((group) => group.sub_types?.length);
    }, [groups, filters]);

    const matchedCount = useMemo(
        () => visibleGroups.reduce(
            (total, group) =>
                total + (group.sub_types ?? []).reduce(
                    (subTotal, sub) => subTotal + (sub.accounts?.length || 0),
                    0
                ),
            0
        ),
        [visibleGroups]
    );

    const hasFilter = filters.search || filters.type !== 'all' || filters.status !== 'all';

    const toggleKey = (key) => {
        setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const expandAll = () => {
        const next = {};
        visibleGroups.forEach((group) => {
            next[`type-${group.type_id}`] = true;
            (group.sub_types ?? []).forEach((sub) => {
                next[`sub-${sub.sub_type_id}`] = true;
            });
        });
        setExpanded(next);
    };

    const collapseAll = () => setExpanded({});

    const selectAccount = (account) => {
        setSelected(account);
        if (window.innerWidth < 992) {
            setDetailOpen(true);
        }
    };

    const handleDelete = async (account) => {
        const result = await Swal.fire({
            title: t('admin.accounting.delete.title'),
            text: t('admin.accounting.delete.message', { name: account.name }),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: t('common.delete'),
            cancelButtonText: t('common.cancel'),
        });

        if (!result.isConfirmed) return;

        try {
            await deleteMutation.mutateAsync(account.id);
            toast.success(t('admin.accounting.delete.success'));
            if (selected?.id === account.id) setSelected(null);
        } catch (err) {
            toast.error(err?.response?.data?.message || t('admin.accounting.delete.failed'));
        }
    };

    const handleExport = async () => {
        try {
            const blob = await downloadChartOfAccountsExport(queryParams);
            triggerBlobDownload(blob, `chart_of_accounts_${today}.xlsx`);
        } catch {
            toast.error(t('admin.accounting.export.failed'));
        }
    };

    const handleSample = async () => {
        try {
            const blob = await downloadChartOfAccountsSample();
            triggerBlobDownload(blob, `chart_of_account_sample_${today}.xlsx`);
        } catch {
            toast.error(t('admin.accounting.sample.failed'));
        }
    };

    if (isError) {
        const errorMessage =
            error?.response?.data?.message ||
            error?.message ||
            t('admin.accounting.loadFailed');

        return <ErrorAlert message={errorMessage} onRetry={refetch} />;
    }

    return (
        <div className="container-fluid py-4">
            <div className={styles.pageHeader}>
                <div>
                    <h1 className={styles.pageTitle}>{t('admin.accounting.chartOfAccounts.title')}</h1>
                    <p className={styles.pageSubtitle}>{t('admin.accounting.chartOfAccounts.subtitle')}</p>
                </div>
                <div className="d-flex align-items-center gap-2 flex-shrink-0 flex-wrap justify-content-end">
                    <span className={`${styles.balancedPill} ${summary.is_balanced ? styles.balancedPillOk : styles.balancedPillBad} d-none d-sm-inline-flex`}>
                        <i className={`ki-duotone ki-check-circle fs-6 ${summary.is_balanced ? 'text-success' : 'text-danger'}`}>
                            <span className="path1" /><span className="path2" />
                        </i>
                        {summary.is_balanced
                            ? t('admin.accounting.systemBalanced')
                            : t('admin.accounting.systemUnbalanced')}
                    </span>
                    <button type="button" className="btn btn-sm btn-light" onClick={handleSample}>
                        {t('admin.accounting.sample')}
                    </button>
                    <button type="button" className="btn btn-sm btn-light" onClick={handleExport}>
                        {t('admin.accounting.export')}
                    </button>
                    <button type="button" className="btn btn-sm btn-light" onClick={() => setImportOpen(true)}>
                        {t('admin.accounting.importAction')}
                    </button>
                    <button
                        type="button"
                        className="btn btn-sm btn-primary"
                        onClick={() => {
                            setEditingAccount(null);
                            setFormOpen(true);
                        }}
                    >
                        {t('admin.accounting.createAccount')}
                    </button>
                </div>
            </div>

            <div className="row g-3 mb-4">
                <div className="col-md-3 col-6">
                    <label className="form-label fs-8">{t('admin.accounting.filters.startDate')}</label>
                    <input
                        type="date"
                        className="form-control form-control-sm"
                        value={filters.start_date}
                        onChange={(e) => setFilters((prev) => ({ ...prev, start_date: e.target.value }))}
                    />
                </div>
                <div className="col-md-3 col-6">
                    <label className="form-label fs-8">{t('admin.accounting.filters.endDate')}</label>
                    <input
                        type="date"
                        className="form-control form-control-sm"
                        value={filters.end_date}
                        onChange={(e) => setFilters((prev) => ({ ...prev, end_date: e.target.value }))}
                    />
                </div>
            </div>

            <div className={styles.summaryGrid}>
                {[
                    { label: t('admin.accounting.summary.totalAssets'), value: fmtCompact(summary.total_assets), sub: t('admin.accounting.summary.debitBalance'), color: 'text-primary', bg: 'bg-light-primary', icon: 'ki-chart-line-up' },
                    { label: t('admin.accounting.summary.totalLiabilities'), value: fmtCompact(summary.total_liabilities), sub: t('admin.accounting.summary.creditBalance'), color: 'text-danger', bg: 'bg-light-danger', icon: 'ki-chart-line-down' },
                    { label: t('admin.accounting.summary.totalEquity'), value: fmtCompact(summary.total_equity), sub: t('admin.accounting.summary.shareholdersEquity'), color: 'text-info', bg: 'bg-light-info', icon: 'ki-chart-pie-simple' },
                    { label: t('admin.accounting.summary.totalAccounts'), value: String(summary.total_accounts ?? 0), sub: t('admin.accounting.summary.acrossCategories'), color: 'text-gray-800', bg: 'bg-light', icon: 'ki-element-11' },
                ].map((item) => (
                    <div key={item.label} className={styles.summaryCard}>
                        <div className={`${styles.summaryIcon} ${item.bg}`}>
                            <i className={`ki-duotone ${item.icon} fs-2 ${item.color}`}>
                                <span className="path1" /><span className="path2" />
                            </i>
                        </div>
                        <div className="min-w-0">
                            <p className={styles.summaryLabel}>{item.label}</p>
                            <p className={`${styles.summaryValue} ${item.color}`}>{item.value}</p>
                            <p className={styles.summarySub}>{item.sub}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className={styles.mainGrid}>
                <div className={styles.treeCard}>
                    <div className={styles.toolbar}>
                        <div className={styles.searchWrap}>
                            <i className={`ki-duotone ki-magnifier fs-5 ${styles.searchIcon}`}>
                                <span className="path1" /><span className="path2" />
                            </i>
                            <input
                                className={styles.searchInput}
                                value={filters.search}
                                onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                                placeholder={t('admin.accounting.searchPlaceholder')}
                            />
                        </div>
                        <select
                            className="form-select form-select-sm w-auto"
                            value={filters.type}
                            onChange={(e) => setFilters((prev) => ({ ...prev, type: e.target.value }))}
                        >
                            <option value="all">{t('admin.accounting.filters.allTypes')}</option>
                            {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
                                <option key={key} value={key}>{cfg.label}</option>
                            ))}
                        </select>
                        <select
                            className="form-select form-select-sm w-auto"
                            value={filters.status}
                            onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
                        >
                            <option value="all">{t('admin.accounting.filters.allStatus')}</option>
                            <option value="active">{t('admin.accounting.status.active')}</option>
                            <option value="inactive">{t('admin.accounting.status.inactive')}</option>
                        </select>
                        <div className="btn-group">
                            <button type="button" className="btn btn-sm btn-light" onClick={expandAll}>{t('admin.accounting.expandAll')}</button>
                            <button type="button" className="btn btn-sm btn-light" onClick={collapseAll}>{t('admin.accounting.collapseAll')}</button>
                        </div>
                    </div>

                    <div className={styles.columnHeader}>
                        <span style={{ width: 20 }} />
                        <span style={{ minWidth: 42 }}>{t('admin.accounting.columns.code')}</span>
                        <span className="flex-grow-1">{t('admin.accounting.columns.name')}</span>
                        <span className="d-none d-sm-block" style={{ width: 90, textAlign: 'right' }}>{t('admin.accounting.columns.balance')}</span>
                    </div>

                    <div className={styles.treeBody}>
                        {isLoading ? (
                            <div className="py-10"><LoadingSpinner /></div>
                        ) : matchedCount === 0 ? (
                            <div className="text-center py-10 px-4">
                                <p className="fw-semibold mb-1">{t('admin.accounting.empty.title')}</p>
                                <p className="text-muted fs-7">{t('admin.accounting.empty.subtitle')}</p>
                                {hasFilter ? (
                                    <button
                                        type="button"
                                        className="btn btn-link btn-sm"
                                        onClick={() => setFilters((prev) => ({ ...prev, search: '', type: 'all', status: 'all' }))}
                                    >
                                        {t('admin.accounting.clearFilters')}
                                    </button>
                                ) : null}
                            </div>
                        ) : (
                            visibleGroups.map((group) => {
                                const typeKey = `type-${group.type_id}`;
                                const typeExpanded = expanded[typeKey] !== false;

                                return (
                                    <div key={group.type_id}>
                                        <div
                                            className={`${styles.treeRow} ${styles.treeRowType}`}
                                            onClick={() => toggleKey(typeKey)}
                                        >
                                            <button type="button" className={styles.treeToggle}>
                                                <i className={`ki-duotone ${typeExpanded ? 'ki-minus-square' : 'ki-plus-square'} fs-4`}>
                                                    <span className="path1" /><span className="path2" />
                                                </i>
                                            </button>
                                            <span className={`${styles.accountName} fw-bold`}>{group.type_name}</span>
                                        </div>

                                        {typeExpanded ? (group.sub_types ?? []).map((subType) => {
                                            const subKey = `sub-${subType.sub_type_id}`;
                                            const subExpanded = expanded[subKey] !== false;

                                            return (
                                                <div key={subType.sub_type_id}>
                                                    <div
                                                        className={`${styles.treeRow} ${styles.treeRowSubType}`}
                                                        style={{ paddingLeft: '30px' }}
                                                        onClick={() => toggleKey(subKey)}
                                                    >
                                                        <button type="button" className={styles.treeToggle}>
                                                            <i className={`ki-duotone ${subExpanded ? 'ki-minus-square' : 'ki-plus-square'} fs-5`}>
                                                                <span className="path1" /><span className="path2" />
                                                            </i>
                                                        </button>
                                                        <span className={styles.accountName}>{subType.sub_type_name}</span>
                                                    </div>

                                                    {subExpanded ? (subType.accounts ?? []).map((account) => (
                                                        <TreeAccountRow
                                                            key={account.id}
                                                            account={account}
                                                            depth={2}
                                                            selectedId={selected?.id}
                                                            onSelect={selectAccount}
                                                            onEdit={(acc) => {
                                                                setEditingAccount(acc);
                                                                setFormOpen(true);
                                                            }}
                                                            onDelete={handleDelete}
                                                            canEdit
                                                            canDelete={!account.has_transactions}
                                                        />
                                                    )) : null}
                                                </div>
                                            );
                                        }) : null}
                                    </div>
                                );
                            })
                        )}
                    </div>

                    <div className={styles.treeFooter}>
                        <span>{t('admin.accounting.footer.totalAccounts', { count: summary.total_accounts ?? allAccounts.length })}</span>
                        {hasFilter ? (
                            <span className="fw-semibold text-primary">
                                {t('admin.accounting.footer.matched', { count: matchedCount })}
                            </span>
                        ) : <span />}
                        <span>{new Date().getFullYear()}</span>
                    </div>
                </div>

                <div className={`${styles.detailCard} d-none d-lg-flex`}>
                    <ChartAccountDetailPanel account={selected} onClose={() => setSelected(null)} t={t} />
                </div>
            </div>

            {detailOpen && selected ? (
                <>
                    <div className={`${styles.mobileSheetBackdrop} d-lg-none`} onClick={() => setDetailOpen(false)} />
                    <div className={`${styles.mobileSheet} d-lg-none`}>
                        <div className={styles.mobileSheetHandle} />
                        <ChartAccountDetailPanel account={selected} onClose={() => setDetailOpen(false)} t={t} />
                    </div>
                </>
            ) : null}

            <div className={styles.legendCard}>
                <span className="text-uppercase fs-8 fw-bold text-muted">{t('admin.accounting.legend.title')}</span>
                {Object.entries(TYPE_CONFIG).map(([type, cfg]) => (
                    <button
                        key={type}
                        type="button"
                        className={`${styles.legendPill} ${filters.type === type ? styles.legendPillActive : ''} ${cfg.bg} ${cfg.color}`}
                        onClick={() => setFilters((prev) => ({
                            ...prev,
                            type: prev.type === type ? 'all' : type,
                        }))}
                    >
                        {cfg.label}
                    </button>
                ))}
                {hasFilter ? (
                    <button
                        type="button"
                        className="btn btn-link btn-sm text-danger ms-auto"
                        onClick={() => setFilters((prev) => ({ ...prev, search: '', type: 'all', status: 'all' }))}
                    >
                        {t('admin.accounting.clearFilters')}
                    </button>
                ) : null}
            </div>

            <AdminChartOfAccountForm
                open={formOpen}
                account={editingAccount}
                onClose={() => {
                    setFormOpen(false);
                    setEditingAccount(null);
                }}
            />

            <ChartAccountImportModal
                open={importOpen}
                onClose={() => setImportOpen(false)}
            />
        </div>
    );
};

export default AdminChartOfAccountsIndex;

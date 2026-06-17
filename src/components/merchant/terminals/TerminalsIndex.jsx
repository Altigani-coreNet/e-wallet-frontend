import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import TerminalsFilters from './TerminalsFilters';
import TerminalTableRow from './TerminalTableRow';
import ImportTerminalsModal from './ImportTerminalsModal';
import { useTerminals, bulkDeleteTerminals, exportTerminals, deleteTerminal } from '../../../services/terminalsService';
import useAuthStore from '../../../stores/authStore';
import { useToolbar } from '../../../contexts/ToolbarContext';
import { useCan, canExport } from '../../../utils/permissions';

const MERCHANT_TERMINALS_PATH = '/merchant/terminals';

const TerminalsIndex = ({ merchantId: propMerchantId }) => {
    const { t, i18n } = useTranslation();
    const { user, merchant } = useAuthStore();
    const { setTitle, setBreadcrumbs, setActions } = useToolbar();
    const queryClient = useQueryClient();
    const canCreate = useCan('pos.terminals.create_terminals');
    const canDelete = useCan('pos.terminals.delete_terminals');

    const merchantId = propMerchantId || merchant?.id || user?.merchant_id;

    const [pagination, setPagination] = useState({
        current_page: 1,
        per_page: 15,
    });

    const [filters, setFilters] = useState({
        search: '',
        status: '',
        terminal_status: '',
        date_from: '',
        date_to: '',
    });
    const [searchInput, setSearchInput] = useState('');

    const [showFilters, setShowFilters] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);
    const [exportLoading, setExportLoading] = useState(false);

    const {
        data: terminalsData,
        isLoading,
        refetch,
    } = useTerminals(merchantId, pagination.current_page, pagination.per_page, filters);

    useEffect(() => {
        queryClient.removeQueries({ queryKey: ['terminals'] });
        refetch();
    }, [queryClient, refetch]);

    const terminals = terminalsData?.data?.data || terminalsData?.data || [];
    const paginationData = {
        current_page: terminalsData?.data?.current_page || terminalsData?.pagination?.current_page || pagination.current_page,
        per_page: terminalsData?.data?.per_page || terminalsData?.pagination?.per_page || pagination.per_page,
        total: terminalsData?.data?.total || terminalsData?.pagination?.total || 0,
        last_page: terminalsData?.data?.last_page || terminalsData?.pagination?.last_page || 1,
    };

    const branchesMap = useMemo(() => {
        const map = {};
        terminals.forEach((terminal) => {
            if (terminal.branch_id && terminal.branch?.name) {
                map[terminal.branch_id] = terminal.branch.name;
            } else if (terminal.branch_id && terminal.branch_name) {
                map[terminal.branch_id] = terminal.branch_name;
            }
        });
        return map;
    }, [terminals]);

    const handleRefresh = useCallback(async () => {
        queryClient.invalidateQueries({ queryKey: ['terminals'] });
        await refetch();
        toast.success(t('merchant.transactions.refreshSuccess'));
    }, [queryClient, refetch, t]);

    const handleExport = useCallback(async () => {
        setExportLoading(true);
        try {
            const blob = await exportTerminals({ merchantId, filters });
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `terminals_export_${new Date().toISOString().slice(0, 10)}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            toast.success(t('merchant.transactions.exportSuccess'));
        } catch (error) {
            console.error('Export error:', error);
            toast.error(t('merchant.terminals.exportFailed'));
        } finally {
            setExportLoading(false);
        }
    }, [merchantId, filters, t]);

    const handleBulkDelete = useCallback(async () => {
        if (selectedIds.length === 0) return;

        const result = await Swal.fire({
            title: t('merchant.common.areYouSure'),
            text: t('merchant.terminals.bulkDeleteText', { count: selectedIds.length }),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: t('merchant.common.yesDeleteThem'),
            cancelButtonText: t('merchant.common.cancel'),
        });

        if (!result.isConfirmed) return;

        const response = await bulkDeleteTerminals(selectedIds);
        if (response.success) {
            Swal.fire(t('merchant.common.deleted'), t('merchant.terminals.deletedSuccess'), 'success');
            setSelectedIds([]);
            await refetch();
        } else {
            Swal.fire(t('merchant.common.error'), response.error || t('merchant.terminals.deleteFailed'), 'error');
        }
    }, [selectedIds, refetch, t]);

    const handleDelete = useCallback(async (terminalId) => {
        const response = await deleteTerminal(terminalId);
        if (response.success) {
            toast.success(response.message || t('merchant.terminals.deletedOne'));
            await refetch();
        } else {
            toast.error(response.error || t('merchant.terminals.deleteOneFailed'));
        }
    }, [refetch, t]);

    const handleSelect = (terminalId, checked) => {
        if (checked) {
            setSelectedIds((prev) => [...prev, terminalId]);
        } else {
            setSelectedIds((prev) => prev.filter((id) => id !== terminalId));
        }
    };

    const handleSelectAll = (checked) => {
        if (checked) {
            setSelectedIds(terminals.map((terminal) => terminal.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleFilterChange = (newFilters) => {
        setFilters(newFilters);
    };

    const clearFilters = () => {
        setSearchInput('');
        setFilters({
            search: '',
            status: '',
            terminal_status: '',
            date_from: '',
            date_to: '',
        });
        setPagination((prev) => ({ ...prev, current_page: 1 }));
    };

    const handleApplyFilters = () => {
        setPagination((prev) => ({ ...prev, current_page: 1 }));
        refetch();
    };

    const handleImportSuccess = () => {
        setShowImportModal(false);
        refetch();
    };

    const handlePageChange = (newPage) => {
        setPagination((prev) => ({ ...prev, current_page: newPage }));
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchInput !== filters.search) {
                setFilters((prev) => ({ ...prev, search: searchInput }));
                setPagination((prev) => ({ ...prev, current_page: 1 }));
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchInput, filters.search]);

    useEffect(() => {
        setTitle(t('merchant.breadcrumbs.terminals'));

        setBreadcrumbs([
            { label: t('merchant.breadcrumbs.dashboard'), path: '/merchant/dashboard' },
            { label: t('merchant.breadcrumbs.terminals'), path: MERCHANT_TERMINALS_PATH, active: true },
        ]);

        setActions(
            <div className="d-flex align-items-center gap-2 gap-lg-3">
                <button
                    className="btn btn-sm btn-flex btn-secondary fw-bold"
                    onClick={() => setShowFilters(!showFilters)}
                    aria-label={showFilters ? t('merchant.common.hideFilters', { defaultValue: 'Hide Filters' }) : t('merchant.common.toggleFilters')}
                >
                    <i className="ki-duotone ki-filter fs-6 text-muted me-0 me-lg-1">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    <span className="d-none d-lg-inline ms-lg-1">
                        {showFilters ? t('merchant.common.hideFilters', { defaultValue: 'Hide Filters' }) : t('merchant.common.filter')}
                    </span>
                </button>

                <button
                    className="btn btn-sm btn-flex btn-light fw-bold"
                    onClick={handleRefresh}
                    disabled={isLoading}
                    aria-label={t('merchant.common.refresh')}
                >
                    <i className="ki-duotone ki-arrows-circle fs-6 text-muted me-0 me-lg-1">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    <span className="d-none d-lg-inline ms-lg-1">{t('merchant.common.refresh')}</span>
                </button>

                {selectedIds.length > 0 && canDelete && (
                    <button
                        className="btn btn-sm fw-bold btn-danger"
                        onClick={handleBulkDelete}
                        aria-label={t('merchant.terminals.deleteSelected', { count: selectedIds.length })}
                    >
                        <i className="ki-duotone ki-trash fs-3 me-0 me-lg-2">
                            <span className="path1"></span>
                            <span className="path2"></span>
                            <span className="path3"></span>
                            <span className="path4"></span>
                            <span className="path5"></span>
                        </i>
                        <span className="d-none d-lg-inline">
                            {t('merchant.terminals.deleteSelected', { count: selectedIds.length })}
                        </span>
                    </button>
                )}

                <button
                    className="btn btn-sm fw-bold btn-success"
                    onClick={() => setShowImportModal(true)}
                    aria-label={t('merchant.terminals.import')}
                >
                    <i className="ki-duotone ki-file-up fs-3 me-0 me-lg-2">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    <span className="d-none d-lg-inline">{t('merchant.terminals.import')}</span>
                </button>

                {canExport('terminals') && (
                    <button
                        className="btn btn-sm fw-bold btn-success"
                        onClick={handleExport}
                        disabled={exportLoading}
                        aria-label={t('merchant.transactions.export')}
                    >
                        <i className="ki-duotone ki-download fs-3 me-0 me-lg-2">
                            <span className="path1"></span>
                            <span className="path2"></span>
                        </i>
                        <span className="d-none d-lg-inline">{t('merchant.transactions.export')}</span>
                    </button>
                )}

                {canCreate && (
                    <Link
                        to={`${MERCHANT_TERMINALS_PATH}/create`}
                        className="btn btn-sm fw-bold btn-primary"
                        aria-label={t('merchant.terminals.addTerminal')}
                    >
                        <i className="ki-duotone ki-plus fs-3 me-0 me-lg-2">
                            <span className="path1"></span>
                            <span className="path2"></span>
                        </i>
                        <span className="d-none d-lg-inline">{t('merchant.terminals.addTerminal')}</span>
                    </Link>
                )}
            </div>
        );

        return () => {
            setActions(null);
            setBreadcrumbs([]);
        };
    }, [
        showFilters,
        selectedIds.length,
        exportLoading,
        isLoading,
        canCreate,
        canDelete,
        handleRefresh,
        handleExport,
        handleBulkDelete,
        setTitle,
        setBreadcrumbs,
        setActions,
        t,
        i18n.language,
    ]);

    return (
        <>
            <style>{`
                .skeleton {
                    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                    background-size: 200% 100%;
                    animation: skeleton-loading 1.5s ease-in-out infinite;
                    border-radius: 4px;
                }
                @keyframes skeleton-loading {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }
            `}</style>

            <TerminalsFilters
                isVisible={showFilters}
                filters={filters}
                onFilterChange={handleFilterChange}
                onClearFilters={clearFilters}
                onApply={handleApplyFilters}
            />

            <div className="card">
                <div className="card-header border-0 pt-6">
                    <div className="card-title">
                        <div className="d-flex align-items-center position-relative me-5" style={{ minWidth: '350px' }}>
                            <i className="ki-duotone ki-magnifier fs-2 position-absolute ms-4" style={{ zIndex: 1 }}>
                                <span className="path1"></span>
                                <span className="path2"></span>
                            </i>
                            <input
                                type="text"
                                className="form-control form-control-solid ps-13"
                                placeholder={t('merchant.terminalsIndex.searchPlaceholder')}
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                style={{ paddingLeft: '3rem', fontSize: '1rem', paddingTop: '0.75rem', paddingBottom: '0.75rem' }}
                            />
                            {searchInput && (
                                <button
                                    type="button"
                                    className="btn btn-icon btn-sm btn-active-color-primary position-absolute end-0 me-2"
                                    onClick={() => {
                                        setSearchInput('');
                                        setFilters((prev) => ({ ...prev, search: '' }));
                                    }}
                                    style={{ zIndex: 1 }}
                                >
                                    <i className="ki-duotone ki-cross fs-2">
                                        <span className="path1"></span>
                                        <span className="path2"></span>
                                    </i>
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="card-body pt-0">
                    {isLoading ? (
                        <div className="table-responsive">
                            <table className="table align-middle table-row-dashed fs-6 gy-5">
                                <thead>
                                    <tr className="text-start text-gray-400 fw-bold fs-7 text-uppercase gs-0">
                                        <th className="w-10px pe-2"></th>
                                        <th className="text-dark">#</th>
                                        <th className="min-w-200px text-dark">{t('merchant.terminalsIndex.colTerminalInfo', { defaultValue: 'Terminal Info' })}</th>
                                        <th className="min-w-125px text-dark">{t('merchant.terminalsIndex.colBranch')}</th>
                                        <th className="min-w-100px text-dark">{t('merchant.terminalsIndex.colManufacturer')}</th>
                                        <th className="min-w-100px text-dark">{t('merchant.terminalsIndex.colBrand', { defaultValue: 'Brand' })}</th>
                                        <th className="min-w-100px text-dark">{t('merchant.terminalsIndex.colSdk', { defaultValue: 'SDK' })}</th>
                                        <th className="text-dark">{t('merchant.terminalsIndex.colAddType', { defaultValue: 'Add Type' })}</th>
                                        <th className="text-dark">{t('merchant.terminalsIndex.colStatus')}</th>
                                        <th className="text-dark">{t('merchant.terminalsIndex.colTerminalStatus', { defaultValue: 'Terminal Status' })}</th>
                                        <th className="text-dark">{t('merchant.terminalsIndex.colCreatedAt', { defaultValue: 'Created At' })}</th>
                                        <th className="text-end text-dark">{t('merchant.terminalsIndex.colActions')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[...Array(8)].map((_, index) => (
                                        <tr key={`skeleton-${index}`}>
                                            <td><div className="skeleton" style={{ width: '20px', height: '20px' }}></div></td>
                                            <td><div className="skeleton" style={{ width: '30px', height: '16px' }}></div></td>
                                            <td><div className="skeleton" style={{ width: '150px', height: '16px' }}></div></td>
                                            <td><div className="skeleton" style={{ width: '100px', height: '16px' }}></div></td>
                                            <td><div className="skeleton" style={{ width: '100px', height: '16px' }}></div></td>
                                            <td><div className="skeleton" style={{ width: '80px', height: '16px' }}></div></td>
                                            <td><div className="skeleton" style={{ width: '80px', height: '16px' }}></div></td>
                                            <td><div className="skeleton" style={{ width: '60px', height: '24px' }}></div></td>
                                            <td><div className="skeleton" style={{ width: '60px', height: '24px' }}></div></td>
                                            <td><div className="skeleton" style={{ width: '70px', height: '24px' }}></div></td>
                                            <td><div className="skeleton" style={{ width: '90px', height: '16px' }}></div></td>
                                            <td className="text-end"><div className="skeleton" style={{ width: '70px', height: '32px', marginLeft: 'auto' }}></div></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : terminals.length === 0 ? (
                        <div className="text-center py-10">
                            <i className="ki-duotone ki-information-5 fs-5x text-muted mb-5">
                                <span className="path1"></span>
                                <span className="path2"></span>
                                <span className="path3"></span>
                            </i>
                            <p className="text-muted fs-4">{t('merchant.terminalsIndex.noTerminalsFound')}</p>
                            {canCreate && (
                                <Link to={`${MERCHANT_TERMINALS_PATH}/create`} className="btn btn-primary mt-3">
                                    {t('merchant.terminals.addTerminal')}
                                </Link>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="table-responsive">
                                <table className="table align-middle table-row-dashed fs-6 gy-5">
                                    <thead>
                                        <tr className="text-start text-gray-400 fw-bold fs-7 text-uppercase gs-0">
                                            <th className="w-10px pe-2">
                                                <div className="form-check form-check-sm form-check-custom form-check-solid me-3">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        checked={selectedIds.length === terminals.length && terminals.length > 0}
                                                        onChange={(e) => handleSelectAll(e.target.checked)}
                                                    />
                                                </div>
                                            </th>
                                            <th className="text-dark">#</th>
                                            <th className="min-w-200px text-dark">{t('merchant.terminalsIndex.colTerminalInfo', { defaultValue: 'Terminal Info' })}</th>
                                            <th className="min-w-125px text-dark">{t('merchant.terminalsIndex.colBranch')}</th>
                                            <th className="min-w-100px text-dark">{t('merchant.terminalsIndex.colManufacturer')}</th>
                                            <th className="min-w-100px text-dark">{t('merchant.terminalsIndex.colBrand', { defaultValue: 'Brand' })}</th>
                                            <th className="min-w-100px text-dark">{t('merchant.terminalsIndex.colSdk', { defaultValue: 'SDK' })}</th>
                                            <th className="text-dark">{t('merchant.terminalsIndex.colAddType', { defaultValue: 'Add Type' })}</th>
                                            <th className="text-dark">{t('merchant.terminalsIndex.colStatus')}</th>
                                            <th className="text-dark">{t('merchant.terminalsIndex.colTerminalStatus', { defaultValue: 'Terminal Status' })}</th>
                                            <th className="text-dark">{t('merchant.terminalsIndex.colCreatedAt', { defaultValue: 'Created At' })}</th>
                                            <th className="text-end text-dark">{t('merchant.terminalsIndex.colActions')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-gray-600 fw-semibold">
                                        {terminals.map((terminal, index) => (
                                            <TerminalTableRow
                                                key={terminal.id}
                                                terminal={terminal}
                                                branchesMap={branchesMap}
                                                rowNumber={(paginationData.current_page - 1) * paginationData.per_page + index + 1}
                                                isSelected={selectedIds.includes(terminal.id)}
                                                onSelect={handleSelect}
                                                onDelete={handleDelete}
                                            />
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="d-flex flex-stack flex-wrap pt-10">
                                <div className="fs-6 fw-semibold text-gray-700">
                                    {t('merchant.common.showingEntries', {
                                        defaultValue: 'Showing {{from}} to {{to}} of {{total}} entries',
                                        from: ((paginationData.current_page - 1) * paginationData.per_page) + 1,
                                        to: Math.min(paginationData.current_page * paginationData.per_page, paginationData.total),
                                        total: paginationData.total,
                                    })}
                                </div>
                                <ul className="pagination">
                                    <li className={`page-item ${paginationData.current_page === 1 ? 'disabled' : ''}`}>
                                        <button
                                            type="button"
                                            className="page-link"
                                            onClick={() => handlePageChange(paginationData.current_page - 1)}
                                            disabled={paginationData.current_page === 1}
                                        >
                                            {t('merchant.common.previous', { defaultValue: 'Previous' })}
                                        </button>
                                    </li>
                                    {[...Array(Math.min(5, paginationData.last_page))].map((_, idx) => {
                                        const page = idx + 1;
                                        return (
                                            <li
                                                key={page}
                                                className={`page-item ${paginationData.current_page === page ? 'active' : ''}`}
                                            >
                                                <button type="button" className="page-link" onClick={() => handlePageChange(page)}>
                                                    {page}
                                                </button>
                                            </li>
                                        );
                                    })}
                                    <li className={`page-item ${paginationData.current_page === paginationData.last_page ? 'disabled' : ''}`}>
                                        <button
                                            type="button"
                                            className="page-link"
                                            onClick={() => handlePageChange(paginationData.current_page + 1)}
                                            disabled={paginationData.current_page === paginationData.last_page}
                                        >
                                            {t('merchant.common.next', { defaultValue: 'Next' })}
                                        </button>
                                    </li>
                                </ul>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {showImportModal && (
                <ImportTerminalsModal
                    show={showImportModal}
                    onClose={() => setShowImportModal(false)}
                    onSuccess={handleImportSuccess}
                />
            )}
        </>
    );
};

export default TerminalsIndex;

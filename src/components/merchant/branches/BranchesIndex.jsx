import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import BranchesTable from './BranchesTable';
import BranchesFilters from './BranchesFilters';
import ImportBranchesModal from './ImportBranchesModal';
import { useBranches, bulkDeleteBranches, exportBranches } from '../../../services/branchesService';
import useAuthStore from '../../../stores/authStore';
import { useToolbar } from '../../../contexts/ToolbarContext';
import Swal from 'sweetalert2';
import { toast } from 'react-toastify';
import { useCan, canExport } from '../../../utils/permissions';

const BranchesIndex = ({ merchantId: propMerchantId }) => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { user, merchant } = useAuthStore();
    const { setTitle, setBreadcrumbs, setActions } = useToolbar();
    const queryClient = useQueryClient();
    const canCreate = useCan('branches.create');
    const canDelete = useCan('branches.delete');
    
    // Get merchantId from props, store, or localStorage
    const merchantId = propMerchantId || 
                       merchant?.id ||
                       user?.merchant_id;
    
    const [perPage, setPerPage] = useState(25);
    const [currentPage, setCurrentPage] = useState(1);
    
    // Filter states
    const [filters, setFilters] = useState({
        search: '',
        status: '',
        date_from: '',
        date_to: '',
    });
    
    const [showFilters, setShowFilters] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);
    const [exportLoading, setExportLoading] = useState(false);

    // Use React Query hooks
    const { 
        data: branchesData, 
        isLoading: branchesLoading,
        refetch: refetchBranches
    } = useBranches(merchantId, currentPage, perPage, filters);

    // Extracted data - handle both direct data and wrapped responses
    const branches = Array.isArray(branchesData?.data) 
        ? branchesData.data 
        : Array.isArray(branchesData) 
            ? branchesData 
            : branchesData?.data?.data || [];
    const totalRows = branchesData?.total || branchesData?.data?.total || branchesData?.pagination?.total || 0;
    const lastPage = branchesData?.last_page || branchesData?.data?.last_page || branchesData?.pagination?.last_page || 1;
    const pagination = {
        current_page: currentPage,
        per_page: perPage,
        total: totalRows,
        last_page: lastPage
    };

    // Handle refresh
    const handleRefresh = useCallback(async () => {
        queryClient.invalidateQueries({ queryKey: ['branches'] });
        await refetchBranches();
        toast.success(t('merchant.transactions.refreshSuccess'));
    }, [queryClient, refetchBranches, t]);

    // Handle export
    const handleExport = useCallback(async () => {
        setExportLoading(true);
        try {
            const blob = await exportBranches({ merchantId, filters });
            
            // Create download link
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `branches_${new Date().toISOString().slice(0, 10)}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            
            toast.success(t('merchant.transactions.exportSuccess'));
        } catch (error) {
            console.error('Export error:', error);
            toast.error(t('merchant.branches.exportFailed'));
        } finally {
            setExportLoading(false);
        }
    }, [merchantId, filters, t]);

    // Handle bulk delete
    const handleBulkDelete = useCallback(async () => {
        if (selectedIds.length === 0) return;

        const result = await Swal.fire({
            title: t('merchant.common.areYouSure'),
            text: t('merchant.branches.bulkDeleteText', { count: selectedIds.length }),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: t('merchant.common.yesDeleteThem'),
            cancelButtonText: t('merchant.common.cancel')
        });

        if (!result.isConfirmed) return;

        try {
            const response = await bulkDeleteBranches(selectedIds);
            if (response.success) {
                Swal.fire({
                    title: t('merchant.common.deleted'),
                    text: t('merchant.branches.deletedSuccess'),
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                });
                setSelectedIds([]);
                queryClient.invalidateQueries({ queryKey: ['branches'] });
                await refetchBranches();
            } else {
                Swal.fire({
                    title: t('merchant.common.error'),
                    text: response.error || t('merchant.branches.deleteFailed'),
                    icon: 'error',
                    confirmButtonText: t('merchant.common.ok')
                });
            }
        } catch (error) {
            console.error('Error deleting branches:', error);
            Swal.fire({
                title: t('merchant.common.error'),
                text: t('merchant.branches.deleteError'),
                icon: 'error',
                confirmButtonText: t('merchant.common.ok')
            });
        }
    }, [selectedIds, queryClient, refetchBranches, t]);

    // Set toolbar title, breadcrumbs and actions
    useEffect(() => {
        setTitle(t('merchant.breadcrumbs.branches'));
        
        setBreadcrumbs([
            { label: t('merchant.breadcrumbs.dashboard'), path: '/merchant/dashboard' },
            { label: t('merchant.breadcrumbs.branches'), path: '/merchant/branches' },
            { label: t('merchant.breadcrumbs.branchesList'), path: '/merchant/branches', active: true }
        ]);
        
        setActions(
            <>
                <button
                    className="btn btn-sm btn-flex btn-secondary fw-bold"
                    onClick={() => setShowFilters(!showFilters)}
                >
                    <i className="ki-duotone ki-filter fs-6 text-muted me-1">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    {t('merchant.common.filter')}
                </button>

                <button
                    className="btn btn-sm btn-flex btn-light fw-bold"
                    onClick={handleRefresh}
                    disabled={branchesLoading}
                >
                    <i className="ki-duotone ki-arrows-circle fs-6 text-muted me-1">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    {t('merchant.common.refresh')}
                </button>

                {selectedIds.length > 0 && canDelete && (
                    <button
                        className="btn btn-sm fw-bold btn-danger"
                        onClick={handleBulkDelete}
                    >
                        <i className="ki-duotone ki-trash fs-3">
                            <span className="path1"></span>
                            <span className="path2"></span>
                            <span className="path3"></span>
                            <span className="path4"></span>
                            <span className="path5"></span>
                        </i>
                        {t('merchant.branches.deleteSelected', { count: selectedIds.length })}
                    </button>
                )}

                {canExport('branches') && (
                    <button
                        className="btn btn-sm fw-bold btn-success"
                        onClick={handleExport}
                        disabled={branchesLoading || exportLoading}
                    >
                        <i className="ki-duotone ki-file-down fs-3">
                            <span className="path1"></span>
                            <span className="path2"></span>
                        </i>
                        {t('merchant.transactions.export')}
                    </button>
                )}

                <button
                    className="btn btn-sm fw-bold btn-info"
                    onClick={() => setShowImportModal(true)}
                >
                    <i className="ki-duotone ki-file-up fs-3">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    {t('merchant.branches.import')}
                </button>

                {canCreate && (
                    <Link
                        to="/merchant/branches/create"
                        className="btn btn-sm fw-bold btn-primary"
                    >
                        <i className="ki-duotone ki-plus fs-3">
                            <span className="path1"></span>
                            <span className="path2"></span>
                        </i>
                        {t('merchant.branches.requestNew')}
                    </Link>
                )}
            </>
        );

        return () => {
            setActions(null);
            setBreadcrumbs([]);
        };
    }, [showFilters, branchesLoading, exportLoading, selectedIds.length, handleRefresh, handleExport, handleBulkDelete, setTitle, setBreadcrumbs, setActions, t, i18n.language, canCreate, canDelete]);

    // Handle page change
    const handlePageChange = (page) => {
        if (page >= 1 && page <= lastPage) {
            setCurrentPage(page);
        }
    };

    // Handle rows per page change
    const handlePerRowsChange = (e) => {
        setPerPage(parseInt(e.target.value));
        setCurrentPage(1);
    };

    // Handle filter change
    const handleFilterChange = (newFilters) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
        setCurrentPage(1); // Reset to first page on filter change
    };

    // Clear all filters
    const clearFilters = () => {
        setFilters({
            search: '',
            status: '',
            date_from: '',
            date_to: '',
        });
        setCurrentPage(1);
    };

    // Handle apply filters
    const handleApplyFilters = () => {
        setCurrentPage(1);
    };

    // Handle import success
    const handleImportSuccess = () => {
        setShowImportModal(false);
        queryClient.invalidateQueries({ queryKey: ['branches'] });
        refetchBranches();
    };

    // Generate pagination numbers
    const getPaginationNumbers = () => {
        const pages = [];
        const maxVisible = 5;
        
        if (lastPage <= maxVisible) {
            for (let i = 1; i <= lastPage; i++) {
                pages.push(i);
            }
        } else {
            if (currentPage <= 3) {
                for (let i = 1; i <= 4; i++) pages.push(i);
                pages.push('...');
                pages.push(lastPage);
            } else if (currentPage >= lastPage - 2) {
                pages.push(1);
                pages.push('...');
                for (let i = lastPage - 3; i <= lastPage; i++) pages.push(i);
            } else {
                pages.push(1);
                pages.push('...');
                for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
                pages.push('...');
                pages.push(lastPage);
            }
        }
        
        return pages;
    };

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
                    0% {
                        background-position: 200% 0;
                    }
                    100% {
                        background-position: -200% 0;
                    }
                }
                
                .skeleton-text {
                    display: inline-block;
                }
                
                .skeleton-badge {
                    display: inline-block;
                }
                
                .skeleton-button {
                    display: inline-block;
                }
            `}</style>

            {/* Filters */}
            {showFilters && (
                <BranchesFilters
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    onClear={clearFilters}
                />
            )}

            {/* Table */}
            <div className="card">
                <div className="card-body pt-0">
                    {branchesLoading ? (
                        // Skeleton Loading
                        <div className="table-responsive">
                            <table className="table align-middle table-row-dashed fs-7 gy-5">
                                <thead>
                                    <tr className="text-start text-gray-400 fw-bolder fs-7 text-uppercase gs-0">
                                        <th className="w-10px pe-2"></th>
                                        <th className="text-dark">{t('merchant.branchesIndex.id')}</th>
                                        <th className="min-w-125px text-dark">{t('merchant.branchesIndex.name')}</th>
                                        <th className="min-w-125px text-dark">{t('merchant.branchesIndex.address')}</th>
                                        <th className="text-dark">{t('merchant.branchesIndex.status')}</th>
                                        <th className="text-dark">{t('merchant.branchesIndex.createdAt')}</th>
                                        <th className="text-end text-dark">{t('merchant.branchesIndex.actions')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[...Array(perPage)].map((_, index) => (
                                        <tr key={`skeleton-${index}`}>
                                            <td>
                                                <div className="skeleton" style={{width: '20px', height: '20px', margin: '0 auto'}}></div>
                                            </td>
                                            <td><div className="skeleton skeleton-text" style={{width: '60px', height: '16px'}}></div></td>
                                            <td><div className="skeleton skeleton-text" style={{width: '150px', height: '16px'}}></div></td>
                                            <td><div className="skeleton skeleton-text" style={{width: '200px', height: '16px'}}></div></td>
                                            <td><div className="skeleton skeleton-badge" style={{width: '80px', height: '24px', borderRadius: '6px'}}></div></td>
                                            <td><div className="skeleton skeleton-text" style={{width: '140px', height: '16px'}}></div></td>
                                            <td className="text-end"><div className="skeleton skeleton-button" style={{width: '70px', height: '32px', borderRadius: '6px', marginLeft: 'auto'}}></div></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <BranchesTable
                            branches={branches}
                            selectedIds={selectedIds}
                            onSelectChange={setSelectedIds}
                            onRefresh={handleRefresh}
                            pagination={pagination}
                            onPageChange={handlePageChange}
                            onPerPageChange={handlePerRowsChange}
                        />
                    )}
                </div>
            </div>

            {/* Import Modal */}
            {showImportModal && (
                <ImportBranchesModal
                    onClose={() => setShowImportModal(false)}
                    onSuccess={handleImportSuccess}
                />
            )}
        </>
    );
};

export default BranchesIndex;

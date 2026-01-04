import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import TerminalsTable from './TerminalsTable';
import TerminalsFilters from './TerminalsFilters';
import ImportTerminalsModal from './ImportTerminalsModal';
import { useTerminals, bulkDeleteTerminals, exportTerminals } from '../../../services/terminalsService';
import { getBranchesByIds } from '../../../services/branchesService';
import useAuthStore from '../../../stores/authStore';
import { useToolbar } from '../../../contexts/ToolbarContext';
import Swal from 'sweetalert2';
import { toast } from 'react-toastify';
import { useCan, canExport } from '../../../utils/permissions';

const TerminalsIndex = ({ merchantId: propMerchantId }) => {
    const navigate = useNavigate();
    const { user, merchant } = useAuthStore();
    const { setTitle, setBreadcrumbs, setActions } = useToolbar();
    const queryClient = useQueryClient();
    const canCreate = useCan('terminals.create');
    const canDelete = useCan('terminals.delete');
    
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
    const [branches, setBranches] = useState({});  // Map of branch_id -> branch object

    // Use React Query hooks
    const { 
        data: terminalsData, 
        isLoading: terminalsLoading,
        refetch: refetchTerminals
    } = useTerminals(merchantId, currentPage, perPage, filters);

    // Extracted data - handle both direct data and wrapped responses
    const terminals = Array.isArray(terminalsData?.data) 
        ? terminalsData.data 
        : Array.isArray(terminalsData) 
            ? terminalsData 
            : terminalsData?.data?.data || [];
    const totalRows = terminalsData?.total || terminalsData?.data?.total || terminalsData?.pagination?.total || 0;
    const lastPage = terminalsData?.last_page || terminalsData?.data?.last_page || terminalsData?.pagination?.last_page || 1;
    const pagination = {
        current_page: currentPage,
        per_page: perPage,
        total: totalRows,
        last_page: lastPage
    };

    // Fetch branches when terminals data changes
    useEffect(() => {
        const fetchBranchesForTerminals = async () => {
            if (terminals.length > 0) {
                const branchIds = terminals
                    .map(terminal => terminal.branch_id)
                    .filter(id => id != null);
                
                if (branchIds.length > 0) {
                    try {
                        const branchesResponse = await getBranchesByIds(branchIds);
                        
                        if (branchesResponse.success && branchesResponse.data) {
                            // Create a map of branch_id -> branch object for quick lookup
                            const branchesMap = {};
                            branchesResponse.data.forEach(branch => {
                                branchesMap[branch.id] = branch;
                            });
                            setBranches(branchesMap);
                        } else {
                            setBranches({});
                        }
                    } catch (error) {
                        console.error('Error fetching branches:', error);
                        setBranches({});
                    }
                } else {
                    setBranches({});
                }
            } else {
                setBranches({});
            }
        };

        if (!terminalsLoading) {
            fetchBranchesForTerminals();
        }
    }, [terminals, terminalsLoading]);

    // Handle refresh
    const handleRefresh = useCallback(async () => {
        queryClient.invalidateQueries({ queryKey: ['terminals'] });
        await refetchTerminals();
        toast.success('Data refreshed successfully');
    }, [queryClient, refetchTerminals]);

    // Handle export
    const handleExport = useCallback(async () => {
        setExportLoading(true);
        try {
            const blob = await exportTerminals({ merchantId, filters });
            
            // Create download link
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `terminals_${new Date().toISOString().slice(0, 10)}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            
            toast.success('Export completed successfully');
        } catch (error) {
            console.error('Export error:', error);
            toast.error('Failed to export terminals');
        } finally {
            setExportLoading(false);
        }
    }, [merchantId, filters]);

    // Handle bulk delete
    const handleBulkDelete = useCallback(async () => {
        if (selectedIds.length === 0) return;

        const result = await Swal.fire({
            title: 'Are you sure?',
            text: `You are about to delete ${selectedIds.length} terminal(s). This action cannot be undone!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete them!',
            cancelButtonText: 'Cancel'
        });

        if (!result.isConfirmed) return;

        try {
            const response = await bulkDeleteTerminals(selectedIds);
            if (response.success) {
                Swal.fire({
                    title: 'Deleted!',
                    text: 'Terminals have been deleted successfully.',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                });
                setSelectedIds([]);
                queryClient.invalidateQueries({ queryKey: ['terminals'] });
                await refetchTerminals();
            } else {
                Swal.fire({
                    title: 'Error!',
                    text: response.error || 'Failed to delete terminals',
                    icon: 'error',
                    confirmButtonText: 'OK'
                });
            }
        } catch (error) {
            console.error('Error deleting terminals:', error);
            Swal.fire({
                title: 'Error!',
                text: 'An error occurred while deleting terminals',
                icon: 'error',
                confirmButtonText: 'OK'
            });
        }
    }, [selectedIds, queryClient, refetchTerminals]);

    // Set toolbar title, breadcrumbs and actions
    useEffect(() => {
        setTitle('Terminals');
        
        setBreadcrumbs([
            { label: 'Dashboard', path: '/merchant/dashboard' },
            { label: 'Terminals', path: '/merchant/terminals' },
            { label: 'Terminals List', path: '/merchant/terminals', active: true }
        ]);
        
        setActions(
            <>
                {/* Filter – icon only on small, icon + text on large */}
                <button
                    className="btn btn-sm btn-flex btn-secondary fw-bold"
                    onClick={() => setShowFilters(!showFilters)}
                    aria-label="Toggle filters"
                >
                    <i className="ki-duotone ki-filter fs-6 text-muted me-0 me-lg-1">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    <span className="d-none d-lg-inline ms-lg-1">
                        Filter
                    </span>
                </button>

                {/* Refresh – icon only on small, icon + text on large */}
                <button
                    className="btn btn-sm btn-flex btn-light fw-bold"
                    onClick={handleRefresh}
                    disabled={terminalsLoading}
                    aria-label="Refresh terminals"
                >
                    <i className="ki-duotone ki-arrows-circle fs-6 text-muted me-0 me-lg-1">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    <span className="d-none d-lg-inline ms-lg-1">
                        Refresh
                    </span>
                </button>

                {selectedIds.length > 0 && canDelete && (
                    <button
                        className="btn btn-sm fw-bold btn-danger"
                        onClick={handleBulkDelete}
                        aria-label={`Delete selected terminals (${selectedIds.length})`}
                    >
                        <i className="ki-duotone ki-trash fs-3 me-0 me-lg-2">
                            <span className="path1"></span>
                            <span className="path2"></span>
                            <span className="path3"></span>
                            <span className="path4"></span>
                            <span className="path5"></span>
                        </i>
                        <span className="d-none d-lg-inline">
                            Delete Selected ({selectedIds.length})
                        </span>
                    </button>
                )}

                {canExport('terminals') && (
                    <button
                        className="btn btn-sm fw-bold btn-success"
                        onClick={handleExport}
                        disabled={terminalsLoading || exportLoading}
                    >
                        <i className="ki-duotone ki-file-down fs-3">
                            <span className="path1"></span>
                            <span className="path2"></span>
                        </i>
                        Export
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
                    Import
                </button>

                {canCreate && (
                    <Link
                        to="/merchant/terminals/create"
                        className="btn btn-sm fw-bold btn-primary"
                    >
                        <i className="ki-duotone ki-plus fs-3">
                            <span className="path1"></span>
                            <span className="path2"></span>
                        </i>
                        Add Terminal
                    </Link>
                )}
            </>
        );

        return () => {
            setActions(null);
            setBreadcrumbs([]);
        };
    }, [showFilters, terminalsLoading, exportLoading, selectedIds.length, handleRefresh, handleExport, handleBulkDelete, setTitle, setBreadcrumbs, setActions]);

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
        queryClient.invalidateQueries({ queryKey: ['terminals'] });
        refetchTerminals();
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
                <TerminalsFilters
                    filters={filters}
                    setFilters={setFilters}
                    onClear={clearFilters}
                    onClose={() => setShowFilters(false)}
                />
            )}

            {/* Table */}
            <div className="card">
                <div className="card-body pt-0">
                    {terminalsLoading ? (
                        // Skeleton Loading
                        <div className="table-responsive">
                            <table className="table align-middle table-row-dashed fs-6 gy-5">
                                <thead>
                                    <tr className="text-start text-gray-400 fw-bold fs-7 text-uppercase gs-0">
                                        <th className="w-10px pe-2"></th>
                                        <th className="min-w-125px">Name</th>
                                        <th className="min-w-125px">Terminal ID</th>
                                        <th className="min-w-100px">Model</th>
                                        <th className="min-w-100px">Manufacturer</th>
                                        <th className="min-w-100px">Status</th>
                                        <th className="text-end min-w-100px">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[...Array(perPage)].map((_, index) => (
                                        <tr key={`skeleton-${index}`}>
                                            <td>
                                                <div className="skeleton" style={{width: '20px', height: '20px', margin: '0 auto'}}></div>
                                            </td>
                                            <td><div className="skeleton skeleton-text" style={{width: '150px', height: '16px'}}></div></td>
                                            <td><div className="skeleton skeleton-text" style={{width: '120px', height: '16px'}}></div></td>
                                            <td><div className="skeleton skeleton-text" style={{width: '100px', height: '16px'}}></div></td>
                                            <td><div className="skeleton skeleton-text" style={{width: '100px', height: '16px'}}></div></td>
                                            <td><div className="skeleton skeleton-badge" style={{width: '80px', height: '24px', borderRadius: '6px'}}></div></td>
                                            <td className="text-end"><div className="skeleton skeleton-button" style={{width: '70px', height: '32px', borderRadius: '6px', marginLeft: 'auto'}}></div></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <TerminalsTable
                            terminals={terminals}
                            branches={branches}
                            selectedIds={selectedIds}
                            setSelectedIds={setSelectedIds}
                            pagination={pagination}
                            onPageChange={handlePageChange}
                            onPerPageChange={handlePerRowsChange}
                            onRefresh={handleRefresh}
                            loading={terminalsLoading}
                            error={null}
                        />
                    )}
                </div>
            </div>

            {/* Import Modal */}
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

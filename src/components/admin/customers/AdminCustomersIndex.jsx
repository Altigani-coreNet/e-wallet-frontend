import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { useQueryClient } from '@tanstack/react-query';
import Swal from 'sweetalert2';
import { useToolbar } from '../../../contexts/ToolbarContext';
import { useCan, canExport } from '../../../utils/permissions';
import {
    useAdminCustomers,
    deleteAdminCustomer,
    bulkDeleteAdminCustomers,
    exportAdminCustomers,
    adminCustomersKeys,
} from '../../../services/adminCustomersService';
import CustomerFiltersPanel from './CustomerFiltersPanel';
import AdminCustomersTable from './AdminCustomersTable';
import AdminCustomerToolbar from './AdminCustomerToolbar';
import CustomerImportModal from './CustomerImportModal';
import LoadingSpinner from '../../common/LoadingSpinner';
import ErrorAlert from '../../common/ErrorAlert';

const AdminCustomersIndex = () => {
    const { t, i18n } = useTranslation();
    const { setTitle, setBreadcrumbs, setActions } = useToolbar();
    const queryClient = useQueryClient();

    const canCreateCustomer = useCan(['sales.customers.create_customers', 'create_customers']);
    const canDelete = useCan(['sales.customers.delete_customers', 'delete_customers']);

    const [selectedIds, setSelectedIds] = useState([]);
    const [showFilters, setShowFilters] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [filters, setFilters] = useState({
        search: '',
        status: '',
        country_id: '',
        date_from: '',
        date_to: '',
    });
    const [pagination, setPagination] = useState({
        current_page: 1,
        per_page: 15,
        total: 0,
        last_page: 1,
    });

    const [debouncedFilters, setDebouncedFilters] = useState(filters);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedFilters(filters);
            setPagination((prev) => ({ ...prev, current_page: 1 }));
        }, 500);
        return () => clearTimeout(timer);
    }, [filters]);

    const queryParams = useMemo(
        () => ({
            page: pagination.current_page,
            per_page: pagination.per_page,
            ...debouncedFilters,
        }),
        [pagination.current_page, pagination.per_page, debouncedFilters]
    );

    const {
        data: customersResponse,
        isLoading,
        isFetching,
        error: queryError,
        refetch,
    } = useAdminCustomers(queryParams, {
        keepPreviousData: true,
        onSuccess: (response) => {
            const paginated = response?.data;
            if (paginated?.current_page !== undefined) {
                setPagination({
                    current_page: paginated.current_page,
                    per_page: paginated.per_page,
                    total: paginated.total,
                    last_page: paginated.last_page || Math.ceil(paginated.total / paginated.per_page),
                });
            }
        },
        onError: (err) => {
            console.error('Error fetching admin customers:', err);
            toast.error(t('customers.failedToLoadCustomers'));
        },
    });

    const customers = useMemo(() => {
        const payload = customersResponse?.data;
        if (!payload) return [];
        if (Array.isArray(payload.data)) return payload.data;
        if (Array.isArray(payload.customers)) return payload.customers;
        if (Array.isArray(payload)) return payload;
        return [];
    }, [customersResponse]);

    const handlePerPageChange = (newPerPage) => {
        setPagination((prev) => ({ ...prev, per_page: newPerPage, current_page: 1 }));
    };

    const handlePageChange = (page) => {
        setPagination((prev) => ({ ...prev, current_page: page }));
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: t('common.areYouSure'),
            text: t('customers.confirmDeleteCustomer', { name: '' }),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: t('common.yesDeleteIt'),
            cancelButtonText: t('common.cancel'),
        });

        if (!result.isConfirmed) return;

        try {
            const response = await deleteAdminCustomer(id);
            if (response.success) {
                toast.success(t('customers.customerDeletedSuccessfully'));
                queryClient.invalidateQueries({ queryKey: adminCustomersKeys.list(queryParams) });
                refetch();
                setSelectedIds((prev) => prev.filter((selectedId) => selectedId !== id));
            } else {
                toast.error(response.error || t('customers.failedToDeleteCustomer'));
            }
        } catch (err) {
            console.error('Error deleting customer:', err);
            toast.error(t('common.unexpectedErrorOccurred'));
        }
    };

    const handleBulkDelete = useCallback(async () => {
        if (selectedIds.length === 0) {
            toast.warning(t('customers.pleaseSelectAtLeastOneCustomer'));
            return;
        }

        const result = await Swal.fire({
            title: t('common.areYouSure'),
            text: t('customers.confirmDeleteBulkCustomers', { count: selectedIds.length }),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: t('common.yesDeleteThem'),
            cancelButtonText: t('common.cancel'),
        });

        if (result.isConfirmed) {
            try {
                const response = await bulkDeleteAdminCustomers(selectedIds);
                if (response.success) {
                    await Swal.fire({
                        title: t('common.deleted'),
                        text: t('customers.customersDeletedSuccessfully'),
                        icon: 'success',
                        timer: 2000,
                        showConfirmButton: false,
                    });
                    setSelectedIds([]);
                    queryClient.invalidateQueries({ queryKey: adminCustomersKeys.list(queryParams) });
                    refetch();
                } else {
                    Swal.fire(t('common.error'), response.error || t('customers.failedToDeleteCustomers'), 'error');
                }
            } catch (error) {
                Swal.fire(t('common.error'), t('common.unexpectedErrorOccurred'), 'error');
            }
        }
    }, [selectedIds, queryParams, queryClient, refetch, t]);

    const handleExport = useCallback(async () => {
        try {
            const response = await exportAdminCustomers(debouncedFilters);
            const isSuccess = response.success || response.status;
            const exportPayload = response.data;

            if (!isSuccess || !exportPayload?.data?.length) {
                toast.error(t('customers.failedToExportCustomers'));
                return;
            }

            const { data, filename } = exportPayload;
            const headers = Object.keys(data[0]);
            let csvContent = `${headers.join(',')}\n`;

            data.forEach((row) => {
                const values = headers.map((header) => {
                    const value = row[header];
                    if (value === null || value === undefined) return '';
                    const stringValue = String(value);
                    if (stringValue.includes(',') || stringValue.includes('"')) {
                        return `"${stringValue.replace(/"/g, '""')}"`;
                    }
                    return stringValue;
                });
                csvContent += `${values.join(',')}\n`;
            });

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.setAttribute('download', filename || `customers_export_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);

            toast.success(t('customers.customersExportedSuccessfully'));
        } catch (error) {
            console.error('Export error:', error);
            toast.error(t('customers.failedToExportCustomers'));
        }
    }, [debouncedFilters, t]);

    const handleFilterChange = (newFilters) => {
        setFilters((prev) => ({ ...prev, ...newFilters }));
    };

    const handleClearFilters = () => {
        setFilters({
            search: '',
            status: '',
            country_id: '',
            date_from: '',
            date_to: '',
        });
    };

    const handleImportSuccess = async () => {
        setShowImportModal(false);
        await queryClient.invalidateQueries({
            queryKey: adminCustomersKeys.all,
            refetchType: 'active',
        });
        refetch();
    };

    useEffect(() => {
        setTitle(t('customers.customerManagement'));
        setBreadcrumbs([
            { label: t('admin.sidebar.dashboard'), path: '/admin/dashboard' },
            { label: t('customers.customers'), path: '/admin/customers', active: true },
        ]);
        setActions(
            <AdminCustomerToolbar
                onRefresh={() => refetch()}
                loading={isFetching}
                onToggleFilters={() => setShowFilters(!showFilters)}
                onExport={canExport('customers') ? handleExport : undefined}
                onImport={() => setShowImportModal(true)}
                selectedCount={selectedIds.length}
                onBulkDelete={canDelete ? handleBulkDelete : undefined}
                canCreate={canCreateCustomer}
            />
        );

        return () => {
            setTitle(t('admin.sidebar.dashboard'));
            setBreadcrumbs([]);
            setActions(null);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isFetching, showFilters, selectedIds.length, handleExport, handleBulkDelete, canCreateCustomer, canDelete, t, i18n.language]);

    return (
        <>
            {showFilters && (
                <CustomerFiltersPanel
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    onClearFilters={handleClearFilters}
                />
            )}

            <div className="card">
                <div className="card-header border-0 pt-6">
                    <div className="card-title d-flex justify-content-between align-items-center w-100">
                        <div className="d-flex align-items-center position-relative">
                            <i className="ki-duotone ki-magnifier fs-3 position-absolute ms-5">
                                <span className="path1"></span>
                                <span className="path2"></span>
                            </i>
                            <input
                                type="text"
                                className="form-control form-control-solid w-250px ps-13"
                                placeholder={t('customers.searchCustomers')}
                                value={filters.search}
                                onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                            />
                        </div>
                        <div className="d-flex align-items-center gap-2">
                            <label className="form-label mb-0 text-nowrap">{t('common.perPage')}</label>
                            <select
                                className="form-select form-select-sm"
                                style={{ width: '80px' }}
                                value={pagination.per_page}
                                onChange={(e) => handlePerPageChange(Number(e.target.value))}
                            >
                                <option value="10">10</option>
                                <option value="15">15</option>
                                <option value="25">25</option>
                                <option value="50">50</option>
                                <option value="100">100</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="card-body pt-0">
                    {isFetching && !isLoading && (
                        <div className="mb-4" style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                            <div className="progress" style={{ height: '3px' }}>
                                <div className="progress-bar progress-bar-striped progress-bar-animated bg-primary w-100"></div>
                            </div>
                        </div>
                    )}

                    {queryError && (
                        <ErrorAlert
                            error={
                                queryError?.response?.data?.message ||
                                queryError?.message ||
                                t('customers.failedToFetchCustomers')
                            }
                            onClose={() =>
                                queryClient.invalidateQueries({ queryKey: adminCustomersKeys.list(queryParams) })
                            }
                        />
                    )}

                    {isLoading && customers.length === 0 ? (
                        <LoadingSpinner />
                    ) : (
                        <AdminCustomersTable
                            customers={customers}
                            selectedIds={selectedIds}
                            onSelectChange={setSelectedIds}
                            onDelete={handleDelete}
                            pagination={pagination}
                            onPageChange={handlePageChange}
                            isFetching={isFetching}
                        />
                    )}
                </div>
            </div>

            {showImportModal && (
                <CustomerImportModal
                    isOpen={showImportModal}
                    onClose={() => setShowImportModal(false)}
                    onImportSuccess={handleImportSuccess}
                />
            )}
        </>
    );
};

export default AdminCustomersIndex;

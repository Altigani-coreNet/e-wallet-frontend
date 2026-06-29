import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { useQueryClient } from '@tanstack/react-query';
import Swal from 'sweetalert2';
import { useToolbar } from '../../../contexts/ToolbarContext';
import {
    useAdminWallets,
    suspendWallet,
    activateWallet,
    deleteWallet,
    downloadWalletsExport,
    triggerBlobDownload,
    adminWalletsKeys,
} from '../../../services/adminWalletsService';
import WalletFiltersPanel from './WalletFiltersPanel';
import WalletsTable from './WalletsTable';
import WalletToolbar from './WalletToolbar';
import LoadingSpinner from '../../common/LoadingSpinner';
import ErrorAlert from '../../common/ErrorAlert';

const AdminWalletsIndex = () => {
    const { t } = useTranslation();
    const { setTitle, setBreadcrumbs, setActions } = useToolbar();
    const queryClient = useQueryClient();

    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        search: '',
        status: '',
        wallet_type: '',
        currency_code: '',
        date_from: '',
        date_to: '',
        min_balance: '',
        max_balance: '',
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
        data: walletsResponse,
        isLoading,
        isFetching,
        error: queryError,
        refetch,
    } = useAdminWallets(queryParams);

    useEffect(() => {
        if (walletsResponse?.current_page !== undefined) {
            setPagination({
                current_page: walletsResponse.current_page,
                per_page: walletsResponse.per_page,
                total: walletsResponse.total,
                last_page: walletsResponse.last_page || Math.ceil(walletsResponse.total / walletsResponse.per_page),
            });
        }
    }, [walletsResponse]);

    const wallets = useMemo(() => {
        if (!walletsResponse?.data) return [];
        return walletsResponse.data;
    }, [walletsResponse]);

    const handleExport = useCallback(async () => {
        try {
            const blob = await downloadWalletsExport(debouncedFilters);
            triggerBlobDownload(blob, `wallets_export_${new Date().toISOString().slice(0, 10)}.xlsx`);
            toast.success(t('admin.wallets.exportSuccess'));
        } catch (err) {
            console.error(err);
            toast.error(t('admin.wallets.exportFailed'));
        }
    }, [debouncedFilters, t]);

    const invalidateList = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: adminWalletsKeys.list(queryParams) });
        refetch();
    }, [queryClient, queryParams, refetch]);

    const handleSuspend = async (id) => {
        const result = await Swal.fire({
            title: t('admin.wallets.suspend'),
            text: t('admin.wallets.confirmSuspend'),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#f1416c',
            cancelButtonColor: '#6c757d',
            confirmButtonText: t('common.yesActionIt', { action: t('admin.wallets.suspend') }),
            cancelButtonText: t('common.cancel'),
        });
        if (!result.isConfirmed) return;

        try {
            await suspendWallet(id);
            toast.success(t('admin.wallets.suspendSuccess'));
            invalidateList();
        } catch (err) {
            toast.error(err.response?.data?.message || t('admin.wallets.actionFailed'));
        }
    };

    const handleActivate = async (id) => {
        const result = await Swal.fire({
            title: t('admin.wallets.activate'),
            text: t('admin.wallets.confirmActivate'),
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#6c757d',
            confirmButtonText: t('common.yesActionIt', { action: t('admin.wallets.activate') }),
            cancelButtonText: t('common.cancel'),
        });
        if (!result.isConfirmed) return;

        try {
            await activateWallet(id);
            toast.success(t('admin.wallets.activateSuccess'));
            invalidateList();
        } catch (err) {
            toast.error(err.response?.data?.message || t('admin.wallets.actionFailed'));
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: t('common.areYouSure'),
            text: t('admin.wallets.confirmDelete'),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: t('common.yesDeleteIt'),
            cancelButtonText: t('common.cancel'),
        });
        if (!result.isConfirmed) return;

        try {
            await deleteWallet(id);
            toast.success(t('admin.wallets.deleteSuccess'));
            invalidateList();
        } catch (err) {
            toast.error(err.response?.data?.message || t('admin.wallets.actionFailed'));
        }
    };

    const handleClearFilters = () => {
        setFilters({
            search: '',
            status: '',
            wallet_type: '',
            currency_code: '',
            date_from: '',
            date_to: '',
            min_balance: '',
            max_balance: '',
        });
    };

    useEffect(() => {
        setTitle(t('admin.wallets.title'));
        setBreadcrumbs([
            { title: t('admin.sidebar.dashboard'), path: '/admin/dashboard' },
            { title: t('admin.wallets.title'), path: '/admin/wallets' },
        ]);
        setActions(
            <WalletToolbar
                onRefresh={refetch}
                loading={isFetching}
                onToggleFilters={() => setShowFilters((prev) => !prev)}
                onExport={handleExport}
            />
        );
        return () => {
            setTitle('');
            setBreadcrumbs([]);
            setActions(null);
        };
    }, [setTitle, setBreadcrumbs, setActions, t, refetch, isFetching, handleExport]);

    if (isLoading) {
        return <LoadingSpinner />;
    }

    return (
        <>
            {queryError && <ErrorAlert message={t('admin.wallets.failedToLoad')} />}

            {showFilters && (
                <WalletFiltersPanel
                    filters={filters}
                    onChange={setFilters}
                    onClear={handleClearFilters}
                />
            )}

            <div className="card">
                <div className="card-body pt-0">
                    <WalletsTable
                        wallets={wallets}
                        onSuspend={handleSuspend}
                        onActivate={handleActivate}
                        onDelete={handleDelete}
                        pagination={pagination}
                        onPageChange={(page) => setPagination((prev) => ({ ...prev, current_page: page }))}
                        onPerPageChange={(perPage) => setPagination((prev) => ({ ...prev, per_page: perPage, current_page: 1 }))}
                        isFetching={isFetching}
                    />
                </div>
            </div>
        </>
    );
};

export default AdminWalletsIndex;

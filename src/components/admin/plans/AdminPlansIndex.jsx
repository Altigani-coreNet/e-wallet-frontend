import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import { useTranslation } from 'react-i18next';
import { ADMIN_ENDPOINTS } from '../../../utils/constants';
import { getToken } from '../../../utils/api';
import { useToolbar } from '../../../contexts/ToolbarContext';
import PlanFiltersPanel from './PlanFiltersPanel';
import PlanTableRow from './PlanTableRow';
import BulkActionBar from '../../common/BulkActionBar';

const AdminPlansIndex = () => {
    const { t } = useTranslation();
    const { setTitle, setActions } = useToolbar();
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);
    const [pagination, setPagination] = useState({
        current_page: 1,
        per_page: 15,
        total: 0,
        last_page: 1
    });
    const [filters, setFilters] = useState({
        search: '',
        plan_type: '',
        status: '',
        has_discount: ''
    });

    useEffect(() => {
        setTitle(t('admin.plansIndex.plansManagement'));
        setActions(
            <div className="d-flex align-items-center gap-2 gap-lg-3">
                <button
                    className="btn btn-sm btn-flex btn-secondary fw-bold"
                    onClick={() => setShowFilters(!showFilters)}
                >
                    <i className="ki-duotone ki-filter fs-3">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    <span className="d-none d-md-inline ms-1">{showFilters ? t('admin.plansIndex.hideFilters') : t('admin.plansIndex.showFilters')}</span>
                </button>
                <Link to="/admin/plans/create" className="btn btn-sm fw-bold btn-primary">
                    <i className="ki-duotone ki-plus fs-3">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    <span className="d-none d-md-inline ms-1">{t('admin.plansIndex.addPlan')}</span>
                </Link>
            </div>
        );
        return () => setActions(null);
    }, [setTitle, setActions, showFilters, t]);

    useEffect(() => {
        fetchPlans();
    }, [pagination.current_page, pagination.per_page, filters]);

    const fetchPlans = async () => {
        setLoading(true);
        try {
            const token = getToken();
            const params = {
                page: pagination.current_page,
                per_page: pagination.per_page,
                ...filters
            };

            const response = await axios.get(ADMIN_ENDPOINTS.PLANS, {
                params,
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const isSuccess = response.data.success || response.data.status;
            if (isSuccess) {
                setPlans(response.data.data.data || []);
                setPagination({
                    current_page: response.data.data.current_page,
                    per_page: response.data.data.per_page,
                    total: response.data.data.total,
                    last_page: response.data.data.last_page
                });
            }
        } catch (error) {
            toast.error(t('admin.plansIndex.failedToLoad'));
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: t('admin.plansIndex.deleteConfirm'),
            text: t('admin.plansIndex.deleteText'),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: t('admin.plansIndex.deleteConfirmButton')
        });

        if (result.isConfirmed) {
            try {
                const token = getToken();
                await axios.delete(ADMIN_ENDPOINTS.PLAN_DELETE(id), {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                toast.success(t('admin.plansIndex.deleteSuccess'));
                fetchPlans();
            } catch (error) {
                toast.error(t('admin.plansIndex.deleteFailed'));
                console.error(error);
            }
        }
    };

    const handleStatusChange = async (id) => {
        try {
            const token = getToken();
            await axios.post(ADMIN_ENDPOINTS.PLAN_CHANGE_STATUS(id), {}, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            toast.success(t('admin.plansIndex.statusUpdateSuccess'));
            fetchPlans();
        } catch (error) {
            toast.error(t('admin.plansIndex.statusUpdateFailed'));
            console.error(error);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) {
            toast.warning(t('admin.plansIndex.selectPlansToDelete'));
            return;
        }

        const result = await Swal.fire({
            title: t('admin.plansIndex.bulkDeleteConfirm'),
            text: t('admin.plansIndex.bulkDeleteText', { count: selectedIds.length }),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: t('admin.plansIndex.bulkDeleteConfirmButton')
        });

        if (result.isConfirmed) {
            try {
                const token = getToken();
                await Promise.all(
                    selectedIds.map(id => 
                        axios.delete(ADMIN_ENDPOINTS.PLAN_DELETE(id), {
                            headers: { 'Authorization': `Bearer ${token}` }
                        })
                    )
                );
                toast.success(t('admin.plansIndex.bulkDeleteSuccess', { count: selectedIds.length }));
                setSelectedIds([]);
                fetchPlans();
            } catch (error) {
                toast.error(t('admin.plansIndex.bulkDeleteFailed'));
                console.error(error);
            }
        }
    };

    return (
        <div className="post d-flex flex-column-fluid">
            <div id="kt_content_container" className="container-xxl">
                {showFilters && (
                    <PlanFiltersPanel
                        filters={filters}
                        setFilters={setFilters}
                        onApply={() => {
                            setPagination(prev => ({ ...prev, current_page: 1 }));
                            fetchPlans();
                        }}
                    />
                )}

                <div className="card">
                    <div className="card-header border-0 pt-6">
                        <div className="card-title"></div>
                        <div className="card-toolbar">
                            <div className="d-flex justify-content-end align-items-center d-none"
                                 data-kt-plan-table-toolbar="selected">
                                <div className="fw-bolder me-5">
                                    <span className="me-2" data-kt-plan-table-select="selected_count"></span>{t('admin.plansIndex.selected')}
                                </div>
                                <button type="button" className="btn btn-danger"
                                        onClick={handleBulkDelete}>{t('admin.plansIndex.deleteSelected')}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="card-body pt-2">
                        {selectedIds.length > 0 && (
                            <BulkActionBar
                                selectedCount={selectedIds.length}
                                onClearSelection={() => setSelectedIds([])}
                                onBulkDelete={handleBulkDelete}
                            />
                        )}

                        <div className="table-responsive">
                            <table className="table align-middle table-row-dashed fs-6 gy-5">
                                <thead>
                                    <tr className="text-start text-muted fw-bold fs-7 text-uppercase gs-0">
                                        <th className="w-10px pe-2">
                                            <div className="form-check form-check-sm form-check-custom form-check-solid">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    checked={selectedIds.length === plans.length && plans.length > 0}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedIds(plans.map(p => p.id));
                                                        } else {
                                                            setSelectedIds([]);
                                                        }
                                                    }}
                                                />
                                            </div>
                                        </th>
                                        <th className="min-w-125px">{t('admin.plansIndex.name')}</th>
                                        <th className="min-w-125px">{t('admin.plansIndex.description')}</th>
                                        <th className="min-w-125px">{t('admin.plansIndex.planType')}</th>
                                        <th className="min-w-125px">{t('admin.plansIndex.price')}</th>
                                        <th className="min-w-125px">{t('admin.plansIndex.discountedPrice')}</th>
                                        <th className="min-w-125px">{t('admin.plansIndex.hasDiscount')}</th>
                                        <th className="min-w-125px">{t('admin.plansIndex.status')}</th>
                                        <th className="min-w-125px">{t('admin.plansIndex.actions')}</th>
                                    </tr>
                                </thead>
                                <tbody className="text-gray-600 fw-semibold">
                                    {loading ? (
                                        <tr>
                                            <td colSpan="9" className="text-center py-10">
                                                <div className="spinner-border text-primary" role="status">
                                                    <span className="visually-hidden">{t('admin.common.loading')}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : plans.length === 0 ? (
                                        <tr>
                                            <td colSpan="9" className="text-center py-10">
                                                {t('admin.plansIndex.noPlansFound')}
                                            </td>
                                        </tr>
                                    ) : (
                                        plans.map((plan) => (
                                            <PlanTableRow
                                                key={plan.id}
                                                plan={plan}
                                                isSelected={selectedIds.includes(plan.id)}
                                                onSelect={(id) => {
                                                    setSelectedIds(prev =>
                                                        prev.includes(id)
                                                            ? prev.filter(selectedId => selectedId !== id)
                                                            : [...prev, id]
                                                    );
                                                }}
                                                onDelete={handleDelete}
                                                onStatusChange={handleStatusChange}
                                            />
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {pagination.last_page > 1 && (
                            <div className="d-flex justify-content-between align-items-center mt-5">
                                <div>
                                    {t('admin.plansIndex.showingResults', {
                                        from: ((pagination.current_page - 1) * pagination.per_page) + 1,
                                        to: Math.min(pagination.current_page * pagination.per_page, pagination.total),
                                        total: pagination.total
                                    })}
                                </div>
                                <div>
                                    <button
                                        className="btn btn-sm btn-light"
                                        disabled={pagination.current_page === 1}
                                        onClick={() => setPagination(prev => ({ ...prev, current_page: prev.current_page - 1 }))}
                                    >
                                        {t('admin.plansIndex.previous')}
                                    </button>
                                    <button
                                        className="btn btn-sm btn-light ms-2"
                                        disabled={pagination.current_page === pagination.last_page}
                                        onClick={() => setPagination(prev => ({ ...prev, current_page: prev.current_page + 1 }))}
                                    >
                                        {t('admin.plansIndex.next')}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminPlansIndex;

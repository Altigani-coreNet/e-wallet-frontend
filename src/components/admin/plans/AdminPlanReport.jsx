import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ADMIN_ENDPOINTS } from '../../../utils/constants';
import { getToken } from '../../../utils/api';
import { useToolbar } from '../../../contexts/ToolbarContext';
import PlanFiltersPanel from './PlanFiltersPanel';

const AdminPlanReport = () => {
    const { setTitle, setActions } = useToolbar();
    const [loading, setLoading] = useState(true);
    const [reportData, setReportData] = useState(null);
    const [filters, setFilters] = useState({
        search: '',
        plan_type: '',
        status: '',
        has_discount: '',
        date_from: '',
        date_to: ''
    });

    useEffect(() => {
        setTitle('Plans Report');
        setActions(null);
        return () => setActions(null);
    }, [setTitle, setActions]);

    useEffect(() => {
        fetchReport();
    }, []);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const token = getToken();
            const response = await axios.get(ADMIN_ENDPOINTS.PLAN_REPORT, {
                params: filters,
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const isSuccess = response.data.success || response.data.status;
            if (isSuccess) {
                setReportData(response.data.data);
            }
        } catch (error) {
            toast.error('Failed to load report');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        if (!reportData || !reportData.plans || reportData.plans.length === 0) {
            toast.warning('No data to export');
            return;
        }

        const headers = ['Name', 'Description', 'Plan Type', 'Price', 'Discounted Price', 'Has Discount', 'Status', 'Product Counts', 'Shop Counts', 'Created At'];
        let csvContent = headers.join(',') + '\n';
        
        reportData.plans.forEach(plan => {
            const row = [
                plan.name || '',
                plan.description || '',
                plan.plan_type?.value || plan.plan_type || '',
                plan.price || '0',
                plan.current_price || '',
                plan.has_discount ? 'Yes' : 'No',
                plan.status ? 'Active' : 'Inactive',
                plan.product_counts || '',
                plan.shop_counts || '',
                plan.created_at || ''
            ];
            csvContent += row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(',') + '\n';
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', `plans_report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
        
        toast.success('Report exported successfully');
    };

    if (loading) {
        return (
            <div className="post d-flex flex-column-fluid">
                <div id="kt_content_container" className="container-xxl">
                    <div className="card">
                        <div className="card-body text-center py-10">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="post d-flex flex-column-fluid">
            <div id="kt_content_container" className="container-xxl">
                <PlanFiltersPanel
                    filters={filters}
                    setFilters={setFilters}
                    onApply={fetchReport}
                />

                <div className="row g-5 g-xl-8 mb-5">
                    {reportData?.statistics && (
                        <>
                            <div className="col-xl-3">
                                <div className="card bg-light-primary">
                                    <div className="card-body">
                                        <div className="d-flex align-items-center">
                                            <div className="flex-grow-1">
                                                <span className="text-gray-500 fw-bold fs-6">Total Plans</span>
                                                <div className="text-gray-800 fw-bold fs-2hx">{reportData.statistics.total_plans}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-xl-3">
                                <div className="card bg-light-success">
                                    <div className="card-body">
                                        <div className="d-flex align-items-center">
                                            <div className="flex-grow-1">
                                                <span className="text-gray-500 fw-bold fs-6">Active Plans</span>
                                                <div className="text-gray-800 fw-bold fs-2hx">{reportData.statistics.active_plans}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-xl-3">
                                <div className="card bg-light-danger">
                                    <div className="card-body">
                                        <div className="d-flex align-items-center">
                                            <div className="flex-grow-1">
                                                <span className="text-gray-500 fw-bold fs-6">Inactive Plans</span>
                                                <div className="text-gray-800 fw-bold fs-2hx">{reportData.statistics.inactive_plans}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-xl-3">
                                <div className="card bg-light-info">
                                    <div className="card-body">
                                        <div className="d-flex align-items-center">
                                            <div className="flex-grow-1">
                                                <span className="text-gray-500 fw-bold fs-6">Plans with Discount</span>
                                                <div className="text-gray-800 fw-bold fs-2hx">{reportData.statistics.plans_with_discount}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div className="card">
                    <div className="card-header border-0 pt-6">
                        <div className="card-title">
                            <h3>Plans Report</h3>
                        </div>
                        <div className="card-toolbar">
                            <button
                                type="button"
                                className="btn btn-sm btn-primary"
                                onClick={handleExport}
                            >
                                <i className="ki-duotone ki-download fs-2">
                                    <span className="path1"></span>
                                    <span className="path2"></span>
                                </i>
                                Export Report
                            </button>
                        </div>
                    </div>
                    <div className="card-body">
                        <div className="table-responsive">
                            <table className="table align-middle table-row-dashed fs-6 gy-5">
                                <thead>
                                    <tr className="text-start text-muted fw-bold fs-7 text-uppercase gs-0">
                                        <th>Name</th>
                                        <th>Description</th>
                                        <th>Plan Type</th>
                                        <th>Price</th>
                                        <th>Discounted Price</th>
                                        <th>Has Discount</th>
                                        <th>Status</th>
                                        <th>Product Counts</th>
                                        <th>Shop Counts</th>
                                        <th>Created At</th>
                                    </tr>
                                </thead>
                                <tbody className="text-gray-600 fw-semibold">
                                    {reportData?.plans && reportData.plans.length > 0 ? (
                                        reportData.plans.map((plan) => (
                                            <tr key={plan.id}>
                                                <td>{plan.name}</td>
                                                <td>
                                                    <div className="text-truncate" style={{ maxWidth: '200px' }}>
                                                        {plan.description || '-'}
                                                    </div>
                                                </td>
                                                <td>{plan.plan_type?.value || plan.plan_type || '-'}</td>
                                                <td>{plan.price ? parseFloat(plan.price).toFixed(2) : '-'}</td>
                                                <td>{plan.current_price ? parseFloat(plan.current_price).toFixed(2) : '-'}</td>
                                                <td>
                                                    {plan.has_discount ? (
                                                        <span className="badge badge-success">Yes</span>
                                                    ) : (
                                                        <span className="badge badge-secondary">No</span>
                                                    )}
                                                </td>
                                                <td>
                                                    {plan.status ? (
                                                        <span className="badge badge-success">Active</span>
                                                    ) : (
                                                        <span className="badge badge-danger">Inactive</span>
                                                    )}
                                                </td>
                                                <td>{plan.product_counts || '-'}</td>
                                                <td>{plan.shop_counts || '-'}</td>
                                                <td>{plan.created_at ? new Date(plan.created_at).toLocaleDateString() : '-'}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="10" className="text-center py-10">
                                                No plans found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminPlanReport;

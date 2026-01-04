import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useToolbar } from '../../../contexts/ToolbarContext';
import { getPaymentGateways } from '../../../services/adminPaymentGatewaysService';
import PaymentGatewayTableRow from './PaymentGatewayTableRow';

const AdminPaymentGatewaysIndex = () => {
    const { setTitle, setActions } = useToolbar();
    const [paymentGateways, setPaymentGateways] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [modeFilter, setModeFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [pagination, setPagination] = useState({
        current_page: 1,
        per_page: 15,
        total: 0,
        last_page: 1
    });

    useEffect(() => {
        setTitle('Payment Providers');
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
                    <span className="d-none d-md-inline ms-1">{showFilters ? 'Hide' : 'Show'} Filters</span>
                </button>

                <Link to="/admin/payment-gateways/create" className="btn btn-sm fw-bold btn-primary">
                    <i className="ki-duotone ki-plus fs-3">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    <span className="d-none d-md-inline ms-1">Add Payment Provider</span>
                </Link>
            </div>
        );
        return () => setActions(null);
    }, [setTitle, setActions, showFilters]);

    useEffect(() => {
        fetchPaymentGateways();
    }, [pagination.current_page]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (pagination.current_page === 1) {
                fetchPaymentGateways();
            } else {
                setPagination(prev => ({ ...prev, current_page: 1 }));
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm, modeFilter, statusFilter]);

    const fetchPaymentGateways = async () => {
        setLoading(true);
        try {
            const params = {
                page: pagination.current_page,
                per_page: pagination.per_page,
                search: searchTerm,
            };

            if (modeFilter) {
                params.mode = modeFilter;
            }

            if (statusFilter !== '') {
                params.is_active = statusFilter;
            }

            const response = await getPaymentGateways(params);

            if (response.success) {
                setPaymentGateways(response.data.data?.data || []);
                if (response.data.data?.recordsTotal) {
                    setPagination(prev => ({
                        ...prev,
                        total: response.data.data.recordsTotal,
                        last_page: response.data.data.pagination?.last_page || Math.ceil(response.data.data.recordsTotal / prev.per_page)
                    }));
                }
            } else {
                toast.error(response.error || 'Failed to fetch payment gateways');
            }
        } catch (error) {
            console.error('Error fetching payment gateways:', error);
            toast.error('Failed to fetch payment gateways');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(paymentGateways.map(gateway => gateway.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const handlePageChange = (newPage) => {
        setPagination(prev => ({ ...prev, current_page: newPage }));
    };

    const resetFilters = () => {
        setSearchTerm('');
        setModeFilter('');
        setStatusFilter('');
    };

    return (
        <>
            {/* Filter Panel */}
            {showFilters && (
                <div className="row g-5 g-xl-8 mb-4">
                    <div className="col-12">
                        <div className="card mb-5">
                            <div className="card-body">
                                <div className="row g-3">
                                    <div className="col-md-4">
                                        <label className="form-label">Search</label>
                                        <input 
                                            type="text" 
                                            className="form-control form-control-sm"
                                            value={searchTerm}
                                            placeholder="Search by name, title, or alias..."
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label">Mode</label>
                                        <select 
                                            className="form-select form-select-sm"
                                            value={modeFilter}
                                            onChange={(e) => setModeFilter(e.target.value)}
                                        >
                                            <option value="">All Modes</option>
                                            <option value="test">Test</option>
                                            <option value="live">Live</option>
                                        </select>
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label">Status</label>
                                        <select 
                                            className="form-select form-select-sm"
                                            value={statusFilter}
                                            onChange={(e) => setStatusFilter(e.target.value)}
                                        >
                                            <option value="">All Statuses</option>
                                            <option value="1">Active</option>
                                            <option value="0">Inactive</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="d-flex justify-content-end mt-4">
                                    <button onClick={resetFilters} className="btn btn-sm btn-light-primary">
                                        <i className="ki-duotone ki-arrows-circle fs-3">
                                            <span className="path1"></span>
                                            <span className="path2"></span>
                                        </i>
                                        Reset Filters
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="row g-5 g-xl-8">
                <div className="col-12">
                    <div className="card">
                        <div className="card-header border-0 pt-6">
                            <div className="card-title">
                                <div className="d-flex align-items-center position-relative my-1">
                                    <i className="ki-duotone ki-magnifier fs-3 position-absolute ms-5">
                                        <span className="path1"></span>
                                        <span className="path2"></span>
                                    </i>
                                    <input
                                        type="text"
                                        className="form-control form-control-solid w-250px ps-13"
                                        placeholder="Search Payment Providers"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="card-body pt-0">
                            <div className="table-responsive">
                                <table className="table align-middle table-row-dashed fs-6 gy-5">
                                    <thead>
                                        <tr className="text-start text-gray-400 fw-bold fs-7 text-uppercase gs-0">
                                            <th className="w-10px pe-2">
                                                <div className="form-check form-check-sm form-check-custom form-check-solid me-3">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        checked={selectedIds.length === paymentGateways.length && paymentGateways.length > 0}
                                                        onChange={handleSelectAll}
                                                    />
                                                </div>
                                            </th>
                                            <th>Name</th>
                                            <th>Title</th>
                                            <th>Mode</th>
                                            <th>Alias</th>
                                            <th>Status</th>
                                            <th>Created At</th>
                                            <th className="text-end min-w-100px">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="fw-semibold text-gray-600">
                                        {loading ? (
                                            <tr>
                                                <td colSpan="8" className="text-center py-5">
                                                    <div className="spinner-border text-primary" role="status">
                                                        <span className="visually-hidden">Loading...</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : paymentGateways.length === 0 ? (
                                            <tr>
                                                <td colSpan="8" className="text-center py-5">
                                                    No payment gateways found
                                                </td>
                                            </tr>
                                        ) : (
                                            paymentGateways.map(gateway => (
                                                <PaymentGatewayTableRow
                                                    key={gateway.id}
                                                    paymentGateway={gateway}
                                                    isSelected={selectedIds.includes(gateway.id)}
                                                    onSelect={handleSelectOne}
                                                    onRefresh={fetchPaymentGateways}
                                                />
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {!loading && pagination.last_page > 1 && (
                                <div className="row">
                                    <div className="col-sm-12 col-md-5 d-flex align-items-center justify-content-center justify-content-md-start">
                                        <div className="dataTables_length">
                                            Showing page {pagination.current_page} of {pagination.last_page} ({pagination.total} total)
                                        </div>
                                    </div>
                                    <div className="col-sm-12 col-md-7 d-flex align-items-center justify-content-center justify-content-md-end">
                                        <div className="dataTables_paginate paging_simple_numbers">
                                            <ul className="pagination">
                                                <li className={`paginate_button page-item previous ${pagination.current_page === 1 ? 'disabled' : ''}`}>
                                                    <button 
                                                        className="page-link" 
                                                        onClick={() => handlePageChange(pagination.current_page - 1)}
                                                        disabled={pagination.current_page === 1}
                                                    >
                                                        <i className="previous"></i>
                                                    </button>
                                                </li>
                                                {[...Array(pagination.last_page)].map((_, idx) => (
                                                    <li key={idx + 1} className={`paginate_button page-item ${pagination.current_page === idx + 1 ? 'active' : ''}`}>
                                                        <button 
                                                            className="page-link" 
                                                            onClick={() => handlePageChange(idx + 1)}
                                                        >
                                                            {idx + 1}
                                                        </button>
                                                    </li>
                                                ))}
                                                <li className={`paginate_button page-item next ${pagination.current_page === pagination.last_page ? 'disabled' : ''}`}>
                                                    <button 
                                                        className="page-link" 
                                                        onClick={() => handlePageChange(pagination.current_page + 1)}
                                                        disabled={pagination.current_page === pagination.last_page}
                                                    >
                                                        <i className="next"></i>
                                                    </button>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default AdminPaymentGatewaysIndex;

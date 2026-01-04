import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useToolbar } from '../../../../contexts/ToolbarContext';
import { useCan } from '../../../../utils/permissions';
import { getRolesData, bulkDeleteRoles } from '../../../../services/adminRolesService';
import RoleTableRow from './RoleTableRow';
import BulkActionBar from '../../../common/BulkActionBar';

const AdminRolesIndex = () => {
    const { setTitle, setActions } = useToolbar();
    const canCreateRole = useCan('pos.roles.create_roles');
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [pagination, setPagination] = useState({
        current_page: 1,
        per_page: 15,
        total: 0,
        last_page: 1
    });

    useEffect(() => {
        setTitle('Roles Management');
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

                {canCreateRole && (
                    <Link to="/admin/system/roles/create" className="btn btn-sm fw-bold btn-primary">
                        <i className="ki-duotone ki-plus fs-3">
                            <span className="path1"></span>
                            <span className="path2"></span>
                        </i>
                        <span className="d-none d-md-inline ms-1">Add Role</span>
                    </Link>
                )}
            </div>
        );
        return () => setActions(null);
    }, [setTitle, setActions, showFilters]);

    useEffect(() => {
        fetchRoles();
    }, [pagination.current_page]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (pagination.current_page === 1) {
                fetchRoles();
            } else {
                setPagination(prev => ({ ...prev, current_page: 1 }));
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const fetchRoles = async () => {
        setLoading(true);
        try {
            const params = {
                page: pagination.current_page,
                per_page: pagination.per_page,
                search: searchTerm,
            };

            const response = await getRolesData(params);

            if (response.success) {
                setRoles(response.data.data || []);
                if (response.data.recordsTotal) {
                    setPagination(prev => ({
                        ...prev,
                        total: response.data.recordsTotal,
                        last_page: Math.ceil(response.data.recordsTotal / prev.per_page)
                    }));
                }
            } else {
                toast.error(response.error || 'Failed to fetch roles');
            }
        } catch (error) {
            console.error('Error fetching roles:', error);
            toast.error('Failed to fetch roles');
        } finally {
            setLoading(false);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) {
            toast.warning('Please select roles to delete');
            return;
        }

        if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} role(s)?`)) {
            return;
        }

        try {
            const response = await bulkDeleteRoles(selectedIds);
            if (response.success) {
                toast.success('Roles deleted successfully');
                setSelectedIds([]);
                fetchRoles();
            } else {
                toast.error(response.error || 'Failed to delete roles');
            }
        } catch (error) {
            console.error('Error deleting roles:', error);
            toast.error('Failed to delete roles');
        }
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(roles.map(role => role.id));
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

    return (
        <>
            {/* Filter Panel */}
            {showFilters && (
                <div className="row g-5 g-xl-8 mb-4">
                    <div className="col-12">
                        <div className="card mb-5">
                            <div className="card-body">
                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <label className="form-label">Search</label>
                                        <input 
                                            type="text" 
                                            className="form-control form-control-sm"
                                            value={searchTerm}
                                            placeholder="Search roles..."
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="d-flex justify-content-end mt-4">
                                    <button onClick={() => setSearchTerm('')} className="btn btn-sm btn-light-primary">
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

            {selectedIds.length > 0 && (
                <div className="row g-5 g-xl-8 mb-4">
                    <div className="col-12">
                        <BulkActionBar
                            selectedCount={selectedIds.length}
                            onDelete={handleBulkDelete}
                            onCancel={() => setSelectedIds([])}
                        />
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
                                    placeholder="Search Roles"
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
                                                    checked={selectedIds.length === roles.length && roles.length > 0}
                                                    onChange={handleSelectAll}
                                                />
                                            </div>
                                        </th>
                                        <th>Role Name</th>
                                        <th>Permissions Count</th>
                                        <th>Created At</th>
                                        <th className="text-end min-w-100px">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="fw-semibold text-gray-600">
                                    {loading ? (
                                        <tr>
                                            <td colSpan="5" className="text-center py-5">
                                                <div className="spinner-border text-primary" role="status">
                                                    <span className="visually-hidden">Loading...</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : roles.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="text-center py-5">
                                                No roles found
                                            </td>
                                        </tr>
                                    ) : (
                                        roles.map(role => (
                                            <RoleTableRow
                                                key={role.id}
                                                role={role}
                                                isSelected={selectedIds.includes(role.id)}
                                                onSelect={handleSelectOne}
                                                onRefresh={fetchRoles}
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
                                        Showing page {pagination.current_page} of {pagination.last_page}
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

export default AdminRolesIndex;


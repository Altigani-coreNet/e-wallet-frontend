import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useToolbar } from '../../../../contexts/ToolbarContext';
import { useCan } from '../../../../utils/permissions';
import { getAdminsData, bulkDeleteAdmins } from '../../../../services/adminAdminsService';
import AdminTableRow from './AdminTableRow';
import AdminFiltersPanel from './AdminFiltersPanel';
import BulkActionBar from '../../../common/BulkActionBar';

const AdminAdminsIndex = () => {
    const { setTitle, setActions } = useToolbar();
    const canCreateAdmin = useCan('pos.admins.create_admins');
    const [admins, setAdmins] = useState([]);
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
    const [filters, setFilters] = useState({
        status: '',
        merchant_id: '',
        country_id: '',
        from_date: '',
        to_date: ''
    });

    useEffect(() => {
        setTitle('Admin Management');
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

                {canCreateAdmin && (
                    <Link to="/admin/system/admins/create" className="btn btn-sm fw-bold btn-primary">
                        <i className="ki-duotone ki-plus fs-3">
                            <span className="path1"></span>
                            <span className="path2"></span>
                        </i>
                        <span className="d-none d-md-inline ms-1">Add Admin</span>
                    </Link>
                )}
            </div>
        );
        return () => setActions(null);
    }, [setTitle, setActions, showFilters]);

    useEffect(() => {
        fetchAdmins();
    }, [pagination.current_page]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (pagination.current_page === 1) {
                fetchAdmins();
            } else {
                setPagination(prev => ({ ...prev, current_page: 1 }));
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm, filters]);

    const fetchAdmins = async () => {
        setLoading(true);
        try {
            const params = {
                page: pagination.current_page,
                per_page: pagination.per_page,
                search: searchTerm,
                ...filters
            };

            const response = await getAdminsData(params);

            if (response.success) {
                const { admins: rows, meta } = response.data;

                setAdmins(rows || []);
                setPagination(prev => ({
                    ...prev,
                    current_page: meta?.current_page || prev.current_page,
                    per_page: meta?.per_page || prev.per_page,
                    total: meta?.total || (rows ? rows.length : 0),
                    last_page: meta?.last_page || 1
                }));
            } else {
                toast.error(response.error || 'Failed to fetch admins');
            }
        } catch (error) {
            console.error('Error fetching admins:', error);
            toast.error('Failed to fetch admins');
        } finally {
            setLoading(false);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return toast.warning('Please select admins to delete');
        if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} admin(s)?`)) return;

        try {
            const response = await bulkDeleteAdmins(selectedIds);
            if (response.success) {
                toast.success('Admins deleted successfully');
                setSelectedIds([]);
                fetchAdmins();
            } else {
                toast.error(response.error || 'Failed to delete admins');
            }
        } catch (error) {
            toast.error('Failed to delete admins');
        }
    };

    const handleSelectAll = (e) => {
        setSelectedIds(e.target.checked ? admins.map(a => a.id) : []);
    };

    const handleSelectOne = (id) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const handlePageChange = (newPage) => {
        setPagination(prev => ({ ...prev, current_page: newPage }));
    };

    const renderSkeletonRows = () => (
        [...Array(8)].map((_, idx) => (
            <tr key={idx}>
                <td>
                    <div className="form-check form-check-sm form-check-custom form-check-solid">
                        <div className="skeleton w-16px h-16px bg-light rounded" />
                    </div>
                </td>
                <td>
                    <div className="d-flex align-items-center">
                        <div className="symbol symbol-35px me-3">
                            <div className="skeleton w-35px h-35px bg-light rounded-circle" />
                        </div>
                        <div>
                            <div className="skeleton w-140px h-16px bg-light rounded mb-2" />
                            <div className="skeleton w-90px h-12px bg-light rounded" />
                        </div>
                    </div>
                </td>
                <td><div className="skeleton w-180px h-16px bg-light rounded" /></td>
                <td><div className="skeleton w-120px h-16px bg-light rounded" /></td>
                <td>
                    <div className="d-flex gap-1">
                        <div className="skeleton w-50px h-22px bg-light rounded-pill" />
                        <div className="skeleton w-55px h-22px bg-light rounded-pill" />
                    </div>
                </td>
                <td><div className="skeleton w-60px h-22px bg-light rounded-pill" /></td>
                <td>
                    <div className="d-flex gap-1">
                        <div className="skeleton w-70px h-22px bg-light rounded-pill" />
                        <div className="skeleton w-45px h-22px bg-light rounded-pill" />
                    </div>
                </td>
                <td><div className="skeleton w-95px h-22px bg-light rounded-pill" /></td>
                <td><div className="skeleton w-110px h-16px bg-light rounded" /></td>
                <td className="text-end">
                    <div className="d-inline-block skeleton w-78px h-32px bg-light rounded" />
                </td>
            </tr>
        ))
    );

    return (
        <>
                
                {showFilters && (
                    <AdminFiltersPanel
                        filters={filters}
                        searchTerm={searchTerm}
                        onSearchChange={setSearchTerm}
                        onFiltersChange={setFilters}
                        onReset={() => {
                            setSearchTerm('');
                            setFilters({ status: '', merchant_id: '', country_id: '', from_date: '', to_date: '' });
                        }}
                    />
                )}

                {selectedIds.length > 0 && (
                    <BulkActionBar
                        selectedCount={selectedIds.length}
                        onDelete={handleBulkDelete}
                        onCancel={() => setSelectedIds([])}
                    />
                )}

                <div className="card">
                    <div className="card-header border-0 pt-6">
                        <div className="card-title">
                            {loading ? (
                                <div className="d-flex align-items-center my-1">
                                    <div className="skeleton w-250px h-40px bg-light rounded" />
                                </div>
                            ) : (
                                <div className="d-flex align-items-center position-relative my-1">
                                    <i className="ki-duotone ki-magnifier fs-3 position-absolute ms-5">
                                        <span className="path1"></span>
                                        <span className="path2"></span>
                                    </i>
                                    <input
                                        type="text"
                                        className="form-control form-control-solid w-250px ps-13"
                                        placeholder="Search Admins"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="card-body pt-0">
                        <div className="table-responsive">
                            <table className="table align-middle table-row-dashed fs-6 gy-5">
                                <thead>
                                    <tr className="text-start text-gray-400 fw-bold fs-7 text-uppercase gs-0">
                                        <th className="w-10px pe-2">
                                            <div className="form-check form-check-sm form-check-custom form-check-solid me-3">
                                                <input className="form-check-input" type="checkbox"
                                                    checked={selectedIds.length === admins.length && admins.length > 0}
                                                    onChange={handleSelectAll} />
                                            </div>
                                        </th>
                                        <th>Admin</th>
                                        <th>Email</th>
                                        <th>Phone</th>
                                        <th>Roles</th>
                                        <th>Custom Region</th>
                                        <th>Regions</th>
                                        <th>Status</th>
                                        <th>Created At</th>
                                        <th className="text-end min-w-100px">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="fw-semibold text-gray-600">
                                    {loading ? (
                                        renderSkeletonRows()
                                    ) : admins.length === 0 ? (
                                        <tr><td colSpan="10" className="text-center py-5">No admins found</td></tr>
                                    ) : (
                                        admins.map(admin => (
                                            <AdminTableRow key={admin.id} admin={admin}
                                                isSelected={selectedIds.includes(admin.id)}
                                                onSelect={handleSelectOne} onRefresh={fetchAdmins} />
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {!loading && pagination.last_page > 1 && (
                            <div className="row">
                                <div className="col-sm-12 col-md-5 d-flex align-items-center justify-content-center justify-content-md-start">
                                    <div className="dataTables_length">Showing page {pagination.current_page} of {pagination.last_page}</div>
                                </div>
                                <div className="col-sm-12 col-md-7 d-flex align-items-center justify-content-center justify-content-md-end">
                                    <div className="dataTables_paginate paging_simple_numbers">
                                        <ul className="pagination">
                                            <li className={`paginate_button page-item previous ${pagination.current_page === 1 ? 'disabled' : ''}`}>
                                                <button className="page-link" onClick={() => handlePageChange(pagination.current_page - 1)}
                                                    disabled={pagination.current_page === 1}><i className="previous"></i></button>
                                            </li>
                                            {[...Array(pagination.last_page)].map((_, idx) => (
                                                <li key={idx + 1} className={`paginate_button page-item ${pagination.current_page === idx + 1 ? 'active' : ''}`}>
                                                    <button className="page-link" onClick={() => handlePageChange(idx + 1)}>{idx + 1}</button>
                                                </li>
                                            ))}
                                            <li className={`paginate_button page-item next ${pagination.current_page === pagination.last_page ? 'disabled' : ''}`}>
                                                <button className="page-link" onClick={() => handlePageChange(pagination.current_page + 1)}
                                                    disabled={pagination.current_page === pagination.last_page}><i className="next"></i></button>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
        </>
    );
};

export default AdminAdminsIndex;

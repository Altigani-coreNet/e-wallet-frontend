import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import { ADMIN_ENDPOINTS } from '../../utils/constants';
import { getToken } from '../../utils/api';
import { useToolbar } from '../../contexts/ToolbarContext';
import BulkActionBar from '../../common/BulkActionBar';

const ServiceTypesPage = () => {
    const { setTitle, setActions } = useToolbar();
    const [types, setTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState([]);
    const [searchInput, setSearchInput] = useState('');
    const [pagination, setPagination] = useState({
        current_page: 1,
        per_page: 15,
        total: 0,
        last_page: 1,
    });
    const [appliedSearch, setAppliedSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentType, setCurrentType] = useState(null);
    const [formData, setFormData] = useState({
        name_en: '',
        name_ar: '',
        code: '',
        description: '',
        is_active: true,
    });

    useEffect(() => {
        setTitle('Type Management');
        setActions(
            <button type="button" className="btn btn-sm fw-bold btn-primary" onClick={openCreateModal}>
                <i className="ki-duotone ki-plus fs-3">
                    <span className="path1"></span>
                    <span className="path2"></span>
                </i>
                <span className="d-none d-md-inline ms-1">Add Type</span>
            </button>
        );
        return () => setActions(null);
    }, [setTitle, setActions]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setAppliedSearch(searchInput);
            setPagination((prev) => ({ ...prev, current_page: 1 }));
        }, 400);
        return () => clearTimeout(timer);
    }, [searchInput]);

    useEffect(() => {
        fetchTypes();
    }, [pagination.current_page, pagination.per_page, appliedSearch]);

    const fetchTypes = async () => {
        setLoading(true);
        try {
            const token = getToken();
            const params = {
                page: pagination.current_page,
                per_page: pagination.per_page,
            };
            if (appliedSearch) params.search = appliedSearch;

            const response = await axios.get(ADMIN_ENDPOINTS.SERVICE_TYPES, {
                params,
                headers: { Authorization: `Bearer ${token}` },
            });

            setTypes(response?.data?.data || []);
            const meta = response?.data?.meta || {};
            setPagination({
                current_page: meta.current_page || 1,
                per_page: meta.per_page || 15,
                total: meta.total || 0,
                last_page: meta.last_page || 1,
            });
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to fetch service types');
        } finally {
            setLoading(false);
        }
    };

    const openCreateModal = () => {
        setIsEditing(false);
        setCurrentType(null);
        setFormData({ name_en: '', name_ar: '', code: '', description: '', is_active: true });
        setShowModal(true);
    };

    const openEditModal = (item) => {
        setIsEditing(true);
        setCurrentType(item);
        setFormData({
            name_en: item.name_en || '',
            name_ar: item.name_ar || '',
            code: item.code || '',
            description: item.description || '',
            is_active: !!item.is_active,
        });
        setShowModal(true);
    };

    const submitForm = async (e) => {
        e.preventDefault();
        try {
            const token = getToken();
            const payload = {
                name_en: formData.name_en,
                name_ar: formData.name_ar,
                code: formData.code || null,
                description: formData.description || null,
                is_active: formData.is_active,
            };

            if (isEditing) {
                await axios.put(ADMIN_ENDPOINTS.SERVICE_TYPE_DETAILS(currentType.id), payload, {
                    headers: { Authorization: `Bearer ${token}` },
                });
            } else {
                await axios.post(ADMIN_ENDPOINTS.SERVICE_TYPES, payload, {
                    headers: { Authorization: `Bearer ${token}` },
                });
            }

            toast.success(isEditing ? 'Type updated successfully' : 'Type created successfully');
            setShowModal(false);
            fetchTypes();
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to save type');
        }
    };

    const deleteType = async (item) => {
        const result = await Swal.fire({
            title: 'Delete Type?',
            text: `Delete "${item.name_en || item.code}"?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete',
            cancelButtonText: 'Cancel',
        });
        if (!result.isConfirmed) return;

        try {
            const token = getToken();
            await axios.delete(ADMIN_ENDPOINTS.SERVICE_TYPE_DETAILS(item.id), {
                headers: { Authorization: `Bearer ${token}` },
            });
            toast.success('Type deleted successfully');
            fetchTypes();
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to delete type');
        }
    };

    const toggleStatus = async (item) => {
        try {
            const token = getToken();
            await axios.patch(ADMIN_ENDPOINTS.SERVICE_TYPE_TOGGLE_STATUS(item.id), {}, {
                headers: { Authorization: `Bearer ${token}` },
            });
            toast.success('Status updated successfully');
            fetchTypes();
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to toggle status');
        }
    };

    const handleSelectAll = (e) => {
        setSelectedIds(e.target.checked ? types.map((item) => item.id) : []);
    };

    const bulkDelete = async () => {
        if (!selectedIds.length) return;
        try {
            const token = getToken();
            await axios.post(ADMIN_ENDPOINTS.SERVICE_TYPE_BULK_DELETE, { ids: selectedIds }, {
                headers: { Authorization: `Bearer ${token}` },
            });
            toast.success('Types deleted successfully');
            setSelectedIds([]);
            fetchTypes();
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to delete selected types');
        }
    };

    return (
        <>
            {selectedIds.length > 0 && (
                <div className="card mb-5">
                    <div className="card-body">
                        <BulkActionBar selectedCount={selectedIds.length} onDelete={bulkDelete} onClear={() => setSelectedIds([])} />
                    </div>
                </div>
            )}

            <div className="card">
                <div className="card-header border-0 pt-6">
                    <div className="card-title">
                        <input
                            type="text"
                            className="form-control form-control-solid w-250px"
                            placeholder="Search types..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                        />
                    </div>
                </div>
                <div className="card-body py-4">
                    <div className="table-responsive">
                        <table className="table align-middle table-row-dashed fs-6 gy-5">
                            <thead>
                                <tr className="text-start text-muted fw-bold fs-7 text-uppercase gs-0">
                                    <th className="w-10px pe-2">
                                        <input type="checkbox" className="form-check-input" checked={types.length > 0 && selectedIds.length === types.length} onChange={handleSelectAll} />
                                    </th>
                                    <th>Name</th>
                                    <th>Code</th>
                                    <th>Status</th>
                                    <th>Services Count</th>
                                    <th className="text-end">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {!loading && types.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="text-center py-8">No types found</td>
                                    </tr>
                                )}
                                {types.map((item) => (
                                    <tr key={item.id}>
                                        <td>
                                            <input
                                                type="checkbox"
                                                className="form-check-input"
                                                checked={selectedIds.includes(item.id)}
                                                onChange={(e) => {
                                                    setSelectedIds((prev) => e.target.checked ? [...prev, item.id] : prev.filter((id) => id !== item.id));
                                                }}
                                            />
                                        </td>
                                        <td>{item.name_en || 'N/A'}</td>
                                        <td>{item.code || 'N/A'}</td>
                                        <td>
                                            <button className={`badge badge-light-${item.is_active ? 'success' : 'danger'} border-0`} onClick={() => toggleStatus(item)}>
                                                {item.is_active ? 'Active' : 'Inactive'}
                                            </button>
                                        </td>
                                        <td>
                                            <span className="badge badge-light-info">{item.services_count ?? 0}</span>
                                        </td>
                                        <td className="text-end">
                                            <button className="btn btn-icon btn-bg-light btn-active-color-primary btn-sm me-2" onClick={() => openEditModal(item)}>
                                                <i className="ki-duotone ki-pencil fs-2"><span className="path1"></span><span className="path2"></span></i>
                                            </button>
                                            <button className="btn btn-icon btn-bg-light btn-active-color-danger btn-sm" onClick={() => deleteType(item)}>
                                                <i className="ki-duotone ki-trash fs-2"><span className="path1"></span><span className="path2"></span><span className="path3"></span></i>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {showModal && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">{isEditing ? 'Edit Type' : 'Create Type'}</h5>
                                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                            </div>
                            <form onSubmit={submitForm}>
                                <div className="modal-body">
                                    <div className="mb-5">
                                        <label className="form-label required">Name (English)</label>
                                        <input className="form-control" value={formData.name_en} onChange={(e) => setFormData({ ...formData, name_en: e.target.value })} required />
                                    </div>
                                    <div className="mb-5">
                                        <label className="form-label required">Name (Arabic)</label>
                                        <input className="form-control" value={formData.name_ar} onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })} required />
                                    </div>
                                    <div className="mb-5">
                                        <label className="form-label">Code</label>
                                        <input className="form-control" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} placeholder="Optional" />
                                    </div>
                                    <div className="mb-5">
                                        <label className="form-label">Description</label>
                                        <textarea className="form-control" rows="3" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}></textarea>
                                    </div>
                                    <div className="form-check form-switch">
                                        <input type="checkbox" className="form-check-input" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} />
                                        <label className="form-check-label">Active</label>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-light" onClick={() => setShowModal(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary">{isEditing ? 'Update' : 'Create'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ServiceTypesPage;

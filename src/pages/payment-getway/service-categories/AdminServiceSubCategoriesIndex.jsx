import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import { useToolbar } from '../../../contexts/ToolbarContext';
import { ADMIN_ENDPOINTS } from '../../../utils/constants';
import { getToken } from '../../../utils/api';
import BulkActionBar from '../../../common/BulkActionBar';

const AdminServiceSubCategoriesIndex = () => {
    const { t } = useTranslation();
    const { setTitle, setActions } = useToolbar();
    const [rows, setRows] = useState([]);
    const [parentCategories, setParentCategories] = useState([]);
    const [selectedIds, setSelectedIds] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [pagination, setPagination] = useState({ current_page: 1, per_page: 15, total: 0, last_page: 1 });

    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentRow, setCurrentRow] = useState(null);
    const [formData, setFormData] = useState({
        category_id: '',
        name_en: '',
        name_ar: '',
        description: '',
        is_active: true,
    });

    useEffect(() => {
        setTitle(t('admin.paymentGetway.titlesSubCategoriesManagement'));
        setActions(
            <button type="button" className="btn btn-sm btn-primary" onClick={openCreateModal}>
                <i className="ki-duotone ki-plus fs-3"><span className="path1"></span><span className="path2"></span></i>
                <span className="ms-1">{t('admin.paymentGetway.catAddSubCategory')}</span>
            </button>
        );
        return () => setActions(null);
    }, [setTitle, setActions, t]);

    useEffect(() => {
        fetchRows();
    }, [pagination.current_page, pagination.per_page, search]);

    useEffect(() => {
        fetchParentCategories();
    }, []);

    const fetchParentCategories = async () => {
        try {
            const token = getToken();
            const response = await axios.get(ADMIN_ENDPOINTS.SERVICE_CATEGORIES_ACTIVE, {
                params: { limit: 500, include_inactive: true, parents_only: true, type: 'service' },
                headers: { Authorization: `Bearer ${token}` },
            });
            setParentCategories(response?.data?.data || []);
        } catch (error) {
            setParentCategories([]);
        }
    };

    const fetchRows = async () => {
        setLoading(true);
        try {
            const token = getToken();
            const response = await axios.get(ADMIN_ENDPOINTS.SERVICE_SUB_CATEGORIES, {
                params: {
                    page: pagination.current_page,
                    per_page: pagination.per_page,
                    search: search || undefined,
                },
                headers: { Authorization: `Bearer ${token}` },
            });
            setRows(response?.data?.data || []);
            const meta = response?.data?.meta || {};
            setPagination((prev) => ({
                ...prev,
                current_page: meta.current_page || 1,
                per_page: meta.per_page || prev.per_page,
                total: meta.total || 0,
                last_page: meta.last_page || 1,
            }));
        } catch (error) {
            toast.error(error?.response?.data?.message || t('admin.paymentGetway.subCatFailedLoad'));
        } finally {
            setLoading(false);
        }
    };

    const openCreateModal = () => {
        setIsEditing(false);
        setCurrentRow(null);
        setFormData({ category_id: '', name_en: '', name_ar: '', description: '', is_active: true });
        setShowModal(true);
    };

    const openEditModal = (item) => {
        setIsEditing(true);
        setCurrentRow(item);
        setFormData({
            category_id: item.category_id || '',
            name_en: item.name_en || '',
            name_ar: item.name_ar || '',
            description: item.description || '',
            is_active: !!item.is_active,
        });
        setShowModal(true);
    };

    const submitForm = async (e) => {
        e.preventDefault();
        try {
            const token = getToken();
            if (isEditing) {
                await axios.put(ADMIN_ENDPOINTS.SERVICE_SUB_CATEGORY_DETAILS(currentRow.id), formData, {
                    headers: { Authorization: `Bearer ${token}` },
                });
            } else {
                await axios.post(ADMIN_ENDPOINTS.SERVICE_SUB_CATEGORIES, formData, {
                    headers: { Authorization: `Bearer ${token}` },
                });
            }
            toast.success(isEditing ? t('admin.paymentGetway.subCatUpdated') : t('admin.paymentGetway.subCatCreated'));
            setShowModal(false);
            fetchRows();
        } catch (error) {
            toast.error(error?.response?.data?.message || t('admin.paymentGetway.subCatSaveFailed'));
        }
    };

    const toggleStatus = async (item) => {
        try {
            const token = getToken();
            await axios.patch(ADMIN_ENDPOINTS.SERVICE_SUB_CATEGORY_TOGGLE_STATUS(item.id), {}, {
                headers: { Authorization: `Bearer ${token}` },
            });
            fetchRows();
        } catch (error) {
            toast.error(error?.response?.data?.message || t('admin.paymentGetway.subCatStatusFailed'));
        }
    };

    const deleteOne = async (item) => {
        const result = await Swal.fire({
            title: t('admin.paymentGetway.subCatDeleteTitle'),
            text: t('admin.paymentGetway.subCatDeleteText', { name: item.name_en || item.code }),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: t('admin.paymentGetway.catYesDelete'),
            cancelButtonText: t('admin.common.cancel'),
        });
        if (!result.isConfirmed) return;
        try {
            const token = getToken();
            await axios.delete(ADMIN_ENDPOINTS.SERVICE_SUB_CATEGORY_DETAILS(item.id), {
                headers: { Authorization: `Bearer ${token}` },
            });
            fetchRows();
        } catch (error) {
            toast.error(error?.response?.data?.message || t('admin.paymentGetway.subCatDeleteFailed'));
        }
    };

    const bulkDelete = async () => {
        if (!selectedIds.length) return;
        try {
            const token = getToken();
            await axios.post(ADMIN_ENDPOINTS.SERVICE_SUB_CATEGORY_BULK_DELETE, { ids: selectedIds }, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setSelectedIds([]);
            fetchRows();
        } catch (error) {
            toast.error(error?.response?.data?.message || t('admin.paymentGetway.subCatBulkDeleteFailed'));
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
                            placeholder={t('admin.paymentGetway.subCatSearchPlaceholder')}
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPagination((prev) => ({ ...prev, current_page: 1 }));
                            }}
                        />
                    </div>
                </div>
                <div className="card-body py-4">
                    <div className="table-responsive">
                        <table className="table align-middle table-row-dashed fs-6 gy-5">
                            <thead>
                                <tr className="text-start text-muted fw-bold fs-7 text-uppercase gs-0">
                                    <th className="w-10px pe-2">
                                        <input
                                            type="checkbox"
                                            className="form-check-input"
                                            checked={rows.length > 0 && selectedIds.length === rows.length}
                                            onChange={(e) => setSelectedIds(e.target.checked ? rows.map((r) => r.id) : [])}
                                        />
                                    </th>
                                    <th>{t('admin.paymentGetway.subCatColSubCategory')}</th>
                                    <th>{t('admin.paymentGetway.subCatColParent')}</th>
                                    <th>{t('admin.paymentGetway.status')}</th>
                                    <th>{t('admin.paymentGetway.catColServicesCount')}</th>
                                    <th className="text-end">{t('admin.common.actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {!loading && rows.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="text-center py-10">{t('admin.paymentGetway.subCatNoRows')}</td>
                                    </tr>
                                )}
                                {rows.map((item) => (
                                    <tr key={item.id}>
                                        <td>
                                            <input
                                                type="checkbox"
                                                className="form-check-input"
                                                checked={selectedIds.includes(item.id)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedIds((prev) => [...prev, item.id]);
                                                    } else {
                                                        setSelectedIds((prev) => prev.filter((id) => id !== item.id));
                                                    }
                                                }}
                                            />
                                        </td>
                                        <td>{item.name_en || t('admin.paymentGetway.na')}</td>
                                        <td>{item.category?.name_en || t('admin.paymentGetway.na')}</td>
                                        <td>
                                            <button className={`badge badge-light-${item.is_active ? 'success' : 'danger'} border-0`} onClick={() => toggleStatus(item)}>
                                                {item.is_active ? t('admin.common.active') : t('admin.common.inactive')}
                                            </button>
                                        </td>
                                        <td><span className="badge badge-light-info">{item.services_count ?? 0}</span></td>
                                        <td className="text-end">
                                            <button className="btn btn-icon btn-bg-light btn-active-color-primary btn-sm me-2" onClick={() => openEditModal(item)}>
                                                <i className="ki-duotone ki-pencil fs-2"><span className="path1"></span><span className="path2"></span></i>
                                            </button>
                                            <button className="btn btn-icon btn-bg-light btn-active-color-danger btn-sm" onClick={() => deleteOne(item)}>
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
                                <h5 className="modal-title">{isEditing ? t('admin.paymentGetway.catEditSubCategory') : t('admin.paymentGetway.catCreateSubCategory')}</h5>
                                <button className="btn-close" onClick={() => setShowModal(false)}></button>
                            </div>
                            <form onSubmit={submitForm}>
                                <div className="modal-body">
                                    <div className="mb-5">
                                        <label className="form-label required">{t('admin.paymentGetway.catLabelParentCategory')}</label>
                                        <select
                                            className="form-select"
                                            value={formData.category_id}
                                            onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                                            required
                                        >
                                            <option value="">{t('admin.paymentGetway.catSelectParent')}</option>
                                            {parentCategories.map((cat) => (
                                                <option key={cat.id} value={cat.id}>{cat.name_en || cat.name || cat.code}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="mb-5">
                                        <label className="form-label required">{t('admin.paymentGetway.subCatLabelNameEn')}</label>
                                        <input className="form-control" value={formData.name_en} onChange={(e) => setFormData({ ...formData, name_en: e.target.value })} required />
                                    </div>
                                    <div className="mb-5">
                                        <label className="form-label required">{t('admin.paymentGetway.subCatLabelNameAr')}</label>
                                        <input className="form-control" value={formData.name_ar} onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })} required />
                                    </div>
                                    <div className="mb-5">
                                        <label className="form-label">{t('admin.paymentGetway.catLabelDescription')}</label>
                                        <textarea className="form-control" rows="3" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}></textarea>
                                    </div>
                                    <div className="form-check form-switch">
                                        <input className="form-check-input" type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} />
                                        <label className="form-check-label">{t('admin.paymentGetway.catLabelActive')}</label>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-light" onClick={() => setShowModal(false)}>{t('admin.common.cancel')}</button>
                                    <button type="submit" className="btn btn-primary">{isEditing ? t('admin.paymentGetway.catUpdateBtn') : t('admin.paymentGetway.catCreateBtn')}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default AdminServiceSubCategoriesIndex;

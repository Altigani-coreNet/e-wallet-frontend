import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import { ADMIN_ENDPOINTS } from '../../../utils/constants';
import { getToken } from '../../../utils/api';
import { useToolbar } from '../../../contexts/ToolbarContext';
import ServiceCategoryTableRow from './ServiceCategoryTableRow';
import ServiceCategoryFiltersPanel from './ServiceCategoryFiltersPanel';
import BulkActionBar from '../../../common/BulkActionBar';

const AdminServiceCategoriesIndex = ({ fixedHierarchy = null, categoryType = 'service' }) => {
    const { t } = useTranslation();
    const { setTitle, setActions } = useToolbar();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);
    const [searchInput, setSearchInput] = useState('');
    const [pagination, setPagination] = useState({
        current_page: 1,
        per_page: 15,
        total: 0,
        last_page: 1
    });
    const [filters, setFilters] = useState({
        search: '',
        is_active: null
    });
    const [activeHierarchy, setActiveHierarchy] = useState(fixedHierarchy || 'parents');
    const [appliedFilters, setAppliedFilters] = useState({
        search: '',
        is_active: null
    });

    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentCategory, setCurrentCategory] = useState(null);
    const [parentCategories, setParentCategories] = useState([]);
    const [formData, setFormData] = useState({
        name_en: '',
        name_ar: '',
        parent_id: '',
        description: '',
        is_active: true,
        image: null,
        image_preview: ''
    });
    const [formErrors, setFormErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [togglingStatusId, setTogglingStatusId] = useState(null);

    useEffect(() => {
        const pageTitle =
            fixedHierarchy === 'children'
                ? t('admin.paymentGetway.titlesSubCategoriesManagement')
                : categoryType === 'partner'
                    ? t('admin.paymentGetway.titlesPartnerCategories')
                    : t('admin.paymentGetway.titlesServiceCategories');
        setTitle(pageTitle);
        setActions(
            <div className="d-flex align-items-center gap-2 gap-lg-3">
                <button
                    type="button"
                    className="btn btn-sm btn-light"
                    onClick={() => setShowFilters(!showFilters)}
                >
                    <i className={`ki-duotone ki-filter fs-3 me-1 ${showFilters ? '' : 'rotate-90'}`}>
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    {showFilters ? t('admin.common.hideFilters') : t('admin.common.showFilters')}
                </button>
                <button
                    type="button"
                    className="btn btn-sm fw-bold btn-primary"
                    onClick={handleOpenCreateModal}
                >
                    <i className="ki-duotone ki-plus fs-3">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    <span className="d-none d-md-inline ms-1">{fixedHierarchy === 'children' ? t('admin.paymentGetway.catAddSubCategory') : t('admin.paymentGetway.catAddCategory')}</span>
                </button>
            </div>
        );
        return () => setActions(null);
    }, [setTitle, setActions, showFilters, fixedHierarchy, categoryType, t]);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchInput !== appliedFilters.search) {
                setAppliedFilters(prev => ({ ...prev, search: searchInput }));
                setPagination(prev => ({ ...prev, current_page: 1 }));
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchInput]);

    // Fetch categories
    useEffect(() => {
        fetchCategories();
    }, [pagination.current_page, pagination.per_page, appliedFilters, activeHierarchy, categoryType]);

    useEffect(() => {
        fetchParentCategories();
    }, [categoryType]);


    useEffect(() => {
        if (fixedHierarchy && fixedHierarchy !== activeHierarchy) {
            setActiveHierarchy(fixedHierarchy);
            setPagination((prev) => ({ ...prev, current_page: 1 }));
            setSelectedIds([]);
        }
    }, [fixedHierarchy, activeHierarchy]);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const token = getToken();
            const params = {
                page: pagination.current_page,
                per_page: pagination.per_page,
                hierarchy: activeHierarchy,
                type: categoryType,
            };
            
            if (appliedFilters.search) {
                params.search = appliedFilters.search;
            }
            if (appliedFilters.is_active !== null && appliedFilters.is_active !== undefined) {
                params.is_active = appliedFilters.is_active;
            }

            const response = await axios.get(ADMIN_ENDPOINTS.SERVICE_CATEGORIES, {
                params,
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const categories = response.data.data || [];
            const meta = response.data.meta || {};
            
            setCategories(categories);
            setPagination({
                current_page: meta.current_page || 1,
                per_page: meta.per_page || 15,
                total: meta.total || 0,
                last_page: meta.last_page || 1
            });
        } catch (error) {
            console.error('Error fetching categories:', error);
            toast.error(error.response?.data?.message || 'Failed to fetch categories');
        } finally {
            setLoading(false);
        }
    };

    const fetchParentCategories = async () => {
        try {
            const token = getToken();
            const response = await axios.get(ADMIN_ENDPOINTS.SERVICE_CATEGORIES_ACTIVE, {
                params: { limit: 500, parents_only: true, include_inactive: true, type: categoryType },
                headers: { 'Authorization': `Bearer ${token}` }
            });

            setParentCategories(response?.data?.data || []);
        } catch (error) {
            console.error('Error fetching parent categories:', error);
        }
    };


    const handleOpenCreateModal = () => {
        setFormData({
            name_en: '',
            name_ar: '',
            parent_id: '',
            description: '',
            is_active: true,
            image: null,
            image_preview: ''
        });
        setFormErrors({});
        setIsEditing(false);
        setCurrentCategory(null);
        setShowModal(true);
    };

    const handleOpenEditModal = (category) => {
        setFormData({
            name_en: category.name_en || category.name || '',
            name_ar: category.name_ar || category.name_en || category.name || '',
            parent_id: category.parent_id || '',
            description: category.description || '',
            is_active: category.is_active,
            image: null,
            image_preview: category.image_url || category.image || ''
        });
        setFormErrors({});
        setIsEditing(true);
        setCurrentCategory(category);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSubmitting(false);
        setFormData({
            name_en: '',
            name_ar: '',
            parent_id: '',
            description: '',
            is_active: true,
            image: null,
            image_preview: ''
        });
        setFormErrors({});
        setCurrentCategory(null);
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
        if (formErrors[name]) {
            setFormErrors({ ...formErrors, [name]: null });
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const preview = URL.createObjectURL(file);
        setFormData((prev) => ({
            ...prev,
            image: file,
            image_preview: preview
        }));
        if (formErrors.image) {
            setFormErrors({ ...formErrors, image: null });
        }
    };

    const getErrorMessage = (value) => (Array.isArray(value) ? value[0] : value);

    const validateForm = () => {
        const errors = {};
        if (!formData.name_en.trim()) {
            errors.name_en = 'Name is required';
        }
        if (!formData.name_ar.trim()) {
            errors.name_ar = 'Arabic name is required';
        }
        if (activeHierarchy === 'children' && !formData.parent_id) {
            errors.parent_id = 'Parent category is required for sub-category';
        }
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) return;
        if (submitting) return;

        setSubmitting(true);
        try {
            const token = getToken();
            const payload = new FormData();
            payload.append('type', categoryType);
            payload.append('name_en', formData.name_en);
            payload.append('name_ar', formData.name_ar);
            payload.append('parent_id', activeHierarchy === 'parents' ? '' : (formData.parent_id || ''));
            payload.append('description', formData.description || '');
            payload.append('is_active', formData.is_active ? '1' : '0');
            if (formData.image instanceof File) {
                payload.append('image', formData.image);
            }

            if (isEditing) {
                payload.append('_method', 'PUT');
                await axios.post(
                    ADMIN_ENDPOINTS.SERVICE_CATEGORY_DETAILS(currentCategory.id),
                    payload,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'multipart/form-data'
                        }
                    }
                );
                toast.success('Category updated successfully');
            } else {
                await axios.post(
                    ADMIN_ENDPOINTS.SERVICE_CATEGORIES,
                    payload,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'multipart/form-data'
                        }
                    }
                );
                toast.success('Category created successfully');
            }
            
            handleCloseModal();
            fetchCategories();
        } catch (error) {
            if (error.response?.data?.errors) {
                setFormErrors(error.response.data.errors);
            }
            toast.error(error.response?.data?.message || t('admin.paymentGetway.catSaveFailed'));
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (category) => {
        const confirmation = await Swal.fire({
            title: 'Delete Category?',
            text: `Are you sure you want to delete "${category.name_en || category.name}"?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete',
            cancelButtonText: 'Cancel',
            customClass: {
                confirmButton: 'btn btn-danger',
                cancelButton: 'btn btn-light'
            },
            buttonsStyling: false
        });

        if (!confirmation.isConfirmed) return;

        try {
            const token = getToken();
            await axios.delete(
                ADMIN_ENDPOINTS.SERVICE_CATEGORY_DETAILS(category.id),
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            toast.success('Category deleted successfully');
            fetchCategories();
        } catch (error) {
            toast.error(error.response?.data?.message || t('admin.paymentGetway.catDeleteFailed'));
        }
    };

    const handleToggleStatus = async (category) => {
        if (togglingStatusId) return;
        setTogglingStatusId(category.id);
        try {
            const token = getToken();
            await axios.patch(
                ADMIN_ENDPOINTS.SERVICE_CATEGORY_TOGGLE_STATUS(category.id),
                {},
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            toast.success(t('admin.paymentGetway.catStatusUpdated'));
            fetchCategories();
        } catch (error) {
            toast.error(error.response?.data?.message || t('admin.paymentGetway.catStatusFailed'));
        } finally {
            setTogglingStatusId(null);
        }
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(categories.map(cat => cat.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (id, checked) => {
        if (checked) {
            setSelectedIds([...selectedIds, id]);
        } else {
            setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;

        const confirmation = await Swal.fire({
            title: t('admin.paymentGetway.catBulkDeleteTitle'),
            text: t('admin.paymentGetway.catBulkDeleteText', { count: selectedIds.length }),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: t('admin.paymentGetway.catYesDelete'),
            cancelButtonText: t('admin.common.cancel'),
            customClass: {
                confirmButton: 'btn btn-danger',
                cancelButton: 'btn btn-light'
            },
            buttonsStyling: false
        });

        if (!confirmation.isConfirmed) return;

        try {
            const token = getToken();
            await axios.post(
                ADMIN_ENDPOINTS.SERVICE_CATEGORY_BULK_DELETE,
                { ids: selectedIds },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            toast.success(t('admin.paymentGetway.catBulkDeleted', { count: selectedIds.length }));
            setSelectedIds([]);
            fetchCategories();
        } catch (error) {
            toast.error(error.response?.data?.message || t('admin.paymentGetway.catBulkDeleteFailed'));
        }
    };

    const handleApplyFilters = () => {
        setAppliedFilters({ ...filters });
        setPagination(prev => ({ ...prev, current_page: 1 }));
    };

    const handleResetFilters = () => {
        const resetFilters = { search: '', is_active: null };
        setFilters(resetFilters);
        setAppliedFilters(resetFilters);
        setSearchInput('');
        setPagination(prev => ({ ...prev, current_page: 1 }));
    };

    const handlePageChange = (page) => {
        setPagination({ ...pagination, current_page: page });
    };

    const PlaceholderRows = () => (
        <>
            {[...Array(pagination.per_page)].map((_, index) => (
                <tr key={index}>
                    <td className="w-10px px-2 align-middle text-center">
                        <div className="d-flex justify-content-center align-items-center w-100 min-w-0">
                            <div className="placeholder-glow w-100"><span className="placeholder col-12"></span></div>
                        </div>
                    </td>
                    <td className="min-w-80px align-middle text-center">
                        <div className="d-flex justify-content-center align-items-center w-100 min-w-0">
                            <div className="placeholder-glow w-100"><span className="placeholder col-8"></span></div>
                        </div>
                    </td>
                    <td className="min-w-150px align-middle text-start">
                        <div className="d-flex justify-content-start align-items-center w-100 min-w-0">
                            <div className="placeholder-glow w-100"><span className="placeholder col-12"></span></div>
                        </div>
                    </td>
                    <td className="min-w-200px align-middle text-start">
                        <div className="d-flex justify-content-start align-items-center w-100 min-w-0">
                            <div className="placeholder-glow w-100"><span className="placeholder col-8"></span></div>
                        </div>
                    </td>
                    <td className="min-w-100px align-middle text-center">
                        <div className="d-flex justify-content-center align-items-center w-100 min-w-0">
                            <div className="placeholder-glow w-100"><span className="placeholder col-6"></span></div>
                        </div>
                    </td>
                    <td className="min-w-100px align-middle text-center">
                        <div className="d-flex justify-content-center align-items-center w-100 min-w-0">
                            <div className="placeholder-glow w-100"><span className="placeholder col-6"></span></div>
                        </div>
                    </td>
                    <td className="min-w-100px align-middle text-end">
                        <div className="d-flex justify-content-end align-items-center w-100 min-w-0">
                            <div className="placeholder-glow w-100"><span className="placeholder col-12"></span></div>
                        </div>
                    </td>
                </tr>
            ))}
        </>
    );

    return (
        <>
            {showFilters && (
                <ServiceCategoryFiltersPanel
                    filters={filters}
                    setFilters={setFilters}
                    onApply={handleApplyFilters}
                    onReset={handleResetFilters}
                />
            )}

            {selectedIds.length > 0 && (
                <div className="card mb-5">
                    <div className="card-body">
                        <BulkActionBar
                            selectedCount={selectedIds.length}
                            onDelete={handleBulkDelete}
                            onClear={() => setSelectedIds([])}
                        />
                    </div>
                </div>
            )}

            <div className="card">
                {!fixedHierarchy && <div className="card-header border-0 pt-6 pb-0">
                    <div className="d-flex gap-2">
                        <button
                            type="button"
                            className={`btn btn-sm ${activeHierarchy === 'parents' ? 'btn-primary' : 'btn-light-primary'}`}
                            onClick={() => {
                                setActiveHierarchy('parents');
                                setPagination((prev) => ({ ...prev, current_page: 1 }));
                                setSelectedIds([]);
                            }}
                        >
                            {t('admin.paymentGetway.catParentCategories')}
                        </button>
                        <button
                            type="button"
                            className={`btn btn-sm ${activeHierarchy === 'children' ? 'btn-primary' : 'btn-light-primary'}`}
                            onClick={() => {
                                setActiveHierarchy('children');
                                setPagination((prev) => ({ ...prev, current_page: 1 }));
                                setSelectedIds([]);
                            }}
                        >
                            {t('admin.paymentGetway.catSubCategories')}
                        </button>
                    </div>
                </div>}
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
                                placeholder={t('admin.paymentGetway.catSearchPlaceholder')}
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="card-toolbar">
                        <div className="d-flex justify-content-end align-items-center gap-2">
                            <label className="form-label mb-0 text-nowrap">{t('admin.paymentGetway.catShow')}</label>
                            <select 
                                className="form-select form-select-sm" 
                                value={pagination.per_page}
                                onChange={(e) => setPagination({ ...pagination, per_page: parseInt(e.target.value), current_page: 1 })}
                                style={{ width: '75px' }}
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

                <div className="card-body py-4">
                    <div className="table-responsive">
                        <table className="table align-middle table-row-dashed fs-6 gy-5">
                            <thead>
                                <tr className="text-muted fw-bold fs-7 text-uppercase gs-0">
                                    <th className="w-10px px-2 align-middle text-center">
                                        <div className="form-check form-check-sm form-check-custom form-check-solid d-flex justify-content-center mb-0">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                checked={categories.length > 0 && selectedIds.length === categories.length}
                                                onChange={handleSelectAll}
                                            />
                                        </div>
                                    </th>
                                    <th className="min-w-80px align-middle text-center">
                                        <div className="d-flex justify-content-center align-items-center w-100 min-w-0">
                                            <span className="text-center text-nowrap">{t('admin.paymentGetway.catColImage')}</span>
                                        </div>
                                    </th>
                                    <th className="min-w-150px align-middle text-start">
                                        <div className="d-flex justify-content-start align-items-center w-100 min-w-0">
                                            <span className="text-start text-nowrap w-100">{t('admin.paymentGetway.catColName')}</span>
                                        </div>
                                    </th>
                                    <th className="min-w-200px align-middle text-start">
                                        <div className="d-flex justify-content-start align-items-center w-100 min-w-0">
                                            <span className="text-start text-break w-100">{t('admin.paymentGetway.catColDescription')}</span>
                                        </div>
                                    </th>
                                    <th className="min-w-100px align-middle text-center">
                                        <div className="d-flex justify-content-center align-items-center w-100 min-w-0">
                                            <span className="text-center text-nowrap">{t('admin.paymentGetway.status')}</span>
                                        </div>
                                    </th>
                                    <th className="min-w-100px align-middle text-center">
                                        <div className="d-flex justify-content-center align-items-center w-100 min-w-0">
                                            <span className="text-center text-nowrap">{t('admin.paymentGetway.catColServicesCount')}</span>
                                        </div>
                                    </th>
                                    <th className="min-w-100px align-middle text-end">
                                        <div className="d-flex justify-content-end align-items-center w-100 min-w-0">
                                            <span className="text-end text-nowrap">{t('admin.common.actions')}</span>
                                        </div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="text-gray-600 fw-semibold">
                                {loading ? (
                                    <PlaceholderRows />
                                ) : categories.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="text-center py-10">
                                            <div className="text-gray-600 fs-5">{t('admin.paymentGetway.catNoCategoriesFound')}</div>
                                        </td>
                                    </tr>
                                ) : (
                                    categories.map((category) => (
                                        <ServiceCategoryTableRow
                                            key={category.id}
                                            category={category}
                                            isSelected={selectedIds.includes(category.id)}
                                            onSelect={handleSelectOne}
                                            onEdit={handleOpenEditModal}
                                            onDelete={handleDelete}
                                            onToggleStatus={handleToggleStatus}
                                            togglingStatusId={togglingStatusId}
                                        />
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {pagination.total > pagination.per_page && (
                        <div className="d-flex justify-content-between align-items-center flex-wrap pt-5">
                            <div className="fs-6 fw-semibold text-gray-700">
                                {t('admin.paymentGetway.catShowingEntries', {
                                    from: ((pagination.current_page - 1) * pagination.per_page) + 1,
                                    to: Math.min(pagination.current_page * pagination.per_page, pagination.total),
                                    total: pagination.total,
                                })}
                            </div>
                            <ul className="pagination">
                                <li className={`page-item previous ${pagination.current_page === 1 ? 'disabled' : ''}`}>
                                    <button
                                        className="page-link"
                                        onClick={() => handlePageChange(pagination.current_page - 1)}
                                        disabled={pagination.current_page === 1}
                                    >
                                        <i className="previous"></i>
                                    </button>
                                </li>
                                {[...Array(pagination.last_page)].map((_, index) => (
                                    <li key={index + 1} className={`page-item ${pagination.current_page === index + 1 ? 'active' : ''}`}>
                                        <button
                                            className="page-link"
                                            onClick={() => handlePageChange(index + 1)}
                                        >
                                            {index + 1}
                                        </button>
                                    </li>
                                ))}
                                <li className={`page-item next ${pagination.current_page === pagination.last_page ? 'disabled' : ''}`}>
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
                    )}
                </div>
            </div>

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    {isEditing
                                        ? (fixedHierarchy === 'children' ? t('admin.paymentGetway.catEditSubCategory') : t('admin.paymentGetway.catEditCategory'))
                                        : (fixedHierarchy === 'children' ? t('admin.paymentGetway.catCreateSubCategory') : t('admin.paymentGetway.catCreateCategory'))}
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={handleCloseModal}
                                    aria-label={t('admin.paymentGetway.catCloseAria')}
                                ></button>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="modal-body">
                                    <div className="mb-5">
                                        <label className="form-label required">{t('admin.paymentGetway.catLabelName')}</label>
                                        <input
                                            type="text"
                                            className={`form-control ${formErrors.name_en ? 'is-invalid' : ''}`}
                                            name="name_en"
                                            value={formData.name_en}
                                            onChange={handleInputChange}
                                            placeholder={t('admin.paymentGetway.catPlaceholderName')}
                                        />
                                        {formErrors.name_en && (
                                            <div className="invalid-feedback">{getErrorMessage(formErrors.name_en)}</div>
                                        )}
                                    </div>
                                    <div className="mb-5">
                                        <label className="form-label required">{t('admin.paymentGetway.catLabelArabicName')}</label>
                                        <input
                                            type="text"
                                            className={`form-control ${formErrors.name_ar ? 'is-invalid' : ''}`}
                                            name="name_ar"
                                            value={formData.name_ar}
                                            onChange={handleInputChange}
                                            placeholder={t('admin.paymentGetway.catPlaceholderArabicName')}
                                        />
                                        {formErrors.name_ar && (
                                            <div className="invalid-feedback">{getErrorMessage(formErrors.name_ar)}</div>
                                        )}
                                    </div>
                                    {activeHierarchy === 'children' && (
                                        <div className="mb-5">
                                            <label className="form-label required">{t('admin.paymentGetway.catLabelParentCategory')}</label>
                                            <select
                                                className={`form-select ${formErrors.parent_id ? 'is-invalid' : ''}`}
                                                name="parent_id"
                                                value={formData.parent_id}
                                                onChange={handleInputChange}
                                            >
                                                <option value="">{t('admin.paymentGetway.catSelectParent')}</option>
                                                {parentCategories
                                                    .filter((item) => !isEditing || item.id !== currentCategory?.id)
                                                    .map((item) => (
                                                        <option key={item.id} value={item.id}>
                                                            {item.name_en || item.name || item.code}
                                                        </option>
                                                    ))}
                                            </select>
                                            {formErrors.parent_id && (
                                                <div className="invalid-feedback">{getErrorMessage(formErrors.parent_id)}</div>
                                            )}
                                        </div>
                                    )}
                                    <div className="mb-5">
                                        <label className="form-label">{t('admin.paymentGetway.catLabelImage')}</label>
                                        <input
                                            type="file"
                                            className={`form-control ${formErrors.image ? 'is-invalid' : ''}`}
                                            accept="image/*"
                                            onChange={handleImageChange}
                                        />
                                        {formErrors.image && (
                                            <div className="invalid-feedback">{getErrorMessage(formErrors.image)}</div>
                                        )}
                                        {formData.image_preview && (
                                            <div className="mt-3">
                                                <img
                                                    src={formData.image_preview}
                                                    alt={t('admin.paymentGetway.catAltPreview')}
                                                    className="img-fluid rounded border"
                                                    style={{ maxHeight: '120px' }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                    <div className="mb-5">
                                        <label className="form-label">{t('admin.paymentGetway.catLabelDescription')}</label>
                                        <textarea
                                            className="form-control"
                                            name="description"
                                            rows="3"
                                            value={formData.description}
                                            onChange={handleInputChange}
                                            placeholder={t('admin.paymentGetway.catPlaceholderDesc')}
                                        ></textarea>
                                    </div>
                                    <div className="mb-0">
                                        <div className="form-check form-switch">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                name="is_active"
                                                checked={formData.is_active}
                                                onChange={handleInputChange}
                                            />
                                            <label className="form-check-label">Active</label>
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-light" onClick={handleCloseModal}>
                                        {t('admin.common.cancel')}
                                    </button>
                                    <button type="submit" className="btn btn-primary" disabled={submitting}>
                                        {submitting && (
                                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                                        )}
                                        {submitting
                                            ? (isEditing ? t('admin.paymentGetway.catSaving') : t('admin.paymentGetway.catCreating'))
                                            : (isEditing ? t('admin.paymentGetway.catUpdateBtn') : t('admin.paymentGetway.catCreateBtn'))}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default AdminServiceCategoriesIndex;


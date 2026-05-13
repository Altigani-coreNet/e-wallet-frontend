import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import axios from '../../utils/axiosConfig';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import { ADMIN_ENDPOINTS } from '../../utils/constants';
import {
    getPartners,
    mapAdminPartnersPaginatedResponse,
    exportPartners,
    bulkDeletePartners,
    approvePartner,
    rejectPartner,
    suspendPartner,
    unsuspendPartner,
    deletePartner,
} from '../../services/adminPartnersService';
import ContentProviderModel from '../../services/ContentProviderModel';
import { useToolbar } from '../../contexts/ToolbarContext';
import { useCan } from '../../utils/permissions';
import ContentProviderFiltersPanel from './ContentProviderFiltersPanel';
import ContentProviderTableRow from './ContentProviderTableRow';
import ContentProviderImportModal from './ContentProviderImportModal';
import BulkActionBar from '../../common/BulkActionBar';
import ContentProviderRejectModal from './ContentProviderRejectModal';
import useCountryInfoByIds from '../../hooks/useCountryInfoByIds';

const PLACEHOLDER_ROWS = 6;

const AdminPartnersIndex = () => {
    const { t } = useTranslation();
    const { setTitle, setActions } = useToolbar();
    const canCreatePartner = useCan('pos.merchants.create_merchants');
    const [contentProviders, setContentProviders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [rejectingContentProvider, setRejectingContentProvider] = useState(null);
    const [isRejectSubmitting, setIsRejectSubmitting] = useState(false);
    const [pagination, setPagination] = useState({
        current_page: 1,
        per_page: 15,
        total: 0,
        last_page: 1
    });
    const [filters, setFilters] = useState({
        search: '',
        country_id: '',
        partner_category_id: '',
        date_from: '',
        date_to: ''
    });
    const [searchInput, setSearchInput] = useState('');

    const countryIds = useMemo(
        () =>
            contentProviders
                .map((cp) => ContentProviderModel.ensure(cp).country_id)
                .filter((id) => id !== null && id !== undefined && id !== '')
                .map((id) => String(id)),
        [contentProviders]
    );

    const { loading: countryLookupLoading, getCountryById, hasPendingRequest } = useCountryInfoByIds(countryIds);

    useEffect(() => {
        setTitle(t('admin.paymentGetway.titlesPartnersManagement'));
        setActions(
            <div className="d-flex align-items-center gap-2 gap-lg-3">
                <button
                    id="filters_button"
                    className="btn btn-sm btn-flex btn-secondary fw-bold"
                    onClick={() => setShowFilters(!showFilters)}
                >
                    <i className="ki-duotone ki-filter fs-3">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    <span className="d-none d-md-inline ms-1">{t('admin.common.filter')}</span>
                </button>

                <button
                    type="button"
                    className="btn btn-sm fw-bold btn-success"
                    onClick={() => setShowImportModal(true)}
                >
                    <i className="ki-duotone ki-file-up fs-3">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    <span className="d-none d-md-inline ms-1">{t('admin.common.import')}</span>
                </button>

                <button
                    type="button"
                    className="btn btn-sm fw-bold btn-success"
                    onClick={handleExport}
                >
                    <i className="ki-duotone ki-download fs-3">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    <span className="d-none d-md-inline ms-1">{t('admin.common.export')}</span>
                </button>

                {canCreatePartner && (
                    <Link to="/admin/partners/create" className="btn btn-sm fw-bold btn-primary">
                        <i className="ki-duotone ki-plus fs-3">
                            <span className="path1"></span>
                            <span className="path2"></span>
                        </i>
                        <span className="d-none d-md-inline ms-1">{t('admin.common.add')}</span>
                    </Link>
                )}
            </div>
        );
        return () => setActions(null);
    }, [setTitle, setActions, showFilters, t]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchInput !== filters.search) {
                setFilters(prev => ({ ...prev, search: searchInput }));
                setPagination(prev => ({ ...prev, current_page: 1 }));
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchInput]);

    useEffect(() => {
        fetchContentProviders();
    }, [pagination.current_page, pagination.per_page, filters.search, filters.country_id, filters.partner_category_id, filters.date_from, filters.date_to]);

    const fetchContentProviders = async () => {
        setLoading(true);
        try {
            const params = { page: pagination.current_page, per_page: pagination.per_page, ...filters };
            const result = await getPartners(params);
            if (!result.success) {
                toast.error(result.error);
                return;
            }
            const responseData = result.data;
            const isSuccess = responseData.success || responseData.status;
            if (isSuccess) {
                const { partners, pagination: meta } = mapAdminPartnersPaginatedResponse(responseData);
                setContentProviders(partners);
                if (meta) {
                    setPagination({
                        current_page: meta.current_page,
                        per_page: meta.per_page,
                        total: meta.total,
                        last_page: meta.last_page,
                    });
                }
            }
        } catch (error) {
            toast.error(t('admin.paymentGetway.cpLoadPartnersFailed'));
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            const result = await exportPartners(filters);
            if (!result.success) {
                toast.error(result.error);
                return;
            }
            const responseData = result.data;
            const isSuccess = responseData.success || responseData.status;
            if (isSuccess && responseData.data) {
                const { data, filename } = responseData.data;
                if (!data || data.length === 0) {
                    toast.error(t('admin.paymentGetway.cpExportNoData'));
                    return;
                }

                const headers = Object.keys(data[0]);
                let csvContent = headers.join(',') + '\n';
                data.forEach(row => {
                    const values = headers.map(header => {
                        const value = row[header];
                        if (value === null || value === undefined) return '';
                        const stringValue = String(value);
                        if (stringValue.includes(',') || stringValue.includes('"')) {
                            return '"' + stringValue.replace(/"/g, '""') + '"';
                        }
                        return stringValue;
                    });
                    csvContent += values.join(',') + '\n';
                });

                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.setAttribute('download', filename || 'partners_export.csv');
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(link.href);
                toast.success(t('admin.paymentGetway.cpExportSuccess'));
            } else {
                toast.error(t('admin.paymentGetway.cpExportNoData'));
            }
        } catch (error) {
            toast.error(t('admin.paymentGetway.cpExportFailed'));
            console.error(error);
        }
    };

    const handleClearFilters = () => {
        setSearchInput('');
        setFilters({ search: '', country_id: '', partner_category_id: '', date_from: '', date_to: '' });
        setPagination((prev) => ({ ...prev, current_page: 1 }));
    };

    const handleApplyFilters = (draft) => {
        setFilters((prev) => ({
            ...prev,
            country_id: draft.country_id ?? '',
            partner_category_id: draft.partner_category_id ?? '',
            date_from: draft.date_from ?? '',
            date_to: draft.date_to ?? '',
        }));
        setPagination((prev) => ({ ...prev, current_page: 1 }));
    };

    const handleSelectAll = (e) => setSelectedIds(e.target.checked ? contentProviders.map(cp => cp.id) : []);
    const handleSelectOne = (id, checked) => setSelectedIds(checked ? [...selectedIds, id] : selectedIds.filter(selectedId => selectedId !== id));

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        const confirmation = await Swal.fire({
            title: t('admin.paymentGetway.cpBulkDeleteTitle'),
            text: t('admin.paymentGetway.cpBulkDeleteText', { count: selectedIds.length }),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: t('admin.paymentGetway.cpYesDelete'),
            cancelButtonText: t('admin.common.cancel'),
            customClass: { confirmButton: 'btn btn-danger', cancelButton: 'btn btn-light' },
            buttonsStyling: false
        });
        if (!confirmation.isConfirmed) return;

        try {
            const result = await bulkDeletePartners(selectedIds);
            if (!result.success) {
                toast.error(result.error);
                return;
            }
            const isSuccess = result.data.success || result.data.status;
            if (isSuccess) {
                toast.success(t('admin.paymentGetway.cpBulkDeleted', { count: selectedIds.length }));
                setSelectedIds([]);
                fetchContentProviders();
            }
        } catch (error) {
            toast.error(t('admin.paymentGetway.cpBulkDeleteFailed'));
            console.error(error);
        }
    };

    const handleApprove = async (id) => {
        const confirmation = await Swal.fire({
            title: t('admin.paymentGetway.cpApproveTitle'),
            text: t('admin.paymentGetway.cpApproveText'),
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: t('admin.paymentGetway.viewApprove'),
            cancelButtonText: t('admin.common.cancel'),
            customClass: { confirmButton: 'btn btn-success', cancelButton: 'btn btn-light' },
            buttonsStyling: false
        });
        if (!confirmation.isConfirmed) return;

        try {
            const result = await approvePartner(id);
            if (!result.success) {
                toast.error(result.error);
                return;
            }
            const isSuccess = result.data.success || result.data.status;
            if (isSuccess) {
                toast.success(t('admin.paymentGetway.cpApproveSuccess'));
                fetchContentProviders();
            }
        } catch (error) {
            toast.error(t('admin.paymentGetway.cpApproveFailed'));
            console.error(error);
        }
    };

    const handleReject = (contentProvider) => {
        setRejectingContentProvider(contentProvider);
        setRejectModalOpen(true);
    };

    const handleRejectConfirm = async ({ contentProviderId, rejection_reason, invalid_fields }) => {
        try {
            setIsRejectSubmitting(true);
            const result = await rejectPartner(contentProviderId, { rejection_reason, invalid_fields });
            if (!result.success) {
                toast.error(result.error);
                return;
            }
            const isSuccess = result.data.success || result.data.status;
            if (isSuccess) {
                toast.success(t('admin.paymentGetway.cpRejectSuccess'));
                setRejectModalOpen(false);
                setRejectingContentProvider(null);
                fetchContentProviders();
            } else {
                toast.error(result.data.message || t('admin.paymentGetway.cpRejectFailed'));
            }
        } catch (error) {
            toast.error(error.response?.data?.message || t('admin.paymentGetway.cpRejectFailed'));
            console.error(error);
        } finally {
            setIsRejectSubmitting(false);
        }
    };

    const handleSuspend = async (partner) => {
        const contentProvider = ContentProviderModel.ensure(partner);
        const suspensionPrompt = await Swal.fire({
            title: t('admin.paymentGetway.cpSuspendTitle'),
            text: t('admin.paymentGetway.cpSuspendText'),
            icon: 'warning',
            input: 'textarea',
            inputPlaceholder: t('admin.paymentGetway.cpSuspendPlaceholder'),
            showCancelButton: true,
            confirmButtonText: t('admin.common.suspend'),
            cancelButtonText: t('admin.common.cancel'),
            customClass: { confirmButton: 'btn btn-warning', cancelButton: 'btn btn-light' },
            buttonsStyling: false,
            preConfirm: (value) => {
                const trimmed = value?.trim();
                if (!trimmed || trimmed.length < 10) {
                    Swal.showValidationMessage(t('admin.paymentGetway.cpSuspendReasonMin'));
                    return;
                }
                return trimmed;
            }
        });

        if (!suspensionPrompt.isConfirmed || !suspensionPrompt.value) return;

        try {
            const result = await suspendPartner(contentProvider.id, {
                suspension_reason: suspensionPrompt.value,
            });
            if (!result.success) {
                toast.error(result.error);
                return;
            }
            const isSuccess = result.data.success || result.data.status;
            if (isSuccess) {
                toast.success(t('admin.paymentGetway.cpSuspendSuccess'));
                fetchContentProviders();
            }
        } catch (error) {
            toast.error(t('admin.paymentGetway.cpSuspendFailed'));
            console.error(error);
        }
    };

    const handleUnsuspend = async (id) => {
        const confirmation = await Swal.fire({
            title: t('admin.paymentGetway.cpUnsuspendTitle'),
            text: t('admin.paymentGetway.cpUnsuspendText'),
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: t('admin.paymentGetway.viewUnsuspend'),
            cancelButtonText: t('admin.common.cancel'),
            customClass: { confirmButton: 'btn btn-success', cancelButton: 'btn btn-light' },
            buttonsStyling: false
        });
        if (!confirmation.isConfirmed) return;

        try {
            const result = await unsuspendPartner(id);
            if (!result.success) {
                toast.error(result.error);
                return;
            }
            const isSuccess = result.data.success || result.data.status;
            if (isSuccess) {
                toast.success(t('admin.paymentGetway.cpUnsuspendSuccess'));
                fetchContentProviders();
            }
        } catch (error) {
            toast.error(t('admin.paymentGetway.cpUnsuspendFailed'));
            console.error(error);
        }
    };

    const handleDelete = async (id) => {
        const confirmation = await Swal.fire({
            title: t('admin.paymentGetway.cpDeleteTitle'),
            text: t('admin.paymentGetway.cpDeleteText'),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: t('admin.paymentGetway.cpYesDelete'),
            cancelButtonText: t('admin.common.cancel'),
            customClass: { confirmButton: 'btn btn-danger', cancelButton: 'btn btn-light' },
            buttonsStyling: false
        });
        if (!confirmation.isConfirmed) return;

        try {
            const result = await deletePartner(id);
            if (!result.success) {
                toast.error(result.error);
                return;
            }
            const isSuccess = result.data.success || result.data.status;
            if (isSuccess) {
                toast.success(t('admin.paymentGetway.cpDeleteSuccess'));
                fetchContentProviders();
            }
        } catch (error) {
            toast.error(t('admin.paymentGetway.cpDeleteFailed'));
            console.error(error);
        }
    };

    const handleResetPassword = async (partner) => {
        const cp = ContentProviderModel.ensure(partner);
        if (!cp.hasLinkedUser) {
            toast.error(t('admin.paymentGetway.cpNoUserAccount'));
            return;
        }
        const confirmation = await Swal.fire({
            title: t('admin.paymentGetway.cpResetPasswordTitle'),
            text: t('admin.paymentGetway.cpResetPasswordText', {
                email: cp.resetPasswordEmail,
            }),
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: t('admin.paymentGetway.cpResetPasswordConfirm'),
            cancelButtonText: t('admin.common.cancel'),
            customClass: { confirmButton: 'btn btn-primary', cancelButton: 'btn btn-light' },
            buttonsStyling: false
        });
        if (!confirmation.isConfirmed) return;

        try {
            const userId = cp.user_id;
            const response = await axios.post(ADMIN_ENDPOINTS.USER_SEND_RESET_PASSWORD(userId), {});
            const isSuccess = response.data.success || response.data.status;
            if (isSuccess) {
                toast.success(
                    response.data.data?.message || t('admin.paymentGetway.cpResetPasswordSuccess')
                );
            } else {
                toast.error(response.data.message || t('admin.paymentGetway.cpResetPasswordFailed'));
            }
        } catch (error) {
            toast.error(error.response?.data?.message || t('admin.paymentGetway.cpResetPasswordFailed'));
            console.error(error);
        }
    };

    const renderPlaceholderTable = useMemo(() => {
        if (!loading) return null;
        const columns = [
            'checkbox',
            t('admin.paymentGetway.viewCountryCol'),
            t('admin.paymentGetway.viewPartnerCol'),
            t('admin.paymentGetway.viewCategoryCol'),
            t('admin.paymentGetway.cpColCreationDate'),
            t('admin.common.status'),
            t('admin.common.actions'),
        ];
        return (
            <div className="table-responsive">
                <table className="table align-middle table-row-dashed fs-6 gy-5">
                    <thead>
                        <tr className="text-start text-gray-400 fw-bold fs-7 text-uppercase gs-0">
                            {columns.map((column) => (
                                <th key={column}>
                                    {column === 'checkbox'
                                        ? <div className="form-check form-check-sm form-check-custom form-check-solid me-3 placeholder-glow"><span className="placeholder col-12 rounded" style={{ height: '16px' }}></span></div>
                                        : <div className="placeholder-glow"><span className="placeholder col-7" style={{ height: '12px' }}></span></div>}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {Array.from({ length: PLACEHOLDER_ROWS }).map((_, index) => (
                            <tr key={index} className="placeholder-glow">
                                <td><div className="form-check form-check-sm form-check-custom form-check-solid"><span className="placeholder col-12 rounded" style={{ height: '16px' }}></span></div></td>
                                <td><span className="placeholder col-8" style={{ height: '14px' }}></span></td>
                                <td><div className="d-flex align-items-center gap-3"><span className="placeholder rounded-circle" style={{ width: '50px', height: '50px' }}></span><div className="d-flex flex-column gap-2"><span className="placeholder col-8" style={{ height: '14px' }}></span><span className="placeholder col-6" style={{ height: '12px' }}></span></div></div></td>
                                <td><span className="placeholder col-7" style={{ height: '14px' }}></span></td>
                                <td><span className="placeholder col-9" style={{ height: '14px' }}></span></td>
                                <td><span className="placeholder col-6" style={{ height: '22px' }}></span></td>
                                <td className="text-end"><div className="d-flex justify-content-end gap-2"><span className="placeholder rounded" style={{ width: '80px', height: '32px' }}></span></div></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }, [loading, t]);

    return (
        <>
            <div className="post d-flex flex-column-fluid">
                <div id="kt_content_container" className="container-xxl">
                    <ContentProviderFiltersPanel isVisible={showFilters} appliedFilters={filters} onApply={handleApplyFilters} onClearFilters={handleClearFilters} />
                    <div className="card">
                        <div className="card-header border-0 pt-6">
                            <div className="card-title">
                                <div className="d-flex align-items-center position-relative me-5" style={{ minWidth: '250px' }}>
                                    <i className="ki-duotone ki-magnifier fs-2 position-absolute ms-4" style={{ zIndex: 1 }}><span className="path1"></span><span className="path2"></span></i>
                                    <input type="text" className="form-control form-control-solid ps-13" placeholder={t('admin.paymentGetway.cpQuickSearchPartners')} value={searchInput} onChange={(e) => setSearchInput(e.target.value)} style={{ paddingLeft: '3rem' }} />
                                    {searchInput && (
                                        <button className="btn btn-icon btn-sm btn-active-color-primary position-absolute end-0 me-2" onClick={() => { setSearchInput(''); setFilters(prev => ({ ...prev, search: '' })); }} style={{ zIndex: 1 }}>
                                            <i className="ki-duotone ki-cross fs-2"><span className="path1"></span><span className="path2"></span></i>
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="card-toolbar">
                                {selectedIds.length > 0 ? <BulkActionBar selectedCount={selectedIds.length} onClear={() => setSelectedIds([])} onDelete={handleBulkDelete} /> : null}
                            </div>
                        </div>

                        <div className="card-body pt-0">
                            {loading ? renderPlaceholderTable : (
                                <div className="table-responsive">
                                    <table className="table align-middle table-row-dashed fs-6 gy-5">
                                        <thead>
                                            <tr className="text-start text-gray-400 fw-bold fs-7 text-uppercase gs-0">
                                                <th className="w-10px pe-2"><div className="form-check form-check-sm form-check-custom form-check-solid me-3"><input className="form-check-input" type="checkbox" checked={selectedIds.length === contentProviders.length && contentProviders.length > 0} onChange={handleSelectAll} /></div></th>
                                                <th className="text-dark min-w-125px">{t('admin.paymentGetway.viewCountryCol')}</th>
                                                <th className="min-w-220px text-dark">{t('admin.paymentGetway.viewPartnerCol')}</th>
                                                <th className="text-dark min-w-120px">{t('admin.paymentGetway.viewCategoryCol')}</th>
                                                <th className="text-dark min-w-140px">{t('admin.paymentGetway.cpColCreationDate')}</th>
                                                <th className="text-dark min-w-100px">{t('admin.common.status')}</th>
                                                <th className="text-end text-dark min-w-100px">{t('admin.common.actions')}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-gray-600 fw-semibold">
                                            {contentProviders.map((contentProvider) => {
                                                const countryId = contentProvider.country_id;
                                                const record = getCountryById(countryId);
                                                const rowLookupLoading =
                                                    countryLookupLoading && hasPendingRequest(countryId);
                                                return (
                                                    <ContentProviderTableRow
                                                        key={contentProvider.id}
                                                        contentProvider={contentProvider}
                                                        isSelected={selectedIds.includes(contentProvider.id)}
                                                        onSelect={handleSelectOne}
                                                        onApprove={handleApprove}
                                                        onReject={handleReject}
                                                        onSuspend={handleSuspend}
                                                        onUnsuspend={handleUnsuspend}
                                                        onDelete={handleDelete}
                                                        onResetPassword={handleResetPassword}
                                                        lookupCountryName={record?.name}
                                                        lookupCountryCode={record?.code || record?.short_name}
                                                        lookupLoading={rowLookupLoading}
                                                    />
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {!loading && contentProviders.length > 0 && (
                                <div className="d-flex flex-stack flex-wrap pt-10">
                                    <div className="fs-6 fw-semibold text-gray-700">
                                        {t('admin.common.showingEntries', {
                                            from: ((pagination.current_page - 1) * pagination.per_page) + 1,
                                            to: Math.min(pagination.current_page * pagination.per_page, pagination.total),
                                            total: pagination.total,
                                        })}
                                    </div>
                                    <ul className="pagination">
                                        <li className={`page-item ${pagination.current_page === 1 ? 'disabled' : ''}`}><button className="page-link" onClick={() => setPagination({ ...pagination, current_page: pagination.current_page - 1 })} disabled={pagination.current_page === 1}>{t('admin.common.previous')}</button></li>
                                        {[...Array(pagination.last_page)].map((_, idx) => {
                                            const pageNum = idx + 1;
                                            if (pageNum === 1 || pageNum === pagination.last_page || (pageNum >= pagination.current_page - 1 && pageNum <= pagination.current_page + 1)) {
                                                return <li key={pageNum} className={`page-item ${pagination.current_page === pageNum ? 'active' : ''}`}><button className="page-link" onClick={() => setPagination({ ...pagination, current_page: pageNum })}>{pageNum}</button></li>;
                                            } else if (pageNum === pagination.current_page - 2 || pageNum === pagination.current_page + 2) {
                                                return <li key={pageNum} className="page-item disabled"><span className="page-link">...</span></li>;
                                            }
                                            return null;
                                        })}
                                        <li className={`page-item ${pagination.current_page === pagination.last_page ? 'disabled' : ''}`}><button className="page-link" onClick={() => setPagination({ ...pagination, current_page: pagination.current_page + 1 })} disabled={pagination.current_page === pagination.last_page}>{t('admin.common.next')}</button></li>
                                    </ul>
                                </div>
                            )}

                            {!loading && contentProviders.length === 0 && (
                                <div className="text-center py-10">
                                    <p className="text-gray-600 fs-4">{t('admin.paymentGetway.cpNoPartnersFound')}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <ContentProviderImportModal isOpen={showImportModal} onClose={() => setShowImportModal(false)} onImportSuccess={fetchContentProviders} />
            <ContentProviderRejectModal
                isOpen={rejectModalOpen}
                contentProvider={rejectingContentProvider}
                onClose={() => {
                    if (isRejectSubmitting) return;
                    setRejectModalOpen(false);
                    setRejectingContentProvider(null);
                }}
                onConfirm={handleRejectConfirm}
                isSubmitting={isRejectSubmitting}
            />
        </>
    );
};

export default AdminPartnersIndex;


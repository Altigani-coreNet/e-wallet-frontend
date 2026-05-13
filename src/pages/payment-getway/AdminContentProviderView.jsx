import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import axios from '../../utils/axiosConfig';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import { ADMIN_ENDPOINTS, AUTH_SERVICE_BASE } from '../../utils/constants';
import { getToken } from '../../utils/api';
import {
    getPartner,
    approvePartner,
    suspendPartner,
    unsuspendPartner,
    deletePartner,
} from '../../services/adminPartnersService';
import { useToolbar } from '../../contexts/ToolbarContext';
import PartnerViewSkeleton from './view/PartnerViewSkeleton';
import PartnerProfileHeader from './view/PartnerProfileHeader';
import PartnerOverviewTab from './view/PartnerOverviewTab';
import PartnerEventsTab from './view/PartnerEventsTab';
import PartnerAttachmentsTab from './view/PartnerAttachmentsTab';
import PartnerServicesTab from './view/PartnerServicesTab';
import PartnerProductsTab from './view/PartnerProductsTab';
import PartnerSubPartnersTab from './view/PartnerSubPartnersTab';
import { fetchProducts } from '../../services/serviceProductsService';
import useCountryInfoByIds from '../../hooks/useCountryInfoByIds';

const resolveAuthAssetUrl = (path) => {
    if (!path) return null;
    if (/^https?:\/\//i.test(path)) {
        return path;
    }
    const normalizedBase = AUTH_SERVICE_BASE.replace(/\/+$/, '');
    const normalizedPath = path.toString().replace(/^\/+/, '').replace(/\\/g, '/');
    return `${normalizedBase}/${normalizedPath}`;
};

const pickFirstValue = (...values) => {
    for (const value of values) {
        if (value !== null && value !== undefined && value !== '') {
            return value;
        }
    }
    return null;
};

const PARTNERS_PATH = '/admin/partners';

/** Normalize admin list responses (paginated or plain). */
const extractAdminList = (response) => {
    const body = response?.data;
    if (!body) return [];
    if (Array.isArray(body.data)) return body.data;
    if (body.data?.data && Array.isArray(body.data.data)) return body.data.data;
    return [];
};

const AdminContentProviderView = () => {
    const { t } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { setTitle, setActions } = useToolbar();

    const [contentProvider, setContentProvider] = useState(null);
    const [loading, setLoading] = useState(true);
    const [logoError, setLogoError] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [attachmentLoading, setAttachmentLoading] = useState(false);
    const [servicesLoading, setServicesLoading] = useState(false);
    const [productsLoading, setProductsLoading] = useState(false);
    const [tabData, setTabData] = useState({
        events: [],
        attachments: [],
        services: [],
        products: [],
    });
    const [statistics, setStatistics] = useState({
        events: 0,
        attachments: 0,
        services: 0,
        products: 0,
        sub_partners: 0,
    });

    const contentProviderCountryId = contentProvider?.country_id ?? contentProvider?.country?.id;
    const {
        loading: countryInfoLoading,
        getCountryById,
    } = useCountryInfoByIds(contentProviderCountryId ? [String(contentProviderCountryId)] : []);
    const partnerCountryRecord = getCountryById(contentProviderCountryId ? String(contentProviderCountryId) : '');
    const resolvedCountryName =
        partnerCountryRecord?.name ||
        contentProvider?.country_name ||
        contentProvider?.countryName ||
        contentProvider?.country?.name?.en ||
        contentProvider?.country?.name_en ||
        contentProvider?.country?.name ||
        contentProvider?.country?.label ||
        null;
    const resolvedCountryCode =
        partnerCountryRecord?.code ||
        partnerCountryRecord?.short_name ||
        contentProvider?.country_code ||
        contentProvider?.countryCode ||
        contentProvider?.country?.code ||
        contentProvider?.country?.short_name ||
        contentProvider?.country?.iso2 ||
        contentProvider?.country?.alpha2 ||
        null;

    const tabs = useMemo(() => {
        const base = [
            { key: 'overview', label: t('admin.paymentGetway.viewTabOverview') },
            { key: 'events', label: t('admin.paymentGetway.viewTabEvents') },
            { key: 'attachments', label: t('admin.paymentGetway.viewTabAttachments') },
            { key: 'services', label: t('admin.paymentGetway.viewTabServices') },
            { key: 'products', label: t('admin.paymentGetway.viewTabProducts') },
        ];
        if (contentProvider && !contentProvider.parent_id && contentProvider.is_parent) {
            return [
                { key: 'overview', label: t('admin.paymentGetway.viewTabOverview') },
                { key: 'sub-partners', label: t('admin.paymentGetway.viewSubPartnersTitle') },
                ...base.slice(1),
            ];
        }
        return base;
    }, [contentProvider, t]);

    const statsConfig = useMemo(() => {
        const base = [
            { key: 'events', label: t('admin.paymentGetway.viewTabEvents'), icon: 'ki-abstract-44' },
            { key: 'attachments', label: t('admin.paymentGetway.viewTabAttachments'), icon: 'ki-folder' },
            { key: 'services', label: t('admin.paymentGetway.viewTabServices'), icon: 'ki-setting-2' },
            { key: 'products', label: t('admin.paymentGetway.viewTabProducts'), icon: 'ki-package' },
        ];
        if (contentProvider && !contentProvider.parent_id && contentProvider.is_parent) {
            return [
                { key: 'sub_partners', label: t('admin.paymentGetway.viewSubPartnersTitle'), icon: 'ki-people' },
                ...base,
            ];
        }
        return base;
    }, [contentProvider, t]);

    useEffect(() => {
        setTitle(t('admin.paymentGetway.titlesPartnerDetails'));
        setActions(
            <div className="d-flex align-items-center gap-2">
                <Link to={`${PARTNERS_PATH}/${id}/edit`} className="btn btn-sm btn-primary">
                    <i className="ki-duotone ki-pencil fs-3">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    {t('admin.paymentGetway.viewEditPartner')}
                </Link>
                <Link to={PARTNERS_PATH} className="btn btn-sm btn-light">
                    <i className="ki-duotone ki-arrow-left fs-2">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    {t('admin.paymentGetway.cpBack')}
                </Link>
            </div>
        );

        return () => {
            setTitle(t('admin.paymentGetway.titlesDashboard'));
            setActions(null);
        };
    }, [id, setTitle, setActions, t]);

    const fetchAttachments = useCallback(async () => {
        try {
            setAttachmentLoading(true);
            const token = getToken();
            const response = await axios.get(ADMIN_ENDPOINTS.ATTACHMENTS, {
                headers: { Authorization: `Bearer ${token}` },
                params: {
                    attachable_id: id,
                    attachable_type: 'App\\Models\\Partner',
                },
            });
            const isSuccess = response.data.success || response.data.status;
            if (isSuccess) {
                const attachments = response.data.data?.data || response.data.data || [];
                const list = Array.isArray(attachments) ? attachments : [];
                setTabData((prev) => ({ ...prev, attachments: list }));
                setStatistics((prev) => ({ ...prev, attachments: list.length }));
            }
        } catch {
            setTabData((prev) => ({ ...prev, attachments: [] }));
            setStatistics((prev) => ({ ...prev, attachments: 0 }));
        } finally {
            setAttachmentLoading(false);
        }
    }, [id]);

    const fetchPartnerServices = useCallback(async () => {
        try {
            setServicesLoading(true);
            const token = getToken();
            const response = await axios.get(ADMIN_ENDPOINTS.SERVICES, {
                headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
                params: {
                    partner_id: id,
                    content_provider_id: id,
                    per_page: 100,
                    page: 1,
                },
            });
            const ok = response.data.success === true || response.data.status === true;
            if (ok) {
                const list = extractAdminList(response);
                setTabData((prev) => ({ ...prev, services: list }));
                setStatistics((prev) => ({ ...prev, services: list.length }));
            }
        } catch (e) {
            console.error('Partner services fetch failed', e);
        } finally {
            setServicesLoading(false);
        }
    }, [id]);

    const fetchPartnerProducts = useCallback(async () => {
        try {
            setProductsLoading(true);
            const res = await fetchProducts({
                partner_id: id,
                per_page: 100,
                page: 1,
            });
            if (res.success === true || res.status === true) {
                const list = Array.isArray(res.data) ? res.data : [];
                setTabData((prev) => ({ ...prev, products: list }));
                setStatistics((prev) => ({ ...prev, products: list.length }));
            } else {
                setTabData((prev) => ({ ...prev, products: [] }));
                setStatistics((prev) => ({ ...prev, products: 0 }));
            }
        } catch {
            setTabData((prev) => ({ ...prev, products: [] }));
            setStatistics((prev) => ({ ...prev, products: 0 }));
        } finally {
            setProductsLoading(false);
        }
    }, [id]);

    const handleDeleteAttachment = async (attachment) => {
        const attachmentName =
            attachment?.title ||
            attachment?.file_name ||
            attachment?.name ||
            attachment?.url_type ||
            t('admin.paymentGetway.viewAttachmentFallbackName');
        const result = await Swal.fire({
            title: t('admin.paymentGetway.viewAttachmentDeleteTitle'),
            text: t('admin.paymentGetway.viewAttachmentDeleteText', { name: attachmentName }),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: t('admin.paymentGetway.productsYesDeleteIt'),
            cancelButtonText: t('admin.common.cancel'),
        });

        if (!result.isConfirmed) return;

        try {
            const token = getToken();
            const attachmentId = attachment?.id;
            const attachmentUrl = resolveAuthAssetUrl(attachment?.url || attachment?.path || attachment?.attachment_url);

            if (!attachmentId && !attachmentUrl) {
                toast.error(t('admin.paymentGetway.viewErrDeleteAttachmentMissing'));
                return;
            }

            let response;
            if (attachmentId) {
                response = await axios.delete(`${ADMIN_ENDPOINTS.ATTACHMENTS}/${attachmentId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
            } else {
                response = await axios.delete(`${ADMIN_ENDPOINTS.ATTACHMENTS}/delete-by-path`, {
                    headers: { Authorization: `Bearer ${token}` },
                    data: { filePath: attachmentUrl },
                });
            }

            const isSuccess = response.data?.status || response.data?.success;
            if (isSuccess) {
                toast.success(t('admin.paymentGetway.viewAttachmentDeleted'));
                fetchAttachments();
            } else {
                toast.error(response.data?.message || t('admin.paymentGetway.viewErrDeleteAttachment'));
            }
        } catch (error) {
            toast.error(error.response?.data?.message || t('admin.paymentGetway.viewErrDeleteAttachment'));
            console.error(error);
        }
    };

    const fetchContentProvider = async () => {
        setLoading(true);
        setTabData({
            events: [],
            attachments: [],
            services: [],
            products: [],
        });
        setStatistics({
            events: 0,
            attachments: 0,
            services: 0,
            products: 0,
            sub_partners: 0,
        });
        try {
            const result = await getPartner(id);
            if (!result.success) {
                setContentProvider(null);
                toast.error(result.error);
                return;
            }
            const responseData = result.data;
            const isSuccess = responseData?.success === true || responseData?.status === true;
            if (isSuccess) {
                const payload = responseData?.data ?? responseData;
                const partnerData =
                    payload?.partner ||
                    payload?.merchant ||
                    payload?.contentProvider ||
                    payload;

                if (partnerData && typeof partnerData === 'object' && partnerData.id) {
                    setContentProvider(partnerData);
                    const logs = partnerData.logs || [];
                    const events = Array.isArray(logs) ? logs : [];

                    setTabData((prev) => ({
                        ...prev,
                        events,
                    }));
                    setStatistics((prev) => ({
                        ...prev,
                        events: events.length,
                        sub_partners: partnerData.sub_partners_count ?? prev.sub_partners ?? 0,
                    }));
                } else {
                    setContentProvider(null);
                    toast.error(t('admin.paymentGetway.cpErrLoadPartner'));
                }
            } else {
                setContentProvider(null);
                toast.error(responseData?.message || t('admin.paymentGetway.cpErrLoadPartner'));
            }
        } catch (error) {
            setContentProvider(null);
            toast.error(t('admin.paymentGetway.cpErrLoadPartner'));
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContentProvider();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    useEffect(() => {
        const tab = searchParams.get('tab');
        if (!contentProvider) return;
        const showSubTab = !contentProvider.parent_id && contentProvider.is_parent;
        if (tab === 'sub-partners' && showSubTab) {
            setActiveTab('sub-partners');
        }
    }, [searchParams, contentProvider]);

    const handleTabChange = (key) => {
        setActiveTab(key);
        if (key === 'overview') {
            setSearchParams({});
        } else {
            setSearchParams({ tab: key });
        }
    };

    useEffect(() => {
        if (!contentProvider?.id) return;
        fetchAttachments();
    }, [contentProvider?.id, fetchAttachments]);

    /** Load services/products only when their tabs are opened (separate APIs by partner_id). */
    useEffect(() => {
        if (!contentProvider?.id) return;
        if (activeTab === 'services' && !servicesLoading && tabData.services.length === 0) {
            fetchPartnerServices();
        }
        if (activeTab === 'products' && !productsLoading && tabData.products.length === 0) {
            fetchPartnerProducts();
        }
    }, [
        activeTab,
        contentProvider?.id,
        servicesLoading,
        productsLoading,
        tabData.services.length,
        tabData.products.length,
        fetchPartnerServices,
        fetchPartnerProducts,
    ]);

    const logoCandidate = pickFirstValue(
        contentProvider?.logo_url,
        contentProvider?.logo,
        contentProvider?.image_url,
        contentProvider?.image,
        contentProvider?.avatar_url,
        contentProvider?.avatar,
        contentProvider?.profile_image_url,
        contentProvider?.profile_image
    );

    useEffect(() => {
        setLogoError(false);
    }, [logoCandidate]);

    const handleApprove = async () => {
        const res = await Swal.fire({
            title: t('admin.paymentGetway.viewApprovePartnerTitle'),
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: t('admin.paymentGetway.viewApprove'),
            cancelButtonText: t('admin.common.cancel'),
        });
        if (!res.isConfirmed) return;
        try {
            const result = await approvePartner(id);
            if (!result.success) {
                toast.error(result.error);
                return;
            }
            toast.success(t('admin.paymentGetway.viewPartnerApproved'));
            fetchContentProvider();
        } catch {
            toast.error(t('admin.paymentGetway.viewErrApprovePartner'));
        }
    };

    const handleSuspendToggle = async () => {
        try {
            if (contentProvider?.status === 'suspended') {
                const result = await unsuspendPartner(id);
                if (!result.success) {
                    toast.error(result.error);
                    return;
                }
                toast.success(t('admin.paymentGetway.viewPartnerUnsuspended'));
            } else {
                const res = await Swal.fire({
                    title: t('admin.paymentGetway.viewSuspendPartnerTitle'),
                    input: 'textarea',
                    inputPlaceholder: t('admin.paymentGetway.viewSuspendReasonPlaceholder'),
                    showCancelButton: true,
                    confirmButtonText: t('admin.paymentGetway.viewConfirmSuspend'),
                    cancelButtonText: t('admin.common.cancel'),
                    preConfirm: (value) => {
                        if (!value || value.trim().length < 10) {
                            Swal.showValidationMessage(t('admin.paymentGetway.viewSuspendReasonMin'));
                            return false;
                        }
                        return value.trim();
                    },
                });
                if (!res.isConfirmed) return;
                const result = await suspendPartner(id, { suspension_reason: res.value });
                if (!result.success) {
                    toast.error(result.error);
                    return;
                }
                toast.success(t('admin.paymentGetway.viewPartnerSuspended'));
            }
            fetchContentProvider();
        } catch {
            toast.error(t('admin.paymentGetway.viewErrPartnerStatus'));
        }
    };

    const handleDelete = async () => {
        if (!window.confirm(t('admin.paymentGetway.viewDeletePartnerConfirm'))) {
            return;
        }
        try {
            const result = await deletePartner(id);
            if (!result.success) {
                toast.error(result.error);
                return;
            }
            toast.success(t('admin.paymentGetway.viewPartnerDeleted'));
            navigate(PARTNERS_PATH);
        } catch {
            toast.error(t('admin.paymentGetway.viewErrDeletePartner'));
        }
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'overview':
                return (
                    <PartnerOverviewTab
                        partner={contentProvider}
                        canEdit
                        editUrl={`${PARTNERS_PATH}/${id}/edit`}
                        partnerId={id}
                        services={tabData.services}
                        servicesLoading={servicesLoading}
                        lookupCountryName={resolvedCountryName}
                        lookupCountryCode={resolvedCountryCode}
                        lookupLoading={countryInfoLoading}
                        onOpenServicesTab={() => setActiveTab('services')}
                    />
                );
            case 'events':
                return <PartnerEventsTab events={tabData.events} />;
            case 'attachments':
                return (
                    <PartnerAttachmentsTab
                        attachments={tabData.attachments}
                        loading={attachmentLoading}
                        resolveAssetUrl={resolveAuthAssetUrl}
                        onDeleteAttachment={handleDeleteAttachment}
                    />
                );
            case 'services':
                return (
                    <PartnerServicesTab
                        services={tabData.services}
                        loading={servicesLoading}
                        partnerId={id}
                    />
                );
            case 'products':
                return (
                    <PartnerProductsTab
                        products={tabData.products}
                        loading={productsLoading}
                        partnerId={id}
                    />
                );
            case 'sub-partners':
                return (
                    <PartnerSubPartnersTab
                        parentId={id}
                        parentName={contentProvider.business_name || contentProvider.name}
                    />
                );
            default:
                return (
                    <PartnerOverviewTab
                        partner={contentProvider}
                        canEdit
                        editUrl={`${PARTNERS_PATH}/${id}/edit`}
                        partnerId={id}
                        services={tabData.services}
                        servicesLoading={servicesLoading}
                        lookupCountryName={resolvedCountryName}
                        lookupCountryCode={resolvedCountryCode}
                        lookupLoading={countryInfoLoading}
                        onOpenServicesTab={() => setActiveTab('services')}
                    />
                );
        }
    };

    if (loading) {
        return <PartnerViewSkeleton />;
    }

    if (!contentProvider) {
        return (
            <div className="text-center py-10">
                <p className="text-muted">{t('admin.paymentGetway.viewPartnerNotFound')}</p>
                <Link to={PARTNERS_PATH} className="btn btn-primary mt-3">
                    {t('admin.paymentGetway.viewBackToPartners')}
                </Link>
            </div>
        );
    }

    const logoUrl = resolveAuthAssetUrl(logoCandidate);
    const canApprove = ['pending', 'requesting_updated'].includes(contentProvider.status);
    const isSuspended = contentProvider.status === 'suspended';

    return (
        <div className="post d-flex flex-column-fluid">
            <div id="kt_content_container" className="container-xxl">
                <PartnerProfileHeader
                    partner={contentProvider}
                    logoUrl={logoUrl}
                    logoError={logoError}
                    onLogoError={() => setLogoError(true)}
                    statistics={statistics}
                    statsConfig={statsConfig}
                    activeTab={activeTab}
                    onTabChange={handleTabChange}
                    tabs={tabs}
                    countryName={resolvedCountryName}
                    countryCode={resolvedCountryCode}
                />

                <div className="row g-5 g-xl-8">
                    <div className="col-xl-8 order-2 order-xl-1">{renderTabContent()}</div>
                    <div className="col-xl-4 order-1 order-xl-2">
                        <div className="card mb-5">
                            <div className="card-header border-0">
                                <div className="card-title m-0">
                                    <h3 className="fw-bolder m-0">{t('admin.paymentGetway.viewQuickActions')}</h3>
                                </div>
                            </div>
                            <div className="card-body border-top p-9">
                                <div className="d-flex flex-column gap-4">
                                    <Link to={`${PARTNERS_PATH}/${id}/edit`} className="btn btn-primary">
                                        <i className="ki-duotone ki-pencil fs-3 me-2">
                                            <span className="path1"></span>
                                            <span className="path2"></span>
                                        </i>
                                        {t('admin.paymentGetway.viewEditPartner')}
                                    </Link>
                                    {canApprove && (
                                        <button className="btn btn-success" onClick={handleApprove}>
                                            <i className="ki-duotone ki-check-circle fs-3 me-2">
                                                <span className="path1"></span>
                                                <span className="path2"></span>
                                            </i>
                                            {t('admin.paymentGetway.viewApprove')}
                                        </button>
                                    )}
                                    <button className={`btn btn-${isSuspended ? 'success' : 'warning'}`} onClick={handleSuspendToggle}>
                                        <i
                                            className={`ki-duotone ${isSuspended ? 'ki-check-circle' : 'ki-information-3'} fs-3 me-2`}
                                        >
                                            <span className="path1"></span>
                                            <span className="path2"></span>
                                            <span className="path3"></span>
                                        </i>
                                        {isSuspended ? t('admin.paymentGetway.viewUnsuspend') : t('admin.common.suspend')}
                                    </button>
                                    <button className="btn btn-danger" onClick={handleDelete}>
                                        <i className="ki-duotone ki-trash fs-3 me-2">
                                            <span className="path1"></span>
                                            <span className="path2"></span>
                                            <span className="path3"></span>
                                            <span className="path4"></span>
                                            <span className="path5"></span>
                                        </i>
                                        {t('admin.paymentGetway.viewDeletePartner')}
                                    </button>
                                </div>

                                <div className="separator my-7"></div>

                                <div className="d-flex flex-column gap-3 text-gray-600 fs-7">
                                    <div className="d-flex justify-content-between">
                                        <span>{t('admin.paymentGetway.viewPartnerId')}</span>
                                        <span className="fw-bold text-gray-900">{contentProvider.id}</span>
                                    </div>
                                    {contentProvider.created_at && (
                                        <div className="d-flex justify-content-between">
                                            <span>{t('admin.paymentGetway.viewCreatedAtLabel')}</span>
                                            <span className="fw-bold text-gray-900">
                                                {new Date(contentProvider.created_at).toLocaleString()}
                                            </span>
                                        </div>
                                    )}
                                    {contentProvider.updated_at && (
                                        <div className="d-flex justify-content-between">
                                            <span>{t('admin.paymentGetway.viewLastUpdated')}</span>
                                            <span className="fw-bold text-gray-900">
                                                {new Date(contentProvider.updated_at).toLocaleString()}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminContentProviderView;

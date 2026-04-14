import React, { useEffect, useMemo, useState, useCallback } from 'react';
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
            { key: 'overview', label: 'Overview' },
            { key: 'events', label: 'Events' },
            { key: 'attachments', label: 'Attachments' },
            { key: 'services', label: 'Services' },
            { key: 'products', label: 'Products' },
        ];
        if (contentProvider && !contentProvider.parent_id && contentProvider.is_parent) {
            return [
                { key: 'overview', label: 'Overview' },
                { key: 'sub-partners', label: 'Sub Partners' },
                ...base.slice(1),
            ];
        }
        return base;
    }, [contentProvider]);

    const statsConfig = useMemo(() => {
        const base = [
            { key: 'events', label: 'Events', icon: 'ki-abstract-44' },
            { key: 'attachments', label: 'Attachments', icon: 'ki-folder' },
            { key: 'services', label: 'Services', icon: 'ki-setting-2' },
            { key: 'products', label: 'Products', icon: 'ki-package' },
        ];
        if (contentProvider && !contentProvider.parent_id && contentProvider.is_parent) {
            return [{ key: 'sub_partners', label: 'Sub Partners', icon: 'ki-people' }, ...base];
        }
        return base;
    }, [contentProvider]);

    useEffect(() => {
        setTitle('Partner Details');
        setActions(
            <div className="d-flex align-items-center gap-2">
                <Link to={`${PARTNERS_PATH}/${id}/edit`} className="btn btn-sm btn-primary">
                    <i className="ki-duotone ki-pencil fs-3">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    Edit Partner
                </Link>
                <Link to={PARTNERS_PATH} className="btn btn-sm btn-light">
                    <i className="ki-duotone ki-arrow-left fs-2">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    Back
                </Link>
            </div>
        );

        return () => {
            setTitle('Dashboard');
            setActions(null);
        };
    }, [id, setTitle, setActions]);

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
        const attachmentName = attachment?.title || attachment?.file_name || attachment?.name || attachment?.url_type || 'this attachment';
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: `If you delete ${attachmentName}, it cannot be restored.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'Cancel',
        });

        if (!result.isConfirmed) return;

        try {
            const token = getToken();
            const attachmentId = attachment?.id;
            const attachmentUrl = resolveAuthAssetUrl(attachment?.url || attachment?.path || attachment?.attachment_url);

            if (!attachmentId && !attachmentUrl) {
                toast.error('Cannot delete attachment: missing ID or URL');
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
                toast.success('Attachment deleted successfully');
                fetchAttachments();
            } else {
                toast.error(response.data?.message || 'Failed to delete attachment');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete attachment');
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
                    toast.error('Failed to load partner');
                }
            } else {
                setContentProvider(null);
                toast.error(responseData?.message || 'Failed to load partner');
            }
        } catch (error) {
            setContentProvider(null);
            toast.error('Failed to load partner');
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
            title: 'Approve partner?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Approve',
        });
        if (!res.isConfirmed) return;
        try {
            const result = await approvePartner(id);
            if (!result.success) {
                toast.error(result.error);
                return;
            }
            toast.success('Partner approved successfully');
            fetchContentProvider();
        } catch {
            toast.error('Failed to approve partner');
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
                toast.success('Partner unsuspended successfully');
            } else {
                const res = await Swal.fire({
                    title: 'Suspend partner',
                    input: 'textarea',
                    inputPlaceholder: 'Enter reason (min 10 characters)',
                    showCancelButton: true,
                    confirmButtonText: 'Suspend',
                    preConfirm: (value) => {
                        if (!value || value.trim().length < 10) {
                            Swal.showValidationMessage('Reason must be at least 10 characters');
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
                toast.success('Partner suspended successfully');
            }
            fetchContentProvider();
        } catch {
            toast.error('Failed to update partner status');
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this partner? This action cannot be undone.')) {
            return;
        }
        try {
            const result = await deletePartner(id);
            if (!result.success) {
                toast.error(result.error);
                return;
            }
            toast.success('Partner deleted successfully');
            navigate(PARTNERS_PATH);
        } catch {
            toast.error('Failed to delete partner');
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
                <p className="text-muted">Partner not found</p>
                <Link to={PARTNERS_PATH} className="btn btn-primary mt-3">
                    Back to Partners
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
                                    <h3 className="fw-bolder m-0">Quick Actions</h3>
                                </div>
                            </div>
                            <div className="card-body border-top p-9">
                                <div className="d-flex flex-column gap-4">
                                    <Link to={`${PARTNERS_PATH}/${id}/edit`} className="btn btn-primary">
                                        <i className="ki-duotone ki-pencil fs-3 me-2">
                                            <span className="path1"></span>
                                            <span className="path2"></span>
                                        </i>
                                        Edit Partner
                                    </Link>
                                    {canApprove && (
                                        <button className="btn btn-success" onClick={handleApprove}>
                                            <i className="ki-duotone ki-check-circle fs-3 me-2">
                                                <span className="path1"></span>
                                                <span className="path2"></span>
                                            </i>
                                            Approve
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
                                        {isSuspended ? 'Unsuspend' : 'Suspend'}
                                    </button>
                                    <button className="btn btn-danger" onClick={handleDelete}>
                                        <i className="ki-duotone ki-trash fs-3 me-2">
                                            <span className="path1"></span>
                                            <span className="path2"></span>
                                            <span className="path3"></span>
                                            <span className="path4"></span>
                                            <span className="path5"></span>
                                        </i>
                                        Delete Partner
                                    </button>
                                </div>

                                <div className="separator my-7"></div>

                                <div className="d-flex flex-column gap-3 text-gray-600 fs-7">
                                    <div className="d-flex justify-content-between">
                                        <span>Partner ID</span>
                                        <span className="fw-bold text-gray-900">{contentProvider.id}</span>
                                    </div>
                                    {contentProvider.created_at && (
                                        <div className="d-flex justify-content-between">
                                            <span>Created At</span>
                                            <span className="fw-bold text-gray-900">
                                                {new Date(contentProvider.created_at).toLocaleString()}
                                            </span>
                                        </div>
                                    )}
                                    {contentProvider.updated_at && (
                                        <div className="d-flex justify-content-between">
                                            <span>Last Updated</span>
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

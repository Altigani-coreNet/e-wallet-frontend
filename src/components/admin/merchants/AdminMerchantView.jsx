import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import { ADMIN_ENDPOINTS, AUTH_SERVICE_BASE, AUTH_ENDPOINTS } from '../../../utils/constants';
import { getToken } from '../../../utils/api';
import { useToolbar } from '../../../contexts/ToolbarContext';

const resolveAuthAssetUrl = (path) => {
    if (!path) return null;
    if (/^https?:\/\//i.test(path)) {
        return path;
    }

    const normalizedBase = AUTH_SERVICE_BASE.replace(/\/+$/, '');
    const normalizedPath = path.toString().replace(/^\/+/, '').replace(/\\/g, '/');
    return `${normalizedBase}/${normalizedPath}`;
};

const AdminMerchantView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { setTitle, setActions } = useToolbar();
    const [merchant, setMerchant] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [tabLoading, setTabLoading] = useState(false);
    const [tabData, setTabData] = useState({
        branches: [],
        terminals: [],
        users: [],
        events: [],
        attachments: [],
        changeRequests: []
    });
    const [showActionsMenu, setShowActionsMenu] = useState(false);
    const [profileCompletion, setProfileCompletion] = useState({ completion: 0, missing: [] });
    const [pendingChangeRequests, setPendingChangeRequests] = useState(0);
    const [logoError, setLogoError] = useState(false);
    const [availableScopes, setAvailableScopes] = useState([]);

    useEffect(() => {
        setLogoError(false);
    }, [merchant?.logo]);

    useEffect(() => {
        setTitle('Merchant Details');
        setActions(
            <div className="d-flex align-items-center gap-2">
                <Link to="/admin/merchants" className="btn btn-sm btn-light">
                    <i className="ki-duotone ki-arrow-left fs-2">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    Back
                </Link>
                <Link to={`/admin/merchants/${id}/edit`} className="btn btn-sm btn-primary">
                    <i className="ki-duotone ki-pencil fs-4 me-1">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    Edit
                </Link>
            </div>
        );
        return () => setActions(null);
    }, [setTitle, setActions, id]);

    useEffect(() => {
        fetchMerchant();
        fetchScopes();
    }, [id]);

    useEffect(() => {
        if (merchant && activeTab !== 'overview') {
            fetchTabData(activeTab);
        }
    }, [activeTab, merchant]);

    const calculateProfileCompletion = (merchant) => {
        let completion = 10;
        const missing = [];
        const pointsPerItem = 18;

        // 1. Basic profile info
        const hasProfile = merchant.name && merchant.owner_name && merchant.email && merchant.phone && merchant.address;
        if (hasProfile) {
            completion += pointsPerItem;
        } else {
            missing.push('Complete your business profile information.');
        }

        // 2. Required documents
        const attachmentsCount = merchant.attachments?.length || 0;
        if (attachmentsCount >= 4) {
            completion += pointsPerItem;
        } else {
            missing.push(`Upload required documents (${4 - attachmentsCount} missing).`);
        }

        // 3. Account approval
        if (merchant.status === 'approved') {
            completion += pointsPerItem;
        } else if (merchant.status === 'rejected') {
            missing.push('Account approval was rejected.');
        } else {
            missing.push('Account is pending approval.');
        }

        // 4. Has users
        const usersCount = merchant.users?.length || (merchant.user ? 1 : 0);
        if (usersCount > 0) {
            completion += pointsPerItem;
        } else {
            missing.push('Add at least one user to your account.');
        }

        // 5. Has terminals
        const terminalsCount = merchant.terminals?.length || 0;
        if (terminalsCount > 0) {
            completion += pointsPerItem;
        } else {
            missing.push('Add at least one terminal to your account.');
        }

        return {
            completion: Math.min(Math.round(completion), 100),
            missing
        };
    };

    const fetchMerchant = async () => {
        try {
            setLoading(true);
            const token = getToken();
            const response = await axios.get(ADMIN_ENDPOINTS.MERCHANT_DETAILS(id), {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const isSuccess = response.data.success || response.data.status;
            if (isSuccess) {
                const merchantData = response.data.data?.merchant || response.data.data;
                const mergedMerchant = {
                    ...(merchantData || {}),
                    user: merchantData?.user || null,
                };
                setMerchant(mergedMerchant);
                setProfileCompletion(calculateProfileCompletion(mergedMerchant));
                setPendingChangeRequests(0);
                setTabData(prev => ({ ...prev, events: merchantData?.events || [] }));
            }
        } catch (error) {
            toast.error('Failed to load merchant details');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchTabData = async (tab) => {
        setTabLoading(true);
        try {
            const token = getToken();
            let endpoint;
            
            switch(tab) {
                case 'branches':
                    endpoint = `${ADMIN_ENDPOINTS.BRANCHES}?merchant_id=${id}`;
                    break;
                case 'terminals':
                    endpoint = `${ADMIN_ENDPOINTS.TERMINALS}?merchant_id=${id}`;
                    break;
                case 'users':
                    endpoint = `${ADMIN_ENDPOINTS.USERS}?merchant_id=${id}`;
                    break;
                case 'events':
                    setTabData(prev => ({ ...prev, events: merchant?.events || [] }));
                    setTabLoading(false);
                    return;
                case 'attachments':
                    endpoint = ADMIN_ENDPOINTS.ATTACHMENTS;
                    break;
                case 'change-requests':
                    // Load change requests for this merchant
                    // Placeholder - will implement when API is ready
                    setTabData(prev => ({ ...prev, changeRequests: [] }));
                    setTabLoading(false);
                    return;
                default:
                    setTabLoading(false);
                    return;
            }

            const config = {
                headers: { 'Authorization': `Bearer ${token}` }
            };
            
            // Add query parameters for attachments
            if (tab === 'attachments') {
                config.params = {
                    attachable_id: id,
                    attachable_type: 'App\\Models\\Merchant'
                };
            }
            
            const response = await axios.get(endpoint, config);

            const isSuccess = response.data.success || response.data.status;
            if (isSuccess) {
                const data = response.data.data.data || response.data.data || [];
                setTabData(prev => ({
                    ...prev,
                    [tab]: Array.isArray(data) ? data : []
                }));
            }
        } catch (error) {
            console.error(`Failed to load ${tab}:`, error);
        } finally {
            setTabLoading(false);
        }
    };

    const getStatusBadgeClass = (status) => {
        switch (status?.toLowerCase()) {
            case 'approved': return 'badge-light-success';
            case 'pending': return 'badge-light-warning';
            case 'rejected': return 'badge-light-danger';
            case 'suspended': return 'badge-light-danger';
            case 'viewed': return 'badge-light-info';
            default: return 'badge-light-warning';
        }
    };

    const getCountryName = (merchant) => {
        if (!merchant) return 'N/A';
        return merchant.country_name || merchant.country?.name?.en || merchant.country?.name || 'N/A';
    };

    const getCityName = (merchant) => {
        if (!merchant) return 'N/A';
        return merchant.city_name || merchant.city?.name?.en || merchant.city?.name || 'N/A';
    };

    const fetchScopes = async () => {
        try {
            const token = getToken();
            const response = await axios.get(ADMIN_ENDPOINTS.MERCHANTS_SCOPES, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.data.status || response.data.success) {
                setAvailableScopes(response.data.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch scopes:', error);
        }
    };

    const getScopeLabel = (scopeKey) => {
        const scope = availableScopes.find(s => (s.id || s.key) === scopeKey);
        return scope ? (scope.text || scope.label) : scopeKey;
    };

    const formatAttachmentName = (name) => {
        if (!name) return 'Document';
        // Replace underscores with spaces and capitalize each word
        return name
            .replace(/_/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase())
            .trim();
    };

    const handleApprove = async () => {
        const result = await Swal.fire({
            title: 'Approve Merchant',
            text: 'Are you sure you want to approve this merchant?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#50cd89',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, approve it!',
            cancelButtonText: 'Cancel'
        });

        if (!result.isConfirmed) return;
        
        try {
            const token = getToken();
            const response = await axios.post(
                ADMIN_ENDPOINTS.MERCHANT_APPROVE(id),
                {},
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            const isSuccess = response.data.success || response.data.status;
            if (isSuccess) {
                Swal.fire('Approved!', 'Merchant has been approved successfully.', 'success');
                fetchMerchant();
            } else {
                Swal.fire('Error!', 'Failed to approve merchant', 'error');
            }
        } catch (error) {
            Swal.fire('Error!', error.response?.data?.message || 'Failed to approve merchant', 'error');
        }
    };

    const handleReject = async () => {
        const result = await Swal.fire({
            title: 'Reject Merchant',
            input: 'textarea',
            inputLabel: 'Rejection Reason',
            inputPlaceholder: 'Please enter the reason for rejecting this merchant (minimum 10 characters)',
            inputValue: '',
            inputAttributes: {
                'aria-label': 'Rejection reason',
                minlength: 10
            },
            inputValidator: (value) => {
                if (!value || value.trim().length < 10) {
                    return 'Rejection reason must be at least 10 characters';
                }
            },
            showCancelButton: true,
            confirmButtonText: 'Reject',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#f1416c',
            cancelButtonColor: '#3085d6',
            focusConfirm: false,
        });

        if (!result.isConfirmed || !result.value) return;

        const reason = result.value.trim();
        if (reason.length < 10) {
            Swal.fire('Error!', 'Rejection reason must be at least 10 characters', 'error');
            return;
        }

        try {
            const token = getToken();
            const response = await axios.post(
                ADMIN_ENDPOINTS.MERCHANT_REJECT(id),
                { rejection_reason: reason },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            const isSuccess = response.data.success || response.data.status;
            if (isSuccess) {
                Swal.fire('Rejected!', 'Merchant has been rejected successfully.', 'success');
                fetchMerchant();
            } else {
                Swal.fire('Error!', 'Failed to reject merchant', 'error');
            }
        } catch (error) {
            Swal.fire('Error!', error.response?.data?.message || 'Failed to reject merchant', 'error');
        }
    };

    const handleSuspend = async () => {
        const result = await Swal.fire({
            title: 'Suspend Merchant',
            input: 'textarea',
            inputLabel: 'Suspension Reason',
            inputPlaceholder: 'Please enter the reason for suspending this merchant (minimum 10 characters)',
            inputValue: '',
            inputAttributes: {
                'aria-label': 'Suspension reason',
                minlength: 10
            },
            inputValidator: (value) => {
                if (!value || value.trim().length < 10) {
                    return 'Suspension reason must be at least 10 characters';
                }
            },
            showCancelButton: true,
            confirmButtonText: 'Suspend',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#ffc700',
            cancelButtonColor: '#3085d6',
            focusConfirm: false,
        });

        if (!result.isConfirmed || !result.value) return;

        const reason = result.value.trim();
        if (reason.length < 10) {
            Swal.fire('Error!', 'Suspension reason must be at least 10 characters', 'error');
            return;
        }

        try {
            const token = getToken();
            const response = await axios.post(
                ADMIN_ENDPOINTS.MERCHANT_SUSPEND(id),
                { suspension_reason: reason },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            const isSuccess = response.data.success || response.data.status;
            if (isSuccess) {
                Swal.fire('Suspended!', 'Merchant has been suspended successfully.', 'success');
                fetchMerchant();
            } else {
                Swal.fire('Error!', 'Failed to suspend merchant', 'error');
            }
        } catch (error) {
            Swal.fire('Error!', error.response?.data?.message || 'Failed to suspend merchant', 'error');
        }
    };

    const handleUnsuspend = async () => {
        const result = await Swal.fire({
            title: 'Unsuspend Merchant',
            text: 'Are you sure you want to unsuspend this merchant?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#50cd89',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, unsuspend it!',
            cancelButtonText: 'Cancel'
        });

        if (!result.isConfirmed) return;

        try {
            const token = getToken();
            const response = await axios.post(
                ADMIN_ENDPOINTS.MERCHANT_UNSUSPEND(id),
                {},
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            const isSuccess = response.data.success || response.data.status;
            if (isSuccess) {
                Swal.fire('Unsuspended!', 'Merchant has been unsuspended successfully.', 'success');
                fetchMerchant();
            } else {
                Swal.fire('Error!', 'Failed to unsuspend merchant', 'error');
            }
        } catch (error) {
            Swal.fire('Error!', error.response?.data?.message || 'Failed to unsuspend merchant', 'error');
        }
    };

    const handleDelete = async () => {
        const result = await Swal.fire({
            title: 'Delete Merchant',
            text: 'Are you sure you want to delete this merchant? This action cannot be undone!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#f1416c',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'Cancel'
        });

        if (!result.isConfirmed) return;

        try {
            const token = getToken();
            const response = await axios.delete(
                `${ADMIN_ENDPOINTS.MERCHANTS}/${id}`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            const isSuccess = response.data.success || response.data.status;
            if (isSuccess) {
                Swal.fire('Deleted!', 'Merchant has been deleted successfully.', 'success');
                navigate('/admin/merchants');
            } else {
                Swal.fire('Error!', 'Failed to delete merchant', 'error');
            }
        } catch (error) {
            Swal.fire('Error!', error.response?.data?.message || 'Failed to delete merchant', 'error');
        }
    };

    const handleResetPassword = async () => {
        if (!merchant.user_id && !merchant.user?.id) {
            Swal.fire('Error!', 'This merchant does not have an associated user account', 'error');
            return;
        }

        const result = await Swal.fire({
            title: 'Reset Password?',
            text: `Are you sure you want to send a password reset link to ${merchant.user?.email || merchant.email}?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Yes, send reset link',
            cancelButtonText: 'Cancel'
        });

        if (!result.isConfirmed) return;

        try {
            const token = getToken();
            const userId = merchant.user_id || merchant.user?.id;
            const response = await axios.post(
                ADMIN_ENDPOINTS.USER_SEND_RESET_PASSWORD(userId),
                {},
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            const isSuccess = response.data.success || response.data.status;
            if (isSuccess) {
                Swal.fire('Success!', response.data.data?.message || 'Password reset link sent successfully', 'success');
            } else {
                Swal.fire('Error!', response.data.message || 'Failed to send reset password link', 'error');
            }
        } catch (error) {
            Swal.fire('Error!', error.response?.data?.message || 'Failed to send reset password link', 'error');
        }
    };

    const handleDownloadAttachment = async (attachment) => {
        try {
            const token = getToken();
            const attachmentId = attachment.id;
            
            if (!attachmentId) {
                // If no ID, try to download directly from URL
                const link = document.createElement('a');
                link.href = resolveAuthAssetUrl(attachment.url || attachment.path || attachment.attachment_url);
                link.download = attachment.file_name || attachment.title || 'attachment';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                return;
            }

            // Use API endpoint for download
            const response = await axios.get(
                `${ADMIN_ENDPOINTS.ATTACHMENTS}/${attachmentId}/download`,
                {
                    headers: { 'Authorization': `Bearer ${token}` },
                    responseType: 'blob'
                }
            );

            // Get filename from Content-Disposition header or use attachment name
            let filename = attachment.file_name || attachment.title || 'attachment';
            const contentDisposition = response.headers['content-disposition'];
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
                if (filenameMatch && filenameMatch[1]) {
                    filename = filenameMatch[1].replace(/['"]/g, '');
                }
            }

            // Create blob and download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            
            toast.success('Attachment downloaded successfully');
        } catch (error) {
            toast.error('Failed to download attachment');
            console.error(error);
        }
    };

    const handleDeleteAttachment = async (attachment) => {
        const attachmentName = attachment.title || attachment.file_name || attachment.url_type || 'this attachment';
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: `If you delete ${attachmentName}, it will not work with you anymore. This action cannot be undone!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'Cancel'
        });

        if (!result.isConfirmed) return;

        try {
            const token = getToken();
            const attachmentId = attachment.id;
            const attachmentUrl = resolveAuthAssetUrl(attachment.url || attachment.path || attachment.attachment_url);

            if (!attachmentId && !attachmentUrl) {
                toast.error('Cannot delete attachment: missing ID or URL');
                return;
            }

            let response;
            if (attachmentId) {
                // Delete by ID
                response = await axios.delete(
                    `${ADMIN_ENDPOINTS.ATTACHMENTS}/${attachmentId}`,
                    { headers: { 'Authorization': `Bearer ${token}` } }
                );
            } else {
                // Delete by path
                response = await axios.delete(
                    `${ADMIN_ENDPOINTS.ATTACHMENTS}/delete-by-path`,
                    {
                        headers: { 'Authorization': `Bearer ${token}` },
                        data: { filePath: attachmentUrl }
                    }
                );
            }

            const isSuccess = response.data.status || response.data.success;
            if (isSuccess) {
                Swal.fire('Deleted!', 'Attachment has been deleted successfully.', 'success');
                // Refresh attachments
                fetchTabData('attachments');
            } else {
                Swal.fire('Error!', response.data.message || 'Failed to delete attachment', 'error');
            }
        } catch (error) {
            Swal.fire('Error!', error.response?.data?.message || 'Failed to delete attachment', 'error');
            console.error(error);
        }
    };

    const LoadingSkeleton = () => (
        <div className="d-flex flex-column gap-5 py-10">
            {[1, 2, 3].map((i) => (
                <div key={i} className="d-flex align-items-center">
                    <div className="skeleton skeleton-circle me-4" style={{ width: '50px', height: '50px' }}></div>
                    <div className="flex-grow-1">
                        <div className="skeleton skeleton-text mb-2" style={{ width: '40%', height: '20px' }}></div>
                        <div className="skeleton skeleton-text" style={{ width: '60%', height: '16px' }}></div>
                    </div>
                </div>
            ))}
        </div>
    );

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                <span className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }}></span>
            </div>
        );
    }

    if (!merchant) {
        return (
            <div className="alert alert-danger">
                <h4>Merchant not found</h4>
                <Link to="/admin/merchants" className="btn btn-sm btn-light mt-3">Back to Merchants</Link>
            </div>
        );
    }

    const logoUrl = resolveAuthAssetUrl(merchant.logo);
    const displayLogoInitial = logoError || !logoUrl;
    const logoFallbackSource = (merchant.business_name || merchant.name || 'M').trim();
    const logoFallbackText = logoFallbackSource
        ? logoFallbackSource.substring(0, Math.min(2, logoFallbackSource.length)).toUpperCase()
        : 'M';

    const branchesCount = merchant.branches?.length || merchant.branches_count || 0;
    const terminalsCount = merchant.terminals?.length || merchant.terminals_count || 0;
    const usersCount = merchant.users?.length || (merchant.user ? 1 : 0);
    const transactionsCount = merchant.transactions_count || 0;

    return (
        <div className="post d-flex flex-column-fluid">
            <div id="kt_content_container" className="container-xxl">
                {/* Profile Header Card */}
                <div className="card mb-5 mb-xl-10">
                    <div className="card-body pt-9 pb-0">
                        <div className="d-flex flex-wrap flex-sm-nowrap mb-3">
                            {/* Logo */}
                            <div className="me-7 mb-4">
                                <div className="symbol symbol-100px symbol-lg-160px symbol-fixed position-relative">
                                    {!displayLogoInitial && logoUrl ? (
                                        <img
                                            src={logoUrl}
                                            alt={merchant.business_name}
                                            className="rounded"
                                            onError={() => setLogoError(true)}
                                        />
                                    ) : (
                                        <div className="symbol-label fs-3 bg-light-primary text-primary">
                                            {logoFallbackText}
                                        </div>
                                    )}
                                    <div className="position-absolute translate-middle bottom-0 start-100 mb-6 bg-success rounded-circle border border-4 border-white h-20px w-20px"></div>
                                </div>
                            </div>

                            {/* Info */}
                            <div className="flex-grow-1">
                                <div className="d-flex justify-content-between align-items-start flex-wrap mb-2">
                                    <div className="d-flex flex-column">
                                        {/* Name */}
                                        <div className="d-flex align-items-center mb-2">
                                            <a href="#" className="text-gray-900 text-hover-primary fs-2 fw-bold me-1">
                                                {merchant.business_name || merchant.name}
                                            </a>
                                            <a href="#">
                                                <span className="svg-icon svg-icon-1 svg-icon-primary">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 24 24">
                                                        <path d="M10.0813 3.7242C10.8849 2.16438 13.1151 2.16438 13.9187 3.7242V3.7242C14.4016 4.66147 15.4909 5.1127 16.4951 4.79139V4.79139C18.1663 4.25668 19.7433 5.83365 19.2086 7.50485V7.50485C18.8873 8.50905 19.3385 9.59842 20.2758 10.0813V10.0813C21.8356 10.8849 21.8356 13.1151 20.2758 13.9187V13.9187C19.3385 14.4016 18.8873 15.491 19.2086 16.4951V16.4951C19.7433 18.1663 18.1663 19.7433 16.4951 19.2086V19.2086C15.491 18.8873 14.4016 19.3385 13.9187 20.2758V20.2758C13.1151 21.8356 10.8849 21.8356 10.0813 20.2758V20.2758C9.59842 19.3385 8.50905 18.8873 7.50485 19.2086V19.2086C5.83365 19.7433 4.25668 18.1663 4.79139 16.4951V16.4951C5.1127 15.491 4.66147 14.4016 3.7242 13.9187V13.9187C2.16438 13.1151 2.16438 10.8849 3.7242 10.0813V10.0813C4.66147 9.59842 5.1127 8.50905 4.79139 7.50485V7.50485C4.25668 5.83365 5.83365 4.25668 7.50485 4.79139V4.79139C8.50905 5.1127 9.59842 4.66147 10.0813 3.7242V3.7242Z" fill="#00A3FF"></path>
                                                        <path className="permanent" d="M14.8563 9.1903C15.0606 8.94984 15.3771 8.9385 15.6175 9.14289C15.858 9.34728 15.8229 9.66433 15.6185 9.9048L11.863 14.6558C11.6554 14.9001 11.2876 14.9258 11.048 14.7128L8.47656 12.4271C8.24068 12.2174 8.21944 11.8563 8.42911 11.6204C8.63877 11.3845 8.99996 11.3633 9.23583 11.5729L11.3706 13.4705L14.8563 9.1903Z" fill="white"></path>
                                                    </svg>
                                                </span>
                                            </a>
                                        </div>

                                        {/* Contact Info */}
                                        <div className="d-flex flex-wrap fw-semibold fs-6 mb-4 pe-2">
                                            {merchant.address && (
                                                <a href="#" className="d-flex align-items-center text-gray-400 text-hover-primary me-5 mb-2">
                                                    <i className="ki-duotone ki-geolocation fs-4 me-1">
                                                        <span className="path1"></span>
                                                        <span className="path2"></span>
                                                    </i>
                                                    {merchant.address}
                                                </a>
                                            )}

                                            {merchant.business_type && (
                                                <a href="#" className="d-flex align-items-center text-gray-400 text-hover-primary me-5 mb-2">
                                                    <i className="ki-duotone ki-briefcase fs-4 me-1">
                                                        <span className="path1"></span>
                                                        <span className="path2"></span>
                                                    </i>
                                                    {merchant.business_type.charAt(0).toUpperCase() + merchant.business_type.slice(1)}
                                                </a>
                                            )}

                                            <a href={`mailto:${merchant.email}`} className="d-flex align-items-center text-gray-400 text-hover-primary mb-2">
                                                <i className="ki-duotone ki-sms fs-4 me-1">
                                                    <span className="path1"></span>
                                                    <span className="path2"></span>
                                                </i>
                                                {merchant.email}
                                            </a>
                                        </div>
                                    </div>

                                    {/* Actions Menu */}
                                    <div className="d-flex my-4">
                                        <div className="me-0 position-relative">
                                            <button
                                                className="btn btn-sm btn-icon btn-bg-light btn-active-color-primary"
                                                onClick={() => setShowActionsMenu(!showActionsMenu)}
                                                onBlur={() => setTimeout(() => setShowActionsMenu(false), 200)}
                                            >
                                                <i className="bi bi-three-dots fs-3"></i>
                                            </button>

                                            {showActionsMenu && (
                                                <div className="menu menu-sub menu-sub-dropdown menu-column menu-rounded menu-gray-600 menu-state-bg-light-primary fw-semibold fs-7 w-150px py-4 show" style={{ position: 'absolute', right: 0, top: '100%', zIndex: 105 }}>
                                                    {(merchant.status === 'pending' || merchant.status === 'viewed') && (
                                                        <>
                                                            <div className="menu-item px-3">
                                                                <button onMouseDown={(e) => { e.preventDefault(); handleApprove(); }} className="menu-link px-3 bg-light-success text-success w-100 text-start border-0" style={{ background: 'none' }}>
                                                                    Approve
                                                                </button>
                                                            </div>
                                                            <div className="menu-item px-3">
                                                                <button onMouseDown={(e) => { e.preventDefault(); handleReject(); }} className="menu-link px-3 bg-light-danger text-danger w-100 text-start border-0" style={{ background: 'none' }}>
                                                                    Reject
                                                                </button>
                                                            </div>
                                                        </>
                                                    )}

                                                    {(merchant.status === 'approved' || merchant.status === 'viewed' || merchant.status === 'rejected') && merchant.status !== 'suspended' && (
                                                        <div className="menu-item px-3">
                                                            <button onMouseDown={(e) => { e.preventDefault(); handleSuspend(); }} className="menu-link px-3 text-warning w-100 text-start border-0" style={{ background: 'none' }}>
                                                                Suspend
                                                            </button>
                                                        </div>
                                                    )}

                                                    {merchant.status === 'suspended' && (
                                                        <>
                                                            <div className="menu-item px-3">
                                                                <button onMouseDown={(e) => { e.preventDefault(); handleUnsuspend(); }} className="menu-link px-3 text-success w-100 text-start border-0" style={{ background: 'none' }}>
                                                                    Unsuspend
                                                                </button>
                                                            </div>
                                                            <div className="menu-item px-3">
                                                                <button onMouseDown={(e) => { e.preventDefault(); handleApprove(); }} className="menu-link px-3 text-success w-100 text-start border-0" style={{ background: 'none' }}>
                                                                    Approve
                                                                </button>
                                                            </div>
                                                        </>
                                                    )}

                                                    {(merchant.user_id || merchant.user?.id) && (
                                                        <div className="menu-item px-3">
                                                            <button onMouseDown={(e) => { e.preventDefault(); handleResetPassword(); }} className="menu-link px-3 text-primary w-100 text-start border-0" style={{ background: 'none' }}>
                                                                Reset Password
                                                            </button>
                                                        </div>
                                                    )}

                                                    <div className="menu-item px-3">
                                                        <button onMouseDown={(e) => { e.preventDefault(); handleDelete(); }} className="menu-link px-3 text-danger w-100 text-start border-0" style={{ background: 'none' }}>
                                                            Delete
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Statistics */}
                                <div className="d-flex flex-wrap flex-stack">
                                    <div className="d-flex flex-column flex-grow-1 pe-8">
                                        <div className="d-flex flex-wrap">
                                            {/* Branches */}
                                            <div className="border border-gray-300 border-dashed rounded min-w-100px py-3 px-4 me-6 mb-3">
                                                <div className="d-flex align-items-center">
                                                    <span className="svg-icon svg-icon-3 svg-icon-success me-2">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                                                            <path opacity="0.3" d="M20 15H4C2.9 15 2 14.1 2 13V7C2 6.4 2.4 6 3 6H21C21.6 6 22 6.4 22 7V13C22 14.1 21.1 15 20 15ZM13 12H11C10.5 12 10 12.4 10 13V16C10 16.5 10.4 17 11 17H13C13.6 17 14 16.6 14 16V13C14 12.4 13.6 12 13 12Z" fill="black"></path>
                                                            <path d="M14 6V5H10V6H8V5C8 3.9 8.9 3 10 3H14C15.1 3 16 3.9 16 5V6H14ZM20 15H14V16C14 16.6 13.5 17 13 17H11C10.5 17 10 16.6 10 16V15H4C3.6 15 3.3 14.9 3 14.7V18C3 19.1 3.9 20 5 20H19C20.1 20 21 19.1 21 18V14.7C20.7 14.9 20.4 15 20 15Z" fill="black"></path>
                                                        </svg>
                                                    </span>
                                                    <div className="fs-2 fw-bolder">{branchesCount}</div>
                                                </div>
                                                <div className="fw-bold fs-6 text-gray-400">Branches</div>
                                            </div>

                                            {/* Terminals */}
                                            <div className="border border-gray-300 border-dashed rounded min-w-100px py-3 px-4 me-6 mb-3">
                                                <div className="d-flex align-items-center">
                                                    <span className="svg-icon svg-icon-primary svg-icon-2x me-2">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 24 24">
                                                            <path d="M8,3 L8,3.5 C8,4.32842712 8.67157288,5 9.5,5 L14.5,5 C15.3284271,5 16,4.32842712 16,3.5 L16,3 L18,3 C19.1045695,3 20,3.8954305 20,5 L20,21 C20,22.1045695 19.1045695,23 18,23 L6,23 C4.8954305,23 4,22.1045695 4,21 L4,5 C4,3.8954305 4.8954305,3 6,3 L8,3 Z" fill="#000000" opacity="0.3"/>
                                                            <path d="M11,2 C11,1.44771525 11.4477153,1 12,1 C12.5522847,1 13,1.44771525 13,2 L14.5,2 C14.7761424,2 15,2.22385763 15,2.5 L15,3.5 C15,3.77614237 14.7761424,4 14.5,4 L9.5,4 C9.22385763,4 9,3.77614237 9,3.5 L9,2.5 C9,2.22385763 9.22385763,2 9.5,2 L11,2 Z" fill="#000000"/>
                                                        </svg>
                                                    </span>
                                                    <div className="fs-2 fw-bolder">{terminalsCount}</div>
                                                </div>
                                                <div className="fw-bold fs-6 text-gray-400">Terminals</div>
                                            </div>

                                            {/* Users */}
                                            <div className="border border-gray-300 border-dashed rounded min-w-100px py-3 px-4 me-6 mb-3">
                                                <div className="d-flex align-items-center">
                                                    <span className="svg-icon svg-icon-dark svg-icon-2x me-2">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 24 24">
                                                            <path d="M18,14 C16.3431458,14 15,12.6568542 15,11 C15,9.34314575 16.3431458,8 18,8 C19.6568542,8 21,9.34314575 21,11 C21,12.6568542 19.6568542,14 18,14 Z M9,11 C6.790861,11 5,9.209139 5,7 C5,4.790861 6.790861,3 9,3 C11.209139,3 13,4.790861 13,7 C13,9.209139 11.209139,11 9,11 Z" fill="#000000" fillRule="nonzero" opacity="0.3"/>
                                                            <path d="M17.6011961,15.0006174 C21.0077043,15.0378534 23.7891749,16.7601418 23.9984937,20.4 C24.0069246,20.5466056 23.9984937,21 23.4559499,21 L19.6,21 C19.6 18.7490654 18.8562935,16.6718327 17.6011961,15.0006174 Z M0.00065168429,20.1992055 C0.388258525,15.4265159 4.26191235,13 8.98334134,13 C13.7712164,13 17.7048837,15.2931929 17.9979143,20.2 C18.0095879,20.3954741 17.9979143,21 17.2466999,21 C13.541124,21 8.03472472,21 0.727502227,21 C0.476712155,21 -0.0204617505,20.45918 0.00065168429,20.1992055 Z" fill="#000000" fillRule="nonzero"/>
                                                        </svg>
                                                    </span>
                                                    <div className="fs-2 fw-bolder">{usersCount}</div>
                                                </div>
                                                <div className="fw-bold fs-6 text-gray-400">Users</div>
                                            </div>

                                            {/* Transactions */}
                                            <div className="border border-gray-300 border-dashed rounded min-w-100px py-3 px-4 me-6 mb-3">
                                                <div className="d-flex align-items-center">
                                                    <span className="svg-icon svg-icon-danger svg-icon-2x me-2">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 24 24">
                                                            <path d="M14,7 C13.6666667,10.3333333 12.6666667,12.1167764 11,12.3503292 C11,12.3503292 12.5,6.5 10.5,3.5 C10.5,3.5 10.287918,6.71444735 8.14498739,10.5717225 C7.14049032,12.3798172 6,13.5986793 6,16 C6,19.428689 9.51143904,21.2006583 12.0057195,21.2006583 C14.5,21.2006583 18,20.0006172 18,15.8004732 C18,14.0733981 16.6666667,11.1399071 14,7 Z" fill="#000000"/>
                                                        </svg>
                                                    </span>
                                                    <div className="fs-2 fw-bolder">{transactionsCount}</div>
                                                </div>
                                                <div className="fw-bold fs-6 text-gray-400">Transactions</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Profile Completion & Status */}
                                    <div className="d-flex align-items-center w-200px w-sm-300px flex-column mt-3">
                                        {/* Profile Completion Bar */}
                                        <div 
                                            className="d-flex justify-content-between w-100 mt-auto mb-2"
                                            data-bs-toggle="tooltip"
                                            title={profileCompletion.missing.join('\n')}
                                        >
                                            <span className="fw-bold fs-6 text-gray-400">Profile Completion</span>
                                            <span className="fw-bolder fs-6">{profileCompletion.completion}%</span>
                                        </div>
                                        <div className="h-5px mx-3 w-100 bg-light mb-3">
                                            <div 
                                                className="bg-success rounded h-5px" 
                                                role="progressbar" 
                                                style={{ width: `${profileCompletion.completion}%` }}
                                                aria-valuenow={profileCompletion.completion} 
                                                aria-valuemin="0" 
                                                aria-valuemax="100"
                                            ></div>
                                        </div>

                                        {/* Status Badge */}
                                        <div className="text-center w-100">
                                            <button type="button" className={`btn btn-sm ${getStatusBadgeClass(merchant.status)} px-9 py-4`}>
                                                <span className="indicator-label">
                                                    {merchant.status ? merchant.status.charAt(0).toUpperCase() + merchant.status.slice(1) : 'N/A'}
                                                </span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tabs */}
                        <ul className="nav nav-stretch nav-line-tabs nav-line-tabs-2x border-transparent fs-6">
                            <li className="nav-item mt-2">
                                <a className={`nav-link text-active-primary ms-0 me-6 py-5 ${activeTab === 'overview' ? 'active' : ''}`} href="#" onClick={(e) => { e.preventDefault(); setActiveTab('overview'); }}>Overview</a>
                            </li>
                            <li className="nav-item mt-2">
                                <a className={`nav-link text-active-primary me-6 py-5 ${activeTab === 'events' ? 'active' : ''}`} href="#" onClick={(e) => { e.preventDefault(); setActiveTab('events'); }}>Events</a>
                            </li>
                            <li className="nav-item mt-2">
                                <a className={`nav-link text-active-primary me-6 py-5 ${activeTab === 'transactions' ? 'active' : ''}`} href="#" onClick={(e) => { e.preventDefault(); setActiveTab('transactions'); }}>Transactions</a>
                            </li>
                            <li className="nav-item mt-2">
                                <a className={`nav-link text-active-primary me-6 py-5 ${activeTab === 'users' ? 'active' : ''}`} href="#" onClick={(e) => { e.preventDefault(); setActiveTab('users'); }}>Users</a>
                            </li>
                            <li className="nav-item mt-2">
                                <a className={`nav-link text-active-primary me-6 py-5 ${activeTab === 'terminals' ? 'active' : ''}`} href="#" onClick={(e) => { e.preventDefault(); setActiveTab('terminals'); }}>Terminals</a>
                            </li>
                            <li className="nav-item mt-2">
                                <a className={`nav-link text-active-primary me-6 py-5 ${activeTab === 'branches' ? 'active' : ''}`} href="#" onClick={(e) => { e.preventDefault(); setActiveTab('branches'); }}>Branches</a>
                            </li>
                            <li className="nav-item mt-2">
                                <a className={`nav-link text-active-primary me-6 py-5 ${activeTab === 'attachments' ? 'active' : ''}`} href="#" onClick={(e) => { e.preventDefault(); setActiveTab('attachments'); }}>Attachments</a>
                            </li>
                            <li className="nav-item mt-2">
                                <a className={`nav-link text-active-primary me-6 py-5 ${activeTab === 'change-requests' ? 'active' : ''}`} href="#" onClick={(e) => { e.preventDefault(); setActiveTab('change-requests'); }}>
                                    Change Requests
                                    {pendingChangeRequests > 0 && (
                                        <span className="badge badge-danger ms-2">{pendingChangeRequests}</span>
                                    )}
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Pending Change Requests Alert */}
                {pendingChangeRequests > 0 && (
                    <div className="alert alert-warning d-flex align-items-center p-5 mb-5">
                        <i className="ki-duotone ki-shield-cross fs-2hx text-warning me-4">
                            <span className="path1"></span>
                            <span className="path2"></span>
                            <span className="path3"></span>
                        </i>
                        <div className="d-flex flex-column">
                            <h4 className="mb-1 text-warning">Pending Change Requests</h4>
                            <span>This merchant has {pendingChangeRequests} pending change request{pendingChangeRequests > 1 ? 's' : ''} that need review.</span>
                            <div className="mt-2">
                                <button 
                                    onClick={(e) => { e.preventDefault(); setActiveTab('change-requests'); }} 
                                    className="btn btn-warning btn-sm"
                                >
                                    <i className="ki-duotone ki-eye fs-5">
                                        <span className="path1"></span>
                                        <span className="path2"></span>
                                        <span className="path3"></span>
                                    </i>
                                    Review Changes
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tab Content */}
                {activeTab === 'overview' && (
                    <>
                        {/* Basic Information */}
                        <div className="row">
                            <div className="col-lg-12">
                                <div className="card mb-5 mb-xl-10">
                                    <div className="card-header cursor-pointer">
                                        <div className="card-title m-0">
                                            <h3 className="fw-bolder m-0">Basic Information</h3>
                                        </div>
                                    </div>

                                    <div className="card-body p-9">
                                        <div className="row mb-7">
                                            <label className="col-lg-4 fw-bold text-muted">Business Name</label>
                                            <div className="col-lg-8">
                                                <span className="fs-6 text-gray-800">{merchant.business_name || merchant.name || 'N/A'}</span>
                                            </div>
                                        </div>

                                        <div className="row mb-7">
                                            <label className="col-lg-4 fw-bold text-muted">Owner Name</label>
                                            <div className="col-lg-8">
                                                <span className="fs-6 text-gray-800">{merchant.owner_name || 'N/A'}</span>
                                            </div>
                                        </div>

                                        <div className="row mb-7">
                                            <label className="col-lg-4 fw-bold text-muted">Email</label>
                                            <div className="col-lg-8">
                                                <span className="text-gray-800 fs-6">{merchant.email}</span>
                                            </div>
                                        </div>

                                        <div className="row mb-7">
                                            <label className="col-lg-4 fw-bold text-muted">Phone</label>
                                            <div className="col-lg-8">
                                                <span className="fs-6 text-gray-800">{merchant.phone}</span>
                                            </div>
                                        </div>

                                        <div className="row mb-7">
                                            <label className="col-lg-4 fw-bold text-muted">Business Type</label>
                                            <div className="col-lg-8">
                                                <span className="fs-6 text-gray-800">
                                                    {merchant.business_type ? merchant.business_type.charAt(0).toUpperCase() + merchant.business_type.slice(1) : 'N/A'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="row mb-7">
                                            <label className="col-lg-4 fw-bold text-muted">Plan</label>
                                            <div className="col-lg-8">
                                                {merchant.plan ? (
                                                    <span className="badge badge-light-info fs-6 px-3 py-2">
                                                        {merchant.plan.name || merchant.plan.text || 'N/A'}
                                                        {merchant.plan.price && (
                                                            <span className="ms-2">
                                                                - ${parseFloat(merchant.plan.price).toFixed(2)} / {merchant.plan.plan_type || 'Monthly'}
                                                            </span>
                                                        )}
                                                    </span>
                                                ) : (
                                                    <span className="fs-6 text-gray-800">No Plan Assigned</span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="row mb-7">
                                            <label className="col-lg-4 fw-bold text-muted">Address</label>
                                            <div className="col-lg-8">
                                                <span className="fs-6 text-gray-800">{merchant.address || 'N/A'}</span>
                                            </div>
                                        </div>

                                        <div className="row mb-7">
                                            <label className="col-lg-4 fw-bold text-muted">Country</label>
                                            <div className="col-lg-8">
                                                <span className="fs-6 text-gray-800">{getCountryName(merchant)}</span>
                                            </div>
                                        </div>

                                        <div className="row mb-7">
                                            <label className="col-lg-4 fw-bold text-muted">City</label>
                                            <div className="col-lg-8">
                                                <span className="fs-6 text-gray-800">{getCityName(merchant)}</span>
                                            </div>
                                        </div>

                                        <div className="row mb-7">
                                            <label className="col-lg-4 fw-bold text-muted">Merchant Code</label>
                                            <div className="col-lg-8">
                                                <span className="fs-6 text-gray-800">{merchant.merchant_code || 'N/A'}</span>
                                            </div>
                                        </div>

                                        {merchant.trade_license_number && (
                                            <div className="row mb-7">
                                                <label className="col-lg-4 fw-bold text-muted">Trade License Number</label>
                                                <div className="col-lg-8">
                                                    <span className="fs-6 text-gray-800">{merchant.trade_license_number}</span>
                                                </div>
                                            </div>
                                        )}

                                        <div className="row mb-7">
                                            <label className="col-lg-4 fw-bold text-muted">Tax Number</label>
                                            <div className="col-lg-8">
                                                <span className="fs-6 text-gray-800">{merchant.tax_number || 'N/A'}</span>
                                            </div>
                                        </div>

                                        <div className="row mb-7">
                                            <label className="col-lg-4 fw-bold text-muted">Scopes</label>
                                            <div className="col-lg-8">
                                                {merchant.scopes && Array.isArray(merchant.scopes) && merchant.scopes.length > 0 ? (
                                                    <div className="d-flex flex-wrap gap-2">
                                                        {merchant.scopes.map((scopeKey, index) => (
                                                            <span 
                                                                key={index}
                                                                className="badge badge-light-primary fs-7 px-3 py-2"
                                                            >
                                                                <i className="ki-duotone ki-check-circle fs-6 me-1">
                                                                    <span className="path1"></span>
                                                                    <span className="path2"></span>
                                                                </i>
                                                                {getScopeLabel(scopeKey)}
                                                            </span>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="fs-6 text-muted">No scopes assigned</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Associated User & Events */}
                        {merchant.user ? (
                            <div className="row">
                                {/* Associated User Account */}
                                <div className="col-lg-8">
                                    <div className="card mb-5 mb-xl-10">
                                        <div className="card-header cursor-pointer">
                                            <div className="card-title m-0">
                                                <h3 className="fw-bolder m-0">Associated User Account</h3>
                                            </div>
                                        </div>

                                    <div className="card-body p-9">
                                        <div className="row mb-7">  
                                            <label className="col-lg-4 fw-bold text-muted">Full Name</label>
                                            <div className="col-lg-8">
                                                <span className="fs-6 text-gray-800">{merchant.user?.name || 'N/A'}</span>
                                            </div>
                                        </div>

                                        <div className="row mb-7">
                                            <label className="col-lg-4 fw-bold text-muted">Username</label>
                                            <div className="col-lg-8">
                                                <span className="fs-6 text-gray-800">
                                                    {merchant.user?.user_name || 'N/A'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="row mb-7">
                                            <label className="col-lg-4 fw-bold text-muted">User Email</label>
                                            <div className="col-lg-8">
                                                <span className="fs-6 text-gray-800">{merchant.user?.email || 'N/A'}</span>
                                            </div>
                                        </div>

                                        <div className="row mb-7">
                                            <label className="col-lg-4 fw-bold text-muted">User Phone</label>
                                            <div className="col-lg-8">
                                                <span className="fs-6 text-gray-800">{merchant.user?.phone || 'N/A'}</span>
                                            </div>
                                        </div>

                                        <div className="row mb-7">
                                            <label className="col-lg-4 fw-bold text-muted">User Status</label>
                                            <div className="col-lg-8">
                                                <span className={`badge ${merchant.user?.is_active ? 'badge-light-success' : 'badge-light-danger'}`}>
                                                    {merchant.user?.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="row mb-7">
                                            <label className="col-lg-4 fw-bold text-muted">User Created</label>
                                            <div className="col-lg-8">
                                                <span className="fs-6 text-gray-800">
                                                    {merchant.user?.created_at ? new Date(merchant.user.created_at).toLocaleString() : 'N/A'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    </div>
                                </div>

                                {/* Events Card */}
                                <div className="col-md-4">
                                    <div className="card card-xl-stretch mb-xl-10">
                                        <div className="card-header align-items-center border-0 mt-4">
                                            <h3 className="card-title align-items-start flex-column">
                                                <span className="fw-bolder mb-2 text-dark">Events</span>
                                                <span className="text-muted fw-bold fs-7">
                                                    {tabData.events?.length || 0} recent events
                                                </span>
                                            </h3>
                                        </div>

                                        <div className="card-body pt-5">
                                            <div className="timeline-label">
                                                {tabData.events && tabData.events.length > 0 ? (
                                                    tabData.events.slice(0, 5).map((event, index) => (
                                                        <div key={index} className="timeline-item mb-5">
                                                            <div className="timeline-label fw-bolder text-gray-800 fs-6" style={{ width: '100px' }}>
                                                                {new Date(event.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </div>
                                                            <div className="timeline-badge">
                                                                <i className={`fa fa-circle text-${event.action === 'approved' ? 'success' : event.action === 'rejected' ? 'danger' : 'warning'} fs-6`}></i>
                                                            </div>
                                                            <div className="fw-normal timeline-content text-muted ps-3">
                                                                <span className="fw-bold text-gray-800">{event.action}</span>
                                                                {event.metadata?.message && (
                                                                    <div className="fs-7 mt-1">{event.metadata.message}</div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="text-muted fs-6">No recent events</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="col-lg-12">
                                <div className="card mb-5 mb-xl-10">
                                    <div className="card-body p-9">
                                        <div className="alert alert-warning d-flex align-items-center p-5">
                                            <i className="ki-duotone ki-information-5 fs-2hx text-warning me-4">
                                                <span className="path1"></span>
                                                <span className="path2"></span>
                                                <span className="path3"></span>
                                            </i>
                                            <div className="d-flex flex-column">
                                                <h4 className="mb-1 text-warning">No User Account Associated</h4>
                                                <span>This merchant does not have an associated user account yet.</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* Events Tab */}
                {activeTab === 'events' && (
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Merchant Events</h3>
                        </div>
                        <div className="card-body">
                            {tabLoading ? (
                                <LoadingSkeleton />
                            ) : tabData.events && tabData.events.length > 0 ? (
                                <div className="timeline-label">
                                    {tabData.events.map((event, index) => (
                                        <div key={index} className="timeline-item mb-8">
                                            <div className="timeline-label fw-bolder text-gray-800 fs-6" style={{ width: '150px' }}>
                                                {new Date(event.created_at).toLocaleDateString()}<br/>
                                                {new Date(event.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                            <div className="timeline-badge">
                                                <i className={`fa fa-genderless text-${event.action === 'approved' ? 'success' : event.action === 'rejected' ? 'danger' : event.action === 'suspended' ? 'dark' : 'warning'} fs-1`}></i>
                                            </div>
                                            <div className="fw-normal timeline-content text-muted ps-3">
                                                <span className="fw-bold fs-6 text-gray-800">{event.action}</span>
                                                {event.metadata?.message && (
                                                    <div className="fs-7 mt-2 text-gray-600">{event.metadata.message}</div>
                                                )}
                                                {event.user_id && (
                                                    <div className="fs-8 mt-1 text-muted">By: {event.metadata?.approved_by || event.metadata?.rejected_by || event.metadata?.suspended_by || 'System'}</div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="alert alert-info">No events found for this merchant</div>
                            )}
                        </div>
                    </div>
                )}

                {/* Branches Tab */}
                {activeTab === 'branches' && (
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Merchant Branches</h3>
                        </div>
                        <div className="card-body">
                            {tabLoading ? (
                                <LoadingSkeleton />
                            ) : tabData.branches.length > 0 ? (
                                <div className="table-responsive">
                                    <table className="table table-row-bordered gy-5">
                                        <thead>
                                            <tr className="fw-bold fs-6 text-gray-800">
                                                <th>Branch Name</th>
                                                <th>Location</th>
                                                <th>Phone</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {tabData.branches.map((branch) => (
                                                <tr key={branch.id}>
                                                    <td>{branch.name}</td>
                                                    <td>{branch.address || 'N/A'}</td>
                                                    <td>{branch.phone || 'N/A'}</td>
                                                    <td>
                                                        <span className={`badge ${branch.is_active ? 'badge-light-success' : 'badge-light-danger'}`}>
                                                            {branch.is_active ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="alert alert-info">No branches found for this merchant</div>
                            )}
                        </div>
                    </div>
                )}

                {/* Terminals Tab */}
                {activeTab === 'terminals' && (
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Merchant Terminals</h3>
                        </div>
                        <div className="card-body">
                            {tabLoading ? (
                                <LoadingSkeleton />
                            ) : tabData.terminals.length > 0 ? (
                                <div className="table-responsive">
                                    <table className="table table-row-bordered gy-5">
                                        <thead>
                                            <tr className="fw-bold fs-6 text-gray-800">
                                                <th>Terminal ID</th>
                                                <th>Serial Number</th>
                                                <th>Branch</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {tabData.terminals.map((terminal) => (
                                                <tr key={terminal.id}>
                                                    <td>{terminal.terminal_id}</td>
                                                    <td>{terminal.serial_number || 'N/A'}</td>
                                                    <td>{terminal.branch?.name || 'N/A'}</td>
                                                    <td>
                                                        <span className={`badge ${terminal.status === 'active' ? 'badge-light-success' : 'badge-light-danger'}`}>
                                                            {terminal.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="alert alert-info">No terminals found for this merchant</div>
                            )}
                        </div>
                    </div>
                )}

                {/* Users Tab */}
                {activeTab === 'users' && (
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Merchant Users</h3>
                        </div>
                        <div className="card-body">
                            {tabLoading ? (
                                <LoadingSkeleton />
                            ) : tabData.users.length > 0 ? (
                                <div className="table-responsive">
                                    <table className="table table-row-bordered gy-5">
                                        <thead>
                                            <tr className="fw-bold fs-6 text-gray-800">
                                                <th>Name</th>
                                                <th>Email</th>
                                                <th>Phone</th>
                                                <th>Role</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {tabData.users.map((user) => (
                                                <tr key={user.id}>
                                                    <td>{user.name}</td>
                                                    <td>{user.email}</td>
                                                    <td>{user.phone || 'N/A'}</td>
                                                    <td>{user.role || 'N/A'}</td>
                                                    <td>
                                                        <span className={`badge ${user.is_active ? 'badge-light-success' : 'badge-light-danger'}`}>
                                                            {user.is_active ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="alert alert-info">No users found for this merchant</div>
                            )}
                        </div>
                    </div>
                )}

                {/* Transactions Tab */}
                {activeTab === 'transactions' && (
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Merchant Transactions</h3>
                        </div>
                        <div className="card-body">
                            <div className="alert alert-info">
                                Transactions tab will display merchant's transaction history. Integration coming soon.
                            </div>
                        </div>
                    </div>
                )}

                {/* Attachments Tab */}
                {activeTab === 'attachments' && (
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Merchant Attachments</h3>
                        </div>
                        <div className="card-body">
                            {tabLoading ? (
                                <LoadingSkeleton />
                            ) : tabData.attachments && tabData.attachments.length > 0 ? (
                                <div className="table-responsive">
                                    <table className="table table-row-bordered gy-5">
                                        <thead>
                                            <tr className="fw-bold fs-6 text-gray-800">
                                                <th>Attachment</th>
                                                <th>Name</th>
                                                <th>Type</th>
                                                <th>Category</th>
                                                <th>Uploaded Date</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {tabData.attachments.map((attachment) => {
                                                const attachmentUrl = resolveAuthAssetUrl(attachment.url || attachment.path || attachment.attachment_url);
                                                const isImage = attachment.type === 'image' || 
                                                               (attachment.url && /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(attachment.url));
                                                const isPdf = attachment.url && /\.pdf$/i.test(attachment.url);
                                                const fileName = attachment.url ? attachment.url.split('/').pop() : (attachment.url_type || 'Document');
                                                const displayName = attachment.title || formatAttachmentName(attachment.url_type) || formatAttachmentName(fileName) || 'Document';
                                                
                                                return (
                                                    <tr key={attachment.id || attachment.url}>
                                                        <td>
                                                            {isImage && attachmentUrl ? (
                                                                <div className="symbol symbol-50px position-relative">
                                                                    <img 
                                                                        src={attachmentUrl} 
                                                                        alt={displayName}
                                                                        className="rounded symbol-label"
                                                                        style={{ maxWidth: '80px', maxHeight: '80px', objectFit: 'cover' }}
                                                                        onError={(e) => {
                                                                            e.target.style.display = 'none';
                                                                            const fallback = e.target.parentElement.querySelector('.image-fallback');
                                                                            if (fallback) fallback.style.display = 'flex';
                                                                        }}
                                                                    />
                                                                    <div className="symbol-label bg-light-primary d-none align-items-center justify-content-center image-fallback" style={{ display: 'none' }}>
                                                                        <i className="ki-duotone ki-file fs-2x text-primary">
                                                                            <span className="path1"></span>
                                                                            <span className="path2"></span>
                                                                        </i>
                                                                    </div>
                                                                </div>
                                                            ) : isPdf ? (
                                                                <div className="symbol symbol-50px">
                                                                    <div className="symbol-label bg-light-danger d-flex align-items-center justify-content-center">
                                                                        <i className="ki-duotone ki-file fs-2x text-danger">
                                                                            <span className="path1"></span>
                                                                            <span className="path2"></span>
                                                                        </i>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="symbol symbol-50px">
                                                                    <div className="symbol-label bg-light-primary d-flex align-items-center justify-content-center">
                                                                        <i className="ki-duotone ki-file fs-2x text-primary">
                                                                            <span className="path1"></span>
                                                                            <span className="path2"></span>
                                                                        </i>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td>
                                                            <span className="fw-bold text-gray-800">{displayName}</span>
                                                        </td>
                                                        <td>
                                                            <span className="badge badge-light-info">
                                                                {attachment.type ? attachment.type.charAt(0).toUpperCase() + attachment.type.slice(1) : 'Document'}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <span className="text-gray-600">
                                                                {formatAttachmentName(attachment.url_type)}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <span className="text-gray-600">
                                                                {attachment.created_at ? new Date(attachment.created_at).toLocaleDateString() : 'N/A'}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <div className="d-flex gap-2">
                                                                {attachmentUrl && (
                                                                    <>
                                                                        <a 
                                                                            href={attachmentUrl} 
                                                                            target="_blank" 
                                                                            rel="noreferrer"
                                                                            className="btn btn-icon btn-light-primary btn-sm"
                                                                            title="View"
                                                                        >
                                                                            <i className="ki-duotone ki-eye fs-5">
                                                                                <span className="path1"></span>
                                                                                <span className="path2"></span>
                                                                                <span className="path3"></span>
                                                                            </i>
                                                                        </a>
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.preventDefault();
                                                                                handleDownloadAttachment(attachment);
                                                                            }}
                                                                            className="btn btn-icon btn-light-success btn-sm"
                                                                            title="Download"
                                                                        >
                                                                            <i className="ki-duotone ki-file-down fs-5">
                                                                                <span className="path1"></span>
                                                                                <span className="path2"></span>
                                                                            </i>
                                                                        </button>
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.preventDefault();
                                                                                handleDeleteAttachment(attachment);
                                                                            }}
                                                                            className="btn btn-icon btn-light-danger btn-sm"
                                                                            title="Delete"
                                                                        >
                                                                            <i className="ki-duotone ki-trash fs-5">
                                                                                <span className="path1"></span>
                                                                                <span className="path2"></span>
                                                                                <span className="path3"></span>
                                                                                <span className="path4"></span>
                                                                                <span className="path5"></span>
                                                                            </i>
                                                                        </button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="alert alert-info">No attachments found for this merchant</div>
                            )}
                        </div>
                    </div>
                )}

                {/* Change Requests Tab */}
                {activeTab === 'change-requests' && (
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Change Requests</h3>
                        </div>
                        <div className="card-body">
                            {tabLoading ? (
                                <LoadingSkeleton />
                            ) : tabData.changeRequests && tabData.changeRequests.length > 0 ? (
                                <div className="table-responsive">
                                    <table className="table table-row-bordered gy-5">
                                        <thead>
                                            <tr className="fw-bold fs-6 text-gray-800">
                                                <th>Field</th>
                                                <th>Old Value</th>
                                                <th>New Value</th>
                                                <th>Status</th>
                                                <th>Requested At</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {tabData.changeRequests.map((request) => (
                                                <tr key={request.id}>
                                                    <td>{request.field_name}</td>
                                                    <td>{request.old_value || 'N/A'}</td>
                                                    <td>{request.new_value || 'N/A'}</td>
                                                    <td>
                                                        <span className={`badge ${request.status === 'pending' ? 'badge-light-warning' : request.status === 'approved' ? 'badge-light-success' : 'badge-light-danger'}`}>
                                                            {request.status}
                                                        </span>
                                                    </td>
                                                    <td>{new Date(request.created_at).toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="alert alert-info">No change requests found for this merchant</div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Styles */}
            <style>{`
                .skeleton {
                    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                    background-size: 200% 100%;
                    animation: loading 1.5s ease-in-out infinite;
                    border-radius: 4px;
                }
                .skeleton-circle {
                    border-radius: 50%;
                }
                .skeleton-text {
                    border-radius: 4px;
                }
                @keyframes loading {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }
                
                .timeline-label {
                    position: relative;
                }
                .timeline-label:before {
                    content: '';
                    position: absolute;
                    left: 101px;
                    top: 0;
                    bottom: 0;
                    width: 2px;
                    background-color: #e4e6ef;
                }
                .timeline-item {
                    display: flex;
                    align-items: flex-start;
                    position: relative;
                }
                .timeline-badge {
                    width: 30px;
                    height: 30px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: white;
                    border-radius: 50%;
                    position: relative;
                    z-index: 1;
                }
                .timeline-content {
                    flex: 1;
                    padding-left: 1rem;
                }
            `}</style>
        </div>
    );
};

export default AdminMerchantView;

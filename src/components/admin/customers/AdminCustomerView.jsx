import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import { useToolbar } from '../../../contexts/ToolbarContext';
import { useCan } from '../../../utils/permissions';
import useAuthStore from '../../../stores/authStore';
import LoadingSpinner from '../../common/LoadingSpinner';
import ErrorAlert from '../../common/ErrorAlert';
import {
    fetchAdminCustomer,
    deleteAdminCustomer,
    useAdminCustomerTransactions,
} from '../../../services/adminCustomersService';
import CustomerLatestTransactions from './CustomerLatestTransactions';
import CustomerTransactionsTab from './CustomerTransactionsTab';
import {
    getCustomerCityName,
    getCustomerCountryName,
    getCustomerStatusBadgeClass,
    getCustomerStatusLabelKey,
} from '../../../utils/customerUtils';

const AdminCustomerView = () => {
    const { formatCurrency } = useAuthStore();
    const { id } = useParams();
    const customerId = id;
    const navigate = useNavigate();
    const location = useLocation();
    const { t, i18n } = useTranslation();
    const { setTitle, setBreadcrumbs, setActions } = useToolbar();
    const canEdit = useCan(['sales.customers.edit_customers', 'edit_customers']);

    const [customer, setCustomer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'overview');

    useEffect(() => {
        if (location.state?.activeTab) {
            setActiveTab(location.state.activeTab);
        }
    }, [location.state?.activeTab]);

    const {
        data: latestTxResponse,
        isLoading: latestTxLoading,
    } = useAdminCustomerTransactions(customerId, { per_page: 5 }, { enabled: Boolean(customerId) });

    const latestTransactions = latestTxResponse?.data || [];

    const locale = i18n.language?.startsWith('ar') ? 'ar-SA' : 'en-US';

    const loadCustomer = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetchAdminCustomer(customerId);
            const isSuccess = response?.success || response?.status;
            if (isSuccess) {
                setCustomer(response.data);
            } else {
                setError(t('customers.failedToFetchCustomerDetails'));
            }
        } catch (err) {
            console.error('Error fetching customer:', err);
            setError(t('common.unexpectedErrorOccurred'));
        } finally {
            setLoading(false);
        }
    }, [customerId, t]);

    useEffect(() => {
        loadCustomer();
    }, [loadCustomer]);

    const handleDelete = useCallback(async () => {
        const result = await Swal.fire({
            title: t('common.areYouSure'),
            text: t('customers.confirmDeleteCustomer', { name: customer?.name }),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: t('common.yesDeleteIt'),
            cancelButtonText: t('common.cancel'),
        });

        if (!result.isConfirmed) return;

        try {
            const response = await deleteAdminCustomer(customerId);
            if (response.success) {
                toast.success(t('customers.customerDeletedSuccessfully'));
                navigate('/admin/customers');
            } else {
                toast.error(response.error || t('customers.failedToDeleteCustomer'));
            }
        } catch (err) {
            console.error('Error deleting customer:', err);
            toast.error(t('common.unexpectedErrorOccurred'));
        }
    }, [customer?.name, customerId, navigate, t]);

    useEffect(() => {
        if (customer) {
            setTitle(t('customers.customerNamed', { name: customer.name }));
            setBreadcrumbs([
                { label: t('admin.sidebar.dashboard'), path: '/admin/dashboard' },
                { label: t('customers.customers'), path: '/admin/customers' },
                { label: customer.name, path: `/admin/customers/${customerId}`, active: true },
            ]);
        }

        setActions(
            <div className="d-flex flex-wrap align-items-center gap-2">
                <Link to="/admin/customers" className="btn btn-sm fw-bold btn-light">
                    <i className="ki-duotone ki-arrow-left fs-3">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    {t('customers.backToCustomers')}
                </Link>
                {canEdit && (
                    <Link to={`/admin/customers/${customerId}/edit`} className="btn btn-sm fw-bold btn-primary">
                        <i className="ki-duotone ki-pencil fs-3">
                            <span className="path1"></span>
                            <span className="path2"></span>
                        </i>
                        {t('customers.editCustomerBtn')}
                    </Link>
                )}
                {canEdit && customer?.status !== 'deleted' && (
                    <Link to={`/admin/customers/${customerId}/edit`} className="btn btn-sm fw-bold btn-warning">
                        <i className="ki-duotone ki-setting-2 fs-3">
                            <span className="path1"></span>
                            <span className="path2"></span>
                        </i>
                        {t('customers.changeStatus')}
                    </Link>
                )}
                <button className="btn btn-sm fw-bold btn-danger" onClick={handleDelete} disabled={!customer}>
                    <i className="ki-duotone ki-trash fs-3">
                        <span className="path1"></span>
                        <span className="path2"></span>
                        <span className="path3"></span>
                        <span className="path4"></span>
                        <span className="path5"></span>
                    </i>
                    {t('customers.deleteCustomer')}
                </button>
            </div>
        );

        return () => {
            setTitle(t('admin.sidebar.dashboard'));
            setBreadcrumbs([]);
            setActions(null);
        };
    }, [customer, customerId, canEdit, handleDelete, setTitle, setBreadcrumbs, setActions, t]);

    const formatDate = (dateString) => {
        if (!dateString) return t('customers.na');
        return new Date(dateString).toLocaleDateString(locale, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getCountryName = (country) => {
        if (!country) return t('customers.na');
        return getCustomerCountryName({ country, country_name: country.name }) || t('customers.na');
    };

    const formatAddress = (c) => {
        const parts = [c.address, getCustomerCityName(c), c.countryName || getCustomerCountryName(c)].filter(
            (part) => part && part !== t('customers.na')
        );
        return parts.length ? parts.join(', ') : t('customers.noAddressProvided');
    };

    if (loading) {
        return (
            <div className="post d-flex flex-column-fluid" id="kt_post">
                <div id="kt_content_container" className="container-fluid">
                    <LoadingSpinner />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="post d-flex flex-column-fluid" id="kt_post">
                <div id="kt_content_container" className="container-fluid">
                    <ErrorAlert error={error} onClose={() => navigate('/admin/customers')} />
                </div>
            </div>
        );
    }

    if (!customer) {
        return (
            <div className="post d-flex flex-column-fluid" id="kt_post">
                <div id="kt_content_container" className="container-fluid">
                    <div className="alert alert-warning">{t('customers.customerNotFound')}</div>
                </div>
            </div>
        );
    }

    const customerStatus = customer.status || 'pending';
    const profileImage = customer.profile_image_url || customer.profile_image;
    const statusDescription = {
        pending: t('customers.accountPendingDescription'),
        active: t('customers.accountActiveDescription'),
        suspended: t('customers.accountSuspendedDescription'),
        inactive: t('customers.accountInactiveDescription'),
    }[customerStatus] || t('customers.accountInactiveDescription');
    const statusLabel = t(getCustomerStatusLabelKey(customerStatus));
    const statusBadgeClass = getCustomerStatusBadgeClass(customerStatus);
    const walletBalance = Number(customer.balance || 0);

    return (
        <div className="post d-flex flex-column-fluid" id="kt_post">
            <div id="kt_content_container" className="container-fluid">
                <div className="d-flex flex-column flex-xl-row">
                    {/* Sidebar */}
                    <div className="flex-column flex-lg-row-auto w-100 w-xl-350px mb-10">
                        <div className="card mb-5 mb-xl-8">
                            <div className="card-body pt-15">
                                <div className="d-flex flex-center flex-column mb-5">
                                    <div className="symbol symbol-150px symbol-circle mb-7 overflow-hidden">
                                        {profileImage ? (
                                            <img
                                                src={profileImage}
                                                alt={customer.name}
                                                className="symbol-label object-fit-cover"
                                            />
                                        ) : (
                                            <div className="symbol-label fs-2x fw-bold bg-light-primary text-primary">
                                                {customer.name?.charAt(0).toUpperCase() || 'C'}
                                            </div>
                                        )}
                                    </div>
                                    <span className="fs-3 text-gray-800 fw-bold mb-1">{customer.name}</span>
                                    <a
                                        href={`mailto:${customer.email}`}
                                        className="fs-5 fw-semibold text-muted text-hover-primary mb-6"
                                    >
                                        {customer.email}
                                    </a>
                                </div>

                                <div className="d-flex flex-stack fs-4 py-3">
                                    <div className="fw-bold">{t('customers.details')}</div>
                                    <div className={`badge ${statusBadgeClass} d-inline`}>
                                        {statusLabel}
                                    </div>
                                </div>
                                <div className="separator separator-dashed my-3"></div>

                                <div className="pb-5 fs-6">
                                    <div className="fw-bold mt-5">{t('customers.customerIdLabel')}</div>
                                    <div className="text-gray-600 text-break">{customer.id}</div>

                                    <div className="fw-bold mt-5">{t('common.email')}</div>
                                    <div className="text-gray-600">
                                        <a href={`mailto:${customer.email}`} className="text-gray-600 text-hover-primary">
                                            {customer.email}
                                        </a>
                                    </div>

                                    <div className="fw-bold mt-5">{t('common.phone')}</div>
                                    <div className="text-gray-600">
                                        {customer.phone ? (
                                            <a href={`tel:${customer.phone}`} className="text-gray-600 text-hover-primary">
                                                {customer.phone}
                                            </a>
                                        ) : (
                                            t('customers.noPhoneProvided')
                                        )}
                                    </div>

                                    <div className="fw-bold mt-5">{t('customers.nationalId')}</div>
                                    <div className="text-gray-600">
                                        {customer.national_id || t('customers.na')}
                                    </div>

                                    <div className="fw-bold mt-5">{t('common.address')}</div>
                                    <div className="text-gray-600">{formatAddress(customer)}</div>

                                    <div className="fw-bold mt-5">{t('common.country')}</div>
                                    <div className="text-gray-600">{customer.countryName || getCustomerCountryName(customer) || t('customers.na')}</div>

                                    <div className="fw-bold mt-5">{t('customers.walletBalance')}</div>
                                    <div className="text-gray-600">{formatCurrency(walletBalance)}</div>

                                    <div className="fw-bold mt-5">{t('common.created')}</div>
                                    <div className="text-gray-600">{formatDate(customer.created_at)}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-lg-row-fluid ms-lg-15">
                        <ul
                            className="nav nav-custom nav-tabs nav-line-tabs nav-line-tabs-2x border-0 fs-4 fw-semibold mb-8"
                            role="tablist"
                        >
                            <li className="nav-item" role="presentation">
                                <a
                                    className={`nav-link text-active-primary pb-4 ${activeTab === 'overview' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('overview')}
                                    role="tab"
                                    style={{ cursor: 'pointer' }}
                                >
                                    {t('customers.overview')}
                                </a>
                            </li>
                            <li className="nav-item" role="presentation">
                                <a
                                    className={`nav-link text-active-primary pb-4 ${activeTab === 'general' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('general')}
                                    role="tab"
                                    style={{ cursor: 'pointer' }}
                                >
                                    {t('customers.generalSettings')}
                                </a>
                            </li>
                            <li className="nav-item" role="presentation">
                                <a
                                    className={`nav-link text-active-primary pb-4 ${activeTab === 'transactions' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('transactions')}
                                    role="tab"
                                    style={{ cursor: 'pointer' }}
                                    data-testid="customer-transactions-tab-link"
                                >
                                    {t('customers.transactions')}
                                </a>
                            </li>
                            <li className="nav-item" role="presentation">
                                <a
                                    className={`nav-link text-active-primary pb-4 ${activeTab === 'advanced' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('advanced')}
                                    role="tab"
                                    style={{ cursor: 'pointer' }}
                                >
                                    {t('customers.advancedSettings')}
                                </a>
                            </li>
                        </ul>

                        <div className="tab-content">
                            {activeTab === 'overview' && (
                                <div className="tab-pane fade show active">
                                    <div className="row row-cols-1 row-cols-md-2 mb-6 mb-xl-9">
                                        <div className="col">
                                            <div className="card pt-4 h-md-100 mb-6 mb-md-0">
                                                <div className="card-header border-0">
                                                    <div className="card-title">
                                                        <h2 className="fw-bold">{t('customers.accountStatus')}</h2>
                                                    </div>
                                                </div>
                                                <div className="card-body pt-0">
                                                    <div className="fw-bold fs-2">
                                                        <div className="d-flex">
                                                            <i
                                                                className={`ki-duotone ki-${customerStatus === 'active' ? 'check-circle text-success' : 'information-2 text-warning'} fs-2x`}
                                                            >
                                                                <span className="path1"></span>
                                                                <span className="path2"></span>
                                                            </i>
                                                            <div className="ms-2">
                                                                {statusLabel}
                                                                <span className="text-muted fs-4 fw-semibold d-block">
                                                                    {t('customers.customerAccount')}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="fs-7 fw-normal text-muted mt-3">
                                                            {statusDescription}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="col">
                                            <div className="card bg-info hoverable h-md-100">
                                                <div className="card-body">
                                                    <i className="ki-duotone ki-wallet text-white fs-3x ms-n1">
                                                        <span className="path1"></span>
                                                        <span className="path2"></span>
                                                        <span className="path3"></span>
                                                        <span className="path4"></span>
                                                    </i>
                                                    <div className="text-white fw-bold fs-2 mt-5">
                                                        {formatCurrency(walletBalance)}
                                                    </div>
                                                    <div className="fw-semibold text-white">{t('customers.walletBalance')}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="card pt-4 mb-6 mb-xl-9">
                                        <div className="card-header border-0">
                                            <div className="card-title">
                                                <h2>{t('customers.customerInformation')}</h2>
                                            </div>
                                            {canEdit && (
                                                <div className="card-toolbar">
                                                    <Link
                                                        to={`/admin/customers/${customerId}/edit`}
                                                        className="btn btn-sm btn-light-primary"
                                                    >
                                                        <i className="ki-duotone ki-pencil fs-3">
                                                            <span className="path1"></span>
                                                            <span className="path2"></span>
                                                        </i>
                                                        {t('customers.editCustomerBtn')}
                                                    </Link>
                                                </div>
                                            )}
                                        </div>
                                        <div className="card-body pt-0 pb-5">
                                            <div className="table-responsive">
                                                <table className="table align-middle table-row-dashed gy-5">
                                                    <tbody className="fs-6 fw-semibold text-gray-600">
                                                        <tr>
                                                            <td className="text-muted min-w-125px w-125px">
                                                                {t('customers.customerIdLabel')}
                                                            </td>
                                                            <td className="text-gray-800 text-break">{customer.id}</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="text-muted min-w-125px w-125px">{t('common.name')}</td>
                                                            <td className="text-gray-800">{customer.name}</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="text-muted min-w-125px w-125px">{t('common.email')}</td>
                                                            <td className="text-gray-800">
                                                                <a
                                                                    href={`mailto:${customer.email}`}
                                                                    className="text-gray-900 text-hover-primary"
                                                                >
                                                                    {customer.email}
                                                                </a>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td className="text-muted min-w-125px w-125px">{t('common.phone')}</td>
                                                            <td className="text-gray-800">
                                                                {customer.phone || t('customers.noPhoneProvided')}
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td className="text-muted min-w-125px w-125px">{t('common.address')}</td>
                                                            <td className="text-gray-800">{formatAddress(customer)}</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="text-muted min-w-125px w-125px">{t('common.status')}</td>
                                                            <td className="text-gray-800">
                                                                <span className={`badge ${statusBadgeClass}`}>
                                                                    {statusLabel}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td className="text-muted min-w-125px w-125px">
                                                                {t('customers.walletBalance')}
                                                            </td>
                                                            <td className="text-gray-800">{formatCurrency(walletBalance)}</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="text-muted min-w-125px w-125px">{t('common.created')}</td>
                                                            <td className="text-gray-800">{formatDate(customer.created_at)}</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="text-muted min-w-125px w-125px">
                                                                {t('customers.lastUpdated')}
                                                            </td>
                                                            <td className="text-gray-800">{formatDate(customer.updated_at)}</td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>

                                    <CustomerLatestTransactions
                                        customerId={customerId}
                                        transactions={latestTransactions}
                                        isLoading={latestTxLoading}
                                        currencyCode={customer.currency_code || 'SDG'}
                                        onViewAll={() => setActiveTab('transactions')}
                                    />

                                </div>
                            )}

                            {activeTab === 'general' && (
                                <div className="tab-pane fade show active">
                                    <div className="card pt-4 mb-6 mb-xl-9">
                                        <div className="card-header border-0">
                                            <div className="card-title">
                                                <h2>{t('customers.profileInformation')}</h2>
                                            </div>
                                            {canEdit && (
                                                <div className="card-toolbar">
                                                    <Link
                                                        to={`/admin/customers/${customerId}/edit`}
                                                        className="btn btn-sm btn-light-primary"
                                                    >
                                                        <i className="ki-duotone ki-pencil fs-3">
                                                            <span className="path1"></span>
                                                            <span className="path2"></span>
                                                        </i>
                                                        {t('customers.editCustomerBtn')}
                                                    </Link>
                                                </div>
                                            )}
                                        </div>
                                        <div className="card-body pt-0 pb-5">
                                            <div className="table-responsive">
                                                <table className="table align-middle table-row-dashed gy-5">
                                                    <tbody className="fs-6 fw-semibold text-gray-600">
                                                        <tr>
                                                            <td className="text-muted min-w-125px w-125px">
                                                                {t('customers.fullName')}
                                                            </td>
                                                            <td className="text-gray-800">{customer.name}</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="text-muted min-w-125px w-125px">
                                                                {t('customers.emailAddress')}
                                                            </td>
                                                            <td className="text-gray-800">{customer.email}</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="text-muted min-w-125px w-125px">
                                                                {t('customers.phoneNumber')}
                                                            </td>
                                                            <td className="text-gray-800">
                                                                {customer.phone || t('customers.na')}
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td className="text-muted min-w-125px w-125px">{t('common.country')}</td>
                                                            <td className="text-gray-800">{customer.countryName || getCustomerCountryName(customer) || t('customers.na')}</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="text-muted min-w-125px w-125px">{t('customers.city')}</td>
                                                            <td className="text-gray-800">{customer.cityName || getCustomerCityName(customer) || t('customers.na')}</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="text-muted min-w-125px w-125px">
                                                                {t('customers.streetAddress')}
                                                            </td>
                                                            <td className="text-gray-800">{customer.address || t('customers.na')}</td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'transactions' && (
                                <div className="tab-pane fade show active">
                                    <CustomerTransactionsTab
                                        customerId={customerId}
                                        currencyCode={customer.currency_code || 'SDG'}
                                    />
                                </div>
                            )}

                            {activeTab === 'advanced' && (
                                <div className="tab-pane fade show active">
                                    <div className="card pt-4 mb-6 mb-xl-9">
                                        <div className="card-header border-0">
                                            <div className="card-title">
                                                <h2>{t('customers.securityDetails')}</h2>
                                            </div>
                                        </div>
                                        <div className="card-body pt-0 pb-5">
                                            <div className="table-responsive">
                                                <table className="table align-middle table-row-dashed gy-5">
                                                    <tbody className="fs-6 fw-semibold text-gray-600">
                                                        <tr>
                                                            <td className="text-muted min-w-125px w-125px">{t('common.phone')}</td>
                                                            <td className="text-gray-800">
                                                                {customer.phone || t('customers.noPhoneProvided')}
                                                            </td>
                                                            <td className="text-end">
                                                                {canEdit && (
                                                                    <Link
                                                                        to={`/admin/customers/${customerId}/edit`}
                                                                        className="btn btn-icon btn-active-light-primary w-30px h-30px ms-auto"
                                                                    >
                                                                        <i className="ki-duotone ki-pencil fs-3">
                                                                            <span className="path1"></span>
                                                                            <span className="path2"></span>
                                                                        </i>
                                                                    </Link>
                                                                )}
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td className="text-muted min-w-125px w-125px">{t('common.status')}</td>
                                                            <td className="text-gray-800">
                                                                <span className={`badge ${statusBadgeClass}`}>
                                                                    {statusLabel}
                                                                </span>
                                                            </td>
                                                            <td className="text-end">
                                                                {canEdit && customerStatus !== 'deleted' && (
                                                                    <Link
                                                                        to={`/admin/customers/${customerId}/edit`}
                                                                        className="btn btn-icon btn-active-light-primary w-30px h-30px ms-auto"
                                                                    >
                                                                        <i className="ki-duotone ki-pencil fs-3">
                                                                            <span className="path1"></span>
                                                                            <span className="path2"></span>
                                                                        </i>
                                                                    </Link>
                                                                )}
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td className="text-muted min-w-125px w-125px">{t('customers.walletBalance')}</td>
                                                            <td className="text-gray-800">{formatCurrency(walletBalance)}</td>
                                                            <td></td>
                                                        </tr>
                                                        <tr>
                                                            <td className="text-muted min-w-125px w-125px">{t('common.created')}</td>
                                                            <td className="text-gray-800">{formatDate(customer.created_at)}</td>
                                                            <td></td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="card pt-4 mb-6 mb-xl-9">
                                        <div className="card-header border-0">
                                            <div className="card-title flex-column">
                                                <h2 className="mb-1">{t('customers.accountStatus')}</h2>
                                                <div className="fs-6 fw-semibold text-muted">
                                                    {statusDescription}
                                                </div>
                                            </div>
                                            {canEdit && customerStatus !== 'deleted' && (
                                                <div className="card-toolbar">
                                                    <Link
                                                        to={`/admin/customers/${customerId}/edit`}
                                                        className="btn btn-sm btn-light-primary"
                                                    >
                                                        {t('customers.changeStatus')}
                                                    </Link>
                                                </div>
                                            )}
                                        </div>
                                        <div className="card-body pb-5">
                                            <div className="d-flex flex-stack">
                                                <div className="d-flex flex-column">
                                                    <span>{t('customers.customerAccount')}</span>
                                                    <span className="text-muted fs-6">{statusLabel}</span>
                                                </div>
                                                <span className={`badge ${statusBadgeClass} fs-7`}>
                                                    {statusLabel}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminCustomerView;

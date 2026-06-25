import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { getCustomer, deleteCustomer } from '../../../services/customersService';
import { useToolbar } from '../../../contexts/ToolbarContext';
import { getModuleBasePath } from '../../../i18n/localePaths';
import LoadingSpinner from '../../common/LoadingSpinner';
import ErrorAlert from '../../common/ErrorAlert';
import Swal from 'sweetalert2';
import useAuthStore from '../../../stores/authStore';
import { formatDate } from '../../../utils/dateUtils';

const CustomerView = () => {
    const { formatCurrency } = useAuthStore();
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { t, i18n } = useTranslation();
    const { setTitle, setBreadcrumbs, setActions } = useToolbar();
    
    const basePath = getModuleBasePath(location.pathname);
    
    const [customer, setCustomer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');

    const locale = i18n.language?.startsWith('ar') ? 'ar-SA' : 'en-US';

    const formatCustomerDate = (dateString) => {
        if (!dateString) return t('customers.na');
        return formatDate(dateString, locale);
    };

    useEffect(() => {
        const fetchCustomerData = async () => {
            setLoading(true);
            setError(null);

            try {
                const response = await getCustomer(id);
                
                if (response.success) {
                    setCustomer(response.data);
                } else {
                    setError(response.error || t('customers.failedToFetchCustomerDetails'));
                }
            } catch (err) {
                console.error('Error fetching customer:', err);
                setError(t('common.unexpectedErrorOccurred'));
            } finally {
                setLoading(false);
            }
        };

        fetchCustomerData();
    }, [id, t]);

    const handleDelete = async () => {
        const result = await Swal.fire({
            title: t('common.areYouSure'),
            text: t('customers.confirmDeleteCustomer', { name: customer?.name }),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: t('common.yesDeleteIt'),
            cancelButtonText: t('common.cancel')
        });

        if (result.isConfirmed) {
            try {
                const response = await deleteCustomer(id);
                
                if (response.success) {
                    toast.success(t('customers.customerDeletedSuccessfully'));
                    navigate(`${basePath}/customers`);
                } else {
                    toast.error(response.error || t('customers.failedToDeleteCustomer'));
                }
            } catch (err) {
                console.error('Error deleting customer:', err);
                toast.error(t('common.unexpectedErrorOccurred'));
            }
        }
    };

    useEffect(() => {
        if (customer) {
            const breadcrumbs = [
                { label: t('common.dashboard'), path: `${basePath}/dashboard` },
                { label: t('customers.customers'), path: `${basePath}/customers` },
                { label: customer.name, path: `${basePath}/customers/${id}`, active: true }
            ];
            
            setTitle(t('customers.customerNamed', { name: customer.name }));
            setBreadcrumbs(breadcrumbs);
            setActions(
                <>
                    <Link
                        to={`${basePath}/customers/${id}/edit`}
                        className="btn btn-sm fw-bold btn-primary me-2"
                    >
                        <i className="ki-duotone ki-pencil fs-3">
                            <span className="path1"></span>
                            <span className="path2"></span>
                        </i>
                        {t('customers.editCustomerBtn')}
                    </Link>
                    <button
                        className="btn btn-sm fw-bold btn-danger"
                        onClick={handleDelete}
                    >
                        <i className="ki-duotone ki-trash fs-3">
                            <span className="path1"></span>
                            <span className="path2"></span>
                            <span className="path3"></span>
                            <span className="path4"></span>
                            <span className="path5"></span>
                        </i>
                        {t('customers.delete')}
                    </button>
                </>
            );
        }
        
        return () => {
            setTitle(t('common.dashboard'));
            setBreadcrumbs([]);
            setActions(null);
        };
    }, [customer, id, basePath, t, i18n.language]);

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
                    <ErrorAlert error={error} onClose={() => navigate(`${basePath}/customers`)} />
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

    return (
        <div className="post d-flex flex-column-fluid" id="kt_post">
            <div id="kt_content_container" className="container-fluid">
                
                <div className="d-flex flex-column flex-xl-row">
                    {/* Sidebar */}
                    <div className="flex-column flex-lg-row-auto w-100 w-xl-350px mb-10">
                        <div className="card mb-5 mb-xl-8">
                            <div className="card-body pt-15">
                                {/* Summary */}
                                <div className="d-flex flex-center flex-column mb-5">
                                    {/* Avatar */}
                                    <div className="symbol symbol-150px symbol-circle mb-7">
                                        <div className="symbol-label fs-2x fw-bold bg-light-primary text-primary">
                                            {customer.name?.charAt(0).toUpperCase() || 'C'}
                                        </div>
                                    </div>
                                    {/* Name */}
                                    <span className="fs-3 text-gray-800 fw-bold mb-1">
                                        {customer.name}
                                    </span>
                                    {/* Email */}
                                    <a href={`mailto:${customer.email}`} className="fs-5 fw-semibold text-muted text-hover-primary mb-6">
                                        {customer.email}
                                    </a>
                                </div>
                                
                                {/* Details toggle */}
                                <div className="d-flex flex-stack fs-4 py-3">
                                    <div className="fw-bold">{t('customers.details')}</div>
                                    <div className="badge badge-light-info d-inline">{t('customers.activeCustomer')}</div>
                                </div>
                                <div className="separator separator-dashed my-3"></div>
                                
                                {/* Details content */}
                                <div className="pb-5 fs-6">
                                    {/* Customer ID */}
                                    <div className="fw-bold mt-5">{t('customers.customerIdLabel')}</div>
                                    <div className="text-gray-600">#{customer.id}</div>
                                    
                                    {/* Email */}
                                    <div className="fw-bold mt-5">{t('common.email')}</div>
                                    <div className="text-gray-600">
                                        <a href={`mailto:${customer.email}`} className="text-gray-600 text-hover-primary">
                                            {customer.email}
                                        </a>
                                    </div>
                                    
                                    {/* Phone */}
                                    <div className="fw-bold mt-5">{t('common.phone')}</div>
                                    <div className="text-gray-600">
                                        {customer.phone || customer.phone_number ? (
                                            <a href={`tel:${customer.phone || customer.phone_number}`} className="text-gray-600 text-hover-primary">
                                                {customer.phone || customer.phone_number}
                                            </a>
                                        ) : t('customers.noPhoneProvided')}
                                    </div>
                                    
                                    {/* Address */}
                                    <div className="fw-bold mt-5">{t('common.address')}</div>
                                    <div className="text-gray-600">
                                        {customer.address || customer.city || customer.state || customer.postal_code || customer.zip ? (
                                            <>
                                                {customer.address && <>{customer.address}<br /></>}
                                                {(customer.city || customer.state || customer.postal_code || customer.zip) && (
                                                    <>{[customer.city, customer.state, customer.postal_code || customer.zip].filter(Boolean).join(', ')}</>
                                                )}
                                            </>
                                        ) : t('customers.noAddressProvided')}
                                    </div>
                                    
                                    {/* Customer Group */}
                                    <div className="fw-bold mt-5">{t('customers.customerGroup')}</div>
                                    <div className="text-gray-600">
                                        {customer.customer_group?.name || t('customers.noGroupAssigned')}
                                    </div>
                                    
                                    {/* Created */}
                                    <div className="fw-bold mt-5">{t('common.created')}</div>
                                    <div className="text-gray-600">{formatCustomerDate(customer.created_at)}</div>
                                    
                                    {/* Last Updated */}
                                    <div className="fw-bold mt-5">{t('customers.lastUpdated')}</div>
                                    <div className="text-gray-600">{formatCustomerDate(customer.updated_at)}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Main Content */}
                    <div className="flex-lg-row-fluid ms-lg-15">
                        {/* Tabs */}
                        <ul className="nav nav-custom nav-tabs nav-line-tabs nav-line-tabs-2x border-0 fs-4 fw-semibold mb-8" role="tablist">
                            <li className="nav-item" role="presentation">
                                <a 
                                    className={`nav-link text-active-primary pb-4 ${activeTab === 'overview' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('overview')}
                                    role="tab"
                                    style={{cursor: 'pointer'}}
                                >
                                    {t('customers.overview')}
                                </a>
                            </li>
                            <li className="nav-item" role="presentation">
                                <a 
                                    className={`nav-link text-active-primary pb-4 ${activeTab === 'general' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('general')}
                                    role="tab"
                                    style={{cursor: 'pointer'}}
                                >
                                    {t('customers.generalSettings')}
                                </a>
                            </li>
                            <li className="nav-item" role="presentation">
                                <a 
                                    className={`nav-link text-active-primary pb-4 ${activeTab === 'advanced' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('advanced')}
                                    role="tab"
                                    style={{cursor: 'pointer'}}
                                >
                                    {t('customers.advancedSettings')}
                                </a>
                            </li>
                        </ul>
                        
                        {/* Tab Content */}
                        <div className="tab-content">
                            {/* Overview Tab */}
                            {activeTab === 'overview' && (
                                <div className="tab-pane fade show active">
                                    <div className="row row-cols-1 row-cols-md-2 mb-6 mb-xl-9">
                                        {/* Account Status Card */}
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
                                                            <i className="ki-duotone ki-check-circle text-success fs-2x">
                                                                <span className="path1"></span>
                                                                <span className="path2"></span>
                                                            </i>
                                                            <div className="ms-2">
                                                                {t('customers.active')}
                                                                <span className="text-muted fs-4 fw-semibold d-block">{t('customers.customerAccount')}</span>
                                                            </div>
                                                        </div>
                                                        <div className="fs-7 fw-normal text-muted mt-3">
                                                            {t('customers.accountActiveDescription')}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Financial Info Card */}
                                        <div className="col">
                                            <div className="card bg-success hoverable h-md-100">
                                                <div className="card-body">
                                                    <i className="ki-duotone ki-dollar text-white fs-3x ms-n1">
                                                        <span className="path1"></span>
                                                        <span className="path2"></span>
                                                        <span className="path3"></span>
                                                    </i>
                                                    <div className="text-white fw-bold fs-2 mt-5">
                                                        {formatCurrency(customer.deposit || 0)}
                                                    </div>
                                                    <div className="fw-semibold text-white">{t('customers.depositBalance')}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Customer Information Card */}
                                    <div className="card pt-4 mb-6 mb-xl-9">
                                        <div className="card-header border-0">
                                            <div className="card-title">
                                                <h2>{t('customers.customerInformation')}</h2>
                                            </div>
                                            <div className="card-toolbar">
                                                <Link to={`${basePath}/customers/${id}/edit`} className="btn btn-sm btn-light-primary">
                                                    <i className="ki-duotone ki-pencil fs-3">
                                                        <span className="path1"></span>
                                                        <span className="path2"></span>
                                                    </i>
                                                    {t('customers.editCustomerBtn')}
                                                </Link>
                                            </div>
                                        </div>
                                        <div className="card-body pt-0 pb-5">
                                            <div className="table-responsive">
                                                <table className="table align-middle table-row-dashed gy-5">
                                                    <tbody className="fs-6 fw-semibold text-gray-600">
                                                        <tr>
                                                            <td className="text-muted min-w-125px w-125px">{t('customers.customerIdLabel')}</td>
                                                            <td className="text-gray-800">#{customer.id}</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="text-muted min-w-125px w-125px">{t('common.name')}</td>
                                                            <td className="text-gray-800">{customer.name}</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="text-muted min-w-125px w-125px">{t('common.email')}</td>
                                                            <td className="text-gray-800">
                                                                <a href={`mailto:${customer.email}`} className="text-gray-900 text-hover-primary">
                                                                    {customer.email}
                                                                </a>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td className="text-muted min-w-125px w-125px">{t('common.phone')}</td>
                                                            <td className="text-gray-800">
                                                                {customer.phone || customer.phone_number ? (
                                                                    <a href={`tel:${customer.phone || customer.phone_number}`} className="text-gray-900 text-hover-primary">
                                                                        {customer.phone || customer.phone_number}
                                                                    </a>
                                                                ) : t('customers.noPhoneProvided')}
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td className="text-muted min-w-125px w-125px">{t('customers.companyName')}</td>
                                                            <td className="text-gray-800">{customer.company_name || t('customers.na')}</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="text-muted min-w-125px w-125px">{t('common.address')}</td>
                                                            <td className="text-gray-800">
                                                                {customer.address || customer.city || customer.state || customer.postal_code || customer.zip ? (
                                                                    <>
                                                                        {customer.address && <>{customer.address}<br /></>}
                                                                        {(customer.city || customer.state || customer.postal_code || customer.zip) && (
                                                                            <>{[customer.city, customer.state, customer.postal_code || customer.zip].filter(Boolean).join(', ')}</>
                                                                        )}
                                                                    </>
                                                                ) : t('customers.noAddressProvided')}
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td className="text-muted min-w-125px w-125px">{t('common.created')}</td>
                                                            <td className="text-gray-800">{formatCustomerDate(customer.created_at)}</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="text-muted min-w-125px w-125px">{t('customers.lastUpdated')}</td>
                                                            <td className="text-gray-800">{formatCustomerDate(customer.updated_at)}</td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Quick Actions Card */}
                                    <div className="card pt-4 mb-6 mb-xl-9">
                                        <div className="card-header border-0">
                                            <div className="card-title">
                                                <h2 className="fw-bold mb-0">{t('customers.quickActions')}</h2>
                                            </div>
                                        </div>
                                        <div className="card-body pt-0">
                                            <div className="d-flex flex-wrap gap-3">
                                                <Link to={`${basePath}/customers/${id}/edit`} className="btn btn-light-primary">
                                                    <i className="ki-duotone ki-pencil fs-3">
                                                        <span className="path1"></span>
                                                        <span className="path2"></span>
                                                    </i>
                                                    {t('customers.editCustomerBtn')}
                                                </Link>
                                                <button onClick={handleDelete} className="btn btn-light-danger">
                                                    <i className="ki-duotone ki-trash fs-3">
                                                        <span className="path1"></span>
                                                        <span className="path2"></span>
                                                        <span className="path3"></span>
                                                        <span className="path4"></span>
                                                        <span className="path5"></span>
                                                    </i>
                                                    {t('customers.deleteCustomer')}
                                                </button>
                                                <Link to={`${basePath}/customers`} className="btn btn-light-secondary">
                                                    <i className="ki-duotone ki-arrow-left fs-3">
                                                        <span className="path1"></span>
                                                        <span className="path2"></span>
                                                    </i>
                                                    {t('customers.backToCustomers')}
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            {/* General Settings Tab */}
                            {activeTab === 'general' && (
                                <div className="tab-pane fade show active">
                                    <div className="card pt-4 mb-6 mb-xl-9">
                                        <div className="card-header border-0">
                                            <div className="card-title">
                                                <h2>{t('customers.profileInformation')}</h2>
                                            </div>
                                        </div>
                                        <div className="card-body pt-0 pb-5">
                                            <div className="table-responsive">
                                                <table className="table align-middle table-row-dashed gy-5">
                                                    <tbody className="fs-6 fw-semibold text-gray-600">
                                                        <tr>
                                                            <td className="text-muted min-w-125px w-125px">{t('customers.fullName')}</td>
                                                            <td className="text-gray-800">{customer.name}</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="text-muted min-w-125px w-125px">{t('customers.companyName')}</td>
                                                            <td className="text-gray-800">{customer.company_name || t('customers.na')}</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="text-muted min-w-125px w-125px">{t('customers.emailAddress')}</td>
                                                            <td className="text-gray-800">{customer.email}</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="text-muted min-w-125px w-125px">{t('customers.phoneNumber')}</td>
                                                            <td className="text-gray-800">{customer.phone || customer.phone_number || t('customers.na')}</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="text-muted min-w-125px w-125px">{t('common.country')}</td>
                                                            <td className="text-gray-800">{customer.country || t('customers.na')}</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="text-muted min-w-125px w-125px">{t('common.city')}</td>
                                                            <td className="text-gray-800">{customer.city || t('customers.na')}</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="text-muted min-w-125px w-125px">{t('common.state')}</td>
                                                            <td className="text-gray-800">{customer.state || t('customers.na')}</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="text-muted min-w-125px w-125px">{t('customers.postalCode')}</td>
                                                            <td className="text-gray-800">{customer.postal_code || customer.zip || t('customers.na')}</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="text-muted min-w-125px w-125px">{t('customers.taxNumberShort')}</td>
                                                            <td className="text-gray-800">{customer.tax_no || t('customers.na')}</td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            {/* Advanced Settings Tab */}
                            {activeTab === 'advanced' && (
                                <div className="tab-pane fade show active">
                                    <div className="card pt-4 mb-6 mb-xl-9">
                                        <div className="card-header border-0">
                                            <div className="card-title">
                                                <h2>{t('customers.financialInformation')}</h2>
                                            </div>
                                        </div>
                                        <div className="card-body pt-0 pb-5">
                                            <div className="table-responsive">
                                                <table className="table align-middle table-row-dashed gy-5">
                                                    <tbody className="fs-6 fw-semibold text-gray-600">
                                                        <tr>
                                                            <td className="text-muted min-w-125px w-125px">{t('customers.depositAmount')}</td>
                                                            <td className="text-gray-800">
                                                                <span className="badge badge-light-success fs-7">
                                                                    {formatCurrency(customer.deposit || 0)}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td className="text-muted min-w-125px w-125px">{t('customers.expenseAmount')}</td>
                                                            <td className="text-gray-800">
                                                                <span className="badge badge-light-warning fs-7">
                                                                    {formatCurrency(customer.expense || 0)}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td className="text-muted min-w-125px w-125px">{t('customers.customerGroup')}</td>
                                                            <td className="text-gray-800">
                                                                {customer.customer_group?.name ? (
                                                                    <span className="badge badge-light-info fs-7">
                                                                        {customer.customer_group.name}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-muted">{t('customers.noGroupAssigned')}</span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
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

export default CustomerView;


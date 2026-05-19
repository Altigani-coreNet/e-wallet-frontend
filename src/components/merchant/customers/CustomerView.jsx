import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getCustomer, deleteCustomer } from '../../../services/customersService';
import { useToolbar } from '../../../contexts/ToolbarContext';
import LoadingSpinner from '../../common/LoadingSpinner';
import ErrorAlert from '../../common/ErrorAlert';
import Swal from 'sweetalert2';
import useAuthStore from '../../../stores/authStore';

const CustomerView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { setTitle, setBreadcrumbs, setActions } = useToolbar();
    const { formatCurrency } = useAuthStore();
    
    // Dynamically determine base path from current location
    const basePath = location.pathname.startsWith('/sales') ? '/sales' : '/merchant';
    
    const [customer, setCustomer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');

    // Fetch customer details
    useEffect(() => {
        const fetchCustomerData = async () => {
            setLoading(true);
            setError(null);

            try {
                const response = await getCustomer(id);
                
                if (response.success) {
                    setCustomer(response.data);
                } else {
                    setError(response.error || 'Failed to fetch customer details');
                }
            } catch (err) {
                console.error('Error fetching customer:', err);
                setError('An unexpected error occurred');
            } finally {
                setLoading(false);
            }
        };

        fetchCustomerData();
    }, [id]);

    // Handle delete
    const handleDelete = async () => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: `You are about to delete customer "${customer?.name}". This action cannot be undone!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'Cancel'
        });

        if (result.isConfirmed) {
            try {
                const response = await deleteCustomer(id);
                
                if (response.success) {
                    toast.success('Customer deleted successfully');
                    navigate(`${basePath}/customers`);
                } else {
                    toast.error(response.error || 'Failed to delete customer');
                }
            } catch (err) {
                console.error('Error deleting customer:', err);
                toast.error('An unexpected error occurred');
            }
        }
    };

    // Set toolbar
    useEffect(() => {
        if (customer) {
            const breadcrumbs = [
                { label: 'Dashboard', path: `${basePath}/dashboard` },
                { label: 'Customers', path: `${basePath}/customers` },
                { label: customer.name, path: `${basePath}/customers/${id}`, active: true }
            ];
            
            setTitle(`Customer: ${customer.name}`);
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
                        Edit Customer
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
                        Delete
                    </button>
                </>
            );
        }
        
        return () => {
            setTitle('Dashboard');
            setBreadcrumbs([]);
            setActions(null);
        };
    }, [customer, id, basePath]);

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
                    <div className="alert alert-warning">Customer not found</div>
                </div>
            </div>
        );
    }

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

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
                                    <div className="fw-bold">Details</div>
                                    <div className="badge badge-light-info d-inline">Active Customer</div>
                                </div>
                                <div className="separator separator-dashed my-3"></div>
                                
                                {/* Details content */}
                                <div className="pb-5 fs-6">
                                    {/* Customer ID */}
                                    <div className="fw-bold mt-5">Customer ID</div>
                                    <div className="text-gray-600">#{customer.id}</div>
                                    
                                    {/* Email */}
                                    <div className="fw-bold mt-5">Email</div>
                                    <div className="text-gray-600">
                                        <a href={`mailto:${customer.email}`} className="text-gray-600 text-hover-primary">
                                            {customer.email}
                                        </a>
                                    </div>
                                    
                                    {/* Phone */}
                                    <div className="fw-bold mt-5">Phone</div>
                                    <div className="text-gray-600">
                                        {customer.phone || customer.phone_number ? (
                                            <a href={`tel:${customer.phone || customer.phone_number}`} className="text-gray-600 text-hover-primary">
                                                {customer.phone || customer.phone_number}
                                            </a>
                                        ) : 'No phone provided'}
                                    </div>
                                    
                                    {/* Address */}
                                    <div className="fw-bold mt-5">Address</div>
                                    <div className="text-gray-600">
                                        {customer.address || customer.city || customer.state || customer.postal_code || customer.zip ? (
                                            <>
                                                {customer.address && <>{customer.address}<br /></>}
                                                {(customer.city || customer.state || customer.postal_code || customer.zip) && (
                                                    <>{[customer.city, customer.state, customer.postal_code || customer.zip].filter(Boolean).join(', ')}</>
                                                )}
                                            </>
                                        ) : 'No address provided'}
                                    </div>
                                    
                                    {/* Customer Group */}
                                    <div className="fw-bold mt-5">Customer Group</div>
                                    <div className="text-gray-600">
                                        {customer.customer_group?.name || 'No group assigned'}
                                    </div>
                                    
                                    {/* Created */}
                                    <div className="fw-bold mt-5">Created</div>
                                    <div className="text-gray-600">{formatDate(customer.created_at)}</div>
                                    
                                    {/* Last Updated */}
                                    <div className="fw-bold mt-5">Last Updated</div>
                                    <div className="text-gray-600">{formatDate(customer.updated_at)}</div>
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
                                    Overview
                                </a>
                            </li>
                            <li className="nav-item" role="presentation">
                                <a 
                                    className={`nav-link text-active-primary pb-4 ${activeTab === 'general' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('general')}
                                    role="tab"
                                    style={{cursor: 'pointer'}}
                                >
                                    General Settings
                                </a>
                            </li>
                            <li className="nav-item" role="presentation">
                                <a 
                                    className={`nav-link text-active-primary pb-4 ${activeTab === 'advanced' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('advanced')}
                                    role="tab"
                                    style={{cursor: 'pointer'}}
                                >
                                    Advanced Settings
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
                                                        <h2 className="fw-bold">Account Status</h2>
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
                                                                Active
                                                                <span className="text-muted fs-4 fw-semibold d-block">Customer Account</span>
                                                            </div>
                                                        </div>
                                                        <div className="fs-7 fw-normal text-muted mt-3">
                                                            Customer account is active and operational.
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
                                                    <div className="fw-semibold text-white">Deposit Balance</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Customer Information Card */}
                                    <div className="card pt-4 mb-6 mb-xl-9">
                                        <div className="card-header border-0">
                                            <div className="card-title">
                                                <h2>Customer Information</h2>
                                            </div>
                                            <div className="card-toolbar">
                                                <Link to={`${basePath}/customers/${id}/edit`} className="btn btn-sm btn-light-primary">
                                                    <i className="ki-duotone ki-pencil fs-3">
                                                        <span className="path1"></span>
                                                        <span className="path2"></span>
                                                    </i>
                                                    Edit Customer
                                                </Link>
                                            </div>
                                        </div>
                                        <div className="card-body pt-0 pb-5">
                                            <div className="table-responsive">
                                                <table className="table align-middle table-row-dashed gy-5">
                                                    <tbody className="fs-6 fw-semibold text-gray-600">
                                                        <tr>
                                                            <td className="text-muted min-w-125px w-125px">Customer ID</td>
                                                            <td className="text-gray-800">#{customer.id}</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="text-muted min-w-125px w-125px">Name</td>
                                                            <td className="text-gray-800">{customer.name}</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="text-muted min-w-125px w-125px">Email</td>
                                                            <td className="text-gray-800">
                                                                <a href={`mailto:${customer.email}`} className="text-gray-900 text-hover-primary">
                                                                    {customer.email}
                                                                </a>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td className="text-muted min-w-125px w-125px">Phone</td>
                                                            <td className="text-gray-800">
                                                                {customer.phone || customer.phone_number ? (
                                                                    <a href={`tel:${customer.phone || customer.phone_number}`} className="text-gray-900 text-hover-primary">
                                                                        {customer.phone || customer.phone_number}
                                                                    </a>
                                                                ) : 'No phone provided'}
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td className="text-muted min-w-125px w-125px">Company Name</td>
                                                            <td className="text-gray-800">{customer.company_name || 'N/A'}</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="text-muted min-w-125px w-125px">Address</td>
                                                            <td className="text-gray-800">
                                                                {customer.address || customer.city || customer.state || customer.postal_code || customer.zip ? (
                                                                    <>
                                                                        {customer.address && <>{customer.address}<br /></>}
                                                                        {(customer.city || customer.state || customer.postal_code || customer.zip) && (
                                                                            <>{[customer.city, customer.state, customer.postal_code || customer.zip].filter(Boolean).join(', ')}</>
                                                                        )}
                                                                    </>
                                                                ) : 'No address provided'}
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td className="text-muted min-w-125px w-125px">Created</td>
                                                            <td className="text-gray-800">{formatDate(customer.created_at)}</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="text-muted min-w-125px w-125px">Last Updated</td>
                                                            <td className="text-gray-800">{formatDate(customer.updated_at)}</td>
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
                                                <h2 className="fw-bold mb-0">Quick Actions</h2>
                                            </div>
                                        </div>
                                        <div className="card-body pt-0">
                                            <div className="d-flex flex-wrap gap-3">
                                                <Link to={`${basePath}/customers/${id}/edit`} className="btn btn-light-primary">
                                                    <i className="ki-duotone ki-pencil fs-3">
                                                        <span className="path1"></span>
                                                        <span className="path2"></span>
                                                    </i>
                                                    Edit Customer
                                                </Link>
                                                <button onClick={handleDelete} className="btn btn-light-danger">
                                                    <i className="ki-duotone ki-trash fs-3">
                                                        <span className="path1"></span>
                                                        <span className="path2"></span>
                                                        <span className="path3"></span>
                                                        <span className="path4"></span>
                                                        <span className="path5"></span>
                                                    </i>
                                                    Delete Customer
                                                </button>
                                                <Link to={`${basePath}/customers`} className="btn btn-light-secondary">
                                                    <i className="ki-duotone ki-arrow-left fs-3">
                                                        <span className="path1"></span>
                                                        <span className="path2"></span>
                                                    </i>
                                                    Back to Customers
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
                                                <h2>Profile Information</h2>
                                            </div>
                                        </div>
                                        <div className="card-body pt-0 pb-5">
                                            <div className="table-responsive">
                                                <table className="table align-middle table-row-dashed gy-5">
                                                    <tbody className="fs-6 fw-semibold text-gray-600">
                                                        <tr>
                                                            <td className="text-muted min-w-125px w-125px">Full Name</td>
                                                            <td className="text-gray-800">{customer.name}</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="text-muted min-w-125px w-125px">Company Name</td>
                                                            <td className="text-gray-800">{customer.company_name || 'N/A'}</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="text-muted min-w-125px w-125px">Email Address</td>
                                                            <td className="text-gray-800">{customer.email}</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="text-muted min-w-125px w-125px">Phone Number</td>
                                                            <td className="text-gray-800">{customer.phone || customer.phone_number || 'N/A'}</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="text-muted min-w-125px w-125px">Country</td>
                                                            <td className="text-gray-800">{customer.country || 'N/A'}</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="text-muted min-w-125px w-125px">City</td>
                                                            <td className="text-gray-800">{customer.city || 'N/A'}</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="text-muted min-w-125px w-125px">State</td>
                                                            <td className="text-gray-800">{customer.state || 'N/A'}</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="text-muted min-w-125px w-125px">Postal Code</td>
                                                            <td className="text-gray-800">{customer.postal_code || customer.zip || 'N/A'}</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="text-muted min-w-125px w-125px">Tax Number</td>
                                                            <td className="text-gray-800">{customer.tax_no || 'N/A'}</td>
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
                                                <h2>Financial Information</h2>
                                            </div>
                                        </div>
                                        <div className="card-body pt-0 pb-5">
                                            <div className="table-responsive">
                                                <table className="table align-middle table-row-dashed gy-5">
                                                    <tbody className="fs-6 fw-semibold text-gray-600">
                                                        <tr>
                                                            <td className="text-muted min-w-125px w-125px">Deposit Amount</td>
                                                            <td className="text-gray-800">
                                                                <span className="badge badge-light-success fs-7">
                                                                    {formatCurrency(customer.deposit || 0)}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td className="text-muted min-w-125px w-125px">Expense Amount</td>
                                                            <td className="text-gray-800">
                                                                <span className="badge badge-light-warning fs-7">
                                                                    {formatCurrency(customer.expense || 0)}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td className="text-muted min-w-125px w-125px">Customer Group</td>
                                                            <td className="text-gray-800">
                                                                {customer.customer_group?.name ? (
                                                                    <span className="badge badge-light-info fs-7">
                                                                        {customer.customer_group.name}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-muted">No group assigned</span>
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


import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import { ADMIN_ENDPOINTS, AUTH_ENDPOINTS } from '../../../utils/constants';
import { getToken } from '../../../utils/api';
import { useToolbar } from '../../../contexts/ToolbarContext';

const AdminCustomerView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { setTitle, setActions } = useToolbar();
    
    const [customer, setCustomer] = useState(null);
    const [merchant, setMerchant] = useState(null);
    const [country, setCountry] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');

    // Fetch customer details
    useEffect(() => {
        const fetchCustomerData = async () => {
            setLoading(true);
            setError(null);

            try {
                const token = getToken();
                const response = await axios.get(ADMIN_ENDPOINTS.CUSTOMER_DETAILS(id), {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                const isSuccess = response.data.success || response.data.status;
                if (isSuccess) {
                    const customerData = response.data.data;
                    setCustomer(customerData);
                    
                    // Fetch merchant if exists
                    if (customerData.merchant_id) {
                        fetchMerchant(customerData.merchant_id);
                    }
                    
                    // Fetch country if exists
                    if (customerData.country_id) {
                        fetchCountry(customerData.country_id);
                    }
                } else {
                    setError('Failed to fetch customer details');
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

    const fetchMerchant = async (merchantId) => {
        try {
            const token = getToken();
            const response = await axios.get(ADMIN_ENDPOINTS.MERCHANT_DETAILS(merchantId), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.data.success || response.data.status) {
                setMerchant(response.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch merchant:', error);
        }
    };

    const fetchCountry = async (countryId) => {
        try {
            const token = getToken();
            const response = await axios.get(AUTH_ENDPOINTS.COUNTRIES_SELECT, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.data.status) {
                const foundCountry = response.data.data.find(c => c.id === countryId);
                if (foundCountry) {
                    setCountry(foundCountry);
                }
            }
        } catch (error) {
            console.error('Failed to fetch country:', error);
        }
    };

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
                const token = getToken();
                const response = await axios.delete(
                    ADMIN_ENDPOINTS.CUSTOMER_DETAILS(id),
                    { headers: { 'Authorization': `Bearer ${token}` } }
                );
                
                const isSuccess = response.data.success || response.data.status;
                if (isSuccess) {
                    toast.success('Customer deleted successfully');
                    navigate('/admin/customers');
                } else {
                    toast.error('Failed to delete customer');
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
            setTitle(`Customer: ${customer.name}`);
            setActions(
                <>
                    <Link
                        to={`/admin/customers/${id}/edit`}
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
            setActions(null);
        };
    }, [customer, id, setTitle, setActions]);

    if (loading) {
        return (
            <div className="post d-flex flex-column-fluid" id="kt_post">
                <div id="kt_content_container" className="container-xxl">
                    <div className="card">
                        <div className="card-body text-center py-20">
                            <span className="spinner-border text-primary"></span>
                            <p className="text-gray-600 mt-4">Loading customer...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="post d-flex flex-column-fluid" id="kt_post">
                <div id="kt_content_container" className="container-xxl">
                    <div className="alert alert-danger">
                        {error}
                        <button onClick={() => navigate('/admin/customers')} className="btn btn-sm btn-light ms-3">
                            Back to Customers
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!customer) {
        return (
            <div className="post d-flex flex-column-fluid" id="kt_post">
                <div id="kt_content_container" className="container-xxl">
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
            <div id="kt_content_container" className="container-xxl">
                
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
                                    {/* Status Badge */}
                                    <span className={`badge badge-light-${customer.status === 'active' ? 'success' : 'danger'}`}>
                                        {customer.status || 'active'}
                                    </span>
                                </div>
                                
                                {/* Details toggle */}
                                <div className="d-flex flex-stack fs-4 py-3">
                                    <div className="fw-bold">Details</div>
                                </div>
                                <div className="separator separator-dashed my-3"></div>
                                
                                {/* Details content */}
                                <div className="pb-5 fs-6">
                                    {/* Customer ID */}
                                    <div className="fw-bold mt-5">Customer ID</div>
                                    <div className="text-gray-600">#{customer.id}</div>
                                    
                                    {/* Merchant - Admin specific */}
                                    <div className="fw-bold mt-5">Merchant</div>
                                    <div className="text-gray-600">
                                        {merchant ? (
                                            <Link to={`/admin/merchants/${merchant.id}`} className="text-gray-600 text-hover-primary">
                                                {merchant.business_name || merchant.name}
                                            </Link>
                                        ) : (customer.merchant_id || 'Not assigned')}
                                    </div>
                                    
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
                                    
                                    {/* Country - Admin specific */}
                                    <div className="fw-bold mt-5">Country</div>
                                    <div className="text-gray-600">
                                        {country?.text || country?.name || customer.country || 'Not specified'}
                                    </div>
                                    
                                    {/* Company */}
                                    {customer.company_name && (
                                        <>
                                            <div className="fw-bold mt-5">Company</div>
                                            <div className="text-gray-600">{customer.company_name}</div>
                                        </>
                                    )}
                                    
                                    {/* Tax Number */}
                                    {customer.tax_no && (
                                        <>
                                            <div className="fw-bold mt-5">Tax Number</div>
                                            <div className="text-gray-600">{customer.tax_no}</div>
                                        </>
                                    )}
                                    
                                    {/* Created */}
                                    <div className="fw-bold mt-5">Created</div>
                                    <div className="text-gray-600">{formatDate(customer.created_at)}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Main Content */}
                    <div className="flex-lg-row-fluid ms-lg-15">
                        {/* Tab navigation */}
                        <ul className="nav nav-custom nav-tabs nav-line-tabs nav-line-tabs-2x border-0 fs-4 fw-semibold mb-8">
                            <li className="nav-item">
                                <a
                                    className={`nav-link text-active-primary pb-4 ${activeTab === 'overview' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('overview')}
                                    style={{ cursor: 'pointer' }}
                                >
                                    Overview
                                </a>
                            </li>
                            <li className="nav-item">
                                <a
                                    className={`nav-link text-active-primary pb-4 ${activeTab === 'financial' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('financial')}
                                    style={{ cursor: 'pointer' }}
                                >
                                    Financial
                                </a>
                            </li>
                        </ul>
                        
                        {/* Tab content */}
                        <div className="tab-content">
                            {/* Overview Tab */}
                            {activeTab === 'overview' && (
                                <div className="tab-pane fade show active">
                                    <div className="card card-flush mb-6 mb-xl-9">
                                        <div className="card-header mt-6">
                                            <div className="card-title flex-column">
                                                <h2 className="mb-1">Customer Information</h2>
                                            </div>
                                        </div>
                                        <div className="card-body p-9 pt-4">
                                            <div className="row mb-7">
                                                <label className="col-lg-4 fw-semibold text-muted">Full Name</label>
                                                <div className="col-lg-8">
                                                    <span className="fw-bold fs-6 text-gray-800">{customer.name}</span>
                                                </div>
                                            </div>
                                            <div className="row mb-7">
                                                <label className="col-lg-4 fw-semibold text-muted">Email</label>
                                                <div className="col-lg-8 fv-row">
                                                    <span className="fw-semibold fs-6 text-gray-800">{customer.email}</span>
                                                </div>
                                            </div>
                                            <div className="row mb-7">
                                                <label className="col-lg-4 fw-semibold text-muted">Phone</label>
                                                <div className="col-lg-8 d-flex align-items-center">
                                                    <span className="fw-bold fs-6 text-gray-800">{customer.phone || customer.phone_number || 'N/A'}</span>
                                                </div>
                                            </div>
                                            <div className="row mb-7">
                                                <label className="col-lg-4 fw-semibold text-muted">Company</label>
                                                <div className="col-lg-8">
                                                    <span className="fw-bold fs-6 text-gray-800">{customer.company_name || 'N/A'}</span>
                                                </div>
                                            </div>
                                            <div className="row mb-7">
                                                <label className="col-lg-4 fw-semibold text-muted">Tax Number</label>
                                                <div className="col-lg-8">
                                                    <span className="fw-bold fs-6 text-gray-800">{customer.tax_no || 'N/A'}</span>
                                                </div>
                                            </div>
                                            <div className="row mb-7">
                                                <label className="col-lg-4 fw-semibold text-muted">Address</label>
                                                <div className="col-lg-8">
                                                    <span className="fw-bold fs-6 text-gray-800">{customer.address || 'N/A'}</span>
                                                </div>
                                            </div>
                                            <div className="row mb-7">
                                                <label className="col-lg-4 fw-semibold text-muted">City</label>
                                                <div className="col-lg-8">
                                                    <span className="fw-bold fs-6 text-gray-800">{customer.city || 'N/A'}</span>
                                                </div>
                                            </div>
                                            <div className="row mb-7">
                                                <label className="col-lg-4 fw-semibold text-muted">State/Province</label>
                                                <div className="col-lg-8">
                                                    <span className="fw-bold fs-6 text-gray-800">{customer.state || 'N/A'}</span>
                                                </div>
                                            </div>
                                            <div className="row mb-7">
                                                <label className="col-lg-4 fw-semibold text-muted">Postal Code</label>
                                                <div className="col-lg-8">
                                                    <span className="fw-bold fs-6 text-gray-800">{customer.postal_code || customer.zip || 'N/A'}</span>
                                                </div>
                                            </div>
                                            <div className="row mb-7">
                                                <label className="col-lg-4 fw-semibold text-muted">Country</label>
                                                <div className="col-lg-8">
                                                    <span className="fw-bold fs-6 text-gray-800">
                                                        {country?.text || country?.name || customer.country || 'N/A'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="row mb-7">
                                                <label className="col-lg-4 fw-semibold text-muted">Status</label>
                                                <div className="col-lg-8">
                                                    <span className={`badge badge-light-${customer.status === 'active' ? 'success' : 'danger'}`}>
                                                        {customer.status || 'active'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            {/* Financial Tab */}
                            {activeTab === 'financial' && (
                                <div className="tab-pane fade show active">
                                    <div className="card card-flush mb-6 mb-xl-9">
                                        <div className="card-header mt-6">
                                            <div className="card-title flex-column">
                                                <h2 className="mb-1">Financial Information</h2>
                                            </div>
                                        </div>
                                        <div className="card-body p-9 pt-4">
                                            <div className="row mb-7">
                                                <label className="col-lg-4 fw-semibold text-muted">Deposit</label>
                                                <div className="col-lg-8">
                                                    <span className="fw-bold fs-6 text-gray-800">
                                                        ${customer.deposit || '0.00'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="row mb-7">
                                                <label className="col-lg-4 fw-semibold text-muted">Expense</label>
                                                <div className="col-lg-8">
                                                    <span className="fw-bold fs-6 text-gray-800">
                                                        ${customer.expense || '0.00'}
                                                    </span>
                                                </div>
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

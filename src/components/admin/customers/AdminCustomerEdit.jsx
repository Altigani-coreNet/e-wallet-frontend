import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ADMIN_ENDPOINTS } from '../../../utils/constants';
import { getToken } from '../../../utils/api';
import AdminCustomerForm from './AdminCustomerForm';
import { useToolbar } from '../../../contexts/ToolbarContext';

const AdminCustomerEdit = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { setTitle, setActions } = useToolbar();
    
    const [customer, setCustomer] = useState(null);
    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(true);
    const [errors, setErrors] = useState({});

    // Fetch customer details
    useEffect(() => {
        const fetchCustomerData = async () => {
            setFetchLoading(true);

            try {
                const token = getToken();
                const response = await axios.get(ADMIN_ENDPOINTS.CUSTOMER_DETAILS(id), {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                const isSuccess = response.data.success || response.data.status;
                if (isSuccess) {
                    setCustomer(response.data.data);
                } else {
                    toast.error('Failed to fetch customer details');
                    navigate('/admin/customers');
                }
            } catch (err) {
                console.error('Error fetching customer:', err);
                toast.error('An unexpected error occurred');
                navigate('/admin/customers');
            } finally {
                setFetchLoading(false);
            }
        };

        fetchCustomerData();
    }, [id, navigate]);

    // Set toolbar
    useEffect(() => {
        if (customer) {
            setTitle(`Edit Customer: ${customer.name}`);
        } else {
            setTitle('Edit Customer');
        }
        
        setActions(
            <button
                type="button"
                className="btn btn-sm btn-light"
                onClick={() => navigate('/admin/customers')}
            >
                <i className="ki-duotone ki-arrow-left fs-3">
                    <span className="path1"></span>
                    <span className="path2"></span>
                </i>
                Back to Customers
            </button>
        );
        
        return () => {
            setTitle('Dashboard');
            setActions(null);
        };
    }, [customer, navigate, setTitle, setActions]);

    const handleSubmit = async (formData) => {
        setLoading(true);
        setErrors({});

        try {
            const token = getToken();
            const response = await axios.put(
                ADMIN_ENDPOINTS.CUSTOMER_DETAILS(id),
                formData,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            
            const isSuccess = response.data.success || response.data.status;
            if (isSuccess) {
                toast.success('Customer updated successfully');
                navigate('/admin/customers');
            } else {
                if (response.data.errors) {
                    setErrors(response.data.errors);
                }
                toast.error(response.data.error || response.data.message || 'Failed to update customer');
            }
        } catch (err) {
            console.error('Error updating customer:', err);
            if (err.response?.data?.errors) {
                setErrors(err.response.data.errors);
            }
            toast.error(err.response?.data?.message || 'An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    if (fetchLoading) {
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

    return (
        <div className="post d-flex flex-column-fluid" id="kt_post">
            <div id="kt_content_container" className="container-xxl">
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Edit Customer Information</h3>
                    </div>
                    <AdminCustomerForm
                        customer={customer}
                        onSubmit={handleSubmit}
                        loading={loading}
                        errors={errors}
                    />
                </div>
            </div>
        </div>
    );
};

export default AdminCustomerEdit;

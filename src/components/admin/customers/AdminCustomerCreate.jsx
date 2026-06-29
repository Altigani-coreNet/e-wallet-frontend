import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ADMIN_ENDPOINTS } from '../../../utils/constants';
import { getToken } from '../../../utils/api';
import AdminCustomerForm from './AdminCustomerForm';
import { useToolbar } from '../../../contexts/ToolbarContext';
import AdminCustomerModel from '../../../models/AdminCustomerModel';

const AdminCustomerCreate = () => {
    const navigate = useNavigate();
    const { setTitle, setActions } = useToolbar();
    
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    // Set toolbar
    useEffect(() => {
        setTitle('Create New Customer');
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
    }, [navigate, setTitle, setActions]);

    const handleSubmit = async (formData) => {
        setLoading(true);
        setErrors({});

        try {
            const token = getToken();
            const response = await axios.post(
                ADMIN_ENDPOINTS.CUSTOMERS,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );
            
            const isSuccess = response.data.success || response.data.status;
            if (isSuccess) {
                toast.success('Customer created successfully');
                const createdCustomer = AdminCustomerModel.fromApi(response.data?.data);
                navigate(createdCustomer?.id ? `/admin/customers/${createdCustomer.id}` : '/admin/customers');
            } else {
                if (response.data.errors) {
                    setErrors(response.data.errors);
                }
                toast.error(response.data.error || response.data.message || 'Failed to create customer');
            }
        } catch (err) {
            console.error('Error creating customer:', err);
            if (err.response?.data?.errors) {
                setErrors(err.response.data.errors);
            }
            toast.error(err.response?.data?.message || 'An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="post d-flex flex-column-fluid" id="kt_post">
            <div id="kt_content_container" className="container-xxl">
                <AdminCustomerForm
                    customer={null}
                    onSubmit={handleSubmit}
                    loading={loading}
                    errors={errors}
                />
            </div>
        </div>
    );
};

export default AdminCustomerCreate;

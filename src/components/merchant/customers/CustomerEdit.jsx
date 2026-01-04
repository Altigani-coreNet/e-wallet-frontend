import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getCustomer, updateCustomer } from '../../../services/customersService';
import CustomerForm from './CustomerForm';
import { useToolbar } from '../../../contexts/ToolbarContext';
import LoadingSpinner from '../../common/LoadingSpinner';
import ErrorAlert from '../../common/ErrorAlert';

const CustomerEdit = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { setTitle, setBreadcrumbs, setActions } = useToolbar();
    
    // Dynamically determine base path from current location
    const basePath = location.pathname.startsWith('/sales') ? '/sales' : '/merchant';
    
    const [customer, setCustomer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [errors, setErrors] = useState({});

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

    // Set toolbar
    useEffect(() => {
        if (customer) {
            const breadcrumbs = [
                { label: 'Dashboard', path: `${basePath}/dashboard` },
                { label: 'Customers', path: `${basePath}/customers` },
                { label: customer.name, path: `${basePath}/customers/${id}` },
                { label: 'Edit', path: `${basePath}/customers/${id}/edit`, active: true }
            ];
            
            setTitle(`Edit Customer: ${customer.name}`);
            setBreadcrumbs(breadcrumbs);
            setActions(
                <button
                    type="button"
                    className="btn btn-sm btn-light"
                    onClick={() => navigate(`${basePath}/customers/${id}`)}
                >
                    <i className="ki-duotone ki-arrow-left fs-3">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    Back to Customer
                </button>
            );
        }
        
        return () => {
            setTitle('Dashboard');
            setBreadcrumbs([]);
            setActions(null);
        };
    }, [customer, id, basePath, navigate]);

    const handleSubmit = async (formData) => {
        setSubmitting(true);
        setErrors({});

        try {
            const response = await updateCustomer(id, formData);
            
            if (response.success) {
                toast.success(response.message || 'Customer updated successfully');
                navigate(`${basePath}/customers/${id}`);
            } else {
                if (response.errors) {
                    setErrors(response.errors);
                }
                toast.error(response.error || 'Failed to update customer');
            }
        } catch (err) {
            console.error('Error updating customer:', err);
            toast.error('An unexpected error occurred');
        } finally {
            setSubmitting(false);
        }
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

    return (
        <div className="post d-flex flex-column-fluid" id="kt_post">
            <div id="kt_content_container" className="container-fluid">
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Edit Customer Information</h3>
                    </div>
                    <CustomerForm
                        customer={customer}
                        onSubmit={handleSubmit}
                        loading={submitting}
                        errors={errors}
                    />
                </div>
            </div>
        </div>
    );
};

export default CustomerEdit;


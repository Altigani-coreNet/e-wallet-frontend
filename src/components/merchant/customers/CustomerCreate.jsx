import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { createCustomer } from '../../../services/customersService';
import CustomerForm from './CustomerForm';
import { useToolbar } from '../../../contexts/ToolbarContext';

const CustomerCreate = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { setTitle, setBreadcrumbs, setActions } = useToolbar();
    
    // Dynamically determine base path from current location
    const basePath = location.pathname.startsWith('/sales') ? '/sales' : '/merchant';
    
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    // Set toolbar
    useEffect(() => {
        const breadcrumbs = [
            { label: 'Dashboard', path: `${basePath}/dashboard` },
            { label: 'Customers', path: `${basePath}/customers` },
            { label: 'Create Customer', path: `${basePath}/customers/create`, active: true }
        ];
        
        setTitle('Create New Customer');
        setBreadcrumbs(breadcrumbs);
        setActions(
            <button
                type="button"
                className="btn btn-sm btn-light"
                onClick={() => navigate(`${basePath}/customers`)}
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
            setBreadcrumbs([]);
            setActions(null);
        };
    }, [basePath, navigate]);

    const handleSubmit = async (formData) => {
        setLoading(true);
        setErrors({});

        try {
            const response = await createCustomer(formData);
            
            if (response.success) {
                toast.success(response.message || 'Customer created successfully');
                navigate(`${basePath}/customers`);
            } else {
                if (response.errors) {
                    setErrors(response.errors);
                }
                toast.error(response.error || 'Failed to create customer');
            }
        } catch (err) {
            console.error('Error creating customer:', err);
            toast.error('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="post d-flex flex-column-fluid" id="kt_post">
            <div id="kt_content_container" className="container-fluid">
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Customer Information</h3>
                    </div>
                    <CustomerForm
                        customer={null}
                        onSubmit={handleSubmit}
                        loading={loading}
                        errors={errors}
                    />
                </div>
            </div>
        </div>
    );
};

export default CustomerCreate;


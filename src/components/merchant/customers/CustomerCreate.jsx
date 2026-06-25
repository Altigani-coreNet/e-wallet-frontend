import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { useQueryClient } from '@tanstack/react-query';
import { createCustomer, customersKeys } from '../../../services/customersService';
import CustomerForm from './CustomerForm';
import { useToolbar } from '../../../contexts/ToolbarContext';
import { getModuleBasePath } from '../../../i18n/localePaths';

const CustomerCreate = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { t, i18n } = useTranslation();
    const { setTitle, setBreadcrumbs, setActions } = useToolbar();
    const queryClient = useQueryClient();
    
    const basePath = getModuleBasePath(location.pathname);
    
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        const breadcrumbs = [
            { label: t('common.dashboard'), path: `${basePath}/dashboard` },
            { label: t('customers.customers'), path: `${basePath}/customers` },
            { label: t('customers.createCustomer'), path: `${basePath}/customers/create`, active: true }
        ];
        
        setTitle(t('customers.createNewCustomer'));
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
                {t('customers.backToCustomers')}
            </button>
        );
        
        return () => {
            setTitle(t('common.dashboard'));
            setBreadcrumbs([]);
            setActions(null);
        };
    }, [basePath, navigate, t, i18n.language]);

    const handleSubmit = async (formData) => {
        setLoading(true);
        setErrors({});

        try {
            const response = await createCustomer(formData);
            
            if (response.success) {
                await queryClient.invalidateQueries({ 
                    queryKey: customersKeys.all,
                    refetchType: 'active'
                });
                
                toast.success(response.message || t('customers.customerCreatedSuccessfully'));
                navigate(`${basePath}/customers`);
            } else {
                if (response.errors) {
                    setErrors(response.errors);
                }
                toast.error(response.error || t('customers.failedToCreateCustomer'));
            }
        } catch (err) {
            console.error('Error creating customer:', err);
            toast.error(t('common.unexpectedErrorOccurred'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="post d-flex flex-column-fluid" id="kt_post">
            <div id="kt_content_container" className="container-fluid">
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">{t('customers.customerInformation')}</h3>
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

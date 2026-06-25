import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { useQueryClient } from '@tanstack/react-query';
import { getCustomer, updateCustomer, customersKeys } from '../../../services/customersService';
import CustomerForm from './CustomerForm';
import { useToolbar } from '../../../contexts/ToolbarContext';
import LoadingSpinner from '../../common/LoadingSpinner';
import ErrorAlert from '../../common/ErrorAlert';
import { getModuleBasePath } from '../../../i18n/localePaths';

const CustomerEdit = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { t, i18n } = useTranslation();
    const { setTitle, setBreadcrumbs, setActions } = useToolbar();
    const queryClient = useQueryClient();
    
    const basePath = getModuleBasePath(location.pathname);
    
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

    // Set toolbar
    useEffect(() => {
        if (customer) {
            const breadcrumbs = [
                { label: t('common.dashboard'), path: `${basePath}/dashboard` },
                { label: t('customers.customers'), path: `${basePath}/customers` },
                { label: customer.name, path: `${basePath}/customers/${id}` },
                { label: t('common.edit'), path: `${basePath}/customers/${id}/edit`, active: true }
            ];
            
            setTitle(t('customers.editCustomerNamed', { name: customer.name }));
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
                    {t('customers.backToCustomer')}
                </button>
            );
        }
        
        return () => {
            setTitle(t('common.dashboard'));
            setBreadcrumbs([]);
            setActions(null);
        };
    }, [customer, id, basePath, navigate, t, i18n.language]);

    const handleSubmit = async (formData) => {
        setSubmitting(true);
        setErrors({});

        try {
            const response = await updateCustomer(id, formData);
            
            if (response.success) {
                // Invalidate all customer queries to refresh the data
                // This marks queries as stale and triggers refetch when accessed
                await queryClient.invalidateQueries({ 
                    queryKey: customersKeys.all,
                    refetchType: 'active' // Refetch active queries immediately
                });
                
                toast.success(response.message || t('customers.customerUpdatedSuccessfully'));
                navigate(`${basePath}/customers/${id}`);
            } else {
                if (response.errors) {
                    setErrors(response.errors);
                }
                toast.error(response.error || t('customers.failedToUpdateCustomer'));
            }
        } catch (err) {
            console.error('Error updating customer:', err);
            toast.error(t('common.unexpectedErrorOccurred'));
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
                    <div className="alert alert-warning">{t('customers.customerNotFound')}</div>
                </div>
            </div>
        );
    }

    return (
        <div className="post d-flex flex-column-fluid" id="kt_post">
            <div id="kt_content_container" className="container-fluid">
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">{t('customers.editCustomerInformation')}</h3>
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


import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useQueryClient } from '@tanstack/react-query';
import { createSupplier, suppliersKeys } from '../../../services/suppliersService';
import SupplierForm from './SupplierForm';
import PlanUpgradeModal from '../../users/PlanUpgradeModal';
import { useToolbar } from '../../../contexts/ToolbarContext';
import { getModuleBasePath } from '../../../i18n/localePaths';

const SupplierCreate = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { setTitle, setBreadcrumbs, setActions } = useToolbar();
    const queryClient = useQueryClient();
    
    const basePath = getModuleBasePath(location.pathname);
    
    const [formData, setFormData] = useState({
        name: '',
        company_name: '',
        vat_number: '',
        email: '',
        phone_number: '',
        address: '',
        city: '',
        state: '',
        postal_code: '',
        country: '',
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPlanUpgradeModal, setShowPlanUpgradeModal] = useState(false);

    useEffect(() => {
        const breadcrumbs = [
            { label: 'Dashboard', path: `${basePath}/dashboard` },
            { label: 'Suppliers', path: `${basePath}/suppliers` },
            { label: 'Create Supplier', path: `${basePath}/suppliers/create`, active: true }
        ];
        
        setTitle('Create Supplier');
        setBreadcrumbs(breadcrumbs);
        setActions(null);
        
        return () => {
            setTitle('Dashboard');
            setBreadcrumbs([]);
            setActions(null);
        };
    }, [basePath]);

    const handleSubmit = async () => {
        setIsSubmitting(true);
        setErrors({});

        try {
            const response = await createSupplier(formData);

            if (response.success) {
                toast.success(response.message || 'Supplier created successfully');
                // Invalidate suppliers queries to trigger automatic refetch
                queryClient.invalidateQueries({ queryKey: suppliersKeys.all });
                navigate(`${basePath}/suppliers`);
            } else {
                // Handle plan limit errors (406)
                const errorCode = response.errorCode || response.data?.code;
                const errorMessage = response.error || '';
                if (response.statusCode === 406 || errorCode === 'PLAN_SUPPLIERS_LIMIT_REACHED' || errorMessage.toLowerCase().includes('limit reached')) {
                    // Show the plan upgrade modal instead of just an error message
                    setShowPlanUpgradeModal(true);
                    setErrors({});
                } else {
                    if (response.errors) {
                        setErrors(response.errors);
                    }
                    toast.error(response.error || 'Failed to create supplier');
                }
            }
        } catch (error) {
            console.error('Error creating supplier:', error);
            // Check if it's a plan limit error
            const errorCode = error?.response?.data?.data?.code || error?.response?.data?.code || error?.response?.data?.Error_Code;
            const errorMessage = error?.response?.data?.message || '';
            if (error?.response?.status === 406 || errorCode === 'PLAN_SUPPLIERS_LIMIT_REACHED' || errorMessage.toLowerCase().includes('limit reached')) {
                setShowPlanUpgradeModal(true);
            } else if (error?.response?.status === 422) {
                // Handle validation errors (422)
                if (error?.response?.data?.errors) {
                    setErrors(error.response.data.errors);
                }
                toast.error(error?.response?.data?.message || 'Validation failed. Please check the form.');
            } else {
                toast.error('An unexpected error occurred');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="post d-flex flex-column-fluid" id="kt_post">
            <div id="kt_content_container" className="container-fluid">
                <SupplierForm
                    formData={formData}
                    onChange={setFormData}
                    errors={errors}
                    onSubmit={handleSubmit}
                    isSubmitting={isSubmitting}
                    isEdit={false}
                />
            </div>

            {/* Plan Upgrade Modal */}
            <PlanUpgradeModal
                show={showPlanUpgradeModal}
                onHide={() => setShowPlanUpgradeModal(false)}
                resourceType="suppliers"
            />
        </div>
    );
};

export default SupplierCreate;


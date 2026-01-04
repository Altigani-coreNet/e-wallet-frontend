import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useQueryClient } from '@tanstack/react-query';
import { getSupplier, updateSupplier, suppliersKeys } from '../../../services/suppliersService';
import SupplierForm from './SupplierForm';
import { useToolbar } from '../../../contexts/ToolbarContext';
import LoadingSpinner from '../../common/LoadingSpinner';
import ErrorAlert from '../../common/ErrorAlert';

const SupplierEdit = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { setTitle, setBreadcrumbs, setActions } = useToolbar();
    const queryClient = useQueryClient();
    
    const basePath = location.pathname.startsWith('/sales') ? '/sales' : '/merchant';
    
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
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const breadcrumbs = [
            { label: 'Dashboard', path: `${basePath}/dashboard` },
            { label: 'Suppliers', path: `${basePath}/suppliers` },
            { label: 'Edit Supplier', path: `${basePath}/suppliers/${id}/edit`, active: true }
        ];
        
        setTitle('Edit Supplier');
        setBreadcrumbs(breadcrumbs);
        setActions(null);
        
        return () => {
            setTitle('Dashboard');
            setBreadcrumbs([]);
            setActions(null);
        };
    }, [basePath, id]);

    useEffect(() => {
        fetchSupplier();
    }, [id]);

    const fetchSupplier = async () => {
        try {
            const response = await getSupplier(id);

            if (response.success) {
                const supplier = response.data.supplier || response.data;
                setFormData({
                    name: supplier.name || '',
                    company_name: supplier.company_name || '',
                    vat_number: supplier.vat_number || '',
                    email: supplier.email || '',
                    phone_number: supplier.phone_number || '',
                    address: supplier.address || '',
                    city: supplier.city || '',
                    state: supplier.state || '',
                    postal_code: supplier.postal_code || '',
                    country: supplier.country || '',
                });
            } else {
                setError(response.error || 'Failed to fetch supplier');
            }
        } catch (err) {
            console.error('Error fetching supplier:', err);
            setError('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        setErrors({});

        try {
            const response = await updateSupplier(id, formData);

            if (response.success) {
                toast.success(response.message || 'Supplier updated successfully');
                // Invalidate suppliers queries to trigger automatic refetch
                queryClient.invalidateQueries({ queryKey: suppliersKeys.all });
                navigate(`${basePath}/suppliers`);
            } else {
                if (response.errors) {
                    setErrors(response.errors);
                }
                toast.error(response.error || 'Failed to update supplier');
            }
        } catch (error) {
            console.error('Error updating supplier:', error);
            toast.error('An unexpected error occurred');
        } finally {
            setIsSubmitting(false);
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
                    <ErrorAlert error={error} onClose={() => navigate(`${basePath}/suppliers`)} />
                </div>
            </div>
        );
    }

    return (
        <div className="post d-flex flex-column-fluid" id="kt_post">
            <div id="kt_content_container" className="container-fluid">
                <SupplierForm
                    formData={formData}
                    onChange={setFormData}
                    errors={errors}
                    onSubmit={handleSubmit}
                    isSubmitting={isSubmitting}
                    isEdit={true}
                />
            </div>
        </div>
    );
};

export default SupplierEdit;


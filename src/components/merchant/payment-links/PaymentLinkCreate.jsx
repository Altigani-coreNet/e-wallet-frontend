import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPaymentLink } from '../../../services/paymentLinksService';
import PaymentLinkForm from './PaymentLinkForm';
import { useToolbar } from '../../../contexts/ToolbarContext';
import Swal from 'sweetalert2';

const PaymentLinkCreate = () => {
    const navigate = useNavigate();
    const { setTitle, setBreadcrumbs, setActions } = useToolbar();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [validationErrors, setValidationErrors] = useState({});

    // Set toolbar title, breadcrumbs and actions
    useEffect(() => {
        setTitle('Create Payment Link');
        
        setBreadcrumbs([
            { label: 'Dashboard', path: '/merchant/dashboard' },
            { label: 'Payment Links', path: '/merchant/payment-links' },
            { label: 'Create Payment Link', path: '/merchant/payment-links/create', active: true }
        ]);
        
        setActions(
            <button
                className="btn btn-sm btn-light btn-active-light-primary"
                onClick={() => navigate('/merchant/payment-links')}
            >
                <i className="ki-duotone ki-arrow-left fs-5">
                    <span className="path1"></span>
                    <span className="path2"></span>
                </i>
                Back to Payment Links
            </button>
        );

        return () => {
            setActions(null);
            setBreadcrumbs([]);
        };
    }, [setTitle, setBreadcrumbs, setActions, navigate]);

    const handleSubmit = async (formData) => {
        setLoading(true);
        setError(null);
        setValidationErrors({});

        try {
            const response = await createPaymentLink(formData);
            
            if (response.success) {
                await Swal.fire({
                    title: 'Success!',
                    text: 'Payment link created successfully.',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                });
                navigate('/merchant/payment-links');
            } else {
                const message = response.error || response.message || 'Failed to create payment link';
                setError(message);
                if (response.errors) setValidationErrors(response.errors);
                Swal.fire('Error!', message, 'error');
            }
        } catch (err) {
            const apiErrors = err?.response?.data?.errors || {};
            const message = err?.response?.data?.message || 'An unexpected error occurred';
            setValidationErrors(apiErrors);
            setError(message);
            Swal.fire('Error!', message, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="payment-link-create">
            <PaymentLinkForm
                mode="create"
                onSubmit={handleSubmit}
                loading={loading}
                error={error}
                validationErrors={validationErrors}
            />
        </div>
    );
};

export default PaymentLinkCreate;


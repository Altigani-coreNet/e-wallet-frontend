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
                setError(response.error || 'Failed to create payment link');
                Swal.fire('Error!', response.error || 'Failed to create payment link.', 'error');
            }
        } catch (err) {
            setError('An unexpected error occurred');
            Swal.fire('Error!', 'An unexpected error occurred.', 'error');
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
            />
        </div>
    );
};

export default PaymentLinkCreate;


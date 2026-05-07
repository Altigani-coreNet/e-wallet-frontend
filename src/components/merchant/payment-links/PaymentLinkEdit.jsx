import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchPaymentLinkDetails, updatePaymentLink } from '../../../services/paymentLinksService';
import PaymentLinkForm from './PaymentLinkForm';
import { useToolbar } from '../../../contexts/ToolbarContext';
import Swal from 'sweetalert2';

const PaymentLinkEdit = () => {
    const { id: paymentLinkId } = useParams();
    const navigate = useNavigate();
    const { setTitle, setBreadcrumbs, setActions } = useToolbar();
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);
    const [error, setError] = useState(null);
    const [validationErrors, setValidationErrors] = useState({});
    const [paymentLink, setPaymentLink] = useState(null);

    // Set toolbar title, breadcrumbs and actions
    useEffect(() => {
        if (paymentLink) {
            setTitle(`Edit Payment Link - ${paymentLink.uuid || paymentLinkId}`);
        } else {
            setTitle('Edit Payment Link');
        }
        
        setBreadcrumbs([
            { label: 'Dashboard', path: '/merchant/dashboard' },
            { label: 'Payment Links', path: '/merchant/payment-links' },
            { label: paymentLink?.uuid || 'Edit Payment Link', path: `/merchant/payment-links/${paymentLinkId}/edit`, active: true }
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
    }, [setTitle, setBreadcrumbs, setActions, navigate, paymentLink, paymentLinkId]);

    useEffect(() => {
        fetchPaymentLink();
    }, [paymentLinkId]);

    const fetchPaymentLink = async () => {
        setLoadingData(true);
        try {
            const data = await fetchPaymentLinkDetails(paymentLinkId);
            setPaymentLink(data);
        } catch (err) {
            setError('An unexpected error occurred');
            Swal.fire('Error!', 'An unexpected error occurred.', 'error');
        } finally {
            setLoadingData(false);
        }
    };

    const handleSubmit = async (formData) => {
        setLoading(true);
        setError(null);
        setValidationErrors({});

        try {
            const response = await updatePaymentLink(paymentLinkId, formData);
            
            if (response.success) {
                await Swal.fire({
                    title: 'Success!',
                    text: 'Payment link updated successfully.',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                });
                navigate('/merchant/payment-links');
            } else {
                const message = response.error || response.message || 'Failed to update payment link';
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

    if (loadingData) {
        return (
            <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    if (error && !paymentLink) {
        return (
            <div className="alert alert-danger">{error}</div>
        );
    }

    return (
        <div className="payment-link-edit">
            <PaymentLinkForm
                mode="edit"
                initialData={paymentLink}
                onSubmit={handleSubmit}
                loading={loading}
                error={error}
                validationErrors={validationErrors}
            />
        </div>
    );
};

export default PaymentLinkEdit;


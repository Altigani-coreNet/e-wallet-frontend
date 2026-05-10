import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { createPaymentLink } from '../../../services/paymentLinksService';
import PaymentLinkForm from './PaymentLinkForm';
import { useToolbar } from '../../../contexts/ToolbarContext';
import Swal from 'sweetalert2';

const PaymentLinkCreate = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { setTitle, setBreadcrumbs, setActions } = useToolbar();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [validationErrors, setValidationErrors] = useState({});

    // Set toolbar title, breadcrumbs and actions
    useEffect(() => {
        setTitle(t('merchant.pages.createPaymentLinkTitle'));
        
        setBreadcrumbs([
            { label: t('merchant.breadcrumbs.dashboard'), path: '/merchant/dashboard' },
            { label: t('merchant.breadcrumbs.paymentLinks'), path: '/merchant/payment-links' },
            { label: t('merchant.pages.createPaymentLinkTitle'), path: '/merchant/payment-links/create', active: true }
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
                {t('merchant.common.backToPaymentLinks')}
            </button>
        );

        return () => {
            setActions(null);
            setBreadcrumbs([]);
        };
    }, [setTitle, setBreadcrumbs, setActions, navigate, t, i18n.language]);

    const handleSubmit = async (formData) => {
        setLoading(true);
        setError(null);
        setValidationErrors({});

        try {
            const response = await createPaymentLink(formData);
            
            if (response.success) {
                await Swal.fire({
                    title: t('merchant.paymentLinks.createSuccessTitle'),
                    text: t('merchant.paymentLinks.createSuccessText'),
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                });
                navigate('/merchant/payment-links');
            } else {
                const message = response.error || response.message || t('merchant.paymentLinks.createFailed');
                setError(message);
                if (response.errors) setValidationErrors(response.errors);
                Swal.fire(t('merchant.common.error'), message, 'error');
            }
        } catch (err) {
            const apiErrors = err?.response?.data?.errors || {};
            const message = err?.response?.data?.message || t('merchant.paymentLinks.unexpectedError');
            setValidationErrors(apiErrors);
            setError(message);
            Swal.fire(t('merchant.common.error'), message, 'error');
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


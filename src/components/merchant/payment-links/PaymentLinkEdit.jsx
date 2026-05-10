import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchPaymentLinkDetails, updatePaymentLink } from '../../../services/paymentLinksService';
import PaymentLinkForm from './PaymentLinkForm';
import { useToolbar } from '../../../contexts/ToolbarContext';
import Swal from 'sweetalert2';

const PaymentLinkEdit = () => {
    const { t, i18n } = useTranslation();
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
            setTitle(t('merchant.pages.editPaymentLinkTitle', { id: paymentLink.uuid || paymentLinkId }));
        } else {
            setTitle(t('merchant.breadcrumbs.editPaymentLink'));
        }
        
        setBreadcrumbs([
            { label: t('merchant.breadcrumbs.dashboard'), path: '/merchant/dashboard' },
            { label: t('merchant.breadcrumbs.paymentLinks'), path: '/merchant/payment-links' },
            { label: paymentLink?.uuid || t('merchant.breadcrumbs.editPaymentLink'), path: `/merchant/payment-links/${paymentLinkId}/edit`, active: true }
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
    }, [setTitle, setBreadcrumbs, setActions, navigate, paymentLink, paymentLinkId, t, i18n.language]);

    useEffect(() => {
        fetchPaymentLink();
    }, [paymentLinkId]);

    const fetchPaymentLink = async () => {
        setLoadingData(true);
        try {
            const data = await fetchPaymentLinkDetails(paymentLinkId);
            setPaymentLink(data);
        } catch (err) {
            setError(t('merchant.paymentLinks.fetchUnexpected'));
            Swal.fire(t('merchant.common.error'), t('merchant.paymentLinks.fetchUnexpected'), 'error');
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
                    title: t('merchant.paymentLinks.updateSuccessTitle'),
                    text: t('merchant.paymentLinks.updateSuccessText'),
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                });
                navigate('/merchant/payment-links');
            } else {
                const message = response.error || response.message || t('merchant.paymentLinks.updateFailed');
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

    if (loadingData) {
        return (
            <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">{t('merchant.common.loading')}</span>
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


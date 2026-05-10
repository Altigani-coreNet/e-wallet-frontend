import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { sendPaymentLink } from '../../../services/paymentLinksService';
import Swal from 'sweetalert2';

const SendModal = ({ show, paymentLink, onClose, onSuccess }) => {
    const { t } = useTranslation();
    const [sendOptions, setSendOptions] = useState({
        send_email: false,
        send_whatsapp: false,
        send_sms: false
    });
    const [loading, setLoading] = useState(false);

    const handleCheckboxChange = (field) => {
        setSendOptions(prev => ({
            ...prev,
            [field]: !prev[field]
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!sendOptions.send_email && !sendOptions.send_whatsapp && !sendOptions.send_sms) {
            Swal.fire(t('merchant.common.error'), t('merchant.paymentLinks.modals.selectChannelError'), 'error');
            return;
        }

        setLoading(true);
        try {
            const response = await sendPaymentLink(paymentLink.id, sendOptions);
            if (response.success) {
                await Swal.fire({
                    title: t('merchant.paymentLinks.createSuccessTitle'),
                    text: response.message || t('merchant.paymentLinks.modals.sendSuccess'),
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                });
                onSuccess();
            } else {
                Swal.fire(t('merchant.common.error'), response.error || t('merchant.paymentLinks.modals.sendFailed'), 'error');
            }
        } catch (error) {
            Swal.fire(t('merchant.common.error'), t('merchant.paymentLinks.unexpectedError'), 'error');
        } finally {
            setLoading(false);
        }
    };

    if (!show) return null;

    const paymentLinkUrl = `${window.location.origin}/payment/${paymentLink.uuid}`;

    return (
        <>
            <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <form onSubmit={handleSubmit}>
                            <div className="modal-header">
                                <h5 className="modal-title">{t('merchant.paymentLinks.modals.sendTitle')}</h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={onClose}
                                    disabled={loading}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <div className="mb-4">
                                    <label className="form-label">{t('merchant.paymentLinks.modals.sendVia')}</label>
                                    
                                    <div className="form-check mb-2">
                                        <input
                                            className="form-check-input"
                                            type="checkbox"
                                            id="send-email"
                                            checked={sendOptions.send_email}
                                            onChange={() => handleCheckboxChange('send_email')}
                                        />
                                        <label className="form-check-label" htmlFor="send-email">
                                            {t('merchant.paymentLinks.modals.email')}
                                        </label>
                                    </div>

                                    <div className="form-check mb-2">
                                        <input
                                            className="form-check-input"
                                            type="checkbox"
                                            id="send-whatsapp"
                                            checked={sendOptions.send_whatsapp}
                                            onChange={() => handleCheckboxChange('send_whatsapp')}
                                        />
                                        <label className="form-check-label" htmlFor="send-whatsapp">
                                            {t('merchant.paymentLinks.modals.whatsapp')}
                                        </label>
                                    </div>

                                    <div className="form-check">
                                        <input
                                            className="form-check-input"
                                            type="checkbox"
                                            id="send-sms"
                                            checked={sendOptions.send_sms}
                                            onChange={() => handleCheckboxChange('send_sms')}
                                        />
                                        <label className="form-check-label" htmlFor="send-sms">
                                            {t('merchant.paymentLinks.modals.sms')}
                                        </label>
                                    </div>
                                </div>

                                <div className="alert alert-info">
                                    <strong>{t('merchant.paymentLinks.modals.paymentLinkUrl')}</strong>
                                    <div className="mt-2">
                                        <input
                                            type="text"
                                            className="form-control form-control-sm"
                                            value={paymentLinkUrl}
                                            readOnly
                                        />
                                    </div>
                                </div>

                                {paymentLink.customer_name && (
                                    <div className="alert alert-light">
                                        <strong>{t('merchant.paymentLinks.modals.customer')}</strong> {paymentLink.customer_name}
                                        {paymentLink.customer_email && (
                                            <div className="text-muted fs-7">
                                                {t('merchant.paymentLinks.modals.emailField')} {paymentLink.customer_email}
                                            </div>
                                        )}
                                        {paymentLink.customer_phone && (
                                            <div className="text-muted fs-7">
                                                {t('merchant.paymentLinks.modals.phoneField')} {paymentLink.customer_phone}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={onClose}
                                    disabled={loading}
                                >
                                    {t('merchant.paymentLinks.form.cancel')}
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2"></span>
                                            {t('merchant.paymentLinks.modals.sending')}
                                        </>
                                    ) : (
                                        t('merchant.paymentLinks.row.send')
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            <div className="modal-backdrop fade show"></div>
        </>
    );
};

export default SendModal;

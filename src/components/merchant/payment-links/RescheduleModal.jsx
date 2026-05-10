import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { updatePaymentLinkDate } from '../../../services/paymentLinksService';
import Swal from 'sweetalert2';

const RescheduleModal = ({ show, paymentLink, onClose, onSuccess }) => {
    const { t } = useTranslation();
    const [scheduledDate, setScheduledDate] = useState(
        paymentLink.scheduled_date ? paymentLink.scheduled_date.split(' ')[0] : ''
    );
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!scheduledDate) {
            Swal.fire(t('merchant.common.error'), t('merchant.paymentLinks.modals.selectDateError'), 'error');
            return;
        }

        setLoading(true);
        try {
            const response = await updatePaymentLinkDate(paymentLink.id, scheduledDate);
            if (response.success) {
                await Swal.fire({
                    title: t('merchant.paymentLinks.createSuccessTitle'),
                    text: t('merchant.paymentLinks.modals.rescheduleSuccess'),
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                });
                onSuccess();
            } else {
                Swal.fire(t('merchant.common.error'), response.error || t('merchant.paymentLinks.modals.rescheduleFailed'), 'error');
            }
        } catch (error) {
            Swal.fire(t('merchant.common.error'), t('merchant.paymentLinks.unexpectedError'), 'error');
        } finally {
            setLoading(false);
        }
    };

    if (!show) return null;

    return (
        <>
            <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <form onSubmit={handleSubmit}>
                            <div className="modal-header">
                                <h5 className="modal-title">{t('merchant.paymentLinks.modals.rescheduleTitle')}</h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={onClose}
                                    disabled={loading}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <label className="form-label required">{t('merchant.paymentLinks.modals.newScheduledDate')}</label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        value={scheduledDate}
                                        onChange={(e) => setScheduledDate(e.target.value)}
                                        required
                                        min={new Date().toISOString().split('T')[0]}
                                    />
                                </div>
                                <div className="alert alert-info">
                                    <strong>{t('merchant.paymentLinks.modals.paymentLinkLabel')}</strong> {paymentLink.uuid}
                                </div>
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
                                            {t('merchant.paymentLinks.form.saving')}
                                        </>
                                    ) : (
                                        t('merchant.common.save')
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

export default RescheduleModal;

import React, { useState } from 'react';
import { updatePaymentLinkDate } from '../../../services/paymentLinksService';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';

const RescheduleModal = ({ show, paymentLink, onClose, onSuccess }) => {
    const [scheduledDate, setScheduledDate] = useState(
        paymentLink.scheduled_date ? paymentLink.scheduled_date.split(' ')[0] : ''
    );
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!scheduledDate) {
            Swal.fire('Error!', 'Please select a date.', 'error');
            return;
        }

        setLoading(true);
        try {
            const response = await updatePaymentLinkDate(paymentLink.id, scheduledDate);
            if (response.success) {
                await Swal.fire({
                    title: 'Success!',
                    text: 'Payment link rescheduled successfully.',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                });
                onSuccess();
            } else {
                Swal.fire('Error!', response.error || 'Failed to reschedule payment link.', 'error');
            }
        } catch (error) {
            Swal.fire('Error!', 'An unexpected error occurred.', 'error');
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
                                <h5 className="modal-title">Reschedule Payment Link</h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={onClose}
                                    disabled={loading}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <label className="form-label required">New Scheduled Date</label>
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
                                    <strong>Payment Link:</strong> {paymentLink.uuid}
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={onClose}
                                    disabled={loading}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2"></span>
                                            Saving...
                                        </>
                                    ) : (
                                        'Save'
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


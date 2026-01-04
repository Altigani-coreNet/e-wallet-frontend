import React, { useState, useEffect } from 'react';
import api from '../../../utils/api';
import { POS_API_BASE } from '../../../utils/constants';
import { toast } from 'react-toastify';

const ReceivePaymentModal = ({ show, onClose, sale, onSuccess }) => {
    const [selectedSplitPayment, setSelectedSplitPayment] = useState(null);
    const [paymentAmount, setPaymentAmount] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState('Cash');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (show && sale) {
            // If split payments exist, find the last unpaid one
            if (sale.split_payments && sale.split_payments.length > 0) {
                const unpaidSplitPayments = sale.split_payments.filter(sp => !sp.is_paid);
                if (unpaidSplitPayments.length > 0) {
                    const lastUnpaid = unpaidSplitPayments[unpaidSplitPayments.length - 1];
                    setSelectedSplitPayment(lastUnpaid.id);
                    setPaymentAmount(lastUnpaid.amount);
                    setPaymentMethod(lastUnpaid.payment_method);
                } else {
                    // All split payments are paid, calculate remaining due
                    const totalPaid = sale.split_payments.reduce((sum, sp) => sum + (sp.is_paid ? sp.amount : 0), 0);
                    const remainingDue = (sale.grand_total || 0) - totalPaid;
                    setPaymentAmount(remainingDue > 0 ? remainingDue : 0);
                }
            } else {
                // No split payments, use remaining due amount
                const dueAmount = (sale.grand_total || 0) - (sale.paid_amount || 0);
                setPaymentAmount(dueAmount > 0 ? dueAmount : 0);
            }
        }
    }, [show, sale]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const response = await api.post(`${POS_API_BASE}/v2/sales/${sale.id}/receive-payment`, {
                amount: parseFloat(paymentAmount),
                payment_method: paymentMethod,
                split_payment_id: selectedSplitPayment,
            });

            const data = response.data;

            // Show success toast
            toast.success('Payment received successfully!', {
                position: 'top-right',
                autoClose: 3000,
            });

            if (onSuccess) {
                onSuccess(data);
            }
            onClose();
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || 'Failed to receive payment';
            
            // Show error toast
            toast.error(errorMessage, {
                position: 'top-right',
                autoClose: 5000,
            });
            
            // Also set error for display in modal
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (!show) return null;

    const dueAmount = (sale.grand_total || 0) - (sale.paid_amount || 0);
    const hasSplitPayments = sale.split_payments && sale.split_payments.length > 0;
    const unpaidSplitPayments = hasSplitPayments 
        ? sale.split_payments.filter(sp => !sp.is_paid)
        : [];

    return (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                    <div className="modal-header">
                        <h3 className="modal-title">Receive Payment</h3>
                        <button
                            type="button"
                            className="btn btn-sm btn-icon btn-active-color-primary"
                            onClick={onClose}
                        >
                            <i className="ki-duotone ki-cross fs-1">
                                <span className="path1"></span>
                                <span className="path2"></span>
                            </i>
                        </button>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="modal-body">
                            {error && (
                                <div className="alert alert-danger">
                                    {error}
                                </div>
                            )}

                            {hasSplitPayments && unpaidSplitPayments.length > 0 && (
                                <div className="mb-5">
                                    <label className="form-label fw-bold required">Select Split Payment:</label>
                                    <select
                                        className="form-select form-select-solid"
                                        value={selectedSplitPayment || ''}
                                        onChange={(e) => {
                                            const splitId = e.target.value ? parseInt(e.target.value) : null;
                                            setSelectedSplitPayment(splitId);
                                            if (splitId) {
                                                const selected = unpaidSplitPayments.find(sp => sp.id === splitId);
                                                if (selected) {
                                                    setPaymentAmount(selected.amount);
                                                    setPaymentMethod(selected.payment_method);
                                                }
                                            }
                                        }}
                                    >
                                        <option value="">Select a split payment</option>
                                        {unpaidSplitPayments.map((split) => (
                                            <option key={split.id} value={split.id}>
                                                {split.payment_method} - {sale.currency_symbol || '$'}{parseFloat(split.amount).toFixed(2)} {split.is_paid ? '(Paid)' : '(Unpaid)'}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="form-text">Paid split payments are not shown</div>
                                </div>
                            )}

                            <div className="mb-5">
                                <label className="form-label fw-bold required">Payment Method:</label>
                                <select
                                    className="form-select form-select-solid"
                                    value={paymentMethod}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                    required
                                >
                                    <option value="Cash">Cash</option>
                                    <option value="Card">Card</option>
                                    <option value="Payment Link" disabled>Payment Link (Coming Soon)</option>
                                    <option value="QR" disabled>QR (Coming Soon)</option>
                                </select>
                            </div>

                            <div className="mb-5">
                                <label className="form-label fw-bold required">Payment Amount:</label>
                                <input
                                    type="number"
                                    className="form-control form-control-solid"
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(e.target.value)}
                                    min="0"
                                    max={dueAmount}
                                    step="0.01"
                                    required
                                />
                                <div className="form-text">Maximum: {sale.currency_symbol || '$'}{dueAmount.toFixed(2)}</div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn btn-light"
                                onClick={onClose}
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={loading || paymentAmount <= 0 || paymentAmount > dueAmount}
                            >
                                {loading ? 'Processing...' : 'Receive Payment'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ReceivePaymentModal;


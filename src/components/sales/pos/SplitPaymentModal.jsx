import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

const PAYMENT_METHOD_OPTIONS = [
    { value: '0', label: 'Cash', disabled: false },
    { value: '1', label: 'Card', disabled: false },
    // Render but disable these until implemented
    { value: '2', label: 'Payment Link', disabled: true },
    { value: '3', label: 'QR', disabled: true },
];

const SplitPaymentModal = ({ isOpen, onClose, cartTotal, onConfirm, existingSplits }) => {
    const [rows, setRows] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const toNumber = (val) => {
        const n = parseFloat(val);
        return isNaN(n) ? 0 : n;
    };

    const distributeEven = (total, count) => {
        if (count <= 0) return [];
        const base = Math.floor((total / count) * 100) / 100;
        let remainder = Math.round((total - base * count) * 100); // in cents to fix floating issues
        const amounts = Array.from({ length: count }, () => base);
        for (let i = 0; i < amounts.length && remainder > 0; i++) {
            amounts[i] = Math.round((amounts[i] + 0.01) * 100) / 100;
            remainder -= 1;
        }
        return amounts;
    };

    const rebalanceAll = (count) => {
        const amounts = distributeEven(cartTotal, count);
        setRows((prev) =>
            Array.from({ length: count }).map((_, idx) => ({
                method: prev[idx]?.method || '0',
                amount: amounts[idx] ?? 0,
            }))
        );
    };

    useEffect(() => {
        if (isOpen) {
            // Initialize with existing splits or a default single row
            if (existingSplits && existingSplits.length > 0) {
                setRows(existingSplits);
            } else {
                rebalanceAll(1);
            }
            setIsSubmitting(false);
        }
    }, [isOpen, existingSplits, cartTotal]);

    if (!isOpen) return null;

    const totalEntered = rows.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);

    const handleChange = (index, field, value) => {
        if (field === 'method') {
            const updated = [...rows];
            updated[index] = {
                ...updated[index],
                method: value
            };
            setRows(updated);
            return;
        }

        // Amount change with auto-redistribution for following rows
        const safeValue = toNumber(String(value).replace(',', '.'));
        const updated = [...rows];
        updated[index] = {
            ...updated[index],
            amount: safeValue
        };

        const sumBefore = updated
            .slice(0, index)
            .reduce((s, r) => s + toNumber(r.amount), 0);

        // Clamp edited amount so total does not exceed cartTotal
        const maxForEdited = Math.max(cartTotal - sumBefore, 0);
        const editedAmount = Math.min(safeValue, maxForEdited);
        updated[index].amount = editedAmount;

        const remainingRows = updated.length - index - 1;
        let remainingTotal = cartTotal - sumBefore - editedAmount;
        if (remainingTotal < 0) remainingTotal = 0;

        if (remainingRows > 0) {
            const amounts = distributeEven(remainingTotal, remainingRows);
            for (let i = index + 1; i < updated.length; i++) {
                updated[i].amount = amounts[i - index - 1] || 0;
            }
        }

        setRows(updated);
    };

    const handleAddRow = () => {
        setRows((prev) => {
            const nextCount = prev.length + 1;
            const amounts = distributeEven(cartTotal, nextCount);
            return Array.from({ length: nextCount }).map((_, idx) => ({
                method: prev[idx]?.method || '0',
                amount: amounts[idx] ?? 0
            }));
        });
    };

    const handleRemoveRow = (index) => {
        if (rows.length === 1) {
            Swal.fire({
                title: 'At least one payment is required',
                icon: 'warning',
                confirmButtonText: 'OK',
            });
            return;
        }
        setRows((prev) => {
            const filtered = prev.filter((_, i) => i !== index);
            const amounts = distributeEven(cartTotal, filtered.length);
            return filtered.map((row, idx) => ({
                ...row,
                amount: amounts[idx] ?? 0
            }));
        });
    };

    const validate = () => {
        if (rows.length === 0) {
            Swal.fire({
                title: 'No payments',
                text: 'Please add at least one payment row.',
                icon: 'warning',
                confirmButtonText: 'OK',
            });
            return false;
        }

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const amount = parseFloat(row.amount);
            if (!row.method) {
                Swal.fire({
                    title: 'Payment method required',
                    text: `Please select a payment method for row #${i + 1}.`,
                    icon: 'warning',
                    confirmButtonText: 'OK',
                });
                return false;
            }
            if (isNaN(amount) || amount <= 0) {
                Swal.fire({
                    title: 'Invalid amount',
                    text: `Amount for row #${i + 1} must be greater than 0.`,
                    icon: 'warning',
                    confirmButtonText: 'OK',
                });
                return false;
            }
        }

        const roundedTotal = parseFloat(totalEntered.toFixed(2));
        const roundedCart = parseFloat(cartTotal.toFixed(2));

        if (roundedTotal !== roundedCart) {
            Swal.fire({
                title: 'Amount mismatch',
                html: `The sum of split payments (<b>${roundedTotal.toFixed(
                    2
                )}</b>) must equal the cart total (<b>${roundedCart.toFixed(2)}</b>).`,
                icon: 'error',
                confirmButtonText: 'OK',
            });
            return false;
        }

        return true;
    };

    const handleSubmit = () => {
        if (isSubmitting) return;
        if (!validate()) return;

        setIsSubmitting(true);

        const normalizedRows = rows.map((r) => ({
            method: r.method,
            amount: parseFloat(r.amount),
            label:
                PAYMENT_METHOD_OPTIONS.find((o) => o.value === r.method)?.label ||
                r.method,
        }));

        onConfirm(normalizedRows);
        setIsSubmitting(false);
        onClose();
    };

    return (
        <div
            className="modal fade show d-block"
            tabIndex="-1"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
            <div className="modal-dialog modal-dialog-centered modal-lg">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Split Payment</h5>
                        <button
                            type="button"
                            className="btn-close"
                            onClick={onClose}
                            disabled={isSubmitting}
                        ></button>
                    </div>
                    <div className="modal-body">
                        <div className="mb-4 d-flex justify-content-between align-items-center">
                            <span className="fw-bold">Cart Total:</span>
                            <span className="fw-bold fs-4 text-primary">
                                ${cartTotal.toFixed(2)}
                            </span>
                        </div>

                        <div className="table-responsive mb-3">
                            <table className="table align-middle">
                                <thead>
                                    <tr>
                                        <th style={{ width: '40%' }}>Payment Method</th>
                                        <th style={{ width: '40%' }}>Amount</th>
                                        <th style={{ width: '20%' }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((row, index) => (
                                        <tr key={index}>
                                            <td>
                                                <select
                                                    className="form-select"
                                                    value={row.method}
                                                    onChange={(e) =>
                                                        handleChange(
                                                            index,
                                                            'method',
                                                            e.target.value
                                                        )
                                                    }
                                                    disabled={isSubmitting}
                                                >
                                                    {PAYMENT_METHOD_OPTIONS.map(
                                                        (opt) => (
                                                            <option
                                                                key={opt.value}
                                                                value={opt.value}
                                                                disabled={opt.disabled}
                                                            >
                                                                {opt.label}
                                                                {opt.disabled ? '' : ''}
                                                            </option>
                                                        )
                                                    )}
                                                </select>
                                            </td>
                                            <td>
                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    min="0"
                                                    step="0.01"
                                                    value={row.amount}
                                                    onChange={(e) =>
                                                        handleChange(
                                                            index,
                                                            'amount',
                                                            e.target.value
                                                        )
                                                    }
                                                    disabled={isSubmitting}
                                                />
                                            </td>
                                            <td className="text-end">
                                                <button
                                                    type="button"
                                                    className="btn btn-icon btn-sm btn-light-danger"
                                                    onClick={() =>
                                                        handleRemoveRow(index)
                                                    }
                                                    disabled={isSubmitting}
                                                >
                                                    <i className="ki-duotone ki-trash fs-4">
                                                        <span className="path1"></span>
                                                        <span className="path2"></span>
                                                        <span className="path3"></span>
                                                        <span className="path4"></span>
                                                        <span className="path5"></span>
                                                    </i>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <button
                                type="button"
                                className="btn btn-light-primary btn-sm"
                                onClick={handleAddRow}
                                disabled={isSubmitting}
                            >
                                <i className="ki-duotone ki-plus fs-4 me-1">
                                    <span className="path1"></span>
                                    <span className="path2"></span>
                                </i>
                                Add Payment Method
                            </button>
                            <div className="text-end">
                                <div className="fw-bold">
                                    Entered Total:{' '}
                                    <span
                                        className={
                                            totalEntered.toFixed(2) ===
                                            cartTotal.toFixed(2)
                                                ? 'text-success'
                                                : 'text-danger'
                                        }
                                    >
                                        ${totalEntered.toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button
                            type="button"
                            className="btn btn-light"
                            onClick={onClose}
                            disabled={isSubmitting}
                        >
                            Pay Later
                        </button>
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <span
                                        className="spinner-border spinner-border-sm me-2"
                                        role="status"
                                    ></span>
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <i className="ki-duotone ki-element-equal fs-4 me-2">
                                        <span className="path1"></span>
                                        <span className="path2"></span>
                                    </i>
                                    Confirm Split
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SplitPaymentModal;



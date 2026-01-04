import React from 'react';

const PAYMENT_METHODS = [
    { value: '0', label: 'Cash', icon: 'ki-dollar', color: 'success' },
    { value: '1', label: 'Card', icon: 'ki-credit-cart', color: 'primary' },
    // Use specific icons for Payment Link & QR
    { value: '2', label: 'Payment Link', icon: 'ki-fasten', color: 'info', disabled: false },
    { value: '3', label: 'QR', icon: 'ki-fingerprint-scanning', color: 'warning', disabled: true },
];

const PaymentMethodModal = ({ isOpen, onClose, onSelect, cartTotal }) => {
    if (!isOpen) return null;

    const handleSelect = (methodObj) => {
        if (methodObj.disabled) {
            return; // Don't allow selection of disabled methods
        }
        onSelect(methodObj.value);
    };

    return (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered modal-lg">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title fw-bold">Select Payment Method</h5>
                        <button
                            type="button"
                            className="btn-close"
                            onClick={onClose}
                        ></button>
                    </div>
                    <div className="modal-body">
                        <div className="text-center mb-4">
                            <h6 className="text-muted mb-2">Total Amount</h6>
                            <h3 className="fw-bold text-primary">${cartTotal?.toFixed(2) || '0.00'}</h3>
                        </div>

                        <div className="row g-4">
                            {PAYMENT_METHODS.map((method) => (
                                <div key={method.value} className="col-6">
                                    <div
                                        className={`card h-100 cursor-pointer ${
                                            method.disabled
                                                ? 'opacity-50'
                                                : 'card-hover border-primary border-2-hover'
                                        }`}
                                        onClick={() => handleSelect(method)}
                                        style={{
                                            cursor: method.disabled ? 'not-allowed' : 'pointer',
                                            transition: 'all 0.3s ease',
                                        }}
                                    >
                                        <div className="card-body d-flex flex-column align-items-center justify-content-center p-5">
                                            <div
                                                className={`symbol symbol-90px mb-3 bg-light-${method.color} d-flex align-items-center justify-content-center`}
                                            >
                                                <i className={`ki-duotone ${method.icon} fs-3x text-${method.color}`}>
                                                    <span className="path1"></span>
                                                    <span className="path2"></span>
                                                    {method.icon === 'ki-fingerprint-scanning' && (
                                                        <>
                                                            <span className="path3"></span>
                                                            <span className="path4"></span>
                                                            <span className="path5"></span>
                                                        </>
                                                    )}
                                                </i>
                                            </div>
                                            <h6 className="fw-bold text-gray-800 mb-1">{method.label}</h6>
                                            {method.disabled && (
                                                <small className="text-muted">Coming Soon</small>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button
                            type="button"
                            className="btn btn-light"
                            onClick={onClose}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentMethodModal;


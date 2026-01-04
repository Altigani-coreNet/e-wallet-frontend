import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

const CustomerInfoModal = ({ isOpen, onClose, onConfirm, selectedCustomer, cartTotal }) => {
    const [formData, setFormData] = useState({
        name: selectedCustomer?.name || '',
        email: selectedCustomer?.email || '',
        phone: selectedCustomer?.phone || '',
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    // Sync form defaults when opening or when selectedCustomer changes
    useEffect(() => {
        if (isOpen) {
            setFormData({
                name: selectedCustomer?.name || '',
                email: selectedCustomer?.email || '',
                phone: selectedCustomer?.phone || '',
            });
            setErrors({});
        }
    }, [isOpen, selectedCustomer]);

    if (!isOpen) return null;

    const validateForm = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Customer name is required';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Customer email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        if (!formData.phone.trim()) {
            newErrors.phone = 'Customer phone is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);
        try {
            await onConfirm(formData);
            onClose();
        } catch (error) {
            Swal.fire({
                title: 'Error',
                text: error.message || 'Failed to process payment link',
                icon: 'error',
                confirmButtonText: 'OK'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: null }));
        }
    };

    return (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title fw-bold">Customer Information for Payment Link</h5>
                        <button
                            type="button"
                            className="btn-close"
                            onClick={onClose}
                            disabled={loading}
                        ></button>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="modal-body">
                            <div className="text-center mb-4">
                                <h6 className="text-muted mb-2">Total Amount</h6>
                                <h3 className="fw-bold text-primary">${cartTotal?.toFixed(2) || '0.00'}</h3>
                            </div>

                            <div className="mb-4">
                                <label className="form-label fw-bold">
                                    Customer Name <span className="text-danger">*</span>
                                </label>
                                <input
                                    type="text"
                                    className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                                    value={formData.name}
                                    onChange={(e) => handleChange('name', e.target.value)}
                                    placeholder="Enter customer name"
                                    disabled={loading}
                                />
                                {errors.name && (
                                    <div className="invalid-feedback">{errors.name}</div>
                                )}
                            </div>

                            <div className="mb-4">
                                <label className="form-label fw-bold">
                                    Customer Email <span className="text-danger">*</span>
                                </label>
                                <input
                                    type="email"
                                    className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                                    value={formData.email}
                                    onChange={(e) => handleChange('email', e.target.value)}
                                    placeholder="Enter customer email"
                                    disabled={loading}
                                />
                                {errors.email && (
                                    <div className="invalid-feedback">{errors.email}</div>
                                )}
                            </div>

                            <div className="mb-4">
                                <label className="form-label fw-bold">
                                    Customer Phone <span className="text-danger">*</span>
                                </label>
                                <input
                                    type="tel"
                                    className={`form-control ${errors.phone ? 'is-invalid' : ''}`}
                                    value={formData.phone}
                                    onChange={(e) => handleChange('phone', e.target.value)}
                                    placeholder="Enter customer phone"
                                    disabled={loading}
                                />
                                {errors.phone && (
                                    <div className="invalid-feedback">{errors.phone}</div>
                                )}
                            </div>

                            <div className="alert alert-info d-flex align-items-center p-3">
                                <i className="ki-duotone ki-information-5 fs-2x text-info me-2">
                                    <span className="path1"></span>
                                    <span className="path2"></span>
                                    <span className="path3"></span>
                                </i>
                                <div className="d-flex flex-column">
                                    <span className="fw-bold">Payment Link will be generated</span>
                                    <small className="text-muted">The customer will receive a payment link to complete the payment</small>
                                </div>
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
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                        Creating...
                                    </>
                                ) : (
                                    'Create Payment Link'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CustomerInfoModal;


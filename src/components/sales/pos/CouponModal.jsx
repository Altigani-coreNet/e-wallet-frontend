import React, { useState } from 'react';
import { apiPost } from '../../../utils/apiUtils';
import { POS_API_BASE } from '../../../utils/constants';
import Swal from 'sweetalert2';

const CouponModal = ({ isOpen, onClose, onApply, cartSubtotal }) => {
    const [couponCode, setCouponCode] = useState('');
    const [isValidating, setIsValidating] = useState(false);
    const [isApplying, setIsApplying] = useState(false);
    const [couponDetails, setCouponDetails] = useState(null);
    const [validationError, setValidationError] = useState(null);

    if (!isOpen) return null;

    const handleValidateCoupon = async () => {
        if (!couponCode.trim()) {
            Swal.fire({
                title: 'Coupon Code Required',
                text: 'Please enter a coupon code',
                icon: 'warning',
                confirmButtonText: 'OK'
            });
            return;
        }

        setIsValidating(true);
        setValidationError(null);
        setCouponDetails(null);

        try {
            const response = await apiPost(
                `${POS_API_BASE}/v1/coupons/validate`,
                {
                    code: couponCode.trim(),
                    amount: cartSubtotal
                }
            );

            if (response.success) {
                const { valid, coupon, discount, reasons } = response.data.data;

                if (valid) {
                    setCouponDetails({
                        coupon,
                        discount: discount || 0
                    });
                    setValidationError(null);
                } else {
                    setValidationError(reasons && reasons.length > 0 ? reasons.join(', ') : 'Coupon is not valid');
                    setCouponDetails(null);
                }
            } else {
                setValidationError(response.error || 'Failed to validate coupon');
                setCouponDetails(null);
            }
        } catch (error) {
            console.error('Coupon validation error:', error);
            setValidationError('Failed to validate coupon. Please try again.');
            setCouponDetails(null);
        } finally {
            setIsValidating(false);
        }
    };

    const handleApplyCoupon = async () => {
        if (!couponDetails || !couponCode.trim()) {
            return;
        }

        setIsApplying(true);

        try {
            const response = await apiPost(
                `${POS_API_BASE}/v1/apply/promo/code`,
                {
                    code: couponCode.trim(),
                    price: cartSubtotal
                }
            );

            if (response.success) {
                const { discount, id } = response.data.data;
                
                // Call the onApply callback with coupon details
                onApply({
                    id,
                    code: couponCode.trim(),
                    discount,
                    coupon: couponDetails.coupon
                });

                // Show success message
                Swal.fire({
                    title: 'Coupon Applied!',
                    text: `Discount of $${discount.toFixed(2)} has been applied to your cart.`,
                    icon: 'success',
                    confirmButtonText: 'OK',
                    timer: 2000
                });

                // Close modal and reset
                handleClose();
            } else {
                Swal.fire({
                    title: 'Failed to Apply Coupon',
                    text: response.error || 'Could not apply coupon. Please try again.',
                    icon: 'error',
                    confirmButtonText: 'OK'
                });
            }
        } catch (error) {
            console.error('Coupon apply error:', error);
            Swal.fire({
                title: 'Error',
                text: 'Failed to apply coupon. Please try again.',
                icon: 'error',
                confirmButtonText: 'OK'
            });
        } finally {
            setIsApplying(false);
        }
    };

    const handleClose = () => {
        setCouponCode('');
        setCouponDetails(null);
        setValidationError(null);
        onClose();
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !isValidating) {
            handleValidateCoupon();
        }
    };

    return (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Apply Coupon</h5>
                        <button
                            type="button"
                            className="btn-close"
                            onClick={handleClose}
                            disabled={isApplying}
                        ></button>
                    </div>
                    <div className="modal-body">
                        {/* Coupon Code Input */}
                        <div className="mb-4">
                            <label htmlFor="couponCode" className="form-label fw-bold">
                                Enter Coupon Code
                            </label>
                            <div className="input-group">
                                <input
                                    type="text"
                                    className="form-control form-control-lg"
                                    id="couponCode"
                                    placeholder="Enter coupon code"
                                    value={couponCode}
                                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                    onKeyPress={handleKeyPress}
                                    disabled={isValidating || isApplying}
                                />
                                <button
                                    className="btn btn-primary"
                                    type="button"
                                    onClick={handleValidateCoupon}
                                    disabled={isValidating || isApplying || !couponCode.trim()}
                                >
                                    {isValidating ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                            Validating...
                                        </>
                                    ) : (
                                        <>
                                            <i className="ki-duotone ki-magnifier fs-4 me-2">
                                                <span className="path1"></span>
                                                <span className="path2"></span>
                                            </i>
                                            Search
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Validation Error */}
                        {validationError && (
                            <div className="alert alert-danger d-flex align-items-center mb-4">
                                <i className="ki-duotone ki-information-5 fs-2 me-2">
                                    <span className="path1"></span>
                                    <span className="path2"></span>
                                    <span className="path3"></span>
                                </i>
                                <div>{validationError}</div>
                            </div>
                        )}

                        {/* Coupon Details */}
                        {couponDetails && (
                            <div className="card bg-light-primary mb-4">
                                <div className="card-body">
                                    <h6 className="card-title fw-bold mb-3">
                                        <i className="ki-duotone ki-check-circle fs-2 text-success me-2">
                                            <span className="path1"></span>
                                            <span className="path2"></span>
                                        </i>
                                        Coupon Valid!
                                    </h6>
                                    
                                    <div className="mb-3">
                                        <div className="d-flex justify-content-between mb-2">
                                            <span className="text-muted">Coupon Name:</span>
                                            <span className="fw-bold">{couponDetails.coupon.name}</span>
                                        </div>
                                        <div className="d-flex justify-content-between mb-2">
                                            <span className="text-muted">Code:</span>
                                            <span className="fw-bold">{couponDetails.coupon.code}</span>
                                        </div>
                                        <div className="d-flex justify-content-between mb-2">
                                            <span className="text-muted">Type:</span>
                                            <span className="fw-bold">{couponDetails.coupon.type}</span>
                                        </div>
                                        <div className="d-flex justify-content-between mb-2">
                                            <span className="text-muted">Discount Amount:</span>
                                            <span className="fw-bold text-success">
                                                {couponDetails.coupon.type === 'Percentage' 
                                                    ? `${couponDetails.coupon.amount}%` 
                                                    : `$${couponDetails.coupon.amount.toFixed(2)}`}
                                            </span>
                                        </div>
                                        {couponDetails.coupon.min_amount && (
                                            <div className="d-flex justify-content-between mb-2">
                                                <span className="text-muted">Minimum Amount:</span>
                                                <span className="fw-bold">${couponDetails.coupon.min_amount.toFixed(2)}</span>
                                            </div>
                                        )}
                                        {couponDetails.coupon.max_amount && (
                                            <div className="d-flex justify-content-between mb-2">
                                                <span className="text-muted">Maximum Amount:</span>
                                                <span className="fw-bold">${couponDetails.coupon.max_amount.toFixed(2)}</span>
                                            </div>
                                        )}
                                        {couponDetails.coupon.expired_at && (
                                            <div className="d-flex justify-content-between mb-2">
                                                <span className="text-muted">Expires:</span>
                                                <span className="fw-bold">
                                                    {new Date(couponDetails.coupon.expired_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                        )}
                                        <hr className="my-2" />
                                        <div className="d-flex justify-content-between">
                                            <span className="text-muted fw-bold">Your Discount:</span>
                                            <span className="fw-bold text-success fs-4">
                                                ${couponDetails.discount.toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="modal-footer">
                        <button
                            type="button"
                            className="btn btn-light"
                            onClick={handleClose}
                            disabled={isApplying}
                        >
                            Cancel
                        </button>
                        {couponDetails && (
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={handleApplyCoupon}
                                disabled={isApplying}
                            >
                                {isApplying ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                        Applying...
                                    </>
                                ) : (
                                    <>
                                        <i className="ki-duotone ki-check fs-4 me-2">
                                            <span className="path1"></span>
                                            <span className="path2"></span>
                                        </i>
                                        Apply to Cart
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CouponModal;




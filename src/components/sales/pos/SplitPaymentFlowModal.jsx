import React from 'react';

const SplitPaymentFlowModal = ({
    visible,
    queue,
    currentIndex,
    loading,
    error,
    onClose,
    onProceed,
}) => {
    if (!visible || !queue || !queue[currentIndex]) return null;

    const current = queue[currentIndex];

    return (
        <div
            className="modal fade show d-block"
            tabIndex="-1"
            style={{ backgroundColor: 'rgba(0,0,0,0.35)' }}
        >
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">
                            Payment {currentIndex + 1} of {queue.length}
                        </h5>
                        <button
                            type="button"
                            className="btn-close"
                            onClick={onClose}
                            disabled={loading}
                        ></button>
                    </div>
                    <div className="modal-body">
                        {error && (
                            <div className="alert alert-danger py-2 mb-3">
                                {error}
                            </div>
                        )}

                        <div className="text-center mb-3">
                            <div
                                className="position-relative d-inline-flex align-items-center justify-content-center"
                                style={{
                                    width: '140px',
                                    height: '140px'
                                }}
                            >
                                {loading && (
                                    <div
                                        className="spinner-border text-primary position-absolute"
                                        role="status"
                                        style={{
                                            width: '140px',
                                            height: '140px',
                                            borderWidth: '10px'
                                        }}
                                    ></div>
                                )}
                                <div
                                    className="rounded-circle border border-2 border-primary d-flex align-items-center justify-content-center bg-light fw-bold text-primary"
                                    style={{
                                        width: '120px',
                                        height: '120px',
                                        fontSize: '1.6rem'
                                    }}
                                >
                                    ${Number(current.amount).toFixed(2)}
                                </div>
                            </div>
                        </div>

                        <div className="text-center">
                            <div className="fw-semibold text-muted mb-1">
                                Method
                            </div>
                            <div className="fw-bold fs-5">
                                {current.method}
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
                            type="button"
                            className="btn btn-primary"
                            onClick={onProceed}
                            disabled={loading}
                        >
                            {loading ? 'Processing...' : 'Proceed Payment'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SplitPaymentFlowModal;











import React, { useEffect, useMemo, useState } from 'react';

const FIELD_OPTIONS = [
    { value: 'name', label: 'Business Name' },
    { value: 'owner_name', label: 'Owner Name' },
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Phone' },
    { value: 'address', label: 'Address' },
    { value: 'business_type', label: 'Business Type' },
    { value: 'trade_license_number', label: 'Trade License Number' },
    { value: 'tax_certified_number', label: 'Tax Number' },
    { value: 'country', label: 'Country' },
    { value: 'city', label: 'City' },
];

const ATTACHMENT_OPTIONS = [
    { value: 'company_logo_document', label: 'Company Logo' },
    { value: 'trade_license_document', label: 'Trade License Document' },
    { value: 'tax_certificate_document', label: 'Tax Certificate Document' },
    { value: 'identity_document', label: 'Identity Document' },
];

const MerchantRejectModal = ({ isOpen, merchant, onClose, onConfirm, isSubmitting = false }) => {
    const [selectedFields, setSelectedFields] = useState([]);
    const [selectedAttachments, setSelectedAttachments] = useState([]);
    const [customReason, setCustomReason] = useState('');

    useEffect(() => {
        if (isOpen) {
            setSelectedFields([]);
            setSelectedAttachments([]);
            setCustomReason('');
        }
    }, [isOpen]);

    if (!isOpen || !merchant) {
        return null;
    }

    const toggleSelection = (value, setter) => {
        setter((prev) =>
            prev.includes(value)
                ? prev.filter((item) => item !== value)
                : [...prev, value]
        );
    };

    const generatedReason = useMemo(() => {
        const selections = [...selectedFields, ...selectedAttachments];
        if (selections.length === 0) {
            return '';
        }

        const labels = selections.map((value) => {
            const field = FIELD_OPTIONS.find((option) => option.value === value);
            const attachment = ATTACHMENT_OPTIONS.find((option) => option.value === value);
            return field?.label || attachment?.label || value;
        });

        if (labels.length === 1) {
            return `Please review the merchant submission. The ${labels[0]} provided is invalid or missing.`;
        }

        const last = labels.pop();
        return `Please review the merchant submission. The following items are invalid or missing: ${labels.join(', ')}, and ${last}.`;
    }, [selectedFields, selectedAttachments]);

    const reason = customReason || generatedReason;
    const isValidReason = reason.trim().length >= 10;

    const handleSubmit = (event) => {
        event.preventDefault();
        if (!isValidReason) return;

        onConfirm?.({
            merchantId: merchant.id,
            rejection_reason: reason.trim(),
            invalid_fields: selectedFields,
            missing_attachments: selectedAttachments,
        });
    };

    return (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
            <div className="modal-dialog modal-dialog-centered modal-lg">
                <div className="modal-content">
                    <form onSubmit={handleSubmit}>
                        <div className="modal-header">
                            <h5 className="modal-title">Reject Merchant</h5>
                            <button type="button" className="btn-close" onClick={onClose} disabled={isSubmitting}></button>
                        </div>
                        <div className="modal-body">
                            <div className="alert alert-warning d-flex align-items-center">
                                <i className="ki-duotone ki-information-5 fs-2hx text-warning me-4">
                                    <span className="path1"></span>
                                    <span className="path2"></span>
                                    <span className="path3"></span>
                                </i>
                                <div>
                                    <h5 className="mb-1">Rejection Details</h5>
                                    <p className="mb-0 text-gray-700">
                                        Select the fields or documents that require changes and provide a clear reason so the merchant knows what to fix.
                                    </p>
                                </div>
                            </div>

                            <div className="row g-5">
                                <div className="col-md-6">
                                    <h6 className="fw-semibold mb-3">Invalid Fields</h6>
                                    <div className="d-flex flex-column gap-3">
                                        {FIELD_OPTIONS.map((option) => (
                                            <label key={option.value} className="form-check form-check-custom form-check-solid">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    checked={selectedFields.includes(option.value)}
                                                    onChange={() => toggleSelection(option.value, setSelectedFields)}
                                                />
                                                <span className="form-check-label text-gray-700">{option.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <h6 className="fw-semibold mb-3">Missing / Invalid Attachments</h6>
                                    <div className="d-flex flex-column gap-3">
                                        {ATTACHMENT_OPTIONS.map((option) => (
                                            <label key={option.value} className="form-check form-check-custom form-check-solid">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    checked={selectedAttachments.includes(option.value)}
                                                    onChange={() => toggleSelection(option.value, setSelectedAttachments)}
                                                />
                                                <span className="form-check-label text-gray-700">{option.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6">
                                <label className="form-label fw-semibold">
                                    Rejection Reason <span className="text-danger">*</span>
                                </label>
                                <textarea
                                    className="form-control"
                                    rows={4}
                                    value={reason}
                                    onChange={(event) => setCustomReason(event.target.value)}
                                    placeholder="Explain the reason for rejection"
                                    minLength={10}
                                    required
                                />
                                <span className="form-text">Minimum 10 characters. You can adjust the generated message.</span>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-light" onClick={onClose} disabled={isSubmitting}>
                                Cancel
                            </button>
                            <button type="submit" className="btn btn-danger" disabled={!isValidReason || isSubmitting}>
                                {isSubmitting ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2"></span>
                                        Rejecting...
                                    </>
                                ) : (
                                    'Confirm Rejection'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default MerchantRejectModal;



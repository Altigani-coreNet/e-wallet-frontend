import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

const FIELD_VALUES = [
    'name',
    'owner_name',
    'email',
    'phone',
    'address',
    'business_type',
    'trade_license_number',
    'tax_certified_number',
    'country',
    'city',
];

const ATTACHMENT_VALUES = [
    'company_logo_document',
    'trade_license_document',
    'tax_certificate_document',
    'identity_document',
];

const MerchantRejectModal = ({ isOpen, merchant, onClose, onConfirm, isSubmitting = false }) => {
    const { t } = useTranslation();
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
            if (FIELD_VALUES.includes(value)) {
                return t(`admin.merchantsUI.rejectFields.${value}`);
            }
            if (ATTACHMENT_VALUES.includes(value)) {
                return t(`admin.merchantsUI.rejectAttachments.${value}`);
            }
            return value;
        });

        if (labels.length === 1) {
            return t('admin.merchantsUI.rejectReasonSingle', { item: labels[0] });
        }

        return t('admin.merchantsUI.rejectReasonMulti', { items: labels.join(', ') });
    }, [selectedFields, selectedAttachments, t]);

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
                            <h5 className="modal-title">{t('admin.merchantsUI.rejectModalTitle')}</h5>
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
                                    <h5 className="mb-1">{t('admin.merchantsUI.rejectDetailsTitle')}</h5>
                                    <p className="mb-0 text-gray-700">
                                        {t('admin.merchantsUI.rejectDetailsText')}
                                    </p>
                                </div>
                            </div>

                            <div className="row g-5">
                                <div className="col-md-6">
                                    <h6 className="fw-semibold mb-3">{t('admin.merchantsUI.rejectInvalidFields')}</h6>
                                    <div className="d-flex flex-column gap-3">
                                        {FIELD_VALUES.map((value) => (
                                            <label key={value} className="form-check form-check-custom form-check-solid">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    checked={selectedFields.includes(value)}
                                                    onChange={() => toggleSelection(value, setSelectedFields)}
                                                />
                                                <span className="form-check-label text-gray-700">
                                                    {t(`admin.merchantsUI.rejectFields.${value}`)}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <h6 className="fw-semibold mb-3">{t('admin.merchantsUI.rejectMissingAttachments')}</h6>
                                    <div className="d-flex flex-column gap-3">
                                        {ATTACHMENT_VALUES.map((value) => (
                                            <label key={value} className="form-check form-check-custom form-check-solid">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    checked={selectedAttachments.includes(value)}
                                                    onChange={() => toggleSelection(value, setSelectedAttachments)}
                                                />
                                                <span className="form-check-label text-gray-700">
                                                    {t(`admin.merchantsUI.rejectAttachments.${value}`)}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6">
                                <label className="form-label fw-semibold">
                                    {t('admin.merchantsUI.rejectReasonLabel')} <span className="text-danger">*</span>
                                </label>
                                <textarea
                                    className="form-control"
                                    rows={4}
                                    value={reason}
                                    onChange={(event) => setCustomReason(event.target.value)}
                                    placeholder={t('admin.merchantsUI.rejectReasonPlaceholder')}
                                    minLength={10}
                                    required
                                />
                                <span className="form-text">{t('admin.merchantsUI.rejectMinCharsHint')}</span>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-light" onClick={onClose} disabled={isSubmitting}>
                                {t('admin.merchantsIndex.cancel')}
                            </button>
                            <button type="submit" className="btn btn-danger" disabled={!isValidReason || isSubmitting}>
                                {isSubmitting ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2"></span>
                                        {t('admin.merchantsUI.rejecting')}
                                    </>
                                ) : (
                                    t('admin.merchantsUI.confirmRejection')
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

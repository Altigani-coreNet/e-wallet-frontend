import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ContentProviderModel from '../../services/ContentProviderModel';

const FIELD_OPTIONS = [
    { value: 'name', label: 'cpFieldBusinessName' },
    { value: 'owner_name', label: 'cpFieldOwnerName' },
    { value: 'email', label: 'cpImportEmail' },
    { value: 'phone', label: 'cpImportPhone' },
    { value: 'address', label: 'cpFieldAddress' },
    { value: 'business_type', label: 'cpFieldBusinessType' },
    { value: 'trade_license_number', label: 'cpFieldTradeLicense' },
    { value: 'tax_certified_number', label: 'cpFieldTaxNumber' },
    { value: 'country', label: 'cpCountry' },
    { value: 'city', label: 'cpFieldCity' },
];

const ATTACHMENT_OPTIONS = [
    { value: 'company_logo_document', label: 'cpAttachCompanyLogo' },
    { value: 'trade_license_document', label: 'cpAttachTradeLicenseDoc' },
    { value: 'tax_certificate_document', label: 'cpAttachTaxCertDoc' },
    { value: 'identity_document', label: 'cpAttachIdentityDoc' },
];

const ContentProviderRejectModal = ({ isOpen, contentProvider, onClose, onConfirm, isSubmitting = false }) => {
    const { t } = useTranslation();
    const partner = useMemo(
        () => (contentProvider ? ContentProviderModel.ensure(contentProvider) : null),
        [contentProvider]
    );
    const [selectedFields, setSelectedFields] = useState([]);
    const [selectedAttachments, setSelectedAttachments] = useState([]);
    const [customReason, setCustomReason] = useState('');

    useEffect(() => {
        if (isOpen) {
            setSelectedFields([]);
            setSelectedAttachments([]);
            setCustomReason('');
        }
    }, [isOpen, contentProvider?.id]);

    if (!isOpen || !partner) {
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
            return field ? t(`admin.paymentGetway.${field.label}`) : attachment ? t(`admin.paymentGetway.${attachment.label}`) : value;
        });

        if (labels.length === 1) {
            return t('admin.paymentGetway.cpRejectGeneratedSingle', { item: labels[0] });
        }

        return t('admin.paymentGetway.cpRejectGeneratedMulti', { items: labels.join(', ') });
    }, [selectedFields, selectedAttachments, t]);

    const reason = customReason || generatedReason;
    const isValidReason = reason.trim().length >= 10;

    const handleSubmit = (event) => {
        event.preventDefault();
        if (!isValidReason) return;

        onConfirm?.({
            contentProviderId: partner.id,
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
                            <div>
                                <h5 className="modal-title mb-0">{t('admin.paymentGetway.cpRejectTitle')}</h5>
                                <div className="text-muted fs-7 mt-1 text-truncate" style={{ maxWidth: 'min(100%, 480px)' }}>
                                    {partner.getDisplayName()}
                                </div>
                            </div>
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
                                    <h5 className="mb-1">{t('admin.paymentGetway.cpRejectDetailsTitle')}</h5>
                                    <p className="mb-0 text-gray-700">
                                        {t('admin.paymentGetway.cpRejectDetailsText')}
                                    </p>
                                </div>
                            </div>

                            <div className="row g-5">
                                <div className="col-md-6">
                                    <h6 className="fw-semibold mb-3">{t('admin.paymentGetway.cpRejectInvalidFields')}</h6>
                                    <div className="d-flex flex-column gap-3">
                                        {FIELD_OPTIONS.map((option) => (
                                            <label key={option.value} className="form-check form-check-custom form-check-solid">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    checked={selectedFields.includes(option.value)}
                                                    onChange={() => toggleSelection(option.value, setSelectedFields)}
                                                />
                                                <span className="form-check-label text-gray-700">{t(`admin.paymentGetway.${option.label}`)}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <h6 className="fw-semibold mb-3">{t('admin.paymentGetway.cpRejectMissingAttachments')}</h6>
                                    <div className="d-flex flex-column gap-3">
                                        {ATTACHMENT_OPTIONS.map((option) => (
                                            <label key={option.value} className="form-check form-check-custom form-check-solid">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    checked={selectedAttachments.includes(option.value)}
                                                    onChange={() => toggleSelection(option.value, setSelectedAttachments)}
                                                />
                                                <span className="form-check-label text-gray-700">{t(`admin.paymentGetway.${option.label}`)}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6">
                                <label className="form-label fw-semibold">
                                    {t('admin.paymentGetway.cpRejectReasonLabel')} <span className="text-danger">*</span>
                                </label>
                                <textarea
                                    className="form-control"
                                    rows={4}
                                    value={reason}
                                    onChange={(event) => setCustomReason(event.target.value)}
                                    placeholder={t('admin.paymentGetway.cpRejectReasonPlaceholder')}
                                    minLength={10}
                                    required
                                />
                                <span className="form-text">{t('admin.paymentGetway.cpRejectReasonMin')}</span>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-light" onClick={onClose} disabled={isSubmitting}>
                                {t('admin.common.cancel')}
                            </button>
                            <button type="submit" className="btn btn-danger" disabled={!isValidReason || isSubmitting}>
                                {isSubmitting ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2"></span>
                                        {t('admin.paymentGetway.cpRejecting')}
                                    </>
                                ) : (
                                    t('admin.paymentGetway.cpConfirmRejection')
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ContentProviderRejectModal;



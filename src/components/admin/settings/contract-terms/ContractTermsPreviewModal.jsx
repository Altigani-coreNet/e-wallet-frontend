import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { previewTerms } from '../../../../services/adminContractTermsService';

const ContractTermsPreviewModal = ({ show, lang, onClose }) => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [previewHtml, setPreviewHtml] = useState('');

    useEffect(() => {
        if (!show) return;

        const run = async () => {
            setLoading(true);
            const response = await previewTerms(lang);
            setLoading(false);

            if (response.success) {
                const data = response.data.data || response.data;
                setPreviewHtml(data.html || '');
            } else {
                toast.error(response.error || t('admin.settings.contractTerms.previewFailed'));
                onClose();
            }
        };

        run();
        // eslint-disable-next-line react-hooks/exhaustive-deps -- onClose is stable enough; including it refetches when parent re-renders
    }, [show, lang, t]);

    if (!show) return null;

    return (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">
                            <i className="ki-duotone ki-eye fs-2 me-2">
                                <span className="path1"></span>
                                <span className="path2"></span>
                                <span className="path3"></span>
                            </i>
                            {t('admin.settings.contractTerms.previewTitle', { lang: lang.toUpperCase() })}
                        </h5>
                        <button type="button" className="btn-close" onClick={onClose} aria-label={t('admin.common.close')}></button>
                    </div>
                    <div className="modal-body">
                        {loading ? (
                            <div className="text-center py-10">
                                <div className="spinner-border text-primary" role="status">
                                    <span className="visually-hidden">{t('admin.common.loading')}</span>
                                </div>
                            </div>
                        ) : (
                            <div
                                className="contract-preview"
                                style={{
                                    padding: '20px',
                                    backgroundColor: '#fff',
                                    direction: lang === 'ar' ? 'rtl' : 'ltr'
                                }}
                                dangerouslySetInnerHTML={{ __html: previewHtml }}
                            />
                        )}
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            {t('admin.common.close')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContractTermsPreviewModal;

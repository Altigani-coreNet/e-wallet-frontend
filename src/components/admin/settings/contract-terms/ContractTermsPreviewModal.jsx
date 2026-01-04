import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { previewTerms } from '../../../../services/adminContractTermsService';

const ContractTermsPreviewModal = ({ show, lang, onClose }) => {
    const [loading, setLoading] = useState(false);
    const [previewHtml, setPreviewHtml] = useState('');

    useEffect(() => {
        if (show) {
            fetchPreview();
        }
    }, [show, lang]);

    const fetchPreview = async () => {
        setLoading(true);
        const response = await previewTerms(lang);
        setLoading(false);

        if (response.success) {
            const data = response.data.data || response.data;
            setPreviewHtml(data.html || '');
        } else {
            toast.error(response.error || 'Failed to fetch preview');
            onClose();
        }
    };

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
                            Preview Contract Terms ({lang.toUpperCase()})
                        </h5>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>
                    <div className="modal-body">
                        {loading ? (
                            <div className="text-center py-10">
                                <div className="spinner-border text-primary"></div>
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
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContractTermsPreviewModal;



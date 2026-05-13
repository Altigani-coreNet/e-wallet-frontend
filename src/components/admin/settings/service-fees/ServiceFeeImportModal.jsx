import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { importServiceFees, exportServiceFeesTemplate } from '../../../../services/adminServiceFeesService';
import { toast } from 'react-toastify';

const ServiceFeeImportModal = ({ show, onClose, onImportSuccess }) => {
    const { t } = useTranslation();
    const [file, setFile] = useState(null);
    const [importing, setImporting] = useState(false);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!file) {
            toast.warning(t('admin.settings.serviceFees.importPickFile'));
            return;
        }

        setImporting(true);
        const response = await importServiceFees(file);
        setImporting(false);

        if (response.success) {
            toast.success(response.data?.message || t('admin.settings.serviceFees.importSuccessDefault'));
            setFile(null);
            onClose();
            onImportSuccess();
        } else {
            toast.error(response.error || t('admin.settings.serviceFees.importFailed'));
        }
    };

    const handleDownloadTemplate = async () => {
        const response = await exportServiceFeesTemplate();
        if (!response.success) {
            toast.error(response.error || t('admin.settings.serviceFees.templateDownloadFailed'));
        }
    };

    if (!show) return null;

    return (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">
                            <i className="ki-duotone ki-file-up fs-2 me-2">
                                <span className="path1"></span>
                                <span className="path2"></span>
                            </i>
                            {t('admin.settings.serviceFees.importModalTitle')}
                        </h5>
                        <button type="button" className="btn-close" onClick={onClose} aria-label={t('admin.common.close')}></button>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="modal-body">
                            <div className="mb-3">
                                <label htmlFor="import_file" className="form-label">{t('admin.settings.serviceFees.importSelectFile')}</label>
                                <input 
                                    type="file" 
                                    className="form-control" 
                                    id="import_file"
                                    accept=".xlsx,.xls,.csv"
                                    onChange={handleFileChange}
                                    required
                                />
                                <div className="form-text">{t('admin.settings.serviceFees.importFormats')}</div>
                            </div>
                            
                            <div className="alert alert-info">
                                <div className="d-flex">
                                    <i className="ki-duotone ki-information-5 fs-2hx text-info me-4">
                                        <span className="path1"></span>
                                        <span className="path2"></span>
                                        <span className="path3"></span>
                                    </i>
                                    <div className="d-flex flex-column">
                                        <h5 className="mb-1">{t('admin.settings.serviceFees.importInstructionsTitle')}</h5>
                                        <span>{t('admin.settings.serviceFees.importInstructionsBody')}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mb-3">
                                <button 
                                    type="button"
                                    onClick={handleDownloadTemplate}
                                    className="btn btn-sm btn-outline-primary"
                                >
                                    <i className="ki-duotone ki-download fs-2">
                                        <span className="path1"></span>
                                        <span className="path2"></span>
                                    </i>
                                    {t('admin.settings.downloadTemplate')}
                                </button>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={onClose}>
                                {t('admin.common.cancel')}
                            </button>
                            <button type="submit" className="btn btn-primary" disabled={importing}>
                                {importing ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2"></span>
                                        {t('admin.settings.serviceFees.importing')}
                                    </>
                                ) : (
                                    <>
                                        <i className="ki-duotone ki-file-up fs-2">
                                            <span className="path1"></span>
                                            <span className="path2"></span>
                                        </i>
                                        {t('admin.settings.serviceFees.importBtn')}
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ServiceFeeImportModal;

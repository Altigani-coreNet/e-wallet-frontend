import React, { useState, useRef } from 'react';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { downloadUserTemplate, previewUserImport } from '../../services/usersService';
import ImportPreviewModal from './ImportPreviewModal';

export default function UserImportModal({ show, onHide, onImportComplete, onImportSuccess }) {
    const { t } = useTranslation();
    const notifyParent = onImportComplete || onImportSuccess;

    const [selectedFile, setSelectedFile] = useState(null);
    const [downloadingTemplate, setDownloadingTemplate] = useState(false);
    const [validating, setValidating] = useState(false);
    const [previewData, setPreviewData] = useState(null);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const validTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
            if (!validTypes.includes(file.type)) {
                toast.error(t('merchant.users.import.toastInvalidType'));
                setSelectedFile(null);
                return;
            }

            if (file.size > 10 * 1024 * 1024) {
                toast.error(t('merchant.users.import.toastFileSize'));
                setSelectedFile(null);
                return;
            }

            setSelectedFile(file);
        }
    };

    const handleDownloadTemplate = async () => {
        try {
            setDownloadingTemplate(true);
            const blob = await downloadUserTemplate();

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'users_import_template.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            toast.success(t('merchant.users.import.toastTemplateOk'));
        } catch (err) {
            console.error('Error downloading template:', err);
            toast.error(t('merchant.users.import.toastTemplateFail'));
        } finally {
            setDownloadingTemplate(false);
        }
    };

    const handlePreview = async () => {
        if (!selectedFile) {
            toast.error(t('merchant.users.import.toastSelectFile'));
            return;
        }

        try {
            setValidating(true);
            const response = await previewUserImport(selectedFile);

            if (response.success !== false) {
                setPreviewData(response.data);
                setShowPreviewModal(true);
            } else {
                toast.error(response.message || t('merchant.users.import.toastPreviewFail'));
            }
        } catch (err) {
            console.error('Preview error:', err);
            toast.error(err.response?.data?.message || t('merchant.users.import.toastPreviewFail'));
        } finally {
            setValidating(false);
        }
    };

    const handleImportSuccess = (result) => {
        toast.success(
            t('merchant.users.import.toastImportDone', {
                imported: result.imported,
                updated: result.updated,
            })
        );

        setSelectedFile(null);
        setPreviewData(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }

        setShowPreviewModal(false);
        onHide();
        if (notifyParent) {
            notifyParent();
        }
    };

    const handleCloseModal = () => {
        setShowPreviewModal(false);
        setPreviewData(null);
    };

    const handleClose = () => {
        setSelectedFile(null);
        setPreviewData(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        onHide();
    };

    if (!show) return null;

    return (
        <>
            <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                <div className="modal-dialog modal-dialog-centered modal-xl">
                    <div className="modal-content">
                        <div className="modal-header bg-primary text-white">
                            <h5 className="modal-title">
                                <i className="ki-duotone ki-exit-down fs-2 me-2">
                                    <span className="path1"></span>
                                    <span className="path2"></span>
                                </i>
                                {t('merchant.users.import.title')}
                            </h5>
                            <button type="button" className="btn-close btn-close-white" onClick={handleClose}></button>
                        </div>
                        <div className="modal-body">
                            <div className="alert alert-info">
                                <h6>
                                    <i className="ki-duotone ki-information fs-2 me-2">
                                        <span className="path1"></span>
                                        <span className="path2"></span>
                                        <span className="path3"></span>
                                    </i>
                                    {t('merchant.users.import.howToTitle')}
                                </h6>
                                <ol className="mb-0">
                                    <li>{t('merchant.users.import.howToStep1')}</li>
                                    <li>{t('merchant.users.import.howToStep2')}</li>
                                    <li>{t('merchant.users.import.howToStep3')}</li>
                                    <li>{t('merchant.users.import.howToStep4')}</li>
                                    <li>{t('merchant.users.import.howToStep5')}</li>
                                </ol>
                            </div>

                            <div className="mb-4">
                                <h6>{t('merchant.users.import.step1Title')}</h6>
                                <p className="text-muted small">{t('merchant.users.import.step1Hint')}</p>
                                <button className="btn btn-primary" onClick={handleDownloadTemplate} disabled={downloadingTemplate}>
                                    {downloadingTemplate ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2"></span>
                                            {t('merchant.users.import.downloading')}
                                        </>
                                    ) : (
                                        <>
                                            <i className="ki-duotone ki-cloud-download fs-3 me-2">
                                                <span className="path1"></span>
                                                <span className="path2"></span>
                                            </i>
                                            {t('merchant.users.import.downloadTemplate')}
                                        </>
                                    )}
                                </button>
                            </div>

                            <hr />

                            <div className="mb-4">
                                <h6>{t('merchant.users.import.step2Title')}</h6>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    className="form-control"
                                    accept=".xlsx,.xls"
                                    onChange={handleFileChange}
                                    disabled={validating}
                                />
                                {selectedFile && (
                                    <div className="mt-2">
                                        <small className="text-success">
                                            <i className="ki-duotone ki-check-circle fs-3 me-1">
                                                <span className="path1"></span>
                                                <span className="path2"></span>
                                            </i>
                                            {t('merchant.users.import.selectedFile', {
                                                name: selectedFile.name,
                                                size: (selectedFile.size / 1024).toFixed(2),
                                            })}
                                        </small>
                                    </div>
                                )}
                            </div>

                            <div className="d-flex gap-2">
                                <button className="btn btn-success" onClick={handlePreview} disabled={!selectedFile || validating}>
                                    {validating ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2"></span>
                                            {t('merchant.users.import.validating')}
                                        </>
                                    ) : (
                                        <>
                                            <i className="ki-duotone ki-eye fs-3 me-2">
                                                <span className="path1"></span>
                                                <span className="path2"></span>
                                                <span className="path3"></span>
                                            </i>
                                            {t('merchant.users.import.previewValidate')}
                                        </>
                                    )}
                                </button>

                                {selectedFile && (
                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => {
                                            setSelectedFile(null);
                                            if (fileInputRef.current) {
                                                fileInputRef.current.value = '';
                                            }
                                        }}
                                        disabled={validating}
                                    >
                                        {t('merchant.users.import.clear')}
                                    </button>
                                )}
                            </div>

                            {validating && (
                                <div className="mt-3">
                                    <div className="progress">
                                        <div className="progress-bar progress-bar-striped progress-bar-animated w-100">
                                            {t('merchant.users.import.validating')}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="modal-footer bg-light">
                            <small className="text-muted me-auto">
                                <i className="ki-duotone ki-information-5 fs-2 me-1">
                                    <span className="path1"></span>
                                    <span className="path2"></span>
                                    <span className="path3"></span>
                                </i>
                                {t('merchant.users.import.tip')}
                            </small>
                            <button type="button" className="btn btn-secondary" onClick={handleClose}>
                                {t('merchant.users.import.close')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <ImportPreviewModal
                show={showPreviewModal}
                onHide={handleCloseModal}
                previewData={previewData}
                file={selectedFile}
                onImportSuccess={handleImportSuccess}
            />
        </>
    );
}

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { previewPartnersImport, importPartners, downloadPartnersImportTemplate } from '../../services/adminPartnersService';
import { validateFile } from '../../utils/fileHelpers';

const ContentProviderImportModal = ({ isOpen, onClose, onImportSuccess }) => {
    const { t } = useTranslation();
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewData, setPreviewData] = useState(null);
    const [isPreviewMode, setIsPreviewMode] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [importProgress, setImportProgress] = useState(null);

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file
        const validation = validateFile(file, {
            allowedTypes: [
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'application/vnd.ms-excel',
                'text/csv',
                '.xlsx',
                '.xls',
                '.csv'
            ],
            maxSizeInMB: 10
        });

        if (!validation.valid) {
            toast.error(validation.error);
            return;
        }

        setSelectedFile(file);
        setPreviewData(null);
        setIsPreviewMode(false);
    };

    const handlePreview = async () => {
        if (!selectedFile) {
            toast.error(t('admin.paymentGetway.cpImportSelectFileFirst'));
            return;
        }

        try {
            setIsLoading(true);
            const result = await previewPartnersImport(selectedFile);
            if (!result.success) {
                toast.error(result.error);
                return;
            }
            const responseData = result.data;
            const isSuccess = responseData.success || responseData.status;
            if (isSuccess) {
                setPreviewData(responseData.data);
                setIsPreviewMode(true);
                toast.success(t('admin.paymentGetway.cpImportPreviewOk'));
            }
        } catch (error) {
            toast.error(error.response?.data?.message || t('admin.paymentGetway.cpImportPreviewFailed'));
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleImport = async () => {
        if (!selectedFile) {
            toast.error(t('admin.paymentGetway.cpImportSelectFileFirst'));
            return;
        }

        try {
            setIsLoading(true);
            setImportProgress({ status: 'importing', message: t('admin.paymentGetway.cpImportInProgress') });
            
            const result = await importPartners(selectedFile);
            if (!result.success) {
                setImportProgress({ status: 'error', message: result.error || t('admin.paymentGetway.cpImportFailedGeneric') });
                toast.error(result.error || t('admin.paymentGetway.cpImportFailedProviders'));
                return;
            }
            const responseData = result.data;
            const isSuccess = responseData.success || responseData.status;
            if (isSuccess) {
                setImportProgress({
                    status: 'completed',
                    message: responseData.data.message,
                    imported: responseData.data.imported_count,
                    failed: responseData.data.failed_count,
                    errors: responseData.data.errors
                });
                
                toast.success(t('admin.paymentGetway.cpImportCompletedToast', { imported: responseData.data.imported_count, failed: responseData.data.failed_count }));
                
                // Call success callback after a delay
                setTimeout(() => {
                    onImportSuccess();
                    handleClose();
                }, 2000);
            }
        } catch (error) {
            setImportProgress({ status: 'error', message: error.response?.data?.message || t('admin.paymentGetway.cpImportFailedGeneric') });
            toast.error(error.response?.data?.message || t('admin.paymentGetway.cpImportFailedProviders'));
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownloadTemplate = async () => {
        try {
            const result = await downloadPartnersImportTemplate();
            if (result.success) {
                toast.success(t('admin.paymentGetway.cpImportTemplateDownloaded'));
            } else {
                toast.error(result.error || t('admin.paymentGetway.cpImportTemplateFailed'));
            }
        } catch (error) {
            toast.error(t('admin.paymentGetway.cpImportTemplateFailed'));
            console.error(error);
        }
    };

    const handleClose = () => {
        setSelectedFile(null);
        setPreviewData(null);
        setIsPreviewMode(false);
        setImportProgress(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered modal-xl">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">
                            <i className="ki-duotone ki-file-up fs-2 me-2">
                                <span className="path1"></span>
                                <span className="path2"></span>
                            </i>
                            {t('admin.paymentGetway.cpImportTitle')}
                        </h5>
                        <button type="button" className="btn-close" onClick={handleClose} disabled={isLoading}></button>
                    </div>

                    <div className="modal-body">
                        {!isPreviewMode && !importProgress && (
                            <>
                                {/* File Upload Section */}
                                <div className="mb-5">
                                    <label htmlFor="import_file" className="form-label fw-bold">{t('admin.paymentGetway.cpImportSelectFile')}</label>
                                    <input
                                        type="file"
                                        className="form-control"
                                        id="import_file"
                                        accept=".xlsx,.xls,.csv"
                                        onChange={handleFileSelect}
                                        disabled={isLoading}
                                    />
                                    <div className="form-text">{t('admin.paymentGetway.cpImportSupportedFormats')}</div>
                                </div>

                                {/* Instructions */}
                                <div className="alert alert-info d-flex align-items-center">
                                    <i className="ki-duotone ki-information-5 fs-2hx text-info me-4">
                                        <span className="path1"></span>
                                        <span className="path2"></span>
                                        <span className="path3"></span>
                                    </i>
                                    <div className="d-flex flex-column">
                                        <h5 className="mb-1">{t('admin.paymentGetway.cpImportInstructionsTitle')}</h5>
                                        <span>{t('admin.paymentGetway.cpImportInstructionsText')}</span>
                                    </div>
                                </div>

                                {/* Download Template Button */}
                                <div className="mb-3">
                                    <button
                                        type="button"
                                        className="btn btn-light-primary"
                                        onClick={handleDownloadTemplate}
                                    >
                                        <i className="ki-duotone ki-file-down fs-2">
                                            <span className="path1"></span>
                                            <span className="path2"></span>
                                        </i>
                                        {t('admin.paymentGetway.cpImportDownloadTemplate')}
                                    </button>
                                </div>
                            </>
                        )}

                        {/* Preview Section */}
                        {isPreviewMode && previewData && (
                            <div>
                                <div className="alert alert-light-primary d-flex align-items-center mb-5">
                                    <div className="d-flex flex-column">
                                        <h5 className="mb-1">{t('admin.paymentGetway.cpImportPreviewSummary')}</h5>
                                        <span>
                                            {t('admin.paymentGetway.cpImportTotal')}: {previewData.summary.total} | 
                                            {t('admin.paymentGetway.cpImportValid')}: <span className="text-success fw-bold">{previewData.summary.valid}</span> | 
                                            {t('admin.paymentGetway.cpImportInvalid')}: <span className="text-danger fw-bold">{previewData.summary.invalid}</span>
                                        </span>
                                    </div>
                                </div>

                                <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                    <table className="table table-sm table-row-bordered">
                                        <thead className="sticky-top bg-light">
                                            <tr>
                                                <th>{t('admin.paymentGetway.cpImportRow')}</th>
                                                <th>{t('admin.paymentGetway.cpImportName')}</th>
                                                <th>{t('admin.paymentGetway.cpImportEmail')}</th>
                                                <th>{t('admin.paymentGetway.cpImportPhone')}</th>
                                                <th>{t('admin.paymentGetway.cpCountry')}</th>
                                                <th>{t('admin.paymentGetway.status')}</th>
                                                <th>{t('admin.paymentGetway.cpImportErrors')}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {previewData.rows.map((row, idx) => (
                                                <tr key={idx} className={!row.valid ? 'table-danger' : ''}>
                                                    <td>{row.row_number}</td>
                                                    <td>{row.data.name || '-'}</td>
                                                    <td>{row.data.email || '-'}</td>
                                                    <td>{row.data.phone || '-'}</td>
                                                    <td>{row.data.country || '-'}</td>
                                                    <td>
                                                        {row.valid ? (
                                                            <span className="badge badge-light-success">{t('admin.paymentGetway.cpImportValidStatus')}</span>
                                                        ) : (
                                                            <span className="badge badge-light-danger">{t('admin.paymentGetway.cpImportInvalidStatus')}</span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        {row.errors.length > 0 && (
                                                            <ul className="mb-0 ps-3">
                                                                {row.errors.map((error, i) => (
                                                                    <li key={i} className="text-danger small">{error}</li>
                                                                ))}
                                                            </ul>
                                                        )}
                                                        {row.warnings.length > 0 && (
                                                            <ul className="mb-0 ps-3">
                                                                {row.warnings.map((warning, i) => (
                                                                    <li key={i} className="text-warning small">{warning}</li>
                                                                ))}
                                                            </ul>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Import Progress */}
                        {importProgress && (
                            <div className={`alert ${importProgress.status === 'error' ? 'alert-danger' : 'alert-info'}`}>
                                <h5>{importProgress.status === 'error' ? t('admin.paymentGetway.cpImportFailedTitle') : t('admin.paymentGetway.cpImportStatusTitle')}</h5>
                                <p>{importProgress.message}</p>
                                {importProgress.imported !== undefined && (
                                    <div>
                                        <p>{t('admin.paymentGetway.cpImportImported')}: {importProgress.imported}</p>
                                        <p>{t('admin.paymentGetway.cpImportFailed')}: {importProgress.failed}</p>
                                    </div>
                                )}
                                {importProgress.errors && importProgress.errors.length > 0 && (
                                    <div className="mt-3">
                                        <h6>{t('admin.paymentGetway.cpImportErrors')}:</h6>
                                        <ul>
                                            {importProgress.errors.slice(0, 10).map((error, idx) => (
                                                <li key={idx}>{error}</li>
                                            ))}
                                        </ul>
                                        {importProgress.errors.length > 10 && (
                                            <p>{t('admin.paymentGetway.cpImportMoreErrors', { count: importProgress.errors.length - 10 })}</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="modal-footer">
                        <button
                            type="button"
                            className="btn btn-light"
                            onClick={handleClose}
                            disabled={isLoading}
                        >
                            {t('admin.paymentGetway.cpImportClose')}
                        </button>
                        
                        {!isPreviewMode && !importProgress && (
                            <>
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={handlePreview}
                                    disabled={!selectedFile || isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2"></span>
                                            {t('admin.paymentGetway.cpImportLoading')}
                                        </>
                                    ) : (
                                        <>
                                            <i className="ki-duotone ki-eye fs-2">
                                                <span className="path1"></span>
                                                <span className="path2"></span>
                                                <span className="path3"></span>
                                            </i>
                                            {t('admin.paymentGetway.cpImportPreview')}
                                        </>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-success"
                                    onClick={handleImport}
                                    disabled={!selectedFile || isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2"></span>
                                            {t('admin.paymentGetway.cpImporting')}
                                        </>
                                    ) : (
                                        <>
                                            <i className="ki-duotone ki-check fs-2">
                                                <span className="path1"></span>
                                                <span className="path2"></span>
                                            </i>
                                            {t('admin.paymentGetway.cpImportNow')}
                                        </>
                                    )}
                                </button>
                            </>
                        )}

                        {isPreviewMode && !importProgress && (
                            <>
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setIsPreviewMode(false)}
                                >
                                    {t('admin.paymentGetway.cpImportBack')}
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-success"
                                    onClick={handleImport}
                                    disabled={isLoading || previewData?.summary.valid === 0}
                                >
                                    {isLoading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2"></span>
                                            {t('admin.paymentGetway.cpImporting')}
                                        </>
                                    ) : (
                                        <>
                                            <i className="ki-duotone ki-check fs-2">
                                                <span className="path1"></span>
                                                <span className="path2"></span>
                                            </i>
                                            {t('admin.paymentGetway.cpImportValidRows', { count: previewData?.summary.valid })}
                                        </>
                                    )}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContentProviderImportModal;


import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ADMIN_ENDPOINTS } from '../../../utils/constants';
import { getToken } from '../../../utils/api';
import { validateFile } from '../../../utils/fileHelpers';

const MerchantImportModal = ({ isOpen, onClose, onImportSuccess }) => {
    const { t } = useTranslation();
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewData, setPreviewData] = useState(null);
    const [isPreviewMode, setIsPreviewMode] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [importProgress, setImportProgress] = useState(null);

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

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
            toast.error(t('admin.merchantsUI.importSelectFileFirst'));
            return;
        }

        try {
            setIsLoading(true);
            const formData = new FormData();
            formData.append('import_file', selectedFile);

            const token = getToken();
            const response = await axios.post(ADMIN_ENDPOINTS.MERCHANT_IMPORT_PREVIEW, formData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            const isSuccess = response.data.success || response.data.status;
            if (isSuccess) {
                setPreviewData(response.data.data);
                setIsPreviewMode(true);
                toast.success(t('admin.merchantsUI.previewSuccess'));
            }
        } catch (error) {
            toast.error(error.response?.data?.message || t('admin.merchantsUI.previewFailed'));
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleImport = async () => {
        if (!selectedFile) {
            toast.error(t('admin.merchantsUI.importSelectFileFirst'));
            return;
        }

        try {
            setIsLoading(true);
            setImportProgress({ status: 'importing', message: t('admin.merchantsUI.importProgressMessage') });

            const formData = new FormData();
            formData.append('import_file', selectedFile);

            const token = getToken();
            const response = await axios.post(ADMIN_ENDPOINTS.MERCHANT_IMPORT, formData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            const isSuccess = response.data.success || response.data.status;
            if (isSuccess) {
                setImportProgress({
                    status: 'completed',
                    message: response.data.data.message,
                    imported: response.data.data.imported_count,
                    failed: response.data.data.failed_count,
                    errors: response.data.data.errors
                });

                toast.success(t('admin.merchantsUI.importCompletedToast', {
                    imported: response.data.data.imported_count,
                    failed: response.data.data.failed_count
                }));

                setTimeout(() => {
                    onImportSuccess();
                    handleClose();
                }, 2000);
            }
        } catch (error) {
            setImportProgress({ status: 'error', message: error.response?.data?.message || t('admin.merchantsUI.importFailed') });
            toast.error(error.response?.data?.message || t('admin.merchantsUI.importFailedMerchants'));
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownloadTemplate = async () => {
        try {
            const token = getToken();
            const response = await fetch(ADMIN_ENDPOINTS.MERCHANT_EXPORT_TEMPLATE, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `merchants_import_template_${new Date().toISOString().split('T')[0]}.xlsx`;
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(url);
                toast.success(t('admin.merchantsUI.templateDownloaded'));
            } else {
                toast.error(t('admin.merchantsUI.templateDownloadFailed'));
            }
        } catch (error) {
            toast.error(t('admin.merchantsUI.templateDownloadFailed'));
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
                            {t('admin.merchantsUI.importTitle')}
                        </h5>
                        <button type="button" className="btn-close" onClick={handleClose} disabled={isLoading}></button>
                    </div>

                    <div className="modal-body">
                        {!isPreviewMode && !importProgress && (
                            <>
                                <div className="mb-5">
                                    <label htmlFor="import_file" className="form-label fw-bold">{t('admin.merchantsUI.importSelectFile')}</label>
                                    <input
                                        type="file"
                                        className="form-control"
                                        id="import_file"
                                        accept=".xlsx,.xls,.csv"
                                        onChange={handleFileSelect}
                                        disabled={isLoading}
                                    />
                                    <div className="form-text">{t('admin.merchantsUI.importFormatsHint')}</div>
                                </div>

                                <div className="alert alert-info d-flex align-items-center">
                                    <i className="ki-duotone ki-information-5 fs-2hx text-info me-4">
                                        <span className="path1"></span>
                                        <span className="path2"></span>
                                        <span className="path3"></span>
                                    </i>
                                    <div className="d-flex flex-column">
                                        <h5 className="mb-1">{t('admin.merchantsUI.importInstructionsTitle')}</h5>
                                        <span>{t('admin.merchantsUI.importInstructionsText')}</span>
                                    </div>
                                </div>

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
                                        {t('admin.merchantsUI.downloadTemplate')}
                                    </button>
                                </div>
                            </>
                        )}

                        {isPreviewMode && previewData && (
                            <div>
                                <div className="alert alert-light-primary d-flex align-items-center mb-5">
                                    <div className="d-flex flex-column">
                                        <h5 className="mb-1">{t('admin.merchantsUI.previewSummary')}</h5>
                                        <span>
                                            {t('admin.merchantsUI.previewTotalValidInvalid', {
                                                total: previewData.summary.total,
                                                valid: previewData.summary.valid,
                                                invalid: previewData.summary.invalid
                                            })}
                                        </span>
                                    </div>
                                </div>

                                <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                    <table className="table table-sm table-row-bordered">
                                        <thead className="sticky-top bg-light">
                                            <tr>
                                                <th>{t('admin.merchantsUI.importColRow')}</th>
                                                <th>{t('admin.merchantsUI.importColName')}</th>
                                                <th>{t('admin.merchantsUI.importColEmail')}</th>
                                                <th>{t('admin.merchantsUI.importColPhone')}</th>
                                                <th>{t('admin.merchantsUI.importColCountry')}</th>
                                                <th>{t('admin.merchantsUI.importColStatus')}</th>
                                                <th>{t('admin.merchantsUI.importColErrors')}</th>
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
                                                            <span className="badge badge-light-success">{t('admin.merchantsUI.importValid')}</span>
                                                        ) : (
                                                            <span className="badge badge-light-danger">{t('admin.merchantsUI.importInvalid')}</span>
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

                        {importProgress && (
                            <div className={`alert ${importProgress.status === 'error' ? 'alert-danger' : 'alert-info'}`}>
                                <h5>{importProgress.status === 'error' ? t('admin.merchantsUI.importFailedTitle') : t('admin.merchantsUI.importStatusTitle')}</h5>
                                <p>{importProgress.message}</p>
                                {importProgress.imported !== undefined && (
                                    <div>
                                        <p>{t('admin.merchantsUI.importedLabel', { count: importProgress.imported })}</p>
                                        <p>{t('admin.merchantsUI.failedLabel', { count: importProgress.failed })}</p>
                                    </div>
                                )}
                                {importProgress.errors && importProgress.errors.length > 0 && (
                                    <div className="mt-3">
                                        <h6>{t('admin.merchantsUI.errorsHeading')}</h6>
                                        <ul>
                                            {importProgress.errors.slice(0, 10).map((error, idx) => (
                                                <li key={idx}>{error}</li>
                                            ))}
                                        </ul>
                                        {importProgress.errors.length > 10 && (
                                            <p>{t('admin.merchantsUI.moreErrors', { count: importProgress.errors.length - 10 })}</p>
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
                            {t('admin.merchantsUI.close')}
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
                                            {t('admin.merchantsUI.loading')}
                                        </>
                                    ) : (
                                        <>
                                            <i className="ki-duotone ki-eye fs-2">
                                                <span className="path1"></span>
                                                <span className="path2"></span>
                                                <span className="path3"></span>
                                            </i>
                                            {t('admin.merchantsUI.preview')}
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
                                            {t('admin.merchantsUI.importing')}
                                        </>
                                    ) : (
                                        <>
                                            <i className="ki-duotone ki-check fs-2">
                                                <span className="path1"></span>
                                                <span className="path2"></span>
                                            </i>
                                            {t('admin.merchantsUI.importNow')}
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
                                    {t('admin.common.back')}
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
                                            {t('admin.merchantsUI.importing')}
                                        </>
                                    ) : (
                                        <>
                                            <i className="ki-duotone ki-check fs-2">
                                                <span className="path1"></span>
                                                <span className="path2"></span>
                                            </i>
                                            {t('admin.merchantsUI.importValidRows', { count: previewData?.summary.valid ?? 0 })}
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

export default MerchantImportModal;

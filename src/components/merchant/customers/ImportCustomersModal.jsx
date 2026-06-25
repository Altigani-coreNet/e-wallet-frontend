import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import { 
    exportCustomersTemplate, 
    importCustomersPreview, 
    importCustomers 
} from '../../../services/customersService';

const ImportCustomersModal = ({ show, onClose, onSuccess }) => {
    const { t } = useTranslation();
    const entityName = t('customers.entityName');
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewData, setPreviewData] = useState(null);
    const [errors, setErrors] = useState([]);
    const [loading, setLoading] = useState(false);
    const [importing, setImporting] = useState(false);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setSelectedFile(file);
        setErrors([]);
        setPreviewData(null);

        await handlePreview(file);
    };

    const handlePreview = async (file) => {
        setLoading(true);
        setErrors([]);

        try {
            const response = await importCustomersPreview(file);

            if (response.success) {
                const data = response.data?.data || response.data;
                setPreviewData(data);
                
                if (data.errors && data.errors.length > 0) {
                    setErrors(data.errors);
                    toast.warning(t('customers.foundValidationErrors', { count: data.errors.length }));
                }
            } else {
                toast.error(response.error || t('common.failedToPreviewFile'));
            }
        } catch (error) {
            console.error('Preview error:', error);
            toast.error(t('common.failedToPreviewFile'));
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadTemplate = async () => {
        try {
            const blob = await exportCustomersTemplate();
            
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = 'customers_import_template.csv';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(downloadUrl);
            document.body.removeChild(a);
            
            toast.success(t('common.templateDownloadedSuccessfully'));
        } catch (error) {
            console.error('Download error:', error);
            toast.error(t('common.failedToDownloadTemplate'));
        }
    };

    const handleImport = async () => {
        if (!selectedFile) {
            toast.error(t('common.pleaseSelectAFile'));
            return;
        }

        const result = await Swal.fire({
            title: t('customers.confirmImport'),
            text: t('customers.confirmImportCustomers'),
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: t('common.yesImport'),
            cancelButtonText: t('common.cancel')
        });

        if (result.isConfirmed) {
            setImporting(true);

            try {
                const response = await importCustomers(selectedFile);

                if (response.success) {
                    const data = response.data;
                    const importedCount = data.imported_count || 0;
                    const skippedCount = data.skipped_count || 0;
                    const importErrors = data.errors || [];

                    let message = `${t('common.importCompleted')}\n\n${t('common.imported')}: ${importedCount}\n${t('common.skipped')}: ${skippedCount}`;
                    
                    if (importErrors.length > 0) {
                        message += `\n\n${t('common.errors')}:\n` + importErrors.slice(0, 5).join('\n');
                        if (importErrors.length > 5) {
                            message += `\n${t('common.moreErrors', { count: importErrors.length - 5 })}`;
                        }
                    }

                    await Swal.fire({
                        title: t('common.importComplete'),
                        text: message,
                        icon: importedCount > 0 ? 'success' : 'warning',
                        confirmButtonText: t('common.ok')
                    });

                    onSuccess();
                } else {
                    Swal.fire(t('common.error'), response.error || t('customers.failedToImportCustomers'), 'error');
                }
            } catch (error) {
                console.error('Import error:', error);
                Swal.fire(t('common.error'), t('common.unexpectedErrorOccurred'), 'error');
            } finally {
                setImporting(false);
            }
        }
    };

    if (!show) return null;

    return (
        <>
            <div className="modal fade show d-block" tabIndex="-1" role="dialog">
                <div className="modal-dialog modal-dialog-centered modal-xl" role="document">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">{t('customers.importCustomersTitle')}</h5>
                            <button
                                type="button"
                                className="btn-close"
                                onClick={onClose}
                                disabled={importing}
                            ></button>
                        </div>
                        
                        <div className="modal-body">
                            <div className="alert alert-info d-flex align-items-center">
                                <i className="ki-duotone ki-information fs-2x text-info me-4">
                                    <span className="path1"></span>
                                    <span className="path2"></span>
                                    <span className="path3"></span>
                                </i>
                                <div>
                                    <h5 className="mb-1">{t('common.importInstructions')}</h5>
                                    <ol className="mb-0 ps-3">
                                        <li>{t('common.downloadSampleTemplate')}</li>
                                        <li>{t('common.fillEntityData', { entityName })}</li>
                                        <li>{t('common.uploadFileToPreview')}</li>
                                        <li>{t('common.clickConfirmImport')}</li>
                                    </ol>
                                </div>
                            </div>

                            <div className="mb-5">
                                <button
                                    type="button"
                                    className="btn btn-light-primary"
                                    onClick={handleDownloadTemplate}
                                >
                                    <i className="ki-duotone ki-document fs-3 me-2">
                                        <span className="path1"></span>
                                        <span className="path2"></span>
                                    </i>
                                    {t('common.downloadSampleTemplate')}
                                </button>
                            </div>

                            <div className="mb-5">
                                <label className="form-label fw-bold">{t('common.selectFileCsvExcel')}</label>
                                <input
                                    type="file"
                                    className="form-control"
                                    accept=".csv,.xlsx,.xls"
                                    onChange={handleFileChange}
                                    disabled={loading || importing}
                                />
                            </div>

                            {errors.length > 0 && (
                                <div className="alert alert-warning">
                                    <h5 className="mb-3">
                                        <i className="ki-duotone ki-shield-cross fs-3 text-warning me-2">
                                            <span className="path1"></span>
                                            <span className="path2"></span>
                                            <span className="path3"></span>
                                        </i>
                                        {t('common.validationErrors', { count: errors.length })}
                                    </h5>
                                    <ul className="mb-0">
                                        {errors.slice(0, 5).map((error, index) => (
                                            <li key={index}>{error}</li>
                                        ))}
                                        {errors.length > 5 && (
                                            <li>{t('common.moreErrors', { count: errors.length - 5 })}</li>
                                        )}
                                    </ul>
                                </div>
                            )}

                            {loading && (
                                <div className="text-center py-5">
                                    <div className="spinner-border text-primary" role="status">
                                        <span className="visually-hidden">{t('common.loading')}</span>
                                    </div>
                                    <p className="mt-3 text-muted">{t('common.previewingFile')}...</p>
                                </div>
                            )}

                            {!loading && previewData && previewData.data && (
                                <div className="table-responsive">
                                    <h5 className="mb-3">{t('common.preview')} ({previewData.data.length} {t('common.rows')})</h5>
                                    <table className="table table-row-bordered table-row-gray-300 align-middle gs-0 gy-3">
                                        <thead>
                                            <tr className="fw-bold text-muted bg-light">
                                                <th className="min-w-30px">{t('common.status')}</th>
                                                <th className="min-w-150px">{t('common.name')}</th>
                                                <th className="min-w-150px">{t('common.email')}</th>
                                                <th className="min-w-120px">{t('common.phone')}</th>
                                                <th className="min-w-150px">{t('customers.company')}</th>
                                                <th className="min-w-200px">{t('common.errors')}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {previewData.data.slice(0, 50).map((row, index) => (
                                                <tr key={index}>
                                                    <td>
                                                        {row.is_valid ? (
                                                            <span className="badge badge-light-success">
                                                                <i className="ki-duotone ki-check fs-5">
                                                                    <span className="path1"></span>
                                                                    <span className="path2"></span>
                                                                </i>
                                                            </span>
                                                        ) : (
                                                            <span className="badge badge-light-danger">
                                                                <i className="ki-duotone ki-cross fs-5">
                                                                    <span className="path1"></span>
                                                                    <span className="path2"></span>
                                                                </i>
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td>{row.name || '-'}</td>
                                                    <td>{row.email || '-'}</td>
                                                    <td>{row.phone || '-'}</td>
                                                    <td>{row.company_name || '-'}</td>
                                                    <td>
                                                        {row.errors ? (
                                                            <span className="text-danger">{row.errors}</span>
                                                        ) : (
                                                            <span className="text-muted">-</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {previewData.data.length > 50 && (
                                        <p className="text-muted text-center">
                                            {t('common.showingFirstRows', { count: 50, total: previewData.data.length })}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn btn-light"
                                onClick={onClose}
                                disabled={importing}
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={handleImport}
                                disabled={!previewData || loading || importing}
                            >
                                {importing ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2"></span>
                                        {t('common.importing')}
                                    </>
                                ) : (
                                    <>
                                        <i className="ki-duotone ki-check fs-3 me-1">
                                            <span className="path1"></span>
                                            <span className="path2"></span>
                                        </i>
                                        {t('common.clickConfirmImport')}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div className="modal-backdrop fade show"></div>
        </>
    );
};

export default ImportCustomersModal;

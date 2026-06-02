import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { importBranches, previewImport, exportTemplate } from '../../../services/branchesService';
import Swal from 'sweetalert2';

const ImportBranchesModal = ({ onClose, onSuccess }) => {
    const { t } = useTranslation();
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [importing, setImporting] = useState(false);
    const [error, setError] = useState(null);

    const handleFileChange = async (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;

        setFile(selectedFile);
        setError(null);
        setPreview(null);
        await handlePreview(selectedFile);
    };

    const handlePreview = async (fileToPreview = file) => {
        if (!fileToPreview) {
            setError(t('merchant.importBranches.selectFileFirst'));
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await previewImport(fileToPreview);
            
            if (response.success) {
                setPreview(response.data);
                if (response.errors && response.errors.length > 0) {
                    setError(t('merchant.importBranches.previewErrors', { count: response.errors.length }));
                }
            } else {
                setError(response.error || response.message || t('merchant.importBranches.previewFailed'));
                setPreview(null);
            }
        } catch (err) {
            console.error('Preview error:', err);
            setError(t('merchant.importBranches.previewFailed'));
            setPreview(null);
        } finally {
            setLoading(false);
        }
    };

    const handleImport = async () => {
        if (!file) {
            setError(t('merchant.importBranches.selectFileToImport'));
            return;
        }

        const result = await Swal.fire({
            title: t('merchant.importBranches.confirmTitle'),
            text: t('merchant.importBranches.confirmText'),
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: t('merchant.importBranches.yesImport'),
            cancelButtonText: t('merchant.common.cancel')
        });

        if (!result.isConfirmed) return;

        setImporting(true);
        setError(null);

        try {
            const response = await importBranches(file);

            if (response.success) {
                if (response.errors && response.errors.length > 0) {
                    Swal.fire({
                        title: t('merchant.importBranches.partialTitle'),
                        html: t('merchant.importBranches.partialHtml', {
                            count: response.imported_count,
                            errors: response.errors.length
                        }),
                        icon: 'warning',
                        confirmButtonText: t('merchant.common.ok')
                    });
                } else {
                    Swal.fire({
                        title: t('merchant.importBranches.successTitle'),
                        text: t('merchant.importBranches.successText', { count: response.imported_count }),
                        icon: 'success',
                        confirmButtonText: t('merchant.common.ok')
                    });
                }
                onSuccess();
            } else {
                setError(response.message || response.error || t('merchant.importBranches.importFailed'));
            }
        } catch (err) {
            console.error('Import error:', err);
            setError(t('merchant.importBranches.importFailed'));
        } finally {
            setImporting(false);
        }
    };

    const handleDownloadTemplate = async () => {
        try {
            const response = await exportTemplate();
            if (!response.success) {
                Swal.fire({
                    title: t('merchant.common.error'),
                    text: t('merchant.importBranches.templateDownloadFailed'),
                    icon: 'error',
                    confirmButtonText: t('merchant.common.ok')
                });
            }
        } catch (downloadError) {
            console.error('Error downloading template:', downloadError);
            Swal.fire({
                title: t('merchant.common.error'),
                text: t('merchant.importBranches.templateDownloadError'),
                icon: 'error',
                confirmButtonText: t('merchant.common.ok')
            });
        }
    };

    return (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg modal-dialog-centered">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title fw-bold">{t('merchant.importBranches.title')}</h5>
                        <button 
                            type="button" 
                            className="btn btn-sm btn-icon" 
                            onClick={onClose}
                            disabled={importing}
                        >
                            <i className="ki-duotone ki-cross fs-2x"></i>
                        </button>
                    </div>

                    <div className="modal-body">
                        <div className="alert alert-info d-flex align-items-start">
                            <i className="ki-duotone ki-information-2 fs-2x me-3"></i>
                            <div>
                                <div className="fw-bold mb-2">{t('merchant.importBranches.expectedColumns')}</div>
                                <div className="text-gray-800">{t('merchant.importBranches.columnsList')}</div>
                                <div className="mt-2">
                                    <button 
                                        type="button" 
                                        className="btn btn-sm btn-light-primary"
                                        onClick={handleDownloadTemplate}
                                    >
                                        <i className="ki-duotone ki-download fs-2">
                                            <span className="path1"></span>
                                            <span className="path2"></span>
                                        </i>
                                        {t('merchant.importBranches.downloadTemplate')}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="alert alert-danger">
                                <strong>{t('merchant.branchView.errorPrefix')}</strong> {error}
                            </div>
                        )}

                        <div className="mb-5">
                            <label className="form-label fw-bold">{t('merchant.importBranches.selectFile')}</label>
                            <input
                                type="file"
                                className="form-control"
                                accept=".csv,.xlsx,.xls"
                                onChange={handleFileChange}
                                disabled={loading || importing}
                            />
                            <div className="form-text">{t('merchant.importBranches.fileFormats')}</div>
                        </div>

                        {preview && preview.length > 0 && (
                            <div className="table-responsive" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                <table className="table table-sm table-row-bordered">
                                    <thead>
                                        <tr className="fw-bold text-gray-800">
                                            <th>{t('merchant.importBranches.colRow')}</th>
                                            <th>{t('merchant.importBranches.colName')}</th>
                                            <th>{t('merchant.importBranches.colAddress')}</th>
                                            <th>{t('merchant.importBranches.colActive')}</th>
                                            <th>{t('merchant.importBranches.colStatus')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {preview.map((row, index) => (
                                            <tr key={index} className={row.has_errors ? 'bg-light-danger' : ''}>
                                                <td>{index + 1}</td>
                                                <td>{row.name || '-'}</td>
                                                <td>{row.address || '-'}</td>
                                                <td>
                                                    <span className={`badge ${row.is_active ? 'badge-success' : 'badge-secondary'}`}>
                                                        {row.is_active ? t('merchant.importBranches.yes') : t('merchant.importBranches.no')}
                                                    </span>
                                                </td>
                                                <td>
                                                    {row.has_errors ? (
                                                        <span className="badge badge-danger">
                                                            {row.errors.join(', ')}
                                                        </span>
                                                    ) : (
                                                        <span className="badge badge-success">{t('merchant.importBranches.valid')}</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {loading && (
                            <div className="text-center py-5">
                                <div className="spinner-border text-primary" role="status">
                                    <span className="visually-hidden">{t('merchant.common.loading')}</span>
                                </div>
                                <div className="mt-3 text-gray-600">{t('merchant.importBranches.previewing')}</div>
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
                            {t('merchant.importBranches.cancel')}
                        </button>
                        <button 
                            type="button" 
                            className="btn btn-primary"
                            onClick={handleImport}
                            disabled={!file || loading || importing || !preview}
                        >
                            {importing ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2"></span>
                                    {t('merchant.importBranches.importing')}
                                </>
                            ) : (
                                <>
                                    <i className="ki-duotone ki-file-up fs-2">
                                        <span className="path1"></span>
                                        <span className="path2"></span>
                                    </i>
                                    {t('merchant.importBranches.importBranchesBtn')}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImportBranchesModal;

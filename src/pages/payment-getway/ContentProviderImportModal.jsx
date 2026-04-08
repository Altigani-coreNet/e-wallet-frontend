import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { previewPartnersImport, importPartners, downloadPartnersImportTemplate } from '../../services/adminPartnersService';
import { validateFile } from '../../utils/fileHelpers';

const ContentProviderImportModal = ({ isOpen, onClose, onImportSuccess }) => {
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
            toast.error('Please select a file first');
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
                toast.success('Preview generated successfully');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to preview import');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleImport = async () => {
        if (!selectedFile) {
            toast.error('Please select a file first');
            return;
        }

        try {
            setIsLoading(true);
            setImportProgress({ status: 'importing', message: 'Importing content providers...' });
            
            const result = await importPartners(selectedFile);
            if (!result.success) {
                setImportProgress({ status: 'error', message: result.error || 'Import failed' });
                toast.error(result.error || 'Failed to import content providers');
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
                
                toast.success(`Import completed: ${responseData.data.imported_count} imported, ${responseData.data.failed_count} failed`);
                
                // Call success callback after a delay
                setTimeout(() => {
                    onImportSuccess();
                    handleClose();
                }, 2000);
            }
        } catch (error) {
            setImportProgress({ status: 'error', message: error.response?.data?.message || 'Import failed' });
            toast.error(error.response?.data?.message || 'Failed to import content providers');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownloadTemplate = async () => {
        try {
            const result = await downloadPartnersImportTemplate();
            if (result.success) {
                toast.success('Template downloaded successfully');
            } else {
                toast.error(result.error || 'Failed to download template');
            }
        } catch (error) {
            toast.error('Failed to download template');
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
                            Import Content Providers
                        </h5>
                        <button type="button" className="btn-close" onClick={handleClose} disabled={isLoading}></button>
                    </div>

                    <div className="modal-body">
                        {!isPreviewMode && !importProgress && (
                            <>
                                {/* File Upload Section */}
                                <div className="mb-5">
                                    <label htmlFor="import_file" className="form-label fw-bold">Select File</label>
                                    <input
                                        type="file"
                                        className="form-control"
                                        id="import_file"
                                        accept=".xlsx,.xls,.csv"
                                        onChange={handleFileSelect}
                                        disabled={isLoading}
                                    />
                                    <div className="form-text">Supported formats: .xlsx, .xls, .csv (Max 10MB)</div>
                                </div>

                                {/* Instructions */}
                                <div className="alert alert-info d-flex align-items-center">
                                    <i className="ki-duotone ki-information-5 fs-2hx text-info me-4">
                                        <span className="path1"></span>
                                        <span className="path2"></span>
                                        <span className="path3"></span>
                                    </i>
                                    <div className="d-flex flex-column">
                                        <h5 className="mb-1">Import Instructions</h5>
                                        <span>Download the template, fill in content provider data, and upload the file. Click Preview to validate before importing.</span>
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
                                        Download Template
                                    </button>
                                </div>
                            </>
                        )}

                        {/* Preview Section */}
                        {isPreviewMode && previewData && (
                            <div>
                                <div className="alert alert-light-primary d-flex align-items-center mb-5">
                                    <div className="d-flex flex-column">
                                        <h5 className="mb-1">Preview Summary</h5>
                                        <span>
                                            Total: {previewData.summary.total} | 
                                            Valid: <span className="text-success fw-bold">{previewData.summary.valid}</span> | 
                                            Invalid: <span className="text-danger fw-bold">{previewData.summary.invalid}</span>
                                        </span>
                                    </div>
                                </div>

                                <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                    <table className="table table-sm table-row-bordered">
                                        <thead className="sticky-top bg-light">
                                            <tr>
                                                <th>Row</th>
                                                <th>Name</th>
                                                <th>Email</th>
                                                <th>Phone</th>
                                                <th>Country</th>
                                                <th>Status</th>
                                                <th>Errors</th>
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
                                                            <span className="badge badge-light-success">Valid</span>
                                                        ) : (
                                                            <span className="badge badge-light-danger">Invalid</span>
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
                                <h5>{importProgress.status === 'error' ? 'Import Failed' : 'Import Status'}</h5>
                                <p>{importProgress.message}</p>
                                {importProgress.imported !== undefined && (
                                    <div>
                                        <p>Imported: {importProgress.imported}</p>
                                        <p>Failed: {importProgress.failed}</p>
                                    </div>
                                )}
                                {importProgress.errors && importProgress.errors.length > 0 && (
                                    <div className="mt-3">
                                        <h6>Errors:</h6>
                                        <ul>
                                            {importProgress.errors.slice(0, 10).map((error, idx) => (
                                                <li key={idx}>{error}</li>
                                            ))}
                                        </ul>
                                        {importProgress.errors.length > 10 && (
                                            <p>... and {importProgress.errors.length - 10} more errors</p>
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
                            Close
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
                                            Loading...
                                        </>
                                    ) : (
                                        <>
                                            <i className="ki-duotone ki-eye fs-2">
                                                <span className="path1"></span>
                                                <span className="path2"></span>
                                                <span className="path3"></span>
                                            </i>
                                            Preview
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
                                            Importing...
                                        </>
                                    ) : (
                                        <>
                                            <i className="ki-duotone ki-check fs-2">
                                                <span className="path1"></span>
                                                <span className="path2"></span>
                                            </i>
                                            Import Now
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
                                    Back
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
                                            Importing...
                                        </>
                                    ) : (
                                        <>
                                            <i className="ki-duotone ki-check fs-2">
                                                <span className="path1"></span>
                                                <span className="path2"></span>
                                            </i>
                                            Import {previewData?.summary.valid} Valid Rows
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


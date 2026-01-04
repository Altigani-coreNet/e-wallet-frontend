import React, { useState } from 'react';
import { importBranches, previewImport, exportTemplate } from '../../../services/branchesService';
import Swal from 'sweetalert2';

const ImportBranchesModal = ({ onClose, onSuccess }) => {
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

        // Auto-preview
        await handlePreview(selectedFile);
    };

    const handlePreview = async (fileToPreview = file) => {
        if (!fileToPreview) {
            setError('Please select a file first');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await previewImport(fileToPreview);
            
            if (response.success) {
                setPreview(response.data);
                if (response.errors && response.errors.length > 0) {
                    setError(`Preview contains ${response.errors.length} error(s). Please review before importing.`);
                }
            } else {
                setError(response.error || response.message || 'Failed to preview file');
                setPreview(null);
            }
        } catch (err) {
            console.error('Preview error:', err);
            setError('Failed to preview file');
            setPreview(null);
        } finally {
            setLoading(false);
        }
    };

    const handleImport = async () => {
        if (!file) {
            setError('Please select a file to import');
            return;
        }

        const result = await Swal.fire({
            title: 'Confirm Import',
            text: 'Are you sure you want to import these branches?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, import!',
            cancelButtonText: 'Cancel'
        });

        if (!result.isConfirmed) return;

        setImporting(true);
        setError(null);

        try {
            const response = await importBranches(file);

            if (response.success) {
                if (response.errors && response.errors.length > 0) {
                    Swal.fire({
                        title: 'Partially Imported',
                        html: `Successfully imported ${response.imported_count} branches!<br><br><strong>Warning:</strong> ${response.errors.length} rows had errors.`,
                        icon: 'warning',
                        confirmButtonText: 'OK'
                    });
                } else {
                    Swal.fire({
                        title: 'Success!',
                        text: `Successfully imported ${response.imported_count} branches!`,
                        icon: 'success',
                        confirmButtonText: 'OK'
                    });
                }
                onSuccess();
            } else {
                setError(response.message || response.error || 'Failed to import branches');
            }
        } catch (err) {
            console.error('Import error:', err);
            setError('Failed to import branches');
        } finally {
            setImporting(false);
        }
    };

    const handleDownloadTemplate = async () => {
        try {
            const response = await exportTemplate();
            if (!response.success) {
                Swal.fire({
                    title: 'Error!',
                    text: 'Failed to download template',
                    icon: 'error',
                    confirmButtonText: 'OK'
                });
            }
        } catch (error) {
            console.error('Error downloading template:', error);
            Swal.fire({
                title: 'Error!',
                text: 'An error occurred while downloading the template',
                icon: 'error',
                confirmButtonText: 'OK'
            });
        }
    };

    return (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg modal-dialog-centered">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title fw-bold">Import Branches</h5>
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
                        {/* Info Alert */}
                        <div className="alert alert-info d-flex align-items-start">
                            <i className="ki-duotone ki-information-2 fs-2x me-3"></i>
                            <div>
                                <div className="fw-bold mb-2">Expected file columns</div>
                                <div className="text-gray-800">name, address, is_active</div>
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
                                        Download Template
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Error Alert */}
                        {error && (
                            <div className="alert alert-danger">
                                <strong>Error:</strong> {error}
                            </div>
                        )}

                        {/* File Input */}
                        <div className="mb-5">
                            <label className="form-label fw-bold">Select File</label>
                            <input
                                type="file"
                                className="form-control"
                                accept=".csv,.xlsx,.xls"
                                onChange={handleFileChange}
                                disabled={loading || importing}
                            />
                            <div className="form-text">Supported formats: CSV, XLSX, XLS (Max: 2MB)</div>
                        </div>

                        {/* Preview Table */}
                        {preview && preview.length > 0 && (
                            <div className="table-responsive" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                <table className="table table-sm table-row-bordered">
                                    <thead>
                                        <tr className="fw-bold text-gray-800">
                                            <th>Row</th>
                                            <th>Name</th>
                                            <th>Address</th>
                                            <th>Active</th>
                                            <th>Status</th>
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
                                                        {row.is_active ? 'Yes' : 'No'}
                                                    </span>
                                                </td>
                                                <td>
                                                    {row.has_errors ? (
                                                        <span className="badge badge-danger">
                                                            {row.errors.join(', ')}
                                                        </span>
                                                    ) : (
                                                        <span className="badge badge-success">Valid</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Loading State */}
                        {loading && (
                            <div className="text-center py-5">
                                <div className="spinner-border text-primary" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                                <div className="mt-3 text-gray-600">Previewing file...</div>
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
                            Cancel
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
                                    Importing...
                                </>
                            ) : (
                                <>
                                    <i className="ki-duotone ki-file-up fs-2">
                                        <span className="path1"></span>
                                        <span className="path2"></span>
                                    </i>
                                    Import Branches
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



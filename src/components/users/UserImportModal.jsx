import React, { useState, useRef } from 'react';
import { toast } from 'react-toastify';
import { downloadUserTemplate, previewUserImport } from '../../services/usersService';
import ImportPreviewModal from './ImportPreviewModal';

export default function UserImportModal({ show, onHide, onImportComplete }) {
    const [selectedFile, setSelectedFile] = useState(null);
    const [downloadingTemplate, setDownloadingTemplate] = useState(false);
    const [validating, setValidating] = useState(false);
    const [previewData, setPreviewData] = useState(null);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file type
            const validTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
            if (!validTypes.includes(file.type)) {
                toast.error('Please upload a valid Excel file (.xlsx or .xls)');
                setSelectedFile(null);
                return;
            }

            // Validate file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                toast.error('File size must be less than 10MB');
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
            
            // Create download link
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'users_import_template.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            
            toast.success('Template downloaded successfully!');
        } catch (err) {
            console.error('Error downloading template:', err);
            toast.error('Failed to download template');
        } finally {
            setDownloadingTemplate(false);
        }
    };

    const handlePreview = async () => {
        if (!selectedFile) {
            toast.error('Please select a file first');
            return;
        }

        try {
            setValidating(true);
            const response = await previewUserImport(selectedFile);

            if (response.success !== false) {
                setPreviewData(response.data);
                setShowPreviewModal(true);
            } else {
                toast.error(response.message || 'Failed to preview file');
            }
        } catch (err) {
            console.error('Preview error:', err);
            toast.error(err.response?.data?.message || 'Failed to preview file');
        } finally {
            setValidating(false);
        }
    };

    const handleImportSuccess = (result) => {
        toast.success(`Import completed! ${result.imported} users imported, ${result.updated} updated.`);
        
        // Reset form
        setSelectedFile(null);
        setPreviewData(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }

        // Close modals and refresh parent
        setShowPreviewModal(false);
        onHide();
        if (onImportComplete) {
            onImportComplete();
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
            {/* Main Import Modal */}
            <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                <div className="modal-dialog modal-dialog-centered modal-xl">
                    <div className="modal-content">
                        <div className="modal-header bg-primary text-white">
                            <h5 className="modal-title">
                                <i className="ki-duotone ki-exit-down fs-2 me-2">
                                    <span className="path1"></span>
                                    <span className="path2"></span>
                                </i>
                                Import Users from Excel
                            </h5>
                            <button type="button" className="btn-close btn-close-white" onClick={handleClose}></button>
                        </div>
                        <div className="modal-body">
                            {/* Instructions */}
                            <div className="alert alert-info">
                                <h6>
                                    <i className="ki-duotone ki-information fs-2 me-2">
                                        <span className="path1"></span>
                                        <span className="path2"></span>
                                        <span className="path3"></span>
                                    </i>
                                    How to Import Users:
                                </h6>
                                <ol className="mb-0">
                                    <li>Download the Excel template below</li>
                                    <li>Fill in your user data (use dropdowns in the template)</li>
                                    <li>Upload the completed file</li>
                                    <li>Preview and validate your data</li>
                                    <li>Confirm to import to database</li>
                                </ol>
                            </div>

                            {/* Download Template */}
                            <div className="mb-4">
                                <h6>Step 1: Download Template</h6>
                                <p className="text-muted small">
                                    The template includes dropdown lists and reference sheets (Branches and Roles) for easy data entry.
                                </p>
                                <button 
                                    className="btn btn-primary"
                                    onClick={handleDownloadTemplate}
                                    disabled={downloadingTemplate}
                                >
                                    {downloadingTemplate ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2"></span>
                                            Downloading...
                                        </>
                                    ) : (
                                        <>
                                            <i className="ki-duotone ki-cloud-download fs-3 me-2">
                                                <span className="path1"></span>
                                                <span className="path2"></span>
                                            </i>
                                            Download Excel Template
                                        </>
                                    )}
                                </button>
                            </div>

                            <hr />

                            {/* Upload File */}
                            <div className="mb-4">
                                <h6>Step 2: Upload Your File</h6>
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
                                            Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                                        </small>
                                    </div>
                                )}
                            </div>

                            {/* Preview Button */}
                            <div className="d-flex gap-2">
                                <button 
                                    className="btn btn-success"
                                    onClick={handlePreview}
                                    disabled={!selectedFile || validating}
                                >
                                    {validating ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2"></span>
                                            Validating...
                                        </>
                                    ) : (
                                        <>
                                            <i className="ki-duotone ki-eye fs-3 me-2">
                                                <span className="path1"></span>
                                                <span className="path2"></span>
                                                <span className="path3"></span>
                                            </i>
                                            Preview & Validate
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
                                        Clear
                                    </button>
                                )}
                            </div>

                            {/* Progress Bar */}
                            {validating && (
                                <div className="mt-3">
                                    <div className="progress">
                                        <div className="progress-bar progress-bar-striped progress-bar-animated w-100">
                                            Validating...
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
                                Tip: Use the dropdown arrows in the Excel template to select valid values.
                            </small>
                            <button type="button" className="btn btn-secondary" onClick={handleClose}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Preview Modal */}
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


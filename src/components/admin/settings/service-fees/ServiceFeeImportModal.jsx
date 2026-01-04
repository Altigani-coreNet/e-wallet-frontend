import React, { useState } from 'react';
import { importServiceFees, exportServiceFeesTemplate } from '../../../../services/adminServiceFeesService';
import { toast } from 'react-toastify';

const ServiceFeeImportModal = ({ show, onClose, onImportSuccess }) => {
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
            toast.warning('Please select a file to import');
            return;
        }

        setImporting(true);
        const response = await importServiceFees(file);
        setImporting(false);

        if (response.success) {
            toast.success(response.data?.message || 'Service fees imported successfully');
            setFile(null);
            onClose();
            onImportSuccess();
        } else {
            toast.error(response.error || 'Import failed');
        }
    };

    const handleDownloadTemplate = async () => {
        const response = await exportServiceFeesTemplate();
        if (!response.success) {
            toast.error(response.error || 'Failed to download template');
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
                            Import Service Fees
                        </h5>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="modal-body">
                            <div className="mb-3">
                                <label htmlFor="import_file" className="form-label">Select File</label>
                                <input 
                                    type="file" 
                                    className="form-control" 
                                    id="import_file"
                                    accept=".xlsx,.xls,.csv"
                                    onChange={handleFileChange}
                                    required
                                />
                                <div className="form-text">Supported formats: .xlsx, .xls, .csv</div>
                            </div>
                            
                            <div className="alert alert-info">
                                <div className="d-flex">
                                    <i className="ki-duotone ki-information-5 fs-2hx text-info me-4">
                                        <span className="path1"></span>
                                        <span className="path2"></span>
                                        <span className="path3"></span>
                                    </i>
                                    <div className="d-flex flex-column">
                                        <h5 className="mb-1">Import Instructions</h5>
                                        <span>Please ensure your file contains columns: Name, Type, Fees. The Type field should contain the service fee type as text.</span>
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
                                    Download Template
                                </button>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={onClose}>
                                Cancel
                            </button>
                            <button type="submit" className="btn btn-primary" disabled={importing}>
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
                                        Import
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



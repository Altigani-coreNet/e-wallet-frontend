import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ADMIN_ENDPOINTS } from '../../../utils/constants';
import { getToken } from '../../../utils/api';
import { previewAdminTerminalImport, importAdminTerminals, downloadAdminTerminalTemplate } from '../../../services/adminTerminalsService';

const TerminalImportModal = ({ isOpen, onClose, onImportSuccess }) => {
    const [merchants, setMerchants] = useState([]);
    const [selectedMerchant, setSelectedMerchant] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewData, setPreviewData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMerchants, setLoadingMerchants] = useState(false);
    const [importing, setImporting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchMerchants();
        }
    }, [isOpen]);

    const fetchMerchants = async () => {
        try {
            setLoadingMerchants(true);
            const token = getToken();
            const response = await axios.get(ADMIN_ENDPOINTS.MERCHANTS, {
                params: { per_page: 100 },
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.data.success || response.data.status) {
                const merchantData = response.data.data.data || response.data.data || [];
                setMerchants(merchantData);
            }
        } catch (error) {
            console.error('Failed to fetch merchants:', error);
            toast.error('Failed to load merchants');
        } finally {
            setLoadingMerchants(false);
        }
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        const allowedTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel',
            'text/csv'
        ];
        
        if (!allowedTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls|csv)$/)) {
            toast.error('Please select a valid Excel or CSV file');
            return;
        }

        // Validate file size (10MB max)
        if (file.size > 10 * 1024 * 1024) {
            toast.error('File size must be less than 10MB');
            return;
        }

        setSelectedFile(file);
        setPreviewData(null); // Reset preview when new file selected
    };

    const handlePreview = async (e) => {
        e.preventDefault();
        
        if (!selectedMerchant) {
            toast.error('Please select a merchant');
            return;
        }

        if (!selectedFile) {
            toast.error('Please select a file');
            return;
        }

        try {
            setIsLoading(true);
            const response = await previewAdminTerminalImport(selectedFile, selectedMerchant);

            if (response.success) {
                setPreviewData(response.data);
                toast.success(`Preview loaded: ${response.data.total} terminals found`);
            } else {
                toast.error(response.error || 'Failed to preview import');
            }
        } catch (error) {
            console.error('Preview error:', error);
            toast.error('Failed to preview import');
        } finally {
            setIsLoading(false);
        }
    };

    const handleImport = async () => {
        if (!selectedMerchant) {
            toast.error('Please select a merchant');
            return;
        }

        if (!selectedFile) {
            toast.error('Please select a file');
            return;
        }

        try {
            setImporting(true);
            const response = await importAdminTerminals(selectedFile, selectedMerchant);

            if (response.success) {
                toast.success(response.message);
                if (response.errors && response.errors.length > 0) {
                    console.warn('Import errors:', response.errors);
                    toast.warning(`Imported with ${response.errors.length} errors. Check console for details.`);
                }
                resetForm();
                onImportSuccess();
            } else {
                toast.error(response.error || 'Failed to import terminals');
            }
        } catch (error) {
            console.error('Import error:', error);
            toast.error('Failed to import terminals');
        } finally {
            setImporting(false);
        }
    };

    const handleDownloadTemplate = async () => {
        await downloadAdminTerminalTemplate();
    };

    const resetForm = () => {
        setSelectedFile(null);
        setSelectedMerchant('');
        setPreviewData(null);
        // Reset file input
        const fileInput = document.getElementById('terminal_import_file');
        if (fileInput) {
            fileInput.value = '';
        }
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered modal-lg">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">
                            <i className="ki-duotone ki-file-up fs-2 me-2">
                                <span className="path1"></span>
                                <span className="path2"></span>
                            </i>
                            Import Terminals
                        </h5>
                        <button type="button" className="btn-close" onClick={handleClose}></button>
                    </div>
                    <div className="modal-body">
                        {/* Merchant Selection */}
                        <div className="mb-5">
                            <label className="form-label fw-bold required">Select Merchant</label>
                            <select
                                className="form-select"
                                value={selectedMerchant}
                                onChange={(e) => setSelectedMerchant(e.target.value)}
                                disabled={loadingMerchants}
                            >
                                <option value="">Choose merchant...</option>
                                {merchants.map((merchant) => (
                                    <option key={merchant.id} value={merchant.id}>
                                        {merchant.business_name || merchant.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* File Selection */}
                        <div className="mb-5">
                            <label className="form-label fw-bold required">Select File</label>
                            <input
                                type="file"
                                className="form-control"
                                id="terminal_import_file"
                                accept=".xlsx,.xls,.csv"
                                onChange={handleFileSelect}
                            />
                            <div className="form-text">Supported formats: .xlsx, .xls, .csv (Max 10MB)</div>
                        </div>

                        {/* Download Template Button */}
                        <div className="mb-5">
                            <button
                                type="button"
                                className="btn btn-sm btn-light-primary"
                                onClick={handleDownloadTemplate}
                            >
                                <i className="ki-duotone ki-download fs-2">
                                    <span className="path1"></span>
                                    <span className="path2"></span>
                                </i>
                                Download Import Template
                            </button>
                        </div>

                        {/* Preview Button */}
                        {selectedFile && selectedMerchant && (
                            <div className="mb-5">
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={handlePreview}
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2"></span>
                                            Loading Preview...
                                        </>
                                    ) : (
                                        <>
                                            <i className="ki-duotone ki-eye fs-2">
                                                <span className="path1"></span>
                                                <span className="path2"></span>
                                                <span className="path3"></span>
                                            </i>
                                            Preview Import
                                        </>
                                    )}
                                </button>
                            </div>
                        )}

                        {/* Preview Data */}
                        {previewData && (
                            <div className="alert alert-info">
                                <h6 className="mb-3">Preview Results:</h6>
                                <div className="d-flex justify-content-between mb-2">
                                    <span>Total Terminals:</span>
                                    <strong>{previewData.total}</strong>
                                </div>
                                <div className="d-flex justify-content-between mb-2">
                                    <span className="text-success">Valid:</span>
                                    <strong className="text-success">{previewData.valid}</strong>
                                </div>
                                <div className="d-flex justify-content-between">
                                    <span className="text-danger">Invalid:</span>
                                    <strong className="text-danger">{previewData.invalid}</strong>
                                </div>
                                
                                {previewData.invalid > 0 && (
                                    <div className="mt-3">
                                        <p className="text-danger fw-bold mb-2">Issues found:</p>
                                        <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                                            {previewData.rows
                                                .filter(row => row.flags.error)
                                                .slice(0, 10)
                                                .map((row, idx) => (
                                                    <div key={idx} className="text-danger small">
                                                        Row {idx + 2}: {row.flags.error}
                                                    </div>
                                                ))}
                                            {previewData.rows.filter(row => row.flags.error).length > 10 && (
                                                <div className="text-muted small mt-2">
                                                    ... and {previewData.rows.filter(row => row.flags.error).length - 10} more errors
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Instructions */}
                        <div className="alert alert-light">
                            <div className="d-flex">
                                <i className="ki-duotone ki-information-5 fs-2hx text-primary me-4">
                                    <span className="path1"></span>
                                    <span className="path2"></span>
                                    <span className="path3"></span>
                                </i>
                                <div className="d-flex flex-column">
                                    <h5 className="mb-1">Import Instructions</h5>
                                    <ul className="mb-0">
                                        <li>Download the template to see the required format</li>
                                        <li>Terminal Name is required</li>
                                        <li>Terminal ID will be auto-generated if not provided</li>
                                        <li>Merchant ID will be auto-assigned based on selection</li>
                                        <li>Preview your file before importing to check for errors</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-light" onClick={handleClose}>
                            Cancel
                        </button>
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={handleImport}
                            disabled={!selectedFile || !selectedMerchant || importing}
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
                                    Import Terminals
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TerminalImportModal;


import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { downloadProductTemplate, previewProductImport } from '../../../services/productsService';
import { useToolbar } from '../../../contexts/ToolbarContext';
import ImportPreviewModal from './ImportPreviewModal';

export default function ProductImport() {
    const { setTitle, setBreadcrumbs } = useToolbar();
    const navigate = useNavigate();
    const [selectedFile, setSelectedFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [previewData, setPreviewData] = useState(null);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const fileInputRef = useRef(null);

    // Set page title and breadcrumbs
    useEffect(() => {
        setTitle('Import Products');
        setBreadcrumbs([
            { label: 'Dashboard', path: '/sales/dashboard' },
            { label: 'Product Management', path: '#' },
            { label: 'Products', path: '/sales/products' },
            { label: 'Import Products', path: '/sales/products/import', active: true }
        ]);

        return () => {
            setBreadcrumbs([]);
        };
    }, [setTitle, setBreadcrumbs]);

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
            setLoading(true);
            const blob = await downloadProductTemplate();
            
            // Create download link
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'products_import_template.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            
            toast.success('Template downloaded successfully!');
        } catch (err) {
            console.error('Error downloading template:', err);
            toast.error('Failed to download template');
        } finally {
            setLoading(false);
        }
    };

    const handlePreview = async () => {
        if (!selectedFile) {
            toast.error('Please select a file first');
            return;
        }

        try {
            setLoading(true);
            const response = await previewProductImport(selectedFile);

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
            setLoading(false);
        }
    };

    const handleImportSuccess = (result) => {
        toast.success(`Import completed! ${result.imported} products imported, ${result.updated} updated.`);
        
        // Reset form
        setSelectedFile(null);
        setPreviewData(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }

        // Navigate back to products list
        setTimeout(() => {
            navigate('/sales/products');
        }, 1500);
    };

    const handleCloseModal = () => {
        setShowPreviewModal(false);
        setPreviewData(null);
    };

    return (
        <>
            <div className="card">
                <div className="card-header bg-primary text-white">
                    <h5 className="mb-0">
                        <i className="bx bx-import me-2"></i>
                        Import Products from Excel
                    </h5>
                </div>
                <div className="card-body">
                    {/* Instructions */}
                    <div className="alert alert-info">
                        <h6><i className="bx bx-info-circle me-2"></i>How to Import Products:</h6>
                        <ol className="mb-0">
                            <li>Download the Excel template below</li>
                            <li>Fill in your product data (use dropdowns in the template)</li>
                            <li>Upload the completed file</li>
                            <li>Preview and validate your data</li>
                            <li>Confirm to import to database</li>
                        </ol>
                    </div>

                    {/* Download Template */}
                    <div className="mb-4">
                        <h6>Step 1: Download Template</h6>
                        <p className="text-muted small">
                            The template includes dropdown lists and reference sheets for easy data entry.
                        </p>
                        <button 
                            className="btn btn-primary"
                            onClick={handleDownloadTemplate}
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2"></span>
                                    Downloading...
                                </>
                            ) : (
                                <>
                                    <i className="bx bx-download me-2"></i>
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
                            disabled={loading}
                        />
                        {selectedFile && (
                            <div className="mt-2">
                                <small className="text-success">
                                    <i className="bx bx-check-circle me-1"></i>
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
                            disabled={!selectedFile || loading}
                        >
                            {loading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2"></span>
                                    Validating...
                                </>
                            ) : (
                                <>
                                    <i className="bx bx-search me-2"></i>
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
                            >
                                Clear
                            </button>
                        )}
                    </div>

                    {/* Progress Bar */}
                    {loading && (
                        <div className="mt-3">
                            <div className="progress">
                                <div className="progress-bar progress-bar-striped progress-bar-animated w-100">
                                    Processing...
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="card-footer text-muted">
                    <small>
                        <i className="bx bx-info-circle me-1"></i>
                        Tip: Use the dropdown arrows in the Excel template to select valid values. 
                        Check the reference sheets (Categories, Brands, Tags, etc.) for available options.
                    </small>
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


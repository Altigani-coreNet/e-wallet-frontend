import React, { useState } from 'react';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';

const ImportInventoryModal = ({ 
    show, 
    onClose, 
    onSuccess,
    entityName = 'item',
    exportTemplate,
    importPreview,
    importData
}) => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewData, setPreviewData] = useState(null);
    const [errors, setErrors] = useState([]);
    const [loading, setLoading] = useState(false);
    const [importing, setImporting] = useState(false);

    // Handle file selection
    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setSelectedFile(file);
        setErrors([]);
        setPreviewData(null);

        // Auto-preview
        await handlePreview(file);
    };

    // Handle preview
    const handlePreview = async (file) => {
        if (!importPreview) return;
        
        setLoading(true);
        setErrors([]);

        try {
            const response = await importPreview(file);

            if (response.success) {
                const data = response.data?.data || response.data;
                setPreviewData(data);
                
                if (data.errors && data.errors.length > 0) {
                    setErrors(data.errors);
                    toast.warning(`Found ${data.errors.length} validation error(s)`);
                }
            } else {
                toast.error(response.error || 'Failed to preview file');
            }
        } catch (error) {
            console.error('Preview error:', error);
            toast.error('Failed to preview file');
        } finally {
            setLoading(false);
        }
    };

    // Handle download template
    const handleDownloadTemplate = async () => {
        if (!exportTemplate) return;
        
        try {
            const blob = await exportTemplate();
            
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = `${entityName}_import_template.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(downloadUrl);
            document.body.removeChild(a);
            
            toast.success('Template downloaded successfully');
        } catch (error) {
            console.error('Download error:', error);
            toast.error('Failed to download template');
        }
    };

    // Handle import confirmation
    const handleImport = async () => {
        if (!selectedFile || !importData) {
            toast.error('Please select a file');
            return;
        }

        const result = await Swal.fire({
            title: 'Confirm Import',
            text: `Are you sure you want to import these ${entityName}s?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, import!',
            cancelButtonText: 'Cancel'
        });

        if (result.isConfirmed) {
            setImporting(true);

            try {
                const response = await importData(selectedFile);

                if (response.success) {
                    const data = response.data;
                    const importedCount = data.imported_count || 0;
                    const skippedCount = data.skipped_count || 0;
                    const importErrors = data.errors || [];

                    let message = `Import completed!\n\nImported: ${importedCount}\nSkipped: ${skippedCount}`;
                    
                    if (importErrors.length > 0) {
                        message += '\n\nErrors:\n' + importErrors.slice(0, 5).join('\n');
                        if (importErrors.length > 5) {
                            message += `\n...and ${importErrors.length - 5} more errors`;
                        }
                    }

                    await Swal.fire({
                        title: 'Import Complete',
                        text: message,
                        icon: importedCount > 0 ? 'success' : 'warning',
                        confirmButtonText: 'OK'
                    });

                    onSuccess();
                } else {
                    Swal.fire('Error!', response.error || `Failed to import ${entityName}s`, 'error');
                }
            } catch (error) {
                console.error('Import error:', error);
                Swal.fire('Error!', 'An unexpected error occurred', 'error');
            } finally {
                setImporting(false);
            }
        }
    };

    if (!show) return null;

    return (
        <>
            <div className="modal fade show d-block" tabIndex="-1" role="dialog" style={{ zIndex: 1055 }}>
                <div className="modal-dialog modal-dialog-centered modal-xl" role="document">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">Import {entityName.charAt(0).toUpperCase() + entityName.slice(1)}s</h5>
                            <button
                                type="button"
                                className="btn-close"
                                onClick={onClose}
                                disabled={importing}
                            ></button>
                        </div>
                        
                        <div className="modal-body">
                            {/* Instructions */}
                            <div className="alert alert-info d-flex align-items-center">
                                <i className="ki-duotone ki-information fs-2x text-info me-4">
                                    <span className="path1"></span>
                                    <span className="path2"></span>
                                    <span className="path3"></span>
                                </i>
                                <div>
                                    <h5 className="mb-1">Import Instructions</h5>
                                    <ol className="mb-0 ps-3">
                                        <li>Download the sample template below</li>
                                        <li>Fill in your {entityName} data</li>
                                        <li>Upload the file to preview</li>
                                        <li>Click "Confirm Import" to import</li>
                                    </ol>
                                </div>
                            </div>

                            {/* Download Template Button */}
                            {exportTemplate && (
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
                                        Download Sample Template
                                    </button>
                                </div>
                            )}

                            {/* File Upload */}
                            <div className="mb-5">
                                <label className="form-label fw-bold">Select File (CSV or Excel)</label>
                                <input
                                    type="file"
                                    className="form-control"
                                    accept=".csv,.xlsx,.xls"
                                    onChange={handleFileChange}
                                    disabled={loading || importing}
                                />
                            </div>

                            {/* Error List */}
                            {errors.length > 0 && (
                                <div className="alert alert-warning">
                                    <h5 className="mb-3">
                                        <i className="ki-duotone ki-shield-cross fs-3 text-warning me-2">
                                            <span className="path1"></span>
                                            <span className="path2"></span>
                                            <span className="path3"></span>
                                        </i>
                                        Validation Errors ({errors.length})
                                    </h5>
                                    <ul className="mb-0">
                                        {errors.slice(0, 5).map((error, index) => (
                                            <li key={index}>{error}</li>
                                        ))}
                                        {errors.length > 5 && (
                                            <li>...and {errors.length - 5} more errors</li>
                                        )}
                                    </ul>
                                </div>
                            )}

                            {/* Loading */}
                            {loading && (
                                <div className="text-center py-5">
                                    <div className="spinner-border text-primary" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                    </div>
                                    <p className="mt-3 text-muted">Previewing file...</p>
                                </div>
                            )}

                            {/* Preview Table */}
                            {!loading && previewData && previewData.data && (() => {
                                // Get all unique keys from the data (excluding internal fields)
                                const internalFields = ['is_valid', 'errors', 'validation_errors', 'row_number', 'row_type', 'will_be_imported'];
                                const sampleRow = previewData.data[0] || {};
                                const dataFields = Object.keys(sampleRow).filter(key => !internalFields.includes(key));
                                
                                // Define field labels mapping for better display
                                const fieldLabels = {
                                    name: 'Name',
                                    email: 'Email',
                                    phone: 'Phone',
                                    city: 'City',
                                    address: 'Address',
                                    status: 'Status',
                                    slug: 'Slug',
                                    rate: 'Rate (%)',
                                    code: 'Code',
                                    parent_id: 'Parent ID',
                                    description: 'Description',
                                    image: 'Image',
                                    country: 'Country',
                                    state: 'State',
                                    zip: 'ZIP Code',
                                    postal_code: 'Postal Code'
                                };

                                return (
                                    <div className="table-responsive">
                                        <h5 className="mb-3">
                                            Preview ({previewData.data.length} rows)
                                            {previewData.data.filter(r => r.is_valid).length > 0 && (
                                                <span className="badge badge-light-success ms-2">
                                                    {previewData.data.filter(r => r.is_valid).length} Valid
                                                </span>
                                            )}
                                            {previewData.data.filter(r => !r.is_valid).length > 0 && (
                                                <span className="badge badge-light-danger ms-2">
                                                    {previewData.data.filter(r => !r.is_valid).length} Invalid
                                                </span>
                                            )}
                                        </h5>
                                        <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                                            <table className="table table-row-bordered table-row-gray-300 align-middle gs-0 gy-3">
                                                <thead className="sticky-top bg-light">
                                                    <tr className="fw-bold text-muted">
                                                        <th className="min-w-50px text-center">#</th>
                                                        <th className="min-w-80px text-center">Status</th>
                                                        {dataFields.map(field => (
                                                            <th key={field} className="min-w-150px">
                                                                {fieldLabels[field] || field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, ' ')}
                                                            </th>
                                                        ))}
                                                        <th className="min-w-200px">Errors</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {previewData.data.slice(0, 50).map((row, index) => (
                                                        <tr key={index} className={!row.is_valid ? 'table-danger' : ''}>
                                                            <td className="text-center fw-bold">{index + 1}</td>
                                                            <td className="text-center">
                                                                {row.is_valid ? (
                                                                    <span className="badge badge-light-success">
                                                                        <i className="ki-duotone ki-check fs-6">
                                                                            <span className="path1"></span>
                                                                            <span className="path2"></span>
                                                                        </i>
                                                                    </span>
                                                                ) : (
                                                                    <span className="badge badge-light-danger">
                                                                        <i className="ki-duotone ki-cross fs-6">
                                                                            <span className="path1"></span>
                                                                            <span className="path2"></span>
                                                                        </i>
                                                                    </span>
                                                                )}
                                                            </td>
                                                            {dataFields.map(field => (
                                                                <td key={field}>
                                                                    {row[field] !== null && row[field] !== undefined && row[field] !== '' ? (
                                                                        <span className="text-dark">{String(row[field])}</span>
                                                                    ) : (
                                                                        <span className="text-muted fst-italic">-</span>
                                                                    )}
                                                                </td>
                                                            ))}
                                                            <td>
                                                                {(row.errors || row.validation_errors) ? (
                                                                    <div className="text-danger small">
                                                                        {Array.isArray(row.errors || row.validation_errors) ? (
                                                                            <ul className="mb-0 ps-3">
                                                                                {(row.errors || row.validation_errors).map((err, errIndex) => (
                                                                                    <li key={errIndex}>{err}</li>
                                                                                ))}
                                                                            </ul>
                                                                        ) : (
                                                                            <span>{row.errors || row.validation_errors}</span>
                                                                        )}
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-muted">-</span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        {previewData.data.length > 50 && (
                                            <p className="text-muted text-center mt-3">
                                                Showing first 50 rows of {previewData.data.length} total rows
                                            </p>
                                        )}
                                    </div>
                                );
                            })()}
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
                                disabled={!previewData || loading || importing}
                            >
                                {importing ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2"></span>
                                        Importing...
                                    </>
                                ) : (
                                    <>
                                        <i className="ki-duotone ki-check fs-3 me-1">
                                            <span className="path1"></span>
                                            <span className="path2"></span>
                                        </i>
                                        Confirm Import
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

export default ImportInventoryModal;


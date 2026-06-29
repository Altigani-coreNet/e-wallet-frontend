import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ADMIN_ENDPOINTS } from '../../../utils/constants';
import { getToken } from '../../../utils/api';

const CustomerImportPreviewModal = ({ isOpen, onClose, previewData, onImportSuccess }) => {
    const [isImporting, setIsImporting] = useState(false);

    const handleConfirmImport = async () => {
        try {
            setIsImporting(true);
            
            const formData = new FormData();
            formData.append('import_file', previewData.file);
            formData.append('merchant_id', previewData.merchant_id);

            const token = getToken();
            const response = await axios.post(ADMIN_ENDPOINTS.CUSTOMER_IMPORT, formData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            const isSuccess = response.data.success || response.data.status;
            if (isSuccess) {
                const payload = response.data.data || response.data;
                const importedCount = payload.imported_count ?? response.data.imported_count ?? 0;
                const skippedCount = payload.skipped_count ?? response.data.skipped_count ?? 0;
                toast.success(`Successfully imported ${importedCount} customers. ${skippedCount} rows skipped.`);
                onImportSuccess();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to import customers');
            console.error(error);
        } finally {
            setIsImporting(false);
        }
    };

    if (!isOpen || !previewData) return null;

    const validRows = previewData.data?.filter(row => row.is_valid) || [];
    const invalidRows = previewData.data?.filter(row => !row.is_valid) || [];

    return (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
            <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">
                            <i className="ki-duotone ki-eye fs-2 me-2">
                                <span className="path1"></span>
                                <span className="path2"></span>
                                <span className="path3"></span>
                            </i>
                            Preview Import Data
                        </h5>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>

                    <div className="modal-body">
                        {/* Info Alert */}
                        <div className="alert alert-info d-flex align-items-center mb-5">
                            <i className="ki-duotone ki-information-5 fs-2hx text-info me-4">
                                <span className="path1"></span>
                                <span className="path2"></span>
                                <span className="path3"></span>
                            </i>
                            <div className="d-flex flex-column">
                                <h5 className="mb-1">Review Before Import</h5>
                                <span>Please review the data below. Rows with errors or duplicates will be highlighted and skipped during import.</span>
                            </div>
                        </div>

                        {/* Summary */}
                        <div className="row mb-4">
                            <div className="col-md-6">
                                <strong>Selected Merchant:</strong> 
                                <span className="text-primary ms-2">{previewData.merchant_name}</span>
                            </div>
                            <div className="col-md-6">
                                <strong>Total Rows:</strong> 
                                <span className="badge badge-primary ms-2">{previewData.data?.length || 0}</span>
                                <strong className="ms-3">Valid:</strong> 
                                <span className="badge badge-success ms-2">{validRows.length}</span>
                                <strong className="ms-3">Invalid:</strong> 
                                <span className="badge badge-danger ms-2">{invalidRows.length}</span>
                            </div>
                        </div>

                        {/* Preview Table */}
                        <div className="table-responsive">
                            <table className="table table-bordered table-striped table-hover table-sm">
                                <thead className="table-dark">
                                    <tr>
                                        <th>#</th>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Phone</th>
                                        <th>Address</th>
                                        <th>City</th>
                                        <th>Country</th>
                                        <th>Status</th>
                                        <th>Validation</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {previewData.data?.map((row, index) => (
                                        <tr key={index} className={!row.is_valid ? 'table-danger' : ''}>
                                            <td>{index + 1}</td>
                                            <td>{row.name || <span className="text-muted">-</span>}</td>
                                            <td>{row.email || <span className="text-muted">-</span>}</td>
                                            <td>{row.phone || <span className="text-muted">-</span>}</td>
                                            <td>{row.address || <span className="text-muted">-</span>}</td>
                                            <td>{row.city || <span className="text-muted">-</span>}</td>
                                            <td>{row.country_name || <span className="text-muted">-</span>}</td>
                                            <td>{row.status || 'active'}</td>
                                            <td>
                                                {row.is_valid ? (
                                                    <span className="badge badge-success">Valid</span>
                                                ) : (
                                                    <>
                                                        <span className="badge badge-danger">Invalid</span>
                                                        {row.errors && (
                                                            <div className="text-danger mt-1">
                                                                <small>{row.errors}</small>
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Errors List */}
                        {previewData.errors && previewData.errors.length > 0 && (
                            <div className="alert alert-warning mt-4">
                                <h5>
                                    <i className="ki-duotone ki-information fs-2 me-2">
                                        <span className="path1"></span>
                                        <span className="path2"></span>
                                        <span className="path3"></span>
                                    </i> 
                                    Issues Found:
                                </h5>
                                <ul className="mb-0">
                                    {previewData.errors.map((error, index) => (
                                        <li key={index}>{error}</li>
                                    ))}
                                </ul>
                                <p className="mb-0 mt-2">
                                    <strong>Note:</strong> Rows with issues will be skipped during import. Only valid rows will be imported.
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            <i className="ki-duotone ki-cross fs-2">
                                <span className="path1"></span>
                                <span className="path2"></span>
                            </i>
                            Cancel
                        </button>
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={handleConfirmImport}
                            disabled={isImporting || validRows.length === 0}
                        >
                            {isImporting ? (
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
                                    Confirm Import ({validRows.length} rows)
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomerImportPreviewModal;



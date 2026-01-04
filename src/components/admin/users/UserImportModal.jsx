import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ADMIN_ENDPOINTS } from '../../../utils/constants';
import { getToken } from '../../../utils/api';

const UserImportModal = ({ isOpen, onClose, onImportSuccess }) => {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [importing, setImporting] = useState(false);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            const fileExtension = selectedFile.name.split('.').pop().toLowerCase();
            if (!['xlsx', 'xls'].includes(fileExtension)) {
                toast.error('Please select an Excel file (.xlsx or .xls)');
                return;
            }
            setFile(selectedFile);
            setPreview(null);
        }
    };

    const handlePreview = async () => {
        if (!file) {
            toast.error('Please select a file first');
            return;
        }

        setUploading(true);
        try {
            const token = getToken();
            const formData = new FormData();
            formData.append('file', file);

            const response = await axios.post(
                ADMIN_ENDPOINTS.USER_IMPORT_PREVIEW,
                formData,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            if (response.data.success || response.data.status) {
                setPreview(response.data.data);
                if (response.data.data.invalid_rows > 0) {
                    toast.warning(`${response.data.data.invalid_rows} row(s) have validation errors`);
                } else {
                    toast.success('Preview generated successfully');
                }
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to preview file');
            console.error(error);
        } finally {
            setUploading(false);
        }
    };

    const handleImport = async () => {
        if (!file) {
            toast.error('Please select a file first');
            return;
        }

        if (!preview || !preview.summary.can_import) {
            toast.error('Please preview the file first to validate the data');
            return;
        }

        if (!window.confirm(`Are you sure you want to import ${preview.summary.valid_count} user(s)?`)) {
            return;
        }

        setImporting(true);
        try {
            const token = getToken();
            const formData = new FormData();
            formData.append('file', file);

            const response = await axios.post(
                ADMIN_ENDPOINTS.USER_IMPORT,
                formData,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            if (response.data.success || response.data.status) {
                toast.success(response.data.data?.message || 'Users imported successfully');
                handleClose();
                onImportSuccess();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to import users');
            console.error(error);
        } finally {
            setImporting(false);
        }
    };

    const handleDownloadTemplate = async () => {
        try {
            const token = getToken();
            const response = await axios.get(ADMIN_ENDPOINTS.USER_EXPORT_TEMPLATE, {
                headers: { 'Authorization': `Bearer ${token}` },
                responseType: 'blob' // Important for file download
            });

            // Create blob link to download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'users_import_template.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            
            toast.success('Template downloaded successfully');
        } catch (error) {
            toast.error('Failed to download template');
            console.error(error);
        }
    };

    const handleClose = () => {
        setFile(null);
        setPreview(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered modal-lg">
                <div className="modal-content">
                    <div className="modal-header">
                        <h2 className="modal-title">Import Users</h2>
                        <button
                            type="button"
                            className="btn btn-icon btn-sm btn-active-light-primary"
                            onClick={handleClose}
                        >
                            <i className="ki-duotone ki-cross fs-1">
                                <span className="path1"></span>
                                <span className="path2"></span>
                            </i>
                        </button>
                    </div>

                    <div className="modal-body">
                        {/* Download Template */}
                        <div className="alert alert-info d-flex align-items-center">
                            <i className="ki-duotone ki-information fs-2 me-3">
                                <span className="path1"></span>
                                <span className="path2"></span>
                                <span className="path3"></span>
                            </i>
                            <div className="flex-grow-1">
                                <strong>Need a template?</strong> Download the CSV template to see the required format.
                            </div>
                            <button
                                type="button"
                                className="btn btn-sm btn-light-primary"
                                onClick={handleDownloadTemplate}
                            >
                                <i className="ki-duotone ki-file-down fs-3 me-2">
                                    <span className="path1"></span>
                                    <span className="path2"></span>
                                </i>
                                Download Template
                            </button>
                        </div>

                        {/* File Upload */}
                        <div className="mb-7">
                            <label className="form-label fw-bold">Select Excel File</label>
                            <input
                                type="file"
                                className="form-control"
                                accept=".xlsx,.xls"
                                onChange={handleFileChange}
                            />
                            {file && (
                                <div className="form-text text-success">
                                    <i className="ki-duotone ki-check-circle fs-5 me-1">
                                        <span className="path1"></span>
                                        <span className="path2"></span>
                                    </i>
                                    Selected: {file.name}
                                </div>
                            )}
                            <div className="form-text text-muted mt-1">
                                Excel file (.xlsx or .xls) with Users, Merchants, and Branches sheets
                            </div>
                        </div>

                        {/* Preview Button */}
                        {file && !preview && (
                            <div className="mb-7">
                                <button
                                    type="button"
                                    className="btn btn-light-primary w-100"
                                    onClick={handlePreview}
                                    disabled={uploading}
                                >
                                    {uploading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2"></span>
                                            Previewing...
                                        </>
                                    ) : (
                                        <>
                                            <i className="ki-duotone ki-eye fs-2 me-2">
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

                        {/* Preview Results */}
                        {preview && (
                            <div className="mb-7">
                                {/* Summary Card */}
                                <div className={`alert ${preview.summary.can_import ? 'alert-success' : 'alert-warning'} d-flex align-items-center mb-5`}>
                                    <i className={`ki-duotone ${preview.summary.can_import ? 'ki-check-circle' : 'ki-information'} fs-2x me-3`}>
                                        <span className="path1"></span>
                                        <span className="path2"></span>
                                    </i>
                                    <div className="flex-grow-1">
                                        <strong>{preview.message || 'Preview ready'}</strong>
                                    </div>
                                </div>

                                {/* Statistics */}
                                <div className="card bg-light mb-5">
                                    <div className="card-body">
                                        <div className="row g-3">
                                            <div className="col-4">
                                                <div className="text-center">
                                                    <div className="fs-2x fw-bold text-primary">{preview.summary.total_rows}</div>
                                                    <div className="text-muted">Total Rows</div>
                                                </div>
                                            </div>
                                            <div className="col-4">
                                                <div className="text-center">
                                                    <div className="fs-2x fw-bold text-success">{preview.summary.valid_count}</div>
                                                    <div className="text-muted">Valid</div>
                                                </div>
                                            </div>
                                            <div className="col-4">
                                                <div className="text-center">
                                                    <div className="fs-2x fw-bold text-danger">{preview.summary.invalid_count}</div>
                                                    <div className="text-muted">Invalid</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Users Preview Table */}
                                {preview.users && preview.users.length > 0 && (
                                    <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                        <table className="table table-sm table-bordered">
                                            <thead className="table-light" style={{ position: 'sticky', top: 0 }}>
                                                <tr>
                                                    <th style={{ width: '50px' }}>Row</th>
                                                    <th style={{ width: '80px' }}>Status</th>
                                                    <th>Name</th>
                                                    <th>Email</th>
                                                    <th>Phone</th>
                                                    <th>Merchant</th>
                                                    <th>Branch</th>
                                                    <th>Errors</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {preview.users.map((user, index) => (
                                                    <tr key={index} className={user.is_valid ? '' : 'table-danger'}>
                                                        <td className="text-center">{user.row}</td>
                                                        <td className="text-center">
                                                            {user.is_valid ? (
                                                                <span className="badge badge-light-success">Valid</span>
                                                            ) : (
                                                                <span className="badge badge-light-danger">Invalid</span>
                                                            )}
                                                        </td>
                                                        <td>{user.name}</td>
                                                        <td>{user.email}</td>
                                                        <td>{user.phone}</td>
                                                        <td>{user.merchant}</td>
                                                        <td>{user.branch}</td>
                                                        <td>
                                                            {user.errors && user.errors.length > 0 ? (
                                                                <ul className="mb-0 ps-3">
                                                                    {user.errors.map((error, idx) => (
                                                                        <li key={idx} className="text-danger small">{error}</li>
                                                                    ))}
                                                                </ul>
                                                            ) : (
                                                                <span className="text-muted">-</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {preview.summary.invalid_count > 0 && (
                                    <div className="alert alert-info mt-3">
                                        <strong>Note:</strong> Rows with validation errors will be skipped during import. Only valid rows will be imported.
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
                        >
                            Cancel
                        </button>
                        {preview && (
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={handleImport}
                                disabled={importing || !preview.summary.can_import}
                            >
                                {importing ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2"></span>
                                        Importing...
                                    </>
                                ) : (
                                    <>
                                        <i className="ki-duotone ki-check fs-2 me-2">
                                            <span className="path1"></span>
                                            <span className="path2"></span>
                                        </i>
                                        Import {preview.summary.valid_count} User(s)
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserImportModal;


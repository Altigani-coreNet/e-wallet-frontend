import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ADMIN_ENDPOINTS, AUTH_ENDPOINTS } from '../../../utils/constants';
import { getToken } from '../../../utils/api';
import CustomerImportPreviewModal from './CustomerImportPreviewModal';

const CustomerImportModal = ({ isOpen, onClose, onImportSuccess }) => {
    const [merchants, setMerchants] = useState([]);
    const [selectedMerchant, setSelectedMerchant] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewData, setPreviewData] = useState(null);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMerchants, setLoadingMerchants] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchMerchants();
        }
    }, [isOpen]);

    const fetchMerchants = async () => {
        try {
            setLoadingMerchants(true);
            const token = getToken();
            const response = await axios.get(ADMIN_ENDPOINTS.MERCHANTS_SELECT, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.data.success || response.data.status) {
                const merchantData = response.data.data || [];
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
            const formData = new FormData();
            formData.append('import_file', selectedFile);
            formData.append('merchant_id', selectedMerchant);

            const token = getToken();
            const response = await axios.post(ADMIN_ENDPOINTS.CUSTOMER_IMPORT_PREVIEW, formData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            const isSuccess = response.data.success || response.data.status;
            if (isSuccess) {
                const merchantName = merchants.find(m => m.id === selectedMerchant)?.business_name || 'Unknown';
                setPreviewData({
                    ...response.data.data,
                    merchant_id: selectedMerchant,
                    merchant_name: merchantName,
                    file: selectedFile
                });
                setShowPreviewModal(true);
                toast.success('Preview generated successfully');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to preview import');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownloadTemplate = async () => {
        try {
            const token = getToken();
            const response = await axios.get(ADMIN_ENDPOINTS.CUSTOMER_EXPORT_TEMPLATE, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const isSuccess = response.data.success || response.data.status;
            if (isSuccess && response.data.data) {
                const { file_content, filename, mime_type } = response.data.data;
                
                // Decode base64 content
                const binaryString = atob(file_content);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                
                // Create blob and download
                const blob = new Blob([bytes], { type: mime_type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.setAttribute('download', filename || 'customers_import_template.xlsx');
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(link.href);
                
                toast.success('Template downloaded successfully with country dropdown!');
            }
        } catch (error) {
            toast.error('Failed to download template');
            console.error(error);
        }
    };

    const handleClose = () => {
        setSelectedMerchant('');
        setSelectedFile(null);
        setPreviewData(null);
        setShowPreviewModal(false);
        onClose();
    };

    const handleImportSuccess = () => {
        handleClose();
        onImportSuccess();
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">
                                <i className="ki-duotone ki-file-up fs-2 me-2">
                                    <span className="path1"></span>
                                    <span className="path2"></span>
                                </i>
                                Import Customers
                            </h5>
                            <button type="button" className="btn-close" onClick={handleClose}></button>
                        </div>
                        
                        <form onSubmit={handlePreview}>
                            <div className="modal-body">
                                {/* Merchant Selection */}
                                <div className="mb-4">
                                    <label className="form-label fw-bold required">Select Merchant</label>
                                    <select
                                        className="form-select"
                                        value={selectedMerchant}
                                        onChange={(e) => setSelectedMerchant(e.target.value)}
                                        disabled={loadingMerchants}
                                        required
                                    >
                                        <option value="">Choose a merchant...</option>
                                        {merchants.map((merchant) => (
                                            <option key={merchant.id} value={merchant.id}>
                                                {merchant.business_name || merchant.name}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="form-text">All imported customers will be assigned to this merchant</div>
                                </div>

                                {/* File Upload */}
                                <div className="mb-4">
                                    <label className="form-label fw-bold required">Select File</label>
                                    <input
                                        type="file"
                                        className="form-control"
                                        accept=".xlsx,.xls,.csv"
                                        onChange={handleFileSelect}
                                        required
                                    />
                                    <div className="form-text">Supported formats: .xlsx, .xls, .csv (Max: 10MB)</div>
                                </div>

                                {/* Info Alert */}
                                <div className="alert alert-info d-flex align-items-center">
                                    <i className="ki-duotone ki-information-5 fs-2hx text-info me-4">
                                        <span className="path1"></span>
                                        <span className="path2"></span>
                                        <span className="path3"></span>
                                    </i>
                                    <div className="d-flex flex-column">
                                        <h5 className="mb-1">Import Instructions</h5>
                                        <span>All customers will be assigned to the selected merchant. Duplicate emails will be skipped.</span>
                                    </div>
                                </div>

                                {/* Download Template */}
                                <div>
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-outline-primary"
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

                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={handleClose}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={isLoading}>
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
                                            Preview Data
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {/* Preview Modal */}
            {showPreviewModal && previewData && (
                <CustomerImportPreviewModal
                    isOpen={showPreviewModal}
                    onClose={() => setShowPreviewModal(false)}
                    previewData={previewData}
                    onImportSuccess={handleImportSuccess}
                />
            )}
        </>
    );
};

export default CustomerImportModal;



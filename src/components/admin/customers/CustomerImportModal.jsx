import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ADMIN_ENDPOINTS } from '../../../utils/constants';
import { getToken } from '../../../utils/api';
import { downloadAdminCustomersTemplate } from '../../../services/adminCustomersService';
import CustomerImportPreviewModal from './CustomerImportPreviewModal';

const normalizeMerchants = (payload) => {
    const raw = payload?.data ?? payload ?? [];
    if (!Array.isArray(raw)) {
        return [];
    }

    return raw.map((merchant) => ({
        id: String(merchant.id),
        label: merchant.text || merchant.business_name || merchant.name || `Merchant #${merchant.id}`,
        business_name: merchant.business_name,
        name: merchant.name,
    }));
};

const CustomerImportModal = ({ isOpen, onClose, onImportSuccess }) => {
    const { t } = useTranslation();
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
                headers: { Authorization: `Bearer ${token}` },
                params: { include_inactive: 1 },
            });

            if (response.data?.success || response.data?.status) {
                setMerchants(normalizeMerchants(response.data));
            } else {
                setMerchants([]);
            }
        } catch (error) {
            console.error('Failed to fetch merchants:', error);
            toast.error(t('admin.customerImport.merchantsLoadFailed', 'Failed to load merchants'));
        } finally {
            setLoadingMerchants(false);
        }
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const allowedTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel',
            'text/csv',
        ];

        if (!allowedTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls|csv)$/i)) {
            toast.error(t('admin.customerImport.invalidFileType', 'Please select a valid Excel or CSV file'));
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            toast.error(t('admin.customerImport.fileTooLarge', 'File size must be less than 10MB'));
            return;
        }

        setSelectedFile(file);
    };

    const handlePreview = async (e) => {
        e.preventDefault();

        if (!selectedMerchant) {
            toast.error(t('admin.customerImport.selectMerchant', 'Please select a merchant'));
            return;
        }

        if (!selectedFile) {
            toast.error(t('admin.customerImport.selectFile', 'Please select a file'));
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
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data',
                },
            });

            const isSuccess = response.data?.success || response.data?.status;
            if (isSuccess) {
                const merchantName = merchants.find((m) => m.id === selectedMerchant)?.label || 'Unknown';
                setPreviewData({
                    data: response.data.data || [],
                    errors: response.data.errors || [],
                    merchant_id: selectedMerchant,
                    merchant_name: merchantName,
                    file: selectedFile,
                });
                setShowPreviewModal(true);
                toast.success(t('admin.customerImport.previewSuccess', 'Preview generated successfully'));
            }
        } catch (error) {
            toast.error(error.response?.data?.message || t('admin.customerImport.previewFailed', 'Failed to preview import'));
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownloadTemplate = async () => {
        try {
            const blob = await downloadAdminCustomersTemplate();
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.setAttribute('download', 'customers_import_template.csv');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);
            toast.success(t('admin.customerImport.templateSuccess', 'Template downloaded successfully'));
        } catch (error) {
            toast.error(t('admin.customerImport.templateFailed', 'Failed to download template'));
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
                                {t('customers.importCustomersTitle', 'Import Customers')}
                            </h5>
                            <button type="button" className="btn-close" onClick={handleClose}></button>
                        </div>

                        <form onSubmit={handlePreview}>
                            <div className="modal-body">
                                <div className="mb-4">
                                    <label className="form-label fw-bold required">
                                        {t('admin.customerImport.selectMerchantLabel', 'Select Merchant')}
                                    </label>
                                    <select
                                        className="form-select"
                                        value={selectedMerchant}
                                        onChange={(e) => setSelectedMerchant(e.target.value)}
                                        disabled={loadingMerchants}
                                        required
                                    >
                                        <option value="">
                                            {loadingMerchants
                                                ? t('common.loading', 'Loading...')
                                                : t('admin.customerImport.chooseMerchant', 'Choose a merchant...')}
                                        </option>
                                        {merchants.map((merchant) => (
                                            <option key={merchant.id} value={merchant.id}>
                                                {merchant.label}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="form-text">
                                        {t('admin.customerImport.merchantHint', 'All imported customers will be assigned to this merchant')}
                                    </div>
                                    {!loadingMerchants && merchants.length === 0 && (
                                        <div className="text-danger fs-7 mt-2">
                                            {t('admin.customerImport.noMerchants', 'No merchants available. Create or approve a merchant first.')}
                                        </div>
                                    )}
                                </div>

                                <div className="mb-4">
                                    <label className="form-label fw-bold required">
                                        {t('admin.customerImport.selectFileLabel', 'Select File')}
                                    </label>
                                    <input
                                        type="file"
                                        className="form-control"
                                        accept=".xlsx,.xls,.csv"
                                        onChange={handleFileSelect}
                                        required
                                    />
                                    <div className="form-text">
                                        {t('admin.customerImport.fileHint', 'Supported formats: .xlsx, .xls, .csv (Max: 10MB)')}
                                    </div>
                                </div>

                                <div className="alert alert-info d-flex align-items-center">
                                    <i className="ki-duotone ki-information-5 fs-2hx text-info me-4">
                                        <span className="path1"></span>
                                        <span className="path2"></span>
                                        <span className="path3"></span>
                                    </i>
                                    <div className="d-flex flex-column">
                                        <h5 className="mb-1">{t('common.importInstructions', 'Import Instructions')}</h5>
                                        <span>
                                            {t(
                                                'admin.customerImport.instructions',
                                                'Download the template, fill Name* and Email* columns, select a merchant, then preview before importing.'
                                            )}
                                        </span>
                                    </div>
                                </div>

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
                                        {t('common.downloadSampleTemplate', 'Download Template')}
                                    </button>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={handleClose}>
                                    {t('common.cancel', 'Cancel')}
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={isLoading || loadingMerchants || merchants.length === 0}
                                >
                                    {isLoading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2"></span>
                                            {t('admin.customerImport.loadingPreview', 'Loading Preview...')}
                                        </>
                                    ) : (
                                        <>
                                            <i className="ki-duotone ki-eye fs-2">
                                                <span className="path1"></span>
                                                <span className="path2"></span>
                                                <span className="path3"></span>
                                            </i>
                                            {t('admin.customerImport.previewData', 'Preview Data')}
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

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

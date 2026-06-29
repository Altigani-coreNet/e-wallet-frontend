import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { useChartOfAccountMutations } from '../../../services/adminAccountingService';

const ChartAccountImportModal = ({ open, onClose }) => {
    const { t } = useTranslation();
    const { importMutation } = useChartOfAccountMutations();
    const [file, setFile] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file) {
            toast.error(t('admin.accounting.import.selectFile'));
            return;
        }

        try {
            const result = await importMutation.mutateAsync(file);
            toast.success(
                t('admin.accounting.import.success', {
                    success: result.success_count || 0,
                    failed: result.failure_count || 0,
                })
            );
            setFile(null);
            onClose();
        } catch (err) {
            toast.error(err?.response?.data?.message || t('admin.accounting.import.failed'));
        }
    };

    if (!open) return null;

    return (
        <>
            <div className="modal fade show d-block" tabIndex="-1">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <form onSubmit={handleSubmit}>
                            <div className="modal-header">
                                <h5 className="modal-title">{t('admin.accounting.import.title')}</h5>
                                <button type="button" className="btn-close" onClick={onClose} />
                            </div>
                            <div className="modal-body">
                                <p className="text-muted fs-7">{t('admin.accounting.import.help')}</p>
                                <input
                                    type="file"
                                    className="form-control"
                                    accept=".xlsx,.xls"
                                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                                />
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-light" onClick={onClose}>
                                    {t('common.cancel')}
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={importMutation.isPending}>
                                    {t('admin.accounting.import.submit')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            <div className="modal-backdrop fade show" />
        </>
    );
};

export default ChartAccountImportModal;

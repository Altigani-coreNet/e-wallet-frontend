import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { importUsers } from '../../services/usersService';

export default function ImportPreviewModal({ show, onHide, previewData, file, onImportSuccess }) {
    const { t } = useTranslation();
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState(null);

    if (!previewData || !show) return null;

    const { summary, users } = previewData;
    const skippedCount = users.filter((u) => ['sample', 'instruction', 'empty'].includes(u.row_type)).length;

    const handleConfirmImport = async () => {
        if (!file) {
            toast.error(t('merchant.users.import.toastNoFile'));
            return;
        }

        try {
            setImporting(true);
            const response = await importUsers(file);

            if (response.success !== false) {
                setImportResult({
                    success: true,
                    message: response.message,
                    data: response.data,
                });

                toast.success(
                    t('merchant.users.importPreview.toastDone', {
                        imported: response.data.imported,
                        updated: response.data.updated,
                    })
                );

                if (onImportSuccess) {
                    onImportSuccess(response.data);
                }

                setTimeout(() => {
                    onHide();
                    setImportResult(null);
                }, 2000);
            } else {
                setImportResult({
                    success: false,
                    message: response.message || t('merchant.users.import.toastImportFailed'),
                });
                toast.error(t('merchant.users.import.toastImportFailed'));
            }
        } catch (error) {
            console.error('Import error:', error);
            setImportResult({
                success: false,
                message: error.response?.data?.message || t('merchant.users.import.toastImportFailed'),
                errors: error.response?.data?.errors || [],
            });
            toast.error(t('merchant.users.import.toastImportFailed'));
        } finally {
            setImporting(false);
        }
    };

    const confirmLabel =
        summary.valid_count === 1
            ? t('merchant.users.importPreview.confirmImport', { count: summary.valid_count })
            : t('merchant.users.importPreview.confirmImportPlural', { count: summary.valid_count });

    return (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">
                            <i className="ki-duotone ki-list-check fs-2 me-2">
                                <span className="path1"></span>
                                <span className="path2"></span>
                            </i>
                            {t('merchant.users.importPreview.title')}
                        </h5>
                        <button type="button" className="btn-close" onClick={onHide}></button>
                    </div>

                    <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                        <div
                            className={`alert ${summary.total_rows === 0 ? 'alert-info' : summary.can_import ? 'alert-success' : 'alert-warning'} mb-3`}
                        >
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    {t('merchant.users.importPreview.summary', {
                                        found: users.length,
                                        actual: summary.total_rows,
                                    })}
                                </div>
                                <div>
                                    <span className="badge bg-success me-2">
                                        {t('merchant.users.importPreview.valid', { count: summary.valid_count })}
                                    </span>
                                    {summary.invalid_count > 0 && (
                                        <span className="badge bg-danger me-2">
                                            {t('merchant.users.importPreview.invalid', { count: summary.invalid_count })}
                                        </span>
                                    )}
                                    {skippedCount > 0 && (
                                        <span className="badge bg-secondary">
                                            {t('merchant.users.importPreview.skipped', { count: skippedCount })}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <hr />
                            <div className="mt-2">
                                {summary.total_rows === 0 ? (
                                    <span className="text-info">{t('merchant.users.importPreview.noUsersInFile')}</span>
                                ) : summary.can_import ? (
                                    <span className="text-success">{t('merchant.users.importPreview.allValid', { count: summary.total_rows })}</span>
                                ) : (
                                    <span className="text-danger">
                                        {t('merchant.users.importPreview.someInvalid', {
                                            invalid: summary.invalid_count,
                                            total: summary.total_rows,
                                        })}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="alert alert-light mb-4 py-2">
                            <div className="d-flex flex-wrap justify-content-around align-items-center small gap-2">
                                <div>
                                    <span className="badge bg-success">✅</span>{' '}
                                    <span className="ms-1">{t('merchant.users.importPreview.legendValid')}</span>
                                </div>
                                <div>
                                    <span className="badge bg-danger">❌</span>{' '}
                                    <span className="ms-1">{t('merchant.users.importPreview.legendInvalid')}</span>
                                </div>
                                <div>
                                    <span className="badge bg-info">ℹ️</span>{' '}
                                    <span className="ms-1">{t('merchant.users.importPreview.legendInstruction')}</span>
                                </div>
                                <div>
                                    <span className="badge bg-warning">📝</span>{' '}
                                    <span className="ms-1">{t('merchant.users.importPreview.legendSample')}</span>
                                </div>
                                <div>
                                    <span className="badge bg-secondary">⊘</span>{' '}
                                    <span className="ms-1">{t('merchant.users.importPreview.legendEmpty')}</span>
                                </div>
                            </div>
                        </div>

                        {importResult && (
                            <div className={`alert ${importResult.success ? 'alert-success' : 'alert-danger'} mb-4`}>
                                <strong>{importResult.message}</strong>
                                {importResult.success && importResult.data && (
                                    <div className="mt-2">
                                        <div>
                                            {t('merchant.users.importPreview.resultImported', { count: importResult.data.imported })}
                                        </div>
                                        <div>
                                            {t('merchant.users.importPreview.resultUpdated', { count: importResult.data.updated })}
                                        </div>
                                        {importResult.data.failed > 0 && (
                                            <div className="text-danger">
                                                {t('merchant.users.importPreview.resultFailed', { count: importResult.data.failed })}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="table-responsive">
                            <table className="table table-striped table-bordered table-hover table-sm">
                                <thead className="table-dark">
                                    <tr>
                                        <th style={{ width: '50px' }}>{t('merchant.users.importPreview.colRow')}</th>
                                        <th>{t('merchant.users.importPreview.colName')}</th>
                                        <th>{t('merchant.users.importPreview.colEmail')}</th>
                                        <th>{t('merchant.users.importPreview.colPhone')}</th>
                                        <th>{t('merchant.users.importPreview.colBranch')}</th>
                                        <th>{t('merchant.users.importPreview.colRole')}</th>
                                        <th style={{ width: '120px', textAlign: 'center' }}>{t('merchant.users.importPreview.colIsValid')}</th>
                                        <th style={{ minWidth: '250px' }}>{t('merchant.users.importPreview.colErrors')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((user, index) => {
                                        let rowClass = '';

                                        if (user.row_type === 'instruction') {
                                            rowClass = 'table-info';
                                        } else if (user.row_type === 'sample') {
                                            rowClass = 'table-warning';
                                        } else if (user.row_type === 'empty') {
                                            rowClass = 'table-secondary';
                                        } else if (!user.is_valid) {
                                            rowClass = 'table-danger';
                                        }

                                        return (
                                            <tr key={index} className={rowClass}>
                                                <td className="text-center fw-bold">{user.row_number || user.row}</td>
                                                <td>
                                                    {user.name || (
                                                        <span className="text-muted fst-italic">{t('merchant.users.importPreview.cellEmpty')}</span>
                                                    )}
                                                </td>
                                                <td>
                                                    {user.email || (
                                                        <span className="text-muted fst-italic">{t('merchant.users.importPreview.cellEmpty')}</span>
                                                    )}
                                                </td>
                                                <td>
                                                    {user.phone || (
                                                        <span className="text-muted fst-italic">{t('merchant.users.importPreview.cellEmpty')}</span>
                                                    )}
                                                </td>
                                                <td className="small">{user.branch || user.branch_name || '-'}</td>
                                                <td className="small">{user.role || user.role_name || '-'}</td>

                                                <td className="text-center">
                                                    {user.is_valid && user.will_be_imported ? (
                                                        <div>
                                                            <span className="badge bg-success" style={{ fontSize: '16px' }}>
                                                                ✓
                                                            </span>
                                                            <div className="small text-success mt-1">{t('merchant.users.importPreview.statusValid')}</div>
                                                        </div>
                                                    ) : user.row_type === 'user' && !user.is_valid ? (
                                                        <div>
                                                            <span className="badge bg-danger" style={{ fontSize: '16px' }}>
                                                                ✕
                                                            </span>
                                                            <div className="small text-danger mt-1">{t('merchant.users.importPreview.statusInvalid')}</div>
                                                        </div>
                                                    ) : (
                                                        <div>
                                                            <span className="badge bg-secondary" style={{ fontSize: '16px' }}>
                                                                ⊘
                                                            </span>
                                                            <div className="small text-muted mt-1">{t('merchant.users.importPreview.statusSkip')}</div>
                                                        </div>
                                                    )}
                                                </td>

                                                <td>
                                                    {user.is_valid && user.will_be_imported ? (
                                                        <div className="text-success small">
                                                            <strong>{t('merchant.users.importPreview.readyToImport')}</strong>
                                                            <div className="text-muted mt-1">{t('merchant.users.importPreview.noErrors')}</div>
                                                        </div>
                                                    ) : (user.validation_errors && user.validation_errors.length > 0) ||
                                                      (user.errors && user.errors.length > 0) ? (
                                                        <div className="small">
                                                            {(user.validation_errors || user.errors).map((error, idx) => (
                                                                <div
                                                                    key={idx}
                                                                    className="mb-2 p-2 rounded"
                                                                    style={{
                                                                        backgroundColor: user.row_type === 'user' ? '#f8d7da' : '#e2e3e5',
                                                                        border: `1px solid ${user.row_type === 'user' ? '#f5c2c7' : '#d3d3d4'}`,
                                                                        color: user.row_type === 'user' ? '#842029' : '#6c757d',
                                                                    }}
                                                                >
                                                                    <strong>{user.row_type === 'user' ? '❌' : '⚠️'}</strong> {error}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted small fst-italic">
                                                            {t('merchant.users.importPreview.noValidationData')}
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="modal-footer">
                        <div className="d-flex justify-content-between w-100 align-items-center">
                            <div>
                                {summary.total_rows === 0 ? (
                                    <span className="text-info small">{t('merchant.users.importPreview.footerNoUsers')}</span>
                                ) : !summary.can_import ? (
                                    <span className="text-danger small">
                                        {t('merchant.users.importPreview.footerFix', { count: summary.invalid_count })}
                                    </span>
                                ) : null}
                            </div>
                            <div>
                                <button className="btn btn-secondary me-2" onClick={onHide} disabled={importing}>
                                    {summary.total_rows === 0
                                        ? t('merchant.users.importPreview.close')
                                        : t('merchant.users.importPreview.cancel')}
                                </button>
                                <button
                                    className={`btn ${summary.can_import && summary.total_rows > 0 ? 'btn-success' : 'btn-secondary'}`}
                                    onClick={handleConfirmImport}
                                    disabled={!summary.can_import || importing || summary.total_rows === 0}
                                >
                                    {importing ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2"></span>
                                            {t('merchant.users.importPreview.importing')}
                                        </>
                                    ) : summary.total_rows === 0 ? (
                                        <>⊘ {t('merchant.users.importPreview.noUsersToImport')}</>
                                    ) : (
                                        <>✅ {confirmLabel}</>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

import React from 'react';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import { useTranslation } from 'react-i18next';
import { useCan } from '../../../utils/permissions';

const TerminalTableRow = ({ 
    terminal, 
    merchantsMap = {},
    branchesMap = {},
    countriesMap = {},
    rowNumber, 
    isSelected, 
    onSelect, 
    onDelete 
}) => {
    const { t } = useTranslation();
    const canEditTerminal = useCan('pos.terminals.edit_terminals');
    const canDeleteTerminal = useCan('pos.terminals.delete_terminals');

    const handleCheckboxChange = (e) => {
        onSelect(terminal.id, e.target.checked);
    };

    const getStatusBadge = (status) => {
        const isActive = status === 'active' || status === 1 || status === '1' || status === true;
        const statusText = isActive ? t('admin.common.active') : t('admin.common.inactive');
        const statusClass = isActive ? 'badge-light-success' : 'badge-light-warning';
        
        return (
            <span className={`badge ${statusClass}`}>
                {statusText}
            </span>
        );
    };

    const getTerminalStatusBadge = (terminalStatus) => {
        const statusMap = {
            'online': { text: t('admin.common.online'), class: 'badge-light-success' },
            'offline': { text: t('admin.common.offline'), class: 'badge-light-danger' },
            'testing': { text: t('admin.common.testing'), class: 'badge-light-warning' },
            'maintenance': { text: t('admin.common.maintenance'), class: 'badge-light-info' }
        };
        
        const status = statusMap[terminalStatus] || { text: t('admin.common.unknown'), class: 'badge-light-secondary' };
        
        return (
            <span className={`badge ${status.class}`}>
                {status.text}
            </span>
        );
    };

    const getAddTypeBadge = (addType) => {
        const isAuto = addType === 'auto';
        const text = isAuto ? t('admin.common.auto') : t('admin.common.static');
        const badgeClass = isAuto ? 'badge-light-success' : 'badge-light-warning';
        
        return (
            <span className={`badge ${badgeClass}`}>
                {text}
            </span>
        );
    };

    const handleDelete = () => {
        Swal.fire({
            title: t('admin.common.areYouSure'),
            text: t('admin.terminalsIndex.deleteConfirmText', { name: terminal.name }),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: t('admin.terminalsIndex.yesDelete'),
            cancelButtonText: t('admin.common.cancel')
        }).then((result) => {
            if (result.isConfirmed) {
                onDelete(terminal.id);
            }
        });
    };

    return (
        <tr>
            {/* Checkbox */}
            <td>
                <div className="form-check form-check-sm form-check-custom form-check-solid">
                    <input
                        className="form-check-input"
                        type="checkbox"
                        checked={isSelected}
                        onChange={handleCheckboxChange}
                    />
                </div>
            </td>

            {/* ID */}
            <td>
                <span className="text-gray-800 fw-bold">{rowNumber}</span>
            </td>

            {/* Terminal Info */}
            <td>
                <div className="d-flex flex-column">
                    <Link 
                        to={`/admin/terminals/${terminal.id}`} 
                        className="text-gray-800 text-hover-primary fw-bold mb-1"
                    >
                        {terminal.name}
                    </Link>
                    <span className="text-muted fs-7">{t('admin.terminalsIndex.colTerminalId')}: {terminal.terminal_id}</span>
                    {terminal.model && (
                        <span className="text-muted fs-7">{t('admin.terminalsIndex.colModel')}: {terminal.model}</span>
                    )}
                </div>
            </td>

            {/* Merchant */}
            <td>
                <span className="text-gray-800">
                    {terminal.merchant?.business_name ||
                        terminal.merchant?.name ||
                        terminal.merchant_name ||
                        merchantsMap[terminal.merchant_id] ||
                        terminal.merchant_id ||
                        t('admin.common.na')}
                </span>
            </td>

            {/* Branch */}
            <td>
                <span className="text-gray-800">
                    {terminal.branch?.name ||
                        terminal.branch_name ||
                        branchesMap[terminal.branch_id] ||
                        terminal.branch_id ||
                        t('admin.common.na')}
                </span>
            </td>

            {/* Manufacturer */}
            <td>
                <span className="text-gray-800">
                    {terminal.manufacturer || t('admin.common.na')}
                </span>
            </td>

            {/* Brand */}
            <td>
                <span className="text-gray-800">
                    {terminal.brand || t('admin.common.na')}
                </span>
            </td>

            {/* SDK Info */}
            <td>
                {terminal.sdk_id || terminal.sdk_version ? (
                    <div className="d-flex flex-column">
                        {terminal.sdk_id && (
                            <span className="text-gray-800 fs-7">{t('admin.terminalsIndex.colSdkId')}: {terminal.sdk_id}</span>
                        )}
                        {terminal.sdk_version && (
                            <span className="text-muted fs-7">{t('admin.terminalsIndex.colSdkVersion')}: {terminal.sdk_version}</span>
                        )}
                    </div>
                ) : (
                    <span className="text-muted">{t('admin.common.na')}</span>
                )}
            </td>

            {/* Add Type */}
            <td>
                {getAddTypeBadge(terminal.add_type)}
            </td>

            {/* Status (is_active) */}
            <td>
                {getStatusBadge(terminal.is_active)}
            </td>

            {/* Terminal Status */}
            <td>
                {getTerminalStatusBadge(terminal.terminal_status)}
            </td>

            {/* Country */}
            <td>
                <span className="text-gray-800">
                    {(() => {
                        const country = terminal.country || terminal.merchant?.country;
                        if (!country) {
                            return countriesMap[terminal.country_id] || terminal.country_id || t('admin.common.na');
                        }
                        
                        // Handle multilingual name object
                        if (country.name && typeof country.name === 'object') {
                            return country.name[i18n.language] || country.name.en || country.name.ar || t('admin.common.na');
                        }
                        
                        return country.name || t('admin.common.na');
                    })()}
                </span>
            </td>

            {/* Created At */}
            <td>
                <span className="text-gray-800">
                    {terminal.created_at ? new Date(terminal.created_at).toLocaleDateString(i18n.language) : t('admin.common.na')}
                </span>
            </td>

            {/* Actions */}
            <td className="text-end">
                <div className="d-flex justify-content-end gap-2 flex-nowrap">
                    <Link
                        to={`/admin/terminals/${terminal.id}`}
                        className="btn btn-icon btn-sm btn-light-primary"
                        title={t('admin.common.view')}
                    >
                        <i className="ki-duotone ki-eye fs-6">
                            <span className="path1"></span>
                            <span className="path2"></span>
                            <span className="path3"></span>
                        </i>
                    </Link>

                    {canEditTerminal && (
                        <Link
                            to={`/admin/terminals/${terminal.id}/edit`}
                            className="btn btn-icon btn-sm btn-light-warning"
                            title={t('admin.common.edit')}
                        >
                            <i className="ki-duotone ki-pencil fs-6">
                                <span className="path1"></span>
                                <span className="path2"></span>
                            </i>
                        </Link>
                    )}

                    {canDeleteTerminal && (
                        <button
                            className="btn btn-icon btn-sm btn-light-danger"
                            onClick={handleDelete}
                            title={t('admin.common.delete')}
                        >
                            <i className="ki-duotone ki-trash fs-6">
                                <span className="path1"></span>
                                <span className="path2"></span>
                                <span className="path3"></span>
                                <span className="path4"></span>
                                <span className="path5"></span>
                            </i>
                        </button>
                    )}
                </div>
            </td>
        </tr>
    );
};

export default TerminalTableRow;


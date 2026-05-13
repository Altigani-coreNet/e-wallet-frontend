import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { deleteAdvertisement, changeAdvertisementStatus } from '../../../../services/adminAdvertisementsService';
import { useCan } from '../../../../utils/permissions';

const AdvertisementTableRow = ({ advertisement, isSelected, onSelect, onRefresh }) => {
    const { t } = useTranslation();
    const canEditAdvertisement = useCan('pos.advertisements.edit_advertisements');
    const canDeleteAdvertisement = useCan('pos.advertisements.delete_advertisements');
    const [showActions, setShowActions] = useState(false);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
    const buttonRef = useRef(null);

    useEffect(() => {
        if (showActions && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setDropdownPosition({ top: rect.bottom + window.scrollY, right: window.innerWidth - rect.right + window.scrollX });
        }
    }, [showActions]);

    const handleDelete = async () => {
        if (!window.confirm(t('admin.settings.advertisements.deleteConfirmRow'))) return;
        const response = await deleteAdvertisement(advertisement.id);
        if (response.success) {
            toast.success(t('admin.settings.advertisements.deletedToast'));
            onRefresh();
        } else {
            toast.error(response.error || t('admin.settings.advertisements.deleteFailed'));
        }
    };

    const handleStatusChange = async () => {
        const response = await changeAdvertisementStatus(advertisement.id);
        if (response.success) {
            toast.success(t('admin.settings.advertisements.statusChanged'));
            onRefresh();
        } else {
            toast.error(response.error || t('admin.settings.advertisements.statusChangeFailed'));
        }
    };

    const statusActive = advertisement.status === 'active';

    return (
        <tr>
            <td><div className="form-check form-check-sm form-check-custom form-check-solid">
                <input className="form-check-input" type="checkbox" checked={isSelected} onChange={() => onSelect(advertisement.id)} />
            </div></td>
            <td>
                {advertisement.image ? (
                    <div className="symbol symbol-50px">
                        <img src={advertisement.image} alt={advertisement.name} />
                    </div>
                ) : (
                    <span className="text-muted">{t('admin.settings.advertisements.noImage')}</span>
                )}
            </td>
            <td><Link to={`/admin/system/advertisements/${advertisement.id}`} className="text-gray-800 text-hover-primary fw-bold">{advertisement.name}</Link></td>
            <td>{advertisement.country_name || t('admin.common.na')}</td>
            <td>
                <div className="text-gray-600 fs-7">
                    <div><span className="text-muted">{t('admin.settings.advertisements.dateFrom')}</span> {advertisement.start_date || t('admin.common.na')}</div>
                    <div><span className="text-muted">{t('admin.settings.advertisements.dateTo')}</span> {advertisement.end_date || t('admin.common.na')}</div>
                </div>
            </td>
            <td>
                <button type="button" onClick={handleStatusChange} className={`badge badge-light-${statusActive ? 'success' : 'danger'} cursor-pointer border-0`}>
                    {statusActive ? t('admin.common.active') : t('admin.common.inactive')}
                </button>
            </td>
            <td className="text-end">
                <div className="dropdown">
                    <button ref={buttonRef} className="btn btn-sm btn-light btn-active-light-primary" type="button" onClick={() => setShowActions(!showActions)} onBlur={() => setTimeout(() => setShowActions(false), 200)}>
                        {t('admin.systemRoles.actionsMenu')} <i className="ki-duotone ki-down fs-5 ms-1"></i>
                    </button>
                    {showActions && (
                        <div className="dropdown-menu dropdown-menu-end show" style={{ position: 'fixed', top: `${dropdownPosition.top}px`, right: `${dropdownPosition.right}px`, left: 'auto', zIndex: 1050 }}>
                            <Link to={`/admin/system/advertisements/${advertisement.id}`} className="dropdown-item" onMouseDown={(e) => e.preventDefault()}>
                                <i className="ki-duotone ki-eye fs-5 me-2"><span className="path1"></span><span className="path2"></span><span className="path3"></span></i>
                                {t('admin.common.view')}
                            </Link>
                            {canEditAdvertisement && (
                                <Link to={`/admin/system/advertisements/${advertisement.id}/edit`} className="dropdown-item" onMouseDown={(e) => e.preventDefault()}>
                                    <i className="ki-duotone ki-pencil fs-5 me-2"><span className="path1"></span><span className="path2"></span></i>
                                    {t('admin.common.edit')}
                                </Link>
                            )}
                            <button type="button" onMouseDown={(e) => { e.preventDefault(); handleStatusChange(); }} className="dropdown-item">
                                <i className="ki-duotone ki-toggle-on fs-5 me-2"><span className="path1"></span><span className="path2"></span></i>
                                {t('admin.settings.advertisements.toggleStatus')}
                            </button>
                            {canDeleteAdvertisement && (
                                <>
                                    <div className="dropdown-divider"></div>
                                    <button type="button" onMouseDown={(e) => { e.preventDefault(); handleDelete(); }} className="dropdown-item text-danger">
                                        <i className="ki-duotone ki-trash fs-5 me-2"><span className="path1"></span><span className="path2"></span><span className="path3"></span><span className="path4"></span><span className="path5"></span></i>
                                        {t('admin.common.delete')}
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </td>
        </tr>
    );
};

export default AdvertisementTableRow;

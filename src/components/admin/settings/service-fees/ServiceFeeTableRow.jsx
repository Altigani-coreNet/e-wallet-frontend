import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { deleteServiceFee } from '../../../../services/adminServiceFeesService';
import { toast } from 'react-toastify';
import { translateServiceFeeType } from '../../../../utils/serviceFeeTypeLabel';

const ServiceFeeTableRow = ({ serviceFee, isSelected, onSelect, onRefresh }) => {
    const { t, i18n } = useTranslation();

    const handleDelete = async () => {
        if (!window.confirm(t('admin.settings.serviceFees.deleteConfirm'))) return;
        
        const response = await deleteServiceFee(serviceFee.id);
        if (response.success) {
            toast.success(t('admin.settings.serviceFees.deleted'));
            onRefresh();
        } else {
            toast.error(response.error || t('admin.settings.serviceFees.deleteFailed'));
        }
    };

    const typeLabel = translateServiceFeeType(t, serviceFee.type);

    return (
        <tr>
            <td>
                <div className="form-check form-check-sm form-check-custom form-check-solid">
                    <input 
                        className="form-check-input" 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={() => onSelect(serviceFee.id)}
                    />
                </div>
            </td>
            <td>{serviceFee.id}</td>
            <td className="fw-bold">{serviceFee.name}</td>
            <td><span className="badge badge-light-primary" dir="auto">{typeLabel}</span></td>
            <td>{Number(serviceFee.fees).toFixed(2)}</td>
            <td>{new Date(serviceFee.created_at).toLocaleDateString(i18n.language, { month: 'short', day: '2-digit', year: 'numeric' })}</td>
            <td className="text-end">
                <div className="d-flex justify-content-end flex-shrink-0">
                    <Link 
                        to={`/admin/settings/service-fees/${serviceFee.id}`}
                        className="btn btn-icon btn-bg-light btn-active-color-primary btn-sm me-1"
                        data-bs-toggle="tooltip"
                        title={t('admin.common.view')}
                    >
                        <i className="ki-duotone ki-eye fs-3">
                            <span className="path1"></span>
                            <span className="path2"></span>
                            <span className="path3"></span>
                        </i>
                    </Link>
                    <Link 
                        to={`/admin/settings/service-fees/${serviceFee.id}/edit`}
                        className="btn btn-icon btn-bg-light btn-active-color-primary btn-sm me-1"
                        data-bs-toggle="tooltip"
                        title={t('admin.common.edit')}
                    >
                        <i className="ki-duotone ki-pencil fs-3">
                            <span className="path1"></span>
                            <span className="path2"></span>
                        </i>
                    </Link>
                    <button 
                        type="button"
                        onClick={handleDelete}
                        className="btn btn-icon btn-bg-light btn-active-color-danger btn-sm"
                        data-bs-toggle="tooltip"
                        title={t('admin.common.delete')}
                    >
                        <i className="ki-duotone ki-trash fs-3">
                            <span className="path1"></span>
                            <span className="path2"></span>
                            <span className="path3"></span>
                            <span className="path4"></span>
                            <span className="path5"></span>
                        </i>
                    </button>
                </div>
            </td>
        </tr>
    );
};

export default ServiceFeeTableRow;

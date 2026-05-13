import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { deleteCurrency } from '../../../../services/adminCurrenciesService';
import { toast } from 'react-toastify';
import { useCan } from '../../../../utils/permissions';

const CurrencyTableRow = ({ currency, currencyCodeTranslations, symbolTranslations, isSelected, onSelect, onRefresh }) => {
    const { t, i18n } = useTranslation();
    const canEditCurrency = useCan('pos.currencies.edit_currencies');
    const canDeleteCurrency = useCan('pos.currencies.delete_currencies');

    const handleDelete = async () => {
        if (!window.confirm(t('admin.settings.currencies.deleteConfirm'))) return;

        const response = await deleteCurrency(currency.id);
        if (response.success) {
            toast.success(t('admin.settings.currencies.deleted'));
            onRefresh();
        } else {
            toast.error(response.error || t('admin.settings.currencies.deleteFailed'));
        }
    };

    return (
        <tr>
            <td>
                <div className="form-check form-check-sm form-check-custom form-check-solid">
                    <input
                        className="form-check-input"
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onSelect(currency.id)}
                    />
                </div>
            </td>
            <td>{currency.id}</td>
            <td className="fw-bold">{currency.country}</td>
            <td>{currency.name}</td>
            <td>{symbolTranslations?.en || '-'}</td>
            <td>{symbolTranslations?.ar || '-'}</td>
            <td><span className="badge badge-light-info">{currencyCodeTranslations?.en || '-'}</span></td>
            <td><span className="badge badge-light-primary">{currencyCodeTranslations?.ar || '-'}</span></td>
            <td>{new Date(currency.created_at).toLocaleDateString(i18n.language, { month: 'short', day: '2-digit', year: 'numeric' })}</td>
            <td className="text-end">
                <div className="d-flex justify-content-end flex-shrink-0">
                    <Link
                        to={`/admin/settings/currencies/${currency.id}`}
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
                    {canEditCurrency && (
                        <Link
                            to={`/admin/settings/currencies/${currency.id}/edit`}
                            className="btn btn-icon btn-bg-light btn-active-color-primary btn-sm me-1"
                            data-bs-toggle="tooltip"
                            title={t('admin.common.edit')}
                        >
                            <i className="ki-duotone ki-pencil fs-3">
                                <span className="path1"></span>
                                <span className="path2"></span>
                            </i>
                        </Link>
                    )}
                    {canDeleteCurrency && (
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
                    )}
                </div>
            </td>
        </tr>
    );
};

export default CurrencyTableRow;

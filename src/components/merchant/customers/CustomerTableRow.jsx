import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Swal from 'sweetalert2';
import { formatDateShort } from '../../../utils/dateUtils';

const CustomerTableRow = ({ customer, isSelected, onSelectChange, onDelete, basePath = '/merchant' }) => {
    const { t, i18n } = useTranslation();

    const locale = i18n.language?.startsWith('ar') ? 'ar-SA' : 'en-US';

    const handleCheckboxChange = (e) => {
        onSelectChange(customer.id, e.target.checked);
    };

    const handleDelete = async () => {
        const result = await Swal.fire({
            title: t('common.areYouSure'),
            text: t('customers.confirmDeleteCustomer', { name: customer.name }),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: t('common.yesDeleteIt'),
            cancelButtonText: t('common.cancel')
        });

        if (result.isConfirmed) {
            await onDelete(customer.id);
        }
    };

    const getInitial = (name) => {
        return name ? name.charAt(0).toUpperCase() : '?';
    };

    const formatRowDate = (dateString) => {
        if (!dateString) return t('customers.na');
        return formatDateShort(dateString, locale);
    };

    return (
        <tr>
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

            <td>
                <div className="d-flex align-items-center">
                    <div className="symbol symbol-circle symbol-40px overflow-hidden me-3">
                        <div className="symbol-label fs-3 bg-light-primary text-primary">
                            {getInitial(customer.name)}
                        </div>
                    </div>
                    <div className="d-flex flex-column">
                        <Link 
                            to={`${basePath}/customers/${customer.id}`}
                            className="text-gray-800 text-hover-primary mb-1 fw-bold"
                        >
                            {customer.name}
                        </Link>
                        <span className="text-muted fs-7">{t('customers.idLabel', { id: customer.id })}</span>
                    </div>
                </div>
            </td>

            <td>
                <span className="text-gray-800 fw-normal">{customer.email || t('customers.na')}</span>
            </td>

            <td>
                <span className="text-gray-800 fw-normal">
                    {customer.phone || customer.phone_number || t('customers.na')}
                </span>
            </td>

            <td>
                <span className="text-gray-800 fw-normal">{customer.company_name || t('customers.na')}</span>
            </td>

            <td>
                {customer.customer_group ? (
                    <span className="badge badge-light-info">
                        {customer.customer_group.name}
                    </span>
                ) : (
                    <span className="badge badge-light-secondary">{t('customers.noGroup')}</span>
                )}
            </td>

            <td>
                <span className="text-gray-600 fw-normal">{formatRowDate(customer.created_at)}</span>
            </td>

            <td className="text-end">
                <div className="d-flex justify-content-end flex-shrink-0">
                    <Link
                        to={`${basePath}/customers/${customer.id}`}
                        className="btn btn-icon btn-bg-light btn-active-color-primary btn-sm me-1"
                        title={t('customers.view')}
                    >
                        <i className="ki-duotone ki-eye fs-3">
                            <span className="path1"></span>
                            <span className="path2"></span>
                            <span className="path3"></span>
                        </i>
                    </Link>
                    <Link
                        to={`${basePath}/customers/${customer.id}/edit`}
                        className="btn btn-icon btn-bg-light btn-active-color-primary btn-sm me-1"
                        title={t('common.edit')}
                    >
                        <i className="ki-duotone ki-pencil fs-3">
                            <span className="path1"></span>
                            <span className="path2"></span>
                        </i>
                    </Link>
                    <button
                        className="btn btn-icon btn-bg-light btn-active-color-danger btn-sm"
                        onClick={handleDelete}
                        title={t('customers.delete')}
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

export default CustomerTableRow;

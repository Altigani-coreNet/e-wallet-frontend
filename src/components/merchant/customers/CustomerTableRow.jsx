import React, { useState, useRef, useLayoutEffect, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Swal from 'sweetalert2';
import { formatDateShort } from '../../../utils/dateUtils';

const CustomerTableRow = ({ customer, isSelected, onSelectChange, onDelete, basePath = '/merchant' }) => {
    const { t, i18n } = useTranslation();
    const [showActions, setShowActions] = useState(false);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
    const buttonRef = useRef(null);

    const locale = i18n.language?.startsWith('ar') ? 'ar-SA' : 'en-US';

    const updateDropdownPosition = () => {
        if (!buttonRef.current) return;
        const rect = buttonRef.current.getBoundingClientRect();
        setDropdownPosition({
            top: rect.bottom + 4,
            right: window.innerWidth - rect.right,
        });
    };

    useLayoutEffect(() => {
        if (showActions) {
            updateDropdownPosition();
        }
    }, [showActions]);

    useEffect(() => {
        if (!showActions) return undefined;

        const onReposition = () => updateDropdownPosition();
        window.addEventListener('resize', onReposition);
        window.addEventListener('scroll', onReposition, true);

        return () => {
            window.removeEventListener('resize', onReposition);
            window.removeEventListener('scroll', onReposition, true);
        };
    }, [showActions]);

    const handleCheckboxChange = (e) => {
        onSelectChange(customer.id, e.target.checked);
    };

    const handleDelete = async () => {
        setShowActions(false);

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

    const actionsMenu = showActions ? createPortal(
        <>
            <div
                className="position-fixed top-0 start-0 w-100 h-100"
                style={{ zIndex: 1055 }}
                onClick={() => setShowActions(false)}
            />
            <div
                className="menu menu-sub menu-sub-dropdown menu-column menu-rounded menu-gray-600 menu-state-bg-light-primary fw-semibold fs-7 w-175px py-4 show"
                style={{
                    position: 'fixed',
                    zIndex: 1060,
                    top: dropdownPosition.top,
                    right: dropdownPosition.right,
                    left: 'auto',
                    transform: 'none',
                    animation: 'none',
                }}
            >
                <div className="menu-item px-3">
                    <Link
                        to={`${basePath}/customers/${customer.id}`}
                        className="menu-link px-3"
                        onClick={() => setShowActions(false)}
                    >
                        <i className="ki-duotone ki-eye fs-4 me-2">
                            <span className="path1"></span>
                            <span className="path2"></span>
                            <span className="path3"></span>
                        </i>
                        {t('customers.view')}
                    </Link>
                </div>

                <div className="menu-item px-3">
                    <Link
                        to={`${basePath}/customers/${customer.id}/edit`}
                        className="menu-link px-3"
                        onClick={() => setShowActions(false)}
                    >
                        <i className="ki-duotone ki-pencil fs-4 me-2">
                            <span className="path1"></span>
                            <span className="path2"></span>
                        </i>
                        {t('common.edit')}
                    </Link>
                </div>

                <div className="menu-item px-3">
                    <button
                        type="button"
                        className="menu-link px-3 w-100 text-start text-danger"
                        onClick={handleDelete}
                    >
                        <i className="ki-duotone ki-trash fs-4 me-2">
                            <span className="path1"></span>
                            <span className="path2"></span>
                            <span className="path3"></span>
                            <span className="path4"></span>
                            <span className="path5"></span>
                        </i>
                        {t('customers.delete')}
                    </button>
                </div>
            </div>
        </>,
        document.body
    ) : null;

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
                <div className="position-relative">
                    <button
                        ref={buttonRef}
                        type="button"
                        className="btn btn-sm btn-light btn-active-light-primary"
                        onClick={() => setShowActions(!showActions)}
                    >
                        {t('common.actions')}
                        <i className="ki-duotone ki-down fs-5 ms-1"></i>
                    </button>
                </div>
                {actionsMenu}
            </td>
        </tr>
    );
};

export default CustomerTableRow;

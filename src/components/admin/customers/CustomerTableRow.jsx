import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCan } from '../../../utils/permissions';
import { getCustomerUuid, getCustomerCityName, getCustomerCountryName, getCustomerStatusBadgeClass, getCustomerStatusLabelKey } from '../../../utils/customerUtils';

const CustomerTableRow = ({
    customer,
    rowNumber,
    isSelected,
    onSelect,
    onDelete,
}) => {
    const { t } = useTranslation();
    const canEditCustomer = useCan(['sales.customers.edit_customers', 'edit_customers']);
    const canDeleteCustomer = useCan(['sales.customers.delete_customers', 'delete_customers']);
    const [showActions, setShowActions] = useState(false);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
    const buttonRef = useRef(null);

    const customerUuid = getCustomerUuid(customer);
    const customerStatus = customer.status || 'pending';

    const profileImage = customer.profile_image_url || customer.profile_image;
    const cityName = getCustomerCityName(customer);

    useEffect(() => {
        if (showActions && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setDropdownPosition({
                top: rect.bottom + window.scrollY,
                right: window.innerWidth - rect.right + window.scrollX,
            });
        }
    }, [showActions]);

    return (
        <tr>
            <td>
                <div className="form-check form-check-sm form-check-custom form-check-solid">
                    <input
                        className="form-check-input"
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => onSelect(customerUuid, e.target.checked)}
                    />
                </div>
            </td>

            <td>
                <span className="text-gray-800 fw-bold">{rowNumber}</span>
            </td>

            <td>
                <div className="d-flex align-items-center">
                    <div className="symbol symbol-50px symbol-circle me-3 overflow-hidden">
                        {profileImage ? (
                            <img src={profileImage} alt={customer.name} className="symbol-label object-fit-cover" />
                        ) : (
                            <div className="symbol-label fs-2 fw-semibold text-primary bg-light-primary">
                                {customer.name?.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>
                    <div className="d-flex flex-column">
                        <Link to={`/admin/customers/${customerUuid}`} className="text-gray-800 text-hover-primary fw-bold">
                            {customer.name}
                        </Link>
                        <span className="text-muted fw-semibold d-block fs-7">{customer.email}</span>
                    </div>
                </div>
            </td>

            <td>
                <span className="text-gray-600">{customer.phone || customer.phone_number || t('customers.na')}</span>
            </td>

            <td>
                <span className="text-gray-600">
                    {customer.address || cityName ? (
                        <>
                            {customer.address && <>{customer.address}</>}
                            {cityName && <span className="d-block text-muted fs-7">{cityName}</span>}
                        </>
                    ) : (
                        t('customers.na')
                    )}
                </span>
            </td>

            <td>
                <span className="text-gray-600">
                    {getCustomerCountryName(customer) || t('customers.na')}
                </span>
            </td>

            <td>
                <span className="text-gray-800 fw-semibold">
                    {customer.balance != null ? Number(customer.balance).toFixed(2) : '0.00'}
                </span>
            </td>

            <td>
                <span className={`badge ${getCustomerStatusBadgeClass(customerStatus)}`}>
                    {t(getCustomerStatusLabelKey(customerStatus))}
                </span>
            </td>

            <td>
                <span className="text-gray-600">
                    {customer.created_at ? new Date(customer.created_at).toLocaleDateString() : t('customers.na')}
                </span>
            </td>

            <td className="text-end">
                <div className="position-relative">
                    <button
                        ref={buttonRef}
                        className="btn btn-sm btn-light btn-active-light-primary"
                        onClick={() => setShowActions(!showActions)}
                    >
                        {t('common.actions')}
                        <i className="ki-duotone ki-down fs-5 ms-1"></i>
                    </button>

                    {showActions && (
                        <>
                            <div
                                className="position-fixed top-0 start-0 w-100 h-100"
                                style={{ zIndex: 99 }}
                                onClick={() => setShowActions(false)}
                            ></div>
                            <div
                                className="menu menu-sub menu-sub-dropdown menu-column menu-rounded menu-gray-600 menu-state-bg-light-primary fw-semibold fs-7 w-200px py-4 show"
                                style={{
                                    position: 'fixed',
                                    zIndex: 100,
                                    top: `${dropdownPosition.top}px`,
                                    right: `${dropdownPosition.right}px`,
                                }}
                            >
                                <div className="menu-item px-3">
                                    <Link
                                        to={`/admin/customers/${customerUuid}`}
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

                                {canEditCustomer && (
                                    <div className="menu-item px-3">
                                        <Link
                                            to={`/admin/customers/${customerUuid}/edit`}
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
                                )}

                                {canDeleteCustomer && (
                                    <>
                                        <div className="separator my-2"></div>
                                        <div className="menu-item px-3">
                                            <a
                                                href="#"
                                                className="menu-link px-3 text-danger"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    setShowActions(false);
                                                    onDelete(customerUuid);
                                                }}
                                            >
                                                <i className="ki-duotone ki-trash fs-4 me-2">
                                                    <span className="path1"></span>
                                                    <span className="path2"></span>
                                                    <span className="path3"></span>
                                                    <span className="path4"></span>
                                                    <span className="path5"></span>
                                                </i>
                                                {t('common.delete')}
                                            </a>
                                        </div>
                                    </>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </td>
        </tr>
    );
};

export default CustomerTableRow;

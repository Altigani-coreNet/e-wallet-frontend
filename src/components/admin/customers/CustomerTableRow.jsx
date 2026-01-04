import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCan } from '../../../utils/permissions';

const CustomerTableRow = ({
    customer,
    rowNumber,
    isSelected,
    onSelect,
    onToggleStatus,
    onDelete,
    merchantInfo,
    merchantLoading,
    countryLoading
}) => {
    const canEditCustomer = useCan('sales.customers.edit_customers');
    const canDeleteCustomer = useCan('sales.customers.delete_customers');
    const [showActions, setShowActions] = useState(false);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
    const buttonRef = useRef(null);

    useEffect(() => {
        if (showActions && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setDropdownPosition({
                top: rect.bottom + window.scrollY,
                right: window.innerWidth - rect.right + window.scrollX
            });
        }
    }, [showActions]);

    const getStatusBadgeClass = (status) => {
        return status === 'active' ? 'badge-light-success' : 'badge-light-danger';
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
                        onChange={(e) => onSelect(customer.id, e.target.checked)}
                    />
                </div>
            </td>

            {/* ID */}
            <td>
                <span className="text-gray-800 fw-bold">{rowNumber}</span>
            </td>

            {/* Customer Info */}
            <td>
                <div className="d-flex align-items-center">
                    <div className="symbol symbol-50px me-3">
                        <div className="symbol-label fs-2 fw-semibold text-success bg-light-success">
                            {customer.name?.charAt(0).toUpperCase()}
                        </div>
                    </div>
                    <div className="d-flex flex-column">
                        <Link to={`/admin/customers/${customer.id}`} className="text-gray-800 text-hover-primary fw-bold">
                            {customer.name}
                        </Link>
                        <span className="text-muted fw-semibold d-block fs-7">
                            {customer.email}
                        </span>
                    </div>
                </div>
            </td>

            {/* Phone */}
            <td>
                <span className="text-gray-600">
                    {customer.phone || customer.phone_number || 'N/A'}
                </span>
            </td>

            {/* Merchant */}
            <td>
                {merchantLoading ? (
                    <div className="d-flex align-items-center gap-2">
                        <span className="placeholder placeholder-lg bg-light" style={{ width: '100px', height: '16px', animation: 'pulse 1.5s ease-in-out infinite' }}></span>
                        <div className="spinner-border spinner-border-sm" style={{ 
                            width: '1rem', 
                            height: '1rem', 
                            borderWidth: '0.2em',
                            borderColor: '#009ef7 transparent #009ef7 #009ef7',
                            animation: 'spinner-border 0.75s linear infinite'
                        }} role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                    </div>
                ) : (
                    <span className="text-gray-600">
                        {merchantInfo?.merchantName || customer.merchant_id || 'N/A'}
                    </span>
                )}
            </td>

            {/* Address */}
            <td>
                <span className="text-gray-600">
                    {customer.address ? (
                        <>
                            {customer.address}
                            {customer.city && <span className="d-block text-muted fs-7">{customer.city}</span>}
                        </>
                    ) : (
                        'N/A'
                    )}
                </span>
            </td>

            {/* Country */}
            <td>
                {countryLoading ? (
                    <div className="d-flex align-items-center gap-2">
                        <span className="placeholder placeholder-lg bg-light" style={{ width: '100px', height: '16px', animation: 'pulse 1.5s ease-in-out infinite' }}></span>
                        <div className="spinner-border spinner-border-sm" style={{ 
                            width: '1rem', 
                            height: '1rem', 
                            borderWidth: '0.2em',
                            borderColor: '#009ef7 transparent #009ef7 #009ef7',
                            animation: 'spinner-border 0.75s linear infinite'
                        }} role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                    </div>
                ) : (
                    <span className="text-gray-600">
                        {merchantInfo?.countryName || customer.country || 'N/A'}
                    </span>
                )}
            </td>

            {/* Status */}
            <td>
                <span className={`badge ${getStatusBadgeClass(customer.status)}`}>
                    {customer.status || 'active'}
                </span>
            </td>

            {/* Created */}
            <td>
                <span className="text-gray-600">
                    {customer.created_at ? new Date(customer.created_at).toLocaleDateString() : 'N/A'}
                </span>
            </td>

            {/* Actions */}
            <td className="text-end">
                <div className="position-relative">
                    <button
                        ref={buttonRef}
                        className="btn btn-sm btn-light btn-active-light-primary"
                        onClick={() => setShowActions(!showActions)}
                    >
                        Actions
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
                                        to={`/admin/customers/${customer.id}`}
                                        className="menu-link px-3"
                                        onClick={() => setShowActions(false)}
                                    >
                                        <i className="ki-duotone ki-eye fs-4 me-2">
                                            <span className="path1"></span>
                                            <span className="path2"></span>
                                            <span className="path3"></span>
                                        </i>
                                        View Details
                                    </Link>
                                </div>

                                {canEditCustomer && (
                                    <div className="menu-item px-3">
                                        <Link
                                            to={`/admin/customers/${customer.id}/edit`}
                                            className="menu-link px-3"
                                            onClick={() => setShowActions(false)}
                                        >
                                            <i className="ki-duotone ki-pencil fs-4 me-2">
                                                <span className="path1"></span>
                                                <span className="path2"></span>
                                            </i>
                                            Edit
                                        </Link>
                                    </div>
                                )}

                                <div className="menu-item px-3">
                                    <a
                                        href="#"
                                        className="menu-link px-3"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setShowActions(false);
                                            onToggleStatus(customer.id);
                                        }}
                                    >
                                        <i className={`ki-duotone ${customer.status === 'active' ? 'ki-toggle-off' : 'ki-toggle-on'} fs-4 me-2`}>
                                            <span className="path1"></span>
                                            <span className="path2"></span>
                                        </i>
                                        {customer.status === 'active' ? 'Deactivate' : 'Activate'}
                                    </a>
                                </div>

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
                                                    onDelete(customer.id);
                                                }}
                                            >
                                                <i className="ki-duotone ki-trash fs-4 me-2">
                                                    <span className="path1"></span>
                                                    <span className="path2"></span>
                                                    <span className="path3"></span>
                                                    <span className="path4"></span>
                                                    <span className="path5"></span>
                                                </i>
                                                Delete
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



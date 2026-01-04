import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';

const PurchaseTableRow = ({ purchase, onDelete, basePath, selected, onSelectChange }) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const handleDelete = async () => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this! Stock will be adjusted.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'Cancel'
        });

        if (result.isConfirmed) {
            onDelete(purchase.id);
        }
    };

    const getPaymentStatusBadge = () => {
        const dueAmount = parseFloat(purchase.due_amount || 0);
        const paidAmount = parseFloat(purchase.paid_amount || 0);
        
        if (dueAmount === 0 && paidAmount > 0) {
            return <span className="badge badge-light-success">Paid</span>;
        } else if (paidAmount > 0 && dueAmount > 0) {
            return <span className="badge badge-light-warning">Partial</span>;
        } else {
            return <span className="badge badge-light-danger">Unpaid</span>;
        }
    };

    return (
        <tr>
            <td>
                <div className="form-check form-check-sm form-check-custom form-check-solid">
                    <input
                        className="form-check-input"
                        type="checkbox"
                        checked={selected}
                        onChange={(e) => onSelectChange(purchase.id, e.target.checked)}
                    />
                </div>
            </td>
            <td>
                <Link 
                    to={`${basePath}/purchases/${purchase.id}`}
                    className="text-gray-800 text-hover-primary fw-bold"
                >
                    #{purchase.id}
                </Link>
            </td>
            <td>
                <span className="text-gray-800">{purchase.date}</span>
            </td>
            <td>
                <span className="text-gray-800">{purchase.reference_no}</span>
            </td>
            <td>
                <span className="text-gray-800">{purchase.supplier}</span>
            </td>
            <td className="text-end">
                <span className="text-gray-800 fw-bold">
                    ${parseFloat(purchase.grand_total).toFixed(2)}
                </span>
            </td>
            <td className="text-end">
                <span className="text-success fw-bold">
                    ${parseFloat(purchase.paid_amount).toFixed(2)}
                </span>
            </td>
            <td className="text-end">
                <span className="text-danger fw-bold">
                    ${parseFloat(purchase.due_amount).toFixed(2)}
                </span>
            </td>
            <td>
                {getPaymentStatusBadge()}
            </td>
            <td className="text-end">
                <button
                    className="btn btn-sm btn-icon btn-light btn-active-light-primary"
                    data-kt-menu-trigger="click"
                    data-kt-menu-placement="bottom-end"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                    <i className="ki-duotone ki-category fs-2">
                        <span className="path1"></span>
                        <span className="path2"></span>
                        <span className="path3"></span>
                        <span className="path4"></span>
                    </i>
                </button>

                <div
                    className={`menu menu-sub menu-sub-dropdown menu-column menu-rounded menu-gray-800 menu-state-bg-light-primary fw-bold w-200px ${isDropdownOpen ? 'show' : ''}`}
                    data-kt-menu="true"
                    style={{ position: 'absolute', zIndex: isDropdownOpen ? 105 : -1 }}
                >
                    <div className="menu-item px-3">
                        <Link
                            to={`${basePath}/purchases/${purchase.id}`}
                            className="menu-link px-3"
                        >
                            <i className="ki-duotone ki-eye fs-4 me-2">
                                <span className="path1"></span>
                                <span className="path2"></span>
                                <span className="path3"></span>
                            </i>
                            View
                        </Link>
                    </div>
                    <div className="menu-item px-3">
                        <Link
                            to={`${basePath}/purchases/${purchase.id}/edit`}
                            className="menu-link px-3"
                        >
                            <i className="ki-duotone ki-pencil fs-4 me-2">
                                <span className="path1"></span>
                                <span className="path2"></span>
                            </i>
                            Edit
                        </Link>
                    </div>
                    <div className="menu-item px-3">
                        <button
                            className="menu-link px-3"
                            onClick={handleDelete}
                        >
                            <i className="ki-duotone ki-trash fs-4 me-2 text-danger">
                                <span className="path1"></span>
                                <span className="path2"></span>
                                <span className="path3"></span>
                                <span className="path4"></span>
                                <span className="path5"></span>
                            </i>
                            <span className="text-danger">Delete</span>
                        </button>
                    </div>
                </div>
            </td>
        </tr>
    );
};

export default PurchaseTableRow;


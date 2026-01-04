import React from 'react';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';

const SupplierTableRow = ({ supplier, onDelete, basePath, selected, onSelectChange }) => {
    const handleDelete = async (e) => {
        e.preventDefault();
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'Cancel'
        });

        if (result.isConfirmed) {
            onDelete(supplier.id);
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
                        onChange={(e) => onSelectChange(supplier.id, e.target.checked)}
                    />
                </div>
            </td>
            <td>
                <div className="d-flex align-items-center">
                    <div className="ms-2">
                        <Link 
                            to={`${basePath}/suppliers/${supplier.id}`}
                            className="text-gray-800 text-hover-primary fs-6 fw-bold"
                        >
                            {supplier.name}
                        </Link>
                        {supplier.company_name && (
                            <div className="text-muted fs-7">{supplier.company_name}</div>
                        )}
                    </div>
                </div>
            </td>
            <td>
                <span className="text-gray-800">{supplier.email}</span>
            </td>
            <td>
                <span className="text-gray-800">{supplier.phone_number}</span>
            </td>
            <td>
                <div className="text-gray-800">
                    {supplier.city && <div>{supplier.city}</div>}
                    {supplier.country && <div className="text-muted fs-7">{supplier.country}</div>}
                </div>
            </td>
            <td>
                <span className="badge badge-light-primary">{supplier.purchase_count || 0} Purchases</span>
            </td>
            <td className="text-end">
                {/* Actions Dropdown */}
                <button
                    className="btn btn-sm btn-light btn-active-light-primary"
                    type="button"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                >
                    Actions
                    <i className="ki-duotone ki-down fs-5 ms-1"></i>
                </button>
                <ul className="dropdown-menu dropdown-menu-end">
                    {/* View Action */}
                    <li>
                        <Link className="dropdown-item" to={`${basePath}/suppliers/${supplier.id}`}>
                            <i className="ki-duotone ki-eye fs-5 me-2">
                                <span className="path1"></span>
                                <span className="path2"></span>
                                <span className="path3"></span>
                            </i>
                            View Details
                        </Link>
                    </li>
                    
                    {/* Edit Action */}
                    <li>
                        <Link className="dropdown-item" to={`${basePath}/suppliers/${supplier.id}/edit`}>
                            <i className="ki-duotone ki-pencil fs-5 me-2">
                                <span className="path1"></span>
                                <span className="path2"></span>
                            </i>
                            Edit Supplier
                        </Link>
                    </li>

                    {/* Divider */}
                    <li><hr className="dropdown-divider" /></li>
                    
                    {/* Delete Action */}
                    <li>
                        <button
                            className="dropdown-item text-danger"
                            onClick={handleDelete}
                        >
                            <i className="ki-duotone ki-trash fs-5 me-2">
                                <span className="path1"></span>
                                <span className="path2"></span>
                                <span className="path3"></span>
                                <span className="path4"></span>
                                <span className="path5"></span>
                            </i>
                            Delete Supplier
                        </button>
                    </li>
                </ul>
            </td>
        </tr>
    );
};

export default SupplierTableRow;


import React from 'react';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';

const CustomerTableRow = ({ customer, isSelected, onSelectChange, onDelete, basePath = '/merchant' }) => {
    const handleCheckboxChange = (e) => {
        onSelectChange(customer.id, e.target.checked);
    };

    const handleDelete = async () => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: `You are about to delete customer "${customer.name}". This action cannot be undone!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'Cancel'
        });

        if (result.isConfirmed) {
            await onDelete(customer.id);
        }
    };

    // Get first letter of name for avatar
    const getInitial = (name) => {
        return name ? name.charAt(0).toUpperCase() : '?';
    };

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
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

            {/* Customer Info */}
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
                        <span className="text-muted fs-7">ID: #{customer.id}</span>
                    </div>
                </div>
            </td>

            {/* Email */}
            <td>
                <span className="text-gray-800 fw-normal">{customer.email || 'N/A'}</span>
            </td>

            {/* Phone */}
            <td>
                <span className="text-gray-800 fw-normal">
                    {customer.phone || customer.phone_number || 'N/A'}
                </span>
            </td>

            {/* Company */}
            <td>
                <span className="text-gray-800 fw-normal">{customer.company_name || 'N/A'}</span>
            </td>

            {/* Customer Group */}
            <td>
                {customer.customer_group ? (
                    <span className="badge badge-light-info">
                        {customer.customer_group.name}
                    </span>
                ) : (
                    <span className="badge badge-light-secondary">No Group</span>
                )}
            </td>

            {/* Created Date */}
            <td>
                <span className="text-gray-600 fw-normal">{formatDate(customer.created_at)}</span>
            </td>

            {/* Actions */}
            <td className="text-end">
                <div className="d-flex justify-content-end flex-shrink-0">
                    <Link
                        to={`${basePath}/customers/${customer.id}`}
                        className="btn btn-icon btn-bg-light btn-active-color-primary btn-sm me-1"
                        title="View"
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
                        title="Edit"
                    >
                        <i className="ki-duotone ki-pencil fs-3">
                            <span className="path1"></span>
                            <span className="path2"></span>
                        </i>
                    </Link>
                    <button
                        className="btn btn-icon btn-bg-light btn-active-color-danger btn-sm"
                        onClick={handleDelete}
                        title="Delete"
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


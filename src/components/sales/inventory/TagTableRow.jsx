import React from 'react';
import Swal from 'sweetalert2';
import { formatDate } from '../../../utils/dateUtils';

const TagTableRow = ({ tag, isSelected, onSelectChange, onEdit, onDelete, onToggleStatus }) => {
    const handleCheckboxChange = (e) => {
        onSelectChange(tag.id, e.target.checked);
    };
    const handleDelete = async () => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: `You are about to delete "${tag.name}". This action cannot be undone!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'Cancel'
        });

        if (result.isConfirmed) {
            onDelete(tag.id);
        }
    };

    const handleToggleStatus = async () => {
        const action = tag.status ? 'deactivate' : 'activate';
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: `You are about to ${action} "${tag.name}".`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: tag.status ? '#f59e0b' : '#10b981',
            cancelButtonColor: '#3085d6',
            confirmButtonText: `Yes, ${action} it!`,
            cancelButtonText: 'Cancel'
        });

        if (result.isConfirmed) {
            onToggleStatus(tag.id);
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
                        onChange={handleCheckboxChange}
                    />
                </div>
            </td>
            <td>
                <span className="badge badge-light-primary">{tag.id}</span>
            </td>
            <td>
                <span className="text-dark fw-bold">{tag.name}</span>
            </td>
            <td>
                <span className="badge badge-light-info">{tag.slug}</span>
            </td>
            <td>
                <span className={`badge ${tag.status ? 'badge-light-success' : 'badge-light-danger'}`}>
                    {tag.status ? 'Active' : 'Inactive'}
                </span>
            </td>
            <td>
                <span className="text-muted">{formatDate(tag.created_at)}</span>
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
                    {/* Edit Action */}
                    <li>
                        <button
                            className="dropdown-item"
                            onClick={() => onEdit(tag)}
                        >
                            <i className="ki-duotone ki-pencil fs-5 me-2">
                                <span className="path1"></span>
                                <span className="path2"></span>
                            </i>
                            Edit Tag
                        </button>
                    </li>

                    {/* Divider */}
                    <li><hr className="dropdown-divider" /></li>

                    {/* Toggle Status Action */}
                    <li>
                        <button
                            className={`dropdown-item ${tag.status ? 'text-warning' : 'text-success'}`}
                            onClick={handleToggleStatus}
                        >
                            <i className={`ki-duotone ${tag.status ? 'ki-cross-circle' : 'ki-check-circle'} fs-5 me-2`}>
                                <span className="path1"></span>
                                <span className="path2"></span>
                            </i>
                            {tag.status ? 'Deactivate' : 'Activate'}
                        </button>
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
                            Delete Tag
                        </button>
                    </li>
                </ul>
            </td>
        </tr>
    );
};

export default TagTableRow;




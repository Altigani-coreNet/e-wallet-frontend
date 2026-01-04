import React from 'react';
import Swal from 'sweetalert2';
import { formatDate } from '../../../utils/dateUtils';

const UnitTableRow = ({ unit, isSelected, onSelectChange, onEdit, onDelete, onToggleStatus }) => {
    const handleCheckboxChange = (e) => {
        onSelectChange(unit.id, e.target.checked);
    };
    const handleDelete = async () => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: `You are about to delete "${unit.name}". This action cannot be undone!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'Cancel'
        });

        if (result.isConfirmed) {
            onDelete(unit.id);
        }
    };

    const handleToggleStatus = async () => {
        const action = unit.status ? 'deactivate' : 'activate';
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: `You are about to ${action} "${unit.name}".`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: unit.status ? '#f59e0b' : '#10b981',
            cancelButtonColor: '#3085d6',
            confirmButtonText: `Yes, ${action} it!`,
            cancelButtonText: 'Cancel'
        });

        if (result.isConfirmed) {
            onToggleStatus(unit.id);
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
                <span className="badge badge-light-primary">{unit.id}</span>
            </td>
            <td>
                <span className="text-dark fw-bold">{unit.name}</span>
            </td>
            <td>
                <span className="badge bg-info">{unit.code || 'N/A'}</span>
            </td>
            <td>
                <span className={`badge ${unit.status ? 'badge-light-success' : 'badge-light-danger'}`}>
                    {unit.status ? 'Active' : 'Inactive'}
                </span>
            </td>
            <td>
                <span className="text-muted">{formatDate(unit.created_at)}</span>
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
                            onClick={() => onEdit(unit)}
                        >
                            <i className="ki-duotone ki-pencil fs-5 me-2">
                                <span className="path1"></span>
                                <span className="path2"></span>
                            </i>
                            Edit Unit
                        </button>
                    </li>

                    {/* Divider */}
                    <li><hr className="dropdown-divider" /></li>

                    {/* Toggle Status Action */}
                    <li>
                        <button
                            className={`dropdown-item ${unit.status ? 'text-warning' : 'text-success'}`}
                            onClick={handleToggleStatus}
                        >
                            <i className={`ki-duotone ${unit.status ? 'ki-cross-circle' : 'ki-check-circle'} fs-5 me-2`}>
                                <span className="path1"></span>
                                <span className="path2"></span>
                            </i>
                            {unit.status ? 'Deactivate' : 'Activate'}
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
                            Delete Unit
                        </button>
                    </li>
                </ul>
            </td>
        </tr>
    );
};

export default UnitTableRow;


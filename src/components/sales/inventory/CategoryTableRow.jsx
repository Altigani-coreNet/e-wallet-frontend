import React from 'react';
import Swal from 'sweetalert2';
import { formatDate } from '../../../utils/dateUtils';

const CategoryTableRow = ({ category, isSelected, onSelectChange, onEdit, onDelete, onToggleStatus }) => {
    const handleCheckboxChange = (e) => {
        onSelectChange(category.id, e.target.checked);
    };
    const handleDelete = async () => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: `You are about to delete "${category.name}". This action cannot be undone!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'Cancel'
        });

        if (result.isConfirmed) {
            onDelete(category.id);
        }
    };

    const handleToggleStatus = async () => {
        const action = category.status ? 'deactivate' : 'activate';
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: `You are about to ${action} "${category.name}".`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: category.status ? '#f59e0b' : '#10b981',
            cancelButtonColor: '#3085d6',
            confirmButtonText: `Yes, ${action} it!`,
            cancelButtonText: 'Cancel'
        });

        if (result.isConfirmed) {
            onToggleStatus(category.id);
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
                <span className="badge badge-light-primary">{category.id}</span>
            </td>
            <td>
                {category.thumbnail ? (
                    <img 
                        src={category.thumbnail} 
                        alt={category.name} 
                        style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} 
                    />
                ) : (
                    <div 
                        className="bg-light d-flex align-items-center justify-content-center" 
                        style={{ width: '40px', height: '40px', borderRadius: '4px' }}
                    >
                        <i className="bx bx-image fs-4 text-muted"></i>
                    </div>
                )}
            </td>
            <td>
                <span className="text-dark fw-bold">{category.name}</span>
            </td>
            <td>
                {category.parent_category_name ? (
                    <span className="badge badge-light-info">{category.parent_category_name}</span>
                ) : (
                    <span className="text-muted">-</span>
                )}
            </td>
            <td>
                <span className="badge badge-light-success">{category.total_products || 0} products</span>
            </td>
            <td>
                <span className={`badge ${category.status ? 'badge-light-success' : 'badge-light-danger'}`}>
                    {category.status ? 'Active' : 'Inactive'}
                </span>
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
                            onClick={() => onEdit(category)}
                        >
                            <i className="ki-duotone ki-pencil fs-5 me-2">
                                <span className="path1"></span>
                                <span className="path2"></span>
                            </i>
                            Edit Category
                        </button>
                    </li>

                    {/* Divider */}
                    <li><hr className="dropdown-divider" /></li>

                    {/* Toggle Status Action */}
                    <li>
                        <button
                            className={`dropdown-item ${category.status ? 'text-warning' : 'text-success'}`}
                            onClick={handleToggleStatus}
                        >
                            <i className={`ki-duotone ${category.status ? 'ki-cross-circle' : 'ki-check-circle'} fs-5 me-2`}>
                                <span className="path1"></span>
                                <span className="path2"></span>
                            </i>
                            {category.status ? 'Deactivate' : 'Activate'}
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
                            Delete Category
                        </button>
                    </li>
                </ul>
            </td>
        </tr>
    );
};

export default CategoryTableRow;




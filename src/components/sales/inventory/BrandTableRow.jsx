import React from 'react';
import Swal from 'sweetalert2';
import { formatDate } from '../../../utils/dateUtils';

const BrandTableRow = ({ brand, isSelected, onSelectChange, onEdit, onDelete, onToggleStatus }) => {
    const handleCheckboxChange = (e) => {
        onSelectChange(brand.id, e.target.checked);
    };
    const handleDelete = async () => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: `You are about to delete "${brand.name}". This action cannot be undone!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'Cancel'
        });

        if (result.isConfirmed) {
            onDelete(brand.id);
        }
    };

    const handleToggleStatus = async () => {
        const action = brand.status ? 'deactivate' : 'activate';
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: `You are about to ${action} "${brand.name}".`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: brand.status ? '#f59e0b' : '#10b981',
            cancelButtonColor: '#3085d6',
            confirmButtonText: `Yes, ${action} it!`,
            cancelButtonText: 'Cancel'
        });

        if (result.isConfirmed) {
            onToggleStatus(brand.id);
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
                <span className="badge badge-light-primary">{brand.id}</span>
            </td>
            <td>
                {brand.image || brand.thumbnail ? (
                    <img 
                        src={brand.image || brand.thumbnail} 
                        alt={brand.name} 
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
                <span className="text-dark fw-bold">{brand.name}</span>
            </td>
            <td>
                <span className={`badge ${brand.status ? 'badge-light-success' : 'badge-light-danger'}`}>
                    {brand.status ? 'Active' : 'Inactive'}
                </span>
            </td>
            <td>
                <span className="text-muted">{formatDate(brand.created_at)}</span>
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
                            onClick={() => onEdit(brand)}
                        >
                            <i className="ki-duotone ki-pencil fs-5 me-2">
                                <span className="path1"></span>
                                <span className="path2"></span>
                            </i>
                            Edit Brand
                        </button>
                    </li>

                    {/* Divider */}
                    <li><hr className="dropdown-divider" /></li>

                    {/* Toggle Status Action */}
                    <li>
                        <button
                            className={`dropdown-item ${brand.status ? 'text-warning' : 'text-success'}`}
                            onClick={handleToggleStatus}
                        >
                            <i className={`ki-duotone ${brand.status ? 'ki-cross-circle' : 'ki-check-circle'} fs-5 me-2`}>
                                <span className="path1"></span>
                                <span className="path2"></span>
                            </i>
                            {brand.status ? 'Deactivate' : 'Activate'}
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
                            Delete Brand
                        </button>
                    </li>
                </ul>
            </td>
        </tr>
    );
};

export default BrandTableRow;


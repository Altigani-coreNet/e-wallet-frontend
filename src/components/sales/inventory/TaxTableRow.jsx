import React from 'react';
import { formatDate } from '../../../utils/dateUtils';

const TaxTableRow = ({ tax, isSelected, onSelectChange, onEdit, onDelete }) => {
    const handleCheckboxChange = (e) => {
        onSelectChange(tax.id, e.target.checked);
    };
    const handleDelete = () => {
        if (window.confirm('Are you sure you want to delete this tax?')) {
            onDelete(tax.id);
        }
    };

    const getTypeBadgeClass = (type) => {
        switch (type) {
            case 'STANDARD':
                return 'badge-light-primary';
            case 'EXEMPTED':
                return 'badge-light-warning';
            case 'ZERO_RATED':
                return 'badge-light-info';
            case 'RCM':
                return 'badge-light-success';
            default:
                return 'badge-light-primary';
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
                <span className="badge badge-light-primary">{tax.id}</span>
            </td>
            <td>
                <span className="text-dark fw-bold">{tax.name}</span>
            </td>
            <td>
                <span className="badge badge-light-success">{tax.rate}%</span>
            </td>
            <td>
                <span className={`badge ${getTypeBadgeClass(tax.type)}`}>
                    {tax.type}
                </span>
            </td>
            <td>
                <span className={`badge ${tax.status ? 'badge-light-success' : 'badge-light-danger'}`}>
                    {tax.status ? 'Active' : 'Inactive'}
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
                            onClick={() => onEdit(tax)}
                        >
                            <i className="ki-duotone ki-pencil fs-5 me-2">
                                <span className="path1"></span>
                                <span className="path2"></span>
                            </i>
                            Edit Tax
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
                            Delete Tax
                        </button>
                    </li>
                </ul>
            </td>
        </tr>
    );
};

export default TaxTableRow;




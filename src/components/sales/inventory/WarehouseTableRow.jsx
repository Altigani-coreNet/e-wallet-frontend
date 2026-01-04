import React from 'react';
import { Link } from 'react-router-dom';
import { formatDate } from '../../../utils/dateUtils';

const WarehouseTableRow = ({ warehouse, isSelected, onSelect, onToggleStatus, onDelete }) => {
    const handleDelete = () => {
        if (window.confirm('Are you sure you want to delete this warehouse?')) {
            onDelete(warehouse.id);
        }
    };

    const handleToggleStatus = () => {
        if (window.confirm(`Are you sure you want to ${warehouse.status ? 'deactivate' : 'activate'} this warehouse?`)) {
            onToggleStatus(warehouse.id);
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
                        onChange={onSelect}
                        aria-label={`Select warehouse ${warehouse.name}`}
                    />
                </div>
            </td>
            <td>
                <span className="badge badge-light-primary">{warehouse.id}</span>
            </td>
            <td>
                <div className="d-flex flex-column">
                    <span className="text-dark fw-bold">{warehouse.name}</span>
                    <span className="text-muted fs-7">Created {warehouse.created_at ? formatDate(warehouse.created_at) : '-'}</span>
                </div>
            </td>
            <td>
                {warehouse.phone ? <span className="text-dark">{warehouse.phone}</span> : <span className="text-muted">-</span>}
            </td>
            <td>
                {warehouse.email ? (
                    <a href={`mailto:${warehouse.email}`} className="text-primary text-hover-primary">
                        {warehouse.email}
                    </a>
                ) : (
                    <span className="text-muted">-</span>
                )}
            </td>
            <td>
                {warehouse.city ? <span className="text-dark">{warehouse.city}</span> : <span className="text-muted">-</span>}
            </td>
            <td>
                {warehouse.address ? <span className="text-muted">{warehouse.address}</span> : <span className="text-muted">-</span>}
            </td>
            <td>
                <span className={`badge ${warehouse.status ? 'badge-light-success' : 'badge-light-danger'}`}>
                    {warehouse.status ? 'Active' : 'Inactive'}
                </span>
            </td>
            <td className="text-end">
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
                    <li>
                        <Link className="dropdown-item" to={`/sales/warehouse/${warehouse.id}`}>
                            <i className="ki-duotone ki-eye fs-5 me-2">
                                <span className="path1"></span>
                                <span className="path2"></span>
                                <span className="path3"></span>
                            </i>
                            View Details
                        </Link>
                    </li>
                    <li>
                        <Link className="dropdown-item" to={`/sales/warehouse/${warehouse.id}/edit`}>
                            <i className="ki-duotone ki-pencil fs-5 me-2">
                                <span className="path1"></span>
                                <span className="path2"></span>
                            </i>
                            Edit Warehouse
                        </Link>
                    </li>
                    <li>
                        <button className="dropdown-item" onClick={handleToggleStatus}>
                            <i className="ki-duotone ki-arrows-loop fs-5 me-2">
                                <span className="path1"></span>
                                <span className="path2"></span>
                            </i>
                            {warehouse.status ? 'Deactivate' : 'Activate'}
                        </button>
                    </li>
                    <li><hr className="dropdown-divider" /></li>
                    <li>
                        <button className="dropdown-item text-danger" onClick={handleDelete}>
                            <i className="ki-duotone ki-trash fs-5 me-2">
                                <span className="path1"></span>
                                <span className="path2"></span>
                                <span className="path3"></span>
                                <span className="path4"></span>
                                <span className="path5"></span>
                            </i>
                            Delete Warehouse
                        </button>
                    </li>
                </ul>
            </td>
        </tr>
    );
};

export default WarehouseTableRow;




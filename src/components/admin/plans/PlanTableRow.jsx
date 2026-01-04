import React from 'react';
import { Link } from 'react-router-dom';

const PlanTableRow = ({ plan, isSelected, onSelect, onDelete, onStatusChange }) => {
    return (
        <tr>
            <td>
                <div className="form-check form-check-sm form-check-custom form-check-solid">
                    <input
                        className="form-check-input"
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onSelect(plan.id)}
                    />
                </div>
            </td>
            <td>{plan.name}</td>
            <td>
                <div className="text-truncate" style={{ maxWidth: '200px' }}>
                    {plan.description || '-'}
                </div>
            </td>
            <td>{plan.plan_type?.value || plan.plan_type || '-'}</td>
            <td>{plan.price ? parseFloat(plan.price).toFixed(2) : '-'}</td>
            <td>{plan.current_price ? parseFloat(plan.current_price).toFixed(2) : '-'}</td>
            <td>
                {plan.has_discount ? (
                    <span className="badge badge-success">Yes</span>
                ) : (
                    <span className="badge badge-secondary">No</span>
                )}
            </td>
            <td>
                {plan.status ? (
                    <span className="badge badge-success">Active</span>
                ) : (
                    <span className="badge badge-danger">Inactive</span>
                )}
            </td>
            <td>
                <div className="d-flex justify-content-end flex-shrink-0">
                    <Link
                        to={`/admin/plans/${plan.id}`}
                        className="btn btn-icon btn-bg-light btn-active-color-primary btn-sm me-1"
                        title="View"
                    >
                        <i className="ki-duotone ki-eye fs-2">
                            <span className="path1"></span>
                            <span className="path2"></span>
                            <span className="path3"></span>
                        </i>
                    </Link>
                    <Link
                        to={`/admin/plans/${plan.id}/edit`}
                        className="btn btn-icon btn-bg-light btn-active-color-primary btn-sm me-1"
                        title="Edit"
                    >
                        <i className="ki-duotone ki-pencil fs-2">
                            <span className="path1"></span>
                            <span className="path2"></span>
                        </i>
                    </Link>
                    <button
                        className="btn btn-icon btn-bg-light btn-active-color-primary btn-sm me-1"
                        onClick={() => onStatusChange(plan.id)}
                        title={plan.status ? 'Deactivate' : 'Activate'}
                    >
                        <i className={`ki-duotone ${plan.status ? 'ki-toggle-on' : 'ki-toggle-off'} fs-2`}>
                            <span className="path1"></span>
                            <span className="path2"></span>
                        </i>
                    </button>
                    <button
                        className="btn btn-icon btn-bg-light btn-active-color-danger btn-sm"
                        onClick={() => onDelete(plan.id)}
                        title="Delete"
                    >
                        <i className="ki-duotone ki-trash fs-2">
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

export default PlanTableRow;

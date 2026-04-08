import React from 'react';
import { Link } from 'react-router-dom';

const ServiceCategoryTableRow = ({
    category,
    isSelected,
    onSelect,
    onEdit,
    onDelete,
    onToggleStatus,
    togglingStatusId,
}) => {
    const handleCheckboxChange = (e) => {
        onSelect(category.id, e.target.checked);
    };

    const statusBusy = togglingStatusId === category.id;

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
                <span className="text-dark fw-bold">{category.name_en || category.name || 'N/A'}</span>
            </td>
            <td>
                <span className="text-muted">
                    {category.description ? (
                        category.description.length > 50
                            ? `${category.description.substring(0, 50)}...`
                            : category.description
                    ) : (
                        <span className="text-gray-400">No description</span>
                    )}
                </span>
            </td>
            <td className="text-center">
                <span className={`badge badge-light-${category.is_active ? 'success' : 'danger'}`}>
                    {category.is_active ? 'Active' : 'Inactive'}
                </span>
            </td>
            <td className="text-center">
                <span className="badge badge-light-info">{category.services_count ?? 0}</span>
            </td>
            <td className="text-end">
                <div className="dropdown">
                    <button
                        type="button"
                        className="btn btn-sm btn-icon btn-bg-light btn-active-light-primary"
                        data-bs-toggle="dropdown"
                        aria-expanded="false"
                        title="Actions"
                    >
                        <i className="ki-duotone ki-dots-square fs-2">
                            <span className="path1" />
                            <span className="path2" />
                            <span className="path3" />
                            <span className="path4" />
                        </i>
                    </button>
                    <ul className="dropdown-menu dropdown-menu-end">
                        <li>
                            <Link
                                className="dropdown-item"
                                to={`/admin/service/category/${category.id}`}
                            >
                                <i className="ki-duotone ki-eye fs-5 me-2">
                                    <span className="path1" />
                                    <span className="path2" />
                                    <span className="path3" />
                                </i>
                                View
                            </Link>
                        </li>
                        <li>
                            <button
                                type="button"
                                className="dropdown-item"
                                onClick={() => onEdit(category)}
                            >
                                <i className="ki-duotone ki-pencil fs-5 me-2">
                                    <span className="path1" />
                                    <span className="path2" />
                                </i>
                                Edit
                            </button>
                        </li>
                        <li>
                            <hr className="dropdown-divider" />
                        </li>
                        <li
                            className="dropdown-item-text py-2"
                            onClick={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                        >
                            <div className="d-flex align-items-center justify-content-between gap-3">
                                <span className="text-gray-800 fw-semibold fs-7">Active</span>
                                <div className="d-flex align-items-center gap-2">
                                    {statusBusy && (
                                        <span
                                            className="spinner-border spinner-border-sm text-primary"
                                            role="status"
                                            aria-hidden="true"
                                        />
                                    )}
                                    <div className="form-check form-switch form-check-custom form-check-solid mb-0">
                                        <input
                                            className="form-check-input h-20px w-35px"
                                            type="checkbox"
                                            role="switch"
                                            checked={!!category.is_active}
                                            disabled={statusBusy}
                                            onChange={() => onToggleStatus(category)}
                                            aria-label="Toggle active status"
                                        />
                                    </div>
                                </div>
                            </div>
                        </li>
                        <li>
                            <hr className="dropdown-divider" />
                        </li>
                        <li>
                            <button
                                type="button"
                                className="dropdown-item text-danger"
                                onClick={() => onDelete(category)}
                            >
                                <i className="ki-duotone ki-trash fs-5 me-2">
                                    <span className="path1" />
                                    <span className="path2" />
                                    <span className="path3" />
                                    <span className="path4" />
                                    <span className="path5" />
                                </i>
                                Delete
                            </button>
                        </li>
                    </ul>
                </div>
            </td>
        </tr>
    );
};

export default ServiceCategoryTableRow;

import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const ServiceCategoryTableRow = ({
    category,
    isSelected,
    onSelect,
    onEdit,
    onDelete,
    onToggleStatus,
    togglingStatusId,
}) => {
    const { t, i18n } = useTranslation();

    const displayName =
        i18n.dir() === 'rtl'
            ? (category.name_ar || category.name_en || category.name || 'N/A')
            : (category.name_en || category.name_ar || category.name || 'N/A');
    const handleCheckboxChange = (e) => {
        onSelect(category.id, e.target.checked);
    };

    const statusBusy = togglingStatusId === category.id;

    return (
        <tr>
            <td className="w-10px px-2 align-middle text-center">
                <div className="form-check form-check-sm form-check-custom form-check-solid d-flex justify-content-center mb-0">
                    <input
                        className="form-check-input"
                        type="checkbox"
                        checked={isSelected}
                        onChange={handleCheckboxChange}
                    />
                </div>
            </td>
            <td className="min-w-80px align-middle text-center">
                <div className="d-flex justify-content-center align-items-center w-100 min-w-0">
                    {category.image_url || category.image ? (
                        <img
                            src={category.image_url || category.image}
                            alt={category.name_en || category.name || t('admin.paymentGetway.catRowAltCategory')}
                            className="rounded border"
                            style={{ width: '42px', height: '42px', objectFit: 'cover' }}
                        />
                    ) : (
                        <div
                            className="d-inline-flex align-items-center justify-content-center rounded border text-muted fs-8"
                            style={{ width: '42px', height: '42px' }}
                        >
                            {t('admin.paymentGetway.na')}
                        </div>
                    )}
                </div>
            </td>
            <td className="min-w-150px align-middle text-start">
                <div className="d-flex justify-content-start align-items-center w-100 min-w-0">
                    <span className="text-dark fw-bold text-start text-break w-100" dir="auto">
                        {displayName}
                    </span>
                </div>
            </td>
            <td className="min-w-200px align-middle text-start">
                <div className="d-flex justify-content-start align-items-center w-100 min-w-0">
                    <span className="text-muted text-start text-break w-100" dir="auto">
                        {category.description ? (
                            category.description.length > 50
                                ? `${category.description.substring(0, 50)}...`
                                : category.description
                        ) : (
                            <span className="text-gray-400">{t('admin.paymentGetway.catNoDescription')}</span>
                        )}
                    </span>
                </div>
            </td>
            <td className="min-w-100px align-middle text-center">
                <div className="d-flex justify-content-center align-items-center w-100 min-w-0">
                    <span
                        className={`badge badge-light-${category.is_active ? 'success' : 'danger'}`}
                        dir="auto"
                    >
                        {category.is_active ? t('admin.common.active') : t('admin.common.inactive')}
                    </span>
                </div>
            </td>
            <td className="min-w-100px align-middle text-center">
                <div className="d-flex justify-content-center align-items-center w-100 min-w-0">
                    <span className="badge badge-light-info" dir="auto">
                        {category.services_count ?? 0}
                    </span>
                </div>
            </td>
            <td className="min-w-100px align-middle text-end">
                <div className="d-flex justify-content-end align-items-center w-100 min-w-0">
                    <div className="dropdown">
                        <button
                            type="button"
                            className="btn btn-sm btn-icon btn-bg-light btn-active-light-primary"
                            data-bs-toggle="dropdown"
                            aria-expanded="false"
                            title={t('admin.common.actions')}
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
                                    {t('admin.common.view')}
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
                                    {t('admin.common.edit')}
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
                                    <span className="text-gray-800 fw-semibold fs-7">{t('admin.common.active')}</span>
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
                                                aria-label={t('admin.paymentGetway.catToggleActiveAria')}
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
                                    {t('admin.common.delete')}
                                </button>
                            </li>
                        </ul>
                    </div>
                </div>
            </td>
        </tr>
    );
};

export default ServiceCategoryTableRow;

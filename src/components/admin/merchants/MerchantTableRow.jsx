import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AUTH_SERVICE_BASE } from '../../../utils/constants';
import { useCan } from '../../../utils/permissions';

const resolveAuthAssetUrl = (path) => {
    if (!path) return null;
    if (/^https?:\/\//i.test(path)) {
        return path;
    }

    const normalizedBase = AUTH_SERVICE_BASE.replace(/\/+$/, '');
    const normalizedPath = path.toString().replace(/^\/+/, '').replace(/\\/g, '/');
    return `${normalizedBase}/${normalizedPath}`;
};

const MerchantTableRow = ({
    merchant,
    rowNumber,
    isSelected,
    onSelect,
    onApprove,
    onReject,
    onSuspend,
    onUnsuspend,
    onDelete,
    onResetPassword
}) => {
    const canEditMerchant = useCan('pos.merchants.edit_merchants');
    const canDeleteMerchant = useCan('pos.merchants.delete_merchants');
    const [logoError, setLogoError] = useState(false);

    useEffect(() => {
        setLogoError(false);
    }, [merchant.logo]);

    const getStatusBadgeClass = (status) => {
        switch (status?.toLowerCase()) {
            case 'approved':
                return 'badge-light-success';
            case 'pending':
                return 'badge-light-warning';
            case 'requesting_updated':
                return 'badge-light-warning';
            case 'rejected':
                return 'badge-light-danger';
            case 'suspended':
                return 'badge-light-dark';
            case 'viewed':
                return 'badge-light-info';
            default:
                return 'badge-light-secondary';
        }
    };

    const logoUrl = resolveAuthAssetUrl(merchant.logo);
    const displayInitial = logoError || !logoUrl;
    const fallbackSource = (merchant.business_name || merchant.name || 'M').trim();
    const fallbackLetter = fallbackSource ? fallbackSource.charAt(0).toUpperCase() : 'M';

    return (
        <tr>
            {/* Checkbox */}
            <td>
                <div className="form-check form-check-sm form-check-custom form-check-solid">
                    <input
                        className="form-check-input"
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => onSelect(merchant.id, e.target.checked)}
                    />
                </div>
            </td>

            {/* ID */}
            <td>
                <span className="text-gray-800 fw-bold">{rowNumber}</span>
            </td>

            {/* Logo */}
            <td>
                <div className="symbol symbol-50px">
                    {!displayInitial && logoUrl ? (
                        <img
                            src={logoUrl}
                            alt={merchant.business_name}
                            className="rounded"
                            onError={() => setLogoError(true)}
                        />
                    ) : (
                        <div className="symbol-label fs-2 fw-semibold text-primary bg-light-primary">
                            {fallbackLetter}
                        </div>
                    )}
                </div>
            </td>

            {/* Merchant Info */}
            <td>
                <Link to={`/admin/merchants/${merchant.id}`} className="text-gray-800 text-hover-primary fw-bold">
                    {merchant.business_name || merchant.name}
                </Link>
                {merchant.owner_name && (
                    <span className="text-muted fw-semibold d-block fs-7 mt-1">
                        {merchant.owner_name}
                    </span>
                )}
                {merchant.email && (
                    <a href={`mailto:${merchant.email}`} className="text-gray-600 text-hover-primary d-block fs-7 mt-1">
                        {merchant.email}
                    </a>
                )}
            </td>

            {/* Phone */}
            <td>
                <span className="text-gray-600">{merchant.phone || 'N/A'}</span>
            </td>

            {/* Business Type */}
            <td>
                <span className="badge badge-light-primary">
                    {merchant.business_type ? merchant.business_type.charAt(0).toUpperCase() + merchant.business_type.slice(1) : 'N/A'}
                </span>
            </td>

            {/* Plan */}
            <td>
                {merchant.plan ? (
                    <span className="badge badge-light-info">
                        {merchant.plan.name || merchant.plan.text || 'N/A'}
                    </span>
                ) : (
                    <span className="badge badge-light-secondary">No Plan</span>
                )}
            </td>

            {/* Status */}
            <td>
                <span className={`badge ${getStatusBadgeClass(merchant.status)}`}>
                    {merchant.status ? merchant.status.charAt(0).toUpperCase() + merchant.status.slice(1) : 'N/A'}
                </span>
            </td>

            {/* Is Active */}
            <td>
                <span className={`badge ${merchant.is_active ? 'badge-light-success' : 'badge-light-danger'}`}>
                    {merchant.is_active ? 'Active' : 'Inactive'}
                </span>
            </td>

            {/* Country */}
            <td>
                <span className="text-gray-600">
                    {merchant.country_name || merchant.country?.name?.en || merchant.country?.name || 'N/A'}
                </span>
            </td>

            {/* Actions */}
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
                            <Link className="dropdown-item" to={`/admin/merchants/${merchant.id}`}>
                                <i className="ki-duotone ki-eye fs-5 me-2">
                                    <span className="path1" />
                                    <span className="path2" />
                                    <span className="path3" />
                                </i>
                                View
                            </Link>
                        </li>
                        {canEditMerchant && (
                            <li>
                                <Link className="dropdown-item" to={`/admin/merchants/${merchant.id}/edit`}>
                                    <i className="ki-duotone ki-pencil fs-5 me-2">
                                        <span className="path1" />
                                        <span className="path2" />
                                    </i>
                                    Edit
                                </Link>
                            </li>
                        )}
                        {['pending', 'requesting_updated'].includes(merchant.status) && onApprove && (
                            <li>
                                <button
                                    type="button"
                                    className="dropdown-item"
                                    onClick={() => onApprove(merchant.id)}
                                >
                                    <i className="ki-duotone ki-check fs-5 me-2">
                                        <span className="path1" />
                                        <span className="path2" />
                                    </i>
                                    Approve
                                </button>
                            </li>
                        )}
                        {['pending', 'requesting_updated'].includes(merchant.status) && onReject && (
                            <li>
                                <button
                                    type="button"
                                    className="dropdown-item"
                                    onClick={() => onReject(merchant)}
                                >
                                    <i className="ki-duotone ki-cross fs-5 me-2">
                                        <span className="path1" />
                                        <span className="path2" />
                                    </i>
                                    Reject
                                </button>
                            </li>
                        )}
                        {merchant.status !== 'suspended' && onSuspend && (
                            <li>
                                <button
                                    type="button"
                                    className="dropdown-item"
                                    onClick={() => onSuspend(merchant)}
                                >
                                    <i className="ki-duotone ki-lock fs-5 me-2">
                                        <span className="path1" />
                                        <span className="path2" />
                                    </i>
                                    Suspend
                                </button>
                            </li>
                        )}
                        {merchant.status === 'suspended' && onUnsuspend && (
                            <li>
                                <button
                                    type="button"
                                    className="dropdown-item"
                                    onClick={() => onUnsuspend(merchant.id)}
                                >
                                    <i className="ki-duotone ki-lock-2 fs-5 me-2">
                                        <span className="path1" />
                                        <span className="path2" />
                                    </i>
                                    Unsuspend
                                </button>
                            </li>
                        )}
                        {(merchant.user_id || merchant.user?.id) && onResetPassword && (
                            <li>
                                <button
                                    type="button"
                                    className="dropdown-item"
                                    onClick={() => onResetPassword(merchant)}
                                >
                                    <i className="ki-duotone ki-key fs-5 me-2">
                                        <span className="path1" />
                                        <span className="path2" />
                                    </i>
                                    Reset Password
                                </button>
                            </li>
                        )}
                        {canDeleteMerchant && onDelete && (
                            <>
                                <li>
                                    <hr className="dropdown-divider" />
                                </li>
                                <li>
                                    <button
                                        type="button"
                                        className="dropdown-item text-danger"
                                        onClick={() => onDelete(merchant.id)}
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
                            </>
                        )}
                    </ul>
                </div>
            </td>
        </tr>
    );
};

export default MerchantTableRow;


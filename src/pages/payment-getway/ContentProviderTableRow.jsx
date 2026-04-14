import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AUTH_SERVICE_BASE } from '../../utils/constants';
import { useCan } from '../../utils/permissions';
import { formatDateTime, formatDate } from '../../utils/helpers';

const resolveAuthAssetUrl = (path) => {
    if (!path) return null;
    if (/^https?:\/\//i.test(path)) {
        return path;
    }

    const normalizedBase = AUTH_SERVICE_BASE.replace(/\/+$/, '');
    const normalizedPath = path.toString().replace(/^\/+/, '').replace(/\\/g, '/');
    return `${normalizedBase}/${normalizedPath}`;
};

const pickFirstValue = (...values) => {
    for (const value of values) {
        if (value !== null && value !== undefined && value !== '') {
            return value;
        }
    }
    return null;
};

const ContentProviderTableRow = ({
    contentProvider,
    isSelected,
    onSelect,
    onApprove,
    onReject,
    onSuspend,
    onUnsuspend,
    onDelete,
    onResetPassword,
    lookupCountryName,
    lookupCountryCode,
    lookupLoading,
    /** 'compact' = sub-partner list: smaller avatar, name + email only, date without time */
    variant = 'default',
    /** Hide bulk selection column (e.g. sub-partner tab has no bulk actions) */
    hideCheckbox = false,
    /** Sub Partner index: show column for main (parent) partner */
    showParentColumn = false,
}) => {
    const isCompact = variant === 'compact';
    const canEditContentProvider = useCan('pos.merchants.edit_merchants');
    const canDeleteContentProvider = useCan('pos.merchants.delete_merchants');
    const [showActions, setShowActions] = useState(false);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
    const buttonRef = useRef(null);
    const [logoError, setLogoError] = useState(false);
    const logoCandidate = pickFirstValue(
        contentProvider.logo_url,
        contentProvider.logo,
        contentProvider.image_url,
        contentProvider.image,
        contentProvider.avatar_url,
        contentProvider.avatar,
        contentProvider.profile_image_url,
        contentProvider.profile_image
    );

    useEffect(() => {
        setLogoError(false);
    }, [logoCandidate]);

    // Fixed dropdown: use viewport coords only (getBoundingClientRect + scroll offsets breaks placement).
    useEffect(() => {
        if (!showActions || !buttonRef.current) return undefined;

        const updatePosition = () => {
            if (!buttonRef.current) return;
            const rect = buttonRef.current.getBoundingClientRect();
            setDropdownPosition({
                top: rect.bottom,
                right: window.innerWidth - rect.right,
            });
        };

        updatePosition();
        window.addEventListener('scroll', updatePosition, true);
        window.addEventListener('resize', updatePosition);
        return () => {
            window.removeEventListener('scroll', updatePosition, true);
            window.removeEventListener('resize', updatePosition);
        };
    }, [showActions]);

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

    const logoUrl = resolveAuthAssetUrl(logoCandidate);
    const displayInitial = logoError || !logoUrl;
    const fallbackSource = (contentProvider.business_name || contentProvider.name || 'C').trim();
    const fallbackLetter = fallbackSource ? fallbackSource.charAt(0).toUpperCase() : 'C';

    const categoryLabel =
        contentProvider.partner_category?.name_en ||
        contentProvider.partner_category?.name_ar ||
        contentProvider.partnerCategory?.name_en ||
        contentProvider.partnerCategory?.name_ar ||
        '—';

    const resolvedCountryName =
        pickFirstValue(
            lookupCountryName,
            contentProvider.country_name,
            contentProvider.countryName,
            contentProvider.country?.name?.en,
            contentProvider.country?.name_en,
            contentProvider.country?.name,
            contentProvider.country?.label
        ) || null;

    const resolvedCountryCode =
        pickFirstValue(
            lookupCountryCode,
            contentProvider.country_code,
            contentProvider.countryCode,
            contentProvider.country?.code,
            contentProvider.country?.short_name,
            contentProvider.country?.iso2,
            contentProvider.country?.alpha2
        ) || null;

    const countryCellClass = isCompact ? 'text-gray-600 fs-8' : 'text-gray-600';
    const partnerLinkClass = isCompact
        ? 'text-gray-800 text-hover-primary fw-semibold fs-7'
        : 'text-gray-800 text-hover-primary fw-bold';
    const emailClass = isCompact ? 'text-gray-600 text-hover-primary d-block fs-8 mt-1' : 'text-gray-600 text-hover-primary d-block fs-7 mt-1';
    const dateContent = isCompact
        ? formatDate(contentProvider.created_at)
        : formatDateTime(contentProvider.created_at);
    const dateClass = isCompact ? 'text-gray-600 fs-8' : 'text-gray-700';

    return (
        <tr>
            {!hideCheckbox && (
                <td>
                    <div className="form-check form-check-sm form-check-custom form-check-solid">
                        <input
                            className="form-check-input"
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => onSelect(contentProvider.id, e.target.checked)}
                        />
                    </div>
                </td>
            )}

            <td className={isCompact ? 'py-2' : ''}>
                <div className="d-flex align-items-center">
                    {resolvedCountryCode && (
                        <img
                            src={`/flags/${String(resolvedCountryCode).toLowerCase()}.png`}
                            alt={resolvedCountryName || 'Country'}
                            className="me-1"
                            style={{ width: isCompact ? '16px' : '20px', height: isCompact ? '12px' : '15px', objectFit: 'cover' }}
                            onError={(e) => { e.target.style.display = 'none'; }}
                        />
                    )}
                    <span className={countryCellClass}>
                        {resolvedCountryName || (lookupLoading ? 'Loading…' : 'N/A')}
                    </span>
                </div>
            </td>

            {showParentColumn && (
                <td className={isCompact ? 'py-2' : ''}>
                    {(() => {
                        const parent =
                            contentProvider.parent_partner ||
                            contentProvider.parentPartner ||
                            contentProvider.parent;
                        if (!parent?.id) {
                            return <span className="text-muted fs-7">—</span>;
                        }
                        const pName = parent.business_name || parent.name || 'Parent';
                        return (
                            <Link
                                to={`/admin/partners/${parent.id}`}
                                className="text-gray-800 text-hover-primary fw-semibold fs-7 text-truncate d-inline-block"
                                style={{ maxWidth: '200px' }}
                                title={pName}
                            >
                                {pName}
                            </Link>
                        );
                    })()}
                </td>
            )}

            <td className={isCompact ? 'py-2' : ''}>
                <div className={`d-flex align-items-center ${isCompact ? 'gap-2' : 'gap-3'}`}>
                    <div className={isCompact ? 'symbol symbol-35px flex-shrink-0' : 'symbol symbol-50px'}>
                        {!displayInitial && logoUrl ? (
                            <img
                                src={logoUrl}
                                alt={contentProvider.business_name}
                                className="rounded"
                                style={isCompact ? { width: '35px', height: '35px', objectFit: 'cover' } : undefined}
                                onError={() => setLogoError(true)}
                            />
                        ) : (
                            <div
                                className={`symbol-label fw-semibold text-primary bg-light-primary ${isCompact ? 'fs-6' : 'fs-2'}`}
                            >
                                {fallbackLetter}
                            </div>
                        )}
                    </div>
                    <div className="d-flex flex-column min-w-0">
                        <Link to={`/admin/partners/${contentProvider.id}`} className={`${partnerLinkClass} text-truncate`}>
                            {contentProvider.business_name || contentProvider.name}
                        </Link>
                        {!isCompact && contentProvider.owner_name && (
                            <span className="text-muted fw-semibold d-block fs-7 mt-1">
                                {contentProvider.owner_name}
                            </span>
                        )}
                        {contentProvider.email && (
                            <a href={`mailto:${contentProvider.email}`} className={emailClass}>
                                {contentProvider.email}
                            </a>
                        )}
                    </div>
                </div>
            </td>

            <td className={isCompact ? 'py-2' : ''}>
                <span className={`text-gray-700 ${isCompact ? 'fs-8 fw-semibold' : 'fw-semibold'}`}>{categoryLabel}</span>
            </td>

            <td className={isCompact ? 'py-2' : ''}>
                <span className={dateClass}>{dateContent}</span>
            </td>

            <td className={isCompact ? 'py-2' : ''}>
                <span className={`badge ${getStatusBadgeClass(contentProvider.status)} ${isCompact ? 'fs-8' : ''}`}>
                    {contentProvider.status ? contentProvider.status.charAt(0).toUpperCase() + contentProvider.status.slice(1) : 'N/A'}
                </span>
            </td>

            <td className={`text-end ${isCompact ? 'py-2' : ''}`}>
                <div className="dropdown">
                    <button
                        ref={buttonRef}
                        className="btn btn-sm btn-light btn-active-light-primary"
                        type="button"
                        onClick={() => setShowActions(!showActions)}
                        onBlur={() => setTimeout(() => setShowActions(false), 200)}
                    >
                        Actions
                        <i className="ki-duotone ki-down fs-5 ms-1"></i>
                    </button>
                    {showActions && (
                        <div
                            className="dropdown-menu dropdown-menu-end show"
                            style={{
                                position: 'fixed',
                                top: `${dropdownPosition.top}px`,
                                right: `${dropdownPosition.right}px`,
                                left: 'auto',
                                zIndex: 1050,
                            }}
                        >
                            <Link
                                to={`/admin/partners/${contentProvider.id}`}
                                className="dropdown-item"
                                onMouseDown={(e) => e.preventDefault()}
                            >
                                <i className="ki-duotone ki-eye fs-5 me-2">
                                    <span className="path1"></span>
                                    <span className="path2"></span>
                                    <span className="path3"></span>
                                </i>
                                View
                            </Link>

                            {canEditContentProvider && (
                                <Link
                                    to={`/admin/partners/${contentProvider.id}/edit`}
                                    className="dropdown-item"
                                    onMouseDown={(e) => e.preventDefault()}
                                >
                                    <i className="ki-duotone ki-pencil fs-5 me-2">
                                        <span className="path1"></span>
                                        <span className="path2"></span>
                                    </i>
                                    Edit
                                </Link>
                            )}

                            {contentProvider.is_parent && !contentProvider.parent_id && (
                                <Link
                                    to={`/admin/partners/${contentProvider.id}?tab=sub-partners`}
                                    className="dropdown-item"
                                    onMouseDown={(e) => e.preventDefault()}
                                >
                                    <i className="ki-duotone ki-people fs-5 me-2">
                                        <span className="path1"></span>
                                        <span className="path2"></span>
                                        <span className="path3"></span>
                                        <span className="path4"></span>
                                        <span className="path5"></span>
                                    </i>
                                    Sub Partners
                                </Link>
                            )}

                            {['pending', 'requesting_updated'].includes(contentProvider.status) && onApprove && (
                                <button
                                    onMouseDown={(e) => { e.preventDefault(); onApprove(contentProvider.id); }}
                                    className="dropdown-item"
                                >
                                    <i className="ki-duotone ki-check fs-5 me-2">
                                        <span className="path1"></span>
                                        <span className="path2"></span>
                                    </i>
                                    Approve
                                </button>
                            )}

                            {['pending', 'requesting_updated'].includes(contentProvider.status) && onReject && (
                                <button
                                    onMouseDown={(e) => { e.preventDefault(); onReject(contentProvider); }}
                                    className="dropdown-item"
                                >
                                    <i className="ki-duotone ki-cross fs-5 me-2">
                                        <span className="path1"></span>
                                        <span className="path2"></span>
                                    </i>
                                    Reject
                                </button>
                            )}

                            {contentProvider.status !== 'suspended' && onSuspend && (
                                <button
                                    onMouseDown={(e) => { e.preventDefault(); onSuspend(contentProvider); }}
                                    className="dropdown-item"
                                >
                                    <i className="ki-duotone ki-lock fs-5 me-2">
                                        <span className="path1"></span>
                                        <span className="path2"></span>
                                    </i>
                                    Suspend
                                </button>
                            )}

                            {contentProvider.status === 'suspended' && onUnsuspend && (
                                <button
                                    onMouseDown={(e) => { e.preventDefault(); onUnsuspend(contentProvider.id); }}
                                    className="dropdown-item"
                                >
                                    <i className="ki-duotone ki-lock-2 fs-5 me-2">
                                        <span className="path1"></span>
                                        <span className="path2"></span>
                                    </i>
                                    Unsuspend
                                </button>
                            )}

                            {(contentProvider.user_id || contentProvider.user?.id) && onResetPassword && (
                                <button
                                    onMouseDown={(e) => { e.preventDefault(); onResetPassword(contentProvider); }}
                                    className="dropdown-item"
                                >
                                    <i className="ki-duotone ki-key fs-5 me-2">
                                        <span className="path1"></span>
                                        <span className="path2"></span>
                                    </i>
                                    Reset Password
                                </button>
                            )}

                            <div className="dropdown-divider"></div>

                            {canDeleteContentProvider && onDelete && (
                                <button
                                    onMouseDown={(e) => { e.preventDefault(); onDelete(contentProvider.id); }}
                                    className="dropdown-item text-danger"
                                >
                                    <i className="ki-duotone ki-trash fs-5 me-2">
                                        <span className="path1"></span>
                                        <span className="path2"></span>
                                        <span className="path3"></span>
                                        <span className="path4"></span>
                                        <span className="path5"></span>
                                    </i>
                                    Delete
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </td>
        </tr>
    );
};

export default ContentProviderTableRow;

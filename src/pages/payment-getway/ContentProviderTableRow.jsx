import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AUTH_SERVICE_BASE } from '../../utils/constants';
import { useCan } from '../../utils/permissions';
import { formatDateTime, formatDate } from '../../utils/helpers';
import ContentProviderModel from '../../services/ContentProviderModel';

const resolveAuthAssetUrl = (path) => {
    if (!path) return null;
    if (/^https?:\/\//i.test(path)) {
        return path;
    }

    const normalizedBase = AUTH_SERVICE_BASE.replace(/\/+$/, '');
    const normalizedPath = path.toString().replace(/^\/+/, '').replace(/\\/g, '/');
    return `${normalizedBase}/${normalizedPath}`;
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
    const { t } = useTranslation();
    const cp = useMemo(() => ContentProviderModel.ensure(contentProvider), [contentProvider]);
    const isCompact = variant === 'compact';
    const canEditContentProvider = useCan('pos.merchants.edit_merchants');
    const canDeleteContentProvider = useCan('pos.merchants.delete_merchants');
    const [showActions, setShowActions] = useState(false);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
    const buttonRef = useRef(null);
    const [logoError, setLogoError] = useState(false);
    const logoCandidate = cp.getLogoCandidate();

    useEffect(() => {
        setLogoError(false);
    }, [logoCandidate]);

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
    const displayName = cp.getDisplayName();
    const fallbackLetter = displayName ? displayName.charAt(0).toUpperCase() : 'C';

    const { name: resolvedCountryName, code: resolvedCountryCode } = cp.resolveCountryDisplay(
        lookupCountryName,
        lookupCountryCode
    );

    const categoryLabel = cp.getCategoryLabel();
    const parentLink = cp.getParentForLink();

    const countryCellClass = isCompact ? 'text-gray-600 fs-8' : 'text-gray-600';
    const partnerLinkClass = isCompact
        ? 'text-gray-800 text-hover-primary fw-semibold fs-7'
        : 'text-gray-800 text-hover-primary fw-bold';
    const emailClass = isCompact ? 'text-gray-600 text-hover-primary d-block fs-8 mt-1' : 'text-gray-600 text-hover-primary d-block fs-7 mt-1';
    const dateContent = isCompact ? formatDate(cp.created_at) : formatDateTime(cp.created_at);
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
                            onChange={(e) => onSelect(cp.id, e.target.checked)}
                        />
                    </div>
                </td>
            )}

            <td className={isCompact ? 'py-2' : ''}>
                <div className="d-flex align-items-center">
                    {resolvedCountryCode && (
                        <img
                            src={`/flags/${String(resolvedCountryCode).toLowerCase()}.png`}
                            alt={resolvedCountryName || t('admin.paymentGetway.cpCountryAlt')}
                            className="me-1"
                            style={{ width: isCompact ? '16px' : '20px', height: isCompact ? '12px' : '15px', objectFit: 'cover' }}
                            onError={(e) => { e.target.style.display = 'none'; }}
                        />
                    )}
                    <span className={countryCellClass}>
                        {resolvedCountryName || (lookupLoading ? t('admin.paymentGetway.cpLoading') : t('admin.paymentGetway.na'))}
                    </span>
                </div>
            </td>

            {showParentColumn && (
                <td className={isCompact ? 'py-2' : ''}>
                    {!parentLink ? (
                        <span className="text-muted fs-7">—</span>
                    ) : (
                        <Link
                            to={`/admin/partners/${parentLink.id}`}
                            className="text-gray-800 text-hover-primary fw-semibold fs-7 text-truncate d-inline-block"
                            style={{ maxWidth: '200px' }}
                            title={parentLink.name}
                        >
                            {parentLink.name}
                        </Link>
                    )}
                </td>
            )}

            <td className={isCompact ? 'py-2' : ''}>
                <div className={`d-flex align-items-center ${isCompact ? 'gap-2' : 'gap-3'}`}>
                    <div className={isCompact ? 'symbol symbol-35px flex-shrink-0' : 'symbol symbol-50px'}>
                        {!displayInitial && logoUrl ? (
                            <img
                                src={logoUrl}
                                alt={displayName}
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
                        <Link to={`/admin/partners/${cp.id}`} className={`${partnerLinkClass} text-truncate`}>
                            {displayName}
                        </Link>
                        {!isCompact && cp.owner_name && (
                            <span className="text-muted fw-semibold d-block fs-7 mt-1">
                                {cp.owner_name}
                            </span>
                        )}
                        {cp.email && (
                            <a href={`mailto:${cp.email}`} className={emailClass}>
                                {cp.email}
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
                <span className={`badge ${getStatusBadgeClass(cp.status)} ${isCompact ? 'fs-8' : ''}`}>
                    {cp.status ? cp.status.charAt(0).toUpperCase() + cp.status.slice(1) : t('admin.paymentGetway.na')}
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
                        {t('admin.paymentGetway.cpActions')}
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
                                to={`/admin/partners/${cp.id}`}
                                className="dropdown-item"
                                onMouseDown={(e) => e.preventDefault()}
                            >
                                <i className="ki-duotone ki-eye fs-5 me-2">
                                    <span className="path1"></span>
                                    <span className="path2"></span>
                                    <span className="path3"></span>
                                </i>
                                {t('admin.common.view')}
                            </Link>

                            {canEditContentProvider && (
                                <Link
                                    to={`/admin/partners/${cp.id}/edit`}
                                    className="dropdown-item"
                                    onMouseDown={(e) => e.preventDefault()}
                                >
                                    <i className="ki-duotone ki-pencil fs-5 me-2">
                                        <span className="path1"></span>
                                        <span className="path2"></span>
                                    </i>
                                    {t('admin.common.edit')}
                                </Link>
                            )}

                            {cp.is_parent && !cp.parent_id && (
                                <Link
                                    to={`/admin/partners/${cp.id}?tab=sub-partners`}
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
                                    {t('admin.paymentGetway.cpSubPartners')}
                                </Link>
                            )}

                            {['pending', 'requesting_updated'].includes(cp.status) && onApprove && (
                                <button
                                    onMouseDown={(e) => { e.preventDefault(); onApprove(cp.id); }}
                                    className="dropdown-item"
                                >
                                    <i className="ki-duotone ki-check fs-5 me-2">
                                        <span className="path1"></span>
                                        <span className="path2"></span>
                                    </i>
                                    {t('admin.common.approve')}
                                </button>
                            )}

                            {['pending', 'requesting_updated'].includes(cp.status) && onReject && (
                                <button
                                    onMouseDown={(e) => { e.preventDefault(); onReject(cp); }}
                                    className="dropdown-item"
                                >
                                    <i className="ki-duotone ki-cross fs-5 me-2">
                                        <span className="path1"></span>
                                        <span className="path2"></span>
                                    </i>
                                    {t('admin.common.reject')}
                                </button>
                            )}

                            {cp.status !== 'suspended' && onSuspend && (
                                <button
                                    onMouseDown={(e) => { e.preventDefault(); onSuspend(cp); }}
                                    className="dropdown-item"
                                >
                                    <i className="ki-duotone ki-lock fs-5 me-2">
                                        <span className="path1"></span>
                                        <span className="path2"></span>
                                    </i>
                                    {t('admin.common.suspend')}
                                </button>
                            )}

                            {cp.status === 'suspended' && onUnsuspend && (
                                <button
                                    onMouseDown={(e) => { e.preventDefault(); onUnsuspend(cp.id); }}
                                    className="dropdown-item"
                                >
                                    <i className="ki-duotone ki-lock-2 fs-5 me-2">
                                        <span className="path1"></span>
                                        <span className="path2"></span>
                                    </i>
                                    {t('admin.common.unsuspend')}
                                </button>
                            )}

                            {cp.hasLinkedUser && onResetPassword && (
                                <button
                                    onMouseDown={(e) => { e.preventDefault(); onResetPassword(cp); }}
                                    className="dropdown-item"
                                >
                                    <i className="ki-duotone ki-key fs-5 me-2">
                                        <span className="path1"></span>
                                        <span className="path2"></span>
                                    </i>
                                    {t('admin.paymentGetway.cpResetPassword')}
                                </button>
                            )}

                            <div className="dropdown-divider"></div>

                            {canDeleteContentProvider && onDelete && (
                                <button
                                    onMouseDown={(e) => { e.preventDefault(); onDelete(cp.id); }}
                                    className="dropdown-item text-danger"
                                >
                                    <i className="ki-duotone ki-trash fs-5 me-2">
                                        <span className="path1"></span>
                                        <span className="path2"></span>
                                        <span className="path3"></span>
                                        <span className="path4"></span>
                                        <span className="path5"></span>
                                    </i>
                                    {t('admin.common.delete')}
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

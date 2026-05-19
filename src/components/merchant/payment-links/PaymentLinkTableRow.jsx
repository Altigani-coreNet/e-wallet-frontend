import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { deletePaymentLink } from '../../../services/paymentLinksService';
import Swal from 'sweetalert2';
import { useCan } from '../../../utils/permissions';
import useAuthStore from '../../../stores/authStore';

const PaymentLinkTableRow = ({
    paymentLink,
    isSelected,
    onSelect,
    onRefresh,
    onReschedule,
    onSend
}) => {
    const { t, i18n } = useTranslation();
    const { formatRecordCurrency } = useAuthStore();
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);
    const triggerRef = useRef(null);
    const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
    const canView = useCan('pos.payment_links.view');
    const canEdit = useCan('pos.payment_links.edit');
    const canDelete = useCan('pos.payment_links.delete');

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };

        if (showDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showDropdown]);

    const toggleDropdown = () => {
        setShowDropdown(!showDropdown);
    };

    const updateDropdownPosition = () => {
        if (!triggerRef.current) return;
        const rect = triggerRef.current.getBoundingClientRect();
        const menuWidth = 220; // close to w-200px + padding
        const viewportPadding = 12;
        const left = Math.min(
            Math.max(viewportPadding, rect.right - menuWidth),
            window.innerWidth - menuWidth - viewportPadding
        );
        const top = rect.bottom + 8;
        setDropdownPos({ top, left });
    };

    useEffect(() => {
        if (!showDropdown) return;
        updateDropdownPosition();
        const onReposition = () => updateDropdownPosition();
        window.addEventListener('resize', onReposition);
        window.addEventListener('scroll', onReposition, true);
        return () => {
            window.removeEventListener('resize', onReposition);
            window.removeEventListener('scroll', onReposition, true);
        };
    }, [showDropdown]);

    const handleDelete = async () => {
        setShowDropdown(false);
        const result = await Swal.fire({
            title: t('merchant.paymentLinks.row.deleteConfirmTitle'),
            text: t('merchant.paymentLinks.row.deleteConfirmText'),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: t('merchant.common.yesDelete'),
            cancelButtonText: t('merchant.common.cancel')
        });

        if (result.isConfirmed) {
            try {
                const response = await deletePaymentLink(paymentLink.id);
                if (response.success) {
                    await Swal.fire({
                        title: t('merchant.paymentLinks.row.deleteSuccessTitle'),
                        text: t('merchant.paymentLinks.row.deleteSuccessText'),
                        icon: 'success',
                        timer: 2000,
                        showConfirmButton: false
                    });
                    onRefresh();
                } else {
                    Swal.fire(t('merchant.paymentLinks.row.deleteErrorTitle'), response.error || t('merchant.paymentLinks.row.deleteFailed'), 'error');
                }
            } catch (error) {
                Swal.fire(t('merchant.paymentLinks.row.deleteErrorTitle'), t('merchant.paymentLinks.unexpectedError'), 'error');
            }
        }
    };

    const getStatusBadge = (status) => {
        const statusClasses = {
            'active': 'badge-light-success',
            'inactive': 'badge-light-danger',
            'expired': 'badge-light-warning',
            'completed': 'badge-light-info',
            'scheduled': 'badge-light-primary'
        };

        const statusClass = statusClasses[status?.toLowerCase()] || 'badge-light-secondary';
        const key = status?.toLowerCase();
        const label = key
            ? t(`merchant.paymentLinks.status.${key}`, { defaultValue: status.charAt(0).toUpperCase() + status.slice(1) })
            : t('merchant.common.na');
        return (
            <span className={`badge ${statusClass}`}>
                {label}
            </span>
        );
    };

    const formatDate = (date) => {
        if (!date) return t('merchant.common.na');
        const loc = (i18n.language || 'en').toLowerCase().startsWith('ar') ? 'ar-SA' : 'en-US';
        return new Date(date).toLocaleString(loc, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatScheduledDate = (date) => {
        if (!date) return '';
        const scheduledDate = new Date(date);
        const now = new Date();
        const diffTime = scheduledDate - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return t('merchant.paymentLinks.scheduled.pastDue');
        } else if (diffDays === 0) {
            return t('merchant.paymentLinks.scheduled.today');
        } else if (diffDays === 1) {
            return t('merchant.paymentLinks.scheduled.tomorrow');
        } else if (diffDays < 7) {
            return t('merchant.paymentLinks.scheduled.inDays', { count: diffDays });
        } else {
            return formatDate(date);
        }
    };

    const getPaymentLinkUrl = () => {
        return `${window.location.origin}/payments?uuid=${paymentLink.uuid}`;
    };

    const handleCopyLink = () => {
        const url = getPaymentLinkUrl();
        navigator.clipboard.writeText(url).then(() => {
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'success',
                title: t('merchant.paymentLinks.row.linkCopied'),
                showConfirmButton: false,
                timer: 2000
            });
        });
    };

    return (
        <tr>
            <td>
                <div className="form-check form-check-sm form-check-custom form-check-solid">
                    <input
                        className="form-check-input"
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onSelect(paymentLink.id)}
                    />
                </div>
            </td>
            <td>
                <span className="text-gray-800 text-hover-primary mb-1">
                    {paymentLink.id}
                </span>
            </td>
            <td>
                <span className="text-gray-800 fw-bold">
                    {paymentLink.uuid || t('merchant.common.na')}
                </span>
            </td>
            <td>
                <div className="d-flex align-items-center">
                    <div className="d-flex flex-column">
                        <span className="text-gray-800 text-hover-primary mb-1">
                            {paymentLink.customer_name || t('merchant.common.na')}
                        </span>
                        {paymentLink.customer_email && (
                            <span className="text-muted fs-7">
                                {paymentLink.customer_email}
                            </span>
                        )}
                        {paymentLink.customer_phone && (
                            <span className="text-muted fs-7">
                                {paymentLink.customer_phone}
                            </span>
                        )}
                    </div>
                </div>
            </td>
            <td>
                <span className="text-gray-800 fw-bold">
                    {formatRecordCurrency(paymentLink.amount, paymentLink)}
                </span>
            </td>
            <td>
                <span className="text-gray-600">
                    {paymentLink.currency_code || t('merchant.common.na')}
                </span>
            </td>
            <td>
                {getStatusBadge(paymentLink.status)}
            </td>
            <td>
                <span className="text-gray-600">
                    {formatDate(paymentLink.created_at)}
                </span>
            </td>
            <td>
                <span className="text-gray-600">
                    {formatScheduledDate(paymentLink.scheduled_date)}
                </span>
            </td>
            <td className="text-end">
                <div className="position-relative" ref={dropdownRef}>
                    <button
                        ref={triggerRef}
                        type="button"
                        className="btn btn-sm btn-icon btn-light btn-active-light-primary"
                        onClick={toggleDropdown}
                    >
                        <i className="ki-duotone ki-category fs-5 m-0">
                            <span className="path1"></span>
                            <span className="path2"></span>
                            <span className="path3"></span>
                            <span className="path4"></span>
                        </i>
                    </button>
                    {showDropdown && (
                        <div 
                            className="menu menu-sub menu-sub-dropdown menu-column menu-rounded menu-gray-600 menu-state-bg-light-primary fw-semibold fs-7 w-200px py-4 show" 
                            style={{
                                position: 'fixed',
                                top: `${dropdownPos.top}px`,
                                left: `${dropdownPos.left}px`,
                                zIndex: 2000
                            }}
                        >
                            {canView && (
                                <div className="menu-item px-3">
                                    <Link
                                        to={`/merchant/payment-links/${paymentLink.id}`}
                                        className="menu-link px-3"
                                    >
                                        <i className="ki-duotone ki-eye fs-5 me-2">
                                            <span className="path1"></span>
                                            <span className="path2"></span>
                                            <span className="path3"></span>
                                        </i>
                                        {t('merchant.paymentLinks.row.view')}
                                    </Link>
                                </div>
                            )}
                            {canEdit && (
                                <div className="menu-item px-3">
                                    <Link
                                        to={`/merchant/payment-links/${paymentLink.id}/edit`}
                                        className="menu-link px-3"
                                    >
                                        <i className="ki-duotone ki-pencil fs-5 me-2">
                                            <span className="path1"></span>
                                            <span className="path2"></span>
                                        </i>
                                        {t('merchant.paymentLinks.row.edit')}
                                    </Link>
                                </div>
                            )}
                            <div className="menu-item px-3">
                                <button
                                    onClick={handleCopyLink}
                                    className="menu-link px-3 w-100 text-start"
                                >
                                    <i className="ki-duotone ki-copy fs-5 me-2">
                                        <span className="path1"></span>
                                        <span className="path2"></span>
                                    </i>
                                    {t('merchant.paymentLinks.row.copyLink')}
                                </button>
                            </div>
                            {canEdit && (
                                <div className="menu-item px-3">
                                    <button
                                        onClick={() => {
                                            setShowDropdown(false);
                                            onSend(paymentLink);
                                        }}
                                        className="menu-link px-3 w-100 text-start"
                                    >
                                        <i className="ki-duotone ki-send fs-5 me-2">
                                            <span className="path1"></span>
                                            <span className="path2"></span>
                                        </i>
                                        {t('merchant.paymentLinks.row.send')}
                                    </button>
                                </div>
                            )}
                            {canEdit && (
                                <div className="menu-item px-3">
                                    <button
                                        onClick={() => {
                                            setShowDropdown(false);
                                            onReschedule(paymentLink);
                                        }}
                                        className="menu-link px-3 w-100 text-start"
                                    >
                                        <i className="ki-duotone ki-calendar fs-5 me-2">
                                            <span className="path1"></span>
                                            <span className="path2"></span>
                                        </i>
                                        {t('merchant.paymentLinks.row.reschedule')}
                                    </button>
                                </div>
                            )}
                            <div className="separator my-2"></div>
                            {canDelete && (
                                <div className="menu-item px-3">
                                    <button
                                        onClick={handleDelete}
                                        className="menu-link px-3 w-100 text-start text-danger"
                                    >
                                        <i className="ki-duotone ki-trash fs-5 me-2">
                                            <span className="path1"></span>
                                            <span className="path2"></span>
                                            <span className="path3"></span>
                                            <span className="path4"></span>
                                            <span className="path5"></span>
                                        </i>
                                        {t('merchant.paymentLinks.row.delete')}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </td>
        </tr>
    );
};

export default PaymentLinkTableRow;


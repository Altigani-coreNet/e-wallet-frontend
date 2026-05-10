import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Swal from 'sweetalert2';

const AdminPaymentLinkTableRow = ({ paymentLink, merchantsMap = {}, countriesMap = {} }) => {
    const { t, i18n } = useTranslation();
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);

    const resolveDisplayValue = (...values) => {
        for (const value of values) {
            if (value === 0) return '0';
            if (typeof value === 'string' && value.trim() !== '') {
                return value;
            }
            if (value && typeof value !== 'string') {
                return value;
            }
        }
        return t('admin.paymentLinksIndex.na');
    };

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

    const toggleDropdown = () => setShowDropdown((prev) => !prev);

    const formatDate = (date) => {
        if (!date) return t('admin.paymentLinksIndex.na');
        return new Date(date).toLocaleString(i18n.language === 'ar' ? 'ar-EG' : 'en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatAmount = (amount, currencySymbol = '$', currencyCode = 'USD') => {
        const numericAmount = Number(amount);
        if (Number.isNaN(numericAmount)) {
            return `${currencySymbol}0.00 ${currencyCode}`;
        }
        return `${currencySymbol}${numericAmount.toFixed(2)} ${currencyCode}`;
    };

    const getStatusBadge = (status) => {
        const statusClasses = {
            active: 'badge-light-success',
            inactive: 'badge-light-danger',
            expired: 'badge-light-warning',
            completed: 'badge-light-info',
            scheduled: 'badge-light-primary',
        };

        const statusLabels = {
            active: t('admin.paymentLinksIndex.statusActive'),
            inactive: t('admin.paymentLinksIndex.statusInactive'),
            expired: t('admin.paymentLinksIndex.statusExpired'),
            completed: t('admin.paymentLinksIndex.statusCompleted'),
            scheduled: t('admin.paymentLinksIndex.statusScheduled'),
        };

        const value = status?.toLowerCase();
        const statusClass = statusClasses[value] || 'badge-light-secondary';
        const label = statusLabels[value] || (status ? status.charAt(0).toUpperCase() + status.slice(1) : t('admin.paymentLinksIndex.na'));
        
        return (
            <span className={`badge ${statusClass}`}>
                {label}
            </span>
        );
    };

    const handleCopyLink = () => {
        if (!paymentLink?.uuid) {
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'info',
                title: t('admin.paymentLinksIndex.noLinkToCopy'),
                showConfirmButton: false,
                timer: 2000,
            });
            return;
        }

        const url = `${window.location.origin}/payment/${paymentLink.uuid}`;
        navigator.clipboard.writeText(url).then(() => {
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'success',
                title: t('admin.paymentLinksIndex.linkCopied'),
                showConfirmButton: false,
                timer: 2000,
            });
        });
    };

    return (
        <tr>
            <td>
                <span className="text-gray-800 fw-bold">{paymentLink.id}</span>
            </td>
            <td>
                <span className="text-gray-800 fw-semibold">{paymentLink.uuid || t('admin.paymentLinksIndex.na')}</span>
            </td>
            <td>
                <span className="text-gray-600">
                    {resolveDisplayValue(
                        paymentLink.merchant_name,
                        merchantsMap[paymentLink.merchant_id],
                        paymentLink.merchant?.name
                    )}
                </span>
            </td>
            <td>
                <span className="text-gray-600">
                    {resolveDisplayValue(
                        paymentLink.country_name,
                        countriesMap[paymentLink.country_id],
                        paymentLink.country?.name
                    )}
                </span>
            </td>
            <td>
                <div className="d-flex flex-column">
                    <span className="text-gray-800">{paymentLink.customer_name || t('admin.paymentLinksIndex.na')}</span>
                    {paymentLink.customer_email && (
                        <span className="text-muted fs-7">{paymentLink.customer_email}</span>
                    )}
                    {paymentLink.customer_phone && (
                        <span className="text-muted fs-7">{paymentLink.customer_phone}</span>
                    )}
                </div>
            </td>
            <td>
                <span className="text-gray-800 fw-bold">
                    {formatAmount(paymentLink.amount, paymentLink.currency_symbol, paymentLink.currency_code)}
                </span>
            </td>
            <td>{getStatusBadge(paymentLink.status)}</td>
            <td>
                <span className="text-gray-600">{formatDate(paymentLink.created_at)}</span>
            </td>
            <td>
                <span className="text-gray-600">{formatDate(paymentLink.scheduled_date)}</span>
            </td>
            <td>
                <span className="text-gray-600">{formatDate(paymentLink.expired_date)}</span>
            </td>
            <td className="text-end">
                <div className="position-relative" ref={dropdownRef}>
                    <button
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
                                position: 'absolute',
                                right: 0,
                                top: '100%',
                                zIndex: 105,
                                marginTop: '0.5rem',
                            }}
                        >
                            <div className="menu-item px-3">
                                <Link
                                    to={`/admin/payment-links/${paymentLink.id}`}
                                    className="menu-link px-3"
                                >
                                    <i className="ki-duotone ki-eye fs-5 me-2">
                                        <span className="path1"></span>
                                        <span className="path2"></span>
                                        <span className="path3"></span>
                                    </i>
                                    {t('admin.paymentLinksIndex.view')}
                                </Link>
                            </div>
                            <div className="menu-item px-3">
                                <button
                                    onClick={() => {
                                        setShowDropdown(false);
                                        handleCopyLink();
                                    }}
                                    className="menu-link px-3 w-100 text-start"
                                >
                                    <i className="ki-duotone ki-copy fs-5 me-2">
                                        <span className="path1"></span>
                                        <span className="path2"></span>
                                    </i>
                                    {t('admin.paymentLinksIndex.copyLink')}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </td>
        </tr>
    );
};

export default AdminPaymentLinkTableRow;


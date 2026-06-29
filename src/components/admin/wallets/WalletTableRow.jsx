import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCan } from '../../../utils/permissions';
import { fmtMoney } from '../../../utils/walletMoney';

const WalletTableRow = ({ wallet, rowNumber, onSuspend, onActivate, onDelete }) => {
    const { t } = useTranslation();
    const canEdit = useCan(['sales.customers.edit_customers', 'edit_customers']);
    const canDelete = useCan(['sales.customers.delete_customers', 'delete_customers']);
    const [showActions, setShowActions] = useState(false);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
    const buttonRef = useRef(null);

    const owner = wallet.owner || {};
    const isMaster = wallet.isMaster;

    useEffect(() => {
        if (showActions && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setDropdownPosition({
                top: rect.bottom + 4,
                right: window.innerWidth - rect.right,
            });
        }
    }, [showActions]);

    const handleAction = (action) => {
        setShowActions(false);
        action?.();
    };

    return (
        <tr>
            <td>{rowNumber}</td>
            <td>
                <div className="d-flex flex-column">
                    <span className="text-gray-800 fw-bold">{wallet.wallet_id}</span>
                    <span className="text-muted fs-7">{wallet.user_number}</span>
                </div>
            </td>
            <td>
                <span className={`badge ${wallet.typeBadgeClass}`}>
                    {t(wallet.typeLabelKey)}
                </span>
            </td>
            <td>
                <div className="d-flex flex-column">
                    <span className="text-gray-800 fw-bold">{wallet.ownerDisplayName}</span>
                    <span className="text-muted fs-7">
                        {isMaster ? t('admin.wallets.masterEquityHint') : (owner.phone || owner.email || '-')}
                    </span>
                </div>
            </td>
            <td>{owner.merchant_name || '-'}</td>
            <td className="text-end fw-bold">{fmtMoney(wallet.balance)} {wallet.currency_code}</td>
            <td>
                <span className={`badge ${wallet.statusBadgeClass}`}>
                    {t(`admin.wallets.status${wallet.status.charAt(0).toUpperCase()}${wallet.status.slice(1)}`, wallet.status)}
                </span>
            </td>
            <td>{wallet.created_at ? new Date(wallet.created_at).toLocaleDateString() : '-'}</td>
            <td className="text-end">
                <div className="position-relative">
                    <button
                        ref={buttonRef}
                        className="btn btn-sm btn-light btn-active-light-primary"
                        onClick={() => setShowActions(!showActions)}
                    >
                        {t('common.actions')}
                        <i className="ki-duotone ki-down fs-5 ms-1"></i>
                    </button>

                    {showActions && (
                        <>
                            <div
                                className="position-fixed top-0 start-0 w-100 h-100"
                                style={{ zIndex: 99 }}
                                onClick={() => setShowActions(false)}
                            />
                            <div
                                className="menu menu-sub menu-sub-dropdown menu-column menu-rounded menu-gray-600 menu-state-bg-light-primary fw-semibold fs-7 w-175px py-4 show"
                                style={{ position: 'fixed', zIndex: 100, top: dropdownPosition.top, right: dropdownPosition.right }}
                            >
                                <div className="menu-item px-3">
                                    <Link
                                        to={`/admin/wallets/${wallet.id}`}
                                        className="menu-link px-3"
                                        onClick={() => setShowActions(false)}
                                    >
                                        <i className="ki-duotone ki-eye fs-4 me-2">
                                            <span className="path1"></span>
                                            <span className="path2"></span>
                                            <span className="path3"></span>
                                        </i>
                                        {t('common.view')}
                                    </Link>
                                </div>
                                {canEdit && wallet.status === 'active' && !isMaster && (
                                    <div className="menu-item px-3">
                                        <button
                                            type="button"
                                            className="menu-link px-3 w-100 text-start text-warning"
                                            onClick={() => handleAction(() => onSuspend?.(wallet.id))}
                                        >
                                            {t('admin.wallets.suspend')}
                                        </button>
                                    </div>
                                )}
                                {canEdit && wallet.status === 'frozen' && !isMaster && (
                                    <div className="menu-item px-3">
                                        <button
                                            type="button"
                                            className="menu-link px-3 w-100 text-start text-success"
                                            onClick={() => handleAction(() => onActivate?.(wallet.id))}
                                        >
                                            {t('admin.wallets.activate')}
                                        </button>
                                    </div>
                                )}
                                {canDelete && wallet.status !== 'closed' && !isMaster && (
                                    <div className="menu-item px-3">
                                        <button
                                            type="button"
                                            className="menu-link px-3 w-100 text-start text-danger"
                                            onClick={() => handleAction(() => onDelete?.(wallet.id))}
                                        >
                                            {t('common.delete')}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </td>
        </tr>
    );
};

export default WalletTableRow;

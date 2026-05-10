import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { deletePaymentGateway, togglePaymentGatewayStatus } from '../../../services/adminPaymentGatewaysService';
import { useCan } from '../../../utils/permissions';

const PaymentGatewayTableRow = ({ paymentGateway, isSelected, onSelect, onRefresh }) => {
    const { t } = useTranslation();
    const canEdit = useCan('pos.roles.edit_roles'); // Using similar permission for now
    const canDelete = useCan('pos.roles.delete_roles'); // Using similar permission for now
    const [showActions, setShowActions] = useState(false);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });
    const buttonRef = useRef(null);

    useEffect(() => {
        if (showActions && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setDropdownPosition({
                top: rect.bottom + window.scrollY,
                right: window.innerWidth - rect.right + window.scrollX
            });
        }
    }, [showActions]);

    const handleDelete = async () => {
        if (!window.confirm(t('admin.paymentGatewaysIndex.deleteConfirm'))) {
            return;
        }

        try {
            const response = await deletePaymentGateway(paymentGateway.id);
            if (response.success) {
                toast.success(t('admin.paymentGatewaysIndex.deleteSuccess'));
                onRefresh();
            } else {
                toast.error(response.error || t('admin.paymentGatewaysIndex.deleteFailed'));
            }
        } catch (error) {
            console.error('Error deleting payment gateway:', error);
            toast.error(t('admin.paymentGatewaysIndex.deleteFailed'));
        }
    };

    const handleToggleStatus = async (e) => {
        e.stopPropagation();
        const newStatus = !paymentGateway.is_active;
        
        try {
            const response = await togglePaymentGatewayStatus(paymentGateway.id, newStatus);
            if (response.success) {
                toast.success(t('admin.paymentGatewaysIndex.statusUpdateSuccess'));
                onRefresh();
            } else {
                toast.error(response.error || t('admin.paymentGatewaysIndex.statusUpdateFailed'));
            }
        } catch (error) {
            console.error('Error toggling status:', error);
            toast.error(t('admin.paymentGatewaysIndex.statusUpdateFailed'));
        }
    };

    const logoUrl = paymentGateway.logo 
        ? `/${paymentGateway.logo}`
        : paymentGateway.alias 
            ? `/payment-gateway/${paymentGateway.alias}.png`
            : '/placeholder-logo.png';

    return (
        <tr>
            <td>
                <div className="form-check form-check-sm form-check-custom form-check-solid">
                    <input
                        className="form-check-input"
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onSelect(paymentGateway.id)}
                    />
                </div>
            </td>
            <td>
                <div className="d-flex align-items-center">
                    {paymentGateway.logo && (
                        <div className="symbol symbol-50px me-3">
                            <img src={logoUrl} alt={paymentGateway.name} className="w-100" />
                        </div>
                    )}
                    <Link to={`/admin/payment-gateways/${paymentGateway.id}`} className="text-gray-800 text-hover-primary fw-bold">
                        {paymentGateway.name}
                    </Link>
                </div>
            </td>
            <td>{paymentGateway.title}</td>
            <td>
                <span className={`badge badge-${paymentGateway.mode === 'live' ? 'success' : 'warning'}`}>
                    {paymentGateway.mode}
                </span>
            </td>
            <td>{paymentGateway.alias || '-'}</td>
            <td>
                <div className="form-check form-switch form-check-custom form-check-solid">
                    <input
                        className="form-check-input"
                        type="checkbox"
                        checked={paymentGateway.is_active}
                        onChange={handleToggleStatus}
                    />
                </div>
            </td>
            <td>{new Date(paymentGateway.created_at).toLocaleDateString()}</td>
            <td className="text-end">
                <div className="dropdown">
                    <button
                        ref={buttonRef}
                        className="btn btn-sm btn-light btn-active-light-primary"
                        type="button"
                        onClick={() => setShowActions(!showActions)}
                        onBlur={() => setTimeout(() => setShowActions(false), 200)}
                    >
                        {t('admin.common.actions')}
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
                                zIndex: 1050 
                            }}
                        >
                            <Link 
                                to={`/admin/payment-gateways/${paymentGateway.id}`} 
                                className="dropdown-item"
                                onMouseDown={(e) => e.preventDefault()}
                            >
                                <i className="ki-duotone ki-eye fs-5 me-2">
                                    <span className="path1"></span>
                                    <span className="path2"></span>
                                    <span className="path3"></span>
                                </i>
                                {t('admin.paymentGatewaysIndex.view')}
                            </Link>
                            
                            {canEdit && (
                                <Link 
                                    to={`/admin/payment-gateways/${paymentGateway.id}/edit`} 
                                    className="dropdown-item"
                                    onMouseDown={(e) => e.preventDefault()}
                                >
                                    <i className="ki-duotone ki-pencil fs-5 me-2">
                                        <span className="path1"></span>
                                        <span className="path2"></span>
                                    </i>
                                    {t('admin.paymentGatewaysIndex.edit')}
                                </Link>
                            )}
                            
                            {canDelete && (
                                <>
                                    <div className="dropdown-divider"></div>
                                    
                                    <button 
                                        onMouseDown={(e) => { e.preventDefault(); handleDelete(); }} 
                                        className="dropdown-item text-danger"
                                    >
                                        <i className="ki-duotone ki-trash fs-5 me-2">
                                            <span className="path1"></span>
                                            <span className="path2"></span>
                                            <span className="path3"></span>
                                            <span className="path4"></span>
                                            <span className="path5"></span>
                                        </i>
                                        {t('admin.paymentGatewaysIndex.delete')}
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </td>
        </tr>
    );
};

export default PaymentGatewayTableRow;

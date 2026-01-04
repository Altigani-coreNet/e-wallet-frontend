import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { togglePaymentGatewayStatus } from '../../../services/paymentGatewaysService';

const PaymentGatewayTableRow = ({ paymentGateway, onRefresh }) => {
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

    const handleToggleStatus = async (e) => {
        e.stopPropagation();
        const newStatus = !paymentGateway.is_active;
        
        try {
            const response = await togglePaymentGatewayStatus(paymentGateway.name, newStatus);
            if (response.success) {
                toast.success('Payment gateway status updated successfully');
                onRefresh();
            } else {
                toast.error(response.error || 'Failed to update status');
            }
        } catch (error) {
            console.error('Error toggling status:', error);
            toast.error('Failed to update status');
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
                <div className="d-flex align-items-center">
                    {paymentGateway.logo && (
                        <div className="symbol symbol-50px me-3">
                            <img src={logoUrl} alt={paymentGateway.name} className="w-100" />
                        </div>
                    )}
                    <Link to={`/merchant/payment-gateways/${paymentGateway.name}`} className="text-gray-800 text-hover-primary fw-bold">
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
            <td>
                {paymentGateway.has_shop_config ? (
                    <span className="badge badge-success">Configured</span>
                ) : (
                    <span className="badge badge-light">Not Configured</span>
                )}
            </td>
            <td className="text-end">
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
                                zIndex: 1050 
                            }}
                        >
                            <Link 
                                to={`/merchant/payment-gateways/${paymentGateway.name}`} 
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
                            
                            <Link 
                                to={`/merchant/payment-gateways/${paymentGateway.name}/edit`} 
                                className="dropdown-item"
                                onMouseDown={(e) => e.preventDefault()}
                            >
                                <i className="ki-duotone ki-pencil fs-5 me-2">
                                    <span className="path1"></span>
                                    <span className="path2"></span>
                                </i>
                                Configure
                            </Link>
                        </div>
                    )}
                </div>
            </td>
        </tr>
    );
};

export default PaymentGatewayTableRow;

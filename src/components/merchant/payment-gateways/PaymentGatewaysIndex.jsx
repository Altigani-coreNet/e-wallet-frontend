import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { useToolbar } from '../../../contexts/ToolbarContext';
import { getPaymentGateways, updatePaymentGateway, togglePaymentGatewayStatus, setPaymentGatewayAsDefault, deletePaymentGateway } from '../../../services/paymentGatewaysService';

const PaymentGatewaysIndex = () => {
    const { t, i18n } = useTranslation();
    const { setTitle, setBreadcrumbs, setActions } = useToolbar();
    const [paymentGateways, setPaymentGateways] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updatingGateways, setUpdatingGateways] = useState({});
    const [togglingGateways, setTogglingGateways] = useState({});
    const [gatewayForms, setGatewayForms] = useState({});
    const [dropdownOpen, setDropdownOpen] = useState({});
    const [errors, setErrors] = useState({});

    useEffect(() => {
        setTitle(t('merchant.breadcrumbs.paymentProviders'));
        setBreadcrumbs([
            { label: t('merchant.breadcrumbs.dashboard'), path: '/merchant/dashboard' },
            { label: t('merchant.breadcrumbs.paymentProviders'), path: '/merchant/payment-gateways', active: true }
        ]);
        setActions(null);
        return () => {
            setBreadcrumbs([]);
            setActions(null);
        };
    }, [setTitle, setBreadcrumbs, setActions, t, i18n.language]);

    useEffect(() => {
        fetchPaymentGateways();
    }, []);

    const fetchPaymentGateways = async () => {
        setLoading(true);
        try {
            const response = await getPaymentGateways();
            if (response.success) {
                const data = response.data.data?.data || response.data.data || [];
                const gateways = Array.isArray(data) ? data : [];
                setPaymentGateways(gateways);
                
                // Initialize form data for each gateway
                const forms = {};
                gateways.forEach(gateway => {
                    // Get config as object or empty object
                    let configObj = {};
                    if (gateway.config && typeof gateway.config === 'object') {
                        configObj = gateway.config;
                    }
                    
                    forms[gateway.name] = {
                        mode: gateway.mode || 'test',
                        is_active: gateway.is_active || false,
                        config: Object.entries(configObj).map(([key, value]) => ({ 
                            key, 
                            value: String(value || ''),
                            required: true // All admin fields are required
                        }))
                    };
                });
                setGatewayForms(forms);
            } else {
                toast.error(response.error || 'Failed to fetch payment gateways');
            }
        } catch (error) {
            console.error('Error fetching payment gateways:', error);
            toast.error('Failed to fetch payment gateways');
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async (gatewayName, isActive) => {
        // Update local state immediately (optimistic update)
        setGatewayForms(prev => ({
            ...prev,
            [gatewayName]: {
                ...prev[gatewayName],
                is_active: isActive
            }
        }));

        // If gateway already has shop config, save status change via toggle API
        const gateway = paymentGateways.find(g => g.name === gatewayName);
        if (gateway?.has_shop_config) {
            // Set loading state for this specific gateway only
            setTogglingGateways(prev => ({ ...prev, [gatewayName]: true }));

            try {
                const response = await togglePaymentGatewayStatus(gatewayName, isActive);
                if (response.success) {
                    toast.success(`Payment gateway ${isActive ? 'enabled' : 'disabled'} successfully`);
                    
                    // Update local state with the response data instead of refetching
                    const updatedGateway = response.data.data?.data || response.data.data;
                    if (updatedGateway) {
                        setPaymentGateways(prev => prev.map(g => 
                            g.name === gatewayName ? { ...g, ...updatedGateway } : g
                        ));
                    }
                } else {
                    // Revert the toggle on error
                    setGatewayForms(prev => ({
                        ...prev,
                        [gatewayName]: {
                            ...prev[gatewayName],
                            is_active: !isActive
                        }
                    }));
                    toast.error(response.error || 'Failed to toggle payment gateway status');
                }
            } catch (error) {
                // Revert the toggle on error
                setGatewayForms(prev => ({
                    ...prev,
                    [gatewayName]: {
                        ...prev[gatewayName],
                        is_active: !isActive
                    }
                }));
                console.error('Error toggling payment gateway status:', error);
                toast.error('Failed to toggle payment gateway status');
            } finally {
                setTogglingGateways(prev => ({ ...prev, [gatewayName]: false }));
            }
        }
        // If not configured yet, user needs to fill fields and click "Save And Update"
    };

    const handleConfigChange = (gatewayName, index, field, value) => {
        setGatewayForms(prev => ({
            ...prev,
            [gatewayName]: {
                ...prev[gatewayName],
                config: prev[gatewayName].config.map((item, i) => 
                    i === index ? { ...item, [field]: value } : item
                )
            }
        }));
    };

    const handleModeChange = (gatewayName, mode) => {
        setGatewayForms(prev => ({
            ...prev,
            [gatewayName]: {
                ...prev[gatewayName],
                mode: mode
            }
        }));
    };

    const handleSetAsDefault = async (gatewayName) => {
        try {
            const response = await setPaymentGatewayAsDefault(gatewayName);
            if (response.success) {
                toast.success('Payment gateway set as default successfully');
                
                // Update local state - set this gateway as default, remove default from others
                setPaymentGateways(prev => prev.map(g => ({
                    ...g,
                    is_default: g.name === gatewayName ? true : false
                })));
            } else {
                toast.error(response.error || 'Failed to set payment gateway as default');
            }
        } catch (error) {
            console.error('Error setting payment gateway as default:', error);
            toast.error('Failed to set payment gateway as default');
        }
    };

    const handleDelete = async (gatewayName) => {
        if (!window.confirm('Are you sure you want to delete this payment gateway configuration?')) {
            return;
        }

        try {
            const response = await deletePaymentGateway(gatewayName);
            if (response.success) {
                toast.success('Payment gateway configuration deleted successfully');
                
                // Update local state - remove shop config, reset to default values
                setPaymentGateways(prev => prev.map(g => 
                    g.name === gatewayName 
                        ? { 
                            ...g, 
                            has_shop_config: false,
                            is_active: false,
                            is_default: false,
                            shop_config_id: null
                          } 
                        : g
                ));
                
                // Reset form to default values
                const gateway = paymentGateways.find(g => g.name === gatewayName);
                if (gateway) {
                    let configObj = {};
                    if (gateway.config && typeof gateway.config === 'object') {
                        configObj = gateway.config;
                    }
                    setGatewayForms(prev => ({
                        ...prev,
                        [gatewayName]: {
                            mode: 'test',
                            is_active: false,
                            config: Object.entries(configObj).map(([key, value]) => ({ 
                                key, 
                                value: '',
                                required: true
                            }))
                        }
                    }));
                }
            } else {
                toast.error(response.error || 'Failed to delete payment gateway');
            }
        } catch (error) {
            console.error('Error deleting payment gateway:', error);
            toast.error('Failed to delete payment gateway');
        }
    };

    const handleUpdate = async (gatewayName, onlyStatus = false) => {
        const form = gatewayForms[gatewayName];
        if (!form) return;

        // Clear previous errors
        setErrors(prev => ({
            ...prev,
            [gatewayName]: {}
        }));

        // Validate required fields if not just toggling status
        if (!onlyStatus) {
            const hasAllRequiredFields = form.config.every(item => item.key && item.value);
            if (!hasAllRequiredFields) {
                toast.error('Please fill all required configuration fields');
                return;
            }
        }

        // Ensure mode is set
        if (!form.mode || (form.mode !== 'test' && form.mode !== 'live')) {
            toast.error('Please select a valid mode');
            return;
        }

        setUpdatingGateways(prev => ({ ...prev, [gatewayName]: true }));

        try {
            const submitData = new FormData();
            // Ensure mode is always a valid string value
            const modeValue = form.mode && (form.mode === 'test' || form.mode === 'live') 
                ? form.mode 
                : 'test';
            submitData.append('mode', modeValue);
            submitData.append('is_active', form.is_active ? '1' : '0');
            
            // Debug: Log what we're sending
            console.log('Payment Gateway Update - Mode:', modeValue, 'Form mode:', form.mode);

            // Add config as array
            form.config.forEach((item, index) => {
                if (item.key && item.value) {
                    submitData.append(`config[${index}][key]`, item.key);
                    submitData.append(`config[${index}][value]`, item.value);
                }
            });

            const response = await updatePaymentGateway(gatewayName, submitData);
            if (response.success) {
                toast.success('Payment gateway updated successfully');
                setErrors(prev => ({
                    ...prev,
                    [gatewayName]: {}
                }));
                
                // Update local state with the response data instead of refetching
                const updatedGateway = response.data.data?.data || response.data.data;
                if (updatedGateway) {
                    // Update paymentGateways state
                    setPaymentGateways(prev => prev.map(g => 
                        g.name === gatewayName ? { ...g, ...updatedGateway } : g
                    ));
                    
                    // Update form state if needed
                    if (updatedGateway.config) {
                        let configObj = {};
                        if (typeof updatedGateway.config === 'object') {
                            configObj = updatedGateway.config;
                        }
                        setGatewayForms(prev => ({
                            ...prev,
                            [gatewayName]: {
                                mode: updatedGateway.mode || prev[gatewayName].mode,
                                is_active: updatedGateway.is_active || false,
                                config: Object.entries(configObj).map(([key, value]) => ({ 
                                    key, 
                                    value: String(value || ''),
                                    required: true
                                }))
                            }
                        }));
                    }
                }
            } else {
                // Handle validation errors
                if (response.errors) {
                    setErrors(prev => ({
                        ...prev,
                        [gatewayName]: response.errors
                    }));
                    toast.error('Please fix the validation errors');
                } else {
                    toast.error(response.error || 'Failed to update payment gateway');
                }
            }
        } catch (error) {
            console.error('Error updating payment gateway:', error);
            toast.error('Failed to update payment gateway');
        } finally {
            setUpdatingGateways(prev => ({ ...prev, [gatewayName]: false }));
        }
    };

    // Placeholder skeleton loader component
    const PlaceholderCard = () => (
        <div className="col-md-6 col-lg-6">
            <div className="card h-100">
                <div className="card-header border-0 pt-6">
                    <div className="placeholder-glow">
                        <span className="placeholder col-6 mb-2" style={{ height: '24px' }}></span>
                    </div>
                </div>
                <div className="card-body">
                    <div className="placeholder-glow">
                        <div className="d-flex justify-content-center mb-6">
                            <span className="placeholder col-8" style={{ height: '80px' }}></span>
                        </div>
                        <span className="placeholder col-4 mb-2" style={{ height: '16px' }}></span>
                        <span className="placeholder col-12 mb-4" style={{ height: '40px' }}></span>
                        <span className="placeholder col-4 mb-2" style={{ height: '16px' }}></span>
                        <span className="placeholder col-12 mb-4" style={{ height: '40px' }}></span>
                        <span className="placeholder col-4 mb-2" style={{ height: '16px' }}></span>
                        <span className="placeholder col-12 mb-4" style={{ height: '40px' }}></span>
                    </div>
                </div>
                <div className="card-footer border-0">
                    <div className="placeholder-glow">
                        <span className="placeholder col-4" style={{ height: '40px' }}></span>
                    </div>
                </div>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="row g-5 g-xl-8">
                <PlaceholderCard />
                <PlaceholderCard />
            </div>
        );
    }

    return (
        <div className="row g-5 g-xl-8">
            {paymentGateways.length === 0 ? (
                <div className="col-12">
                    <div className="card">
                        <div className="card-body text-center py-10">
                            <p className="text-muted">No payment gateways available</p>
                        </div>
                    </div>
                </div>
            ) : (
                paymentGateways.map(gateway => {
                    const form = gatewayForms[gateway.name] || {
                        mode: 'test',
                        is_active: false,
                        config: []
                    };
                    const isUpdating = updatingGateways[gateway.name] || false;
                    const isToggling = togglingGateways[gateway.name] || false;
                    const isEnabled = form.is_active;

                    return (
                        <div key={gateway.name} className="col-md-6 col-lg-6">
                            <div className="card h-100">
                                <div className="card-header border-0 pt-6 d-flex justify-content-between align-items-center">
                                    <div className="d-flex align-items-center gap-3">
                                        <h3 className="card-title text-uppercase fw-bold mb-0">
                                            {gateway.title || gateway.name}
                                        </h3>
                                        {gateway.is_default && (
                                            <span className="badge badge-success">This is default payment gateway</span>
                                        )}
                                    </div>
                                    <div className="d-flex align-items-center gap-3">
                                        <div className="form-check form-switch form-check-custom form-check-solid">
                                            {isToggling && (
                                                <span className="spinner-border spinner-border-sm me-2" role="status" style={{ width: '1rem', height: '1rem' }}>
                                                    <span className="visually-hidden">Loading...</span>
                                                </span>
                                            )}
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                checked={isEnabled}
                                                onChange={(e) => handleToggle(gateway.name, e.target.checked)}
                                                disabled={isToggling || isUpdating}
                                            />
                                            <label className="form-check-label">
                                                {isEnabled ? 'On' : 'Off'}
                                            </label>
                                        </div>
                                        
                                        {/* Three dots menu */}
                                        <div className="position-relative">
                                            <button
                                                className="btn btn-sm btn-icon btn-light btn-active-light-primary"
                                                type="button"
                                                onClick={() => setDropdownOpen(prev => ({ ...prev, [gateway.name]: !prev[gateway.name] }))}
                                            >
                                                <i className="ki-duotone ki-dots-vertical fs-2">
                                                    <span className="path1"></span>
                                                    <span className="path2"></span>
                                                    <span className="path3"></span>
                                                </i>
                                            </button>
                                            
                                            {dropdownOpen[gateway.name] && (
                                                <>
                                                    <div 
                                                        className="position-fixed top-0 start-0 w-100 h-100"
                                                        style={{ zIndex: 1 }}
                                                        onClick={() => setDropdownOpen(prev => ({ ...prev, [gateway.name]: false }))}
                                                    ></div>
                                                    <div 
                                                        className="dropdown-menu dropdown-menu-end show"
                                                        style={{ 
                                                            position: 'absolute', 
                                                            top: '100%', 
                                                            right: 0, 
                                                            zIndex: 1050,
                                                            marginTop: '0.5rem'
                                                        }}
                                                    >
                                                        {gateway.has_shop_config && (
                                                            <>
                                                                <button
                                                                    className="dropdown-item"
                                                                    onClick={() => {
                                                                        handleSetAsDefault(gateway.name);
                                                                        setDropdownOpen(prev => ({ ...prev, [gateway.name]: false }));
                                                                    }}
                                                                    disabled={gateway.is_default || isUpdating}
                                                                >
                                                                    <i className="ki-duotone ki-star fs-6 me-2">
                                                                        <span className="path1"></span>
                                                                        <span className="path2"></span>
                                                                    </i>
                                                                    Set as Default
                                                                </button>
                                                                <div className="dropdown-divider"></div>
                                                                <button
                                                                    className="dropdown-item text-danger"
                                                                    onClick={() => {
                                                                        handleDelete(gateway.name);
                                                                        setDropdownOpen(prev => ({ ...prev, [gateway.name]: false }));
                                                                    }}
                                                                    disabled={isUpdating}
                                                                >
                                                                    <i className="ki-duotone ki-trash fs-6 me-2">
                                                                        <span className="path1"></span>
                                                                        <span className="path2"></span>
                                                                        <span className="path3"></span>
                                                                        <span className="path4"></span>
                                                                        <span className="path5"></span>
                                                                    </i>
                                                                    Delete
                                                                </button>
                                                            </>
                                                        )}
                                                        {!gateway.has_shop_config && (
                                                            <div className="dropdown-item text-muted">
                                                                Configure first to enable options
                                                            </div>
                                                        )}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="card-body">
                                    {/* Logo */}
                                    {gateway.logo && (
                                        <div className="d-flex justify-content-center mb-6">
                                            <img 
                                                src={`/${gateway.logo}`} 
                                                alt={gateway.title || gateway.name}
                                                className="img-fluid"
                                                style={{ maxHeight: '80px', objectFit: 'contain' }}
                                            />
                                        </div>
                                    )}

                                    {/* Mode */}
                                    <div className="mb-5">
                                        <label className="form-label required">Mode</label>
                                        <select
                                            className={`form-select form-select-solid ${errors[gateway.name]?.mode ? 'is-invalid border-danger' : ''}`}
                                            value={form.mode}
                                            onChange={(e) => {
                                                handleModeChange(gateway.name, e.target.value);
                                                // Clear error when user changes value
                                                if (errors[gateway.name]?.mode) {
                                                    setErrors(prev => ({
                                                        ...prev,
                                                        [gateway.name]: {
                                                            ...prev[gateway.name],
                                                            mode: null
                                                        }
                                                    }));
                                                }
                                            }}
                                            disabled={isUpdating}
                                        >
                                            <option value="test">Test</option>
                                            <option value="live">Live</option>
                                        </select>
                                        {errors[gateway.name]?.mode && (
                                            <div className="invalid-feedback d-block">
                                                {Array.isArray(errors[gateway.name].mode) 
                                                    ? errors[gateway.name].mode[0] 
                                                    : errors[gateway.name].mode}
                                            </div>
                                        )}
                                    </div>

                                    {/* Configuration Fields */}
                                    {form.config && form.config.length > 0 ? (
                                        <div className="mb-6">
                                            <h4 className="fs-6 fw-semibold mb-4">Configuration</h4>
                                            {form.config.map((configItem, index) => {
                                                const configErrorKey = `config.${index}.value`;
                                                const hasError = errors[gateway.name]?.[configErrorKey] || 
                                                                errors[gateway.name]?.[`config.${index}.key`];
                                                const errorMessage = errors[gateway.name]?.[configErrorKey] ||
                                                                    errors[gateway.name]?.[`config.${index}.key`] ||
                                                                    errors[gateway.name]?.[`config.${index}`];
                                                
                                                return (
                                                    <div key={index} className="mb-4">
                                                        <label className="form-label required fw-semibold">
                                                            {configItem.key || 'Configuration Field'}
                                                        </label>
                                                        <input
                                                            type="text"
                                                            className={`form-control form-control-solid ${hasError ? 'is-invalid border-danger' : ''}`}
                                                            value={configItem.value || ''}
                                                            onChange={(e) => {
                                                                handleConfigChange(gateway.name, index, 'value', e.target.value);
                                                                // Clear error when user changes value
                                                                if (errors[gateway.name]?.[configErrorKey]) {
                                                                    setErrors(prev => ({
                                                                        ...prev,
                                                                        [gateway.name]: {
                                                                            ...prev[gateway.name],
                                                                            [configErrorKey]: null,
                                                                            [`config.${index}.key`]: null,
                                                                            [`config.${index}`]: null
                                                                        }
                                                                    }));
                                                                }
                                                            }}
                                                            placeholder={`Enter ${configItem.key}`}
                                                            disabled={isUpdating}
                                                            required
                                                        />
                                                        {errorMessage && (
                                                            <div className="invalid-feedback d-block">
                                                                {Array.isArray(errorMessage) 
                                                                    ? errorMessage[0] 
                                                                    : errorMessage}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="mb-6">
                                            <p className="text-muted">No configuration required for this gateway</p>
                                        </div>
                                    )}

                                    {/* Payment Gateway Title */}
                                    <div className="mb-6">
                                        <label className="form-label required">Payment Gateway Title</label>
                                        <input
                                            type="text"
                                            className="form-control form-control-solid"
                                            value={gateway.title || gateway.name}
                                            disabled
                                            readOnly
                                        />
                                    </div>
                                </div>

                                <div className="card-footer border-0 d-flex justify-content-end">
                                    <button
                                        type="button"
                                        className="btn btn-success"
                                        onClick={() => handleUpdate(gateway.name)}
                                        disabled={isUpdating}
                                    >
                                        {isUpdating ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <i className="ki-duotone ki-check fs-2 me-2">
                                                    <span className="path1"></span>
                                                    <span className="path2"></span>
                                                </i>
                                                Save And Update
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    );
};

export default PaymentGatewaysIndex;

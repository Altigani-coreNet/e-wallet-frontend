import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { useCurrencies } from '../../../services/currenciesService';

const PaymentLinkForm = ({ mode, initialData, onSubmit, loading, error, validationErrors = {} }) => {
    const navigate = useNavigate();
    
    // Fetch currencies from AuthService
    const { data: currencies, isLoading: loadingCurrencies, isError: currenciesError } = useCurrencies();
    
    const [formData, setFormData] = useState({
        amount: '',
        currency_id: '', // Will be set when currencies are loaded
        customer_name: '',
        customer_phone: '',
        customer_email: '',
        scheduled_date: '',
        expired_date: '',
        payment_method_types: ['card']
    });
    
    const [showPaymentMethodsDropdown, setShowPaymentMethodsDropdown] = useState(false);
    const paymentMethodsRef = useRef(null);
    const [useScheduledDate, setUseScheduledDate] = useState(false);

    const getDisplayText = (value) => {
        if (value == null) return '';
        if (typeof value === 'string' || typeof value === 'number') return String(value);
        if (typeof value === 'object') {
            return value.en || value.ar || Object.values(value).find((v) => typeof v === 'string') || '';
        }
        return '';
    };

    // Set default currency when currencies are loaded
    useEffect(() => {
        if (currencies && currencies.length > 0 && !formData.currency_id && mode === 'create') {
            // Find USD as default, or use first currency
            const usdCurrency = currencies.find(c => c.currency_code === 'USD');
            const defaultCurrency = usdCurrency || currencies[0];
            setFormData(prev => ({
                ...prev,
                currency_id: defaultCurrency.id
            }));
        }
    }, [currencies, mode]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (paymentMethodsRef.current && !paymentMethodsRef.current.contains(event.target)) {
                setShowPaymentMethodsDropdown(false);
            }
        };

        if (showPaymentMethodsDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showPaymentMethodsDropdown]);

    useEffect(() => {
        if (mode === 'edit' && initialData) {
            console.log('Initial Data Received:', initialData);
            
            // Helper function to extract date from datetime string (handles ISO format)
            const extractDate = (dateString) => {
                if (!dateString) return '';
                
                // Handle ISO format: "2025-11-09T00:00:00.000000Z"
                if (dateString.includes('T')) {
                    return dateString.split('T')[0];
                }
                
                // Handle "YYYY-MM-DD HH:MM:SS" format
                if (dateString.includes(' ')) {
                    return dateString.split(' ')[0];
                }
                
                // Already in "YYYY-MM-DD" format
                return dateString;
            };
            
            // Helper function to parse payment_method_types (handles string or array)
            const parsePaymentMethods = (methods) => {
                if (!methods) return ['card'];
                
                // If it's already an array, clean it up
                if (Array.isArray(methods)) {
                    // Flatten and clean the array
                    const cleaned = methods.flat().map(m => {
                        // Skip null/undefined
                        if (!m) return null;
                        
                        // If it's a string that might be JSON, try to parse it
                        if (typeof m === 'string') {
                            // Check if it looks like a JSON array string
                            if (m.trim().startsWith('[')) {
                                try {
                                    const parsed = JSON.parse(m);
                                    // If parsed successfully and it's an array, return the array elements
                                    if (Array.isArray(parsed)) {
                                        return parsed;
                                    }
                                    // If it's a single value, return it
                                    return parsed;
                                } catch {
                                    // JSON parse failed, return as is
                                    return m;
                                }
                            }
                            // Regular string value
                            return m;
                        }
                        // Already a proper value (number, boolean, etc.)
                        return m;
                    })
                    .flat() // Flatten any nested arrays from JSON parsing
                    .filter(Boolean) // Remove null/undefined/empty values
                    .filter((value, index, self) => self.indexOf(value) === index); // Remove duplicates
                    
                    return cleaned.length > 0 ? cleaned : ['card'];
                }
                
                // If it's a string, try to parse as JSON
                if (typeof methods === 'string') {
                    // Check if it's a JSON string
                    if (methods.trim().startsWith('[')) {
                        try {
                            const parsed = JSON.parse(methods);
                            return Array.isArray(parsed) ? parsed : [parsed];
                        } catch {
                            // If JSON parse fails, treat as single value
                            return [methods];
                        }
                    }
                    // Single string value
                    return [methods];
                }
                
                // Fallback
                return ['card'];
            };
            
            const updatedFormData = {
                amount: initialData.amount || '',
                currency_id: initialData.currency_id || '',
                customer_name: initialData.customer_name || '',
                customer_phone: initialData.customer_phone || '',
                customer_email: initialData.customer_email || '',
                scheduled_date: extractDate(initialData.scheduled_date),
                expired_date: extractDate(initialData.expired_date),
                payment_method_types: parsePaymentMethods(initialData.payment_method_types)
            };
            
            console.log('Form Data Set:', updatedFormData);
            setFormData(updatedFormData);
            setUseScheduledDate(Boolean(updatedFormData.scheduled_date));
        }
    }, [mode, initialData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handlePaymentMethodToggle = (methodValue) => {
        setFormData(prev => {
            const currentMethods = prev.payment_method_types || [];
            const isSelected = currentMethods.includes(methodValue);
            
            let newMethods;
            if (isSelected) {
                // Remove if already selected (but keep at least one)
                if (currentMethods.length > 1) {
                    newMethods = currentMethods.filter(m => m !== methodValue);
                } else {
                    // Don't allow removing the last one
                    return prev;
                }
            } else {
                // Add if not selected
                newMethods = [...currentMethods, methodValue];
            }
            
            return {
                ...prev,
                payment_method_types: newMethods
            };
        });
    };

    const handleRemovePaymentMethod = (methodValue) => {
        setFormData(prev => {
            const currentMethods = prev.payment_method_types || [];
            // Keep at least one payment method
            if (currentMethods.length <= 1) {
                return prev;
            }
            return {
                ...prev,
                payment_method_types: currentMethods.filter(m => m !== methodValue)
            };
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Ensure payment_method_types is a clean array (no nested arrays or JSON strings)
        const cleanedFormData = {
            ...formData,
            scheduled_date: useScheduledDate ? formData.scheduled_date : null,
            payment_method_types: Array.isArray(formData.payment_method_types)
                ? formData.payment_method_types.filter((value, index, self) => 
                    // Remove duplicates and ensure all are strings (not JSON strings)
                    typeof value === 'string' && 
                    !value.trim().startsWith('[') && 
                    self.indexOf(value) === index
                )
                : ['card']
        };
        
        console.log('Submitting Form Data:', cleanedFormData);
        onSubmit(cleanedFormData);
    };

    const getFieldError = (fieldName) => {
        const err = validationErrors?.[fieldName];
        if (Array.isArray(err)) return err[0];
        return err || null;
    };

    const paymentMethods = [
        { value: 'card', label: 'Card' },
        { value: 'afterpay_clearpay', label: 'Afterpay / Clearpay' },
        { value: 'alipay', label: 'Alipay' },
        { value: 'bancontact', label: 'Bancontact' },
        { value: 'eps', label: 'EPS' },
        { value: 'giropay', label: 'Giropay' },
        { value: 'grabpay', label: 'GrabPay' },
        { value: 'ideal', label: 'iDEAL' },
        { value: 'klarna', label: 'Klarna' },
        { value: 'oxxo', label: 'OXXO' },
        { value: 'p24', label: 'Przelewy24' },
        { value: 'sepa_debit', label: 'SEPA Debit' },
        { value: 'sofort', label: 'Sofort' },
        { value: 'us_bank_account', label: 'US Bank Account' },
        { value: 'wechat_pay', label: 'WeChat Pay' }
    ];

    return (
        <div className="card">
            <div className="card-header">
                <div className="card-title">
                    <h3>{mode === 'create' ? 'Create' : 'Edit'} Payment Link</h3>
                </div>
            </div>
            <form onSubmit={handleSubmit}>
                <div className="card-body">
                    {error && (
                        <div className="alert alert-danger" role="alert">
                            {error}
                        </div>
                    )}

                    <div className="row">
                        {/* Amount */}
                        <div className="col-md-6 mb-5">
                            <label className="form-label required">Amount</label>
                            <input
                                type="number"
                                step="0.01"
                                min="0.01"
                                name="amount"
                                className={`form-control ${getFieldError('amount') ? 'is-invalid' : ''}`}
                                placeholder="Enter amount"
                                value={formData.amount}
                                onChange={handleChange}
                                required
                            />
                            {getFieldError('amount') && <div className="invalid-feedback d-block">{getFieldError('amount')}</div>}
                        </div>

                        {/* Currency */}
                        <div className="col-md-6 mb-5">
                            <label className="form-label required">Currency</label>
                            <select
                                name="currency_id"
                                className={`form-select ${getFieldError('currency_id') ? 'is-invalid' : ''}`}
                                value={formData.currency_id}
                                onChange={handleChange}
                                required
                                disabled={loadingCurrencies}
                            >
                                {loadingCurrencies ? (
                                    <option value="">Loading currencies...</option>
                                ) : currenciesError ? (
                                    <option value="">Failed to load currencies</option>
                                ) : (
                                    <>
                                        <option value="">Select currency</option>
                                        {currencies && currencies.map(currency => (
                                            <option key={currency.id} value={currency.id}>
                                                {getDisplayText(currency.currency_code)} - {getDisplayText(currency.name)} ({getDisplayText(currency.symbol)})
                                            </option>
                                        ))}
                                    </>
                                )}
                            </select>
                            {currenciesError && (
                                <div className="form-text text-danger">
                                    Failed to load currencies from server
                                </div>
                            )}
                            {getFieldError('currency_id') && <div className="invalid-feedback d-block">{getFieldError('currency_id')}</div>}
                        </div>

                        {/* Customer Name */}
                        <div className="col-md-12 mb-5">
                            <label className="form-label required">Customer Name</label>
                            <input
                                type="text"
                                name="customer_name"
                                className={`form-control ${getFieldError('customer_name') ? 'is-invalid' : ''}`}
                                placeholder="Enter customer name"
                                value={formData.customer_name}
                                onChange={handleChange}
                                required
                            />
                            {getFieldError('customer_name') && <div className="invalid-feedback d-block">{getFieldError('customer_name')}</div>}
                        </div>

                        {/* Customer Email */}
                        <div className="col-md-6 mb-5">
                            <label className="form-label">Customer Email</label>
                            <input
                                type="email"
                                name="customer_email"
                                className={`form-control ${getFieldError('customer_email') ? 'is-invalid' : ''}`}
                                placeholder="Enter customer email"
                                value={formData.customer_email}
                                onChange={handleChange}
                            />
                            <div className="form-text">
                                Optional: Email for sending payment link
                            </div>
                            {getFieldError('customer_email') && <div className="invalid-feedback d-block">{getFieldError('customer_email')}</div>}
                        </div>

                        {/* Customer Phone */}
                        <div className="col-md-6 mb-5">
                            <label className="form-label">Customer Phone</label>
                            <div className="form-control p-0">
                                <PhoneInput
                                    country={"ae"}
                                    inputProps={{ 
                                        name: 'customer_phone',
                                        id: 'customer_phone'
                                    }}
                                    value={(formData.customer_phone || '').replace(/^\+/, '')}
                                    onChange={(value) => {
                                        const e164 = value ? `+${value}` : '';
                                        setFormData(prev => ({
                                            ...prev,
                                            customer_phone: e164
                                        }));
                                    }}
                                    containerClass={"w-100"}
                                    containerStyle={{ width: '100%' }}
                                    inputClass={"border-0 w-100"}
                                    inputStyle={{ 
                                        width: '100%', 
                                        height: 'calc(1.5em + 1rem + 6px)',
                                        paddingLeft: '48px'
                                    }}
                                    placeholder="Enter phone number"
                                    specialLabel=""
                                />
                            </div>
                            <div className="form-text">
                                Optional: Phone for SMS/WhatsApp
                            </div>
                        </div>

                        {/* Scheduled Date */}
                        <div className="col-md-6 mb-5">
                            <label className="form-label d-flex align-items-center gap-3 mb-3">
                                <input
                                    type="checkbox"
                                    className="form-check-input"
                                    checked={useScheduledDate}
                                    onChange={(e) => {
                                        const checked = e.target.checked;
                                        setUseScheduledDate(checked);
                                        if (!checked) {
                                            setFormData(prev => ({ ...prev, scheduled_date: '' }));
                                        }
                                    }}
                                />
                                <span>Schedule Date</span>
                            </label>
                            {useScheduledDate ? (
                                <>
                                    <input
                                        type="date"
                                        name="scheduled_date"
                                        className={`form-control ${getFieldError('scheduled_date') ? 'is-invalid' : ''}`}
                                        value={formData.scheduled_date}
                                        onChange={handleChange}
                                        min={new Date().toISOString().split('T')[0]}
                                    />
                                    <div className="form-text">
                                        Choose when this payment link becomes active.
                                    </div>
                                    {getFieldError('scheduled_date') && <div className="invalid-feedback d-block">{getFieldError('scheduled_date')}</div>}
                                </>
                            ) : (
                                <div className="form-text">Enable to set a start date for this payment link.</div>
                            )}
                        </div>

                        {/* Expiry Date */}
                        <div className="col-md-6 mb-5">
                            <label className="form-label">Expiry Date</label>
                            <input
                                type="date"
                                name="expired_date"
                                className={`form-control ${getFieldError('expired_date') ? 'is-invalid' : ''}`}
                                value={formData.expired_date}
                                onChange={handleChange}
                                min={new Date().toISOString().split('T')[0]}
                            />
                            <div className="form-text">
                                Optional: Set when this link expires
                            </div>
                            {getFieldError('expired_date') && <div className="invalid-feedback d-block">{getFieldError('expired_date')}</div>}
                        </div>

                        {/* Payment Method Types - Beautiful Multi-Select */}
                        <div className="col-md-12 mb-5">
                            <label className="form-label required">Payment Methods</label>
                            <div className="position-relative" ref={paymentMethodsRef}>
                                {/* Selected Tags */}
                                <div 
                                    className="form-control d-flex flex-wrap align-items-center gap-2 p-3 min-h-50px cursor-pointer"
                                    onClick={() => setShowPaymentMethodsDropdown(!showPaymentMethodsDropdown)}
                                    style={{ minHeight: '50px', cursor: 'pointer' }}
                                >
                                    {formData.payment_method_types && formData.payment_method_types.length > 0 ? (
                                        formData.payment_method_types.map(methodValue => {
                                            const method = paymentMethods.find(m => m.value === methodValue);
                                            if (!method) return null;
                                            
                                            return (
                                                <span
                                                    key={methodValue}
                                                    className="badge badge-light-primary d-flex align-items-center fs-7 py-2 px-3"
                                                    style={{ cursor: 'default' }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleRemovePaymentMethod(methodValue);
                                                    }}
                                                >
                                                    <span className="me-2">{method.label}</span>
                                                    <i 
                                                        className="ki-duotone ki-cross fs-6 cursor-pointer"
                                                        style={{ cursor: 'pointer' }}
                                                    >
                                                        <span className="path1"></span>
                                                        <span className="path2"></span>
                                                    </i>
                                                </span>
                                            );
                                        })
                                    ) : (
                                        <span className="text-muted">Select payment methods...</span>
                                    )}
                                </div>

                                {/* Dropdown Arrow */}
                                <div 
                                    className="position-absolute end-0 top-50 translate-middle-y pe-5"
                                    style={{ pointerEvents: 'none' }}
                                >
                                    <i 
                                        className={`ki-duotone ki-down fs-2 text-muted ${showPaymentMethodsDropdown ? 'rotate-180' : ''}`}
                                        style={{ transition: 'transform 0.3s ease' }}
                                    >
                                        <span className="path1"></span>
                                        <span className="path2"></span>
                                    </i>
                                </div>

                                {/* Dropdown Menu */}
                                {showPaymentMethodsDropdown && (
                                    <div 
                                        className="position-absolute w-100 bg-white border border-gray-300 rounded shadow-lg"
                                        style={{
                                            top: '100%',
                                            left: 0,
                                            zIndex: 1050,
                                            maxHeight: '300px',
                                            overflowY: 'auto',
                                            marginTop: '4px'
                                        }}
                                    >
                                        {paymentMethods.map(method => {
                                            const isSelected = formData.payment_method_types?.includes(method.value);
                                            return (
                                                <div
                                                    key={method.value}
                                                    className={`d-flex align-items-center p-3 cursor-pointer ${
                                                        isSelected 
                                                            ? 'bg-light-primary' 
                                                            : 'hover:bg-light-secondary'
                                                    }`}
                                                    style={{ 
                                                        cursor: 'pointer',
                                                        transition: 'background-color 0.2s ease'
                                                    }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handlePaymentMethodToggle(method.value);
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        if (!isSelected) {
                                                            e.currentTarget.classList.add('bg-light-secondary');
                                                        }
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        if (!isSelected) {
                                                            e.currentTarget.classList.remove('bg-light-secondary');
                                                        }
                                                    }}
                                                >
                                                    <div className="form-check form-check-sm form-check-custom form-check-solid me-3">
                                                        <input
                                                            className="form-check-input"
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={() => handlePaymentMethodToggle(method.value)}
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                    </div>
                                                    <span className={`fw-semibold ${isSelected ? 'text-primary' : 'text-gray-800'}`}>
                                                        {method.label}
                                                    </span>
                                                    {isSelected && (
                                                        <i className="ki-duotone ki-check fs-3 text-primary ms-auto">
                                                            <span className="path1"></span>
                                                            <span className="path2"></span>
                                                        </i>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                            <div className="form-text mt-2">
                                Click to select multiple payment methods. Selected methods appear as tags above.
                            </div>
                            {getFieldError('payment_method_types') && <div className="invalid-feedback d-block">{getFieldError('payment_method_types')}</div>}
                            {/* Hidden input for form validation */}
                            <input
                                type="hidden"
                                name="payment_method_types"
                                value={formData.payment_method_types}
                                required={formData.payment_method_types?.length === 0}
                            />
                        </div>
                    </div>
                </div>

                <div className="card-footer d-flex justify-content-end py-6">
                    <button
                        type="button"
                        onClick={() => navigate('/merchant/payment-links')}
                        className="btn btn-light btn-active-light-primary me-2"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2"></span>
                                Saving...
                            </>
                        ) : (
                            <>
                                <i className="ki-duotone ki-check fs-2"></i>
                                {mode === 'create' ? 'Create' : 'Update'} Payment Link
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default PaymentLinkForm;


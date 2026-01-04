import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ADMIN_ENDPOINTS, ADMIN_SYSTEM_ENDPOINTS, AUTH_ENDPOINTS } from '../../../utils/constants';
import { getToken } from '../../../utils/api';
import { useToolbar } from '../../../contexts/ToolbarContext';

// Debounce function
const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
};

const AdminPlanEdit = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { setTitle, setActions } = useToolbar();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [currencies, setCurrencies] = useState([]);
    const [countries, setCountries] = useState([]);
    const [loadingCurrencies, setLoadingCurrencies] = useState(true);
    // State for searchable country dropdowns (per price index)
    const [countrySearchStates, setCountrySearchStates] = useState({});
    const [selectedCountries, setSelectedCountries] = useState({});
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        plan_type: '',
        current_price: '',
        has_discount: false,
        status: true,
        prices: [{ currency_id: '', country_id: '', price: '', current_price: '', is_default: true }],
        features: [{ name: '', is_enabled: false }],
        scopes: {
            // Cashier Module (includes moved POS-related scopes)
            users: { is_enabled: false, max_count: '' },
            payment_links: { is_enabled: false, max_count: '' },
            branches: { is_enabled: false, max_count: '' },
            categories: { is_enabled: false, max_count: '' },
            products: { is_enabled: false, max_count: '' },
            customers: { is_enabled: false, max_count: '' },
            suppliers: { is_enabled: false, max_count: '' },
            purchases: { is_enabled: false, max_count: '' },
            sales: { is_enabled: false, max_count: '' }
        }
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        setTitle('Edit Plan');
        setActions(
            <Link to="/admin/plans" className="btn btn-sm btn-light-danger">
                <i className="ki-duotone ki-arrow-left fs-2">
                    <span className="path1"></span>
                    <span className="path2"></span>
                </i>
                Back
            </Link>
        );
        return () => setActions(null);
    }, [setTitle, setActions]);

    useEffect(() => {
        fetchPlan();
    }, [id]);

    // Fetch currencies
    useEffect(() => {
        const fetchCurrencies = async () => {
            try {
                const token = getToken();
                const currenciesRes = await axios.get(ADMIN_SYSTEM_ENDPOINTS.CURRENCIES_SELECT, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                setCurrencies(currenciesRes.data?.data || currenciesRes.data || []);
            } catch (error) {
                console.error('Failed to fetch currencies:', error);
                toast.error('Failed to load currencies');
            } finally {
                setLoadingCurrencies(false);
            }
        };

        fetchCurrencies();
    }, []);

    // Fetch countries from API with optional search term
    const fetchCountries = async (index, searchTerm = '') => {
        try {
            const token = getToken();
            const url = searchTerm 
                ? `${AUTH_ENDPOINTS.COUNTRIES_SELECT}?search=${encodeURIComponent(searchTerm)}`
                : AUTH_ENDPOINTS.COUNTRIES_SELECT;
            
            const response = await axios.get(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.data.status) {
                setCountrySearchStates(prev => ({
                    ...prev,
                    [index]: {
                        ...prev[index],
                        filteredCountries: response.data.data || []
                    }
                }));
            }
        } catch (error) {
            console.error('Failed to fetch countries:', error);
        }
    };

    // Debounced country search function
    const debouncedCountrySearch = useCallback(
        (index) => debounce((searchTerm) => {
            if (searchTerm.length >= 1) {
                fetchCountries(index, searchTerm);
            } else {
                fetchCountries(index);
            }
        }, 500),
        []
    );

    const handleCountrySearch = (index, searchTerm) => {
        setCountrySearchStates(prev => ({
            ...prev,
            [index]: {
                ...prev[index],
                searchTerm,
                showList: true
            }
        }));
        debouncedCountrySearch(index)(searchTerm);
    };

    const handleCountryDropdownToggle = (index) => {
        setCountrySearchStates(prev => {
            const current = prev[index] || {};
            if (!current.showList) {
                // Opening dropdown - clear search and load all countries
                fetchCountries(index);
                return {
                    ...prev,
                    [index]: {
                        ...prev[index],
                        searchTerm: '',
                        showList: true,
                        filteredCountries: []
                    }
                };
            }
            return {
                ...prev,
                [index]: {
                    ...prev[index],
                    showList: false
                }
            };
        });
    };

    const handleCountrySelect = (index, country) => {
        if (country.id === '') {
            // "All Countries" selected
            setSelectedCountries(prev => {
                const newState = { ...prev };
                delete newState[index];
                return newState;
            });
            handlePriceChange(index, 'country_id', '');
        } else {
            setSelectedCountries(prev => ({
                ...prev,
                [index]: country
            }));
            handlePriceChange(index, 'country_id', country.id);
        }
        setCountrySearchStates(prev => ({
            ...prev,
            [index]: {
                ...prev[index],
                showList: false,
                searchTerm: ''
            }
        }));
    };

    const handleRemoveCountry = (index) => {
        setSelectedCountries(prev => {
            const newState = { ...prev };
            delete newState[index];
            return newState;
        });
        handlePriceChange(index, 'country_id', '');
        setCountrySearchStates(prev => ({
            ...prev,
            [index]: {
                ...prev[index],
                showList: false,
                searchTerm: ''
            }
        }));
    };

    const fetchPlan = async () => {
        setLoading(true);
        try {
            const token = getToken();
            const response = await axios.get(ADMIN_ENDPOINTS.PLAN_DETAILS(id), {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const isSuccess = response.data.success || response.data.status;
            if (isSuccess) {
                const plan = response.data.data;
                
                // Initialize scopes object
                const scopesObj = {
                    users: { is_enabled: false, max_count: '' },
                    payment_links: { is_enabled: false, max_count: '' },
                    branches: { is_enabled: false, max_count: '' },
                    categories: { is_enabled: false, max_count: '' },
                    products: { is_enabled: false, max_count: '' },
                    customers: { is_enabled: false, max_count: '' },
                    suppliers: { is_enabled: false, max_count: '' },
                    purchases: { is_enabled: false, max_count: '' },
                    sales: { is_enabled: false, max_count: '' }
                };

                // Populate scopes from API response
                if (plan.scopes && Array.isArray(plan.scopes)) {
                    plan.scopes.forEach(scope => {
                        if (scopesObj[scope.scope_type]) {
                            scopesObj[scope.scope_type] = {
                                is_enabled: scope.is_enabled || false,
                                max_count: scope.max_count ? String(scope.max_count) : ''
                            };
                        }
                    });
                }

                // Load plan prices if available (handle both camelCase and snake_case)
                // Check multiple possible response formats
                let pricesData = plan.plan_prices || plan.planPrices || plan.data?.plan_prices || plan.data?.planPrices || [];
                
                // If pricesData is not an array, try to extract it
                if (!Array.isArray(pricesData)) {
                    if (pricesData && typeof pricesData === 'object') {
                        // Try to get data property if it exists
                        pricesData = pricesData.data || [];
                    } else {
                        pricesData = [];
                    }
                }
                
                console.log('Plan prices data:', pricesData); // Debug log
                console.log('Full plan data:', plan); // Debug log to see structure
                
                const planPrices = pricesData && Array.isArray(pricesData) && pricesData.length > 0
                    ? pricesData.map((pp, idx) => {
                        // Extract currency_id - could be direct property or nested in currency object
                        let currencyId = pp.currency_id || pp.currencyId || null;
                        if (!currencyId && pp.currency) {
                            currencyId = pp.currency.id || pp.currency.Id || null;
                        }
                        // Convert to string and handle null/undefined
                        currencyId = currencyId ? String(currencyId) : '';
                        
                        // Extract country_id - could be direct property or nested in country object
                        let countryId = pp.country_id || pp.countryId || null;
                        if (!countryId && pp.country) {
                            countryId = pp.country.id || pp.country.Id || null;
                        }
                        // Convert to string and handle null/undefined
                        countryId = countryId ? String(countryId) : '';
                        
                        // Set selected country if country_id exists
                        if (countryId && pp.country) {
                            const country = pp.country;
                            setSelectedCountries(prev => ({
                                ...prev,
                                [idx]: {
                                    id: countryId,
                                    text: country.name || country.text || country.short_name,
                                    name: country.name || country.text || country.short_name,
                                    code: country.code || country.short_name
                                }
                            }));
                        }
                        
                        return {
                            currency_id: currencyId,
                            country_id: countryId,
                            price: pp.price ? String(pp.price) : '',
                            current_price: pp.current_price || pp.currentPrice ? String(pp.current_price || pp.currentPrice) : '',
                            is_default: pp.is_default !== undefined ? pp.is_default : (pp.isDefault !== undefined ? pp.isDefault : false)
                        };
                    })
                    : [{ currency_id: '', country_id: '', price: '', current_price: '', is_default: true }];

                setFormData({
                    name: plan.name || '',
                    description: plan.description || '',
                    price: plan.price || '',
                    plan_type: plan.plan_type || '',
                    current_price: plan.current_price || '',
                    has_discount: plan.has_discount || false,
                    status: plan.status !== undefined ? plan.status : true,
                    prices: planPrices,
                    features: plan.features && plan.features.length > 0 
                        ? plan.features.map(f => ({ name: f.name || '', is_enabled: f.is_enabled || false }))
                        : [{ name: '', is_enabled: false }],
                    scopes: scopesObj
                });
            }
        } catch (error) {
            toast.error('Failed to load plan details');
            console.error(error);
            navigate('/admin/plans');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleFeatureChange = (index, field, value) => {
        const newFeatures = [...formData.features];
        newFeatures[index] = { ...newFeatures[index], [field]: value };
        setFormData(prev => ({ ...prev, features: newFeatures }));
    };

    const handleScopeChange = (scopeType, field, value) => {
        setFormData(prev => ({
            ...prev,
            scopes: {
                ...prev.scopes,
                [scopeType]: {
                    ...prev.scopes[scopeType],
                    [field]: value
                }
            }
        }));
    };

    const addFeature = () => {
        setFormData(prev => ({
            ...prev,
            features: [...prev.features, { name: '', is_enabled: false }]
        }));
    };

    const removeFeature = (index) => {
        if (formData.features.length > 1) {
            const newFeatures = formData.features.filter((_, i) => i !== index);
            setFormData(prev => ({ ...prev, features: newFeatures }));
        }
    };

    const handlePriceChange = (index, field, value) => {
        const newPrices = [...formData.prices];
        newPrices[index] = { ...newPrices[index], [field]: value };
        
        // If setting is_default to true, unset others
        if (field === 'is_default' && value === true) {
            newPrices.forEach((price, i) => {
                if (i !== index) {
                    price.is_default = false;
                }
            });
        }
        
        setFormData(prev => ({ ...prev, prices: newPrices }));
    };

    const addPrice = () => {
        setFormData(prev => ({
            ...prev,
            prices: [...prev.prices, { currency_id: '', country_id: '', price: '', current_price: '', is_default: false }]
        }));
    };

    const removePrice = (index) => {
        if (formData.prices.length > 1) {
            const newPrices = formData.prices.filter((_, i) => i !== index);
            // Ensure at least one is default
            const hasDefault = newPrices.some(p => p.is_default);
            if (!hasDefault && newPrices.length > 0) {
                newPrices[0].is_default = true;
            }
            setFormData(prev => ({ ...prev, prices: newPrices }));
            
            // Clean up country state for removed price
            setSelectedCountries(prev => {
                const newState = {};
                Object.keys(prev).forEach(key => {
                    const keyNum = parseInt(key);
                    if (keyNum < index) {
                        newState[key] = prev[key];
                    } else if (keyNum > index) {
                        newState[keyNum - 1] = prev[key];
                    }
                });
                return newState;
            });
            setCountrySearchStates(prev => {
                const newState = {};
                Object.keys(prev).forEach(key => {
                    const keyNum = parseInt(key);
                    if (keyNum < index) {
                        newState[key] = prev[key];
                    } else if (keyNum > index) {
                        newState[keyNum - 1] = prev[key];
                    }
                });
                return newState;
            });
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.name?.trim()) {
            newErrors.name = 'Plan name is required';
        }

        // Validate prices array
        if (!formData.prices || formData.prices.length === 0) {
            newErrors.prices = 'At least one price is required';
        } else {
            formData.prices.forEach((price, index) => {
                if (!price.currency_id) {
                    newErrors[`prices.${index}.currency_id`] = 'Currency is required';
                }
                if (!price.price || parseFloat(price.price) < 0) {
                    newErrors[`prices.${index}.price`] = 'Valid price is required';
                }
            });
        }

        if (!formData.plan_type) {
            newErrors.plan_type = 'Plan type is required';
        }

        if (formData.has_discount && (!formData.current_price || parseFloat(formData.current_price) < 0)) {
            newErrors.current_price = 'Discounted price is required when discount is enabled';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            toast.error('Please fill in all required fields');
            return;
        }

        try {
            setSaving(true);
            const token = getToken();

            // Prepare scopes array
            const scopesArray = Object.entries(formData.scopes).map(([scopeType, scopeData]) => {
                const moduleMap = {
                    // All scopes are now considered part of the cashier module
                    users: 'cashier',
                    payment_links: 'cashier',
                    branches: 'cashier',
                    categories: 'cashier',
                    products: 'cashier',
                    customers: 'cashier',
                    suppliers: 'cashier',
                    purchases: 'cashier',
                    sales: 'cashier'
                };
                
                return {
                    scope_type: scopeType,
                    module: moduleMap[scopeType] || null,
                    is_enabled: scopeData.is_enabled,
                    max_count: scopeData.is_enabled && scopeData.max_count ? parseInt(scopeData.max_count) : null
                };
            });

            // Prepare prices array
            const pricesArray = formData.prices.map(price => ({
                currency_id: price.currency_id,
                country_id: price.country_id || null,
                price: parseFloat(price.price),
                current_price: price.current_price ? parseFloat(price.current_price) : null,
                is_default: price.is_default || false
            }));

            const submitData = {
                name: formData.name,
                description: formData.description,
                plan_type: formData.plan_type,
                has_discount: formData.has_discount,
                status: formData.status,
                price: formData.price ? parseFloat(formData.price) : null, // Keep for backward compatibility
                current_price: formData.current_price ? parseFloat(formData.current_price) : null,
                prices: pricesArray,
                features: formData.features.filter(f => f.name.trim() !== ''),
                scopes: scopesArray
            };

            const response = await axios.put(
                ADMIN_ENDPOINTS.PLAN_UPDATE(id),
                submitData,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            const isSuccess = response.data.success || response.data.status;
            if (isSuccess) {
                toast.success('Plan updated successfully');
                navigate('/admin/plans');
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Failed to update plan';
            toast.error(errorMessage);
            
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            }
            
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="post d-flex flex-column-fluid">
                <div id="kt_content_container" className="container-xxl">
                    <div className="card">
                        <div className="card-body text-center py-10">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                            <p className="mt-3">Loading plan details...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="post d-flex flex-column-fluid">
            <div id="kt_content_container" className="container-xxl">
                <form onSubmit={handleSubmit}>
                    <div className="card">
                        <div className="card-header border-0">
                            <div className="card-title">
                                <h2>Edit Plan</h2>
                            </div>
                        </div>

                        <div className="card-body p-9">
                            {Object.keys(errors).length > 0 && (
                                <div className="alert alert-danger alert-dismissible fade show mb-7" role="alert">
                                    <div className="d-flex">
                                        <i className="ki-duotone ki-cross-circle fs-2hx text-danger me-4">
                                            <span className="path1"></span>
                                            <span className="path2"></span>
                                        </i>
                                        <div className="d-flex flex-column">
                                            <h4 className="mb-1">Validation Errors</h4>
                                            <ul className="mb-0">
                                                {Object.values(errors).map((error, idx) => (
                                                    <li key={idx}>{error}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                    <button type="button" className="btn-close" onClick={() => setErrors({})}></button>
                                </div>
                            )}

                            <div className="row">
                                <div className="col-md-6 mb-7">
                                    <label className="form-label fw-bold required">Plan Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        placeholder="Enter plan name"
                                    />
                                    {errors.name && <div className="invalid-feedback d-block">{errors.name}</div>}
                                </div>

                                <div className="col-md-6 mb-7">
                                    <label className="form-label fw-bold">Legacy Price (Optional)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        name="price"
                                        className="form-control"
                                        value={formData.price}
                                        onChange={handleInputChange}
                                        placeholder="0.00"
                                    />
                                    <small className="text-muted">Use plan prices below instead</small>
                                </div>

                                <div className="col-md-12 mb-7">
                                    <label className="form-label fw-bold">Description</label>
                                    <textarea
                                        name="description"
                                        className="form-control"
                                        rows="3"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        placeholder="Enter plan description"
                                    />
                                </div>

                                <div className="col-md-6 mb-7">
                                    <label className="form-label fw-bold required">Plan Type</label>
                                    <select
                                        name="plan_type"
                                        className={`form-select ${errors.plan_type ? 'is-invalid' : ''}`}
                                        value={formData.plan_type}
                                        onChange={handleInputChange}
                                    >
                                        <option value="">Select Plan Type</option>
                                        <option value="Onetime">Onetime</option>
                                        <option value="Weekly">Weekly</option>
                                        <option value="Monthly">Monthly</option>
                                        <option value="Yearly">Yearly</option>
                                    </select>
                                    {errors.plan_type && <div className="invalid-feedback d-block">{errors.plan_type}</div>}
                                </div>

                                <div className="col-md-6 mb-7">
                                    <label className="form-label fw-bold">Status</label>
                                    <div className="form-check form-switch">
                                        <input
                                            className="form-check-input"
                                            type="checkbox"
                                            name="status"
                                            checked={formData.status}
                                            onChange={handleInputChange}
                                        />
                                        <label className="form-check-label">Active</label>
                                    </div>
                                </div>

                                <div className="col-md-6 mb-7">
                                    <label className="form-label fw-bold">Has Discount</label>
                                    <div className="form-check form-switch">
                                        <input
                                            className="form-check-input"
                                            type="checkbox"
                                            name="has_discount"
                                            checked={formData.has_discount}
                                            onChange={handleInputChange}
                                        />
                                        <label className="form-check-label">Enable Discount</label>
                                    </div>
                                </div>

                                {formData.has_discount && (
                                    <div className="col-md-6 mb-7">
                                        <label className="form-label fw-bold">Legacy Discounted Price (Optional)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            name="current_price"
                                            className="form-control"
                                            value={formData.current_price}
                                            onChange={handleInputChange}
                                            placeholder="0.00"
                                        />
                                        <small className="text-muted">Use plan prices below instead</small>
                                    </div>
                                )}
                            </div>

                            <div className="separator separator-dashed my-10"></div>

                            {/* Plan Prices Section */}
                            <div className="row mb-6">
                                <div className="col-12">
                                    <h3 className="fs-6 fw-bold mb-4">Plan Prices</h3>
                                    <p className="text-muted mb-4">Add prices for different currencies and countries. At least one price is required.</p>
                                    
                                    {formData.prices.map((price, index) => (
                                        <div key={index} className="card mb-4 p-6">
                                            <div className="row g-4">
                                                <div className="col-md-3">
                                                    <label className="form-label fw-bold required">Currency</label>
                                                    <select
                                                        className={`form-select ${errors[`prices.${index}.currency_id`] ? 'is-invalid' : ''}`}
                                                        value={price.currency_id}
                                                        onChange={(e) => handlePriceChange(index, 'currency_id', e.target.value)}
                                                        disabled={loadingCurrencies}
                                                    >
                                                        <option value="">Select Currency</option>
                                                        {currencies.map((currency) => (
                                                            <option key={currency.id} value={String(currency.id)}>
                                                                {currency.text || currency.name || `${currency.currency_code || currency.symbol || ''}`}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    {errors[`prices.${index}.currency_id`] && (
                                                        <div className="invalid-feedback d-block">{errors[`prices.${index}.currency_id`]}</div>
                                                    )}
                                                </div>

                                                <div className="col-md-3">
                                                    <label className="form-label fw-bold">Country (Optional)</label>
                                                    <div className="position-relative">
                                                        <div 
                                                            className="form-control h-50px d-flex align-items-center justify-content-between"
                                                            onClick={() => handleCountryDropdownToggle(index)}
                                                            style={{ cursor: 'pointer' }}
                                                        >
                                                            <div className="d-flex align-items-center">
                                                                {selectedCountries[index] ? (
                                                                    <>
                                                                        <img 
                                                                            src={`/flags/${selectedCountries[index].code?.toLowerCase() || 'placeholder'}.png`} 
                                                                            alt={selectedCountries[index].text || selectedCountries[index].name}
                                                                            className="me-3"
                                                                            style={{ width: '20px', height: '15px', objectFit: 'cover' }}
                                                                            onError={(e) => { e.target.style.display = 'none'; }}
                                                                        />
                                                                        <span className="text-gray-800">{selectedCountries[index].text || selectedCountries[index].name}</span>
                                                                    </>
                                                                ) : (
                                                                    <span className="text-muted">All Countries</span>
                                                                )}
                                                            </div>
                                                            <div className="d-flex align-items-center">
                                                                {selectedCountries[index] && (
                                                                    <button 
                                                                        type="button"
                                                                        className="btn btn-icon btn-sm btn-light-danger me-2"
                                                                        onClick={(e) => { e.stopPropagation(); handleRemoveCountry(index); }}
                                                                    >
                                                                        <i className="ki-duotone ki-cross fs-2">
                                                                            <span className="path1"></span>
                                                                            <span className="path2"></span>
                                                                        </i>
                                                                    </button>
                                                                )}
                                                                <i className={`ki-duotone ki-down fs-2 ${countrySearchStates[index]?.showList ? 'rotate-180' : ''}`}>
                                                                    <span className="path1"></span>
                                                                    <span className="path2"></span>
                                                                </i>
                                                            </div>
                                                        </div>
                                                        
                                                        {countrySearchStates[index]?.showList && (
                                                            <div className="position-absolute top-100 start-0 w-100 bg-white border rounded-3 shadow-sm mt-1" style={{ zIndex: 1000, maxHeight: '250px', overflowY: 'auto' }}>
                                                                <div className="p-2">
                                                                    <input 
                                                                        type="text" 
                                                                        className="form-control form-control-sm mb-2" 
                                                                        placeholder="Search countries..."
                                                                        value={countrySearchStates[index]?.searchTerm || ''}
                                                                        onChange={(e) => handleCountrySearch(index, e.target.value)}
                                                                        onClick={(e) => e.stopPropagation()}
                                                                        autoFocus
                                                                    />
                                                                </div>
                                                                {(countrySearchStates[index]?.filteredCountries || []).length > 0 ? (
                                                                    <>
                                                                        <div 
                                                                            className="p-3 border-bottom cursor-pointer hover-bg-light d-flex align-items-center"
                                                                            onMouseDown={(e) => { e.preventDefault(); handleCountrySelect(index, { id: '', text: 'All Countries', name: 'All Countries' }); }}
                                                                            style={{ cursor: 'pointer' }}
                                                                        >
                                                                            <span className="text-gray-800">All Countries</span>
                                                                        </div>
                                                                        {(countrySearchStates[index]?.filteredCountries || []).map((country) => {
                                                                            // Extract English name from country data
                                                                            const extractEnglishName = (value) => {
                                                                                if (!value) return '';
                                                                                if (typeof value === 'string' && value.trim().startsWith('{')) {
                                                                                    try {
                                                                                        const parsed = JSON.parse(value);
                                                                                        return parsed.en || parsed.ar || Object.values(parsed)[0] || '';
                                                                                    } catch (e) {
                                                                                        return value;
                                                                                    }
                                                                                }
                                                                                if (typeof value === 'object' && value !== null) {
                                                                                    return value.en || value.ar || Object.values(value)[0] || '';
                                                                                }
                                                                                return value;
                                                                            };
                                                                            
                                                                            const countryLabel = country.text ? extractEnglishName(country.text) : (country.name ? extractEnglishName(country.name) : country.short_name || '');
                                                                            
                                                                            return (
                                                                                <div 
                                                                                    key={country.id}
                                                                                    className="p-3 border-bottom cursor-pointer hover-bg-light d-flex align-items-center"
                                                                                    onMouseDown={(e) => { e.preventDefault(); handleCountrySelect(index, country); }}
                                                                                    style={{ cursor: 'pointer' }}
                                                                                >
                                                                                    <img 
                                                                                        src={`/flags/${country.code?.toLowerCase() || 'placeholder'}.png`} 
                                                                                        alt={countryLabel}
                                                                                        className="me-3"
                                                                                        style={{ width: '20px', height: '15px', objectFit: 'cover' }}
                                                                                        onError={(e) => { e.target.style.display = 'none'; }}
                                                                                    />
                                                                                    <div className="text-gray-800">{countryLabel}</div>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </>
                                                                ) : (
                                                                    <div className="p-3 text-muted text-center">No countries found</div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="col-md-2">
                                                    <label className="form-label fw-bold required">Price</label>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        className={`form-control ${errors[`prices.${index}.price`] ? 'is-invalid' : ''}`}
                                                        value={price.price}
                                                        onChange={(e) => handlePriceChange(index, 'price', e.target.value)}
                                                        placeholder="0.00"
                                                    />
                                                    {errors[`prices.${index}.price`] && (
                                                        <div className="invalid-feedback d-block">{errors[`prices.${index}.price`]}</div>
                                                    )}
                                                </div>

                                                <div className="col-md-2">
                                                    <label className="form-label fw-bold">Discounted Price</label>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        className="form-control"
                                                        value={price.current_price}
                                                        onChange={(e) => handlePriceChange(index, 'current_price', e.target.value)}
                                                        placeholder="0.00"
                                                    />
                                                </div>

                                                <div className="col-md-1">
                                                    <label className="form-label fw-bold">Default</label>
                                                    <div className="form-check form-switch mt-2">
                                                        <input
                                                            className="form-check-input"
                                                            type="checkbox"
                                                            checked={price.is_default}
                                                            onChange={(e) => handlePriceChange(index, 'is_default', e.target.checked)}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="col-md-1 d-flex align-items-end">
                                                    {formData.prices.length > 1 && (
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-light-danger"
                                                            onClick={() => removePrice(index)}
                                                        >
                                                            <i className="ki-duotone ki-trash fs-2">
                                                                <span className="path1"></span>
                                                                <span className="path2"></span>
                                                                <span className="path3"></span>
                                                                <span className="path4"></span>
                                                                <span className="path5"></span>
                                                            </i>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    <button
                                        type="button"
                                        className="btn btn-sm btn-light-primary"
                                        onClick={addPrice}
                                    >
                                        <i className="ki-duotone ki-plus fs-2">
                                            <span className="path1"></span>
                                            <span className="path2"></span>
                                        </i>
                                        Add Price
                                    </button>
                                </div>
                            </div>

                            <div className="separator separator-dashed my-10"></div>

                            {/* Plan Scopes Section */}
                            <div className="row mb-6">
                                <div className="col-12">
                                    <h3 className="fs-6 fw-bold mb-4">Plan Scopes (Cashier)</h3>

                                    <div className="card mb-5">
                                        <div className="card-header">
                                            <h4 className="card-title mb-0">Cashier Module</h4>
                                        </div>
                                        <div className="card-body">
                                            {[
                                                { key: 'users', label: 'Users' },
                                                { key: 'payment_links', label: 'Payment Links' },
                                                { key: 'branches', label: 'Branches' },
                                                { key: 'categories', label: 'Categories' },
                                                { key: 'products', label: 'Products' },
                                                { key: 'customers', label: 'Customers' },
                                                { key: 'suppliers', label: 'Suppliers' },
                                                { key: 'purchases', label: 'Purchases' },
                                                { key: 'sales', label: 'Sales' }
                                            ].map(({ key, label }) => (
                                                <div key={key} className="row mb-5 align-items-center">
                                                    <div className="col-md-3">
                                                        <label className="form-label fw-semibold">{label}</label>
                                                    </div>
                                                    <div className="col-md-2">
                                                        <div className="form-check form-switch form-check-custom form-check-solid">
                                                            <input
                                                                className="form-check-input"
                                                                type="checkbox"
                                                                checked={formData.scopes[key].is_enabled}
                                                                onChange={(e) => handleScopeChange(key, 'is_enabled', e.target.checked)}
                                                            />
                                                            <label className="form-check-label">Enable Limit</label>
                                                        </div>
                                                    </div>
                                                    {formData.scopes[key].is_enabled && (
                                                        <div className="col-md-4">
                                                            <div className="d-flex align-items-center gap-2">
                                                                <label className="form-label fw-semibold mb-0">Max count</label>
                                                                <input
                                                                    type="number"
                                                                    className="form-control"
                                                                    placeholder="Leave empty for unlimited"
                                                                    value={formData.scopes[key].max_count}
                                                                    onChange={(e) => handleScopeChange(key, 'max_count', e.target.value)}
                                                                    min="0"
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="separator separator-dashed my-10"></div>

                            <div className="row mb-6">
                                <div className="col-12">
                                    <h3 className="fs-6 fw-bold mb-4">Plan Features</h3>
                                    {formData.features.map((feature, index) => (
                                        <div key={index} className="feature-item mb-4 p-4 border rounded">
                                            <div className="row align-items-center">
                                                <div className="col-md-5">
                                                    <label className="form-label fw-semibold fs-6">Feature Name</label>
                                                    <input
                                                        type="text"
                                                        className="form-control form-control-solid"
                                                        value={feature.name}
                                                        onChange={(e) => handleFeatureChange(index, 'name', e.target.value)}
                                                        placeholder="Feature name"
                                                    />
                                                </div>
                                                <div className="col-md-4">
                                                    <div className="form-check form-switch form-check-custom form-check-solid mt-8">
                                                        <input
                                                            className="form-check-input"
                                                            type="checkbox"
                                                            checked={feature.is_enabled}
                                                            onChange={(e) => handleFeatureChange(index, 'is_enabled', e.target.checked)}
                                                        />
                                                        <label className="form-check-label">Is Enabled</label>
                                                    </div>
                                                </div>
                                                <div className="col-md-3">
                                                    {formData.features.length > 1 && (
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-light-danger remove-feature mt-8"
                                                            onClick={() => removeFeature(index)}
                                                        >
                                                            <i className="ki-duotone ki-trash fs-2">
                                                                <span className="path1"></span>
                                                                <span className="path2"></span>
                                                                <span className="path3"></span>
                                                                <span className="path4"></span>
                                                                <span className="path5"></span>
                                                            </i>
                                                            Remove
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-light-primary"
                                        onClick={addFeature}
                                    >
                                        <i className="ki-duotone ki-plus fs-2">
                                            <span className="path1"></span>
                                            <span className="path2"></span>
                                        </i>
                                        Add Feature
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="card-footer text-end">
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={saving}
                            >
                                {saving ? 'Updating...' : 'Update Plan'}
                            </button>
                            <Link to="/admin/plans" className="btn btn-light-danger ms-2">
                                Cancel
                            </Link>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdminPlanEdit;

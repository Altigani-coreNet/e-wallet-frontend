import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ADMIN_ENDPOINTS, AUTH_ENDPOINTS } from '../../../utils/constants';
import { getToken } from '../../../utils/api';
import { useToolbar } from '../../../contexts/ToolbarContext';

// Debounce function - moved outside component to avoid recreation on each render
const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
};

const AdminMerchantEdit = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { setTitle, setActions } = useToolbar();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [filteredCountries, setFilteredCountries] = useState([]);
    const [filteredCities, setFilteredCities] = useState([]);
    const [plans, setPlans] = useState([]);
    const [businessTypes, setBusinessTypes] = useState([]);
    const [loadingBusinessTypes, setLoadingBusinessTypes] = useState(false);
    const [availableScopes, setAvailableScopes] = useState([]);
    const [selectedScopes, setSelectedScopes] = useState([]);
    const [countrySearchTerm, setCountrySearchTerm] = useState('');
    const [citySearchTerm, setCitySearchTerm] = useState('');
    const [showCountryList, setShowCountryList] = useState(false);
    const [showCityList, setShowCityList] = useState(false);
    const [selectedCountry, setSelectedCountry] = useState(null);
    const [selectedCity, setSelectedCity] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        business_name: '',
        owner_name: '',
        email: '',
        phone: '',
        business_phone: '',
        address: '',
        country_id: '',
        city_id: '',
        business_type: '',
        trade_license_number: '',
        tax_number: '',
        is_active: true,
        status: '',
        plan_id: ''
    });

    useEffect(() => {
        setTitle('Edit Merchant');
        setActions(
            <Link to="/admin/merchants" className="btn btn-sm btn-light-danger">
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
        fetchMerchant();
        fetchPlans();
        fetchBusinessTypes();
        fetchScopes();
        // Don't load all countries initially - will load on dropdown open or search
    }, [id]);

    useEffect(() => {
        if (formData.country_id) {
            fetchCities(formData.country_id);
            // Fetch country to set selected country
            if (!selectedCountry) {
                fetchCountries().then(() => {
                    // Selected country will be set in fetchCountries
                });
            }
        }
    }, [formData.country_id, selectedCountry]);

    const fetchMerchant = async () => {
        try {
            setLoading(true);
            const token = getToken();
            const response = await axios.get(ADMIN_ENDPOINTS.MERCHANT_DETAILS(id), {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const isSuccess = response.data.success || response.data.status;
            if (isSuccess) {
                const merchant = response.data.data.merchant || response.data.data;
                setFormData({
                    name: merchant.name || '',
                    business_name: merchant.business_name || '',
                    owner_name: merchant.owner_name || '',
                    email: merchant.email || '',
                    phone: merchant.phone || '',
                    business_phone: merchant.business_phone || '',
                    address: merchant.address || '',
                    country_id: merchant.country_id || '',
                    city_id: merchant.city_id || '',
                    business_type: merchant.business_type || '',
                    trade_license_number: merchant.trade_license_number || '',
                    tax_number: merchant.tax_number || '',
                    is_active: merchant.is_active !== undefined ? merchant.is_active : true,
                    status: merchant.status || '',
                    plan_id: merchant.plan_id || ''
                });
                // Set selected scopes from merchant data
                if (merchant.scopes && Array.isArray(merchant.scopes)) {
                    setSelectedScopes(merchant.scopes);
                } else {
                    setSelectedScopes([]);
                }
            }
        } catch (error) {
            toast.error('Failed to load merchant');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch countries from API with optional search term
    const fetchCountries = async (searchTerm = '') => {
        try {
            const token = getToken();
            const url = searchTerm 
                ? `${AUTH_ENDPOINTS.COUNTRIES_SELECT}?search=${encodeURIComponent(searchTerm)}`
                : AUTH_ENDPOINTS.COUNTRIES_SELECT;
            
            const response = await axios.get(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.data.status) {
                const countriesList = response.data.data || [];
                setFilteredCountries(countriesList);
                
                // Set selected country if formData has country_id
                if (formData.country_id && !selectedCountry) {
                    const country = countriesList.find(c => c.id === formData.country_id);
                    if (country) {
                        setSelectedCountry(country);
                        setCountrySearchTerm(country.text || country.name);
                    }
                }
            }
        } catch (error) {
            console.error('Failed to fetch countries:', error);
        }
    };

    // Debounced country search function - uses server-side search
    const debouncedCountrySearch = useCallback(
        debounce((searchTerm) => {
            if (searchTerm.length >= 1) {
                // Use server-side search
                fetchCountries(searchTerm);
            } else {
                // Load all countries when search is cleared
                fetchCountries();
            }
        }, 500), // 500ms delay for server requests
        []
    );

    const handleCountrySearch = (searchTerm) => {
        setCountrySearchTerm(searchTerm);
        debouncedCountrySearch(searchTerm);
        setShowCountryList(true);
    };

    const handleCountryDropdownToggle = () => {
        if (!showCountryList) {
            // Opening dropdown - clear search and load all countries
            setCountrySearchTerm('');
            fetchCountries();
        }
        setShowCountryList(!showCountryList);
    };

    const handleCountrySelect = (country) => {
        setSelectedCountry(country);
        setCountrySearchTerm(country.text || country.name);
        setFormData(prev => ({ ...prev, country_id: country.id, city_id: '' }));
        setShowCountryList(false);
        setSelectedCity(null);
        setCitySearchTerm('');
        fetchCities(country.id);
    };

    const handleRemoveCountry = () => {
        setSelectedCountry(null);
        setCountrySearchTerm('');
        setFormData(prev => ({ ...prev, country_id: '', city_id: '' }));
        setFilteredCities([]);
    };

    // Fetch cities from API with optional search term
    const fetchCities = async (countryId, searchTerm = '') => {
        if (!countryId) {
            setFilteredCities([]);
            return;
        }
        
        try {
            const token = getToken();
            const params = { country_id: countryId };
            if (searchTerm) {
                params.search = searchTerm;
            }
            
            const response = await axios.get(AUTH_ENDPOINTS.CITIES_SELECT, {
                params,
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.data.status) {
                const citiesList = response.data.data || [];
                setFilteredCities(citiesList);
                
                // Set selected city if formData has city_id
                if (formData.city_id && !selectedCity) {
                    const city = citiesList.find(c => c.id === formData.city_id);
                    if (city) {
                        setSelectedCity(city);
                        setCitySearchTerm(city.text || city.name);
                    }
                }
            }
        } catch (error) {
            console.error('Failed to fetch cities:', error);
        }
    };

    // Debounced city search function - uses server-side search
    const debouncedCitySearch = useCallback(
        debounce((searchTerm) => {
            if (formData.country_id) {
                if (searchTerm.length >= 1) {
                    // Use server-side search
                    fetchCities(formData.country_id, searchTerm);
                } else {
                    // Load all cities when search is cleared
                    fetchCities(formData.country_id);
                }
            }
        }, 500), // 500ms delay for server requests
        [formData.country_id]
    );

    const handleCitySearch = (searchTerm) => {
        setCitySearchTerm(searchTerm);
        debouncedCitySearch(searchTerm);
        setShowCityList(true);
    };

    const handleCityDropdownToggle = () => {
        if (!showCityList && formData.country_id) {
            // Opening dropdown - clear search and load all cities
            setCitySearchTerm('');
            fetchCities(formData.country_id);
        }
        setShowCityList(!showCityList);
    };

    const handleCitySelect = (city) => {
        setSelectedCity(city);
        setCitySearchTerm(city.text || city.name);
        setFormData(prev => ({ ...prev, city_id: city.id }));
        setShowCityList(false);
    };

    const handleRemoveCity = () => {
        setSelectedCity(null);
        setCitySearchTerm('');
        setFormData(prev => ({ ...prev, city_id: '' }));
    };

    const fetchPlans = async () => {
        try {
            const token = getToken();
            const response = await axios.get(ADMIN_ENDPOINTS.PLANS_SELECT, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.data.status || response.data.success) {
                setPlans(response.data.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch plans:', error);
        }
    };

    const fetchBusinessTypes = async () => {
        setLoadingBusinessTypes(true);
        try {
            const token = getToken();
            const response = await axios.get(AUTH_ENDPOINTS.BUSINESS_TYPES_SELECT, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            // API returns: { status: true, data: [...] }
            if (response.data.status === true && response.data.data) {
                setBusinessTypes(Array.isArray(response.data.data) ? response.data.data : []);
            } else if (response.data.success && response.data.data) {
                setBusinessTypes(Array.isArray(response.data.data) ? response.data.data : []);
            } else if (Array.isArray(response.data)) {
                setBusinessTypes(response.data);
            } else {
                console.warn('Unexpected business types response format:', response.data);
                setBusinessTypes([]);
            }
        } catch (error) {
            console.error('Failed to fetch business types:', error);
            console.error('Error response:', error.response?.data);
            toast.error('Failed to load business types');
            setBusinessTypes([]);
        } finally {
            setLoadingBusinessTypes(false);
        }
    };

    const fetchScopes = async () => {
        try {
            const token = getToken();
            const response = await axios.get(ADMIN_ENDPOINTS.MERCHANTS_SCOPES, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.data.status || response.data.success) {
                setAvailableScopes(response.data.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch scopes:', error);
        }
    };

    const handleScopeToggle = (scopeKey) => {
        setSelectedScopes(prev => {
            if (prev.includes(scopeKey)) {
                return prev.filter(key => key !== scopeKey);
            } else {
                return [...prev, scopeKey];
            }
        });
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setSaving(true);
            const token = getToken();
            const submitData = {
                ...formData,
                scopes: selectedScopes,
            };
            const response = await axios.put(
                `${ADMIN_ENDPOINTS.MERCHANTS}/${id}`,
                submitData,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            const isSuccess = response.data.success || response.data.status;
            if (isSuccess) {
                toast.success('Merchant updated successfully');
                navigate(`/admin/merchants/${id}`);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update merchant');
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                <span className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }}></span>
            </div>
        );
    }

    return (
        <div className="post d-flex flex-column-fluid">
            <div id="kt_content_container" className="container-xxl">
                <form onSubmit={handleSubmit}>
                    <div className="row">
                        <div className="col-md-12">
                            <div className="card">
                                <div className="card-header border-0">
                                    <div className="card-title">
                                        <h2>Edit Merchant: {formData.name}</h2>
                                    </div>
                                </div>

                                <div className="card-body p-9">
                                    <div className="row">
                                        {/* Name */}
                                        <div className="col-md-6 mb-7">
                                            <label className="form-label fw-bold required">Merchant Name</label>
                                            <input
                                                type="text"
                                                name="name"
                                                className="form-control"
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>

                                        {/* Business Name */}
                                        <div className="col-md-6 mb-7">
                                            <label className="form-label fw-bold">Business Name</label>
                                            <input
                                                type="text"
                                                name="business_name"
                                                className="form-control"
                                                value={formData.business_name}
                                                onChange={handleInputChange}
                                            />
                                        </div>

                                        {/* Owner Name */}
                                        <div className="col-md-6 mb-7">
                                            <label className="form-label fw-bold required">Owner Name</label>
                                            <input
                                                type="text"
                                                name="owner_name"
                                                className="form-control"
                                                value={formData.owner_name}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>

                                        {/* Email */}
                                        <div className="col-md-6 mb-7">
                                            <label className="form-label fw-bold required">Email</label>
                                            <input
                                                type="email"
                                                name="email"
                                                className="form-control"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>

                                        {/* Phone */}
                                        <div className="col-md-6 mb-7">
                                            <label className="form-label fw-bold required">Phone</label>
                                            <input
                                                type="text"
                                                name="phone"
                                                className="form-control"
                                                value={formData.phone}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>

                                        {/* Business Phone */}
                                        <div className="col-md-6 mb-7">
                                            <label className="form-label fw-bold">Business Phone</label>
                                            <input
                                                type="text"
                                                name="business_phone"
                                                className="form-control"
                                                value={formData.business_phone}
                                                onChange={handleInputChange}
                                            />
                                        </div>

                                        {/* Business Type */}
                                        <div className="col-md-6 mb-7">
                                            <label className="form-label fw-bold required">Business Type</label>
                                            <select
                                                name="business_type"
                                                className="form-select"
                                                value={formData.business_type}
                                                onChange={handleInputChange}
                                                required
                                                disabled={loadingBusinessTypes}
                                            >
                                                <option value="">
                                                    {loadingBusinessTypes ? 'Loading business types...' : 'Select Business Type'}
                                                </option>
                                                {businessTypes.map((businessType) => (
                                                    <option key={businessType.id || businessType.value} value={businessType.value || businessType.id}>
                                                        {businessType.text || businessType.label || businessType.name}
                                                    </option>
                                                ))}
                                            </select>
                                            {!loadingBusinessTypes && businessTypes.length === 0 && (
                                                <div className="form-text text-warning">No business types available</div>
                                            )}
                                        </div>

                                        {/* Country */}
                                        <div className="col-md-6 mb-7">
                                            <label className="form-label fw-bold required">Country</label>
                                            <div className="position-relative">
                                                <div 
                                                    className="form-control h-50px d-flex align-items-center justify-content-between"
                                                    onClick={handleCountryDropdownToggle}
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    <div className="d-flex align-items-center">
                                                        {selectedCountry ? (
                                                            <>
                                                                <img 
                                                                    src={`/flags/${selectedCountry.code?.toLowerCase() || 'placeholder'}.png`} 
                                                                    alt={selectedCountry.text || selectedCountry.name}
                                                                    className="me-3"
                                                                    style={{ width: '20px', height: '15px', objectFit: 'cover' }}
                                                                    onError={(e) => { e.target.style.display = 'none'; }}
                                                                />
                                                                <span className="text-gray-800">{selectedCountry.text || selectedCountry.name}</span>
                                                            </>
                                                        ) : (
                                                            <span className="text-muted">Select Country</span>
                                                        )}
                                                    </div>
                                                    <div className="d-flex align-items-center">
                                                        {selectedCountry && (
                                                            <button 
                                                                type="button"
                                                                className="btn btn-icon btn-sm btn-light-danger me-2"
                                                                onClick={(e) => { e.stopPropagation(); handleRemoveCountry(); }}
                                                            >
                                                                <i className="ki-duotone ki-cross fs-2">
                                                                    <span className="path1"></span>
                                                                    <span className="path2"></span>
                                                                </i>
                                                            </button>
                                                        )}
                                                        <i className={`ki-duotone ki-down fs-2 ${showCountryList ? 'rotate-180' : ''}`}>
                                                            <span className="path1"></span>
                                                            <span className="path2"></span>
                                                        </i>
                                                    </div>
                                                </div>
                                                
                                                {showCountryList && (
                                                    <div className="position-absolute top-100 start-0 w-100 bg-white border rounded-3 shadow-sm mt-1" style={{ zIndex: 1000, maxHeight: '250px', overflowY: 'auto' }}>
                                                        <div className="p-2">
                                                            <input 
                                                                type="text" 
                                                                className="form-control form-control-sm mb-2" 
                                                                placeholder="Search countries..."
                                                                value={countrySearchTerm}
                                                                onChange={(e) => handleCountrySearch(e.target.value)}
                                                                onClick={(e) => e.stopPropagation()}
                                                                autoFocus
                                                            />
                                                        </div>
                                                        {filteredCountries.length > 0 ? (
                                                            filteredCountries.map((country) => (
                                                                <div 
                                                                    key={country.id}
                                                                    className="p-3 border-bottom cursor-pointer hover-bg-light d-flex align-items-center"
                                                                    onMouseDown={(e) => { e.preventDefault(); handleCountrySelect(country); }}
                                                                    style={{ cursor: 'pointer' }}
                                                                >
                                                                    <img 
                                                                        src={`/flags/${country.code?.toLowerCase() || 'placeholder'}.png`} 
                                                                        alt={country.text || country.name}
                                                                        className="me-3"
                                                                        style={{ width: '20px', height: '15px', objectFit: 'cover' }}
                                                                        onError={(e) => { e.target.style.display = 'none'; }}
                                                                    />
                                                                    <div className="text-gray-800">{country.text || country.name}</div>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <div className="p-3 text-muted text-center">No countries found</div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* City */}
                                        <div className="col-md-6 mb-7">
                                            <label className="form-label fw-bold">City</label>
                                            <div className="position-relative">
                                                <div 
                                                    className="form-control h-50px d-flex align-items-center justify-content-between"
                                                    onClick={(selectedCountry || formData.country_id) ? handleCityDropdownToggle : undefined}
                                                    style={{ 
                                                        cursor: (selectedCountry || formData.country_id) ? 'pointer' : 'not-allowed',
                                                        opacity: (selectedCountry || formData.country_id) ? 1 : 0.6
                                                    }}
                                                >
                                                    <div className="d-flex align-items-center">
                                                        {selectedCity ? (
                                                            <span className="text-gray-800">{selectedCity.text || selectedCity.name}</span>
                                                        ) : (
                                                            <span className="text-muted">
                                                                {!(selectedCountry || formData.country_id) ? 'Please select a country first' : 'Select City'}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="d-flex align-items-center">
                                                        {selectedCity && (
                                                            <button 
                                                                type="button"
                                                                className="btn btn-icon btn-sm btn-light-danger me-2"
                                                                onClick={(e) => { e.stopPropagation(); handleRemoveCity(); }}
                                                            >
                                                                <i className="ki-duotone ki-cross fs-2">
                                                                    <span className="path1"></span>
                                                                    <span className="path2"></span>
                                                                </i>
                                                            </button>
                                                        )}
                                                        <i className={`ki-duotone ki-down fs-2 ${showCityList ? 'rotate-180' : ''}`}>
                                                            <span className="path1"></span>
                                                            <span className="path2"></span>
                                                        </i>
                                                    </div>
                                                </div>
                                                
                                                {showCityList && (selectedCountry || formData.country_id) && (
                                                    <div className="position-absolute top-100 start-0 w-100 bg-white border rounded-3 shadow-sm mt-1" style={{ zIndex: 1000, maxHeight: '250px', overflowY: 'auto' }}>
                                                        <div className="p-2">
                                                            <input 
                                                                type="text" 
                                                                className="form-control form-control-sm mb-2" 
                                                                placeholder="Search cities..."
                                                                value={citySearchTerm}
                                                                onChange={(e) => handleCitySearch(e.target.value)}
                                                                onClick={(e) => e.stopPropagation()}
                                                                autoFocus
                                                            />
                                                        </div>
                                                        {filteredCities.length > 0 ? (
                                                            filteredCities.map((city) => (
                                                                <div 
                                                                    key={city.id}
                                                                    className="p-3 border-bottom cursor-pointer hover-bg-light d-flex align-items-center"
                                                                    onMouseDown={(e) => { e.preventDefault(); handleCitySelect(city); }}
                                                                    style={{ cursor: 'pointer' }}
                                                                >
                                                                    <div className="text-gray-800">{city.text || city.name}</div>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <div className="p-3 text-muted text-center">No cities found</div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="form-text">Optional</div>
                                        </div>

                                        {/* Address */}
                                        <div className="col-md-12 mb-7">
                                            <label className="form-label fw-bold">Address</label>
                                            <textarea
                                                name="address"
                                                className="form-control"
                                                rows="3"
                                                value={formData.address}
                                                onChange={handleInputChange}
                                            />
                                        </div>

                                        {/* Trade License Number */}
                                        <div className="col-md-6 mb-7">
                                            <label className="form-label fw-bold">Trade License Number</label>
                                            <input
                                                type="text"
                                                name="trade_license_number"
                                                className="form-control"
                                                value={formData.trade_license_number}
                                                onChange={handleInputChange}
                                            />
                                        </div>

                                        {/* Tax Number */}
                                        <div className="col-md-6 mb-7">
                                            <label className="form-label fw-bold">Tax Number</label>
                                            <input
                                                type="text"
                                                name="tax_number"
                                                className="form-control"
                                                value={formData.tax_number}
                                                onChange={handleInputChange}
                                            />
                                        </div>

                                        {/* Plan Selection */}
                                        <div className="col-md-6 mb-7">
                                            <label className="form-label fw-bold">Plan</label>
                                            <select
                                                name="plan_id"
                                                className="form-select"
                                                value={formData.plan_id}
                                                onChange={handleInputChange}
                                            >
                                                <option value="">Select Plan</option>
                                                {plans.map((plan) => (
                                                    <option key={plan.id} value={plan.id}>
                                                        {plan.name || plan.text} - ${plan.price ? parseFloat(plan.price).toFixed(2) : '0.00'} / {plan.plan_type || 'Monthly'}
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="form-text">Select a plan to assign to this merchant</div>
                                        </div>

                                        {/* Is Active */}
                                        <div className="col-md-6 mb-7">
                                            <label className="form-label fw-bold">Active Status</label>
                                            <div className="form-check form-switch form-check-custom form-check-solid mt-2">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    name="is_active"
                                                    checked={formData.is_active}
                                                    onChange={handleInputChange}
                                                />
                                                <label className="form-check-label">
                                                    {formData.is_active ? 'Active' : 'Inactive'}
                                                </label>
                                            </div>
                                        </div>

                                        {/* Scopes */}
                                        <div className="col-md-12 mb-7">
                                            <label className="form-label fw-bold">Scopes</label>
                                            <div className="row">
                                                {availableScopes.map((scope) => (
                                                    <div key={scope.id || scope.key} className="col-md-6 mb-3">
                                                        <div className="form-check form-check-custom form-check-solid">
                                                            <input
                                                                className="form-check-input"
                                                                type="checkbox"
                                                                id={`scope-${scope.id || scope.key}`}
                                                                checked={selectedScopes.includes(scope.id || scope.key)}
                                                                onChange={() => handleScopeToggle(scope.id || scope.key)}
                                                            />
                                                            <label className="form-check-label" htmlFor={`scope-${scope.id || scope.key}`}>
                                                                <div className="fw-bold">{scope.text || scope.label}</div>
                                                                {scope.description && (
                                                                    <div className="text-muted small">{scope.description}</div>
                                                                )}
                                                            </label>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            {availableScopes.length === 0 && (
                                                <div className="text-muted">No scopes available</div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="row mt-5">
                                        <div className="col-12">
                                            <div className="d-flex justify-content-end gap-3">
                                                <Link to={`/admin/merchants/${id}`} className="btn btn-light">
                                                    Cancel
                                                </Link>
                                                <button
                                                    type="submit"
                                                    className="btn btn-primary"
                                                    disabled={saving}
                                                >
                                                    {saving ? (
                                                        <>
                                                            <span className="spinner-border spinner-border-sm me-2"></span>
                                                            Saving...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <i className="ki-duotone ki-check fs-2">
                                                                <span className="path1"></span>
                                                                <span className="path2"></span>
                                                            </i>
                                                            Save Changes
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdminMerchantEdit;


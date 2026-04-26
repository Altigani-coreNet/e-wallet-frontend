import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AUTH_ENDPOINTS } from '../../../../utils/constants';

const MerchantProfile = ({ formData, setFormData, fieldErrors }) => {
    const [countries, setCountries] = useState([]);
    const [filteredCountries, setFilteredCountries] = useState([]);
    const [cities, setCities] = useState([]);
    const [filteredCities, setFilteredCities] = useState([]);
    const [businessTypes, setBusinessTypes] = useState([]);
    const [countrySearchTerm, setCountrySearchTerm] = useState('');
    const [citySearchTerm, setCitySearchTerm] = useState('');
    const [showCountryList, setShowCountryList] = useState(false);
    const [showCityList, setShowCityList] = useState(false);
    const [selectedCountry, setSelectedCountry] = useState(null);
    const [selectedCity, setSelectedCity] = useState(null);
    const countrySearchRef = useRef(null);
    const citySearchRef = useRef(null);
    const startDateRef = useRef(null);
    const expiredDateRef = useRef(null);
    const [loading, setLoading] = useState({
        countries: false,
        cities: false,
        businessTypes: false,
        terms: false
    });
    
    // Terms modal state
    const [showTermsModal, setShowTermsModal] = useState(false);
    const [termsContent, setTermsContent] = useState('');

    // Debounce function for country search
    const debounce = (func, delay) => {
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(null, args), delay);
        };
    };

    // Fetch countries with search
    const fetchCountries = async (searchTerm = '') => {
        setLoading(prev => ({ ...prev, countries: true }));
        try {
            const url = searchTerm 
                ? `${AUTH_ENDPOINTS.COUNTRIES_SELECT}?search=${encodeURIComponent(searchTerm)}`
                : AUTH_ENDPOINTS.COUNTRIES_SELECT;
            
            const response = await fetch(url);
            const data = await response.json();
            console.log('Countries API response:', data);
            
            if (data.status) {
                setCountries(data.data);
                setFilteredCountries(data.data);
                console.log('Countries loaded:', data.data.length);
            }
        } catch (error) {
            console.error('Error fetching countries:', error);
        } finally {
            setLoading(prev => ({ ...prev, countries: false }));
        }
    };

    // Debounced country search function - now uses server-side search
    const debouncedCountrySearch = useCallback(
        debounce((searchTerm) => {
            if (searchTerm.length >= 1) {
                fetchCountries(searchTerm);
            } else {
                fetchCountries();
            }
        }, 500),
        []
    );

    const handleCountrySearch = (searchTerm) => {
        setCountrySearchTerm(searchTerm);
        debouncedCountrySearch(searchTerm);
        setShowCountryList(true);
    };

    const handleCountryDropdownToggle = () => {
        if (!showCountryList) {
            setCountrySearchTerm('');
            fetchCountries();
        }
        setShowCountryList(!showCountryList);
    };

    const handleCountrySelect = (country) => {
        console.log('Country selected:', country);
        setSelectedCountry(country);
        setCountrySearchTerm(country.text);
        
        setFormData('country', country.id);
        setFormData('city', '');
        
        setShowCountryList(false);
        
        setSelectedCity(null);
        setCitySearchTerm('');
        
        fetchCities(country.id);
    };

    const handleRemoveCountry = () => {
        setSelectedCountry(null);
        setCountrySearchTerm('');
        
        setFormData('country', '');
        setFormData('city', '');
        
        setShowCountryList(false);
        setCities([]);
    };

    // Fetch cities by country
    const fetchCities = async (countryId) => {
        console.log('Fetching cities for country ID:', countryId);
        if (!countryId) {
            setCities([]);
            setFilteredCities([]);
            return;
        }
        
        setLoading(prev => ({ ...prev, cities: true }));
        try {
            const response = await fetch(`${AUTH_ENDPOINTS.CITIES_SELECT}?country_id=${countryId}`);
            const data = await response.json();
            console.log('Cities API response:', data);
            if (data.status) {
                setCities(data.data);
                setFilteredCities(data.data);
                console.log('Cities loaded:', data.data.length);
            }
        } catch (error) {
            console.error('Error fetching cities:', error);
        } finally {
            setLoading(prev => ({ ...prev, cities: false }));
        }
    };

    // Debounced city search function
    const debouncedCitySearch = useCallback(
        debounce((searchTerm) => {
            if (searchTerm.length >= 1) {
                const filtered = cities.filter(city =>
                    city.text.toLowerCase().includes(searchTerm.toLowerCase())
                );
                setFilteredCities(filtered);
            } else {
                setFilteredCities(cities);
            }
        }, 300),
        [cities]
    );

    const handleCitySearch = (searchTerm) => {
        setCitySearchTerm(searchTerm);
        debouncedCitySearch(searchTerm);
        setShowCityList(true);
    };

    const handleCitySelect = (city) => {
        console.log('=== CITY SELECTION DEBUG ===');
        console.log('Selected city:', city);
        console.log('City ID:', city.id);
        console.log('City text:', city.text);
        console.log('============================');
        
        setSelectedCity(city);
        setCitySearchTerm(city.text);
        
        setFormData('city', city.id);
        
        setShowCityList(false);
    };

    const handleRemoveCity = () => {
        setSelectedCity(null);
        setCitySearchTerm('');
        
        setFormData('city', '');
        
        setShowCityList(false);
    };

    // Fetch business types
    const fetchBusinessTypes = async () => {
        setLoading(prev => ({ ...prev, businessTypes: true }));
        try {
            const response = await fetch(AUTH_ENDPOINTS.BUSINESS_TYPES_SELECT);
            const data = await response.json();
            if (data.status) {
                setBusinessTypes(data.data);
            }
        } catch (error) {
            console.error('Error fetching business types:', error);
        } finally {
            setLoading(prev => ({ ...prev, businessTypes: false }));
        }
    };

    // Fetch terms and conditions content
    const fetchTermsContent = async () => {
        setLoading(prev => ({ ...prev, terms: true }));
        try {
            // We'll add this endpoint to constants
            const response = await fetch(AUTH_ENDPOINTS.CONTRACT_TERMS);
            const data = await response.json();
            if (data.success && data.data && data.data.terms) {
                setTermsContent(data.data.terms);
            } else {
                setTermsContent('Terms and Conditions content not available at the moment. Please contact support for more information.');
            }
        } catch (error) {
            console.error('Error fetching terms content:', error);
            setTermsContent('Terms and Conditions content not available at the moment. Please contact support for more information.');
        } finally {
            setLoading(prev => ({ ...prev, terms: false }));
        }
    };

    // Load data on component mount
    useEffect(() => {
        fetchCountries();
        fetchBusinessTypes();
    }, []);

    // Load cities when country changes
    useEffect(() => {
        console.log('formData.country changed:', formData.country);
        console.log('selectedCountry:', selectedCountry);
        
        if (formData.country) {
            fetchCities(formData.country);
            const country = countries.find(c => c.id === formData.country);
            if (country) {
                setSelectedCountry(country);
                setCountrySearchTerm(country.text);
            }
            setSelectedCity(null);
            setCitySearchTerm('');
            setFormData('city', '');
        } else {
            setCities([]);
            setFilteredCities([]);
            setSelectedCity(null);
            setCitySearchTerm('');
        }
    }, [formData.country, countries]);

    // Handle city selection when formData.city changes
    useEffect(() => {
        if (formData.city && cities.length > 0) {
            const city = cities.find(c => c.id === formData.city);
            if (city) {
                setSelectedCity(city);
                setCitySearchTerm(city.text);
            }
        }
    }, [formData.city, cities]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        if (name === 'business_type') {
            console.log('=== BUSINESS TYPE SELECTION DEBUG ===');
            console.log('Selected business type:', value);
            console.log('Available business types:', businessTypes);
            console.log('=====================================');
        }
        
        setFormData(name, value);
    };

    // Handle terms modal open
    const handleTermsClick = (e) => {
        e.preventDefault();
        setShowTermsModal(true);
        if (!termsContent) {
            fetchTermsContent();
        }
    };

    // Handle terms agreement
    const handleTermsAgree = () => {
        setFormData('accept_terms', true);
        setShowTermsModal(false);
    };

    // Handle terms modal close
    const handleTermsModalClose = () => {
        setShowTermsModal(false);
    };

    // Handle date input click to open calendar directly
    const handleDateClick = (e, dateRef) => {
        e.preventDefault();
        if (dateRef.current) {
            dateRef.current.focus();
            // Modern browsers support showPicker() API
            if (dateRef.current.showPicker) {
                try {
                    dateRef.current.showPicker();
                } catch (error) {
                    // Fallback to just focusing if showPicker is not supported
                    dateRef.current.focus();
                }
            } else {
                // For older browsers, just focus and click
                dateRef.current.focus();
                dateRef.current.click();
            }
        }
    };

    return (
        <div className="w-100">
            <div className="pb-10 pb-lg-15">
                <h2 className="fw-bolder text-dark">Merchant Profile</h2>
                <div className="text-muted fw-bold fs-6">
                    Please provide your business information and trade license details to complete your merchant profile.
                </div>
            </div>

            <div className="col-12">
                <h4 className="fw-bold text-dark mb-4">Business Information</h4>
            </div>

            <div className="row">
                {/* Basic Business Information */}
                <div className="col-md-6 fv-row mb-4">
                    <label htmlFor="owner_name" className="form-label">
                        Owner Name <span className="text-danger">*</span>
                    </label>
                    <input
                        type="text"
                        className={`form-control ${fieldErrors?.owner_name ? 'is-invalid' : ''}`}
                        id="owner_name"
                        name="owner_name"
                        value={formData.owner_name || ''}
                        onChange={handleChange}
                        placeholder="Enter Owner Name"
                        required
                        style={{ textTransform: 'none' }}
                    />
                    {fieldErrors?.owner_name && (
                        <div className="invalid-feedback">{fieldErrors.owner_name[0]}</div>
                    )}
                </div>

                <div className="col-md-6 fv-row mb-4">
                    <label htmlFor="business_name" className="form-label">
                        Business Name <span className="text-danger">*</span>
                    </label>
                    <input
                        type="text"
                        className={`form-control ${fieldErrors?.business_name ? 'is-invalid' : ''}`}
                        id="business_name"
                        name="business_name"
                        value={formData.business_name || ''}
                        onChange={handleChange}
                        placeholder="Enter Business Name"
                        required
                        style={{ textTransform: 'none' }}
                    />
                    {fieldErrors?.business_name && (
                        <div className="invalid-feedback">{fieldErrors.business_name[0]}</div>
                    )}
                </div>

                <div className="col-md-6 fv-row mb-4">
                    <label htmlFor="business_type" className="form-label">
                        Business Type <span className="text-danger">*</span>
                    </label>
                    <select
                        className={`form-select ${fieldErrors?.business_type ? 'is-invalid' : ''}`}
                        id="business_type"
                        name="business_type"
                        value={formData.business_type || ''}
                        onChange={handleChange}
                        required
                        disabled={loading.businessTypes}
                    >
                        <option value="">{loading.businessTypes ? 'Loading...' : 'Select Business Type'}</option>
                        {businessTypes.map(type => (
                            <option key={type.id} value={type.value}>
                                {type.text}
                            </option>
                        ))}
                    </select>
                    {fieldErrors?.business_type && (
                        <div className="invalid-feedback">{fieldErrors.business_type[0]}</div>
                    )}
                </div>

                <div className="col-md-6 fv-row mb-4">
                    <label htmlFor="business_phone" className="form-label">
                        Business Phone <span className="text-danger">*</span>
                    </label>
                    <input
                        type="tel"
                        className={`form-control ${fieldErrors?.business_phone ? 'is-invalid' : ''}`}
                        id="business_phone"
                        name="business_phone"
                        value={formData.business_phone || ''}
                        onChange={handleChange}
                        placeholder="Enter Business Phone"
                        required
                        style={{ textTransform: 'none' }}
                    />
                    {fieldErrors?.business_phone && (
                        <div className="invalid-feedback">{fieldErrors.business_phone[0]}</div>
                    )}
                </div>

                {/* Trade License Section */}
                <div className="col-12">
                    <h4 className="fw-bold text-dark mb-4">Trade License Information</h4>
                </div>

                <div className="col-md-6 fv-row mb-4">
                    <label htmlFor="trade_license_number" className="form-label">
                        Trade License Number <span className="text-danger">*</span>
                    </label>
                    <input
                        type="text"
                        className={`form-control ${fieldErrors?.trade_license_number ? 'is-invalid' : ''}`}
                        id="trade_license_number"
                        name="trade_license_number"
                        value={formData.trade_license_number || ''}
                        onChange={handleChange}
                        placeholder="Enter Trade License Number"
                        required
                        style={{ textTransform: 'none' }}
                    />
                    {fieldErrors?.trade_license_number && (
                        <div className="invalid-feedback">{fieldErrors.trade_license_number[0]}</div>
                    )}
                </div>

                <div className="col-md-6 fv-row mb-4">
                    <label htmlFor="trade_license_start_date" className="form-label">
                        Trade License Start Date <span className="text-danger">*</span>
                    </label>
                    <input
                        ref={startDateRef}
                        type="date"
                        className={`form-control ${fieldErrors?.trade_license_start_date ? 'is-invalid' : ''}`}
                        id="trade_license_start_date"
                        name="trade_license_start_date"
                        value={formData.trade_license_start_date || ''}
                        onChange={handleChange}
                        onClick={(e) => handleDateClick(e, startDateRef)}
                        required
                    />
                    {fieldErrors?.trade_license_start_date && (
                        <div className="invalid-feedback">{fieldErrors.trade_license_start_date[0]}</div>
                    )}
                </div>

                <div className="col-md-6 fv-row mb-4">
                    <label htmlFor="trade_license_expired_date" className="form-label">
                        Trade License Expired Date <span className="text-danger">*</span>
                    </label>
                    <input
                        ref={expiredDateRef}
                        type="date"
                        className={`form-control ${fieldErrors?.trade_license_expired_date ? 'is-invalid' : ''}`}
                        id="trade_license_expired_date"
                        name="trade_license_expired_date"
                        value={formData.trade_license_expired_date || ''}
                        onChange={handleChange}
                        onClick={(e) => handleDateClick(e, expiredDateRef)}
                        required
                    />
                    {fieldErrors?.trade_license_expired_date && (
                        <div className="invalid-feedback">{fieldErrors.trade_license_expired_date[0]}</div>
                    )}
                </div>

                <div className="col-md-6 fv-row mb-4">
                    <label htmlFor="tax_number" className="form-label">
                        Tax Number <span className="text-danger">*</span>
                    </label>
                    <input
                        type="text"
                        className={`form-control ${fieldErrors?.tax_number ? 'is-invalid' : ''}`}
                        id="tax_number"
                        name="tax_number"
                        value={formData.tax_number || ''}
                        onChange={handleChange}
                        placeholder="Enter Tax Number"
                        required
                        style={{ textTransform: 'none' }}
                    />
                    {fieldErrors?.tax_number && (
                        <div className="invalid-feedback">{fieldErrors.tax_number[0]}</div>
                    )}
                </div>

                {/* Location Information Section */}
                <div className="col-12">
                    <h4 className="fw-bold text-dark mb-4">Address Information</h4>
                </div>

                <div className="col-md-6 fv-row mb-4">
                    <label htmlFor="country" className="form-label">
                        Country <span className="text-danger">*</span>
                    </label>
                    <div className="position-relative">
                        <div 
                            className={`form-control h-50px d-flex align-items-center justify-content-between cursor-pointer ${fieldErrors?.country ? 'is-invalid' : ''}`}
                            onClick={handleCountryDropdownToggle}
                            style={{ cursor: 'pointer' }}
                        >
                            <div className="d-flex align-items-center">
                                {selectedCountry ? (
                                    <>
                                        <img 
                                            src={`/flags/${selectedCountry.short_name?.toLowerCase() || 'placeholder'}.png`} 
                                            alt={selectedCountry.text}
                                            className="me-3"
                                            style={{ width: '20px', height: '15px', objectFit: 'cover' }}
                                            onError={(e) => {
                                                e.target.src = '/flags/placeholder.png';
                                            }}
                                        />
                                        <span className="fw-bold text-gray-800">{selectedCountry.text}</span>
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
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleRemoveCountry();
                                        }}
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
                        
                        {loading.countries && (
                            <div className="position-absolute top-50 end-0 translate-middle-y me-3">
                                <div className="spinner-border spinner-border-sm" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                            </div>
                        )}
                        
                        {/* Country Dropdown */}
                        {showCountryList && (
                            <div className="position-absolute top-100 start-0 w-100 bg-white border rounded-3 shadow-sm mt-1" style={{ zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }}>
                                <div className="p-2">
                                    <input 
                                        type="text" 
                                        className="form-control form-control-sm mb-2" 
                                        placeholder="Search countries..."
                                        value={countrySearchTerm}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            handleCountrySearch(value);
                                        }}
                                        onFocus={(e) => e.stopPropagation()}
                                        onClick={(e) => e.stopPropagation()}
                                        style={{ textTransform: 'none' }}
                                    />
                                </div>
                                {loading.countries ? (
                                    <div className="p-3 text-center">
                                        <div className="spinner-border spinner-border-sm me-2" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                        <span className="text-muted">Searching countries...</span>
                                    </div>
                                ) : filteredCountries.length > 0 ? (
                                    filteredCountries.map((country) => (
                                        <div 
                                            key={country.id}
                                            className="p-3 border-bottom cursor-pointer hover-bg-light d-flex align-items-center"
                                            onMouseDown={(e) => {
                                                e.preventDefault();
                                                handleCountrySelect(country);
                                            }}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <img 
                                                src={`/flags/${country.short_name?.toLowerCase() || 'placeholder'}.png`} 
                                                alt={country.text}
                                                className="me-3"
                                                style={{ width: '20px', height: '15px', objectFit: 'cover' }}
                                                onError={(e) => {
                                                    e.target.src = '/flags/placeholder.png';
                                                }}
                                            />
                                            <div className="fw-bold text-gray-800">{country.text}</div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-3 text-muted text-center">
                                        <i className="fas fa-search me-2"></i>
                                        No countries found
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    {fieldErrors?.country && (
                        <div className="invalid-feedback d-block">{fieldErrors.country[0]}</div>
                    )}
                </div>

                <div className="col-md-6 fv-row mb-4">
                    <label htmlFor="city" className="form-label">
                        City <span className="text-danger">*</span>
                    </label>
                    <div className="position-relative">
                        <div 
                            className={`form-control h-50px d-flex align-items-center justify-content-between cursor-pointer ${fieldErrors?.city ? 'is-invalid' : ''}`}
                            onClick={() => {
                                if (selectedCountry || formData.country) {
                                    setShowCityList(!showCityList);
                                }
                            }}
                            style={{ 
                                cursor: (selectedCountry || formData.country) ? 'pointer' : 'not-allowed',
                                opacity: (selectedCountry || formData.country) ? 1 : 0.6
                            }}
                        >
                            <div className="d-flex align-items-center">
                                {selectedCity ? (
                                    <span className="fw-bold text-gray-800">{selectedCity.text}</span>
                                ) : (
                                    <span className="text-muted">
                                        {!(selectedCountry || formData.country) ? 'Please select a country first' : 'Select City'}
                                    </span>
                                )}
                            </div>
                            <div className="d-flex align-items-center">
                                {selectedCity && (
                                    <button 
                                        type="button"
                                        className="btn btn-icon btn-sm btn-light-danger me-2"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleRemoveCity();
                                        }}
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
                        
                        {loading.cities && (
                            <div className="position-absolute top-50 end-0 translate-middle-y me-3">
                                <div className="spinner-border spinner-border-sm" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                            </div>
                        )}
                        
                        {/* City Dropdown */}
                        {showCityList && (selectedCountry || formData.country) && (
                            <div className="position-absolute top-100 start-0 w-100 bg-white border rounded-3 shadow-sm mt-1" style={{ zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }}>
                                <div className="p-2">
                                    <input 
                                        type="text" 
                                        className="form-control form-control-sm mb-2" 
                                        placeholder="Search cities..."
                                        value={citySearchTerm}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            handleCitySearch(value);
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                        style={{ textTransform: 'none' }}
                                    />
                                </div>
                                {filteredCities.length > 0 ? (
                                    filteredCities.map((city) => (
                                        <div 
                                            key={city.id}
                                            className="p-3 border-bottom cursor-pointer hover-bg-light d-flex align-items-center"
                                            onMouseDown={(e) => {
                                                e.preventDefault();
                                                handleCitySelect(city);
                                            }}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <div className="fw-bold text-gray-800">{city.text}</div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-3 text-muted text-center">No cities found</div>
                                )}
                            </div>
                        )}
                    </div>
                    {fieldErrors?.city && (
                        <div className="invalid-feedback d-block">{fieldErrors.city[0]}</div>
                    )}
                </div>

                <div className="col-md-12 fv-row mb-4">
                    <label htmlFor="business_address" className="form-label">
                        Business Address <span className="text-danger">*</span>
                    </label>
                    <textarea
                        className={`form-control ${fieldErrors?.business_address ? 'is-invalid' : ''}`}
                        id="business_address"
                        name="business_address"
                        rows="3"
                        value={formData.business_address || ''}
                        onChange={handleChange}
                        placeholder="Enter Business Address"
                        required
                    ></textarea>
                    {fieldErrors?.business_address && (
                        <div className="invalid-feedback">{fieldErrors.business_address[0]}</div>
                    )}
                </div>

                {/* Terms and Conditions Checkbox */}
                <div className="col-12 fv-row mb-4">
                    <div className="form-check">
                        <input
                            className={`form-check-input ${fieldErrors?.accept_terms ? 'is-invalid' : ''}`}
                            type="checkbox"
                            id="accept_terms"
                            name="accept_terms"
                            checked={formData.accept_terms || false}
                            onChange={(e) => setFormData('accept_terms', e.target.checked)}
                            required
                        />
                        <label className="form-check-label" htmlFor="accept_terms">
                            I agree to the{' '}
                            <a 
                                href="#" 
                                className="text-primary fw-bold"
                                onClick={handleTermsClick}
                            >
                                Terms and Conditions
                            </a>
                            <span className="text-danger">*</span>
                        </label>
                        {fieldErrors?.accept_terms && (
                            <div className="invalid-feedback d-block">{fieldErrors.accept_terms[0]}</div>
                        )}
                    </div>
                </div>

                
            </div>

            {/* Terms and Conditions Modal */}
            {showTermsModal && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-lg modal-dialog-scrollable">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title fw-bold">Terms and Conditions</h5>
                                <button type="button" className="btn-close" onClick={handleTermsModalClose}></button>
                            </div>
                            <div className="modal-body">
                                {loading.terms ? (
                                    <div className="text-center py-5">
                                        <div className="spinner-border text-primary" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                        <p className="mt-3 text-muted">Loading terms and conditions...</p>
                                    </div>
                                ) : (
                                    <div 
                                        className="terms-content"
                                        style={{ 
                                            maxHeight: '400px', 
                                            overflowY: 'auto',
                                            lineHeight: '1.6',
                                            whiteSpace: 'pre-wrap'
                                        }}
                                        dangerouslySetInnerHTML={{ __html: termsContent }}
                                    />
                                )}
                            </div>
                            <div className="modal-footer">
                                <button 
                                    type="button" 
                                    className="btn btn-secondary" 
                                    onClick={handleTermsModalClose}
                                >
                                    Close
                                </button>
                                <button 
                                    type="button" 
                                    className="btn btn-primary" 
                                    onClick={handleTermsAgree}
                                    disabled={loading.terms}
                                >
                                    I Agree
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MerchantProfile;


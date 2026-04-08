import React, { useState, useEffect, useCallback } from 'react';
import { AUTH_ENDPOINTS, ADMIN_ENDPOINTS } from '../../../utils/constants';

const PartnerProfile = ({ formData, setFormData, fieldErrors }) => {
    const [countries, setCountries] = useState([]);
    const [filteredCountries, setFilteredCountries] = useState([]);
    const [cities, setCities] = useState([]);
    const [filteredCities, setFilteredCities] = useState([]);
    const [partnerCategories, setPartnerCategories] = useState([]);
    const [partnerCategorySearchTerm, setPartnerCategorySearchTerm] = useState('');
    const [countrySearchTerm, setCountrySearchTerm] = useState('');
    const [citySearchTerm, setCitySearchTerm] = useState('');
    const [showCountryList, setShowCountryList] = useState(false);
    const [showPartnerCategoryList, setShowPartnerCategoryList] = useState(false);
    const [showCityList, setShowCityList] = useState(false);
    const [selectedCountry, setSelectedCountry] = useState(null);
    const [selectedPartnerCategory, setSelectedPartnerCategory] = useState(null);
    const [selectedCity, setSelectedCity] = useState(null);
    const [loading, setLoading] = useState({
        countries: false,
        cities: false,
        partnerCategories: false,
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

    const fetchPartnerCategories = async (searchTerm = '') => {
        setLoading(prev => ({ ...prev, partnerCategories: true }));
        try {
            const query = new URLSearchParams({
                type: 'partner',
                parents_only: 'true',
                limit: '100',
            });
            if (searchTerm) query.set('search', searchTerm);

            const response = await fetch(`${ADMIN_ENDPOINTS.SERVICE_CATEGORIES_ACTIVE_PUBLIC}?${query.toString()}`);
            const data = await response.json();
            if (data.success || data.status) {
                setPartnerCategories(data.data || []);
            } else {
                setPartnerCategories([]);
            }
        } catch (error) {
            console.error('Error fetching partner categories:', error);
            setPartnerCategories([]);
        } finally {
            setLoading(prev => ({ ...prev, partnerCategories: false }));
        }
    };

    const debouncedPartnerCategorySearch = useCallback(
        debounce((searchTerm) => {
            fetchPartnerCategories(searchTerm);
        }, 500),
        []
    );

    const handlePartnerCategorySearch = (searchTerm) => {
        setPartnerCategorySearchTerm(searchTerm);
        debouncedPartnerCategorySearch(searchTerm);
        setShowPartnerCategoryList(true);
    };

    const handlePartnerCategoryDropdownToggle = () => {
        if (!showPartnerCategoryList) {
            setPartnerCategorySearchTerm('');
            fetchPartnerCategories();
        }
        setShowPartnerCategoryList(!showPartnerCategoryList);
    };

    const handlePartnerCategorySelect = (category) => {
        setSelectedPartnerCategory(category);
        setPartnerCategorySearchTerm(category.name_en || category.name_ar || category.code || '');
        setFormData('partner_category_id', category.id);
        setShowPartnerCategoryList(false);
    };

    const handleRemovePartnerCategory = () => {
        setSelectedPartnerCategory(null);
        setPartnerCategorySearchTerm('');
        setFormData('partner_category_id', '');
        setShowPartnerCategoryList(false);
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
        fetchPartnerCategories();
    }, []);

    useEffect(() => {
        if (!formData.partner_category_id || partnerCategories.length === 0) return;
        const match = partnerCategories.find(
            (c) => String(c.id) === String(formData.partner_category_id)
        );
        if (match) {
            setSelectedPartnerCategory(match);
            setPartnerCategorySearchTerm(match.name_en || match.name_ar || match.code || '');
        }
    }, [formData.partner_category_id, partnerCategories]);

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

    return (
        <div className="w-100">
            <div className="pb-10 pb-lg-15">
                <h2 className="fw-bolder text-dark">Partner Profile</h2>
                <div className="text-muted fw-bold fs-6">
                    Please provide your partner business information to complete onboarding.
                </div>
            </div>

            <div className="col-12">
                <h4 className="fw-bold text-dark mb-4">Business Information</h4>
            </div>

            <div className="row">
                {/* Basic Business Information */}
                <div className="col-md-6 fv-row mb-4">
                    <label htmlFor="owner_name" className="form-label">
                        Company Name <span className="text-danger">*</span>
                    </label>
                    <input
                        type="text"
                        className={`form-control ${fieldErrors?.owner_name ? 'is-invalid' : ''}`}
                        id="owner_name"
                        name="owner_name"
                        value={formData.owner_name || ''}
                        onChange={handleChange}
                        placeholder="Enter Company Name"
                        required
                        style={{ textTransform: 'none' }}
                    />
                    {fieldErrors?.owner_name && (
                        <div className="invalid-feedback">{fieldErrors.owner_name[0]}</div>
                    )}
                </div>

                <div className="col-md-6 fv-row mb-4">
                    <label htmlFor="name" className="form-label">
                        Business /Brand Name <span className="text-danger">*</span>
                    </label>
                    <input
                        type="text"
                        className={`form-control ${fieldErrors?.name ? 'is-invalid' : ''}`}
                        id="name"
                        name="name"
                        value={formData.name || ''}
                        onChange={handleChange}
                        placeholder="Enter Business /Brand Name"
                        required
                        style={{ textTransform: 'none' }}
                    />
                    {fieldErrors?.name && (
                        <div className="invalid-feedback">{fieldErrors.name[0]}</div>
                    )}
                </div>

                <div className="col-md-6 fv-row mb-4">
                    <label htmlFor="business_name" className="form-label">
                        Contact Person Name
                    </label>
                    <input
                        type="text"
                        className={`form-control ${fieldErrors?.business_name ? 'is-invalid' : ''}`}
                        id="business_name"
                        name="business_name"
                        value={formData.business_name || ''}
                        onChange={handleChange}
                        placeholder="Optional (defaults to Business /Brand Name)"
                        style={{ textTransform: 'none' }}
                    />
                    {fieldErrors?.business_name && (
                        <div className="invalid-feedback">{fieldErrors.business_name[0]}</div>
                    )}
                </div>

                <div className="col-md-6 fv-row mb-4">
                    <label htmlFor="business_phone" className="form-label">
                        Business Phone
                    </label>
                    <input
                        type="tel"
                        className={`form-control ${fieldErrors?.business_phone ? 'is-invalid' : ''}`}
                        id="business_phone"
                        name="business_phone"
                        value={formData.business_phone || ''}
                        onChange={handleChange}
                        placeholder="Enter Business Phone"
                        style={{ textTransform: 'none' }}
                    />
                    {fieldErrors?.business_phone && (
                        <div className="invalid-feedback">{fieldErrors.business_phone[0]}</div>
                    )}
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
                    <label htmlFor="partner_category_id" className="form-label">
                        Partner Category <span className="text-danger">*</span>
                    </label>
                    <div className="position-relative">
                        <div
                            className={`form-control h-50px d-flex align-items-center justify-content-between cursor-pointer ${fieldErrors?.partner_category_id ? 'is-invalid' : ''}`}
                            onClick={handlePartnerCategoryDropdownToggle}
                            style={{ cursor: 'pointer' }}
                        >
                            <div className="d-flex align-items-center">
                                {selectedPartnerCategory ? (
                                    <span className="fw-bold text-gray-800">
                                        {selectedPartnerCategory.name_en || selectedPartnerCategory.name_ar || selectedPartnerCategory.code}
                                    </span>
                                ) : (
                                    <span className="text-muted">Select partner category</span>
                                )}
                            </div>
                            <div className="d-flex align-items-center">
                                {selectedPartnerCategory && (
                                    <button
                                        type="button"
                                        className="btn btn-icon btn-sm btn-light-danger me-2"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleRemovePartnerCategory();
                                        }}
                                    >
                                        <i className="ki-duotone ki-cross fs-2">
                                            <span className="path1"></span>
                                            <span className="path2"></span>
                                        </i>
                                    </button>
                                )}
                                <i className={`ki-duotone ki-down fs-2 ${showPartnerCategoryList ? 'rotate-180' : ''}`}>
                                    <span className="path1"></span>
                                    <span className="path2"></span>
                                </i>
                            </div>
                        </div>

                        {loading.partnerCategories && (
                            <div className="position-absolute top-50 end-0 translate-middle-y me-3">
                                <div className="spinner-border spinner-border-sm" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                            </div>
                        )}

                        {showPartnerCategoryList && (
                            <div className="position-absolute top-100 start-0 w-100 bg-white border rounded-3 shadow-sm mt-1" style={{ zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }}>
                                <div className="p-2">
                                    <input
                                        type="text"
                                        className="form-control form-control-sm mb-2"
                                        placeholder="Search categories..."
                                        value={partnerCategorySearchTerm}
                                        onChange={(e) => handlePartnerCategorySearch(e.target.value)}
                                        onFocus={(e) => e.stopPropagation()}
                                        onClick={(e) => e.stopPropagation()}
                                        style={{ textTransform: 'none' }}
                                    />
                                </div>
                                {partnerCategories.length > 0 ? (
                                    partnerCategories.map((category) => (
                                        <div
                                            key={category.id}
                                            className="p-3 border-bottom cursor-pointer hover-bg-light d-flex align-items-center"
                                            onMouseDown={(e) => {
                                                e.preventDefault();
                                                handlePartnerCategorySelect(category);
                                            }}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <div className="fw-bold text-gray-800">
                                                {category.name_en || category.name_ar || category.code}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-3 text-muted text-center">No categories found</div>
                                )}
                            </div>
                        )}
                    </div>
                    {fieldErrors?.partner_category_id && (
                        <div className="invalid-feedback">{fieldErrors.partner_category_id[0]}</div>
                    )}
                </div>

                <div className="col-md-12 fv-row mb-4">
                    <label htmlFor="business_address" className="form-label">
                        Profile Summary <span className="text-danger">*</span>
                    </label>
                    <textarea
                        className={`form-control ${fieldErrors?.business_address ? 'is-invalid' : ''}`}
                        id="business_address"
                        name="business_address"
                        rows="3"
                        value={formData.business_address || ''}
                        onChange={handleChange}
                        placeholder="Enter profile summary"
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

export default PartnerProfile;


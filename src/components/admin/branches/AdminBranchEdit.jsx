import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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

const AdminBranchEdit = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const { setTitle, setActions } = useToolbar();

    const [formData, setFormData] = useState({
        merchant_id: '',
        name: '',
        address: '',
        country_id: '',
        city_id: '',
        is_active: true
    });

    const [merchants, setMerchants] = useState([]);
    const [filteredMerchants, setFilteredMerchants] = useState([]);
    const [merchantSearchTerm, setMerchantSearchTerm] = useState('');
    const [showMerchantList, setShowMerchantList] = useState(false);
    const [selectedMerchant, setSelectedMerchant] = useState(null);

    const [filteredCountries, setFilteredCountries] = useState([]);
    const [countrySearchTerm, setCountrySearchTerm] = useState('');
    const [showCountryList, setShowCountryList] = useState(false);
    const [selectedCountry, setSelectedCountry] = useState(null);

    const [filteredCities, setFilteredCities] = useState([]);
    const [citySearchTerm, setCitySearchTerm] = useState('');
    const [showCityList, setShowCityList] = useState(false);
    const [selectedCity, setSelectedCity] = useState(null);

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setTitle(t('admin.branchEdit.title'));
        setActions(null);
        fetchBranchDetails();
        fetchMerchants();
        // Don't load all countries initially - will load on dropdown open or search
    }, [id, setTitle, setActions, t]);

    useEffect(() => {
        if (formData.country_id && !selectedCountry) {
            // Fetch country to set selected country
            fetchCountries().then(() => {
                // This will be handled by the fetchCountries callback
            });
        }
    }, [formData.country_id, selectedCountry]);

    useEffect(() => {
        if (formData.country_id) {
            fetchCities(formData.country_id);
        }
    }, [formData.country_id]);

    useEffect(() => {
        if (formData.city_id && formData.country_id && !selectedCity) {
            // Fetch cities and find selected city
            fetchCities(formData.country_id).then(() => {
                // City selection will be handled after cities are loaded
            });
        }
    }, [formData.city_id, formData.country_id, selectedCity]);

    useEffect(() => {
        if (formData.merchant_id && merchants.length > 0 && !selectedMerchant) {
            const merchant = merchants.find(m => m.id === formData.merchant_id);
            if (merchant) {
                setSelectedMerchant(merchant);
            }
        }
    }, [formData.merchant_id, merchants, selectedMerchant]);

    const fetchBranchDetails = async () => {
        try {
            const token = getToken();
            const response = await axios.get(ADMIN_ENDPOINTS.BRANCH_DETAILS(id), {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const isSuccess = response.data.success || response.data.status;
            if (isSuccess && response.data.data) {
                const branchData = response.data.data.branch || response.data.data;
                setFormData({
                    merchant_id: branchData.merchant_id || '',
                    name: branchData.name || '',
                    address: branchData.address || '',
                    country_id: branchData.country_id || '',
                    city_id: branchData.city_id || '',
                    is_active: branchData.is_active ?? true
                });
            }
        } catch (error) {
            toast.error(t('admin.branchEdit.loadFailed'));
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMerchants = async () => {
        try {
            const token = getToken();
            const response = await axios.get(ADMIN_ENDPOINTS.MERCHANTS, {
                params: { per_page: 1000 },
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            const isSuccess = response.data.success || response.data.status;
            if (isSuccess && response.data.data) {
                const merchantsList = response.data.data.data || [];
                setMerchants(merchantsList);
                setFilteredMerchants(merchantsList);
            }
        } catch (error) {
            console.error('Failed to fetch merchants:', error);
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
                        let name = country.text || country.name;
                        if (typeof name === 'object' && name !== null) {
                            name = name[i18n.language] || name.en || name.ar || '';
                        }
                        setCountrySearchTerm(name);
                    }
                }
            }
        } catch (error) {
            console.error('Failed to fetch countries:', error);
        }
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
                        let name = city.text || city.name;
                        if (typeof name === 'object' && name !== null) {
                            name = name[i18n.language] || name.en || name.ar || '';
                        }
                        setCitySearchTerm(name);
                    }
                }
            }
        } catch (error) {
            console.error('Failed to fetch cities:', error);
        }
    };

    const handleMerchantSearch = (searchTerm) => {
        setMerchantSearchTerm(searchTerm);
        if (searchTerm.trim() === '') {
            setFilteredMerchants(merchants);
        } else {
            const filtered = merchants.filter(merchant =>
                (merchant.business_name || merchant.name || '').toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredMerchants(filtered);
        }
    };

    const handleMerchantSelect = (merchant) => {
        setSelectedMerchant(merchant);
        setShowMerchantList(false);
        setMerchantSearchTerm('');
        setFormData(prev => ({ ...prev, merchant_id: merchant.id }));
        if (errors.merchant_id) {
            setErrors(prev => ({ ...prev, merchant_id: null }));
        }
    };

    const handleRemoveMerchant = () => {
        setSelectedMerchant(null);
        setFormData(prev => ({ ...prev, merchant_id: '' }));
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
        setShowCountryList(false);
        setCountrySearchTerm('');
        setFormData(prev => ({ ...prev, country_id: country.id, city_id: '' }));
        setSelectedCity(null);
        if (errors.country_id) {
            setErrors(prev => ({ ...prev, country_id: null }));
        }
    };

    const handleRemoveCountry = () => {
        setSelectedCountry(null);
        setSelectedCity(null);
        setFormData(prev => ({ ...prev, country_id: '', city_id: '' }));
        setFilteredCities([]);
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
        setShowCityList(false);
        setCitySearchTerm('');
        setFormData(prev => ({ ...prev, city_id: city.id }));
        if (errors.city_id) {
            setErrors(prev => ({ ...prev, city_id: null }));
        }
    };

    const handleRemoveCity = () => {
        setSelectedCity(null);
        setFormData(prev => ({ ...prev, city_id: '' }));
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setErrors({});

        try {
            const token = getToken();
            const response = await axios.put(
                ADMIN_ENDPOINTS.BRANCH_DETAILS(id),
                formData,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            const isSuccess = response.data.success || response.data.status;
            if (isSuccess) {
                toast.success(t('admin.branchEdit.success'));
                navigate('/admin/branches');
            }
        } catch (error) {
            if (error.response?.status === 422) {
                setErrors(error.response.data.errors || {});
                toast.error(t('admin.branchCreate.validationError'));
            } else {
                toast.error(error.response?.data?.message || t('admin.branchEdit.failed'));
            }
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                <span className="spinner-border text-primary"></span>
            </div>
        );
    }

    return (
        <div className="post d-flex flex-column-fluid">
            <div id="kt_content_container" className="container-xxl">
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Edit Branch: {formData.name}</h3>
                        <div className="card-toolbar">
                            <Link to="/admin/branches" className="btn btn-sm btn-light">
                                <i className="ki-duotone ki-arrow-left fs-2">
                                    <span className="path1"></span>
                                    <span className="path2"></span>
                                </i>
                                Back to Branches
                            </Link>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="card-body">
                            <div className="row">
                                {/* Merchant */}
                                <div className="col-md-6 mb-7">
                                    <label className="form-label fw-bold required">Merchant</label>
                                    <div className="position-relative">
                                        <div 
                                            className={`form-control h-50px d-flex align-items-center justify-content-between ${errors.merchant_id ? 'is-invalid' : ''}`}
                                            onClick={() => setShowMerchantList(!showMerchantList)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <div className="d-flex align-items-center">
                                                {selectedMerchant ? (
                                                    <span className="text-gray-800">{selectedMerchant.business_name || selectedMerchant.name}</span>
                                                ) : (
                                                    <span className="text-muted">Select Merchant</span>
                                                )}
                                            </div>
                                            <div className="d-flex align-items-center">
                                                {selectedMerchant && (
                                                    <button 
                                                        type="button"
                                                        className="btn btn-icon btn-sm btn-light-danger me-2"
                                                        onClick={(e) => { e.stopPropagation(); handleRemoveMerchant(); }}
                                                    >
                                                        <i className="ki-duotone ki-cross fs-2">
                                                            <span className="path1"></span>
                                                            <span className="path2"></span>
                                                        </i>
                                                    </button>
                                                )}
                                                <i className={`ki-duotone ki-down fs-2 ${showMerchantList ? 'rotate-180' : ''}`}>
                                                    <span className="path1"></span>
                                                    <span className="path2"></span>
                                                </i>
                                            </div>
                                        </div>
                                        
                                        {showMerchantList && (
                                            <div className="position-absolute top-100 start-0 w-100 bg-white border rounded-3 shadow-sm mt-1" style={{ zIndex: 1000, maxHeight: '250px', overflowY: 'auto' }}>
                                                <div className="p-2">
                                                    <input 
                                                        type="text" 
                                                        className="form-control form-control-sm mb-2" 
                                                        placeholder="Search merchants..."
                                                        value={merchantSearchTerm}
                                                        onChange={(e) => handleMerchantSearch(e.target.value)}
                                                        onClick={(e) => e.stopPropagation()}
                                                        autoFocus
                                                    />
                                                </div>
                                                {filteredMerchants.length > 0 ? (
                                                    filteredMerchants.map((merchant) => (
                                                        <div 
                                                            key={merchant.id}
                                                            className="p-3 border-bottom cursor-pointer hover-bg-light"
                                                            onMouseDown={(e) => { e.preventDefault(); handleMerchantSelect(merchant); }}
                                                            style={{ cursor: 'pointer' }}
                                                        >
                                                            <div className="text-gray-800">{merchant.business_name || merchant.name}</div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="p-3 text-muted text-center">No merchants found</div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    {errors.merchant_id && <div className="invalid-feedback d-block">{errors.merchant_id}</div>}
                                </div>

                                {/* Branch Name */}
                                <div className="col-md-6 mb-7">
                                    <label className="form-label fw-bold required">Branch Name</label>
                                    <input
                                        type="text"
                                        className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        placeholder="Enter branch name"
                                    />
                                    {errors.name && <div className="invalid-feedback d-block">{errors.name}</div>}
                                </div>

                                {/* Address */}
                                <div className="col-md-12 mb-7">
                                    <label className="form-label fw-bold">Address</label>
                                    <textarea
                                        className={`form-control ${errors.address ? 'is-invalid' : ''}`}
                                        name="address"
                                        value={formData.address}
                                        onChange={handleInputChange}
                                        rows="3"
                                        placeholder="Enter branch address"
                                    ></textarea>
                                    {errors.address && <div className="invalid-feedback d-block">{errors.address}</div>}
                                </div>

                                {/* Country */}
                                <div className="col-md-6 mb-7">
                                    <label className="form-label fw-bold required">Country</label>
                                    <div className="position-relative">
                                        <div 
                                            className={`form-control h-50px d-flex align-items-center justify-content-between ${errors.country_id ? 'is-invalid' : ''}`}
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
                                    {errors.country_id && <div className="invalid-feedback d-block">{errors.country_id}</div>}
                                </div>

                                {/* City */}
                                <div className="col-md-6 mb-7">
                                    <label className="form-label fw-bold">{t('admin.branchCreate.city')}</label>
                                    <div className="position-relative">
                                        <div 
                                            className={`form-control h-50px d-flex align-items-center justify-content-between ${errors.city_id ? 'is-invalid' : ''} ${!formData.country_id ? 'bg-light' : ''}`}
                                            onClick={formData.country_id ? handleCityDropdownToggle : undefined}
                                            style={{ cursor: formData.country_id ? 'pointer' : 'not-allowed' }}
                                        >
                                            <div className="d-flex align-items-center">
                                                {selectedCity ? (
                                                    <span className="text-gray-800">
                                                        {(() => {
                                                            let name = selectedCity.text || selectedCity.name;
                                                            if (typeof name === 'object' && name !== null) {
                                                                name = name[i18n.language] || name.en || name.ar || '';
                                                            }
                                                            return name;
                                                        })()}
                                                    </span>
                                                ) : (
                                                    <span className="text-muted">{formData.country_id ? t('admin.branchCreate.selectCity') : t('admin.branchCreate.selectCountryFirst')}</span>
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
                                        
                                        {showCityList && formData.country_id && (
                                            <div className="position-absolute top-100 start-0 w-100 bg-white border rounded-3 shadow-sm mt-1" style={{ zIndex: 1000, maxHeight: '250px', overflowY: 'auto' }}>
                                                <div className="p-2">
                                                    <input 
                                                        type="text" 
                                                        className="form-control form-control-sm mb-2" 
                                                        placeholder={t('admin.branchCreate.searchCities')}
                                                        value={citySearchTerm}
                                                        onChange={(e) => handleCitySearch(e.target.value)}
                                                        onClick={(e) => e.stopPropagation()}
                                                        autoFocus
                                                    />
                                                </div>
                                                {filteredCities.length > 0 ? (
                                                    filteredCities.map((city) => {
                                                        let name = city.text || city.name;
                                                        if (typeof name === 'object' && name !== null) {
                                                            name = name[i18n.language] || name.en || name.ar || '';
                                                        }
                                                        return (
                                                            <div 
                                                                key={city.id}
                                                                className="p-3 border-bottom cursor-pointer hover-bg-light"
                                                                onMouseDown={(e) => { e.preventDefault(); handleCitySelect(city); }}
                                                                style={{ cursor: 'pointer' }}
                                                            >
                                                                <div className="text-gray-800">{name}</div>
                                                            </div>
                                                        );
                                                    })
                                                ) : (
                                                    <div className="p-3 text-muted text-center">{t('admin.branchCreate.noCities')}</div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    {errors.city_id && <div className="invalid-feedback d-block">{errors.city_id}</div>}
                                </div>

                                {/* Active Status */}
                                <div className="col-md-6 mb-7">
                                    <label className="form-label fw-bold">{t('admin.branchCreate.activeStatus')}</label>
                                    <div className="form-check form-switch form-check-custom form-check-solid mt-2">
                                        <input
                                            className="form-check-input"
                                            type="checkbox"
                                            name="is_active"
                                            checked={formData.is_active}
                                            onChange={handleInputChange}
                                        />
                                        <label className="form-check-label">
                                            {formData.is_active ? t('admin.common.active') : t('admin.common.inactive')}
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="card-footer d-flex justify-content-end py-6 px-9">
                            <Link to="/admin/branches" className="btn btn-light btn-active-light-primary me-2">
                                {t('admin.common.cancel')}
                            </Link>
                            <button type="submit" className="btn btn-primary" disabled={saving}>
                                {saving ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2"></span>
                                        {t('admin.branchEdit.updating')}
                                    </>
                                ) : (
                                    <>
                                        <i className="ki-duotone ki-check fs-2">
                                            <span className="path1"></span>
                                            <span className="path2"></span>
                                        </i>
                                        {t('admin.branchEdit.update')}
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AdminBranchEdit;



import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { ADMIN_ENDPOINTS, AUTH_ENDPOINTS } from '../../../utils/constants';
import { getToken } from '../../../utils/api';

// Debounce function - moved outside component to avoid recreation on each render
const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
};

const AdminCustomerForm = ({ customer, onSubmit, loading, errors = {} }) => {
    const [formData, setFormData] = useState({
        merchant_id: '',
        name: '',
        email: '',
        phone: '',
        company_name: '',
        tax_no: '',
        address: '',
        city: '',
        state: '',
        postal_code: '',
        country_id: '',
        status: 'active',
        deposit: '',
        expense: ''
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
    const [loadingCountries, setLoadingCountries] = useState(false);

    // Load customer data if editing
    useEffect(() => {
        if (customer) {
            setFormData({
                merchant_id: customer.merchant_id || '',
                name: customer.name || '',
                email: customer.email || '',
                phone: customer.phone || customer.phone_number || '',
                company_name: customer.company_name || '',
                tax_no: customer.tax_no || '',
                address: customer.address || '',
                city: customer.city || '',
                state: customer.state || '',
                postal_code: customer.postal_code || customer.zip || '',
                country_id: customer.country_id || '',
                status: customer.status || 'active',
                deposit: customer.deposit || '',
                expense: customer.expense || ''
            });

            // Set selected merchant if merchant_id exists
            if (customer.merchant_id && customer.merchant) {
                setSelectedMerchant(customer.merchant);
            }

            // Set selected country if country_id exists
            if (customer.country_id && customer.country) {
                setSelectedCountry(customer.country);
            }
        }
    }, [customer]);

    // Fetch merchants on mount
    useEffect(() => {
        fetchMerchants();
        // Don't load all countries initially - will load on dropdown open or search
    }, []);

    // Find and set merchant/country from IDs if objects not provided
    useEffect(() => {
        if (formData.merchant_id && !selectedMerchant && merchants.length > 0) {
            const merchant = merchants.find(m => m.id === formData.merchant_id);
            if (merchant) {
                setSelectedMerchant(merchant);
            }
        }
    }, [formData.merchant_id, merchants, selectedMerchant]);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            const merchantDropdown = event.target.closest('[data-merchant-dropdown]');
            const countryDropdown = event.target.closest('[data-country-dropdown]');
            
            if (showMerchantList && !merchantDropdown) {
                setShowMerchantList(false);
            }
            if (showCountryList && !countryDropdown) {
                setShowCountryList(false);
            }
        };

        if (showMerchantList || showCountryList) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => {
                document.removeEventListener('mousedown', handleClickOutside);
            };
        }
    }, [showMerchantList, showCountryList]);

    const fetchMerchants = async () => {
        try {
            const token = getToken();
            const response = await axios.get(ADMIN_ENDPOINTS.MERCHANTS, {
                params: { per_page: 1000 },
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            const isSuccess = response.data.success || response.data.status;
            if (isSuccess && response.data.data) {
                const merchantsList = response.data.data.data || response.data.data || [];
                setMerchants(merchantsList);
                setFilteredMerchants(merchantsList);
            }
        } catch (error) {
            console.error('Failed to fetch merchants:', error);
        }
    };

    // Fetch countries from API with optional search term
    const fetchCountries = async (searchTerm = '') => {
        setLoadingCountries(true);
        try {
            const token = getToken();
            const url = searchTerm 
                ? `${AUTH_ENDPOINTS.COUNTRIES_SELECT}?search=${encodeURIComponent(searchTerm)}`
                : AUTH_ENDPOINTS.COUNTRIES_SELECT;
            
            const response = await axios.get(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.data.status) {
                setFilteredCountries(response.data.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch countries:', error);
        } finally {
            setLoadingCountries(false);
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
        setFormData(prev => ({ ...prev, country_id: country.id }));
    };

    const handleRemoveCountry = () => {
        setSelectedCountry(null);
        setFormData(prev => ({ ...prev, country_id: '' }));
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="form">
            <div className="card-body">
                <div className="row g-5">
                    {/* Basic Information */}
                    <div className="col-12">
                        <h3 className="mb-5">Basic Information</h3>
                    </div>

                    {/* Merchant - Admin Only Field */}
                    <div className="col-md-6">
                        <label className="form-label fw-bold fs-6">Merchant</label>
                        <div className="position-relative" data-merchant-dropdown>
                            <div 
                                className={`form-control form-control-solid h-50px d-flex align-items-center justify-content-between ${errors.merchant_id ? 'is-invalid' : ''}`}
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
                        {errors.merchant_id && (
                            <div className="invalid-feedback d-block">{Array.isArray(errors.merchant_id) ? errors.merchant_id[0] : errors.merchant_id}</div>
                        )}
                    </div>

                    {/* Status */}
                    <div className="col-md-6">
                        <label className="form-label fw-bold fs-6">Status</label>
                        <select
                            name="status"
                            className="form-control form-control-solid"
                            value={formData.status}
                            onChange={handleChange}
                        >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>

                    {/* Name - Required */}
                    <div className="col-md-6">
                        <label className="form-label required fw-bold fs-6">Customer Name</label>
                        <input
                            type="text"
                            name="name"
                            className={`form-control form-control-solid ${errors.name ? 'is-invalid' : ''}`}
                            placeholder="Enter customer name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />
                        {errors.name && (
                            <div className="invalid-feedback d-block">{errors.name[0]}</div>
                        )}
                    </div>

                    {/* Email - Required */}
                    <div className="col-md-6">
                        <label className="form-label required fw-bold fs-6">Email</label>
                        <input
                            type="email"
                            name="email"
                            className={`form-control form-control-solid ${errors.email ? 'is-invalid' : ''}`}
                            placeholder="Enter email address"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                        {errors.email && (
                            <div className="invalid-feedback d-block">{errors.email[0]}</div>
                        )}
                    </div>

                    {/* Phone */}
                    <div className="col-md-6">
                        <label className="form-label fw-bold fs-6">Phone</label>
                        <input
                            type="tel"
                            name="phone"
                            className={`form-control form-control-solid ${errors.phone ? 'is-invalid' : ''}`}
                            placeholder="Enter phone number"
                            value={formData.phone}
                            onChange={handleChange}
                        />
                        {errors.phone && (
                            <div className="invalid-feedback d-block">{errors.phone[0]}</div>
                        )}
                    </div>

                    {/* Company Name */}
                    <div className="col-md-6">
                        <label className="form-label fw-bold fs-6">Company Name</label>
                        <input
                            type="text"
                            name="company_name"
                            className="form-control form-control-solid"
                            placeholder="Enter company name"
                            value={formData.company_name}
                            onChange={handleChange}
                        />
                    </div>

                    {/* Tax Number */}
                    <div className="col-md-6">
                        <label className="form-label fw-bold fs-6">Tax Number</label>
                        <input
                            type="text"
                            name="tax_no"
                            className="form-control form-control-solid"
                            placeholder="Enter tax number"
                            value={formData.tax_no}
                            onChange={handleChange}
                        />
                    </div>

                    {/* Address Information */}
                    <div className="col-12 mt-10">
                        <h3 className="mb-5">Address Information</h3>
                    </div>

                    {/* Address */}
                    <div className="col-md-12">
                        <label className="form-label fw-bold fs-6">Address</label>
                        <input
                            type="text"
                            name="address"
                            className="form-control form-control-solid"
                            placeholder="Enter street address"
                            value={formData.address}
                            onChange={handleChange}
                        />
                    </div>

                    {/* City */}
                    <div className="col-md-6">
                        <label className="form-label fw-bold fs-6">City</label>
                        <input
                            type="text"
                            name="city"
                            className="form-control form-control-solid"
                            placeholder="Enter city"
                            value={formData.city}
                            onChange={handleChange}
                        />
                    </div>

                    {/* State */}
                    <div className="col-md-6">
                        <label className="form-label fw-bold fs-6">State/Province</label>
                        <input
                            type="text"
                            name="state"
                            className="form-control form-control-solid"
                            placeholder="Enter state or province"
                            value={formData.state}
                            onChange={handleChange}
                        />
                    </div>

                    {/* Postal Code */}
                    <div className="col-md-6">
                        <label className="form-label fw-bold fs-6">Postal Code</label>
                        <input
                            type="text"
                            name="postal_code"
                            className="form-control form-control-solid"
                            placeholder="Enter postal code"
                            value={formData.postal_code}
                            onChange={handleChange}
                        />
                    </div>

                    {/* Country */}
                    <div className="col-md-6">
                        <label className="form-label fw-bold fs-6">Country</label>
                        <div className="position-relative">
                            <div 
                                className={`form-control form-control-solid h-50px d-flex align-items-center justify-content-between ${errors.country_id ? 'is-invalid' : ''}`}
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
                                <div className="position-absolute top-100 start-0 w-100 bg-white border rounded-3 shadow-sm mt-1" style={{ zIndex: 1000, maxHeight: '250px', overflowY: 'auto', overflowX: 'hidden' }}>
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
                                    {loadingCountries ? (
                                        <div className="p-3 text-center">
                                            <span className="spinner-border spinner-border-sm text-primary me-2"></span>
                                            <span className="text-muted">Loading countries...</span>
                                        </div>
                                    ) : filteredCountries.length > 0 ? (
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
                        {errors.country_id && (
                            <div className="invalid-feedback d-block">{Array.isArray(errors.country_id) ? errors.country_id[0] : errors.country_id}</div>
                        )}
                    </div>

                    {/* Financial Information */}
                    <div className="col-12 mt-10">
                        <h3 className="mb-5">Financial Information</h3>
                    </div>

                    {/* Deposit */}
                    <div className="col-md-6">
                        <label className="form-label fw-bold fs-6">Deposit</label>
                        <input
                            type="number"
                            step="0.01"
                            name="deposit"
                            className="form-control form-control-solid"
                            placeholder="0.00"
                            value={formData.deposit}
                            onChange={handleChange}
                        />
                    </div>

                    {/* Expense */}
                    <div className="col-md-6">
                        <label className="form-label fw-bold fs-6">Expense</label>
                        <input
                            type="number"
                            step="0.01"
                            name="expense"
                            className="form-control form-control-solid"
                            placeholder="0.00"
                            value={formData.expense}
                            onChange={handleChange}
                        />
                    </div>
                </div>
            </div>

            {/* Form Actions */}
            <div className="card-footer d-flex justify-content-end py-6 px-9">
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
                            <i className="ki-duotone ki-check fs-2">
                                <span className="path1"></span>
                                <span className="path2"></span>
                            </i>
                            Save Customer
                        </>
                    )}
                </button>
            </div>
        </form>
    );
};

export default AdminCustomerForm;


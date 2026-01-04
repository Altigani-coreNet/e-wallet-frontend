import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useToolbar } from '../../../../contexts/ToolbarContext';
import { createCity } from '../../../../services/adminCitiesService';
import { getCountriesSelect } from '../../../../services/adminCountriesService';

// Debounce function - moved outside component to avoid recreation on each render
const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
};

const AdminCityCreate = () => {
    const { setTitle, setActions } = useToolbar();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [filteredCountries, setFilteredCountries] = useState([]);
    const [countrySearchTerm, setCountrySearchTerm] = useState('');
    const [showCountryList, setShowCountryList] = useState(false);
    const [selectedCountry, setSelectedCountry] = useState(null);
    const [formData, setFormData] = useState({ name: { en: '', ar: '' }, country_id: '', status: true });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        setTitle('Create City');
        setActions(null);
        // Don't load all countries initially - will load on dropdown open or search
    }, [setTitle, setActions]);

    // Fetch countries from API with optional search term
    const fetchCountries = async (searchTerm = '') => {
        try {
            const response = await getCountriesSelect(searchTerm);
            if (response.success) {
                // API returns array directly, not nested in data.data
                const countriesList = Array.isArray(response.data) ? response.data : (response.data.data || []);
                setFilteredCountries(countriesList);
            }
        } catch (error) {
            console.error('Error fetching countries:', error);
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
        let displayText = country.text || country.name;
        // text is an object: {ar: "...", en: "..."}
        if (typeof displayText === 'object' && displayText !== null) {
            displayText = displayText.en || displayText.ar || '';
        } else if (typeof displayText === 'string' && displayText.startsWith('{')) {
            // Fallback for JSON string
            try {
                const parsed = JSON.parse(displayText);
                displayText = parsed.en || parsed.ar || displayText;
            } catch (e) {}
        }
        setCountrySearchTerm(displayText);
        setFormData(prev => ({ ...prev, country_id: country.id }));
        setShowCountryList(false);
    };

    const handleRemoveCountry = () => {
        setSelectedCountry(null);
        setCountrySearchTerm('');
        setFormData(prev => ({ ...prev, country_id: '' }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        try {
            const response = await createCity(formData);
            if (response.success) {
                toast.success('City created successfully');
                navigate('/admin/system/cities');
            } else {
                if (response.errors) setErrors(response.errors);
                toast.error(response.error || 'Failed to create city');
            }
        } catch (error) {
            toast.error('Failed to create city');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card">
            <div className="card-header"><h3 className="card-title">Create New City</h3></div>
            <form onSubmit={handleSubmit}>
                <div className="card-body">
                    <div className="row">
                        <div className="col-md-6 mb-5">
                            <label className="form-label required">Name (English)</label>
                            <input type="text" className={`form-control ${errors['name.en'] ? 'is-invalid' : ''}`} value={formData.name.en} onChange={(e) => setFormData({ ...formData, name: { ...formData.name, en: e.target.value } })} placeholder="Enter city name in English" />
                            {errors['name.en'] && <div className="invalid-feedback">{errors['name.en'][0]}</div>}
                        </div>

                        <div className="col-md-6 mb-5">
                            <label className="form-label required">Name (Arabic)</label>
                            <input type="text" className={`form-control ${errors['name.ar'] ? 'is-invalid' : ''}`} value={formData.name.ar} onChange={(e) => setFormData({ ...formData, name: { ...formData.name, ar: e.target.value } })} placeholder="أدخل اسم المدينة بالعربية" dir="rtl" />
                            {errors['name.ar'] && <div className="invalid-feedback">{errors['name.ar'][0]}</div>}
                        </div>

                        <div className="col-md-6 mb-5">
                            <label className="form-label required">Country</label>
                            <div className="position-relative">
                                <div className={`form-control h-50px d-flex align-items-center justify-content-between ${errors.country_id ? 'is-invalid' : ''}`} onClick={handleCountryDropdownToggle} style={{ cursor: 'pointer' }}>
                                    <div className="d-flex align-items-center">
                                        {selectedCountry ? (
                                            <span className="text-gray-800">{countrySearchTerm}</span>
                                        ) : (
                                            <span className="text-muted">Select Country</span>
                                        )}
                                    </div>
                                    <div className="d-flex align-items-center">
                                        {selectedCountry && (
                                            <button type="button" className="btn btn-icon btn-sm btn-light-danger me-2" onClick={(e) => { e.stopPropagation(); handleRemoveCountry(); }}>
                                                <i className="ki-duotone ki-cross fs-2"><span className="path1"></span><span className="path2"></span></i>
                                            </button>
                                        )}
                                        <i className={`ki-duotone ki-down fs-2 ${showCountryList ? 'rotate-180' : ''}`}><span className="path1"></span><span className="path2"></span></i>
                                    </div>
                                </div>
                                
                                {showCountryList && (
                                    <div className="position-absolute top-100 start-0 w-100 bg-white border rounded-3 shadow-sm mt-1" style={{ zIndex: 1000, maxHeight: '250px', overflowY: 'auto' }}>
                                        <div className="p-2">
                                            <input type="text" className="form-control form-control-sm mb-2" placeholder="Search countries..." value={countrySearchTerm} onChange={(e) => handleCountrySearch(e.target.value)} onClick={(e) => e.stopPropagation()} autoFocus />
                                        </div>
                                        {filteredCountries.length > 0 ? (
                                            filteredCountries.map((country) => {
                                                let displayText = country.text || country.name;
                                                // text is an object: {ar: "...", en: "..."}
                                                if (typeof displayText === 'object' && displayText !== null) {
                                                    displayText = displayText.en || displayText.ar || '';
                                                } else if (typeof displayText === 'string' && displayText.startsWith('{')) {
                                                    // Fallback for JSON string
                                                    try {
                                                        const parsed = JSON.parse(displayText);
                                                        displayText = parsed.en || parsed.ar || displayText;
                                                    } catch (e) {}
                                                }
                                                return (
                                                    <div key={country.id} className="p-3 border-bottom cursor-pointer hover-bg-light d-flex align-items-center" onMouseDown={(e) => { e.preventDefault(); handleCountrySelect(country); }} style={{ cursor: 'pointer' }}>
                                                        <div className="text-gray-800">{displayText}</div>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="p-3 text-muted text-center">No countries found</div>
                                        )}
                                    </div>
                                )}
                            </div>
                            {errors.country_id && <div className="invalid-feedback d-block">{errors.country_id[0]}</div>}
                        </div>

                        <div className="col-md-6 mb-5">
                            <label className="form-label required">Status</label>
                            <select className={`form-select ${errors.status ? 'is-invalid' : ''}`} value={formData.status ? '1' : '0'} onChange={(e) => setFormData({ ...formData, status: e.target.value === '1' })}>
                                <option value="1">Active</option>
                                <option value="0">Inactive</option>
                            </select>
                            {errors.status && <div className="invalid-feedback">{errors.status[0]}</div>}
                        </div>
                    </div>
                </div>

                <div className="card-footer d-flex justify-content-end gap-2">
                    <button type="button" className="btn btn-light" onClick={() => navigate('/admin/system/cities')} disabled={loading}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Creating...' : 'Create City'}</button>
                </div>
            </form>
        </div>
    );
};

export default AdminCityCreate;

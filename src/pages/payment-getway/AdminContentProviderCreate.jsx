import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ADMIN_ENDPOINTS, AUTH_ENDPOINTS } from '../../utils/constants';
import { getToken } from '../../utils/api';
import { createPartner } from '../../services/adminPartnersService';
import axios from '../../utils/axiosConfig';
import { useToolbar } from '../../contexts/ToolbarContext';
import SearchableDropdown from '../../common/filters/SearchableDropdown';

// Debounce function - moved outside component to avoid recreation on each render
const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
};

const AdminContentProviderCreate = () => {
    const navigate = useNavigate();
    const { setTitle, setActions } = useToolbar();
    const [saving, setSaving] = useState(false);
    const [filteredCountries, setFilteredCountries] = useState([]);
    const [countrySearchTerm, setCountrySearchTerm] = useState('');
    const [selectedCountry, setSelectedCountry] = useState(null);
    
    // Operator states
    const [operators, setOperators] = useState([]);
    const [loadingOperators, setLoadingOperators] = useState(false);
    const [operatorsEnabled, setOperatorsEnabled] = useState(false);
    const [operatorSearchTerm, setOperatorSearchTerm] = useState('');
    const [selectedOperatorOption, setSelectedOperatorOption] = useState(null);
    
    // Image preview state
    const [imagePreview, setImagePreview] = useState(null);
    const [logoFile, setLogoFile] = useState(null);
    
    const [partnerCategories, setPartnerCategories] = useState([]);
    const [loadingPartnerCategories, setLoadingPartnerCategories] = useState(false);
    const [partnerCategoriesEnabled, setPartnerCategoriesEnabled] = useState(false);
    const [partnerCategorySearchTerm, setPartnerCategorySearchTerm] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        business_name: '',
        owner_name: '',
        email: '',
        phone: '',
        business_phone: '',
        address: '',
        country_id: '',
        partner_category_id: '',
        operator_id: '',
        is_active: true,
        status: 'pending'
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        setTitle('Add New Partner');
        setActions(
            <Link to="/admin/partners" className="btn btn-sm btn-light-danger">
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
        // Don't load all countries initially - will load on dropdown open or search
    }, []);


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
                setFilteredCountries(response.data.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch countries:', error);
            toast.error('Failed to load countries');
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
    };

    const handleCountrySelect = (option) => {
        const country = filteredCountries.find(c => c.id === option.value);
        if (country) {
            setSelectedCountry(country);
            setFormData(prev => ({ ...prev, country_id: country.id, operator_id: '' }));
            // Reset operator when country changes
            setSelectedOperatorOption(null);
            setOperators([]);
        }
    };

    const handleCountryClear = () => {
        setSelectedCountry(null);
        setFormData(prev => ({ ...prev, country_id: '' }));
    };

    const handleCountryOpen = () => {
        if (filteredCountries.length === 0) {
            fetchCountries();
        }
    };

    const handleCountrySearchChange = (value) => {
        setCountrySearchTerm(value);
        debouncedCountrySearch(value);
    };

    // Convert countries to options format for SearchableDropdown
    const countryOptions = useMemo(() => {
        return filteredCountries.map((country) => ({
            value: country.id,
            label: country.text || country.name,
            code: country.code,
            ...country
        }));
    }, [filteredCountries]);

    // Find selected country option
    const selectedCountryOption = useMemo(() => {
        if (!selectedCountry) return null;
        return countryOptions.find(opt => opt.value === selectedCountry.id) || null;
    }, [selectedCountry, countryOptions]);

    const fetchPartnerCategories = useCallback(async (searchTerm = '') => {
        try {
            setLoadingPartnerCategories(true);
            const token = getToken();
            const params = {
                type: 'partner',
                parents_only: true,
                limit: 100,
                include_inactive: true,
            };
            if (searchTerm) params.search = searchTerm;
            const response = await axios.get(ADMIN_ENDPOINTS.SERVICE_CATEGORIES_ACTIVE, {
                params,
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.data.success || response.data.status) {
                const list = response.data.data || [];
                setPartnerCategories(
                    list.map((c) => ({
                        value: c.id,
                        label: c.name_en || c.name_ar || c.code,
                        ...c,
                    }))
                );
            } else {
                setPartnerCategories([]);
            }
        } catch (error) {
            console.error('Failed to load partner categories:', error);
            setPartnerCategories([]);
        } finally {
            setLoadingPartnerCategories(false);
        }
    }, []);

    useEffect(() => {
        if (!partnerCategoriesEnabled) return;
        const timer = setTimeout(() => {
            fetchPartnerCategories(partnerCategorySearchTerm);
        }, 300);
        return () => clearTimeout(timer);
    }, [partnerCategoriesEnabled, partnerCategorySearchTerm, fetchPartnerCategories]);

    const partnerCategoryOptions = useMemo(() => partnerCategories, [partnerCategories]);

    const selectedPartnerCategoryOption = useMemo(() => {
        if (!formData.partner_category_id) return null;
        return (
            partnerCategoryOptions.find((o) => String(o.value) === String(formData.partner_category_id)) || null
        );
    }, [formData.partner_category_id, partnerCategoryOptions]);

    const handlePartnerCategorySelect = (option) => {
        setFormData((prev) => ({ ...prev, partner_category_id: option?.value || '' }));
        if (errors.partner_category_id) {
            setErrors((prev) => ({ ...prev, partner_category_id: '' }));
        }
    };

    const handlePartnerCategoryClear = () => {
        setFormData((prev) => ({ ...prev, partner_category_id: '' }));
    };

    const handlePartnerCategoryOpen = () => {
        setPartnerCategoriesEnabled(true);
        if (partnerCategories.length === 0 && !loadingPartnerCategories) {
            fetchPartnerCategories('');
        }
    };

    const handlePartnerCategorySearchChange = (value) => {
        setPartnerCategorySearchTerm(value);
        setPartnerCategoriesEnabled(true);
    };

    // Load operators
    const loadOperators = useCallback(
        async (search = '', countryId = null) => {
            try {
                setLoadingOperators(true);
                const params = {};
                if (search) params.search = search;
                if (countryId) params.country_id = countryId;
                
                const endpoint = ADMIN_ENDPOINTS.OPERATORS_ACTIVE;
                if (!endpoint) {
                    console.error('OPERATORS_ACTIVE endpoint is undefined');
                    setOperators([]);
                    return;
                }
                
                const response = await axios.get(endpoint, { params });
                if (response.data && response.data.success) {
                    const list = Array.isArray(response.data.data) ? response.data.data : [];
                    setOperators(list.map(op => ({
                        value: op.id,
                        label: op.name || String(op.id),
                        ...op,
                    })));
                } else {
                    setOperators([]);
                }
            } catch (error) {
                console.error('Error loading operators:', error);
                setOperators([]);
            } finally {
                setLoadingOperators(false);
            }
        },
        []
    );

    const operatorOptions = useMemo(
        () =>
            operators
                .filter(op => op && op.value !== undefined && op.value !== null)
                .map((operator) => ({
                    value: operator.value,
                    label: operator.label || String(operator.value),
                })),
        [operators]
    );

    // Load operators when country changes or when operatorsEnabled
    useEffect(() => {
        if (!operatorsEnabled) return;
        const handler = setTimeout(() => {
            loadOperators(operatorSearchTerm, formData.country_id || null);
        }, 300);
        return () => clearTimeout(handler);
    }, [operatorsEnabled, operatorSearchTerm, formData.country_id, loadOperators]);

    // Reload operators when country changes
    useEffect(() => {
        if (formData.country_id && operatorsEnabled) {
            loadOperators(operatorSearchTerm, formData.country_id);
            // Reset operator when country changes
            if (formData.operator_id) {
                setFormData(prev => ({ ...prev, operator_id: '' }));
                setSelectedOperatorOption(null);
                setOperators([]);
            }
        } else if (!formData.country_id && operators.length > 0 && operatorsEnabled) {
            // If country is cleared, reload all operators
            loadOperators(operatorSearchTerm, null);
        }
    }, [formData.country_id]);

    const handleOperatorSelect = useCallback((option) => {
        setSelectedOperatorOption(option);
        setFormData(prev => ({ ...prev, operator_id: option?.value || '' }));
    }, []);

    const handleOperatorClear = useCallback(() => {
        setSelectedOperatorOption(null);
        setFormData(prev => ({ ...prev, operator_id: '' }));
    }, []);

    const handleOperatorOpen = useCallback(() => {
        if (!formData.country_id) {
            toast.warning("Please select a country first");
            return;
        }
        setOperatorsEnabled(true);
        if (operators.length === 0 && !loadingOperators) {
            loadOperators(operatorSearchTerm, formData.country_id);
        }
    }, [operators.length, loadingOperators, operatorSearchTerm, formData.country_id, loadOperators]);

    const handleOperatorSearchChange = useCallback((value) => {
        setOperatorSearchTerm(value);
        setOperatorsEnabled(true);
    }, []);

    // Handle image upload
    const handleImageChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setLogoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };




    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.name?.trim()) {
            newErrors.name = 'Content provider name is required';
        }

        if (!formData.owner_name?.trim()) {
            newErrors.owner_name = 'Owner name is required';
        }

        if (!formData.email?.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Invalid email format';
        }

        if (!formData.phone?.trim()) {
            newErrors.phone = 'Phone is required';
        }

        if (!formData.country_id) {
            newErrors.country_id = 'Country is required';
        }

        if (!formData.partner_category_id) {
            newErrors.partner_category_id = 'Partner category is required';
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

            const hasLogo = logoFile !== null;

            let submitData;

            if (hasLogo) {
                submitData = new FormData();
                submitData.append('name', formData.name);
                submitData.append('business_name', formData.business_name || formData.name);
                submitData.append('owner_name', formData.owner_name || '');
                submitData.append('email', formData.email);
                submitData.append('phone', formData.phone || '');
                submitData.append('business_phone', formData.business_phone || '');
                submitData.append('address', formData.address || '');
                submitData.append('country_id', formData.country_id || '');
                submitData.append('partner_category_id', formData.partner_category_id || '');
                submitData.append('is_active', formData.is_active ? '1' : '0');
                submitData.append('status', formData.status || 'pending');

                if (logoFile) {
                    submitData.append('logo', logoFile);
                }
            } else {
                submitData = {
                    ...formData,
                    business_name: formData.business_name || formData.name,
                };

                delete submitData.business_type;
                delete submitData.plan_id;
                delete submitData.city_id;
                delete submitData.currency_id;
                delete submitData.scopes;
                delete submitData.operator_id;
            }

            const result = await createPartner(submitData);
            if (!result.success) {
                toast.error(result.error);
                if (result.errors) setErrors(result.errors);
                return;
            }

            const isSuccess = result.data.success || result.data.status;
            if (isSuccess) {
                toast.success('Partner created successfully');
                navigate('/admin/partners');
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Failed to create partner';
            toast.error(errorMessage);

            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            }

            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="post d-flex flex-column-fluid">
            <div id="kt_content_container" className="container-xxl">
                <form onSubmit={handleSubmit}>
                    <div className="row">
                        {/* Picture Card - Left Side */}
                        <div className="col-md-3 mb-7">
                            <div className="card card-flush">
                                <div className="card-header">
                                    <div className="card-title">
                                        <h2>Logo</h2>
                                    </div>
                                </div>
                                <div className="card-body text-center pt-0">
                                    <div className="text-center mb-10" style={{ position: 'relative' }}>
                                        <div className="image-input image-input-outline" data-kt-image-input="true" style={{ position: 'relative', display: 'inline-block' }}>
                                            <div 
                                                className="image-input-wrapper w-150px h-150px" 
                                                style={{ 
                                                    backgroundImage: `url('${imagePreview || '/assets/media/avatars/300-1.jpg'}')`,
                                                    backgroundSize: 'cover',
                                                    backgroundPosition: 'center',
                                                    borderRadius: '8px',
                                                    margin: '0 auto',
                                                    position: 'relative'
                                                }}
                                            ></div>
                                            <input 
                                                type="file" 
                                                name="logo" 
                                                accept="image/*" 
                                                onChange={handleImageChange}
                                                id="logo-upload"
                                                style={{ display: 'none' }}
                                            />
                                            <label 
                                                htmlFor="logo-upload"
                                                className="btn btn-icon btn-circle btn-color-muted btn-active-color-primary w-35px h-35px bg-body shadow" 
                                                data-kt-image-input-action="change" 
                                                data-bs-toggle="tooltip" 
                                                title="Change logo"
                                                style={{ position: 'absolute', bottom: 0, right: 'calc(50% - 17.5px)', cursor: 'pointer' }}
                                            >
                                                <i className="ki-duotone ki-pencil fs-2">
                                                    <span className="path1"></span>
                                                    <span className="path2"></span>
                                                </i>
                                            </label>
                                        </div>
                                    </div>
                                    <div className="text-muted fs-7">
                                        Upload partner logo
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Form - Right Side */}
                        <div className="col-md-9">
                            <div className="card">
                                <div className="card-header border-0">
                                    <div className="card-title">
                                        <h2>Add New Partner</h2>
                                    </div>
                                </div>

                                <div className="card-body p-9">
                                    {/* General Validation Errors */}
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
                                        {/* Country - First Field */}
                                        <div className="col-md-6 mb-7">
                                            <SearchableDropdown
                                                label="Country"
                                                placeholder="Select Country"
                                                options={countryOptions}
                                                selected={selectedCountryOption}
                                                onSelect={handleCountrySelect}
                                                onClear={handleCountryClear}
                                                loading={false}
                                                onOpen={handleCountryOpen}
                                                onSearchChange={handleCountrySearchChange}
                                                searchPlaceholder="Search countries..."
                                                required={true}
                                                renderSelected={(option) => (
                                                    option ? (
                                                        <div className="d-flex align-items-center">
                                                            {option.code && (
                                                                <img 
                                                                    src={`/flags/${option.code?.toLowerCase()}.png`} 
                                                                    alt={option.label}
                                                                    className="me-2"
                                                                    style={{ width: '20px', height: '15px', objectFit: 'cover' }}
                                                                    onError={(e) => { e.target.style.display = 'none'; }}
                                                                />
                                                            )}
                                                            <span>{option.label}</span>
                                                        </div>
                                                    ) : <span className="text-muted fw-semibold">Select country</span>
                                                )}
                                                renderOption={(option) => (
                                                    <div className="d-flex align-items-center">
                                                        {option.code && (
                                                            <img 
                                                                src={`/flags/${option.code?.toLowerCase()}.png`} 
                                                                alt={option.label}
                                                                className="me-3"
                                                                style={{ width: '20px', height: '15px', objectFit: 'cover' }}
                                                                onError={(e) => { e.target.style.display = 'none'; }}
                                                            />
                                                        )}
                                                        <span>{option.label}</span>
                                                    </div>
                                                )}
                                            />
                                            {errors.country_id && <div className="invalid-feedback d-block mt-1">{errors.country_id}</div>}
                                        </div>

                                        {/* Partner category (type = partner) */}
                                        <div className="col-md-6 mb-7">
                                            <SearchableDropdown
                                                label="Partner category"
                                                placeholder="Select partner category"
                                                options={partnerCategoryOptions}
                                                selected={selectedPartnerCategoryOption}
                                                onSelect={handlePartnerCategorySelect}
                                                onClear={handlePartnerCategoryClear}
                                                loading={loadingPartnerCategories}
                                                onOpen={handlePartnerCategoryOpen}
                                                onSearchChange={handlePartnerCategorySearchChange}
                                                searchPlaceholder="Search categories..."
                                                required
                                            />
                                            {errors.partner_category_id && (
                                                <div className="invalid-feedback d-block mt-1">{errors.partner_category_id}</div>
                                            )}
                                        </div>

                                        {/* Business /Brand Name */}
                                        <div className="col-md-6 mb-7">
                                            <label className="form-label fw-bold required">Business /Brand Name</label>
                                            <input
                                                type="text"
                                                name="name"
                                                className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                placeholder="Enter Business /Brand Name"
                                            />
                                            {errors.name && <div className="invalid-feedback d-block">{errors.name}</div>}
                                        </div>

                                        {/* Contact Person Name */}
                                        <div className="col-md-6 mb-7">
                                            <label className="form-label fw-bold required">Contact Person Name</label>
                                            <input
                                                type="text"
                                                name="business_name"
                                                className="form-control"
                                                value={formData.business_name}
                                                onChange={handleInputChange}
                                                placeholder="Enter Contact Person Name"
                                                required
                                            />
                                        </div>

                                        {/* Company Name */}
                                        <div className="col-md-6 mb-7">
                                            <label className="form-label fw-bold required">Company Name</label>
                                            <input
                                                type="text"
                                                name="owner_name"
                                                className={`form-control ${errors.owner_name ? 'is-invalid' : ''}`}
                                                value={formData.owner_name}
                                                onChange={handleInputChange}
                                                placeholder="Enter Company Name"
                                            />
                                            {errors.owner_name && <div className="invalid-feedback d-block">{errors.owner_name}</div>}
                                        </div>

                                        {/* Email */}
                                        <div className="col-md-6 mb-7">
                                            <label className="form-label fw-bold required">Email</label>
                                            <input
                                                type="email"
                                                name="email"
                                                className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                placeholder="provider@example.com"
                                            />
                                            {errors.email && <div className="invalid-feedback d-block">{errors.email}</div>}
                                        </div>

                                        {/* Phone */}
                                        <div className="col-md-6 mb-7">
                                            <label className="form-label fw-bold required">Phone</label>
                                            <input
                                                type="text"
                                                name="phone"
                                                className={`form-control ${errors.phone ? 'is-invalid' : ''}`}
                                                value={formData.phone}
                                                onChange={handleInputChange}
                                                placeholder="+1234567890"
                                            />
                                            {errors.phone && <div className="invalid-feedback d-block">{errors.phone}</div>}
                                        </div>

                                        {/* Business Phone */}
                                        <div className="col-md-6 mb-7">
                                            <label className="form-label fw-bold required">Business Phone</label>
                                            <input
                                                type="text"
                                                name="business_phone"
                                                className="form-control"
                                                value={formData.business_phone}
                                                onChange={handleInputChange}
                                                placeholder="+1234567890"
                                                required
                                            />
                                        </div>






                                        {/* Profile Summary */}
                                        <div className="col-md-12 mb-7">
                                            <label className="form-label fw-bold">Profile Summary</label>
                                            <textarea
                                                name="address"
                                                className="form-control"
                                                rows="3"
                                                value={formData.address}
                                                onChange={handleInputChange}
                                                placeholder="Enter profile summary"
                                            />
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

                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Submit Button - Outside Card, Below col-md-9 */}
                    <div className="row mt-5">
                        <div className="col-md-3"></div>
                        <div className="col-md-9">
                            <div className="d-flex justify-content-end gap-3">
                                <Link to="/admin/partners" className="btn btn-light">
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
                                            Creating...
                                        </>
                                    ) : (
                                        <>
                                            <i className="ki-duotone ki-check fs-2">
                                                <span className="path1"></span>
                                                <span className="path2"></span>
                                            </i>
                                            Create Partner
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdminContentProviderCreate;


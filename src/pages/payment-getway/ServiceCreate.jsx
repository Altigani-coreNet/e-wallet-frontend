import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from '../../utils/axiosConfig';
import { useToolbar } from '../../contexts/ToolbarContext';
import { ADMIN_ENDPOINTS, AUTH_ENDPOINTS } from '../../utils/constants';
import { getToken } from '../../utils/api';
import { getPartnersSelect } from '../../services/adminPartnersService';
import SearchableDropdown from '../../common/filters/SearchableDropdown';

const ServiceCreate = () => {
    const { setTitle, setBreadcrumbs } = useToolbar();
    const navigate = useNavigate();
    const [submitting, setSubmitting] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        country_id: "",
        category_id: "",
        sub_category_id: "",
        service_type: "digital",
        partner_id: "",
        product_id: "",
        price: "",
        fallback_price1: "",
        fallback_price2: "",
        fallback_price3: "",
        fallback_price4: "",
        sub_code: "",
        cancel_code: "",
        description_ar: "",
        description_en: "",
        tax: "0",
        status: "active",
        is_active: true,
    });

    // Dropdown options
    const [categories, setCategories] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState(false);
    const [categoriesEnabled, setCategoriesEnabled] = useState(false);
    const [categorySearchTerm, setCategorySearchTerm] = useState("");
    const [selectedCategoryOption, setSelectedCategoryOption] = useState(null);
    const [subCategories, setSubCategories] = useState([]);
    const [loadingSubCategories, setLoadingSubCategories] = useState(false);
    const [subCategoriesEnabled, setSubCategoriesEnabled] = useState(false);
    const [subCategorySearchTerm, setSubCategorySearchTerm] = useState("");
    const [selectedSubCategoryOption, setSelectedSubCategoryOption] = useState(null);
    const [serviceTypes, setServiceTypes] = useState([
        { value: "digital", label: "Digital" },
        { value: "ivr", label: "IVR" },
        { value: "sms", label: "SMS" },
    ]);
    const [loadingServiceTypes, setLoadingServiceTypes] = useState(false);
    const [serviceTypesEnabled, setServiceTypesEnabled] = useState(false);
    const [serviceTypeSearchTerm, setServiceTypeSearchTerm] = useState("");
    const [selectedServiceTypeOption, setSelectedServiceTypeOption] = useState({ value: "digital", label: "Digital" });

    const [contentProviders, setContentProviders] = useState([]);
    const [loadingContentProviders, setLoadingContentProviders] = useState(false);
    const [contentProvidersEnabled, setContentProvidersEnabled] = useState(false);
    const [contentProviderSearchTerm, setContentProviderSearchTerm] = useState("");
    const [selectedContentProviderOption, setSelectedContentProviderOption] = useState(null);

    // Country states
    const [countries, setCountries] = useState([]);
    const [loadingCountries, setLoadingCountries] = useState(false);
    const [countriesEnabled, setCountriesEnabled] = useState(false);
    const [countrySearchTerm, setCountrySearchTerm] = useState("");
    const [selectedCountryOption, setSelectedCountryOption] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [serviceImageFile, setServiceImageFile] = useState(null);

    useEffect(() => {
        setTitle('Add Service');
        setBreadcrumbs([
            { label: 'Home', path: '/admin' },
            { label: 'Services', path: '/admin/services' },
            { label: 'Add Service', path: '/admin/services/create', active: true }
        ]);

        return () => {
            setBreadcrumbs([]);
        };
    }, [setTitle, setBreadcrumbs]);

    // Load countries
    const loadCountries = useCallback(
        async (search = '') => {
            try {
                setLoadingCountries(true);
                const token = getToken();
                const url = search 
                    ? `${AUTH_ENDPOINTS.COUNTRIES_SELECT}?search=${encodeURIComponent(search)}`
                    : AUTH_ENDPOINTS.COUNTRIES_SELECT;
                
                const response = await axios.get(url, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (response.data.status) {
                    const list = Array.isArray(response.data.data) ? response.data.data : [];
                    setCountries(list.map(country => ({
                        value: country.id,
                        label: country.text || country.name?.en || country.name,
                        code: country.code || country.short_name || country.code_iso2,
                        ...country
                    })));
                } else {
                    setCountries([]);
                }
            } catch (error) {
                console.error('Error loading countries:', error);
                setCountries([]);
            } finally {
                setLoadingCountries(false);
            }
        },
        []
    );

    // Load operators
    // Load categories
    const loadCategories = useCallback(
        async (search = '') => {
            try {
                setLoadingCategories(true);
                const params = { per_page: 50, type: 'service' };
                params.parents_only = true;
                if (search) params.search = search;
                const response = await axios.get(ADMIN_ENDPOINTS.SERVICE_CATEGORIES_ACTIVE, { params });
                if (response.data.success) {
                    const list = response.data.data || [];
                    setCategories(list.map(cat => ({
                        value: cat.id,
                        label: cat.name_en,
                        ...cat,
                    })));
                }
            } catch (error) {
                console.error('Error loading categories:', error);
                setCategories([]);
            } finally {
                setLoadingCategories(false);
            }
        },
        []
    );

    // Load content providers
    const loadContentProviders = useCallback(
        async (search = '', countryId = null) => {
            try {
                setLoadingContentProviders(true);
                const params = { per_page: 50 };
                if (search) params.search = search;
                if (countryId) params.country_id = countryId;
                const result = await getPartnersSelect(params);
                if (!result.success) {
                    setContentProviders([]);
                    return;
                }
                const body = result.data;
                if (body && (body.status === true || body.success === true)) {
                    const list = Array.isArray(body.data) ? body.data : [];
                    setContentProviders(list.map(cp => ({
                        value: cp.id,
                        label: cp.name || cp.text || cp.business_name || String(cp.id),
                        ...cp,
                    })));
                } else {
                    setContentProviders([]);
                }
            } catch (error) {
                console.error('Error loading content providers:', error);
                setContentProviders([]);
            } finally {
                setLoadingContentProviders(false);
            }
        },
        []
    );

    const categoryOptions = useMemo(
        () =>
            categories.map((category) => ({
                value: category.value,
                label: category.label,
            })),
        [categories]
    );

    const contentProviderOptions = useMemo(
        () =>
            contentProviders.map((cp) => ({
                value: cp.value,
                label: cp.label,
            })),
        [contentProviders]
    );

    const subCategoryOptions = useMemo(
        () =>
            subCategories.map((item) => ({
                value: item.value,
                label: item.label,
            })),
        [subCategories]
    );

    const countryOptions = useMemo(
        () =>
            countries.map((country) => ({
                value: country.value,
                label: country.label,
                code: country.code,
                ...country
            })),
        [countries]
    );

    // Debounced search for countries
    useEffect(() => {
        if (!countriesEnabled) return;
        const handler = setTimeout(() => {
            loadCountries(countrySearchTerm);
        }, 300);
        return () => clearTimeout(handler);
    }, [countriesEnabled, countrySearchTerm, loadCountries]);

    // Reset partner when country changes
    useEffect(() => {
        if (formData.country_id) {
            if (formData.partner_id) {
                setFormData(prev => ({ ...prev, partner_id: "" }));
                setSelectedContentProviderOption(null);
                setContentProviders([]);
            }
        }
    }, [formData.country_id, formData.partner_id]);

    // Debounced search for categories
    useEffect(() => {
        if (!categoriesEnabled) return;
        const handler = setTimeout(() => {
            loadCategories(categorySearchTerm);
        }, 300);
        return () => clearTimeout(handler);
    }, [categoriesEnabled, categorySearchTerm, loadCategories]);

    const loadSubCategories = useCallback(
        async (search = '', categoryId = null) => {
            if (!categoryId) {
                setSubCategories([]);
                return;
            }
            try {
                setLoadingSubCategories(true);
                const params = { limit: 100, category_id: categoryId };
                if (search) params.search = search;
                const response = await axios.get(ADMIN_ENDPOINTS.SERVICE_SUB_CATEGORIES_SELECT, { params });
                if (response.data.success) {
                    const list = response.data.data || [];
                    setSubCategories(list.map((item) => ({
                        value: item.id,
                        label: item.name_en,
                        ...item,
                    })));
                } else {
                    setSubCategories([]);
                }
            } catch (error) {
                setSubCategories([]);
            } finally {
                setLoadingSubCategories(false);
            }
        },
        []
    );

    const loadServiceTypes = useCallback(
        async (search = "") => {
            const defaultTypes = [
                { value: "digital", label: "Digital" },
                { value: "ivr", label: "IVR" },
                { value: "sms", label: "SMS" },
            ];
            try {
                setLoadingServiceTypes(true);
                const params = { limit: 50 };
                if (search) params.search = search;
                const response = await axios.get(ADMIN_ENDPOINTS.SERVICE_TYPES_SELECT, { params });
                if (response.data?.success) {
                    const list = Array.isArray(response.data.data) ? response.data.data : [];
                    const mapped = list.map((item) => ({
                        value: (item.code || item.name_en || "").toLowerCase(),
                        label: item.name_en || item.code || "",
                        ...item,
                    }));
                    setServiceTypes(mapped.length > 0 ? mapped : defaultTypes);
                } else {
                    setServiceTypes(defaultTypes);
                }
            } catch (error) {
                setServiceTypes(defaultTypes);
            } finally {
                setLoadingServiceTypes(false);
            }
        },
        []
    );

    useEffect(() => {
        if (!subCategoriesEnabled) return;
        const handler = setTimeout(() => {
            loadSubCategories(subCategorySearchTerm, formData.category_id || null);
        }, 300);
        return () => clearTimeout(handler);
    }, [subCategoriesEnabled, subCategorySearchTerm, formData.category_id, loadSubCategories]);

    useEffect(() => {
        if (!serviceTypesEnabled) return;
        const handler = setTimeout(() => {
            loadServiceTypes(serviceTypeSearchTerm);
        }, 300);
        return () => clearTimeout(handler);
    }, [serviceTypesEnabled, serviceTypeSearchTerm, loadServiceTypes]);

    useEffect(() => {
        setFormData((prev) => ({ ...prev, sub_category_id: "" }));
        setSelectedSubCategoryOption(null);
        setSubCategories([]);
    }, [formData.category_id]);

    // Load partners when country changes or when enabled
    useEffect(() => {
        if (!contentProvidersEnabled) return;
        const handler = setTimeout(() => {
            loadContentProviders(
                contentProviderSearchTerm, 
                formData.country_id || null
            );
        }, 300);
        return () => clearTimeout(handler);
    }, [contentProvidersEnabled, contentProviderSearchTerm, formData.country_id, loadContentProviders]);

    // Reset partner when country changes
    useEffect(() => {
        if (!formData.country_id && contentProviders.length > 0) {
            setContentProviders([]);
            setSelectedContentProviderOption(null);
            setFormData(prev => ({ ...prev, partner_id: "" }));
        }
    }, [formData.country_id, contentProviders.length]);

    const handleCancel = () => {
        navigate('/admin/services');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!formData.country_id) {
            toast.error("Country is required");
            return;
        }
        if (!formData.category_id || !formData.partner_id) {
            toast.error("Category and Partner are required");
            return;
        }
        if (!formData.service_type) {
            toast.error("Service Type is required");
            return;
        }

        if (!formData.price) {
            toast.error("Price is required");
            return;
        }

        setSubmitting(true);
        try {
            const payload = { ...formData, content_provider_id: formData.partner_id };
            let submitData = payload;
            let config = {};
            if (serviceImageFile) {
                const fd = new FormData();
                Object.entries(payload).forEach(([key, value]) => {
                    fd.append(key, value ?? "");
                });
                fd.append("image", serviceImageFile);
                submitData = fd;
                config = {
                    headers: {
                        "Content-Type": "multipart/form-data",
                        Authorization: `Bearer ${getToken()}`
                    }
                };
            }

            const response = await axios.post(ADMIN_ENDPOINTS.SERVICES, submitData, config);

            if (response.data.success) {
                toast.success(response.data.message || "Service created successfully");
                navigate('/admin/services');
            }
        } catch (error) {
            console.error("Error creating service:", error);
            toast.error(error.response?.data?.message || "Failed to create service");
        } finally {
            setSubmitting(false);
        }
    };

    const handleCategoryOpen = useCallback(() => {
        setCategoriesEnabled(true);
        if (categories.length === 0 && !loadingCategories) {
            loadCategories(categorySearchTerm);
        }
    }, [categories.length, loadingCategories, categorySearchTerm, loadCategories]);

    const handleCategorySearchChange = useCallback((value) => {
        setCategorySearchTerm(value);
        setCategoriesEnabled(true);
    }, []);

    const handleSubCategoryOpen = useCallback(() => {
        if (!formData.category_id) {
            toast.warning("Please select a category first");
            return;
        }
        setSubCategoriesEnabled(true);
        if (subCategories.length === 0 && !loadingSubCategories) {
            loadSubCategories(subCategorySearchTerm, formData.category_id);
        }
    }, [formData.category_id, subCategories.length, loadingSubCategories, subCategorySearchTerm, loadSubCategories]);

    const handleSubCategorySearchChange = useCallback((value) => {
        setSubCategorySearchTerm(value);
        setSubCategoriesEnabled(true);
    }, []);

    const handleContentProviderOpen = useCallback(() => {
        if (!formData.country_id) {
            toast.warning("Please select a country first");
            return;
        }
        setContentProvidersEnabled(true);
        if (contentProviders.length === 0 && !loadingContentProviders) {
            loadContentProviders(
                contentProviderSearchTerm, 
                formData.country_id
            );
        }
    }, [contentProviders.length, loadingContentProviders, contentProviderSearchTerm, formData.country_id, loadContentProviders]);

    const handleContentProviderSearchChange = useCallback((value) => {
        setContentProviderSearchTerm(value);
        setContentProvidersEnabled(true);
    }, []);

    const handleServiceTypeOpen = useCallback(() => {
        setServiceTypesEnabled(true);
        if (serviceTypes.length === 0 && !loadingServiceTypes) {
            loadServiceTypes(serviceTypeSearchTerm);
        }
    }, [serviceTypes.length, loadingServiceTypes, loadServiceTypes, serviceTypeSearchTerm]);

    const handleServiceTypeSearchChange = useCallback((value) => {
        setServiceTypeSearchTerm(value);
        setServiceTypesEnabled(true);
    }, []);

    const handleServiceImageChange = useCallback((e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setServiceImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setImagePreview(reader.result);
        reader.readAsDataURL(file);
    }, []);

    const handleCountrySelect = useCallback((option) => {
        setSelectedCountryOption(option);
        setFormData(prev => ({ ...prev, country_id: option?.value || "" }));
    }, []);

    const handleCountryClear = useCallback(() => {
        setSelectedCountryOption(null);
        setFormData(prev => ({ ...prev, country_id: "", partner_id: "" }));
        setSelectedContentProviderOption(null);
        setContentProviders([]);
    }, []);

    const handleCountryOpen = useCallback(() => {
        setCountriesEnabled(true);
        if (countries.length === 0 && !loadingCountries) {
            loadCountries(countrySearchTerm);
        }
    }, [countries.length, loadingCountries, countrySearchTerm, loadCountries]);

    const handleCountrySearchChange = useCallback((value) => {
        setCountrySearchTerm(value);
        setCountriesEnabled(true);
    }, []);

    return (
        <div className="card">
            <div className="card-header">
                <h3 className="card-title">Add New Service</h3>
            </div>
            <form onSubmit={handleSubmit}>
                <div className="card-body">
                    <div className="row g-4">
                        {/* Category */}
                        <div className="col-md-6">
                            <SearchableDropdown
                                label="Category *"
                                placeholder="Select category"
                                options={categoryOptions}
                                selected={selectedCategoryOption}
                                onSelect={(option) => {
                                    setSelectedCategoryOption(option);
                                    setFormData({ ...formData, category_id: option.value, sub_category_id: "" });
                                    setSelectedSubCategoryOption(null);
                                }}
                                onClear={() => {
                                    setSelectedCategoryOption(null);
                                    setFormData({ ...formData, category_id: "", sub_category_id: "" });
                                    setSelectedSubCategoryOption(null);
                                }}
                                required={true}
                                loading={loadingCategories}
                                searchPlaceholder="Search categories..."
                                onOpen={handleCategoryOpen}
                                onSearchChange={handleCategorySearchChange}
                                showClear={false}
                            />
                        </div>

                        {/* Sub-Category */}
                        <div className="col-md-6">
                            <SearchableDropdown
                                label="Sub-Category"
                                placeholder="Select sub-category"
                                options={subCategoryOptions}
                                selected={selectedSubCategoryOption}
                                onSelect={(option) => {
                                    setSelectedSubCategoryOption(option);
                                    setFormData({ ...formData, sub_category_id: option.value });
                                }}
                                onClear={() => {
                                    setSelectedSubCategoryOption(null);
                                    setFormData({ ...formData, sub_category_id: "" });
                                }}
                                loading={loadingSubCategories}
                                searchPlaceholder="Search sub-categories..."
                                onOpen={handleSubCategoryOpen}
                                onSearchChange={handleSubCategorySearchChange}
                                showClear={true}
                            />
                        </div>

                        {/* Service Type */}
                        <div className="col-md-6">
                            <SearchableDropdown
                                label="Service Type *"
                                placeholder="Select service type"
                                options={serviceTypes}
                                selected={selectedServiceTypeOption}
                                onSelect={(option) => {
                                    setSelectedServiceTypeOption(option);
                                    setFormData({ ...formData, service_type: option?.value || "digital" });
                                }}
                                onClear={() => {
                                    setSelectedServiceTypeOption({ value: "digital", label: "Digital" });
                                    setFormData({ ...formData, service_type: "digital" });
                                }}
                                required={true}
                                loading={loadingServiceTypes}
                                searchPlaceholder="Search service types..."
                                onOpen={handleServiceTypeOpen}
                                onSearchChange={handleServiceTypeSearchChange}
                                showClear={false}
                            />
                        </div>

                        {/* Country */}
                        <div className="col-md-6">
                            <SearchableDropdown
                                label="Country *"
                                placeholder="Select country"
                                options={countryOptions}
                                selected={selectedCountryOption}
                                onSelect={handleCountrySelect}
                                onClear={handleCountryClear}
                                required={true}
                                loading={loadingCountries}
                                onOpen={handleCountryOpen}
                                onSearchChange={handleCountrySearchChange}
                                searchPlaceholder="Search countries..."
                                showClear={false}
                            />
                        </div>

                        {/* Partner */}
                        <div className="col-md-6">
                            <SearchableDropdown
                                label="Partner *"
                                placeholder="Select partner"
                                options={contentProviderOptions}
                                selected={selectedContentProviderOption}
                                onSelect={(option) => {
                                    setSelectedContentProviderOption(option);
                                    setFormData({ ...formData, partner_id: option.value });
                                }}
                                onClear={() => {
                                    setSelectedContentProviderOption(null);
                                    setFormData({ ...formData, partner_id: "" });
                                }}
                                required={true}
                                loading={loadingContentProviders}
                                searchPlaceholder="Search partners..."
                                onOpen={handleContentProviderOpen}
                                onSearchChange={handleContentProviderSearchChange}
                                showClear={false}
                            />
                        </div>

                        {/* Service Image */}
                        <div className="col-md-6">
                            <label className="form-label fw-bold">Service Image</label>
                            <div className="d-flex align-items-center gap-4">
                                <div
                                    className="image-input-wrapper w-100px h-100px border rounded"
                                    style={{
                                        backgroundImage: `url('${imagePreview || '/assets/media/avatars/300-1.jpg'}')`,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center'
                                    }}
                                ></div>
                                <div className="flex-grow-1">
                                    <input type="file" name="image" accept="image/*" className="form-control" onChange={handleServiceImageChange} />
                                    <div className="text-muted fs-7 mt-2">Upload service image</div>
                                </div>
                            </div>
                        </div>

                        {/* Product ID */}
                        <div className="col-md-6">
                            <label className="form-label">Product ID</label>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Enter product ID (optional)"
                                value={formData.product_id}
                                onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                            />
                        </div>

                        {/* Price */}
                        <div className="col-md-6">
                            <label className="form-label required">Price</label>
                            <input
                                type="number"
                                step="0.01"
                                className="form-control"
                                placeholder="0.00"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                required
                            />
                        </div>

                        {/* Fallback Prices */}
                        <div className="col-md-3">
                            <label className="form-label">Fallback Price 1</label>
                            <input
                                type="number"
                                step="0.01"
                                className="form-control"
                                placeholder="0.00"
                                value={formData.fallback_price1}
                                onChange={(e) => setFormData({ ...formData, fallback_price1: e.target.value })}
                            />
                        </div>
                        <div className="col-md-3">
                            <label className="form-label">Fallback Price 2</label>
                            <input
                                type="number"
                                step="0.01"
                                className="form-control"
                                placeholder="0.00"
                                value={formData.fallback_price2}
                                onChange={(e) => setFormData({ ...formData, fallback_price2: e.target.value })}
                            />
                        </div>
                        <div className="col-md-3">
                            <label className="form-label">Fallback Price 3</label>
                            <input
                                type="number"
                                step="0.01"
                                className="form-control"
                                placeholder="0.00"
                                value={formData.fallback_price3}
                                onChange={(e) => setFormData({ ...formData, fallback_price3: e.target.value })}
                            />
                        </div>
                        <div className="col-md-3">
                            <label className="form-label">Fallback Price 4</label>
                            <input
                                type="number"
                                step="0.01"
                                className="form-control"
                                placeholder="0.00"
                                value={formData.fallback_price4}
                                onChange={(e) => setFormData({ ...formData, fallback_price4: e.target.value })}
                            />
                        </div>

                        {/* Sub Code */}
                        <div className="col-md-6">
                            <label className="form-label">Sub Code</label>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Enter sub code"
                                value={formData.sub_code}
                                onChange={(e) => setFormData({ ...formData, sub_code: e.target.value })}
                            />
                        </div>

                        {/* Cancel Code */}
                        <div className="col-md-6">
                            <label className="form-label">Cancel Code</label>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Enter cancel code"
                                value={formData.cancel_code}
                                onChange={(e) => setFormData({ ...formData, cancel_code: e.target.value })}
                            />
                        </div>

                        {/* Tax */}
                        <div className="col-md-4">
                            <label className="form-label">Tax (%)</label>
                            <input
                                type="number"
                                step="0.01"
                                className="form-control"
                                placeholder="0.00"
                                value={formData.tax}
                                onChange={(e) => setFormData({ ...formData, tax: e.target.value })}
                            />
                        </div>

                        {/* Status */}
                        <div className="col-md-4">
                            <label className="form-label required">Status</label>
                            <select
                                className="form-select"
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                required
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="pending">Pending</option>
                                <option value="staging">Staging</option>
                                <option value="testing">Testing</option>
                            </select>
                        </div>

                        {/* Is Active */}
                        <div className="col-md-4">
                            <label className="form-label">Active Status</label>
                            <div className="form-check form-switch form-check-custom form-check-solid mt-2">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    checked={formData.is_active}
                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                />
                                <label className="form-check-label">
                                    {formData.is_active ? "Active" : "Inactive"}
                                </label>
                            </div>
                        </div>

                        {/* Description English */}
                        <div className="col-md-6">
                            <label className="form-label">Description (English)</label>
                            <textarea
                                className="form-control"
                                rows="3"
                                placeholder="Enter description in English"
                                value={formData.description_en}
                                onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                            ></textarea>
                        </div>

                        {/* Description Arabic */}
                        <div className="col-md-6">
                            <label className="form-label">Description (Arabic)</label>
                            <textarea
                                className="form-control"
                                rows="3"
                                placeholder="أدخل الوصف بالعربية"
                                value={formData.description_ar}
                                onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
                            ></textarea>
                        </div>
                    </div>
                </div>
                <div className="card-footer d-flex justify-content-end gap-3">
                    <button
                        type="button"
                        className="btn btn-light"
                        onClick={handleCancel}
                        disabled={submitting}
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit" 
                        className="btn btn-light-primary"
                        disabled={submitting}
                    >
                        {submitting ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                Creating...
                            </>
                        ) : (
                            'Next: Design Service'
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ServiceCreate;


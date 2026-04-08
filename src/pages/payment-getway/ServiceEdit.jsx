import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from '../../utils/axiosConfig';
import { useToolbar } from '../../contexts/ToolbarContext';
import { ADMIN_ENDPOINTS, AUTH_ENDPOINTS } from '../../utils/constants';
import { getToken } from '../../utils/api';
import { getPartnersSelect } from '../../services/adminPartnersService';
import SearchableDropdown from '../../common/filters/SearchableDropdown';

// Debounce function
const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
};

const getTextValue = (value) => {
    if (value == null || value === '') return '';
    if (typeof value === 'string' || typeof value === 'number') return String(value);
    if (typeof value === 'object') {
        return value.en || value.ar || Object.values(value).find((v) => typeof v === 'string') || '';
    }
    return '';
};

const parseTranslatableDescription = (value) => {
    if (value == null) return { en: '', ar: '' };

    if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(value);
            if (parsed && typeof parsed === 'object') {
                return {
                    en: String(parsed.en ?? parsed.EN ?? ''),
                    ar: String(parsed.ar ?? parsed.AR ?? ''),
                };
            }
        } catch {
            // Not JSON -> treat as plain text
        }

        // Plain string: assume it should show for both languages.
        return { en: value, ar: value };
    }

    if (typeof value === 'object') {
        return {
            en: String(value.en ?? value.EN ?? ''),
            ar: String(value.ar ?? value.AR ?? ''),
        };
    }

    return { en: String(value), ar: String(value) };
};

const ServiceEdit = () => {
    const { id } = useParams();
    const { setTitle, setBreadcrumbs } = useToolbar();
    const navigate = useNavigate();
    const [loadingService, setLoadingService] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [service, setService] = useState(null);
    const contentProvidersLoadedRef = useRef(false);
    const [serviceImageFile, setServiceImageFile] = useState(null);
    const [serviceImagePreview, setServiceImagePreview] = useState(null);

    // Form state
    const [formData, setFormData] = useState({
        operator_id: "",
        partner_id: "",
        country_id: "",
        service_type: "digital",
        category_id: "",
        sub_category_id: "",
        service_name_en: "",
        service_name_ar: "",
        description_en: "",
        description_ar: "",
        status: "active",
        is_active: true,
    });

    // Dropdown options
    const [operators, setOperators] = useState([]);
    const [loadingOperators, setLoadingOperators] = useState(false);
    const [operatorsEnabled, setOperatorsEnabled] = useState(false);
    const [operatorSearchTerm, setOperatorSearchTerm] = useState("");
    const [selectedOperatorOption, setSelectedOperatorOption] = useState(null);

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

    const [contentProviders, setContentProviders] = useState([]);
    const [loadingContentProviders, setLoadingContentProviders] = useState(false);
    const [contentProvidersEnabled, setContentProvidersEnabled] = useState(false);
    const [contentProviderSearchTerm, setContentProviderSearchTerm] = useState("");
    const [selectedContentProviderOption, setSelectedContentProviderOption] = useState(null);

    // Country states
    const [filteredCountries, setFilteredCountries] = useState([]);
    const [countrySearchTerm, setCountrySearchTerm] = useState('');
    const [selectedCountry, setSelectedCountry] = useState(null);
    const [loadingCountries, setLoadingCountries] = useState(false);

    useEffect(() => {
        setTitle('Edit Service');
        setBreadcrumbs([
            { label: 'Home', path: '/admin' },
            { label: 'Services', path: '/admin/services' },
            { label: 'Edit Service', path: `/admin/services/${id}/edit`, active: true }
        ]);

        return () => {
            setBreadcrumbs([]);
        };
    }, [id, setTitle, setBreadcrumbs]);

    // Load countries
    const fetchCountries = useCallback(
        async (searchTerm = '') => {
            try {
                setLoadingCountries(true);
                const token = getToken();
                const url = searchTerm 
                    ? `${AUTH_ENDPOINTS.COUNTRIES_SELECT}?search=${encodeURIComponent(searchTerm)}`
                    : AUTH_ENDPOINTS.COUNTRIES_SELECT;
                
                const response = await axios.get(url, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (response.data.status) {
                    setFilteredCountries(response.data.data || []);
                } else {
                    setFilteredCountries([]);
                }
            } catch (error) {
                console.error('Failed to fetch countries:', error);
                setFilteredCountries([]);
            } finally {
                setLoadingCountries(false);
            }
        },
        []
    );

    const debouncedCountrySearch = useCallback(
        debounce((searchTerm) => {
            if (searchTerm.length >= 1) {
                fetchCountries(searchTerm);
            } else {
                fetchCountries();
            }
        }, 500),
        [fetchCountries]
    );

    const handleCountrySearchChange = useCallback((value) => {
        setCountrySearchTerm(value);
        debouncedCountrySearch(value);
    }, [debouncedCountrySearch]);

    const handleCountrySelect = useCallback((option) => {
        const country = filteredCountries.find(c => String(c.id) === String(option.value));
        if (country) {
            setSelectedCountry(country);
            setFormData(prev => ({ ...prev, country_id: country.id }));
            // Reset operator and content provider when country changes
            setFormData(prev => ({ ...prev, operator_id: "", partner_id: "" }));
            setSelectedOperatorOption(null);
            setSelectedContentProviderOption(null);
            setOperators([]);
            setContentProviders([]);
        }
    }, [filteredCountries]);

    const handleCountryClear = useCallback(() => {
        setSelectedCountry(null);
        setSelectedContentProviderOption(null);
        setContentProviders([]);
        setFormData(prev => ({ ...prev, country_id: '', partner_id: '' }));
    }, []);

    const handleCountryOpen = useCallback(() => {
        if (filteredCountries.length === 0) {
            fetchCountries();
        }
    }, [filteredCountries.length, fetchCountries]);

    const countryOptions = useMemo(() => {
        return filteredCountries.map((country) => ({
            ...country,
            value: country.id,
            label: getTextValue(country.text) || getTextValue(country.name) || `Country ${country.id}`,
            code: country.code || country.short_name || country.code_iso2
        }));
    }, [filteredCountries]);

    const selectedCountryOption = useMemo(() => {
        const selectedId = selectedCountry?.id ?? formData.country_id;
        if (!selectedId) return null;

        const found = countryOptions.find((opt) => String(opt.value) === String(selectedId));
        if (found) {
            return {
                ...found,
                label: getTextValue(found.label)
            };
        }

        const src = selectedCountry || {};
        return {
            value: selectedId,
            label:
                getTextValue(src.text) ||
                getTextValue(src.name) ||
                getTextValue(service?.country?.name) ||
                'Selected country',
            code: src.code || src.short_name || src.code_iso2 || service?.country?.code
        };
    }, [selectedCountry, countryOptions, formData.country_id, service]);

    const handleServiceImageChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setServiceImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setServiceImagePreview(reader.result);
        reader.readAsDataURL(file);
    };

    // Load service details
    useEffect(() => {
        const loadService = async () => {
            try {
                setLoadingService(true);
                const response = await axios.get(ADMIN_ENDPOINTS.SERVICE_DETAILS(id), {
                    headers: { 
                        'Authorization': `Bearer ${getToken()}`,
                        'Accept': 'application/json'
                    }
                });
                
                // Handle different response structures
                let serviceData = null;
                if (response.data) {
                    if (response.data.success && response.data.data) {
                        serviceData = response.data.data;
                    } else if (response.data.data) {
                        serviceData = response.data.data;
                    } else {
                        serviceData = response.data;
                    }
                }
                
                if (!serviceData) {
                    throw new Error('Service data not found in response');
                }
                
                setService(serviceData);

                let nameEn = serviceData.service_name_en ?? '';
                let nameAr = serviceData.service_name_ar ?? '';
                if (nameEn === '' && nameAr === '') {
                    const sn = serviceData.service_name;
                    if (sn && typeof sn === 'object' && !Array.isArray(sn)) {
                        nameEn = sn.en ?? '';
                        nameAr = sn.ar ?? '';
                    } else if (typeof sn === 'string') {
                        nameEn = sn;
                        nameAr = sn;
                    } else if (serviceData.service_name_text) {
                        nameEn = serviceData.service_name_text;
                        nameAr = serviceData.service_name_text;
                    }
                }

                setFormData({
                    operator_id: serviceData.operator?.id || "",
                    // Always prefer API `partner_id` (may be present even when `partner` relation isn't loaded)
                    partner_id: serviceData.partner_id || serviceData.partner?.id || serviceData.merchant?.id || "",
                    country_id: serviceData.country_id || "",
                    service_type: serviceData.service_type || "digital",
                    category_id: serviceData.category?.id || "",
                    sub_category_id: serviceData.sub_category?.id || "",
                    service_name_en: nameEn,
                    service_name_ar: nameAr,
                    ...(() => {
                        const parsed = parseTranslatableDescription(serviceData.description);
                        return {
                            description_en: parsed.en,
                            description_ar: parsed.ar,
                        };
                    })(),
                    status: serviceData.status || "active",
                    is_active: serviceData.is_active !== undefined ? serviceData.is_active : true,
                });

                // Preview existing image: prefer API `image_url` then fallback to `image`
                setServiceImagePreview(() => {
                    if (serviceData.image_url) return serviceData.image_url;
                    if (!serviceData.image) return null;
                    const img = String(serviceData.image);
                    if (img.startsWith('http')) return img;
                    if (img.startsWith('/')) return img;
                    // backend stores something like "uploads/services/<file>"
                    return `/${img}`;
                });

                // Set selected country if available (normalize so dropdown never receives object labels)
                if (serviceData.country) {
                    const c = serviceData.country;
                    setSelectedCountry({
                        ...c,
                        id: c.id,
                        text: getTextValue(c.text) || getTextValue(c.name),
                        name: c.name
                    });
                }
                // Load countries to ensure dropdown works
                if (serviceData.country_id || serviceData.country) {
                    fetchCountries();
                }

                // Set selected options if available
                if (serviceData.operator) {
                    setSelectedOperatorOption({
                        value: serviceData.operator.id,
                        label: serviceData.operator.name,
                    });
                    // Load operators list to ensure dropdown works
                    if (serviceData.country_id) {
                        loadOperators('', serviceData.country_id);
                    }
                }
                if (serviceData.category) {
                    setSelectedCategoryOption({
                        value: serviceData.category.id,
                        label: serviceData.category.name_en,
                    });
                    // Load categories list to ensure dropdown works
                    loadCategories('');
                }
                if (serviceData.sub_category) {
                    setSelectedSubCategoryOption({
                        value: serviceData.sub_category.id,
                        label: serviceData.sub_category.name_en,
                    });
                }
                // Handle content provider - load list first, then set selected option
                if (serviceData.partner || serviceData.merchant) {
                    const cp = serviceData.partner || serviceData.merchant;
                    const cpId = serviceData.partner_id || cp?.id;
                    const cpName = cp?.name || cp?.business_name || String(cpId);
                    
                    // Load content providers if we have operator and country (only once on initial load)
                    if (serviceData.operator?.id && serviceData.country_id && !contentProvidersLoadedRef.current) {
                        try {
                            contentProvidersLoadedRef.current = true;
                            const providersList = await loadContentProviders('', serviceData.country_id);
                            // After loading, find and set the selected option from the loaded list
                            const foundProvider = providersList.find(p => String(p.value) === String(cpId));
                            if (foundProvider) {
                                setSelectedContentProviderOption(foundProvider);
                            } else {
                                // If not found in list, create option from service data
                                setSelectedContentProviderOption({
                                    value: cpId,
                                    label: cpName,
                                });
                            }
                        } catch (error) {
                            console.error('Error loading content providers:', error);
                            // Still set the option even if loading fails
                            setSelectedContentProviderOption({
                                value: cpId,
                                label: cpName,
                            });
                        }
                    } else {
                        // Set option even if we can't load the list yet
                        setSelectedContentProviderOption({
                            value: cpId,
                            label: cpName,
                        });
                    }
                }
            } catch (error) {
                console.error('Error loading service details', error);
                const errorMessage = error.response?.data?.message || error.message || 'Failed to load service details';
                toast.error(errorMessage);
                
                // Only navigate away if it's a 404 or permission error
                if (error.response?.status === 404 || error.response?.status === 403) {
                    navigate('/admin/services');
                }
            } finally {
                setLoadingService(false);
            }
        };

        loadService();
    }, [id, navigate, fetchCountries]);

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
                    return [];
                }
                const body = result.data;
                if (body && (body.status === true || body.success === true)) {
                    const list = Array.isArray(body.data) ? body.data : [];
                    const providersList = list.map(cp => ({
                        value: cp.id,
                        label: cp.name || cp.text || cp.business_name || String(cp.id),
                        ...cp,
                    }));
                    setContentProviders(providersList);
                    return providersList;
                }
                setContentProviders([]);
                return [];
            } catch (error) {
                console.error('Error loading content providers:', error);
                setContentProviders([]);
                return [];
            } finally {
                setLoadingContentProviders(false);
            }
        },
        []
    );

    const loadSubCategories = useCallback(
        async (search = '', categoryId = null) => {
            if (!categoryId) {
                setSubCategories([]);
                return [];
            }
            try {
                setLoadingSubCategories(true);
                const params = { limit: 100, category_id: categoryId };
                if (search) params.search = search;
                const response = await axios.get(ADMIN_ENDPOINTS.SERVICE_SUB_CATEGORIES_SELECT, { params });
                if (response.data?.success) {
                    const list = response.data.data || [];
                    const mapped = list.map((item) => ({
                        value: item.id,
                        label: item.name_en,
                        ...item,
                    }));
                    setSubCategories(mapped);
                    return mapped;
                }
                setSubCategories([]);
                return [];
            } catch (error) {
                setSubCategories([]);
                return [];
            } finally {
                setLoadingSubCategories(false);
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

    // Sync selected options with form data
    useEffect(() => {
        if (formData.operator_id && operators.length > 0) {
            const option = operatorOptions.find(op => String(op.value) === String(formData.operator_id));
            if (option && (!selectedOperatorOption || String(selectedOperatorOption.value) !== String(option.value))) {
                setSelectedOperatorOption(option);
            }
        }
    }, [formData.operator_id, operatorOptions, operators.length, selectedOperatorOption]);

    useEffect(() => {
        if (formData.category_id && categories.length > 0) {
            const option = categoryOptions.find(cat => String(cat.value) === String(formData.category_id));
            if (option && (!selectedCategoryOption || String(selectedCategoryOption.value) !== String(option.value))) {
                setSelectedCategoryOption(option);
            }
        }
    }, [formData.category_id, categoryOptions, categories.length, selectedCategoryOption]);

    useEffect(() => {
        if (!subCategoriesEnabled) return;
        const handler = setTimeout(() => {
            loadSubCategories(subCategorySearchTerm, formData.category_id || null);
        }, 300);
        return () => clearTimeout(handler);
    }, [subCategoriesEnabled, subCategorySearchTerm, formData.category_id, loadSubCategories]);

    useEffect(() => {
        if (formData.category_id) {
            loadSubCategories('', formData.category_id);
        } else {
            setSubCategories([]);
            setSelectedSubCategoryOption(null);
        }
    }, [formData.category_id, loadSubCategories]);

    // Sync selected content provider option when providers list is loaded
    useEffect(() => {
        if (formData.partner_id && contentProviders.length > 0) {
            const option = contentProviderOptions.find(cp => String(cp.value) === String(formData.partner_id));
            if (option && (!selectedContentProviderOption || String(selectedContentProviderOption.value) !== String(option.value))) {
                setSelectedContentProviderOption(option);
            }
        }
    }, [formData.partner_id, contentProviderOptions, contentProviders.length, selectedContentProviderOption]);

    useEffect(() => {
        if (formData.sub_category_id && subCategoryOptions.length > 0) {
            const option = subCategoryOptions.find((sc) => String(sc.value) === String(formData.sub_category_id));
            if (option && (!selectedSubCategoryOption || String(selectedSubCategoryOption.value) !== String(option.value))) {
                setSelectedSubCategoryOption(option);
            }
        }
    }, [formData.sub_category_id, subCategoryOptions, selectedSubCategoryOption]);

    // Load operators when country changes or when operatorsEnabled
    useEffect(() => {
        if (!operatorsEnabled) return;
        const handler = setTimeout(() => {
            loadOperators(operatorSearchTerm, formData.country_id || null);
        }, 300);
        return () => clearTimeout(handler);
    }, [operatorsEnabled, operatorSearchTerm, formData.country_id, loadOperators]);

    // Reset operator and content provider when country changes (only if country actually changed, not on initial load)
    useEffect(() => {
        // Skip if this is the initial load (when service is being loaded)
        if (loadingService) return;
        
        if (formData.country_id) {
            // Only clear if country actually changed (not on initial load)
            // This prevents clearing content provider when service data is first loaded
            const currentCountryId = formData.country_id;
            // Reload operators if enabled
            if (operatorsEnabled) {
                loadOperators(operatorSearchTerm, formData.country_id);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData.country_id]);

    // Debounced search for categories
    useEffect(() => {
        if (!categoriesEnabled) return;
        const handler = setTimeout(() => {
            loadCategories(categorySearchTerm);
        }, 300);
        return () => clearTimeout(handler);
    }, [categoriesEnabled, categorySearchTerm, loadCategories]);

    // Load content providers when dropdown is opened (contentProvidersEnabled) or when search term changes
    useEffect(() => {
        if (!contentProvidersEnabled) return;
        if (!formData.country_id) return;
        // Skip if we're still loading the service (initial load)
        if (loadingService) return;
        
        const handler = setTimeout(() => {
            loadContentProviders(
                contentProviderSearchTerm, 
                formData.country_id
            );
        }, 300);
        return () => clearTimeout(handler);
    }, [contentProvidersEnabled, contentProviderSearchTerm, formData.country_id, loadingService, loadContentProviders]);

    const handleCancel = () => {
        navigate('/admin/services');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation - All fields are required
        if (!formData.country_id) {
            toast.error("Country is required");
            return;
        }

        if (!formData.partner_id) {
            toast.error("Partner is required");
            return;
        }

        if (!formData.service_type) {
            toast.error("Service Type is required");
            return;
        }

        if (!formData.category_id) {
            toast.error("Service Category is required");
            return;
        }

        if (!formData.service_name_en?.trim() || !formData.service_name_ar?.trim()) {
            toast.error("Service name (English and Arabic) is required");
            return;
        }

        if (!formData.description_en?.trim() || !formData.description_ar?.trim()) {
            toast.error("Description (English and Arabic) is required");
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                ...formData,
                description: {
                    en: formData.description_en.trim(),
                    ar: formData.description_ar.trim(),
                },
                service_name: {
                    en: formData.service_name_en.trim(),
                    ar: formData.service_name_ar.trim()
                }
            };
            delete payload.service_name_en;
            delete payload.service_name_ar;
            delete payload.operator_id;
            delete payload.description_en;
            delete payload.description_ar;
            let submitData = payload;
            let headers = {
                'Authorization': `Bearer ${getToken()}`,
                'Content-Type': 'application/json'
            };

            if (serviceImageFile) {
                const fd = new FormData();
                // Use method override so PHP parses multipart correctly
                // (Laravel will treat it as PUT)
                fd.append('_method', 'PUT');
                Object.entries(payload).forEach(([k, v]) => {
                    if (k === 'service_name' && typeof v === 'object' && v !== null) {
                        fd.append('service_name[en]', v.en ?? '');
                        fd.append('service_name[ar]', v.ar ?? '');
                    } else if (k === 'description' && typeof v === 'object' && v !== null) {
                        fd.append('description[en]', v.en ?? '');
                        fd.append('description[ar]', v.ar ?? '');
                    } else if (k === 'is_active') {
                        fd.append('is_active', v ? '1' : '0');
                    } else {
                        fd.append(k, v ?? '');
                    }
                });
                fd.append('image', serviceImageFile);
                submitData = fd;
                headers = {
                    'Authorization': `Bearer ${getToken()}`,
                    'Content-Type': 'multipart/form-data'
                };
            }

            const response = serviceImageFile
                ? await axios.post(ADMIN_ENDPOINTS.SERVICE_DETAILS(id), submitData, { headers })
                : await axios.put(ADMIN_ENDPOINTS.SERVICE_DETAILS(id), submitData, { headers });

            if (response.data && response.data.success) {
                toast.success(response.data.message || "Service updated successfully");
                navigate('/admin/services');
            } else {
                // Handle case where response doesn't have success flag
                const errorMessage = response.data?.message || response.data?.error || "Service update completed but response format was unexpected";
                toast.warning(errorMessage);
                // Still navigate away since update likely succeeded
                navigate('/admin/services');
            }
        } catch (error) {
            console.error("Error updating service:", error);
            
            // Handle validation errors
            if (error.response?.status === 422 && error.response?.data?.errors) {
                const errors = error.response.data.errors;
                const errorMessages = Object.values(errors).flat().join(', ');
                toast.error(errorMessages || "Validation failed. Please check your input.");
            } else {
                toast.error(error.response?.data?.message || error.message || "Failed to update service");
            }
        } finally {
            setSubmitting(false);
        }
    };

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

    if (loadingService) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading service...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="card">
            <div className="card-header">
                <h3 className="card-title">Edit Service</h3>
            </div>
            <form onSubmit={handleSubmit}>
                <div className="card-body">
                    <div className="row g-4">
                        <div className="col-md-3 mb-7">
                            <div className="card card-flush">
                                <div className="card-header">
                                    <div className="card-title">
                                        <h2>Service Image</h2>
                                    </div>
                                </div>
                                <div className="card-body text-center pt-0">
                                    <div className="text-center mb-10" style={{ position: 'relative' }}>
                                        <div className="image-input image-input-outline" style={{ position: 'relative', display: 'inline-block' }}>
                                            <div
                                                className="image-input-wrapper w-150px h-150px"
                                                style={{
                                                    backgroundImage: `url('${serviceImagePreview || '/assets/media/avatars/300-1.jpg'}')`,
                                                    backgroundSize: 'cover',
                                                    backgroundPosition: 'center',
                                                    borderRadius: '8px',
                                                    margin: '0 auto',
                                                    position: 'relative'
                                                }}
                                            ></div>
                                            <input
                                                type="file"
                                                name="image"
                                                accept="image/*"
                                                id="service-image-upload-edit"
                                                onChange={handleServiceImageChange}
                                                style={{ display: 'none' }}
                                            />
                                            <label
                                                htmlFor="service-image-upload-edit"
                                                className="btn btn-icon btn-circle btn-color-muted btn-active-color-primary w-35px h-35px bg-body shadow"
                                                style={{ position: 'absolute', bottom: 0, right: 'calc(50% - 17.5px)', cursor: 'pointer' }}
                                            >
                                                <i className="ki-duotone ki-pencil fs-2">
                                                    <span className="path1"></span>
                                                    <span className="path2"></span>
                                                </i>
                                            </label>
                                        </div>
                                    </div>
                                    <div className="text-muted fs-7">Upload service image</div>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-9">
                            <div className="row g-4">
                        {/* Country */}
                        <div className="col-md-6">
                            <label className="form-label required">Country</label>
                            <SearchableDropdown
                                options={countryOptions}
                                selected={selectedCountryOption}
                                onSelect={handleCountrySelect}
                                onClear={handleCountryClear}
                                onOpen={handleCountryOpen}
                                onSearchChange={handleCountrySearchChange}
                                placeholder="Select Country"
                                loading={loadingCountries}
                                required={true}
                                renderSelected={(option) => {
                                    if (!option) return <span className="text-muted">Select Country</span>;
                                    const label = getTextValue(option.label);
                                    const flagCode = option.code?.toLowerCase() || option.short_name?.toLowerCase() || option.code_iso2?.toLowerCase();
                                    return (
                                        <div className="d-flex align-items-center">
                                            {flagCode && (
                                                <img 
                                                    src={`/flags/${flagCode}.png`} 
                                                    alt={label || 'Flag'}
                                                    className="me-2"
                                                    style={{ width: '20px', height: '15px', objectFit: 'cover' }}
                                                    onError={(e) => { e.target.style.display = 'none'; }}
                                                />
                                            )}
                                            <span className="text-gray-800">{label}</span>
                                        </div>
                                    );
                                }}
                                renderOption={(option) => {
                                    const label = getTextValue(option.label);
                                    const flagCode = option.code?.toLowerCase() || option.short_name?.toLowerCase() || option.code_iso2?.toLowerCase();
                                    return (
                                        <div className="d-flex align-items-center">
                                            {flagCode && (
                                                <img 
                                                    src={`/flags/${flagCode}.png`} 
                                                    alt={label || 'Flag'}
                                                    className="me-2"
                                                    style={{ width: '20px', height: '15px', objectFit: 'cover' }}
                                                    onError={(e) => { e.target.style.display = 'none'; }}
                                                />
                                            )}
                                            <span>{label}</span>
                                        </div>
                                    );
                                }}
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
                                    setFormData({ ...formData, partner_id: option?.value || "" });
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

                        {/* Service Type (hidden; value still submitted) */}
                        <div className="col-md-6 d-none">
                            <label className="form-label required">Service Type</label>
                            <select
                                className="form-select"
                                value={formData.service_type}
                                onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
                                required
                            >
                                <option value="digital">Digital</option>
                                <option value="ivr">IVR</option>
                                <option value="sms">SMS</option>
                            </select>
                        </div>

                        {/* Category */}
                        <div className="col-md-6">
                            <SearchableDropdown
                                label="Service Category *"
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
                                    setFormData({ ...formData, sub_category_id: option?.value || "" });
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

                        {/* Service Name (translatable) */}
                        <div className="col-md-6">
                            <label className="form-label required">Service Name (English)</label>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Enter service name (English)"
                                value={formData.service_name_en}
                                onChange={(e) => setFormData({ ...formData, service_name_en: e.target.value })}
                                required
                            />
                        </div>
                        <div className="col-md-6">
                            <label className="form-label required">Service Name (Arabic)</label>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="ادخل اسم الخدمة بالعربية"
                                value={formData.service_name_ar}
                                onChange={(e) => setFormData({ ...formData, service_name_ar: e.target.value })}
                                required
                            />
                        </div>

                        {/* Description */}
                        <div className="col-md-6">
                            <label className="form-label required">Description (English)</label>
                            <textarea
                                className="form-control"
                                rows="3"
                                placeholder="Enter service description (English)"
                                value={formData.description_en}
                                onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                                required
                            />
                        </div>
                        <div className="col-md-6">
                            <label className="form-label required">Description (Arabic)</label>
                            <textarea
                                className="form-control"
                                rows="3"
                                dir="rtl"
                                placeholder="أدخل وصف الخدمة بالعربية"
                                value={formData.description_ar}
                                onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
                                required
                            />
                        </div>

                        {/* Primary key (read-only) */}
                        <div className="col-md-6">
                            <label className="form-label">Service UUID</label>
                            <input
                                type="text"
                                className="form-control"
                                value={service?.id || ''}
                                readOnly
                                disabled
                                style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                            />
                            <small className="text-muted">The service primary key is a UUID and cannot be changed</small>
                        </div>

                        {/* Status */}
                        <div className="col-md-6">
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
                        <div className="col-md-6">
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
                            </div>
                        </div>
                    </div>
                </div>
                <div className="card-footer">
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
                        className="btn btn-primary"
                        disabled={submitting}
                    >
                        {submitting ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                Updating...
                            </>
                        ) : (
                            'Update Service'
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ServiceEdit;


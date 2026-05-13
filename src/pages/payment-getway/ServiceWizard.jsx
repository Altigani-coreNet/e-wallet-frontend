import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import axios from '../../utils/axiosConfig';
import { useToolbar } from '../../contexts/ToolbarContext';
import { ADMIN_ENDPOINTS, AUTH_ENDPOINTS } from '../../utils/constants';
import { getToken } from '../../utils/api';
import SearchableDropdown from '../../common/filters/SearchableDropdown';
import { createProduct, fetchProductsByService } from '../../services/serviceProductsService';
import { getPartnersSelect } from '../../services/adminPartnersService';
import ServiceProductCreate from './products/ProductCreate';

// Debounce function
const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
};

const ServiceWizard = () => {
    const { t } = useTranslation();
    const { setTitle, setBreadcrumbs } = useToolbar();
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    const [submitting, setSubmitting] = useState(false);
    const [createdService, setCreatedService] = useState(null);
    const [createdProducts, setCreatedProducts] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(false);

    // Step 1: Service Form State
    const [serviceFormData, setServiceFormData] = useState({
        country_id: "",
        partner_id: "",
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

    // Step 2: Product Form State
    const [productFormData, setProductFormData] = useState({
        product_id: "",
        product_name: "",
        sub_code: "",
        cancel_code: "",
        short_code: "",
        price: "",
        fallback_price1: "",
        fallback_price2: "",
        fallback_price3: "",
        fallback_price4: "",
        tax: "0",
        description_ar: "",
        description_en: "",
        status: "active",
        is_active: true,
    });

    // Dropdown options
    const [categories, setCategories] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState(false);
    const [subCategories, setSubCategories] = useState([]);
    const [loadingSubCategories, setLoadingSubCategories] = useState(false);
    const [subCategorySearchTerm, setSubCategorySearchTerm] = useState('');
    const [selectedSubCategory, setSelectedSubCategory] = useState(null);
    const [serviceImageFile, setServiceImageFile] = useState(null);
    const [serviceImagePreview, setServiceImagePreview] = useState(null);
    const [serviceTypes, setServiceTypes] = useState([]);
    const [loadingServiceTypes, setLoadingServiceTypes] = useState(false);
    const [serviceTypeSearchTerm, setServiceTypeSearchTerm] = useState('');
    
    // Country states (following working pattern)
    const [filteredCountries, setFilteredCountries] = useState([]);
    const [countrySearchTerm, setCountrySearchTerm] = useState('');
    const [selectedCountry, setSelectedCountry] = useState(null);
    const [loadingCountries, setLoadingCountries] = useState(false);
    
    // Parent / sub partner (service is assigned to parent org or a specific sub-partner)
    const [filteredContentProviders, setFilteredContentProviders] = useState([]);
    const [contentProviderSearchTerm, setContentProviderSearchTerm] = useState('');
    const [selectedParentPartner, setSelectedParentPartner] = useState(null);
    const [loadingContentProviders, setLoadingContentProviders] = useState(false);
    const [filteredSubPartners, setFilteredSubPartners] = useState([]);
    const [subPartnerSearchTerm, setSubPartnerSearchTerm] = useState('');
    const [selectedSubPartner, setSelectedSubPartner] = useState(null);
    const [loadingSubPartners, setLoadingSubPartners] = useState(false);

    useEffect(() => {
        setTitle(t('admin.paymentGetway.titlesCreateService'));
        setBreadcrumbs([
            { label: t('admin.paymentGetway.breadcrumbsHome'), path: '/admin' },
            { label: t('admin.paymentGetway.breadcrumbsServices'), path: '/admin/services' },
            { label: t('admin.paymentGetway.titlesCreateService'), path: '/admin/services/create/wizard', active: true }
        ]);

        loadInitialData();

        return () => {
            setBreadcrumbs([]);
        };
    }, [setTitle, setBreadcrumbs, t]);

    const loadInitialData = async () => {
        await Promise.all([
            loadCategories(),
            loadServiceTypes()
            // Countries and Partners are loaded on dropdown open
        ]);
    };

    const loadCategories = async () => {
        try {
            setLoadingCategories(true);
            const response = await axios.get(ADMIN_ENDPOINTS.SERVICE_CATEGORIES_ACTIVE || ADMIN_ENDPOINTS.SERVICE_CATEGORIES || `${ADMIN_ENDPOINTS.SERVICES}/categories`, {
                params: { type: 'service' },
                headers: { 'Authorization': `Bearer ${getToken()}` }
            });
            if (response.data?.success || response.data?.status) {
                const categoriesData = response.data?.data || response.data?.categories || [];
                setCategories(categoriesData.map(cat => ({ value: cat.id, label: cat.name_en || cat.name || cat.text })));
            }
        } catch (error) {
            console.error('Error loading categories:', error);
            toast.error(t('admin.paymentGetway.wizFailedLoadCategories'));
        } finally {
            setLoadingCategories(false);
        }
    };

    const loadSubCategories = async (searchTerm = '', categoryId = null) => {
        if (!categoryId) {
            setSubCategories([]);
            return;
        }
        try {
            setLoadingSubCategories(true);
            const params = { category_id: categoryId, limit: 100 };
            if (searchTerm) params.search = searchTerm;
            const response = await axios.get(ADMIN_ENDPOINTS.SERVICE_SUB_CATEGORIES_SELECT, {
                params,
                headers: { 'Authorization': `Bearer ${getToken()}` }
            });
            if (response.data?.success || response.data?.status) {
                const list = response.data?.data || [];
                setSubCategories(list.map(item => ({
                    value: item.id,
                    label: item.name_en || item.name || item.text,
                    ...item
                })));
            } else {
                setSubCategories([]);
            }
        } catch (error) {
            setSubCategories([]);
        } finally {
            setLoadingSubCategories(false);
        }
    };

    const loadServiceTypes = async (searchTerm = '') => {
        const fallbackTypes = [
            { value: 'digital', label: t('admin.paymentGetway.svcTypeDigital') },
            { value: 'ivr', label: t('admin.paymentGetway.svcTypeIvr') },
            { value: 'sms', label: t('admin.paymentGetway.svcTypeSms') }
        ];
        try {
            setLoadingServiceTypes(true);
            const params = { limit: 100 };
            if (searchTerm) params.search = searchTerm;
            const response = await axios.get(ADMIN_ENDPOINTS.SERVICE_TYPES_SELECT, {
                params,
                headers: { 'Authorization': `Bearer ${getToken()}` }
            });
            if (response.data?.success || response.data?.status) {
                const list = response.data?.data || [];
                const mapped = list.map((item) => {
                    const raw = `${item.code || item.name_en || item.name_ar || ''}`.toLowerCase();
                    let normalized = raw;
                    if (raw.includes('digital')) normalized = 'digital';
                    else if (raw.includes('ivr')) normalized = 'ivr';
                    else if (raw.includes('sms')) normalized = 'sms';
                    return {
                        value: normalized,
                        label: item.name_en || item.code || item.name_ar || normalized,
                    };
                }).filter((item) => ['digital', 'ivr', 'sms'].includes(item.value));
                setServiceTypes(mapped.length > 0 ? mapped : fallbackTypes);
            } else {
                setServiceTypes(fallbackTypes);
            }
        } catch (error) {
            setServiceTypes(fallbackTypes);
        } finally {
            setLoadingServiceTypes(false);
        }
    };

    // Fetch countries from API with optional search term (following working pattern)
    const fetchCountries = async (searchTerm = '') => {
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
            }
        } catch (error) {
            console.error('Failed to fetch countries:', error);
            toast.error(t('admin.paymentGetway.wizFailedLoadCountries'));
        } finally {
            setLoadingCountries(false);
        }
    };

    // Debounced country search function - uses server-side search
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

    const handleCountrySearchChange = (value) => {
        setCountrySearchTerm(value);
        debouncedCountrySearch(value);
    };

    const handleCountrySelect = (option) => {
        const country = filteredCountries.find(c => c.id === option.value);
        if (country) {
            setSelectedCountry(country);
            setServiceFormData(prev => ({ ...prev, country_id: country.id, partner_id: "" }));
            setFilteredContentProviders([]);
            setSelectedParentPartner(null);
            setFilteredSubPartners([]);
            setSelectedSubPartner(null);
        }
    };

    const handleCountryClear = () => {
        setSelectedCountry(null);
        setFilteredContentProviders([]);
        setSelectedParentPartner(null);
        setFilteredSubPartners([]);
        setSelectedSubPartner(null);
        setServiceFormData(prev => ({ ...prev, country_id: '', partner_id: '' }));
    };

    const handleCountryOpen = () => {
        if (filteredCountries.length === 0) {
            fetchCountries();
        }
    };

    // Convert countries to options format for SearchableDropdown
    const countryOptions = useMemo(() => {
        return filteredCountries.map((country) => ({
            value: country.id,
            label: country.text || country.name || country.name_en,
            code: country.code || country.short_name || country.code_iso2,
            ...country
        }));
    }, [filteredCountries]);

    // Find selected country option
    const selectedCountryOption = useMemo(() => {
        if (!selectedCountry) {
            // Also check if country_id is set in form data
            if (serviceFormData.country_id) {
                return countryOptions.find(opt => String(opt.value) === String(serviceFormData.country_id)) || null;
            }
            return null;
        }
        return countryOptions.find(opt => opt.value === selectedCountry.id) || null;
    }, [selectedCountry, countryOptions, serviceFormData.country_id]);

    const selectedCategoryOption = useMemo(() => {
        if (!serviceFormData.category_id) return null;
        return categories.find(opt => String(opt.value) === String(serviceFormData.category_id)) || null;
    }, [serviceFormData.category_id, categories]);

    const selectedSubCategoryOption = useMemo(() => {
        if (selectedSubCategory) {
            return subCategories.find(opt => String(opt.value) === String(selectedSubCategory.id)) || null;
        }
        if (!serviceFormData.sub_category_id) return null;
        return subCategories.find(opt => String(opt.value) === String(serviceFormData.sub_category_id)) || null;
    }, [selectedSubCategory, serviceFormData.sub_category_id, subCategories]);

    const serviceTypeOptions = useMemo(() => serviceTypes, [serviceTypes]);

    const selectedServiceTypeOption = useMemo(
        () => serviceTypeOptions.find(opt => opt.value === serviceFormData.service_type) || serviceTypeOptions[0],
        [serviceTypeOptions, serviceFormData.service_type]
    );

    const fetchContentProviders = useCallback(async (searchTerm = '', countryId = null) => {
        try {
            setLoadingContentProviders(true);
            const params = {
                limit: 100,
                parent_organizations_only: true,
            };
            if (searchTerm) params.search = searchTerm;
            if (countryId) params.country_id = countryId;
            const result = await getPartnersSelect(params);
            if (!result.success) {
                toast.error(result.error);
                return;
            }
            if (result.data?.status || result.data?.success) {
                setFilteredContentProviders(result.data.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch parent partners:', error);
            toast.error(t('admin.paymentGetway.wizFailedLoadParentPartners'));
        } finally {
            setLoadingContentProviders(false);
        }
    }, [t]);

    const fetchSubPartnersForParent = useCallback(async (parentId, searchTerm = '') => {
        if (!parentId) {
            setFilteredSubPartners([]);
            return;
        }
        try {
            setLoadingSubPartners(true);
            const params = {
                sub_partners_for_parent: parentId,
                limit: 100,
            };
            if (searchTerm) params.search = searchTerm;
            const result = await getPartnersSelect(params);
            if (!result.success) {
                toast.error(result.error);
                setFilteredSubPartners([]);
                return;
            }
            if (result.data?.status || result.data?.success) {
                setFilteredSubPartners(result.data.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch sub-partners:', error);
            toast.error(t('admin.paymentGetway.wizFailedLoadSubPartners'));
            setFilteredSubPartners([]);
        } finally {
            setLoadingSubPartners(false);
        }
    }, [t]);

    const debouncedContentProviderSearch = useCallback(
        debounce((searchTerm, countryId) => {
            if (searchTerm.length >= 1) {
                fetchContentProviders(searchTerm, countryId);
            } else {
                fetchContentProviders('', countryId);
            }
        }, 500),
        [fetchContentProviders]
    );

    const debouncedSubPartnerSearch = useCallback(
        debounce((searchTerm, parentId) => {
            fetchSubPartnersForParent(parentId, searchTerm);
        }, 500),
        [fetchSubPartnersForParent]
    );

    const handleContentProviderSearchChange = (value) => {
        setContentProviderSearchTerm(value);
        debouncedContentProviderSearch(value, serviceFormData.country_id || null);
    };

    const handleContentProviderSelect = (option) => {
        const provider = filteredContentProviders.find(cp => cp.id === option.value);
        if (provider) {
            setSelectedParentPartner(provider);
            setSelectedSubPartner(null);
            setFilteredSubPartners([]);
            setSubPartnerSearchTerm('');
            const hasSubs = Boolean(provider.has_sub_partners);
            if (hasSubs) {
                setServiceFormData(prev => ({ ...prev, partner_id: '' }));
                fetchSubPartnersForParent(provider.id, '');
            } else {
                setServiceFormData(prev => ({ ...prev, partner_id: provider.id }));
            }
        }
    };

    const handleContentProviderClear = () => {
        setSelectedParentPartner(null);
        setSelectedSubPartner(null);
        setFilteredSubPartners([]);
        setSubPartnerSearchTerm('');
        setServiceFormData(prev => ({ ...prev, partner_id: '' }));
    };

    const handleContentProviderOpen = () => {
        if (!serviceFormData.country_id) {
            toast.warning(t('admin.paymentGetway.wizSelectCountryFirst'));
            return;
        }
        if (filteredContentProviders.length === 0) {
            fetchContentProviders('', serviceFormData.country_id);
        }
    };

    const handleSubPartnerSearchChange = (value) => {
        setSubPartnerSearchTerm(value);
        if (selectedParentPartner?.id) {
            debouncedSubPartnerSearch(value, selectedParentPartner.id);
        }
    };

    const handleSubPartnerSelect = (option) => {
        const sub = filteredSubPartners.find((s) => s.id === option.value);
        if (sub) {
            setSelectedSubPartner(sub);
            setServiceFormData((prev) => ({ ...prev, partner_id: sub.id }));
        }
    };

    const handleSubPartnerClear = () => {
        setSelectedSubPartner(null);
        setServiceFormData((prev) => ({ ...prev, partner_id: '' }));
    };

    const handleSubPartnerOpen = () => {
        if (!selectedParentPartner?.has_sub_partners || !selectedParentPartner.id) return;
        if (filteredSubPartners.length === 0 && !loadingSubPartners) {
            fetchSubPartnersForParent(selectedParentPartner.id, subPartnerSearchTerm || '');
        }
    };

    const parentPartnerOptions = useMemo(() => {
        return filteredContentProviders.map((cp) => ({
            value: cp.id,
            label: cp.text || cp.name || cp.business_name || String(cp.id),
            ...cp,
        }));
    }, [filteredContentProviders]);

    const selectedParentPartnerOption = useMemo(() => {
        if (!selectedParentPartner) return null;
        return (
            parentPartnerOptions.find((opt) => opt.value === selectedParentPartner.id) || {
                value: selectedParentPartner.id,
                label: selectedParentPartner.text || selectedParentPartner.name || String(selectedParentPartner.id),
                ...selectedParentPartner,
            }
        );
    }, [selectedParentPartner, parentPartnerOptions]);

    const subPartnerOptions = useMemo(
        () =>
            filteredSubPartners.map((s) => ({
                value: s.id,
                label: s.text || s.name || s.business_name || String(s.id),
                ...s,
            })),
        [filteredSubPartners]
    );

    const selectedSubPartnerOption = useMemo(() => {
        if (!selectedSubPartner) return null;
        return (
            subPartnerOptions.find((opt) => opt.value === selectedSubPartner.id) || {
                value: selectedSubPartner.id,
                label: selectedSubPartner.text || selectedSubPartner.name || String(selectedSubPartner.id),
                ...selectedSubPartner,
            }
        );
    }, [selectedSubPartner, subPartnerOptions]);

    useEffect(() => {
        if (!serviceFormData.category_id) {
            setSubCategories([]);
            setSelectedSubCategory(null);
            setServiceFormData(prev => ({ ...prev, sub_category_id: '' }));
            return;
        }
        loadSubCategories('', serviceFormData.category_id);
    }, [serviceFormData.category_id]);

    const handleSubCategorySearchChange = (value) => {
        setSubCategorySearchTerm(value);
        if (serviceFormData.category_id) {
            loadSubCategories(value, serviceFormData.category_id);
        }
    };

    const handleServiceImageChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setServiceImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setServiceImagePreview(reader.result);
        reader.readAsDataURL(file);
    };

    const handleServiceTypeSearchChange = (value) => {
        setServiceTypeSearchTerm(value);
        loadServiceTypes(value);
    };

    const handleServiceSubmit = async (e, mode = 'design_service') => {
        if (e) e.preventDefault();
        
        // Validate required fields: Country, Category, Service Name EN/AR, Description EN/AR
        if (
            !serviceFormData.country_id ||
            !serviceFormData.category_id ||
            !serviceFormData.service_name_en ||
            !serviceFormData.service_name_ar ||
            !serviceFormData.description_en ||
            !serviceFormData.description_ar
        ) {
            toast.error(t('admin.paymentGetway.wizFillRequiredService'));
            return;
        }
        if (!selectedParentPartner) {
            toast.error(t('admin.paymentGetway.wizSelectParentPartner'));
            return;
        }
        if (selectedParentPartner.has_sub_partners && !serviceFormData.partner_id) {
            toast.error(t('admin.paymentGetway.wizSelectSubPartnerOrg'));
            return;
        }
        if (!serviceFormData.partner_id) {
            toast.error(t('admin.paymentGetway.wizSelectParentPartner'));
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                ...serviceFormData,
                description: {
                    en: serviceFormData.description_en,
                    ar: serviceFormData.description_ar,
                },
                service_name: {
                    en: serviceFormData.service_name_en,
                    ar: serviceFormData.service_name_ar,
                }
            };
            delete payload.service_name_en;
            delete payload.service_name_ar;
            delete payload.description_en;
            delete payload.description_ar;

            let submitData = payload;
            let headers = {
                'Authorization': `Bearer ${getToken()}`,
                'Content-Type': 'application/json'
            };
            if (serviceImageFile) {
                const fd = new FormData();
                Object.entries(payload).forEach(([k, v]) => {
                    if (k === 'service_name' && typeof v === 'object') {
                        fd.append('service_name[en]', v.en ?? '');
                        fd.append('service_name[ar]', v.ar ?? '');
                    } else if (k === 'description' && typeof v === 'object') {
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

            const response = await axios.post(ADMIN_ENDPOINTS.SERVICE_CREATE, submitData, { headers });

            if (response.data?.success) {
                // ServiceResource returns the service object directly in response.data.data
                const serviceData = response.data.data || response.data;
                setCreatedService(serviceData);
                setCreatedProducts([]); // Reset products when service is created
                
                // Validate that we have the UUID (this is critical for product creation)
                if (!serviceData.id) {
                    console.error('Service created but UUID (id) is missing!', serviceData);
                    console.error('Full response:', response.data);
                    toast.error(t('admin.paymentGetway.wizServiceUuidMissing'));
                    return;
                }
                
                // Validate UUID format
                const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                if (!uuidRegex.test(serviceData.id)) {
                    console.error('Service created but UUID format is invalid!', {
                        id: serviceData.id,
                        expectedFormat: 'UUID (e.g., 019b9f25-623b-71d6-bd49-02ec1203f977)'
                    });
                    toast.error(t('admin.paymentGetway.wizServiceUuidInvalid'));
                    return;
                }
                
                console.log('✓ Service created successfully');
                console.log('  Service UUID (id):', serviceData.id, '← Use this for product.service_id (foreign key)');
                console.log('  Service Name:', serviceData.service_name);
                toast.success(t('admin.paymentGetway.wizServiceCreatedSuccess'));
                if (mode === 'design_later') {
                    navigate('/admin/services');
                } else {
                    setCurrentStep(2);
                }
            } else {
                toast.error(response.data?.message || t('admin.paymentGetway.wizFailedCreateService'));
            }
        } catch (error) {
            toast.error(error.response?.data?.message || t('admin.paymentGetway.wizFailedCreateService'));
        } finally {
            setSubmitting(false);
        }
    };

    const handleProductSubmit = async (e) => {
        e.preventDefault();
        
        if (!productFormData.price) {
            toast.error(t('admin.paymentGetway.wizPriceRequired'));
            return;
        }

        // Validate that cancel_code and sub_code are not the same
        if (productFormData.sub_code && productFormData.cancel_code && 
            productFormData.sub_code.trim() === productFormData.cancel_code.trim()) {
            toast.error(t('admin.paymentGetway.wizSubCancelCodeSame'));
            return;
        }

        if (!createdService || !createdService.id) {
            toast.error(t('admin.paymentGetway.wizServiceInfoMissing'));
            return;
        }

        // Use the shared saveProduct function
        await saveProduct(false);
    };

    const loadCreatedProducts = async () => {
        if (!createdService?.id) return;
        
        try {
            setLoadingProducts(true);
            const response = await fetchProductsByService(createdService.id);
            if (response.success) {
                const productsData = response.data?.data || response.data || [];
                setCreatedProducts(Array.isArray(productsData) ? productsData : []);
            }
        } catch (error) {
            console.error('Error loading products:', error);
        } finally {
            setLoadingProducts(false);
        }
    };

    // Load parent partners when country changes
    useEffect(() => {
        if (serviceFormData.country_id && currentStep === 1) {
            fetchContentProviders('', serviceFormData.country_id);
        } else if (!serviceFormData.country_id && filteredContentProviders.length > 0) {
            setFilteredContentProviders([]);
            setSelectedParentPartner(null);
            setSelectedSubPartner(null);
            setFilteredSubPartners([]);
            setServiceFormData(prev => ({ ...prev, partner_id: "" }));
        }
    }, [serviceFormData.country_id, currentStep, fetchContentProviders]);

    // Load products when service is created and we're on step 2
    useEffect(() => {
        if (currentStep === 2 && createdService?.id) {
            const loadProducts = async () => {
                try {
                    setLoadingProducts(true);
                    const response = await fetchProductsByService(createdService.id);
                    if (response.success) {
                        const productsData = response.data?.data || response.data || [];
                        setCreatedProducts(Array.isArray(productsData) ? productsData : []);
                    }
                } catch (error) {
                    console.error('Error loading products:', error);
                } finally {
                    setLoadingProducts(false);
                }
            };
            loadProducts();
        }
    }, [currentStep, createdService?.id]);

    // Helper function to save product (used by both handleProductSubmit and handleFinish)
    const saveProduct = async (shouldNavigate = false) => {
        if (!productFormData.price) {
            if (shouldNavigate) {
                // If trying to finish without required data, just navigate
                if (createdService?.id) {
                    navigate(`/admin/services/${createdService.id}`);
                } else {
                    navigate('/admin/services');
                }
                return;
            }
            toast.error(t('admin.paymentGetway.wizPriceRequired'));
            return false;
        }

        // Validate that cancel_code and sub_code are not the same
        if (productFormData.sub_code && productFormData.cancel_code && 
            productFormData.sub_code.trim() === productFormData.cancel_code.trim()) {
            toast.error(t('admin.paymentGetway.wizSubCancelCodeSame'));
            return false;
        }

        if (!createdService || !createdService.id) {
            toast.error(t('admin.paymentGetway.wizServiceInfoMissing'));
            return false;
        }

        setSubmitting(true);
        try {
            const serviceUuid = createdService.id;
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            
            if (!uuidRegex.test(serviceUuid)) {
                toast.error(t('admin.paymentGetway.wizInvalidServiceUuid'));
                setSubmitting(false);
                return false;
            }
            
            const productPayload = {
                ...productFormData,
                service_id: serviceUuid
            };
            
            const result = await createProduct(productPayload);

            if (result.success) {
                toast.success(t('admin.paymentGetway.wizProductSaved'));
                await loadCreatedProducts();
                
                if (shouldNavigate) {
                    // Navigate after successful save
                    navigate(`/admin/services/${createdService.id}`);
                } else {
                    // Reset form for next product
                    setProductFormData({
                        product_id: "",
                        product_name: "",
                        sub_code: "",
                        cancel_code: "",
                        short_code: "",
                        price: "",
                        fallback_price1: "",
                        fallback_price2: "",
                        fallback_price3: "",
                        fallback_price4: "",
                        tax: "0",
                        description_ar: "",
                        description_en: "",
                        status: "active",
                        is_active: true,
                    });
                }
                setSubmitting(false);
                return true;
            } else {
                console.error('Product creation failed:', result);
                toast.error(result.error || t('admin.paymentGetway.wizFailedSaveProduct'));
                
                if (result.errors && Object.keys(result.errors).length > 0) {
                    const errorMessages = Object.values(result.errors).flat().join(', ');
                    toast.error(t('admin.paymentGetway.wizValidationErrorsPrefix', { errors: errorMessages }));
                }
                setSubmitting(false);
                return false;
            }
        } catch (error) {
            console.error('Exception creating product:', error);
            toast.error(error.response?.data?.message || t('admin.paymentGetway.wizFailedSaveProduct'));
            setSubmitting(false);
            return false;
        }
    };

    const handleFinish = async () => {
        // Check if there's unsaved product data
        const hasProductData = productFormData.price || 
                              productFormData.product_id || 
                              productFormData.sub_code || 
                              productFormData.cancel_code;

        if (hasProductData) {
            // Save the product first, then navigate
            const saved = await saveProduct(true);
            if (!saved) {
                // If save failed, don't navigate - let user fix the issue
                return;
            }
        } else {
            // No product data to save, just navigate
            if (createdService?.id) {
                navigate(`/admin/services/${createdService.id}`);
            } else {
                navigate('/admin/services');
            }
        }
    };

    return (
        <div className="card">
            <div className="card-header">
                <h3 className="card-title">{t('admin.paymentGetway.wizCardTitle')}</h3>
                <div className="card-toolbar">
                    <div className="d-flex align-items-center gap-2">
                        <span className={`badge ${currentStep === 1 ? 'badge-primary' : 'badge-success'}`}>{t('admin.paymentGetway.wizStep1')}</span>
                        <span className="badge badge-light">→</span>
                        <span className={`badge ${currentStep === 2 ? 'badge-primary' : 'badge-light'}`}>{t('admin.paymentGetway.wizStep2')}</span>
                    </div>
                </div>
            </div>
            <div className="card-body">
                {currentStep === 1 ? (
                    <form onSubmit={handleServiceSubmit}>
                        <div className="row">
                            <div className="col-md-3 mb-7">
                                <div className="card card-flush">
                                    <div className="card-header">
                                        <div className="card-title">
                                            <h2>{t('admin.paymentGetway.wizServiceImage')}</h2>
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
                                                <input type="file" name="image" accept="image/*" id="service-image-upload" onChange={handleServiceImageChange} style={{ display: 'none' }} />
                                                <label
                                                    htmlFor="service-image-upload"
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
                                        <div className="text-muted fs-7">{t('admin.paymentGetway.wizUploadServiceImage')}</div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-9">
                                <div className="card">
                                    <div className="card-body p-9">
                                        <div className="row">
                                            <div className="col-md-6 mb-7">
                                                <label className="form-label">{t('admin.paymentGetway.wizLabelCountry')} <span className="text-danger">*</span></label>
                                                <SearchableDropdown
                                                    options={countryOptions}
                                                    selected={selectedCountryOption}
                                                    onSelect={handleCountrySelect}
                                                    onClear={handleCountryClear}
                                                    onOpen={handleCountryOpen}
                                                    onSearchChange={handleCountrySearchChange}
                                                    placeholder={t('admin.paymentGetway.wizPlaceholderCountry')}
                                                    loading={loadingCountries}
                                                    required={true}
                                                />
                                            </div>
                                            <div className="col-md-6 mb-7">
                                                <label className="form-label">{t('admin.paymentGetway.wizLabelParentPartner')} <span className="text-danger">*</span></label>
                                                <SearchableDropdown
                                                    options={parentPartnerOptions}
                                                    selected={selectedParentPartnerOption}
                                                    onSelect={handleContentProviderSelect}
                                                    onClear={handleContentProviderClear}
                                                    onOpen={handleContentProviderOpen}
                                                    onSearchChange={handleContentProviderSearchChange}
                                                    placeholder={t('admin.paymentGetway.wizPlaceholderParentPartner')}
                                                    loading={loadingContentProviders}
                                                    required={true}
                                                    showClear={false}
                                                />
                                            </div>
                                            {selectedParentPartner?.has_sub_partners ? (
                                                <div className="col-md-6 mb-7">
                                                    <label className="form-label">{t('admin.paymentGetway.wizLabelSubPartner')} <span className="text-danger">*</span></label>
                                                    <SearchableDropdown
                                                        options={subPartnerOptions}
                                                        selected={selectedSubPartnerOption}
                                                        onSelect={handleSubPartnerSelect}
                                                        onClear={handleSubPartnerClear}
                                                        onOpen={handleSubPartnerOpen}
                                                        onSearchChange={handleSubPartnerSearchChange}
                                                        placeholder={t('admin.paymentGetway.wizPlaceholderSubPartner')}
                                                        loading={loadingSubPartners}
                                                        required={true}
                                                        showClear={false}
                                                    />
                                                </div>
                                            ) : null}
                                            <div className="col-md-6 mb-7">
                                                <label className="form-label">{t('admin.paymentGetway.wizLabelServiceCategory')} <span className="text-danger">*</span></label>
                                                <SearchableDropdown
                                                    options={categories}
                                                    selected={selectedCategoryOption}
                                                    onSelect={(option) => setServiceFormData(prev => ({ ...prev, category_id: option?.value || '' }))}
                                                    onClear={() => setServiceFormData(prev => ({ ...prev, category_id: '', sub_category_id: '' }))}
                                                    placeholder={t('admin.paymentGetway.wizPlaceholderServiceCategory')}
                                                    loading={loadingCategories}
                                                />
                                            </div>
                                            <div className="col-md-6 mb-7">
                                                <label className="form-label">{t('admin.paymentGetway.wizLabelSubCategory')}</label>
                                                <SearchableDropdown
                                                    options={subCategories}
                                                    selected={selectedSubCategoryOption}
                                                    onSelect={(option) => {
                                                        const sub = subCategories.find(s => String(s.value) === String(option?.value));
                                                        setSelectedSubCategory(sub || null);
                                                        setServiceFormData(prev => ({ ...prev, sub_category_id: option?.value || '' }));
                                                    }}
                                                    onClear={() => {
                                                        setSelectedSubCategory(null);
                                                        setServiceFormData(prev => ({ ...prev, sub_category_id: '' }));
                                                    }}
                                                    onSearchChange={handleSubCategorySearchChange}
                                                    placeholder={t('admin.paymentGetway.wizPlaceholderSubCategory')}
                                                    loading={loadingSubCategories}
                                                    showClear={true}
                                                />
                                            </div>
                            <div className="col-md-6 mb-7 d-none">
                                                <label className="form-label">{t('admin.paymentGetway.wizLabelServiceType')} <span className="text-danger">*</span></label>
                                                <SearchableDropdown
                                                    options={serviceTypeOptions}
                                                    selected={selectedServiceTypeOption}
                                                    onSelect={(option) => setServiceFormData(prev => ({ ...prev, service_type: option?.value || 'digital' }))}
                                                    onClear={() => setServiceFormData(prev => ({ ...prev, service_type: 'digital' }))}
                                                    onOpen={() => loadServiceTypes()}
                                                    onSearchChange={handleServiceTypeSearchChange}
                                                    placeholder={t('admin.paymentGetway.wizPlaceholderServiceType')}
                                                    loading={loadingServiceTypes}
                                                    showClear={false}
                                                />
                                            </div>
                                            <div className="col-md-6 mb-7">
                                                <label className="form-label">{t('admin.paymentGetway.wizLabelServiceNameEn')} <span className="text-danger">*</span></label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    value={serviceFormData.service_name_en}
                                                    onChange={(e) => setServiceFormData({...serviceFormData, service_name_en: e.target.value})}
                                                    placeholder={t('admin.paymentGetway.wizPlaceholderServiceNameEn')}
                                                    required
                                                />
                                            </div>
                                            <div className="col-md-6 mb-7">
                                                <label className="form-label">{t('admin.paymentGetway.wizLabelServiceNameAr')} <span className="text-danger">*</span></label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    value={serviceFormData.service_name_ar}
                                                    onChange={(e) => setServiceFormData({...serviceFormData, service_name_ar: e.target.value})}
                                                    placeholder={t('admin.paymentGetway.wizPlaceholderServiceNameAr')}
                                                    required
                                                />
                                            </div>
                                            <div className="col-md-6 mb-7">
                                                <label className="form-label">{t('admin.paymentGetway.wizLabelDescEn')}</label>
                                                <textarea
                                                    className="form-control"
                                                    rows="3"
                                                    value={serviceFormData.description_en}
                                                    onChange={(e) => setServiceFormData({ ...serviceFormData, description_en: e.target.value })}
                                                    placeholder={t('admin.paymentGetway.wizPlaceholderDescEn')}
                                                    required
                                                />
                                            </div>
                                            <div className="col-md-6 mb-7">
                                                <label className="form-label">{t('admin.paymentGetway.wizLabelDescAr')}</label>
                                                <textarea
                                                    className="form-control"
                                                    rows="3"
                                                    dir="rtl"
                                                    value={serviceFormData.description_ar}
                                                    onChange={(e) => setServiceFormData({ ...serviceFormData, description_ar: e.target.value })}
                                                    placeholder={t('admin.paymentGetway.wizPlaceholderDescAr')}
                                                    required
                                                />
                                            </div>
                                            <div className="col-md-6 mb-7">
                                                <label className="form-label">{t('admin.paymentGetway.wizLabelStatus')} <span className="text-danger">*</span></label>
                                                <select
                                                    className="form-select"
                                                    value={serviceFormData.status}
                                                    onChange={(e) => setServiceFormData({ ...serviceFormData, status: e.target.value })}
                                                    required
                                                >
                                                    <option value="active">{t('admin.common.active')}</option>
                                                    <option value="inactive">{t('admin.common.inactive')}</option>
                                                    <option value="pending">{t('admin.common.pending')}</option>
                                                    <option value="staging">{t('admin.paymentGetway.wizStatusStaging')}</option>
                                                    <option value="testing">{t('admin.common.testing')}</option>
                                                </select>
                                            </div>
                                            <div className="col-md-6 mb-7">
                                                <label className="form-label">{t('admin.paymentGetway.wizLabelActiveStatus')}</label>
                                                <div className="form-check form-switch form-check-custom form-check-solid mt-2">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        checked={serviceFormData.is_active}
                                                        onChange={(e) => setServiceFormData({ ...serviceFormData, is_active: e.target.checked })}
                                                    />
                                                    <label className="form-check-label">
                                                        {serviceFormData.is_active ? t('admin.common.active') : t('admin.common.inactive')}
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {createdService && (
                            <div className="alert alert-info">
                                <strong>{t('admin.paymentGetway.wizServiceCreatedInfo')}</strong>{' '}
                                {t('admin.paymentGetway.wizServiceUuidLabel', { uuid: createdService.id })}
                            </div>
                        )}
                        <div className="d-flex justify-content-end gap-2 mt-4">
                            <button type="button" className="btn btn-light" onClick={() => navigate('/admin/services')}>
                                {t('admin.common.cancel')}
                            </button>
                            <button type="button" className="btn btn-light-primary" disabled={submitting} onClick={(e) => handleServiceSubmit(e, 'design_later')}>
                                {submitting ? t('admin.paymentGetway.wizSavingShort') : t('admin.paymentGetway.wizCreateDesignLater')}
                            </button>
                            <button type="button" className="btn btn-primary" disabled={submitting} onClick={(e) => handleServiceSubmit(e, 'design_service')}>
                                {submitting ? t('admin.paymentGetway.wizCreatingShort') : t('admin.paymentGetway.wizCreateDesignService')}
                            </button>
                        </div>
                    </form>
                ) : (
                    <div>
                        {/* Render the exact same component used by /admin/service-products/create */}
                        <ServiceProductCreate
                            serviceId={createdService?.id || ''}
                            onCancel={() => setCurrentStep(1)}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default ServiceWizard;


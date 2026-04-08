import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useToolbar } from '../../../contexts/ToolbarContext';
import { createProduct, mapProductFormsToApiPayload } from '../../../services/serviceProductsService';
import axios from '../../../utils/axiosConfig';
import { ADMIN_ENDPOINTS, AUTH_ENDPOINTS } from '../../../utils/constants';
import { getToken } from '../../../utils/api';
import { getPartnersSelect } from '../../../services/adminPartnersService';
import SearchableDropdown from '../../../common/filters/SearchableDropdown';
import MobileFormsBuilder from '../../../common/MobileFormsBuilder';

const ProductCreate = ({ serviceId: serviceIdProp, onCancel }) => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { setTitle, setBreadcrumbs } = useToolbar();
    const [submitting, setSubmitting] = useState(false);

    const serviceId = serviceIdProp || searchParams.get('service_id');
    const hasPresetService = Boolean(serviceId);

    const [loadingService, setLoadingService] = useState(hasPresetService);
    const [loadingSelectedService, setLoadingSelectedService] = useState(false);
    const [service, setService] = useState(null);

    const [formData, setFormData] = useState({
        service_id: serviceId || '',
        service_sub_category_id: '',
        name: { en: '', ar: '' },
        description: { en: '', ar: '' },
        service_url: '',
        notify_url: '',
        prepay_url: '',
        image: null,
        status: true,
    });

    const [productForms, setProductForms] = useState([]);
    const mobileFormsBuilderRef = useRef(null);

    const [imagePreview, setImagePreview] = useState(null);

    const [subCategories, setSubCategories] = useState([]);
    const [loadingSubCategories, setLoadingSubCategories] = useState(false);
    const [subCategorySearchTerm, setSubCategorySearchTerm] = useState('');
    const [selectedSubCategory, setSelectedSubCategory] = useState(null);

    // Cascading pickers when no ?service_id=
    const [countries, setCountries] = useState([]);
    const [loadingCountries, setLoadingCountries] = useState(false);
    const [countrySearchTerm, setCountrySearchTerm] = useState('');
    const [selectedCountryOption, setSelectedCountryOption] = useState(null);

    const [partners, setPartners] = useState([]);
    const [loadingPartners, setLoadingPartners] = useState(false);
    const [partnerSearchTerm, setPartnerSearchTerm] = useState('');
    const [selectedPartnerOption, setSelectedPartnerOption] = useState(null);

    const [servicePickOptions, setServicePickOptions] = useState([]);
    const [loadingServicePickOptions, setLoadingServicePickOptions] = useState(false);
    const [servicePickSearchTerm, setServicePickSearchTerm] = useState('');
    const [selectedServicePickOption, setSelectedServicePickOption] = useState(null);

    const loadSubCategories = useCallback(async (searchTerm = '', categoryId = null) => {
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
                headers: { Authorization: `Bearer ${getToken()}` },
            });
            if (response.data?.success || response.data?.status) {
                const list = response.data?.data || [];
                setSubCategories(list.map((item) => ({ value: item.id, label: item.name_en || item.name || item.text || item.id, ...item })));
            } else {
                setSubCategories([]);
            }
        } catch (error) {
            setSubCategories([]);
        } finally {
            setLoadingSubCategories(false);
        }
    }, []);

    const applyServicePayload = useCallback(
        (serviceData) => {
            setService(serviceData);
            if (serviceData.id) {
                setFormData((prev) => ({ ...prev, service_id: serviceData.id }));
            }
            if (serviceData.category_id) {
                loadSubCategories('', serviceData.category_id);
            }
        },
        [loadSubCategories]
    );

    const loadServiceFromUrl = useCallback(async () => {
        if (!serviceId) return;
        setLoadingService(true);
        try {
            const response = await axios.get(ADMIN_ENDPOINTS.SERVICE_DETAILS(serviceId), {
                headers: { Authorization: `Bearer ${getToken()}` },
            });
            if (response.data?.success || response.data?.data) {
                const serviceData = response.data.data?.data || response.data.data || response.data;
                applyServicePayload(serviceData);
            } else {
                toast.error('Service not found');
                navigate('/admin/services');
            }
        } catch (error) {
            console.error('Error loading service:', error);
            toast.error('Failed to load service details');
            navigate('/admin/services');
        } finally {
            setLoadingService(false);
        }
    }, [serviceId, navigate, applyServicePayload]);

    const loadServiceById = useCallback(
        async (id) => {
            if (!id) return;
            setLoadingSelectedService(true);
            try {
                const response = await axios.get(ADMIN_ENDPOINTS.SERVICE_DETAILS(id), {
                    headers: { Authorization: `Bearer ${getToken()}` },
                });
                if (response.data?.success || response.data?.data) {
                    const serviceData = response.data.data?.data || response.data.data || response.data;
                    applyServicePayload(serviceData);
                } else {
                    toast.error('Service not found');
                }
            } catch (error) {
                console.error('Error loading service:', error);
                toast.error('Failed to load service details');
            } finally {
                setLoadingSelectedService(false);
            }
        },
        [applyServicePayload]
    );

    const loadCountriesForPicker = useCallback(async (search = '') => {
        try {
            setLoadingCountries(true);
            const url = search
                ? `${AUTH_ENDPOINTS.COUNTRIES_SELECT}?search=${encodeURIComponent(search)}`
                : AUTH_ENDPOINTS.COUNTRIES_SELECT;
            const response = await axios.get(url, {
                headers: { Authorization: `Bearer ${getToken()}` },
            });
            if (response.data.status) {
                const list = Array.isArray(response.data.data) ? response.data.data : [];
                setCountries(
                    list.map((country) => ({
                        value: country.id,
                        label: country.text || country.name?.en || country.name,
                        ...country,
                    }))
                );
            } else {
                setCountries([]);
            }
        } catch (error) {
            console.error('Error loading countries:', error);
            setCountries([]);
        } finally {
            setLoadingCountries(false);
        }
    }, []);

    const loadPartnersForPicker = useCallback(async (search = '', countryId = null) => {
        const cid = countryId ?? selectedCountryOption?.value;
        if (!cid) {
            setPartners([]);
            return;
        }
        try {
            setLoadingPartners(true);
            const params = { per_page: 100, country_id: cid };
            if (search) params.search = search;
            const result = await getPartnersSelect(params);
            if (!result.success) {
                setPartners([]);
                return;
            }
            const body = result.data;
            const ok = body && (body.status === true || body.success === true);
            if (ok) {
                const list = Array.isArray(body.data) ? body.data : [];
                setPartners(
                    list.map((cp) => ({
                        value: cp.id,
                        label: cp.name || cp.text || cp.business_name || String(cp.id),
                        ...cp,
                    }))
                );
            } else {
                setPartners([]);
            }
        } catch (error) {
            console.error('Error loading partners:', error);
            setPartners([]);
        } finally {
            setLoadingPartners(false);
        }
    }, [selectedCountryOption?.value]);

    const loadServicesForPicker = useCallback(
        async (search = '', countryId = null, partnerId = null) => {
            const cid = countryId ?? selectedCountryOption?.value;
            const pid = partnerId ?? selectedPartnerOption?.value;
            if (!cid || !pid) {
                setServicePickOptions([]);
                return;
            }
            try {
                setLoadingServicePickOptions(true);
                const params = {
                    country_id: cid,
                    merchant_id: pid,
                    limit: 100,
                };
                if (search) params.search = search;
                const response = await axios.get(ADMIN_ENDPOINTS.SERVICES_SELECT, {
                    params,
                    headers: { Authorization: `Bearer ${getToken()}` },
                });
                if (response.data?.success) {
                    const list = response.data.data || [];
                    setServicePickOptions(
                        list.map((s) => ({
                            value: s.id,
                            label: s.service_name_en || s.service_name_ar || s.service_name || s.id,
                            ...s,
                        }))
                    );
                } else {
                    setServicePickOptions([]);
                }
            } catch (error) {
                console.error('Error loading services:', error);
                setServicePickOptions([]);
            } finally {
                setLoadingServicePickOptions(false);
            }
        },
        [selectedCountryOption?.value, selectedPartnerOption?.value]
    );

    useEffect(() => {
        setTitle('Create Product');
        const createPath = serviceId ? `/admin/service-products/create?service_id=${serviceId}` : '/admin/service-products/create';
        setBreadcrumbs([
            { label: 'Home', path: '/admin' },
            { label: 'Service Products', path: '/admin/service-products' },
            { label: 'Create Product', path: createPath, active: true },
        ]);
    }, [setTitle, setBreadcrumbs, serviceId]);

    useEffect(() => {
        if (serviceId) {
            loadServiceFromUrl();
        } else {
            setLoadingService(false);
            loadCountriesForPicker();
        }
    }, [serviceId, loadServiceFromUrl, loadCountriesForPicker]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.service_id) {
            toast.error('Please select a service');
            return;
        }

        setSubmitting(true);
        try {
            const result = await createProduct({
                ...formData,
                forms: mapProductFormsToApiPayload(productForms),
            });
            if (result.success) {
                toast.success('Product created successfully');
                const sid = service?.id || serviceId;
                navigate(sid ? `/admin/services/${sid}` : '/admin/services');
            } else {
                toast.error(result.error || 'Failed to create product');
            }
        } catch (error) {
            toast.error('Failed to create product');
        } finally {
            setSubmitting(false);
        }
    };

    const handleSubCategorySearchChange = (value) => {
        setSubCategorySearchTerm(value);
        loadSubCategories(value, service?.category_id || null);
    };

    const handleSubCategoryOpen = () => {
        if (subCategories.length === 0) loadSubCategories('', service?.category_id || null);
    };

    const handleSubCategorySelect = (option) => {
        const selected = (subCategories || []).find((s) => s.value === option.value) || option;
        setSelectedSubCategory(selected);
        setFormData((prev) => ({ ...prev, service_sub_category_id: option.value }));
    };

    const handleSubCategoryClear = () => {
        setSelectedSubCategory(null);
        setFormData((prev) => ({ ...prev, service_sub_category_id: '' }));
    };

    const handleCountrySearchChange = (value) => {
        setCountrySearchTerm(value);
        loadCountriesForPicker(value);
    };

    const handleCountryOpen = () => {
        if (countries.length === 0) loadCountriesForPicker(countrySearchTerm);
    };

    const handleCountrySelect = (option) => {
        setSelectedCountryOption(option);
        setSelectedPartnerOption(null);
        setSelectedServicePickOption(null);
        setPartners([]);
        setServicePickOptions([]);
        setService(null);
        setFormData((prev) => ({ ...prev, service_id: '' }));
    };

    const handleCountryClear = () => {
        setSelectedCountryOption(null);
        setSelectedPartnerOption(null);
        setSelectedServicePickOption(null);
        setPartners([]);
        setServicePickOptions([]);
        setService(null);
        setFormData((prev) => ({ ...prev, service_id: '' }));
    };

    const handlePartnerSearchChange = (value) => {
        setPartnerSearchTerm(value);
        loadPartnersForPicker(value);
    };

    const handlePartnerOpen = () => {
        if (selectedCountryOption?.value) {
            loadPartnersForPicker(partnerSearchTerm);
        }
    };

    const handlePartnerSelect = (option) => {
        setSelectedPartnerOption(option);
        setSelectedServicePickOption(null);
        setServicePickOptions([]);
        setService(null);
        setFormData((prev) => ({ ...prev, service_id: '' }));
    };

    const handlePartnerClear = () => {
        setSelectedPartnerOption(null);
        setSelectedServicePickOption(null);
        setServicePickOptions([]);
        setService(null);
        setFormData((prev) => ({ ...prev, service_id: '' }));
    };

    const handleServicePickSearchChange = (value) => {
        setServicePickSearchTerm(value);
        loadServicesForPicker(value);
    };

    const handleServicePickOpen = () => {
        if (selectedCountryOption?.value && selectedPartnerOption?.value) {
            loadServicesForPicker(servicePickSearchTerm);
        }
    };

    const handleServicePickSelect = async (option) => {
        setSelectedServicePickOption(option);
        if (option?.value) {
            await loadServiceById(option.value);
        }
    };

    const handleServicePickClear = () => {
        setSelectedServicePickOption(null);
        setService(null);
        setFormData((prev) => ({ ...prev, service_id: '' }));
    };

    const serviceLabel = useMemo(
        () => formData?.name?.en?.trim() || formData?.name?.ar?.trim() || 'Live Form Preview',
        [formData?.name?.en, formData?.name?.ar]
    );

    if (hasPresetService && loadingService) {
        return (
            <div className="card">
                <div className="card-header">
                    <h3 className="card-title placeholder-glow">
                        <span className="placeholder col-4 rounded" />
                    </h3>
                </div>
                <div className="card-body">
                    <p className="text-muted mb-4">Loading service details…</p>
                    <div className="row g-4">
                        <div className="col-md-6">
                            <div className="placeholder-glow mb-2">
                                <span className="placeholder col-6 rounded" />
                            </div>
                            <div className="placeholder-glow">
                                <span className="placeholder col-12 rounded" style={{ height: '38px' }} />
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="placeholder-glow mb-2">
                                <span className="placeholder col-6 rounded" />
                            </div>
                            <div className="placeholder-glow">
                                <span className="placeholder col-12 rounded" style={{ height: '38px' }} />
                            </div>
                        </div>
                        <div className="col-12">
                            <div className="placeholder-glow mb-2">
                                <span className="placeholder col-8 rounded" />
                            </div>
                            <div className="placeholder-glow">
                                <span className="placeholder col-12 rounded" style={{ height: '80px' }} />
                            </div>
                        </div>
                    </div>
                    <div className="d-flex justify-content-center mt-5">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading service...</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (hasPresetService && !service) {
        return (
            <div className="card">
                <div className="card-body text-center py-5">
                    <p className="text-danger">Service not found</p>
                    <button type="button" className="btn btn-primary" onClick={() => navigate('/admin/services')}>
                        Back to Services
                    </button>
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit}>
            <div className="row g-5">
                <div className="col-md-9">
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Create Product</h3>
                        </div>
                        <div className="card-body">
                            {!hasPresetService && (
                                <>
                                    <h5 className="mb-4 text-gray-800">Service</h5>
                                    <p className="text-muted fs-7 mb-4">
                                        Choose country, partner, and service. Product details below use the same layout whether you open this page with or without a preset service.
                                    </p>
                                    <div className="row g-4 mb-6">
                                        <div className="col-md-6">
                                            <label className="form-label required">Country</label>
                                            <SearchableDropdown
                                                options={countries}
                                                selected={
                                                    selectedCountryOption
                                                        ? { value: selectedCountryOption.value, label: selectedCountryOption.label }
                                                        : null
                                                }
                                                onSearchChange={handleCountrySearchChange}
                                                onSelect={handleCountrySelect}
                                                onClear={handleCountryClear}
                                                onOpen={handleCountryOpen}
                                                loading={loadingCountries}
                                                placeholder={loadingCountries ? 'Loading countries…' : 'Choose country'}
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label required">Partner</label>
                                            <SearchableDropdown
                                                options={partners}
                                                selected={
                                                    selectedPartnerOption
                                                        ? { value: selectedPartnerOption.value, label: selectedPartnerOption.label }
                                                        : null
                                                }
                                                onSearchChange={handlePartnerSearchChange}
                                                onSelect={handlePartnerSelect}
                                                onClear={handlePartnerClear}
                                                onOpen={handlePartnerOpen}
                                                loading={loadingPartners}
                                                placeholder={
                                                    loadingPartners
                                                        ? 'Loading partners…'
                                                        : selectedCountryOption
                                                          ? 'Choose partner'
                                                          : 'Select country first'
                                                }
                                                disabled={!selectedCountryOption}
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label required">Service</label>
                                            <SearchableDropdown
                                                options={servicePickOptions}
                                                selected={
                                                    selectedServicePickOption
                                                        ? { value: selectedServicePickOption.value, label: selectedServicePickOption.label }
                                                        : null
                                                }
                                                onSearchChange={handleServicePickSearchChange}
                                                onSelect={handleServicePickSelect}
                                                onClear={handleServicePickClear}
                                                onOpen={handleServicePickOpen}
                                                loading={loadingServicePickOptions || loadingSelectedService}
                                                placeholder={
                                                    loadingServicePickOptions || loadingSelectedService
                                                        ? 'Loading services…'
                                                        : selectedCountryOption && selectedPartnerOption
                                                          ? 'Choose service'
                                                          : 'Select partner first'
                                                }
                                                disabled={!selectedCountryOption || !selectedPartnerOption}
                                            />
                                        </div>
                                        {loadingSelectedService && (
                                            <div className="col-12 d-flex align-items-center gap-2 text-muted">
                                                <span className="spinner-border spinner-border-sm" role="status" />
                                                Loading service…
                                            </div>
                                        )}
                                    </div>
                                    <h5 className="mb-4 text-gray-800">Product</h5>
                                </>
                            )}
                            {hasPresetService && service && (
                                <div className="alert alert-info mb-4">
                                    <strong>Service:</strong> {service.service_name || 'N/A'} ({service.id})
                                </div>
                            )}
                            <div className="row g-4">
                                <div className="col-md-6">
                                    <label className="form-label">Product Name (English)</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={formData.name.en}
                                        onChange={(e) => setFormData({ ...formData, name: { ...formData.name, en: e.target.value } })}
                                        placeholder="e.g. Premium monthly bundle"
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label">Product Name (Arabic)</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={formData.name.ar}
                                        onChange={(e) => setFormData({ ...formData, name: { ...formData.name, ar: e.target.value } })}
                                        dir="rtl"
                                        placeholder="اسم المنتج بالعربية"
                                    />
                                </div>

                                <div className="col-md-6">
                                    <label className="form-label">Description (English)</label>
                                    <textarea
                                        className="form-control"
                                        rows={4}
                                        value={formData.description.en}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                description: { ...formData.description, en: e.target.value },
                                            })
                                        }
                                        placeholder="Short description shown to users (English)"
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label">Description (Arabic)</label>
                                    <textarea
                                        className="form-control"
                                        rows={4}
                                        value={formData.description.ar}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                description: { ...formData.description, ar: e.target.value },
                                            })
                                        }
                                        dir="rtl"
                                        placeholder="وصف المنتج بالعربية"
                                    />
                                </div>

                                <div className="col-md-6">
                                    <label className="form-label fw-semibold">Service Sub Category</label>
                                    <SearchableDropdown
                                        options={subCategories}
                                        selected={
                                            selectedSubCategory
                                                ? { value: selectedSubCategory.value, label: selectedSubCategory.label }
                                                : null
                                        }
                                        onSearchChange={handleSubCategorySearchChange}
                                        onSelect={handleSubCategorySelect}
                                        onClear={handleSubCategoryClear}
                                        onOpen={handleSubCategoryOpen}
                                        loading={loadingSubCategories}
                                        placeholder={
                                            loadingSubCategories
                                                ? 'Loading sub-categories…'
                                                : service?.category_id
                                                  ? 'Select sub category'
                                                  : 'Select a service first'
                                        }
                                        disabled={!service?.category_id}
                                    />
                                </div>

                                <div className="col-md-6">
                                    <label className="form-label">Status</label>
                                    <div className="form-check form-switch">
                                        <input
                                            className="form-check-input"
                                            type="checkbox"
                                            checked={!!formData.status}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.checked })}
                                        />
                                        <label className="form-check-label">{formData.status ? 'Active' : 'Inactive'}</label>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label">Service UUID</label>
                                    <input
                                        type="text"
                                        className="form-control text-break"
                                        value={service?.id || ''}
                                        readOnly
                                        disabled
                                        style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                                        placeholder="—"
                                    />
                                    <small className="text-muted">Linked service primary key (read-only)</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card card-flush">
                        <div className="card-header">
                            <div className="card-title">
                                <h3>Product Image</h3>
                            </div>
                        </div>
                        <div className="card-body text-center pt-0">
                            <div className="text-center mb-10" style={{ position: 'relative' }}>
                                <div className="image-input image-input-outline" style={{ position: 'relative', display: 'inline-block' }}>
                                    <div
                                        className="image-input-wrapper w-150px h-150px"
                                        style={{
                                            backgroundImage: `url('${imagePreview || '/assets/media/avatars/300-1.jpg'}')`,
                                            backgroundSize: 'cover',
                                            backgroundPosition: 'center',
                                            borderRadius: '8px',
                                            margin: '0 auto',
                                            position: 'relative',
                                        }}
                                    />
                                    <input
                                        type="file"
                                        name="image"
                                        accept="image/*"
                                        id="product-image-upload"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0] || null;
                                            setFormData((prev) => ({ ...prev, image: file }));
                                            if (file) {
                                                setImagePreview(URL.createObjectURL(file));
                                            } else {
                                                setImagePreview(null);
                                            }
                                        }}
                                        style={{ display: 'none' }}
                                    />
                                    <label
                                        htmlFor="product-image-upload"
                                        className="btn btn-icon btn-circle btn-color-muted btn-active-color-primary w-35px h-35px bg-body shadow"
                                        style={{ position: 'absolute', bottom: 0, right: 'calc(50% - 17.5px)', cursor: 'pointer' }}
                                    >
                                        <i className="ki-duotone ki-pencil fs-2">
                                            <span className="path1" />
                                            <span className="path2" />
                                        </i>
                                    </label>
                                </div>
                            </div>
                            <div className="text-muted fs-7">Upload product image</div>
                        </div>
                    </div>
                </div>
                <div className="col-12 mt-5">
                    <MobileFormsBuilder
                        ref={mobileFormsBuilderRef}
                        value={productForms}
                        onChange={setProductForms}
                        serviceLabel={serviceLabel}
                        hideGlobalActions
                    />
                </div>
                <div className="col-12">
                    <div className="d-flex justify-content-end flex-wrap gap-2">
                        <button
                            type="button"
                            className="btn btn-light-primary"
                            onClick={() => mobileFormsBuilderRef.current?.addForm?.()}
                        >
                            <i className="la la-plus" /> Add Form
                        </button>
                        <button type="button" className="btn btn-primary" onClick={() => mobileFormsBuilderRef.current?.openPreview?.()}>
                            <i className="ki-duotone ki-eye fs-2">
                                <span className="path1" />
                                <span className="path2" />
                                <span className="path3" />
                            </i>
                            Preview the Process
                        </button>
                        <button
                            type="button"
                            className="btn btn-light"
                            onClick={() => (typeof onCancel === 'function' ? onCancel() : navigate('/admin/services'))}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={submitting || !formData.service_id}
                        >
                            {submitting ? 'Creating...' : 'Create Product'}
                        </button>
                    </div>
                </div>
            </div>
        </form>
    );
};

export default ProductCreate;

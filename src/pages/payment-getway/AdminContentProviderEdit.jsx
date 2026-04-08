import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from '../../utils/axiosConfig';
import { toast } from 'react-toastify';
import { ADMIN_ENDPOINTS, AUTH_ENDPOINTS, AUTH_SERVICE_BASE } from '../../utils/constants';
import { getToken } from '../../utils/api';
import { getPartner, updatePartner } from '../../services/adminPartnersService';
import { useToolbar } from '../../contexts/ToolbarContext';
import SearchableDropdown from '../../common/filters/SearchableDropdown';

const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
};

const resolveAuthAssetUrl = (path) => {
    if (!path) return null;
    if (/^https?:\/\//i.test(path)) return path;
    const normalizedBase = AUTH_SERVICE_BASE.replace(/\/+$/, '');
    const normalizedPath = path.toString().replace(/^\/+/, '').replace(/\\/g, '/');
    return `${normalizedBase}/${normalizedPath}`;
};

const getTextValue = (value) => {
    if (value == null) return '';
    if (typeof value === 'string' || typeof value === 'number') return String(value);
    if (typeof value === 'object') {
        return value.en || value.ar || Object.values(value).find((v) => typeof v === 'string') || '';
    }
    return '';
};

const AdminContentProviderEdit = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { setTitle, setActions } = useToolbar();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});

    const [filteredCountries, setFilteredCountries] = useState([]);
    const [countrySearchTerm, setCountrySearchTerm] = useState('');
    const [selectedCountry, setSelectedCountry] = useState(null);
    const [loadingCountries, setLoadingCountries] = useState(false);
    const [countriesEnabled, setCountriesEnabled] = useState(false);

    const [partnerCategories, setPartnerCategories] = useState([]);
    const [loadingPartnerCategories, setLoadingPartnerCategories] = useState(false);
    const [partnerCategoriesEnabled, setPartnerCategoriesEnabled] = useState(false);
    const [partnerCategorySearchTerm, setPartnerCategorySearchTerm] = useState('');

    const [imagePreview, setImagePreview] = useState(null);
    const [logoFile, setLogoFile] = useState(null);

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
        is_active: true,
        status: 'pending'
    });

    useEffect(() => {
        setTitle('Edit Partner');
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
        fetchPartner();
    }, [id]);

    const fetchCountries = async (searchTerm = '') => {
        try {
            setLoadingCountries(true);
            const token = getToken();
            const url = searchTerm
                ? `${AUTH_ENDPOINTS.COUNTRIES_SELECT}?search=${encodeURIComponent(searchTerm)}`
                : AUTH_ENDPOINTS.COUNTRIES_SELECT;
            const response = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` }
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

    const fetchPartner = async () => {
        try {
            setLoading(true);
            const result = await getPartner(id);
            if (!result.success) {
                toast.error(result.error);
                return;
            }
            const responseData = result.data;
            const isSuccess = responseData.success || responseData.status;
            if (isSuccess) {
                const partner = responseData.data.partner || responseData.data.merchant || responseData.data.contentProvider || responseData.data;
                setFormData({
                    name: partner.name || '',
                    business_name: partner.business_name || '',
                    owner_name: partner.owner_name || '',
                    email: partner.email || '',
                    phone: partner.phone || '',
                    business_phone: partner.business_phone || '',
                    address: partner.address || '',
                    country_id: partner.country_id || '',
                    partner_category_id: partner.partner_category_id || partner.partner_category?.id || '',
                    is_active: partner.is_active !== undefined ? partner.is_active : true,
                    status: partner.status || 'pending'
                });
                if (partner.country) {
                    setSelectedCountry(partner.country);
                } else if (partner.country_id) {
                    setSelectedCountry({
                        id: partner.country_id,
                        text: partner.country_name || partner.country?.name || 'Selected Country'
                    });
                }
                if (partner.logo) setImagePreview(resolveAuthAssetUrl(partner.logo));

                try {
                    const token = getToken();
                    const catRes = await axios.get(ADMIN_ENDPOINTS.SERVICE_CATEGORIES_ACTIVE, {
                        params: {
                            type: 'partner',
                            parents_only: true,
                            limit: 100,
                            include_inactive: true,
                        },
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    if (catRes.data.success || catRes.data.status) {
                        const list = catRes.data.data || [];
                        const mapped = list.map((c) => ({
                            value: c.id,
                            label: c.name_en || c.name_ar || c.code,
                            ...c,
                        }));
                        const pcId = partner.partner_category_id || partner.partner_category?.id;
                        if (pcId && partner.partner_category && !mapped.some((m) => String(m.value) === String(pcId))) {
                            mapped.unshift({
                                value: partner.partner_category.id,
                                label:
                                    partner.partner_category.name_en ||
                                    partner.partner_category.name_ar ||
                                    'Category',
                                ...partner.partner_category,
                            });
                        }
                        setPartnerCategories(mapped);
                    }
                } catch {
                    /* non-fatal */
                }
            }
        } catch (error) {
            toast.error('Failed to load partner');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const debouncedCountrySearch = useCallback(
        debounce((searchTerm) => {
            if (searchTerm.length >= 1) fetchCountries(searchTerm);
            else fetchCountries();
        }, 500),
        []
    );

    const handleCountrySearchChange = (value) => {
        setCountrySearchTerm(value);
        setCountriesEnabled(true);
        debouncedCountrySearch(value);
    };

    const handleCountrySelect = (option) => {
        const country = filteredCountries.find((c) => String(c.id) === String(option.value));
        if (country) {
            setSelectedCountry(country);
            setFormData((prev) => ({ ...prev, country_id: country.id }));
        } else if (option?.value) {
            setSelectedCountry({
                id: option.value,
                text: option.label,
                name: option.label
            });
            setFormData((prev) => ({ ...prev, country_id: option.value }));
        }
    };

    const handleCountryClear = () => {
        setSelectedCountry(null);
        setFormData((prev) => ({ ...prev, country_id: '' }));
    };

    const handleCountryOpen = () => {
        setCountriesEnabled(true);
        if (filteredCountries.length === 0) fetchCountries();
    };

    const countryOptions = useMemo(
        () =>
            filteredCountries.map((country) => ({
                value: country.id,
                label: getTextValue(country.text) || getTextValue(country.name) || `Country ${country.id}`,
                code: country.code || country.short_name || country.code_iso2,
                ...country
            })),
        [filteredCountries]
    );

    const selectedCountryOption = useMemo(() => {
        const selectedId = selectedCountry?.id ?? formData.country_id;
        if (!selectedId) return null;

        const found = countryOptions.find((opt) => String(opt.value) === String(selectedId));
        if (found) return found;

        return {
            value: selectedId,
            label:
                getTextValue(selectedCountry?.text) ||
                getTextValue(selectedCountry?.name) ||
                getTextValue(selectedCountry?.label) ||
                'Selected Country',
            code: selectedCountry?.code || selectedCountry?.short_name || selectedCountry?.code_iso2
        };
    }, [selectedCountry, countryOptions, formData.country_id]);

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

    const handleImageChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setLogoFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setImagePreview(reader.result);
        reader.readAsDataURL(file);
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: '' }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);

            const hasLogo = !!logoFile;
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
                submitData.append('logo', logoFile);
            } else {
                submitData = {
                    ...formData,
                    business_name: formData.business_name || formData.name
                };
                delete submitData.business_type;
                delete submitData.plan_id;
                delete submitData.city_id;
                delete submitData.currency_id;
                delete submitData.scopes;
                delete submitData.operator_id;
                delete submitData.tax_number;
                delete submitData.trade_license_start_date;
                delete submitData.trade_license_expired_date;
            }

            const result = await updatePartner(id, submitData);
            if (!result.success) {
                toast.error(result.error);
                if (result.errors) setErrors(result.errors);
                return;
            }

            const isSuccess = result.data.success || result.data.status;
            if (isSuccess) {
                toast.success('Partner updated successfully');
                navigate(`/admin/partners/${id}`);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update partner');
            if (error.response?.data?.errors) setErrors(error.response.data.errors);
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                <span className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }}></span>
            </div>
        );
    }

    return (
        <div className="post d-flex flex-column-fluid">
            <div id="kt_content_container" className="container-xxl">
                <form onSubmit={handleSubmit}>
                    <div className="row">
                        <div className="col-md-3 mb-7">
                            <div className="card card-flush">
                                <div className="card-header">
                                    <div className="card-title">
                                        <h2>Logo</h2>
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
                                                    position: 'relative'
                                                }}
                                            ></div>
                                            <input
                                                type="file"
                                                name="logo"
                                                accept="image/*"
                                                onChange={handleImageChange}
                                                id="logo-upload-edit"
                                                style={{ display: 'none' }}
                                            />
                                            <label
                                                htmlFor="logo-upload-edit"
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
                                    <div className="text-muted fs-7">Upload partner logo</div>
                                </div>
                            </div>
                        </div>

                        <div className="col-md-9">
                            <div className="card">
                                <div className="card-header border-0">
                                    <div className="card-title">
                                        <h2>Edit Partner</h2>
                                    </div>
                                </div>
                                <div className="card-body p-9">
                                    <div className="row">
                                        <div className="col-md-6 mb-7">
                                            <SearchableDropdown
                                                label="Country"
                                                placeholder="Select Country"
                                                options={countryOptions}
                                                selected={selectedCountryOption}
                                                onSelect={handleCountrySelect}
                                                onClear={handleCountryClear}
                                                loading={loadingCountries}
                                                onOpen={handleCountryOpen}
                                                onSearchChange={handleCountrySearchChange}
                                                searchPlaceholder="Search countries..."
                                                required={true}
                                            />
                                        </div>

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

                                        <div className="col-md-6 mb-7">
                                            <label className="form-label fw-bold required">Business /Brand Name</label>
                                            <input type="text" name="name" className={`form-control ${errors.name ? 'is-invalid' : ''}`} value={formData.name} onChange={handleInputChange} placeholder="Enter Business /Brand Name" />
                                        </div>

                                        <div className="col-md-6 mb-7">
                                            <label className="form-label fw-bold">Contact Person Name</label>
                                            <input type="text" name="business_name" className="form-control" value={formData.business_name} onChange={handleInputChange} placeholder="Optional (defaults to Business /Brand Name)" />
                                        </div>

                                        <div className="col-md-6 mb-7">
                                            <label className="form-label fw-bold required">Company Name</label>
                                            <input type="text" name="owner_name" className={`form-control ${errors.owner_name ? 'is-invalid' : ''}`} value={formData.owner_name} onChange={handleInputChange} placeholder="Enter Company Name" />
                                        </div>

                                        <div className="col-md-6 mb-7">
                                            <label className="form-label fw-bold required">Email</label>
                                            <input type="email" name="email" className={`form-control ${errors.email ? 'is-invalid' : ''}`} value={formData.email} onChange={handleInputChange} placeholder="partner@example.com" />
                                        </div>

                                        <div className="col-md-6 mb-7">
                                            <label className="form-label fw-bold required">Phone</label>
                                            <input type="text" name="phone" className={`form-control ${errors.phone ? 'is-invalid' : ''}`} value={formData.phone} onChange={handleInputChange} placeholder="+1234567890" />
                                        </div>

                                        <div className="col-md-6 mb-7">
                                            <label className="form-label fw-bold">Business Phone</label>
                                            <input type="text" name="business_phone" className="form-control" value={formData.business_phone} onChange={handleInputChange} placeholder="+1234567890" />
                                        </div>

                                        <div className="col-md-12 mb-7">
                                            <label className="form-label fw-bold">Profile Summary</label>
                                            <textarea name="address" className="form-control" rows="3" value={formData.address} onChange={handleInputChange} placeholder="Enter profile summary" />
                                        </div>

                                        <div className="col-md-6 mb-7">
                                            <label className="form-label fw-bold">Active Status</label>
                                            <div className="form-check form-switch form-check-custom form-check-solid mt-2">
                                                <input className="form-check-input" type="checkbox" name="is_active" checked={formData.is_active} onChange={handleInputChange} />
                                                <label className="form-check-label">{formData.is_active ? 'Active' : 'Inactive'}</label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="row mt-5">
                        <div className="col-md-3"></div>
                        <div className="col-md-9">
                            <div className="d-flex justify-content-end gap-3">
                                <Link to={`/admin/partners/${id}`} className="btn btn-light">Cancel</Link>
                                <button type="submit" className="btn btn-primary" disabled={saving}>
                                    {saving ? (
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
                                            Save Changes
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

export default AdminContentProviderEdit;


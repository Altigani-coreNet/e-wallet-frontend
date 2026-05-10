import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { AUTH_SERVICE_BASE, AUTH_ENDPOINTS } from '../../utils/constants';
import { updateMerchantProfile, updateMerchantAttachments } from '../../services/profileService';
import { getToken } from '../../utils/api';
import { toast } from 'react-toastify';

const ATTACHMENT_FIELD_KEYS = ['company_logo', 'tax_certification', 'trade_license', 'user_id_document'];

const ATTACHMENT_KEY_ALIASES = {
    tax_certificate: 'tax_certification',
    tax_certified: 'tax_certification',
    company_logo_url: 'company_logo',
    logo: 'company_logo',
    user_id: 'user_id_document',
};

const buildEmptyAttachmentState = () => ATTACHMENT_FIELD_KEYS.reduce((acc, key) => {
    acc[key] = null;
    return acc;
}, {});

const createFileInputKeys = () => ATTACHMENT_FIELD_KEYS.reduce((acc, key) => {
    acc[key] = `${key}-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
    return acc;
}, {});

const ensureAbsoluteUrl = (baseUrl, url) => {
    if (!url) return null;
    if (/^https?:\/\//i.test(url)) {
        return url;
    }
    if (!baseUrl) {
        return url;
    }
    const normalizedBase = baseUrl.replace(/\/+$/, '');
    const normalizedPath = url.startsWith('/') ? url : `/${url}`;
    return `${normalizedBase}${normalizedPath}`;
};

const normalizeLocationOption = (item = {}, type = 'country') => {
    if (!item) return null;
    const idCandidate = item.id ?? item.value ?? item.uuid ?? item.key ?? item.code ?? item.iso2 ?? item.iso ?? item.identifier;
    if (!idCandidate) return null;
    const textCandidate = item.text ?? item.name ?? item.label ?? item.title ?? item.display_name ?? item.full_name ?? item.description;
    const normalized = {
        ...item,
        id: String(idCandidate),
        text: textCandidate ? String(textCandidate) : String(idCandidate),
        code: item.code ?? item.iso2 ?? item.iso ?? item.alpha2 ?? item.short_code ?? null,
        type,
    };
    return normalized;
};

const normalizeOptionsList = (items, type = 'country') => {
    if (!Array.isArray(items)) return [];
    return items
        .map(item => normalizeLocationOption(item, type))
        .filter(Boolean);
};

const extractOptionsFromResponse = (response, type = 'country') => {
    if (!response || !response.data) return [];
    const candidates = [
        response.data?.data,
        response.data?.results,
        response.data?.items,
        response.data?.payload,
        response.data?.list,
        response.data,
    ];

    for (const candidate of candidates) {
        if (Array.isArray(candidate)) {
            return normalizeOptionsList(candidate, type);
        }
        if (candidate && Array.isArray(candidate.data)) {
            return normalizeOptionsList(candidate.data, type);
        }
    }

    return [];
};

const isResponseSuccess = (response) => {
    if (!response || !response.data) return false;
    const data = response.data;
    return data.status === true || data.success === true || Array.isArray(data.data) || Array.isArray(data);
};

const collectMerchantAttachments = (merchant) => {
    const collected = buildEmptyAttachmentState();

    if (!merchant) {
        return collected;
    }

    const attachmentsList = Array.isArray(merchant.attachments) ? merchant.attachments : [];

    attachmentsList.forEach((item) => {
        const rawKey = item?.url_type || item?.type || item?.key || item?.document_type;
        const normalizedKey = ATTACHMENT_KEY_ALIASES[rawKey] || rawKey;
        if (!normalizedKey || !(normalizedKey in collected)) {
            return;
        }

        const url = item?.url || item?.full_url || item?.path || item?.file_url;
        if (url && !collected[normalizedKey]) {
            collected[normalizedKey] = url;
        }
    });

    if (merchant.logo_url || merchant.logo) {
        collected.company_logo = merchant.logo_url || merchant.logo;
    }

    return collected;
};

const getMerchantCountryDisplay = (merchant) => {
    if (!merchant) return '';
    const country = merchant.country || merchant.country_details || merchant.country_data;
    return (
        country?.name ||
        country?.text ||
        country?.label ||
        country?.title ||
        merchant.country_name ||
        merchant.country_label ||
        merchant.country ||
        ''
    );
};

const getMerchantCityDisplay = (merchant) => {
    if (!merchant) return '';
    const city = merchant.city || merchant.city_details || merchant.city_data;
    return (
        city?.name ||
        city?.text ||
        city?.label ||
        city?.title ||
        merchant.city_name ||
        merchant.city_label ||
        merchant.city ||
        ''
    );
};

/**
 * EditMerchantProfile Component
 * 
 * Full merchant profile editing form (for approved merchants or regular updates)
 * Creates a change request if merchant is not rejected
 */
const EditMerchantProfile = ({ merchant, onSuccess, onCancel }) => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState({
        countries: false,
        cities: false,
        businessTypes: false
    });
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        owner_name: '',
        email: '',
        phone: '',
        business_type: '',
        address: '',
        trade_license_number: '',
        tax_certified_number: '',
        country_id: '',
        city_id: '',
    });
    const [errors, setErrors] = useState({});
    const [countries, setCountries] = useState([]);
    const [filteredCountries, setFilteredCountries] = useState([]);
    const [cities, setCities] = useState([]);
    const [filteredCities, setFilteredCities] = useState([]);
    const [businessTypes, setBusinessTypes] = useState([]);
    const [countrySearchTerm, setCountrySearchTerm] = useState('');
    const [citySearchTerm, setCitySearchTerm] = useState('');
    const [showCountryList, setShowCountryList] = useState(false);
    const [showCityList, setShowCityList] = useState(false);
    const [selectedCountry, setSelectedCountry] = useState(null);
    const [selectedCity, setSelectedCity] = useState(null);
    const [existingAttachments, setExistingAttachments] = useState(buildEmptyAttachmentState());
    const [attachmentFiles, setAttachmentFiles] = useState(() => buildEmptyAttachmentState());
    const [attachmentPreviews, setAttachmentPreviews] = useState(() => buildEmptyAttachmentState());
    const [attachmentErrors, setAttachmentErrors] = useState({});
    const [attachmentSubmitting, setAttachmentSubmitting] = useState(false);
    const [attachmentInputKeys, setAttachmentInputKeys] = useState(() => createFileInputKeys());

    const lastFetchedCitiesCountryIdRef = useRef(null);

    const resetAttachmentForm = useCallback(() => {
        setAttachmentFiles(buildEmptyAttachmentState());
        setAttachmentPreviews(buildEmptyAttachmentState());
        setAttachmentErrors({});
        setAttachmentInputKeys(createFileInputKeys());
    }, []);

    // Debounce function
    const debounce = (func, delay) => {
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(null, args), delay);
        };
    };

    // Fetch countries
    const fetchCountries = useCallback(async (searchTerm = '') => {
        setLoading(prev => ({ ...prev, countries: true }));
        try {
            const token = getToken();
            const url = searchTerm
                ? `${AUTH_ENDPOINTS.COUNTRIES_SELECT}?search=${encodeURIComponent(searchTerm)}`
                : AUTH_ENDPOINTS.COUNTRIES_SELECT;

            const response = await axios.get(url, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            if (isResponseSuccess(response)) {
                const normalizedCountries = extractOptionsFromResponse(response, 'country');
                setCountries(normalizedCountries);
                setFilteredCountries(normalizedCountries);

                if (formData.country_id) {
                    const matchedCountry = normalizedCountries.find(country => country.id === String(formData.country_id));
                    if (matchedCountry) {
                        setSelectedCountry(matchedCountry);
                        setCountrySearchTerm(matchedCountry.text);
                    }
                }
            } else {
                setCountries([]);
                setFilteredCountries([]);
            }
        } catch (error) {
            console.error('Error fetching countries:', error);
            setCountries([]);
            setFilteredCountries([]);
        } finally {
            setLoading(prev => ({ ...prev, countries: false }));
        }
    }, [formData.country_id]);

    // Debounced country search
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
        const normalizedCountry = normalizeLocationOption(country, 'country');
        const countryId = normalizedCountry?.id || '';

        setSelectedCountry(normalizedCountry);
        setCountrySearchTerm(normalizedCountry?.text || '');
        setFormData(prev => ({ ...prev, country_id: countryId, city_id: '' }));
        setShowCountryList(false);
        setSelectedCity(null);
        setCitySearchTerm('');
        lastFetchedCitiesCountryIdRef.current = null;
        fetchCities(countryId, { force: true });
    };

    const handleRemoveCountry = () => {
        setSelectedCountry(null);
        setCountrySearchTerm('');
        setFormData(prev => ({ ...prev, country_id: '', city_id: '' }));
        setShowCountryList(false);
        lastFetchedCitiesCountryIdRef.current = null;
        setCities([]);
        setFilteredCities([]);
        setSelectedCity(null);
        setCitySearchTerm('');
    };

    // Fetch cities
    const fetchCities = useCallback(async (countryId, options = {}) => {
        if (!countryId) {
            lastFetchedCitiesCountryIdRef.current = null;
            setCities([]);
            setFilteredCities([]);
            return;
        }

        const normalizedCountryId = String(countryId);
        const { force = false } = options;

        if (!force && lastFetchedCitiesCountryIdRef.current === normalizedCountryId) {
            return;
        }

        lastFetchedCitiesCountryIdRef.current = normalizedCountryId;

        setLoading(prev => ({ ...prev, cities: true }));
        try {
            const token = getToken();
            const response = await axios.get(`${AUTH_ENDPOINTS.CITIES_SELECT}?country_id=${encodeURIComponent(normalizedCountryId)}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            if (isResponseSuccess(response)) {
                const normalizedCities = extractOptionsFromResponse(response, 'city');
                setCities(normalizedCities);
                setFilteredCities(normalizedCities);

                if (formData.city_id) {
                    const matchedCity = normalizedCities.find(city => city.id === String(formData.city_id));
                    if (matchedCity) {
                        setSelectedCity(matchedCity);
                        setCitySearchTerm(matchedCity.text);
                    }
                }
            } else {
                setCities([]);
                setFilteredCities([]);
            }
        } catch (error) {
            console.error('Error fetching cities:', error);
            setCities([]);
            setFilteredCities([]);
        } finally {
            setLoading(prev => ({ ...prev, cities: false }));
        }
    }, [formData.city_id]);

    // Debounced city search
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
        const normalizedCity = normalizeLocationOption(city, 'city');
        setSelectedCity(normalizedCity);
        setCitySearchTerm(normalizedCity?.text || '');
        setFormData(prev => ({ ...prev, city_id: normalizedCity?.id || '' }));
        setShowCityList(false);
    };

    const handleRemoveCity = () => {
        setSelectedCity(null);
        setCitySearchTerm('');
        setFormData(prev => ({ ...prev, city_id: '' }));
        setShowCityList(false);
        setFilteredCities(cities);
    };

    // Fetch business types
    const fetchBusinessTypes = useCallback(async () => {
        setLoading(prev => ({ ...prev, businessTypes: true }));
        try {
            const token = getToken();
            const response = await axios.get(AUTH_ENDPOINTS.BUSINESS_TYPES_SELECT, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });
            if (isResponseSuccess(response)) {
                const payload = response.data?.data ?? response.data?.items ?? [];
                setBusinessTypes(Array.isArray(payload) ? payload : []);
            } else {
                setBusinessTypes([]);
            }
        } catch (error) {
            console.error('Error fetching business types:', error);
            setBusinessTypes([]);
        } finally {
            setLoading(prev => ({ ...prev, businessTypes: false }));
        }
    }, []);

    // Initialize form with merchant data
    useEffect(() => {
        if (!merchant) {
            setFormData({
                name: '',
                owner_name: '',
                email: '',
                phone: '',
                business_type: '',
                address: '',
                trade_license_number: '',
                tax_certified_number: '',
                country_id: '',
                city_id: '',
            });
            setExistingAttachments(buildEmptyAttachmentState());
            resetAttachmentForm();
            setSelectedCountry(null);
            setCountrySearchTerm('');
            setSelectedCity(null);
            setCitySearchTerm('');
            return;
        }

        setFormData({
            name: merchant.name || '',
            owner_name: merchant.owner_name || '',
            email: merchant.email || '',
            phone: merchant.phone || '',
            business_type: merchant.business_type || '',
            address: merchant.address || '',
            trade_license_number: merchant.trade_license_number || '',
            tax_certified_number: merchant.tax_certified_number || merchant.tax_number || '',
            country_id: merchant.country_id || '',
            city_id: merchant.city_id || '',
        });

        const attachmentsMap = collectMerchantAttachments(merchant);
        const normalizedAttachments = buildEmptyAttachmentState();
        ATTACHMENT_FIELD_KEYS.forEach((key) => {
            normalizedAttachments[key] = ensureAbsoluteUrl(AUTH_SERVICE_BASE, attachmentsMap[key]);
        });
        setExistingAttachments(normalizedAttachments);
        resetAttachmentForm();

        if (merchant.country_id) {
            const fallbackCountryName = getMerchantCountryDisplay(merchant);
            if (fallbackCountryName) {
                const fallbackCountry = normalizeLocationOption({
                    id: merchant.country_id,
                    text: fallbackCountryName,
                    code: merchant.country?.code || merchant.country_code,
                }, 'country');
                setSelectedCountry(fallbackCountry);
                setCountrySearchTerm(fallbackCountry?.text || '');
            }
        } else {
            setSelectedCountry(null);
            setCountrySearchTerm('');
        }

        if (merchant.city_id) {
            const fallbackCityName = getMerchantCityDisplay(merchant);
            if (fallbackCityName) {
                const fallbackCity = normalizeLocationOption({
                    id: merchant.city_id,
                    text: fallbackCityName,
                }, 'city');
                setSelectedCity(fallbackCity);
                setCitySearchTerm(fallbackCity?.text || '');
            }
        } else {
            setSelectedCity(null);
            setCitySearchTerm('');
        }
    }, [merchant, resetAttachmentForm]);

    // Load initial data
    useEffect(() => {
        fetchCountries();
        fetchBusinessTypes();
    }, [fetchCountries, fetchBusinessTypes]);

    // Load country when formData changes
    useEffect(() => {
        if (!formData.country_id) {
            setSelectedCountry(null);
            setCountrySearchTerm('');
            lastFetchedCitiesCountryIdRef.current = null;
            setCities([]);
            setFilteredCities([]);
            setSelectedCity(null);
            setCitySearchTerm('');
            return;
        }

        const normalizedCountryId = String(formData.country_id);
        if (countries.length > 0) {
            const matchedCountry = countries.find(c => c.id === normalizedCountryId);
            if (matchedCountry) {
                setSelectedCountry(matchedCountry);
                setCountrySearchTerm(matchedCountry.text);
            }
        }

        fetchCities(normalizedCountryId);
    }, [formData.country_id, countries, fetchCities]);

    // Load city when formData changes
    useEffect(() => {
        if (!formData.city_id) {
            setSelectedCity(null);
            setCitySearchTerm('');
            return;
        }

        if (cities.length > 0) {
            const normalizedCityId = String(formData.city_id);
            const matchedCity = cities.find(c => c.id === normalizedCityId);
            if (matchedCity) {
                setSelectedCity(matchedCity);
                setCitySearchTerm(matchedCity.text);
            }
        }
    }, [formData.city_id, cities]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const regenerateAttachmentInputKey = useCallback((key) => {
        setAttachmentInputKeys(prev => ({
            ...prev,
            [key]: `${key}-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`
        }));
    }, []);

    const handleAttachmentClear = useCallback((key) => {
        setAttachmentFiles(prev => ({ ...prev, [key]: null }));
        setAttachmentPreviews(prev => ({ ...prev, [key]: null }));
        setAttachmentErrors(prev => ({ ...prev, [key]: '' }));
        regenerateAttachmentInputKey(key);
    }, [regenerateAttachmentInputKey]);

    const handleAttachmentChange = useCallback((key, file) => {
        if (!(file instanceof File)) {
            handleAttachmentClear(key);
            return;
        }

        setAttachmentFiles(prev => ({ ...prev, [key]: file }));
        setAttachmentPreviews(prev => ({ ...prev, [key]: file.name }));
        setAttachmentErrors(prev => ({ ...prev, [key]: '' }));
    }, [handleAttachmentClear]);

    const renderExistingAttachment = (fieldKey) => {
        const url = existingAttachments[fieldKey];
        if (!url) {
            return <div className="text-muted mb-3">{t('merchant.profile.noFileUploaded')}</div>;
        }

        const normalizedUrl = ensureAbsoluteUrl(AUTH_SERVICE_BASE, url);
        const isImage = /\.(svg|png|jpe?g|gif|bmp|webp)$/i.test((normalizedUrl || '').split('?')[0]);
        const label = t(`merchant.profile.attachments.${fieldKey}`);

        if (isImage) {
            return (
                <div className="mb-3">
                    <img
                        src={normalizedUrl}
                        alt={t('merchant.profile.attachmentPreviewAlt', { label })}
                        className="img-fluid rounded border"
                        style={{ maxHeight: '140px', objectFit: 'cover' }}
                    />
                </div>
            );
        }

        return (
            <div className="mb-3">
                <a
                    href={normalizedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary text-decoration-underline"
                >
                    {t('merchant.profile.viewCurrentFile')}
                </a>
            </div>
        );
    };

    const handleAttachmentSubmit = async (e) => {
        e.preventDefault();
        setAttachmentErrors({});

        const filesToSubmit = {};
        let hasFile = false;

        ATTACHMENT_FIELD_KEYS.forEach((key) => {
            const file = attachmentFiles[key];
            if (file instanceof File) {
                filesToSubmit[key] = file;
                hasFile = true;
            }
        });

        if (!hasFile) {
            toast.warn(t('merchant.profile.pleaseSelectOneDocument'));
            return;
        }

        try {
            setAttachmentSubmitting(true);
            const response = await updateMerchantAttachments(filesToSubmit);
            const message = response?.message || t('merchant.profile.toastAttachmentsSuccess');

            toast.success(message);
            resetAttachmentForm();

            if (onSuccess) {
                onSuccess(response?.data);
            }
        } catch (error) {
            console.error('Failed to update attachments:', error);
            if (error.response?.data?.errors) {
                setAttachmentErrors(error.response.data.errors);
                toast.error(t('merchant.profile.toastFixAttachmentErrors'));
            } else {
                const errorMsg = error.response?.data?.message || t('merchant.profile.toastAttachmentUpdateFailed');
                toast.error(errorMsg);
            }
        } finally {
            setAttachmentSubmitting(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setErrors({});

        try {
            const response = await updateMerchantProfile(formData);
            const isSuccess = response?.success === true || response?.status === true;

            if (isSuccess) {
                toast.success(response?.message || t('merchant.profile.toastProfileSuccess'));
                if (onSuccess) onSuccess(response?.data);
            }
        } catch (error) {
            console.error('Failed to update profile:', error);
            
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
                toast.error(t('merchant.profile.toastFixFormErrors'));
            } else {
                const errorMsg = error.response?.data?.message || t('merchant.profile.toastProfileUpdateFailedRetry');
                toast.error(errorMsg);
            }
        } finally {
            setSubmitting(false);
        }
    };

    const hasSelectedAttachments = ATTACHMENT_FIELD_KEYS.some((key) => attachmentFiles[key] instanceof File);

    return (
        <div className="row">
            <div className="col-lg-12">
                <div className="card mb-5 mb-xl-10">
                    <div className="card-header border-0 cursor-pointer">
                        <div className="card-title m-0">
                            <h3 className="fw-bolder m-0">{t('merchant.profile.editMerchantProfile')}</h3>
                        </div>
                        <div className="card-toolbar">
                            <button
                                type="button"
                                onClick={onCancel}
                                className="btn btn-sm btn-light me-2"
                                disabled={submitting}
                            >
                                <i className="ki-duotone ki-cross fs-2">
                                    <span className="path1"></span>
                                    <span className="path2"></span>
                                </i>
                                {t('merchant.profile.cancel')}
                            </button>
                        </div>
                    </div>

                    <div className="card-body border-top p-9">
                        {merchant?.status === 'requesting_updated' && (
                            <div className="alert alert-warning d-flex align-items-center p-5 mb-10">
                                <i className="ki-duotone ki-information-5 fs-2hx text-warning me-4">
                                    <span className="path1"></span>
                                    <span className="path2"></span>
                                    <span className="path3"></span>
                                </i>
                                <div className="d-flex flex-column">
                                    <h4 className="mb-1 text-warning">{t('merchant.profile.changeRequestPending')}</h4>
                                    <span>{t('merchant.profile.changeRequestPendingSubmitNote')}</span>
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div className="row mb-6">
                                <label className="col-lg-3 col-form-label required fw-bold fs-6">{t('merchant.profile.fieldBusinessName')}</label>
                                <div className="col-lg-9 fv-row">
                                    <input
                                        type="text"
                                        name="name"
                                        className={`form-control form-control-lg form-control-solid ${errors.name ? 'is-invalid' : ''}`}
                                        placeholder={t('merchant.profile.placeholderBusinessName')}
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        required
                                    />
                                    {errors.name && (
                                        <div className="invalid-feedback">{errors.name[0]}</div>
                                    )}
                                </div>
                            </div>

                            <div className="row mb-6">
                                <label className="col-lg-3 col-form-label required fw-bold fs-6">{t('merchant.profile.fieldOwnerName')}</label>
                                <div className="col-lg-9 fv-row">
                                    <input
                                        type="text"
                                        name="owner_name"
                                        className={`form-control form-control-lg form-control-solid ${errors.owner_name ? 'is-invalid' : ''}`}
                                        placeholder={t('merchant.profile.placeholderOwnerName')}
                                        value={formData.owner_name}
                                        onChange={handleInputChange}
                                        required
                                    />
                                    {errors.owner_name && (
                                        <div className="invalid-feedback">{errors.owner_name[0]}</div>
                                    )}
                                </div>
                            </div>

                            <div className="row mb-6">
                                <label className="col-lg-3 col-form-label required fw-bold fs-6">{t('merchant.profile.fieldEmailShort')}</label>
                                <div className="col-lg-9 fv-row">
                                    <input
                                        type="email"
                                        name="email"
                                        className={`form-control form-control-lg form-control-solid ${errors.email ? 'is-invalid' : ''}`}
                                        placeholder={t('merchant.profile.placeholderEmailShort')}
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        required
                                    />
                                    {errors.email && (
                                        <div className="invalid-feedback">{errors.email[0]}</div>
                                    )}
                                </div>
                            </div>

                            <div className="row mb-6">
                                <label className="col-lg-3 col-form-label required fw-bold fs-6">{t('merchant.profile.fieldPhoneShort')}</label>
                                <div className="col-lg-9 fv-row">
                                    <input
                                        type="text"
                                        name="phone"
                                        className={`form-control form-control-lg form-control-solid ${errors.phone ? 'is-invalid' : ''}`}
                                        placeholder={t('merchant.profile.placeholderPhoneShort')}
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        required
                                    />
                                    {errors.phone && (
                                        <div className="invalid-feedback">{errors.phone[0]}</div>
                                    )}
                                </div>
                            </div>

                            <div className="row mb-6">
                                <label className="col-lg-3 col-form-label required fw-bold fs-6">{t('merchant.profile.fieldBusinessType')}</label>
                                <div className="col-lg-9 fv-row">
                                    <select
                                        name="business_type"
                                        className={`form-select form-select-solid form-select-lg ${errors.business_type ? 'is-invalid' : ''}`}
                                        value={formData.business_type}
                                        onChange={handleInputChange}
                                        required
                                        disabled={loading.businessTypes}
                                    >
                                        <option value="">{loading.businessTypes ? t('merchant.profile.loading') : t('merchant.profile.selectBusinessType')}</option>
                                        {businessTypes.map(type => (
                                            <option key={type.id} value={type.value}>
                                                {type.text}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.business_type && (
                                        <div className="invalid-feedback">{errors.business_type[0]}</div>
                                    )}
                                </div>
                            </div>

                            <div className="row mb-6">
                                <label className="col-lg-3 col-form-label required fw-bold fs-6">{t('merchant.profile.fieldAddress')}</label>
                                <div className="col-lg-9 fv-row">
                                    <textarea
                                        name="address"
                                        className={`form-control form-control-lg form-control-solid ${errors.address ? 'is-invalid' : ''}`}
                                        rows="3"
                                        placeholder={t('merchant.profile.placeholderAddress')}
                                        value={formData.address}
                                        onChange={handleInputChange}
                                        required
                                    ></textarea>
                                    {errors.address && (
                                        <div className="invalid-feedback">{errors.address[0]}</div>
                                    )}
                                </div>
                            </div>

                            <div className="row mb-6">
                                <label className="col-lg-3 col-form-label fw-bold fs-6">{t('merchant.profile.fieldTradeLicenseNumber')}</label>
                                <div className="col-lg-9 fv-row">
                                    <input
                                        type="text"
                                        name="trade_license_number"
                                        className={`form-control form-control-lg form-control-solid ${errors.trade_license_number ? 'is-invalid' : ''}`}
                                        placeholder={t('merchant.profile.placeholderTradeLicense')}
                                        value={formData.trade_license_number}
                                        onChange={handleInputChange}
                                    />
                                    {errors.trade_license_number && (
                                        <div className="invalid-feedback">{errors.trade_license_number[0]}</div>
                                    )}
                                </div>
                            </div>

                            <div className="row mb-6">
                                <label className="col-lg-3 col-form-label fw-bold fs-6">{t('merchant.profile.fieldTaxNumber')}</label>
                                <div className="col-lg-9 fv-row">
                                    <input
                                        type="text"
                                        name="tax_certified_number"
                                        className={`form-control form-control-lg form-control-solid ${errors.tax_certified_number ? 'is-invalid' : ''}`}
                                        placeholder={t('merchant.profile.placeholderTaxNumberShort')}
                                        value={formData.tax_certified_number}
                                        onChange={handleInputChange}
                                    />
                                    {errors.tax_certified_number && (
                                        <div className="invalid-feedback">{errors.tax_certified_number[0]}</div>
                                    )}
                                </div>
                            </div>

                            {/* Country Dropdown */}
                            <div className="row mb-6">
                                <label className="col-lg-3 col-form-label fw-bold fs-6">{t('merchant.profile.fieldCountry')}</label>
                                <div className="col-lg-9 fv-row">
                                    <div className="position-relative">
                                        <div 
                                            className={`form-control form-control-lg form-control-solid d-flex align-items-center justify-content-between cursor-pointer ${errors.country_id ? 'is-invalid' : ''}`}
                                            onClick={handleCountryDropdownToggle}
                                            style={{ cursor: 'pointer', minHeight: '50px' }}
                                        >
                                            <div className="d-flex align-items-center">
                                                {selectedCountry ? (
                                                    <>
                                                        <img 
                                                            src={`/flags/${selectedCountry.code?.toLowerCase() || 'placeholder'}.png`} 
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
                                                    <span className="text-muted">{t('merchant.profile.selectCountry')}</span>
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
                                        
                                        {/* Country Dropdown List */}
                                        {showCountryList && (
                                            <div className="position-absolute top-100 start-0 w-100 bg-white border rounded-3 shadow-sm mt-1" style={{ zIndex: 1000, maxHeight: '300px', overflowY: 'auto' }}>
                                                <div className="p-2">
                                                    <input 
                                                        type="text" 
                                                        className="form-control form-control-sm mb-2" 
                                                        placeholder={t('merchant.profile.searchCountries')}
                                                        value={countrySearchTerm}
                                                        onChange={(e) => handleCountrySearch(e.target.value)}
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                </div>
                                                {loading.countries ? (
                                                    <div className="p-3 text-center">
                                                        <div className="spinner-border spinner-border-sm me-2" role="status">
                                                            <span className="visually-hidden">{t('merchant.profile.loading')}</span>
                                                        </div>
                                                        <span className="text-muted">{t('merchant.profile.loading')}</span>
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
                                                                src={`/flags/${country.code?.toLowerCase() || 'placeholder'}.png`} 
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
                                                    <div className="p-3 text-muted text-center">{t('merchant.profile.noCountriesFound')}</div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    {errors.country_id && (
                                        <div className="invalid-feedback d-block">{errors.country_id[0]}</div>
                                    )}
                                </div>
                            </div>

                            {/* City Dropdown */}
                            <div className="row mb-6">
                                <label className="col-lg-3 col-form-label fw-bold fs-6">{t('merchant.profile.fieldCity')}</label>
                                <div className="col-lg-9 fv-row">
                                    <div className="position-relative">
                                        <div 
                                            className={`form-control form-control-lg form-control-solid d-flex align-items-center justify-content-between cursor-pointer ${errors.city_id ? 'is-invalid' : ''}`}
                                            onClick={() => {
                                                if (selectedCountry || formData.country_id) {
                                                    setShowCityList(!showCityList);
                                                }
                                            }}
                                            style={{ 
                                                cursor: (selectedCountry || formData.country_id) ? 'pointer' : 'not-allowed',
                                                opacity: (selectedCountry || formData.country_id) ? 1 : 0.6,
                                                minHeight: '50px'
                                            }}
                                        >
                                            <div className="d-flex align-items-center">
                                                {selectedCity ? (
                                                    <span className="fw-bold text-gray-800">{selectedCity.text}</span>
                                                ) : (
                                                    <span className="text-muted">
                                                        {!(selectedCountry || formData.country_id) ? t('merchant.profile.selectCountryFirst') : t('merchant.profile.selectCity')}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="d-flex align-items-center">
                                                {selectedCity && (
                                                    <button 
                                                        type="button"
                                                        className="btn btn-icon btn-sm btn-light-danger me-2"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleRemoveCity();
                                                        }}
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
                                        
                                        {/* City Dropdown List */}
                                        {showCityList && (selectedCountry || formData.country_id) && (
                                            <div className="position-absolute top-100 start-0 w-100 bg-white border rounded-3 shadow-sm mt-1" style={{ zIndex: 1000, maxHeight: '300px', overflowY: 'auto' }}>
                                                <div className="p-2">
                                                    <input 
                                                        type="text" 
                                                        className="form-control form-control-sm mb-2" 
                                                        placeholder={t('merchant.profile.searchCities')}
                                                        value={citySearchTerm}
                                                        onChange={(e) => handleCitySearch(e.target.value)}
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                </div>
                                                {filteredCities.length > 0 ? (
                                                    filteredCities.map((city) => (
                                                        <div 
                                                            key={city.id}
                                                            className="p-3 border-bottom cursor-pointer hover-bg-light d-flex align-items-center"
                                                            onMouseDown={(e) => {
                                                                e.preventDefault();
                                                                handleCitySelect(city);
                                                            }}
                                                            style={{ cursor: 'pointer' }}
                                                        >
                                                            <div className="fw-bold text-gray-800">{city.text}</div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="p-3 text-muted text-center">{t('merchant.profile.noCitiesFound')}</div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    {errors.city_id && (
                                        <div className="invalid-feedback d-block">{errors.city_id[0]}</div>
                                    )}
                                </div>
                            </div>

                            <div className="card-footer d-flex justify-content-end py-6 px-9">
                                <button
                                    type="button"
                                    onClick={onCancel}
                                    className="btn btn-light btn-active-light-primary me-2"
                                    disabled={submitting}
                                >
                                    {t('merchant.profile.cancel')}
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={submitting}
                                >
                                    {submitting ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                            {t('merchant.profile.submitting')}
                                        </>
                                    ) : (
                                        t('merchant.profile.submitChanges')
                                    )}
                                </button>
                            </div>
                        </form>
                </div>
            </div>
        </div>

        <div className="col-lg-12">
            <div className="card mb-5 mb-xl-10">
                <div className="card-header border-0">
                    <div className="card-title">
                        <h3 className="fw-bolder m-0">{t('merchant.profile.merchantAttachments')}</h3>
                    </div>
                </div>
                <div className="card-body border-top p-9">
                    <form onSubmit={handleAttachmentSubmit}>
                        <div className="row">
                            {ATTACHMENT_FIELD_KEYS.map((key) => (
                                <div key={key} className="col-lg-6 mb-6">
                                    <label className="form-label fw-bold fs-6">{t(`merchant.profile.attachments.${key}`)}</label>
                                    {renderExistingAttachment(key)}
                                    <input
                                        key={attachmentInputKeys[key]}
                                        type="file"
                                        accept="image/*"
                                        className={`form-control form-control-lg form-control-solid ${attachmentErrors[key] ? 'is-invalid' : ''}`}
                                        onChange={(e) => handleAttachmentChange(key, e.target.files?.[0] || null)}
                                        disabled={attachmentSubmitting}
                                    />
                                    {attachmentPreviews[key] && (
                                        <div className="form-text">{t('merchant.profile.selectedFile')} {attachmentPreviews[key]}</div>
                                    )}
                                    {attachmentErrors[key] && (
                                        <div className="invalid-feedback d-block">
                                            {Array.isArray(attachmentErrors[key]) ? attachmentErrors[key][0] : attachmentErrors[key]}
                                        </div>
                                    )}
                                    {attachmentFiles[key] && (
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-light-danger mt-3"
                                            onClick={() => handleAttachmentClear(key)}
                                            disabled={attachmentSubmitting}
                                        >
                                            {t('merchant.profile.removeSelection')}
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="card-footer d-flex justify-content-end px-0">
                            <button
                                type="button"
                                className="btn btn-light btn-active-light-primary me-2"
                                onClick={resetAttachmentForm}
                                disabled={attachmentSubmitting}
                            >
                                {t('merchant.profile.reset')}
                            </button>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={attachmentSubmitting || !hasSelectedAttachments}
                            >
                                {attachmentSubmitting ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                        {t('merchant.profile.uploading')}
                                    </>
                                ) : (
                                    t('merchant.profile.updateAttachments')
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
    );
};

export default EditMerchantProfile;


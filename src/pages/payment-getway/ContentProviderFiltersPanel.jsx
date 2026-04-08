import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import axios from '../../utils/axiosConfig';
import { ADMIN_ENDPOINTS, AUTH_ENDPOINTS } from '../../utils/constants';
import { getToken } from '../../utils/api';
import SearchableDropdown from '../../common/filters/SearchableDropdown';

const emptyDraft = () => ({
    country_id: '',
    partner_category_id: '',
    date_from: '',
    date_to: '',
});

const ContentProviderFiltersPanel = ({ isVisible, appliedFilters, onApply, onClearFilters }) => {
    const [draft, setDraft] = useState(emptyDraft);

    const [filteredCountries, setFilteredCountries] = useState([]);
    const [countrySearchTerm, setCountrySearchTerm] = useState('');
    const [loadingCountries, setLoadingCountries] = useState(false);
    const [countriesEnabled, setCountriesEnabled] = useState(false);

    const [partnerCategories, setPartnerCategories] = useState([]);
    const [loadingPartnerCategories, setLoadingPartnerCategories] = useState(false);
    const [partnerCategoriesEnabled, setPartnerCategoriesEnabled] = useState(false);
    const [partnerCategorySearchTerm, setPartnerCategorySearchTerm] = useState('');

    const prevVisibleRef = useRef(false);
    useEffect(() => {
        if (isVisible && !prevVisibleRef.current) {
            setDraft({
                country_id: appliedFilters?.country_id || '',
                partner_category_id: appliedFilters?.partner_category_id || '',
                date_from: appliedFilters?.date_from || '',
                date_to: appliedFilters?.date_to || '',
            });
        }
        prevVisibleRef.current = isVisible;
    }, [isVisible, appliedFilters]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setDraft((prev) => ({ ...prev, [name]: value }));
    };

    const handleApplyClick = () => {
        onApply(draft);
    };

    const handleClearClick = () => {
        setDraft(emptyDraft());
        onClearFilters();
    };

    const fetchCountries = useCallback(async (searchTerm = '') => {
        try {
            setLoadingCountries(true);
            const token = getToken();
            const url = searchTerm
                ? `${AUTH_ENDPOINTS.COUNTRIES_SELECT}?search=${encodeURIComponent(searchTerm)}`
                : AUTH_ENDPOINTS.COUNTRIES_SELECT;

            const response = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.data.status) {
                setFilteredCountries(response.data.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch countries:', error);
            setFilteredCountries([]);
        } finally {
            setLoadingCountries(false);
        }
    }, []);

    useEffect(() => {
        if (!countriesEnabled) return;
        const handler = setTimeout(() => {
            fetchCountries(countrySearchTerm);
        }, 300);
        return () => clearTimeout(handler);
    }, [countriesEnabled, countrySearchTerm, fetchCountries]);

    const countryOptions = useMemo(() => {
        const allOption = { value: '', label: 'All Countries' };
        const countryList = filteredCountries.map((country) => ({
            value: country.id,
            label: country.text || country.name,
            code: country.code,
            ...country,
        }));
        return [allOption, ...countryList];
    }, [filteredCountries]);

    const selectedCountryOption = useMemo(() => {
        if (!draft.country_id) {
            return null;
        }
        return countryOptions.find((opt) => String(opt.value) === String(draft.country_id)) || null;
    }, [draft.country_id, countryOptions]);

    const handleCountrySelect = useCallback((option) => {
        if (option && option.value === '') {
            setDraft((prev) => ({ ...prev, country_id: '' }));
        } else {
            setDraft((prev) => ({ ...prev, country_id: option?.value || '' }));
        }
    }, []);

    const handleCountryClear = useCallback(() => {
        setDraft((prev) => ({ ...prev, country_id: '' }));
    }, []);

    const handleCountryOpen = useCallback(() => {
        setCountriesEnabled(true);
        if (filteredCountries.length === 0 && !loadingCountries) {
            fetchCountries('');
        }
    }, [filteredCountries.length, loadingCountries, fetchCountries]);

    const handleCountrySearchChange = useCallback((value) => {
        setCountrySearchTerm(value);
        setCountriesEnabled(true);
    }, []);

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
                setPartnerCategories(response.data.data || []);
            } else {
                setPartnerCategories([]);
            }
        } catch (error) {
            console.error('Failed to fetch partner categories:', error);
            setPartnerCategories([]);
        } finally {
            setLoadingPartnerCategories(false);
        }
    }, []);

    useEffect(() => {
        if (!partnerCategoriesEnabled) return;
        const handler = setTimeout(() => {
            fetchPartnerCategories(partnerCategorySearchTerm);
        }, 300);
        return () => clearTimeout(handler);
    }, [partnerCategoriesEnabled, partnerCategorySearchTerm, fetchPartnerCategories]);

    const partnerCategoryOptions = useMemo(() => {
        const all = { value: '', label: 'All partner categories' };
        const list = partnerCategories.map((c) => ({
            value: c.id,
            label: c.name_en || c.name_ar || c.code || c.id,
            ...c,
        }));
        return [all, ...list];
    }, [partnerCategories]);

    const selectedPartnerCategoryOption = useMemo(() => {
        if (!draft.partner_category_id) return null;
        return (
            partnerCategoryOptions.find((opt) => String(opt.value) === String(draft.partner_category_id)) || null
        );
    }, [draft.partner_category_id, partnerCategoryOptions]);

    const handlePartnerCategorySelect = useCallback((option) => {
        if (option && option.value === '') {
            setDraft((prev) => ({ ...prev, partner_category_id: '' }));
        } else {
            setDraft((prev) => ({ ...prev, partner_category_id: option?.value || '' }));
        }
    }, []);

    const handlePartnerCategoryClear = useCallback(() => {
        setDraft((prev) => ({ ...prev, partner_category_id: '' }));
    }, []);

    const handlePartnerCategoryOpen = useCallback(() => {
        setPartnerCategoriesEnabled(true);
        if (partnerCategories.length === 0 && !loadingPartnerCategories) {
            fetchPartnerCategories('');
        }
    }, [partnerCategories.length, loadingPartnerCategories, fetchPartnerCategories]);

    const handlePartnerCategorySearchChange = useCallback((value) => {
        setPartnerCategorySearchTerm(value);
        setPartnerCategoriesEnabled(true);
    }, []);

    const renderCountrySelected = (option) => {
        if (!option) {
            return <span className="text-muted">All Countries</span>;
        }
        const code = option?.code;
        return (
            <div className="d-flex align-items-center">
                {code && (
                    <img
                        src={`/flags/${String(code).toLowerCase() || 'placeholder'}.png`}
                        alt={option.label}
                        className="me-2"
                        style={{ width: '20px', height: '15px', objectFit: 'cover' }}
                        onError={(e) => {
                            e.target.style.display = 'none';
                        }}
                    />
                )}
                <span>{option.label}</span>
            </div>
        );
    };

    const renderCountryOption = (option) => {
        if (option.value === '') {
            return <div className="text-gray-800 fw-bold">All Countries</div>;
        }
        const code = option?.code;
        return (
            <div className="d-flex align-items-center">
                {code && (
                    <img
                        src={`/flags/${String(code).toLowerCase() || 'placeholder'}.png`}
                        alt={option.label}
                        className="me-3"
                        style={{ width: '20px', height: '15px', objectFit: 'cover' }}
                        onError={(e) => {
                            e.target.style.display = 'none';
                        }}
                    />
                )}
                <div className="text-gray-800">{option.label}</div>
            </div>
        );
    };

    if (!isVisible) return null;

    return (
        <div className="card bg-white card-xl-stretch mb-5 mb-xl-8">
            <div className="card-header border-0 pt-6">
                <div className="card-title">
                    <h3 className="fw-bold m-0">Filters</h3>
                </div>
                <div className="card-toolbar d-flex flex-wrap align-items-center gap-2">
                    <button type="button" className="btn btn-sm btn-primary" onClick={handleApplyClick}>
                        <i className="ki-duotone ki-filter fs-2">
                            <span className="path1"></span>
                            <span className="path2"></span>
                        </i>
                        Apply filters
                    </button>
                    <button type="button" className="btn btn-sm btn-light-primary" onClick={handleClearClick}>
                        <i className="ki-duotone ki-refresh fs-2">
                            <span className="path1"></span>
                            <span className="path2"></span>
                        </i>
                        Clear filters
                    </button>
                </div>
            </div>

            <div className="card-body">
                <div className="row g-4">
                    <div className="col-xl-3 col-md-6">
                        <SearchableDropdown
                            label="Partner category"
                            placeholder="All categories"
                            options={partnerCategoryOptions}
                            selected={selectedPartnerCategoryOption}
                            onSelect={handlePartnerCategorySelect}
                            onClear={handlePartnerCategoryClear}
                            loading={loadingPartnerCategories}
                            onOpen={handlePartnerCategoryOpen}
                            onSearchChange={handlePartnerCategorySearchChange}
                            searchPlaceholder="Search categories..."
                        />
                    </div>

                    <div className="col-xl-3 col-md-6">
                        <SearchableDropdown
                            label="Country"
                            placeholder="All Countries"
                            options={countryOptions}
                            selected={selectedCountryOption}
                            onSelect={handleCountrySelect}
                            onClear={handleCountryClear}
                            loading={loadingCountries}
                            onOpen={handleCountryOpen}
                            onSearchChange={handleCountrySearchChange}
                            searchPlaceholder="Search countries..."
                            renderSelected={renderCountrySelected}
                            renderOption={renderCountryOption}
                        />
                    </div>

                    <div className="col-xl-3 col-md-6">
                        <label className="form-label fw-bold">Created from (date and time)</label>
                        <input
                            type="datetime-local"
                            className="form-control"
                            name="date_from"
                            value={draft.date_from || ''}
                            onChange={handleInputChange}
                        />
                    </div>

                    <div className="col-xl-3 col-md-6">
                        <label className="form-label fw-bold">Created to (date and time)</label>
                        <input
                            type="datetime-local"
                            className="form-control"
                            name="date_to"
                            value={draft.date_to || ''}
                            onChange={handleInputChange}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContentProviderFiltersPanel;

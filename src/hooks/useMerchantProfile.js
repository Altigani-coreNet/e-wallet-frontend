import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { AUTH_ENDPOINTS } from '../utils/constants';
import { get } from '../utils/api';

const debounce = (fn, delay) => {
    let id;
    return (...args) => {
        clearTimeout(id);
        id = setTimeout(() => fn(...args), delay);
    };
};

const useMerchantProfile = ({ formData, setFormData }) => {
    const { t } = useTranslation();

    const [countries, setCountries]               = useState([]);
    const [filteredCountries, setFilteredCountries] = useState([]);
    const [cities, setCities]                     = useState([]);
    const [filteredCities, setFilteredCities]     = useState([]);
    const [businessTypes, setBusinessTypes]       = useState([]);
    const [countrySearchTerm, setCountrySearchTerm] = useState('');
    const [citySearchTerm, setCitySearchTerm]     = useState('');
    const [showCountryList, setShowCountryList]   = useState(false);
    const [showCityList, setShowCityList]         = useState(false);
    const [selectedCountry, setSelectedCountry]   = useState(null);
    const [selectedCity, setSelectedCity]         = useState(null);
    const [loading, setLoading]                   = useState({
        countries: false, cities: false, businessTypes: false, terms: false,
    });
    const [showTermsModal, setShowTermsModal]     = useState(false);
    const [termsContent, setTermsContent]         = useState('');

    const startDateRef   = useRef(null);
    const expiredDateRef = useRef(null);
    const prevCountryRef = useRef(null);

    // ─── Fetch helpers ────────────────────────────────────────────────────

    const fetchCountries = async (searchTerm = '') => {
        setLoading(prev => ({ ...prev, countries: true }));
        try {
            const url = searchTerm
                ? `${AUTH_ENDPOINTS.COUNTRIES_SELECT}?search=${encodeURIComponent(searchTerm)}`
                : AUTH_ENDPOINTS.COUNTRIES_SELECT;
            const { data } = await get(url);
            if (data.status) {
                setCountries(data.data);
                setFilteredCountries(data.data);
            }
        } catch (e) {
            console.error('Error fetching countries:', e);
        } finally {
            setLoading(prev => ({ ...prev, countries: false }));
        }
    };

    const fetchCities = async (countryId) => {
        if (!countryId) { setCities([]); setFilteredCities([]); return; }
        setLoading(prev => ({ ...prev, cities: true }));
        try {
            const { data } = await get(
                `${AUTH_ENDPOINTS.CITIES_SELECT}?country_id=${encodeURIComponent(countryId)}`,
            );
            if (data.status) {
                setCities(data.data);
                setFilteredCities(data.data);
            }
        } catch (e) {
            console.error('Error fetching cities:', e);
        } finally {
            setLoading(prev => ({ ...prev, cities: false }));
        }
    };

    const fetchBusinessTypes = async () => {
        setLoading(prev => ({ ...prev, businessTypes: true }));
        try {
            const { data } = await get(AUTH_ENDPOINTS.BUSINESS_TYPES_SELECT);
            if (data.status) setBusinessTypes(data.data);
        } catch (e) {
            console.error('Error fetching business types:', e);
        } finally {
            setLoading(prev => ({ ...prev, businessTypes: false }));
        }
    };

    const fetchTermsContent = async () => {
        setLoading(prev => ({ ...prev, terms: true }));
        try {
            const { data } = await get(AUTH_ENDPOINTS.CONTRACT_TERMS);
            setTermsContent(
                data.success && data.data?.terms
                    ? data.data.terms
                    : t('auth.merchantProfile.termsUnavailable')
            );
        } catch {
            setTermsContent(t('auth.merchantProfile.termsUnavailable'));
        } finally {
            setLoading(prev => ({ ...prev, terms: false }));
        }
    };

    // ─── Debounced searches ────────────────────────────────────────────────

    const debouncedCountrySearch = useCallback(
        debounce((term) => fetchCountries(term.length >= 1 ? term : ''), 500),
        []
    );

    const debouncedCitySearch = useCallback(
        debounce((term) => {
            setFilteredCities(
                term.length >= 1
                    ? cities.filter(c => c.text.toLowerCase().includes(term.toLowerCase()))
                    : cities
            );
        }, 300),
        [cities]
    );

    // ─── Country handlers ─────────────────────────────────────────────────

    const handleCountrySearch = (term) => {
        setCountrySearchTerm(term);
        debouncedCountrySearch(term);
        setShowCountryList(true);
    };

    const handleCountryDropdownToggle = () => {
        if (!showCountryList) { setCountrySearchTerm(''); fetchCountries(); }
        setShowCountryList(v => !v);
    };

    const handleCountrySelect = (country) => {
        const countryId = String(country.id);
        setSelectedCountry(country);
        setCountrySearchTerm(country.text);
        prevCountryRef.current = countryId;
        setFormData('country', countryId);
        setFormData('city', '');
        setShowCountryList(false);
        setSelectedCity(null);
        setCitySearchTerm('');
        fetchCities(countryId);
    };

    const handleRemoveCountry = () => {
        setSelectedCountry(null);
        setCountrySearchTerm('');
        setFormData('country', '');
        setFormData('city', '');
        setShowCountryList(false);
        setCities([]);
    };

    // ─── City handlers ────────────────────────────────────────────────────

    const handleCitySearch = (term) => {
        setCitySearchTerm(term);
        debouncedCitySearch(term);
        setShowCityList(true);
    };

    const handleCitySelect = (city) => {
        setSelectedCity(city);
        setCitySearchTerm(city.text);
        setFormData('city', String(city.id));
        setShowCityList(false);
    };

    const handleRemoveCity = () => {
        setSelectedCity(null);
        setCitySearchTerm('');
        setFormData('city', '');
        setShowCityList(false);
    };

    // ─── Generic field change ─────────────────────────────────────────────

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(name, value);
    };

    // ─── Terms handlers ───────────────────────────────────────────────────

    const handleTermsClick = (e) => {
        e.preventDefault();
        setShowTermsModal(true);
        if (!termsContent) fetchTermsContent();
    };

    const handleTermsAgree = () => {
        setFormData('accept_terms', true);
        setShowTermsModal(false);
    };

    const handleTermsModalClose = () => setShowTermsModal(false);

    // ─── Date click ───────────────────────────────────────────────────────

    const handleDateClick = (e, dateRef) => {
        e.preventDefault();
        if (!dateRef.current) return;
        dateRef.current.focus();
        try { dateRef.current.showPicker?.(); } catch { dateRef.current.click(); }
    };

    // ─── Effects ──────────────────────────────────────────────────────────

    useEffect(() => {
        fetchCountries();
        fetchBusinessTypes();
    }, []);

    useEffect(() => {
        if (!formData.country) {
            prevCountryRef.current = null;
            setCities([]);
            setFilteredCities([]);
            setSelectedCity(null);
            setCitySearchTerm('');
            return;
        }

        const countryId = String(formData.country);
        if (prevCountryRef.current !== null && prevCountryRef.current !== countryId) {
            setSelectedCity(null);
            setCitySearchTerm('');
            setFormData('city', '');
        }
        prevCountryRef.current = countryId;
        fetchCities(countryId);
    }, [formData.country]);

    useEffect(() => {
        if (!formData.country || countries.length === 0) return;
        const country = countries.find((c) => String(c.id) === String(formData.country));
        if (country) {
            setSelectedCountry(country);
            setCountrySearchTerm(country.text);
        }
    }, [formData.country, countries]);

    useEffect(() => {
        if (!formData.city || cities.length === 0) return;
        const city = cities.find((c) => String(c.id) === String(formData.city));
        if (city) {
            setSelectedCity(city);
            setCitySearchTerm(city.text);
        }
    }, [formData.city, cities]);

    return {
        // state
        countries, filteredCountries,
        cities, filteredCities,
        businessTypes,
        countrySearchTerm, citySearchTerm,
        showCountryList, setShowCountryList,
        showCityList, setShowCityList,
        selectedCountry, selectedCity,
        loading,
        showTermsModal, termsContent,
        // refs
        startDateRef, expiredDateRef,
        // handlers
        handleChange,
        handleCountrySearch, handleCountryDropdownToggle,
        handleCountrySelect, handleRemoveCountry,
        handleCitySearch, handleCitySelect, handleRemoveCity,
        handleTermsClick, handleTermsAgree, handleTermsModalClose,
        handleDateClick,
    };
};

export default useMerchantProfile;

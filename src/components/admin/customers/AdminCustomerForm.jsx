import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { AUTH_ENDPOINTS } from '../../../utils/constants';
import { getToken } from '../../../utils/api';
import { findSudanCountry, sortCountriesSudanFirst } from '../../../utils/customerUtils';
import axios from 'axios';

const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
};

const AdminCustomerForm = ({ customer, onSubmit, loading, errors = {} }) => {
    const { t } = useTranslation();
    const isEditing = Boolean(customer);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        country_id: '',
        city_id: '',
        status: 'pending',
    });

    const [profileImageFile, setProfileImageFile] = useState(null);
    const [profileImagePreview, setProfileImagePreview] = useState(null);
    const [existingProfileUrl, setExistingProfileUrl] = useState(null);

    const [filteredCountries, setFilteredCountries] = useState([]);
    const [filteredCities, setFilteredCities] = useState([]);
    const [countrySearchTerm, setCountrySearchTerm] = useState('');
    const [citySearchTerm, setCitySearchTerm] = useState('');
    const [showCountryList, setShowCountryList] = useState(false);
    const [showCityList, setShowCityList] = useState(false);
    const [selectedCountry, setSelectedCountry] = useState(null);
    const [selectedCity, setSelectedCity] = useState(null);
    const [loadingCountries, setLoadingCountries] = useState(false);
    const [defaultCountryApplied, setDefaultCountryApplied] = useState(false);

    useEffect(() => {
        if (customer) {
            setFormData({
                name: customer.name || '',
                email: customer.email || '',
                phone: customer.phone || customer.phone_number || '',
                address: customer.address || '',
                country_id: customer.country_id || '',
                city_id: customer.city_id || '',
                status: customer.status || 'pending',
            });

            const imageUrl = customer.profile_image_url || customer.profile_image;
            setExistingProfileUrl(imageUrl || null);

            if (customer.country_id && customer.country) {
                setSelectedCountry(customer.country);
            }

            if (customer.city_id && customer.city && typeof customer.city === 'object') {
                setSelectedCity(customer.city);
            }
        }
    }, [customer]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            const countryDropdown = event.target.closest('[data-country-dropdown]');
            const cityDropdown = event.target.closest('[data-city-dropdown]');
            if (showCountryList && !countryDropdown) {
                setShowCountryList(false);
            }
            if (showCityList && !cityDropdown) {
                setShowCityList(false);
            }
        };

        if (showCountryList || showCityList) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [showCountryList, showCityList]);

    const fetchCountries = async (searchTerm = '') => {
        setLoadingCountries(true);
        try {
            const token = getToken();
            const url = searchTerm
                ? `${AUTH_ENDPOINTS.COUNTRIES_SELECT}?search=${encodeURIComponent(searchTerm)}`
                : AUTH_ENDPOINTS.COUNTRIES_SELECT;

            const response = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.data.status) {
                const countries = sortCountriesSudanFirst(response.data.data || []);
                setFilteredCountries(countries);

                if (!isEditing && !defaultCountryApplied && !searchTerm) {
                    const sudan = findSudanCountry(countries);
                    if (sudan) {
                        setSelectedCountry(sudan);
                        setFormData((prev) => ({ ...prev, country_id: sudan.id, city_id: '' }));
                        setSelectedCity(null);
                        setCitySearchTerm('');
                        fetchCities(sudan.id);
                        setDefaultCountryApplied(true);
                    }
                }
            }
        } catch (error) {
            console.error('Failed to fetch countries:', error);
        } finally {
            setLoadingCountries(false);
        }
    };

    const fetchCities = async (countryId, searchTerm = '') => {
        if (!countryId) {
            setFilteredCities([]);
            return;
        }

        try {
            const token = getToken();
            const params = { country_id: countryId };
            if (searchTerm) {
                params.search = searchTerm;
            }

            const response = await axios.get(AUTH_ENDPOINTS.CITIES_SELECT, {
                params,
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.data.status) {
                setFilteredCities(response.data.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch cities:', error);
        }
    };

    useEffect(() => {
        fetchCountries();
    }, []);

    useEffect(() => {
        if (customer?.country_id) {
            fetchCities(customer.country_id);
        }
    }, [customer?.country_id]);

    const debouncedCountrySearch = useCallback(
        debounce((searchTerm) => {
            fetchCountries(searchTerm.length >= 1 ? searchTerm : '');
        }, 500),
        [isEditing, defaultCountryApplied]
    );

    const debouncedCitySearch = useCallback(
        debounce((searchTerm) => {
            if (formData.country_id) {
                fetchCities(formData.country_id, searchTerm.length >= 1 ? searchTerm : '');
            }
        }, 500),
        [formData.country_id]
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
        setSelectedCountry(country);
        setShowCountryList(false);
        setCountrySearchTerm('');
        setFormData((prev) => ({ ...prev, country_id: country.id, city_id: '' }));
        setSelectedCity(null);
        setCitySearchTerm('');
        fetchCities(country.id);
    };

    const handleRemoveCountry = () => {
        setSelectedCountry(null);
        setFormData((prev) => ({ ...prev, country_id: '', city_id: '' }));
        setFilteredCities([]);
        setSelectedCity(null);
        setCitySearchTerm('');
    };

    const handleCitySearch = (searchTerm) => {
        setCitySearchTerm(searchTerm);
        debouncedCitySearch(searchTerm);
        setShowCityList(true);
    };

    const handleCityDropdownToggle = () => {
        if (!showCityList && formData.country_id) {
            setCitySearchTerm('');
            fetchCities(formData.country_id);
        }
        setShowCityList(!showCityList);
    };

    const handleCitySelect = (city) => {
        setSelectedCity(city);
        setShowCityList(false);
        setCitySearchTerm('');
        setFormData((prev) => ({ ...prev, city_id: city.id }));
    };

    const handleRemoveCity = () => {
        setSelectedCity(null);
        setFormData((prev) => ({ ...prev, city_id: '' }));
        setCitySearchTerm('');
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleProfileImageChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setProfileImageFile(file);
        setProfileImagePreview(URL.createObjectURL(file));
    };

    const handleRemoveProfileImage = () => {
        setProfileImageFile(null);
        if (profileImagePreview) {
            URL.revokeObjectURL(profileImagePreview);
        }
        setProfileImagePreview(null);
        setExistingProfileUrl(null);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const payload = new FormData();
        Object.entries(formData).forEach(([key, value]) => {
            if (value !== null && value !== undefined && value !== '') {
                payload.append(key, value);
            }
        });

        if (profileImageFile) {
            payload.append('profile_image', profileImageFile);
        }

        onSubmit(payload);
    };

    const displayImage = profileImagePreview || existingProfileUrl;

    return (
        <form onSubmit={handleSubmit}>
            <div className="row g-5">
                <div className="col-md-3 order-1 order-md-1">
                    <div className="card card-flush h-100">
                        <div className="card-header">
                            <div className="card-title">
                                <h3>{t('customers.profileImage')}</h3>
                            </div>
                        </div>
                        <div className="card-body text-center pt-0">
                            <div className="text-center mb-10" style={{ position: 'relative' }}>
                                <div className="image-input image-input-outline" style={{ position: 'relative', display: 'inline-block' }}>
                                    <div
                                        className="image-input-wrapper w-150px h-150px"
                                        style={{
                                            backgroundImage: `url('${displayImage || '/assets/media/avatars/300-1.jpg'}')`,
                                            backgroundSize: 'cover',
                                            backgroundPosition: 'center',
                                            borderRadius: '8px',
                                            margin: '0 auto',
                                            position: 'relative',
                                        }}
                                    />
                                    <input
                                        type="file"
                                        name="profile_image"
                                        accept="image/jpeg,image/png,image/jpg,image/gif"
                                        id="customer-profile-image-upload"
                                        onChange={handleProfileImageChange}
                                        style={{ display: 'none' }}
                                    />
                                    <label
                                        htmlFor="customer-profile-image-upload"
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
                            <div className="text-muted fs-7 mb-4">{t('customers.profileImageHint')}</div>
                            {displayImage && (
                                <button
                                    type="button"
                                    className="btn btn-sm btn-light-danger"
                                    onClick={handleRemoveProfileImage}
                                >
                                    {t('customers.removeProfileImage')}
                                </button>
                            )}
                            {errors.profile_image && (
                                <div className="invalid-feedback d-block mt-3">
                                    {Array.isArray(errors.profile_image) ? errors.profile_image[0] : errors.profile_image}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="col-md-9 order-2 order-md-2">
                    <div className="card card-flush">
                        <div className="card-header">
                            <div className="card-title">
                                <h3>{t('customers.basicInformation')}</h3>
                            </div>
                        </div>
                        <div className="card-body">
                            <div className="row g-4">
                                <div className="col-md-6">
                                    <label className="form-label required fw-bold fs-6">{t('customers.customerName')}</label>
                                    <input
                                        type="text"
                                        name="name"
                                        className={`form-control form-control-solid ${errors.name ? 'is-invalid' : ''}`}
                                        placeholder={t('customers.enterCustomerName')}
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                    />
                                    {errors.name && <div className="invalid-feedback d-block">{errors.name[0]}</div>}
                                </div>

                                <div className="col-md-6">
                                    <label className="form-label required fw-bold fs-6">{t('common.email')}</label>
                                    <input
                                        type="email"
                                        name="email"
                                        className={`form-control form-control-solid ${errors.email ? 'is-invalid' : ''}`}
                                        placeholder={t('customers.enterEmailAddress')}
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                    />
                                    {errors.email && <div className="invalid-feedback d-block">{errors.email[0]}</div>}
                                </div>

                                <div className="col-md-6">
                                    <label className="form-label required fw-bold fs-6">{t('customers.phoneNumber')}</label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        className={`form-control form-control-solid ${errors.phone ? 'is-invalid' : ''}`}
                                        placeholder={t('customers.enterPhoneNumber')}
                                        value={formData.phone}
                                        onChange={handleChange}
                                        required
                                    />
                                    {errors.phone && <div className="invalid-feedback d-block">{errors.phone[0]}</div>}
                                </div>

                                <div className="col-md-6">
                                    <label className="form-label fw-bold fs-6">{t('common.status')}</label>
                                    <select
                                        name="status"
                                        className="form-select form-select-solid"
                                        value={formData.status}
                                        onChange={handleChange}
                                    >
                                        <option value="pending">{t('customers.pending')}</option>
                                        <option value="active">{t('customers.active')}</option>
                                        <option value="suspended">{t('customers.suspended')}</option>
                                        <option value="inactive">{t('customers.inactive')}</option>
                                    </select>
                                </div>

                                <div className="col-12 mt-2">
                                    <h4 className="mb-2">{t('customers.addressInformation')}</h4>
                                </div>

                                <div className="col-12">
                                    <label className="form-label fw-bold fs-6">{t('customers.streetAddress')}</label>
                                    <input
                                        type="text"
                                        name="address"
                                        className="form-control form-control-solid"
                                        placeholder={t('customers.enterStreetAddress')}
                                        value={formData.address}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="col-md-6">
                                    <label className="form-label fw-bold fs-6">{t('common.country')}</label>
                                    <div className="position-relative" data-country-dropdown>
                                        <div
                                            className={`form-control form-control-solid h-50px d-flex align-items-center justify-content-between ${errors.country_id ? 'is-invalid' : ''}`}
                                            onClick={handleCountryDropdownToggle}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <div className="d-flex align-items-center">
                                                {selectedCountry ? (
                                                    <>
                                                        <img
                                                            src={`/flags/${selectedCountry.code?.toLowerCase() || 'placeholder'}.png`}
                                                            alt={selectedCountry.text || selectedCountry.name}
                                                            className="me-3"
                                                            style={{ width: '20px', height: '15px', objectFit: 'cover' }}
                                                            onError={(e) => { e.target.style.display = 'none'; }}
                                                        />
                                                        <span className="text-gray-800">{selectedCountry.text || selectedCountry.name}</span>
                                                    </>
                                                ) : (
                                                    <span className="text-muted">{t('customers.selectCountry')}</span>
                                                )}
                                            </div>
                                            <div className="d-flex align-items-center">
                                                {selectedCountry && (
                                                    <button
                                                        type="button"
                                                        className="btn btn-icon btn-sm btn-light-danger me-2"
                                                        onClick={(e) => { e.stopPropagation(); handleRemoveCountry(); }}
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

                                        {showCountryList && (
                                            <div className="position-absolute top-100 start-0 w-100 bg-white border rounded-3 shadow-sm mt-1" style={{ zIndex: 1000, maxHeight: '250px', overflowY: 'auto' }}>
                                                <div className="p-2">
                                                    <input
                                                        type="text"
                                                        className="form-control form-control-sm mb-2"
                                                        placeholder={t('customers.searchCountry')}
                                                        value={countrySearchTerm}
                                                        onChange={(e) => handleCountrySearch(e.target.value)}
                                                        onClick={(e) => e.stopPropagation()}
                                                        autoFocus
                                                    />
                                                </div>
                                                {loadingCountries ? (
                                                    <div className="p-3 text-center">
                                                        <span className="spinner-border spinner-border-sm text-primary me-2"></span>
                                                        <span className="text-muted">{t('common.loading')}</span>
                                                    </div>
                                                ) : filteredCountries.length > 0 ? (
                                                    filteredCountries.map((country) => (
                                                        <div
                                                            key={country.id}
                                                            className="p-3 border-bottom cursor-pointer hover-bg-light d-flex align-items-center"
                                                            onMouseDown={(e) => { e.preventDefault(); handleCountrySelect(country); }}
                                                            style={{ cursor: 'pointer' }}
                                                        >
                                                            <img
                                                                src={`/flags/${country.code?.toLowerCase() || 'placeholder'}.png`}
                                                                alt={country.text || country.name}
                                                                className="me-3"
                                                                style={{ width: '20px', height: '15px', objectFit: 'cover' }}
                                                                onError={(e) => { e.target.style.display = 'none'; }}
                                                            />
                                                            <div className="text-gray-800">{country.text || country.name}</div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="p-3 text-muted text-center">{t('customers.noCountriesFound')}</div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    {errors.country_id && (
                                        <div className="invalid-feedback d-block">
                                            {Array.isArray(errors.country_id) ? errors.country_id[0] : errors.country_id}
                                        </div>
                                    )}
                                </div>

                                <div className="col-md-6">
                                    <label className="form-label fw-bold fs-6">{t('customers.city')}</label>
                                    <div className="position-relative" data-city-dropdown>
                                        <div
                                            className={`form-control form-control-solid h-50px d-flex align-items-center justify-content-between ${errors.city_id ? 'is-invalid' : ''} ${!formData.country_id ? 'bg-light' : ''}`}
                                            onClick={formData.country_id ? handleCityDropdownToggle : undefined}
                                            style={{ cursor: formData.country_id ? 'pointer' : 'not-allowed' }}
                                        >
                                            <div className="d-flex align-items-center">
                                                {selectedCity ? (
                                                    <span className="text-gray-800">{selectedCity.text || selectedCity.name}</span>
                                                ) : (
                                                    <span className="text-muted">
                                                        {formData.country_id ? t('customers.selectCity') : t('customers.selectCountryFirst')}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="d-flex align-items-center">
                                                {selectedCity && (
                                                    <button
                                                        type="button"
                                                        className="btn btn-icon btn-sm btn-light-danger me-2"
                                                        onClick={(e) => { e.stopPropagation(); handleRemoveCity(); }}
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

                                        {showCityList && formData.country_id && (
                                            <div className="position-absolute top-100 start-0 w-100 bg-white border rounded-3 shadow-sm mt-1" style={{ zIndex: 1000, maxHeight: '250px', overflowY: 'auto' }}>
                                                <div className="p-2">
                                                    <input
                                                        type="text"
                                                        className="form-control form-control-sm mb-2"
                                                        placeholder={t('customers.searchCity')}
                                                        value={citySearchTerm}
                                                        onChange={(e) => handleCitySearch(e.target.value)}
                                                        onClick={(e) => e.stopPropagation()}
                                                        autoFocus
                                                    />
                                                </div>
                                                {filteredCities.length > 0 ? (
                                                    filteredCities.map((city) => (
                                                        <div
                                                            key={city.id}
                                                            className="p-3 border-bottom cursor-pointer hover-bg-light d-flex align-items-center"
                                                            onMouseDown={(e) => { e.preventDefault(); handleCitySelect(city); }}
                                                            style={{ cursor: 'pointer' }}
                                                        >
                                                            <div className="text-gray-800">{city.text || city.name}</div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="p-3 text-muted text-center">{t('customers.noCitiesFound')}</div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    {errors.city_id && (
                                        <div className="invalid-feedback d-block">
                                            {Array.isArray(errors.city_id) ? errors.city_id[0] : errors.city_id}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="card-footer d-flex justify-content-end py-6 px-9">
                            <button type="submit" className="btn btn-primary" disabled={loading}>
                                {loading ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2"></span>
                                        {t('customers.saving')}
                                    </>
                                ) : (
                                    <>
                                        <i className="ki-duotone ki-check fs-2">
                                            <span className="path1"></span>
                                            <span className="path2"></span>
                                        </i>
                                        {t('customers.saveCustomer')}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </form>
    );
};

export default AdminCustomerForm;

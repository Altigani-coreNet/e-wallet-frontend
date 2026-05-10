import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { useToolbar } from '../../../../contexts/ToolbarContext';
import { getAdmin, updateAdmin } from '../../../../services/adminAdminsService';
import { getRolesSelect } from '../../../../services/adminRolesService';
import { getCountriesSelect } from '../../../../services/adminCountriesService';

// Debounce function - moved outside component to avoid recreation on each render
const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
};

const AdminAdminEdit = () => {
    const { id } = useParams();
    const { t, i18n } = useTranslation();
    const { setTitle, setActions } = useToolbar();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [roles, setRoles] = useState([]);
    const [filteredCountries, setFilteredCountries] = useState([]);
    const [countrySearchTerm, setCountrySearchTerm] = useState('');
    const [showCountryList, setShowCountryList] = useState(false);
    const [selectedCountry, setSelectedCountry] = useState(null);
    
    // For regions multi-select
    const [filteredRegions, setFilteredRegions] = useState([]);
    const [regionSearchTerm, setRegionSearchTerm] = useState('');
    const [showRegionList, setShowRegionList] = useState(false);
    const [selectedRegions, setSelectedRegions] = useState([]);
    
    const [imagePreview, setImagePreview] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        password_confirmation: '',
        profile_image: null,
        status: 'active',
        custom_region: false,
        regions: [],
        roles: [],
        country_id: ''
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        setTitle(t('admin.adminEdit.title'));
        setActions(null);
        fetchData();
    }, [id, setTitle, setActions, t]);

    const fetchData = async () => {
        const [adminRes, rolesRes, countriesRes] = await Promise.all([
            getAdmin(id),
            getRolesSelect(),
            getCountriesSelect()
        ]);

        if (adminRes.success) {
            const adminData = adminRes.data;
            if (!adminData) {
                toast.error(t('admin.adminEdit.invalidData'));
                return;
            }
            setFormData({
                name: adminData.name || '',
                email: adminData.email || '',
                phone: adminData.phone || '',
                password: '',
                password_confirmation: '',
                profile_image: null,
                status: adminData.status || 'active',
                custom_region: adminData.custom_region || false,
                regions: adminData.regions?.map(r => r.id) || [],
                roles: adminData.roles?.map(r => r.id) || [],
                country_id: adminData.country?.id || ''
            });
            if (adminData.profile_image) {
                setImagePreview(adminData.profile_image);
            }
            if (adminData.regions && adminData.regions.length > 0) {
                setSelectedRegions(adminData.regions);
            }
            if (adminData.country) {
                setSelectedCountry(adminData.country);
                let displayText = adminData.country.name || adminData.country.text;
                try {
                    if (typeof displayText === 'object') {
                        displayText = displayText[i18n.language] || displayText.en || displayText.ar;
                    } else if (typeof displayText === 'string' && displayText.startsWith('{')) {
                        const parsed = JSON.parse(displayText);
                        displayText = parsed[i18n.language] || parsed.en || parsed.ar || displayText;
                    }
                } catch (e) {}
                setCountrySearchTerm(displayText);
            }
        }

        if (rolesRes.success) {
            // API may return array directly or nested under data.data
            const rolesList = Array.isArray(rolesRes.data) ? rolesRes.data : (rolesRes.data.data || []);
            setRoles(rolesList);
        }
        // Don't load all countries initially - will load on dropdown open or search
    };

    // Fetch countries from API with optional search term
    const fetchCountries = async (searchTerm = '', updateRegions = false) => {
        try {
            const countriesRes = await getCountriesSelect(searchTerm);
            if (countriesRes.success) {
                // API returns array directly, not nested in data.data
                const countriesList = Array.isArray(countriesRes.data) ? countriesRes.data : (countriesRes.data.data || []);
                setFilteredCountries(countriesList);
                // Update regions if requested (for region search)
                if (updateRegions) {
                    setFilteredRegions(countriesList);
                }
            }
        } catch (error) {
            console.error('Error fetching countries:', error);
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
        setShowCountryList(true);
    };

    const handleCountryDropdownToggle = () => {
        if (!showCountryList) {
            // Opening dropdown - clear search and load all countries
            setCountrySearchTerm('');
            fetchCountries();
        }
        setShowCountryList(!showCountryList);
    };

    const handleCountrySelect = (country) => {
        setSelectedCountry(country);
        let displayText = country.text || country.name;
        // text is an object: {ar: "...", en: "..."}
        if (typeof displayText === 'object' && displayText !== null) {
            displayText = displayText[i18n.language] || displayText.en || displayText.ar || '';
        } else if (typeof displayText === 'string' && displayText.startsWith('{')) {
            // Fallback for JSON string
            try {
                const parsed = JSON.parse(displayText);
                displayText = parsed[i18n.language] || parsed.en || parsed.ar || displayText;
            } catch (e) {}
        }
        setCountrySearchTerm(displayText);
        setFormData(prev => ({ ...prev, country_id: country.id }));
        setShowCountryList(false);
    };

    const handleRemoveCountry = () => {
        setSelectedCountry(null);
        setCountrySearchTerm('');
        setFormData(prev => ({ ...prev, country_id: '' }));
    };

    // Debounced region search function - uses server-side search
    const debouncedRegionSearch = useCallback(
        debounce((searchTerm) => {
            if (searchTerm.length >= 1) {
                // Use server-side search for regions
                fetchCountries(searchTerm, true);
            } else {
                // Load all countries when search is cleared
                fetchCountries('', true);
            }
        }, 500), // 500ms delay for server requests
        []
    );

    const handleRegionSearch = (searchTerm) => {
        setRegionSearchTerm(searchTerm);
        debouncedRegionSearch(searchTerm);
        setShowRegionList(true);
    };

    const handleRegionDropdownToggle = () => {
        if (!showRegionList) {
            // Opening dropdown - clear search and load all countries for regions
            setRegionSearchTerm('');
            fetchCountries('', true);
        }
        setShowRegionList(!showRegionList);
    };

    const handleRegionToggle = (country) => {
        const isSelected = selectedRegions.some(r => r.id === country.id);
        if (isSelected) {
            setSelectedRegions(prev => prev.filter(r => r.id !== country.id));
            setFormData(prev => ({ ...prev, regions: prev.regions.filter(id => id !== country.id) }));
        } else {
            setSelectedRegions(prev => [...prev, country]);
            setFormData(prev => ({ ...prev, regions: [...prev.regions, country.id] }));
        }
    };

    const handleRemoveRegion = (countryId) => {
        setSelectedRegions(prev => prev.filter(r => r.id !== countryId));
        setFormData(prev => ({ ...prev, regions: prev.regions.filter(id => id !== countryId) }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData({ ...formData, profile_image: file });
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        try {
            const submitData = { ...formData };
            if (!submitData.password) {
                delete submitData.password;
                delete submitData.password_confirmation;
            }

            const response = await updateAdmin(id, submitData);
            if (response.success) {
                toast.success(t('admin.adminEdit.success'));
                navigate('/admin/system/admins');
            } else {
                if (response.errors) setErrors(response.errors);
                toast.error(response.error || t('admin.adminEdit.failed'));
            }
        } catch (error) {
            console.error('Error updating admin:', error);
            toast.error(t('admin.adminEdit.failed'));
        } finally {
            setLoading(false);
        }
    };

    const handleRoleToggle = (roleId) => {
        setFormData(prev => ({
            ...prev,
            roles: prev.roles.includes(roleId)
                ? prev.roles.filter(id => id !== roleId)
                : [...prev.roles, roleId]
        }));
    };

    return (
        <div className="card">
            <div className="card-header">
                <h3 className="card-title">Edit Admin</h3>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="card-body">
                    <div className="row">
                        <div className="col-md-6 mb-5">
                            <label className="form-label required">Name</label>
                            <input
                                type="text"
                                className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                            {errors.name && <div className="invalid-feedback">{errors.name[0]}</div>}
                        </div>

                        <div className="col-md-6 mb-5">
                            <label className="form-label required">Email</label>
                            <input
                                type="email"
                                className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                            {errors.email && <div className="invalid-feedback">{errors.email[0]}</div>}
                        </div>

                        <div className="col-md-6 mb-5">
                            <label className="form-label">Phone</label>
                            <input
                                type="text"
                                className={`form-control ${errors.phone ? 'is-invalid' : ''}`}
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                            {errors.phone && <div className="invalid-feedback">{errors.phone[0]}</div>}
                        </div>

                        <div className="col-md-6 mb-5">
                            <label className="form-label required">Country</label>
                            <div className="position-relative">
                                <div 
                                    className={`form-control h-50px d-flex align-items-center justify-content-between ${errors.country_id ? 'is-invalid' : ''}`}
                                    onClick={handleCountryDropdownToggle}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <div className="d-flex align-items-center">
                                        {selectedCountry ? (
                                            <>
                                                <img 
                                                    src={`/flags/${selectedCountry.code?.toLowerCase() || 'placeholder'}.png`} 
                                                    alt={countrySearchTerm}
                                                    className="me-3"
                                                    style={{ width: '20px', height: '15px', objectFit: 'cover' }}
                                                    onError={(e) => { e.target.style.display = 'none'; }}
                                                />
                                                <span className="text-gray-800">{countrySearchTerm}</span>
                                            </>
                                        ) : (
                                            <span className="text-muted">{t('admin.adminCreate.selectCountry')}</span>
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
                                                placeholder={t('admin.adminCreate.searchCountries')}
                                                value={countrySearchTerm}
                                                onChange={(e) => handleCountrySearch(e.target.value)}
                                                onClick={(e) => e.stopPropagation()}
                                                autoFocus
                                            />
                                        </div>
                                        {filteredCountries.length > 0 ? (
                                            filteredCountries.map((country) => {
                                                let displayText = country.text || country.name;
                                                // text is an object: {ar: "...", en: "..."}
                                                if (typeof displayText === 'object' && displayText !== null) {
                                                    displayText = displayText[i18n.language] || displayText.en || displayText.ar || '';
                                                } else if (typeof displayText === 'string' && displayText.startsWith('{')) {
                                                    try {
                                                        const parsed = JSON.parse(displayText);
                                                        displayText = parsed[i18n.language] || parsed.en || parsed.ar || displayText;
                                                    } catch (e) {}
                                                }
                                                return (
                                                    <div 
                                                        key={country.id}
                                                        className="p-3 border-bottom cursor-pointer hover-bg-light d-flex align-items-center"
                                                        onMouseDown={(e) => { e.preventDefault(); handleCountrySelect(country); }}
                                                        style={{ cursor: 'pointer' }}
                                                    >
                                                        <img 
                                                            src={`/flags/${country.code?.toLowerCase() || 'placeholder'}.png`} 
                                                            alt={displayText}
                                                            className="me-3"
                                                            style={{ width: '20px', height: '15px', objectFit: 'cover' }}
                                                            onError={(e) => { e.target.style.display = 'none'; }}
                                                        />
                                                        <div className="text-gray-800">{displayText}</div>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="p-3 text-muted text-center">{t('admin.adminCreate.noCountries')}</div>
                                        )}
                                    </div>
                                )}
                            </div>
                            {errors.country_id && <div className="invalid-feedback d-block">{errors.country_id[0]}</div>}
                        </div>

                        <div className="col-md-6 mb-5">
                            <label className="form-label">{t('admin.adminEdit.passwordHelp')}</label>
                            <input
                                type="password"
                                className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            />
                            {errors.password && <div className="invalid-feedback">{errors.password[0]}</div>}
                        </div>

                        <div className="col-md-6 mb-5">
                            <label className="form-label">{t('admin.adminCreate.confirmPassword')}</label>
                            <input
                                type="password"
                                className={`form-control ${errors.password_confirmation ? 'is-invalid' : ''}`}
                                value={formData.password_confirmation}
                                onChange={(e) => setFormData({ ...formData, password_confirmation: e.target.value })}
                            />
                        </div>

                        <div className="col-md-6 mb-5">
                            <label className="form-label">{t('admin.adminCreate.profileImage')}</label>
                            <input
                                type="file"
                                className="form-control"
                                accept="image/*"
                                onChange={handleImageChange}
                            />
                            {imagePreview && (
                                <div className="mt-3">
                                    <img src={imagePreview} alt="Preview" className="img-thumbnail" style={{maxWidth: '200px'}} />
                                </div>
                            )}
                        </div>

                        <div className="col-md-6 mb-5">
                            <label className="form-label required">{t('admin.adminCreate.status')}</label>
                            <select
                                className="form-select"
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            >
                                <option value="active">{t('admin.common.active')}</option>
                                <option value="inactive">{t('admin.common.inactive')}</option>
                            </select>
                        </div>

                        <div className="col-md-6 mb-5">
                            <label className="form-label">{t('admin.adminCreate.customRegion')}</label>
                            <div className="form-check form-switch form-check-custom form-check-solid">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id="custom_region_toggle"
                                    checked={formData.custom_region}
                                    onChange={(e) => {
                                        if (!e.target.checked) {
                                            setFormData({ ...formData, custom_region: e.target.checked, regions: [] });
                                            setSelectedRegions([]);
                                        } else {
                                            setFormData({ ...formData, custom_region: e.target.checked });
                                        }
                                    }}
                                />
                                <label className="form-check-label ms-2" htmlFor="custom_region_toggle">
                                    {t('admin.adminCreate.enableCustomRegions')}
                                </label>
                            </div>
                        </div>

                        {formData.custom_region && (
                            <div className="col-12 mb-5">
                                <label className="form-label">{t('admin.adminCreate.regions')}</label>
                                <div className="position-relative">
                                    <div 
                                        className="form-control min-h-50px d-flex align-items-center justify-content-between"
                                        onClick={handleRegionDropdownToggle}
                                        style={{ cursor: 'pointer', minHeight: '50px' }}
                                    >
                                        <div className="d-flex align-items-center flex-wrap gap-1">
                                            {selectedRegions.length > 0 ? (
                                                selectedRegions.map((region) => {
                                                    let displayText = region.text || region.name;
                                                    // text is an object: {ar: "...", en: "..."}
                                                    if (typeof displayText === 'object' && displayText !== null) {
                                                        displayText = displayText[i18n.language] || displayText.en || displayText.ar || '';
                                                    } else if (typeof displayText === 'string' && displayText.startsWith('{')) {
                                                        // Fallback for JSON string
                                                        try {
                                                            const parsed = JSON.parse(displayText);
                                                            displayText = parsed[i18n.language] || parsed.en || parsed.ar || displayText;
                                                        } catch (e) {}
                                                    }
                                                    return (
                                                        <span key={region.id} className="badge badge-light-primary d-flex align-items-center me-1 mb-1">
                                                            {displayText}
                                                            <button 
                                                                type="button"
                                                                className="btn btn-icon btn-sm ms-1 p-0"
                                                                onClick={(e) => { e.stopPropagation(); handleRemoveRegion(region.id); }}
                                                                style={{ width: '15px', height: '15px' }}
                                                            >
                                                                <i className="ki-duotone ki-cross fs-2x">
                                                                    <span className="path1"></span>
                                                                    <span className="path2"></span>
                                                                </i>
                                                            </button>
                                                        </span>
                                                    );
                                                })
                                            ) : (
                                                <span className="text-muted">{t('admin.adminCreate.selectRegions')}</span>
                                            )}
                                        </div>
                                        <i className={`ki-duotone ki-down fs-2 ${showRegionList ? 'rotate-180' : ''}`}>
                                            <span className="path1"></span>
                                            <span className="path2"></span>
                                        </i>
                                    </div>
                                    
                                    {showRegionList && (
                                        <div className="position-absolute top-100 start-0 w-100 bg-white border rounded-3 shadow-sm mt-1" style={{ zIndex: 1000, maxHeight: '300px', overflowY: 'auto' }}>
                                            <div className="p-2">
                                                <input 
                                                    type="text" 
                                                    className="form-control form-control-sm mb-2" 
                                                    placeholder={t('admin.adminCreate.searchRegions')}
                                                    value={regionSearchTerm}
                                                    onChange={(e) => handleRegionSearch(e.target.value)}
                                                    onClick={(e) => e.stopPropagation()}
                                                    autoFocus
                                                />
                                            </div>
                                            {filteredRegions.length > 0 ? (
                                                filteredRegions.map((country) => {
                                                    let displayText = country.text || country.name;
                                                    // text is an object: {ar: "...", en: "..."}
                                                    if (typeof displayText === 'object' && displayText !== null) {
                                                        displayText = displayText[i18n.language] || displayText.en || displayText.ar || '';
                                                    } else if (typeof displayText === 'string' && displayText.startsWith('{')) {
                                                        // Fallback for JSON string
                                                        try {
                                                            const parsed = JSON.parse(displayText);
                                                            displayText = parsed[i18n.language] || parsed.en || parsed.ar || displayText;
                                                        } catch (e) {}
                                                    }
                                                    const isSelected = selectedRegions.some(r => r.id === country.id);
                                                    return (
                                                        <div 
                                                            key={country.id}
                                                            className={`p-3 border-bottom cursor-pointer d-flex align-items-center ${isSelected ? 'bg-light-primary' : 'hover-bg-light'}`}
                                                            onMouseDown={(e) => { e.preventDefault(); handleRegionToggle(country); }}
                                                            style={{ cursor: 'pointer' }}
                                                        >
                                                            <input 
                                                                type="checkbox" 
                                                                className="form-check-input me-3" 
                                                                checked={isSelected}
                                                                readOnly
                                                            />
                                                            <div className="text-gray-800">{displayText}</div>
                                                        </div>
                                                    );
                                                })
                                            ) : (
                                                <div className="p-3 text-muted text-center">{t('admin.adminCreate.noRegions')}</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="col-12 mb-5">
                            <label className="form-label">{t('admin.adminCreate.roles')}</label>
                            <div className="row">
                                {roles.map(role => (
                                    <div key={role.id} className="col-md-4 mb-2">
                                        <div className="form-check">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                id={`role-${role.id}`}
                                                checked={formData.roles.includes(role.id)}
                                                onChange={() => handleRoleToggle(role.id)}
                                            />
                                            <label className="form-check-label" htmlFor={`role-${role.id}`}>
                                                {role.text || role.name}
                                            </label>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card-footer d-flex justify-content-end gap-2">
                    <button
                        type="button"
                        className="btn btn-light"
                        onClick={() => navigate('/admin/system/admins')}
                    >
                        {t('admin.common.cancel')}
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? t('admin.adminEdit.updating') : t('admin.adminEdit.title')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AdminAdminEdit;


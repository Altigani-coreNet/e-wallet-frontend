import React from 'react';
import { useTranslation } from 'react-i18next';
import useMerchantProfile from '../../../../hooks/useMerchantProfile';

const MerchantProfile = ({ formData, setFormData, fieldErrors }) => {
    const { t } = useTranslation();
    const {
        filteredCountries, filteredCities, businessTypes,
        countrySearchTerm, citySearchTerm,
        showCountryList, showCityList, setShowCityList,
        selectedCountry, selectedCity,
        loading,
        showTermsModal, termsContent,
        startDateRef, expiredDateRef,
        handleChange,
        handleCountrySearch, handleCountryDropdownToggle,
        handleCountrySelect, handleRemoveCountry,
        handleCitySearch, handleCitySelect, handleRemoveCity,
        handleTermsClick, handleTermsAgree, handleTermsModalClose,
        handleDateClick,
    } = useMerchantProfile({ formData, setFormData });

    return (
        <div className="w-100">
            <div className="pb-10 pb-lg-15">
                <h2 className="fw-bolder text-dark">{t('auth.merchantProfile.title')}</h2>
                <div className="text-muted fw-bold fs-6">{t('auth.merchantProfile.subtitle')}</div>
            </div>

            <div className="col-12">
                <h4 className="fw-bold text-dark mb-4">{t('auth.merchantProfile.businessInfo')}</h4>
            </div>

            <div className="row">
                {/* Owner Name */}
                <div className="col-md-6 fv-row mb-4">
                    <label htmlFor="owner_name" className="form-label">
                        {t('auth.merchantProfile.ownerName')} <span className="text-danger">*</span>
                    </label>
                    <input type="text"
                        className={`form-control ${fieldErrors?.owner_name ? 'is-invalid' : ''}`}
                        id="owner_name" name="owner_name"
                        value={formData.owner_name || ''} onChange={handleChange}
                        placeholder={t('auth.merchantProfile.placeholderOwner')}
                        style={{ textTransform: 'none' }} required />
                    {fieldErrors?.owner_name && <div className="invalid-feedback">{fieldErrors.owner_name[0]}</div>}
                </div>

                {/* Business Name */}
                <div className="col-md-6 fv-row mb-4">
                    <label htmlFor="business_name" className="form-label">
                        {t('auth.merchantProfile.businessName')} <span className="text-danger">*</span>
                    </label>
                    <input type="text"
                        className={`form-control ${fieldErrors?.business_name ? 'is-invalid' : ''}`}
                        id="business_name" name="business_name"
                        value={formData.business_name || ''} onChange={handleChange}
                        placeholder={t('auth.merchantProfile.placeholderBusiness')}
                        style={{ textTransform: 'none' }} required />
                    {fieldErrors?.business_name && <div className="invalid-feedback">{fieldErrors.business_name[0]}</div>}
                </div>

                {/* Business Type */}
                <div className="col-md-6 fv-row mb-4">
                    <label htmlFor="business_type" className="form-label">
                        {t('auth.merchantProfile.businessType')} <span className="text-danger">*</span>
                    </label>
                    <select className={`form-select ${fieldErrors?.business_type ? 'is-invalid' : ''}`}
                        id="business_type" name="business_type"
                        value={formData.business_type || ''} onChange={handleChange}
                        disabled={loading.businessTypes} required>
                        <option value="">
                            {loading.businessTypes ? t('auth.common.loading') : t('auth.merchantProfile.selectBusinessType')}
                        </option>
                        {businessTypes.map(type => (
                            <option key={type.id} value={type.value}>{type.text}</option>
                        ))}
                    </select>
                    {fieldErrors?.business_type && <div className="invalid-feedback">{fieldErrors.business_type[0]}</div>}
                </div>

                {/* Business Phone */}
                <div className="col-md-6 fv-row mb-4">
                    <label htmlFor="business_phone" className="form-label">
                        {t('auth.merchantProfile.businessPhone')} <span className="text-danger">*</span>
                    </label>
                    <input type="tel"
                        className={`form-control ${fieldErrors?.business_phone ? 'is-invalid' : ''}`}
                        id="business_phone" name="business_phone"
                        value={formData.business_phone || ''} onChange={handleChange}
                        placeholder={t('auth.merchantProfile.placeholderBusinessPhone')}
                        style={{ textTransform: 'none' }} required />
                    {fieldErrors?.business_phone && <div className="invalid-feedback">{fieldErrors.business_phone[0]}</div>}
                </div>

                {/* Trade License */}
                <div className="col-12"><h4 className="fw-bold text-dark mb-4">{t('auth.merchantProfile.tradeLicenseInfo')}</h4></div>

                <div className="col-md-6 fv-row mb-4">
                    <label htmlFor="trade_license_number" className="form-label">
                        {t('auth.merchantProfile.tradeLicenseNumber')} <span className="text-danger">*</span>
                    </label>
                    <input type="text"
                        className={`form-control ${fieldErrors?.trade_license_number ? 'is-invalid' : ''}`}
                        id="trade_license_number" name="trade_license_number"
                        value={formData.trade_license_number || ''} onChange={handleChange}
                        placeholder={t('auth.merchantProfile.placeholderLicense')}
                        style={{ textTransform: 'none' }} required />
                    {fieldErrors?.trade_license_number && <div className="invalid-feedback">{fieldErrors.trade_license_number[0]}</div>}
                </div>

                <div className="col-md-6 fv-row mb-4">
                    <label htmlFor="trade_license_start_date" className="form-label">
                        {t('auth.merchantProfile.tradeLicenseStartDate')} <span className="text-danger">*</span>
                    </label>
                    <input ref={startDateRef} type="date"
                        className={`form-control ${fieldErrors?.trade_license_start_date ? 'is-invalid' : ''}`}
                        id="trade_license_start_date" name="trade_license_start_date"
                        value={formData.trade_license_start_date || ''} onChange={handleChange}
                        onClick={(e) => handleDateClick(e, startDateRef)} required />
                    {fieldErrors?.trade_license_start_date && <div className="invalid-feedback">{fieldErrors.trade_license_start_date[0]}</div>}
                </div>

                <div className="col-md-6 fv-row mb-4">
                    <label htmlFor="trade_license_expired_date" className="form-label">
                        {t('auth.merchantProfile.tradeLicenseExpiredDate')} <span className="text-danger">*</span>
                    </label>
                    <input ref={expiredDateRef} type="date"
                        className={`form-control ${fieldErrors?.trade_license_expired_date ? 'is-invalid' : ''}`}
                        id="trade_license_expired_date" name="trade_license_expired_date"
                        value={formData.trade_license_expired_date || ''} onChange={handleChange}
                        onClick={(e) => handleDateClick(e, expiredDateRef)} required />
                    {fieldErrors?.trade_license_expired_date && <div className="invalid-feedback">{fieldErrors.trade_license_expired_date[0]}</div>}
                </div>

                <div className="col-md-6 fv-row mb-4">
                    <label htmlFor="tax_number" className="form-label">
                        {t('auth.merchantProfile.taxNumber')} <span className="text-danger">*</span>
                    </label>
                    <input type="text"
                        className={`form-control ${fieldErrors?.tax_number ? 'is-invalid' : ''}`}
                        id="tax_number" name="tax_number"
                        value={formData.tax_number || ''} onChange={handleChange}
                        placeholder={t('auth.merchantProfile.placeholderTax')}
                        style={{ textTransform: 'none' }} required />
                    {fieldErrors?.tax_number && <div className="invalid-feedback">{fieldErrors.tax_number[0]}</div>}
                </div>

                {/* Location */}
                <div className="col-12"><h4 className="fw-bold text-dark mb-4">{t('auth.merchantProfile.addressInfo')}</h4></div>

                {/* Country */}
                <div className="col-md-6 fv-row mb-4">
                    <label htmlFor="country" className="form-label">
                        {t('auth.merchantProfile.country')} <span className="text-danger">*</span>
                    </label>
                    <div className="position-relative">
                        <div className={`form-control h-50px d-flex align-items-center justify-content-between ${fieldErrors?.country ? 'is-invalid' : ''}`}
                            onClick={handleCountryDropdownToggle} style={{ cursor: 'pointer' }}>
                            <div className="d-flex align-items-center">
                                {selectedCountry ? (
                                    <>
                                        <img src={`/flags/${selectedCountry.short_name?.toLowerCase() || 'placeholder'}.png`}
                                            alt={selectedCountry.text} className="me-3"
                                            style={{ width: 20, height: 15, objectFit: 'cover' }}
                                            onError={(e) => { e.target.src = '/flags/placeholder.png'; }} />
                                        <span className="fw-bold text-gray-800">{selectedCountry.text}</span>
                                    </>
                                ) : (
                                    <span className="text-muted">{t('auth.merchantProfile.selectCountry')}</span>
                                )}
                            </div>
                            <div className="d-flex align-items-center">
                                {selectedCountry && (
                                    <button type="button" className="btn btn-icon btn-sm btn-light-danger me-2"
                                        onClick={(e) => { e.stopPropagation(); handleRemoveCountry(); }}>
                                        <i className="ki-duotone ki-cross fs-2"><span className="path1"/><span className="path2"/></i>
                                    </button>
                                )}
                                <i className={`ki-duotone ki-down fs-2 ${showCountryList ? 'rotate-180' : ''}`}>
                                    <span className="path1"/><span className="path2"/>
                                </i>
                            </div>
                        </div>
                        {loading.countries && (
                            <div className="position-absolute top-50 end-0 translate-middle-y me-3">
                                <div className="spinner-border spinner-border-sm" role="status">
                                    <span className="visually-hidden">{t('auth.common.loading')}</span>
                                </div>
                            </div>
                        )}
                        {showCountryList && (
                            <div className="position-absolute top-100 start-0 w-100 bg-white border rounded-3 shadow-sm mt-1"
                                style={{ zIndex: 1000, maxHeight: 200, overflowY: 'auto' }}>
                                <div className="p-2">
                                    <input type="text" className="form-control form-control-sm mb-2"
                                        placeholder={t('auth.merchantProfile.searchCountries')}
                                        value={countrySearchTerm}
                                        onChange={(e) => handleCountrySearch(e.target.value)}
                                        onFocus={(e) => e.stopPropagation()}
                                        onClick={(e) => e.stopPropagation()}
                                        style={{ textTransform: 'none' }} />
                                </div>
                                {loading.countries ? (
                                    <div className="p-3 text-center">
                                        <div className="spinner-border spinner-border-sm me-2" role="status"/>
                                        <span className="text-muted">{t('auth.merchantProfile.searchingCountries')}</span>
                                    </div>
                                ) : filteredCountries.length > 0 ? filteredCountries.map(c => (
                                    <div key={c.id} className="p-3 border-bottom d-flex align-items-center"
                                        style={{ cursor: 'pointer' }}
                                        onMouseDown={(e) => { e.preventDefault(); handleCountrySelect(c); }}>
                                        <img src={`/flags/${c.short_name?.toLowerCase() || 'placeholder'}.png`}
                                            alt={c.text} className="me-3"
                                            style={{ width: 20, height: 15, objectFit: 'cover' }}
                                            onError={(e) => { e.target.src = '/flags/placeholder.png'; }} />
                                        <div className="fw-bold text-gray-800">{c.text}</div>
                                    </div>
                                )) : (
                                    <div className="p-3 text-muted text-center">
                                        <i className="fas fa-search me-2" />{t('auth.merchantProfile.noCountries')}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    {fieldErrors?.country && <div className="invalid-feedback d-block">{fieldErrors.country[0]}</div>}
                </div>

                {/* City */}
                <div className="col-md-6 fv-row mb-4">
                    <label htmlFor="city" className="form-label">
                        {t('auth.merchantProfile.city')} <span className="text-danger">*</span>
                    </label>
                    <div className="position-relative">
                        <div className={`form-control h-50px d-flex align-items-center justify-content-between ${fieldErrors?.city ? 'is-invalid' : ''}`}
                            onClick={() => { if (selectedCountry || formData.country) setShowCityList(v => !v); }}
                            style={{ cursor: (selectedCountry || formData.country) ? 'pointer' : 'not-allowed', opacity: (selectedCountry || formData.country) ? 1 : 0.6 }}>
                            <div className="d-flex align-items-center">
                                {selectedCity
                                    ? <span className="fw-bold text-gray-800">{selectedCity.text}</span>
                                    : <span className="text-muted">
                                        {!(selectedCountry || formData.country)
                                            ? t('auth.merchantProfile.selectCountryFirst')
                                            : t('auth.merchantProfile.selectCity')}
                                      </span>}
                            </div>
                            <div className="d-flex align-items-center">
                                {selectedCity && (
                                    <button type="button" className="btn btn-icon btn-sm btn-light-danger me-2"
                                        onClick={(e) => { e.stopPropagation(); handleRemoveCity(); }}>
                                        <i className="ki-duotone ki-cross fs-2"><span className="path1"/><span className="path2"/></i>
                                    </button>
                                )}
                                <i className={`ki-duotone ki-down fs-2 ${showCityList ? 'rotate-180' : ''}`}>
                                    <span className="path1"/><span className="path2"/>
                                </i>
                            </div>
                        </div>
                        {loading.cities && (
                            <div className="position-absolute top-50 end-0 translate-middle-y me-3">
                                <div className="spinner-border spinner-border-sm" role="status">
                                    <span className="visually-hidden">{t('auth.common.loading')}</span>
                                </div>
                            </div>
                        )}
                        {showCityList && (selectedCountry || formData.country) && (
                            <div className="position-absolute top-100 start-0 w-100 bg-white border rounded-3 shadow-sm mt-1"
                                style={{ zIndex: 1000, maxHeight: 200, overflowY: 'auto' }}>
                                <div className="p-2">
                                    <input type="text" className="form-control form-control-sm mb-2"
                                        placeholder={t('auth.merchantProfile.searchCities')}
                                        value={citySearchTerm}
                                        onChange={(e) => handleCitySearch(e.target.value)}
                                        onClick={(e) => e.stopPropagation()}
                                        style={{ textTransform: 'none' }} />
                                </div>
                                {filteredCities.length > 0 ? filteredCities.map(c => (
                                    <div key={c.id} className="p-3 border-bottom d-flex align-items-center"
                                        style={{ cursor: 'pointer' }}
                                        onMouseDown={(e) => { e.preventDefault(); handleCitySelect(c); }}>
                                        <div className="fw-bold text-gray-800">{c.text}</div>
                                    </div>
                                )) : (
                                    <div className="p-3 text-muted text-center">{t('auth.merchantProfile.noCities')}</div>
                                )}
                            </div>
                        )}
                    </div>
                    {fieldErrors?.city && <div className="invalid-feedback d-block">{fieldErrors.city[0]}</div>}
                </div>

                {/* Business Address */}
                <div className="col-md-12 fv-row mb-4">
                    <label htmlFor="business_address" className="form-label">
                        {t('auth.merchantProfile.businessAddress')} <span className="text-danger">*</span>
                    </label>
                    <textarea className={`form-control ${fieldErrors?.business_address ? 'is-invalid' : ''}`}
                        id="business_address" name="business_address" rows="3"
                        value={formData.business_address || ''} onChange={handleChange}
                        placeholder={t('auth.merchantProfile.placeholderAddress')} required />
                    {fieldErrors?.business_address && <div className="invalid-feedback">{fieldErrors.business_address[0]}</div>}
                </div>

                {/* Terms */}
                <div className="col-12 fv-row mb-4">
                    <div className="form-check mr-terms-check">
                        <input className={`form-check-input ${fieldErrors?.accept_terms ? 'is-invalid' : ''}`}
                            type="checkbox" id="accept_terms" name="accept_terms"
                            checked={formData.accept_terms || false}
                            onChange={(e) => setFormData('accept_terms', e.target.checked)} required />
                        <label className="form-check-label" htmlFor="accept_terms">
                            {t('auth.merchantProfile.agreeTerms')}{' '}
                            <a href="#" className="text-primary fw-bold" onClick={handleTermsClick}>
                                {t('auth.merchantProfile.termsLink')}
                            </a>
                            <span className="text-danger">*</span>
                        </label>
                        {fieldErrors?.accept_terms && <div className="invalid-feedback d-block">{fieldErrors.accept_terms[0]}</div>}
                    </div>
                </div>
            </div>

            {/* Terms Modal */}
            {showTermsModal && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-lg modal-dialog-scrollable">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title fw-bold">{t('auth.merchantProfile.termsModalTitle')}</h5>
                                <button type="button" className="btn-close" onClick={handleTermsModalClose} />
                            </div>
                            <div className="modal-body">
                                {loading.terms ? (
                                    <div className="text-center py-5">
                                        <div className="spinner-border text-primary" role="status">
                                            <span className="visually-hidden">{t('auth.common.loading')}</span>
                                        </div>
                                        <p className="mt-3 text-muted">{t('auth.merchantProfile.termsLoading')}</p>
                                    </div>
                                ) : (
                                    <div className="terms-content"
                                        style={{ maxHeight: 400, overflowY: 'auto', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}
                                        dangerouslySetInnerHTML={{ __html: termsContent }} />
                                )}
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={handleTermsModalClose}>
                                    {t('auth.common.close')}
                                </button>
                                <button type="button" className="btn btn-primary" onClick={handleTermsAgree} disabled={loading.terms}>
                                    {t('auth.merchantProfile.iAgree')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MerchantProfile;

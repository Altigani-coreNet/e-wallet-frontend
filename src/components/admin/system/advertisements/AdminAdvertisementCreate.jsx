import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { useToolbar } from '../../../../contexts/ToolbarContext';
import { createAdvertisement } from '../../../../services/adminAdvertisementsService';
import { AUTH_ENDPOINTS } from '../../../../utils/constants';
import { openNativeDatePicker, validateAdvertisementImage } from '../../../../utils/advertisementFormUtils';

const AdminAdvertisementCreate = () => {
	const { t, i18n } = useTranslation();
	const { setTitle, setActions } = useToolbar();
	const navigate = useNavigate();
	const [loading, setLoading] = useState(false);
	const [countries, setCountries] = useState([]);
	const [filteredCountries, setFilteredCountries] = useState([]);
	const [countrySearchTerm, setCountrySearchTerm] = useState('');
	const [showCountryList, setShowCountryList] = useState(false);
	const [selectedCountry, setSelectedCountry] = useState(null);
	const [imagePreview, setImagePreview] = useState(null);
	const [formData, setFormData] = useState({ name: '', image: null, country_id: '', status: 'active', start_date: '', end_date: '' });
	const [errors, setErrors] = useState({});
	const [countriesLoading, setCountriesLoading] = useState(false);

	const debounce = (func, delay) => {
		let timeoutId;
		return (...args) => {
			clearTimeout(timeoutId);
			timeoutId = setTimeout(() => func.apply(null, args), delay);
		};
	};

	const fetchCountries = useCallback(async (searchTerm = '') => {
		setCountriesLoading(true);
		try {
			const lang = i18n.language?.split('-')[0] || 'en';
			let url = searchTerm
				? `${AUTH_ENDPOINTS.COUNTRIES_SELECT}?search=${encodeURIComponent(searchTerm)}`
				: AUTH_ENDPOINTS.COUNTRIES_SELECT;
			url += `${url.includes('?') ? '&' : '?'}lang=${encodeURIComponent(lang)}`;
			const response = await fetch(url);
			const data = await response.json();
			if (data?.status) {
				setCountries(data.data || []);
				setFilteredCountries(data.data || []);
			}
		} catch (e) {
			console.error('Error fetching countries:', e);
		} finally {
			setCountriesLoading(false);
		}
	}, [i18n.language]);

	useEffect(() => {
		setTitle(t('admin.settings.advertisements.createTitle'));
		setActions(null);
	}, [setTitle, setActions, t]);

	useEffect(() => {
		fetchCountries();
	}, [fetchCountries]);

	const debouncedCountrySearch = useCallback(
		(searchTerm) => {
			if (searchTerm && searchTerm.length >= 1) {
				fetchCountries(searchTerm);
			} else {
				fetchCountries();
			}
		},
		[fetchCountries]
	);

	const handleCountrySearch = (searchTerm) => {
		setCountrySearchTerm(searchTerm);
		setShowCountryList(true);
		debouncedCountrySearch(searchTerm);
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
		setCountrySearchTerm(country.text);
		setFormData(prev => ({ ...prev, country_id: country.id }));
		setShowCountryList(false);
	};

	const handleRemoveCountry = () => {
		setSelectedCountry(null);
		setCountrySearchTerm('');
		setFormData(prev => ({ ...prev, country_id: '' }));
	};

	const handleImageChange = (e) => {
		const file = e.target.files[0];
		if (!file) return;

		const validation = validateAdvertisementImage(file);
		if (!validation.valid) {
			e.target.value = '';
			const msg = t(`admin.settings.advertisements.${validation.errorKey}`);
			setErrors((prev) => ({ ...prev, image: [msg] }));
			toast.error(msg);
			return;
		}

		setErrors((prev) => {
			const next = { ...prev };
			delete next.image;
			return next;
		});
		setFormData({ ...formData, image: file });
		const reader = new FileReader();
		reader.onloadend = () => setImagePreview(reader.result);
		reader.readAsDataURL(file);
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);
		setErrors({});

		if (!formData.image) {
			const msg = t('admin.settings.advertisements.imageRequired');
			setErrors({ image: [msg] });
			toast.error(msg);
			setLoading(false);
			return;
		}

		const imageValidation = validateAdvertisementImage(formData.image);
		if (!imageValidation.valid) {
			const msg = t(`admin.settings.advertisements.${imageValidation.errorKey}`);
			setErrors({ image: [msg] });
			toast.error(msg);
			setLoading(false);
			return;
		}

		try {
			const response = await createAdvertisement(formData);
			if (response.success) {
				toast.success(t('admin.settings.advertisements.createSuccess'));
				navigate('/admin/system/advertisements');
			} else {
				if (response.errors) setErrors(response.errors);
				toast.error(response.error || t('admin.settings.advertisements.createFailed'));
			}
		} catch (error) {
			toast.error(t('admin.settings.advertisements.createFailed'));
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="card">
			<div className="card-header"><h3 className="card-title">{t('admin.settings.advertisements.createCardTitle')}</h3></div>
			<form onSubmit={handleSubmit}>
				<div className="card-body">
					<div className="row">
						<div className="col-md-6 mb-5">
							<label className="form-label required">{t('admin.settings.advertisements.labelName')}</label>
							<input type="text" className={`form-control ${errors.name ? 'is-invalid' : ''}`} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder={t('admin.settings.advertisements.placeholderName')} />
							{errors.name && <div className="invalid-feedback">{errors.name[0]}</div>}
						</div>

						<div className="col-md-6 mb-5">
							<label className="form-label required">{t('admin.settings.advertisements.labelCountry')}</label>
							<div className="position-relative">
								<div className={`form-control h-50px d-flex align-items-center justify-content-between ${errors.country_id ? 'is-invalid' : ''}`} onClick={handleCountryDropdownToggle} style={{ cursor: 'pointer' }}>
									<div className="d-flex align-items-center">
										{selectedCountry ? (
											<>
												<img 
													src={`/flags/${selectedCountry.code?.toLowerCase() || 'placeholder'}.png`} 
													alt={selectedCountry.text}
													className="me-3"
													style={{ width: '20px', height: '15px', objectFit: 'cover' }}
													onError={(e) => { e.target.src = '/flags/placeholder.png'; }}
												/>
												<span className="fw-bold text-gray-800">{selectedCountry.text}</span>
										</>
									) : (
										<span className="text-muted">{t('admin.settings.advertisements.selectCountry')}</span>
									)}
								</div>
								<div className="d-flex align-items-center">
									{selectedCountry && (
										<button type="button" className="btn btn-icon btn-sm btn-light-danger me-2" onClick={(e) => { e.stopPropagation(); handleRemoveCountry(); }}>
											<i className="ki-duotone ki-cross fs-2"><span className="path1"></span><span className="path2"></span></i>
										</button>
									)}
									<i className={`ki-duotone ki-down fs-2 ${showCountryList ? 'rotate-180' : ''}`}><span className="path1"></span><span className="path2"></span></i>
								</div>
							</div>

							{countriesLoading && (
								<div className="position-absolute top-50 end-0 translate-middle-y me-3">
									<div className="spinner-border spinner-border-sm" role="status">
										<span className="visually-hidden">{t('admin.common.loading')}</span>
									</div>
								</div>
							)}

							{showCountryList && (
								<div className="position-absolute top-100 start-0 w-100 bg-white border rounded-3 shadow-sm mt-1" style={{ zIndex: 1000, maxHeight: '250px', overflowY: 'auto' }}>
									<div className="p-2">
										<input 
											type="text" 
											className="form-control form-control-sm mb-2" 
											placeholder={t('admin.settings.advertisements.searchCountries')} 
											value={countrySearchTerm} 
											onChange={(e) => handleCountrySearch(e.target.value)} 
											onFocus={(e) => e.stopPropagation()} 
											onClick={(e) => e.stopPropagation()} 
											style={{ textTransform: 'none' }} 
										/>
									</div>
									{countriesLoading ? (
										<div className="p-3 text-center">
											<div className="spinner-border spinner-border-sm me-2" role="status">
												<span className="visually-hidden">{t('admin.common.loading')}</span>
											</div>
											<span className="text-muted">{t('admin.settings.advertisements.searchingCountries')}</span>
										</div>
									) : (
										filteredCountries.length > 0 ? (
											filteredCountries.map((country) => (
												<div key={country.id} className="p-3 border-bottom cursor-pointer hover-bg-light d-flex align-items-center" onMouseDown={(e) => { e.preventDefault(); handleCountrySelect(country); }} style={{ cursor: 'pointer' }}>
													<img 
														src={`/flags/${country.code?.toLowerCase() || 'placeholder'}.png`} 
														alt={country.text}
														className="me-3"
														style={{ width: '20px', height: '15px', objectFit: 'cover' }}
														onError={(e) => { e.target.src = '/flags/placeholder.png'; }}
													/>
													<div className="fw-bold text-gray-800">{country.text}</div>
												</div>
											))
										) : (
											<div className="p-3 text-muted text-center">{t('admin.settings.advertisements.noCountriesFound')}</div>
										)
									)}
								</div>
							)}
						</div>
						{errors.country_id && <div className="invalid-feedback d-block">{errors.country_id[0]}</div>}
						</div>

						<div className="col-md-6 mb-5">
							<label className="form-label required">{t('admin.settings.advertisements.labelImage')}</label>
							<input type="file" className={`form-control ${errors.image ? 'is-invalid' : ''}`} accept="image/jpeg,image/png,image/gif" onChange={handleImageChange} />
							<div className="form-text">{t('admin.settings.advertisements.imageHint')}</div>
							{errors.image && <div className="invalid-feedback">{errors.image[0]}</div>}
							{imagePreview && (
								<div className="mt-3">
									<img src={imagePreview} alt="" className="img-thumbnail" style={{maxWidth: '300px'}} />
								</div>
							)}
						</div>

						<div className="col-md-6 mb-5">
							<label className="form-label required">{t('admin.settings.advertisements.labelStatus')}</label>
							<select className={`form-select ${errors.status ? 'is-invalid' : ''}`} value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
								<option value="active">{t('admin.common.active')}</option>
								<option value="inactive">{t('admin.common.inactive')}</option>
							</select>
							{errors.status && <div className="invalid-feedback">{errors.status[0]}</div>}
						</div>

						<div className="col-md-6 mb-5">
							<label className="form-label" htmlFor="advertisement-create-start-date">{t('admin.settings.advertisements.labelStartDate')}</label>
							<input
								id="advertisement-create-start-date"
								type="date"
								className={`form-control ${errors.start_date ? 'is-invalid' : ''}`}
								value={formData.start_date}
								onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
								onClick={(e) => openNativeDatePicker(e.currentTarget)}
							/>
							{errors.start_date && <div className="invalid-feedback">{errors.start_date[0]}</div>}
						</div>

						<div className="col-md-6 mb-5">
							<label className="form-label" htmlFor="advertisement-create-end-date">{t('admin.settings.advertisements.labelEndDate')}</label>
							<input
								id="advertisement-create-end-date"
								type="date"
								className={`form-control ${errors.end_date ? 'is-invalid' : ''}`}
								value={formData.end_date}
								onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
								onClick={(e) => openNativeDatePicker(e.currentTarget)}
							/>
							{errors.end_date && <div className="invalid-feedback">{errors.end_date[0]}</div>}
						</div>
					</div>
				</div>

				<div className="card-footer d-flex justify-content-end gap-2">
					<button type="button" className="btn btn-light" onClick={() => navigate('/admin/system/advertisements')} disabled={loading}>{t('admin.common.cancel')}</button>
					<button type="submit" className="btn btn-primary" disabled={loading}>{loading ? t('admin.settings.advertisements.creating') : t('admin.settings.advertisements.createBtn')}</button>
				</div>
			</form>
		</div>
	);
};

export default AdminAdvertisementCreate;

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { useToolbar } from '../../../../contexts/ToolbarContext';
import { getAdvertisement, updateAdvertisement } from '../../../../services/adminAdvertisementsService';
import { AUTH_ENDPOINTS } from '../../../../utils/constants';
import { advertisementAssetUrl, openNativeDatePicker, toDateInputValue, validateAdvertisementImage } from '../../../../utils/advertisementFormUtils';

const AdminAdvertisementEdit = () => {
	const { t, i18n } = useTranslation();
	const { id } = useParams();
	const { setTitle, setActions } = useToolbar();
	const navigate = useNavigate();
	const [loading, setLoading] = useState(false);
	const [countries, setCountries] = useState([]);
	const [filteredCountries, setFilteredCountries] = useState([]);
	const [countrySearchTerm, setCountrySearchTerm] = useState('');
	const [showCountryList, setShowCountryList] = useState(false);
	const [selectedCountry, setSelectedCountry] = useState(null);
	const [countriesLoading, setCountriesLoading] = useState(false);
	const [imagePreview, setImagePreview] = useState(null);
	const [formData, setFormData] = useState({
		name: '',
		image: null,
		country_id: '',
		status: 'active',
		start_date: '',
		end_date: ''
	});
	const [errors, setErrors] = useState({});
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

	const fetchAdAndInit = async () => {
		try {
			setLoading(true);
			// Load ad first
			const adRes = await getAdvertisement(id);
			if (adRes.success) {
				const ad = adRes.data.data;
				setFormData({
					name: ad.name || '',
					image: null,
					country_id: ad.country_id || '',
					status: ad.status || 'active',
					start_date: toDateInputValue(ad.start_date),
					end_date: toDateInputValue(ad.end_date),
				});
				if (ad.image) {
					setImagePreview(advertisementAssetUrl(ad.image));
				} else {
					setImagePreview(null);
				}
			} else {
				toast.error(adRes.error || t('admin.settings.advertisements.loadFailed'));
			}

			const lang = i18n.language?.split('-')[0] || 'en';
			const url = `${AUTH_ENDPOINTS.COUNTRIES_SELECT}?lang=${encodeURIComponent(lang)}`;
			const countriesResponse = await fetch(url);
			const countriesData = await countriesResponse.json();
			if (countriesData?.status) {
				const loadedCountries = countriesData.data || [];
				setCountries(loadedCountries);
				setFilteredCountries(loadedCountries);
				
				const currentId = (adRes?.data?.data?.country_id) || '';
				if (currentId) {
					const match = loadedCountries.find(c => c.id === currentId);
					if (match) {
						setSelectedCountry(match);
						setCountrySearchTerm(match.text);
					}
				}
			}
		} catch (e) {
			console.error('Error loading advertisement/countries:', e);
			toast.error(t('admin.settings.advertisements.loadDataFailed'));
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		setTitle(t('admin.settings.advertisements.editTitle'));
		setActions(null);
	}, [setTitle, setActions, t]);

	useEffect(() => {
		fetchAdAndInit();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [id, i18n.language]);

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

		if (formData.image) {
			const imageValidation = validateAdvertisementImage(formData.image);
			if (!imageValidation.valid) {
				const msg = t(`admin.settings.advertisements.${imageValidation.errorKey}`);
				setErrors({ image: [msg] });
				toast.error(msg);
				setLoading(false);
				return;
			}
		}

		try {
			const response = await updateAdvertisement(id, formData);
			if (response.success) {
				toast.success(t('admin.settings.advertisements.updateSuccess'));
				navigate('/admin/system/advertisements');
			} else {
				if (response.errors) setErrors(response.errors);
				toast.error(response.error || t('admin.settings.advertisements.updateFailed'));
			}
		} catch (error) {
			console.error('Error updating advertisement:', error);
			toast.error(t('admin.settings.advertisements.updateFailed'));
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="card">
			<div className="card-header">
				<h3 className="card-title">{t('admin.settings.advertisements.editCardTitle')}</h3>
			</div>

			<form onSubmit={handleSubmit}>
				<div className="card-body">
					<div className="row">
						<div className="col-md-6 mb-5">
							<label className="form-label required">{t('admin.settings.advertisements.labelName')}</label>
							<input
								type="text"
								className={`form-control ${errors.name ? 'is-invalid' : ''}`}
								value={formData.name}
								onChange={(e) => setFormData({ ...formData, name: e.target.value })}
							/>
							{errors.name && <div className="invalid-feedback">{errors.name[0]}</div>}
						</div>

						<div className="col-md-6 mb-5">
							<label className="form-label required">{t('admin.settings.advertisements.labelCountry')}</label>
							<div className="position-relative">
								<div className={`
									form-control h-50px d-flex align-items-center justify-content-between 
									${errors.country_id ? 'is-invalid' : ''}
								`} onClick={handleCountryDropdownToggle} style={{ cursor: 'pointer' }}>
									<div className="d-flex align-items-center">
										{selectedCountry ? (
											<>
												<img 
													src={`/flags/${selectedCountry?.code?.toLowerCase() || 'placeholder'}.png`} 
													alt={selectedCountry?.text}
													className="me-3"
													style={{ width: '20px', height: '15px', objectFit: 'cover' }}
													onError={(e) => { e.target.src = '/flags/placeholder.png'; }}
												/>
												<span className="fw-bold text-gray-800">{selectedCountry?.text}</span>
										</>
									) : (
										<span className="text-muted">{t('admin.settings.advertisements.selectCountry')}</span>
									)}
								</div>
								<div className="d-flex align-items-center">
									{selectedCountry && (
										<button 
											type="button" 
											className="btn btn-icon btn-sm btn-light-danger me-2" 
											onClick={(e) => { e.stopPropagation(); handleRemoveCountry(); }}
										>
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
							<label className="form-label">{t('admin.settings.advertisements.labelImageKeep')}</label>
							<input
								type="file"
								className={`form-control ${errors.image ? 'is-invalid' : ''}`}
								accept="image/jpeg,image/png,image/gif"
								onChange={handleImageChange}
							/>
							<div className="form-text">{t('admin.settings.advertisements.imageHint')}</div>
							{errors.image && <div className="invalid-feedback d-block">{errors.image[0]}</div>}
							{imagePreview && (
								<div className="mt-3">
									<div className="text-muted fs-8 mb-1">{t('admin.settings.advertisements.previewCurrent')}</div>
									<img
										src={imagePreview}
										alt={t('admin.settings.advertisements.previewAlt')}
										className="img-thumbnail rounded border"
										style={{ maxWidth: '100%', maxHeight: '280px', objectFit: 'contain' }}
									/>
								</div>
							)}
						</div>

						<div className="col-md-6 mb-5">
							<label className="form-label required">{t('admin.settings.advertisements.labelStatus')}</label>
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
							<label className="form-label" htmlFor="advertisement-edit-start-date">{t('admin.settings.advertisements.labelStartDate')}</label>
							<input
								id="advertisement-edit-start-date"
								type="date"
								className="form-control"
								value={formData.start_date}
								onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
								onClick={(e) => openNativeDatePicker(e.currentTarget)}
							/>
						</div>

						<div className="col-md-6 mb-5">
							<label className="form-label" htmlFor="advertisement-edit-end-date">{t('admin.settings.advertisements.labelEndDate')}</label>
							<input
								id="advertisement-edit-end-date"
								type="date"
								className="form-control"
								value={formData.end_date}
								onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
								onClick={(e) => openNativeDatePicker(e.currentTarget)}
							/>
						</div>
					</div>
				</div>

				<div className="card-footer d-flex justify-content-end gap-2">
					<button
						type="button"
						className="btn btn-light"
						onClick={() => navigate('/admin/system/advertisements')}
					>
						{t('admin.common.cancel')}
					</button>
					<button type="submit" className="btn btn-primary" disabled={loading}>
						{loading ? t('admin.settings.advertisements.updating') : t('admin.settings.advertisements.updateBtn')}
					</button>
				</div>
			</form>
		</div>
	);
};

export default AdminAdvertisementEdit;



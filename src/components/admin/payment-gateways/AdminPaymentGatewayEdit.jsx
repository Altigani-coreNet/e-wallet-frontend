import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { useToolbar } from '../../../contexts/ToolbarContext';
import { getPaymentGateway, updatePaymentGateway } from '../../../services/adminPaymentGatewaysService';

const AdminPaymentGatewayEdit = () => {
    const { t } = useTranslation();
    const { setTitle, setActions } = useToolbar();
    const navigate = useNavigate();
    const { id } = useParams();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [formData, setFormData] = useState({
        name: '',
        title: '',
        alias: '',
        mode: 'test',
        is_active: false,
        config: [{ key: '', value: '' }]
    });
    const [logoFile, setLogoFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState(null);
    const [existingLogo, setExistingLogo] = useState(null);
    const [errors, setErrors] = useState({});

    React.useEffect(() => {
        setTitle(t('admin.paymentGatewayEdit.editPaymentProvider'));
        setActions(null);
        return () => setActions(null);
    }, [setTitle, setActions, t]);

    useEffect(() => {
        fetchPaymentGateway();
    }, [id]);

    const fetchPaymentGateway = async () => {
        setFetching(true);
        try {
            const response = await getPaymentGateway(id);
            if (response.success) {
                const data = response.data.data?.data || response.data.data;
                setFormData({
                    name: data.name || '',
                    title: data.title || '',
                    alias: data.alias || '',
                    mode: data.mode || 'test',
                    is_active: data.is_active || false,
                    config: data.config && typeof data.config === 'object' 
                        ? Object.entries(data.config).map(([key, value]) => ({ key, value: String(value) }))
                        : [{ key: '', value: '' }]
                });
                if (data.logo) {
                    setExistingLogo(data.logo);
                    setLogoPreview(`/${data.logo}`);
                }
            } else {
                toast.error(response.error || t('admin.paymentGatewayEdit.fetchFailed'));
                navigate('/admin/payment-gateways');
            }
        } catch (error) {
            console.error('Error fetching payment gateway:', error);
            toast.error(t('admin.paymentGatewayEdit.fetchFailed'));
            navigate('/admin/payment-gateways');
        } finally {
            setFetching(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2048 * 1024) {
                toast.error(t('admin.paymentGatewayCreate.logoSizeError'));
                return;
            }
            if (!['image/jpeg', 'image/jpg', 'image/png', 'image/gif'].includes(file.type)) {
                toast.error(t('admin.paymentGatewayCreate.logoTypeError'));
                return;
            }
            setLogoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveLogo = () => {
        setLogoFile(null);
        setLogoPreview(existingLogo ? `${process.env.REACT_APP_BASE_URL || ''}/${existingLogo}` : null);
    };

    const handleConfigChange = (index, field, value) => {
        const newConfig = [...formData.config];
        newConfig[index] = { ...newConfig[index], [field]: value };
        setFormData(prev => ({ ...prev, config: newConfig }));
    };

    const handleAddConfig = () => {
        setFormData(prev => ({
            ...prev,
            config: [...prev.config, { key: '', value: '' }]
        }));
    };

    const handleRemoveConfig = (index) => {
        if (formData.config.length > 1) {
            const newConfig = formData.config.filter((_, i) => i !== index);
            setFormData(prev => ({ ...prev, config: newConfig }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        try {
            // Create FormData for file upload
            const submitData = new FormData();
            submitData.append('name', formData.name);
            submitData.append('title', formData.title);
            submitData.append('alias', formData.alias || formData.name);
            submitData.append('mode', formData.mode);
            submitData.append('is_active', formData.is_active ? '1' : '0');

            // Add config as array
            formData.config.forEach((item, index) => {
                if (item.key && item.value) {
                    submitData.append(`config[${index}][key]`, item.key);
                    submitData.append(`config[${index}][value]`, item.value);
                }
            });

            // Add logo file if selected
            if (logoFile) {
                submitData.append('logo', logoFile);
            }

            const response = await updatePaymentGateway(id, submitData);
            if (response.success) {
                toast.success(t('admin.paymentGatewayEdit.updateSuccess'));
                navigate('/admin/payment-gateways');
            } else {
                if (response.errors) {
                    setErrors(response.errors);
                }
                toast.error(response.error || t('admin.paymentGatewayEdit.updateFailed'));
            }
        } catch (error) {
            console.error('Error updating payment gateway:', error);
            toast.error(t('admin.paymentGatewayEdit.updateFailed'));
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <div className="card">
                <div className="card-body text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">{t('admin.common.loading')}</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="card">
            <div className="card-header">
                <h3 className="card-title">{t('admin.paymentGatewayEdit.editPaymentProvider')}</h3>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="card-body">
                    {/* Logo Section */}
                    <div className="mb-8">
                        <label className="form-label">{t('admin.paymentGatewayCreate.logo')}</label>
                        <div className="d-flex justify-content-center">
                            <div className="image-input image-input-outline" style={{ position: 'relative' }}>
                                <div 
                                    className="image-input-wrapper w-125px h-125px"
                                    style={{
                                        backgroundImage: logoPreview ? `url(${logoPreview})` : 'none',
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                        border: '1px solid #e4e6ef',
                                        borderRadius: '0.475rem'
                                    }}
                                >
                                </div>
                                <label 
                                    className="btn btn-icon btn-circle btn-active-color-primary w-25px h-25px bg-body shadow" 
                                    style={{ position: 'absolute', top: 0, right: 0 }}
                                    htmlFor="logo-upload"
                                >
                                    <i className="ki-duotone ki-pencil fs-7">
                                        <span className="path1"></span>
                                        <span className="path2"></span>
                                    </i>
                                    <input 
                                        type="file" 
                                        id="logo-upload"
                                        accept=".png, .jpg, .jpeg, .gif" 
                                        className="d-none"
                                        onChange={handleLogoChange}
                                    />
                                </label>
                                {logoPreview && (
                                    <span 
                                        className="btn btn-icon btn-circle btn-active-color-primary w-25px h-25px bg-body shadow" 
                                        style={{ position: 'absolute', bottom: 0, right: 0 }}
                                        onClick={handleRemoveLogo}
                                    >
                                        <i className="ki-duotone ki-cross fs-2">
                                            <span className="path1"></span>
                                            <span className="path2"></span>
                                        </i>
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="form-text">{t('admin.paymentGatewayCreate.allowedFileTypes')}</div>
                        {errors.logo && <div className="text-danger mt-1">{errors.logo[0]}</div>}
                    </div>

                    <div className="row">
                        <div className="col-md-6">
                            <div className="mb-5">
                                <label className="form-label required">{t('admin.paymentGatewayCreate.name')}</label>
                                <input
                                    type="text"
                                    name="name"
                                    className={`form-control form-control-solid ${errors.name ? 'is-invalid' : ''}`}
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder={t('admin.paymentGatewayCreate.namePlaceholder')}
                                    required
                                />
                                {errors.name && <div className="invalid-feedback">{errors.name[0]}</div>}
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="mb-5">
                                <label className="form-label required">{t('admin.paymentGatewayCreate.title')}</label>
                                <input
                                    type="text"
                                    name="title"
                                    className={`form-control form-control-solid ${errors.title ? 'is-invalid' : ''}`}
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    placeholder={t('admin.paymentGatewayCreate.titlePlaceholder')}
                                    required
                                />
                                {errors.title && <div className="invalid-feedback">{errors.title[0]}</div>}
                            </div>
                        </div>
                    </div>

                    <div className="row">
                        <div className="col-md-6">
                            <div className="mb-5">
                                <label className="form-label">{t('admin.paymentGatewayCreate.alias')}</label>
                                <input
                                    type="text"
                                    name="alias"
                                    className={`form-control form-control-solid ${errors.alias ? 'is-invalid' : ''}`}
                                    value={formData.alias}
                                    onChange={handleInputChange}
                                    placeholder={t('admin.paymentGatewayCreate.aliasPlaceholder')}
                                />
                                {errors.alias && <div className="invalid-feedback">{errors.alias[0]}</div>}
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="mb-5">
                                <label className="form-label required">{t('admin.paymentGatewayCreate.mode')}</label>
                                <select
                                    name="mode"
                                    className={`form-select form-select-solid ${errors.mode ? 'is-invalid' : ''}`}
                                    value={formData.mode}
                                    onChange={handleInputChange}
                                    required
                                >
                                    <option value="test">{t('admin.paymentGatewayCreate.test')}</option>
                                    <option value="live">{t('admin.paymentGatewayCreate.live')}</option>
                                </select>
                                {errors.mode && <div className="invalid-feedback">{errors.mode[0]}</div>}
                            </div>
                        </div>
                    </div>

                    {/* Configuration Section */}
                    <div className="row mb-6">
                        <div className="col-12">
                            <h3 className="fs-6 fw-bold mb-4">{t('admin.paymentGatewayCreate.configuration')}</h3>
                            {formData.config.map((item, index) => (
                                <div key={index} className="config-item mb-4 p-4 border rounded">
                                    <div className="row align-items-center">
                                        <div className="col-md-5">
                                            <label className="form-label fw-semibold fs-6">{t('admin.paymentGatewayCreate.configKey')}</label>
                                            <input
                                                type="text"
                                                className="form-control form-control-solid"
                                                value={item.key}
                                                onChange={(e) => handleConfigChange(index, 'key', e.target.value)}
                                                placeholder={t('admin.paymentGatewayCreate.configKeyPlaceholder')}
                                            />
                                        </div>
                                        <div className="col-md-5">
                                            <label className="form-label fw-semibold fs-6">{t('admin.paymentGatewayCreate.configValue')}</label>
                                            <input
                                                type="text"
                                                className="form-control form-control-solid"
                                                value={item.value}
                                                onChange={(e) => handleConfigChange(index, 'value', e.target.value)}
                                                placeholder={t('admin.paymentGatewayCreate.configValuePlaceholder')}
                                            />
                                        </div>
                                        <div className="col-md-2">
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-light-danger remove-config mt-8"
                                                onClick={() => handleRemoveConfig(index)}
                                                style={{ display: formData.config.length > 1 ? 'block' : 'none' }}
                                            >
                                                <i className="ki-duotone ki-trash fs-2">
                                                    <span className="path1"></span>
                                                    <span className="path2"></span>
                                                    <span className="path3"></span>
                                                    <span className="path4"></span>
                                                    <span className="path5"></span>
                                                </i>
                                                {t('admin.paymentGatewayCreate.remove')}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <button
                                type="button"
                                className="btn btn-sm btn-light-primary"
                                onClick={handleAddConfig}
                            >
                                <i className="ki-duotone ki-plus fs-2">
                                    <span className="path1"></span>
                                    <span className="path2"></span>
                                </i>
                                {t('admin.paymentGatewayCreate.addConfig')}
                            </button>
                        </div>
                    </div>

                    <div className="mb-5">
                        <div className="form-check form-switch form-check-custom form-check-solid">
                            <input
                                className="form-check-input"
                                type="checkbox"
                                name="is_active"
                                id="is_active"
                                checked={formData.is_active}
                                onChange={handleInputChange}
                            />
                            <label className="form-check-label" htmlFor="is_active">
                                {t('admin.paymentGatewayCreate.isActive')}
                            </label>
                        </div>
                    </div>

                    <div className="text-end">
                        <button
                            type="button"
                            className="btn btn-light me-3"
                            onClick={() => navigate('/admin/payment-gateways')}
                            disabled={loading}
                        >
                            {t('admin.paymentGatewayCreate.cancel')}
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    {t('admin.paymentGatewayEdit.updating')}
                                </>
                            ) : (
                                <>
                                    <i className="ki-duotone ki-save fs-2">
                                        <span className="path1"></span>
                                        <span className="path2"></span>
                                    </i>
                                    {t('admin.paymentGatewayEdit.update')}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default AdminPaymentGatewayEdit;

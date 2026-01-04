import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useToolbar } from '../../../contexts/ToolbarContext';
import { getPaymentGateway, updatePaymentGateway } from '../../../services/adminPaymentGatewaysService';

const AdminPaymentGatewayEdit = () => {
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
        setTitle('Edit Payment Provider');
        setActions(null);
        return () => setActions(null);
    }, [setTitle, setActions]);

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
                toast.error(response.error || 'Failed to fetch payment gateway');
                navigate('/admin/payment-gateways');
            }
        } catch (error) {
            console.error('Error fetching payment gateway:', error);
            toast.error('Failed to fetch payment gateway');
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
                toast.error('Logo file size must be less than 2MB');
                return;
            }
            if (!['image/jpeg', 'image/jpg', 'image/png', 'image/gif'].includes(file.type)) {
                toast.error('Logo must be an image file (jpeg, jpg, png, gif)');
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
                toast.success('Payment gateway updated successfully');
                navigate('/admin/payment-gateways');
            } else {
                if (response.errors) {
                    setErrors(response.errors);
                }
                toast.error(response.error || 'Failed to update payment gateway');
            }
        } catch (error) {
            console.error('Error updating payment gateway:', error);
            toast.error('Failed to update payment gateway');
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <div className="card">
                <div className="card-body text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="card">
            <div className="card-header">
                <h3 className="card-title">Edit Payment Provider</h3>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="card-body">
                    {/* Logo Section */}
                    <div className="mb-8">
                        <label className="form-label">Logo</label>
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
                        <div className="form-text">Allowed file types: png, jpg, jpeg, gif. Max size: 2MB</div>
                        {errors.logo && <div className="text-danger mt-1">{errors.logo[0]}</div>}
                    </div>

                    <div className="row">
                        <div className="col-md-6">
                            <div className="mb-5">
                                <label className="form-label required">Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    className={`form-control form-control-solid ${errors.name ? 'is-invalid' : ''}`}
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder="Enter name"
                                    required
                                />
                                {errors.name && <div className="invalid-feedback">{errors.name[0]}</div>}
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="mb-5">
                                <label className="form-label required">Title</label>
                                <input
                                    type="text"
                                    name="title"
                                    className={`form-control form-control-solid ${errors.title ? 'is-invalid' : ''}`}
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    placeholder="Enter title"
                                    required
                                />
                                {errors.title && <div className="invalid-feedback">{errors.title[0]}</div>}
                            </div>
                        </div>
                    </div>

                    <div className="row">
                        <div className="col-md-6">
                            <div className="mb-5">
                                <label className="form-label">Alias</label>
                                <input
                                    type="text"
                                    name="alias"
                                    className={`form-control form-control-solid ${errors.alias ? 'is-invalid' : ''}`}
                                    value={formData.alias}
                                    onChange={handleInputChange}
                                    placeholder="Enter alias (optional)"
                                />
                                {errors.alias && <div className="invalid-feedback">{errors.alias[0]}</div>}
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="mb-5">
                                <label className="form-label required">Mode</label>
                                <select
                                    name="mode"
                                    className={`form-select form-select-solid ${errors.mode ? 'is-invalid' : ''}`}
                                    value={formData.mode}
                                    onChange={handleInputChange}
                                    required
                                >
                                    <option value="test">Test</option>
                                    <option value="live">Live</option>
                                </select>
                                {errors.mode && <div className="invalid-feedback">{errors.mode[0]}</div>}
                            </div>
                        </div>
                    </div>

                    {/* Configuration Section */}
                    <div className="row mb-6">
                        <div className="col-12">
                            <h3 className="fs-6 fw-bold mb-4">Configuration</h3>
                            {formData.config.map((item, index) => (
                                <div key={index} className="config-item mb-4 p-4 border rounded">
                                    <div className="row align-items-center">
                                        <div className="col-md-5">
                                            <label className="form-label fw-semibold fs-6">Config Key</label>
                                            <input
                                                type="text"
                                                className="form-control form-control-solid"
                                                value={item.key}
                                                onChange={(e) => handleConfigChange(index, 'key', e.target.value)}
                                                placeholder="Enter config key"
                                            />
                                        </div>
                                        <div className="col-md-5">
                                            <label className="form-label fw-semibold fs-6">Config Value</label>
                                            <input
                                                type="text"
                                                className="form-control form-control-solid"
                                                value={item.value}
                                                onChange={(e) => handleConfigChange(index, 'value', e.target.value)}
                                                placeholder="Enter config value"
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
                                                Remove
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
                                Add Config
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
                                Is Active
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
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    Updating...
                                </>
                            ) : (
                                <>
                                    <i className="ki-duotone ki-save fs-2">
                                        <span className="path1"></span>
                                        <span className="path2"></span>
                                    </i>
                                    Update
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

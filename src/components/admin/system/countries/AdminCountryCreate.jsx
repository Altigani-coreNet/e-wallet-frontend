import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useToolbar } from '../../../../contexts/ToolbarContext';
import { createCountry } from '../../../../services/adminCountriesService';

const AdminCountryCreate = () => {
    const { setTitle, setActions } = useToolbar();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: { en: '', ar: '' },
        short_name: '',
        code: '',
        status: true
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        setTitle('Create Country');
        setActions(null);
    }, [setTitle, setActions]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        try {
            const response = await createCountry(formData);
            if (response.success) {
                toast.success('Country created successfully');
                navigate('/admin/system/countries');
            } else {
                if (response.errors) setErrors(response.errors);
                toast.error(response.error || 'Failed to create country');
            }
        } catch (error) {
            console.error('Error creating country:', error);
            toast.error('Failed to create country');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card">
            <div className="card-header">
                <h3 className="card-title">Create New Country</h3>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="card-body">
                    <div className="row">
                        <div className="col-md-6 mb-5">
                            <label className="form-label required">Name (English)</label>
                            <input
                                type="text"
                                className={`form-control ${errors['name.en'] ? 'is-invalid' : ''}`}
                                value={formData.name.en}
                                onChange={(e) => setFormData({ ...formData, name: { ...formData.name, en: e.target.value } })}
                                placeholder="Enter country name in English"
                            />
                            {errors['name.en'] && <div className="invalid-feedback">{errors['name.en'][0]}</div>}
                        </div>

                        <div className="col-md-6 mb-5">
                            <label className="form-label required">Name (Arabic)</label>
                            <input
                                type="text"
                                className={`form-control ${errors['name.ar'] ? 'is-invalid' : ''}`}
                                value={formData.name.ar}
                                onChange={(e) => setFormData({ ...formData, name: { ...formData.name, ar: e.target.value } })}
                                placeholder="أدخل اسم الدولة بالعربية"
                                dir="rtl"
                            />
                            {errors['name.ar'] && <div className="invalid-feedback">{errors['name.ar'][0]}</div>}
                        </div>

                        <div className="col-md-6 mb-5">
                            <label className="form-label required">Short Name</label>
                            <input
                                type="text"
                                className={`form-control ${errors.short_name ? 'is-invalid' : ''}`}
                                value={formData.short_name}
                                onChange={(e) => setFormData({ ...formData, short_name: e.target.value })}
                                placeholder="e.g., EG, SA, AE"
                            />
                            {errors.short_name && <div className="invalid-feedback">{errors.short_name[0]}</div>}
                        </div>

                        <div className="col-md-6 mb-5">
                            <label className="form-label">Code</label>
                            <input
                                type="text"
                                className={`form-control ${errors.code ? 'is-invalid' : ''}`}
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                placeholder="Country code"
                            />
                            {errors.code && <div className="invalid-feedback">{errors.code[0]}</div>}
                        </div>

                        <div className="col-md-6 mb-5">
                            <label className="form-label required">Status</label>
                            <select
                                className={`form-select ${errors.status ? 'is-invalid' : ''}`}
                                value={formData.status ? '1' : '0'}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value === '1' })}
                            >
                                <option value="1">Active</option>
                                <option value="0">Inactive</option>
                            </select>
                            {errors.status && <div className="invalid-feedback">{errors.status[0]}</div>}
                        </div>
                    </div>
                </div>

                <div className="card-footer d-flex justify-content-end gap-2">
                    <button
                        type="button"
                        className="btn btn-light"
                        onClick={() => navigate('/admin/system/countries')}
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Creating...' : 'Create Country'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AdminCountryCreate;



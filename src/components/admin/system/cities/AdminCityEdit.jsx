import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useToolbar } from '../../../../contexts/ToolbarContext';
import { getCity, updateCity } from '../../../../services/adminCitiesService';
import { getCountriesSelect } from '../../../../services/adminCountriesService';

const AdminCityEdit = () => {
    const { id } = useParams();
    const { setTitle, setActions } = useToolbar();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [countries, setCountries] = useState([]);
    const [formData, setFormData] = useState({
        name: { en: '', ar: '' },
        country_id: '',
        status: true
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        setTitle('Edit City');
        setActions(null);
        fetchData();
    }, [id, setTitle, setActions]);

    const fetchData = async () => {
        const [cityRes, countriesRes] = await Promise.all([
            getCity(id),
            getCountriesSelect()
        ]);

        if (cityRes.success) {
            const city = cityRes.data.data;
            setFormData({
                name: city.name || { en: '', ar: '' },
                country_id: city.country_id || '',
                status: city.status || false
            });
        }

        if (countriesRes.success) {
            setCountries(countriesRes.data.data || []);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        try {
            const response = await updateCity(id, formData);
            if (response.success) {
                toast.success('City updated successfully');
                navigate('/admin/system/cities');
            } else {
                if (response.errors) setErrors(response.errors);
                toast.error(response.error || 'Failed to update city');
            }
        } catch (error) {
            console.error('Error updating city:', error);
            toast.error('Failed to update city');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card">
            <div className="card-header">
                <h3 className="card-title">Edit City</h3>
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
                                dir="rtl"
                            />
                            {errors['name.ar'] && <div className="invalid-feedback">{errors['name.ar'][0]}</div>}
                        </div>

                        <div className="col-md-6 mb-5">
                            <label className="form-label required">Country</label>
                            <select
                                className={`form-select ${errors.country_id ? 'is-invalid' : ''}`}
                                value={formData.country_id}
                                onChange={(e) => setFormData({ ...formData, country_id: e.target.value })}
                            >
                                <option value="">Select Country</option>
                                {countries.map(country => (
                                    <option key={country.id} value={country.id}>
                                        {typeof country.text === 'object' ? country.text.en : country.text}
                                    </option>
                                ))}
                            </select>
                            {errors.country_id && <div className="invalid-feedback">{errors.country_id[0]}</div>}
                        </div>

                        <div className="col-md-6 mb-5">
                            <label className="form-label required">Status</label>
                            <select
                                className="form-select"
                                value={formData.status ? '1' : '0'}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value === '1' })}
                            >
                                <option value="1">Active</option>
                                <option value="0">Inactive</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="card-footer d-flex justify-content-end gap-2">
                    <button
                        type="button"
                        className="btn btn-light"
                        onClick={() => navigate('/admin/system/cities')}
                    >
                        Cancel
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Updating...' : 'Update City'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AdminCityEdit;



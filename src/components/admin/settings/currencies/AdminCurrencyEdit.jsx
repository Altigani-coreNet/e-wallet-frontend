import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useToolbar } from '../../../../contexts/ToolbarContext';
import { getCurrency, updateCurrency } from '../../../../services/adminCurrenciesService';

const AdminCurrencyEdit = () => {
    const { id } = useParams();
    const { setTitle, setActions } = useToolbar();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [formData, setFormData] = useState({ country: '', name: '', symbol: '', currency_code: '' });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        setTitle('Edit Currency');
        setActions(null);
        fetchCurrency();
    }, [setTitle, setActions, id]);

    const fetchCurrency = async () => {
        setFetching(true);
        const response = await getCurrency(id);
        setFetching(false);
        if (response.success) {
            const data = response.data.data || response.data;
            setFormData({ country: data.country || '', name: data.name || '', symbol: data.symbol || '', currency_code: data.currency_code || '' });
        } else {
            toast.error(response.error || 'Failed to fetch currency');
            navigate('/admin/settings/currencies');
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});
        const response = await updateCurrency(id, formData);
        setLoading(false);
        if (response.success) {
            toast.success('Currency updated successfully');
            navigate('/admin/settings/currencies');
        } else {
            toast.error(response.error || 'Failed to update currency');
            if (response.errors) setErrors(response.errors);
        }
    };

    if (fetching) return <div className="post d-flex flex-column-fluid" id="kt_post"><div id="kt_content_container" className="container-fluid"><div className="card"><div className="card-body text-center py-20"><div className="spinner-border text-primary"></div></div></div></div></div>;

    return (
        <>
                <div className="card">
                    <div className="card-header"><h3 className="card-title">Currency Information</h3></div>
                    <form onSubmit={handleSubmit}>
                        <div className="card-body">
                            <div className="row mb-6">
                                <div className="col-lg-6">
                                    <label className="form-label required">Country</label>
                                    <input type="text" name="country" className={`form-control ${errors.country ? 'is-invalid' : ''}`} value={formData.country} onChange={handleChange} required />
                                    {errors.country && <div className="invalid-feedback">{errors.country[0]}</div>}
                                </div>
                                <div className="col-lg-6">
                                    <label className="form-label required">Name</label>
                                    <input type="text" name="name" className={`form-control ${errors.name ? 'is-invalid' : ''}`} value={formData.name} onChange={handleChange} required />
                                    {errors.name && <div className="invalid-feedback">{errors.name[0]}</div>}
                                </div>
                            </div>
                            <div className="row mb-6">
                                <div className="col-lg-6">
                                    <label className="form-label required">Symbol</label>
                                    <input type="text" name="symbol" className={`form-control ${errors.symbol ? 'is-invalid' : ''}`} value={formData.symbol} onChange={handleChange} required />
                                    {errors.symbol && <div className="invalid-feedback">{errors.symbol[0]}</div>}
                                </div>
                                <div className="col-lg-6">
                                    <label className="form-label required">Currency Code</label>
                                    <input type="text" name="currency_code" className={`form-control ${errors.currency_code ? 'is-invalid' : ''}`} value={formData.currency_code} onChange={handleChange} required />
                                    {errors.currency_code && <div className="invalid-feedback">{errors.currency_code[0]}</div>}
                                </div>
                            </div>
                        </div>
                        <div className="card-footer d-flex justify-content-end py-6 px-9">
                            <button type="button" className="btn btn-light btn-active-light-primary me-2" onClick={() => navigate('/admin/settings/currencies')}>Cancel</button>
                            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? <><span className="spinner-border spinner-border-sm me-2"></span>Updating...</> : 'Update Currency'}</button>
                        </div>
                    </form>
                </div>
        </>
    );
};

export default AdminCurrencyEdit;



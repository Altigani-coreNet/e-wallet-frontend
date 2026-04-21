import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useToolbar } from '../../../../contexts/ToolbarContext';
import { getCountry, deleteCountry } from '../../../../services/adminCountriesService';

const AdminCountryView = () => {
    const { id } = useParams();
    const { setTitle, setActions } = useToolbar();
    const navigate = useNavigate();
    const [country, setCountry] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setTitle('Country Details');
        setActions(
            <div className="d-flex gap-2">
                <Link to={`/admin/system/countries/${id}/edit`} className="btn btn-sm btn-primary">
                    <i className="ki-duotone ki-pencil fs-3">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    <span className="d-none d-md-inline ms-1">Edit</span>
                </Link>
                <button onClick={handleDelete} className="btn btn-sm btn-danger">
                    <i className="ki-duotone ki-trash fs-3">
                        <span className="path1"></span>
                        <span className="path2"></span>
                        <span className="path3"></span>
                        <span className="path4"></span>
                        <span className="path5"></span>
                    </i>
                    <span className="d-none d-md-inline ms-1">Delete</span>
                </button>
            </div>
        );
        fetchCountry();
        return () => setActions(null);
    }, [id, setTitle, setActions]);

    const fetchCountry = async () => {
        setLoading(true);
        try {
            const response = await getCountry(id);
            if (response.success) {
                setCountry(response.data.data);
            } else {
                toast.error(response.error || 'Failed to fetch country');
            }
        } catch (error) {
            console.error('Error fetching country:', error);
            toast.error('Failed to fetch country');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this country?')) {
            return;
        }

        try {
            const response = await deleteCountry(id);
            if (response.success) {
                toast.success('Country deleted successfully');
                navigate('/admin/system/countries');
            } else {
                toast.error(response.error || 'Failed to delete country');
            }
        } catch (error) {
            console.error('Error deleting country:', error);
            toast.error('Failed to delete country');
        }
    };

    if (loading) {
        return (
            <div className="card">
                <div className="card-body text-center py-10">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (!country) {
        return (
            <div className="card">
                <div className="card-body text-center py-10">
                    <p>Country not found</p>
                </div>
            </div>
        );
    }

    return (
        <div className="card">
            <div className="card-header">
                <h3 className="card-title">Country Information</h3>
            </div>

            <div className="card-body">
                <div className="row mb-7">
                    <label className="col-lg-4 fw-semibold text-muted">Name (English)</label>
                    <div className="col-lg-8">
                        <span className="fw-bold fs-6 text-gray-800">
                            {typeof country.name === 'object' ? country.name.en : country.name}
                        </span>
                    </div>
                </div>

                <div className="row mb-7">
                    <label className="col-lg-4 fw-semibold text-muted">Name (Arabic)</label>
                    <div className="col-lg-8">
                        <span className="fw-bold fs-6 text-gray-800">
                            {typeof country.name === 'object' ? country.name.ar : country.name}
                        </span>
                    </div>
                </div>

                <div className="row mb-7">
                    <label className="col-lg-4 fw-semibold text-muted">Short Name</label>
                    <div className="col-lg-8">
                        <span className="fw-semibold text-gray-800">{country.short_name}</span>
                    </div>
                </div>

                <div className="row mb-7">
                    <label className="col-lg-4 fw-semibold text-muted">Code</label>
                    <div className="col-lg-8">
                        <span className="fw-semibold text-gray-800">{country.code || 'N/A'}</span>
                    </div>
                </div>

                <div className="row mb-7">
                    <label className="col-lg-4 fw-semibold text-muted">Currency Code</label>
                    <div className="col-lg-8">
                        <span className="fw-semibold text-gray-800">{country.currency_code || 'N/A'}</span>
                    </div>
                </div>

                <div className="row mb-7">
                    <label className="col-lg-4 fw-semibold text-muted">Status</label>
                    <div className="col-lg-8">
                        <span className={`badge badge-light-${country.status ? 'success' : 'danger'}`}>
                            {country.status ? 'Active' : 'Inactive'}
                        </span>
                    </div>
                </div>

                <div className="row mb-7">
                    <label className="col-lg-4 fw-semibold text-muted">Created At</label>
                    <div className="col-lg-8">
                        <span className="fw-semibold text-gray-800">
                            {new Date(country.created_at).toLocaleString()}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminCountryView;



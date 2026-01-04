import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useToolbar } from '../../../../contexts/ToolbarContext';
import { getCity, deleteCity } from '../../../../services/adminCitiesService';

const AdminCityView = () => {
    const { id } = useParams();
    const { setTitle, setActions } = useToolbar();
    const navigate = useNavigate();
    const [city, setCity] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setTitle('City Details');
        setActions(
            <div className="d-flex gap-2">
                <Link to={`/admin/system/cities/${id}/edit`} className="btn btn-sm btn-primary">
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
        fetchCity();
        return () => setActions(null);
    }, [id, setTitle, setActions]);

    const fetchCity = async () => {
        setLoading(true);
        try {
            const response = await getCity(id);
            if (response.success) {
                setCity(response.data.data);
            } else {
                toast.error(response.error || 'Failed to fetch city');
            }
        } catch (error) {
            console.error('Error fetching city:', error);
            toast.error('Failed to fetch city');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this city?')) {
            return;
        }

        try {
            const response = await deleteCity(id);
            if (response.success) {
                toast.success('City deleted successfully');
                navigate('/admin/system/cities');
            } else {
                toast.error(response.error || 'Failed to delete city');
            }
        } catch (error) {
            console.error('Error deleting city:', error);
            toast.error('Failed to delete city');
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

    if (!city) {
        return (
            <div className="card">
                <div className="card-body text-center py-10">
                    <p>City not found</p>
                </div>
            </div>
        );
    }

    return (
        <div className="card">
            <div className="card-header">
                <h3 className="card-title">City Information</h3>
            </div>

            <div className="card-body">
                <div className="row mb-7">
                    <label className="col-lg-4 fw-semibold text-muted">Name (English)</label>
                    <div className="col-lg-8">
                        <span className="fw-bold fs-6 text-gray-800">
                            {typeof city.name === 'object' ? city.name.en : city.name}
                        </span>
                    </div>
                </div>

                <div className="row mb-7">
                    <label className="col-lg-4 fw-semibold text-muted">Name (Arabic)</label>
                    <div className="col-lg-8">
                        <span className="fw-bold fs-6 text-gray-800">
                            {typeof city.name === 'object' ? city.name.ar : city.name}
                        </span>
                    </div>
                </div>

                <div className="row mb-7">
                    <label className="col-lg-4 fw-semibold text-muted">Country</label>
                    <div className="col-lg-8">
                        <span className="fw-semibold text-gray-800">
                            {city.country ? (typeof city.country.name === 'object' ? city.country.name.en : city.country.name) : 'N/A'}
                        </span>
                    </div>
                </div>

                <div className="row mb-7">
                    <label className="col-lg-4 fw-semibold text-muted">Status</label>
                    <div className="col-lg-8">
                        <span className={`badge badge-light-${city.status ? 'success' : 'danger'}`}>
                            {city.status ? 'Active' : 'Inactive'}
                        </span>
                    </div>
                </div>

                <div className="row mb-7">
                    <label className="col-lg-4 fw-semibold text-muted">Created At</label>
                    <div className="col-lg-8">
                        <span className="fw-semibold text-gray-800">
                            {new Date(city.created_at).toLocaleString()}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminCityView;



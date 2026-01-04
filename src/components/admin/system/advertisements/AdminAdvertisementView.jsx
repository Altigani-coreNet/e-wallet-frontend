import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useToolbar } from '../../../../contexts/ToolbarContext';
import { getAdvertisement, deleteAdvertisement } from '../../../../services/adminAdvertisementsService';

const AdminAdvertisementView = () => {
    const { id } = useParams();
    const { setTitle, setActions } = useToolbar();
    const navigate = useNavigate();
    const [advertisement, setAdvertisement] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setTitle('Advertisement Details');
        setActions(
            <div className="d-flex gap-2">
                <Link to={`/admin/system/advertisements/${id}/edit`} className="btn btn-sm btn-primary">
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
        fetchAdvertisement();
        return () => setActions(null);
    }, [id, setTitle, setActions]);

    const fetchAdvertisement = async () => {
        setLoading(true);
        try {
            const response = await getAdvertisement(id);
            if (response.success) {
                setAdvertisement(response.data.data);
            } else {
                toast.error(response.error || 'Failed to fetch advertisement');
            }
        } catch (error) {
            console.error('Error fetching advertisement:', error);
            toast.error('Failed to fetch advertisement');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this advertisement?')) {
            return;
        }

        try {
            const response = await deleteAdvertisement(id);
            if (response.success) {
                toast.success('Advertisement deleted successfully');
                navigate('/admin/system/advertisements');
            } else {
                toast.error(response.error || 'Failed to delete advertisement');
            }
        } catch (error) {
            console.error('Error deleting advertisement:', error);
            toast.error('Failed to delete advertisement');
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

    if (!advertisement) {
        return (
            <div className="card">
                <div className="card-body text-center py-10">
                    <p>Advertisement not found</p>
                </div>
            </div>
        );
    }

    return (
        <div className="card">
            <div className="card-header">
                <h3 className="card-title">Advertisement Information</h3>
            </div>

            <div className="card-body">
                {advertisement.image && (
                    <div className="row mb-7">
                        <label className="col-lg-4 fw-semibold text-muted">Image</label>
                        <div className="col-lg-8">
                            <img src={advertisement.image} alt={advertisement.name} className="img-thumbnail" style={{maxWidth: '400px'}} />
                        </div>
                    </div>
                )}

                <div className="row mb-7">
                    <label className="col-lg-4 fw-semibold text-muted">Name</label>
                    <div className="col-lg-8">
                        <span className="fw-bold fs-6 text-gray-800">{advertisement.name}</span>
                    </div>
                </div>

                <div className="row mb-7">
                    <label className="col-lg-4 fw-semibold text-muted">Country</label>
                    <div className="col-lg-8">
                        <span className="fw-semibold text-gray-800">
                            {advertisement.country ? (typeof advertisement.country.name === 'object' ? advertisement.country.name.en : advertisement.country.name) : 'N/A'}
                        </span>
                    </div>
                </div>

                <div className="row mb-7">
                    <label className="col-lg-4 fw-semibold text-muted">Status</label>
                    <div className="col-lg-8">
                        <span className={`badge badge-light-${advertisement.status === 'active' ? 'success' : 'danger'}`}>
                            {advertisement.status}
                        </span>
                    </div>
                </div>

                <div className="row mb-7">
                    <label className="col-lg-4 fw-semibold text-muted">Start Date</label>
                    <div className="col-lg-8">
                        <span className="fw-semibold text-gray-800">{advertisement.start_date || 'N/A'}</span>
                    </div>
                </div>

                <div className="row mb-7">
                    <label className="col-lg-4 fw-semibold text-muted">End Date</label>
                    <div className="col-lg-8">
                        <span className="fw-semibold text-gray-800">{advertisement.end_date || 'N/A'}</span>
                    </div>
                </div>

                <div className="row mb-7">
                    <label className="col-lg-4 fw-semibold text-muted">Created At</label>
                    <div className="col-lg-8">
                        <span className="fw-semibold text-gray-800">
                            {new Date(advertisement.created_at).toLocaleString()}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminAdvertisementView;



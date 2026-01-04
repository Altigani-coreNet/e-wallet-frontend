import React, { useState, useEffect } from 'react';
import ErrorAlert from '../../../components/common/ErrorAlert';

const BranchForm = ({ mode = 'create', initialData = {}, onSubmit, loading, error }) => {
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        is_active: false,
    });

    useEffect(() => {
        if (mode === 'edit' && initialData) {
            setFormData({
                name: initialData.name || '',
                address: initialData.address || '',
                is_active: initialData.is_active || false,
            });
        }
    }, [mode, initialData]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <div className="card">
            <div className="card-header">
                <h3 className="card-title">
                    {mode === 'create' ? 'Create New Branch' : 'Edit Branch'}
                </h3>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="card-body">
                    {error && <ErrorAlert error={error} />}

                    {mode === 'create' && (
                        <div className="alert alert-info d-flex align-items-center mb-6">
                            <i className="ki-duotone ki-information-2 fs-2x me-3">
                                <span className="path1"></span>
                                <span className="path2"></span>
                                <span className="path3"></span>
                            </i>
                            <div className="d-flex flex-column">
                                <h5 className="mb-1">Branch Request</h5>
                                <span>Your branch request will be submitted for admin approval. You'll be notified once it's reviewed.</span>
                            </div>
                        </div>
                    )}

                    {/* Branch Name */}
                    <div className="mb-6">
                        <label className="form-label required">Branch Name</label>
                        <input
                            type="text"
                            name="name"
                            className="form-control"
                            placeholder="Enter branch name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            disabled={loading}
                        />
                        <div className="form-text">Enter a unique name for this branch</div>
                    </div>

                    {/* Address */}
                    <div className="mb-6">
                        <label className="form-label">Address</label>
                        <textarea
                            name="address"
                            className="form-control"
                            rows="3"
                            placeholder="Enter branch address"
                            value={formData.address}
                            onChange={handleChange}
                            disabled={loading}
                        />
                        <div className="form-text">Enter the full address of the branch</div>
                    </div>

                    {/* Status - Only show in edit mode */}
                    {mode === 'edit' && (
                        <div className="mb-6">
                            <label className="form-label">Status</label>
                            <div className="form-check form-switch">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    name="is_active"
                                    id="is_active"
                                    checked={formData.is_active}
                                    onChange={handleChange}
                                    disabled={loading}
                                />
                                <label className="form-check-label" htmlFor="is_active">
                                    {formData.is_active ? 'Active' : 'Inactive'}
                                </label>
                            </div>
                            <div className="form-text">
                                {formData.is_active 
                                    ? 'This branch is currently active' 
                                    : 'This branch is currently inactive'}
                            </div>
                        </div>
                    )}
                </div>

                <div className="card-footer d-flex justify-content-end gap-2">
                    <button 
                        type="button"
                        onClick={() => window.history.back()}
                        className="btn btn-light"
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
                                {mode === 'create' ? 'Creating...' : 'Updating...'}
                            </>
                        ) : (
                            <>
                                <i className="ki-duotone ki-check fs-2">
                                    <span className="path1"></span>
                                    <span className="path2"></span>
                                </i>
                                {mode === 'create' ? 'Submit Request' : 'Update Branch'}
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default BranchForm;



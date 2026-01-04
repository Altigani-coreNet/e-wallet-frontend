import React from 'react';

const WarehouseForm = ({ formData, setFormData, errors = {}, isSubmitting = false }) => {
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    return (
        <div className="row">
            {/* Name */}
            <div className="col-md-6 mb-3">
                <label className="form-label required">Name</label>
                <input
                    type="text"
                    name="name"
                    className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                    value={formData.name || ''}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    required
                />
                {errors.name && (
                    <div className="invalid-feedback">{errors.name}</div>
                )}
            </div>

            {/* Phone */}
            <div className="col-md-6 mb-3">
                <label className="form-label">Phone</label>
                <input
                    type="text"
                    name="phone"
                    className={`form-control ${errors.phone ? 'is-invalid' : ''}`}
                    value={formData.phone || ''}
                    onChange={handleChange}
                    disabled={isSubmitting}
                />
                {errors.phone && (
                    <div className="invalid-feedback">{errors.phone}</div>
                )}
            </div>

            {/* Email */}
            <div className="col-md-6 mb-3">
                <label className="form-label">Email</label>
                <input
                    type="email"
                    name="email"
                    className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                    value={formData.email || ''}
                    onChange={handleChange}
                    disabled={isSubmitting}
                />
                {errors.email && (
                    <div className="invalid-feedback">{errors.email}</div>
                )}
            </div>

            {/* City */}
            <div className="col-md-6 mb-3">
                <label className="form-label required">City</label>
                <input
                    type="text"
                    name="city"
                    className={`form-control ${errors.city ? 'is-invalid' : ''}`}
                    value={formData.city || ''}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    required
                />
                {errors.city && (
                    <div className="invalid-feedback">{errors.city}</div>
                )}
            </div>

            {/* Address */}
            <div className="col-md-12 mb-3">
                <label className="form-label required">Address</label>
                <textarea
                    name="address"
                    className={`form-control ${errors.address ? 'is-invalid' : ''}`}
                    value={formData.address || ''}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    rows="3"
                    required
                />
                {errors.address && (
                    <div className="invalid-feedback">{errors.address}</div>
                )}
            </div>
        </div>
    );
};

export default WarehouseForm;




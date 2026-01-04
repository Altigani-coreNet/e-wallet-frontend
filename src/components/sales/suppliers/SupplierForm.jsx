import React from 'react';

const SupplierForm = ({ formData, onChange, errors, onSubmit, isSubmitting, isEdit = false }) => {
    const handleChange = (e) => {
        const { name, value } = e.target;
        onChange({ ...formData, [name]: value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit();
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">{isEdit ? 'Edit' : 'Create'} Supplier</h3>
                </div>
                <div className="card-body">
                    <div className="row g-4">
                        {/* Name */}
                        <div className="col-md-6">
                            <label className="form-label required">Supplier Name</label>
                            <input
                                type="text"
                                name="name"
                                className={`form-control form-control-solid ${errors.name ? 'is-invalid' : ''}`}
                                placeholder="Enter supplier name"
                                value={formData.name || ''}
                                onChange={handleChange}
                                required
                            />
                            {errors.name && (
                                <div className="invalid-feedback">{errors.name[0]}</div>
                            )}
                        </div>

                        {/* Company Name */}
                        <div className="col-md-6">
                            <label className="form-label">Company Name</label>
                            <input
                                type="text"
                                name="company_name"
                                className={`form-control form-control-solid ${errors.company_name ? 'is-invalid' : ''}`}
                                placeholder="Enter company name"
                                value={formData.company_name || ''}
                                onChange={handleChange}
                            />
                            {errors.company_name && (
                                <div className="invalid-feedback">{errors.company_name[0]}</div>
                            )}
                        </div>

                        {/* Email */}
                        <div className="col-md-6">
                            <label className="form-label required">Email</label>
                            <input
                                type="email"
                                name="email"
                                className={`form-control form-control-solid ${errors.email ? 'is-invalid' : ''}`}
                                placeholder="Enter email address"
                                value={formData.email || ''}
                                onChange={handleChange}
                                required
                            />
                            {errors.email && (
                                <div className="invalid-feedback">{errors.email[0]}</div>
                            )}
                        </div>

                        {/* Phone Number */}
                        <div className="col-md-6">
                            <label className="form-label required">Phone Number</label>
                            <input
                                type="text"
                                name="phone_number"
                                className={`form-control form-control-solid ${errors.phone_number ? 'is-invalid' : ''}`}
                                placeholder="Enter phone number"
                                value={formData.phone_number || ''}
                                onChange={handleChange}
                                required
                            />
                            {errors.phone_number && (
                                <div className="invalid-feedback">{errors.phone_number[0]}</div>
                            )}
                        </div>

                        {/* VAT Number */}
                        <div className="col-md-6">
                            <label className="form-label">VAT Number</label>
                            <input
                                type="text"
                                name="vat_number"
                                className={`form-control form-control-solid ${errors.vat_number ? 'is-invalid' : ''}`}
                                placeholder="Enter VAT number"
                                value={formData.vat_number || ''}
                                onChange={handleChange}
                            />
                            {errors.vat_number && (
                                <div className="invalid-feedback">{errors.vat_number[0]}</div>
                            )}
                        </div>

                        {/* Address */}
                        <div className="col-md-12">
                            <label className="form-label">Address</label>
                            <textarea
                                name="address"
                                className={`form-control form-control-solid ${errors.address ? 'is-invalid' : ''}`}
                                placeholder="Enter address"
                                rows="3"
                                value={formData.address || ''}
                                onChange={handleChange}
                            />
                            {errors.address && (
                                <div className="invalid-feedback">{errors.address[0]}</div>
                            )}
                        </div>

                        {/* City */}
                        <div className="col-md-4">
                            <label className="form-label">City</label>
                            <input
                                type="text"
                                name="city"
                                className={`form-control form-control-solid ${errors.city ? 'is-invalid' : ''}`}
                                placeholder="Enter city"
                                value={formData.city || ''}
                                onChange={handleChange}
                            />
                            {errors.city && (
                                <div className="invalid-feedback">{errors.city[0]}</div>
                            )}
                        </div>

                        {/* State */}
                        <div className="col-md-4">
                            <label className="form-label">State/Province</label>
                            <input
                                type="text"
                                name="state"
                                className={`form-control form-control-solid ${errors.state ? 'is-invalid' : ''}`}
                                placeholder="Enter state"
                                value={formData.state || ''}
                                onChange={handleChange}
                            />
                            {errors.state && (
                                <div className="invalid-feedback">{errors.state[0]}</div>
                            )}
                        </div>

                        {/* Postal Code */}
                        <div className="col-md-4">
                            <label className="form-label">Postal Code</label>
                            <input
                                type="text"
                                name="postal_code"
                                className={`form-control form-control-solid ${errors.postal_code ? 'is-invalid' : ''}`}
                                placeholder="Enter postal code"
                                value={formData.postal_code || ''}
                                onChange={handleChange}
                            />
                            {errors.postal_code && (
                                <div className="invalid-feedback">{errors.postal_code[0]}</div>
                            )}
                        </div>

                        {/* Country */}
                        <div className="col-md-6">
                            <label className="form-label">Country</label>
                            <input
                                type="text"
                                name="country"
                                className={`form-control form-control-solid ${errors.country ? 'is-invalid' : ''}`}
                                placeholder="Enter country"
                                value={formData.country || ''}
                                onChange={handleChange}
                            />
                            {errors.country && (
                                <div className="invalid-feedback">{errors.country[0]}</div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="card-footer d-flex justify-content-end">
                    <button 
                        type="submit" 
                        className="btn btn-primary"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2"></span>
                                Saving...
                            </>
                        ) : (
                            isEdit ? 'Update Supplier' : 'Create Supplier'
                        )}
                    </button>
                </div>
            </div>
        </form>
    );
};

export default SupplierForm;


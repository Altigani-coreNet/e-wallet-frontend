import React from 'react';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

const AccountDetails = ({ formData, setFormData, fieldErrors }) => {
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(name, value);
    };

    return (
        <div className="current" data-kt-stepper-element="content">
            <div className="w-full ">
                <div className="pb-10 pb-lg-15">
                    <h2 className="fw-bolder d-flex align-items-center text-dark">
                        Enter Account Details
                        <i className="fas fa-exclamation-circle ms-2 fs-7"
                           data-bs-toggle="tooltip"
                           title="Billing is issued based on your selected account type">
                        </i> 
                    </h2>
                    <div className="text-muted fw-bold fs-6">
                        If you need more info, please check out
                        <a href="#" className="link-primary fw-bolder"> Help Page</a>.
                    </div>
                </div>

                <div className="fv-row">
                    <div className="row">
                        <input value="1" name="nationality" type="hidden" />
                        
                        <div className="col-md-6 mb-4">
                            <label htmlFor="email" className="form-label">Email</label>
                            <input
                                type="email"
                                className={`form-control ${fieldErrors.email ? 'is-invalid' : ''}`}
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="Enter email"
                                style={{ textTransform: 'none' }}
                            />
                            {fieldErrors.email && (
                                <div className="invalid-feedback">
                                    {fieldErrors.email[0]}
                                </div>
                            )}
                        </div>

                        <div className="col-md-6 mb-4">
                            <label htmlFor="phone" className="form-label">Phone</label>
                            <div className={`form-control p-0 ${fieldErrors.phone ? 'is-invalid' : ''}`}>
                                <PhoneInput
                                    country={"ae"}
                                    inputProps={{ id: 'phone', name: 'phone', required: true }}
                                    value={(formData.phone || '').replace(/^\+/, '')}
                                    onChange={(value) => {
                                        const e164 = value ? `+${value}` : '';
                                        setFormData('phone', e164);
                                    }}
                                    containerClass={"w-100"}
                                    containerStyle={{ width: '100%' }}
                                    inputClass={"border-0 w-100"}
                                    inputStyle={{ width: '100%', height: 'calc(1.5em + 1rem + 6px)' }}
                                    placeholder="Enter phone number"
                                    specialLabel=""
                                />
                            </div>
                            {fieldErrors.phone && (
                                <div className="invalid-feedback">
                                    {fieldErrors.phone[0]}
                                </div>
                            )}
                        </div>

                        <div className="col-md-6 mb-4">
                            <label htmlFor="first_name" className="form-label">First Name</label>
                            <input
                                type="text"
                                className={`form-control ${fieldErrors.first_name ? 'is-invalid' : ''}`}
                                id="first_name"
                                name="first_name"
                                value={formData.first_name}
                                onChange={handleChange}
                                placeholder="Enter first name"
                                style={{ textTransform: 'none' }}
                            />
                            {fieldErrors.first_name && (
                                <div className="invalid-feedback">
                                    {fieldErrors.first_name[0]}
                                </div>
                            )}
                        </div>

                        <div className="col-md-6 mb-4">
                            <label htmlFor="last_name" className="form-label">Last Name</label>
                            <input
                                type="text"
                                className={`form-control ${fieldErrors.last_name ? 'is-invalid' : ''}`}
                                id="last_name"
                                name="last_name"
                                value={formData.last_name}
                                onChange={handleChange}
                                placeholder="Enter last name"
                                style={{ textTransform: 'none' }}
                            />
                            {fieldErrors.last_name && (
                                <div className="invalid-feedback">
                                    {fieldErrors.last_name[0]}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AccountDetails;


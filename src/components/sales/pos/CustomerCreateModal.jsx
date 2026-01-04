import React, { useState, useEffect } from 'react';
import usePosStore from '../../../stores/usePosStore';
import { apiPost } from '../../../utils/apiUtils';
import { POS_ENDPOINTS } from '../../../utils/constants';

const CustomerCreateModal = ({ isOpen, onClose, onCustomerCreated }) => {
    const { 
        fetchCustomers, 
        fetchCustomerGroups, 
        customerGroups, 
        customerGroupsLoading 
    } = usePosStore();
    
    // Fetch customer groups when modal opens
    useEffect(() => {
        if (isOpen) {
            fetchCustomerGroups();
        }
    }, [isOpen, fetchCustomerGroups]);
    
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone_number: '',
        address: '',
        company_name: '',
        tax_no: '',
        city: '',
        state: '',
        postal_code: '',
        country: '',
        customer_group_id: '',
        deposit: 0,
        expense: 0
    });
    
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.name.trim()) {
            newErrors.name = 'Name is required';
        }
        
        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email is invalid';
        }
        
        if (!formData.address.trim()) {
            newErrors.address = 'Address is required';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }
        
        setLoading(true);
        
        try {
            const response = await apiPost(POS_ENDPOINTS.CUSTOMERS, formData);
            
            if (response.success) {
                const newCustomer = response.data.data?.customer;
                if (newCustomer) {
                    onCustomerCreated(newCustomer);
                    await fetchCustomers();
                }
                handleClose();
            } else {
                if (response.validationErrors) {
                    setErrors(response.validationErrors);
                } else {
                    setErrors({ general: response.error || 'Failed to create customer' });
                }
            }
        } catch (error) {
            console.error('Customer creation error:', error);
            setErrors({ general: 'Failed to create customer. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFormData({
            name: '',
            email: '',
            phone_number: '',
            address: '',
            company_name: '',
            tax_no: '',
            city: '',
            state: '',
            postal_code: '',
            country: '',
            customer_group_id: '',
        });
        setErrors({});
        setLoading(false);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Modal Backdrop */}
            <div className="modal-backdrop fade show"></div>
            
            <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
                <div className="modal-dialog modal-lg modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">Add New Customer</h5>
                            <button 
                                type="button" 
                                className="btn-close" 
                                onClick={handleClose}
                                disabled={loading}
                            ></button>
                        </div>
                        
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                {errors.general && (
                                    <div className="alert alert-danger">
                                        {errors.general}
                                    </div>
                                )}
                                
                                <div className="row">
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">Customer Group</label>
                                        <select 
                                            name="customer_group_id"
                                            className={`form-select ${errors.customer_group_id ? 'is-invalid' : ''}`}
                                            value={formData.customer_group_id}
                                            onChange={handleInputChange}
                                            disabled={customerGroupsLoading}
                                        >
                                            <option value="">Select Customer Group</option>
                                            {customerGroups.map((group) => (
                                                <option key={group.id} value={group.id}>
                                                    {group.name}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.customer_group_id && (
                                            <div className="invalid-feedback">{errors.customer_group_id}</div>
                                        )}
                                    </div>
                                    
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label required">Name</label>
                                        <input 
                                            type="text" 
                                            name="name"
                                            className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            required
                                        />
                                        {errors.name && (
                                            <div className="invalid-feedback">{errors.name}</div>
                                        )}
                                    </div>

                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">Company Name</label>
                                        <input 
                                            type="text" 
                                            name="company_name"
                                            className={`form-control ${errors.company_name ? 'is-invalid' : ''}`}
                                            value={formData.company_name}
                                            onChange={handleInputChange}
                                        />
                                        {errors.company_name && (
                                            <div className="invalid-feedback">{errors.company_name}</div>
                                        )}
                                    </div>

                                    <div className="col-md-6 mb-3">
                                        <label className="form-label required">Email</label>
                                        <input 
                                            type="email" 
                                            name="email"
                                            className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            required
                                        />
                                        {errors.email && (
                                            <div className="invalid-feedback">{errors.email}</div>
                                        )}
                                    </div>

                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">Phone</label>
                                        <input 
                                            type="text" 
                                            name="phone_number"
                                            className={`form-control ${errors.phone_number ? 'is-invalid' : ''}`}
                                            value={formData.phone_number}
                                            onChange={handleInputChange}
                                        />
                                        {errors.phone_number && (
                                            <div className="invalid-feedback">{errors.phone_number}</div>
                                        )}
                                    </div>

                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">Tax No</label>
                                        <input 
                                            type="text" 
                                            name="tax_no"
                                            className={`form-control ${errors.tax_no ? 'is-invalid' : ''}`}
                                            value={formData.tax_no}
                                            onChange={handleInputChange}
                                        />
                                        {errors.tax_no && (
                                            <div className="invalid-feedback">{errors.tax_no}</div>
                                        )}
                                    </div>

                                    <div className="col-md-6 mb-3">
                                        <label className="form-label required">Address</label>
                                        <input 
                                            type="text" 
                                            name="address"
                                            className={`form-control ${errors.address ? 'is-invalid' : ''}`}
                                            value={formData.address}
                                            onChange={handleInputChange}
                                            required
                                        />
                                        {errors.address && (
                                            <div className="invalid-feedback">{errors.address}</div>
                                        )}
                                    </div>

                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">City</label>
                                        <input 
                                            type="text" 
                                            name="city"
                                            className={`form-control ${errors.city ? 'is-invalid' : ''}`}
                                            value={formData.city}
                                            onChange={handleInputChange}
                                        />
                                        {errors.city && (
                                            <div className="invalid-feedback">{errors.city}</div>
                                        )}
                                    </div>

                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">State</label>
                                        <input 
                                            type="text" 
                                            name="state"
                                            className={`form-control ${errors.state ? 'is-invalid' : ''}`}
                                            value={formData.state}
                                            onChange={handleInputChange}
                                        />
                                        {errors.state && (
                                            <div className="invalid-feedback">{errors.state}</div>
                                        )}
                                    </div>

                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">Postal Code</label>
                                        <input 
                                            type="text" 
                                            name="postal_code"
                                            className={`form-control ${errors.postal_code ? 'is-invalid' : ''}`}
                                            value={formData.postal_code}
                                            onChange={handleInputChange}
                                        />
                                        {errors.postal_code && (
                                            <div className="invalid-feedback">{errors.postal_code}</div>
                                        )}
                                    </div>

                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">Country</label>
                                        <input 
                                            type="text" 
                                            name="country"
                                            className={`form-control ${errors.country ? 'is-invalid' : ''}`}
                                            value={formData.country}
                                            onChange={handleInputChange}
                                        />
                                        {errors.country && (
                                            <div className="invalid-feedback">{errors.country}</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="modal-footer">
                                <button 
                                    type="button" 
                                    className="btn btn-light" 
                                    onClick={handleClose}
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
                                            <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                            Creating...
                                        </>
                                    ) : (
                                        'Create Customer'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
};

export default CustomerCreateModal;


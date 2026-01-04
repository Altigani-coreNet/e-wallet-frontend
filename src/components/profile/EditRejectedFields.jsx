import React, { useState, useEffect } from 'react';
import { getRejectedFields, updateRejectedFields } from '../../services/profileService';
import { toast } from 'react-toastify';

/**
 * EditRejectedFields Component
 * 
 * This component allows merchants to edit only the fields that were rejected during approval.
 * It fetches rejection details and displays only the rejected fields for editing.
 */
const EditRejectedFields = ({ merchant, onSuccess, onCancel }) => {
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [rejection, setRejection] = useState(null);
    const [attachments, setAttachments] = useState({});
    const [formData, setFormData] = useState({});
    const [files, setFiles] = useState({});
    const [errors, setErrors] = useState({});

    useEffect(() => {
        fetchRejectedFields();
    }, []);

    const fetchRejectedFields = async () => {
        try {
            setLoading(true);
            const response = await getRejectedFields();
            
            console.log('✅ Rejected fields response:', response);
            
            if (response.success) {
                const { merchant: merchantData, rejection: rejectionData, attachments: attachmentsData } = response.data;
                
                console.log('Rejection data:', rejectionData);
                console.log('Attachments:', attachmentsData);
                
                setRejection(rejectionData);
                setAttachments(attachmentsData);
                
                // Initialize form data with current merchant values for rejected fields
                // Use merchant prop first, fallback to API data
                const merchantToUse = merchant || merchantData;
                const initialData = {};
                rejectionData.invalid_fields?.forEach(field => {
                    initialData[field] = merchantToUse[field] || '';
                });
                setFormData(initialData);
                
                console.log('Form data initialized:', initialData);
            }
        } catch (error) {
            console.error('Failed to fetch rejected fields:', error);
            toast.error('Failed to load rejection details. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const handleFileChange = (e) => {
        const { name, files: fileList } = e.target;
        if (fileList.length > 0) {
            setFiles(prev => ({ ...prev, [name]: fileList[0] }));
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setErrors({});

        try {
            const response = await updateRejectedFields(formData, files);

            if (response.success) {
                toast.success(response.message || 'Profile updated successfully!');
                if (onSuccess) onSuccess(response.data);
            }
        } catch (error) {
            console.error('Failed to update rejected fields:', error);
            
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
                toast.error('Please fix the errors and try again.');
            } else {
                const errorMsg = error.response?.data?.message || 'Failed to update profile. Please try again.';
                toast.error(errorMsg);
            }
        } finally {
            setSubmitting(false);
        }
    };

    const getFieldLabel = (field) => {
        const labels = {
            name: 'Merchant Name',
            owner_name: 'Owner Name',
            email: 'Email',
            phone: 'Phone',
            business_type: 'Business Type',
            address: 'Address',
            trade_license_number: 'Trade License Number',
            tax_certified_number: 'Tax Number',
            country_id: 'Country',
            city_id: 'City',
        };
        return labels[field] || field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    const getAttachmentLabel = (attachment) => {
        const labels = {
            company_logo: 'Company Logo',
            tax_certification: 'Tax Certificate',
            trade_license: 'Trade License',
            user_id_document: 'ID Document',
        };
        return labels[attachment] || attachment.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    if (!rejection) {
        return (
            <div className="row">
                <div className="col-lg-12">
                    <div className="alert alert-warning d-flex align-items-center p-5">
                        <i className="ki-duotone ki-information-5 fs-2hx text-warning me-4">
                            <span className="path1"></span>
                            <span className="path2"></span>
                            <span className="path3"></span>
                        </i>
                        <div className="d-flex flex-column">
                            <h4 className="mb-1 text-warning">No Rejection Information</h4>
                            <span>No rejection information found for this merchant.</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="row">
            <div className="col-lg-12">
                <div className="card mb-5 mb-xl-10">
                    <div className="card-header border-0 cursor-pointer">
                        <div className="card-title m-0">
                            <h3 className="fw-bolder m-0">Edit Rejected Fields</h3>
                        </div>
                        <div className="card-toolbar">
                            <button
                                type="button"
                                onClick={onCancel}
                                className="btn btn-sm btn-light"
                                disabled={submitting}
                            >
                                <i className="ki-duotone ki-cross fs-2">
                                    <span className="path1"></span>
                                    <span className="path2"></span>
                                </i>
                                Cancel
                            </button>
                        </div>
                    </div>

                    <div className="card-body border-top p-9">
                        {/* Rejection Reason Alert */}
                        <div className="alert alert-danger d-flex align-items-center p-5 mb-10">
                            <i className="ki-duotone ki-information-5 fs-2hx text-danger me-4">
                                <span className="path1"></span>
                                <span className="path2"></span>
                                <span className="path3"></span>
                            </i>
                            <div className="d-flex flex-column">
                                <h4 className="mb-1 text-danger">Rejection Reason</h4>
                                <span>{rejection.rejection_reason || 'No reason provided'}</span>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit}>
                            {/* Invalid Fields Section */}
                            {rejection.invalid_fields && rejection.invalid_fields.length > 0 && (
                                <div className="mb-10">
                                    <h3 className="fw-bolder mb-6">Rejected Fields</h3>
                                    
                                    {rejection.invalid_fields.map(field => (
                                        <div key={field} className="row mb-6">
                                            <label className="col-lg-3 col-form-label required fw-bold fs-6">
                                                {getFieldLabel(field)}
                                            </label>
                                            <div className="col-lg-9 fv-row">
                                                {field === 'address' ? (
                                                    <textarea
                                                        name={field}
                                                        className={`form-control form-control-lg form-control-solid ${errors[field] ? 'is-invalid' : ''}`}
                                                        rows="3"
                                                        value={formData[field] || ''}
                                                        onChange={handleInputChange}
                                                        required
                                                    ></textarea>
                                                ) : (
                                                    <input
                                                        type={field === 'email' ? 'email' : 'text'}
                                                        name={field}
                                                        className={`form-control form-control-lg form-control-solid ${errors[field] ? 'is-invalid' : ''}`}
                                                        value={formData[field] || ''}
                                                        onChange={handleInputChange}
                                                        required
                                                    />
                                                )}
                                                {errors[field] && (
                                                    <div className="invalid-feedback">{errors[field][0]}</div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Missing Attachments Section */}
                            {rejection.missing_attachments && rejection.missing_attachments.length > 0 && (
                                <div className="mb-10">
                                    <h3 className="fw-bolder mb-6">Missing Attachments</h3>
                                    
                                    {rejection.missing_attachments.map(attachment => (
                                        <div key={attachment} className="row mb-6">
                                            <label className="col-lg-3 col-form-label required fw-bold fs-6">
                                                {getAttachmentLabel(attachment)}
                                            </label>
                                            <div className="col-lg-9 fv-row">
                                                <input
                                                    type="file"
                                                    name={attachment}
                                                    className={`form-control form-control-lg form-control-solid ${errors[attachment] ? 'is-invalid' : ''}`}
                                                    onChange={handleFileChange}
                                                    accept="image/*"
                                                />
                                                {errors[attachment] && (
                                                    <div className="invalid-feedback">{errors[attachment][0]}</div>
                                                )}
                                                {attachments[attachment.replace('_document', '').replace('certification', 'certificate')] && (
                                                    <div className="form-text">
                                                        Current: {attachments[attachment.replace('_document', '').replace('certification', 'certificate')].split('/').pop()}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="card-footer d-flex justify-content-end py-6 px-9">
                                <button
                                    type="button"
                                    onClick={onCancel}
                                    className="btn btn-light btn-active-light-primary me-2"
                                    disabled={submitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={submitting}
                                >
                                    {submitting ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                            Updating...
                                        </>
                                    ) : (
                                        'Update Profile'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditRejectedFields;


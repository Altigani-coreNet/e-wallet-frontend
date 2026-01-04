import React from 'react';
import FilePondUpload from './FilePondUpload';

const BusinessDocuments = ({ formData, setFormData, fieldErrors = {} }) => {
    // Generate a temporary merchant code for file uploads
    // In a real scenario, this would come from the merchant registration process
    const merchantCode = formData.merchant_code || `temp_${Date.now()}`;

    const handleUploadSuccess = (serverData, file) => {
        console.log('File uploaded successfully:', serverData);
        // You can add additional success handling here
    };

    const handleUploadError = (error) => {
        console.error('File upload error:', error);
        // You can add additional error handling here
    };
    
    return (
        <div className="w-100">
            <div className="pb-10 pb-lg-15">
                <h2 className="fw-bolder text-dark">Business Documents</h2>
                <div className="text-muted fw-bold fs-6">
                    If you need more info, please check out
                    <a href="#" className="link-primary fw-bolder"> Help Page</a>.
                </div>
            </div>

            <div className="row">
                <div className="col-md-6 mb-4">
                    <FilePondUpload
                        title="Company Logo"
                        name="company_logo"
                        accept=".jpg,.jpeg,.png,.gif"
                        formData={formData}
                        setFormData={setFormData}
                        merchantCode={merchantCode}
                        fieldErrors={fieldErrors}
                        onUploadSuccess={handleUploadSuccess}
                        onUploadError={handleUploadError}
                        maxSize={5 * 1024 * 1024} // 5MB for images
                        isImage={true}
                    />
                </div>

                <div className="col-md-6 mb-4">
                    <FilePondUpload
                        title="Trade License"
                        name="trade_license"
                        accept=".pdf,.jpg,.jpeg,.png"
                        formData={formData}
                        setFormData={setFormData}
                        merchantCode={merchantCode}
                        fieldErrors={fieldErrors}
                        onUploadSuccess={handleUploadSuccess}
                        onUploadError={handleUploadError}
                        maxSize={10 * 1024 * 1024} // 10MB for documents
                        isImage={false}
                    />
                </div>

                <div className="col-md-6 mb-4">
                    <FilePondUpload
                        title="Tax Certification"
                        name="tax_certification"
                        accept=".pdf,.jpg,.jpeg,.png"
                        formData={formData}
                        setFormData={setFormData}
                        merchantCode={merchantCode}
                        fieldErrors={fieldErrors}
                        onUploadSuccess={handleUploadSuccess}
                        onUploadError={handleUploadError}
                        maxSize={10 * 1024 * 1024} // 10MB for documents
                        isImage={false}
                    />
                </div>

                <div className="col-md-6 mb-4">
                    <FilePondUpload
                        title="User ID Document"
                        name="user_id_document"
                        accept=".pdf,.jpg,.jpeg,.png"
                        formData={formData}
                        setFormData={setFormData}
                        merchantCode={merchantCode}
                        fieldErrors={fieldErrors}
                        onUploadSuccess={handleUploadSuccess}
                        onUploadError={handleUploadError}
                        maxSize={10 * 1024 * 1024} // 10MB for documents
                        isImage={false}
                    />
                </div>
            </div>
        </div>
    );
};

export default BusinessDocuments;


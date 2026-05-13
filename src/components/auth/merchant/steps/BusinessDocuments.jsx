import React from 'react';
import { useTranslation } from 'react-i18next';
import FilePondUpload from './FilePondUpload';

const BusinessDocuments = ({ formData, setFormData, fieldErrors = {} }) => {
    const { t } = useTranslation();
    const merchantCode = formData.merchant_code || `temp_${Date.now()}`;

    const handleUploadSuccess = (serverData, file) => {
        console.log('File uploaded successfully:', serverData);
    };

    const handleUploadError = (error) => {
        console.error('File upload error:', error);
    };

    return (
        <div className="w-100">
            <div className="pb-10 pb-lg-15">
                <h2 className="fw-bolder text-dark">{t('auth.businessDocuments.title')}</h2>
                <div className="text-muted fw-bold fs-6">
                    {t('auth.businessDocuments.helpLead')}{' '}
                    <a href="#" className="link-primary fw-bolder">
                        {t('auth.common.helpPage')}
                    </a>
                    .
                </div>
            </div>

            <div className="row">
                <div className="col-md-6 mb-4">
                    <FilePondUpload
                        title={t('auth.businessDocuments.companyLogo')}
                        name="company_logo"
                        accept=".jpg,.jpeg,.png,.gif"
                        formData={formData}
                        setFormData={setFormData}
                        merchantCode={merchantCode}
                        fieldErrors={fieldErrors}
                        onUploadSuccess={handleUploadSuccess}
                        onUploadError={handleUploadError}
                        maxSize={5 * 1024 * 1024}
                        isImage={true}
                    />
                </div>

                <div className="col-md-6 mb-4">
                    <FilePondUpload
                        title={t('auth.businessDocuments.tradeLicense')}
                        name="trade_license"
                        accept=".pdf"
                        formData={formData}
                        setFormData={setFormData}
                        merchantCode={merchantCode}
                        fieldErrors={fieldErrors}
                        onUploadSuccess={handleUploadSuccess}
                        onUploadError={handleUploadError}
                        maxSize={10 * 1024 * 1024}
                        isImage={false}
                    />
                </div>

                <div className="col-md-6 mb-4">
                    <FilePondUpload
                        title={t('auth.businessDocuments.taxCertification')}
                        name="tax_certification"
                        accept=".pdf"
                        formData={formData}
                        setFormData={setFormData}
                        merchantCode={merchantCode}
                        fieldErrors={fieldErrors}
                        onUploadSuccess={handleUploadSuccess}
                        onUploadError={handleUploadError}
                        maxSize={10 * 1024 * 1024}
                        isImage={false}
                    />
                </div>

                <div className="col-md-6 mb-4">
                    <FilePondUpload
                        title={t('auth.businessDocuments.userIdDocument')}
                        name="user_id_document"
                        accept=".pdf"
                        formData={formData}
                        setFormData={setFormData}
                        merchantCode={merchantCode}
                        fieldErrors={fieldErrors}
                        onUploadSuccess={handleUploadSuccess}
                        onUploadError={handleUploadError}
                        maxSize={10 * 1024 * 1024}
                        isImage={false}
                    />
                </div>
            </div>
        </div>
    );
};

export default BusinessDocuments;

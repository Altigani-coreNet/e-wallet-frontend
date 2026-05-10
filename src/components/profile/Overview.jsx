import React, { useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

const Overview = ({ user, merchant, merchantCompletion, logs, onEditClick }) => {
    const { t, i18n } = useTranslation();

    const formatDateTime = useCallback(
        (value) => {
            if (!value) return t('merchant.profile.na');
            const loc = (i18n.language || 'en').toLowerCase().startsWith('ar') ? 'ar-SA' : 'en-US';
            return new Date(value).toLocaleDateString(loc, {
                month: 'short',
                day: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        },
        [i18n.language, t]
    );

    const merchantStatusLabel = (status) => {
        const key = {
            pending: 'merchant.profile.statusPending',
            approved: 'merchant.profile.statusApproved',
            rejected: 'merchant.profile.statusRejected',
            suspended: 'merchant.profile.statusSuspended',
            viewed: 'merchant.profile.statusViewed',
            requesting_updated: 'merchant.profile.statusRequestingUpdated',
        }[status];
        return key ? t(key) : t('merchant.profile.statusPending');
    };
    useEffect(() => {
        console.log('=== Overview Component Props ===');
        console.log('User:', user);
        console.log('Merchant:', merchant);
        console.log('Merchant Completion:', merchantCompletion);
        console.log('Logs:', logs);
        console.log('===============================');
    }, [user, merchant, merchantCompletion, logs]);

    const handleEditClick = (e) => {
        e.preventDefault();
        if (onEditClick) {
            // Determine which edit mode based on merchant status
            if (merchant?.status === 'rejected') {
                onEditClick('edit-rejected');
            } else {
                onEditClick('edit');
            }
        }
    };

    return (
        <div className="row">
            {/* Merchant Basic Information */}
            <div className="col-lg-12">
                <div className="card mb-5 mb-xl-10" id="kt_merchant_basic_details">
                    <div className="card-header cursor-pointer">
                        <div className="card-title m-0">
                            <h3 className="fw-bolder m-0">{t('merchant.profile.basicInformation')}</h3>
                        </div>
                        <div className="card-toolbar">
                            <button 
                                onClick={handleEditClick}
                                className="btn btn-sm btn-primary"
                            >
                                <i className="ki-duotone ki-pencil fs-2">
                                    <span className="path1"></span>
                                    <span className="path2"></span>
                                </i>
                                {t('merchant.profile.edit')}
                            </button>
                        </div>
                    </div>
                    
                    <div className="card-body p-9">
                        <div className="row mb-7">
                            <label className="col-lg-4 fw-bold text-muted">{t('merchant.profile.businessName')}</label>
                            <div className="col-lg-8">
                                <span className="fw-bolder fs-6 text-gray-800">
                                    {merchant?.name || t('merchant.profile.na')}
                                </span>
                            </div>
                        </div>

                        <div className="row mb-7">
                            <label className="col-lg-4 fw-bold text-muted">{t('merchant.profile.ownerName')}</label>
                            <div className="col-lg-8">
                                <span className="fw-bolder fs-6 text-gray-800">
                                    {merchant?.owner_name || t('merchant.profile.na')}
                                </span>
                            </div>
                        </div>

                        <div className="row mb-7">
                            <label className="col-lg-4 fw-bold text-muted">{t('merchant.profile.fieldMerchantEmail')}</label>
                            <div className="col-lg-8">
                                <span className="fw-bolder fs-6 text-gray-800">
                                    {merchant?.email || t('merchant.profile.na')}
                                </span>
                            </div>
                        </div>

                        <div className="row mb-7">
                            <label className="col-lg-4 fw-bold text-muted">{t('merchant.profile.fieldMerchantPhone')}</label>
                            <div className="col-lg-8">
                                <span className="fw-bolder fs-6 text-gray-800">
                                    {merchant?.phone || t('merchant.profile.na')}
                                </span>
                            </div>
                        </div>

                        <div className="row mb-7">
                            <label className="col-lg-4 fw-bold text-muted">Business Type</label>
                            <div className="col-lg-8">
                                <span className="fw-bolder fs-6 text-gray-800">
                                    {merchant?.business_type || 'N/A'}
                                </span>
                            </div>
                        </div>

                        <div className="row mb-7">
                            <label className="col-lg-4 fw-bold text-muted">{t('merchant.profile.merchantCode')}</label>
                            <div className="col-lg-8">
                                <span className="badge badge-light-primary fs-6">
                                    {merchant?.merchant_code || t('merchant.profile.na')}
                                </span>
                            </div>
                        </div>

                        <div className="row mb-7">
                            <label className="col-lg-4 fw-bold text-muted">{t('merchant.profile.fieldMerchantAddress')}</label>
                            <div className="col-lg-8">
                                <span className="fw-bolder fs-6 text-gray-800">
                                    {merchant?.address || t('merchant.profile.na')}
                                </span>
                            </div>
                        </div>

                        <div className="row mb-7">
                            <label className="col-lg-4 fw-bold text-muted">Merchant Status</label>
                            <div className="col-lg-8">
                                <span className={`badge badge-light-${
                                    merchant?.status === 'approved' ? 'success' : 
                                    merchant?.status === 'rejected' ? 'danger' : 
                                    'warning'
                                }`}>
                                    {merchant?.status || 'pending'}
                                </span>
                            </div>
                        </div>

                        <div className="row mb-7">
                            <label className="col-lg-4 fw-bold text-muted">{t('merchant.profile.createdDate')}</label>
                            <div className="col-lg-8">
                                <span className="fw-bolder fs-6 text-gray-800">
                                    {formatDateTime(merchant?.created_at)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* User Account Details & Events */}
            {user && (
                <div className="row">
                    <div className="col-lg-8">
                        <div className="card mb-5 mb-xl-10" id="kt_merchant_user_details">
                            <div className="card-header cursor-pointer">
                                <div className="card-title m-0">
                                    <h3 className="fw-bolder m-0">{t('merchant.profile.associatedUserAccount')}</h3>
                                </div>
                            </div>
                            
                            <div className="card-body p-9">
                                <div className="row mb-7">
                                    <label className="col-lg-4 fw-bold text-muted">{t('merchant.profile.fullName')}</label>
                                    <div className="col-lg-8">
                                        <span className="fw-bolder fs-6 text-gray-800">
                                            {user.name || t('merchant.profile.na')}
                                        </span>
                                    </div>
                                </div>

                                <div className="row mb-7">
                                    <label className="col-lg-4 fw-bold text-muted">{t('merchant.profile.username')}</label>
                                    <div className="col-lg-8">
                                        <span className="fw-bolder fs-6 text-gray-800">
                                            {user.user_name || t('merchant.profile.na')}
                                        </span>
                                    </div>
                                </div>

                                <div className="row mb-7">
                                    <label className="col-lg-4 fw-bold text-muted">{t('merchant.profile.userAccountEmail')}</label>
                                    <div className="col-lg-8">
                                        <span className="fw-bolder fs-6 text-gray-800">
                                            {user.email || t('merchant.profile.na')}
                                        </span>
                                    </div>
                                </div>

                                <div className="row mb-7">
                                    <label className="col-lg-4 fw-bold text-muted">{t('merchant.profile.userAccountPhone')}</label>
                                    <div className="col-lg-8">
                                        <span className="fw-bolder fs-6 text-gray-800">
                                            {user.phone || t('merchant.profile.na')}
                                        </span>
                                    </div>
                                </div>

                                <div className="row mb-7">
                                    <label className="col-lg-4 fw-bold text-muted">{t('merchant.profile.userStatus')}</label>
                                    <div className="col-lg-8">
                                        <span className={`badge badge-light-${user.is_approved ? 'success' : 'danger'}`}>
                                            {user.is_approved ? t('merchant.profile.active') : t('merchant.profile.inactive')}
                                        </span>
                                    </div>
                                </div>

                                <div className="row mb-7">
                                    <label className="col-lg-4 fw-bold text-muted">{t('merchant.profile.userCreated')}</label>
                                    <div className="col-lg-8">
                                        <span className="fw-bolder fs-6 text-gray-800">
                                            {formatDateTime(user.created_at)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Events Timeline */}
                    <div className="col-md-4">
                        <div className="card card-xl-stretch mb-xl-10">
                            <div className="card-header align-items-center border-0 mt-4">
                                <h3 className="card-title align-items-start flex-column">
                                    <span className="fw-bolder mb-2 text-dark">{t('merchant.profile.eventsCardTitle')}</span>
                                    <span className="text-muted fw-bold fs-7">
                                        {logs?.length || 0} {t('merchant.profile.recentActivities')}
                                    </span>
                                </h3>
                            </div>
                            
                            <div className="card-body pt-5">
                                <div className="timeline-label">
                                    <style>{`
                                        .timeline-label:before {
                                            left: 101px;
                                        }
                                    `}</style>
                                    
                                    {logs && logs.length > 0 ? (
                                        logs.map((event, index) => (
                                            <div key={index} className="timeline-item">
                                                <div className="timeline-label fw-bolder text-gray-800 fs-6" style={{ width: '100px' }}>
                                                    {event.time || t('merchant.profile.na')}
                                                </div>
                                                
                                                <div className="timeline-badge">
                                                    <i className={`fa fa-genderless text-${event.label || 'primary'} fs-1`}></i>
                                                </div>
                                                
                                                <div className="fw-normal timeline-content text-muted ps-3">
                                                    {event.text || 'Activity logged'}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center text-muted py-5">
                                            {t('merchant.profile.noRecentEvents')}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* No User Alert */}
            {!user && (
                <div className="col-lg-12">
                    <div className="card mb-5 mb-xl-10">
                        <div className="card-body p-9">
                            <div className="alert alert-warning d-flex align-items-center p-5">
                                <i className="ki-duotone ki-information-5 fs-2hx text-warning me-4">
                                    <span className="path1"></span>
                                    <span className="path2"></span>
                                    <span className="path3"></span>
                                </i>
                                
                                <div className="d-flex flex-column">
                                    <h4 className="mb-1 text-warning">{t('merchant.profile.noUserTitle')}</h4>
                                    <span>{t('merchant.profile.noUserDesc')}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Overview;


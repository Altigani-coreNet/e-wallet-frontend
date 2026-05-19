import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getServiceFee } from '../../../services/serviceFeesService';
import LoadingSpinner from '../../common/LoadingSpinner';
import { useToolbar } from '../../../contexts/ToolbarContext';
import useAuthStore from '../../../stores/authStore';

const ServiceFeeView = () => {
    const { t, i18n } = useTranslation();
    const { formatCurrency } = useAuthStore();
    const { id } = useParams();
    const { setTitle, setBreadcrumbs, setActions } = useToolbar();
    const [serviceFee, setServiceFee] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Set toolbar title, breadcrumbs and actions
    useEffect(() => {
        setTitle(t('merchant.serviceFees.detailTitle'));

        setBreadcrumbs([
            { label: t('merchant.breadcrumbs.dashboard'), path: '/merchant/dashboard' },
            { label: t('merchant.breadcrumbs.serviceFees'), path: '/merchant/service-fees' },
            {
                label: t('merchant.breadcrumbs.serviceFeeDetails'),
                path: `/merchant/service-fees/${id}`,
                active: true,
            },
        ]);

        setActions(null);
    }, [setTitle, setBreadcrumbs, setActions, id, t, i18n.language]);

    useEffect(() => {
        fetchServiceFee();
    }, [id]);

    const fetchServiceFee = async () => {
        setLoading(true);
        try {
            const response = await getServiceFee(id);
            console.log('Service Fee View Response:', response);
            
            if (response.success) {
                const feeData = response.data?.data || response.data;
                setServiceFee(feeData);
            } else {
                setError(response.error || t('merchant.serviceFees.fetchFailed'));
            }
        } catch (err) {
            console.error('Error fetching service fee:', err);
            setError(t('merchant.serviceFees.unexpectedError'));
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="post d-flex flex-column-fluid" id="kt_post">
                <div id="kt_content_container" className="container-xxl">
                    <LoadingSpinner />
                </div>
            </div>
        );
    }

    if (error || !serviceFee) {
        return (
            <div className="post d-flex flex-column-fluid" id="kt_post">
                <div id="kt_content_container" className="container-xxl">
                    <div className="alert alert-danger">
                        <strong>{t('merchant.serviceFees.errorPrefix')}</strong> {error || t('merchant.serviceFees.notFound')}
                    </div>
                    <Link to="/merchant/service-fees" className="btn btn-primary">
                        {t('merchant.common.backToServiceFees')}
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="post d-flex flex-column-fluid" id="kt_post">
                <div id="kt_content_container" className="container-xxl">
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">{t('merchant.serviceFees.information')}</h3>
                        </div>

                        <div className="card-body">
                            <div className="row mb-7">
                                <label className="col-lg-4 fw-bold text-muted">{t('merchant.serviceFees.feeName')}</label>
                                <div className="col-lg-8">
                                    <span className="fw-bolder fs-6 text-gray-800">{serviceFee.name}</span>
                                </div>
                            </div>

                            <div className="row mb-7">
                                <label className="col-lg-4 fw-bold text-muted">{t('merchant.serviceFees.feeType')}</label>
                                <div className="col-lg-8">
                                    <span className="badge badge-light-primary">
                                        {serviceFee.type?.toUpperCase() || t('merchant.common.na')}
                                    </span>
                                </div>
                            </div>

                            <div className="row mb-7">
                                <label className="col-lg-4 fw-bold text-muted">{t('merchant.serviceFees.feeAmount')}</label>
                                <div className="col-lg-8">
                                    <span className="fw-bolder fs-3 text-success">
                                        {formatCurrency(serviceFee.fees)}
                                    </span>
                                </div>
                            </div>

                            <div className="row mb-7">
                                <label className="col-lg-4 fw-bold text-muted">{t('merchant.serviceFees.description')}</label>
                                <div className="col-lg-8">
                                    <span className="fw-bolder fs-6 text-gray-800">
                                        {serviceFee.description || t('merchant.serviceFees.noDescription')}
                                    </span>
                                </div>
                            </div>

                            <div className="row mb-7">
                                <label className="col-lg-4 fw-bold text-muted">{t('merchant.serviceFees.createdAt')}</label>
                                <div className="col-lg-8">
                                    <span className="fw-bolder fs-6 text-gray-800">
                                        {serviceFee.created_at
                                            ? new Date(serviceFee.created_at).toLocaleString(
                                                  i18n.language === 'ar' ? 'ar' : undefined
                                              )
                                            : t('merchant.common.na')}
                                    </span>
                                </div>
                            </div>

                            <div className="row mb-7">
                                <label className="col-lg-4 fw-bold text-muted">{t('merchant.serviceFees.updatedAt')}</label>
                                <div className="col-lg-8">
                                    <span className="fw-bolder fs-6 text-gray-800">
                                        {serviceFee.updated_at
                                            ? new Date(serviceFee.updated_at).toLocaleString(
                                                  i18n.language === 'ar' ? 'ar' : undefined
                                              )
                                            : t('merchant.common.na')}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="card-footer d-flex justify-content-end">
                            <Link to="/merchant/service-fees" className="btn btn-light">
                                {t('merchant.serviceFees.backToList')}
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
    );
};

export default ServiceFeeView;


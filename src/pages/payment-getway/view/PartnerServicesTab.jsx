import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ServiceModel from '../../../services/ServiceModel';

const PartnerServicesTab = ({ services = [], loading, partnerId }) => {
    const { t } = useTranslation();
    return (
        <div className="card mb-5 mb-xl-10">
        <div className="card-header border-0 align-items-center">
            <div className="card-title m-0">
                <h3 className="fw-bolder m-0">{t('admin.paymentGetway.viewServiceCol')}</h3>
            </div>
            {partnerId && (
                <div className="card-toolbar">
                    <Link
                        to={`/admin/services?partner_id=${encodeURIComponent(partnerId)}`}
                        className="btn btn-sm btn-light-primary"
                    >
                        {t('admin.paymentGetway.viewOpenServicesList')}
                    </Link>
                </div>
            )}
        </div>
        <div className="card-body border-top p-9">
            {loading ? (
                <div className="text-muted">{t('admin.paymentGetway.viewLoadingServices')}</div>
            ) : services.length === 0 ? (
                <div className="text-muted">{t('admin.paymentGetway.viewNoLinkedServices')}</div>
            ) : (
                <div className="table-responsive">
                    <table className="table table-row-dashed table-row-gray-300 align-middle gs-0 gy-4">
                        <thead>
                            <tr className="fw-bold text-muted">
                                <th className="min-w-200px">{t('admin.paymentGetway.viewServiceCol')}</th>
                                <th className="min-w-100px">{t('admin.paymentGetway.viewTypeCol')}</th>
                                <th className="min-w-100px">{t('admin.paymentGetway.viewCountryCol')}</th>
                                <th className="min-w-80px">{t('admin.paymentGetway.status')}</th>
                                <th className="min-w-80px text-end">{t('admin.common.actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {services.map((s) => (
                                <tr key={s.id}>
                                    <td>
                                        <span className="text-gray-800 fw-semibold">{ServiceModel.displayName(s) || t('admin.paymentGetway.na')}</span>
                                    </td>
                                    <td>
                                        <span className="text-muted fs-7">
                                            {s.service_type_display || s.service_type || '—'}
                                        </span>
                                    </td>
                                    <td className="text-muted fs-7">{ServiceModel.countryName(s) || t('admin.paymentGetway.na')}</td>
                                    <td>
                                        <span
                                            className={`badge ${
                                                s.is_active ? 'badge-light-success' : 'badge-light-secondary'
                                            }`}
                                        >
                                            {s.is_active ? t('admin.common.active') : t('admin.common.inactive')}
                                        </span>
                                    </td>
                                    <td className="text-end">
                                        <Link
                                            to={
                                                partnerId
                                                    ? `/admin/services/${s.id}?partner_id=${encodeURIComponent(partnerId)}`
                                                    : `/admin/services/${s.id}`
                                            }
                                            className="btn btn-sm btn-light-primary"
                                        >
                                            {t('admin.common.view')}
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
        </div>
    );
};

export default PartnerServicesTab;

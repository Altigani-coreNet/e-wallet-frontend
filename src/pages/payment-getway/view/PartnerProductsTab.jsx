import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ServiceModel from '../../../services/ServiceModel';

const resolveProductName = (product) => {
    if (!product) return null;
    if (product.name_en || product.name_ar) return product.name_en || product.name_ar;
    if (product.name && typeof product.name === 'object') {
        return product.name.en || product.name.ar || null;
    }
    return null;
};

const PartnerProductsTab = ({ products = [], loading, partnerId }) => {
    const { t } = useTranslation();
    return (
        <div className="card mb-5 mb-xl-10">
        <div className="card-header border-0 align-items-center">
            <div className="card-title m-0">
                <h3 className="fw-bolder m-0">{t('admin.paymentGetway.viewProductCol')}</h3>
            </div>
            {partnerId && (
                <div className="card-toolbar">
                    <Link
                        to={`/admin/service-products?partner_id=${encodeURIComponent(partnerId)}`}
                        className="btn btn-sm btn-light-primary"
                    >
                        {t('admin.paymentGetway.viewOpenProductsList')}
                    </Link>
                </div>
            )}
        </div>
        <div className="card-body border-top p-9">
            {loading ? (
                <div className="text-muted">{t('admin.paymentGetway.viewLoadingProducts')}</div>
            ) : products.length === 0 ? (
                <div className="text-muted">{t('admin.paymentGetway.viewNoProductsForPartnerServices')}</div>
            ) : (
                <div className="table-responsive">
                    <table className="table table-row-dashed table-row-gray-300 align-middle gs-0 gy-4">
                        <thead>
                            <tr className="fw-bold text-muted">
                                <th className="min-w-200px">{t('admin.paymentGetway.viewProductCol')}</th>
                                <th className="min-w-200px">{t('admin.paymentGetway.viewServiceCol')}</th>
                                <th className="min-w-80px">{t('admin.paymentGetway.status')}</th>
                                <th className="min-w-80px text-end">{t('admin.common.actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map((p) => (
                                <tr key={p.id}>
                                    <td>
                                        <span className="text-gray-800 fw-semibold">{resolveProductName(p) || t('admin.paymentGetway.na')}</span>
                                    </td>
                                    <td className="text-muted fs-7">{ServiceModel.displayName(p.service) || t('admin.paymentGetway.na')}</td>
                                    <td>
                                        <span
                                            className={`badge ${
                                                p.status ? 'badge-light-success' : 'badge-light-secondary'
                                            }`}
                                        >
                                            {p.status ? t('admin.common.active') : t('admin.common.inactive')}
                                        </span>
                                    </td>
                                    <td className="text-end">
                                        <Link
                                            to={
                                                partnerId
                                                    ? `/admin/service-products/${p.id}/edit?partner_id=${encodeURIComponent(partnerId)}`
                                                    : `/admin/service-products/${p.id}/edit`
                                            }
                                            className="btn btn-sm btn-light-primary"
                                        >
                                            {t('admin.common.edit')}
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

export default PartnerProductsTab;

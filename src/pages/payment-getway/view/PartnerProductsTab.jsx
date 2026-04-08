import React from 'react';
import { Link } from 'react-router-dom';

const resolveProductName = (product) => {
    if (!product) return 'N/A';
    if (product.name_en || product.name_ar) return product.name_en || product.name_ar;
    if (product.name && typeof product.name === 'object') {
        return product.name.en || product.name.ar || 'N/A';
    }
    return 'N/A';
};

const resolveServiceName = (service) => {
    if (!service) return 'N/A';
    if (service.service_name_en || service.service_name_ar) {
        return service.service_name_en || service.service_name_ar || 'N/A';
    }
    if (service.service_name && typeof service.service_name === 'object') {
        return service.service_name.en || service.service_name.ar || 'N/A';
    }
    return 'N/A';
};

const PartnerProductsTab = ({ products = [], loading, partnerId }) => (
    <div className="card mb-5 mb-xl-10">
        <div className="card-header border-0 align-items-center">
            <div className="card-title m-0">
                <h3 className="fw-bolder m-0">Products</h3>
            </div>
            {partnerId && (
                <div className="card-toolbar">
                    <Link
                        to={`/admin/service-products?partner_id=${encodeURIComponent(partnerId)}`}
                        className="btn btn-sm btn-light-primary"
                    >
                        Open products list
                    </Link>
                </div>
            )}
        </div>
        <div className="card-body border-top p-9">
            {loading ? (
                <div className="text-muted">Loading products...</div>
            ) : products.length === 0 ? (
                <div className="text-muted">No products for this partner&apos;s services.</div>
            ) : (
                <div className="table-responsive">
                    <table className="table table-row-dashed table-row-gray-300 align-middle gs-0 gy-4">
                        <thead>
                            <tr className="fw-bold text-muted">
                                <th className="min-w-200px">Product</th>
                                <th className="min-w-200px">Service</th>
                                <th className="min-w-80px">Status</th>
                                <th className="min-w-80px text-end">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map((p) => (
                                <tr key={p.id}>
                                    <td>
                                        <span className="text-gray-800 fw-semibold">{resolveProductName(p)}</span>
                                    </td>
                                    <td className="text-muted fs-7">{resolveServiceName(p.service)}</td>
                                    <td>
                                        <span
                                            className={`badge ${
                                                p.status ? 'badge-light-success' : 'badge-light-secondary'
                                            }`}
                                        >
                                            {p.status ? 'Active' : 'Inactive'}
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
                                            Edit
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

export default PartnerProductsTab;

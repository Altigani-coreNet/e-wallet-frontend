import React from 'react';
import { Link } from 'react-router-dom';

const resolveServiceName = (service) => {
    if (!service) return 'N/A';
    if (service.service_name_en || service.service_name_ar) {
        return service.service_name_en || service.service_name_ar || service.id || 'N/A';
    }
    if (service.service_name_text) return service.service_name_text;
    if (service.service_name && typeof service.service_name === 'object') {
        return service.service_name.en || service.service_name.ar || service.id || 'N/A';
    }
    return service.service_name || service.id || 'N/A';
};

const resolveCountry = (service) => {
    const c = service?.country;
    if (!c) return 'N/A';
    const n = c.name;
    if (typeof n === 'string') return n;
    if (n && typeof n === 'object') return n.en || n.ar || 'N/A';
    return 'N/A';
};

const PartnerServicesTab = ({ services = [], loading, partnerId }) => (
    <div className="card mb-5 mb-xl-10">
        <div className="card-header border-0 align-items-center">
            <div className="card-title m-0">
                <h3 className="fw-bolder m-0">Services</h3>
            </div>
            {partnerId && (
                <div className="card-toolbar">
                    <Link
                        to={`/admin/services?partner_id=${encodeURIComponent(partnerId)}`}
                        className="btn btn-sm btn-light-primary"
                    >
                        Open services list
                    </Link>
                </div>
            )}
        </div>
        <div className="card-body border-top p-9">
            {loading ? (
                <div className="text-muted">Loading services...</div>
            ) : services.length === 0 ? (
                <div className="text-muted">No services linked to this partner.</div>
            ) : (
                <div className="table-responsive">
                    <table className="table table-row-dashed table-row-gray-300 align-middle gs-0 gy-4">
                        <thead>
                            <tr className="fw-bold text-muted">
                                <th className="min-w-200px">Service</th>
                                <th className="min-w-100px">Type</th>
                                <th className="min-w-100px">Country</th>
                                <th className="min-w-80px">Status</th>
                                <th className="min-w-80px text-end">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {services.map((s) => (
                                <tr key={s.id}>
                                    <td>
                                        <span className="text-gray-800 fw-semibold">{resolveServiceName(s)}</span>
                                    </td>
                                    <td>
                                        <span className="text-muted fs-7">
                                            {s.service_type_display || s.service_type || '—'}
                                        </span>
                                    </td>
                                    <td className="text-muted fs-7">{resolveCountry(s)}</td>
                                    <td>
                                        <span
                                            className={`badge ${
                                                s.is_active ? 'badge-light-success' : 'badge-light-secondary'
                                            }`}
                                        >
                                            {s.is_active ? 'Active' : 'Inactive'}
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
                                            View
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

export default PartnerServicesTab;

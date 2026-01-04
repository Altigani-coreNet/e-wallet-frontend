import React, { useState, useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { getSupplier } from '../../../services/suppliersService';
import { useToolbar } from '../../../contexts/ToolbarContext';
import LoadingSpinner from '../../common/LoadingSpinner';
import ErrorAlert from '../../common/ErrorAlert';

const SupplierView = () => {
    const { id } = useParams();
    const location = useLocation();
    const { setTitle, setBreadcrumbs, setActions } = useToolbar();
    
    const basePath = location.pathname.startsWith('/sales') ? '/sales' : '/merchant';
    
    const [supplier, setSupplier] = useState(null);
    const [purchases, setPurchases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const breadcrumbs = [
            { label: 'Dashboard', path: `${basePath}/dashboard` },
            { label: 'Suppliers', path: `${basePath}/suppliers` },
            { label: 'Supplier Details', path: `${basePath}/suppliers/${id}`, active: true }
        ];
        
        setTitle('Supplier Details');
        setBreadcrumbs(breadcrumbs);
        setActions(
            <Link to={`${basePath}/suppliers/${id}/edit`} className="btn btn-sm fw-bold btn-primary">
                <i className="ki-duotone ki-pencil fs-2"></i>
                Edit Supplier
            </Link>
        );
        
        return () => {
            setTitle('Dashboard');
            setBreadcrumbs([]);
            setActions(null);
        };
    }, [basePath, id]);

    useEffect(() => {
        fetchSupplier();
    }, [id]);

    const fetchSupplier = async () => {
        try {
            const response = await getSupplier(id);

            if (response.success) {
                setSupplier(response.data.supplier || response.data);
                setPurchases(response.data.purchases || []);
            } else {
                setError(response.error || 'Failed to fetch supplier');
            }
        } catch (err) {
            console.error('Error fetching supplier:', err);
            setError('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="post d-flex flex-column-fluid" id="kt_post">
                <div id="kt_content_container" className="container-fluid">
                    <LoadingSpinner />
                </div>
            </div>
        );
    }

    if (error || !supplier) {
        return (
            <div className="post d-flex flex-column-fluid" id="kt_post">
                <div id="kt_content_container" className="container-fluid">
                    <ErrorAlert error={error || 'Supplier not found'} />
                </div>
            </div>
        );
    }

    return (
        <div className="post d-flex flex-column-fluid" id="kt_post">
            <div id="kt_content_container" className="container-fluid">
                
                {/* Supplier Details Card */}
                <div className="card mb-5">
                    <div className="card-header">
                        <h3 className="card-title">Supplier Information</h3>
                    </div>
                    <div className="card-body">
                        <div className="row g-5">
                            <div className="col-md-6">
                                <div className="mb-4">
                                    <label className="form-label fw-bold">Supplier Name</label>
                                    <div className="text-gray-800">{supplier.name}</div>
                                </div>
                                {supplier.company_name && (
                                    <div className="mb-4">
                                        <label className="form-label fw-bold">Company Name</label>
                                        <div className="text-gray-800">{supplier.company_name}</div>
                                    </div>
                                )}
                                {supplier.vat_number && (
                                    <div className="mb-4">
                                        <label className="form-label fw-bold">VAT Number</label>
                                        <div className="text-gray-800">{supplier.vat_number}</div>
                                    </div>
                                )}
                            </div>
                            <div className="col-md-6">
                                <div className="mb-4">
                                    <label className="form-label fw-bold">Email</label>
                                    <div className="text-gray-800">{supplier.email}</div>
                                </div>
                                <div className="mb-4">
                                    <label className="form-label fw-bold">Phone</label>
                                    <div className="text-gray-800">{supplier.phone_number}</div>
                                </div>
                            </div>
                        </div>

                        {(supplier.address || supplier.city || supplier.country) && (
                            <div className="separator my-5"></div>
                        )}

                        {(supplier.address || supplier.city || supplier.country) && (
                            <div className="row g-5">
                                {supplier.address && (
                                    <div className="col-md-12">
                                        <div className="mb-4">
                                            <label className="form-label fw-bold">Address</label>
                                            <div className="text-gray-800">{supplier.address}</div>
                                        </div>
                                    </div>
                                )}
                                <div className="col-md-4">
                                    {supplier.city && (
                                        <div className="mb-4">
                                            <label className="form-label fw-bold">City</label>
                                            <div className="text-gray-800">{supplier.city}</div>
                                        </div>
                                    )}
                                </div>
                                <div className="col-md-4">
                                    {supplier.state && (
                                        <div className="mb-4">
                                            <label className="form-label fw-bold">State</label>
                                            <div className="text-gray-800">{supplier.state}</div>
                                        </div>
                                    )}
                                </div>
                                <div className="col-md-4">
                                    {supplier.country && (
                                        <div className="mb-4">
                                            <label className="form-label fw-bold">Country</label>
                                            <div className="text-gray-800">{supplier.country}</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Statistics */}
                        <div className="separator my-5"></div>
                        <div className="row g-5">
                            <div className="col-md-6">
                                <div className="d-flex align-items-center bg-light-primary rounded p-5">
                                    <span className="svg-icon svg-icon-primary me-5">
                                        <i className="ki-duotone ki-chart-simple fs-1">
                                            <span className="path1"></span>
                                            <span className="path2"></span>
                                            <span className="path3"></span>
                                            <span className="path4"></span>
                                        </i>
                                    </span>
                                    <div className="flex-grow-1 me-2">
                                        <span className="fw-bold text-gray-800 fs-6">Total Purchases</span>
                                        <span className="text-muted fw-semibold d-block">{supplier.purchase_count || 0} Orders</span>
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="d-flex align-items-center bg-light-success rounded p-5">
                                    <span className="svg-icon svg-icon-success me-5">
                                        <i className="ki-duotone ki-dollar fs-1">
                                            <span className="path1"></span>
                                            <span className="path2"></span>
                                            <span className="path3"></span>
                                        </i>
                                    </span>
                                    <div className="flex-grow-1 me-2">
                                        <span className="fw-bold text-gray-800 fs-6">Total Amount</span>
                                        <span className="text-muted fw-semibold d-block">
                                            ${parseFloat(supplier.total_purchases_amount || 0).toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Purchase History */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Purchase History</h3>
                    </div>
                    <div className="card-body">
                        {purchases && purchases.length > 0 ? (
                            <div className="table-responsive">
                                <table className="table table-row-dashed table-row-gray-300 gy-7">
                                    <thead>
                                        <tr className="fw-bold fs-6 text-gray-800">
                                            <th>Date</th>
                                            <th>Reference</th>
                                            <th>Amount</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {purchases.map((purchase) => (
                                            <tr key={purchase.id}>
                                                <td>{purchase.date}</td>
                                                <td>{purchase.reference_no}</td>
                                                <td>${parseFloat(purchase.grand_total).toFixed(2)}</td>
                                                <td>
                                                    <span className={`badge badge-light-${purchase.status === 'Paid' ? 'success' : 'warning'}`}>
                                                        {purchase.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-10">
                                <p className="text-muted">No purchase history available</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SupplierView;


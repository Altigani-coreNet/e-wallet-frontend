import React, { useState, useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { getPurchase } from '../../../services/purchasesService';
import { useToolbar } from '../../../contexts/ToolbarContext';
import LoadingSpinner from '../../common/LoadingSpinner';
import ErrorAlert from '../../common/ErrorAlert';

const PurchaseView = () => {
    const { id } = useParams();
    const location = useLocation();
    const { setTitle, setBreadcrumbs, setActions } = useToolbar();
    
    const basePath = location.pathname.startsWith('/sales') ? '/sales' : '/merchant';
    
    const [purchase, setPurchase] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const breadcrumbs = [
            { label: 'Dashboard', path: `${basePath}/dashboard` },
            { label: 'Purchases', path: `${basePath}/purchases` },
            { label: 'Purchase Details', path: `${basePath}/purchases/${id}`, active: true }
        ];
        
        setTitle('Purchase Details');
        setBreadcrumbs(breadcrumbs);
        setActions(
            <Link to={`${basePath}/purchases/${id}/edit`} className="btn btn-sm fw-bold btn-primary">
                <i className="ki-duotone ki-pencil fs-2"></i>
                Edit Purchase
            </Link>
        );
        
        return () => {
            setTitle('Dashboard');
            setBreadcrumbs([]);
            setActions(null);
        };
    }, [basePath, id]);

    useEffect(() => {
        fetchPurchase();
    }, [id]);

    const fetchPurchase = async () => {
        try {
            const response = await getPurchase(id);

            if (response.success) {
                setPurchase(response.data);
            } else {
                setError(response.error || 'Failed to fetch purchase');
            }
        } catch (err) {
            console.error('Error fetching purchase:', err);
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

    if (error || !purchase) {
        return (
            <div className="post d-flex flex-column-fluid" id="kt_post">
                <div id="kt_content_container" className="container-fluid">
                    <ErrorAlert error={error || 'Purchase not found'} />
                </div>
            </div>
        );
    }

    const getPaymentStatusBadge = () => {
        if (purchase.payment_status_label === 'Paid') {
            return <span className="badge badge-success">Paid</span>;
        } else if (purchase.payment_status_label === 'Partial') {
            return <span className="badge badge-warning">Partial</span>;
        } else {
            return <span className="badge badge-danger">Unpaid</span>;
        }
    };

    return (
        <div className="post d-flex flex-column-fluid" id="kt_post">
            <div id="kt_content_container" className="container-fluid">
                
                {/* Purchase Info Card */}
                <div className="card mb-5">
                    <div className="card-header">
                        <h3 className="card-title">Purchase Information</h3>
                        <div className="card-toolbar">
                            {getPaymentStatusBadge()}
                        </div>
                    </div>
                    <div className="card-body">
                        <div className="row g-5">
                            <div className="col-md-6">
                                <div className="mb-4">
                                    <label className="form-label fw-bold">Reference No</label>
                                    <div className="text-gray-800">{purchase.reference_no}</div>
                                </div>
                                <div className="mb-4">
                                    <label className="form-label fw-bold">Date</label>
                                    <div className="text-gray-800">{purchase.date_formatted || purchase.date}</div>
                                </div>
                                {purchase.supplier && (
                                    <div className="mb-4">
                                        <label className="form-label fw-bold">Supplier</label>
                                        <div className="text-gray-800">{purchase.supplier.name}</div>
                                        {purchase.supplier.email && (
                                            <div className="text-muted fs-7">{purchase.supplier.email}</div>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="col-md-6">
                                {purchase.warehouse && (
                                    <div className="mb-4">
                                        <label className="form-label fw-bold">Warehouse</label>
                                        <div className="text-gray-800">{purchase.warehouse.name}</div>
                                    </div>
                                )}
                                <div className="mb-4">
                                    <label className="form-label fw-bold">Payment Method</label>
                                    <div className="text-gray-800">{purchase.payment_method || 'Cash'}</div>
                                </div>
                                <div className="mb-4">
                                    <label className="form-label fw-bold">Status</label>
                                    <div className="text-gray-800 text-capitalize">{purchase.status || 'Received'}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Products Table */}
                {purchase.products && purchase.products.length > 0 && (
                    <div className="card mb-5">
                        <div className="card-header">
                            <h3 className="card-title">Products</h3>
                        </div>
                        <div className="card-body pt-0">
                            <div className="table-responsive">
                                <table className="table table-hover">
                                    <thead>
                                        <tr>
                                            <th>Product</th>
                                            <th className="text-end">Qty</th>
                                            <th className="text-end">Unit Price</th>
                                            <th className="text-end">Tax</th>
                                            <th className="text-end">Discount</th>
                                            <th className="text-end">Subtotal</th>
                                            <th className="text-end">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {purchase.products.map((product) => (
                                            <tr key={product.id}>
                                                <td>
                                                    <div>
                                                        <div className="fw-bold">{product.product_name}</div>
                                                        {product.product_code && (
                                                            <small className="text-muted">{product.product_code}</small>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="text-end">
                                                    <span className="badge badge-light-info">
                                                        {product.quantity}
                                                    </span>
                                                </td>
                                                <td className="text-end">${parseFloat(product.unit_price).toFixed(2)}</td>
                                                <td className="text-end">${parseFloat(product.tax_amount).toFixed(2)}</td>
                                                <td className="text-end">${parseFloat(product.discount).toFixed(2)}</td>
                                                <td className="text-end fw-bold">${parseFloat(product.subtotal).toFixed(2)}</td>
                                                <td className="text-end">
                                                    {(product.product_id || product.id) && (
                                                        <Link 
                                                            to={`${basePath}/products/${product.product_id || product.id}`}
                                                            className="btn btn-sm btn-light-primary"
                                                            title="View Product"
                                                        >
                                                            <i className="ki-duotone ki-eye fs-3">
                                                                <span className="path1"></span>
                                                                <span className="path2"></span>
                                                                <span className="path3"></span>
                                                            </i>
                                                        </Link>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* Financial Summary */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Financial Summary</h3>
                    </div>
                    <div className="card-body">
                        <div className="row">
                            <div className="col-md-6 offset-md-6">
                                <table className="table table-borderless">
                                    <tbody>
                                        <tr>
                                            <td className="text-end fw-semibold">Subtotal:</td>
                                            <td className="text-end">${parseFloat(purchase.total_cost || 0).toFixed(2)}</td>
                                        </tr>
                                        {purchase.order_tax > 0 && (
                                            <tr>
                                                <td className="text-end fw-semibold">Order Tax:</td>
                                                <td className="text-end">${parseFloat(purchase.order_tax).toFixed(2)}</td>
                                            </tr>
                                        )}
                                        {purchase.order_discount > 0 && (
                                            <tr>
                                                <td className="text-end fw-semibold">Discount:</td>
                                                <td className="text-end text-danger">-${parseFloat(purchase.order_discount).toFixed(2)}</td>
                                            </tr>
                                        )}
                                        {purchase.shipping > 0 && (
                                            <tr>
                                                <td className="text-end fw-semibold">Shipping:</td>
                                                <td className="text-end">${parseFloat(purchase.shipping).toFixed(2)}</td>
                                            </tr>
                                        )}
                                        <tr className="border-top">
                                            <td className="text-end fw-bold fs-3">Grand Total:</td>
                                            <td className="text-end fw-bold fs-3 text-primary">${parseFloat(purchase.grand_total).toFixed(2)}</td>
                                        </tr>
                                        <tr>
                                            <td className="text-end fw-semibold">Paid Amount:</td>
                                            <td className="text-end text-success fw-bold">${parseFloat(purchase.paid_amount).toFixed(2)}</td>
                                        </tr>
                                        <tr>
                                            <td className="text-end fw-semibold">Due Amount:</td>
                                            <td className="text-end text-danger fw-bold">${parseFloat(purchase.due_amount).toFixed(2)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {(purchase.note || purchase.staff_note) && (
                            <>
                                <div className="separator my-5"></div>
                                <div className="row">
                                    {purchase.note && (
                                        <div className="col-md-6">
                                            <label className="form-label fw-bold">Note</label>
                                            <div className="text-gray-800">{purchase.note}</div>
                                        </div>
                                    )}
                                    {purchase.staff_note && (
                                        <div className="col-md-6">
                                            <label className="form-label fw-bold">Staff Note</label>
                                            <div className="text-gray-800">{purchase.staff_note}</div>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PurchaseView;


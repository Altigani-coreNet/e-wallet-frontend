import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { salesReportService } from '../../../services/salesReportService';
import { useToolbar } from '../../../contexts/ToolbarContext';
import LoadingSpinner from '../../common/LoadingSpinner';
import ErrorAlert from '../../common/ErrorAlert';

const ReturnSalePage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { setTitle, setBreadcrumbs, setActions } = useToolbar();

    const [sale, setSale] = useState(location.state?.sale || null);
    const [returnProducts, setReturnProducts] = useState([]);
    const [loading, setLoading] = useState(!sale);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        setTitle('Return Sale');
        setBreadcrumbs([
            { label: 'Dashboard', url: '/sales/dashboard' },
            { label: 'Sales Report', url: null },
            { label: 'Returns', url: '/sales/sales-report/returns' },
            { label: 'Return Sale', url: null },
        ]);

        setActions(
            <>
                <button
                    onClick={() => navigate('/sales/sales-report/returns')}
                    className="btn btn-sm btn-light"
                >
                    <i className="ki-duotone ki-arrow-left fs-2">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    Back
                </button>
            </>
        );

        return () => {
            setActions(null);
        };
    }, [setTitle, setBreadcrumbs, setActions, navigate]);

    useEffect(() => {
        if (!sale && id) {
            fetchSale();
        } else if (sale && sale.products) {
            initializeReturnProducts();
        }
    }, [id, sale]);

    const fetchSale = async () => {
        try {
            const response = await salesReportService.getSaleDetails(id);
            const saleData = response?.data.data || response?.data || {};
            setSale(saleData);
            if (saleData.products) {
                initializeReturnProductsFromData(saleData.products);
            }
        } catch (err) {
            console.error('Error fetching sale:', err);
            setError(err.response?.data?.message || 'Failed to fetch sale details');
        } finally {
            setLoading(false);
        }
    };

    const initializeReturnProducts = () => {
        if (sale?.products) {
            initializeReturnProductsFromData(sale.products);
        }
    };

    const initializeReturnProductsFromData = (products) => {
        const productsToReturn = products.map(product => ({
            id: product.product_id || product.id,
            name: product.name || product.product_name || product.sku,
            code: product.code || product.sku,
            original_qty: product.qty || 0,
            qty: product.qty || 0, // Start with original quantity
            unit_price: product.net_unit_price || product.price || 0,
            discount: product.discount || 0,
            tax_rate: product.tax_rate || 0,
            tax: product.tax || 0,
            total: product.total || 0,
            original_total: product.total || 0,
            variant_id: product.variant_id || null,
            serial_imei_number: product.serial_imei_number || null,
        }));
        setReturnProducts(productsToReturn);
    };

    const handleQuantityChange = (productId, newQty) => {
        const numQty = Math.max(0, Math.min(parseInt(newQty) || 0, returnProducts.find(p => p.id === productId)?.original_qty || 0));
        
        setReturnProducts(prevProducts =>
            prevProducts.map(product => {
                if (product.id === productId) {
                    const qty = numQty;
                    const subtotal = (product.unit_price * qty) - (product.discount || 0);
                    const taxAmount = subtotal * (product.tax_rate / 100);
                    const total = subtotal + taxAmount;

                    return {
                        ...product,
                        qty,
                        total,
                        tax: taxAmount,
                    };
                }
                return product;
            })
        );
    };

    const handleDeleteProduct = (productId) => {
        setReturnProducts(prevProducts => prevProducts.filter(product => product.id !== productId));
    };

    const calculateTotals = () => {
        const totals = returnProducts.reduce(
            (acc, product) => {
                acc.total_qty += product.qty;
                acc.total_price += (product.unit_price * product.qty) - (product.discount || 0);
                acc.total_tax += product.tax || 0;
                acc.item_count += product.qty > 0 ? 1 : 0;
                return acc;
            },
            { total_qty: 0, total_price: 0, total_tax: 0, item_count: 0 }
        );

        // Order tax (if any from original sale)
        const orderTax = sale?.order_tax || 0;
        const orderDiscount = sale?.order_discount || 0;
        const grandTotal = totals.total_price + totals.total_tax + orderTax - orderDiscount;

        return {
            ...totals,
            order_tax: orderTax,
            order_discount: orderDiscount,
            grand_total: grandTotal,
        };
    };

    const handleReturn = async () => {
        // Filter out products with zero quantity
        const productsToReturn = returnProducts.filter(p => p.qty > 0);

        if (productsToReturn.length === 0) {
            toast.error('Please select at least one product to return');
            return;
        }

        // Validate quantities (client-side validation only)
        for (const product of productsToReturn) {
            if (product.qty > product.original_qty) {
                toast.error(`Return quantity cannot be greater than original quantity for ${product.name}`);
                return;
            }
        }

        // Only send products and note - server will calculate everything
        const returnData = {
            products: productsToReturn.map(product => ({
                id: product.id,
                qty: product.qty,
            })),
            note: `Return for sale ${sale.reference_no}`,
        };

        setProcessing(true);

        try {
            await salesReportService.processReturnSale(sale.id, returnData);
            toast.success('Products returned successfully!');
            navigate('/sales/sales-report/returns');
        } catch (err) {
            console.error('Error processing return:', err);
            toast.error(err.response?.data?.message || 'Failed to process return');
        } finally {
            setProcessing(false);
        }
    };

    const formatCurrency = (value) => {
        const symbol = sale?.currency_symbol || sale?.currency_object?.symbol || '$';
        const amount = typeof value === 'number' ? value : parseFloat(value || 0);
        return `${symbol}${amount.toFixed(2)}`;
    };

    const totals = calculateTotals();

    if (loading) {
        return <LoadingSpinner />;
    }

    if (error || !sale) {
        return <ErrorAlert message={error || 'Sale not found'} />;
    }

    return (
        <div className="card card-flush">
            <div className="card-header">
                <div className="card-title">
                    <h3>Return Sale - {sale.reference_no}</h3>
                </div>
            </div>
            <div className="card-body">
                {/* Sale Information */}
                <div className="row mb-5">
                    <div className="col-md-6">
                        <div className="d-flex flex-column gap-2">
                            <div className="d-flex justify-content-between">
                                <span className="text-gray-600">Reference No:</span>
                                <span className="text-gray-800 fw-bold">{sale.reference_no}</span>
                            </div>
                            <div className="d-flex justify-content-between">
                                <span className="text-gray-600">Date:</span>
                                <span className="text-gray-800">{sale.date}</span>
                            </div>
                            {sale.customer && (
                                <div className="d-flex justify-content-between">
                                    <span className="text-gray-600">Customer:</span>
                                    <span className="text-gray-800">{sale.customer.name}</span>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="col-md-6">
                        <div className="d-flex flex-column gap-2">
                            <div className="d-flex justify-content-between">
                                <span className="text-gray-600">Original Total:</span>
                                <span className="text-gray-800 fw-bold">{formatCurrency(sale.grand_total)}</span>
                            </div>
                            <div className="d-flex justify-content-between">
                                <span className="text-gray-600">Payment Method:</span>
                                <span className="text-gray-800">{sale.payment_method || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Products Table */}
                <div className="table-responsive mb-5">
                    <table className="table table-bordered align-middle">
                        <thead className="table-light">
                            <tr>
                                <th>Product</th>
                                <th className="text-center" style={{ width: '120px' }}>Original Qty</th>
                                <th className="text-center" style={{ width: '150px' }}>Return Qty</th>
                                <th className="text-end" style={{ width: '120px' }}>Unit Price</th>
                                <th className="text-end" style={{ width: '120px' }}>Subtotal</th>
                                <th className="text-end" style={{ width: '120px' }}>Tax</th>
                                <th className="text-end" style={{ width: '120px' }}>Total</th>
                                <th className="text-center" style={{ width: '80px' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {returnProducts.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="text-center py-5">
                                        <div className="text-gray-500">No products found</div>
                                    </td>
                                </tr>
                            ) : (
                                returnProducts.map((product) => (
                                    <tr key={product.id}>
                                        <td>
                                            <div className="fw-semibold">{product.name}</div>
                                            {product.code && (
                                                <div className="text-muted small">{product.code}</div>
                                            )}
                                        </td>
                                        <td className="text-center">
                                            <span className="badge badge-light-primary">{product.original_qty}</span>
                                        </td>
                                        <td className="text-center">
                                            <input
                                                type="number"
                                                className="form-control form-control-sm text-center"
                                                min="0"
                                                max={product.original_qty}
                                                value={product.qty}
                                                onChange={(e) => handleQuantityChange(product.id, e.target.value)}
                                            />
                                        </td>
                                        <td className="text-end">{formatCurrency(product.unit_price)}</td>
                                        <td className="text-end">
                                            {formatCurrency((product.unit_price * product.qty) - (product.discount || 0))}
                                        </td>
                                        <td className="text-end">{formatCurrency(product.tax)}</td>
                                        <td className="text-end fw-bold">{formatCurrency(product.total)}</td>
                                        <td className="text-center">
                                            <button
                                                className="btn btn-sm btn-light-danger"
                                                onClick={() => handleDeleteProduct(product.id)}
                                                title="Remove Product"
                                            >
                                                <i className="ki-duotone ki-trash fs-5">
                                                    <span className="path1"></span>
                                                    <span className="path2"></span>
                                                    <span className="path3"></span>
                                                    <span className="path4"></span>
                                                    <span className="path5"></span>
                                                </i>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Totals */}
                <div className="row">
                    <div className="col-md-6 offset-md-6">
                        <div className="d-flex flex-column gap-2">
                            <div className="d-flex justify-content-between">
                                <span className="text-gray-600">Subtotal:</span>
                                <span className="text-gray-800 fw-semibold">{formatCurrency(totals.total_price)}</span>
                            </div>
                            <div className="d-flex justify-content-between">
                                <span className="text-gray-600">Tax:</span>
                                <span className="text-gray-800 fw-semibold">{formatCurrency(totals.total_tax)}</span>
                            </div>
                            {totals.order_discount > 0 && (
                                <div className="d-flex justify-content-between">
                                    <span className="text-gray-600">Discount:</span>
                                    <span className="text-gray-800 fw-semibold text-success">
                                        -{formatCurrency(totals.order_discount)}
                                    </span>
                                </div>
                            )}
                            <div className="d-flex justify-content-between border-top pt-2 mt-2">
                                <span className="text-gray-800 fw-bold fs-4">Return Total:</span>
                                <span className="text-primary fw-bold fs-4">{formatCurrency(totals.grand_total)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="card-footer">
                <div className="d-flex justify-content-end gap-3">
                    <button
                        className="btn btn-light"
                        onClick={() => navigate('/sales/sales-report/returns')}
                        disabled={processing}
                    >
                        Cancel
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={handleReturn}
                        disabled={processing || returnProducts.filter(p => p.qty > 0).length === 0}
                    >
                        {processing ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                Processing...
                            </>
                        ) : (
                            <>
                                <i className="ki-duotone ki-check fs-6 me-2">
                                    <span className="path1"></span>
                                    <span className="path2"></span>
                                </i>
                                Process Return
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReturnSalePage;


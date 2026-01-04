import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
    fetchProductDetails, 
    fetchProductSales, 
    fetchProductPurchases, 
    fetchProductWarehouses 
} from '../../../services/productsService';
import { useToolbar } from '../../../contexts/ToolbarContext';

export default function ProductShow() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { setTitle, setBreadcrumbs, setActions } = useToolbar();

    const [loading, setLoading] = useState(true);
    const [product, setProduct] = useState(null);
    const [latestSales, setLatestSales] = useState([]);
    const [latestPurchases, setLatestPurchases] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [loadingSales, setLoadingSales] = useState(false);
    const [loadingPurchases, setLoadingPurchases] = useState(false);
    const [loadingWarehouses, setLoadingWarehouses] = useState(false);

    useEffect(() => {
        setTitle('Product Details');
        setBreadcrumbs([
            { label: 'Dashboard', path: '/sales/dashboard' },
            { label: 'Product Management', path: '#' },
            { label: 'Products', path: '/sales/products' },
            { label: 'Product Details', path: `/sales/products/${id}`, active: true }
        ]);

        setActions(
            <div className="d-flex align-items-center gap-2">
                <button
                    className="btn btn-sm btn-light"
                    onClick={() => navigate('/sales/products')}
                >
                    <i className="ki-duotone ki-arrow-left fs-3 me-1">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    Back to List
                </button>
                <Link
                    to={`/sales/products/${id}/edit`}
                    className="btn btn-sm btn-light-primary"
                >
                    <i className="ki-duotone ki-pencil fs-3 me-1">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    Edit Product
                </Link>
            </div>
        );

        return () => {
            setBreadcrumbs([]);
            setActions(null);
        };
    }, [id, setBreadcrumbs, setTitle, setActions, navigate]);

    useEffect(() => {
        loadProductDetails();
    }, [id]);

    useEffect(() => {
        if (product) {
            loadProductSales();
            loadProductPurchases();
            loadProductWarehouses();
        }
    }, [product]);

    const loadProductDetails = async () => {
        try {
            setLoading(true);
            const response = await fetchProductDetails(id);
            const productData = response?.data?.product ?? response?.data?.data ?? response?.data ?? response ?? {};
            setProduct(productData);
        } catch (error) {
            console.error('Error loading product details:', error);
            toast.error('Failed to load product details');
            navigate('/sales/products');
        } finally {
            setLoading(false);
        }
    };

    const loadProductSales = async () => {
        try {
            setLoadingSales(true);
            const response = await fetchProductSales(id, { per_page: 5 });
            const sales = response?.data?.sales ?? [];
            setLatestSales(sales);
        } catch (error) {
            console.error('Error fetching product sales:', error);
            toast.error('Failed to load product sales');
            setLatestSales([]);
        } finally {
            setLoadingSales(false);
        }
    };

    const loadProductPurchases = async () => {
        try {
            setLoadingPurchases(true);
            const response = await fetchProductPurchases(id, { per_page: 5 });
            const purchases = response?.data?.purchases ?? [];
            setLatestPurchases(purchases);
        } catch (error) {
            console.error('Error fetching product purchases:', error);
            toast.error('Failed to load product purchases');
            setLatestPurchases([]);
        } finally {
            setLoadingPurchases(false);
        }
    };

    const loadProductWarehouses = async () => {
        try {
            setLoadingWarehouses(true);
            const response = await fetchProductWarehouses(id);
            const warehousesData = response?.data?.warehouses ?? [];
            setWarehouses(warehousesData);
        } catch (error) {
            console.error('Error fetching product warehouses:', error);
            toast.error('Failed to load product warehouses');
            setWarehouses([]);
        } finally {
            setLoadingWarehouses(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatCurrency = (amount) => {
        if (!amount && amount !== 0) return '0.00';
        return Number(amount).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    // Skeleton loading component
    const ProductSkeleton = () => (
        <div className="card card-flush">
            <div className="card-header">
                <div className="placeholder-glow">
                    <span className="placeholder col-4" style={{ height: '28px' }}></span>
                </div>
            </div>
            <div className="card-body pt-0">
                <div className="row">
                    <div className="col-md-3 text-center mb-5">
                        <div className="placeholder-glow">
                            <span className="placeholder bg-secondary" style={{ width: '200px', height: '200px', borderRadius: '8px' }}></span>
                        </div>
                    </div>
                    <div className="col-md-9">
                        <div className="row">
                            {[...Array(8)].map((_, i) => (
                                <div key={i} className="col-md-6 mb-5">
                                    <div className="placeholder-glow">
                                        <span className="placeholder col-3" style={{ height: '12px' }}></span>
                                        <div className="mt-2">
                                            <span className="placeholder col-8" style={{ height: '20px' }}></span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="d-flex flex-column gap-7 gap-lg-10">
                <ProductSkeleton />
                <div className="row">
                    <div className="col-md-6">
                        <div className="card card-flush">
                            <div className="card-header">
                                <div className="placeholder-glow">
                                    <span className="placeholder col-3" style={{ height: '28px' }}></span>
                                </div>
                            </div>
                            <div className="card-body pt-0">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="d-flex justify-content-between align-items-center py-3 border-bottom">
                                        <div className="placeholder-glow">
                                            <span className="placeholder col-4" style={{ height: '16px' }}></span>
                                        </div>
                                        <div className="placeholder-glow">
                                            <span className="placeholder col-3" style={{ height: '16px' }}></span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="col-md-6">
                        <div className="card card-flush">
                            <div className="card-header">
                                <div className="placeholder-glow">
                                    <span className="placeholder col-3" style={{ height: '28px' }}></span>
                                </div>
                            </div>
                            <div className="card-body pt-0">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="d-flex justify-content-between align-items-center py-3 border-bottom">
                                        <div className="placeholder-glow">
                                            <span className="placeholder col-4" style={{ height: '16px' }}></span>
                                        </div>
                                        <div className="placeholder-glow">
                                            <span className="placeholder col-3" style={{ height: '16px' }}></span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="card card-flush">
                    <div className="card-header">
                        <div className="placeholder-glow">
                            <span className="placeholder col-3" style={{ height: '28px' }}></span>
                        </div>
                    </div>
                    <div className="card-body pt-0">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="d-flex justify-content-between align-items-center py-3 border-bottom">
                                <div className="placeholder-glow">
                                    <span className="placeholder col-4" style={{ height: '16px' }}></span>
                                </div>
                                <div className="placeholder-glow">
                                    <span className="placeholder col-3" style={{ height: '16px' }}></span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="alert alert-danger">
                Product not found.
            </div>
        );
    }

    return (
        <div className="d-flex flex-column gap-7 gap-lg-10">
            {/* Product Overview Card */}
            <div className="card card-flush">
                <div className="card-header">
                    <div className="card-title">
                        <h2>Product Overview</h2>
                    </div>
                </div>
                <div className="card-body pt-0">
                    <div className="row">
                        <div className="col-md-3 text-center mb-5">
                            {product.thumbnail || product.product_image ? (
                                <img
                                    src={product.thumbnail || product.product_image}
                                    alt={product.product_name || product.name}
                                    className="img-fluid rounded"
                                    style={{ maxWidth: '200px', maxHeight: '200px', objectFit: 'cover' }}
                                />
                            ) : (
                                <div className="bg-light d-flex align-items-center justify-content-center rounded" style={{ width: '200px', height: '200px', margin: '0 auto' }}>
                                    <i className="ki-duotone ki-picture text-muted fs-3x">
                                        <span className="path1"></span>
                                        <span className="path2"></span>
                                    </i>
                                </div>
                            )}
                        </div>
                        <div className="col-md-9">
                            <div className="row">
                                <div className="col-md-6 mb-5">
                                    <label className="form-label text-muted fs-7 fw-bold">Product Name</label>
                                    <div className="fs-5 fw-semibold">{product.product_name || product.name || 'N/A'}</div>
                                </div>
                                <div className="col-md-6 mb-5">
                                    <label className="form-label text-muted fs-7 fw-bold">SKU</label>
                                    <div className="fs-5">{product.sku || product.code || 'N/A'}</div>
                                </div>
                                <div className="col-md-6 mb-5">
                                    <label className="form-label text-muted fs-7 fw-bold">Barcode</label>
                                    <div className="fs-5">{product.barcode || 'N/A'}</div>
                                </div>
                                <div className="col-md-6 mb-5">
                                    <label className="form-label text-muted fs-7 fw-bold">Product Type</label>
                                    <div className="fs-5">
                                        <span className={`badge badge-light-${product.product_type === 'Combo' ? 'info' : 'primary'}`}>
                                            {product.product_type || 'Standard'}
                                        </span>
                                    </div>
                                </div>
                                <div className="col-md-6 mb-5">
                                    <label className="form-label text-muted fs-7 fw-bold">Status</label>
                                    <div>
                                        <span className={`badge badge-light-${product.product_status === 'published' ? 'success' : product.product_status === 'draft' ? 'warning' : 'danger'}`}>
                                            {product.product_status || 'draft'}
                                        </span>
                                    </div>
                                </div>
                                <div className="col-md-6 mb-5">
                                    <label className="form-label text-muted fs-7 fw-bold">Base Price</label>
                                    <div className="fs-5 fw-bold text-primary">{formatCurrency(product.base_price || product.price)}</div>
                                </div>
                                <div className="col-md-6 mb-5">
                                    <label className="form-label text-muted fs-7 fw-bold">Sale Price</label>
                                    <div className="fs-5 fw-bold text-success">{formatCurrency(product.sale_price)}</div>
                                </div>
                                <div className="col-md-6 mb-5">
                                    <label className="form-label text-muted fs-7 fw-bold">Quantity</label>
                                    <div className="fs-5">{product.quantity || product.stock || product.qty || 0}</div>
                                </div>
                                <div className="col-md-6 mb-5">
                                    <label className="form-label text-muted fs-7 fw-bold">Brand</label>
                                    <div className="fs-5">{product.brand?.name || 'N/A'}</div>
                                </div>
                                <div className="col-md-6 mb-5">
                                    <label className="form-label text-muted fs-7 fw-bold">Unit</label>
                                    <div className="fs-5">{product.unit?.name || 'N/A'}</div>
                                </div>
                                <div className="col-md-6 mb-5">
                                    <label className="form-label text-muted fs-7 fw-bold">Tax</label>
                                    <div className="fs-5">{product.tax_details?.name || product.tax?.name || 'N/A'}</div>
                                </div>
                                {product.description && (
                                    <div className="col-12 mb-5">
                                        <label className="form-label text-muted fs-7 fw-bold">Description</label>
                                        <div className="fs-6">{product.description}</div>
                                    </div>
                                )}
                                <div className="col-12 mb-5">
                                    <label className="form-label text-muted fs-7 fw-bold">Categories</label>
                                    <div className="d-flex flex-wrap gap-2">
                                        {product.categories && product.categories.length > 0 ? (
                                            product.categories.map((cat) => (
                                                <span key={cat.id || cat} className="badge badge-light-primary">
                                                    {cat.name || cat}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-muted">No categories</span>
                                        )}
                                    </div>
                                </div>
                                <div className="col-12 mb-5">
                                    <label className="form-label text-muted fs-7 fw-bold">Tags</label>
                                    <div className="d-flex flex-wrap gap-2">
                                        {product.tags && product.tags.length > 0 ? (
                                            product.tags.map((tag) => (
                                                <span key={tag.id || tag} className="badge badge-light-secondary">
                                                    {tag.name || tag}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-muted">No tags</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Latest Sales and Purchases Row */}
            <div className="row">
                {/* Latest Sales Card */}
                <div className="col-md-6">
                    <div className="card card-flush">
                        <div className="card-header">
                            <div className="card-title">
                                <h3>Latest Sales</h3>
                            </div>
                        </div>
                        <div className="card-body pt-0">
                            {loadingSales ? (
                                <div className="table-responsive">
                                    <table className="table table-row-dashed table-row-gray-300 align-middle gs-0 gy-4">
                                        <thead>
                                            <tr className="fw-bold text-muted">
                                                <th>Reference</th>
                                                <th>Date</th>
                                                <th>Qty</th>
                                                <th>Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {[...Array(5)].map((_, i) => (
                                                <tr key={`skeleton-sale-${i}`}>
                                                    <td><span className="placeholder col-8"></span></td>
                                                    <td><span className="placeholder col-9"></span></td>
                                                    <td><span className="placeholder col-6"></span></td>
                                                    <td><span className="placeholder col-7"></span></td>
                                                    <td><span className="placeholder col-7"></span></td>
                                                    <td><span className="placeholder col-7"></span></td>
                                                    <td className="text-end"><span className="placeholder col-4"></span></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : latestSales.length > 0 ? (
                                <div className="table-responsive">
                                    <table className="table table-row-dashed table-row-gray-300 align-middle gs-0 gy-4">
                                        <thead>
                                            <tr className="fw-bold text-muted">
                                                <th>Reference</th>
                                                <th>Date</th>
                                                <th>Qty</th>
                                                <th>Sale Price</th>
                                                <th>Cost Price</th>
                                                <th>Total</th>
                                                <th className="text-end">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {latestSales.map((sale) => (
                                                <tr key={sale.id}>
                                                    <td>
                                                        <span className="text-dark fw-bold">{sale.reference_no || `#${sale.id}`}</span>
                                                    </td>
                                                    <td>{formatDate(sale.created_at || sale.date)}</td>
                                                    <td>{sale.qty || sale.quantity || 0}</td>
                                                    <td className="text-success fw-semibold">{formatCurrency(sale.sale_price || sale.unit_price)}</td>
                                                    <td className="text-muted">{formatCurrency(sale.cost_price)}</td>
                                                    <td className="fw-bold text-success">{formatCurrency(sale.total || sale.grand_total)}</td>
                                                    <td className="text-end">
                                                        <Link
                                                            to={`/sales/sales-report/${sale.id}`}
                                                            className="btn btn-sm btn-light-primary"
                                                            title="View Sale"
                                                        >
                                                            <i className="ki-duotone ki-eye fs-3">
                                                                <span className="path1"></span>
                                                                <span className="path2"></span>
                                                                <span className="path3"></span>
                                                            </i>
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-5 text-muted">
                                    <i className="ki-duotone ki-information-5 fs-3x mb-3">
                                        <span className="path1"></span>
                                        <span className="path2"></span>
                                        <span className="path3"></span>
                                    </i>
                                    <div>No sales found for this product</div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Latest Purchases Card */}
                <div className="col-md-6">
                    <div className="card card-flush">
                        <div className="card-header">
                            <div className="card-title">
                                <h3>Latest Purchases</h3>
                            </div>
                        </div>
                        <div className="card-body pt-0">
                            {loadingPurchases ? (
                                <div className="table-responsive">
                                    <table className="table table-row-dashed table-row-gray-300 align-middle gs-0 gy-4">
                                        <thead>
                                            <tr className="fw-bold text-muted">
                                                <th>Reference</th>
                                                <th>Date</th>
                                                <th>Qty</th>
                                                <th>Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {[...Array(5)].map((_, i) => (
                                                <tr key={`skeleton-purchase-${i}`}>
                                                    <td><span className="placeholder col-8"></span></td>
                                                    <td><span className="placeholder col-9"></span></td>
                                                    <td><span className="placeholder col-6"></span></td>
                                                    <td><span className="placeholder col-7"></span></td>
                                                    <td><span className="placeholder col-6"></span></td>
                                                    <td><span className="placeholder col-7"></span></td>
                                                    <td className="text-end"><span className="placeholder col-4"></span></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : latestPurchases.length > 0 ? (
                                <div className="table-responsive">
                                    <table className="table table-row-dashed table-row-gray-300 align-middle gs-0 gy-4">
                                        <thead>
                                            <tr className="fw-bold text-muted">
                                                <th>Reference</th>
                                                <th>Date</th>
                                                <th>Qty</th>
                                                <th>Cost Price</th>
                                                <th>Discount</th>
                                                <th>Total</th>
                                                <th className="text-end">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {latestPurchases.map((purchase) => (
                                                <tr key={purchase.id}>
                                                    <td>
                                                        <span className="text-dark fw-bold">{purchase.reference_no || `#${purchase.id}`}</span>
                                                    </td>
                                                    <td>{formatDate(purchase.created_at || purchase.date)}</td>
                                                    <td>{purchase.qty || purchase.quantity || 0}</td>
                                                    <td className="text-primary fw-semibold">{formatCurrency(purchase.cost_price || purchase.unit_cost)}</td>
                                                    <td>
                                                        {purchase.discount && purchase.discount > 0 ? (
                                                            <span className="badge badge-light-warning">{formatCurrency(purchase.discount)}</span>
                                                        ) : (
                                                            <span className="text-muted">-</span>
                                                        )}
                                                    </td>
                                                    <td className="fw-bold text-primary">{formatCurrency(purchase.total || purchase.grand_total)}</td>
                                                    <td className="text-end">
                                                        <Link
                                                            to={`/sales/purchases/${purchase.id}`}
                                                            className="btn btn-sm btn-light-primary"
                                                            title="View Purchase"
                                                        >
                                                            <i className="ki-duotone ki-eye fs-3">
                                                                <span className="path1"></span>
                                                                <span className="path2"></span>
                                                                <span className="path3"></span>
                                                            </i>
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-5 text-muted">
                                    <i className="ki-duotone ki-information-5 fs-3x mb-3">
                                        <span className="path1"></span>
                                        <span className="path2"></span>
                                        <span className="path3"></span>
                                    </i>
                                    <div>No purchases found for this product</div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Warehouses Card */}
            <div className="card card-flush">
                <div className="card-header">
                    <div className="card-title">
                        <h3>Warehouses</h3>
                    </div>
                </div>
                <div className="card-body pt-0">
                    {loadingWarehouses ? (
                        <div className="table-responsive">
                            <table className="table table-row-dashed table-row-gray-300 align-middle gs-0 gy-4">
                                <thead>
                                    <tr className="fw-bold text-muted">
                                        <th>Warehouse Name</th>
                                        <th>Quantity</th>
                                        <th>Location</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[...Array(3)].map((_, i) => (
                                        <tr key={`skeleton-warehouse-${i}`}>
                                            <td><span className="placeholder col-8"></span></td>
                                            <td><span className="placeholder col-6"></span></td>
                                            <td><span className="placeholder col-9"></span></td>
                                            <td className="text-end"><span className="placeholder col-4"></span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : warehouses.length > 0 ? (
                        <div className="table-responsive">
                            <table className="table table-row-dashed table-row-gray-300 align-middle gs-0 gy-4">
                                <thead>
                                    <tr className="fw-bold text-muted">
                                        <th>Warehouse Name</th>
                                        <th>Quantity</th>
                                        <th>Location</th>
                                        <th className="text-end">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {warehouses.map((warehouse) => (
                                        <tr key={warehouse.id}>
                                            <td>
                                                <span className="text-dark fw-bold">{warehouse.name || 'N/A'}</span>
                                            </td>
                                            <td>
                                                <span className="badge badge-light-primary fs-6">
                                                    {warehouse.quantity || 0}
                                                </span>
                                            </td>
                                            <td className="text-muted">{warehouse.address || warehouse.location || warehouse.city || 'N/A'}</td>
                                            <td className="text-end">
                                                <Link
                                                    to={`/sales/warehouse/${warehouse.id}`}
                                                    className="btn btn-sm btn-light-primary"
                                                    title="View Warehouse"
                                                >
                                                    <i className="ki-duotone ki-eye fs-3">
                                                        <span className="path1"></span>
                                                        <span className="path2"></span>
                                                        <span className="path3"></span>
                                                    </i>
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-5 text-muted">
                            <i className="ki-duotone ki-information-5 fs-3x mb-3">
                                <span className="path1"></span>
                                <span className="path2"></span>
                                <span className="path3"></span>
                            </i>
                            <div>This product is not stored in any warehouse</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}


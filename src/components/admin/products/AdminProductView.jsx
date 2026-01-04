import React, { useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useToolbar } from '../../../contexts/ToolbarContext';
import { useAdminProduct } from '../../../services/adminProductsService';
import LoadingSpinner from '../../common/LoadingSpinner';
import { getTranslatedText } from '../../../utils/helpers';

const extractProductFromPayload = (payload) => {
    if (!payload) return null;

    const candidates = [
        payload?.data?.data,
        payload?.data?.product,
        payload?.product,
        (typeof payload?.data === 'object' && !Array.isArray(payload?.data)) ? payload.data : null,
    ];

    for (const candidate of candidates) {
        if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) {
            continue;
        }

        const hasDomainFields = ['id', 'product_name', 'name', 'sku', 'code'].some((key) => key in candidate);
        if (hasDomainFields) {
            return candidate;
        }
    }

    if (typeof payload === 'object' && !Array.isArray(payload)) {
        const hasDomainFields = ['id', 'product_name', 'name', 'sku', 'code'].some((key) => key in payload);
        const isMetaOnly = Object.keys(payload).length > 0 && Object.keys(payload).every((key) => (
            ['success', 'status', 'message', 'data', 'meta', 'pagination', 'errors', 'error'].includes(key)
        ));

        if (hasDomainFields && !isMetaOnly) {
            return payload;
        }
    }

    return null;
};

const isSuccessfulProductResponse = (payload) => {
    if (!payload) return false;
    if (payload.success === false || payload.status === false || payload.error) return false;
    if (payload.success === true || payload.status === true) return true;
    return !!extractProductFromPayload(payload);
};

const getPayloadMessage = (payload) => {
    if (!payload) return null;
    return payload.message || payload.error || payload?.data?.message || null;
};

const formatDateTime = (value) => {
    if (!value) return 'N/A';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 'N/A' : date.toLocaleString();
};

const AdminProductView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { setTitle, setActions } = useToolbar();
    useEffect(() => {
        setTitle('Product Details');
        setActions(
            <button className="btn btn-sm btn-secondary" onClick={() => navigate('/admin/sales/products')}>
                <i className="ki-duotone ki-arrow-left fs-2"><span className="path1"></span><span className="path2"></span></i>
                Back to List
            </button>
        );
        return () => setActions(null);
    }, [setTitle, setActions, navigate]);

    const {
        data: productResponse,
        isLoading,
        isFetching,
        error: productError,
    } = useAdminProduct(id);

    const product = useMemo(() => {
        if (!productResponse || !isSuccessfulProductResponse(productResponse)) return null;
        return extractProductFromPayload(productResponse);
    }, [productResponse]);

    useEffect(() => {
        if (!productResponse) return;
        if (!isSuccessfulProductResponse(productResponse)) {
            const message = getPayloadMessage(productResponse) || 'Failed to load product details';
            toast.error(message);
        }
    }, [productResponse]);

    useEffect(() => {
        if (!productError) return;
        const message = productError?.response?.data?.message || productError.message || 'Failed to load product details';
        toast.error(message);
    }, [productError]);

    if (isLoading) return <LoadingSpinner />;
    if (!product) return <div className="card"><div className="card-body text-center py-10"><div className="text-muted">Product not found</div></div></div>;

    const showRefreshing = isFetching && !isLoading;

    return (
        <div className="card">
            <div className="card-header">
                <h3 className="card-title">Product Information</h3>
            </div>
            <div className="card-body">
                {showRefreshing && (
                    <div className="alert alert-info d-flex align-items-center gap-2 mb-5">
                        <span className="spinner-border spinner-border-sm"></span>
                        <span>Refreshing product details...</span>
                    </div>
                )}
                <div className="row mb-7">
                    <label className="col-lg-4 fw-bold text-muted">Product ID</label>
                    <div className="col-lg-8"><span className="fw-bolder fs-6 text-gray-800">{product.id}</span></div>
                </div>
                <div className="row mb-7">
                    <label className="col-lg-4 fw-bold text-muted">Name</label>
                    <div className="col-lg-8"><span className="fw-bolder fs-6 text-gray-800">{product.product_name || product.name}</span></div>
                </div>
                {(product.sku || product.code) && (
                    <div className="row mb-7">
                        <label className="col-lg-4 fw-bold text-muted">SKU/Code</label>
                        <div className="col-lg-8"><span className="fw-bold fs-6 text-gray-800">{product.sku || product.code}</span></div>
                    </div>
                )}
                {product.barcode && (
                    <div className="row mb-7">
                        <label className="col-lg-4 fw-bold text-muted">Barcode</label>
                        <div className="col-lg-8"><span className="fw-bold fs-6 text-gray-800">{product.barcode}</span></div>
                    </div>
                )}
                {(product.base_price || product.sale_price) && (
                    <div className="row mb-7">
                        <label className="col-lg-4 fw-bold text-muted">Price</label>
                        <div className="col-lg-8">
                            <span className="fw-bold fs-6 text-gray-800">
                                Base: ${parseFloat(product.base_price || 0).toFixed(2)} | Sale: ${parseFloat(product.sale_price || 0).toFixed(2)}
                            </span>
                        </div>
                    </div>
                )}
                {product.category && (
                    <div className="row mb-7">
                        <label className="col-lg-4 fw-bold text-muted">Category</label>
                        <div className="col-lg-8"><span className="fw-bold fs-6 text-gray-800">{getTranslatedText(product.category.name) || 'N/A'}</span></div>
                    </div>
                )}
                {product.brand && (
                    <div className="row mb-7">
                        <label className="col-lg-4 fw-bold text-muted">Brand</label>
                        <div className="col-lg-8"><span className="fw-bold fs-6 text-gray-800">{getTranslatedText(product.brand.name) || 'N/A'}</span></div>
                    </div>
                )}
                {product.unit && (
                    <div className="row mb-7">
                        <label className="col-lg-4 fw-bold text-muted">Unit</label>
                        <div className="col-lg-8"><span className="fw-bold fs-6 text-gray-800">{getTranslatedText(product.unit.name) || 'N/A'}</span></div>
                    </div>
                )}
                {product.tax && (
                    <div className="row mb-7">
                        <label className="col-lg-4 fw-bold text-muted">Tax</label>
                        <div className="col-lg-8"><span className="fw-bold fs-6 text-gray-800">{`${getTranslatedText(product.tax.name) || 'N/A'} (${product.tax.rate ?? '0'}%)`}</span></div>
                    </div>
                )}
                {product.quantity !== undefined && (
                    <div className="row mb-7">
                        <label className="col-lg-4 fw-bold text-muted">Stock Quantity</label>
                        <div className="col-lg-8"><span className="badge badge-light-info fs-6">{product.quantity || 0} units</span></div>
                    </div>
                )}
                <div className="row mb-7">
                    <label className="col-lg-4 fw-bold text-muted">Created At</label>
                    <div className="col-lg-8"><span className="fw-bold fs-6 text-gray-800">{formatDateTime(product.created_at)}</span></div>
                </div>
            </div>
        </div>
    );
};

export default AdminProductView;


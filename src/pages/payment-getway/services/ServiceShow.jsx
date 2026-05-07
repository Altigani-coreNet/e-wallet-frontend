import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import { useToolbar } from '../../../contexts/ToolbarContext';
import { ADMIN_ENDPOINTS, AUTH_SERVICE_BASE } from '../../../utils/constants';
import { getToken } from '../../../utils/api';
import { fetchProductsByService, deleteProduct, toggleProductStatus } from '../../../services/serviceProductsService';
import ServiceProductModel from '../../../services/ServiceProductModel';
import ServiceModel from '../../../services/ServiceModel';

const ServiceShow = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { setTitle, setBreadcrumbs, setActions } = useToolbar();
    const [service, setService] = useState(null);
    const [countryDetails, setCountryDetails] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingProducts, setLoadingProducts] = useState(false);

    const resolveImageUrl = (path) => {
        if (!path) return '';
        if (/^https?:\/\//i.test(path)) return path;
        if (String(path).startsWith('uploads/')) {
            return `${AUTH_SERVICE_BASE}/${String(path).replace(/^\/+/, '')}`;
        }
        return `${AUTH_SERVICE_BASE}/storage/${String(path).replace(/^\/+/, '')}`;
    };

    const resolveProductImageUrl = (product) => {
        const raw = product?.image_url || product?.image || '';
        if (!raw) return '';
        // Some APIs return absolute image_url already; otherwise resolve relative paths.
        return resolveImageUrl(raw);
    };

    const getProductDisplayName = (product) => {
        return (
            product.name_en ||
            product.name_ar ||
            (typeof product.name === 'string' ? product.name : '') ||
            product.product_name ||
            'N/A'
        );
    };

    const getBilingualDescription = (svc) => {
        if (!svc) return { en: '', ar: '' };

        // Common shapes we may receive
        const directEn = svc.description_en || svc.descriptionEn || '';
        const directAr = svc.description_ar || svc.descriptionAr || '';

        if (directEn || directAr) {
            return { en: String(directEn || ''), ar: String(directAr || '') };
        }

        const raw = svc.description ?? svc.desc ?? null;
        if (!raw) return { en: '', ar: '' };

        // JSON string: {"en":"..","ar":".."} OR plain string
        if (typeof raw === 'string') {
            try {
                const parsed = JSON.parse(raw);
                if (parsed && typeof parsed === 'object') {
                    const en = parsed.en || parsed.EN || '';
                    const ar = parsed.ar || parsed.AR || '';
                    return { en: String(en || ''), ar: String(ar || '') };
                }
            } catch {
                // not JSON
            }
            return { en: raw, ar: '' };
        }

        // Object: { en, ar }
        if (typeof raw === 'object') {
            const en = raw.en || raw.EN || '';
            const ar = raw.ar || raw.AR || '';
            return { en: String(en || ''), ar: String(ar || '') };
        }

        return { en: String(raw), ar: '' };
    };

    useEffect(() => {
        setTitle('Service Details');
        setBreadcrumbs([
            { label: 'Home', path: '/admin' },
            { label: 'Services', path: '/admin/services' },
            { label: 'Service Details', path: `/admin/services/${id}`, active: true }
        ]);

        setActions(
            <div className="d-flex gap-2">
                <Link to={`/admin/services/${id}/edit`} className="btn btn-sm btn-primary">
                    <i className="ki-duotone ki-pencil fs-3 me-1">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    Edit Service
                </Link>
                <Link to="/admin/services" className="btn btn-sm btn-light">
                    <i className="ki-duotone ki-arrow-left fs-3 me-1">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    Back to Services
                </Link>
            </div>
        );

        return () => {
            setBreadcrumbs([]);
            setActions(null);
        };
    }, [id, setTitle, setBreadcrumbs, setActions]);

    useEffect(() => {
        loadService();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const loadService = async () => {
        try {
            setLoading(true);
            const response = await axios.get(ADMIN_ENDPOINTS.SERVICE_DETAILS(id), {
                headers: {
                    'Authorization': `Bearer ${getToken()}`,
                    'Accept': 'application/json'
                }
            });

            if (response.data.success) {
                const serviceData = response.data.data || response.data;
                const serviceModel = new ServiceModel(serviceData);
                setService(serviceModel);
                setCountryDetails(
                    serviceData?.country && typeof serviceData.country === 'object'
                        ? serviceData.country
                        : null
                );
                
                // Always fetch products from products endpoint to get complete fields (name/forms_count/status).
                loadProducts(serviceData.id);
            } else {
                toast.error('Failed to load service');
                navigate('/admin/services');
            }
        } catch (error) {
            console.error('Error loading service:', error);
            toast.error('Failed to load service');
            navigate('/admin/services');
        } finally {
            setLoading(false);
        }
    };

    const loadProducts = async (serviceUuid = null) => {
        const targetServiceId = serviceUuid || service?.id;
        if (!targetServiceId) {
            console.warn('Service not loaded yet, cannot fetch products');
            return;
        }
        
        try {
            setLoadingProducts(true);
            const response = await fetchProductsByService(targetServiceId);
            if (response.success) {
                const productsData = response.data?.data || response.data || [];
                setProducts(ServiceProductModel.fromApiResponseArray(Array.isArray(productsData) ? productsData : []));
            }
        } catch (error) {
            console.error('Error loading products:', error);
            toast.error('Failed to load products');
        } finally {
            setLoadingProducts(false);
        }
    };

    const handleDeleteProduct = async (productId) => {
        if (!window.confirm('Are you sure you want to delete this product?')) return;
        try {
            await deleteProduct(productId);
            toast.success('Product deleted successfully');
            loadProducts();
        } catch (error) {
            toast.error('Failed to delete product');
        }
    };

    const handleToggleProductStatus = async (productId) => {
        try {
            await toggleProductStatus(productId);
            toast.success('Product status updated successfully');
            loadProducts();
        } catch (error) {
            toast.error('Failed to update product status');
        }
    };

    if (loading) {
        return (
            <div className="row">
                {/* Service Details Card Skeleton */}
                <div className="col-12 mb-5">
                    <div className="card">
                        <div className="card-header">
                            <div className="placeholder col-3" style={{ height: '24px', borderRadius: '4px' }}></div>
                        </div>
                        <div className="card-body">
                            <div className="row">
                                {Array.from({ length: 8 }).map((_, index) => (
                                    <div key={index} className="col-md-6 mb-3">
                                        <div className="placeholder col-4 mb-2" style={{ height: '14px', borderRadius: '4px' }}></div>
                                        <div className="placeholder col-8" style={{ height: '20px', borderRadius: '4px' }}></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Products Table Skeleton */}
                <div className="col-12">
                    <div className="card">
                        <div className="card-header border-0 pt-6">
                            <div className="d-flex justify-content-between align-items-center w-100">
                                <div className="placeholder col-2" style={{ height: '24px', borderRadius: '4px' }}></div>
                                <div className="placeholder col-3" style={{ height: '38px', borderRadius: '4px' }}></div>
                            </div>
                        </div>
                        <div className="card-body pt-0">
                            <div className="table-responsive">
                                <table className="table align-middle table-row-dashed fs-6 gy-5">
                                    <thead>
                                        <tr>
                                            {Array.from({ length: 9 }).map((_, index) => (
                                                <th key={index}>
                                                    <div className="placeholder col-8" style={{ height: '16px', borderRadius: '4px' }}></div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Array.from({ length: 5 }).map((_, rowIndex) => (
                                            <tr key={rowIndex}>
                                                {Array.from({ length: 9 }).map((_, colIndex) => (
                                                    <td key={colIndex}>
                                                        <div className="placeholder col-10" style={{ height: '20px', borderRadius: '4px' }}></div>
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!service) {
        return (
            <div className="card">
                <div className="card-body text-center py-5">
                    <p className="text-muted">Service not found</p>
                    <Link to="/admin/services" className="btn btn-sm btn-primary">
                        Back to Services
                    </Link>
                </div>
            </div>
        );
    }

    const { en: descriptionEn, ar: descriptionAr } = getBilingualDescription(service);
    const countryCode =
        countryDetails?.code ||
        countryDetails?.short_name ||
        countryDetails?.code_iso2 ||
        service.country?.code ||
        service.country?.short_name ||
        '';
    const countryName =
        countryDetails?.text ||
        countryDetails?.name?.en ||
        countryDetails?.name?.ar ||
        countryDetails?.name_en ||
        countryDetails?.name_ar ||
        countryDetails?.name ||
        service.country?.name ||
        service.country?.short_name ||
        service.country_name ||
        'N/A';

    return (
        <div className="row">
            {/* Service Details Card */}
            <div className="col-12 mb-5">
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Service Details</h3>
                    </div>
                    <div className="card-body">
                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <label className="form-label text-muted">Service UUID</label>
                                <div className="fw-bold text-break">{service.id || 'N/A'}</div>
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="form-label text-muted">Service Name (EN)</label>
                                <div className="fw-bold">{service.service_name_en || service.service_name_text || 'N/A'}</div>
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="form-label text-muted">Service Name (AR)</label>
                                <div className="fw-bold">{service.service_name_ar || 'N/A'}</div>
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="form-label text-muted">Country</label>
                                <div className="d-flex align-items-center">
                                    {!!countryCode && (
                                        <img 
                                            src={`/flags/${String(countryCode).toLowerCase()}.png`} 
                                            alt={countryName || 'Country'}
                                            className="me-2"
                                            style={{ width: '20px', height: '15px', objectFit: 'cover' }}
                                            onError={(e) => { e.target.style.display = 'none'; }}
                                        />
                                    )}
                                    <span className="fw-bold">
                                        {countryName}
                                    </span>
                                </div>
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="form-label text-muted">Partner</label>
                                <div className="fw-bold">{service.partner?.name || service.merchant?.name || service.contentProvider?.name || 'N/A'}</div>
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="form-label text-muted">Service Category</label>
                                <div className="fw-bold">{service.category?.name_en || 'N/A'}</div>
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="form-label text-muted">Service Type</label>
                                <div>
                                    <span className="badge badge-light-info">
                                        {service.service_type === 'digital' ? 'Digital' : 
                                         service.service_type === 'ivr' ? 'IVR' : 
                                         service.service_type === 'sms' ? 'SMS' : 
                                         service.service_type || 'N/A'}
                                    </span>
                                </div>
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="form-label text-muted">Description (EN)</label>
                                <div className="fw-bold">{descriptionEn || 'N/A'}</div>
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="form-label text-muted">Description (AR)</label>
                                <div className="fw-bold" dir="rtl">{descriptionAr || 'N/A'}</div>
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="form-label text-muted">Status</label>
                                <div>
                                    <span className={`badge badge-light-${
                                        service.status === 'active' ? 'success' : 
                                        service.status === 'inactive' ? 'danger' : 
                                        service.status === 'pending' ? 'warning' :
                                        service.status === 'staging' ? 'primary' :
                                        service.status === 'testing' ? 'info' :
                                        'secondary'
                                    }`}>
                                        {service.status || 'N/A'}
                                    </span>
                                </div>
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="form-label text-muted">Active</label>
                                <div>
                                    <span className={`badge badge-light-${service.is_active ? 'success' : 'danger'}`}>
                                        {service.is_active ? 'Yes' : 'No'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Products Table */}
            <div className="col-12">
                <div className="card">
                    <div className="card-header border-0 pt-6">
                        <div className="card-title d-flex justify-content-between align-items-center w-100">
                            <h3 className="card-title">Products</h3>
                            <Link 
                                to={`/admin/service-products/create?service_id=${id}`}
                                className="btn btn-sm btn-primary"
                            >
                                <i className="ki-duotone ki-plus fs-3 me-1">
                                    <span className="path1"></span>
                                    <span className="path2"></span>
                                    <span className="path3"></span>
                                </i>
                                Add Product
                            </Link>
                        </div>
                    </div>
                    <div className="card-body pt-0">
                        {loadingProducts ? (
                            <div className="table-responsive">
                                <table className="table align-middle table-row-dashed fs-6 gy-5">
                                    <thead>
                                        <tr className="text-start text-muted fw-bold fs-7 text-uppercase gs-0">
                                            {Array.from({ length: 9 }).map((_, index) => (
                                                <th key={index}>
                                                    <div className="placeholder col-8" style={{ height: '16px', borderRadius: '4px' }}></div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Array.from({ length: 3 }).map((_, rowIndex) => (
                                            <tr key={rowIndex}>
                                                {Array.from({ length: 9 }).map((_, colIndex) => (
                                                    <td key={colIndex}>
                                                        <div className="placeholder col-10" style={{ height: '20px', borderRadius: '4px' }}></div>
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : products.length === 0 ? (
                            <div className="text-center py-5 text-muted">
                                <p>No products found for this service.</p>
                                <Link 
                                    to={`/admin/service-products/create?service_id=${id}`}
                                    className="btn btn-sm btn-primary"
                                >
                                    Add First Product
                                </Link>
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <table className="table align-middle table-row-dashed fs-6 gy-5">
                                    <thead>
                                        <tr className="text-start text-muted fw-bold fs-7 text-uppercase gs-0">
                                            <th className="min-w-250px">Product</th>
                                            <th className="min-w-120px">Status</th>
                                            <th className="min-w-120px">Forms</th>
                                            <th className="text-end min-w-240px">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-gray-600 fw-semibold">
                                        {products.map((product) => (
                                            <tr key={product.id}>
                                                <td>
                                                    <div className="d-flex align-items-center">
                                                        <div className="symbol symbol-45px me-3">
                                                            {resolveProductImageUrl(product) ? (
                                                                <img
                                                                    src={resolveProductImageUrl(product)}
                                                                    alt={getProductDisplayName(product)}
                                                                    className="rounded"
                                                                    style={{ width: '45px', height: '45px', objectFit: 'cover' }}
                                                                    onError={(e) => {
                                                                        e.currentTarget.style.display = 'none';
                                                                    }}
                                                                />
                                                            ) : (
                                                                <span className="symbol-label bg-light-primary text-primary">
                                                                    <i className="ki-duotone ki-package fs-2">
                                                                        <span className="path1"></span>
                                                                        <span className="path2"></span>
                                                                        <span className="path3"></span>
                                                                    </i>
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="d-flex flex-column">
                                                            <span className="text-gray-800 fw-bold">
                                                                {getProductDisplayName(product)}
                                                            </span>
                                                            <span className="text-muted fs-7">
                                                                {product.id || 'N/A'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className={`badge badge-light-${
                                                        product.status ? 'success' : 'danger'
                                                    }`}>
                                                        {product.status ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className="badge badge-light-info">
                                                        {(product.forms_count ?? product.service_forms?.length ?? 0)} Form(s)
                                                    </span>
                                                </td>
                                                <td className="text-end">
                                                    <Link
                                                        to={`/admin/service-products/${product.id}/edit?preview=1`}
                                                        className="btn btn-icon btn-bg-light btn-active-color-info btn-sm me-1"
                                                        title="Preview"
                                                    >
                                                        <i className="ki-duotone ki-eye fs-2">
                                                            <span className="path1"></span>
                                                            <span className="path2"></span>
                                                            <span className="path3"></span>
                                                        </i>
                                                    </Link>
                                                    <Link
                                                        to={`/admin/service-products/${product.id}/edit`}
                                                        className="btn btn-icon btn-bg-light btn-active-color-primary btn-sm me-1"
                                                        title="Edit"
                                                    >
                                                        <i className="ki-duotone ki-pencil fs-2">
                                                            <span className="path1"></span>
                                                            <span className="path2"></span>
                                                        </i>
                                                    </Link>
                                                    <button
                                                        className="btn btn-icon btn-bg-light btn-active-color-danger btn-sm"
                                                        onClick={() => handleDeleteProduct(product.id)}
                                                        title="Delete"
                                                    >
                                                        <i className="ki-duotone ki-trash fs-2">
                                                            <span className="path1"></span>
                                                            <span className="path2"></span>
                                                            <span className="path3"></span>
                                                            <span className="path4"></span>
                                                            <span className="path5"></span>
                                                        </i>
                                                    </button>
                                                    <button
                                                        className={`btn btn-icon btn-bg-light btn-sm ms-1 ${product.status ? 'btn-active-color-warning' : 'btn-active-color-success'}`}
                                                        onClick={() => handleToggleProductStatus(product.id)}
                                                        title={product.status ? 'Deactivate' : 'Activate'}
                                                    >
                                                        <i className="ki-duotone ki-switch fs-2">
                                                            <span className="path1"></span>
                                                            <span className="path2"></span>
                                                            <span className="path3"></span>
                                                        </i>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ServiceShow;


import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useToolbar } from '../../../contexts/ToolbarContext';
import { fetchProductsByService, createProduct, deleteProduct } from '../../../services/serviceProductsService';
import ServiceProductModel from '../../../services/ServiceProductModel';

const ServiceProducts = () => {
    const { id: serviceId } = useParams();
    const navigate = useNavigate();
    const { setTitle, setBreadcrumbs } = useToolbar();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [formData, setFormData] = useState({
        service_sub_category_id: "",
        type_id: "",
        country_id: "",
        name: { en: "", ar: "" },
        service_url: "",
        notify_url: "",
        prepay_url: "",
        image: "",
        status: true,
    });

    useEffect(() => {
        setTitle('Service Products');
        setBreadcrumbs([
            { label: 'Home', path: '/admin' },
            { label: 'Services', path: '/admin/services' },
            { label: 'Products', path: `/admin/services/${serviceId}/products`, active: true }
        ]);
        loadProducts();
    }, [serviceId, setTitle, setBreadcrumbs]);

    const loadProducts = async () => {
        setLoading(true);
        try {
            const response = await fetchProductsByService(serviceId);
            if (response.success) {
                setProducts(ServiceProductModel.fromApiResponseArray(response.data.data || []));
            }
        } catch (error) {
            toast.error('Failed to load products');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const result = await createProduct({
                ...formData,
                service_id: serviceId
            });
            if (result.success) {
                toast.success('Product created successfully');
                setShowAddForm(false);
                setFormData({
                    service_sub_category_id: "",
                    type_id: "",
                    country_id: "",
                    name: { en: "", ar: "" },
                    service_url: "",
                    notify_url: "",
                    prepay_url: "",
                    image: "",
                    status: true,
                });
                loadProducts();
            } else {
                toast.error(result.error || 'Failed to create product');
            }
        } catch (error) {
            toast.error('Failed to create product');
        }
    };

    const handleDelete = async (productId) => {
        if (!window.confirm('Are you sure you want to delete this product?')) return;
        try {
            await deleteProduct(productId);
            toast.success('Product deleted successfully');
            loadProducts();
        } catch (error) {
            toast.error('Failed to delete product');
        }
    };

    return (
        <div className="card">
            <div className="card-header">
                <h3 className="card-title">Products</h3>
                <div className="card-toolbar">
                    <button className="btn btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
                        {showAddForm ? 'Cancel' : 'Add Product'}
                    </button>
                </div>
            </div>
            <div className="card-body">
                {showAddForm && (
                    <form onSubmit={handleSubmit} className="mb-5 p-4 border rounded">
                        <h4>Add New Product</h4>
                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <label className="form-label">Name (English)</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={formData.name.en}
                                    onChange={(e) => setFormData({ ...formData, name: { ...formData.name, en: e.target.value } })}
                                />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="form-label">Name (Arabic)</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={formData.name.ar}
                                    onChange={(e) => setFormData({ ...formData, name: { ...formData.name, ar: e.target.value } })}
                                />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="form-label">Service Sub Category ID</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={formData.service_sub_category_id}
                                    onChange={(e) => setFormData({ ...formData, service_sub_category_id: e.target.value })}
                                />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="form-label">Type ID</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={formData.type_id}
                                    onChange={(e) => setFormData({ ...formData, type_id: e.target.value })}
                                />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="form-label">Country ID</label>
                                <input
                                    className="form-control"
                                    value={formData.country_id}
                                    onChange={(e) => setFormData({ ...formData, country_id: e.target.value })}
                                />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="form-label">Service URL</label>
                                <input
                                    className="form-control"
                                    value={formData.service_url}
                                    onChange={(e) => setFormData({ ...formData, service_url: e.target.value })}
                                />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="form-label">Notify URL</label>
                                <input
                                    className="form-control"
                                    value={formData.notify_url}
                                    onChange={(e) => setFormData({ ...formData, notify_url: e.target.value })}
                                />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="form-label">Prepay URL</label>
                                <input
                                    className="form-control"
                                    value={formData.prepay_url}
                                    onChange={(e) => setFormData({ ...formData, prepay_url: e.target.value })}
                                />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="form-label">Image</label>
                                <input
                                    className="form-control"
                                    value={formData.image}
                                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                                />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="form-label">Status</label>
                                <div className="form-check form-switch">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        checked={!!formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.checked })}
                                    />
                                    <label className="form-check-label">
                                        {formData.status ? 'Active' : 'Inactive'}
                                    </label>
                                </div>
                            </div>
                        </div>
                        <button type="submit" className="btn btn-primary">Create Product</button>
                    </form>
                )}

                {loading ? (
                    <div className="text-center py-5">Loading...</div>
                ) : products.length === 0 ? (
                    <div className="text-center py-5 text-muted">No products found</div>
                ) : (
                    <div className="table-responsive">
                        <table className="table table-striped">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Country</th>
                                    <th>Type</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map((product) => (
                                    <tr key={product.id}>
                                        <td>{product.name_en || product.name_ar || '-'}</td>
                                        <td>{product.country_id || '-'}</td>
                                        <td>{product.type_id || '-'}</td>
                                        <td>
                                            <span className={`badge badge-${product.isActive() ? 'success' : 'danger'}`}>
                                                {product.isActive() ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td>
                                            <button
                                                className="btn btn-sm btn-danger"
                                                onClick={() => handleDelete(product.id)}
                                            >
                                                Delete
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
    );
};

export default ServiceProducts;


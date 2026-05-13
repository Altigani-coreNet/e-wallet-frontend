import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { useToolbar } from '../../../contexts/ToolbarContext';
import { fetchProductsByService, createProduct, deleteProduct } from '../../../services/serviceProductsService';
import ServiceProductModel from '../../../services/ServiceProductModel';

const ServiceProducts = () => {
    const { t } = useTranslation();
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
        setTitle(t('admin.paymentGetway.titlesServiceProducts'));
        setBreadcrumbs([
            { label: t('admin.paymentGetway.breadcrumbsHome'), path: '/admin' },
            { label: t('admin.paymentGetway.breadcrumbsServices'), path: '/admin/services' },
            { label: t('admin.paymentGetway.breadcrumbsProducts'), path: `/admin/services/${serviceId}/products`, active: true }
        ]);
        loadProducts();
    }, [serviceId, setTitle, setBreadcrumbs, t]);

    const loadProducts = async () => {
        setLoading(true);
        try {
            const response = await fetchProductsByService(serviceId);
            if (response.success) {
                setProducts(ServiceProductModel.fromApiResponseArray(response.data.data || []));
            }
        } catch (error) {
            toast.error(t('admin.paymentGetway.svcProdFailedLoad'));
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
                toast.success(t('admin.paymentGetway.svcProdCreated'));
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
                toast.error(result.error || t('admin.paymentGetway.svcProdCreateFailed'));
            }
        } catch (error) {
            toast.error(t('admin.paymentGetway.svcProdCreateFailed'));
        }
    };

    const handleDelete = async (productId) => {
        if (!window.confirm(t('admin.paymentGetway.svcProdDeleteConfirm'))) return;
        try {
            await deleteProduct(productId);
            toast.success(t('admin.paymentGetway.svcProdDeleted'));
            loadProducts();
        } catch (error) {
            toast.error(t('admin.paymentGetway.productFailedDelete'));
        }
    };

    return (
        <div className="card">
            <div className="card-header">
                <h3 className="card-title">{t('admin.paymentGetway.viewProductCol')}</h3>
                <div className="card-toolbar">
                    <button className="btn btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
                        {showAddForm ? t('admin.common.cancel') : t('admin.paymentGetway.productAdd')}
                    </button>
                </div>
            </div>
            <div className="card-body">
                {showAddForm && (
                    <form onSubmit={handleSubmit} className="mb-5 p-4 border rounded">
                        <h4>{t('admin.paymentGetway.svcProdAddNewProduct')}</h4>
                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <label className="form-label">{t('admin.paymentGetway.subCatLabelNameEn')}</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={formData.name.en}
                                    onChange={(e) => setFormData({ ...formData, name: { ...formData.name, en: e.target.value } })}
                                />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="form-label">{t('admin.paymentGetway.subCatLabelNameAr')}</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={formData.name.ar}
                                    onChange={(e) => setFormData({ ...formData, name: { ...formData.name, ar: e.target.value } })}
                                />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="form-label">{t('admin.paymentGetway.svcProdLabelSubCatId')}</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={formData.service_sub_category_id}
                                    onChange={(e) => setFormData({ ...formData, service_sub_category_id: e.target.value })}
                                />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="form-label">{t('admin.paymentGetway.svcProdLabelTypeId')}</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={formData.type_id}
                                    onChange={(e) => setFormData({ ...formData, type_id: e.target.value })}
                                />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="form-label">{t('admin.paymentGetway.svcProdLabelCountryId')}</label>
                                <input
                                    className="form-control"
                                    value={formData.country_id}
                                    onChange={(e) => setFormData({ ...formData, country_id: e.target.value })}
                                />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="form-label">{t('admin.paymentGetway.svcProdLabelServiceUrl')}</label>
                                <input
                                    className="form-control"
                                    value={formData.service_url}
                                    onChange={(e) => setFormData({ ...formData, service_url: e.target.value })}
                                />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="form-label">{t('admin.paymentGetway.svcProdLabelNotifyUrl')}</label>
                                <input
                                    className="form-control"
                                    value={formData.notify_url}
                                    onChange={(e) => setFormData({ ...formData, notify_url: e.target.value })}
                                />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="form-label">{t('admin.paymentGetway.svcProdLabelPrepayUrl')}</label>
                                <input
                                    className="form-control"
                                    value={formData.prepay_url}
                                    onChange={(e) => setFormData({ ...formData, prepay_url: e.target.value })}
                                />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="form-label">{t('admin.paymentGetway.catLabelImage')}</label>
                                <input
                                    className="form-control"
                                    value={formData.image}
                                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                                />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="form-label">{t('admin.paymentGetway.status')}</label>
                                <div className="form-check form-switch">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        checked={!!formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.checked })}
                                    />
                                    <label className="form-check-label">
                                        {formData.status ? t('admin.common.active') : t('admin.common.inactive')}
                                    </label>
                                </div>
                            </div>
                        </div>
                        <button type="submit" className="btn btn-primary">{t('admin.paymentGetway.svcProdCreateProductBtn')}</button>
                    </form>
                )}

                {loading ? (
                    <div className="text-center py-5">{t('admin.paymentGetway.svcProdLoading')}</div>
                ) : products.length === 0 ? (
                    <div className="text-center py-5 text-muted">{t('admin.paymentGetway.svcProdNoProducts')}</div>
                ) : (
                    <div className="table-responsive">
                        <table className="table table-striped">
                            <thead>
                                <tr className="text-end text-muted fw-bold fs-7 text-uppercase gs-0">
                                    <th>{t('admin.paymentGetway.catColName')}</th>
                                    <th>{t('admin.paymentGetway.svcProdColCountry')}</th>
                                    <th>{t('admin.paymentGetway.svcProdColType')}</th>
                                    <th>{t('admin.paymentGetway.status')}</th>
                                    <th>{t('admin.common.actions')}</th>
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
                                                {product.isActive() ? t('admin.common.active') : t('admin.common.inactive')}
                                            </span>
                                        </td>
                                        <td>
                                            <button
                                                className="btn btn-sm btn-danger"
                                                onClick={() => handleDelete(product.id)}
                                            >
                                                {t('admin.common.delete')}
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


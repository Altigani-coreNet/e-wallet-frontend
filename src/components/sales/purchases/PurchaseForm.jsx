import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { POS_ENDPOINTS, POS_API_BASE } from '../../../utils/constants';
import { getToken } from '../../../utils/api';
import { getSuppliers } from '../../../services/suppliersService';
import ProductRow from './ProductRow';
import SerialNumbersModal from './SerialNumbersModal';

const createEmptyProduct = () => ({
    rowId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    product_id: '',
    product_name: '',
    product_label: '',
    product_code: '',
    quantity: '1',
    unit_price: 0,
    unit_name: '',
    unit_id: null,
    discount: '0',
    tax_rate: 0,
    tax: 0,
    is_batch: false,
    serial_imei_number: false,
    batch: '',
    expire_date: '',
    serial_numbers: []
});

const PurchaseForm = ({ formData, onChange, errors, onSubmit, isSubmitting, isEdit = false }) => {
    const [warehouses, setWarehouses] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [subtotal, setSubtotal] = useState(0);
    const [grandTotal, setGrandTotal] = useState(0);
    const [showSerialModal, setShowSerialModal] = useState(false);
    const [currentProductIndex, setCurrentProductIndex] = useState(null);
    const [loadingData, setLoadingData] = useState(true);
    const [productDetailsLoading, setProductDetailsLoading] = useState({});

    const hasProducts = useMemo(() => formData.products && formData.products.length > 0, [formData.products]);

    useEffect(() => {
        const loadData = async () => {
            setLoadingData(true);
            await Promise.all([
                fetchWarehouses(),
                fetchSuppliers(),
                fetchAccounts()
            ]);
            setLoadingData(false);
        };
        loadData();
    }, []);

    useEffect(() => {
        if (!hasProducts) {
            onChange({
                ...formData,
                products: [createEmptyProduct()]
            });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        calculateTotals();
    }, [formData.products, formData.shipping, formData.discount_total]);

    useEffect(() => {
        if (formData.products && formData.products.some((product) => !product.rowId)) {
            const enhancedProducts = formData.products.map((product) =>
                product.rowId
                    ? product
                    : {
                          ...product,
                          rowId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
                      }
            );
            onChange({ ...formData, products: enhancedProducts });
        }
    }, [formData.products, formData, onChange]);

    const fetchWarehouses = async () => {
        try {
            const token = getToken();
            const response = await axios.get(POS_ENDPOINTS.WAREHOUSES, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });
            
            if (response.data?.data) {
                const warehousesData = response.data.data.warehouses || response.data.data || [];
                setWarehouses(warehousesData);
            }
        } catch (error) {
            console.error('Error fetching warehouses:', error);
        }
    };

    const fetchSuppliers = async () => {
        try {
            const response = await getSuppliers({ per_page: 1000 });
            if (response.success) {
                const suppliersData = response.data?.suppliers || response.data?.data || [];
                setSuppliers(suppliersData);
            }
        } catch (error) {
            console.error('Error fetching suppliers:', error);
        }
    };


    const fetchAccounts = async () => {
        try {
            const token = getToken();
            const response = await axios.get(`${POS_API_BASE}/v1/admin/accounts`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });
            
            if (response.data?.data) {
                const accountsData = response.data.data.accounts || response.data.data || [];
                setAccounts(accountsData);
            }
        } catch (error) {
            console.error('Error fetching accounts:', error);
        }
    };

    const calculateTotals = () => {
        let calculatedSubtotal = 0;
        
        formData.products.forEach(product => {
            const base = parseFloat(product.quantity || 0) * parseFloat(product.unit_price || 0);
            const tax = (base * parseFloat(product.tax_rate || 0)) / 100;
            const discount = parseFloat(product.discount || 0);
            calculatedSubtotal += base + tax - discount;
        });

        setSubtotal(calculatedSubtotal);
        
        const shipping = parseFloat(formData.shipping || 0);
        const discountTotal = parseFloat(formData.discount_total || 0);
        setGrandTotal(calculatedSubtotal + shipping - discountTotal);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        onChange({ ...formData, [name]: value });
    };

    const handleAddProduct = () => {
        onChange({
            ...formData,
            products: [
                ...formData.products,
                createEmptyProduct()
            ]
        });
    };

    const handleRemoveProduct = (index) => {
        const removedRow = formData.products[index];
        const newProducts = formData.products.filter((_, i) => i !== index);
        onChange({ ...formData, products: newProducts });
        if (removedRow?.rowId) {
            setProductDetailsLoading((prev) => {
                const updated = { ...prev };
                delete updated[removedRow.rowId];
                return updated;
            });
        }
    };

    const handleProductChange = async (index, field, value) => {
        const newProducts = [...formData.products];
        const targetRowId = newProducts[index]?.rowId || index;
        newProducts[index] = { ...newProducts[index], [field]: value };

        // If product_id changed, fetch product details from API
        if (field === 'product_id' && value) {
            setProductDetailsLoading((prev) => ({ ...prev, [targetRowId]: true }));
            try {
                const token = getToken();
                const response = await axios.get(POS_ENDPOINTS.PRODUCT_DETAILS_FOR_PURCHASE(value), {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json'
                    }
                });

                console.log('Product details response:', response.data);

                if (response.data?.success && response.data?.data?.product) {
                    const productDetails = response.data.data.product;
                    const unitName = productDetails.unit?.name || productDetails.unit_name || '';
                    const unitId = productDetails.unit?.id || productDetails.unit_id || null;
                    const taxRate = productDetails.tax?.rate ?? productDetails.tax_rate ?? 0;
                    const baseName = productDetails.name || productDetails.product_name || '';
                    const identifier = productDetails.sku || productDetails.code || '';
                    const label = identifier ? `${baseName} (${identifier})` : baseName;
                    
                    newProducts[index] = {
                        ...newProducts[index],
                        product_id: value,
                        product_name: productDetails.name || productDetails.product_name || '',
                        product_label: label || productDetails.name || productDetails.product_name || '',
                        product_code: productDetails.sku || productDetails.code || '',
                        unit_price: productDetails.purchase_cost || productDetails.cost || productDetails.base_price || 0,
                        unit_name: unitName,
                        unit_id: unitId,
                        tax_rate: taxRate,
                        is_batch: productDetails.is_batch == 1 || productDetails.is_batch === true,
                        serial_imei_number: productDetails.serial_imei_number == 1 || productDetails.serial_imei_number === true,
                        batch: '',
                        expire_date: '',
                        serial_numbers: [],
                        tax: 0
                    };
                }
            } catch (error) {
                console.error('Error fetching product details:', error);
            } finally {
                setProductDetailsLoading((prev) => ({ ...prev, [targetRowId]: false }));
            }
        } else if (field === 'product_id' && !value) {
            newProducts[index] = {
                ...newProducts[index],
                product_id: '',
                product_name: '',
                product_label: '',
                product_code: '',
                unit_price: 0,
                unit_name: '',
                unit_id: null,
                tax_rate: 0,
                tax: 0,
                is_batch: false,
                serial_imei_number: false,
                batch: '',
                expire_date: '',
                serial_numbers: []
            };
            setProductDetailsLoading((prev) => {
                const updated = { ...prev };
                delete updated[targetRowId];
                return updated;
            });
        }

        onChange({ ...formData, products: newProducts });
    };

    const handleProductMetaUpdate = (index, metadata) => {
        const newProducts = [...formData.products];
        if (metadata) {
            newProducts[index] = {
                ...newProducts[index],
                product_label: metadata.text || metadata.name || '',
                product_code: metadata.code || ''
            };
        } else {
            newProducts[index] = {
                ...newProducts[index],
                product_label: '',
                product_code: ''
            };
        }
        onChange({ ...formData, products: newProducts });
    };

    const handleManageSerials = (index) => {
        setCurrentProductIndex(index);
        setShowSerialModal(true);
    };

    const handleSaveSerials = (serials) => {
        if (currentProductIndex !== null) {
            const newProducts = [...formData.products];
            newProducts[currentProductIndex].serial_numbers = serials;
            onChange({ ...formData, products: newProducts });
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Validation
        if (formData.products.length === 0) {
            alert('Please add at least one product');
            return;
        }

        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit}>
            {/* Purchase Information Card */}
            <div className="card">
                {errors.general && (
                    <div className="alert alert-danger mt-3 mx-5">
                        {errors.general}
                    </div>
                )}

                <div className="card-header border-1 p-4">
                    <div className="card-title">
                        <h3 className="fw-bold">{isEdit ? 'Edit Purchase' : 'Add Purchase'}</h3>
                    </div>
                </div>

                <div className="card-body pt-0">
                    <div className="row">
                        {/* Supplier */}
                        <div className="col-md-6">
                            <div className="mb-5">
                                <label className="form-label required">Supplier</label>
                                <select
                                    name="supplier_id"
                                    className={`form-select ${errors.supplier_id ? 'is-invalid' : ''}`}
                                    value={formData.supplier_id}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Select Supplier</option>
                                    {suppliers.map((supplier) => (
                                        <option key={supplier.id} value={supplier.id}>
                                            {supplier.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.supplier_id && <div className="invalid-feedback">{errors.supplier_id[0]}</div>}
                            </div>
                        </div>

                        {/* Warehouse */}
                        <div className="col-md-6">
                            <div className="mb-5">
                                <label className="form-label required">Warehouse</label>
                                <select
                                    name="warehouse_id"
                                    className={`form-select ${errors.warehouse_id ? 'is-invalid' : ''}`}
                                    value={formData.warehouse_id}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Select Warehouse</option>
                                    {warehouses.map((warehouse) => (
                                        <option key={warehouse.id} value={warehouse.id}>
                                            {warehouse.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.warehouse_id && <div className="invalid-feedback">{errors.warehouse_id[0]}</div>}
                            </div>
                        </div>

                        {/* Purchase Date */}
                        <div className="col-md-6">
                            <div className="mb-5">
                                <label className="form-label required">Purchase Date</label>
                                <input
                                    type="date"
                                    name="date"
                                    className={`form-control ${errors.date ? 'is-invalid' : ''}`}
                                    value={formData.date}
                                    onChange={handleChange}
                                    required
                                />
                                {errors.date && <div className="invalid-feedback">{errors.date[0]}</div>}
                            </div>
                        </div>

                        {/* Payment Method */}
                        <div className="col-md-6">
                            <div className="mb-5">
                                <label className="form-label required">Payment Method</label>
                                <select
                                    name="payment_method"
                                    className="form-select"
                                    value={formData.payment_method}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="Cash">Cash</option>
                                    <option value="Bank">Bank</option>
                                    <option value="Cheque">Cheque</option>
                                    <option value="Card">Card</option>
                                </select>
                            </div>
                        </div>

                        {/* Account (shown only if Bank) */}
                        {formData.payment_method === 'Bank' && (
                            <div className="col-md-6">
                                <div className="mb-5">
                                    <label className="form-label required">Account</label>
                                    <select
                                        name="account_id"
                                        className={`form-select ${errors.account_id ? 'is-invalid' : ''}`}
                                        value={formData.account_id || ''}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">Select Account</option>
                                        {accounts.map((account) => (
                                            <option key={account.id} value={account.id}>
                                                {account.name}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.account_id && <div className="invalid-feedback">{errors.account_id[0]}</div>}
                                </div>
                            </div>
                        )}

                        {/* Notes */}
                        <div className="col-md-6">
                            <div className="mb-5">
                                <label className="form-label">Notes</label>
                                <textarea
                                    name="note"
                                    className="form-control"
                                    rows="3"
                                    value={formData.note}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Products Table */}
                    <div className="card mt-5">
                        <div className="card-header">
                            <h3 className="card-title">Products</h3>
                            <div className="card-toolbar">
                                <button
                                    type="button"
                                    className="btn btn-sm btn-primary"
                                    onClick={handleAddProduct}
                                    disabled={loadingData}
                                >
                                    <i className="ki-duotone ki-plus fs-2"></i>
                                    Add Product
                                </button>
                            </div>
                        </div>
                        <div className="card-body">
                            {errors.products && (
                                <div className="alert alert-danger">{errors.products[0]}</div>
                            )}
                            
                            <div className="table-responsive">
                                <table className="table table-row-bordered table-row-gray-100 align-middle gs-0 gy-3">
                                    <thead>
                                        <tr className="fw-bold text-muted">
                                            <th>Product</th>
                                            <th>Quantity</th>
                                            <th>Unit</th>
                                            <th>Purchase Cost</th>
                                            <th>Discount</th>
                                            <th>Tax</th>
                                            <th>Batch Number</th>
                                            <th>Expiry Date</th>
                                            <th>Serial/IMEI</th>
                                            <th>Total</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {formData.products.length === 0 ? (
                                            <tr>
                                                <td colSpan="11" className="text-center py-5 text-muted">
                                                    No products added. Click "Add Product" to start.
                                                </td>
                                            </tr>
                                        ) : (
                                            formData.products.map((product, index) => (
                                                <ProductRow
                                                    key={product.rowId || product.id || index}
                                                    product={product}
                                                    index={index}
                                                    onChange={handleProductChange}
                                                    onRemove={handleRemoveProduct}
                                                    onManageSerials={handleManageSerials}
                                                    onProductMeta={handleProductMetaUpdate}
                                                    isLoadingDetails={!!productDetailsLoading[product.rowId || index]}
                                                />
                                            ))
                                        )}
                                    </tbody>
                                    <tfoot>
                                        <tr>
                                            <td colSpan="9" className="text-end fw-bold">Subtotal</td>
                                            <td colSpan="2">
                                                <input
                                                    type="number"
                                                    className="form-control fw-bold"
                                                    value={subtotal.toFixed(2)}
                                                    readOnly
                                                />
                                            </td>
                                        </tr>
                                        <tr>
                                            <td colSpan="9" className="text-end">
                                                <label className="form-label">Shipment Cost</label>
                                            </td>
                                            <td colSpan="2">
                                <input
                                    type="number"
                                    name="shipping"
                                    className="form-control"
                                    min="0"
                                    step="0.01"
                                    value={formData.shipping || ''}
                                    onChange={handleChange}
                                    onBlur={(e) => {
                                        if (!e.target.value) {
                                            onChange({ ...formData, shipping: 0 });
                                        }
                                    }}
                                    placeholder="0.00"
                                />
                                            </td>
                                        </tr>
                                        <tr>
                                            <td colSpan="9" className="text-end">
                                                <label className="form-label">Discount Total</label>
                                            </td>
                                            <td colSpan="2">
                                <input
                                    type="number"
                                    name="discount_total"
                                    className="form-control"
                                    min="0"
                                    step="0.01"
                                    value={formData.discount_total || ''}
                                    onChange={handleChange}
                                    onBlur={(e) => {
                                        if (!e.target.value) {
                                            onChange({ ...formData, discount_total: 0 });
                                        }
                                    }}
                                    placeholder="0.00"
                                />
                                            </td>
                                        </tr>
                                        <tr>
                                            <td colSpan="9" className="text-end fw-bold">Grand Total</td>
                                            <td colSpan="2" className="fw-bold fs-4 text-primary">
                                                ${grandTotal.toFixed(2)}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td colSpan="9" className="text-end">
                                                <label className="form-label">Paid Amount</label>
                                            </td>
                                            <td colSpan="2">
                                <input
                                    type="number"
                                    name="paid_amount"
                                    className="form-control"
                                    min="0"
                                    step="0.01"
                                    value={formData.paid_amount || ''}
                                    onChange={handleChange}
                                    onBlur={(e) => {
                                        if (!e.target.value) {
                                            onChange({ ...formData, paid_amount: 0 });
                                        }
                                    }}
                                    placeholder="0.00"
                                />
                                            </td>
                                        </tr>
                                        <tr>
                                            <td colSpan="9" className="text-end fw-bold">Remaining Amount</td>
                                            <td colSpan="2" className="fw-bold text-danger">
                                                ${(grandTotal - parseFloat(formData.paid_amount || 0)).toFixed(2)}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    </div>


                    <div className="text-end mt-5">
                        <button 
                            type="submit" 
                            className="btn btn-primary"
                            disabled={isSubmitting || formData.products.length === 0}
                        >
                            {isSubmitting ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2"></span>
                                    Saving...
                                </>
                            ) : (
                                'Save'
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Serial Numbers Modal */}
            <SerialNumbersModal
                show={showSerialModal}
                onClose={() => setShowSerialModal(false)}
                onSave={handleSaveSerials}
                serialNumbers={currentProductIndex !== null ? formData.products[currentProductIndex]?.serial_numbers || [] : []}
            />
        </form>
    );
};

export default PurchaseForm;


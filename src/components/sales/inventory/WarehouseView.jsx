import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
    fetchWarehouseDetails,
    fetchWarehouseProducts,
    fetchWarehouseTransactions,
    receiveWarehouseGoods,
    transferWarehouseGoods,
    transferWarehouseToStore,
    fetchWarehouses,
} from '../../../services/inventoryService';
import { useToolbar } from '../../../contexts/ToolbarContext';
import { formatDate } from '../../../utils/dateUtils';
import LoadingSpinner from '../../common/LoadingSpinner';
import ProductSearchSelect from '../purchases/ProductSearchSelect';

const PRODUCTS_PAGE_SIZE = 10;
const TRANSACTIONS_PAGE_SIZE = 10;

const defaultPagination = {
    current_page: 1,
    per_page: 10,
    total: 0,
    last_page: 1,
};

export default function WarehouseView() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { setTitle, setBreadcrumbs } = useToolbar();

    const [warehouse, setWarehouse] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const [products, setProducts] = useState([]);
    const [productsPagination, setProductsPagination] = useState({ ...defaultPagination, per_page: PRODUCTS_PAGE_SIZE });
    const [productsPage, setProductsPage] = useState(1);
    const [productsSearch, setProductsSearch] = useState('');
    const [productsSummary, setProductsSummary] = useState({ total_quantity: 0, total_value: 0 });
    const [isProductsLoading, setIsProductsLoading] = useState(false);

    const [transactions, setTransactions] = useState([]);
    const [transactionsPagination, setTransactionsPagination] = useState({ ...defaultPagination, per_page: TRANSACTIONS_PAGE_SIZE });
    const [transactionsPage, setTransactionsPage] = useState(1);
    const [transactionsSearch, setTransactionsSearch] = useState('');
    const [isTransactionsLoading, setIsTransactionsLoading] = useState(false);

    const [receiveForm, setReceiveForm] = useState({ product_id: '', quantity: '', notes: '' });
    const [transferForm, setTransferForm] = useState({ product_id: '', destination_warehouse_id: '', quantity: '', notes: '' });
    const [storeForm, setStoreForm] = useState({ product_id: '', quantity: '', notes: '' });
    const [formKeys, setFormKeys] = useState({ receive: 0, transfer: 0, store: 0 });

    const [receiveSubmitting, setReceiveSubmitting] = useState(false);
    const [transferSubmitting, setTransferSubmitting] = useState(false);
    const [storeSubmitting, setStoreSubmitting] = useState(false);

    const [warehouseOptions, setWarehouseOptions] = useState([]);

    useEffect(() => {
        setTitle('Warehouse Details');
        setBreadcrumbs([
            { label: 'Dashboard', path: '/sales/dashboard' },
            { label: 'Product Management', path: '#' },
            { label: 'Warehouse', path: '/sales/warehouse' },
            { label: 'View Warehouse', path: `/sales/warehouse/${id}`, active: true }
        ]);

        return () => setBreadcrumbs([]);
    }, [id, setTitle, setBreadcrumbs]);

    useEffect(() => {
        loadWarehouse();
        loadTransferOptions();
        setProductsPage(1);
        setProductsSearch('');
        setTransactionsPage(1);
        setTransactionsSearch('');
    }, [id]);

    useEffect(() => {
        if (id) {
            loadProducts();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, productsPage, productsSearch]);

    useEffect(() => {
        if (id) {
            loadTransactions();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, transactionsPage, transactionsSearch]);

    const loadWarehouse = async () => {
        setIsLoading(true);
        try {
            const response = await fetchWarehouseDetails(id);
            const warehouseData = response.data?.warehouse || response.data;
            setWarehouse(warehouseData);
        } catch (error) {
            console.error('Error fetching warehouse:', error);
            toast.error('Failed to load warehouse details');
            navigate('/sales/warehouse');
        } finally {
            setIsLoading(false);
        }
    };

    const loadTransferOptions = async () => {
        try {
            const response = await fetchWarehouses({ page: 1, per_page: 100 });
            const items = response.data?.warehouses || [];
            const filtered = items.filter((item) => String(item.id) !== String(id));
            setWarehouseOptions(filtered);
        } catch (error) {
            console.error('Error loading warehouse options:', error);
        }
    };

    const loadProducts = async () => {
        setIsProductsLoading(true);
        try {
            const response = await fetchWarehouseProducts(id, {
                page: productsPage,
                per_page: PRODUCTS_PAGE_SIZE,
                search: productsSearch || undefined,
            });
            const data = response.data || {};
            setProducts(data.products || []);
            setProductsPagination(data.pagination || { ...defaultPagination, per_page: PRODUCTS_PAGE_SIZE });
            setProductsSummary(data.summary || { total_quantity: 0, total_value: 0 });
        } catch (error) {
            console.error('Error fetching warehouse products:', error);
            toast.error('Failed to load warehouse products');
        } finally {
            setIsProductsLoading(false);
        }
    };

    const loadTransactions = async () => {
        setIsTransactionsLoading(true);
        try {
            const response = await fetchWarehouseTransactions(id, {
                page: transactionsPage,
                per_page: TRANSACTIONS_PAGE_SIZE,
                search: transactionsSearch || undefined,
            });
            const data = response.data || {};
            setTransactions(data.transactions || []);
            setTransactionsPagination(data.pagination || { ...defaultPagination, per_page: TRANSACTIONS_PAGE_SIZE });
        } catch (error) {
            console.error('Error fetching warehouse transactions:', error);
            toast.error('Failed to load inventory transactions');
        } finally {
            setIsTransactionsLoading(false);
        }
    };

    const closeModal = (modalId) => {
        const modalElement = document.getElementById(modalId);
        if (!modalElement) return;
        const modalInstance = window.bootstrap?.Modal.getInstance(modalElement);
        if (modalInstance) {
            modalInstance.hide();
        }
    };

    const resetReceiveForm = () => {
        setReceiveForm({ product_id: '', quantity: '', notes: '' });
        setFormKeys((prev) => ({ ...prev, receive: prev.receive + 1 }));
    };

    const resetTransferForm = () => {
        setTransferForm({ product_id: '', destination_warehouse_id: '', quantity: '', notes: '' });
        setFormKeys((prev) => ({ ...prev, transfer: prev.transfer + 1 }));
    };

    const resetStoreForm = () => {
        setStoreForm({ product_id: '', quantity: '', notes: '' });
        setFormKeys((prev) => ({ ...prev, store: prev.store + 1 }));
    };

    const handleReceiveSubmit = async (event) => {
        event.preventDefault();
        if (!receiveForm.product_id) {
            toast.error('Please select a product');
            return;
        }
        if (!receiveForm.quantity) {
            toast.error('Please enter a quantity');
            return;
        }

        setReceiveSubmitting(true);
        try {
            await receiveWarehouseGoods(id, {
                ...receiveForm,
                quantity: Number(receiveForm.quantity),
            });
            toast.success('Goods received successfully');
            resetReceiveForm();
            closeModal('receiveGoodsModal');
            loadProducts();
            loadWarehouse();
        } catch (error) {
            console.error('Error receiving goods:', error);
            toast.error(error.response?.data?.message || 'Failed to receive goods');
        } finally {
            setReceiveSubmitting(false);
        }
    };

    const handleTransferSubmit = async (event) => {
        event.preventDefault();
        if (!transferForm.product_id) {
            toast.error('Please select a product');
            return;
        }
        if (!transferForm.destination_warehouse_id) {
            toast.error('Please select a destination warehouse');
            return;
        }
        if (!transferForm.quantity) {
            toast.error('Please enter a quantity');
            return;
        }

        setTransferSubmitting(true);
        try {
            await transferWarehouseGoods(id, {
                ...transferForm,
                quantity: Number(transferForm.quantity),
            });
            toast.success('Goods transferred successfully');
            resetTransferForm();
            closeModal('transferGoodsModal');
            loadProducts();
            loadWarehouse();
        } catch (error) {
            console.error('Error transferring goods:', error);
            toast.error(error.response?.data?.message || 'Failed to transfer goods');
        } finally {
            setTransferSubmitting(false);
        }
    };

    const handleStoreSubmit = async (event) => {
        event.preventDefault();
        if (!storeForm.product_id) {
            toast.error('Please select a product');
            return;
        }
        if (!storeForm.quantity) {
            toast.error('Please enter a quantity');
            return;
        }

        setStoreSubmitting(true);
        try {
            await transferWarehouseToStore(id, {
                ...storeForm,
                quantity: Number(storeForm.quantity),
            });
            toast.success('Goods transferred to store successfully');
            resetStoreForm();
            closeModal('transferToStoreModal');
            loadProducts();
            loadWarehouse();
        } catch (error) {
            console.error('Error transferring goods to store:', error);
            toast.error(error.response?.data?.message || 'Failed to transfer goods to store');
        } finally {
            setStoreSubmitting(false);
        }
    };

    const productsRange = useMemo(() => {
        const pagination = productsPagination || defaultPagination;
        if (!pagination.total) return { start: 0, end: 0 };
        const start = (pagination.current_page - 1) * pagination.per_page + 1;
        const end = Math.min(pagination.current_page * pagination.per_page, pagination.total);
        return { start, end };
    }, [productsPagination]);

    const transactionsRange = useMemo(() => {
        const pagination = transactionsPagination || defaultPagination;
        if (!pagination.total) return { start: 0, end: 0 };
        const start = (pagination.current_page - 1) * pagination.per_page + 1;
        const end = Math.min(pagination.current_page * pagination.per_page, pagination.total);
        return { start, end };
    }, [transactionsPagination]);

    if (isLoading) {
        return <LoadingSpinner />;
    }

    if (!warehouse) {
        return (
            <div className="card">
                <div className="card-body text-center py-10">
                    <p className="text-muted">Warehouse not found</p>
                    <Link to="/sales/warehouse" className="btn btn-primary mt-3">
                        Back to Warehouse List
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="card">
                <div className="card-header border-0 pt-6 align-items-center">
                    <div className="card-title">
                        <h2>Warehouse Details</h2>
                    </div>
                    <div className="card-toolbar d-flex align-items-center gap-2">
                        <Link to="/sales/warehouse" className="btn btn-sm btn-light-danger">
                            <i className="ki-duotone ki-arrow-left fs-5 me-1">
                                <span className="path1"></span>
                                <span className="path2"></span>
                            </i>
                            Back
                        </Link>
                        <Link to={`/sales/warehouse/${id}/edit`} className="btn btn-sm btn-primary">
                            <i className="ki-duotone ki-pencil fs-5 me-1">
                                <span className="path1"></span>
                                <span className="path2"></span>
                            </i>
                            Edit
                        </Link>
                        <div className="dropdown">
                            <button
                                className="btn btn-sm btn-light"
                                type="button"
                                data-bs-toggle="dropdown"
                                aria-expanded="false"
                            >
                                Actions
                                <i className="ki-duotone ki-down fs-5 ms-1"></i>
                            </button>
                            <ul className="dropdown-menu dropdown-menu-end">
                                <li>
                                    <button className="dropdown-item" data-bs-toggle="modal" data-bs-target="#receiveGoodsModal">
                                        <i className="ki-duotone ki-plus fs-5 me-2">
                                            <span className="path1"></span>
                                            <span className="path2"></span>
                                        </i>
                                        Receive Goods
                                    </button>
                                </li>
                                <li>
                                    <button className="dropdown-item" data-bs-toggle="modal" data-bs-target="#transferGoodsModal">
                                        <i className="ki-duotone ki-switch fs-5 me-2">
                                            <span className="path1"></span>
                                            <span className="path2"></span>
                                        </i>
                                        Transfer Goods
                                    </button>
                                </li>
                                <li>
                                    <button className="dropdown-item" data-bs-toggle="modal" data-bs-target="#transferToStoreModal">
                                        <i className="ki-duotone ki-shop fs-5 me-2">
                                            <span className="path1"></span>
                                            <span className="path2"></span>
                                        </i>
                                        Transfer to Store
                                    </button>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div className="card-body py-4">
                    <div className="row">
                        <div className="col-md-6 mb-5">
                            <label className="form-label fw-bold text-muted">ID</label>
                            <div>
                                <span className="badge badge-light-primary fs-6">{warehouse.id}</span>
                            </div>
                        </div>
                        <div className="col-md-6 mb-5">
                            <label className="form-label fw-bold text-muted">Status</label>
                            <div>
                                <span className={`badge ${warehouse.status ? 'badge-light-success' : 'badge-light-danger'} fs-6`}>
                                    {warehouse.status ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                        </div>
                        <div className="col-md-6 mb-5">
                            <label className="form-label fw-bold text-muted">Warehouse Name</label>
                            <div className="fs-5 text-dark fw-bold">{warehouse.name}</div>
                        </div>
                        <div className="col-md-6 mb-5">
                            <label className="form-label fw-bold text-muted">Phone</label>
                            <div className="fs-5 text-dark">{warehouse.phone || <span className="text-muted">-</span>}</div>
                        </div>
                        <div className="col-md-6 mb-5">
                            <label className="form-label fw-bold text-muted">Email</label>
                            <div className="fs-5 text-dark">
                                {warehouse.email ? (
                                    <a href={`mailto:${warehouse.email}`} className="text-primary">
                                        {warehouse.email}
                                    </a>
                                ) : (
                                    <span className="text-muted">-</span>
                                )}
                            </div>
                        </div>
                        <div className="col-md-6 mb-5">
                            <label className="form-label fw-bold text-muted">City</label>
                            <div className="fs-5 text-dark">{warehouse.city || <span className="text-muted">-</span>}</div>
                        </div>
                        <div className="col-md-12 mb-5">
                            <label className="form-label fw-bold text-muted">Address</label>
                            <div className="fs-5 text-dark">{warehouse.address || <span className="text-muted">-</span>}</div>
                        </div>
                        <div className="col-md-6 mb-5">
                            <label className="form-label fw-bold text-muted">Total Purchases</label>
                            <div className="fs-5">
                                <span className="badge badge-light-success fs-6">
                                    {warehouse.total_purchages || 0} purchases
                                </span>
                            </div>
                        </div>
                        <div className="col-md-6 mb-5">
                            <label className="form-label fw-bold text-muted">Created At</label>
                            <div className="fs-6 text-muted">{warehouse.created_at ? formatDate(warehouse.created_at) : '-'}</div>
                        </div>
                        <div className="col-md-6 mb-5">
                            <label className="form-label fw-bold text-muted">Updated At</label>
                            <div className="fs-6 text-muted">{warehouse.updated_at ? formatDate(warehouse.updated_at) : '-'}</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="card mt-5">
                <div className="card-header border-0 pt-6 align-items-center">
                    <div className="card-title">
                        <h2>Products in Warehouse</h2>
                    </div>
                    <div className="card-toolbar">
                        <div className="d-flex align-items-center position-relative">
                            <i className="bx bx-search fs-3 position-absolute ms-3"></i>
                            <input
                                type="text"
                                className="form-control form-control-solid w-250px ps-5"
                                placeholder="Search products..."
                                value={productsSearch}
                                onChange={(event) => {
                                    setProductsSearch(event.target.value);
                                    setProductsPage(1);
                                }}
                            />
                        </div>
                    </div>
                </div>
                <div className="card-body py-4">
                    {isProductsLoading ? (
                        <div className="text-center py-10">
                            <div className="spinner-border text-primary"></div>
                        </div>
                    ) : (
                        <>
                            <div className="table-responsive">
                                <table className="table align-middle table-row-dashed fs-6 gy-5">
                                    <thead>
                                        <tr className="text-start text-gray-500 fw-bold fs-7 text-uppercase gs-0">
                                            <th>Product</th>
                                            <th>SKU</th>
                                            <th>Barcode</th>
                                            <th>Quantity</th>
                                            <th>Minimum</th>
                                            <th>Unit Price</th>
                                            <th>Total Value</th>
                                        </tr>
                                    </thead>
                                    <tbody className="fw-semibold text-gray-600">
                                        {products.length > 0 ? (
                                            products.map((product) => (
                                                <tr key={`${product.product_id}-${product.id || product.sku}`}> 
                                                    <td>{product.product_name || '-'}</td>
                                                    <td>{product.sku || '-'}</td>
                                                    <td>{product.barcode || '-'}</td>
                                                    <td>{Number(product.quantity ?? 0).toLocaleString()}</td>
                                                    <td>{Number(product.minimum_quantity ?? 0).toLocaleString()}</td>
                                                    <td>{Number(product.unit_price ?? 0).toLocaleString()}</td>
                                                    <td>{Number(product.total_value ?? 0).toLocaleString()}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="7" className="text-center py-10 text-muted">
                                                    No products found in this warehouse
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                    <tfoot>
                                        <tr>
                                            <th colSpan="3" className="text-end">Total:</th>
                                            <th>{Number(productsSummary.total_quantity ?? 0).toLocaleString()}</th>
                                            <th></th>
                                            <th></th>
                                            <th>{Number(productsSummary.total_value ?? 0).toLocaleString()}</th>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                            <div className="d-flex justify-content-between align-items-center pt-4 flex-wrap gap-3">
                                <div className="text-muted">
                                    Showing {productsRange.start} to {productsRange.end} of {productsPagination.total || 0} entries
                                </div>
                                <nav>
                                    <ul className="pagination mb-0">
                                        <li className={`page-item ${productsPagination.current_page === 1 ? 'disabled' : ''}`}>
                                            <button
                                                className="page-link"
                                                onClick={() => setProductsPage((prev) => Math.max(prev - 1, 1))}
                                            >
                                                Previous
                                            </button>
                                        </li>
                                        {[...Array(productsPagination.last_page)].map((_, index) => (
                                            <li
                                                key={index}
                                                className={`page-item ${productsPagination.current_page === index + 1 ? 'active' : ''}`}
                                            >
                                                <button className="page-link" onClick={() => setProductsPage(index + 1)}>
                                                    {index + 1}
                                                </button>
                                            </li>
                                        ))}
                                        <li
                                            className={`page-item ${productsPagination.current_page === productsPagination.last_page ? 'disabled' : ''}`}
                                        >
                                            <button
                                                className="page-link"
                                                onClick={() =>
                                                    setProductsPage((prev) =>
                                                        Math.min(prev + 1, productsPagination.last_page || prev)
                                                    )
                                                }
                                            >
                                                Next
                                            </button>
                                        </li>
                                    </ul>
                                </nav>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <div className="card mt-5">
                <div className="card-header border-0 pt-6 align-items-center">
                    <div className="card-title">
                        <h2>Inventory Transaction History</h2>
                    </div>
                    <div className="card-toolbar">
                        <div className="d-flex align-items-center position-relative">
                            <i className="bx bx-search fs-3 position-absolute ms-3"></i>
                            <input
                                type="text"
                                className="form-control form-control-solid w-250px ps-5"
                                placeholder="Search transactions..."
                                value={transactionsSearch}
                                onChange={(event) => {
                                    setTransactionsSearch(event.target.value);
                                    setTransactionsPage(1);
                                }}
                            />
                        </div>
                    </div>
                </div>
                <div className="card-body py-4">
                    {isTransactionsLoading ? (
                        <div className="text-center py-10">
                            <div className="spinner-border text-primary"></div>
                        </div>
                    ) : (
                        <>
                            <div className="table-responsive">
                                <table className="table align-middle table-row-dashed fs-6 gy-5">
                                    <thead>
                                        <tr className="text-start text-gray-500 fw-bold fs-7 text-uppercase gs-0">
                                            <th>Date</th>
                                            <th>Product</th>
                                            <th>Type</th>
                                            <th>Quantity</th>
                                            <th>Notes</th>
                                            <th>Created By</th>
                                        </tr>
                                    </thead>
                                    <tbody className="fw-semibold text-gray-600">
                                        {transactions.length > 0 ? (
                                            transactions.map((transaction) => (
                                                <tr key={transaction.id}>
                                                    <td>{transaction.created_at ? formatDate(transaction.created_at) : '-'}</td>
                                                    <td>{transaction.product_name || '-'}</td>
                                                    <td>
                                                        <span className="badge badge-light-primary text-uppercase">
                                                            {transaction.type?.replace(/_/g, ' ')}
                                                        </span>
                                                    </td>
                                                    <td className={Number(transaction.quantity) >= 0 ? 'text-success' : 'text-danger'}>
                                                        {Number(transaction.quantity ?? 0).toLocaleString()}
                                                    </td>
                                                    <td>{transaction.notes || '-'}</td>
                                                    <td>{transaction.created_by || '-'}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="6" className="text-center py-10 text-muted">
                                                    No transaction history found
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <div className="d-flex justify-content-between align-items-center pt-4 flex-wrap gap-3">
                                <div className="text-muted">
                                    Showing {transactionsRange.start} to {transactionsRange.end} of {transactionsPagination.total || 0} entries
                                </div>
                                <nav>
                                    <ul className="pagination mb-0">
                                        <li className={`page-item ${transactionsPagination.current_page === 1 ? 'disabled' : ''}`}>
                                            <button
                                                className="page-link"
                                                onClick={() => setTransactionsPage((prev) => Math.max(prev - 1, 1))}
                                            >
                                                Previous
                                            </button>
                                        </li>
                                        {[...Array(transactionsPagination.last_page)].map((_, index) => (
                                            <li
                                                key={index}
                                                className={`page-item ${transactionsPagination.current_page === index + 1 ? 'active' : ''}`}
                                            >
                                                <button className="page-link" onClick={() => setTransactionsPage(index + 1)}>
                                                    {index + 1}
                                                </button>
                                            </li>
                                        ))}
                                        <li
                                            className={`page-item ${transactionsPagination.current_page === transactionsPagination.last_page ? 'disabled' : ''}`}
                                        >
                                            <button
                                                className="page-link"
                                                onClick={() =>
                                                    setTransactionsPage((prev) =>
                                                        Math.min(prev + 1, transactionsPagination.last_page || prev)
                                                    )
                                                }
                                            >
                                                Next
                                            </button>
                                        </li>
                                    </ul>
                                </nav>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Receive Goods Modal */}
            <div className="modal fade" id="receiveGoodsModal" tabIndex="-1" aria-hidden="true">
                <div className="modal-dialog modal-dialog-centered mw-650px">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>Receive Goods</h2>
                            <button type="button" className="btn btn-icon btn-sm btn-active-light-primary" data-bs-dismiss="modal" aria-label="Close">
                                <i className="ki-duotone ki-cross fs-2x"></i>
                            </button>
                        </div>
                        <form onSubmit={handleReceiveSubmit}>
                            <div className="modal-body">
                                <div className="mb-5">
                                    <label className="form-label required">Product</label>
                                    <ProductSearchSelect
                                        key={`receive-product-${formKeys.receive}`}
                                        onChange={(value) => setReceiveForm((prev) => ({ ...prev, product_id: value }))}
                                    />
                                </div>
                                <div className="mb-5">
                                    <label className="form-label required">Quantity</label>
                                    <input
                                        type="number"
                                        min="1"
                                        className="form-control"
                                        value={receiveForm.quantity}
                                        onChange={(event) => setReceiveForm((prev) => ({ ...prev, quantity: event.target.value }))}
                                        required
                                    />
                                </div>
                                <div className="mb-5">
                                    <label className="form-label">Notes</label>
                                    <textarea
                                        className="form-control"
                                        rows="3"
                                        value={receiveForm.notes}
                                        onChange={(event) => setReceiveForm((prev) => ({ ...prev, notes: event.target.value }))}
                                    ></textarea>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-light" data-bs-dismiss="modal">
                                    Close
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={receiveSubmitting}>
                                    {receiveSubmitting ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2"></span>
                                            Processing...
                                        </>
                                    ) : (
                                        'Submit'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {/* Transfer Goods Modal */}
            <div className="modal fade" id="transferGoodsModal" tabIndex="-1" aria-hidden="true">
                <div className="modal-dialog modal-dialog-centered mw-650px">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>Transfer Goods</h2>
                            <button type="button" className="btn btn-icon btn-sm btn-active-light-primary" data-bs-dismiss="modal" aria-label="Close">
                                <i className="ki-duotone ki-cross fs-2x"></i>
                            </button>
                        </div>
                        <form onSubmit={handleTransferSubmit}>
                            <div className="modal-body">
                                <div className="mb-5">
                                    <label className="form-label required">Product</label>
                                    <ProductSearchSelect
                                        key={`transfer-product-${formKeys.transfer}`}
                                       onChange={(value) => setTransferForm((prev) => ({ ...prev, product_id: value }))}
                                    />
                                </div>
                                <div className="mb-5">
                                    <label className="form-label required">Destination Warehouse</label>
                                    <select
                                        className="form-select"
                                        value={transferForm.destination_warehouse_id}
                                        onChange={(event) =>
                                            setTransferForm((prev) => ({ ...prev, destination_warehouse_id: event.target.value }))
                                        }
                                        required
                                    >
                                        <option value="">Select warehouse</option>
                                        {warehouseOptions.length === 0 && <option disabled value="">No other warehouses available</option>}
                                        {warehouseOptions.map((item) => (
                                            <option key={item.id} value={item.id}>
                                                {item.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="mb-5">
                                    <label className="form-label required">Quantity</label>
                                    <input
                                        type="number"
                                        min="1"
                                        className="form-control"
                                        value={transferForm.quantity}
                                        onChange={(event) => setTransferForm((prev) => ({ ...prev, quantity: event.target.value }))}
                                        required
                                    />
                                </div>
                                <div className="mb-5">
                                    <label className="form-label">Notes</label>
                                    <textarea
                                        className="form-control"
                                        rows="3"
                                        value={transferForm.notes}
                                        onChange={(event) => setTransferForm((prev) => ({ ...prev, notes: event.target.value }))}
                                    ></textarea>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-light" data-bs-dismiss="modal">
                                    Close
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={transferSubmitting}>
                                    {transferSubmitting ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2"></span>
                                            Processing...
                                        </>
                                    ) : (
                                        'Submit'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {/* Transfer to Store Modal */}
            <div className="modal fade" id="transferToStoreModal" tabIndex="-1" aria-hidden="true">
                <div className="modal-dialog modal-dialog-centered mw-650px">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>Transfer to Store</h2>
                            <button type="button" className="btn btn-icon btn-sm btn-active-light-primary" data-bs-dismiss="modal" aria-label="Close">
                                <i className="ki-duotone ki-cross fs-2x"></i>
                            </button>
                        </div>
                        <form onSubmit={handleStoreSubmit}>
                            <div className="modal-body">
                                <div className="mb-5">
                                    <label className="form-label required">Product</label>
                                    <ProductSearchSelect
                                        key={`store-product-${formKeys.store}`}
                                        onChange={(value) => setStoreForm((prev) => ({ ...prev, product_id: value }))}
                                    />
                                </div>
                                <div className="mb-5">
                                    <label className="form-label required">Quantity</label>
                                    <input
                                        type="number"
                                        min="1"
                                        className="form-control"
                                        value={storeForm.quantity}
                                        onChange={(event) => setStoreForm((prev) => ({ ...prev, quantity: event.target.value }))}
                                        required
                                    />
                                </div>
                                <div className="mb-5">
                                    <label className="form-label">Notes</label>
                                    <textarea
                                        className="form-control"
                                        rows="3"
                                        value={storeForm.notes}
                                        onChange={(event) => setStoreForm((prev) => ({ ...prev, notes: event.target.value }))}
                                    ></textarea>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-light" data-bs-dismiss="modal">
                                    Close
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={storeSubmitting}>
                                    {storeSubmitting ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2"></span>
                                            Processing...
                                        </>
                                    ) : (
                                        'Submit'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}




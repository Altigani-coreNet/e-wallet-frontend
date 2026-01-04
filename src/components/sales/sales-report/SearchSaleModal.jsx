import React, { useState } from 'react';
import { salesReportService } from '../../../services/salesReportService';
import { toast } from 'react-toastify';

const SearchSaleModal = ({ show, onClose, onSaleFound }) => {
    const [invoiceNo, setInvoiceNo] = useState('');
    const [loading, setLoading] = useState(false);
    const [sale, setSale] = useState(null);
    const [error, setError] = useState(null);

    const handleSearch = async () => {
        if (!invoiceNo.trim()) {
            toast.error('Please enter an invoice number');
            return;
        }

        setLoading(true);
        setError(null);
        setSale(null);

        try {
            const response = await salesReportService.searchSaleByInvoice(invoiceNo.trim());
            
            if (response.data?.data?.sale_id) {
                // Fetch full sale details
                const saleDetailsResponse = await salesReportService.getSaleDetails(response.data.data.sale_id);
                setSale(saleDetailsResponse.data?.data || saleDetailsResponse.data);
            } else {
                setError('Sale not found');
            }
        } catch (err) {
            console.error('Error searching sale:', err);
            setError(err.response?.data?.message || 'Sale not found. Please check the invoice number.');
        } finally {
            setLoading(false);
        }
    };

    const handleReturn = () => {
        if (sale && onSaleFound) {
            onSaleFound(sale);
            handleClose();
        }
    };

    const handleClose = () => {
        setInvoiceNo('');
        setSale(null);
        setError(null);
        onClose();
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !loading) {
            handleSearch();
        }
    };

    const formatCurrency = (value) => {
        const symbol = sale?.currency_symbol || sale?.currency_object?.symbol || '$';
        const amount = typeof value === 'number' ? value : parseFloat(value || 0);
        return `${symbol}${amount.toFixed(2)}`;
    };

    if (!show) return null;

    return (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered modal-lg">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Search Sale for Return</h5>
                        <button
                            type="button"
                            className="btn-close"
                            onClick={handleClose}
                            aria-label="Close"
                        ></button>
                    </div>
                    <div className="modal-body">
                        {/* Search Input */}
                        <div className="mb-4">
                            <label className="form-label fw-bold">Invoice Number / Reference No</label>
                            <div className="input-group">
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Enter invoice number"
                                    value={invoiceNo}
                                    onChange={(e) => setInvoiceNo(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    disabled={loading}
                                />
                                <button
                                    className="btn btn-primary"
                                    onClick={handleSearch}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                            Searching...
                                        </>
                                    ) : (
                                        <>
                                            <i className="ki-duotone ki-magnifier fs-6">
                                                <span className="path1"></span>
                                                <span className="path2"></span>
                                            </i>
                                            Search
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="alert alert-danger d-flex align-items-center" role="alert">
                                <i className="ki-duotone ki-information-5 fs-2hx text-danger me-4">
                                    <span className="path1"></span>
                                    <span className="path2"></span>
                                    <span className="path3"></span>
                                </i>
                                <div className="d-flex flex-column">
                                    <h4 className="mb-1 text-danger">Sale Not Found</h4>
                                    <span>{error}</span>
                                </div>
                            </div>
                        )}

                        {/* Sale Details */}
                        {sale && (
                            <div className="card card-flush">
                                <div className="card-header">
                                    <h3 className="card-title">Sale Details</h3>
                                </div>
                                <div className="card-body">
                                    <div className="row mb-5">
                                        <div className="col-md-6">
                                            <div className="d-flex flex-column gap-3">
                                                <div className="d-flex justify-content-between align-items-center border-bottom pb-2">
                                                    <span className="text-gray-600 fw-bold">Reference No:</span>
                                                    <span className="text-gray-800">{sale.reference_no}</span>
                                                </div>
                                                <div className="d-flex justify-content-between align-items-center border-bottom pb-2">
                                                    <span className="text-gray-600 fw-bold">Date:</span>
                                                    <span className="text-gray-800">{sale.date}</span>
                                                </div>
                                                <div className="d-flex justify-content-between align-items-center border-bottom pb-2">
                                                    <span className="text-gray-600 fw-bold">Payment Method:</span>
                                                    <span className="text-gray-800">{sale.payment_method || 'N/A'}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="d-flex flex-column gap-3">
                                                {sale.customer && (
                                                    <div className="d-flex justify-content-between align-items-center border-bottom pb-2">
                                                        <span className="text-gray-600 fw-bold">Customer:</span>
                                                        <span className="text-gray-800">{sale.customer.name}</span>
                                                    </div>
                                                )}
                                                <div className="d-flex justify-content-between align-items-center border-bottom pb-2">
                                                    <span className="text-gray-600 fw-bold">Grand Total:</span>
                                                    <span className="text-gray-800 fw-bold">{formatCurrency(sale.grand_total)}</span>
                                                </div>
                                                <div className="d-flex justify-content-between align-items-center border-bottom pb-2">
                                                    <span className="text-gray-600 fw-bold">Items:</span>
                                                    <span className="text-gray-800">{sale.products?.length || 0} item(s)</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Products Summary */}
                                    {sale.products && sale.products.length > 0 && (
                                        <div className="mt-4">
                                            <h5 className="mb-3">Products:</h5>
                                            <div className="table-responsive">
                                                <table className="table table-bordered table-sm">
                                                    <thead className="table-light">
                                                        <tr>
                                                            <th>Product</th>
                                                            <th className="text-center">Quantity</th>
                                                            <th className="text-end">Unit Price</th>
                                                            <th className="text-end">Total</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {sale.products.map((product, index) => (
                                                            <tr key={index}>
                                                                <td>{product.name || product.product_name || product.sku}</td>
                                                                <td className="text-center">{product.qty || 0}</td>
                                                                <td className="text-end">{formatCurrency(product.net_unit_price || product.price || 0)}</td>
                                                                <td className="text-end">{formatCurrency(product.total || 0)}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="modal-footer">
                        <button
                            type="button"
                            className="btn btn-light"
                            onClick={handleClose}
                        >
                            Cancel
                        </button>
                        {sale && (
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={handleReturn}
                            >
                                <i className="ki-duotone ki-arrow-right fs-6 me-2">
                                    <span className="path1"></span>
                                    <span className="path2"></span>
                                </i>
                                Proceed to Return
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SearchSaleModal;




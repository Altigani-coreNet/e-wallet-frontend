import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { importProducts } from '../../../services/productsService';

export default function ImportPreviewModal({ show, onHide, previewData, file, onImportSuccess }) {
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState(null);

    if (!previewData || !show) return null;

    const { summary, products } = previewData;

    const handleConfirmImport = async () => {
        if (!file) {
            toast.error('No file selected for import');
            return;
        }

        try {
            setImporting(true);
            const response = await importProducts(file);

            if (response.success !== false) {
                setImportResult({
                    success: true,
                    message: response.message,
                    data: response.data
                });

                toast.success(`Import completed! ${response.data.imported} imported, ${response.data.updated} updated`);

                // Call success callback
                if (onImportSuccess) {
                    onImportSuccess(response.data);
                }

                // Close modal after 2 seconds
                setTimeout(() => {
                    onHide();
                    setImportResult(null);
                }, 2000);
            } else {
                setImportResult({
                    success: false,
                    message: response.message || 'Import failed'
                });
                toast.error('Import failed');
            }
        } catch (error) {
            console.error('Import error:', error);
            setImportResult({
                success: false,
                message: error.response?.data?.message || 'Import failed',
                errors: error.response?.data?.errors || []
            });
            toast.error('Import failed');
        } finally {
            setImporting(false);
        }
    };

    return (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">
                            <i className="bx bx-list-check me-2"></i>
                            Import Preview - Validation Results
                        </h5>
                        <button type="button" className="btn-close" onClick={onHide}></button>
                    </div>

                    <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                        {/* Summary Alert */}
                        <div className={`alert ${summary.total_rows === 0 ? 'alert-info' : (summary.can_import ? 'alert-success' : 'alert-warning')} mb-3`}>
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <strong>Summary:</strong> {products.length} rows found, {summary.total_rows} actual products
                                </div>
                                <div>
                                    <span className="badge bg-success me-2">
                                        ✅ Valid: {summary.valid_count}
                                    </span>
                                    {summary.invalid_count > 0 && (
                                        <span className="badge bg-danger me-2">
                                            ❌ Invalid: {summary.invalid_count}
                                        </span>
                                    )}
                                    {products.filter(p => ['sample', 'instruction', 'empty'].includes(p.row_type)).length > 0 && (
                                        <span className="badge bg-secondary">
                                            ⊘ Skipped: {products.filter(p => ['sample', 'instruction', 'empty'].includes(p.row_type)).length}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <hr />
                            <div className="mt-2">
                                {summary.total_rows === 0 ? (
                                    <span className="text-info">
                                        ℹ️ No actual products found. Add your products to the Excel template and upload again.
                                    </span>
                                ) : summary.can_import ? (
                                    <span className="text-success">
                                        ✅ All {summary.total_rows} products are valid and ready to import!
                                    </span>
                                ) : (
                                    <span className="text-danger">
                                        ⚠️ {summary.invalid_count} of {summary.total_rows} products have errors. Please review below.
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Legend */}
                        <div className="alert alert-light mb-4 py-2">
                            <div className="d-flex justify-content-around align-items-center small">
                                <div><span className="badge bg-success">✅</span> <span className="ms-1">Valid - Will be imported</span></div>
                                <div><span className="badge bg-danger">❌</span> <span className="ms-1">Invalid - Has errors</span></div>
                                <div><span className="badge bg-info">ℹ️</span> <span className="ms-1">Instruction row - Skipped</span></div>
                                <div><span className="badge bg-warning">📝</span> <span className="ms-1">Sample data - Skipped</span></div>
                                <div><span className="badge bg-secondary">⊘</span> <span className="ms-1">Empty - Skipped</span></div>
                            </div>
                        </div>

                        {/* Import Result */}
                        {importResult && (
                            <div className={`alert ${importResult.success ? 'alert-success' : 'alert-danger'} mb-4`}>
                                <strong>{importResult.message}</strong>
                                {importResult.success && importResult.data && (
                                    <div className="mt-2">
                                        <div>✅ Imported: {importResult.data.imported}</div>
                                        <div>🔄 Updated: {importResult.data.updated}</div>
                                        {importResult.data.failed > 0 && (
                                            <div className="text-danger">❌ Failed: {importResult.data.failed}</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Products Table */}
                        <div className="table-responsive">
                            <table className="table table-striped table-bordered table-hover table-sm">
                                <thead className="table-dark">
                                    <tr>
                                        <th style={{ width: '50px' }}>Row</th>
                                        <th>Product Name</th>
                                        <th>SKU</th>
                                        <th>Type</th>
                                        <th>Price</th>
                                        <th>Qty</th>
                                        <th>Brand</th>
                                        <th style={{ width: '120px', textAlign: 'center' }}>Is Valid?</th>
                                        <th style={{ minWidth: '250px' }}>Validation Errors</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {products.map((product, index) => {
                                        let rowClass = '';
                                        
                                        if (product.row_type === 'instruction') {
                                            rowClass = 'table-info';
                                        } else if (product.row_type === 'sample') {
                                            rowClass = 'table-warning';
                                        } else if (product.row_type === 'empty') {
                                            rowClass = 'table-secondary';
                                        } else if (!product.is_valid) {
                                            rowClass = 'table-danger';
                                        }
                                        
                                        return (
                                            <tr key={index} className={rowClass}>
                                                <td className="text-center fw-bold">{product.row_number}</td>
                                                <td>{product.product_name || <span className="text-muted fst-italic">Empty</span>}</td>
                                                <td>{product.sku || <span className="text-muted fst-italic">Empty</span>}</td>
                                                <td className="small">{product.product_type}</td>
                                                <td>
                                                    <div className="small">
                                                        <div>Base: {product.base_price || '-'}</div>
                                                        <div>Sale: {product.sale_price || '-'}</div>
                                                    </div>
                                                </td>
                                                <td className="text-center">{product.quantity || '-'}</td>
                                                <td className="small">{product.brand || '-'}</td>
                                                
                                                {/* Is Valid Column */}
                                                <td className="text-center">
                                                    {product.is_valid && product.will_be_imported ? (
                                                        <div>
                                                            <span className="badge bg-success" style={{ fontSize: '16px' }}>✓</span>
                                                            <div className="small text-success mt-1">Valid</div>
                                                        </div>
                                                    ) : product.row_type === 'product' && !product.is_valid ? (
                                                        <div>
                                                            <span className="badge bg-danger" style={{ fontSize: '16px' }}>✕</span>
                                                            <div className="small text-danger mt-1">Invalid</div>
                                                        </div>
                                                    ) : (
                                                        <div>
                                                            <span className="badge bg-secondary" style={{ fontSize: '16px' }}>⊘</span>
                                                            <div className="small text-muted mt-1">Skip</div>
                                                        </div>
                                                    )}
                                                </td>
                                                
                                                {/* Validation Errors Column */}
                                                <td>
                                                    {product.is_valid && product.will_be_imported ? (
                                                        <div className="text-success small">
                                                            <strong>✅ Ready to import</strong>
                                                            <div className="text-muted mt-1">No errors found</div>
                                                        </div>
                                                    ) : product.validation_errors && product.validation_errors.length > 0 ? (
                                                        <div className="small">
                                                            {product.validation_errors.map((error, idx) => (
                                                                <div 
                                                                    key={idx} 
                                                                    className="mb-2 p-2 rounded"
                                                                    style={{
                                                                        backgroundColor: product.row_type === 'product' ? '#f8d7da' : '#e2e3e5',
                                                                        border: `1px solid ${product.row_type === 'product' ? '#f5c2c7' : '#d3d3d4'}`,
                                                                        color: product.row_type === 'product' ? '#842029' : '#6c757d'
                                                                    }}
                                                                >
                                                                    <strong>{product.row_type === 'product' ? '❌' : '⚠️'}</strong> {error}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted small fst-italic">No validation data</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="modal-footer">
                        <div className="d-flex justify-content-between w-100 align-items-center">
                            <div>
                                {summary.total_rows === 0 ? (
                                    <span className="text-info small">
                                        ℹ️ No products to import. Add your products to the Excel file.
                                    </span>
                                ) : !summary.can_import ? (
                                    <span className="text-danger small">
                                        ⚠️ Fix {summary.invalid_count} invalid product(s) before importing
                                    </span>
                                ) : null}
                            </div>
                            <div>
                                <button 
                                    className="btn btn-secondary me-2" 
                                    onClick={onHide} 
                                    disabled={importing}
                                >
                                    {summary.total_rows === 0 ? 'Close' : 'Cancel'}
                                </button>
                                <button 
                                    className={`btn ${summary.can_import && summary.total_rows > 0 ? "btn-success" : "btn-secondary"}`}
                                    onClick={handleConfirmImport}
                                    disabled={!summary.can_import || importing || summary.total_rows === 0}
                                >
                                    {importing ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2"></span>
                                            Importing...
                                        </>
                                    ) : summary.total_rows === 0 ? (
                                        <>
                                            ⊘ No Products to Import
                                        </>
                                    ) : (
                                        <>
                                            ✅ Confirm & Import {summary.valid_count} Product{summary.valid_count !== 1 ? 's' : ''}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}


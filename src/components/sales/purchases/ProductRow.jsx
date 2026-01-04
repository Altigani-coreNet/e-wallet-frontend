import React, { useMemo } from 'react';
import ProductSearchSelect from './ProductSearchSelect';

const ProductRow = ({ product, index, onChange, onRemove, onManageSerials, onProductMeta, isLoadingDetails }) => {
    const calculateRowTotal = () => {
        const base = parseFloat(product.quantity || 0) * parseFloat(product.unit_price || 0);
        const tax = (base * parseFloat(product.tax_rate || 0)) / 100;
        const discount = parseFloat(product.discount || 0);
        return base + tax - discount;
    };

    const rowTotal = useMemo(() => calculateRowTotal(), [
        product.quantity,
        product.unit_price,
        product.tax_rate,
        product.discount
    ]);

    const taxAmount = useMemo(() => {
        const base = parseFloat(product.quantity || 0) * parseFloat(product.unit_price || 0);
        return (base * parseFloat(product.tax_rate || 0)) / 100;
    }, [product.quantity, product.unit_price, product.tax_rate]);

    return (
        <tr>
            {/* Product Selection */}
            <td>
                <ProductSearchSelect
                    value={product.product_id || ''}
                    onChange={(productId) => onChange(index, 'product_id', productId)}
                    onProductSelected={(metadata) => onProductMeta && onProductMeta(index, metadata)}
                    initialLabel={product.product_label || product.product_name || ''}
                    isBusy={isLoadingDetails}
                    className="form-select-sm"
                />
            </td>

            {/* Quantity */}
            <td>
                <input
                    type="number"
                    className="form-control form-control-sm"
                    style={{ width: '80px' }}
                    min="1"
                    step="1"
                    value={product.quantity || ''}
                    onChange={(e) => onChange(index, 'quantity', e.target.value)}
                    onBlur={(e) => {
                        // Set to 1 if empty on blur
                        if (!e.target.value || parseFloat(e.target.value) < 1) {
                            onChange(index, 'quantity', '1');
                        }
                    }}
                    required
                />
            </td>

            {/* Unit (Display only) */}
            <td>
                <span className="badge badge-light-info">{product.unit_name || '-'}</span>
            </td>

            {/* Purchase Cost (Display only) */}
            <td>
                <span className="fw-bold">{parseFloat(product.unit_price || 0).toFixed(2)}</span>
            </td>

            {/* Discount */}
            <td>
                <input
                    type="number"
                    className="form-control form-control-sm"
                    style={{ width: '100px' }}
                    min="0"
                    step="0.01"
                    value={product.discount || ''}
                    onChange={(e) => onChange(index, 'discount', e.target.value)}
                    onBlur={(e) => {
                        // Set to 0 if empty on blur
                        if (!e.target.value) {
                            onChange(index, 'discount', '0');
                        }
                    }}
                />
            </td>

            {/* Tax (Display) */}
            <td>
                <span className="text-muted">({product.tax_rate || 0}%) {taxAmount.toFixed(2)}</span>
            </td>

            {/* Batch Number */}
            <td>
                {product.is_batch ? (
                    <input
                        type="text"
                        className="form-control form-control-sm"
                        style={{ width: '100px' }}
                        value={product.batch || ''}
                        onChange={(e) => onChange(index, 'batch', e.target.value)}
                        placeholder="Batch"
                    />
                ) : (
                    <span className="text-muted">-</span>
                )}
            </td>

            {/* Expiry Date */}
            <td>
                {product.is_batch ? (
                    <input
                        type="date"
                        className="form-control form-control-sm"
                        style={{ width: '140px' }}
                        value={product.expire_date || ''}
                        onChange={(e) => onChange(index, 'expire_date', e.target.value)}
                    />
                ) : (
                    <span className="text-muted">-</span>
                )}
            </td>

            {/* Serial/IMEI Numbers */}
            <td>
                {product.serial_imei_number ? (
                    <button
                        type="button"
                        className="btn btn-sm btn-light-primary d-flex align-items-center"
                        onClick={() => onManageSerials(index)}
                    >
                        <i className="ki-duotone ki-notepad-edit fs-2 me-1">
                            <span className="path1"></span>
                            <span className="path2"></span>
                        </i>
                        <span>
                            Manage Serials
                            {product.serial_numbers && product.serial_numbers.length > 0 && (
                                <> ({product.serial_numbers.length})</>
                            )}
                        </span>
                    </button>
                ) : (
                    <span className="text-muted">-</span>
                )}
            </td>

            {/* Total */}
            <td>
                <input
                    type="number"
                    className="form-control form-control-sm fw-bold"
                    value={rowTotal.toFixed(2)}
                    readOnly
                />
            </td>

            {/* Actions */}
            <td className="text-center">
                <button
                    type="button"
                    className="btn btn-sm btn-icon btn-danger"
                    onClick={() => onRemove(index)}
                    title="Remove"
                >
                    <i className="ki-duotone ki-trash fs-2">
                        <span className="path1"></span>
                        <span className="path2"></span>
                        <span className="path3"></span>
                        <span className="path4"></span>
                        <span className="path5"></span>
                    </i>
                </button>
            </td>
        </tr>
    );
};

export default ProductRow;


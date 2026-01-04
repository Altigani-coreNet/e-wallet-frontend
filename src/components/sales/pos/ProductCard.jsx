import React, { useState } from 'react';
import usePosStore from '../../../stores/usePosStore';

const ProductCard = ({ product }) => {
    const { addToCart, updateQuantity, cart } = usePosStore();
    const [isHovered, setIsHovered] = useState(false);

    // DEBUG: Log product to see its structure
    console.log('🔍 Product data:', {
        id: product.id,
        name: product.name,
        category: product.category,
        categoryType: typeof product.category,
        brand: product.brand,
        brandType: typeof product.brand,
        unit: product.unit,
        unitType: typeof product.unit
    });

    // Get current quantity in cart for this product
    const cartItem = cart.find(item => item.id === product.id);
    const quantityInCart = cartItem ? cartItem.quantity : 0;

    const handleAddToCart = async () => {
        addToCart(product);
    };

    const handleIncrease = async () => {
        if (quantityInCart === 0) {
            addToCart(product);
        } else {
            updateQuantity(product.id, quantityInCart + 1);
        }
    };

    const handleDecrease = () => {
        if (quantityInCart > 0) {
            updateQuantity(product.id, quantityInCart - 1);
        }
    };

    // Get stock status color
    const getStockStatusColor = () => {
        if (product.qty <= 0) return 'text-danger';
        if (product.qty <= 10) return 'text-warning';
        return 'text-success';
    };

    // Check if product is out of stock
    const isOutOfStock = (product.qty || 0) <= 0;

    // Safe values - ensure no objects are rendered
    const safeUnit = typeof product.unit === 'object' ? 'units' : (product.unit || 'units');
    const safeQty = product.qty || 0;
    const safePrice = product.price || 0;

    return (
        <div 
            className="card card-flush p-3 pb-2 product-card fade-in position-relative"
            style={{ width: 'calc(33.333% - 16px)', minWidth: '180px' }}
            onMouseEnter={() => setIsHovered(true)}  
            onMouseLeave={() => setIsHovered(false)}
        >
            {/*begin::Body*/}
            <div className="card-body text-center p-2">
                {/*begin::Product img*/}
                <img 
                    src={product.thumbnail || "assets/media/stock/food/img-2.jpg"} 
                    className="rounded-3 mb-2 w-100px h-100px" 
                    alt={product.name}
                    onError={(e) => {
                        e.target.src = "assets/media/stock/food/img-2.jpg";
                    }}
                />
                {/*end::Product img*/}
                
                {/*begin::Info*/}
                <div className="mb-1">
                    {/*begin::Title*/}
                    <div className="text-center">
                        <span 
                            className={`fw-bold text-gray-800 fs-6 ${!isOutOfStock ? 'cursor-pointer text-hover-primary' : ''}`}
                            onClick={!isOutOfStock ? handleAddToCart : undefined}
                            style={{ cursor: !isOutOfStock ? 'pointer' : 'default' }}
                        >
                            {product.name}
                        </span>
                    </div>
                    {/*end::Title*/}
                </div>
                {/*end::Info*/}
                
                {/*begin::Pricing*/}
                <div className="mb-2">
                    {/* Main Price */}
                    <span className="text-success text-end fw-bold fs-4">
                        ${parseFloat(safePrice).toFixed(2)}
                    </span>
                </div>
                {/*end::Pricing*/}
            </div>
            {/*end::Body*/}

            {/* Hover Overlay */}
            {isHovered && (
                <div className="position-absolute top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-flex align-items-center justify-content-center rounded-3">
                    <div className="text-center">
                        {isOutOfStock ? (
                            /* Out of Stock Message */
                            <div className="text-center">
                                <div className="mb-3">
                                    <span className="badge badge-light-danger fs-6 px-3 py-2">
                                        Out of Stock
                                    </span>
                                </div>
                                <div className="text-white fs-6">
                                    This product is currently unavailable
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Increase/Decrease Buttons */}
                                <div className="d-flex align-items-center justify-content-center gap-1">
                                    <button
                                        className="btn btn-sm btn-light btn-icon"
                                        onClick={handleDecrease}
                                        disabled={quantityInCart === 0}
                                        style={{ 
                                            width: '30px', 
                                            height: '30px',
                                            borderRadius: '50%',
                                            border: 'none',
                                            backgroundColor: quantityInCart === 0 ? '#e9ecef' : '#ffffff',
                                            color: quantityInCart === 0 ? '#6c757d' : '#000000',
                                            fontSize: '12px'
                                        }}
                                    >
                                        <i className="fas fa-minus"></i>
                                    </button>
                                    
                                    <span className="text-white fw-bold fs-6 mx-2">
                                        {quantityInCart}
                                    </span>
                                    
                                    <button
                                        className="btn btn-sm btn-primary btn-icon"
                                        onClick={handleIncrease}
                                        style={{ 
                                            width: '30px', 
                                            height: '30px',
                                            borderRadius: '50%',
                                            border: 'none',
                                            backgroundColor: '#0d6efd',
                                            color: '#ffffff',
                                            fontSize: '12px'
                                        }}
                                    >
                                        <i className="fas fa-plus"></i>
                                    </button>
                                </div>
                                
                                {/* Add to Cart Button (if not in cart) */}
                                {quantityInCart === 0 && (
                                    <div className="mt-2">
                                        <button
                                            className="btn btn-primary btn-sm"
                                            onClick={handleAddToCart}
                                        >
                                            Add to Cart
                                        </button>
                                    </div>
                                )}
                                
                                {/* Product Details */}
                                <div className="mt-2 text-white" style={{ fontSize: '11px' }}>
                                    <div>Price: ${parseFloat(safePrice).toFixed(2)}</div>
                                    <div>Available: {safeQty} {safeUnit}</div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductCard;


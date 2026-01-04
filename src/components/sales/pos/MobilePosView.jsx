import React, { useState, useEffect } from 'react';
import usePosStore from '../../../stores/usePosStore';
import CustomerSearch from './CustomerSearch';
import { apiPost } from '../../../utils/apiUtils';
import { POS_API_BASE } from '../../../utils/constants';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

const MobilePosView = () => {
    const {
        cart,
        products,
        categories,
        brands,
        fetchProducts,
        fetchCategories,
        fetchBrands,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartSubtotal,
        discount,
        tax,
        cartTotal,
        selectedCustomer,
        paymentMethod,
        merchantCurrency,
        loadMerchantCurrency
    } = usePosStore();

    const [activeView, setActiveView] = useState('products'); // 'products' or 'cart'
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(null);

    // Hide toolbar and sidebar for full screen mobile POS
    useEffect(() => {
        // Hide all unnecessary UI elements
        const toolbar = document.getElementById("kt_app_toolbar");
        const sidebar = document.getElementById("kt_app_sidebar");
        const header = document.getElementById("kt_app_header");
        const footer = document.getElementById("kt_app_footer");
        
        if (toolbar) toolbar.style.display = "none";
        if (sidebar) sidebar.style.display = "none";
        if (header) header.style.display = "none";
        if (footer) footer.style.display = "none";
        
        // Make body overflow hidden for full screen
        document.body.style.overflow = "hidden";
        
        // Cleanup: restore when component unmounts
        return () => {
            if (toolbar) toolbar.style.display = "";
            if (sidebar) sidebar.style.display = "";
            if (header) header.style.display = "";
            if (footer) footer.style.display = "";
            document.body.style.overflow = "";
        };
    }, []);

    // Initialize data
    useEffect(() => {
        fetchCategories(1);
        fetchBrands(1);
        fetchProducts(1);
        loadMerchantCurrency();
    }, [fetchCategories, fetchBrands, fetchProducts, loadMerchantCurrency]);

    // Filter products based on search and category
    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            product.code?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = !selectedCategory || product.category_id === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    // Calculate cart item count
    const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    const handleAddToCart = (product) => {
        addToCart(product);
    };

    // Get quantity of product in cart
    const getProductQuantityInCart = (productId) => {
        const cartItem = cart.find(item => item.id === productId);
        return cartItem ? cartItem.quantity : 0;
    };

    // Update product quantity directly
    const handleIncreaseQuantity = (product) => {
        const cartItem = cart.find(item => item.id === product.id);
        if (cartItem) {
            updateQuantity(product.id, cartItem.quantity + 1);
        } else {
            addToCart(product);
        }
    };

    const handleDecreaseQuantity = (product) => {
        const cartItem = cart.find(item => item.id === product.id);
        if (cartItem) {
            if (cartItem.quantity > 1) {
                updateQuantity(product.id, cartItem.quantity - 1);
            } else {
                removeFromCart(product.id);
            }
        }
    };

    const getPaymentMethodLabel = (method) => {
        switch (method) {
            case '0': return 'Cash';
            case '1': return 'Card';
            default: return 'Card';
        }
    };

    const handleCheckout = async () => {
        if (cart.length === 0) {
            Swal.fire({
                title: 'Cart is Empty',
                text: 'Please add items to cart before checkout',
                icon: 'warning',
                confirmButtonText: 'OK'
            });
            return;
        }

        // Show loading
        Swal.fire({
            title: 'Processing...',
            text: 'Please wait while we process your sale',
            icon: 'info',
            allowOutsideClick: false,
            showConfirmButton: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        try {
            let currency = merchantCurrency;

            if (!currency || !currency.id) {
                currency = await loadMerchantCurrency();
            }

            if (!currency || !currency.id) {
                Swal.close();
                Swal.fire({
                    title: 'Currency Not Found',
                    html: 'Merchant currency not configured.<br/><br/>Please ensure your merchant profile has a currency and try again.',
                    icon: 'error',
                    confirmButtonText: 'OK'
                });
                return;
            }

            // Prepare sale data
            const saleData = {
                date: new Date().toISOString().split('T')[0],
                product_ids: cart.map(item => item.id),
                product_variant_ids: cart.map(item => item.variant_id || null),
                product_serial_numbers: cart.map(item => item.serial_imei_number || null),
                qty: cart.map(item => item.quantity),
                price: cart.map(item => item.price),
                discount: discount || 0,
                discount_type: discount > 0 ? 'Fixed' : null,
                shipping_cost: 0,
                tax_id: null,
                coupon_id: null,
                customer_id: selectedCustomer?.id || null,
                paid_amount: cartTotal,
                sale_note: null,
                staff_note: null,
                document: null,
                payment_method: getPaymentMethodLabel(paymentMethod),
                type: 'Sale',
                currency_id: currency.id
            };

            console.log('Sending sale data:', saleData);
            const response = await apiPost(`${POS_API_BASE}/v1/pos/store`, saleData);
            console.log('Sale response:', response);

            if (response.success) {
                const saleId = response.data.data?.id;
                console.log('Sale ID:', saleId);
                
                // Clear cart and refresh
                clearCart();
                fetchProducts();
                
                // Close loading and show success alert
                Swal.fire({
                    title: 'Sale Completed Successfully!',
                    text: 'Your sale has been processed successfully.',
                    icon: 'success',
                    showCancelButton: true,
                    confirmButtonText: 'Done',
                    cancelButtonText: 'Print Invoice',
                    confirmButtonColor: '#3085d6',
                    cancelButtonColor: '#28a745',
                    reverseButtons: true,
                    allowOutsideClick: false
                }).then((result) => {
                    if (result.dismiss === Swal.DismissReason.cancel) {
                        // User clicked "Print Invoice" - Navigate to invoice page
                        console.log('Print Invoice clicked');
                        if (saleId) {
                            window.location.href = `/sales/invoice/${saleId}`;
                        }
                    } else if (result.isConfirmed) {
                        // User clicked "Done" - Navigate to products tab
                        console.log('Done clicked');
                        setActiveView('products');
                    }
                });
            } else {
                // Show error alert
                Swal.fire({
                    title: 'Sale Failed',
                    text: response.error || 'Failed to process sale',
                    icon: 'error',
                    confirmButtonText: 'OK'
                });
            }
        } catch (error) {
            console.error('Sale creation error:', error);
            // Show error alert
            Swal.fire({
                title: 'Error',
                text: 'Failed to create sale. Please try again.',
                icon: 'error',
                confirmButtonText: 'OK'
            });
        }
    };

    // Products View for Mobile
    const renderProductsView = () => (
        <div style={{ paddingBottom: '20px' }}>
            {/*begin::Search*/}
            <div className="mb-3 px-3 pt-3">
                <input
                    type="text"
                    className="form-control form-control-lg"
                    placeholder="🔍 Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            {/*end::Search*/}

            {/*begin::Categories Quick Filter*/}
            <div className="mb-4 px-3">
                <div className="d-flex gap-2 overflow-auto pb-2">
                    <button
                        className={`btn btn-sm ${!selectedCategory ? 'btn-primary' : 'btn-light'}`}
                        onClick={() => setSelectedCategory(null)}
                        style={{ whiteSpace: 'nowrap' }}
                    >
                        All
                    </button>
                    {categories.map(category => (
                        <button
                            key={category.id}
                            className={`btn btn-sm ${selectedCategory === category.id ? 'btn-primary' : 'btn-light'}`}
                            onClick={() => setSelectedCategory(category.id)}
                            style={{ whiteSpace: 'nowrap' }}
                        >
                            {category.name}
                        </button>
                    ))}
                </div>
            </div>
            {/*end::Categories*/}

            {/*begin::Products List*/}
            <div className="px-3">
                {filteredProducts.length === 0 ? (
                    <div className="text-center py-10">
                        <i className="ki-duotone ki-package fs-3x text-gray-400 mb-3">
                            <span className="path1"></span>
                            <span className="path2"></span>
                            <span className="path3"></span>
                        </i>
                        <p className="text-gray-600">No products found</p>
                    </div>
                ) : (
                    <div className="row g-3">
                        {filteredProducts.map(product => {
                            const quantityInCart = getProductQuantityInCart(product.id);
                            const isOutOfStock = (product.qty || product.stock || 0) <= 0;
                            
                            return (
                                <div key={product.id} className="col-6">
                                    <div 
                                        className="card card-flush h-100 position-relative"
                                        style={{ overflow: 'hidden' }}
                                        onClick={() => !isOutOfStock && handleAddToCart(product)}
                                    >
                                        {/*begin::Card Body*/}
                                        <div className="card-body text-center p-3">
                                            {/*begin::Image*/}
                                            <img 
                                                src={product.thumbnail || product.image || "assets/media/stock/food/img-2.jpg"} 
                                                className="rounded-3 mb-2 w-100px h-100px" 
                                                alt={product.name}
                                                style={{ objectFit: 'contain' }}
                                                onError={(e) => {
                                                    e.target.src = "assets/media/stock/food/img-2.jpg";
                                                }}
                                            />
                                            {/*end::Image*/}
                                            
                                            {/*begin::Title*/}
                                            <div className="mb-2">
                                                <span className="fw-bold text-gray-800 fs-6">
                                                    {product.name}
                                                </span>
                                            </div>
                                            {/*end::Title*/}
                                            
                                            {/*begin::Price*/}
                                            <div className="mb-2">
                                                <span className="text-success fw-bold fs-4">
                                                    ${parseFloat(product.price || 0).toFixed(2)}
                                                </span>
                                            </div>
                                            {/*end::Price*/}
                                        </div>
                                        {/*end::Card Body*/}

                                        {/*begin::Hover Overlay*/}
                                        {quantityInCart > 0 && (
                                            <div 
                                                className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center rounded-3"
                                                style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <div className="text-center">
                                                    {isOutOfStock ? (
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
                                                            {/*begin::Quantity Controls*/}
                                                            <div className="d-flex align-items-center justify-content-center gap-2 mb-2">
                                                                <button
                                                                    className="btn btn-sm btn-light btn-icon"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleDecreaseQuantity(product);
                                                                    }}
                                                                    style={{ 
                                                                        width: '35px', 
                                                                        height: '35px',
                                                                        borderRadius: '50%',
                                                                        border: 'none',
                                                                        backgroundColor: '#ffffff',
                                                                        color: '#000000'
                                                                    }}
                                                                >
                                                                    <i className="fas fa-minus"></i>
                                                                </button>
                                                                
                                                                <span className="text-white fw-bold fs-4 mx-2">
                                                                    {quantityInCart}
                                                                </span>
                                                                
                                                                <button
                                                                    className="btn btn-sm btn-primary btn-icon"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleIncreaseQuantity(product);
                                                                    }}
                                                                    style={{ 
                                                                        width: '35px', 
                                                                        height: '35px',
                                                                        borderRadius: '50%',
                                                                        border: 'none'
                                                                    }}
                                                                >
                                                                    <i className="fas fa-plus"></i>
                                                                </button>
                                                            </div>
                                                            {/*end::Quantity Controls*/}
                                                            
                                                            {/*begin::Product Details*/}
                                                            <div className="mt-2 text-white" style={{ fontSize: '11px' }}>
                                                                <div>Price: ${parseFloat(product.price || 0).toFixed(2)}</div>
                                                                <div>Available: {product.qty || product.stock || 0}</div>
                                                            </div>
                                                            {/*end::Product Details*/}
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                        {/*end::Hover Overlay*/}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
            {/*end::Products List*/}
        </div>
    );

    // Cart View for Mobile
    const renderCartView = () => {
        if (cart.length === 0) {
            return (
                <div className="d-flex align-items-center justify-content-center h-100">
                    <div className="text-center py-10 px-3">
                        <i className="ki-duotone ki-basket fs-3x text-gray-400 mb-3">
                            <span className="path1"></span>
                            <span className="path2"></span>
                            <span className="path3"></span>
                            <span className="path4"></span>
                        </i>
                        <p className="text-gray-600 mb-4">Your cart is empty</p>
                        <button 
                            className="btn btn-primary btn-lg"
                            onClick={() => setActiveView('products')}
                        >
                            Start Shopping
                        </button>
                    </div>
                </div>
            );
        }

        return (
            <div style={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                position: 'relative'
            }}>
                {/*begin::Scrollable Cart Items*/}
                <div style={{ 
                    flex: 1, 
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    paddingBottom: '20px'
                }}>
                    <div className="px-3 pt-3">
                        {/*begin::Header*/}
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h3 className="mb-0">My Cart</h3>
                            <button 
                                className="btn btn-sm btn-light-danger"
                                onClick={clearCart}
                            >
                                Clear All
                            </button>
                        </div>
                        {/*end::Header*/}

                        {/*begin::Customer Search*/}
                        <div className="mb-3">
                            <CustomerSearch />
                        </div>
                        {/*end::Customer Search*/}

                        {/*begin::Cart Items List*/}
                        {cart.map((item) => (
                            <div 
                                key={item.id}
                                className="card card-flush mb-3"
                            >
                                <div className="card-body p-3">
                                    <div className="d-flex gap-3">
                                        {/*begin::Image*/}
                                        <div 
                                            className="bg-light rounded d-flex align-items-center justify-content-center flex-shrink-0"
                                            style={{ width: '70px', height: '70px' }}
                                        >
                                            {item.thumbnail || item.image ? (
                                                <img 
                                                    src={item.thumbnail || item.image} 
                                                    alt={item.name}
                                                    className="mh-100 mw-100"
                                                    style={{ objectFit: 'contain' }}
                                                    onError={(e) => {
                                                        e.target.src = "assets/media/stock/food/img-2.jpg";
                                                    }}
                                                />
                                            ) : (
                                                <i className="ki-duotone ki-picture fs-2x text-gray-400">
                                                    <span className="path1"></span>
                                                    <span className="path2"></span>
                                                </i>
                                            )}
                                        </div>
                                        {/*end::Image*/}

                                        {/*begin::Details*/}
                                        <div className="flex-grow-1">
                                            <h6 className="mb-1">{item.name}</h6>
                                            <p className="text-muted small mb-2">${parseFloat(item.price).toFixed(2)} each</p>
                                            
                                            {/*begin::Quantity Controls*/}
                                            <div className="d-flex align-items-center gap-2">
                                                <button 
                                                    className="btn btn-sm btn-icon btn-light"
                                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                >
                                                    <i className="ki-duotone ki-minus fs-3"></i>
                                                </button>
                                                
                                                <span className="fw-bold px-2">{item.quantity}</span>
                                                
                                                <button 
                                                    className="btn btn-sm btn-icon btn-light"
                                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                >
                                                    <i className="ki-duotone ki-plus fs-3"></i>
                                                </button>

                                                <button 
                                                    className="btn btn-sm btn-icon btn-light-danger ms-auto"
                                                    onClick={() => removeFromCart(item.id)}
                                                >
                                                    <i className="ki-duotone ki-trash fs-3">
                                                        <span className="path1"></span>
                                                        <span className="path2"></span>
                                                        <span className="path3"></span>
                                                        <span className="path4"></span>
                                                        <span className="path5"></span>
                                                    </i>
                                                </button>
                                            </div>
                                            {/*end::Quantity Controls*/}
                                        </div>
                                        {/*end::Details*/}

                                        {/*begin::Total*/}
                                        <div className="text-end">
                                            <div className="fw-bold text-primary fs-5">
                                                ${(item.price * item.quantity).toFixed(2)}
                                            </div>
                                        </div>
                                        {/*end::Total*/}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {/*end::Cart Items List*/}
                    </div>
                </div>
                {/*end::Scrollable Cart Items*/}

                {/*begin::Fixed Checkout Section*/}
                <div 
                    className="bg-white border-top shadow-lg px-3 py-3"
                    style={{
                        position: 'sticky',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        zIndex: 100
                    }}
                >
                    {/*begin::Summary Breakdown*/}
                    <div className="bg-light-success rounded p-3 mb-3">
                        <div className="d-flex justify-content-between mb-2">
                            <span className="fw-bold text-gray-700">Subtotal</span>
                            <span className="fw-bold text-gray-800">${getCartSubtotal().toFixed(2)}</span>
                        </div>
                        <div className="d-flex justify-content-between mb-2">
                            <span className="fw-bold text-gray-700">Discounts</span>
                            <span className="fw-bold text-danger">-${(discount || 0).toFixed(2)}</span>
                        </div>
                        <div className="d-flex justify-content-between mb-3">
                            <span className="fw-bold text-gray-700">Tax</span>
                            <span className="fw-bold text-gray-800">${(tax || 0).toFixed(2)}</span>
                        </div>
                        <div className="separator separator-dashed border-gray-400 mb-3"></div>
                        <div className="d-flex justify-content-between">
                            <span className="fs-2 fw-bold text-gray-900">Total</span>
                            <span className="fs-2 fw-bold text-success">${(cartTotal || 0).toFixed(2)}</span>
                        </div>
                    </div>
                    {/*end::Summary Breakdown*/}
                    
                    {/*begin::Checkout Button*/}
                    <button 
                        className="btn btn-primary btn-lg w-100 shadow"
                        onClick={handleCheckout}
                        style={{ height: '55px' }}
                    >
                        <i className="ki-duotone ki-check-circle fs-1 me-2">
                            <span className="path1"></span>
                            <span className="path2"></span>
                        </i>
                        <span className="fs-4 fw-bold">Complete Checkout</span>
                    </button>
                    {/*end::Checkout Button*/}
                </div>
                {/*end::Fixed Checkout Section*/}
            </div>
        );
    };

    return (
        <div style={{ 
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            overflow: 'hidden',
            backgroundColor: '#fff',
            zIndex: 1000
        }}>
            {/*begin::Content Area*/}
            <div style={{ 
                height: 'calc(100% - 80px)', 
                overflowY: 'auto',
                overflowX: 'hidden'
            }}>
                {activeView === 'products' ? renderProductsView() : renderCartView()}
            </div>
            {/*end::Content Area*/}

            {/*begin::Bottom Navigation*/}
            <div 
                className="bg-white border-top shadow-sm"
                style={{ 
                    position: 'absolute', 
                    bottom: 0, 
                    left: 0, 
                    right: 0, 
                    width: '100%',
                    height: '80px',
                    zIndex: 1000
                }}
            >
                <div className="d-flex h-100">
                    {/*begin::Products Button*/}
                    <button
                        className={`flex-fill border-0 bg-transparent d-flex flex-column align-items-center justify-content-center ${activeView === 'products' ? 'text-primary' : 'text-gray-600'}`}
                        onClick={() => setActiveView('products')}
                    >
                        <i className={`ki-duotone ki-shop fs-2x mb-1`}>
                            <span className="path1"></span>
                            <span className="path2"></span>
                            <span className="path3"></span>
                            <span className="path4"></span>
                            <span className="path5"></span>
                        </i>
                        <span className="fw-bold small">Products</span>
                    </button>
                    {/*end::Products Button*/}

                    {/*begin::Cart Button*/}
                    <button
                        className={`flex-fill border-0 bg-transparent d-flex flex-column align-items-center justify-content-center position-relative ${activeView === 'cart' ? 'text-primary' : 'text-gray-600'}`}
                        onClick={() => setActiveView('cart')}
                    >
                        <div className="position-relative">
                            <i className={`ki-duotone ki-basket fs-2x mb-1`}>
                                <span className="path1"></span>
                                <span className="path2"></span>
                                <span className="path3"></span>
                                <span className="path4"></span>
                            </i>
                            {cartItemCount > 0 && (
                                <span 
                                    className="badge badge-circle badge-danger position-absolute"
                                    style={{ top: '-5px', right: '-10px', minWidth: '20px', height: '20px' }}
                                >
                                    {cartItemCount}
                                </span>
                            )}
                        </div>
                        <span className="fw-bold small">
                            Cart {cartTotal > 0 && `($${cartTotal.toFixed(2)})`}
                        </span>
                    </button>
                    {/*end::Cart Button*/}
                </div>
            </div>
            {/*end::Bottom Navigation*/}
        </div>
    );
};

export default MobilePosView;


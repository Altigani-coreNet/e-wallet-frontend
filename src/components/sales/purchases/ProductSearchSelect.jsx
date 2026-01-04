import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { POS_ENDPOINTS } from '../../../utils/constants';
import { getToken } from '../../../utils/api';

const ProductSearchSelect = ({ value, onChange, onProductSelected, initialLabel = '', className = '', isBusy = false }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const dropdownRef = useRef(null);
    const inputRef = useRef(null);

    // Fetch products based on search term
    const fetchProducts = async (search = '', pageNum = 1) => {
        setLoading(true);
        try {
            const token = getToken();
            const response = await axios.get(POS_ENDPOINTS.PRODUCT_SELECT, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                },
                params: {
                    search,
                    page: pageNum,
                    per_page: 7
                }
            });

            if (response.data?.data) {
                const results = response.data.data.results || [];
                const pagination = response.data.data.pagination || {};
                
                if (pageNum === 1) {
                    setProducts(results);
                } else {
                    setProducts(prev => [...prev, ...results]);
                }
                
                setHasMore(pagination.more || false);
            }
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    };

    // Initial load
    useEffect(() => {
        fetchProducts('', 1);
    }, []);

    // Search on typing (debounced)
    useEffect(() => {
        const timer = setTimeout(() => {
            setPage(1);
            fetchProducts(searchTerm, 1);
        }, 300);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleInputFocus = () => {
        setShowDropdown(true);
        if (products.length === 0) {
            fetchProducts('', 1);
        }
    };

    const handleSelectProduct = (product) => {
        setSelectedProduct(product);
        setSearchTerm(product.text);
        setShowDropdown(false);
        onChange(product.id);
        if (onProductSelected) {
            onProductSelected(product);
        }
    };

    const handleLoadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchProducts(searchTerm, nextPage);
    };

    const handleClear = () => {
        setSelectedProduct(null);
        setSearchTerm('');
        onChange('');
        if (onProductSelected) {
            onProductSelected(null);
        }
        setPage(1);
        fetchProducts('', 1);
        inputRef.current?.focus();
    };

    const previousValueRef = useRef(value);

    useEffect(() => {
        const previousValue = previousValueRef.current;

        if (!value) {
            if (selectedProduct) {
                setSelectedProduct(null);
            }
            if (previousValue) {
                setSearchTerm('');
            }
        } else {
            if (selectedProduct && selectedProduct.id === value) {
                if (initialLabel && selectedProduct.text !== initialLabel) {
                    setSelectedProduct({ ...selectedProduct, text: initialLabel });
                }
                if (initialLabel && searchTerm !== initialLabel) {
                    setSearchTerm(initialLabel);
                }
            } else if (initialLabel) {
                const hydratedProduct = { id: value, text: initialLabel };
                setSelectedProduct(hydratedProduct);
                setSearchTerm(initialLabel);
            }
        }

        previousValueRef.current = value;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value, initialLabel, selectedProduct]);

    const showLoader = loading || isBusy;
    const hasValue = Boolean(searchTerm || selectedProduct);
    const inputPaddingRight = showLoader || hasValue ? '2.5rem' : undefined;

    return (
        <div className="position-relative" ref={dropdownRef}>
            <div className="input-group input-group-sm">
                <input
                    ref={inputRef}
                    type="text"
                    className={`form-control ${className}`}
                    placeholder="Search product..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={handleInputFocus}
                    style={{ paddingRight: inputPaddingRight }}
                />
                {hasValue && (
                    <button
                        type="button"
                        className="btn btn-sm btn-light-danger"
                        onClick={handleClear}
                        style={{ position: 'absolute', right: '0.35rem', top: '50%', transform: 'translateY(-50%)' }}
                    >
                        <i className="ki-duotone ki-cross fs-3">
                            <span className="path1"></span>
                            <span className="path2"></span>
                        </i>
                    </button>
                )}
                {showLoader && (
                    <span
                        className="spinner-border spinner-border-sm text-primary"
                        style={{
                            position: 'absolute',
                            right: hasValue ? '2.3rem' : '0.5rem',
                            top: '50%',
                            transform: 'translateY(-50%)'
                        }}
                    ></span>
                )}
            </div>

            {showDropdown && (
                <div
                    className="menu menu-sub menu-sub-dropdown w-100 mh-300px overflow-auto"
                    style={{
                        position: 'absolute',
                        zIndex: 105,
                        display: 'block',
                        backgroundColor: 'white',
                        boxShadow: '0 0 50px 0 rgba(82,63,105,.15)',
                        borderRadius: '0.475rem',
                        marginTop: '0.25rem'
                    }}
                >
                    {loading && page === 1 ? (
                        <div className="menu-item px-3 py-5 text-center">
                            <span className="spinner-border spinner-border-sm me-2"></span>
                            Loading...
                        </div>
                    ) : products.length === 0 ? (
                        <div className="menu-item px-3 py-5 text-center text-muted">
                            No products found
                        </div>
                    ) : (
                        <>
                            {products.map((product) => (
                                <div
                                    key={product.id}
                                    className="menu-item px-3"
                                    onClick={() => handleSelectProduct(product)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <div className="menu-link px-3">
                                        <div className="d-flex flex-column">
                                            <span className="menu-title">{product.text}</span>
                                            {product.code && (
                                                <span className="text-muted fs-8">{product.code}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {hasMore && (
                                <div className="menu-item px-3 py-2">
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-light-primary w-100"
                                        onClick={handleLoadMore}
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2"></span>
                                                Loading...
                                            </>
                                        ) : (
                                            'Load More'
                                        )}
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default ProductSearchSelect;


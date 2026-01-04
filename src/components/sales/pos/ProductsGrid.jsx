import React, { useEffect, useMemo, useCallback, useRef } from 'react';
import usePosStore from '../../../stores/usePosStore';
import ProductCard from './ProductCard';
import ProductLoadingSkeleton from './ProductLoadingSkeleton';
import ErrorBoundary from './ErrorBoundary';
import useInfiniteScroll from '../../../hooks/useInfiniteScroll';

const ProductsGrid = () => {
    const { 
        products, 
        productsLoading, 
        productsHasMore, 
        fetchProducts, 
        fetchMoreProducts,
        searchTerm, 
        activeCategory, 
        activeBrand 
    } = usePosStore();

    const gridRef = useRef(null);
    const scrollableContainerRef = useRef(null);
    
    // Filter products based on search term only (backend handles category/brand filtering)
    // The backend already filters by category_id and brand_id, so we only need to filter by search term
    // if the user wants to search within already-loaded products (optional client-side search)
    const filteredProducts = useMemo(() => {
        if (!products || products.length === 0) return [];
        
        // If no search term, return all products (backend already filtered by category/brand)
        if (!searchTerm) {
            return products;
        }
        
        // Only filter by search term on client side (backend also handles search, but this allows
        // instant filtering without API call for already-loaded products)
        const searchLower = searchTerm.toLowerCase();
        return products.filter(product => {
            const matchesName = product.name?.toLowerCase().includes(searchLower);
            const matchesCode = product.code?.toLowerCase().includes(searchLower);
            return matchesName || matchesCode;
        });
    }, [products, searchTerm]);
    
    // Fetch products on component mount and when filters change (debounced)
    useEffect(() => {
        const categoryId = activeCategory?.id || null;
        const brandId = activeBrand?.id || null;

        const timer = setTimeout(() => {
            fetchProducts(1, false, searchTerm, categoryId, brandId);
        }, 300);

        return () => clearTimeout(timer);
    }, [fetchProducts, searchTerm, activeCategory, activeBrand]);

    // Handle infinite scroll
    const handleLoadMore = useCallback(() => {
        if (!productsLoading && productsHasMore) {
            fetchMoreProducts();
        }
    }, [productsLoading, productsHasMore, fetchMoreProducts]);

    // Enable infinite scroll only after we have an initial list longer than 10
    const enableInfiniteScroll = !productsLoading && Array.isArray(products) && products.length > 10;

    // Find scrollable parent container
    useEffect(() => {
        if (!gridRef.current) return;

        // Find the scrollable parent (the container with overflow-y: auto)
        const findScrollableParent = (element) => {
            if (!element) return null;
            
            const parent = element.parentElement;
            if (!parent) return null;

            const style = window.getComputedStyle(parent);
            const hasOverflowY = style.overflowY === 'auto' || style.overflowY === 'scroll';
            const hasHeight = style.height && style.height !== 'auto';

            if (hasOverflowY && hasHeight) {
                return parent;
            }

            return findScrollableParent(parent);
        };

        // Use a small delay to ensure DOM is ready
        const timer = setTimeout(() => {
            const scrollableParent = findScrollableParent(gridRef.current);
            if (scrollableParent) {
                scrollableContainerRef.current = scrollableParent;
            }
        }, 100);

        return () => clearTimeout(timer);
    }, []);

    // Set up infinite scroll with container ref, only when enabled
    useInfiniteScroll(
        handleLoadMore, 
        productsHasMore, 
        productsLoading, 
        scrollableContainerRef,
        enableInfiniteScroll
    );

    if (productsLoading && (!products || products.length === 0)) {
        return <ProductLoadingSkeleton count={12} />;
    }

    if (!filteredProducts || filteredProducts.length === 0) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                <div className="text-center">
                    <i className="ki-duotone ki-information-5 fs-2hx text-muted mb-4">
                        <span className="path1"></span>
                        <span className="path2"></span>
                        <span className="path3"></span>
                    </i>
                    <h3 className="text-muted">No products found</h3>
                    <p className="text-muted">
                        {(searchTerm || activeCategory || activeBrand)
                            ? "Try adjusting your search or filter criteria." 
                            : "No products available in the system."
                        }
                    </p>
                    {(searchTerm || activeCategory || activeBrand) && (
                        <button 
                            className="btn btn-primary"
                            onClick={() => {
                                window.location.reload();
                            }}
                        >
                            Clear Filters
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <ErrorBoundary>
            <div ref={gridRef} className="d-flex flex-wrap align-items-stretch gap-3">
                {filteredProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                ))}
            </div>
            
            {/* Loading indicator */}
            {productsLoading && filteredProducts.length > 0 && (
                <div className="d-flex justify-content-center align-items-center mt-4">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading more products...</span>
                    </div>
                </div>
            )}
            
            {/* End of products indicator */}
            {!productsHasMore && filteredProducts.length > 0 && (
                <div className="text-center mt-4">
                    <p className="text-muted">
                        Showing {filteredProducts.length} of {products.length} products
                    </p>
                    <p className="text-muted">No more products to load</p>
                </div>
            )}
            
            {/* Products summary */}
            {filteredProducts.length > 0 && (
                <div className="text-center mt-3">
                    <small className="text-muted">
                        {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found
                        {searchTerm && ` for "${searchTerm}"`}
                        {activeCategory && ` in ${activeCategory.name || activeCategory}`}
                        {activeBrand && ` from ${activeBrand.name || activeBrand}`}
                    </small>
                </div>
            )}
        </ErrorBoundary>
    );
};

export default ProductsGrid;


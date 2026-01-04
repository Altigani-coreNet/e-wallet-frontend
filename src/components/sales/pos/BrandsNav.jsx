import React, { useEffect, useState, useRef, useCallback } from 'react';
import BrandItem from './BrandItem';
import BrandLoadingItem from './BrandLoadingItem';
import usePosStore from '../../../stores/usePosStore';

const BrandsNav = () => {
    const {
        brands,
        activeBrand,
        brandsLoading,
        brandsHasMore,
        setActiveBrand,
        fetchMoreBrands
    } = usePosStore();

    const brandsScrollRef = useRef(null);
    const [lastScrollLeft, setLastScrollLeft] = useState(0);
    const scrollTimeoutRef = useRef(null);

    // Debounced scroll handler
    const debouncedScrollHandler = useCallback(
        async (scrollLeft, scrollWidth, clientWidth, isScrollingRightDirection) => {
            // Check if scrolling right and near the end (within 200px threshold)
            const isNearEnd = scrollLeft + clientWidth >= scrollWidth - 200;
            
            if (isScrollingRightDirection && isNearEnd && brandsHasMore && !brandsLoading) {
                try {
                    await fetchMoreBrands();
                } catch (error) {
                    console.error('❌ API call failed:', error);
                }
            }
        },
        [brandsHasMore, brandsLoading, fetchMoreBrands]
    );

    // Add scroll event listener for horizontal infinite scroll
    useEffect(() => {
        const scrollContainer = brandsScrollRef.current;
        if (scrollContainer) {
            const handleScroll = (event) => {
                const scrollContainer = event.target;
                const { scrollLeft, scrollWidth, clientWidth } = scrollContainer;
                
                // Detect scroll direction by comparing with last scroll position
                const isScrollingRightDirection = scrollLeft > lastScrollLeft;
                setLastScrollLeft(scrollLeft);
                
                // Clear existing timeout
                if (scrollTimeoutRef.current) {
                    clearTimeout(scrollTimeoutRef.current);
                }
                
                // Set new timeout for debounced handling
                scrollTimeoutRef.current = setTimeout(() => {
                    debouncedScrollHandler(scrollLeft, scrollWidth, clientWidth, isScrollingRightDirection);
                }, 150);
            };
            
            scrollContainer.addEventListener('scroll', handleScroll);
            
            return () => {
                scrollContainer.removeEventListener('scroll', handleScroll);
                if (scrollTimeoutRef.current) {
                    clearTimeout(scrollTimeoutRef.current);
                }
            };
        }
    }, [lastScrollLeft, debouncedScrollHandler]);

    return (
        <ul 
            ref={brandsScrollRef}
            className="nav nav-pills d-flex flex-nowrap nav-pills-custom gap-2 mb-4 overflow-x-auto pb-2" 
            role="tablist" 
            style={{
                scrollbarWidth: 'thin', 
                msOverflowStyle: 'none', 
                WebkitOverflowScrolling: 'touch'
            }}
        >
            {/* Initial loading - show at beginning when no brands exist */}
            {brandsLoading && (!brands || brands.length === 0) && (
                <BrandLoadingItem count={10} />
            )}
            
            {/* Brands */}
            {brands && brands.map((brand) => (
                <BrandItem
                    key={brand.id}
                    brand={brand}
                    isActive={activeBrand === brand.id}
                    onClick={() => setActiveBrand(brand)}
                />
            ))}
            
            {/* Loading indicator at the end (right side) when fetching more */}
            {brandsLoading && brands && brands.length > 0 && (
                <BrandLoadingItem count={3} />
            )}
            
            {/* End indicator when there are more brands to load */}
            {brandsHasMore && !brandsLoading && brands && brands.length > 0 && (
                <BrandLoadingItem count={1} />
            )}
        </ul>
    );
};

export default BrandsNav;


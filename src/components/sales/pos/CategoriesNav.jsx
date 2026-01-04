import React, { useEffect, useState, useRef, useCallback } from 'react';
import CategoryItem from './CategoryItem';
import CategoryLoadingItem from './CategoryLoadingItem';
import usePosStore from '../../../stores/usePosStore';

const CategoriesNav = () => {
    const {
        categories,
        activeCategory,
        categoriesLoading,
        categoriesHasMore,
        setActiveCategory,
        fetchMoreCategories
    } = usePosStore();

    const categoriesScrollRef = useRef(null);
    const [lastScrollLeft, setLastScrollLeft] = useState(0);
    const scrollTimeoutRef = useRef(null);

    // Debounced scroll handler
    const debouncedScrollHandler = useCallback(
        async (scrollLeft, scrollWidth, clientWidth, isScrollingRightDirection) => {
            // Check if scrolling right and near the end (within 200px threshold)
            const isNearEnd = scrollLeft + clientWidth >= scrollWidth - 200;
            
            if (isScrollingRightDirection && isNearEnd && categoriesHasMore && !categoriesLoading) {
                try {
                    await fetchMoreCategories();
                } catch (error) {
                    console.error('API call failed:', error);
                }
            }
        },
        [categoriesHasMore, categoriesLoading, fetchMoreCategories]
    );

    // Add scroll event listener for horizontal infinite scroll
    useEffect(() => {
        const scrollContainer = categoriesScrollRef.current;
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
            ref={categoriesScrollRef}
            className="nav nav-pills d-flex flex-nowrap nav-pills-custom gap-2 mb-4 overflow-x-auto pb-2" 
            role="tablist" 
            style={{
                scrollbarWidth: 'thin', 
                msOverflowStyle: 'none', 
                WebkitOverflowScrolling: 'touch'
            }}
        >
            {/* Initial loading - show at beginning when no categories exist */}
            {categoriesLoading && (!categories || categories.length === 0) && (
                <CategoryLoadingItem count={10} />
            )}
            
            {/* Categories */}
            {categories && categories.map((category) => (
                <CategoryItem
                    key={category.id}
                    category={category}
                    isActive={activeCategory === category.id}
                    onClick={() => setActiveCategory(category)}
                />
            ))}
            
            {/* Loading indicator at the end (right side) when fetching more */}
            {categoriesLoading && categories && categories.length > 0 && (
                <CategoryLoadingItem count={3} />
            )}
            
            {/* End indicator when there are more categories to load */}
            {categoriesHasMore && !categoriesLoading && categories && categories.length > 0 && (
                <CategoryLoadingItem count={1} />
            )}
        </ul>
    );
};

export default CategoriesNav;


import React, { useEffect, useState } from 'react';
import usePosStore from '../../../stores/usePosStore';
import NavigationTypeSelector from './NavigationTypeSelector';
import CategoriesNav from './CategoriesNav';
import BrandsNav from './BrandsNav';
import ProductsGrid from './ProductsGrid';
import CartSection from './CartSection';
import MobilePosView from './MobilePosView';
import CategoryLoadingItem from './CategoryLoadingItem';
import BrandLoadingItem from './BrandLoadingItem';
import ProductLoadingSkeleton from './ProductLoadingSkeleton';

const PosIndex = () => {
    const {
        navigationType,
        searchTerm,
        setSearchTerm,
        fetchProducts,
        fetchCategories,
        fetchBrands,
        processSale,
        applyDiscount,
        loadMerchantCurrency,
        categories,
        brands,
        products,
        categoriesLoading,
        brandsLoading,
        productsLoading
    } = usePosStore();

    // State for responsive behavior
    const [isMobile, setIsMobile] = useState(false);

    // Detect screen size
    useEffect(() => {
        const checkScreenSize = () => {
            // Bootstrap md breakpoint is 768px
            setIsMobile(window.innerWidth < 992); // lg breakpoint
        };

        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);

        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    // Hide toolbar for POS view (removes breadcrumbs)
    useEffect(() => {
        // Hide toolbar on mount
        const toolbar = document.getElementById("kt_app_toolbar");
        if (toolbar) {
            toolbar.style.display = "none";
        }
        
        // Cleanup: show toolbar when component unmounts
        return () => {
            const toolbar = document.getElementById("kt_app_toolbar");
            if (toolbar) {
                toolbar.style.display = "";
            }
        };
    }, []);

    // Initialize data on component mount
    useEffect(() => {
        // Load merchant currency from localStorage
        loadMerchantCurrency();

        // Fetch categories, brands, and products from API
        const initializeData = async () => {
            await fetchCategories(1); // Start with page 1
            await fetchBrands(1); // Start with page 1
        };

        // Initialize data
        initializeData();
    }, [fetchCategories, fetchBrands, loadMerchantCurrency]);

    const handleProcessSale = () => {
        try {
            const sale = processSale();
            alert(`Sale processed successfully! Total: $${sale.total.toFixed(2)}`);
        } catch (error) {
            alert(error.message);
        }
    };

    const handleDiscountApply = () => {
        const discountAmount = parseFloat(prompt('Enter discount amount:') || '0');
        applyDiscount(discountAmount);
    };

    // Mobile/Tablet Layout - Use completely different component
    if (isMobile) {
        return <MobilePosView />;
    }

    // Desktop Layout (Large screens)
    return (
        <div style={{ height: 'calc(100vh - 70px)', overflow: 'hidden' }}>
            {/*begin::Desktop Layout*/}
            <div className="d-flex flex-row" style={{ height: '100%' }}>
                {/*begin::Content - Scrollable Products Area*/}
                <div className="flex-grow-1 me-3" style={{ overflowY: 'auto', height: '100%' }}>
                    {/*begin::Pos food*/}
                    <div className="card card-flush card-p-0 bg-transparent border-0 w-100">
                        {/*begin::Body*/}
                        <div className="card-body">
                            {/*begin::Navigation Type Selector*/}
                            <NavigationTypeSelector />
                            {/*end::Navigation Type Selector*/}
                            
                            {/*begin::Nav*/}
                            {navigationType === 'categories' ? (
                                categoriesLoading && (!categories || categories.length === 0) ? (
                                    <ul 
                                        className="nav nav-pills d-flex flex-nowrap nav-pills-custom gap-2 mb-4 overflow-x-auto pb-2" 
                                        role="tablist" 
                                        style={{
                                            scrollbarWidth: 'thin', 
                                            msOverflowStyle: 'none', 
                                            WebkitOverflowScrolling: 'touch'
                                        }}
                                    >
                                        <CategoryLoadingItem count={10} />
                                    </ul>
                                ) : (
                                    <CategoriesNav />
                                )
                            ) : (
                                brandsLoading && (!brands || brands.length === 0) ? (
                                    <ul 
                                        className="nav nav-pills d-flex flex-nowrap nav-pills-custom gap-2 mb-4 overflow-x-auto pb-2" 
                                        role="tablist" 
                                        style={{
                                            scrollbarWidth: 'thin', 
                                            msOverflowStyle: 'none', 
                                            WebkitOverflowScrolling: 'touch'
                                        }}
                                    >
                                        <BrandLoadingItem count={10} />
                                    </ul>
                                ) : (
                                    <BrandsNav />
                                )
                            )}
                            {/*end::Nav*/}
                            
                            {/*begin::Search Bar*/}
                            <div className="mb-4">
                                <div className="position-relative">
                                    <i className="ki-duotone ki-magnifier fs-3 position-absolute ms-4 top-50 translate-middle-y">
                                        <span className="path1"></span>
                                        <span className="path2"></span>
                                    </i>
                                    <input
                                        type="text"
                                        className="form-control form-control-lg ps-12"
                                        placeholder="Search products by name or code..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                            {/*end::Search Bar*/}
                            
                            {/*begin::Products Grid*/}
                            {productsLoading && (!products || products.length === 0) ? (
                                <ProductLoadingSkeleton count={12} />
                            ) : (
                                <ProductsGrid />
                            )}
                            {/*end::Products Grid*/}
                        </div>
                        {/*end: Card Body*/}
                    </div>
                    {/*end::Pos food*/}
                </div>
                {/*end::Content*/}
                
                {/*begin::Sidebar - Fixed Cart*/}
                <div style={{ width: '450px', flexShrink: 0, overflowY: 'auto', height: '100%' }}>
                    <CartSection />
                </div>
                {/*end::Sidebar*/}
            </div>
            {/*end::Desktop Layout*/}
        </div>
    );
};

export default PosIndex;


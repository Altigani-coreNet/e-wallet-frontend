import React from 'react';
import './ProductLoadingSkeleton.css';

const ProductLoadingSkeleton = ({ count = 12 }) => {
    const skeletons = Array.from({ length: count }, (_, index) => index);

    return (
        <div className="product-skeleton-grid d-flex flex-wrap justify-content-center align-items-center gap-xxl-9">
            {skeletons.map((index) => (
                <div key={index} className="product-skeleton-card card card-flush flex-row-fluid p-6 pb-5 mw-100 col-md-4">
                    <div className="card-body text-center">
                        {/* Image skeleton */}
                        <div className="product-skeleton-image skeleton" aria-hidden="true" />
                        
                        {/* Title skeleton */}
                        <div className="mb-2">
                            <div className="product-skeleton-title skeleton skeleton-muted" aria-hidden="true" />
                            <div className="product-skeleton-subtitle skeleton skeleton-muted" aria-hidden="true" />
                        </div>
                        
                        {/* Price skeleton */}
                        <div className="product-skeleton-price skeleton" aria-hidden="true" />
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ProductLoadingSkeleton;


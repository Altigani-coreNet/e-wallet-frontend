import React from 'react';

const BrandLoadingItem = ({ count = 1 }) => {
    return (
        <>
            {Array.from({ length: count }).map((_, index) => (
                <li key={`loading-${index}`} className="nav-item mb-2 me-0 flex-shrink-0" role="presentation">
                    <div 
                        className="nav-link nav-link-border-solid btn btn-outline btn-flex btn-active-color-primary flex-column flex-stack justify-content-center page-bg brand-loading-card"
                        style={{width: '96px', height: '96px'}} 
                    >
                        <div className="nav-icon">
                            <span className="loader3"></span>
                        </div>
                    </div>
                </li>
            ))}
        </>
    );
};

export default BrandLoadingItem;


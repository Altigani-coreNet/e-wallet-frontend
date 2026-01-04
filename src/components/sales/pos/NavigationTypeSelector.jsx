import React from 'react';
import usePosStore from '../../../stores/usePosStore';

const NavigationTypeSelector = ({ disabled = false }) => {
    const { navigationType, setNavigationType } = usePosStore();

    const handleTypeChange = (type) => {
        setNavigationType(type);
    };

    return (
        <div className="row mb-3">
            <div className="col-md-6">
                {/*begin::Option*/}
                <input 
                    type="radio" 
                    className="btn-check" 
                    name="navigation_type" 
                    value="categories" 
                    checked={navigationType === 'categories'} 
                    onChange={() => handleTypeChange('categories')}
                    id="kt_navigation_type_categories"
                    disabled={disabled}
                />
                <label 
                    className="btn btn-outline btn-outline-dashed btn-active-light-primary p-4 d-flex align-items-center mb-2 justify-content-center" 
                    htmlFor="kt_navigation_type_categories"
                >
                    <i className="ki-duotone ki-category fs-3 me-2">
                        <span className="path1"></span>
                        <span className="path2"></span>
                        <span className="path3"></span>
                        <span className="path4"></span>
                    </i>
                    <span className="d-block fw-semibold text-start">                            
                        <span className="text-gray-900 fw-bold d-block fs-5">Categories</span>
                    </span>
                </label>   
                {/*end::Option*/}
            </div>

            <div className="col-md-6">
                {/*begin::Option*/}
                <input 
                    type="radio" 
                    className="btn-check" 
                    name="navigation_type" 
                    value="brands" 
                    checked={navigationType === 'brands'} 
                    onChange={() => handleTypeChange('brands')}
                    id="kt_navigation_type_brands"
                    disabled={disabled}
                />
                <label 
                    className="btn btn-outline btn-outline-dashed btn-active-light-primary p-4 d-flex align-items-center justify-content-center" 
                    htmlFor="kt_navigation_type_brands"
                >
                    <i className="ki-duotone ki-shield-tick fs-3 me-2">
                        <span className="path1"></span>
                        <span className="path2"></span>
                        <span className="path3"></span>
                    </i>
                    <span className="d-block fw-semibold text-start">                              
                        <span className="text-gray-900 fw-bold d-block fs-5">Brands</span>
                    </span>                           
                </label>           
                {/*end::Option*/} 
            </div>
        </div>
    );
};

export default NavigationTypeSelector;


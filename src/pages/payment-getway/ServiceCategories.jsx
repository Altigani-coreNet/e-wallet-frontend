import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import AdminServiceCategoriesIndex from './service-categories/AdminServiceCategoriesIndex';

const ServiceCategories = () => {
    const { categoryType } = useParams();

    if (categoryType !== 'service' && categoryType !== 'partner') {
        return <Navigate to="/admin/service/category/type/service" replace />;
    }

    return <AdminServiceCategoriesIndex fixedHierarchy="parents" categoryType={categoryType} />;
};

export default ServiceCategories;

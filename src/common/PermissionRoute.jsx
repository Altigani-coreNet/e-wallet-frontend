import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';

const PermissionRoute = ({ required = null, anyOf = [], children }) => {
    // DEV MODE: make all routes public / ignore roles & permissions
    // This bypasses permission checks so everything (especially dashboards) is accessible.
    return children;
};

export default PermissionRoute;



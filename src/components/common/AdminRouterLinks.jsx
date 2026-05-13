import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAdminNavigation } from '../../contexts/AdminNavigationContext';

export function AdminLink({ to, ...rest }) {
    const { to: resolve } = useAdminNavigation();
    const resolved = typeof to === 'string' ? resolve(to) : to;
    return <Link to={resolved} {...rest} />;
}

export function AdminNavLink({ to, ...rest }) {
    const { to: resolve } = useAdminNavigation();
    const resolved = typeof to === 'string' ? resolve(to) : to;
    return <NavLink to={resolved} {...rest} />;
}

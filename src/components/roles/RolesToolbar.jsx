import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useCan } from '../../utils/permissions';

const RolesToolbar = ({ onRefresh, loading, typeParam, basePath = '/sales', onToggleFilters }) => {
    const [searchParams] = useSearchParams();
    const type = typeParam || searchParams.get('type');
    const canCreate = useCan('pos.roles.create_roles');
    
    // Build the add role URL with type param if exists
    const addRoleUrl = `${basePath}/roles/create${type ? `?type=${type}` : ''}`;

    return (
        <>
            {/* Filter Toggle Button */}
            <button 
                onClick={onToggleFilters}
                className="btn btn-sm btn-flex btn-secondary fw-bold"
            >
                <i className="ki-duotone ki-filter fs-3">
                    <span className="path1"></span>
                    <span className="path2"></span>
                </i>
                <span className="d-none d-md-inline ms-1">Filter</span>
            </button>

            {/* Refresh Button - Icon only */}
            <button
                onClick={onRefresh}
                className="btn btn-sm btn-icon btn-light"
                disabled={loading}
                title="Refresh"
            >
                <i className="ki-duotone ki-arrows-circle fs-3">
                    <span className="path1"></span>
                    <span className="path2"></span>
                </i>
            </button>

            {/* Add Role Button */}
            {canCreate && (
                <Link 
                    to={addRoleUrl}
                    className="btn btn-sm fw-bold btn-primary"
                    title="Add new role"
                >
                    <i className="ki-duotone ki-plus fs-3">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    <span className="d-none d-md-inline ms-1">Add Role</span>
                </Link>
            )}
        </>
    );
};

export default RolesToolbar;


import React, { useState, useEffect } from 'react';
import { useParams, useLocation, Link, useSearchParams } from 'react-router-dom';
import { getRole } from '../../services/rolesService';
import { useToolbar } from '../../contexts/ToolbarContext';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorAlert from '../common/ErrorAlert';
import { formatDate } from '../../utils/dateUtils';

const RoleView = () => {
    const { id } = useParams();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const { setTitle, setBreadcrumbs, setActions } = useToolbar();
    
    // Detect route context (merchant or sales)
    const basePath = location.pathname.startsWith('/merchant') ? '/merchant' : '/sales';
    const rolesPath = `${basePath}/roles`;
    const typeParam = searchParams.get('type');
    
    const [role, setRole] = useState(null);
    const [permissions, setPermissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch role details
    useEffect(() => {
        fetchRole();
    }, [id]);

    const fetchRole = async () => {
        setLoading(true);
        setError(null);
        
        try {
            const response = await getRole(id);
            
            if (response.success) {
                // Handle nested response structure
                const responseData = response.data || {};
                const roleData = responseData.data?.role || responseData.data || responseData;
                const permissionsData = responseData.data?.permissions || roleData.permissions || [];
                
                setRole(roleData);
                setPermissions(Array.isArray(permissionsData) ? permissionsData : []);
            } else {
                setError(response.error || 'Failed to fetch role');
            }
        } catch (err) {
            console.error('Error fetching role:', err);
            setError('An unexpected error occurred while fetching role');
        } finally {
            setLoading(false);
        }
    };

    // Set toolbar title and breadcrumbs
    useEffect(() => {
        if (role) {
            const breadcrumbs = [
                { label: 'Roles', path: rolesPath },
                { label: role.name || 'Role Details', active: true }
            ];

            // Add type to breadcrumbs if exists
            if (typeParam) {
                breadcrumbs.splice(1, 0, { label: typeParam });
            }

            setTitle(role.name || 'Role Details');
            setBreadcrumbs(breadcrumbs);
            
            const editUrl = `${rolesPath}/${id}/edit${typeParam ? `?type=${typeParam}` : ''}`;
            setActions(
                <div className="d-flex gap-2">
                    <Link to={editUrl} className="btn btn-sm btn-primary">
                        <i className="ki-duotone ki-pencil fs-3">
                            <span className="path1"></span>
                            <span className="path2"></span>
                        </i>
                        <span className="d-none d-md-inline ms-1">Edit</span>
                    </Link>
                    <Link to={rolesPath} className="btn btn-sm btn-light">
                        <i className="ki-duotone ki-arrow-left fs-3">
                            <span className="path1"></span>
                            <span className="path2"></span>
                        </i>
                        <span className="d-none d-md-inline ms-1">Back</span>
                    </Link>
                </div>
            );
        }
        
        return () => {
            setTitle('Dashboard');
            setBreadcrumbs([]);
            setActions(null);
        };
    }, [role, id, basePath, rolesPath, typeParam, setTitle, setBreadcrumbs, setActions]);

    // Group permissions by module and category (only Sales module)
    const groupPermissionsByModuleAndCategory = () => {
        const grouped = {
            sales: {}
        };

        permissions.forEach(permission => {
            // Permission name format: sales.customers.view_customers
            const parts = permission.name?.split('.') || [];
            
            if (parts.length >= 2) {
                const module = parts[0]; // sales
                const category = parts[1]; // customers, etc.
                
                // Only include sales module permissions
                if (module === 'sales') {
                    if (!grouped[module][category]) {
                        grouped[module][category] = [];
                    }
                    grouped[module][category].push(permission);
                }
            }
        });

        return grouped;
    };

    const groupedPermissions = groupPermissionsByModuleAndCategory();

    if (loading) {
        return (
            <div className="post d-flex flex-column-fluid" id="kt_post">
                <div id="kt_content_container" className="container-fluid">
                    <div className="card">
                        <div className="card-body">
                            <LoadingSpinner message="Loading role details..." />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="post d-flex flex-column-fluid" id="kt_post">
                <div id="kt_content_container" className="container-fluid">
                    <div className="card">
                        <div className="card-body">
                            <ErrorAlert message={error} onClose={() => setError(null)} />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!role) {
        return (
            <div className="post d-flex flex-column-fluid" id="kt_post">
                <div id="kt_content_container" className="container-fluid">
                    <div className="card">
                        <div className="card-body text-center py-10">
                            <i className="ki-duotone ki-file-deleted fs-3x text-muted mb-3">
                                <span className="path1"></span>
                                <span className="path2"></span>
                            </i>
                            <p className="text-muted fs-4">Role not found</p>
                            <Link to={rolesPath} className="btn btn-primary">
                                Back to Roles
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="post d-flex flex-column-fluid" id="kt_post">
            <div id="kt_content_container" className="container-fluid">
                {/* Role Information Card */}
                <div className="card mb-5">
                    <div className="card-header border-0 pt-6">
                        <div className="card-title">
                            <h2>Role Information</h2>
                        </div>
                    </div>
                    <div className="card-body">
                        <div className="row mb-7">
                            <label className="col-lg-4 fw-semibold text-muted">Role Name</label>
                            <div className="col-lg-8">
                                <span className="fw-bold fs-6 text-gray-800">{role.name}</span>
                                {role.display_name && (
                                    <div className="text-muted fs-7 mt-1">{role.display_name}</div>
                                )}
                            </div>
                        </div>

                        <div className="row mb-7">
                            <label className="col-lg-4 fw-semibold text-muted">Permissions Count</label>
                            <div className="col-lg-8">
                                <span className="badge badge-light-success">
                                    {permissions.length} permission{permissions.length !== 1 ? 's' : ''}
                                </span>
                            </div>
                        </div>

                        {role.description && (
                            <div className="row mb-7">
                                <label className="col-lg-4 fw-semibold text-muted">Description</label>
                                <div className="col-lg-8">
                                    <span className="text-gray-800">{role.description}</span>
                                </div>
                            </div>
                        )}

                        <div className="row mb-7">
                            <label className="col-lg-4 fw-semibold text-muted">Created At</label>
                            <div className="col-lg-8">
                                <span className="fw-semibold text-gray-800">
                                    {formatDate(role.created_at)}
                                </span>
                            </div>
                        </div>

                        {role.updated_at && (
                            <div className="row mb-7">
                                <label className="col-lg-4 fw-semibold text-muted">Updated At</label>
                                <div className="col-lg-8">
                                    <span className="fw-semibold text-gray-800">
                                        {formatDate(role.updated_at)}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Permissions Card */}
                <div className="card">
                    <div className="card-header border-0 pt-6">
                        <div className="card-title">
                            <h2>Permissions</h2>
                        </div>
                    </div>
                    <div className="card-body">
                        {permissions.length === 0 ? (
                            <div className="text-center text-muted py-10">
                                <i className="ki-duotone ki-file-deleted fs-3x mb-3">
                                    <span className="path1"></span>
                                    <span className="path2"></span>
                                </i>
                                <p>No permissions assigned to this role</p>
                            </div>
                        ) : (
                            <div className="border rounded p-4" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                                {/* Sales Module */}
                                {Object.keys(groupedPermissions.sales).length > 0 && (
                                    <div className="mb-6">
                                        {/* Sales Module Header */}
                                        <div className="bg-light-success p-3 rounded mb-3">
                                            <div className="d-flex align-items-center">
                                                <i className="ki-duotone ki-chart-line-up fs-2 me-2 text-success">
                                                    <span className="path1"></span>
                                                    <span className="path2"></span>
                                                </i>
                                                <span className="fw-bold fs-5 text-success">Sales Module</span>
                                                <span className="badge badge-success ms-2">
                                                    {Object.values(groupedPermissions.sales).flat().length} permissions
                                                </span>
                                            </div>
                                        </div>

                                        {/* Sales Categories */}
                                        <div className="ms-10">
                                            {Object.entries(groupedPermissions.sales).map(([category, categoryPermissions]) => (
                                                <div key={`sales-${category}`} className="mb-4">
                                                    {/* Category Header */}
                                                    <div className="bg-light p-2 rounded mb-2">
                                                        <div className="d-flex align-items-center">
                                                            <span className="fw-bold text-gray-800">
                                                                {category.replace(/_/g, ' ').toUpperCase()}
                                                            </span>
                                                            <span className="badge badge-light-info ms-2">
                                                                {categoryPermissions.length} permission{categoryPermissions.length !== 1 ? 's' : ''}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Individual Permissions */}
                                                    <div className="ms-8 row">
                                                        {categoryPermissions.map((permission) => (
                                                            <div key={permission.id} className="col-6 mb-2">
                                                                <div className="d-flex align-items-center">
                                                                    <i className="ki-duotone ki-check-circle fs-5 text-success me-2">
                                                                        <span className="path1"></span>
                                                                        <span className="path2"></span>
                                                                    </i>
                                                                    <span className="text-gray-700">
                                                                        {permission.display_name || (permission.name ? permission.name.split('.').pop().replace(/_/g, ' ') : 'Unknown Permission')}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* No Permissions Found */}
                                {Object.keys(groupedPermissions.sales).length === 0 && (
                                    <div className="text-center text-muted py-10">
                                        <i className="ki-duotone ki-file-deleted fs-3x mb-3">
                                            <span className="path1"></span>
                                            <span className="path2"></span>
                                        </i>
                                        <p>No permissions available</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RoleView;


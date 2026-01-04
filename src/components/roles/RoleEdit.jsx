import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { getRole, updateRole } from '../../services/rolesService';
import RoleForm from './RoleForm';
import { useToolbar } from '../../contexts/ToolbarContext';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorAlert from '../common/ErrorAlert';
import { toast } from 'react-toastify';

const RoleEdit = () => {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { setTitle, setBreadcrumbs, setActions } = useToolbar();
    
    // Detect route context (merchant or sales)
    const basePath = location.pathname.startsWith('/merchant') ? '/merchant' : '/sales';
    const rolesPath = `${basePath}/roles`;
    const typeParam = searchParams.get('type');
    
    const [role, setRole] = useState(null);
    const [loading, setLoading] = useState(false);
    const [loadingRole, setLoadingRole] = useState(true);
    const [error, setError] = useState(null);

    // Set toolbar title and breadcrumbs
    useEffect(() => {
        const breadcrumbs = [
            { label: 'Roles', path: rolesPath },
            { label: role?.name || 'Edit', active: true }
        ];
        
        setTitle(`Edit Role${role?.name ? `: ${role.name}` : ''}`);
        setBreadcrumbs(breadcrumbs);
        setActions(null);
        
        return () => {
            setTitle('Dashboard');
            setBreadcrumbs([]);
            setActions(null);
        };
    }, [basePath, rolesPath, role, setTitle, setBreadcrumbs, setActions]);

    // Fetch role data
    useEffect(() => {
        const fetchRole = async () => {
            setLoadingRole(true);
            setError(null);

            try {
                const response = await getRole(id);

                if (response.success) {
                    setRole(response.data.data || response.data.role || response.data);
                } else {
                    setError(response.error || 'Failed to fetch role');
                }
            } catch (err) {
                console.error('Error fetching role:', err);
                setError('An unexpected error occurred while fetching the role');
            } finally {
                setLoadingRole(false);
            }
        };

        if (id) {
            fetchRole();
        }
    }, [id]);

    const handleSubmit = async (formData) => {
        setLoading(true);
        setError(null);

        try {
            const response = await updateRole(id, formData);

            if (response.success) {
                // Success message
                toast.success('Role updated successfully!');
                
                // Redirect to roles list
                const redirectPath = typeParam ? `${rolesPath}?type=${typeParam}` : rolesPath;
                navigate(redirectPath);
            } else {
                // Handle validation errors
                const errorData = response.error || response.details || 'Failed to update role';
                setError(errorData);
                toast.error(typeof errorData === 'string' ? errorData : 'Failed to update role');
            }
        } catch (err) {
            console.error('Error updating role:', err);
            const errorMessage = 'An unexpected error occurred while updating the role';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (loadingRole) {
        return (
            <div className="post d-flex flex-column-fluid" id="kt_post">
                <div id="kt_content_container" className="container-xxl">
                    <div className="card">
                        <div className="card-body">
                            <LoadingSpinner message="Loading role..." />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error && !role) {
        return (
            <div className="post d-flex flex-column-fluid" id="kt_post">
                <div id="kt_content_container" className="container-xxl">
                    <div className="card">
                        <div className="card-body">
                            <ErrorAlert message={error} />
                            <button onClick={() => navigate(rolesPath)} className="btn btn-light mt-3">
                                Back to Roles
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="post d-flex flex-column-fluid" id="kt_post">
            <div id="kt_content_container" className="container-xxl">
                {role && (
                    <RoleForm
                        role={role}
                        mode="edit"
                        onSubmit={handleSubmit}
                        loading={loading}
                        error={error}
                    />
                )}
            </div>
        </div>
    );
};

export default RoleEdit;


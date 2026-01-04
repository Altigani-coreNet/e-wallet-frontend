import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { createRole } from '../../services/rolesService';
import RoleForm from './RoleForm';
import { useToolbar } from '../../contexts/ToolbarContext';
import { toast } from 'react-toastify';

const RoleCreate = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { setTitle, setBreadcrumbs, setActions } = useToolbar();
    
    // Detect route context (merchant or sales)
    const basePath = location.pathname.startsWith('/merchant') ? '/merchant' : '/sales';
    const rolesPath = `${basePath}/roles`;
    const typeParam = searchParams.get('type');
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Set toolbar title and breadcrumbs
    useEffect(() => {
        const breadcrumbs = [
            { label: 'Roles', path: rolesPath },
            { label: 'Create', active: true }
        ];
        
        setTitle('Create Role');
        setBreadcrumbs(breadcrumbs);
        setActions(null);
        
        return () => {
            setTitle('Dashboard');
            setBreadcrumbs([]);
            setActions(null);
        };
    }, [basePath, rolesPath, setTitle, setBreadcrumbs, setActions]);

    const handleSubmit = async (formData) => {
        setLoading(true);
        setError(null);

        try {
            // Add type parameter if exists
            const dataToSubmit = {
                ...formData,
                ...(typeParam && { type: typeParam })
            };

            const response = await createRole(dataToSubmit);

            if (response.success) {
                // Success message
                toast.success('Role created successfully!');
                
                // Redirect to roles list
                const redirectPath = typeParam ? `${rolesPath}?type=${typeParam}` : rolesPath;
                navigate(redirectPath);
            } else {
                // Handle validation errors
                const errorData = response.error || response.details || 'Failed to create role';
                setError(errorData);
                toast.error(typeof errorData === 'string' ? errorData : 'Failed to create role');
            }
        } catch (err) {
            console.error('Error creating role:', err);
            const errorMessage = 'An unexpected error occurred while creating the role';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="post d-flex flex-column-fluid" id="kt_post">
            <div id="kt_content_container" className="container-xxl">
                <RoleForm
                    mode="create"
                    onSubmit={handleSubmit}
                    loading={loading}
                    error={error}
                />
            </div>
        </div>
    );
};

export default RoleCreate;


import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { createUserGroup } from '../../../services/userGroupsService';
import UserGroupForm from './UserGroupForm';
import { useToolbar } from '../../../contexts/ToolbarContext';

const UserGroupCreate = () => {
    const navigate = useNavigate();
    const { setTitle, setBreadcrumbs } = useToolbar();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        setTitle('Create User Group');
        setBreadcrumbs([
            { label: 'User Groups', path: '/merchant/user-groups' },
            { label: 'Create', path: '/merchant/user-groups/create', active: true }
        ]);

        return () => {
            setTitle('Dashboard');
            setBreadcrumbs([]);
        };
    }, []);

    const handleSubmit = async (formData) => {
        setLoading(true);
        setError(null);

        try {
            const response = await createUserGroup(formData);

            if (response.success) {
                toast.success('User group created successfully');
                navigate('/merchant/user-groups');
            } else {
                const errorMessage = response.error || response.errors?.message || 'Failed to create user group';
                setError(errorMessage);
                
                // Handle validation errors
                if (response.errors && typeof response.errors === 'object') {
                    const validationErrors = Object.entries(response.errors)
                        .map(([key, value]) => `${key}: ${Array.isArray(value) ? value[0] : value}`)
                        .join('\n');
                    setError(validationErrors);
                }
            }
        } catch (err) {
            console.error('Error creating user group:', err);
            setError('An unexpected error occurred while creating the user group');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="post d-flex flex-column-fluid" id="kt_post">
            <div id="kt_content_container" className="container-xxl">
                <UserGroupForm
                    mode="create"
                    onSubmit={handleSubmit}
                    loading={loading}
                    error={error}
                />
            </div>
        </div>
    );
};

export default UserGroupCreate;


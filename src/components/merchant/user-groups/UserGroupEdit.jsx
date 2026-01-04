import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getUserGroup, updateUserGroup } from '../../../services/userGroupsService';
import UserGroupForm from './UserGroupForm';
import { useToolbar } from '../../../contexts/ToolbarContext';
import LoadingSpinner from '../../common/LoadingSpinner';
import ErrorAlert from '../../common/ErrorAlert';

const UserGroupEdit = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { setTitle, setBreadcrumbs } = useToolbar();
    const [userGroup, setUserGroup] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchUserGroup();
    }, [id]);

    useEffect(() => {
        if (userGroup) {
            setTitle('Edit User Group');
            setBreadcrumbs([
                { label: 'User Groups', path: '/merchant/user-groups' },
                { label: userGroup.name, path: `/merchant/user-groups/${id}` },
                { label: 'Edit', path: `/merchant/user-groups/${id}/edit`, active: true }
            ]);
        }

        return () => {
            setTitle('Dashboard');
            setBreadcrumbs([]);
        };
    }, [userGroup, id]);

    const fetchUserGroup = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await getUserGroup(id);

            if (response.success) {
                const userGroupData = response.data?.data || response.data?.user_group || response.data;
                setUserGroup(userGroupData);
            } else {
                setError(response.error || 'Failed to fetch user group');
            }
        } catch (err) {
            console.error('Error fetching user group:', err);
            setError('An unexpected error occurred while fetching the user group');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (formData) => {
        setSubmitting(true);
        setError(null);

        try {
            const response = await updateUserGroup(id, formData);

            if (response.success) {
                toast.success('User group updated successfully');
                navigate(`/merchant/user-groups/${id}`);
            } else {
                const errorMessage = response.error || response.errors?.message || 'Failed to update user group';
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
            console.error('Error updating user group:', err);
            setError('An unexpected error occurred while updating the user group');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="post d-flex flex-column-fluid" id="kt_post">
                <div id="kt_content_container" className="container-xxl">
                    <LoadingSpinner />
                </div>
            </div>
        );
    }

    if (error && !userGroup) {
        return (
            <div className="post d-flex flex-column-fluid" id="kt_post">
                <div id="kt_content_container" className="container-xxl">
                    <ErrorAlert error={error} />
                </div>
            </div>
        );
    }

    return (
        <div className="post d-flex flex-column-fluid" id="kt_post">
            <div id="kt_content_container" className="container-xxl">
                <UserGroupForm
                    mode="edit"
                    initialData={userGroup}
                    onSubmit={handleSubmit}
                    loading={submitting}
                    error={error}
                />
            </div>
        </div>
    );
};

export default UserGroupEdit;


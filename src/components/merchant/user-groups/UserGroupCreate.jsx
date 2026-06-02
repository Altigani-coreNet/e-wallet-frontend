import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { createUserGroup } from '../../../services/userGroupsService';
import UserGroupForm from './UserGroupForm';
import { useToolbar } from '../../../contexts/ToolbarContext';

const UserGroupCreate = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { setTitle, setBreadcrumbs } = useToolbar();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        setTitle(t('merchant.userGroupsUI.pages.createTitle'));
        setBreadcrumbs([
            { label: t('merchant.breadcrumbs.userGroups'), path: '/merchant/user-groups' },
            { label: t('merchant.userGroupsUI.pages.createBreadcrumb'), path: '/merchant/user-groups/create', active: true }
        ]);

        return () => {
            setTitle(t('merchant.breadcrumbs.dashboard'));
            setBreadcrumbs([]);
        };
    }, [t, setTitle, setBreadcrumbs]);

    const handleSubmit = async (formData) => {
        setLoading(true);
        setError(null);

        try {
            const response = await createUserGroup(formData);

            if (response.success) {
                toast.success(t('merchant.userGroupsUI.form.createSuccess'));
                navigate('/merchant/user-groups');
            } else {
                const errorMessage = response.error || response.errors?.message || t('merchant.userGroupsUI.form.createFailed');
                setError(errorMessage);
                
                if (response.errors && typeof response.errors === 'object') {
                    const validationErrors = Object.entries(response.errors)
                        .map(([key, value]) => `${key}: ${Array.isArray(value) ? value[0] : value}`)
                        .join('\n');
                    setError(validationErrors);
                }
            }
        } catch (err) {
            console.error('Error creating user group:', err);
            setError(t('merchant.userGroupsUI.form.unexpectedError'));
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

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getUserGroup, updateUserGroup } from '../../../services/userGroupsService';
import UserGroupForm from './UserGroupForm';
import { useToolbar } from '../../../contexts/ToolbarContext';
import LoadingSpinner from '../../common/LoadingSpinner';
import ErrorAlert from '../../common/ErrorAlert';

const UserGroupEdit = () => {
    const { t } = useTranslation();
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
            setTitle(t('merchant.userGroupsUI.pages.editTitle'));
            setBreadcrumbs([
                { label: t('merchant.breadcrumbs.userGroups'), path: '/merchant/user-groups' },
                { label: userGroup.name, path: `/merchant/user-groups/${id}` },
                { label: t('merchant.userGroupsUI.pages.editBreadcrumb'), path: `/merchant/user-groups/${id}/edit`, active: true }
            ]);
        }

        return () => {
            setTitle(t('merchant.breadcrumbs.dashboard'));
            setBreadcrumbs([]);
        };
    }, [userGroup, id, t, setTitle, setBreadcrumbs]);

    const fetchUserGroup = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await getUserGroup(id);

            if (response.success) {
                const userGroupData = response.data?.data || response.data?.user_group || response.data;
                setUserGroup(userGroupData);
            } else {
                setError(response.error || t('merchant.userGroupsUI.form.loadFailed'));
            }
        } catch (err) {
            console.error('Error fetching user group:', err);
            setError(t('merchant.userGroupsUI.form.unexpectedError'));
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
                toast.success(t('merchant.userGroupsUI.form.updateSuccess'));
                navigate(`/merchant/user-groups/${id}`);
            } else {
                const errorMessage = response.error || response.errors?.message || t('merchant.userGroupsUI.form.updateFailed');
                setError(errorMessage);
                
                if (response.errors && typeof response.errors === 'object') {
                    const validationErrors = Object.entries(response.errors)
                        .map(([key, value]) => `${key}: ${Array.isArray(value) ? value[0] : value}`)
                        .join('\n');
                    setError(validationErrors);
                }
            }
        } catch (err) {
            console.error('Error updating user group:', err);
            setError(t('merchant.userGroupsUI.form.unexpectedError'));
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

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { createUser } from '../../services/usersService';
import UserForm from './UserForm';
import PlanUpgradeModal from './PlanUpgradeModal';
import { useToolbar } from '../../contexts/ToolbarContext';
import { toast } from 'react-toastify';

const UserCreate = () => {
    const { t, i18n } = useTranslation();
    const location = useLocation();
    const navigate = useNavigate();
    const { setTitle, setBreadcrumbs, setActions } = useToolbar();
    
    // Detect route context (merchant or sales)
    const basePath = location.pathname.startsWith('/merchant') ? '/merchant' : '/sales';
    const usersPath = `${basePath}/users`;
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showPlanUpgradeModal, setShowPlanUpgradeModal] = useState(false);

    // Set toolbar title and breadcrumbs
    useEffect(() => {
        const breadcrumbs = [
            { label: t('merchant.users.list.breadcrumbUsers'), path: usersPath },
            { label: t('merchant.users.createPage.breadcrumbCreate'), active: true }
        ];
        
        setTitle(t('merchant.users.createPage.title'));
        setBreadcrumbs(breadcrumbs);
        setActions(null);
        
        return () => {
            setTitle('Dashboard');
            setBreadcrumbs([]);
            setActions(null);
        };
    }, [basePath, usersPath, setTitle, setBreadcrumbs, setActions, t, i18n.language]);

    const handleSubmit = async (formData) => {
        setLoading(true);
        setError(null);

        try {
            const response = await createUser(formData);

            if (response.success) {
                // Success - show message and redirect
                const apiData = response.data.data || response.data;
                
                // If password was auto-generated, show it to user
                if (apiData.generated_password) {
                    const emailStatus = apiData.email_sent
                        ? t('merchant.users.createPage.alertEmailSent')
                        : t('merchant.users.createPage.alertEmailManual');

                    const message =
                        `${t('merchant.users.createPage.alertPasswordIntro')}\n\n` +
                        `${t('merchant.users.createPage.alertEmailLine', { email: formData.email })}\n` +
                        `${t('merchant.users.createPage.alertPasswordLine', { password: apiData.generated_password })}\n\n` +
                        `${emailStatus}\n\n` +
                        `${t('merchant.users.createPage.alertSavePassword')}`;

                    toast.success(t('merchant.users.createPage.toastSuccessPassword'));
                    setTimeout(() => {
                        alert(message);
                        navigate(usersPath);
                    }, 500);
                } else {
                    toast.success(t('merchant.users.createPage.toastSuccess'));
                    navigate(usersPath);
                }
            } else {
                // Handle plan limit errors (406)
                if (response.statusCode === 406 || response.errorCode === 'PLAN_USERS_LIMIT_REACHED' || response.error?.includes('limit reached')) {
                    // Show the plan upgrade modal instead of just an error message
                    setShowPlanUpgradeModal(true);
                    setError(null);
                } else {
                    // Handle validation errors
                    const errorData = response.error || response.details || t('merchant.users.createPage.toastFailed');
                    setError(errorData);
                    toast.error(typeof errorData === 'string' ? errorData : t('merchant.users.createPage.toastFailed'));
                }
            }
        } catch (err) {
            console.error('Error creating user:', err);
            const errorMessage = t('merchant.users.createPage.unexpected');
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="post d-flex flex-column-fluid" id="kt_post">
                <div id="kt_content_container" className="container-xxl">
                    <UserForm
                        mode="create"
                        onSubmit={handleSubmit}
                        loading={loading}
                        error={error}
                    />
                </div>
            </div>

            {/* Plan Upgrade Modal */}
            <PlanUpgradeModal
                show={showPlanUpgradeModal}
                onHide={() => setShowPlanUpgradeModal(false)}
                resourceType="users"
            />
        </>
    );
};

export default UserCreate;


import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getUser, updateUser } from '../../services/usersService';
import UserForm from './UserForm';
import { useToolbar } from '../../contexts/ToolbarContext';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorAlert from '../common/ErrorAlert';
import { toast } from 'react-toastify';

const UserEdit = () => {
    const { t, i18n } = useTranslation();
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { setTitle, setBreadcrumbs, setActions } = useToolbar();
    
    // Detect route context (merchant or sales)
    const basePath = location.pathname.startsWith('/merchant') ? '/merchant' : '/sales';
    const usersPath = `${basePath}/users`;
    
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [fetchingUser, setFetchingUser] = useState(true);

    // Set toolbar title and breadcrumbs
    useEffect(() => {
        const breadcrumbs = [
            { label: t('merchant.users.list.breadcrumbUsers'), path: usersPath },
            { label: t('merchant.users.editPage.breadcrumbEdit'), active: true }
        ];
        
        setTitle(t('merchant.users.editPage.title'));
        setBreadcrumbs(breadcrumbs);
        setActions(null);
        
        return () => {
            setTitle('Dashboard');
            setBreadcrumbs([]);
            setActions(null);
        };
    }, [basePath, usersPath, setTitle, setBreadcrumbs, setActions, t, i18n.language]);

    // Fetch user data
    useEffect(() => {
        const fetchUserData = async () => {
            setFetchingUser(true);
            try {
                const response = await getUser(id);
                
                if (response.success) {
                    // Extract user from nested data structure
                    const apiData = response.data.data || response.data;
                    setUser(apiData.user || apiData);
                } else {
                    setError(response.error || t('merchant.users.editPage.loadFailed'));
                }
            } catch (err) {
                console.error('Error fetching user:', err);
                setError(t('merchant.users.editPage.unexpectedFetch'));
            } finally {
                setFetchingUser(false);
            }
        };

        if (id) {
            fetchUserData();
        }
    }, [id]);

    const handleSubmit = async (formData) => {
        setLoading(true);
        setError(null);

        try {
            const response = await updateUser(id, formData);

            if (response.success) {
                // Success message and redirect
                toast.success(t('merchant.users.editPage.toastSuccess'));
                navigate(usersPath);
            } else {
                // Handle validation errors
                const errorData = response.error || response.details || t('merchant.users.editPage.toastFailed');
                setError(errorData);
                toast.error(typeof errorData === 'string' ? errorData : t('merchant.users.editPage.toastFailed'));
            }
        } catch (err) {
            console.error('Error updating user:', err);
            const errorMessage = t('merchant.users.editPage.unexpectedUpdate');
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="post d-flex flex-column-fluid" id="kt_post">
            <div id="kt_content_container" className="container-xxl">
                {fetchingUser ? (
                    <div className="card">
                        <div className="card-body">
                            <LoadingSpinner message={t('merchant.users.editPage.loadingUser')} />
                        </div>
                    </div>
                ) : error && !user ? (
                    <div className="card">
                        <div className="card-body">
                            <ErrorAlert message={typeof error === 'string' ? error : t('merchant.users.editPage.loadFailed')} />
                            <button onClick={() => navigate(usersPath)} className="btn btn-light mt-3">
                                {t('merchant.users.editPage.backToUsers')}
                            </button>
                        </div>
                    </div>
                ) : user ? (
                    <UserForm
                        mode="edit"
                        user={user}
                        onSubmit={handleSubmit}
                        loading={loading}
                        error={error}
                    />
                ) : null}
            </div>
        </div>
    );
};

export default UserEdit;


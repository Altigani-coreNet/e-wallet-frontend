import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getUser, updateUser } from '../../services/usersService';
import UserForm from './UserForm';
import { useToolbar } from '../../contexts/ToolbarContext';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorAlert from '../common/ErrorAlert';
import { toast } from 'react-toastify';

const UserEdit = () => {
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
            { label: 'Users', path: usersPath },
            { label: 'Edit', active: true }
        ];
        
        setTitle('Edit User');
        setBreadcrumbs(breadcrumbs);
        setActions(null);
        
        return () => {
            setTitle('Dashboard');
            setBreadcrumbs([]);
            setActions(null);
        };
    }, [basePath, usersPath, setTitle, setBreadcrumbs, setActions]);

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
                    setError(response.error || 'Failed to fetch user');
                }
            } catch (err) {
                console.error('Error fetching user:', err);
                setError('An unexpected error occurred while fetching user');
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
                toast.success('User updated successfully!');
                navigate(usersPath);
            } else {
                // Handle validation errors
                const errorData = response.error || response.details || 'Failed to update user';
                setError(errorData);
                toast.error(typeof errorData === 'string' ? errorData : 'Failed to update user');
            }
        } catch (err) {
            console.error('Error updating user:', err);
            const errorMessage = 'An unexpected error occurred while updating the user';
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
                            <LoadingSpinner message="Loading user data..." />
                        </div>
                    </div>
                ) : error && !user ? (
                    <div className="card">
                        <div className="card-body">
                            <ErrorAlert message={typeof error === 'string' ? error : 'Failed to load user'} />
                            <button onClick={() => navigate(usersPath)} className="btn btn-light mt-3">
                                Back to Users
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


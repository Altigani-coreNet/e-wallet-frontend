import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getUserInfo, updateProfile, changePassword, uploadProfileImage } from '../../services/profileService';
import { toast } from 'react-toastify';

const ProfileInfo = () => {
    const { t } = useTranslation();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [updating, setUpdating] = useState(false);
    const [changingPassword, setChangingPassword] = useState(false);
    
    // Profile form state
    const [profileForm, setProfileForm] = useState({
        name: '',
        email: '',
        phone: '',
        profile_image: null
    });
    
    // Password form state
    const [passwordForm, setPasswordForm] = useState({
        current_password: '',
        password: '',
        password_confirmation: ''
    });
    
    // Preview for profile image
    const [imagePreview, setImagePreview] = useState(null);

    useEffect(() => {
        fetchUserInfo();
    }, []);

    const fetchUserInfo = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await getUserInfo();
            
            if (response.status && response.data) {
                const userData = response.data.user;
                setUser(userData);
                setProfileForm({
                    name: userData.name || '',
                    email: userData.email || '',
                    phone: userData.phone || '',
                    profile_image: null
                });
                setImagePreview(userData.profile_image);
            }
        } catch (err) {
            console.error('Error fetching user info:', err);
            const fallback = t('merchant.profile.toastLoadUserFailed');
            setError(err.response?.data?.message || err.message || fallback);
            toast.error(err.response?.data?.message || fallback);
        } finally {
            setLoading(false);
        }
    };

    const handleProfileInputChange = (e) => {
        const { name, value } = e.target;
        setProfileForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setProfileForm(prev => ({
                ...prev,
                profile_image: file
            }));
            
            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCancelImage = () => {
        setProfileForm(prev => ({
            ...prev,
            profile_image: null
        }));
        setImagePreview(user?.profile_image);
    };

    const handleRemoveImage = () => {
        setProfileForm(prev => ({
            ...prev,
            profile_image: null
        }));
        setImagePreview('/assets/media/avatars/300-1.jpg');
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setUpdating(true);
        setError(null);
        setSuccess(null);

        try {
            const formData = {
                name: profileForm.name,
                email: profileForm.email,
                phone: profileForm.phone
            };

            // If there's a new image, upload it first
            if (profileForm.profile_image) {
                await uploadProfileImage(profileForm.profile_image);
            }

            const response = await updateProfile(formData);
            
            if (response.status) {
                const msg = t('merchant.profile.toastUpdateSuccess');
                setSuccess(msg);
                toast.success(msg);
                await fetchUserInfo();
                
                // Clear success message after 3 seconds
                setTimeout(() => setSuccess(null), 3000);
            }
        } catch (err) {
            console.error('Error updating profile:', err);
            const errorMsg = err.response?.data?.message || err.message || t('merchant.profile.toastUpdateFailed');
            setError(errorMsg);
            toast.error(errorMsg);
        } finally {
            setUpdating(false);
        }
    };

    const handlePasswordInputChange = (e) => {
        const { name, value } = e.target;
        setPasswordForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setChangingPassword(true);
        setError(null);
        setSuccess(null);

        try {
            const response = await changePassword(passwordForm);
            
            if (response.status) {
                const msg = t('merchant.profile.toastPasswordSuccess');
                setSuccess(msg);
                toast.success(msg);
                setPasswordForm({
                    current_password: '',
                    password: '',
                    password_confirmation: ''
                });
                
                // Clear success message after 3 seconds
                setTimeout(() => setSuccess(null), 3000);
            }
        } catch (err) {
            console.error('Error changing password:', err);
            const errorMsg = err.response?.data?.message || err.message || t('merchant.profile.toastPasswordFailed');
            setError(errorMsg);
            toast.error(errorMsg);
        } finally {
            setChangingPassword(false);
        }
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">{t('merchant.profile.loading')}</span>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="alert alert-warning">
                {t('merchant.profile.noUserDataAvailable')}
            </div>
        );
    }

    return (
        <div className="container-fluid">
            {/* Profile Update Form */}
            <div className="row">
                {/* Profile Picture Card */}
                <div className="col-md-4">
                    <div className="card card-flush h-md-100">
                        <div className="card-header">
                            <div className="card-title">
                                <h2>{t('merchant.profile.profilePicture')}</h2>
                            </div>
                        </div>
                        <div className="card-body text-center pt-0">
                            <div className="text-center mb-10">
                                <div className="image-input image-input-outline" data-kt-image-input="true">
                                    <div 
                                        className="image-input-wrapper w-150px h-150px" 
                                        style={{ 
                                            backgroundImage: `url('${imagePreview || '/assets/media/avatars/300-1.jpg'}')`,
                                            backgroundSize: 'cover',
                                            backgroundPosition: 'center'
                                        }}
                                    ></div>
                                    <label 
                                        className="btn btn-icon btn-circle btn-color-muted btn-active-color-primary w-35px h-35px bg-body shadow" 
                                        data-kt-image-input-action="change" 
                                        data-bs-toggle="tooltip" 
                                        title={t('merchant.profile.tooltipChangeAvatar')}
                                    >
                                        <i className="bi bi-pencil-fill fs-7"></i>
                                        <input 
                                            type="file" 
                                            accept=".png, .jpg, .jpeg, .gif"
                                            onChange={handleImageChange}
                                        />
                                    </label>
                                    {profileForm.profile_image && (
                                        <span 
                                            className="btn btn-icon btn-circle btn-color-muted btn-active-color-primary w-35px h-35px bg-body shadow" 
                                            data-kt-image-input-action="cancel" 
                                            data-bs-toggle="tooltip" 
                                            title={t('merchant.profile.tooltipCancelAvatar')}
                                            onClick={handleCancelImage}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <i className="bi bi-x fs-2"></i>
                                        </span>
                                    )}
                                    <span 
                                        className="btn btn-icon btn-circle btn-color-muted btn-active-color-primary w-35px h-35px bg-body shadow" 
                                        data-kt-image-input-action="remove" 
                                        data-bs-toggle="tooltip" 
                                        title={t('merchant.profile.tooltipRemoveAvatar')}
                                        onClick={handleRemoveImage}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <i className="bi bi-x fs-2"></i>
                                    </span>
                                </div>
                            </div>
                            <div className="text-center mb-10">
                                <div className="d-flex align-items-center justify-content-center">
                                    <div className="d-flex flex-column">    
                                        <a href="#" className="fs-4 fw-bold text-gray-900 text-hover-primary mb-1">
                                            {user.name || t('merchant.profile.na')}
                                        </a>
                                        <div className="fs-7 text-gray-500 mb-1">
                                            {t('merchant.profile.usernameWithValue', { name: user.user_name || t('merchant.profile.na') })}
                                        </div>
                                        <div className="fs-6 fw-semibold text-gray-400">
                                            {user.email}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Profile Information Form */}
                <div className="col-lg-8">
                    {success && (
                        <div className="alert alert-success alert-dismissible fade show" role="alert">
                            {success}
                            <button 
                                type="button" 
                                className="btn-close" 
                                onClick={() => setSuccess(null)}
                                aria-label={t('merchant.profile.closeAria')}
                            ></button>
                        </div>
                    )}

                    {error && (
                        <div className="alert alert-danger alert-dismissible fade show" role="alert">
                            {error}
                            <button 
                                type="button" 
                                className="btn-close" 
                                onClick={() => setError(null)}
                                aria-label={t('merchant.profile.closeAria')}
                            ></button>
                        </div>
                    )}

                    <div className="card">
                        <div className="card-header">
                            <div className="card-title">
                                <h2>{t('merchant.profile.profileInformation')}</h2>
                            </div>
                        </div>
                        <div className="card-body">
                            <form onSubmit={handleProfileSubmit}>
                                <div className="row mb-6">
                                    <label className="col-lg-4 col-form-label required fw-semibold fs-6">
                                        {t('merchant.profile.fullName')}
                                    </label>
                                    <div className="col-lg-8">
                                        <input 
                                            type="text" 
                                            name="name" 
                                            className="form-control form-control-solid" 
                                            placeholder={t('merchant.profile.enterFullName')} 
                                            value={profileForm.name}
                                            onChange={handleProfileInputChange}
                                            required 
                                        />
                                    </div>
                                </div>
                                
                                <div className="row mb-6">
                                    <label className="col-lg-4 col-form-label required fw-semibold fs-6">
                                        {t('merchant.profile.emailAddress')}
                                    </label>
                                    <div className="col-lg-8">
                                        <input 
                                            type="email" 
                                            name="email" 
                                            className="form-control form-control-solid" 
                                            placeholder={t('merchant.profile.enterEmailAddress')} 
                                            value={profileForm.email}
                                            onChange={handleProfileInputChange}
                                            required 
                                        />
                                    </div>
                                </div>
                                
                                <div className="row mb-6">
                                    <label className="col-lg-4 col-form-label fw-semibold fs-6">
                                        {t('merchant.profile.phoneNumber')}
                                    </label>
                                    <div className="col-lg-8">
                                        <input 
                                            type="text" 
                                            name="phone" 
                                            className="form-control form-control-solid" 
                                            placeholder={t('merchant.profile.phonePlaceholder')} 
                                            value={profileForm.phone}
                                            onChange={handleProfileInputChange}
                                        />
                                    </div>
                                </div>
                                
                                <div className="card-footer d-flex justify-content-end py-6 px-9">
                                    <button type="submit" className="btn btn-primary" disabled={updating}>
                                        {updating ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                {t('merchant.profile.updating')}
                                            </>
                                        ) : (
                                            t('merchant.profile.updateProfile')
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            {/* Change Password Form */}
            <div className="row mt-8">
                <div className="col-md-4"></div>
                <div className="col-md-8">
                    <div className="card">
                        <div className="card-header">
                            <div className="card-title">
                                <h2>{t('merchant.profile.changePassword')}</h2>
                            </div>
                        </div>
                        <div className="card-body">
                            <form onSubmit={handlePasswordSubmit}>
                                <div className="row mb-6">
                                    <label className="col-lg-4 col-form-label required fw-semibold fs-6">
                                        {t('merchant.profile.currentPassword')}
                                    </label>
                                    <div className="col-lg-8">
                                        <input 
                                            type="password" 
                                            name="current_password" 
                                            className="form-control form-control-solid" 
                                            placeholder={t('merchant.profile.currentPasswordPlaceholder')} 
                                            value={passwordForm.current_password}
                                            onChange={handlePasswordInputChange}
                                            required 
                                        />
                                    </div>
                                </div>
                                
                                <div className="row mb-6">
                                    <label className="col-lg-4 col-form-label required fw-semibold fs-6">
                                        {t('merchant.profile.newPassword')}
                                    </label>
                                    <div className="col-lg-8">
                                        <input 
                                            type="password" 
                                            name="password" 
                                            className="form-control form-control-solid" 
                                            placeholder={t('merchant.profile.newPasswordPlaceholder')} 
                                            value={passwordForm.password}
                                            onChange={handlePasswordInputChange}
                                            required 
                                        />
                                    </div>
                                </div>
                                
                                <div className="row mb-6">
                                    <label className="col-lg-4 col-form-label required fw-semibold fs-6">
                                        {t('merchant.profile.confirmPassword')}
                                    </label>
                                    <div className="col-lg-8">
                                        <input 
                                            type="password" 
                                            name="password_confirmation" 
                                            className="form-control form-control-solid" 
                                            placeholder={t('merchant.profile.confirmPasswordPlaceholder')} 
                                            value={passwordForm.password_confirmation}
                                            onChange={handlePasswordInputChange}
                                            required 
                                        />
                                    </div>
                                </div>
                                
                                <div className="card-footer d-flex justify-content-end py-6 px-9">
                                    <button type="submit" className="btn btn-primary" disabled={changingPassword}>
                                        {changingPassword ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                {t('merchant.profile.changingPassword')}
                                            </>
                                        ) : (
                                            t('merchant.profile.changePassword')
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileInfo;


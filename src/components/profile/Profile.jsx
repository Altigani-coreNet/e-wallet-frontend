import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import ProfileHeader from './ProfileHeader';
import Overview from './Overview';
import ProfileInfo from './ProfileInfo';
import ActivityEvents from './ActivityEvents';
import EditMerchantProfile from './EditMerchantProfile';
import EditRejectedFields from './EditRejectedFields';
import { getUserInfo } from '../../services/profileService';
import useAuthStore from '../../stores/authStore';
import { useToolbar } from '../../contexts/ToolbarContext';

const PROFILE_TAB_TOOLBAR = {
    overview: {
        titleKey: 'merchant.profile.tabMerchantProfile',
        lastCrumbKey: 'merchant.profile.tabMerchantProfile',
    },
    info: {
        titleKey: 'merchant.profile.tabUserInfo',
        lastCrumbKey: 'merchant.profile.tabUserInfo',
    },
    events: {
        titleKey: 'merchant.profile.tabActivityEvents',
        lastCrumbKey: 'merchant.profile.tabActivityEvents',
    },
    edit: {
        titleKey: 'merchant.profile.editMerchantProfile',
        lastCrumbKey: 'merchant.breadcrumbs.editProfile',
    },
    'edit-rejected': {
        titleKey: 'merchant.profile.editRejectedTitle',
        lastCrumbKey: 'merchant.breadcrumbs.editRejectedFields',
    },
};

const Profile = () => {
    const { t, i18n } = useTranslation();
    const { setTitle, setBreadcrumbs, setActions } = useToolbar();
    const [activeTab, setActiveTab] = useState('overview');
    const [user, setUser] = useState(null);
    const [merchant, setMerchant] = useState(null);
    const [profileCompletion, setProfileCompletion] = useState(null);
    const [merchantCompletion, setMerchantCompletion] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const syncProfileData = useAuthStore((state) => state.syncProfileData);

    useEffect(() => {
        fetchUserData();
    }, []);

    useEffect(() => {
        const tabConfig = PROFILE_TAB_TOOLBAR[activeTab] || PROFILE_TAB_TOOLBAR.overview;
        const profileLabel = t('merchant.breadcrumbs.profile');

        setTitle(t(tabConfig.titleKey));

        const crumbs = [
            { label: t('merchant.breadcrumbs.dashboard'), path: '/merchant/dashboard' },
        ];

        if (activeTab === 'overview') {
            crumbs.push({
                label: profileLabel,
                path: '/merchant/profile',
                active: true,
            });
        } else {
            crumbs.push({ label: profileLabel, path: '/merchant/profile' });
            crumbs.push({
                label: t(tabConfig.lastCrumbKey),
                path: null,
                active: true,
            });
        }

        setBreadcrumbs(crumbs);
    }, [activeTab, setTitle, setBreadcrumbs, t, i18n.language]);

    useEffect(() => {
        setActions(null);
        return () => {
            setTitle(t('merchant.toolbar.defaultTitle'));
            setBreadcrumbs([]);
            setActions(null);
        };
    }, [setTitle, setBreadcrumbs, setActions, t]);

    const fetchUserData = async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            const response = await getUserInfo();

            if (response.status && response.data) {
                const userData = response.data.user;

                setUser(userData);
                setMerchant(userData.merchant);
                setProfileCompletion(response.data.profile_completion);
                setMerchantCompletion(response.data.merchant_completion);

                syncProfileData(userData, userData.merchant);
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
        } finally {
            if (isRefresh) {
                setRefreshing(false);
            } else {
                setLoading(false);
            }
        }
    };

    const handleProfileUpdate = () => {
        fetchUserData(true);
        setActiveTab('overview');
    };

    const handleTabChange = (tab) => {
        setActiveTab(tab);
    };

    const handleEditClick = (editMode) => {
        setActiveTab(editMode);
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

    return (
        <div className="post d-flex flex-column-fluid" id="kt_post">
            <div id="kt_content_container" className="container-xxl">
                <div className="row gy-5 g-xl-8">
                    <div className="col-xl-12">
                        <div className="card-body py-3">
                            <ProfileHeader
                                user={user}
                                merchant={merchant}
                                profileCompletion={profileCompletion}
                                merchantCompletion={merchantCompletion}
                                activeTab={activeTab}
                                onTabChange={handleTabChange}
                            />

                            {activeTab === 'overview' && (
                                <Overview
                                    user={user}
                                    merchant={merchant}
                                    merchantCompletion={merchantCompletion}
                                    logs={merchant?.LatestLogs || []}
                                    onEditClick={handleEditClick}
                                />
                            )}

                            {activeTab === 'info' && <ProfileInfo />}

                            {activeTab === 'events' && <ActivityEvents />}

                            {activeTab === 'edit' && (
                                <EditMerchantProfile
                                    merchant={merchant}
                                    onSuccess={handleProfileUpdate}
                                    onCancel={() => setActiveTab('overview')}
                                />
                            )}

                            {activeTab === 'edit-rejected' && (
                                <EditRejectedFields
                                    merchant={merchant}
                                    onSuccess={handleProfileUpdate}
                                    onCancel={() => setActiveTab('overview')}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;

import React, { useState, useEffect } from 'react';
import ProfileHeader from './ProfileHeader';
import Overview from './Overview';
import ProfileInfo from './ProfileInfo';
import ActivityEvents from './ActivityEvents';
import EditMerchantProfile from './EditMerchantProfile';
import EditRejectedFields from './EditRejectedFields';
import { getUserInfo } from '../../services/profileService';
import useAuthStore from '../../stores/authStore';

const Profile = () => {
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

    const fetchUserData = async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }
            
            const response = await getUserInfo();
            
            console.log('=== Profile API Response ===');
            console.log('Full Response:', response);
            console.log('Response Status:', response.status);
            console.log('Response Data:', response.data);
            
            if (response.status && response.data) {
                const userData = response.data.user;
                
                console.log('=== Extracted Data ===');
                console.log('User Data:', userData);
                console.log('Merchant Data:', userData.merchant);
                console.log('Profile Completion:', response.data.profile_completion);
                console.log('Merchant Completion:', response.data.merchant_completion);
                console.log('======================');
                
                setUser(userData);
                setMerchant(userData.merchant);
                setProfileCompletion(response.data.profile_completion);
                setMerchantCompletion(response.data.merchant_completion);

                syncProfileData(userData, userData.merchant);
            } else {
                console.warn('Response status is false or no data received');
            }
        } catch (error) {
            console.error('=== Error Fetching User Data ===');
            console.error('Error:', error);
            console.error('Error Message:', error.message);
            console.error('Error Stack:', error.stack);
            console.error('===============================');
        } finally {
            if (isRefresh) {
                setRefreshing(false);
            } else {
                setLoading(false);
            }
        }
    };

    const handleProfileUpdate = (updatedUser) => {
        console.log('Profile updated:', updatedUser);
        fetchUserData(true); // Refresh data without showing full loading state
        setActiveTab('overview'); // Go back to overview
    };

    const handleTabChange = (tab) => {
        setActiveTab(tab);
    };

    const handleEditClick = (editMode) => {
        setActiveTab(editMode); // 'edit' or 'edit-rejected'
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
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
                            {/* Profile Header with Tabs */}
                            <ProfileHeader 
                                user={user}
                                merchant={merchant}
                                profileCompletion={profileCompletion}
                                merchantCompletion={merchantCompletion}
                                activeTab={activeTab}
                                onTabChange={handleTabChange}
                            />

                            {/* Tab Content */}
                            {activeTab === 'overview' && (
                                <Overview 
                                    user={user}
                                    merchant={merchant}
                                    merchantCompletion={merchantCompletion}
                                    logs={merchant?.LatestLogs || []}
                                    onEditClick={handleEditClick}
                                />
                            )}

                            {activeTab === 'info' && (
                                <ProfileInfo />
                            )}

                            {activeTab === 'events' && (
                                <ActivityEvents />
                            )}

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


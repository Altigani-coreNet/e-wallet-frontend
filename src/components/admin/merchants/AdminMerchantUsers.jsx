import React from 'react';
import AdminMerchantSectionTemplate from './AdminMerchantSectionTemplate';
import MerchantUsersTab from './tabs/MerchantUsersTab';

const AdminMerchantUsers = () => (
    <AdminMerchantSectionTemplate
        title="Merchant Users"
        activeTab="users"
        renderContent={({ merchant }) => (
            <div className="row gy-5 g-xl-8">
                <div className="col-xl-12">
                    <MerchantUsersTab merchantId={merchant.id} />
                </div>
            </div>
        )}
    />
);

export default AdminMerchantUsers;



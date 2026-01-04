import React from 'react';
import AdminMerchantSectionTemplate from './AdminMerchantSectionTemplate';
import MerchantChangeRequestsTab from './tabs/MerchantChangeRequestsTab';

const AdminMerchantChangeRequests = () => (
    <AdminMerchantSectionTemplate
        title="Merchant Change Requests"
        activeTab="change-requests"
        renderContent={({ merchant }) => (
            <div className="row gy-5 g-xl-8">
                <div className="col-xl-12">
                    <MerchantChangeRequestsTab merchantId={merchant.id} />
                </div>
            </div>
        )}
    />
);

export default AdminMerchantChangeRequests;



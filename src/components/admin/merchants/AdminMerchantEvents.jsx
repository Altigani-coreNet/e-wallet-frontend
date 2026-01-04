import React from 'react';
import AdminMerchantSectionTemplate from './AdminMerchantSectionTemplate';
import MerchantEventsTab from './tabs/MerchantEventsTab';

const AdminMerchantEvents = () => (
    <AdminMerchantSectionTemplate
        title="Merchant Events"
        activeTab="events"
        renderContent={({ merchant }) => (
            <div className="row gy-5 g-xl-8">
                <div className="col-xl-12">
                    <MerchantEventsTab merchantId={merchant.id} initialLogs={merchant.logs || []} />
                </div>
            </div>
        )}
    />
);

export default AdminMerchantEvents;



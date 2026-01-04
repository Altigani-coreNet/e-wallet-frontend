import React from 'react';
import AdminMerchantSectionTemplate from './AdminMerchantSectionTemplate';
import MerchantTerminalsTab from './tabs/MerchantTerminalsTab';

const AdminMerchantTerminals = () => (
    <AdminMerchantSectionTemplate
        title="Merchant Terminals"
        activeTab="terminals"
        renderContent={({ merchant }) => (
            <div className="row gy-5 g-xl-8">
                <div className="col-xl-12">
                    <MerchantTerminalsTab merchantId={merchant.id} />
                </div>
            </div>
        )}
    />
);

export default AdminMerchantTerminals;



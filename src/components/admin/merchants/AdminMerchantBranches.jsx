import React from 'react';
import AdminMerchantSectionTemplate from './AdminMerchantSectionTemplate';
import MerchantBranchesTab from './tabs/MerchantBranchesTab';

const AdminMerchantBranches = () => (
    <AdminMerchantSectionTemplate
        title="Merchant Branches"
        activeTab="branches"
        renderContent={({ merchant }) => (
            <div className="row gy-5 g-xl-8">
                <div className="col-xl-12">
                    <MerchantBranchesTab merchantId={merchant.id} />
                </div>
            </div>
        )}
    />
);

export default AdminMerchantBranches;



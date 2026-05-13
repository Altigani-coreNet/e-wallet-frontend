import React from 'react';
import { useTranslation } from 'react-i18next';
import AdminMerchantSectionTemplate from './AdminMerchantSectionTemplate';
import MerchantBranchesTab from './tabs/MerchantBranchesTab';

const AdminMerchantBranches = () => {
    const { t } = useTranslation();
    return (
        <AdminMerchantSectionTemplate
            title={t('admin.merchantsUI.sectionTitles.branches')}
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
};

export default AdminMerchantBranches;

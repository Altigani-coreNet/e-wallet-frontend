import React from 'react';
import { useTranslation } from 'react-i18next';
import AdminMerchantSectionTemplate from './AdminMerchantSectionTemplate';
import MerchantChangeRequestsTab from './tabs/MerchantChangeRequestsTab';

const AdminMerchantChangeRequests = () => {
    const { t } = useTranslation();
    return (
        <AdminMerchantSectionTemplate
            title={t('admin.merchantsUI.sectionTitles.changeRequests')}
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
};

export default AdminMerchantChangeRequests;

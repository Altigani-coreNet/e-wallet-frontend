import React from 'react';
import { useTranslation } from 'react-i18next';
import AdminMerchantSectionTemplate from './AdminMerchantSectionTemplate';
import MerchantUsersTab from './tabs/MerchantUsersTab';

const AdminMerchantUsers = () => {
    const { t } = useTranslation();
    return (
        <AdminMerchantSectionTemplate
            title={t('admin.merchantsUI.sectionTitles.users')}
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
};

export default AdminMerchantUsers;

import React from 'react';
import { useTranslation } from 'react-i18next';
import AdminMerchantSectionTemplate from './AdminMerchantSectionTemplate';
import MerchantTerminalsTab from './tabs/MerchantTerminalsTab';

const AdminMerchantTerminals = () => {
    const { t } = useTranslation();
    return (
        <AdminMerchantSectionTemplate
            title={t('admin.merchantsUI.sectionTitles.terminals')}
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
};

export default AdminMerchantTerminals;

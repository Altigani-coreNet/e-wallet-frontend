import React from 'react';
import { useTranslation } from 'react-i18next';
import AdminMerchantSectionTemplate from './AdminMerchantSectionTemplate';
import MerchantTransactionsTab from './tabs/MerchantTransactionsTab';

const AdminMerchantTransactions = () => {
    const { t } = useTranslation();
    return (
        <AdminMerchantSectionTemplate
            title={t('admin.merchantsUI.sectionTitles.transactions')}
            activeTab="transactions"
            renderContent={({ merchant }) => (
                <div className="row gy-5 g-xl-8">
                    <div className="col-xl-12">
                        <MerchantTransactionsTab merchantId={merchant.id} />
                    </div>
                </div>
            )}
        />
    );
};

export default AdminMerchantTransactions;

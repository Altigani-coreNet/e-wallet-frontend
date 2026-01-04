import React from 'react';
import AdminMerchantSectionTemplate from './AdminMerchantSectionTemplate';
import MerchantTransactionsTab from './tabs/MerchantTransactionsTab';

const AdminMerchantTransactions = () => (
    <AdminMerchantSectionTemplate
        title="Merchant Transactions"
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

export default AdminMerchantTransactions;



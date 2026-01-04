import React from 'react';
import AdminMerchantSectionTemplate from './AdminMerchantSectionTemplate';
import MerchantAttachmentsTab from './tabs/MerchantAttachmentsTab';

const AdminMerchantAttachments = () => (
    <AdminMerchantSectionTemplate
        title="Merchant Attachments"
        activeTab="attachments"
        renderContent={({ merchant }) => (
            <div className="row gy-5 g-xl-8">
                <div className="col-xl-12">
                    <MerchantAttachmentsTab attachments={merchant.attachments || []} />
                </div>
            </div>
        )}
    />
);

export default AdminMerchantAttachments;



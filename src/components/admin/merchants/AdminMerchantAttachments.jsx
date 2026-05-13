import React from 'react';
import { useTranslation } from 'react-i18next';
import AdminMerchantSectionTemplate from './AdminMerchantSectionTemplate';
import MerchantAttachmentsTab from './tabs/MerchantAttachmentsTab';

const AdminMerchantAttachments = () => {
    const { t } = useTranslation();
    return (
        <AdminMerchantSectionTemplate
            title={t('admin.merchantsUI.sectionTitles.attachments')}
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
};

export default AdminMerchantAttachments;

import React from 'react';
import { useTranslation } from 'react-i18next';
import AdminMerchantSectionTemplate from './AdminMerchantSectionTemplate';
import MerchantEventsTab from './tabs/MerchantEventsTab';

const AdminMerchantEvents = () => {
    const { t } = useTranslation();
    return (
        <AdminMerchantSectionTemplate
            title={t('admin.merchantsUI.sectionTitles.events')}
            activeTab="events"
            renderContent={({ merchant, latestLogs }) => (
                <div className="row gy-5 g-xl-8">
                    <div className="col-xl-12">
                        <MerchantEventsTab merchantId={merchant.id} initialLogs={latestLogs} />
                    </div>
                </div>
            )}
        />
    );
};

export default AdminMerchantEvents;

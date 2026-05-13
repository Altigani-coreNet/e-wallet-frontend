import React from 'react';
import { useTranslation } from 'react-i18next';

const PartnerEventsTab = ({ events = [] }) => {
    const { t } = useTranslation();
    return (
        <div className="card mb-5 mb-xl-10">
        <div className="card-header border-0">
            <div className="card-title m-0">
                <h3 className="fw-bolder m-0">{t('admin.paymentGetway.viewRecentEvents')}</h3>
            </div>
        </div>
        <div className="card-body border-top p-9">
            {events.length === 0 ? (
                <div className="text-muted">{t('admin.paymentGetway.viewNoEventsFound')}</div>
            ) : (
                events.map((log, idx) => (
                    <div key={idx} className="border-bottom py-3">
                        <div className="fw-semibold text-gray-800">{log.action || t('admin.paymentGetway.viewEventFallback')}</div>
                        <div className="text-muted fs-7">{log.created_at || ''}</div>
                    </div>
                ))
            )}
        </div>
        </div>
    );
};

export default PartnerEventsTab;

import React from 'react';
import { useTranslation } from 'react-i18next';

const MerchantTerminalsTab = ({ merchantId }) => {
    const { t } = useTranslation();
    return (
        <div className="card">
            <div className="card-header border-0">
                <div className="card-title">
                    <h3 className="fw-bold mb-0">{t('admin.merchantsUI.terminalsTab.title')}</h3>
                </div>
            </div>
            <div className="card-body">
                <div className="alert alert-info mb-0">
                    {merchantId
                        ? t('admin.merchantsUI.terminalsTab.placeholderWithMerchant', { id: merchantId })
                        : t('admin.merchantsUI.terminalsTab.placeholder')}
                </div>
            </div>
        </div>
    );
};

export default MerchantTerminalsTab;

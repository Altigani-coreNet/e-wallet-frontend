import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useToolbar } from '../../contexts/ToolbarContext';

const AdminEPaymentGatewayComingSoon = () => {
    const { t } = useTranslation();
    const { setTitle, setActions } = useToolbar();

    useEffect(() => {
        setTitle(t('admin.paymentGetway.ePaymentTitle'));
        setActions(null);
    }, [setTitle, setActions, t]);

    return (
        <div className="row">
            <div className="col-12">
                <div className="card">
                    <div className="card-body d-flex flex-column align-items-center text-center py-20">
                        <div className="mb-4">
                            <span className="badge badge-light-primary fw-bold">{t('admin.paymentGetway.ePaymentBadge')}</span>
                        </div>

                        <h2 className="mb-2">{t('admin.paymentGetway.ePaymentTitle')}</h2>
                        <p className="text-muted mb-0">
                            {t('admin.paymentGetway.ePaymentDescription')}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminEPaymentGatewayComingSoon;


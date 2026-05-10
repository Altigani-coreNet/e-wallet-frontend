import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCan } from '../../../utils/permissions';

const SettlementActions = ({ settlement }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const canView = useCan('pos.settlements.view_settlements');

    const handleView = () => {
        navigate(`/merchant/settlements/${settlement.id}`);
    };

    return (
        <div className="d-flex justify-content-end">
            {canView && (
                <button
                    onClick={handleView}
                    className="btn btn-sm btn-light btn-active-light-primary"
                    title={t('merchant.common.viewDetails')}
                >
                    <i className="ki-duotone ki-eye fs-5">
                        <span className="path1"></span>
                        <span className="path2"></span>
                        <span className="path3"></span>
                    </i>
                    {t('merchant.paymentLinks.row.view')}
                </button>
            )}
        </div>
    );
};

export default SettlementActions;

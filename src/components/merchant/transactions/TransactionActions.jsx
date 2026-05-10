import React from 'react';
import { useTranslation } from 'react-i18next';
import { useCan } from '../../../utils/permissions';

const TransactionActions = ({ transaction, onView }) => {
    const { t } = useTranslation();
    const canView = useCan('pos.transactions.view_transactions');
    if (!canView) return null;

    return (
        <button
            className="btn btn-sm btn-light btn-active-light-primary"
            onClick={() => onView(transaction)}
            title={t('merchant.common.viewDetails')}
        >
            <i className="ki-duotone ki-eye fs-5 me-2">
                <span className="path1"></span>
                <span className="path2"></span>
                <span className="path3"></span>
            </i>
            {t('merchant.transactions.viewDetailsButton')}
        </button>
    );
};

export default TransactionActions;


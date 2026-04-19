import React from 'react';
import { useCan } from '../../../utils/permissions';

const TransactionActions = ({ transaction, onView }) => {
    const canView = useCan('pos.transactions.view_transactions');
    if (!canView) return null;

    return (
        <button
            className="btn btn-sm btn-light btn-active-light-primary"
            onClick={() => onView(transaction)}
            title="View Details"
        >
            <i className="ki-duotone ki-eye fs-5 me-2">
                <span className="path1"></span>
                <span className="path2"></span>
                <span className="path3"></span>
            </i>
            Transaction Details
        </button>
    );
};

export default TransactionActions;


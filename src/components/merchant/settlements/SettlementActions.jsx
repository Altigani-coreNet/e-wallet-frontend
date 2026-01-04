import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCan } from '../../../utils/permissions';

const SettlementActions = ({ settlement }) => {
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
                    title="View Details"
                >
                    <i className="ki-duotone ki-eye fs-5">
                        <span className="path1"></span>
                        <span className="path2"></span>
                        <span className="path3"></span>
                    </i>
                    View
                </button>
            )}
        </div>
    );
};

export default SettlementActions;


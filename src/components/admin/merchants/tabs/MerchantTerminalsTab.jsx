import React from 'react';

const MerchantTerminalsTab = ({ merchantId }) => (
    <div className="card">
        <div className="card-header border-0">
            <div className="card-title">
                <h3 className="fw-bold mb-0">Terminals</h3>
            </div>
        </div>
        <div className="card-body">
            <div className="alert alert-info mb-0">
                {merchantId
                    ? `Terminals for merchant #${merchantId} will appear here once the integration is completed.`
                    : 'Terminals will appear here once the integration is completed.'}
            </div>
        </div>
    </div>
);

export default MerchantTerminalsTab;



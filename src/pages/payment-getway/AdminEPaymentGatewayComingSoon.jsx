import React, { useEffect } from 'react';
import { useToolbar } from '../../contexts/ToolbarContext';

const AdminEPaymentGatewayComingSoon = () => {
    const { setTitle, setActions } = useToolbar();

    useEffect(() => {
        setTitle('Payment Gateway');
        setActions(null);
    }, [setTitle, setActions]);

    return (
        <div className="row">
            <div className="col-12">
                <div className="card">
                    <div className="card-body d-flex flex-column align-items-center text-center py-20">
                        <div className="mb-4">
                            <span className="badge badge-light-primary fw-bold">Coming Soon</span>
                        </div>

                        <h2 className="mb-2">Payment Gateway</h2>
                        <p className="text-muted mb-0">
                            This settings page is being prepared. Please check back soon.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminEPaymentGatewayComingSoon;


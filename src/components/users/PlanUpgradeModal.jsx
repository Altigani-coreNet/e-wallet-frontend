import React from 'react';
import { useNavigate } from 'react-router-dom';

const PlanUpgradeModal = ({ show, onHide, resourceType = 'users' }) => {
    const navigate = useNavigate();
    
    if (!show) return null;

    const resourceName = resourceType === 'users' ? 'Users' : 
                        resourceType === 'categories' ? 'Categories' : 
                        resourceType === 'branches' ? 'Branches' : 
                        resourceType === 'products' ? 'Products' : 
                        resourceType === 'suppliers' ? 'Suppliers' : 
                        resourceType === 'purchases' ? 'Purchases' : 
                        resourceType === 'sales' ? 'Sales' : 
                        resourceType === 'customers' ? 'Customers' : 
                        'Resources';

    const handleUpgrade = () => {
        onHide();
        navigate('/merchant/plans');
    };

    return (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                    <div className="modal-header bg-warning">
                        <h5 className="modal-title text-dark fw-bold">
                            <i className="ki-duotone ki-information-5 fs-2 me-2">
                                <span className="path1"></span>
                                <span className="path2"></span>
                                <span className="path3"></span>
                            </i>
                            Plan Limit Reached
                        </h5>
                        <button type="button" className="btn-close" onClick={onHide}></button>
                    </div>
                    <div className="modal-body">
                        <div className="text-center mb-4">
                            <i className="ki-duotone ki-shield-cross fs-5x text-warning mb-4">
                                <span className="path1"></span>
                                <span className="path2"></span>
                                <span className="path3"></span>
                                <span className="path4"></span>
                            </i>
                        </div>
                        
                        <h4 className="text-center mb-3">You've Reached Your {resourceName} Limit</h4>
                        
                        <div className="alert alert-warning d-flex align-items-center p-3 mb-4">
                            <i className="ki-duotone ki-information-5 fs-2x text-warning me-3">
                                <span className="path1"></span>
                                <span className="path2"></span>
                                <span className="path3"></span>
                            </i>
                            <div>
                                <strong>Your current plan doesn't allow you to create more {resourceName.toLowerCase()}.</strong>
                                <div className="mt-1 small">Please upgrade your plan to add more {resourceName.toLowerCase()}.</div>
                            </div>
                        </div>

                        <div className="card bg-light-primary mb-4">
                            <div className="card-body">
                                <h6 className="fw-bold mb-3">
                                    <i className="ki-duotone ki-rocket fs-2 me-2">
                                        <span className="path1"></span>
                                        <span className="path2"></span>
                                    </i>
                                    Upgrade Your Plan
                                </h6>
                                <p className="mb-3">
                                    To continue adding more {resourceName.toLowerCase()}, please upgrade to a higher plan that includes more {resourceName.toLowerCase()} capacity.
                                </p>
                                <div className="d-flex align-items-center">
                                    <i className="ki-duotone ki-sms fs-2 text-primary me-2">
                                        <span className="path1"></span>
                                        <span className="path2"></span>
                                    </i>
                                    <div>
                                        <strong>Contact our support team</strong>
                                        <div className="text-muted small">They'll help you find the perfect plan for your needs</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-light p-3 rounded">
                            <div className="d-flex align-items-start">
                                <i className="ki-duotone ki-phone fs-2 text-success me-3 mt-1">
                                    <span className="path1"></span>
                                    <span className="path2"></span>
                                </i>
                                <div>
                                    <strong className="d-block mb-1">Need Help?</strong>
                                    <div className="text-muted small">
                                        Contact our sales team to discuss your requirements and find the best plan for your business.
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="modal-footer bg-light">
                        <button type="button" className="btn btn-light" onClick={onHide}>
                            <i className="ki-duotone ki-cross fs-2 me-2">
                                <span className="path1"></span>
                                <span className="path2"></span>
                            </i>
                            I Understand
                        </button>
                        <button type="button" className="btn btn-primary" onClick={handleUpgrade}>
                            <i className="ki-duotone ki-rocket fs-2 me-2">
                                <span className="path1"></span>
                                <span className="path2"></span>
                            </i>
                            Upgrade Plan
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlanUpgradeModal;


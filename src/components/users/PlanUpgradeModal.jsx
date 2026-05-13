import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const RESOURCE_I18N = {
    users: { title: 'merchant.users.planUpgrade.resourceUsersTitle', mid: 'merchant.users.planUpgrade.resourceUsers' },
    categories: {
        title: 'merchant.users.planUpgrade.resourceCategoriesTitle',
        mid: 'merchant.users.planUpgrade.resourceCategories',
    },
    branches: { title: 'merchant.users.planUpgrade.resourceBranchesTitle', mid: 'merchant.users.planUpgrade.resourceBranches' },
    products: { title: 'merchant.users.planUpgrade.resourceProductsTitle', mid: 'merchant.users.planUpgrade.resourceProducts' },
    suppliers: { title: 'merchant.users.planUpgrade.resourceSuppliersTitle', mid: 'merchant.users.planUpgrade.resourceSuppliers' },
    purchases: { title: 'merchant.users.planUpgrade.resourcePurchasesTitle', mid: 'merchant.users.planUpgrade.resourcePurchases' },
    sales: { title: 'merchant.users.planUpgrade.resourceSalesTitle', mid: 'merchant.users.planUpgrade.resourceSales' },
    customers: { title: 'merchant.users.planUpgrade.resourceCustomersTitle', mid: 'merchant.users.planUpgrade.resourceCustomers' },
};

const PlanUpgradeModal = ({ show, onHide, resourceType = 'users' }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    if (!show) return null;

    const keys = RESOURCE_I18N[resourceType] || {
        title: 'merchant.users.planUpgrade.resourceGenericTitle',
        mid: 'merchant.users.planUpgrade.resourceGeneric',
    };

    const resourceTitle = t(keys.title);
    const resourceMid = t(keys.mid);

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
                            {t('merchant.users.planUpgrade.title')}
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

                        <h4 className="text-center mb-3">{t('merchant.users.planUpgrade.heading', { resource: resourceTitle })}</h4>

                        <div className="alert alert-warning d-flex align-items-center p-3 mb-4">
                            <i className="ki-duotone ki-information-5 fs-2x text-warning me-3">
                                <span className="path1"></span>
                                <span className="path2"></span>
                                <span className="path3"></span>
                            </i>
                            <div>
                                <strong>{t('merchant.users.planUpgrade.bodyStrong', { resource: resourceMid })}</strong>
                                <div className="mt-1 small">{t('merchant.users.planUpgrade.bodyHint', { resource: resourceMid })}</div>
                            </div>
                        </div>

                        <div className="card bg-light-primary mb-4">
                            <div className="card-body">
                                <h6 className="fw-bold mb-3">
                                    <i className="ki-duotone ki-rocket fs-2 me-2">
                                        <span className="path1"></span>
                                        <span className="path2"></span>
                                    </i>
                                    {t('merchant.users.planUpgrade.cardTitle')}
                                </h6>
                                <p className="mb-3">{t('merchant.users.planUpgrade.cardBody', { resource: resourceMid })}</p>
                                <div className="d-flex align-items-center">
                                    <i className="ki-duotone ki-sms fs-2 text-primary me-2">
                                        <span className="path1"></span>
                                        <span className="path2"></span>
                                    </i>
                                    <div>
                                        <strong>{t('merchant.users.planUpgrade.contactTitle')}</strong>
                                        <div className="text-muted small">{t('merchant.users.planUpgrade.contactHint')}</div>
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
                                    <strong className="d-block mb-1">{t('merchant.users.planUpgrade.helpTitle')}</strong>
                                    <div className="text-muted small">{t('merchant.users.planUpgrade.helpBody')}</div>
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
                            {t('merchant.users.planUpgrade.understand')}
                        </button>
                        <button type="button" className="btn btn-primary" onClick={handleUpgrade}>
                            <i className="ki-duotone ki-rocket fs-2 me-2">
                                <span className="path1"></span>
                                <span className="path2"></span>
                            </i>
                            {t('merchant.users.planUpgrade.upgrade')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlanUpgradeModal;

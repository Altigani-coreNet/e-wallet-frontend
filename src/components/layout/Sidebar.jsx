import React, { useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';
import { useLocalePrefix } from '../../hooks/useLocalePrefix';
import { stripLocalePrefix } from '../../i18n/localePaths';

const SidebarSkeleton = () => (
    <div className="menu menu-column menu-rounded menu-sub-indention px-3 py-4" id="#kt_app_sidebar_menu">
        {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="placeholder-glow mb-5">
                <span className="placeholder col-8 mb-2" style={{ height: '16px' }}></span>
                <span className="placeholder col-5" style={{ height: '12px' }}></span>
                <span className="placeholder col-7 mt-3" style={{ height: '12px' }}></span>
            </div>
        ))}
    </div>
);

const Sidebar = ({ isLoading = false, error, onRetry }) => {
    const { t, i18n } = useTranslation();
    const isRtl = (i18n.language || 'en').toLowerCase().startsWith('ar');
    const drawerDirection = isRtl ? 'end' : 'start';
    const location = useLocation();
    const navigate = useNavigate();
    const p = useLocalePrefix();
    const pathNoLocale = stripLocalePrefix(location.pathname);
    const { merchant, logout } = useAuthStore();
    const profileLoading = useAuthStore(state => state.profileLoading);
    const profileLoaded = useAuthStore(state => state.profileLoaded);
    
    const isActive = (path) => pathNoLocale.includes(path);

    const isActiveExact = (path) => pathNoLocale === path;

    const merchantStatus = merchant?.status ? String(merchant.status).toLowerCase() : null;
    const isMerchantApproved = merchantStatus === 'approved';

    const handleLogout = useCallback(async () => {
        try {
            await logout();
        } catch (logoutError) {
            console.error('Sidebar logout failed:', logoutError);
        } finally {
            navigate('/login', { replace: true });
        }
    }, [logout, navigate]);

    // Reinitialize Metronic menu after render
    useEffect(() => {
        if (isLoading) {
            return;
        }

        if (window.KTMenu) {
            window.KTMenu.createInstances();
        }
        if (window.KTScroll) {
            window.KTScroll.createInstances();
        }
    }, [location, isLoading, i18n.language]);

    // Loader when permissions are not fetched yet or empty while loading profile  
    const shouldShowPermissionsLoader = profileLoading || !profileLoaded;

    return (
        <div id="kt_app_sidebar" className="app-sidebar flex-column" data-kt-drawer="true" data-kt-drawer-name="app-sidebar" data-kt-drawer-activate="{default: true, lg: false}" data-kt-drawer-overlay="true" data-kt-drawer-width="{default:'200px', '300px': '250px'}" data-kt-drawer-direction={drawerDirection}>
            {/* Begin::Logo */}
            <div className="app-sidebar-logo px-6" id="kt_app_sidebar_logo">
                <Link to={p('/merchant/dashboard')}>
                    <img alt={t('merchant.sidebar.logoAlt')} src="/faspay_logo_1.png" className="h-35px app-sidebar-logo-default" />
                    <img alt={t('merchant.sidebar.logoAlt')} src="/faspay_logo_1.png" className="h-30px app-sidebar-logo-minimize" />
                </Link>
                
                {/* Begin::Sidebar toggle */}
                <div className="app-sidebar-toggle btn btn-icon btn-shadow btn-sm btn-color-muted btn-active-color-primary h-30px w-30px position-absolute top-50 start-100 translate-middle rotate" 
                     data-kt-toggle="true" 
                     data-kt-toggle-state="active" 
                     data-kt-toggle-target="body" 
                     data-kt-toggle-name="app-sidebar-minimize">
                    <i className="ki-duotone ki-double-left fs-2 rotate-180">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                </div>
                {/* End::Sidebar toggle */}
            </div>
            {/* End::Logo */}
            
            {/* Sidebar menu */}
            <div className="app-sidebar-menu overflow-hidden flex-column-fluid">
                {/* Menu wrapper */}
                <div id="kt_app_sidebar_menu_wrapper" className="app-sidebar-wrapper hover-scroll-overlay-y my-5" data-kt-scroll="true" data-kt-scroll-height="auto" data-kt-scroll-dependencies="{default: '#kt_app_sidebar_logo, #kt_app_sidebar_footer', lg: '#kt_app_header, #kt_app_sidebar_logo, #kt_app_sidebar_footer'}" data-kt-scroll-wrappers="#kt_app_sidebar_menu" data-kt-scroll-offset="5px" data-kt-scroll-save-state="true" style={{height: '96vh'}}>
                    {/* Menu */}
                    {isLoading || shouldShowPermissionsLoader ? (
                        <SidebarSkeleton />
                    ) : (
                        <div className="menu menu-column menu-rounded menu-sub-indention px-3" id="#kt_app_sidebar_menu" data-kt-menu="true" data-kt-menu-expand="false">
                            
                            {error && (
                                <div className="alert alert-warning mx-1 mt-2 mb-4" role="alert">
                                    <div className="d-flex flex-column">
                                        <strong className="mb-2">{t('merchant.sidebar.profileNotLoaded')}</strong>
                                        <span className="fw-semibold">{t('merchant.sidebar.profileNotLoadedHint')}</span>
                                        {onRetry && (
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-light-warning mt-3"
                                                onClick={() => onRetry().catch(() => {})}
                                            >
                                                {t('merchant.sidebar.retryProfile')}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}

                            {!isMerchantApproved ? (
                                <>
                                    <div className="menu-item">
                                        <div className="menu-content px-3 py-2">
                                            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                                                <span className="text-muted fw-semibold text-uppercase small">{t('merchant.sidebar.merchantStatus')}</span>
                                                <span className="badge badge-light-warning fw-semibold text-uppercase">{t('merchant.sidebar.accountUnderReview')}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="menu-item">
                                        <Link className={`menu-link ${isActive('/merchant/profile') ? 'active' : ''}`} to={p('/merchant/profile')}>
                                            <span className="menu-icon">
                                                <i className="ki-duotone ki-profile-user fs-2">
                                                    <span className="path1"></span>
                                                    <span className="path2"></span>
                                                </i>
                                            </span>
                                            <span className="menu-title">{t('merchant.sidebar.profile')}</span>
                                        </Link>
                                    </div>

                                    <div className="menu-item">
                                        <div
                                            className="menu-link"
                                            role="button"
                                            tabIndex={0}
                                            onClick={handleLogout}
                                            onKeyDown={(event) => {
                                                if (event.key === 'Enter' || event.key === ' ') {
                                                    event.preventDefault();
                                                    handleLogout();
                                                }
                                            }}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <span className="menu-icon">
                                                <i className="ki-duotone ki-exit-left fs-2 text-danger">
                                                    <span className="path1"></span>
                                                    <span className="path2"></span>
                                                </i>
                                            </span>
                                            <span className="menu-title text-danger">{t('merchant.sidebar.logout')}</span>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                            {/* Payment Menu Items */}
                            <div className="menu-item">
                                <Link className={`menu-link ${isActiveExact('/merchant/dashboard') ? 'active' : ''}`} to={p('/merchant/dashboard')}>
                                    <span className="menu-icon">
                                        <i className="ki-duotone ki-element-11 fs-2">
                                            <span className="path1"></span>
                                            <span className="path2"></span>
                                            <span className="path3"></span>
                                            <span className="path4"></span>
                                        </i>
                                    </span>
                                    <span className="menu-title">{t('merchant.sidebar.dashboard')}</span>
                                </Link>
                            </div>
                            
                            {/* Payments Section */}
                            <div data-kt-menu-trigger="click" className={`menu-item menu-accordion mb-1 ${isActive('/merchant/transactions') || isActive('/merchant/batches') || isActive('/merchant/settlements') ? 'hover show' : ''}`}>
                                <span className={`menu-link ${isActive('/merchant/transactions') || isActive('/merchant/batches') || isActive('/merchant/settlements') ? 'active' : ''}`}>
                                    <span className="menu-icon">
                                        <i className="ki-duotone ki-dollar fs-2">
                                            <span className="path1"></span>
                                            <span className="path2"></span>
                                            <span className="path3"></span>
                                        </i>
                                    </span>
                                    <span className="menu-title">{t('merchant.sidebar.payments')}</span>
                                    <span className="menu-arrow"></span>
                                </span>
                                
                                <div className={`menu-sub menu-sub-accordion ${isActive('/merchant/transactions') || isActive('/merchant/batches') || isActive('/merchant/settlements') ? 'show' : ''}`}>
                                    <div className="menu-item">
                                        <Link className={`menu-link ${isActiveExact('/merchant/transactions') ? 'active' : ''}`} to={p('/merchant/transactions')}>
                                            <span className="menu-bullet">
                                                <span className="bullet bullet-dot"></span>
                                            </span>
                                            <span className="menu-title">{t('merchant.sidebar.transactions')}</span>
                                        </Link>
                                    </div>
                                    
                                    <div className="menu-item">
                                        <Link className={`menu-link ${pathNoLocale === '/merchant/transactions' && location.search.includes('type=refunded') ? 'active' : ''}`} to={`${p('/merchant/transactions')}?type=refunded`}>
                                            <span className="menu-bullet">
                                                <span className="bullet bullet-dot"></span>
                                            </span>
                                            <span className="menu-title">{t('merchant.sidebar.refundedTransactions')}</span>
                                        </Link>
                                    </div>
                                    
                                    <div className="menu-item">
                                        <Link className={`menu-link ${pathNoLocale === '/merchant/transactions' && location.search.includes('type=voided') ? 'active' : ''}`} to={`${p('/merchant/transactions')}?type=voided`}>
                                            <span className="menu-bullet">
                                                <span className="bullet bullet-dot"></span>
                                            </span>
                                            <span className="menu-title">{t('merchant.sidebar.voidedTransactions')}</span>
                                        </Link>
                                    </div>
                                    
                                    <div className="menu-item">
                                        <Link className={`menu-link ${isActive('/merchant/batches') ? 'active' : ''}`} to={p('/merchant/batches')}>
                                            <span className="menu-bullet">
                                                <span className="bullet bullet-dot"></span>
                                            </span>
                                            <span className="menu-title">{t('merchant.sidebar.batches')}</span>
                                        </Link>
                                    </div>
                                    
                                    {/* Settlements Sub-menu */}
                                    <div data-kt-menu-trigger="click" className={`menu-item menu-accordion mb-1 ${isActive('/merchant/settlements') ? 'hover show' : ''}`}>
                                        <span className={`menu-link ${isActive('/merchant/settlements') ? 'active' : ''}`}>
                                            <span className="menu-bullet">
                                                <span className="bullet bullet-dot"></span>
                                            </span>
                                            <span className="menu-title">{t('merchant.sidebar.settlements')}</span>
                                            <span className="menu-arrow"></span>
                                        </span>
                                        <div className={`menu-sub menu-sub-accordion ${isActive('/merchant/settlements') ? 'show' : ''}`}>
                                            <div className="menu-item">
                                                <Link className={`menu-link ${isActiveExact('/merchant/settlements') ? 'active' : ''}`} to={p('/merchant/settlements')}>
                                                    <span className="menu-bullet">
                                                        <span className="bullet bullet-dot"></span>
                                                    </span>
                                                    <span className="menu-title">{t('merchant.sidebar.settlements')}</span>
                                                </Link>
                                            </div>
                                            <div className="menu-item">
                                                <Link className={`menu-link ${isActive('/merchant/settlements/transactions') ? 'active' : ''}`} to={p('/merchant/settlements/transactions')}>
                                                    <span className="menu-bullet">
                                                        <span className="bullet bullet-dot"></span>
                                                    </span>
                                                    <span className="menu-title">{t('merchant.sidebar.settlementsTransactions')}</span>
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Payment Links */}
                            <div className="menu-item">
                                <Link className={`menu-link ${isActive('/merchant/payment-links') ? 'active' : ''}`} to={p('/merchant/payment-links')}>
                                    <span className="menu-icon">
                                        <i className="ki-duotone ki-disconnect fs-2">
                                            <span className="path1"></span>
                                            <span className="path2"></span>
                                            <span className="path3"></span>
                                        </i>
                                    </span>
                                    <span className="menu-title">{t('merchant.sidebar.paymentLinks')}</span>
                                </Link>
                            </div>
                            
                            {/* Developer Settings */}
                            <div data-kt-menu-trigger="click" className={`menu-item menu-accordion mb-1 ${isActive('/merchant/api-keys') || isActive('/merchant/webhooks') ? 'hover show' : ''}`}>
                                <span className={`menu-link ${isActive('/merchant/api-keys') || isActive('/merchant/webhooks') ? 'active' : ''}`}>
                                    <span className="menu-icon">
                                        <i className="ki-duotone ki-code fs-2">
                                            <span className="path1"></span>
                                            <span className="path2"></span>
                                            <span className="path3"></span>
                                            <span className="path4"></span>
                                        </i>
                                    </span>
                                    <span className="menu-title">{t('merchant.sidebar.developerSettings')}</span>
                                    <span className="menu-arrow"></span>
                                </span>
                                
                                <div className={`menu-sub menu-sub-accordion ${isActive('/merchant/api-keys') || isActive('/merchant/webhooks') ? 'show' : ''}`}>
                                    <div className="menu-item">
                                        <Link className={`menu-link ${isActive('/merchant/api-keys') ? 'active' : ''}`} to={p('/merchant/api-keys')}>
                                            <span className="menu-bullet">
                                                <span className="bullet bullet-dot"></span>
                                            </span>
                                            <span className="menu-title">{t('merchant.sidebar.apiKeys')}</span>
                                        </Link>
                                    </div>
                                    <div className="menu-item">
                                        <Link className={`menu-link ${isActive('/merchant/webhooks') ? 'active' : ''}`} to={p('/merchant/webhooks')}>
                                            <span className="menu-bullet">
                                                <span className="bullet bullet-dot"></span>
                                            </span>
                                            <span className="menu-title">{t('merchant.sidebar.webhookSettings')}</span>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Profile */}
                            <div className="menu-item">
                                <Link className={`menu-link ${isActive('/merchant/profile') ? 'active' : ''}`} to={p('/merchant/profile')}>
                                    <span className="menu-icon">
                                        <i className="ki-duotone ki-profile-user fs-2">
                                            <span className="path1"></span>
                                            <span className="path2"></span>
                                        </i>
                                    </span>
                                    <span className="menu-title">{t('merchant.sidebar.profile')}</span>
                                </Link>
                            </div>
                            
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Sidebar;

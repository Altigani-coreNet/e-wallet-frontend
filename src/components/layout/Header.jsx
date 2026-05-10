import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';
import { useSidebar } from '../../contexts/SidebarContext';
import { useLocalePrefix } from '../../hooks/useLocalePrefix';
import { stripLocalePrefix } from '../../i18n/localePaths';
import NotificationMenu from './NotificationMenu';
import LanguageSwitcher from '../common/LanguageSwitcher';

const Header = () => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.dir() === 'rtl';
    const navigate = useNavigate();
    const location = useLocation();
    const p = useLocalePrefix();
    const pathNoLocale = stripLocalePrefix(location.pathname);
    const { user, merchant, logout, testMode, toggleTestMode } = useAuthStore();
    const planName = merchant?.plan?.name || merchant?.plan_name || '';
    const isEnterprisePlan = planName && ['enterprise', 'premium'].some((kw) => planName.toLowerCase().includes(kw));
    const { toggleSidebar } = useSidebar();
    
    // Get merchant scopes
    const merchantScopes = Array.isArray(merchant?.scopes) ? merchant.scopes : [];
    const hasSoftPosScope = merchantScopes.includes('softpos');

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    // Reinitialize Metronic components after render
    useEffect(() => {
        // Reinitialize KTMenu for dropdowns
        if (window.KTMenu) {
            window.KTMenu.createInstances();
        }
        
        // Reinitialize theme mode
        if (window.KTThemeMode) {
            window.KTThemeMode.init();
        }

        // Ensure menu items remain visible
        const menuElement = document.getElementById('kt_app_header_menu');
        if (menuElement) {
            // Force menu items to be visible
            const menuItems = menuElement.querySelectorAll('.menu-item');
            menuItems.forEach(item => {
                item.style.display = '';
                item.style.visibility = 'visible';
                item.style.opacity = '1';
            });
        }
    }, [location.pathname, i18n.language]);

    return (
        <div
            id="kt_app_header"
            className="app-header"
            dir={isRtl ? 'rtl' : 'ltr'}
            data-kt-sticky="true"
            data-kt-sticky-activate="{default: true, lg: true}"
            data-kt-sticky-name="app-header-minimize"
            data-kt-sticky-offset="{default: '200px', lg: '0'}"
            data-kt-sticky-animation="false"
        >
            <div className="app-container container-fluid d-flex align-items-stretch justify-content-between" id="kt_app_header_container">
                {/* Sidebar mobile toggle */}
                <div className="d-flex align-items-center d-lg-none ms-n3 me-1 me-md-2" title={t('header.showSidebarMenu')}>
                    <button 
                        type="button" 
                        className="btn" 
                        id="kt_app_sidebar_mobile_toggle" 
                        onClick={toggleSidebar}
                        style={{ width: '35px', height: '35px', padding: 0, border: 'none', background: 'transparent' }}
                    >
                        <i className="ki-duotone ki-abstract-14 fs-2 fs-md-1">
                            <span className="path1"></span>
                            <span className="path2"></span>
                        </i>
                    </button>
                </div>

                {/* Mobile logo */}
                <div className="d-flex align-items-center flex-grow-1 flex-lg-grow-0">
                    <Link to={p('/merchant/dashboard')} className="d-lg-none">
                        <img alt={t('merchant.header.logoAlt')} src="/assets/media/logos/default-small.svg" className="h-30px" />
                    </Link>
                </div>

                {/* Header wrapper: inherits page dir — RTL puts Dashboard on the right, icon cluster on the left */}
                <div className="d-flex align-items-stretch justify-content-between flex-lg-grow-1" id="kt_app_header_wrapper">
                    {/* Menu wrapper */}
                    <div className="app-header-menu app-header-mobile-drawer align-items-stretch" data-kt-drawer="true" data-kt-drawer-name="app-header-menu" data-kt-drawer-activate="{default: true, lg: false}" data-kt-drawer-overlay="true" data-kt-drawer-width="250px" data-kt-drawer-direction="end" data-kt-drawer-toggle="#kt_app_header_menu_toggle" data-kt-swapper="true" data-kt-swapper-mode="{default: 'append', lg: 'prepend'}" data-kt-swapper-parent="{default: '#kt_app_body', lg: '#kt_app_header_wrapper'}">
                        <div
                            style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}
                            dir={isRtl ? 'rtl' : 'ltr'}
                        >
                            {hasSoftPosScope && (
                                <Link 
                                    to={p('/merchant/dashboard')} 
                                    style={{ 
                                        textDecoration: 'none',
                                        color: pathNoLocale.startsWith('/merchant/dashboard') ? '#009ef7' : 'inherit',
                                        fontWeight: pathNoLocale.startsWith('/merchant/dashboard') ? '600' : '500',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        padding: '0.5rem 1rem'
                                    }}
                                >
                                    <i className="ki-duotone ki-chart-simple fs-2">
                                        <span className="path1"></span>
                                        <span className="path2"></span>
                                        <span className="path3"></span>
                                        <span className="path4"></span>
                                    </i>
                                    <span>{t('merchant.header.dashboard')}</span>
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* Navbar: dir=ltr keeps icon order stable; row-reverse in RTL matches profile→…→search reading toward outer edge */}
                    <div
                        className="app-navbar flex-shrink-0 d-flex align-items-stretch"
                        dir="ltr"
                        style={{ flexDirection: isRtl ? 'row-reverse' : 'row' }}
                    >
                        {/* Search */}
                        <div className="app-navbar-item align-items-stretch ms-1 ms-md-4">
                            <div className="header-search d-flex align-items-stretch">
                                <div className="d-flex align-items-center">
                                    <button type="button" className="btn" style={{ width: '35px', height: '35px', padding: 0, border: 'none', background: 'transparent' }}>
                                        <i className="ki-duotone ki-magnifier fs-2">
                                            <span className="path1"></span>
                                            <span className="path2"></span>
                                        </i>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <NotificationMenu />

                        {/* Theme mode */}
                        <div className="app-navbar-item ms-1 ms-md-4">
                            <a href="#" 
                               className="btn btn-icon btn-custom btn-icon-muted btn-active-light btn-active-color-primary w-35px h-35px" 
                               data-kt-menu-trigger="{default:'click', lg: 'hover'}" 
                               data-kt-menu-attach="parent" 
                               data-kt-menu-placement="bottom-end">
                                <i className="ki-duotone ki-night-day theme-light-show fs-1">
                                    <span className="path1"></span>
                                    <span className="path2"></span>
                                    <span className="path3"></span>
                                    <span className="path4"></span>
                                    <span className="path5"></span>
                                    <span className="path6"></span>
                                    <span className="path7"></span>
                                    <span className="path8"></span>
                                    <span className="path9"></span>
                                    <span className="path10"></span>
                                </i>
                                <i className="ki-duotone ki-moon theme-dark-show fs-1">
                                    <span className="path1"></span>
                                    <span className="path2"></span>
                                </i>
                            </a>
                            
                            {/* Theme mode menu */}
                            <div className="menu menu-sub menu-sub-dropdown menu-column menu-rounded menu-title-gray-700 menu-icon-gray-500 menu-active-bg menu-state-color fw-semibold py-4 fs-base w-150px" data-kt-menu="true" data-kt-element="theme-mode-menu">
                                <div className="menu-item px-3 my-0">
                                    <a href="#" className="menu-link px-3 py-2" data-kt-element="mode" data-kt-value="light">
                                        <span className="menu-icon" data-kt-element="icon">
                                            <i className="ki-duotone ki-night-day fs-2">
                                                <span className="path1"></span>
                                                <span className="path2"></span>
                                                <span className="path3"></span>
                                                <span className="path4"></span>
                                                <span className="path5"></span>
                                                <span className="path6"></span>
                                                <span className="path7"></span>
                                                <span className="path8"></span>
                                                <span className="path9"></span>
                                                <span className="path10"></span>
                                            </i>
                                        </span>
                                        <span className="menu-title">{t('header.themeLight')}</span>
                                    </a>
                                </div>
                                <div className="menu-item px-3 my-0">
                                    <a href="#" className="menu-link px-3 py-2" data-kt-element="mode" data-kt-value="dark">
                                        <span className="menu-icon" data-kt-element="icon">
                                            <i className="ki-duotone ki-moon fs-2">
                                                <span className="path1"></span>
                                                <span className="path2"></span>
                                            </i>
                                        </span>
                                        <span className="menu-title">{t('header.themeDark')}</span>
                                    </a>
                                </div>
                                <div className="menu-item px-3 my-0">
                                    <a href="#" className="menu-link px-3 py-2" data-kt-element="mode" data-kt-value="system">
                                        <span className="menu-icon" data-kt-element="icon">
                                            <i className="ki-duotone ki-screen fs-2">
                                                <span className="path1"></span>
                                                <span className="path2"></span>
                                                <span className="path3"></span>
                                                <span className="path4"></span>
                                            </i>
                                        </span>
                                        <span className="menu-title">{t('header.themeSystem')}</span>
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* Test Mode Toggle */}
                        <div className="app-navbar-item ms-1 ms-md-4">
                            <button
                                type="button"
                                onClick={toggleTestMode}
                                className={`btn btn-icon btn-custom w-35px h-35px ${testMode ? 'btn-active-color-warning' : 'btn-active-color-success'}`}
                                title={testMode ? t('merchant.header.testModeOn') : t('merchant.header.testModeOff')}
                            >
                                {testMode ? (
                                    <i className="ki-duotone ki-shield-tick fs-1 text-warning">
                                        <span className="path1"></span>
                                        <span className="path2"></span>
                                    </i>
                                ) : (
                                    <i className="ki-duotone ki-shield-cross fs-1 text-success">
                                        <span className="path1"></span>
                                        <span className="path2"></span>
                                    </i>
                                )}
                            </button>
                        </div>

                        {/* User menu */}
                        <div className="app-navbar-item ms-1 ms-md-4" id="kt_header_user_menu_toggle">
                            <div className="cursor-pointer symbol symbol-35px" data-kt-menu-trigger="{default: 'click', lg: 'hover'}" data-kt-menu-attach="parent" data-kt-menu-placement="bottom-end">
                                <img 
                                    src={user?.profile_image || '/assets/media/avatars/300-1.jpg'}
                                    className="rounded-3" 
                                    alt={t('merchant.header.userAvatarAlt')}
                                />
                            </div>
                            
                            {/* User account menu */}
                            <div className="menu menu-sub menu-sub-dropdown menu-column menu-rounded menu-gray-800 menu-state-bg menu-state-color fw-semibold py-4 fs-6 w-275px" data-kt-menu="true">
                                {/* Menu item */}
                                <div className="menu-item px-3">
                                    <div className="menu-content d-flex align-items-center px-3">
                                        {/* Avatar */}
                                        <div className="symbol symbol-50px me-5">
                                            <img alt={t('merchant.header.userAvatarAlt')} src={user?.profile_image || '/assets/media/avatars/300-1.jpg'} />
                                        </div>
                                        {/* Username */}
                                        <div className="d-flex flex-column">
                                            <div className="fw-bold d-flex align-items-center fs-5">
                                                {user?.name || user?.first_name + ' ' + user?.last_name}
                                            </div>
                                            <a href="#" className="fw-semibold text-muted text-hover-primary fs-7">
                                                {user?.email}
                                            </a>
                                        {planName && (
                                            <span className="badge badge-light-primary   fw-semibold mt-2" style={{ width: 'fit-content' }}>
                                                {planName}
                                            </span>
                                        )}
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Menu separator */}
                                <div className="separator my-2"></div>

                                <LanguageSwitcher variant="userMenu" />
                                
                                {/* Menu item — same icon row layout as LanguageSwitcher (userMenu) */}
                                <div className="menu-item px-5">
                                    <Link to={p('/merchant/profile')} className="menu-link px-5 py-3 d-flex align-items-center">
                                        <span className="menu-icon">
                                            <i className="ki-duotone ki-profile-user fs-2">
                                                <span className="path1" />
                                                <span className="path2" />
                                            </i>
                                        </span>
                                        <span className="menu-title flex-grow-1">{t('merchant.header.myProfile')}</span>
                                    </Link>
                                </div>

                                {!isEnterprisePlan && (
                                    <div className="menu-item px-5">
                                        <Link to={p('/merchant/plans')} className="menu-link px-5 py-3 d-flex align-items-center">
                                            <span className="menu-icon">
                                                <i className="ki-duotone ki-rocket fs-2">
                                                    <span className="path1" />
                                                    <span className="path2" />
                                                </i>
                                            </span>
                                            <span className="menu-title flex-grow-1">{t('merchant.header.upgradePlan')}</span>
                                        </Link>
                                    </div>
                                )}

                                <div className="menu-item px-5">
                                    <a
                                        href="#"
                                        onClick={(e) => { e.preventDefault(); handleLogout(); }}
                                        className="menu-link px-5 py-3 d-flex align-items-center"
                                    >
                                        <span className="menu-icon">
                                            <i className="ki-duotone ki-exit-left fs-2 text-danger">
                                                <span className="path1" />
                                                <span className="path2" />
                                            </i>
                                        </span>
                                        <span className="menu-title flex-grow-1 text-danger">{t('merchant.header.signOut')}</span>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Header;


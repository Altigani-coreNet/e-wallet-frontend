import React, { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useCan } from '../../../utils/permissions';

/** Defaults when no dynamic branding store is wired (see optional useSettingsStore). */
const defaultBranding = {
    title: 'Fastpay',
    logo: '/faspay_logo_1.png',
    smallLogo: '/faspay_logo_1.png',
};

const AdminSidebar = () => {
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const currentTransactionType = (searchParams.get('type') || '').toLowerCase();
    const isTransactionsRoute = location.pathname === '/admin/transactions';
    const isTransactionsListActive = isTransactionsRoute && !currentTransactionType;
    const isTransactionsRefundActive = isTransactionsRoute && currentTransactionType === 'refund';
    const isTransactionsVoidActive =
        isTransactionsRoute && (currentTransactionType === 'void' || currentTransactionType === 'voided');

    const isPathActive = (path, { exact = false } = {}) => {
        if (exact) {
            return location.pathname === path;
        }

        if (location.pathname === path) {
            return true;
        }

        return location.pathname.startsWith(`${path}/`);
    };

    const canViewDashboard = useCan('pos.dashboard.view_dashboard');
    const canViewTransactions = useCan('pos.transactions.view_transactions');
    const canViewRefunded = useCan('pos.transactions.refund_transactions');
    const canViewVoided = useCan('pos.transactions.void_transactions');
    const canViewBatches = useCan('pos.batches.view_batches');
    const canViewSettlements = useCan('pos.settlements.view_settlements');
    const canViewPaymentLinks = useCan('pos.payment_links.view_payment_links');
    const canViewCountries = useCan('pos.countries.view_countries');

    const hasPaymentsMenu =
        canViewTransactions ||
        canViewRefunded ||
        canViewVoided ||
        canViewBatches ||
        canViewSettlements ||
        canViewPaymentLinks;

    const isPaymentsSectionActive =
        isPathActive('/admin/transactions') ||
        location.pathname === '/admin/batches' ||
        location.pathname === '/admin/settlements' ||
        isPathActive('/admin/payment-links');

    useEffect(() => {
        const sidebar = document.getElementById('kt_app_sidebar');
        const overlay = document.querySelector('.drawer-overlay');

        if (sidebar && window.innerWidth < 992) {
            sidebar.classList.remove('drawer-on');
            document.body.removeAttribute('data-kt-drawer');
            if (overlay) overlay.style.display = 'none';
        }
    }, [location.pathname]);

    const isServiceRoute =
        location.pathname === '/admin/services' ||
        location.pathname.startsWith('/admin/services/') ||
        location.pathname === '/admin/service-products' ||
        location.pathname.startsWith('/admin/service-products/');

    const isServiceCategoryDetailPath = /^\/admin\/service\/category\/[0-9a-f-]{36}$/i.test(location.pathname);
    const isCategoriesManagementRoute =
        location.pathname.startsWith('/admin/service/category/type') || isServiceCategoryDetailPath;

    const isSettingsServiceRoute =
        location.pathname === '/admin/service/category' ||
        location.pathname.startsWith('/admin/service/category/') ||
        location.pathname === '/admin/service/sub-categories' ||
        location.pathname.startsWith('/admin/service/sub-categories/') ||
        location.pathname === '/admin/service/type' ||
        location.pathname.startsWith('/admin/service/type/') ||
        location.pathname === '/admin/service/country' ||
        location.pathname.startsWith('/admin/service/country/');

    const isSettingsEPaymentGatewayRoute =
        location.pathname === '/admin/settings/e-payment-gateway' ||
        location.pathname.startsWith('/admin/settings/e-payment-gateway/');

    const isSettingsAccordionActive =
        isPathActive('/admin/system') || isSettingsServiceRoute || isSettingsEPaymentGatewayRoute;

    return (
        <div
            id="kt_app_sidebar"
            className="app-sidebar flex-column"
            data-kt-drawer="true"
            data-kt-drawer-name="app-sidebar"
            data-kt-drawer-activate="{default: true, lg: false}"
            data-kt-drawer-overlay="true"
            data-kt-drawer-width="225px"
            data-kt-drawer-direction="start"
            data-kt-drawer-toggle="#kt_app_sidebar_mobile_toggle"
        >
            <div className="app-sidebar-logo px-6" id="kt_app_sidebar_logo">
                <NavLink to="/admin/dashboard">
                    <img
                        alt={defaultBranding.title || 'Logo'}
                        src={defaultBranding.logo}
                        className="h-35px app-sidebar-logo-default"
                    />
                    <img
                        alt={defaultBranding.title || 'Logo'}
                        src={defaultBranding.smallLogo}
                        className="h-30px app-sidebar-logo-minimize"
                    />
                </NavLink>

                <div
                    className="app-sidebar-toggle btn btn-icon btn-shadow btn-sm btn-color-muted btn-active-color-primary h-30px w-30px position-absolute top-50 start-100 translate-middle rotate"
                    data-kt-toggle="true"
                    data-kt-toggle-state="active"
                    data-kt-toggle-target="body"
                    data-kt-toggle-name="app-sidebar-minimize"
                >
                    <i className="ki-duotone ki-double-left fs-2 rotate-180">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                </div>
            </div>

            <div className="app-sidebar-menu overflow-hidden flex-column-fluid">
                <div id="kt_app_sidebar_menu_wrapper" className="app-sidebar-wrapper">
                    <div
                        id="kt_app_sidebar_menu_scroll"
                        className="scroll-y my-5 mx-3"
                        data-kt-scroll="true"
                        data-kt-scroll-activate="true"
                        data-kt-scroll-height="auto"
                        data-kt-scroll-dependencies="#kt_app_sidebar_logo, #kt_app_sidebar_footer"
                        data-kt-scroll-wrappers="#kt_app_sidebar_menu"
                        data-kt-scroll-offset="5px"
                        data-kt-scroll-save-state="true"
                    >
                        <div
                            className="menu menu-column menu-rounded menu-sub-indention fw-semibold fs-6"
                            id="#kt_app_sidebar_menu"
                            data-kt-menu="true"
                            data-kt-menu-expand="false"
                        >
                            <div className="menu-item pt-5">
                                <div className="menu-content">
                                    <span className="menu-heading fw-bold text-uppercase fs-7">Main Menu</span>
                                </div>
                            </div>

                            {canViewDashboard && (
                                <div className="menu-item">
                                    <NavLink
                                        className={`menu-link ${isPathActive('/admin/dashboard', { exact: true }) ? 'active' : ''}`}
                                        to="/admin/dashboard"
                                    >
                                        <span className="menu-icon">
                                            <i className="ki-duotone ki-element-11 fs-2">
                                                <span className="path1"></span>
                                                <span className="path2"></span>
                                                <span className="path3"></span>
                                                <span className="path4"></span>
                                            </i>
                                        </span>
                                        <span className="menu-title">Dashboard</span>
                                    </NavLink>
                                </div>
                            )}

                            <div
                                data-kt-menu-trigger="click"
                                className={`menu-item menu-accordion ${isPathActive('/admin/partners') ? 'hover show' : ''}`}
                            >
                                <span className={`menu-link ${isPathActive('/admin/partners') ? 'active' : ''}`}>
                                    <span className="menu-icon">
                                        <i className="ki-duotone ki-abstract-28 fs-2">
                                            <span className="path1"></span>
                                            <span className="path2"></span>
                                        </i>
                                    </span>
                                    <span className="menu-title">Partner Management</span>
                                    <span className="menu-arrow"></span>
                                </span>

                                <div className={`menu-sub menu-sub-accordion ${isPathActive('/admin/partners') ? 'show' : ''}`}>
                                    <div className="menu-item">
                                        <NavLink
                                            className={({ isActive: routeActive }) => `menu-link ${routeActive ? 'active' : ''}`}
                                            to="/admin/partners"
                                            end
                                        >
                                            <span className="menu-bullet">
                                                <span className="bullet bullet-dot"></span>
                                            </span>
                                            <span className="menu-title">Partner Management</span>
                                        </NavLink>
                                    </div>
                                    <div className="menu-item">
                                        <NavLink
                                            className={`menu-link ${location.pathname === '/admin/partners/create' ? 'active' : ''}`}
                                            to="/admin/partners/create"
                                        >
                                            <span className="menu-bullet">
                                                <span className="bullet bullet-dot"></span>
                                            </span>
                                            <span className="menu-title">Add Partner</span>
                                        </NavLink>
                                    </div>
                                    <div className="menu-item">
                                        <NavLink
                                            className={({ isActive: routeActive }) => `menu-link ${routeActive ? 'active' : ''}`}
                                            to="/admin/partners/sub-partners"
                                        >
                                            <span className="menu-bullet">
                                                <span className="bullet bullet-dot"></span>
                                            </span>
                                            <span className="menu-title">Sub Partner Management</span>
                                        </NavLink>
                                    </div>
                                    <div className="menu-item">
                                        <NavLink
                                            className={`menu-link ${isPathActive('/admin/notifier-configurations') || location.pathname.includes('/notifier-configurations') ? 'active' : ''}`}
                                            to="/admin/notifier-configurations"
                                        >
                                            <span className="menu-bullet">
                                                <span className="bullet bullet-dot"></span>
                                            </span>
                                            <span className="menu-title">Partner Configuration</span>
                                        </NavLink>
                                    </div>
                                </div>
                            </div>

                            <div
                                data-kt-menu-trigger="click"
                                className={`menu-item menu-accordion ${isServiceRoute ? 'hover show' : ''}`}
                            >
                                <span className={`menu-link ${isServiceRoute ? 'active' : ''}`}>
                                    <span className="menu-icon">
                                        <i className="ki-duotone ki-setting-3 fs-2">
                                            <span className="path1"></span>
                                            <span className="path2"></span>
                                            <span className="path3"></span>
                                            <span className="path4"></span>
                                            <span className="path5"></span>
                                        </i>
                                    </span>
                                    <span className="menu-title">Service Management</span>
                                    <span className="menu-arrow"></span>
                                </span>

                                <div className={`menu-sub menu-sub-accordion ${isServiceRoute ? 'show' : ''}`}>
                                    <div className="menu-item">
                                        <NavLink
                                            className={`menu-link ${isPathActive('/admin/services', { exact: true }) ? 'active' : ''}`}
                                            to="/admin/services"
                                        >
                                            <span className="menu-bullet">
                                                <span className="bullet bullet-dot"></span>
                                            </span>
                                            <span className="menu-title">Services</span>
                                        </NavLink>
                                    </div>
                                    <div className="menu-item">
                                        <NavLink
                                            className={`menu-link ${isPathActive('/admin/service-products', { exact: true }) ? 'active' : ''}`}
                                            to="/admin/service-products"
                                        >
                                            <span className="menu-bullet">
                                                <span className="bullet bullet-dot"></span>
                                            </span>
                                            <span className="menu-title">Service Products</span>
                                        </NavLink>
                                    </div>
                                </div>
                            </div>

                            {hasPaymentsMenu && (
                                <div
                                    data-kt-menu-trigger="click"
                                    className={`menu-item menu-accordion ${isPaymentsSectionActive ? 'hover show' : ''}`}
                                >
                                    <span className={`menu-link ${isPaymentsSectionActive ? 'active' : ''}`}>
                                        <span className="menu-icon">
                                            <i className="ki-duotone ki-dollar fs-2">
                                                <span className="path1"></span>
                                                <span className="path2"></span>
                                                <span className="path3"></span>
                                                <span className="path4"></span>
                                            </i>
                                        </span>
                                        <span className="menu-title">Payment Transactions</span>
                                        <span className="menu-arrow"></span>
                                    </span>

                                    <div className={`menu-sub menu-sub-accordion ${isPaymentsSectionActive ? 'show' : ''}`}>
                                        {(canViewTransactions ||
                                            canViewRefunded ||
                                            canViewVoided ||
                                            canViewBatches ||
                                            canViewSettlements) && (
                                            <div
                                                data-kt-menu-trigger="click"
                                                className={`menu-item menu-accordion mb-1 ${
                                                    isPathActive('/admin/transactions') ||
                                                    location.pathname === '/admin/batches' ||
                                                    location.pathname === '/admin/settlements'
                                                        ? 'hover show'
                                                        : ''
                                                }`}
                                            >
                                                <span
                                                    className={`menu-link ${
                                                        isPathActive('/admin/transactions') ||
                                                        location.pathname === '/admin/batches' ||
                                                        location.pathname === '/admin/settlements'
                                                            ? 'active'
                                                            : ''
                                                    }`}
                                                >
                                                    <span className="menu-bullet">
                                                        <span className="bullet bullet-dot"></span>
                                                    </span>
                                                    <span className="menu-title">Payments</span>
                                                    <span className="menu-arrow"></span>
                                                </span>
                                                <div
                                                    className={`menu-sub menu-sub-accordion ${
                                                        isPathActive('/admin/transactions') ||
                                                        location.pathname === '/admin/batches' ||
                                                        location.pathname === '/admin/settlements'
                                                            ? 'show'
                                                            : ''
                                                    }`}
                                                >
                                                    {canViewTransactions && (
                                                        <div className="menu-item">
                                                            <NavLink
                                                                className={() =>
                                                                    `menu-link ${isTransactionsListActive ? 'active' : ''}`
                                                                }
                                                                to="/admin/transactions"
                                                            >
                                                                <span className="menu-bullet">
                                                                    <span className="bullet bullet-dot"></span>
                                                                </span>
                                                                <span className="menu-title">Transactions</span>
                                                            </NavLink>
                                                        </div>
                                                    )}
                                                    {canViewRefunded && (
                                                        <div className="menu-item">
                                                            <NavLink
                                                                className={() =>
                                                                    `menu-link ${isTransactionsRefundActive ? 'active' : ''}`
                                                                }
                                                                to="/admin/transactions?type=refund"
                                                            >
                                                                <span className="menu-bullet">
                                                                    <span className="bullet bullet-dot"></span>
                                                                </span>
                                                                <span className="menu-title">Refunded Transactions</span>
                                                            </NavLink>
                                                        </div>
                                                    )}
                                                    {canViewVoided && (
                                                        <div className="menu-item">
                                                            <NavLink
                                                                className={() =>
                                                                    `menu-link ${isTransactionsVoidActive ? 'active' : ''}`
                                                                }
                                                                to="/admin/transactions?type=void"
                                                            >
                                                                <span className="menu-bullet">
                                                                    <span className="bullet bullet-dot"></span>
                                                                </span>
                                                                <span className="menu-title">Voided Transactions</span>
                                                            </NavLink>
                                                        </div>
                                                    )}
                                                    {canViewBatches && (
                                                        <div className="menu-item">
                                                            <NavLink
                                                                className={`menu-link ${location.pathname === '/admin/batches' ? 'active' : ''}`}
                                                                to="/admin/batches"
                                                            >
                                                                <span className="menu-bullet">
                                                                    <span className="bullet bullet-dot"></span>
                                                                </span>
                                                                <span className="menu-title">Batches</span>
                                                            </NavLink>
                                                        </div>
                                                    )}
                                                    {canViewSettlements && (
                                                        <div className="menu-item">
                                                            <NavLink
                                                                className={`menu-link ${location.pathname === '/admin/settlements' ? 'active' : ''}`}
                                                                to="/admin/settlements"
                                                            >
                                                                <span className="menu-bullet">
                                                                    <span className="bullet bullet-dot"></span>
                                                                </span>
                                                                <span className="menu-title">Settlements</span>
                                                            </NavLink>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {canViewPaymentLinks && (
                                            <div className="menu-item">
                                                <NavLink
                                                    className={`menu-link ${isPathActive('/admin/payment-links') ? 'active' : ''}`}
                                                    to="/admin/payment-links"
                                                >
                                                    <span className="menu-bullet">
                                                        <span className="bullet bullet-dot"></span>
                                                    </span>
                                                    <span className="menu-title">Payment Links</span>
                                                </NavLink>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div
                                data-kt-menu-trigger="click"
                                className={`menu-item menu-accordion ${isSettingsAccordionActive ? 'hover show' : ''}`}
                            >
                                <span className={`menu-link ${isSettingsAccordionActive ? 'active' : ''}`}>
                                    <span className="menu-icon">
                                        <i className="ki-duotone ki-setting-2 fs-2">
                                            <span className="path1"></span>
                                            <span className="path2"></span>
                                        </i>
                                    </span>
                                    <span className="menu-title">Settings</span>
                                    <span className="menu-arrow"></span>
                                </span>

                                <div className={`menu-sub menu-sub-accordion ${isSettingsAccordionActive ? 'show' : ''}`}>
                                    <div className="menu-item">
                                        <NavLink
                                            className={`menu-link ${isPathActive('/admin/settings/e-payment-gateway', { exact: true }) ? 'active' : ''}`}
                                            to="/admin/settings/e-payment-gateway"
                                        >
                                            <span className="menu-bullet">
                                                <span className="bullet bullet-dot"></span>
                                            </span>
                                            <span className="menu-title">Payment Gateway</span>
                                        </NavLink>
                                    </div>

                                    <div
                                        data-kt-menu-trigger="click"
                                        className={`menu-item menu-accordion mb-1 ${isPathActive('/admin/system/roles') ? 'hover show' : ''}`}
                                    >
                                        <span className={`menu-link ${isPathActive('/admin/system/roles') ? 'active' : ''}`}>
                                            <span className="menu-bullet">
                                                <span className="bullet bullet-dot"></span>
                                            </span>
                                            <span className="menu-title">Roles</span>
                                            <span className="menu-arrow"></span>
                                        </span>
                                        <div className={`menu-sub menu-sub-accordion ${isPathActive('/admin/system/roles') ? 'show' : ''}`}>
                                            <div className="menu-item">
                                                <NavLink
                                                    className={`menu-link ${location.pathname === '/admin/system/roles' ? 'active' : ''}`}
                                                    to="/admin/system/roles"
                                                >
                                                    <span className="menu-bullet">
                                                        <span className="bullet bullet-dot"></span>
                                                    </span>
                                                    <span className="menu-title">Role List</span>
                                                </NavLink>
                                            </div>
                                            <div className="menu-item">
                                                <NavLink
                                                    className={`menu-link ${location.pathname === '/admin/system/roles/create' ? 'active' : ''}`}
                                                    to="/admin/system/roles/create"
                                                >
                                                    <span className="menu-bullet">
                                                        <span className="bullet bullet-dot"></span>
                                                    </span>
                                                    <span className="menu-title">Add Role</span>
                                                </NavLink>
                                            </div>
                                        </div>
                                    </div>

                                    <div
                                        data-kt-menu-trigger="click"
                                        className={`menu-item menu-accordion mb-1 ${isPathActive('/admin/system/admins') ? 'hover show' : ''}`}
                                    >
                                        <span className={`menu-link ${isPathActive('/admin/system/admins') ? 'active' : ''}`}>
                                            <span className="menu-bullet">
                                                <span className="bullet bullet-dot"></span>
                                            </span>
                                            <span className="menu-title">Admins</span>
                                            <span className="menu-arrow"></span>
                                        </span>
                                        <div className={`menu-sub menu-sub-accordion ${isPathActive('/admin/system/admins') ? 'show' : ''}`}>
                                            <div className="menu-item">
                                                <NavLink
                                                    className={`menu-link ${location.pathname === '/admin/system/admins' ? 'active' : ''}`}
                                                    to="/admin/system/admins"
                                                >
                                                    <span className="menu-bullet">
                                                        <span className="bullet bullet-dot"></span>
                                                    </span>
                                                    <span className="menu-title">Admin List</span>
                                                </NavLink>
                                            </div>
                                            <div className="menu-item">
                                                <NavLink
                                                    className={`menu-link ${location.pathname === '/admin/system/admins/create' ? 'active' : ''}`}
                                                    to="/admin/system/admins/create"
                                                >
                                                    <span className="menu-bullet">
                                                        <span className="bullet bullet-dot"></span>
                                                    </span>
                                                    <span className="menu-title">Add Admin</span>
                                                </NavLink>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="menu-item">
                                        <NavLink
                                            className={`menu-link ${isPathActive('/admin/settings/system-configuration') ? 'active' : ''}`}
                                            to="/admin/settings/system-configuration"
                                        >
                                            <span className="menu-bullet">
                                                <span className="bullet bullet-dot"></span>
                                            </span>
                                            <span className="menu-title">System Configuration</span>
                                        </NavLink>
                                    </div>

                                    <div
                                        data-kt-menu-trigger="click"
                                        className={`menu-item menu-accordion mb-1 ${isCategoriesManagementRoute ? 'hover show' : ''}`}
                                    >
                                        <span className={`menu-link ${isCategoriesManagementRoute ? 'active' : ''}`}>
                                            <span className="menu-bullet">
                                                <span className="bullet bullet-dot"></span>
                                            </span>
                                            <span className="menu-title">Categories Management</span>
                                            <span className="menu-arrow"></span>
                                        </span>
                                        <div className={`menu-sub menu-sub-accordion ${isCategoriesManagementRoute ? 'show' : ''}`}>
                                            <div className="menu-item">
                                                <NavLink
                                                    className={`menu-link ${
                                                        location.pathname === '/admin/service/category/type/service' ? 'active' : ''
                                                    }`}
                                                    to="/admin/service/category/type/service"
                                                >
                                                    <span className="menu-bullet">
                                                        <span className="bullet bullet-dot"></span>
                                                    </span>
                                                    <span className="menu-title">Service categories</span>
                                                </NavLink>
                                            </div>
                                            <div className="menu-item">
                                                <NavLink
                                                    className={`menu-link ${
                                                        location.pathname === '/admin/service/category/type/partner' ? 'active' : ''
                                                    }`}
                                                    to="/admin/service/category/type/partner"
                                                >
                                                    <span className="menu-bullet">
                                                        <span className="bullet bullet-dot"></span>
                                                    </span>
                                                    <span className="menu-title">Partner categories</span>
                                                </NavLink>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="menu-item">
                                        <NavLink
                                            className={`menu-link ${isPathActive('/admin/service/sub-categories') ? 'active' : ''}`}
                                            to="/admin/service/sub-categories"
                                        >
                                            <span className="menu-bullet">
                                                <span className="bullet bullet-dot"></span>
                                            </span>
                                            <span className="menu-title">Sub-Categories Management</span>
                                        </NavLink>
                                    </div>

                                    {canViewCountries && (
                                        <div className="menu-item">
                                            <NavLink
                                                className={`menu-link ${isPathActive('/admin/service/country') ? 'active' : ''}`}
                                                to="/admin/service/country"
                                            >
                                                <span className="menu-bullet">
                                                    <span className="bullet bullet-dot"></span>
                                                </span>
                                                <span className="menu-title">Country Management</span>
                                            </NavLink>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminSidebar;

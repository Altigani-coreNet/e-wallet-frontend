import React, { useEffect, useState, useCallback } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import axios from 'axios';
import { ADMIN_ENDPOINTS } from '../../../utils/constants';
import { getToken } from '../../../utils/api';
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

    const isActive = (path, options = {}) => isPathActive(path, options);
    const [pendingCounts, setPendingCounts] = useState({ merchant: 0, branch: 0 });

    const fetchPendingCounts = useCallback(async () => {
        try {
            const token = getToken();
            const response = await axios.get(ADMIN_ENDPOINTS.CHANGE_REQUEST_STATISTICS, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            const success = response.data?.status ?? response.data?.success ?? false;
            if (success) {
                const pending = response.data?.data?.pending ?? {};
                setPendingCounts({
                    merchant: pending.merchant ?? 0,
                    branch: pending.branch ?? 0,
                });
            }
        } catch (error) {
            console.error('Failed to load change request counts', error);
        }
    }, []);

    
    // Permission checks (admin uses same permission keys as merchant POS/Sales)
    const canViewDashboard = useCan('pos.dashboard.view_dashboard');

    // Merchant Management (POS)
    const canViewMerchants = useCan('pos.merchants.view_merchants');
    const canCreateMerchant = useCan('pos.merchants.create_merchants');
    const canViewMerchantChangeRequests = useCan('pos.merchants.view_merchant_change_requests');
    const canViewBranches = useCan('pos.branches.view_branches');
    const canCreateBranch = useCan('pos.branches.create_branches');
    const canViewUsers = useCan('pos.users.view_users');
    const canCreateUser = useCan('pos.users.create_users');
    const canViewUserGroups = useCan(['pos.user_groups.view_users_groups', 'view_users_groups']);
    const canCreateUserGroup = useCan(['pos.user_groups.create_users_groups', 'create_users_groups']);
    const canViewRoles = useCan('pos.roles.view_roles');
    const canCreateRole = useCan('pos.roles.create_roles');
    const canViewCustomers = useCan(['sales.customers.view_customers', 'view_customers']);
    const canCreateCustomer = useCan(['sales.customers.create_customers', 'create_customers']);

    // Terminal Management
    const canViewTerminals = useCan('pos.terminals.view_terminals');
    const canCreateTerminal = useCan('pos.terminals.create_terminals');
    const canViewTerminalGroups = useCan('pos.terminal_groups.view_terminal_assignments');
    const canCreateTerminalGroup = useCan('pos.terminal_groups.assign_terminals');

    // const canViewDashboard = useCan('pos.dashboard.view_dashboard');
    const canViewTransactions = useCan('pos.transactions.view_transactions');
    const canViewRefunded = useCan('pos.transactions.refund_transactions');
    const canViewVoided = useCan('pos.transactions.void_transactions');
    const canViewBatches = useCan('pos.batches.view_batches');
    const canViewSettlements = useCan('pos.settlements.view_settlements');
    const canViewPaymentLinks = useCan('pos.payment_links.view_payment_links');
    // const canViewCountries = useCan('pos.countries.view_countries');
    const totalPending = pendingCounts.merchant + pendingCounts.branch;
     // System Administration
     const canViewAdmins = useCan('pos.admins.view_admins');
     const canCreateAdmin = useCan('pos.admins.create_admins');
     const canViewCountries = useCan('pos.countries.view_countries');
     const canCreateCountry = useCan('pos.countries.create_countries');
     const canViewCities = useCan('pos.cities.view_cities');
     const canCreateCity = useCan('pos.cities.create_cities');
     const canViewAdvertisements = useCan('pos.advertisements.view_advertisements');
     const canCreateAdvertisement = useCan('pos.advertisements.create_advertisements');
     const canViewServiceFees = useCan(['pos.service_fees.view_service_fees', 'view_services_fees']);
     const canViewCurrencies = useCan('pos.currencies.view_currencies');
     const canCreateCurrency = useCan('pos.currencies.create_currencies');
     const canViewContractTerms = useCan(['pos.contract_terms.view_contract_terms', 'view_contract_terms']);
 

    useEffect(() => {
        fetchPendingCounts();
        const interval = setInterval(fetchPendingCounts, 60000);
        return () => clearInterval(interval);
    }, [fetchPendingCounts]);

    useEffect(() => {
        if (
            location.pathname.startsWith('/admin/merchants') ||
            location.pathname.startsWith('/admin/branches') ||
            location.pathname.startsWith('/admin/merchants/change-requests')
        ) {
            fetchPendingCounts();
        }
    }, [location.pathname, fetchPendingCounts]);

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
        location.pathname.startsWith('/admin/service-products/') ||
        location.pathname === '/admin/service-transactions' ||
        location.pathname.startsWith('/admin/service-transactions/');

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

    const isSettingsConfigurationRoute =
        isPathActive('/admin/service/country') ||
        isPathActive('/admin/settings/currencies') ||
        isPathActive('/admin/settings/service-fees') ||
        isPathActive('/admin/settings/contract-terms');

    const isNotificationsListRoute = isPathActive('/admin/system/notifications', { exact: true });
    const isNotificationsCreateRoute = isPathActive('/admin/system/notifications/create', { exact: true });

    const isCountriesListRoute = isPathActive('/admin/system/countries', { exact: true });
    const isCountriesCreateRoute = isPathActive('/admin/system/countries/create', { exact: true });

    const isCitiesListRoute = isPathActive('/admin/system/cities', { exact: true });
    const isCitiesCreateRoute = isPathActive('/admin/system/cities/create', { exact: true });

    const isSettingsAccordionActive =
        isPathActive('/admin/system') ||
        isSettingsServiceRoute ||
        isSettingsEPaymentGatewayRoute ||
        isSettingsConfigurationRoute;

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

<div className="menu-item pt-1">
                                <div className="menu-content">
                                    <span className="menu-heading fw-bold text-uppercase fs-7">Merchant & Partner </span>
                                </div>
                            </div>
 {/* Merchant Management */}
 {(canViewMerchants || canViewBranches || canViewUsers || canViewUserGroups || canViewRoles || canViewCustomers) && (<div data-kt-menu-trigger="click" className={`menu-item menu-accordion ${isActive('/admin/merchants') || isActive('/admin/branches') || isActive('/admin/users') || isActive('/admin/customers') ? 'hover show' : ''}`}>
                                <span className={`menu-link ${isActive('/admin/merchants') || isActive('/admin/branches') || isActive('/admin/users') || isActive('/admin/customers') ? 'active' : ''}`}>
                                    <span className="menu-icon">
                                        <i className="ki-duotone ki-abstract-28 fs-2">
                                            <span className="path1"></span>
                                            <span className="path2"></span>
                                        </i>
                                    </span>
                                    <span className="menu-title">Merchant Management</span>
                                    <span className="menu-arrow"></span>
                                </span>


                                <div className={`menu-sub menu-sub-accordion ${isActive('/admin/merchants') || isActive('/admin/branches') || isActive('/admin/users') || isActive('/admin/customers') ? 'show' : ''}`}>
                                    
                                    
                                    {/* Merchants Sub-menu */}
                                    {canViewMerchants && (<div data-kt-menu-trigger="click" className={`menu-item menu-accordion mb-1 ${isActive('/admin/merchants') ? 'hover show' : ''}`}>
                                        <span className={`menu-link ${isActive('/admin/merchants') ? 'active' : ''}`}>
                                            <span className="menu-bullet">
                                                <span className="bullet bullet-dot"></span>
                                            </span>
                                            <span className="menu-title">Merchants</span>
                                            {pendingCounts.merchant > 0 && (
                                                <span className="badge badge-light-warning ms-2">{pendingCounts.merchant}</span>
                                            )}
                                            <span className="menu-arrow"></span>
                                        </span>
                                        <div className={`menu-sub menu-sub-accordion ${isActive('/admin/merchants') ? 'show' : ''}`}>
                                            <div className="menu-item">
                                                <NavLink
                                                    className={({ isActive }) => `menu-link ${isActive ? 'active' : ''}`}
                                                    to="/admin/merchants"
                                                    end
                                                >
                                                    <span className="menu-bullet">
                                                        <span className="bullet bullet-dot"></span>
                                                    </span>
                                                    <span className="menu-title">Merchant List</span>
                                                </NavLink>
                                            </div>
                                           
                                            {canViewMerchantChangeRequests && (<div className="menu-item">
                                                <NavLink
                                                    className={({ isActive }) => `menu-link ${isActive ? 'active' : ''}`}
                                                    to="/admin/merchants/change-requests"
                                                >
                                                    <span className="menu-bullet">
                                                        <span className="bullet bullet-dot"></span>
                                                    </span>
                                                    <span className="menu-title">Change Request History</span>
                                                    {totalPending > 0 && (
                                                        <span className="badge badge-light-warning ms-2">{totalPending}</span>
                                                    )}
                                                </NavLink>
                                            </div>)}
                                            {canCreateMerchant && (<div className="menu-item">
                                                <NavLink className={`menu-link ${location.pathname === '/admin/merchants/create' ? 'active' : ''}`} to="/admin/merchants/create">
                                                    <span className="menu-bullet">
                                                        <span className="bullet bullet-dot"></span>
                                                    </span>
                                                    <span className="menu-title">Add Merchant</span>
                                                </NavLink>
                                            </div>)}
                                        </div>
                                    </div>)}

                                    {/* Branches Sub-menu */}
                                    {canViewBranches && (<div data-kt-menu-trigger="click" className={`menu-item menu-accordion mb-1 ${isActive('/admin/branches') ? 'hover show' : ''}`}>
                                        <span className={`menu-link ${isActive('/admin/branches') ? 'active' : ''}`}>
                                            <span className="menu-bullet">
                                                <span className="bullet bullet-dot"></span>
                                            </span>
                                            <span className="menu-title">Branches</span>
                                            {pendingCounts.branch > 0 && (
                                                <span className="badge badge-light-warning ms-2">{pendingCounts.branch}</span>
                                            )}
                                            <span className="menu-arrow"></span>
                                        </span>
                                        <div className={`menu-sub menu-sub-accordion ${isActive('/admin/branches') ? 'show' : ''}`}>
                                            <div className="menu-item">
                                                <NavLink
                                                    className={({ isActive }) => `menu-link ${isActive ? 'active' : ''}`}
                                                    to="/admin/branches"
                                                    end
                                                >
                                                    <span className="menu-bullet">
                                                        <span className="bullet bullet-dot"></span>
                                                    </span>
                                                    <span className="menu-title">Branch List</span>
                                                </NavLink>
                                            </div>
                                            {canCreateBranch && (<div className="menu-item">
                                                <NavLink className={`menu-link ${location.pathname === '/admin/branches/create' ? 'active' : ''}`} to="/admin/branches/create">
                                                    <span className="menu-bullet">
                                                        <span className="bullet bullet-dot"></span>
                                                    </span>
                                                    <span className="menu-title">Add Branch</span>
                                                </NavLink>
                                            </div>)}
                                        </div>
                                    </div>)}

                                    {/* Users Sub-menu */}
                                    {(canViewUsers || canViewUserGroups) && (<div data-kt-menu-trigger="click" className={`menu-item menu-accordion mb-1 ${isActive('/admin/users') || isActive('/admin/user-groups') ? 'hover show' : ''}`}>
                                        <span className={`menu-link ${isActive('/admin/users') || isActive('/admin/user-groups') ? 'active' : ''}`}>
                                            <span className="menu-bullet">
                                                <span className="bullet bullet-dot"></span>
                                            </span>
                                            <span className="menu-title">Merchant Users</span>
                                            <span className="menu-arrow"></span>
                                        </span>
                                        <div className={`menu-sub menu-sub-accordion ${isActive('/admin/users') || isActive('/admin/user-groups') ? 'show' : ''}`}>
                                            {canViewUsers && (<div className="menu-item">
                                                <NavLink 
                                                    className={({ isActive }) => `menu-link ${isActive ? 'active' : ''}`}
                                                    to="/admin/users"
                                                    end
                                                >
                                                    <span className="menu-bullet">
                                                        <span className="bullet bullet-dot"></span>
                                                    </span>
                                                    <span className="menu-title">User List</span>
                                                </NavLink>
                                            </div>)}
                                            {canCreateUser && (<div className="menu-item">
                                                <NavLink 
                                                    className={({ isActive }) => `menu-link ${isActive ? 'active' : ''}`}
                                                    to="/admin/users/create"
                                                >
                                                    <span className="menu-bullet">
                                                        <span className="bullet bullet-dot"></span>
                                                    </span>
                                                    <span className="menu-title">Add User</span>
                                                </NavLink>
                                            </div>)}
                                            {canViewUserGroups && (<div className="menu-item">
                                                <NavLink 
                                                    className={({ isActive }) => `menu-link ${isActive ? 'active' : ''}`}
                                                    to="/admin/user-groups"
                                                    end
                                                >
                                                    <span className="menu-bullet">
                                                        <span className="bullet bullet-dot"></span>
                                                    </span>
                                                    <span className="menu-title">User Groups</span>
                                                </NavLink>
                                            </div>)}
                                            {canCreateUserGroup && (<div className="menu-item">
                                                <NavLink 
                                                    className={({ isActive }) => `menu-link ${isActive ? 'active' : ''}`}
                                                    to="/admin/user-groups/create"
                                                >
                                                    <span className="menu-bullet">
                                                        <span className="bullet bullet-dot"></span>
                                                    </span>
                                                    <span className="menu-title">Add User Group</span>
                                                </NavLink>
                                            </div>)}
                                        </div>
                                    </div>)}

                                   
                                </div>
                            </div>)}

                            
                            {/* Terminal Management */}
                            {(canViewTerminals || canViewTerminalGroups) && (<div data-kt-menu-trigger="click" className={`menu-item menu-accordion ${isActive('/admin/terminals') || isActive('/admin/terminal-groups') ? 'hover show' : ''}`}>
                                <span className={`menu-link ${isActive('/admin/terminals') || isActive('/admin/terminal-groups') ? 'active' : ''}`}>
                                    <span className="menu-icon">
                                        <i className="ki-duotone ki-phone fs-2">
                                            <span className="path1"></span>
                                            <span className="path2"></span>
                                        </i>
                                    </span>
                                    <span className="menu-title">Terminal Management</span>
                                    <span className="menu-arrow"></span>
                                </span>

                                <div className={`menu-sub menu-sub-accordion ${isActive('/admin/terminals') || isActive('/admin/terminal-groups') ? 'show' : ''}`}>
                                    {/* Terminals Sub-menu */}
                                    {canViewTerminals && (<div data-kt-menu-trigger="click" className={`menu-item menu-accordion mb-1 ${isActive('/admin/terminals') && !isActive('/admin/terminal-groups') ? 'hover show' : ''}`}>
                                        <span className={`menu-link ${isActive('/admin/terminals') && !isActive('/admin/terminal-groups') ? 'active' : ''}`}>
                                            <span className="menu-bullet">
                                                <span className="bullet bullet-dot"></span>
                                            </span>
                                            <span className="menu-title">Terminals</span>
                                            <span className="menu-arrow"></span>
                                        </span>
                                        <div className={`menu-sub menu-sub-accordion ${isActive('/admin/terminals') && !isActive('/admin/terminal-groups') ? 'show' : ''}`}>
                                            <div className="menu-item">
                                                <NavLink className={`menu-link ${location.pathname === '/admin/terminals' ? 'active' : ''}`} to="/admin/terminals">
                                                    <span className="menu-bullet">
                                                        <span className="bullet bullet-dot"></span>
                                                    </span>
                                                    <span className="menu-title">Terminal List</span>
                                                </NavLink>
                                            </div>
                                            {canCreateTerminal && (<div className="menu-item">
                                                <NavLink className={`menu-link ${location.pathname === '/admin/terminals/create' ? 'active' : ''}`} to="/admin/terminals/create">
                                                    <span className="menu-bullet">
                                                        <span className="bullet bullet-dot"></span>
                                                    </span>
                                                    <span className="menu-title">Add Terminal</span>
                                                </NavLink>
                                            </div>)}
                                        </div>
                                    </div>)}

                                    {/* Terminal Groups Sub-menu */}
                                    {canViewTerminalGroups && (<div data-kt-menu-trigger="click" className={`menu-item menu-accordion mb-1 ${isActive('/admin/terminal-groups') ? 'hover show' : ''}`}>
                                        <span className={`menu-link ${isActive('/admin/terminal-groups') ? 'active' : ''}`}>
                                            <span className="menu-bullet">
                                                <span className="bullet bullet-dot"></span>
                                            </span>
                                            <span className="menu-title">Terminal Groups</span>
                                            <span className="menu-arrow"></span>
                                        </span>
                                        <div className={`menu-sub menu-sub-accordion ${isActive('/admin/terminal-groups') ? 'show' : ''}`}>
                                            <div className="menu-item">
                                                <NavLink className={`menu-link ${location.pathname === '/admin/terminal-groups' ? 'active' : ''}`} to="/admin/terminal-groups">
                                                    <span className="menu-bullet">
                                                        <span className="bullet bullet-dot"></span>
                                                    </span>
                                                    <span className="menu-title">Group List</span>
                                                </NavLink>
                                            </div>
                                            {canCreateTerminalGroup && (<div className="menu-item">
                                                <NavLink className={`menu-link ${location.pathname === '/admin/terminal-groups/create' ? 'active' : ''}`} to="/admin/terminal-groups/create">
                                                    <span className="menu-bullet">
                                                        <span className="bullet bullet-dot"></span>
                                                    </span>
                                                    <span className="menu-title">Add Terminal Group</span>
                                                </NavLink>
                                            </div>)}
                                        </div>
                                    </div>)}
                                </div>
                            </div>)}

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

                            <div className="menu-item pt-5">
                                <div className="menu-content">
                                    <span className="menu-heading fw-bold text-uppercase fs-7">Service</span>
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
                                            className={`menu-link ${isPathActive('/admin/services', { exact: true })  && ! isPathActive('/admin/services/home-config', { exact: true }) ? 'active' : ''}`}
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
                                            className={`menu-link ${isPathActive('/admin/services/home-config', { exact: true }) ? 'active' : ''}`}
                                            to="/admin/services/home-config"
                                        >
                                            <span className="menu-bullet">
                                                <span className="bullet bullet-dot"></span>
                                            </span>
                                            <span className="menu-title">Home Services Config</span>
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
                                    <div className="menu-item">
                                        <NavLink
                                            className={`menu-link ${isPathActive('/admin/service-transactions', { exact: true }) ? 'active' : ''}`}
                                            to="/admin/service-transactions"
                                        >
                                            <span className="menu-bullet">
                                                <span className="bullet bullet-dot"></span>
                                            </span>
                                            <span className="menu-title">Service History</span>
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
                                    

                                    {/* Advertisements Sub-menu */}
                                    {canViewAdvertisements && (<div data-kt-menu-trigger="click" className={`menu-item menu-accordion mb-1 ${isActive('/admin/system/advertisements') ? 'hover show' : ''}`}>
                                        <span className={`menu-link ${isActive('/admin/system/advertisements') ? 'active' : ''}`}>
                                            <span className="menu-bullet">
                                                <span className="bullet bullet-dot"></span>
                                            </span>
                                            <span className="menu-title">Advertisements</span>
                                            <span className="menu-arrow"></span>
                                        </span>
                                        <div className={`menu-sub menu-sub-accordion ${isActive('/admin/system/advertisements') ? 'show' : ''}`}>
                                            <div className="menu-item">
                                                <NavLink className={`menu-link ${location.pathname === '/admin/system/advertisements' ? 'active' : ''}`} to="/admin/system/advertisements">
                                                    <span className="menu-bullet">
                                                        <span className="bullet bullet-dot"></span>
                                                    </span>
                                                    <span className="menu-title">Advertisement List</span>
                                                </NavLink>
                                            </div>
                                            {canCreateAdvertisement && (<div className="menu-item">
                                                <NavLink className={`menu-link ${location.pathname === '/admin/system/advertisements/create' ? 'active' : ''}`} to="/admin/system/advertisements/create">
                                                    <span className="menu-bullet">
                                                        <span className="bullet bullet-dot"></span>
                                                    </span>
                                                    <span className="menu-title">Add Advertisement</span>
                                                </NavLink>
                                            </div>)}
                                        </div>
                                    </div>)}

                                    {/* Notifications Sub-menu */}
                                    {canViewAdvertisements && (<div data-kt-menu-trigger="click" className={`menu-item menu-accordion mb-1 ${isActive('/admin/system/notifications') ? 'hover show' : ''}`}>
                                        <span className={`menu-link ${isNotificationsListRoute ? 'active' : ''}`}>
                                            <span className="menu-bullet">
                                                <span className="bullet bullet-dot"></span>
                                            </span>
                                            <span className="menu-title">Notifications</span>
                                            <span className="menu-arrow"></span>
                                        </span>
                                        <div className={`menu-sub menu-sub-accordion ${isActive('/admin/system/notifications') ? 'show' : ''}`}>
                                            <div className="menu-item">
                                                <NavLink className={`menu-link ${isNotificationsListRoute ? 'active' : ''}`} to="/admin/system/notifications">
                                                    <span className="menu-bullet">
                                                        <span className="bullet bullet-dot"></span>
                                                    </span>
                                                    <span className="menu-title">Notification List</span>
                                                </NavLink>
                                            </div>
                                            {canCreateAdvertisement && (<div className="menu-item">
                                                <NavLink className={`menu-link ${isNotificationsCreateRoute ? 'active' : ''}`} to="/admin/system/notifications/create">
                                                    <span className="menu-bullet">
                                                        <span className="bullet bullet-dot"></span>
                                                    </span>
                                                    <span className="menu-title">Add Notification</span>
                                                </NavLink>
                                            </div>)}
                                        </div>
                                    </div>)}

                                    {(canViewCountries || canViewCurrencies || canViewServiceFees || canViewContractTerms) && (
                                        <div
                                            data-kt-menu-trigger="click"
                                            className={`menu-item menu-accordion mb-1 ${isSettingsConfigurationRoute ? 'hover show' : ''}`}
                                        >
                                            <span className={`menu-link ${isSettingsConfigurationRoute ? 'active' : ''}`}>
                                                <span className="menu-bullet">
                                                    <span className="bullet bullet-dot"></span>
                                                </span>
                                                <span className="menu-title">Configurations</span>
                                                <span className="menu-arrow"></span>
                                            </span>
                                            <div className={`menu-sub menu-sub-accordion ${isSettingsConfigurationRoute ? 'show' : ''}`}>
                                               
                                                {/* Countries Sub-menu */}
                                     {canViewCountries && (<div data-kt-menu-trigger="click" className={`menu-item menu-accordion mb-1 ${isActive('/admin/system/countries') ? 'hover show' : ''}`}>
                                        <span className={`menu-link ${isCountriesListRoute ? 'active' : ''}`}>
                                            <span className="menu-bullet">
                                                <span className="bullet bullet-dot"></span>
                                            </span>
                                            <span className="menu-title">Countries</span>
                                            <span className="menu-arrow"></span>
                                        </span>
                                        <div className={`menu-sub menu-sub-accordion ${isActive('/admin/system/countries') ? 'show' : ''}`}>
                                            <div className="menu-item">
                                                <NavLink className={`menu-link ${isCountriesListRoute ? 'active' : ''}`} to="/admin/system/countries">
                                                    <span className="menu-bullet">
                                                        <span className="bullet bullet-dot"></span>
                                                    </span>
                                                    <span className="menu-title">Country List</span>
                                                </NavLink>
                                            </div>
                                            {canCreateCountry && (<div className="menu-item">
                                                <NavLink className={`menu-link ${isCountriesCreateRoute ? 'active' : ''}`} to="/admin/system/countries/create">
                                                    <span className="menu-bullet">
                                                        <span className="bullet bullet-dot"></span>
                                                    </span>
                                                    <span className="menu-title">Add Country</span>
                                                </NavLink>
                                            </div>)}
                                        </div>
                                    </div>)}

                                    {/* Cities Sub-menu */}
                                    {canViewCities && (<div data-kt-menu-trigger="click" className={`menu-item menu-accordion mb-1 ${isActive('/admin/system/cities') ? 'hover show' : ''}`}>
                                        <span className={`menu-link ${isCitiesListRoute ? 'active' : ''}`}>
                                            <span className="menu-bullet">
                                                <span className="bullet bullet-dot"></span>
                                            </span>
                                            <span className="menu-title">Cities</span>
                                            <span className="menu-arrow"></span>
                                        </span>
                                        <div className={`menu-sub menu-sub-accordion ${isActive('/admin/system/cities') ? 'show' : ''}`}>
                                            <div className="menu-item">
                                                <NavLink className={`menu-link ${isCitiesListRoute ? 'active' : ''}`} to="/admin/system/cities">
                                                    <span className="menu-bullet">
                                                        <span className="bullet bullet-dot"></span>
                                                    </span>
                                                    <span className="menu-title">City List</span>
                                                </NavLink>
                                            </div>
                                            {canCreateCity && (<div className="menu-item">
                                                <NavLink className={`menu-link ${isCitiesCreateRoute ? 'active' : ''}`} to="/admin/system/cities/create">
                                                    <span className="menu-bullet">
                                                        <span className="bullet bullet-dot"></span>
                                                    </span>
                                                    <span className="menu-title">Add City</span>
                                                </NavLink>
                                            </div>)}
                                        </div>
                                    </div>)}
                                    

                                                {canViewCurrencies && (
                                                    <div className="menu-item">
                                                        <NavLink
                                                            className={`menu-link ${isPathActive('/admin/settings/currencies') ? 'active' : ''}`}
                                                            to="/admin/settings/currencies"
                                                        >
                                                            <span className="menu-bullet">
                                                                <span className="bullet bullet-dot"></span>
                                                            </span>
                                                            <span className="menu-title">Currencies</span>
                                                        </NavLink>
                                                    </div>
                                                )}

                                                {canViewServiceFees && (
                                                    <div className="menu-item">
                                                        <NavLink
                                                            className={`menu-link ${isPathActive('/admin/settings/service-fees') ? 'active' : ''}`}
                                                            to="/admin/settings/service-fees"
                                                        >
                                                            <span className="menu-bullet">
                                                                <span className="bullet bullet-dot"></span>
                                                            </span>
                                                            <span className="menu-title">Service Fees</span>
                                                        </NavLink>
                                                    </div>
                                                )}

                                                {canViewContractTerms && (
                                                    <div className="menu-item">
                                                        <NavLink
                                                            className={`menu-link ${isPathActive('/admin/settings/contract-terms') ? 'active' : ''}`}
                                                            to="/admin/settings/contract-terms"
                                                        >
                                                            <span className="menu-bullet">
                                                                <span className="bullet bullet-dot"></span>
                                                            </span>
                                                            <span className="menu-title">Contract Terms</span>
                                                        </NavLink>
                                                    </div>
                                                )}
                                            </div>
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

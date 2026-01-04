import React, { useEffect, useState, useCallback } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import axios from 'axios';
import { ADMIN_ENDPOINTS } from '../../../utils/constants';
import { getToken } from '../../../utils/api';
import { useCan } from '../../../utils/permissions';

const AdminSidebar = () => {
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const currentTransactionType = (searchParams.get('type') || '').toLowerCase();
    const isTransactionsRoute = location.pathname === '/admin/transactions';
    const isTransactionsListActive = isTransactionsRoute && !currentTransactionType;
    const isTransactionsRefundActive = isTransactionsRoute && currentTransactionType === 'refund';
    const isTransactionsVoidActive = isTransactionsRoute && (currentTransactionType === 'void' || currentTransactionType === 'voided');
    const [pendingCounts, setPendingCounts] = useState({ merchant: 0, branch: 0 });

    const isActive = (path, { exact = false } = {}) => {
        if (exact) {
            return location.pathname === path;
        }

        if (location.pathname === path) {
            return true;
        }

        return location.pathname.startsWith(`${path}/`);
    };

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

    const totalPending = pendingCounts.merchant + pendingCounts.branch;

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

    // Terminal Management
    const canViewTerminals = useCan('pos.terminals.view_terminals');
    const canCreateTerminal = useCan('pos.terminals.create_terminals');
    const canViewTerminalGroups = useCan('pos.terminal_groups.view_terminal_assignments');
    const canCreateTerminalGroup = useCan('pos.terminal_groups.assign_terminals');

    // Payments
    const canViewTransactions = useCan('pos.transactions.view_transactions');
    const canViewRefunded = useCan('pos.transactions.refund_transactions');
    const canViewVoided = useCan('pos.transactions.void_transactions');
    const canViewBatches = useCan('pos.batches.view_batches');
    const canViewSettlements = useCan('pos.settlements.view_settlements');
    const canViewPaymentLinks = useCan('pos.payment_links.view_payment_links');

    // Sales
    const canViewTags = useCan('sales.tags.view_tags');
    const canViewTaxes = useCan('sales.taxes.view_taxes');
    const canViewCategories = useCan('sales.categories.view_categories');
    const canViewBrands = useCan('sales.brands.view_brands');
    const canViewUnits = useCan('sales.units.view_units');
    const canViewProducts = useCan('sales.products.view_products');
    const canViewWarehouses = useCan('sales.warehouse.view_warehouse');
    const canViewSalesList = useCan('sales.sales.view_sales');
    const canViewDrafts = useCan('sales.orders.view_orders');
    const canViewReturns = useCan('sales.sales.return_sales');
    const canViewPurchases = useCan('sales.purchases.view_purchases');
    const canViewSalesReports = useCan('sales.reports.view_sales_reports');
    const canViewPurchaseReports = useCan('sales.reports.view_inventory_reports');
    const canViewProductsReports = useCan('sales.reports.view_product_reports');

    // Customers
    const canViewCustomers = useCan(['sales.customers.view_customers', 'view_customers']);
    const canCreateCustomer = useCan(['sales.customers.create_customers', 'create_customers']);

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

    // Close mobile sidebar when route changes
    useEffect(() => {
        const sidebar = document.getElementById('kt_app_sidebar');
        const overlay = document.querySelector('.drawer-overlay');
        
        if (sidebar && window.innerWidth < 992) { // Only on mobile/tablet
            sidebar.classList.remove('drawer-on');
            document.body.removeAttribute('data-kt-drawer');
            if (overlay) overlay.style.display = 'none';
        }
    }, [location.pathname]);

    return (
        <div id="kt_app_sidebar" 
             className="app-sidebar flex-column" 
             data-kt-drawer="true" 
             data-kt-drawer-name="app-sidebar" 
             data-kt-drawer-activate="{default: true, lg: false}" 
             data-kt-drawer-overlay="true" 
             data-kt-drawer-width="225px" 
             data-kt-drawer-direction="start" 
             data-kt-drawer-toggle="#kt_app_sidebar_mobile_toggle">
            {/* Begin::Logo */}
            <div className="app-sidebar-logo px-6" id="kt_app_sidebar_logo">
                <NavLink to="/admin/dashboard">
                    <img alt="Fastpay Logo" src="/faspay_logo.png" className="h-35px app-sidebar-logo-default" />
                    <img alt="Fastpay Logo" src="/small_logo.png" className="h-30px app-sidebar-logo-minimize" />
                </NavLink>
                
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

            {/* Begin::sidebar menu */}
            <div className="app-sidebar-menu overflow-hidden flex-column-fluid">
                <div id="kt_app_sidebar_menu_wrapper" className="app-sidebar-wrapper">
                    <div id="kt_app_sidebar_menu_scroll" 
                         className="scroll-y my-5 mx-3" 
                         data-kt-scroll="true" 
                         data-kt-scroll-activate="true" 
                         data-kt-scroll-height="auto" 
                         data-kt-scroll-dependencies="#kt_app_sidebar_logo, #kt_app_sidebar_footer" 
                         data-kt-scroll-wrappers="#kt_app_sidebar_menu" 
                         data-kt-scroll-offset="5px" 
                         data-kt-scroll-save-state="true">
                        
                        <div className="menu menu-column menu-rounded menu-sub-indention fw-semibold fs-6" 
                             id="#kt_app_sidebar_menu" 
                             data-kt-menu="true" 
                             data-kt-menu-expand="false">
                            
                            {/* Main Menu */}
                            <div className="menu-item pt-5">
                                <div className="menu-content">
                                    <span className="menu-heading fw-bold text-uppercase fs-7">Main Menu</span>
                                </div>
                            </div>

                            {/* Dashboard */}
                            {canViewDashboard && (<div className="menu-item">
                                <NavLink className={`menu-link ${isActive('/admin/dashboard') ? 'active' : ''}`} to="/admin/dashboard">
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
                            </div>)}

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

                                    {/* Customers Sub-menu */}
                                    {canViewCustomers && (<div data-kt-menu-trigger="click" className={`menu-item menu-accordion mb-1 ${isActive('/admin/customers') ? 'hover show' : ''}`}>
                                        <span className={`menu-link ${isActive('/admin/customers') ? 'active' : ''}`}>
                                            <span className="menu-bullet">
                                                <span className="bullet bullet-dot"></span>
                                            </span>
                                            <span className="menu-title">Customers</span>
                                            <span className="menu-arrow"></span>
                                        </span>
                                        <div className={`menu-sub menu-sub-accordion ${isActive('/admin/customers') ? 'show' : ''}`}>
                                            <div className="menu-item">
                                                <NavLink 
                                                    className={({ isActive }) => `menu-link ${isActive ? 'active' : ''}`}
                                                    to="/admin/customers"
                                                    end
                                                >
                                                    <span className="menu-bullet">
                                                        <span className="bullet bullet-dot"></span>
                                                    </span>
                                                    <span className="menu-title">Customer List</span>
                                                </NavLink>
                                            </div>
                                            {canCreateCustomer && (<div className="menu-item">
                                                <NavLink 
                                                    className={({ isActive }) => `menu-link ${isActive ? 'active' : ''}`}
                                                    to="/admin/customers/create"
                                                >
                                                    <span className="menu-bullet">
                                                        <span className="bullet bullet-dot"></span>
                                                    </span>
                                                    <span className="menu-title">Add Customer</span>
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

                            {/* Payments Section Separator */}
                            {(canViewTransactions || canViewSettlements || canViewBatches) && (<div className="menu-item pt-5">
                                <div className="menu-content">
                                    <span className="menu-heading fw-bold text-uppercase fs-7">Payments</span>
                                </div>
                            </div>)}

                            {/* Payments */}
                            {(canViewTransactions || canViewSettlements || canViewBatches) && (<div data-kt-menu-trigger="click" className={`menu-item menu-accordion ${isActive('/admin/transactions') || isActive('/admin/settlements') ? 'hover show' : ''}`}>
                                <span className={`menu-link ${isActive('/admin/transactions') || isActive('/admin/settlements') ? 'active' : ''}`}>
                                    <span className="menu-icon">
                                        <i className="ki-duotone ki-dollar fs-2">
                                            <span className="path1"></span>
                                            <span className="path2"></span>
                                            <span className="path3"></span>
                                            <span className="path4"></span>
                                        </i>
                                    </span>
                                    <span className="menu-title">Payments</span>
                                    <span className="menu-arrow"></span>
                                </span>

                                <div className={`menu-sub menu-sub-accordion ${isActive('/admin/transactions') || isActive('/admin/settlements') || isActive('/admin/batches') ? 'show' : ''}`}>
                                    {/* All Transactions */}
                                    {canViewTransactions && (<div className="menu-item">
                                        <NavLink 
                                            className={({ isActive }) => `menu-link ${isTransactionsListActive ? 'active' : ''}`}
                                            isActive={() => isTransactionsListActive}
                                            to="/admin/transactions"
                                        >
                                            <span className="menu-bullet">
                                                <span className="bullet bullet-dot"></span>
                                            </span>
                                            <span className="menu-title">Transactions</span>
                                        </NavLink>
                                    </div>)}

                                    {/* Refunded Transactions */}
                                    {canViewRefunded && (<div className="menu-item">
                                        <NavLink 
                                            className={({ isActive }) => `menu-link ${isTransactionsRefundActive ? 'active' : ''}`}
                                            isActive={() => isTransactionsRefundActive}
                                            to="/admin/transactions?type=refund"
                                        >
                                            <span className="menu-bullet">
                                                <span className="bullet bullet-dot"></span>
                                            </span>
                                            <span className="menu-title">Refunded Transactions</span>
                                        </NavLink>
                                    </div>)}

                                    {/* Voided Transactions */}
                                    {canViewVoided && (<div className="menu-item">
                                        <NavLink 
                                            className={({ isActive }) => `menu-link ${isTransactionsVoidActive ? 'active' : ''}`}
                                            isActive={() => isTransactionsVoidActive}
                                            to="/admin/transactions?type=void"
                                        >
                                            <span className="menu-bullet">
                                                <span className="bullet bullet-dot"></span>
                                            </span>
                                            <span className="menu-title">Voided Transactions</span>
                                        </NavLink>
                                    </div>)}

                                    {/* Batches */}
                                    {canViewBatches && (<div className="menu-item">
                                        <NavLink className={`menu-link ${location.pathname === '/admin/batches' ? 'active' : ''}`} to="/admin/batches">
                                            <span className="menu-bullet">
                                                <span className="bullet bullet-dot"></span>
                                            </span>
                                            <span className="menu-title">Batches</span>
                                        </NavLink>
                                    </div>)}

                                    {/* Settlements */}
                                    {canViewSettlements && (<div className="menu-item">
                                        <NavLink className={`menu-link ${location.pathname === '/admin/settlements' ? 'active' : ''}`} to="/admin/settlements">
                                            <span className="menu-bullet">
                                                <span className="bullet bullet-dot"></span>
                                            </span>
                                            <span className="menu-title">Settlements</span>
                                        </NavLink>
                                    </div>)}
                                </div>
                            </div>)}
                            {/* Payment Links */}
                            {canViewPaymentLinks && (<div className="menu-item">
                                <NavLink className={`menu-link ${isActive('/admin/payment-links') ? 'active' : ''}`} to="/admin/payment-links">
                                    <span className="menu-icon">
                                        <i className="ki-duotone ki-link fs-2">
                                            <span className="path1"></span>
                                            <span className="path2"></span>
                                        </i>
                                    </span>
                                    <span className="menu-title">Payment Links</span>
                                </NavLink>
                            </div>)}

                            {/* Sales Section Separator */}
                            {(canViewTags || canViewTaxes || canViewCategories || canViewProducts || canViewWarehouses || canViewSalesList || canViewDrafts || canViewReturns) && (<div className="menu-item pt-5">
                                <div className="menu-content">
                                    <span className="menu-heading fw-bold text-uppercase fs-7">Sales</span>
                                </div>
                            </div>)}

                            {/* Products Management */}
                            {(canViewTags || canViewTaxes || canViewCategories || canViewBrands || canViewUnits || canViewProducts || canViewWarehouses) && (<div data-kt-menu-trigger="click" className={`menu-item menu-accordion ${isActive('/admin/sales/tags') || isActive('/admin/sales/taxes') || isActive('/admin/sales/coupons') || isActive('/admin/sales/categories') || isActive('/admin/sales/brands') || isActive('/admin/sales/units') || isActive('/admin/sales/products') || isActive('/admin/sales/warehouses') ? 'hover show' : ''}`}>
                                <span className={`menu-link ${isActive('/admin/sales/tags') || isActive('/admin/sales/taxes') || isActive('/admin/sales/coupons') || isActive('/admin/sales/categories') || isActive('/admin/sales/brands') || isActive('/admin/sales/units') || isActive('/admin/sales/products') || isActive('/admin/sales/warehouses') ? 'active' : ''}`}>
                                    <span className="menu-icon">
                                        <i className="ki-duotone ki-package fs-2">
                                            <span className="path1"></span>
                                            <span className="path2"></span>
                                            <span className="path3"></span>
                                        </i>
                                    </span>
                                    <span className="menu-title">Products Management</span>
                                    <span className="menu-arrow"></span>
                                </span>

                                <div className={`menu-sub menu-sub-accordion ${isActive('/admin/sales/tags') || isActive('/admin/sales/taxes') || isActive('/admin/sales/coupons') || isActive('/admin/sales/categories') || isActive('/admin/sales/brands') || isActive('/admin/sales/units') || isActive('/admin/sales/products') || isActive('/admin/sales/warehouses') ? 'show' : ''}`}>
                                    {canViewTags && (<div className="menu-item">
                                        <NavLink className={`menu-link ${isActive('/admin/sales/tags') ? 'active' : ''}`} to="/admin/sales/tags">
                                            <span className="menu-bullet"><span className="bullet bullet-dot"></span></span>
                                            <span className="menu-title">Tags</span>
                                        </NavLink>
                                    </div>)}
                                    {canViewTaxes && (<div className="menu-item">
                                        <NavLink className={`menu-link ${isActive('/admin/sales/taxes') ? 'active' : ''}`} to="/admin/sales/taxes">
                                            <span className="menu-bullet"><span className="bullet bullet-dot"></span></span>
                                            <span className="menu-title">Taxes</span>
                                        </NavLink>
                                    </div>)}
                                    <div className="menu-item">
                                        <NavLink className={`menu-link ${isActive('/admin/sales/coupons') ? 'active' : ''}`} to="/admin/sales/coupons">
                                            <span className="menu-bullet"><span className="bullet bullet-dot"></span></span>
                                            <span className="menu-title">Coupons</span>
                                        </NavLink>
                                    </div>
                                    {canViewCategories && (<div className="menu-item">
                                        <NavLink className={`menu-link ${isActive('/admin/sales/categories') ? 'active' : ''}`} to="/admin/sales/categories">
                                            <span className="menu-bullet"><span className="bullet bullet-dot"></span></span>
                                            <span className="menu-title">Categories</span>
                                        </NavLink>
                                    </div>)}
                                    {canViewBrands && (<div className="menu-item">
                                        <NavLink className={`menu-link ${isActive('/admin/sales/brands') ? 'active' : ''}`} to="/admin/sales/brands">
                                            <span className="menu-bullet"><span className="bullet bullet-dot"></span></span>
                                            <span className="menu-title">Brands</span>
                                        </NavLink>
                                    </div>)}
                                    {canViewUnits && (<div className="menu-item">
                                        <NavLink className={`menu-link ${isActive('/admin/sales/units') ? 'active' : ''}`} to="/admin/sales/units">
                                            <span className="menu-bullet"><span className="bullet bullet-dot"></span></span>
                                            <span className="menu-title">Units</span>
                                        </NavLink>
                                    </div>)}
                                    {canViewProducts && (<div className="menu-item">
                                        <NavLink className={`menu-link ${isActive('/admin/sales/products') ? 'active' : ''}`} to="/admin/sales/products">
                                            <span className="menu-bullet"><span className="bullet bullet-dot"></span></span>
                                            <span className="menu-title">Products</span>
                                        </NavLink>
                                    </div>)}
                                    {canViewWarehouses && (<div className="menu-item">
                                        <NavLink className={`menu-link ${isActive('/admin/sales/warehouses') ? 'active' : ''}`} to="/admin/sales/warehouses">
                                            <span className="menu-bullet"><span className="bullet bullet-dot"></span></span>
                                            <span className="menu-title">Warehouses</span>
                                        </NavLink>
                                    </div>)}
                                </div>
                            </div>)}

                            {/* Sales Management */}
                            {(canViewSalesList || canViewDrafts || canViewReturns) && (<div data-kt-menu-trigger="click" className={`menu-item menu-accordion ${isActive('/admin/sales/sales-list') || isActive('/admin/sales/drafts') || isActive('/admin/sales/returns') ? 'hover show' : ''}`}>
                                <span className={`menu-link ${isActive('/admin/sales/sales-list') || isActive('/admin/sales/drafts') || isActive('/admin/sales/returns') ? 'active' : ''}`}>
                                    <span className="menu-icon">
                                        <i className="ki-duotone ki-chart-line-up fs-2">
                                            <span className="path1"></span>
                                            <span className="path2"></span>
                                        </i>
                                    </span>
                                    <span className="menu-title">Sales Management</span>
                                    <span className="menu-arrow"></span>
                                </span>

                                <div className={`menu-sub menu-sub-accordion ${isActive('/admin/sales/sales-list') || isActive('/admin/sales/drafts') || isActive('/admin/sales/returns') ? 'show' : ''}`}>
                                    {canViewSalesList && (<div className="menu-item">
                                        <NavLink className={`menu-link ${isActive('/admin/sales/sales-list') ? 'active' : ''}`} to="/admin/sales/sales-list">
                                            <span className="menu-bullet"><span className="bullet bullet-dot"></span></span>
                                            <span className="menu-title">Sales</span>
                                        </NavLink>
                                    </div>)}
                                    {canViewDrafts && (<div className="menu-item">
                                        <NavLink className={`menu-link ${isActive('/admin/sales/drafts') ? 'active' : ''}`} to="/admin/sales/drafts">
                                            <span className="menu-bullet"><span className="bullet bullet-dot"></span></span>
                                            <span className="menu-title">Drafts</span>
                                        </NavLink>
                                    </div>)}
                                    {canViewReturns && (<div className="menu-item">
                                        <NavLink className={`menu-link ${isActive('/admin/sales/returns') ? 'active' : ''}`} to="/admin/sales/returns">
                                            <span className="menu-bullet"><span className="bullet bullet-dot"></span></span>
                                            <span className="menu-title">Returns</span>
                                        </NavLink>
                                    </div>)}
                                </div>
                            </div>)}

                            {/* Purchase Management */}
                            {canViewPurchases && (<div className="menu-item">
                                <NavLink className={`menu-link ${isActive('/admin/sales/purchases') ? 'active' : ''}`} to="/admin/sales/purchases">
                                    <span className="menu-icon">
                                        <i className="ki-duotone ki-basket fs-2">
                                            <span className="path1"></span>
                                            <span className="path2"></span>
                                            <span className="path3"></span>
                                            <span className="path4"></span>
                                        </i>
                                    </span>
                                    <span className="menu-title">Purchase Management</span>
                                </NavLink>
                            </div>)}

                            {/* Reports */}
                            {(canViewSalesReports || canViewPurchaseReports || canViewProductsReports) && (<div data-kt-menu-trigger="click" className={`menu-item menu-accordion ${isActive('/admin/sales/reports') ? 'hover show' : ''}`}>
                                <span className={`menu-link ${isActive('/admin/sales/reports') ? 'active' : ''}`}>
                                    <span className="menu-icon">
                                        <i className="ki-duotone ki-chart-simple fs-2">
                                            <span className="path1"></span>
                                            <span className="path2"></span>
                                            <span className="path3"></span>
                                            <span className="path4"></span>
                                        </i>
                                    </span>
                                    <span className="menu-title">Reports</span>
                                    <span className="menu-arrow"></span>
                                </span>
                                <div className={`menu-sub menu-sub-accordion ${isActive('/admin/sales/reports') ? 'show' : ''}`}>
                                    {canViewSalesReports && (<div className="menu-item">
                                        <NavLink
                                            className={({ isActive }) => `menu-link ${isActive ? 'active' : ''}`}
                                            to="/admin/sales/reports/sales"
                                        >
                                            <span className="menu-bullet">
                                                <span className="bullet bullet-dot"></span>
                                            </span>
                                            <span className="menu-title">Sales Report</span>
                                        </NavLink>
                                    </div>)}
                                    {canViewPurchaseReports && (<div className="menu-item">
                                        <NavLink
                                            className={({ isActive }) => `menu-link ${isActive ? 'active' : ''}`}
                                            to="/admin/sales/reports/purchases"
                                        >
                                            <span className="menu-bullet">
                                                <span className="bullet bullet-dot"></span>
                                            </span>
                                            <span className="menu-title">Purchase Report</span>
                                        </NavLink>
                                    </div>)}
                                    {canViewProductsReports && (<div className="menu-item">
                                        <NavLink
                                            className={({ isActive }) => `menu-link ${isActive ? 'active' : ''}`}
                                            to="/admin/sales/reports/products"
                                        >
                                            <span className="menu-bullet">
                                                <span className="bullet bullet-dot"></span>
                                            </span>
                                            <span className="menu-title">Products Report</span>
                                        </NavLink>
                                    </div>)}
                                </div>
                            </div>)}

                            {/* System Administration */}
                            {(canViewRoles || canViewAdmins || canViewCountries || canViewCities || canViewAdvertisements || true) && (<div data-kt-menu-trigger="click" className={`menu-item menu-accordion ${isActive('/admin/system') || isActive('/admin/plans') ? 'hover show' : ''}`}>
                                <span className={`menu-link ${isActive('/admin/system') || isActive('/admin/plans') ? 'active' : ''}`}>
                                    <span className="menu-icon">
                                        <i className="ki-duotone ki-setting-2 fs-2">
                                            <span className="path1"></span>
                                            <span className="path2"></span>
                                        </i>
                                    </span>
                                    <span className="menu-title">System Administration</span>
                                    <span className="menu-arrow"></span>
                                </span>

                                <div className={`menu-sub menu-sub-accordion ${isActive('/admin/system') || isActive('/admin/plans') ? 'show' : ''}`}>
                                    
                                    {/* Plans Sub-menu */}
                                    <div data-kt-menu-trigger="click" className={`menu-item menu-accordion mb-1 ${isActive('/admin/plans') ? 'hover show' : ''}`}>
                                        <span className={`menu-link ${isActive('/admin/plans') ? 'active' : ''}`}>
                                            <span className="menu-bullet">
                                                <span className="bullet bullet-dot"></span>
                                            </span>
                                            <span className="menu-title">Plans</span>
                                            <span className="menu-arrow"></span>
                                        </span>
                                        <div className={`menu-sub menu-sub-accordion ${isActive('/admin/plans') ? 'show' : ''}`}>
                                            <div className="menu-item">
                                                <NavLink className={`menu-link ${location.pathname === '/admin/plans' && location.pathname !== '/admin/plans/create' && location.pathname !== '/admin/plans/report' ? 'active' : ''}`} to="/admin/plans">
                                                    <span className="menu-bullet">
                                                        <span className="bullet bullet-dot"></span>
                                                    </span>
                                                    <span className="menu-title">Plan List</span>
                                                </NavLink>
                                            </div>
                                            <div className="menu-item">
                                                <NavLink className={`menu-link ${location.pathname === '/admin/plans/create' ? 'active' : ''}`} to="/admin/plans/create">
                                                    <span className="menu-bullet">
                                                        <span className="bullet bullet-dot"></span>
                                                    </span>
                                                    <span className="menu-title">Add Plan</span>
                                                </NavLink>
                                            </div>
                                            <div className="menu-item">
                                                <NavLink className={`menu-link ${location.pathname === '/admin/plans/report' ? 'active' : ''}`} to="/admin/plans/report">
                                                    <span className="menu-bullet">
                                                        <span className="bullet bullet-dot"></span>
                                                    </span>
                                                    <span className="menu-title">Plans Report</span>
                                                </NavLink>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Roles Sub-menu */}
                                    {canViewRoles && (<div data-kt-menu-trigger="click" className={`menu-item menu-accordion mb-1 ${isActive('/admin/system/roles') ? 'hover show' : ''}`}>
                                        <span className={`menu-link ${isActive('/admin/system/roles') ? 'active' : ''}`}>
                                            <span className="menu-bullet">
                                                <span className="bullet bullet-dot"></span>
                                            </span>
                                            <span className="menu-title">Roles</span>
                                            <span className="menu-arrow"></span>
                                        </span>
                                        <div className={`menu-sub menu-sub-accordion ${isActive('/admin/system/roles') ? 'show' : ''}`}>
                                            <div className="menu-item">
                                                <NavLink className={`menu-link ${location.pathname === '/admin/system/roles' ? 'active' : ''}`} to="/admin/system/roles">
                                                    <span className="menu-bullet">
                                                        <span className="bullet bullet-dot"></span>
                                                    </span>
                                                    <span className="menu-title">Role List</span>
                                                </NavLink>
                                            </div>
                                            {canCreateRole && (<div className="menu-item">
                                                <NavLink className={`menu-link ${location.pathname === '/admin/system/roles/create' ? 'active' : ''}`} to="/admin/system/roles/create">
                                                    <span className="menu-bullet">
                                                        <span className="bullet bullet-dot"></span>
                                                    </span>
                                                    <span className="menu-title">Add Role</span>
                                                </NavLink>
                                            </div>)}
                                        </div>
                                    </div>)}

                                    {/* Admins Sub-menu */}
                                    {canViewAdmins && (<div data-kt-menu-trigger="click" className={`menu-item menu-accordion mb-1 ${isActive('/admin/system/admins') ? 'hover show' : ''}`}>
                                        <span className={`menu-link ${isActive('/admin/system/admins') ? 'active' : ''}`}>
                                            <span className="menu-bullet">
                                                <span className="bullet bullet-dot"></span>
                                            </span>
                                            <span className="menu-title">Admins</span>
                                            <span className="menu-arrow"></span>
                                        </span>
                                        <div className={`menu-sub menu-sub-accordion ${isActive('/admin/system/admins') ? 'show' : ''}`}>
                                            <div className="menu-item">
                                                <NavLink className={`menu-link ${location.pathname === '/admin/system/admins' ? 'active' : ''}`} to="/admin/system/admins">
                                                    <span className="menu-bullet">
                                                        <span className="bullet bullet-dot"></span>
                                                    </span>
                                                    <span className="menu-title">Admin List</span>
                                                </NavLink>
                                            </div>
                                            {canCreateAdmin && (<div className="menu-item">
                                                <NavLink className={`menu-link ${location.pathname === '/admin/system/admins/create' ? 'active' : ''}`} to="/admin/system/admins/create">
                                                    <span className="menu-bullet">
                                                        <span className="bullet bullet-dot"></span>
                                                    </span>
                                                    <span className="menu-title">Add Admin</span>
                                                </NavLink>
                                            </div>)}
                                        </div>
                                    </div>)}

                                    {/* Countries Sub-menu */}
                                    {canViewCountries && (<div data-kt-menu-trigger="click" className={`menu-item menu-accordion mb-1 ${isActive('/admin/system/countries') ? 'hover show' : ''}`}>
                                        <span className={`menu-link ${isActive('/admin/system/countries') ? 'active' : ''}`}>
                                            <span className="menu-bullet">
                                                <span className="bullet bullet-dot"></span>
                                            </span>
                                            <span className="menu-title">Countries</span>
                                            <span className="menu-arrow"></span>
                                        </span>
                                        <div className={`menu-sub menu-sub-accordion ${isActive('/admin/system/countries') ? 'show' : ''}`}>
                                            <div className="menu-item">
                                                <NavLink className={`menu-link ${location.pathname === '/admin/system/countries' ? 'active' : ''}`} to="/admin/system/countries">
                                                    <span className="menu-bullet">
                                                        <span className="bullet bullet-dot"></span>
                                                    </span>
                                                    <span className="menu-title">Country List</span>
                                                </NavLink>
                                            </div>
                                            {canCreateCountry && (<div className="menu-item">
                                                <NavLink className={`menu-link ${location.pathname === '/admin/system/countries/create' ? 'active' : ''}`} to="/admin/system/countries/create">
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
                                        <span className={`menu-link ${isActive('/admin/system/cities') ? 'active' : ''}`}>
                                            <span className="menu-bullet">
                                                <span className="bullet bullet-dot"></span>
                                            </span>
                                            <span className="menu-title">Cities</span>
                                            <span className="menu-arrow"></span>
                                        </span>
                                        <div className={`menu-sub menu-sub-accordion ${isActive('/admin/system/cities') ? 'show' : ''}`}>
                                            <div className="menu-item">
                                                <NavLink className={`menu-link ${location.pathname === '/admin/system/cities' ? 'active' : ''}`} to="/admin/system/cities">
                                                    <span className="menu-bullet">
                                                        <span className="bullet bullet-dot"></span>
                                                    </span>
                                                    <span className="menu-title">City List</span>
                                                </NavLink>
                                            </div>
                                            {canCreateCity && (<div className="menu-item">
                                                <NavLink className={`menu-link ${location.pathname === '/admin/system/cities/create' ? 'active' : ''}`} to="/admin/system/cities/create">
                                                    <span className="menu-bullet">
                                                        <span className="bullet bullet-dot"></span>
                                                    </span>
                                                    <span className="menu-title">Add City</span>
                                                </NavLink>
                                            </div>)}
                                        </div>
                                    </div>)}

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

                                    {/* Payment Providers Sub-menu */}
                                    <div data-kt-menu-trigger="click" className={`menu-item menu-accordion mb-1 ${isActive('/admin/payment-gateways') ? 'hover show' : ''}`}>
                                        <span className={`menu-link ${isActive('/admin/payment-gateways') ? 'active' : ''}`}>
                                            <span className="menu-bullet">
                                                <span className="bullet bullet-dot"></span>
                                            </span>
                                            <span className="menu-title">Payment Providers</span>
                                            <span className="menu-arrow"></span>
                                        </span>
                                        <div className={`menu-sub menu-sub-accordion ${isActive('/admin/payment-gateways') ? 'show' : ''}`}>
                                            <div className="menu-item">
                                                <NavLink 
                                                    className={({ isActive }) => `menu-link ${isActive && location.pathname === '/admin/payment-gateways' ? 'active' : ''}`}
                                                    to="/admin/payment-gateways"
                                                    end
                                                >
                                                    <span className="menu-bullet">
                                                        <span className="bullet bullet-dot"></span>
                                                    </span>
                                                    <span className="menu-title">Provider List</span>
                                                </NavLink>
                                            </div>
                                            <div className="menu-item">
                                                <NavLink 
                                                    className={({ isActive }) => `menu-link ${isActive ? 'active' : ''}`}
                                                    to="/admin/payment-gateways/create"
                                                >
                                                    <span className="menu-bullet">
                                                        <span className="bullet bullet-dot"></span>
                                                    </span>
                                                    <span className="menu-title">Add Payment Provider</span>
                                                </NavLink>
                                            </div>
                                        </div>
                                    </div>)}

                                </div>
                            </div>)}

                            {/* Settings Management */}
                            {(canViewServiceFees || canViewCurrencies || canViewContractTerms) && (<div data-kt-menu-trigger="click" className={`menu-item menu-accordion ${isActive('/admin/settings') ? 'hover show' : ''}`}>
                                <span className={`menu-link ${isActive('/admin/settings') ? 'active' : ''}`}>
                                    <span className="menu-icon">
                                        <i className="ki-duotone ki-setting-3 fs-2">
                                            <span className="path1"></span>
                                            <span className="path2"></span>
                                            <span className="path3"></span>
                                            <span className="path4"></span>
                                            <span className="path5"></span>
                                        </i>
                                    </span>
                                    <span className="menu-title">Settings</span>
                                    <span className="menu-arrow"></span>
                                </span>

                                <div className={`menu-sub menu-sub-accordion ${isActive('/admin/settings') ? 'show' : ''}`}>
                                    
                                    {/* Service Fees */}
                                    {canViewServiceFees && (<div className="menu-item">
                                        <NavLink className={`menu-link ${isActive('/admin/settings/service-fees') ? 'active' : ''}`} to="/admin/settings/service-fees">
                                            <span className="menu-bullet">
                                                <span className="bullet bullet-dot"></span>
                                            </span>
                                            <span className="menu-title">Service Fees</span>
                                        </NavLink>
                                    </div>)}

                                    {/* Currencies */}
                                    {canViewCurrencies && (<div className="menu-item">
                                        <NavLink className={`menu-link ${isActive('/admin/settings/currencies') ? 'active' : ''}`} to="/admin/settings/currencies">
                                            <span className="menu-bullet">
                                                <span className="bullet bullet-dot"></span>
                                            </span>
                                            <span className="menu-title">Currencies</span>
                                        </NavLink>
                                    </div>)}

                                    {/* Contract Terms */}
                                    {canViewContractTerms && (<div className="menu-item">
                                        <NavLink className={`menu-link ${isActive('/admin/settings/contract-terms') ? 'active' : ''}`} to="/admin/settings/contract-terms">
                                            <span className="menu-bullet">
                                                <span className="bullet bullet-dot"></span>
                                            </span>
                                            <span className="menu-title">Contract Terms</span>
                                        </NavLink>
                                    </div>)}

                                </div>
                            </div>)}

                        </div>
                        {/* End::Menu */}
                    </div>
                </div>
            </div>
            {/* End::sidebar menu */}
        </div>
    );
};

export default AdminSidebar;




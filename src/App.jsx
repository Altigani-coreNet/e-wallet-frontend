import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// 🔒 IMPORTANT: Import global axios configuration FIRST
// This ensures ALL axios calls throughout the app use our auth interceptors
import './utils/axiosConfig';

// Create a query client
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            cacheTime: 10 * 60 * 1000, // 10 minutes
            refetchOnWindowFocus: false,
            retry: 1,
        },
    },
});

// Auth Components
import Login from './components/auth/merchant/Login';
import MerchantRegister from './components/auth/merchant/MerchantRegister';
import PartnerRegister from './components/auth/parnters/PartnerRegister';
import ForgotPassword from './components/auth/merchant/ForgotPassword';
import ResetPasswordFromEmail from './components/auth/merchant/ResetPasswordFromEmail';

// Layout Components
import MainLayout from './components/layout/MainLayout';
import ProtectedRoute from './components/common/ProtectedRoute';
import PermissionRoute from './components/common/PermissionRoute';
import { USER_GROUP_EDIT_PERMISSIONS } from './utils/permissions';

// Public Pages
import LandingPage from './pages/LandingPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import Error401 from './pages/Error401';
import Error404 from './pages/Error404';
import Error500 from './pages/Error500';
import PaymentError from './pages/PaymentError';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentLinkRedirect from './components/payment-links/PaymentLinkRedirect';

// Dashboard Components
import MerchantDashboard from './components/merchant/MerchantDashboard';
import SalesDashboard from './components/sales/SalesDashboard';
import InvoicePrint from './components/sales/InvoicePrint';

// POS Components
import PosIndex from './components/sales/pos/PosIndex';

// Transaction Components
import MerchantTransactions from './components/merchant/transactions/MerchantTransactions';
import TransactionDetail from './components/merchant/transactions/TransactionDetail';
import MerchantPlans from './components/merchant/MerchantPlans';
import MerchantDefaultRedirect from './components/merchant/MerchantDefaultRedirect';

// Batch Components
import MerchantBatches from './components/merchant/batches/MerchantBatches';
import BatchDetail from './components/merchant/batches/BatchDetail';

// Payment Link Components
import PaymentLinksIndex from './components/merchant/payment-links/PaymentLinksIndex';
import PaymentLinkCreate from './components/merchant/payment-links/PaymentLinkCreate';
import PaymentLinkEdit from './components/merchant/payment-links/PaymentLinkEdit';
import PaymentLinkDetail from './components/merchant/payment-links/PaymentLinkDetail';
import PaytabsQrCodeTest from './components/merchant/payment-links/PaytabsQrCodeTest';

// Payment Gateways Components
import PaymentGatewaysIndex from './components/merchant/payment-gateways/PaymentGatewaysIndex';
import PaymentGatewayEdit from './components/merchant/payment-gateways/PaymentGatewayEdit';
import PaymentGatewayView from './components/merchant/payment-gateways/PaymentGatewayView';

// API Keys Components
import ApiKeysIndex from './components/merchant/api-keys/ApiKeysIndex';

// Webhooks Components
import WebhooksIndex from './components/merchant/webhooks/WebhooksIndex';
import WebhookForm from './components/merchant/webhooks/WebhookForm';

// Service Fees Components
import ServiceFeesIndex from './components/merchant/service-fees/ServiceFeesIndex';
import ServiceFeeView from './components/merchant/service-fees/ServiceFeeView';

// Contract Components
import ContractView from './components/merchant/contracts/ContractView';

// Settlement Components
import MerchantSettlements from './components/merchant/settlements/MerchantSettlements';
import SettlementDetail from './components/merchant/settlements/SettlementDetail';
import SettlementTransactions from './components/merchant/settlements/SettlementTransactions';

// Branches Components
import BranchesIndex from './components/merchant/branches/BranchesIndex';
import BranchCreate from './components/merchant/branches/BranchCreate';
import BranchEdit from './components/merchant/branches/BranchEdit';
import BranchView from './components/merchant/branches/BranchView';

// Terminals Components
import TerminalsIndex from './components/merchant/terminals/TerminalsIndex';
import TerminalCreate from './components/merchant/terminals/TerminalCreate';
import TerminalEdit from './components/merchant/terminals/TerminalEdit';
import TerminalView from './components/merchant/terminals/TerminalView';

// Users Components
import UsersIndex from './components/users/UsersIndex';
import UserCreate from './components/users/UserCreate';
import UserEdit from './components/users/UserEdit';
import UserView from './components/users/UserView';
import MerchantUserView from './components/merchant/users/MerchantUserView';

// Test Components
import PlanLimitsTest from './components/common/PlanLimitsTest';

// Roles Components - COMMENTED OUT (Not needed)
// import RolesIndex from './components/roles/RolesIndex';
// import RoleCreate from './components/roles/RoleCreate';
// import RoleEdit from './components/roles/RoleEdit';
// import RoleView from './components/roles/RoleView';

// User Groups Components
import UserGroupsIndex from './components/merchant/user-groups/UserGroupsIndex';
import UserGroupCreate from './components/merchant/user-groups/UserGroupCreate';
import UserGroupEdit from './components/merchant/user-groups/UserGroupEdit';
import UserGroupView from './components/merchant/user-groups/UserGroupView';

// Customer Components
import CustomersIndex from './components/merchant/customers/CustomersIndex';
import CustomerCreate from './components/merchant/customers/CustomerCreate';
import CustomerEdit from './components/merchant/customers/CustomerEdit';
import CustomerView from './components/merchant/customers/CustomerView';

// Supplier Components
import SuppliersIndex from './components/sales/suppliers/SuppliersIndex';
import SupplierCreate from './components/sales/suppliers/SupplierCreate';
import SupplierEdit from './components/sales/suppliers/SupplierEdit';
import SupplierView from './components/sales/suppliers/SupplierView';

// Purchase Components
import PurchasesIndex from './components/sales/purchases/PurchasesIndex';
import PurchaseCreate from './components/sales/purchases/PurchaseCreate';
import PurchaseEdit from './components/sales/purchases/PurchaseEdit';
import PurchaseView from './components/sales/purchases/PurchaseView';

// Profile Components
import Profile from './components/profile/Profile';

// Sales Reports Components
import PurchaseReport from './components/sales/reports/PurchaseReport';
import SalesReport from './components/sales/reports/SalesReport';
import ProductsReport from './components/sales/reports/ProductsReport';

// Sales Report (Sales/Drafts/Returns) Components
import SalesIndex from './components/sales/sales-report/SalesIndex';
import DraftsIndex from './components/sales/sales-report/DraftsIndex';
import ReturnsIndex from './components/sales/sales-report/ReturnsIndex';
import SaleView from './components/sales/sales-report/SaleView';
import ReturnSalePage from './components/sales/sales-report/ReturnSalePage';

// Sales Inventory Components
import Tags from './components/sales/inventory/Tags';
import Taxes from './components/sales/inventory/Taxes';
import Categories from './components/sales/inventory/Categories';
import Brands from './components/sales/inventory/Brands';
import Units from './components/sales/inventory/Units';
import Warehouse from './components/sales/inventory/Warehouse';
import WarehouseCreate from './components/sales/inventory/WarehouseCreate';
import WarehouseEdit from './components/sales/inventory/WarehouseEdit';
import WarehouseView from './components/sales/inventory/WarehouseView';
import CouponsIndex from './components/merchant/coupons/CouponsIndex';

// Sales Products Components
import Products from './components/sales/products/Products';
import ProductCreate from './components/sales/products/ProductCreate';
import ProductEdit from './components/sales/products/ProductEdit';
import ProductShow from './components/sales/products/ProductShow';
import ProductImport from './components/sales/products/ProductImport';

// Auth Store
import useAuthStore from './stores/authStore';

// Toolbar Context
import { ToolbarProvider } from './contexts/ToolbarContext';

// Admin Components
import AdminProtectedRoute from './components/common/AdminProtectedRoute';
import AdminLogin from './components/admin/auth/AdminLogin';
import AdminLayout from './components/admin/layout/AdminLayout';
import AdminDashboard from './components/admin/AdminDashboard';
import AdminMerchantsIndex from './components/admin/merchants/AdminMerchantsIndex';
import AdminMerchantCreate from './components/admin/merchants/AdminMerchantCreate';
import AdminMerchantView from './components/admin/merchants/AdminMerchantView';
import AdminMerchantEdit from './components/admin/merchants/AdminMerchantEdit';
import AdminMerchantEvents from './components/admin/merchants/AdminMerchantEvents';
import AdminMerchantTransactions from './components/admin/merchants/AdminMerchantTransactions';
import AdminMerchantBranches from './components/admin/merchants/AdminMerchantBranches';
import AdminMerchantTerminals from './components/admin/merchants/AdminMerchantTerminals';
import AdminMerchantUsers from './components/admin/merchants/AdminMerchantUsers';
import AdminMerchantAttachments from './components/admin/merchants/AdminMerchantAttachments';
import AdminMerchantChangeRequests from './components/admin/merchants/AdminMerchantChangeRequests';
import AdminChangeRequestsIndex from './components/admin/change-requests/AdminChangeRequestsIndex';
import AdminChangeRequestView from './components/admin/change-requests/AdminChangeRequestView';
import AdminBranchesIndex from './components/admin/branches/AdminBranchesIndex';
import AdminBranchCreate from './components/admin/branches/AdminBranchCreate';
import AdminBranchEdit from './components/admin/branches/AdminBranchEdit';
import AdminBranchView from './components/admin/branches/AdminBranchView';
import AdminUsersIndex from './components/admin/users/AdminUsersIndex';
import AdminUserCreate from './components/admin/users/AdminUserCreate';
import AdminUserEdit from './components/admin/users/AdminUserEdit';
import AdminUserView from './components/admin/users/AdminUserView';
import AdminUserGroupsIndex from './components/admin/user-groups/AdminUserGroupsIndex';
import AdminUserGroupCreate from './components/admin/user-groups/AdminUserGroupCreate';
import AdminUserGroupEdit from './components/admin/user-groups/AdminUserGroupEdit';
import AdminUserGroupView from './components/admin/user-groups/AdminUserGroupView';
import AdminTerminalsIndex from './components/admin/terminals/AdminTerminalsIndex';
import AdminTerminalCreate from './components/admin/terminals/AdminTerminalCreate';
import AdminTerminalEdit from './components/admin/terminals/AdminTerminalEdit';
import AdminTerminalView from './components/admin/terminals/AdminTerminalView';
import AdminTerminalGroupsIndex from './components/admin/terminal-groups/AdminTerminalGroupsIndex';
import AdminTerminalGroupCreate from './components/admin/terminal-groups/AdminTerminalGroupCreate';
import AdminTerminalGroupEdit from './components/admin/terminal-groups/AdminTerminalGroupEdit';
import AdminTerminalGroupView from './components/admin/terminal-groups/AdminTerminalGroupView';
import AdminCustomersIndex from './components/admin/customers/AdminCustomersIndex';
import AdminCustomerCreate from './components/admin/customers/AdminCustomerCreate';
import AdminCustomerView from './components/admin/customers/AdminCustomerView';
import AdminCustomerEdit from './components/admin/customers/AdminCustomerEdit';
import AdminInvoicePrint from './components/admin/invoices/AdminInvoicePrint';
import PosInvoicePrint from './components/pos/PosInvoicePrint';
import AdminTransactionsIndex from './components/admin/transactions/AdminTransactionsIndex';
import AdminTransactionDetail from './components/admin/transactions/AdminTransactionDetail';
import AdminServiceTransactionsIndex from './components/admin/service-transactions/AdminServiceTransactionsIndex';
import AdminServiceTransactionDetail from './components/admin/service-transactions/AdminServiceTransactionDetail';
import AdminSettlementsIndex from './components/admin/settlements/AdminSettlementsIndex';
import AdminSettlementDetail from './components/admin/settlements/AdminSettlementDetail';
import AdminBatchesIndex from './components/admin/batches/AdminBatchesIndex';
import AdminBatchDetail from './components/admin/batches/AdminBatchDetail';
import AdminNotificationsIndex from './components/admin/notifications/AdminNotificationsIndex';
import AdminNotificationForm from './components/admin/notifications/AdminNotificationForm';

// System Administration Components - Plans
import AdminPlansIndex from './components/admin/plans/AdminPlansIndex';
import AdminPlanCreate from './components/admin/plans/AdminPlanCreate';
import AdminPlanEdit from './components/admin/plans/AdminPlanEdit';
import AdminPlanShow from './components/admin/plans/AdminPlanShow';
import AdminPlanReport from './components/admin/plans/AdminPlanReport';

// System Administration Components - Roles
import AdminRolesIndex from './components/admin/system/roles/AdminRolesIndex';
import AdminRoleCreate from './components/admin/system/roles/AdminRoleCreate';
import AdminRoleEdit from './components/admin/system/roles/AdminRoleEdit';
import AdminRoleView from './components/admin/system/roles/AdminRoleView';

// System Administration Components - Admins
import AdminAdminsIndex from './components/admin/system/admins/AdminAdminsIndex';
import AdminAdminCreate from './components/admin/system/admins/AdminAdminCreate';
import AdminAdminEdit from './components/admin/system/admins/AdminAdminEdit';
import AdminAdminView from './components/admin/system/admins/AdminAdminView';

// System Administration Components - Countries
import AdminCountriesIndex from './components/admin/system/countries/AdminCountriesIndex';
import AdminCountryCreate from './components/admin/system/countries/AdminCountryCreate';
import AdminCountryEdit from './components/admin/system/countries/AdminCountryEdit';
import AdminCountryView from './components/admin/system/countries/AdminCountryView';

// System Administration Components - Cities
import AdminCitiesIndex from './components/admin/system/cities/AdminCitiesIndex';
import AdminCityCreate from './components/admin/system/cities/AdminCityCreate';
import AdminCityEdit from './components/admin/system/cities/AdminCityEdit';
import AdminCityView from './components/admin/system/cities/AdminCityView';

// System Administration Components - Advertisements
import AdminAdvertisementsIndex from './components/admin/system/advertisements/AdminAdvertisementsIndex';
import AdminAdvertisementCreate from './components/admin/system/advertisements/AdminAdvertisementCreate';
import AdminAdvertisementEdit from './components/admin/system/advertisements/AdminAdvertisementEdit';
import AdminAdvertisementView from './components/admin/system/advertisements/AdminAdvertisementView';

// System Administration Components - Payment Gateways
import AdminPaymentGatewaysIndex from './components/admin/payment-gateways/AdminPaymentGatewaysIndex';
import AdminPaymentGatewayCreate from './components/admin/payment-gateways/AdminPaymentGatewayCreate';
import AdminPaymentGatewayEdit from './components/admin/payment-gateways/AdminPaymentGatewayEdit';
import AdminPaymentGatewayView from './components/admin/payment-gateways/AdminPaymentGatewayView';

// Settings Management - Service Fees
import AdminServiceFeesIndex from './components/admin/settings/service-fees/AdminServiceFeesIndex';
import AdminServiceFeeCreate from './components/admin/settings/service-fees/AdminServiceFeeCreate';
import AdminServiceFeeEdit from './components/admin/settings/service-fees/AdminServiceFeeEdit';
import AdminServiceFeeView from './components/admin/settings/service-fees/AdminServiceFeeView';

// Settings Management - Currencies
import AdminCurrenciesIndex from './components/admin/settings/currencies/AdminCurrenciesIndex';
import AdminCurrencyCreate from './components/admin/settings/currencies/AdminCurrencyCreate';
import AdminCurrencyEdit from './components/admin/settings/currencies/AdminCurrencyEdit';
import AdminCurrencyView from './components/admin/settings/currencies/AdminCurrencyView';

// Settings Management - Contract Terms
import AdminContractTermsIndex from './components/admin/settings/contract-terms/AdminContractTermsIndex';

// Products Management Components
import AdminTagsIndex from './components/admin/tags/AdminTagsIndex';
import AdminTagView from './components/admin/tags/AdminTagView';
import AdminTaxesIndex from './components/admin/taxes/AdminTaxesIndex';
import AdminTaxView from './components/admin/taxes/AdminTaxView';
import AdminCouponsIndex from './components/admin/coupons/AdminCouponsIndex';
import AdminCategoriesIndex from './components/admin/categories/AdminCategoriesIndex';
import AdminCategoryView from './components/admin/categories/AdminCategoryView';
import AdminBrandsIndex from './components/admin/brands/AdminBrandsIndex';
import AdminBrandView from './components/admin/brands/AdminBrandView';
import AdminUnitsIndex from './components/admin/units/AdminUnitsIndex';
import AdminUnitView from './components/admin/units/AdminUnitView';
import AdminProductsIndex from './components/admin/products/AdminProductsIndex';
import AdminProductView from './components/admin/products/AdminProductView';

// E-payment gateway & services catalog (Auth / SoftPos service APIs)
import PgServiceCategoriesPage from './pages/payment-getway/ServiceCategoriesPage';
import PgServiceSubCategoriesPage from './pages/payment-getway/ServiceSubCategoriesPage';
import PgServicesPage from './pages/payment-getway/ServicesPage';
import PgServiceCreate from './pages/payment-getway/ServiceCreate';
import PgServiceEdit from './pages/payment-getway/ServiceEdit';
import PgServiceWizard from './pages/payment-getway/ServiceWizard';
import PgServiceShow from './pages/payment-getway/services/ServiceShow';
import HomeScreenServicesConfigPage from './pages/payment-getway/services/HomeScreenServicesConfigPage';
import PgServiceProducts from './pages/payment-getway/products/ServiceProducts';
import PgGatewayProductsIndex from './pages/payment-getway/products/Products';
import PgGatewayProductCreate from './pages/payment-getway/products/ProductCreate';
import PgGatewayProductEdit from './pages/payment-getway/products/ProductEdit';
import AdminEPaymentGatewayComingSoon from './pages/payment-getway/AdminEPaymentGatewayComingSoon';
import AdminPartnersIndex from './pages/payment-getway/AdminPartnersIndex';
import AdminSubPartnersIndex from './pages/payment-getway/AdminSubPartnersIndex';
import AdminContentProviderCreate from './pages/payment-getway/AdminContentProviderCreate';
import AdminContentProviderView from './pages/payment-getway/AdminContentProviderView';
import AdminContentProviderEdit from './pages/payment-getway/AdminContentProviderEdit';
import AdminServiceCategoryView from './pages/payment-getway/service-categories/AdminServiceCategoryView';
import AdminWarehousesIndex from './components/admin/warehouses/AdminWarehousesIndex';
import AdminWarehouseView from './components/admin/warehouses/AdminWarehouseView';

// Sales Management Components
import AdminSalesIndex from './components/admin/sales/AdminSalesIndex';
import AdminSaleView from './components/admin/sales/AdminSaleView';
import AdminDraftsIndex from './components/admin/drafts/AdminDraftsIndex';
import AdminDraftView from './components/admin/drafts/AdminDraftView';
import AdminReturnsIndex from './components/admin/returns/AdminReturnsIndex';
import AdminReturnView from './components/admin/returns/AdminReturnView';

// Purchase Management Components
import AdminPurchasesIndex from './components/admin/purchases/AdminPurchasesIndex';
import AdminPurchaseView from './components/admin/purchases/AdminPurchaseView';

// Sales Report Components
import AdminSalesReport from './components/admin/sales-report/AdminSalesReport';
import AdminPurchaseReport from './components/admin/sales-report/AdminPurchaseReport';
import AdminProductsReport from './components/admin/sales-report/AdminProductsReport';
import AdminPaymentLinksIndex from './components/admin/payment-links/AdminPaymentLinksIndex';
import AdminPaymentLinkDetail from './components/admin/payment-links/AdminPaymentLinkDetail';

// Placeholder component for not implemented pages
const PlaceholderPage = ({ title }) => (
    <div className="card">
        <div className="card-body text-center py-20">
            <h2 className="mb-5">{title}</h2>
            <p className="text-muted">This page will be implemented with components from SoftPos</p>
        </div>
    </div>
);

function App() {
    const { initialize, isAuthenticated } = useAuthStore();

    // Initialize auth state on app load
    useEffect(() => {
        initialize();
    }, [initialize]);

    // Listen for unauthorized events
    useEffect(() => {
        const handleUnauthorized = (event) => {
            // Get redirect path from event detail or determine from current path
            const redirectPath = event.detail?.redirectPath || 
                (window.location.pathname.startsWith('/admin') ? '/admin/login' : '/login');
            
            console.log('🔒 Unauthorized access detected, clearing auth and redirecting to:', redirectPath);
            
            // CRITICAL: Clear auth store to prevent redirect loop
            useAuthStore.setState({
                user: null,
                merchant: null,
                token: null,
                isAuthenticated: false,
                loading: false,
                error: null,
            });
            
            // Also clear localStorage (belt and suspenders approach)
            localStorage.removeItem('corenet_token');
            localStorage.removeItem('corenet_user');
            localStorage.removeItem('corenet_merchant');
            localStorage.removeItem('auth-storage'); // Clear Zustand persist
            
            // Force redirect
            window.location.href = redirectPath;
        };

        window.addEventListener('unauthorized', handleUnauthorized);
        
        return () => {
            window.removeEventListener('unauthorized', handleUnauthorized);
        };
    }, []);

  return (
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <Routes>
                    {/* Root + Public Pages */}
                    <Route path="/" element={<Outlet />}>
                        <Route index element={<LandingPage />} />
                        <Route path="privacy" element={<PrivacyPage />} />
                        <Route path="terms" element={<TermsPage />} />
                        <Route path="payment/error" element={<PaymentError />} />
                        <Route path="payments/error" element={<PaymentError />} />
                        <Route path="payment/success" element={<PaymentSuccess />} />
                        <Route path="payments/success" element={<PaymentSuccess />} />
                        <Route path="payments" element={<PaymentLinkRedirect />} />
                        <Route path="payments/:uuid" element={<PaymentLinkRedirect />} />

                        {/* Protected Routes */}
                        <Route element={
                            <div>{/* keep structure */}
                                <ProtectedRoute>
                                <ToolbarProvider>
                                    <MainLayout />
                                </ToolbarProvider>
                                </ProtectedRoute>
                            </div>
                        }>
                            {/* Merchant Routes */}
                        <Route key="merchant-root" path="merchant">
                        <Route path="h0ld" element={<></>} />
                        <Route path="dashboard" element={
                            <PermissionRoute anyOf={['pos.dashboard.view_dashboard','view_dashboard']}>
                                <MerchantDashboard />
                            </PermissionRoute>
                        } />
                        <Route path="transactions" element={
                            <PermissionRoute anyOf={['pos.transactions.view_transactions','view_transactions']}>
                                <MerchantTransactions />
                            </PermissionRoute>
                        } />
                        <Route path="transactions/:id" element={<TransactionDetail />} />
                        <Route path="settlements" element={
                            <PermissionRoute anyOf={['pos.settlements.view_settlements','view_settlements']}>
                                <MerchantSettlements />
                            </PermissionRoute>
                        } />
                        <Route path="settlements/:id" element={<SettlementDetail />} />
                        <Route path="settlements/transactions" element={<SettlementTransactions />} />
                        <Route path="batches" element={
                            <PermissionRoute anyOf={['pos.batches.view_batches','view_batches']}>
                                <MerchantBatches />
                            </PermissionRoute>
                        } />
                        <Route path="batches/:id" element={<BatchDetail />} />
                        <Route path="payment-links" element={
                            <PermissionRoute anyOf={['pos.payment_links.view_payment_links', 'pos.payment_links.create', 'pos.payment_links.edit', 'pos.payment_links.delete', 'pos.payment_links.create_payment_links', 'pos.payment_links.edit_payment_links', 'pos.payment_links.delete_payment_links', 'view_payment_links']}>
                                <PaymentLinksIndex />
                            </PermissionRoute>
                        } />
                        <Route path="payment-links/create" element={
                            <PermissionRoute anyOf={['pos.payment_links.create', 'pos.payment_links.create_payment_links']}>
                                <PaymentLinkCreate />
                            </PermissionRoute>
                        } />
                        <Route path="payment-links/:id" element={
                            <PermissionRoute anyOf={['pos.payment_links.view_payment_links', 'pos.payment_links.edit', 'pos.payment_links.edit_payment_links']}>
                                <PaymentLinkDetail />
                            </PermissionRoute>
                        } />
                        <Route path="payment-links/:id/edit" element={
                            <PermissionRoute anyOf={['pos.payment_links.edit', 'pos.payment_links.edit_payment_links']}>
                                <PaymentLinkEdit />
                            </PermissionRoute>
                        } />
                        <Route path="payment-links/test/qr-code" element={
                            <PaytabsQrCodeTest />
                        } />
                        
                        {/* Payment Gateways */}
                        <Route path="payment-gateways" element={
                            <PermissionRoute anyOf={['sales.payment_gateways.view_payment_gateways']}>
                                <PaymentGatewaysIndex />
                            </PermissionRoute>
                        } />
                        <Route path="payment-gateways/:name" element={
                            <PermissionRoute anyOf={['sales.payment_gateways.view_payment_gateways']}>
                                <PaymentGatewayView />
                            </PermissionRoute>
                        } />
                        <Route path="payment-gateways/:name/edit" element={
                            <PermissionRoute anyOf={['sales.payment_gateways.edit_payment_gateways']}>
                                <PaymentGatewayEdit />
                            </PermissionRoute>
                        } />
                        
                        {/* API Keys */}
                        <Route path="api-keys" element={
                            <ApiKeysIndex />
                        } />
                        
                        {/* Webhooks */}
                        <Route path="webhooks" element={<WebhooksIndex />} />
                        <Route path="webhooks/create" element={<WebhookForm />} />
                        <Route path="webhooks/:id/edit" element={<WebhookForm />} />
                        
                        <Route path="branches" element={
                            <PermissionRoute anyOf={['pos.branches.view_branches','view_branches']}>
                                <BranchesIndex />
                            </PermissionRoute>
                        } />
                        <Route path="branches/create" element={
                            <PermissionRoute anyOf={['pos.branches.create_branches','pos.branches.edit_branches','pos.branches.delete_branches','create_branches','request_branches']}>
                                <BranchCreate />
                            </PermissionRoute>
                        } />
                        <Route path="branches/:id" element={<BranchView />} />
                        <Route path="branches/:id/edit" element={<BranchEdit />} />
                        <Route path="terminals" element={
                            <PermissionRoute anyOf={['pos.terminals.view_terminals','view_terminals']}>
                                <TerminalsIndex />
                            </PermissionRoute>
                        } />
                        <Route path="terminals/create" element={
                            <PermissionRoute anyOf={['pos.terminals.create_terminals','pos.terminals.assign_terminals','pos.terminals.edit_terminals','create_terminals','assign_terminals']}>
                                <TerminalCreate />
                            </PermissionRoute>
                        } />
                        <Route path="terminals/:id" element={<TerminalView />} />
                        <Route path="terminals/:id/edit" element={<TerminalEdit />} />
                        <Route path="contracts" element={
                            <PermissionRoute required="pos.contract_terms.view_contract_terms">
                                <ContractView />
                            </PermissionRoute>
                        } />
                        <Route path="service-fees" element={
                            <PermissionRoute required="pos.service_fees.view_service_fees">
                                <ServiceFeesIndex />
                            </PermissionRoute>
                        } />
                        <Route path="service-fees/:id" element={<ServiceFeeView />} />
                        
                        {/* Users & Roles in Merchant */}
                        <Route path="users" element={
                            <PermissionRoute anyOf={['pos.users.view_users','view_users']}>
                                <UsersIndex />
                            </PermissionRoute>
                        } />
                        <Route path="users/create" element={
                            <PermissionRoute anyOf={['pos.users.create_users','create_users']}>
                                <UserCreate />
                            </PermissionRoute>
                        } />
                        <Route path="users/:id/edit" element={<UserEdit />} />
                        <Route path="users/:id" element={<MerchantUserView />} />
                        {/* Roles Routes - COMMENTED OUT (Not needed) */}
                        {/* <Route path="roles" element={
                            <PermissionRoute anyOf={['pos.roles.view_roles','view_roles']}>
                                <RolesIndex />
                            </PermissionRoute>
                        } />
                        <Route path="roles/create" element={
                            <PermissionRoute anyOf={['pos.roles.create_roles','create_roles']}>
                                <RoleCreate />
                            </PermissionRoute>
                        } />
                        <Route path="roles/:id/edit" element={<RoleEdit />} />
                        <Route path="roles/:id" element={<RoleView />} /> */}
                        
                        {/* User Groups */}
                        <Route path="user-groups" element={
                            <PermissionRoute anyOf={['pos.users_groups.view', 'pos.users_groups.view_users_group']}>
                                <UserGroupsIndex />
                            </PermissionRoute>
                        } />
                        <Route path="user-groups/create" element={
                            <PermissionRoute anyOf={['pos.users_groups.create', 'pos.users_groups.create_users_group']}>
                                <UserGroupCreate />
                            </PermissionRoute>
                        } />
                        <Route path="user-groups/:id" element={
                            <PermissionRoute anyOf={['pos.users_groups.view', 'pos.users_groups.view_users_group']}>
                                <UserGroupView />
                            </PermissionRoute>
                        } />
                        <Route path="user-groups/:id/edit" element={
                            <PermissionRoute anyOf={['pos.users_groups.edit', 'pos.users_groups.edit_users_group']}>
                                <UserGroupEdit />
                            </PermissionRoute>
                        } />
                        
                        {/* Customers */}
                        <Route path="customers" element={
                            <PermissionRoute required="view_customers">
                                <CustomersIndex />
                            </PermissionRoute>
                        } />
                        <Route path="customers/create" element={
                            <PermissionRoute required="create_customers">
                                <CustomerCreate />
                            </PermissionRoute>
                        } />
                        <Route path="customers/:id" element={<CustomerView />} />
                        <Route path="customers/:id/edit" element={<CustomerEdit />} />
                        
                        <Route path="profile" element={<Profile />} />
                        <Route path="plans" element={<MerchantPlans />} />
                        <Route path="plan-limits-test" element={<PlanLimitsTest />} />
                        
                        {/* Redirect merchant root based on plan scopes (POS vs Cashier) */}
                        <Route index element={<MerchantDefaultRedirect />} />
                    </Route>
                    
                    {/* Sales Routes */}
                    <Route path="sales">
                        <Route path="dashboard" element={
                            <PermissionRoute anyOf={['sales.dashboard.view_sales_dashboard','view_dashboard']}>
                                <SalesDashboard />
                            </PermissionRoute>
                        } />
                        <Route path="sale" element={<PosIndex />} />
                        <Route path="invoice/:id" element={<InvoicePrint />} />
                        <Route path="plan-limits-test" element={<PlanLimitsTest />} />
                        
                        {/* Sales Report (Sales/Drafts/Returns) */}
                        <Route path="sales-report/sales" element={<SalesIndex />} />
                        <Route path="sales-report/drafts" element={<DraftsIndex />} />
                        <Route path="sales-report/returns" element={<ReturnsIndex />} />
                        <Route path="return-sale/:id" element={<ReturnSalePage />} />
                        <Route path="sales-report/:id" element={<SaleView />} />
                        
                        {/* Reports - Each report is a separate page */}
                        <Route path="reports/sales" element={<SalesReport />} />
                        <Route path="reports/purchases" element={<PurchaseReport />} />
                        <Route path="reports/products" element={<ProductsReport />} />
                        
                        <Route path="orders" element={<PlaceholderPage title="Orders" />} />
                        
                        {/* Products */}
                        <Route path="products" element={
                            <PermissionRoute anyOf={['sales.products.view_products','view_products']}>
                                <Products />
                            </PermissionRoute>
                        } />
                        <Route path="products/create" element={<ProductCreate />} />
                        <Route path="products/:id" element={<ProductShow />} />
                        <Route path="products/:id/edit" element={<ProductEdit />} />
                        <Route path="products/import" element={<ProductImport />} />
                        
                        {/* Customers */}
                        <Route path="customers" element={<CustomersIndex />} />
                        <Route path="customers/create" element={<CustomerCreate />} />
                        <Route path="customers/:id" element={<CustomerView />} />
                        <Route path="customers/:id/edit" element={<CustomerEdit />} />
                        
                        {/* Suppliers */}
                        <Route path="suppliers" element={<SuppliersIndex />} />
                        <Route path="suppliers/create" element={<SupplierCreate />} />
                        <Route path="suppliers/:id" element={<SupplierView />} />
                        <Route path="suppliers/:id/edit" element={<SupplierEdit />} />
                        
                        {/* Purchases */}
                        <Route path="purchases" element={<PurchasesIndex />} />
                        <Route path="purchases/create" element={<PurchaseCreate />} />
                        <Route path="purchases/:id" element={<PurchaseView />} />
                        <Route path="purchases/:id/edit" element={<PurchaseEdit />} />
                        
                        {/* Inventory */}
                        <Route path="tags" element={<Tags />} />
                        <Route path="taxes" element={<Taxes />} />
                        <Route path="categories" element={<Categories />} />
                        <Route path="brands" element={<Brands />} />
                        <Route path="units" element={<Units />} />
                        <Route path="coupons" element={<CouponsIndex />} />
                        <Route path="warehouse" element={<Warehouse />} />
                        <Route path="warehouse/create" element={<WarehouseCreate />} />
                        <Route path="warehouse/:id" element={<WarehouseView />} />
                        <Route path="warehouse/:id/edit" element={<WarehouseEdit />} />
                        
                        {/* Users & Roles */}
                        <Route path="users" element={<UsersIndex />} />
                        <Route path="users/create" element={<UserCreate />} />
                        <Route path="users/:id/edit" element={<UserEdit />} />
                        <Route path="users/:id" element={<UserView />} />
                        {/* Roles Routes - COMMENTED OUT (Not needed) */}
                        {/* <Route path="roles" element={<RolesIndex />} />
                        <Route path="roles/create" element={<RoleCreate />} />
                        <Route path="roles/:id/edit" element={<RoleEdit />} />
                        <Route path="roles/:id" element={<RoleView />} /> */}
                        
                        {/* Branches (Sales) */}
                        <Route path="branches" element={<PlaceholderPage title="Branches" />} />
                        <Route path="branches/create" element={<PlaceholderPage title="Create Branch" />} />
                        <Route path="branches/:id" element={<PlaceholderPage title="Branch Details" />} />
                        <Route path="branches/:id/edit" element={<PlaceholderPage title="Edit Branch" />} />
                        
                        {/* Redirect sales root to dashboard */}
                        <Route index element={<Navigate to="/sales/dashboard" replace />} />
                    </Route>
                    
                    {/* Catch-all redirect */}
                    <Route path="*" element={<Navigate to="/merchant/dashboard" replace />} />
                </Route>
            </Route>

            {/* Public Auth Routes */}
            <Route path="/login" element={<Login />} />
            {/* Error Pages */}
            <Route path="/401" element={<Error401 />} />
            <Route path="/404" element={<Error404 />} />
            <Route path="/500" element={<Error500 />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/merchant/register" element={<MerchantRegister />} />
            <Route path="/partner/register" element={<PartnerRegister />} />
                          {/* Public: reset link from email — must stay OUTSIDE ProtectedRoute + before splat */}
            <Route path="/reset-password/:token" element={<ResetPasswordFromEmail />} />


            {/* Public Invoice Routes - No Authentication Required */}
            {/* POS (cashier) sale invoice */}
            <Route path="/invoice/:id" element={<AdminInvoicePrint />} />
            {/* SoftPOS card transaction invoice (POS device) */}
            <Route path="/pos-invoice/:id" element={<PosInvoicePrint />} />
            {/* Payment-link invoice by UUID */}
            <Route path="/link-invoice/:uuid" element={<PosInvoicePrint />} />

            {/* Admin Protected Routes */}
                <Route path="/admin" element={
                    <AdminProtectedRoute>
                        <ToolbarProvider>
                            <AdminLayout />
                        </ToolbarProvider>
                    </AdminProtectedRoute>
                }>
                    {/* Default redirect to admin dashboard */}
                    <Route index element={<Navigate to="/admin/dashboard" replace />} />
                    
                    {/* Admin Dashboard */}
                    <Route path="dashboard" element={
                        <PermissionRoute anyOf={['pos.dashboard.view_dashboard']}>
                            <AdminDashboard />
                        </PermissionRoute>
                    } />

                    {/* E-payment gateway & services catalog */}
                    <Route path="settings/e-payment-gateway" element={<AdminEPaymentGatewayComingSoon />} />

                    <Route path="partners/sub-partners/create" element={<AdminContentProviderCreate />} />
                    <Route path="partners/sub-partners" element={<AdminSubPartnersIndex />} />
                    <Route path="partners" element={<AdminPartnersIndex />} />
                    <Route path="partners/create" element={<AdminContentProviderCreate />} />
                    <Route path="partners/:parentId/sub-partners/create" element={<AdminContentProviderCreate />} />
                    <Route path="partners/:id/edit" element={<AdminContentProviderEdit />} />
                    <Route path="partners/:id" element={<AdminContentProviderView />} />

                    <Route path="service/category/type/:categoryType" element={<PgServiceCategoriesPage />} />
                    <Route path="service/category" element={<Navigate to="/admin/service/category/type/service" replace />} />
                    <Route path="service/category/:id" element={<AdminServiceCategoryView />} />
                    <Route path="service/sub-category" element={<Navigate to="/admin/service/sub-categories" replace />} />
                    <Route path="service/sub-categories" element={<PgServiceSubCategoriesPage />} />

                    <Route path="services/create/wizard" element={<PgServiceWizard />} />
                    <Route path="services/create" element={<PgServiceCreate />} />
                    <Route path="services/:id/edit" element={<PgServiceEdit />} />
                    <Route path="services/:id/products" element={<PgServiceProducts />} />
                    <Route path="services/:id" element={<PgServiceShow />} />
                    <Route path="services/home-config" element={<HomeScreenServicesConfigPage />} />
                    <Route path="services" element={<PgServicesPage />} />

                    <Route path="service-products/create" element={<PgGatewayProductCreate />} />
                    <Route path="service-products/:id/edit" element={<PgGatewayProductEdit />} />
                    <Route path="service-products" element={<PgGatewayProductsIndex />} />
                    
                    {/* Merchant Management */}
                    <Route path="merchants" element={
                        <PermissionRoute required="pos.merchants.view_merchants">
                            <AdminMerchantsIndex />
                        </PermissionRoute>
                    } />
                    <Route path="merchants/create" element={
                        <PermissionRoute required="pos.merchants.create_merchants">
                            <AdminMerchantCreate />
                        </PermissionRoute>
                    } />
                    <Route path="merchants/change-requests" element={
                        <PermissionRoute required="pos.merchants.view_merchant_change_requests">
                            <AdminChangeRequestsIndex />
                        </PermissionRoute>
                    } />
                    <Route path="merchants/change-requests/:id" element={
                        <PermissionRoute required="pos.merchants.view_merchant_change_requests">
                            <AdminChangeRequestView />
                        </PermissionRoute>
                    } />
                    <Route path="merchants/:id" element={
                        <PermissionRoute required="pos.merchants.view_merchants">
                            <AdminMerchantView />
                        </PermissionRoute>
                    } />
                    <Route path="merchants/:id/events" element={
                        <PermissionRoute required="pos.merchants.view_merchants">
                            <AdminMerchantEvents />
                        </PermissionRoute>
                    } />
                    <Route path="merchants/:id/transactions" element={
                        <PermissionRoute required="pos.merchants.view_merchants">
                            <AdminMerchantTransactions />
                        </PermissionRoute>
                    } />
                    <Route path="merchants/:id/branches" element={
                        <PermissionRoute required="pos.merchants.view_merchants">
                            <AdminMerchantBranches />
                        </PermissionRoute>
                    } />
                    <Route path="merchants/:id/terminals" element={
                        <PermissionRoute required="pos.merchants.view_merchants">
                            <AdminMerchantTerminals />
                        </PermissionRoute>
                    } />
                    <Route path="merchants/:id/users" element={
                        <PermissionRoute required="pos.merchants.view_merchants">
                            <AdminMerchantUsers />
                        </PermissionRoute>
                    } />
                    <Route path="merchants/:id/attachments" element={
                        <PermissionRoute required="pos.merchants.view_merchants">
                            <AdminMerchantAttachments />
                        </PermissionRoute>
                    } />
                    <Route path="merchants/:id/change-requests" element={
                        <PermissionRoute required="pos.merchants.view_merchants">
                            <AdminMerchantChangeRequests />
                        </PermissionRoute>
                    } />
                    <Route path="merchants/:id/edit" element={
                        <PermissionRoute required="pos.merchants.edit_merchants">
                            <AdminMerchantEdit />
                        </PermissionRoute>
                    } />

                    {/* Payment Links */}
                    <Route path="payment-links" element={
                        <PermissionRoute anyOf={['pos.payment_links.view_payment_links', 'pos.payment_links.create', 'pos.payment_links.edit', 'pos.payment_links.delete', 'pos.payment_links.create_payment_links', 'pos.payment_links.edit_payment_links', 'pos.payment_links.delete_payment_links']}>
                            <AdminPaymentLinksIndex />
                        </PermissionRoute>
                    } />
                    <Route path="payment-links/:id" element={
                        <PermissionRoute anyOf={['pos.payment_links.view_payment_links', 'pos.payment_links.edit', 'pos.payment_links.edit_payment_links']}>
                            <AdminPaymentLinkDetail />
                        </PermissionRoute>
                    } />
                    
                    {/* Branch Management */}
                    <Route path="branches" element={
                        <PermissionRoute required="pos.branches.view_branches">
                            <AdminBranchesIndex />
                        </PermissionRoute>
                    } />
                    <Route path="branches/create" element={
                        <PermissionRoute required="pos.branches.create_branches">
                            <AdminBranchCreate />
                        </PermissionRoute>
                    } />
                    <Route path="branches/:id" element={
                        <PermissionRoute required="pos.branches.view_branches">
                            <AdminBranchView />
                        </PermissionRoute>
                    } />
                    <Route path="branches/:id/edit" element={
                        <PermissionRoute required="pos.branches.edit_branches">
                            <AdminBranchEdit />
                        </PermissionRoute>
                    } />
                    
                    {/* User Management */}
                    <Route path="users" element={
                        <PermissionRoute required="pos.users.view_users">
                            <AdminUsersIndex />
                        </PermissionRoute>
                    } />
                    <Route path="users/create" element={
                        <PermissionRoute required="pos.users.create_users">
                            <AdminUserCreate />
                        </PermissionRoute>
                    } />
                    <Route path="users/:id" element={
                        <PermissionRoute required="pos.users.view_users">
                            <AdminUserView />
                        </PermissionRoute>
                    } />
                    <Route path="users/:id/edit" element={
                        <PermissionRoute required="pos.users.edit_users">
                            <AdminUserEdit />
                        </PermissionRoute>
                    } />
                    
                    {/* User Groups Management */}
                    <Route path="user-groups" element={
                        <PermissionRoute anyOf={['pos.user_groups.view_users_groups']}>
                            <AdminUserGroupsIndex />
                        </PermissionRoute>
                    } />
                    <Route path="user-groups/create" element={
                        <PermissionRoute anyOf={['pos.user_groups.create_users_groups']}>
                            <AdminUserGroupCreate />
                        </PermissionRoute>
                    } />
                    <Route path="user-groups/:id" element={
                        <PermissionRoute anyOf={['pos.user_groups.view_users_groups']}>
                            <AdminUserGroupView />
                        </PermissionRoute>
                    } />
                    <Route path="user-groups/:id/edit" element={
                        <PermissionRoute anyOf={USER_GROUP_EDIT_PERMISSIONS}>
                            <AdminUserGroupEdit />
                        </PermissionRoute>
                    } />
                    
                    {/* Terminal Management */}
                    <Route path="terminals" element={
                        <PermissionRoute required="pos.terminals.view_terminals">
                            <AdminTerminalsIndex />
                        </PermissionRoute>
                    } />
                    <Route path="terminals/create" element={
                        <PermissionRoute required="pos.terminals.create_terminals">
                            <AdminTerminalCreate />
                        </PermissionRoute>
                    } />
                    <Route path="terminals/:id" element={
                        <PermissionRoute required="pos.terminals.view_terminals">
                            <AdminTerminalView />
                        </PermissionRoute>
                    } />
                    <Route path="terminals/:id/edit" element={
                        <PermissionRoute required="pos.terminals.edit_terminals">
                            <AdminTerminalEdit />
                        </PermissionRoute>
                    } />
                    
                    {/* Terminal Groups Management */}
                    <Route path="terminal-groups" element={
                        <PermissionRoute required="pos.terminal_groups.view_terminal_assignments">
                            <AdminTerminalGroupsIndex />
                        </PermissionRoute>
                    } />
                    <Route path="terminal-groups/create" element={
                        <PermissionRoute required="pos.terminal_groups.assign_terminals">
                            <AdminTerminalGroupCreate />
                        </PermissionRoute>
                    } />
                    <Route path="terminal-groups/:id" element={
                        <PermissionRoute required="pos.terminal_groups.view_terminal_assignments">
                            <AdminTerminalGroupView />
                        </PermissionRoute>
                    } />
                    <Route path="terminal-groups/:id/edit" element={
                        <PermissionRoute required="pos.terminal_groups.edit_terminal_assignments">
                            <AdminTerminalGroupEdit />
                        </PermissionRoute>
                    } />
                    
                    {/* Customer Management */}
                    <Route path="customers" element={
                        <PermissionRoute required="sales.customers.view_customers">
                            <AdminCustomersIndex />
                        </PermissionRoute>
                    } />
                    <Route path="customers/create" element={
                        <PermissionRoute required="sales.customers.create_customers">
                            <AdminCustomerCreate />
                        </PermissionRoute>
                    } />
                    <Route path="customers/:id" element={
                        <PermissionRoute required="sales.customers.view_customers">
                            <AdminCustomerView />
                        </PermissionRoute>
                    } />
                    <Route path="customers/:id/edit" element={
                        <PermissionRoute required="sales.customers.edit_customers">
                            <AdminCustomerEdit />
                        </PermissionRoute>
                    } />
                    
                    {/* Transaction Management */}
                    <Route path="transactions" element={
                        <PermissionRoute required="pos.transactions.view_transactions">
                            <AdminTransactionsIndex />
                        </PermissionRoute>
                    } />
                    <Route path="transactions/:id" element={
                        <PermissionRoute required="pos.transactions.view_transactions">
                            <AdminTransactionDetail />
                        </PermissionRoute>
                    } />
                    <Route path="service-transactions" element={
                        <PermissionRoute required="pos.transactions.view_transactions">
                            <AdminServiceTransactionsIndex />
                        </PermissionRoute>
                    } />
                    <Route path="service-transactions/:id" element={
                        <PermissionRoute required="pos.transactions.view_transactions">
                            <AdminServiceTransactionDetail />
                        </PermissionRoute>
                    } />
                    
                    {/* Settlement Management */}
                    <Route path="settlements" element={
                        <PermissionRoute required="pos.settlements.view_settlements">
                            <AdminSettlementsIndex />
                        </PermissionRoute>
                    } />
                    <Route path="settlements/:id" element={
                        <PermissionRoute required="pos.settlements.view_settlements">
                            <AdminSettlementDetail />
                        </PermissionRoute>
                    } />
                    
                    {/* Batch Management */}
                    <Route path="batches" element={
                        <PermissionRoute required="pos.batches.view_batches">
                            <AdminBatchesIndex />
                        </PermissionRoute>
                    } />
                    <Route path="batches/:id" element={
                        <PermissionRoute required="pos.batches.view_batches">
                            <AdminBatchDetail />
                        </PermissionRoute>
                    } />

                    {/* System Administration - Plans */}
                    <Route path="plans" element={<AdminPlansIndex />} />
                    <Route path="plans/create" element={<AdminPlanCreate />} />
                    <Route path="plans/:id" element={<AdminPlanShow />} />
                    <Route path="plans/:id/edit" element={<AdminPlanEdit />} />
                    <Route path="plans/report" element={<AdminPlanReport />} />

                    {/* System Administration - Roles */}
                    <Route path="system/roles" element={
                        <PermissionRoute required="pos.roles.view_roles">
                            <AdminRolesIndex />
                        </PermissionRoute>
                    } />
                    <Route path="system/roles/create" element={
                        <PermissionRoute required="pos.roles.create_roles">
                            <AdminRoleCreate />
                        </PermissionRoute>
                    } />
                    <Route path="system/roles/:id" element={
                        <PermissionRoute required="pos.roles.view_roles">
                            <AdminRoleView />
                        </PermissionRoute>
                    } />
                    <Route path="system/roles/:id/edit" element={
                        <PermissionRoute required="pos.roles.edit_roles">
                            <AdminRoleEdit />
                        </PermissionRoute>
                    } />

                    {/* System Administration - Admins */}
                    <Route path="system/admins" element={
                        <PermissionRoute required="pos.admins.view_admins">
                            <AdminAdminsIndex />
                        </PermissionRoute>
                    } />
                    <Route path="system/admins/create" element={
                        <PermissionRoute required="pos.admins.create_admins">
                            <AdminAdminCreate />
                        </PermissionRoute>
                    } />
                    <Route path="system/admins/:id" element={
                        <PermissionRoute required="pos.admins.view_admins">
                            <AdminAdminView />
                        </PermissionRoute>
                    } />
                    <Route path="system/admins/:id/edit" element={
                        <PermissionRoute required="pos.admins.edit_admins">
                            <AdminAdminEdit />
                        </PermissionRoute>
                    } />

                    {/* System Administration - Countries */}
                    <Route path="system/countries" element={
                        <PermissionRoute required="pos.countries.view_countries">
                            <AdminCountriesIndex />
                        </PermissionRoute>
                    } />
                    <Route path="system/countries/create" element={
                        <PermissionRoute required="pos.countries.create_countries">
                            <AdminCountryCreate />
                        </PermissionRoute>
                    } />
                    <Route path="system/countries/:id" element={
                        <PermissionRoute required="pos.countries.view_countries">
                            <AdminCountryView />
                        </PermissionRoute>
                    } />
                    <Route path="system/countries/:id/edit" element={
                        <PermissionRoute required="pos.countries.edit_countries">
                            <AdminCountryEdit />
                        </PermissionRoute>
                    } />

                    {/* System Administration - Cities */}
                    <Route path="system/cities" element={
                        <PermissionRoute required="pos.cities.view_cities">
                            <AdminCitiesIndex />
                        </PermissionRoute>
                    } />
                    <Route path="system/cities/create" element={
                        <PermissionRoute required="pos.cities.create_cities">
                            <AdminCityCreate />
                        </PermissionRoute>
                    } />
                    <Route path="system/cities/:id" element={
                        <PermissionRoute required="pos.cities.view_cities">
                            <AdminCityView />
                        </PermissionRoute>
                    } />
                    <Route path="system/cities/:id/edit" element={
                        <PermissionRoute required="pos.cities.edit_cities">
                            <AdminCityEdit />
                        </PermissionRoute>
                    } />

                    {/* System Administration - Advertisements */}
                    <Route path="system/advertisements" element={
                        <AdminAdvertisementsIndex />
                    } />
                    <Route path="system/advertisements/create" element={
                        <AdminAdvertisementCreate />
                    } />
                    <Route path="system/advertisements/:id" element={
                        <AdminAdvertisementView />
                    } />
                    <Route path="system/advertisements/:id/edit" element={
                        <AdminAdvertisementEdit />
                    } />

                    {/* Notifications Management (no permissions required) */}
                    <Route path="system/notifications" element={
                        <AdminNotificationsIndex />
                    } />
                    <Route path="system/notifications/create" element={
                        <AdminNotificationForm />
                    } />
                    <Route path="system/notifications/:id/edit" element={
                        <AdminNotificationForm />
                    } />

                    {/* System Administration - Payment Gateways */}
                    <Route path="payment-gateways" element={<AdminPaymentGatewaysIndex />} />
                    <Route path="payment-gateways/create" element={<AdminPaymentGatewayCreate />} />
                    <Route path="payment-gateways/:id" element={<AdminPaymentGatewayView />} />
                    <Route path="payment-gateways/:id/edit" element={<AdminPaymentGatewayEdit />} />

                    {/* Settings Management - Service Fees */}
                    <Route path="settings/service-fees" element={<AdminServiceFeesIndex />} />
                    <Route path="settings/service-fees/create" element={<AdminServiceFeeCreate />} />
                    <Route path="settings/service-fees/:id" element={<AdminServiceFeeView />} />
                    <Route path="settings/service-fees/:id/edit" element={<AdminServiceFeeEdit />} />

                    {/* Settings Management - Currencies */}
                    <Route path="settings/currencies" element={
                        <PermissionRoute required="pos.currencies.view_currencies">
                            <AdminCurrenciesIndex />
                        </PermissionRoute>
                    } />
                    <Route path="settings/currencies/create" element={
                        <PermissionRoute required="pos.currencies.create_currencies">
                            <AdminCurrencyCreate />
                        </PermissionRoute>
                    } />
                    <Route path="settings/currencies/:id" element={
                        <PermissionRoute required="pos.currencies.view_currencies">
                            <AdminCurrencyView />
                        </PermissionRoute>
                    } />
                    <Route path="settings/currencies/:id/edit" element={
                        <PermissionRoute required="pos.currencies.edit_currencies">
                            <AdminCurrencyEdit />
                        </PermissionRoute>
                    } />

                    {/* Settings Management - Contract Terms */}
                    <Route path="settings/contract-terms" element={<AdminContractTermsIndex />} />
                    
                    {/* Sales Module - All routes under /admin/sales/ */}
                    <Route path="sales">
                        {/* Products Management */}
                        <Route path="tags" element={
                            <PermissionRoute required="sales.tags.view_tags">
                                <AdminTagsIndex />
                            </PermissionRoute>
                        } />
                        <Route path="tags/:id" element={
                            <PermissionRoute required="sales.tags.view_tags">
                                <AdminTagView />
                            </PermissionRoute>
                        } />
                        <Route path="taxes" element={
                            <PermissionRoute required="sales.taxes.view_taxes">
                                <AdminTaxesIndex />
                            </PermissionRoute>
                        } />
                        <Route path="coupons" element={
                            <PermissionRoute required="sales.taxes.view_taxes">
                                <AdminCouponsIndex />
                            </PermissionRoute>
                        } />
                        <Route path="taxes/:id" element={
                            <PermissionRoute required="sales.taxes.view_taxes">
                                <AdminTaxView />
                            </PermissionRoute>
                        } />
                        <Route path="categories" element={
                            <PermissionRoute required="sales.categories.view_categories">
                                <AdminCategoriesIndex />
                            </PermissionRoute>
                        } />
                        <Route path="categories/:id" element={
                            <PermissionRoute required="sales.categories.view_categories">
                                <AdminCategoryView />
                            </PermissionRoute>
                        } />
                        <Route path="brands" element={
                            <PermissionRoute required="sales.brands.view_brands">
                                <AdminBrandsIndex />
                            </PermissionRoute>
                        } />
                        <Route path="brands/:id" element={
                            <PermissionRoute required="sales.brands.view_brands">
                                <AdminBrandView />
                            </PermissionRoute>
                        } />
                        <Route path="units" element={
                            <PermissionRoute required="sales.units.view_units">
                                <AdminUnitsIndex />
                            </PermissionRoute>
                        } />
                        <Route path="units/:id" element={
                            <PermissionRoute required="sales.units.view_units">
                                <AdminUnitView />
                            </PermissionRoute>
                        } />
                        <Route path="products" element={
                            <PermissionRoute required="sales.products.view_products">
                                <AdminProductsIndex />
                            </PermissionRoute>
                        } />
                        <Route path="products/:id" element={
                            <PermissionRoute required="sales.products.view_products">
                                <AdminProductView />
                            </PermissionRoute>
                        } />
                        <Route path="warehouses" element={
                            <PermissionRoute required="sales.warehouse.view_warehouse">
                                <AdminWarehousesIndex />
                            </PermissionRoute>
                        } />
                        <Route path="warehouses/:id" element={
                            <PermissionRoute required="sales.warehouse.view_warehouse">
                                <AdminWarehouseView />
                            </PermissionRoute>
                        } />
                        
                        {/* Sales Management */}
                        <Route path="sales-list" element={
                            <PermissionRoute required="sales.sales.view_sales">
                                <AdminSalesIndex />
                            </PermissionRoute>
                        } />
                        <Route path="sales-list/:id" element={
                            <PermissionRoute required="sales.sales.view_sales">
                                <AdminSaleView />
                            </PermissionRoute>
                        } />
                        <Route path="drafts" element={
                            <PermissionRoute required="sales.orders.view_orders">
                                <AdminDraftsIndex />
                            </PermissionRoute>
                        } />
                        <Route path="drafts/:id" element={
                            <PermissionRoute required="sales.orders.view_orders">
                                <AdminDraftView />
                            </PermissionRoute>
                        } />
                        <Route path="returns" element={
                            <PermissionRoute required="sales.sales.return_sales">
                                <AdminReturnsIndex />
                            </PermissionRoute>
                        } />
                        <Route path="returns/:id" element={
                            <PermissionRoute required="sales.sales.return_sales">
                                <AdminReturnView />
                            </PermissionRoute>
                        } />
                        
                        {/* Purchase Management */}
                        <Route path="purchases" element={
                            <PermissionRoute required="sales.purchases.view_purchases">
                                <AdminPurchasesIndex />
                            </PermissionRoute>
                        } />
                        <Route path="purchases/:id" element={
                            <PermissionRoute required="sales.purchases.view_purchases">
                                <AdminPurchaseView />
                            </PermissionRoute>
                        } />
                        
                        {/* Sales Reports */}
                        <Route path="reports">
                            <Route path="sales" element={
                                <PermissionRoute required="sales.reports.view_sales_reports">
                                    <AdminSalesReport />
                                </PermissionRoute>
                            } />
                            <Route path="purchases" element={
                                <PermissionRoute required="sales.reports.view_inventory_reports">
                                    <AdminPurchaseReport />
                                </PermissionRoute>
                            } />
                            <Route path="products" element={
                                <PermissionRoute required="sales.reports.view_product_reports">
                                    <AdminProductsReport />
                                </PermissionRoute>
                            } />
                            <Route index element={<Navigate to="/admin/sales/reports/sales" replace />} />
                        </Route>
                    </Route>
                </Route>

                {/* Global Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            
            {/* Toast Container for notifications */}
            <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop={true}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
            />
            </BrowserRouter>
        </QueryClientProvider>
    );
}

export default App;

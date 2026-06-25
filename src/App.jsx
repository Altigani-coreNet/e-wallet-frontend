import React, { Suspense, lazy, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useParams } from 'react-router-dom';
import LocaleSyncOutlet from './i18n/LocaleSyncOutlet';
import RootLangRedirect from './i18n/RootLangRedirect';
import NoLocaleFallback from './i18n/NoLocaleFallback';
import LocalizedNavigate from './i18n/LocalizedNavigate';
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
            gcTime: 10 * 60 * 1000, // 10 minutes
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
import CustomerSetPassword from './components/auth/customer/CustomerSetPassword';

// Layout Components
import MainLayout from './components/layout/MainLayout';
import ProtectedRoute from './components/common/ProtectedRoute';
import PermissionRoute from './components/common/PermissionRoute';

// Public Pages
import LandingPage from './pages/LandingPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import Error401 from './pages/Error401';
import Error404 from './pages/Error404';
import Error500 from './pages/Error500';
import PaymentError from './pages/PaymentError';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentCancel from './pages/PaymentCancel';
import TestLogoLoader from './pages/TestLogoLoader';
import MerchantPublicProfile from './components/payment-links/MerchantPublicProfile';

function PageLoader() {
    return (
        <div
            className="d-flex align-items-center justify-content-center"
            style={{ minHeight: '40vh' }}
            aria-busy="true"
            aria-live="polite"
        >
            <span className="spinner-border text-primary" role="status" />
        </div>
    );
}

function withRouteSuspense(LazyComponent) {
    return function RouteSuspenseWrapper(props) {
        return (
            <Suspense fallback={<PageLoader />}>
                <LazyComponent {...props} />
            </Suspense>
        );
    };
}

/** Stripe lives only in these chunks — not in the main app bundle */
const PaymentLinkRedirect = lazy(() => import('./components/payment-links/PaymentLinkRedirect'));
const PaymentLinkRedirectV2 = lazy(() => import('./components/payment-links/PaymentLinkRedirectV2'));
const AdminRoutesLazy = lazy(() => import('./routes/AdminRoutesLazy'));
const SalesDashboard = withRouteSuspense(lazy(() => import('./components/sales/SalesDashboard')));
const PosIndex = withRouteSuspense(lazy(() => import('./components/sales/pos/PosIndex')));
const Products = withRouteSuspense(lazy(() => import('./components/sales/products/Products')));
const ProductCreate = withRouteSuspense(lazy(() => import('./components/sales/products/ProductCreate')));
const ProductEdit = withRouteSuspense(lazy(() => import('./components/sales/products/ProductEdit')));
const ProductShow = withRouteSuspense(lazy(() => import('./components/sales/products/ProductShow')));
const ProductImport = withRouteSuspense(lazy(() => import('./components/sales/products/ProductImport')));
const SalesReport = withRouteSuspense(lazy(() => import('./components/sales/reports/SalesReport')));
const PurchaseReport = withRouteSuspense(lazy(() => import('./components/sales/reports/PurchaseReport')));
const ProductsReport = withRouteSuspense(lazy(() => import('./components/sales/reports/ProductsReport')));
const SalesIndex = withRouteSuspense(lazy(() => import('./components/sales/sales-report/SalesIndex')));
const DraftsIndex = withRouteSuspense(lazy(() => import('./components/sales/sales-report/DraftsIndex')));
const ReturnsIndex = withRouteSuspense(lazy(() => import('./components/sales/sales-report/ReturnsIndex')));
const SaleView = withRouteSuspense(lazy(() => import('./components/sales/sales-report/SaleView')));
const ReturnSalePage = withRouteSuspense(lazy(() => import('./components/sales/sales-report/ReturnSalePage')));
const Tags = withRouteSuspense(lazy(() => import('./components/sales/inventory/Tags')));
const Taxes = withRouteSuspense(lazy(() => import('./components/sales/inventory/Taxes')));
const Categories = withRouteSuspense(lazy(() => import('./components/sales/inventory/Categories')));
const Brands = withRouteSuspense(lazy(() => import('./components/sales/inventory/Brands')));
const Units = withRouteSuspense(lazy(() => import('./components/sales/inventory/Units')));
const Warehouse = withRouteSuspense(lazy(() => import('./components/sales/inventory/Warehouse')));
const WarehouseCreate = withRouteSuspense(lazy(() => import('./components/sales/inventory/WarehouseCreate')));
const WarehouseEdit = withRouteSuspense(lazy(() => import('./components/sales/inventory/WarehouseEdit')));
const WarehouseView = withRouteSuspense(lazy(() => import('./components/sales/inventory/WarehouseView')));
const PurchasesIndex = withRouteSuspense(lazy(() => import('./components/sales/purchases/PurchasesIndex')));
const PurchaseCreate = withRouteSuspense(lazy(() => import('./components/sales/purchases/PurchaseCreate')));
const PurchaseEdit = withRouteSuspense(lazy(() => import('./components/sales/purchases/PurchaseEdit')));
const PurchaseView = withRouteSuspense(lazy(() => import('./components/sales/purchases/PurchaseView')));
const SuppliersIndex = withRouteSuspense(lazy(() => import('./components/sales/suppliers/SuppliersIndex')));
const SupplierCreate = withRouteSuspense(lazy(() => import('./components/sales/suppliers/SupplierCreate')));
const SupplierEdit = withRouteSuspense(lazy(() => import('./components/sales/suppliers/SupplierEdit')));
const SupplierView = withRouteSuspense(lazy(() => import('./components/sales/suppliers/SupplierView')));

function PaymentCheckoutRouteFallback() {
    return (
        <div
            className="d-flex align-items-center justify-content-center"
            style={{ minHeight: '100vh' }}
            aria-busy="true"
            aria-live="polite"
        >
            <span className="spinner-border text-primary" role="status" />
        </div>
    );
}

// Dashboard Components
import MerchantDashboard from './components/merchant/MerchantDashboard';
import InvoicePrint from './components/sales/InvoicePrint';

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

// Roles Components
import RolesIndex from './components/roles/RolesIndex';
import RoleCreate from './components/roles/RoleCreate';
import RoleEdit from './components/roles/RoleEdit';
import RoleView from './components/roles/RoleView';

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

// Supplier Components — lazy-loaded above

// Purchase Components — lazy-loaded above

// Profile Components
import Profile from './components/profile/Profile';

// Sales Reports Components — lazy-loaded above

// Sales Report (Sales/Drafts/Returns) Components — lazy-loaded above

// Sales Inventory Components — lazy-loaded above

import CouponsIndex from './components/merchant/coupons/CouponsIndex';

// Auth Store
import useAuthStore from './stores/authStore';

// Toolbar Context
import { ToolbarProvider } from './contexts/ToolbarContext';

import AdminLogin from './components/admin/auth/AdminLogin';
import AdminInvoicePrint from './components/admin/invoices/AdminInvoicePrint';
import PosInvoicePrint from './components/pos/PosInvoicePrint';
import PosLinkInvoicePrint from './components/pos/PosLinkInvoicePrint';
import { pathnameIsUnderAdmin, resolveAdminLoginUrl } from './i18n/localePaths';

// Placeholder component for not implemented pages
function PlaceholderPage({ titleKey }) {
    const { t } = useTranslation();
    return (
        <div className="card">
            <div className="card-body text-center py-20">
                <h2 className="mb-5">{t(titleKey)}</h2>
                <p className="text-muted">{t('app.placeholder.softposMessage')}</p>
            </div>
        </div>
    );
}

function SalesUsersRedirect({ mode = 'index' }) {
    const { id } = useParams();

    if (mode === 'create') {
        return <LocalizedNavigate to="/merchant/users/create" />;
    }

    if (mode === 'edit' && id) {
        return <LocalizedNavigate to={`/merchant/users/${id}/edit`} />;
    }

    if (mode === 'view' && id) {
        return <LocalizedNavigate to={`/merchant/users/${id}`} />;
    }

    return <LocalizedNavigate to="/merchant/users" />;
}

function App() {
    const { i18n } = useTranslation();
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
                (pathnameIsUnderAdmin(window.location.pathname) ? resolveAdminLoginUrl(window.location.pathname) : '/login');
            
            // Clear auth store to prevent redirect loop
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
            {/* Public: admin-created customers set their own password via invite link */}
            <Route path="/customer/set-password/:token" element={<CustomerSetPassword />} />


            {/* Public Invoice Routes - No Authentication Required */}
            {/* POS (cashier) sale invoice */}
            <Route path="/invoice/:id" element={<AdminInvoicePrint />} />
            {/* SoftPOS card transaction invoice (POS device) */}
            <Route path="/pos-invoice/:id" element={<PosInvoicePrint />} />
            {/* Payment-link invoice by UUID */}
            <Route path="/link-invoice/:uuid" element={<PosLinkInvoicePrint />} />

            {/* Admin Protected Routes */}
                <Route path="/admin/*" element={
                    <Suspense fallback={<PageLoader />}>
                        <AdminRoutesLazy />
                    </Suspense>
                } />

            <Route path="/" element={<RootLangRedirect />} />
            <Route path="/:lang" element={<LocaleSyncOutlet />}>
                        <Route index element={<LandingPage />} />
                        <Route path="privacy" element={<PrivacyPage />} />
                        <Route path="terms" element={<TermsPage />} />
                        <Route path="test-logo" element={<TestLogoLoader />} />
                        <Route path="test-loader" element={<TestLogoLoader />} />
                        <Route path="payment/error/:uuid" element={<PaymentError />} />
                        <Route path="payments/error/:uuid" element={<PaymentError />} />
                        <Route path="payment/success/:uuid" element={<PaymentSuccess />} />
                        <Route path="payments/success/:uuid" element={<PaymentSuccess />} />
                        <Route path="payments/cancel/:uuid" element={<PaymentCancel />} />
                        <Route path="payment/error" element={<PaymentError />} />
                        <Route path="payments/error" element={<PaymentError />} />
                        <Route path="payment/success" element={<PaymentSuccess />} />
                        <Route path="payments/success" element={<PaymentSuccess />} />
                        <Route path="payments/merchant/:merchantUuid" element={<MerchantPublicProfile />} />
                        <Route path="payments" element={
                            <Suspense fallback={<PaymentCheckoutRouteFallback />}>
                                <PaymentLinkRedirect />
                            </Suspense>
                        } />
                        <Route path="payments/:uuid" element={
                            <Suspense fallback={<PaymentCheckoutRouteFallback />}>
                                <PaymentLinkRedirect />
                            </Suspense>
                        } />
                        <Route path="v2/payments" element={
                            <Suspense fallback={<PaymentCheckoutRouteFallback />}>
                                <PaymentLinkRedirectV2 />
                            </Suspense>
                        } />
                        <Route path="v2/payments/:uuid" element={
                            <Suspense fallback={<PaymentCheckoutRouteFallback />}>
                                <PaymentLinkRedirectV2 />
                            </Suspense>
                        } />

                        <Route path="admin/login" element={<AdminLogin />} />
                        <Route path="admin/*" element={
                            <Suspense fallback={<PageLoader />}>
                                <AdminRoutesLazy />
                            </Suspense>
                        } />

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
                        <Route path="roles" element={
                            <PermissionRoute anyOf={['pos.roles.view_roles', 'view_roles']}>
                                <RolesIndex />
                            </PermissionRoute>
                        } />
                        <Route path="roles/create" element={
                            <PermissionRoute anyOf={['pos.roles.create_roles', 'create_roles']}>
                                <RoleCreate />
                            </PermissionRoute>
                        } />
                        <Route path="roles/:id/edit" element={<RoleEdit />} />
                        <Route path="roles/:id" element={<RoleView />} />
                        
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
                        
                        <Route path="orders" element={<PlaceholderPage titleKey="app.placeholder.orders" />} />
                        
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
                        
                        {/* Users routes moved to merchant scope; keep redirects for old sales URLs */}
                        <Route path="users" element={<SalesUsersRedirect mode="index" />} />
                        <Route path="users/create" element={<SalesUsersRedirect mode="create" />} />
                        <Route path="users/:id/edit" element={<SalesUsersRedirect mode="edit" />} />
                        <Route path="users/:id" element={<SalesUsersRedirect mode="view" />} />
                        {/* Roles Routes - COMMENTED OUT (Not needed) */}
                        {/* <Route path="roles" element={<RolesIndex />} />
                        <Route path="roles/create" element={<RoleCreate />} />
                        <Route path="roles/:id/edit" element={<RoleEdit />} />
                        <Route path="roles/:id" element={<RoleView />} /> */}
                        
                        {/* Branches (Sales) */}
                        <Route path="branches" element={<PlaceholderPage titleKey="app.placeholder.branches" />} />
                        <Route path="branches/create" element={<PlaceholderPage titleKey="app.placeholder.createBranch" />} />
                        <Route path="branches/:id" element={<PlaceholderPage titleKey="app.placeholder.branchDetails" />} />
                        <Route path="branches/:id/edit" element={<PlaceholderPage titleKey="app.placeholder.editBranch" />} />
                        
                        {/* Redirect sales root to dashboard */}
                        <Route index element={<LocalizedNavigate to="/sales/dashboard" />} />
                    </Route>
                    
                    {/* Catch-all redirect */}
                    <Route path="*" element={<LocalizedNavigate to="/merchant/dashboard" />} />
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
                rtl={i18n.dir() === 'rtl'}
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

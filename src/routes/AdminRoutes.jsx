import React from 'react';
import { Route, Navigate } from 'react-router-dom';
import AdminProtectedRoute from '../components/common/AdminProtectedRoute';
import PermissionRoute from '../components/common/PermissionRoute';
import { USER_GROUP_EDIT_PERMISSIONS } from '../utils/permissions';
import { ToolbarProvider } from '../contexts/ToolbarContext';
import { AdminNavigationProvider } from '../contexts/AdminNavigationContext';
import AdminLayout from '../components/admin/layout/AdminLayout';
import AdminDashboard from '../components/admin/AdminDashboard';
import AdminMerchantsIndex from '../components/admin/merchants/AdminMerchantsIndex';
import AdminMerchantCreate from '../components/admin/merchants/AdminMerchantCreate';
import AdminMerchantView from '../components/admin/merchants/AdminMerchantView';
import AdminMerchantEdit from '../components/admin/merchants/AdminMerchantEdit';
import AdminMerchantEvents from '../components/admin/merchants/AdminMerchantEvents';
import AdminMerchantTransactions from '../components/admin/merchants/AdminMerchantTransactions';
import AdminMerchantBranches from '../components/admin/merchants/AdminMerchantBranches';
import AdminMerchantTerminals from '../components/admin/merchants/AdminMerchantTerminals';
import AdminMerchantUsers from '../components/admin/merchants/AdminMerchantUsers';
import AdminMerchantAttachments from '../components/admin/merchants/AdminMerchantAttachments';
import AdminMerchantChangeRequests from '../components/admin/merchants/AdminMerchantChangeRequests';
import AdminChangeRequestsIndex from '../components/admin/change-requests/AdminChangeRequestsIndex';
import AdminChangeRequestView from '../components/admin/change-requests/AdminChangeRequestView';
import AdminBranchesIndex from '../components/admin/branches/AdminBranchesIndex';
import AdminBranchCreate from '../components/admin/branches/AdminBranchCreate';
import AdminBranchEdit from '../components/admin/branches/AdminBranchEdit';
import AdminBranchView from '../components/admin/branches/AdminBranchView';
import AdminUsersIndex from '../components/admin/users/AdminUsersIndex';
import AdminUserCreate from '../components/admin/users/AdminUserCreate';
import AdminUserEdit from '../components/admin/users/AdminUserEdit';
import AdminUserView from '../components/admin/users/AdminUserView';
import AdminUserGroupsIndex from '../components/admin/user-groups/AdminUserGroupsIndex';
import AdminUserGroupCreate from '../components/admin/user-groups/AdminUserGroupCreate';
import AdminUserGroupEdit from '../components/admin/user-groups/AdminUserGroupEdit';
import AdminUserGroupView from '../components/admin/user-groups/AdminUserGroupView';
import AdminTerminalsIndex from '../components/admin/terminals/AdminTerminalsIndex';
import AdminTerminalCreate from '../components/admin/terminals/AdminTerminalCreate';
import AdminTerminalEdit from '../components/admin/terminals/AdminTerminalEdit';
import AdminTerminalView from '../components/admin/terminals/AdminTerminalView';
import AdminTerminalGroupsIndex from '../components/admin/terminal-groups/AdminTerminalGroupsIndex';
import AdminTerminalGroupCreate from '../components/admin/terminal-groups/AdminTerminalGroupCreate';
import AdminTerminalGroupEdit from '../components/admin/terminal-groups/AdminTerminalGroupEdit';
import AdminTerminalGroupView from '../components/admin/terminal-groups/AdminTerminalGroupView';
import AdminCustomersIndex from '../components/admin/customers/AdminCustomersIndex';
import AdminCustomerCreate from '../components/admin/customers/AdminCustomerCreate';
import AdminCustomerView from '../components/admin/customers/AdminCustomerView';
import AdminCustomerEdit from '../components/admin/customers/AdminCustomerEdit';
import AdminTransactionsIndex from '../components/admin/transactions/AdminTransactionsIndex';
import AdminTransactionDetail from '../components/admin/transactions/AdminTransactionDetail';
import AdminServiceTransactionsIndex from '../components/admin/service-transactions/AdminServiceTransactionsIndex';
import AdminServiceTransactionDetail from '../components/admin/service-transactions/AdminServiceTransactionDetail';
import AdminSettlementsIndex from '../components/admin/settlements/AdminSettlementsIndex';
import AdminSettlementDetail from '../components/admin/settlements/AdminSettlementDetail';
import AdminBatchesIndex from '../components/admin/batches/AdminBatchesIndex';
import AdminBatchDetail from '../components/admin/batches/AdminBatchDetail';
import AdminNotificationsIndex from '../components/admin/notifications/AdminNotificationsIndex';
import AdminNotificationForm from '../components/admin/notifications/AdminNotificationForm';
import AdminPlansIndex from '../components/admin/plans/AdminPlansIndex';
import AdminPlanCreate from '../components/admin/plans/AdminPlanCreate';
import AdminPlanEdit from '../components/admin/plans/AdminPlanEdit';
import AdminPlanShow from '../components/admin/plans/AdminPlanShow';
import AdminPlanReport from '../components/admin/plans/AdminPlanReport';
import AdminRolesIndex from '../components/admin/system/roles/AdminRolesIndex';
import AdminRoleCreate from '../components/admin/system/roles/AdminRoleCreate';
import AdminRoleEdit from '../components/admin/system/roles/AdminRoleEdit';
import AdminRoleView from '../components/admin/system/roles/AdminRoleView';
import AdminAdminsIndex from '../components/admin/system/admins/AdminAdminsIndex';
import AdminAdminCreate from '../components/admin/system/admins/AdminAdminCreate';
import AdminAdminEdit from '../components/admin/system/admins/AdminAdminEdit';
import AdminAdminView from '../components/admin/system/admins/AdminAdminView';
import AdminCountriesIndex from '../components/admin/system/countries/AdminCountriesIndex';
import AdminCountryCreate from '../components/admin/system/countries/AdminCountryCreate';
import AdminCountryEdit from '../components/admin/system/countries/AdminCountryEdit';
import AdminCountryView from '../components/admin/system/countries/AdminCountryView';
import AdminCitiesIndex from '../components/admin/system/cities/AdminCitiesIndex';
import AdminCityCreate from '../components/admin/system/cities/AdminCityCreate';
import AdminCityEdit from '../components/admin/system/cities/AdminCityEdit';
import AdminCityView from '../components/admin/system/cities/AdminCityView';
import AdminAdvertisementsIndex from '../components/admin/system/advertisements/AdminAdvertisementsIndex';
import AdminAdvertisementCreate from '../components/admin/system/advertisements/AdminAdvertisementCreate';
import AdminAdvertisementEdit from '../components/admin/system/advertisements/AdminAdvertisementEdit';
import AdminAdvertisementView from '../components/admin/system/advertisements/AdminAdvertisementView';
import AdminPaymentGatewaysIndex from '../components/admin/payment-gateways/AdminPaymentGatewaysIndex';
import AdminPaymentGatewayCreate from '../components/admin/payment-gateways/AdminPaymentGatewayCreate';
import AdminPaymentGatewayEdit from '../components/admin/payment-gateways/AdminPaymentGatewayEdit';
import AdminPaymentGatewayView from '../components/admin/payment-gateways/AdminPaymentGatewayView';
import AdminServiceFeesIndex from '../components/admin/settings/service-fees/AdminServiceFeesIndex';
import AdminServiceFeeCreate from '../components/admin/settings/service-fees/AdminServiceFeeCreate';
import AdminServiceFeeEdit from '../components/admin/settings/service-fees/AdminServiceFeeEdit';
import AdminServiceFeeView from '../components/admin/settings/service-fees/AdminServiceFeeView';
import AdminCurrenciesIndex from '../components/admin/settings/currencies/AdminCurrenciesIndex';
import AdminCurrencyCreate from '../components/admin/settings/currencies/AdminCurrencyCreate';
import AdminCurrencyEdit from '../components/admin/settings/currencies/AdminCurrencyEdit';
import AdminCurrencyView from '../components/admin/settings/currencies/AdminCurrencyView';
import AdminContractTermsIndex from '../components/admin/settings/contract-terms/AdminContractTermsIndex';
import AdminTagsIndex from '../components/admin/tags/AdminTagsIndex';
import AdminTagView from '../components/admin/tags/AdminTagView';
import AdminTaxesIndex from '../components/admin/taxes/AdminTaxesIndex';
import AdminTaxView from '../components/admin/taxes/AdminTaxView';
import AdminCouponsIndex from '../components/admin/coupons/AdminCouponsIndex';
import AdminCategoriesIndex from '../components/admin/categories/AdminCategoriesIndex';
import AdminCategoryView from '../components/admin/categories/AdminCategoryView';
import AdminBrandsIndex from '../components/admin/brands/AdminBrandsIndex';
import AdminBrandView from '../components/admin/brands/AdminBrandView';
import AdminUnitsIndex from '../components/admin/units/AdminUnitsIndex';
import AdminUnitView from '../components/admin/units/AdminUnitView';
import AdminProductsIndex from '../components/admin/products/AdminProductsIndex';
import AdminProductView from '../components/admin/products/AdminProductView';
import PgServiceCategoriesPage from '../pages/payment-getway/ServiceCategoriesPage';
import PgServiceSubCategoriesPage from '../pages/payment-getway/ServiceSubCategoriesPage';
import PgServicesPage from '../pages/payment-getway/ServicesPage';
import PgServiceCreate from '../pages/payment-getway/ServiceCreate';
import PgServiceEdit from '../pages/payment-getway/ServiceEdit';
import PgServiceWizard from '../pages/payment-getway/ServiceWizard';
import PgServiceShow from '../pages/payment-getway/services/ServiceShow';
import HomeScreenServicesConfigPage from '../pages/payment-getway/services/HomeScreenServicesConfigPage';
import PgServiceProducts from '../pages/payment-getway/products/ServiceProducts';
import PgGatewayProductsIndex from '../pages/payment-getway/products/Products';
import PgGatewayProductCreate from '../pages/payment-getway/products/ProductCreate';
import PgGatewayProductEdit from '../pages/payment-getway/products/ProductEdit';
import AdminEPaymentGatewayComingSoon from '../pages/payment-getway/AdminEPaymentGatewayComingSoon';
import AdminPartnersIndex from '../pages/payment-getway/AdminPartnersIndex';
import AdminSubPartnersIndex from '../pages/payment-getway/AdminSubPartnersIndex';
import AdminContentProviderCreate from '../pages/payment-getway/AdminContentProviderCreate';
import AdminContentProviderView from '../pages/payment-getway/AdminContentProviderView';
import AdminContentProviderEdit from '../pages/payment-getway/AdminContentProviderEdit';
import AdminServiceCategoryView from '../pages/payment-getway/service-categories/AdminServiceCategoryView';
import AdminWarehousesIndex from '../components/admin/warehouses/AdminWarehousesIndex';
import AdminWarehouseView from '../components/admin/warehouses/AdminWarehouseView';
import AdminSalesIndex from '../components/admin/sales/AdminSalesIndex';
import AdminSaleView from '../components/admin/sales/AdminSaleView';
import AdminDraftsIndex from '../components/admin/drafts/AdminDraftsIndex';
import AdminDraftView from '../components/admin/drafts/AdminDraftView';
import AdminReturnsIndex from '../components/admin/returns/AdminReturnsIndex';
import AdminReturnView from '../components/admin/returns/AdminReturnView';
import AdminPurchasesIndex from '../components/admin/purchases/AdminPurchasesIndex';
import AdminPurchaseView from '../components/admin/purchases/AdminPurchaseView';
import AdminSalesReport from '../components/admin/sales-report/AdminSalesReport';
import AdminPurchaseReport from '../components/admin/sales-report/AdminPurchaseReport';
import AdminProductsReport from '../components/admin/sales-report/AdminProductsReport';
import AdminPaymentLinksIndex from '../components/admin/payment-links/AdminPaymentLinksIndex';
import AdminPaymentLinkDetail from '../components/admin/payment-links/AdminPaymentLinkDetail';

/** Layout wrapper for `/admin` and `/:lang/admin` — component form avoids init/HMR issues with the route element tree. */
export function AdminLayoutOutlet() {
    return (
        <AdminProtectedRoute>
            <ToolbarProvider>
                <AdminNavigationProvider>
                    <AdminLayout />
                </AdminNavigationProvider>
            </ToolbarProvider>
        </AdminProtectedRoute>
    );
}

export const ADMIN_NESTED_ROUTES = (
    <>
            {/* Default redirect to admin dashboard */}
            <Route index element={<Navigate to="dashboard" replace />} />
            
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
            <Route path="service/category" element={<Navigate to="service/category/type/service" replace />} />
            <Route path="service/category/:id" element={<AdminServiceCategoryView />} />
            <Route path="service/sub-category" element={<Navigate to="service/sub-categories" replace />} />
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
            <Route path="customers/:uuid" element={
                <PermissionRoute required="sales.customers.view_customers">
                    <AdminCustomerView />
                </PermissionRoute>
            } />
            <Route path="customers/:uuid/edit" element={
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
                    <Route index element={<Navigate to="sales" replace />} />
                </Route>
            </Route>
                
    </>
);

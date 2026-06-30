// API Base URLs
export const BASE_DOMAIN = import.meta.env.VITE_API_BASE || 'http://193.123.83.134:91';
export const SOFTPOS_API_BASE = `${BASE_DOMAIN}/api`;
export const AUTH_SERVICE_BASE = `${BASE_DOMAIN}/api`;
export const PAYTABS_API_BASE = `${BASE_DOMAIN}/api/paytabs`;
export const POS_API_BASE = `${BASE_DOMAIN}/api/cashier`;

// Frontend Base URL
export const FRONTEND_BASE_URL = BASE_DOMAIN;
// API Version Constants
export const API_V1 = '/api/v1';
export const API_V2 = '/api/v2';

// AuthService API Endpoints
export const AUTH_ENDPOINTS = {
    // Authentication
    REGISTER: `${AUTH_SERVICE_BASE}/register`,
    LOGIN: `${AUTH_SERVICE_BASE}/login`,
    /** OAuth (Socialite): implemented on SoftPos — use same host as `SOFTPOS_API_BASE` when they differ. */
    GOOGLE_OAUTH_REDIRECT: `${SOFTPOS_API_BASE}/oauth/google`,
    /** OAuth: SPA exchanges one-time code from callback redirect for API token. */
    GOOGLE_OAUTH_EXCHANGE: `${SOFTPOS_API_BASE}/oauth/google/exchange`,
    LOGOUT: `${AUTH_SERVICE_BASE}/logout`,
    FORCE_LOGOUT: `${AUTH_SERVICE_BASE}/force-logout`,
    
    // Profile 
    PROFILE: `${AUTH_SERVICE_BASE}/profile`,
    PROFILE_ME: `${AUTH_SERVICE_BASE}/profile/me`,
    PROFILE_COMPLETION: `${AUTH_SERVICE_BASE}/profile/completion`,
    UPDATE_PROFILE: `${AUTH_SERVICE_BASE}/profile/update`,
    CHANGE_PASSWORD: `${AUTH_SERVICE_BASE}/profile/change-password`,
    UPLOAD_PROFILE_IMAGE: `${AUTH_SERVICE_BASE}/profile/upload-image`,
    DELETE_PROFILE_IMAGE: `${AUTH_SERVICE_BASE}/profile/delete-image`,
    MERCHANT_PROFILE_UPDATE: `${AUTH_SERVICE_BASE}/merchant-profile/update`,
    MERCHANT_PROFILE_REJECTED_FIELDS: `${AUTH_SERVICE_BASE}/merchant-profile/rejected-fields`,
    MERCHANT_PROFILE_UPDATE_REJECTED: `${AUTH_SERVICE_BASE}/merchant-profile/update-rejected-fields`,
    MERCHANT_PROFILE_UPDATE_ATTACHMENTS: `${AUTH_SERVICE_BASE}/merchant-profile/update-attachments`,
    MERCHANT_CURRENCY: `${AUTH_SERVICE_BASE}/merchant/currency`,
    MERCHANT_PLAN_UPGRADE: `${AUTH_SERVICE_BASE}/merchant/plan/upgrade`,
    
    // Multi-Step Registration (keep softpos/register prefix)
    REGISTER_VALIDATE: `${AUTH_SERVICE_BASE}/register/validate-details`,
    REGISTER_SEND_CODE: `${AUTH_SERVICE_BASE}/register/send-verification-code`,
    REGISTER_VERIFY_CODE: `${AUTH_SERVICE_BASE}/register/verify-code`,
    REGISTER_USER: `${AUTH_SERVICE_BASE}/register/user`,
    REGISTER_MERCHANT: `${AUTH_SERVICE_BASE}/register/merchant`,
    REGISTER_MERCHANT_UPDATE: `${AUTH_SERVICE_BASE}/register/merchant/update`,
    REGISTER_PARTNER: `${SOFTPOS_API_BASE}/register/partner`,
    REGISTER_SEND_CONTINUATION_EMAIL_MERCHANT: `${SOFTPOS_API_BASE}/register/merchant/send-continuation-email`,
    REGISTER_SEND_CONTINUATION_EMAIL_PARTNER: `${SOFTPOS_API_BASE}/register/partner/send-continuation-email`,
    
    // Password Management
    PASSWORD_REQUEST_RESET: `${AUTH_SERVICE_BASE}/password/request-reset`,
    PASSWORD_VERIFY_CODE: `${AUTH_SERVICE_BASE}/password/verify-code`,
    PASSWORD_RESET: `${AUTH_SERVICE_BASE}/password/reset`,
    PASSWORD_VALIDATE_RESET_TOKEN: `${AUTH_SERVICE_BASE}/password/reset-token/validate`,
    PASSWORD_RESET_WITH_TOKEN: `${AUTH_SERVICE_BASE}/password/reset-token`,

    // Customer set-password invite (admin-created customers)
    CUSTOMER_SET_PASSWORD_VALIDATE: `${AUTH_SERVICE_BASE}/v1/customer/set-password/validate`,
    CUSTOMER_SET_PASSWORD: `${AUTH_SERVICE_BASE}/v1/customer/set-password`,
    
    // Lookup Data
    COUNTRIES: `${AUTH_SERVICE_BASE}/countries`,
    COUNTRIES_SELECT: `${AUTH_SERVICE_BASE}/countries/select`,
    CITIES: `${AUTH_SERVICE_BASE}/cities`,
    CITIES_SELECT: `${AUTH_SERVICE_BASE}/cities/select`,
    CURRENCIES: `${AUTH_SERVICE_BASE}/currencies`,
    CURRENCIES_SELECT: `${AUTH_SERVICE_BASE}/currencies/select`,
    BUSINESS_TYPES: `${AUTH_SERVICE_BASE}/business-types`,
    BUSINESS_TYPES_SELECT: `${AUTH_SERVICE_BASE}/business-types/select`,
    
    // Contract Terms
    CONTRACT_TERMS: `${AUTH_SERVICE_BASE}/contract-terms`,
};

// SoftPOS API Endpoints
export const SOFTPOS_ENDPOINTS = {
    // Merchant Dashboard
    DASHBOARD: `${SOFTPOS_API_BASE}/v2/merchant/dashboard`,
    DASHBOARD_STATISTICS: `${SOFTPOS_API_BASE}/v2/merchant/dashboard/statistics`,
    DASHBOARD_CHARTS: `${SOFTPOS_API_BASE}/v2/merchant/dashboard/charts`,
    DASHBOARD_LATEST_TRANSACTIONS: `${SOFTPOS_API_BASE}/v2/merchant/dashboard/latest-transactions`,
    DASHBOARD_EXPORT: `${SOFTPOS_API_BASE}/v2/merchant/dashboard/export`,
    
    // Branches (using AuthService)
    BRANCHES: `${AUTH_SERVICE_BASE}/branches`,
    BRANCH_DETAILS: (id) => `${AUTH_SERVICE_BASE}/branches/${id}`,
    BRANCH_STATISTICS: `${AUTH_SERVICE_BASE}/branches/statistics`,
    BRANCH_EXPORT: `${AUTH_SERVICE_BASE}/branches/export`,
    BRANCH_BULK_DELETE: `${AUTH_SERVICE_BASE}/branches/bulk-delete`,
    BRANCH_BY_IDS: `${AUTH_SERVICE_BASE}/branches/by-ids`,
    
    // Terminals (SoftPos v1 merchant API)
    TERMINALS: `${SOFTPOS_API_BASE}/v1/merchant/terminals`,
    TERMINAL_DETAILS: (id) => `${SOFTPOS_API_BASE}/v1/merchant/terminals/${id}`,
    TERMINAL_EXPORT: `${SOFTPOS_API_BASE}/v1/merchant/terminals/export`,
    TERMINAL_BULK_DELETE: `${SOFTPOS_API_BASE}/v1/merchant/terminals/bulk-delete`,
    TERMINAL_IMPORT: `${SOFTPOS_API_BASE}/v1/merchant/terminals/import`,
    TERMINAL_IMPORT_PREVIEW: `${SOFTPOS_API_BASE}/v1/merchant/terminals/import-preview`,
    TERMINAL_EXPORT_TEMPLATE: `${SOFTPOS_API_BASE}/v1/merchant/terminals/export-template`,
    
    // Payment Links
    PAYMENT_LINKS: `${SOFTPOS_API_BASE}/v1/merchant/payment-links`,
    PAYMENT_LINK_DETAILS: (id) => `${SOFTPOS_API_BASE}/v1/merchant/payment-links/${id}`,
    PAYMENT_LINK_STATISTICS: `${SOFTPOS_API_BASE}/v1/merchant/payment-links/statistics`,
    PAYMENT_LINK_EXPORT: `${SOFTPOS_API_BASE}/v1/merchant/payment-links/export`,
    PAYMENT_LINK_BULK_DELETE: `${SOFTPOS_API_BASE}/v1/merchant/payment-links/bulk-delete`,
    PAYMENT_LINK_UPDATE_DATE: (id) => `${SOFTPOS_API_BASE}/v1/merchant/payment-links/${id}/update-date`,
    PAYMENT_LINK_SEND: (id) => `${SOFTPOS_API_BASE}/v1/merchant/payment-links/${id}/send`,
    CURRENCIES: `${SOFTPOS_API_BASE}/currencies`,
    CURRENCIES_SELECT: `${SOFTPOS_API_BASE}/currencies/select`,
    
    PAYTABS: {
        GENERATE_QR: `${PAYTABS_API_BASE}/generate-qr`,
        CHECK_STATUS: (tranRef) => `${PAYTABS_API_BASE}/status/${tranRef}`,
    },

    // Transactions
    TRANSACTIONS: `${SOFTPOS_API_BASE}/v1/merchant/transactions/data`,
    TRANSACTION_DETAILS: (id) => `${SOFTPOS_API_BASE}/v1/merchant/transactions/${id}`,
    TRANSACTION_STATISTICS: `${SOFTPOS_API_BASE}/v1/merchant/transactions/statistics`,
    TRANSACTION_EXPORT: `${SOFTPOS_API_BASE}/v1/merchant/transactions/export`,
    TRANSACTION_VOID: (id) => `${SOFTPOS_API_BASE}/v1/merchant/transactions/${id}/void`,
    TRANSACTION_REFUND: (id) => `${SOFTPOS_API_BASE}/v1/merchant/transactions/${id}/refund`,
    TRANSACTION_SEND_RECEIPT: (id) => `${SOFTPOS_API_BASE}/v1/merchant/transactions/${id}/send-receipt`,
    MERCHANT_SERVICE_DETAILS: (id) => `${SOFTPOS_API_BASE}/v1/merchant/services/${id}`,
    MERCHANT_PARTNER_DETAILS: (id) => `${SOFTPOS_API_BASE}/v1/merchant/partners/${id}`,
    // Public POS invoice (external print page, encrypted ID)
    POS_INVOICE_PUBLIC: (token) => `${SOFTPOS_API_BASE}/pos/invoice/${token}`,
    // Public payment-link invoice (external print page, UUID)
    LINK_INVOICE_PUBLIC: (uuid) => `${SOFTPOS_API_BASE}/link-invoice/${uuid}`,
    
    // Settlements
    SETTLEMENTS_DATA: `${SOFTPOS_API_BASE}/v1/merchant/settlements/data`,
    SETTLEMENT_STATISTICS: `${SOFTPOS_API_BASE}/v1/merchant/settlements/statistics`,
    SETTLEMENT_DETAILS: (id) => `${SOFTPOS_API_BASE}/v1/merchant/settlements/${id}`,
    SETTLEMENT_TRANSACTIONS_DATA: `${SOFTPOS_API_BASE}/v1/merchant/settlements/transactions/data`,
    SETTLEMENT_TRANSACTIONS_STATISTICS: `${SOFTPOS_API_BASE}/v1/merchant/settlements/transactions/statistics`,
    
    // Batches
    BATCHES_DATA: `${SOFTPOS_API_BASE}/v1/merchant/batches/data`,
    BATCH_STATISTICS: `${SOFTPOS_API_BASE}/v1/merchant/batches/statistics`,
    BATCH_DETAILS: (id) => `${SOFTPOS_API_BASE}/v1/merchant/batches/${id}`,
    
    // Contracts & Service Fees (using AuthService)
    CONTRACTS: `${AUTH_SERVICE_BASE}/contracts`,
    CONTRACTS_DOWNLOAD: `${AUTH_SERVICE_BASE}/contracts/download`,
    SERVICE_FEES: `${AUTH_SERVICE_BASE}/service-fees`,
    SERVICE_FEE_DETAILS: (id) => `${AUTH_SERVICE_BASE}/service-fees/${id}`,
    SERVICE_FEE_TYPES: `${AUTH_SERVICE_BASE}/service-fees/types`,

    // User Groups API Endpoints
    USER_GROUPS: `${AUTH_SERVICE_BASE}/user-groups`,
    USER_GROUP_DETAILS: (id) => `${AUTH_SERVICE_BASE}/user-groups/${id}`,
    USER_GROUP_SELECT: `${AUTH_SERVICE_BASE}/user-groups/select`,
    USER_GROUP_USERS: `${AUTH_SERVICE_BASE}/user-groups/merchant-users`,
    USER_GROUP_BRANCHES: `${AUTH_SERVICE_BASE}/user-groups/merchant-branches`,
    USER_GROUP_BULK_DELETE: `${AUTH_SERVICE_BASE}/user-groups/bulk-delete`,
    USER_GROUP_TOGGLE_STATUS: (id) => `${AUTH_SERVICE_BASE}/user-groups/${id}/toggle-status`,
    
    // Merchant Users Import/Export
    USERS: `${AUTH_SERVICE_BASE}/users`,
    USER_EXPORT: `${AUTH_SERVICE_BASE}/users/export`,
    USER_EXPORT_TEMPLATE: `${AUTH_SERVICE_BASE}/users/export-template`,
    USER_IMPORT_PREVIEW: `${AUTH_SERVICE_BASE}/users/import-preview`,
    USER_IMPORT: `${AUTH_SERVICE_BASE}/users/import`,
};

// POS (Sales) API Endpoints
export const POS_ENDPOINTS = {
    // Dashboard
    DASHBOARD_STATISTICS: `${POS_API_BASE}/v1/dashboard/statistics`,
    DASHBOARD_LATEST_SALES: `${POS_API_BASE}/v1/dashboard/latest-sales`,
    DASHBOARD_LATEST_PURCHASES: `${POS_API_BASE}/v1/dashboard/latest-purchases`,
    DASHBOARD_SALES_CHART: `${POS_API_BASE}/v1/dashboard/sales-chart`,
    DASHBOARD_SALES_PURCHASES_CHART: `${POS_API_BASE}/v1/dashboard/sales/chart`,
    DASHBOARD_SALES_PRINT: `${POS_API_BASE}/v1/dashboard/sales/print`,
    
    // Customers
    CUSTOMERS: `${POS_API_BASE}/v1/customers`,
    CUSTOMER_DETAILS: (id) => `${POS_API_BASE}/v1/customers/${id}`,
    CUSTOMER_SEARCH: `${POS_API_BASE}/v1/customer/search`,
    CUSTOMER_GROUPS: `${POS_API_BASE}/v1/customer/groups`,
    CUSTOMER_EXPORT: `${POS_API_BASE}/v1/customers/export`,
    CUSTOMER_EXPORT_TEMPLATE: `${POS_API_BASE}/v1/customers/export-template`,
    CUSTOMER_IMPORT_PREVIEW: `${POS_API_BASE}/v1/customers/import-preview`,
    CUSTOMER_IMPORT: `${POS_API_BASE}/v1/customers/import`,
    CUSTOMER_BULK_DELETE: `${POS_API_BASE}/v1/customers/bulk-delete`,
    
    // Products
    PRODUCTS: `${POS_API_BASE}/v2/products`,
    PRODUCT_DETAILS: (id) => `${POS_API_BASE}/v1/products/${id}`,
    PRODUCT_DETAILS_FOR_PURCHASE: (id) => `${POS_API_BASE}/v1/product/details/${id}`,
    PRODUCT_SALES: (id) => `${POS_API_BASE}/v1/products/${id}/sales`,
    PRODUCT_PURCHASES: (id) => `${POS_API_BASE}/v1/products/${id}/purchases`,
    PRODUCT_WAREHOUSES: (id) => `${POS_API_BASE}/v1/products/${id}/warehouses`,
    PRODUCT_CREATE: `${POS_API_BASE}/v1/products/store`,
    PRODUCT_UPDATE: (id) => `${POS_API_BASE}/v1/products/${id}`,
    // Backend expects DELETE /api/v1/products/{id}
    PRODUCT_DELETE: (id) => `${POS_API_BASE}/v1/products/${id}`,
    PRODUCT_SELECT: `${POS_API_BASE}/v1/products/select`,
    PRODUCT_SELECT_OPTIONS: `${POS_API_BASE}/v1/products/select-options`,
    PRODUCT_ADD_INFO: `${POS_API_BASE}/v1/add/product/info`,
    UNITS_SELECT: `${POS_API_BASE}/v1/units/select`,
    PRODUCT_SEARCH: `${POS_API_BASE}/v1/products/search`,
    PRODUCT_EXPORT: `${POS_API_BASE}/v1/products/export`,
    PRODUCT_EXPORT_TEMPLATE: `${POS_API_BASE}/v1/products/export-template`,
    PRODUCT_IMPORT_PREVIEW: `${POS_API_BASE}/v1/products/import-preview`,
    PRODUCT_IMPORT: `${POS_API_BASE}/v1/products/import`,
    
    // Categories
    CATEGORIES: `${POS_API_BASE}/v1/categories`,
    CATEGORIES_SELECT: `${POS_API_BASE}/v1/categories/select`,
    CATEGORY_DETAILS: (id) => `${POS_API_BASE}/v1/categories/${id}`,
    CATEGORY_PARENT: `${POS_API_BASE}/v1/categories/parent-category`,
    CATEGORY_CREATE: `${POS_API_BASE}/v1/categories/store`,
    CATEGORY_UPDATE: (id) => `${POS_API_BASE}/v1/categories/update/${id}`,
    CATEGORY_DELETE: (id) => `${POS_API_BASE}/v1/categories/delete/${id}`,
    CATEGORY_TOGGLE_STATUS: (id) => `${POS_API_BASE}/v1/categories/${id}/toggle-status`,
    CATEGORY_BULK_DELETE: `${POS_API_BASE}/v1/categories/bulk-delete`,
    CATEGORY_EXPORT: `${POS_API_BASE}/v1/categories/export`,
    CATEGORY_EXPORT_TEMPLATE: `${POS_API_BASE}/v1/categories/export-template`,
    CATEGORY_IMPORT_PREVIEW: `${POS_API_BASE}/v1/categories/import-preview`,
    CATEGORY_IMPORT: `${POS_API_BASE}/v1/categories/import`,
    
    // Brands
    BRANDS: `${POS_API_BASE}/v1/brands`,
    BRANDS_SELECT: `${POS_API_BASE}/v1/brands/select`,
    BRAND_DETAILS: (id) => `${POS_API_BASE}/v1/brands/${id}`,
    BRAND_CREATE: `${POS_API_BASE}/v1/brands/store`,
    BRAND_UPDATE: (id) => `${POS_API_BASE}/v1/brands/update/${id}`,
    BRAND_DELETE: (id) => `${POS_API_BASE}/v1/brands/delete/${id}`,
    BRAND_TOGGLE_STATUS: (id) => `${POS_API_BASE}/v1/brands/${id}/toggle-status`,
    BRAND_BULK_DELETE: `${POS_API_BASE}/v1/brands/bulk-delete`,
    BRAND_EXPORT: `${POS_API_BASE}/v1/brands/export`,
    BRAND_EXPORT_TEMPLATE: `${POS_API_BASE}/v1/brands/export-template`,
    BRAND_IMPORT_PREVIEW: `${POS_API_BASE}/v1/brands/import-preview`,
    BRAND_IMPORT: `${POS_API_BASE}/v1/brands/import`,
    
    // Units
    UNITS: `${POS_API_BASE}/v1/units`,
    UNITS_SELECT: `${POS_API_BASE}/v1/units/select`,
    UNIT_DETAILS: (id) => `${POS_API_BASE}/v1/units/${id}`,
    UNIT_CREATE: `${POS_API_BASE}/v1/units/store`,
    UNIT_UPDATE: (id) => `${POS_API_BASE}/v1/units/update/${id}`,
    UNIT_DELETE: (id) => `${POS_API_BASE}/v1/units/delete/${id}`,
    UNIT_TOGGLE_STATUS: (id) => `${POS_API_BASE}/v1/units/${id}/toggle-status`,
    UNIT_BULK_DELETE: `${POS_API_BASE}/v1/units/bulk-delete`,
    UNIT_EXPORT: `${POS_API_BASE}/v1/units/export`,
    UNIT_EXPORT_TEMPLATE: `${POS_API_BASE}/v1/units/export-template`,
    UNIT_IMPORT_PREVIEW: `${POS_API_BASE}/v1/units/import-preview`,
    UNIT_IMPORT: `${POS_API_BASE}/v1/units/import`,
    
    // Sales
    SALES: `${POS_API_BASE}/v2/sales`,
    SALES_EXPORT: `${POS_API_BASE}/v2/sales/export`,
    DRAFTS_EXPORT: `${POS_API_BASE}/v2/sales/drafts/export`,
    RETURNS_EXPORT: `${POS_API_BASE}/v2/sales/returns/export`,
    SALE_DETAILS: (id) => `${POS_API_BASE}/v2/sales/${id}`,
    
    // Orders
    ORDERS: `${POS_API_BASE}/v1/orders`,
    ORDER_DETAILS: (id) => `${POS_API_BASE}/v1/orders/${id}`,
    
    // Reports
    REPORTS_SALES: `${POS_API_BASE}/v1/reports/sales`,
    REPORTS_SALES_SUMMARY: `${POS_API_BASE}/v1/reports/sales/summary`,
    REPORTS_SALES_EXPORT: `${POS_API_BASE}/v1/reports/sales/export`,
    REPORTS_PURCHASES: `${POS_API_BASE}/v1/reports/purchases`,
    REPORTS_PURCHASES_SUMMARY: `${POS_API_BASE}/v1/reports/purchases/summary`,
    REPORTS_PURCHASES_EXPORT: `${POS_API_BASE}/v1/reports/purchases/export`,
    REPORTS_PRODUCTS: `${POS_API_BASE}/v1/reports/products`,
    REPORTS_PRODUCTS_SUMMARY: `${POS_API_BASE}/v1/reports/products/summary`,
    REPORTS_PRODUCTS_EXPORT: `${POS_API_BASE}/v1/reports/products/export`,
    
    // Tags - Merchant Dashboard (CRUD operations)
    TAGS: `${POS_API_BASE}/v1/tags`,
    TAGS_SELECT: `${POS_API_BASE}/v1/tags/select`,
    TAG_DETAILS: (id) => `${POS_API_BASE}/v1/tags/${id}`,
    TAG_CREATE: `${POS_API_BASE}/v1/tags/store`,
    TAG_UPDATE: (id) => `${POS_API_BASE}/v1/tags/update/${id}`,
    TAG_DELETE: (id) => `${POS_API_BASE}/v1/tags/delete/${id}`,
    TAG_TOGGLE_STATUS: (id) => `${POS_API_BASE}/v1/tags/${id}/toggle-status`,
    TAG_BULK_DELETE: `${POS_API_BASE}/v1/tags/bulk-delete`,
    TAG_EXPORT: `${POS_API_BASE}/v1/tags/export`,
    TAG_EXPORT_TEMPLATE: `${POS_API_BASE}/v1/tags/export-template`,
    TAG_IMPORT_PREVIEW: `${POS_API_BASE}/v1/tags/import-preview`,
    TAG_IMPORT: `${POS_API_BASE}/v1/tags/import`,
    
    // Taxes - Merchant Dashboard (CRUD operations)
    TAXES: `${POS_API_BASE}/v1/taxes`,
    TAXES_SELECT: `${POS_API_BASE}/v1/taxes/select`,
    TAX_DETAILS: (id) => `${POS_API_BASE}/v1/taxes/${id}`,
    TAX_CREATE: `${POS_API_BASE}/v1/taxes/store`,
    TAX_UPDATE: (id) => `${POS_API_BASE}/v1/taxes/update/${id}`,
    TAX_DELETE: (id) => `${POS_API_BASE}/v1/taxes/delete/${id}`,
    TAX_BULK_DELETE: `${POS_API_BASE}/v1/taxes/bulk-delete`,
    TAX_EXPORT: `${POS_API_BASE}/v1/taxes/export`,
    TAX_EXPORT_TEMPLATE: `${POS_API_BASE}/v1/taxes/export-template`,
    TAX_IMPORT_PREVIEW: `${POS_API_BASE}/v1/taxes/import-preview`,
    TAX_IMPORT: `${POS_API_BASE}/v1/taxes/import`,

    // Coupons - Merchant Dashboard (CRUD operations)
    COUPONS: `${POS_API_BASE}/v1/coupons`,
    COUPONS_SELECT: `${POS_API_BASE}/v1/coupons/select`,
    COUPON_DETAILS: (id) => `${POS_API_BASE}/v1/coupons/${id}`,
    COUPON_CREATE: `${POS_API_BASE}/v1/coupons/store`,
    COUPON_UPDATE: (id) => `${POS_API_BASE}/v1/coupons/update/${id}`,
    COUPON_DELETE: (id) => `${POS_API_BASE}/v1/coupons/delete/${id}`,
    COUPON_BULK_DELETE: `${POS_API_BASE}/v1/coupons/bulk-delete`,
    COUPON_EXPORT: `${POS_API_BASE}/v1/coupons/export`,
    COUPON_EXPORT_TEMPLATE: `${POS_API_BASE}/v1/coupons/export-template`,
    COUPON_IMPORT_PREVIEW: `${POS_API_BASE}/v1/coupons/import-preview`,
    COUPON_IMPORT: `${POS_API_BASE}/v1/coupons/import`,
    
    // Warehouses - Merchant Dashboard (CRUD operations + warehouse management)
    WAREHOUSES: `${POS_API_BASE}/v1/warehouses`,
    WAREHOUSES_SELECT: `${POS_API_BASE}/v1/warehouses/select`,
    WAREHOUSE_DETAILS: (id) => `${POS_API_BASE}/v1/warehouses/${id}`,
    WAREHOUSE_CREATE: `${POS_API_BASE}/v1/warehouses/store`,
    WAREHOUSE_UPDATE: (id) => `${POS_API_BASE}/v1/warehouses/update/${id}`,
    WAREHOUSE_DELETE: (id) => `${POS_API_BASE}/v1/warehouses/delete/${id}`,
    WAREHOUSE_TOGGLE_STATUS: (id) => `${POS_API_BASE}/v1/warehouses/${id}/toggle-status`,
    WAREHOUSE_BULK_DELETE: `${POS_API_BASE}/v1/warehouses/bulk-delete`,
    WAREHOUSE_EXPORT: `${POS_API_BASE}/v1/warehouses/export`,
    WAREHOUSE_EXPORT_TEMPLATE: `${POS_API_BASE}/v1/warehouses/export-template`,
    WAREHOUSE_IMPORT_PREVIEW: `${POS_API_BASE}/v1/warehouses/import-preview`,
    WAREHOUSE_IMPORT: `${POS_API_BASE}/v1/warehouses/import`,
    WAREHOUSE_PRODUCTS: (id) => `${POS_API_BASE}/v1/warehouses/${id}/products`,
    WAREHOUSE_TRANSACTIONS: (id) => `${POS_API_BASE}/v1/warehouses/${id}/transactions`,
    WAREHOUSE_RECEIVE_GOODS: (id) => `${POS_API_BASE}/v1/warehouses/${id}/receive-goods`,
    WAREHOUSE_TRANSFER_GOODS: (id) => `${POS_API_BASE}/v1/warehouses/${id}/transfer-goods`,
    WAREHOUSE_TRANSFER_TO_STORE: (id) => `${POS_API_BASE}/v1/warehouses/${id}/transfer-to-store`,
    
    // Users & Roles
    USERS: `${POS_API_BASE}/v1/users`,
    USER_DETAILS: (id) => `${POS_API_BASE}/v1/users/${id}`,
    USER_LOOKUP: `${POS_API_BASE}/v1/users/lookup`,
    ROLES: `${POS_API_BASE}/v1/roles`,
    ROLE_DETAILS: (id) => `${POS_API_BASE}/v1/roles/${id}`,
    PERMISSIONS: `${POS_API_BASE}/v1/permissions`,
    
    // Branches (Sales)
    BRANCHES: `${POS_API_BASE}/v1/branches`,
    BRANCH_DETAILS: (id) => `${POS_API_BASE}/v1/branches/${id}`,
    
    // Suppliers
    SUPPLIERS: `${POS_API_BASE}/v1/suppliers`,
    SUPPLIER_DETAILS: (id) => `${POS_API_BASE}/v1/suppliers/${id}`,
    SUPPLIER_EXPORT: `${POS_API_BASE}/v1/suppliers/export`,
    SUPPLIER_BULK_DELETE: `${POS_API_BASE}/v1/suppliers/bulk-delete`,
    
    // Purchases
    PURCHASES: `${POS_API_BASE}/v1/purchase`,
    PURCHASE_DETAILS: (id) => `${POS_API_BASE}/v1/purchase/${id}`,
    PURCHASE_EXPORT: `${POS_API_BASE}/v1/purchase/export`,
    PURCHASE_PDF: `${POS_API_BASE}/v1/purchase/pdf`,
    PURCHASE_BULK_DELETE: `${POS_API_BASE}/v1/purchase/bulk-delete`,
    
    // Payment Gateways (Merchant/Shop-specific)
    PAYMENT_GATEWAYS: `${POS_API_BASE}/v1/payment-gateways`,
    PAYMENT_GATEWAY_DETAILS: (name) => `${POS_API_BASE}/v1/payment-gateways/${name}`,
    PAYMENT_GATEWAY_TOGGLE_STATUS: (name) => `${POS_API_BASE}/v1/payment-gateways/${name}/toggle-status`,
    PAYMENT_GATEWAY_SET_DEFAULT: (name) => `${POS_API_BASE}/v1/payment-gateways/${name}/set-default`,
    PAYMENT_GATEWAY_DELETE: (name) => `${POS_API_BASE}/v1/payment-gateways/${name}`,
    
    // API Keys (Merchant)
    API_KEYS: `${SOFTPOS_API_BASE}/v1/api-keys`,
    API_KEY_GENERATE: `${SOFTPOS_API_BASE}/v1/api-keys/generate`,
    API_KEY_REGENERATE: (id) => `${SOFTPOS_API_BASE}/v1/api-keys/${id}/regenerate`,
    API_KEY_DEACTIVATE: (id) => `${SOFTPOS_API_BASE}/v1/api-keys/${id}/deactivate`,
    
    // Webhooks (Merchant)
    WEBHOOKS: `${SOFTPOS_API_BASE}/v1/webhooks`,
    WEBHOOK_EVENTS: `${SOFTPOS_API_BASE}/v1/webhooks/events`,
    WEBHOOK_DETAILS: (id) => `${SOFTPOS_API_BASE}/v1/webhooks/${id}`,
    WEBHOOK_TOGGLE: (id) => `${SOFTPOS_API_BASE}/v1/webhooks/${id}/toggle`,
    WEBHOOK_REGENERATE_SECRET: (id) => `${SOFTPOS_API_BASE}/v1/webhooks/${id}/regenerate-secret`,
    WEBHOOK_LOGS: (id) => `${SOFTPOS_API_BASE}/v1/webhooks/${id}/logs`,
};

// Admin API Endpoints (V2) - Distributed Across Microservices
export const ADMIN_ENDPOINTS = {
    // Admin Authentication (AuthService)
    LOGIN: `${AUTH_SERVICE_BASE}/v2/admin/auth/login`,
    LOGOUT: `${AUTH_SERVICE_BASE}/v2/admin/auth/logout`,
    LOGOUT_ALL: `${AUTH_SERVICE_BASE}/v2/admin/auth/logout-all`,
    PROFILE: `${AUTH_SERVICE_BASE}/v2/admin/auth/profile`,
    UPDATE_PROFILE: `${AUTH_SERVICE_BASE}/v2/admin/auth/profile/update`,
    CHANGE_PASSWORD: `${AUTH_SERVICE_BASE}/v2/admin/auth/profile/change-password`,
    REFRESH_TOKEN: `${AUTH_SERVICE_BASE}/v2/admin/auth/refresh-token`,
    
    // Dashboard (Admin SoftPOS aggregate)
    DASHBOARD: `${SOFTPOS_API_BASE}/v2/admin/dashboard`, // legacy aggregate
    DASHBOARD_OVERVIEW: `${SOFTPOS_API_BASE}/v2/admin/dashboard`,
    DASHBOARD_TERMINAL_STATUS: `${AUTH_SERVICE_BASE}/v2/admin/dashboard/terminals`,
    DASHBOARD_CHARTS: `${SOFTPOS_API_BASE}/v2/admin/dashboard/charts`,
    DASHBOARD_LATEST_TRANSACTIONS: `${SOFTPOS_API_BASE}/v2/admin/dashboard/latest-transactions`,
    DASHBOARD_SUBSCRIPTIONS: `${SOFTPOS_API_BASE}/v2/admin/dashboard/subscriptions`,
    DASHBOARD_EXPORT: `${SOFTPOS_API_BASE}/v2/admin/dashboard/export`,
    // Temporary alias until backend exposes a real v3 dashboard route
    DASHBOARD_V3: `${SOFTPOS_API_BASE}/v3/admin/dashboard`,
    
    // Merchants (AuthService)
    MERCHANTS: `${AUTH_SERVICE_BASE}/v2/admin/merchants`,
    MERCHANTS_SELECT: `${AUTH_SERVICE_BASE}/v2/admin/merchants/select`,
    MERCHANTS_SCOPES: `${AUTH_SERVICE_BASE}/v2/admin/merchants/scopes`,
    MERCHANT_DETAILS: (id) => `${AUTH_SERVICE_BASE}/v2/admin/merchants/${id}`,
    MERCHANTS_COUNTRY_LOOKUP: `${AUTH_SERVICE_BASE}/v2/admin/merchants/country-lookup`,
    MERCHANT_STATISTICS: `${AUTH_SERVICE_BASE}/v2/admin/merchants/statistics`,
    MERCHANT_EXPORT: `${AUTH_SERVICE_BASE}/v2/admin/merchants/export`,
    MERCHANT_EXPORT_TEMPLATE: `${AUTH_SERVICE_BASE}/v2/admin/merchants/export-template`,
    MERCHANT_IMPORT_PREVIEW: `${AUTH_SERVICE_BASE}/v2/admin/merchants/import-preview`,
    MERCHANT_IMPORT: `${AUTH_SERVICE_BASE}/v2/admin/merchants/import`,
    MERCHANT_BULK_DELETE: `${AUTH_SERVICE_BASE}/v2/admin/merchants/bulk-delete`,
    MERCHANT_APPROVE: (id) => `${AUTH_SERVICE_BASE}/v2/admin/merchants/${id}/approve`,
    MERCHANT_REJECT: (id) => `${AUTH_SERVICE_BASE}/v2/admin/merchants/${id}/reject`,
    MERCHANT_SUSPEND: (id) => `${AUTH_SERVICE_BASE}/v2/admin/merchants/${id}/suspend`,
    MERCHANT_UNSUSPEND: (id) => `${AUTH_SERVICE_BASE}/v2/admin/merchants/${id}/unsuspend`,
    MERCHANT_LOGS: (id) => `${AUTH_SERVICE_BASE}/v2/admin/merchants/${id}/logs`,
    MERCHANT_CHANGE_REQUESTS: (id) => `${AUTH_SERVICE_BASE}/v2/admin/merchants/${id}/change-requests`,
    MERCHANT_ATTACHMENTS: (id) => `${AUTH_SERVICE_BASE}/v2/admin/merchants/${id}/attachments`,
    ATTACHMENTS: `${AUTH_SERVICE_BASE}/v2/admin/attachments`,
    MERCHANT_CHANGE_REQUEST_APPROVE: (id, requestId) => `${AUTH_SERVICE_BASE}/v2/admin/merchants/${id}/change-requests/${requestId}/approve`,
    MERCHANT_CHANGE_REQUEST_REJECT: (id, requestId) => `${AUTH_SERVICE_BASE}/v2/admin/merchants/${id}/change-requests/${requestId}/reject`,
    CHANGE_REQUESTS: `${AUTH_SERVICE_BASE}/v2/admin/change-requests`,
    CHANGE_REQUEST_STATISTICS: `${AUTH_SERVICE_BASE}/v2/admin/change-requests/statistics`,
    CHANGE_REQUEST_DETAILS: (id) => `${AUTH_SERVICE_BASE}/v2/admin/change-requests/${id}`,
    CHANGE_REQUEST_APPROVE: (id) => `${AUTH_SERVICE_BASE}/v2/admin/change-requests/${id}/approve`,
    CHANGE_REQUEST_REJECT: (id) => `${AUTH_SERVICE_BASE}/v2/admin/change-requests/${id}/reject`,

    // Partners (AuthService — routes `partners` + AdminAuthGuard)
    CONTENT_PROVIDERS: `${AUTH_SERVICE_BASE}/v1/admin/partners`,
    CONTENT_PROVIDERS_SELECT: `${AUTH_SERVICE_BASE}/v1/admin/partners/select`,
    CONTENT_PROVIDERS_SCOPES: `${AUTH_SERVICE_BASE}/v1/admin/partners/scopes`,
    CONTENT_PROVIDER_DETAILS: (id) => `${AUTH_SERVICE_BASE}/v1/admin/partners/${id}`,
    CONTENT_PROVIDERS_COUNTRY_LOOKUP: `${AUTH_SERVICE_BASE}/v1/admin/partners/country-lookup`,
    CONTENT_PROVIDER_STATISTICS: `${AUTH_SERVICE_BASE}/v1/admin/partners/statistics`,
    CONTENT_PROVIDER_EXPORT: `${AUTH_SERVICE_BASE}/v1/admin/partners/export`,
    CONTENT_PROVIDER_EXPORT_TEMPLATE: `${AUTH_SERVICE_BASE}/v1/admin/partners/export-template`,
    CONTENT_PROVIDER_IMPORT_PREVIEW: `${AUTH_SERVICE_BASE}/v1/admin/partners/import-preview`,
    CONTENT_PROVIDER_IMPORT: `${AUTH_SERVICE_BASE}/v1/admin/partners/import`,
    CONTENT_PROVIDER_BULK_DELETE: `${AUTH_SERVICE_BASE}/v1/admin/partners/bulk-delete`,
    CONTENT_PROVIDER_APPROVE: (id) => `${AUTH_SERVICE_BASE}/v1/admin/partners/${id}/approve`,
    CONTENT_PROVIDER_REJECT: (id) => `${AUTH_SERVICE_BASE}/v1/admin/partners/${id}/reject`,
    CONTENT_PROVIDER_SUSPEND: (id) => `${AUTH_SERVICE_BASE}/v1/admin/partners/${id}/suspend`,
    CONTENT_PROVIDER_UNSUSPEND: (id) => `${AUTH_SERVICE_BASE}/v1/admin/partners/${id}/unsuspend`,
    CONTENT_PROVIDER_LOGS: (id) => `${AUTH_SERVICE_BASE}/v1/admin/partners/${id}/logs`,
    CONTENT_PROVIDER_CHANGE_REQUESTS: (id) => `${AUTH_SERVICE_BASE}/v1/admin/partners/${id}/change-requests`,
    CONTENT_PROVIDER_ATTACHMENTS: (id) => `${AUTH_SERVICE_BASE}/v1/admin/partners/${id}/attachments`,
    CONTENT_PROVIDER_CHANGE_REQUEST_APPROVE: (id, requestId) =>
        `${AUTH_SERVICE_BASE}/v1/admin/partners/${id}/change-requests/${requestId}/approve`,
    CONTENT_PROVIDER_CHANGE_REQUEST_REJECT: (id, requestId) =>
        `${AUTH_SERVICE_BASE}/v1/admin/partners/${id}/change-requests/${requestId}/reject`,
    /** Sub-partners under a root parent (inherits country & category from parent). */
    PARTNER_SUB_PARTNERS: (parentId) => `${AUTH_SERVICE_BASE}/v1/admin/partners/${parentId}/sub-partners`,

    // Branches (AuthService)
    BRANCHES: `${AUTH_SERVICE_BASE}/v2/admin/branches`,
    BRANCH_DETAILS: (id) => `${AUTH_SERVICE_BASE}/v2/admin/branches/${id}`,
    BRANCH_STATISTICS: `${AUTH_SERVICE_BASE}/v2/admin/branches/statistics`,
    BRANCH_EXPORT: `${AUTH_SERVICE_BASE}/v2/admin/branches/export`,
    BRANCH_EXPORT_TEMPLATE: `${AUTH_SERVICE_BASE}/v2/admin/branches/export-template`,
    BRANCH_IMPORT_PREVIEW: `${AUTH_SERVICE_BASE}/v2/admin/branches/import-preview`,
    BRANCH_IMPORT: `${AUTH_SERVICE_BASE}/v2/admin/branches/import`,
    BRANCH_BULK_DELETE: `${AUTH_SERVICE_BASE}/v2/admin/branches/bulk-delete`,
    BRANCH_APPROVE: (id) => `${AUTH_SERVICE_BASE}/v2/admin/branches/${id}/approve`,
    BRANCH_REJECT: (id) => `${AUTH_SERVICE_BASE}/v2/admin/branches/${id}/reject`,
    BRANCH_SUSPEND: (id) => `${AUTH_SERVICE_BASE}/v2/admin/branches/${id}/suspend`,
    BRANCH_UNSUSPEND: (id) => `${AUTH_SERVICE_BASE}/v2/admin/branches/${id}/unsuspend`,
    
    // Users (AuthService)
    USERS: `${AUTH_SERVICE_BASE}/v2/admin/users`,
    USER_DETAILS: (id) => `${AUTH_SERVICE_BASE}/v2/admin/users/${id}`,
    USER_STATISTICS: `${AUTH_SERVICE_BASE}/v2/admin/users/statistics`,
    USER_EXPORT: `${AUTH_SERVICE_BASE}/v2/admin/users/export`,
    USER_EXPORT_TEMPLATE: `${AUTH_SERVICE_BASE}/v2/admin/users/export-template`,
    USER_IMPORT_PREVIEW: `${AUTH_SERVICE_BASE}/v2/admin/users/import-preview`,
    USER_IMPORT: `${AUTH_SERVICE_BASE}/v2/admin/users/import`,
    USER_BULK_DELETE: `${AUTH_SERVICE_BASE}/v2/admin/users/bulk-delete`,
    USER_ACTIVATE: (id) => `${AUTH_SERVICE_BASE}/v2/admin/users/${id}/activate`,
    USER_DEACTIVATE: (id) => `${AUTH_SERVICE_BASE}/v2/admin/users/${id}/deactivate`,
    USER_SEND_RESET_PASSWORD: (id) => `${AUTH_SERVICE_BASE}/v2/admin/users/${id}/send-reset-password-link`,
    USER_LOOKUP: `${AUTH_SERVICE_BASE}/v2/admin/users/lookup`,
    
    // User Groups (AuthService)
    USER_GROUPS: `${AUTH_SERVICE_BASE}/v2/admin/user-groups`,
    USER_GROUPS_SELECT: `${AUTH_SERVICE_BASE}/v2/admin/user-groups/select`,
    USER_GROUP_DETAILS: (id) => `${AUTH_SERVICE_BASE}/v2/admin/user-groups/${id}`,
    USER_GROUP_STATISTICS: `${AUTH_SERVICE_BASE}/v2/admin/user-groups/statistics`,
    USER_GROUP_EXPORT: `${AUTH_SERVICE_BASE}/v2/admin/user-groups/export`,
    USER_GROUP_EXPORT_TEMPLATE: `${AUTH_SERVICE_BASE}/v2/admin/user-groups/export-template`,
    USER_GROUP_IMPORT_PREVIEW: `${AUTH_SERVICE_BASE}/v2/admin/user-groups/import-preview`,
    USER_GROUP_IMPORT: `${AUTH_SERVICE_BASE}/v2/admin/user-groups/import`,
    USER_GROUP_BULK_DELETE: `${AUTH_SERVICE_BASE}/v2/admin/user-groups/bulk-delete`,
    USER_GROUP_ACTIVATE: (id) => `${AUTH_SERVICE_BASE}/v2/admin/user-groups/${id}/activate`,
    USER_GROUP_DEACTIVATE: (id) => `${AUTH_SERVICE_BASE}/v2/admin/user-groups/${id}/deactivate`,
    USER_GROUP_MERCHANT_USERS: `${AUTH_SERVICE_BASE}/v2/admin/user-groups/merchant-users`,
    
    // Terminals (AuthService)
    TERMINALS: `${AUTH_SERVICE_BASE}/v2/admin/terminals`,
    TERMINAL_DETAILS: (id) => `${AUTH_SERVICE_BASE}/v2/admin/terminals/${id}`,
    TERMINAL_CREATE: `${AUTH_SERVICE_BASE}/v2/admin/terminals`,
    TERMINAL_UPDATE: (id) => `${AUTH_SERVICE_BASE}/v2/admin/terminals/${id}`,
    TERMINAL_DELETE: (id) => `${AUTH_SERVICE_BASE}/v2/admin/terminals/${id}`,
    TERMINAL_STATISTICS: `${AUTH_SERVICE_BASE}/v2/admin/terminals/statistics`,
    TERMINAL_EXPORT: `${AUTH_SERVICE_BASE}/v2/admin/terminals/export`,
    TERMINAL_EXPORT_TEMPLATE: `${AUTH_SERVICE_BASE}/v2/admin/terminals/export-template`,
    TERMINAL_IMPORT: `${AUTH_SERVICE_BASE}/v2/admin/terminals/import`,
    TERMINAL_IMPORT_PREVIEW: `${AUTH_SERVICE_BASE}/v2/admin/terminals/import-preview`,
    TERMINAL_BULK_DELETE: `${AUTH_SERVICE_BASE}/v2/admin/terminals/bulk-delete`,
    TERMINAL_BULK_STATUS: `${AUTH_SERVICE_BASE}/v2/admin/terminals/bulk-status`,
    TERMINAL_FILTERS: `${AUTH_SERVICE_BASE}/v2/admin/terminals/filters`,
    TERMINAL_MODELS_BY_BRANDS: `${AUTH_SERVICE_BASE}/v2/admin/terminals/models-by-brands`,
    TERMINAL_MANUFACTURERS_BY_MODELS: `${AUTH_SERVICE_BASE}/v2/admin/terminals/manufacturers-by-models`,
    BRANDS: `${AUTH_SERVICE_BASE}/v2/admin/brands`,
    
    // Terminal Groups (AuthService)
    TERMINAL_GROUPS: `${AUTH_SERVICE_BASE}/v2/admin/terminal-groups`,
    TERMINAL_GROUP_DETAILS: (id) => `${AUTH_SERVICE_BASE}/v2/admin/terminal-groups/${id}`,
    TERMINAL_GROUP_CREATE: `${AUTH_SERVICE_BASE}/v2/admin/terminal-groups`,
    TERMINAL_GROUP_UPDATE: (id) => `${AUTH_SERVICE_BASE}/v2/admin/terminal-groups/${id}`,
    TERMINAL_GROUP_DELETE: (id) => `${AUTH_SERVICE_BASE}/v2/admin/terminal-groups/${id}`,
    TERMINAL_GROUP_STATISTICS: `${AUTH_SERVICE_BASE}/v2/admin/terminal-groups/statistics`,
    TERMINAL_GROUP_EXPORT: `${AUTH_SERVICE_BASE}/v2/admin/terminal-groups/export`,
    TERMINAL_GROUP_BULK_DELETE: `${AUTH_SERVICE_BASE}/v2/admin/terminal-groups/bulk-delete`,
    TERMINAL_GROUP_PARENT_GROUPS: `${AUTH_SERVICE_BASE}/v2/admin/terminal-groups/parent-groups`,
    TERMINAL_GROUP_TOGGLE_STATUS: (id) => `${AUTH_SERVICE_BASE}/v2/admin/terminal-groups/${id}/toggle-status`,
    TERMINAL_GROUP_ACTIVATE: (id) => `${AUTH_SERVICE_BASE}/v2/admin/terminal-groups/${id}/activate`,
    TERMINAL_GROUP_DEACTIVATE: (id) => `${AUTH_SERVICE_BASE}/v2/admin/terminal-groups/${id}/deactivate`,
    TERMINAL_GROUP_REMOVE_TERMINAL: (id) => `${AUTH_SERVICE_BASE}/v2/admin/terminal-groups/${id}/remove-terminal`,
    
    // Plans (AuthService)
    PLANS: `${AUTH_SERVICE_BASE}/v2/admin/plans`,
    PLANS_SELECT: `${AUTH_SERVICE_BASE}/v2/admin/plans/select`,
    PLAN_DETAILS: (id) => `${AUTH_SERVICE_BASE}/v2/admin/plans/${id}`,
    PLAN_CREATE: `${AUTH_SERVICE_BASE}/v2/admin/plans`,
    PLAN_UPDATE: (id) => `${AUTH_SERVICE_BASE}/v2/admin/plans/${id}`,
    PLAN_DELETE: (id) => `${AUTH_SERVICE_BASE}/v2/admin/plans/${id}`,
    PLAN_CHANGE_STATUS: (id) => `${AUTH_SERVICE_BASE}/v2/admin/plans/${id}/change-status`,
    PLAN_REPORT: `${AUTH_SERVICE_BASE}/v2/admin/plans/report`,
    
    // Customers (SoftPos admin)
    CUSTOMERS: `${AUTH_SERVICE_BASE}/v2/admin/customers`,
    CUSTOMER_DETAILS: (id) => `${AUTH_SERVICE_BASE}/v2/admin/customers/${id}`,
    CUSTOMER_STATISTICS: `${AUTH_SERVICE_BASE}/v2/admin/customers/statistics`,
    CUSTOMER_EXPORT: `${AUTH_SERVICE_BASE}/v2/admin/customers/export`,
    CUSTOMER_EXPORT_TEMPLATE: `${AUTH_SERVICE_BASE}/v2/admin/customers/export-template`,
    CUSTOMER_IMPORT_PREVIEW: `${AUTH_SERVICE_BASE}/v2/admin/customers/import-preview`,
    CUSTOMER_IMPORT: `${AUTH_SERVICE_BASE}/v2/admin/customers/import`,
    CUSTOMER_BULK_DELETE: `${AUTH_SERVICE_BASE}/v2/admin/customers/bulk-delete`,
    CUSTOMER_TOGGLE_STATUS: (id) => `${AUTH_SERVICE_BASE}/v2/admin/customers/${id}/toggle-status`,
    CUSTOMER_UPDATE_STATUS: (id) => `${AUTH_SERVICE_BASE}/v2/admin/customers/${id}/status`,
    CUSTOMER_WALLET: (id) => `${AUTH_SERVICE_BASE}/v2/admin/customers/${id}/wallet`,
    CUSTOMER_TRANSACTIONS: (id) => `${AUTH_SERVICE_BASE}/v2/admin/customers/${id}/transactions`,

    // Wallets (admin)
    WALLETS: `${AUTH_SERVICE_BASE}/v2/admin/wallets`,
    WALLETS_EXPORT: `${AUTH_SERVICE_BASE}/v2/admin/wallets/export`,
    WALLET_DETAILS: (id) => `${AUTH_SERVICE_BASE}/v2/admin/wallets/${id}`,
    WALLET_TRANSACTIONS: (id) => `${AUTH_SERVICE_BASE}/v2/admin/wallets/${id}/transactions`,
    WALLET_SUSPEND: (id) => `${AUTH_SERVICE_BASE}/v2/admin/wallets/${id}/suspend`,
    WALLET_ACTIVATE: (id) => `${AUTH_SERVICE_BASE}/v2/admin/wallets/${id}/activate`,
    WALLET_DELETE: (id) => `${AUTH_SERVICE_BASE}/v2/admin/wallets/${id}`,
    WALLET_TRANSACTIONS_ALL: `${AUTH_SERVICE_BASE}/v2/admin/wallets/transactions`,
    WALLET_TRANSACTION_DETAILS: (id) => `${AUTH_SERVICE_BASE}/v2/admin/wallets/transactions/${id}`,
    WALLET_TRANSACTIONS_ALL_EXPORT: `${AUTH_SERVICE_BASE}/v2/admin/wallets/transactions/export`,
    WALLET_CASH_IN: (id) => `${AUTH_SERVICE_BASE}/v2/admin/wallets/${id}/cash-in`,
    WALLET_CASH_OUT: (id) => `${AUTH_SERVICE_BASE}/v2/admin/wallets/${id}/cash-out`,
    WALLET_OPENING_CAPITAL: `${AUTH_SERVICE_BASE}/v2/admin/wallets/opening-capital`,
    
    // Products Management (Pos)
    // Tags
    TAGS: `${POS_API_BASE}/v2/admin/tags`,
    TAGS_EXPORT: `${POS_API_BASE}/v2/admin/tags/export`,
    TAG_DETAILS: (id) => `${POS_API_BASE}/v2/admin/tags/${id}`,

    // Taxes
    TAXES: `${POS_API_BASE}/v2/admin/taxes`,
    TAXES_EXPORT: `${POS_API_BASE}/v2/admin/taxes/export`,
    TAX_DETAILS: (id) => `${POS_API_BASE}/v2/admin/taxes/${id}`,

    // Coupons
    COUPONS: `${POS_API_BASE}/v2/admin/coupons`,
    COUPONS_EXPORT: `${POS_API_BASE}/v2/admin/coupons/export`,
    COUPON_DETAILS: (id) => `${POS_API_BASE}/v2/admin/coupons/${id}`,
    
    // Categories
    CATEGORIES: `${POS_API_BASE}/v2/admin/categories`,
    CATEGORIES_EXPORT: `${POS_API_BASE}/v2/admin/categories/export`,
    CATEGORY_DETAILS: (id) => `${POS_API_BASE}/v2/admin/categories/${id}`,
    
    // Brands
    BRANDS: `${POS_API_BASE}/v2/admin/brands`,
    BRANDS_EXPORT: `${POS_API_BASE}/v2/admin/brands/export`,
    BRAND_DETAILS: (id) => `${POS_API_BASE}/v2/admin/brands/${id}`,
    
    // Units
    UNITS: `${POS_API_BASE}/v2/admin/units`,
    UNITS_EXPORT: `${POS_API_BASE}/v2/admin/units/export`,
    UNIT_DETAILS: (id) => `${POS_API_BASE}/v2/admin/units/${id}`,
    
    // Products (Pos — inventory / cashier catalog)
    POS_PRODUCTS: `${POS_API_BASE}/v2/admin/products`,
    POS_PRODUCTS_EXPORT: `${POS_API_BASE}/v2/admin/products/export`,
    POS_PRODUCT_DETAILS: (id) => `${POS_API_BASE}/v2/admin/products/${id}`,
    
    // Warehouses
    WAREHOUSES: `${POS_API_BASE}/v2/admin/warehouses`,
    WAREHOUSES_SELECT: `${POS_API_BASE}/v2/admin/warehouses/select`,
    WAREHOUSES_EXPORT: `${POS_API_BASE}/v2/admin/warehouses/export`,
    WAREHOUSE_DETAILS: (id) => `${POS_API_BASE}/v2/admin/warehouses/${id}`,
    SUPPLIERS_SELECT: `${POS_API_BASE}/v2/admin/suppliers/select`,
    CUSTOMERS_SELECT: `${POS_API_BASE}/v2/admin/customers/select`,
    
    // Sales Management (Pos)
    // Sales
    SALES: `${POS_API_BASE}/v2/admin/sales`,
    SALES_EXPORT: `${POS_API_BASE}/v2/admin/sales/export`,
    SALE_DETAILS: (id) => `${POS_API_BASE}/v2/admin/sales/${id}`,
    SALE_INVOICE: (id) => `${POS_API_BASE}/v2/admin/sales/${id}/invoice`,
    SALE_INVOICE_SEND: (id) => `${POS_API_BASE}/v2/admin/sales/${id}/invoice/send`,

    // Reports
    REPORTS_SALES: `${POS_API_BASE}/v2/admin/reports/sales`,
    REPORTS_SALES_SUMMARY: `${POS_API_BASE}/v2/admin/reports/sales/summary`,
    REPORTS_PURCHASES: `${POS_API_BASE}/v2/admin/reports/purchases`,
    REPORTS_PURCHASES_SUMMARY: `${POS_API_BASE}/v2/admin/reports/purchases/summary`,
    REPORTS_PRODUCTS: `${POS_API_BASE}/v2/admin/reports/products`,
    REPORTS_PRODUCTS_SUMMARY: `${POS_API_BASE}/v2/admin/reports/products/summary`,
    
    // Drafts
    DRAFTS: `${POS_API_BASE}/v2/admin/drafts`,
    DRAFTS_EXPORT: `${POS_API_BASE}/v2/admin/drafts/export`,
    DRAFT_DETAILS: (id) => `${POS_API_BASE}/v2/admin/drafts/${id}`,
    
    // Sale Returns
    SALE_RETURNS: `${POS_API_BASE}/v2/admin/sale-returns`,
    SALE_RETURNS_EXPORT: `${POS_API_BASE}/v2/admin/sale-returns/export`,
    SALE_RETURN_DETAILS: (id) => `${POS_API_BASE}/v2/admin/sale-returns/${id}`,

    // Financial Support (AuthService - subscription-based)
    FINANCIAL_SUPPORT: `${AUTH_SERVICE_BASE}/v2/admin/financial-support`,
    FINANCIAL_SUPPORT_EXPORT: `${AUTH_SERVICE_BASE}/v2/admin/financial-support/export`,
    FINANCIAL_SUPPORT_DETAILS: (id) => `${AUTH_SERVICE_BASE}/v2/admin/financial-support/${id}`,

    // Purchase Management (Pos)
    // Purchases
    PURCHASES: `${POS_API_BASE}/v2/admin/purchases`,
    PURCHASES_EXPORT: `${POS_API_BASE}/v2/admin/purchases/export`,
    PURCHASE_DETAILS: (id) => `${POS_API_BASE}/v2/admin/purchases/${id}`,
    PURCHASE_INVOICE: (id) => `${POS_API_BASE}/v2/admin/purchases/${id}/invoice`,
    PURCHASE_INVOICE_SEND: (id) => `${POS_API_BASE}/v2/admin/purchases/${id}/invoice/send`,
    
    // Transactions (SoftPos)
    TRANSACTIONS: `${SOFTPOS_API_BASE}/v2/admin/transactions`,
    TRANSACTION_DETAILS: (id) => `${SOFTPOS_API_BASE}/v2/admin/transactions/${id}`,
    TRANSACTION_STATISTICS: `${SOFTPOS_API_BASE}/v2/admin/transactions/statistics`,
    TRANSACTION_EXPORT: `${SOFTPOS_API_BASE}/v2/admin/transactions/export`,
    TRANSACTION_BULK_DELETE: `${SOFTPOS_API_BASE}/v2/admin/transactions/bulk-delete`,
    TRANSACTION_REFUND: (id) => `${SOFTPOS_API_BASE}/v2/admin/transactions/${id}/refund`,
    TRANSACTION_VOID: (id) => `${SOFTPOS_API_BASE}/v2/admin/transactions/${id}/void`,
    TRANSACTION_SEND_RECEIPT: (id) => `${SOFTPOS_API_BASE}/v2/admin/transactions/${id}/send-receipt`,
    TRANSACTION_RECEIPT: (id) => `${SOFTPOS_API_BASE}/v2/admin/transactions/${id}/receipt`,
    SERVICE_TRANSACTIONS: `${SOFTPOS_API_BASE}/v2/admin/service-transactions`,
    SERVICE_TRANSACTION_DETAILS: (id) => `${SOFTPOS_API_BASE}/v2/admin/service-transactions/${id}`,
    
    // Payment Links (SoftPos)
    PAYMENT_LINKS: `${SOFTPOS_API_BASE}/v2/admin/payment-links`,
    PAYMENT_LINK_DETAILS: (id) => `${SOFTPOS_API_BASE}/v2/admin/payment-links/${id}`,
    PAYMENT_LINK_STATISTICS: `${SOFTPOS_API_BASE}/v2/admin/payment-links/statistics`,
    PAYMENT_LINK_EXPORT: `${SOFTPOS_API_BASE}/v2/admin/payment-links/export`,
    
    // Settlements (SoftPos)
    SETTLEMENTS: `${SOFTPOS_API_BASE}/v2/admin/settlements`,
    SETTLEMENT_DETAILS: (id) => `${SOFTPOS_API_BASE}/v2/admin/settlements/${id}`,
    SETTLEMENT_STATISTICS: `${SOFTPOS_API_BASE}/v2/admin/settlements/statistics`,
    SETTLEMENT_EXPORT: `${SOFTPOS_API_BASE}/v2/admin/settlements/export`,
    
    // Batches (SoftPos)
    BATCHES: `${SOFTPOS_API_BASE}/v2/admin/batches`,
    BATCH_DETAILS: (id) => `${SOFTPOS_API_BASE}/v2/admin/batches/${id}`,
    BATCH_STATISTICS: `${SOFTPOS_API_BASE}/v2/admin/batches/statistics`,
    BATCH_EXPORT: `${SOFTPOS_API_BASE}/v2/admin/batches/export`,
    BATCH_PROCESS_SETTLEMENT: (id) => `${SOFTPOS_API_BASE}/v2/admin/batches/${id}/process-settlement`,
    
    // Payment Gateways (Pos)
    PAYMENT_GATEWAYS: `${POS_API_BASE}/v2/admin/payment-gateways`,
    PAYMENT_GATEWAY_DETAILS: (id) => `${POS_API_BASE}/v2/admin/payment-gateways/${id}`,
    PAYMENT_GATEWAY_TOGGLE_STATUS: (id) => `${POS_API_BASE}/v2/admin/payment-gateways/${id}/toggle-status`,

    // Service categories / sub-categories (AuthService — `service-categories`, `service-sub-categories`)
    SERVICE_CATEGORIES: `${AUTH_SERVICE_BASE}/v1/admin/service-categories`,
    SERVICE_CATEGORIES_ACTIVE: `${AUTH_SERVICE_BASE}/v1/admin/service-categories/select`,
    SERVICE_CATEGORIES_ACTIVE_PUBLIC: `${AUTH_SERVICE_BASE}/v1/admin/service-categories/select-public`,
    SERVICE_CATEGORY_DETAILS: (id) => `${AUTH_SERVICE_BASE}/v1/admin/service-categories/${id}`,
    SERVICE_CATEGORY_TOGGLE_STATUS: (id) => `${AUTH_SERVICE_BASE}/v1/admin/service-categories/${id}/toggle-status`,
    SERVICE_CATEGORY_BULK_DELETE: `${AUTH_SERVICE_BASE}/v1/admin/service-categories/bulk-delete`,
    SERVICE_CATEGORY_EXPORT: `${AUTH_SERVICE_BASE}/v1/admin/service-categories/export`,
    SERVICE_SUB_CATEGORIES: `${AUTH_SERVICE_BASE}/v1/admin/service-sub-categories`,
    SERVICE_SUB_CATEGORIES_SELECT: `${AUTH_SERVICE_BASE}/v1/admin/service-sub-categories/select`,
    SERVICE_SUB_CATEGORY_DETAILS: (id) => `${AUTH_SERVICE_BASE}/v1/admin/service-sub-categories/${id}`,
    SERVICE_SUB_CATEGORY_TOGGLE_STATUS: (id) => `${AUTH_SERVICE_BASE}/v1/admin/service-sub-categories/${id}/toggle-status`,
    SERVICE_SUB_CATEGORY_BULK_DELETE: `${AUTH_SERVICE_BASE}/v1/admin/service-sub-categories/bulk-delete`,

    // Services Management - Service Types (SoftPos — `service-types`; list CRUD may use AuthService)
    SERVICE_TYPES: `${AUTH_SERVICE_BASE}/v2/admin/service-types`,
    SERVICE_TYPES_SELECT: `${SOFTPOS_API_BASE}/service-types/select`,
    SERVICE_TYPE_DETAILS: (id) => `${AUTH_SERVICE_BASE}/v2/admin/service-types/${id}`,
    SERVICE_TYPE_TOGGLE_STATUS: (id) => `${AUTH_SERVICE_BASE}/v2/admin/service-types/${id}/toggle-status`,
    SERVICE_TYPE_BULK_DELETE: `${AUTH_SERVICE_BASE}/v2/admin/service-types/bulk-delete`,

    PRODUCT_SERVICE_FORMS: (productId) => `${AUTH_SERVICE_BASE}/v1/admin/products/${productId}/service-forms`,

    // Services Management - Operators (AuthService)
    OPERATORS: `${AUTH_SERVICE_BASE}/v2/admin/operators`,
    OPERATORS_ACTIVE: `${AUTH_SERVICE_BASE}/v2/admin/operators/select`,
    OPERATOR_DETAILS: (id) => `${AUTH_SERVICE_BASE}/v2/admin/operators/${id}`,
    OPERATOR_TOGGLE_STATUS: (id) => `${AUTH_SERVICE_BASE}/v2/admin/operators/${id}/toggle-status`,
    OPERATOR_BULK_DELETE: `${AUTH_SERVICE_BASE}/v2/admin/operators/bulk-delete`,

    // Services (AuthService — prefix `services`)
    SERVICES: `${AUTH_SERVICE_BASE}/v1/admin/services`,
    SERVICES_CATALOG: `${AUTH_SERVICE_BASE}/v1/admin/services/catalog`,
    SERVICES_CATALOG_PREVIEW: `${AUTH_SERVICE_BASE}/v1/admin/services/preview/catalog`,
    SERVICES_HOME_PREVIEW: `${AUTH_SERVICE_BASE}/v1/admin/services/preview/home`,
    SERVICES_HOME_SCREEN_CONFIG: `${AUTH_SERVICE_BASE}/v1/admin/services/home-screen-config`,
    SERVICES_HOME_SCREEN_CONFIG_SEARCH: `${AUTH_SERVICE_BASE}/v1/admin/services/home-screen-config/search`,
    SERVICES_SELECT: `${AUTH_SERVICE_BASE}/v1/admin/services/select`,
    SERVICE_DETAILS: (id) => `${AUTH_SERVICE_BASE}/v1/admin/services/${id}`,
    SERVICE_CREATE: `${AUTH_SERVICE_BASE}/v1/admin/services`,
    SERVICE_UPDATE: (id) => `${AUTH_SERVICE_BASE}/v1/admin/services/${id}`,
    SERVICE_DELETE: (id) => `${AUTH_SERVICE_BASE}/v1/admin/services/${id}`,
    SERVICE_TOGGLE_STATUS: (id) => `${AUTH_SERVICE_BASE}/v1/admin/services/${id}/toggle-status`,
    SERVICE_BULK_DELETE: `${AUTH_SERVICE_BASE}/v1/admin/services/bulk-delete`,
    SERVICE_EXPORT: `${AUTH_SERVICE_BASE}/v1/admin/services/export`,
    SERVICE_IMPORT: `${AUTH_SERVICE_BASE}/v1/admin/services/import`,

    // Products — payment-gateway catalog (AuthService — prefix `products`; POS inventory uses POS_PRODUCTS*)
    PRODUCTS: `${AUTH_SERVICE_BASE}/v1/admin/products`,
    PRODUCT_DETAILS: (id) => `${AUTH_SERVICE_BASE}/v1/admin/products/${id}`,
    PRODUCT_CREATE: `${AUTH_SERVICE_BASE}/v1/admin/products`,
    PRODUCT_UPDATE: (id) => `${AUTH_SERVICE_BASE}/v1/admin/products/${id}`,
    PRODUCT_DELETE: (id) => `${AUTH_SERVICE_BASE}/v1/admin/products/${id}`,
    PRODUCT_TOGGLE_STATUS: (id) => `${AUTH_SERVICE_BASE}/v1/admin/products/${id}/toggle-status`,
    PRODUCT_BULK_DELETE: `${AUTH_SERVICE_BASE}/v1/admin/products/bulk-delete`,
    AUTH_PRODUCTS_EXPORT: `${AUTH_SERVICE_BASE}/v1/admin/products/export`,
    PRODUCTS_SELECT: `${AUTH_SERVICE_BASE}/v1/admin/products/select`,

    // Subscribers Management (AuthService)
    SUBSCRIBERS: `${AUTH_SERVICE_BASE}/v2/admin/subscribers`,
    SUBSCRIBERS_EXPORT: `${AUTH_SERVICE_BASE}/v2/admin/subscribers/export`,

    // Subscriptions Management (AuthService)
    SUBSCRIPTIONS: `${AUTH_SERVICE_BASE}/v2/admin/subscriptions`,
    SUBSCRIPTIONS_EXPORT: `${AUTH_SERVICE_BASE}/v2/admin/subscriptions/export`,
    SUBSCRIPTIONS_MSISDN_SELECT: `${AUTH_SERVICE_BASE}/v2/admin/subscriptions/msisdn/select`,
    SUBSCRIPTIONS_REPORT: `${AUTH_SERVICE_BASE}/v2/admin/subscriptions/report`,

    // Accounting (SoftPOS admin)
    ACCOUNTING_ACCOUNT_TYPES: `${SOFTPOS_API_BASE}/v2/admin/accounting/account-types`,
    ACCOUNTING_CHART_OF_ACCOUNTS: `${SOFTPOS_API_BASE}/v2/admin/accounting/chart-of-accounts`,
    ACCOUNTING_CHART_OF_ACCOUNT_DETAILS: (id) => `${SOFTPOS_API_BASE}/v2/admin/accounting/chart-of-accounts/${id}`,
    ACCOUNTING_CHART_OF_ACCOUNTS_NEXT_CODE: `${SOFTPOS_API_BASE}/v2/admin/accounting/chart-of-accounts/next-code`,
    ACCOUNTING_CHART_OF_ACCOUNTS_EXPORT: `${SOFTPOS_API_BASE}/v2/admin/accounting/chart-of-accounts/export`,
    ACCOUNTING_CHART_OF_ACCOUNTS_SAMPLE: `${SOFTPOS_API_BASE}/v2/admin/accounting/chart-of-accounts/sample`,
    ACCOUNTING_CHART_OF_ACCOUNTS_IMPORT: `${SOFTPOS_API_BASE}/v2/admin/accounting/chart-of-accounts/import`,
    ACCOUNTING_LEDGER: `${SOFTPOS_API_BASE}/v2/admin/accounting/ledger`,
    ACCOUNTING_LEDGER_EXPORT: `${SOFTPOS_API_BASE}/v2/admin/accounting/ledger/export`,
    ACCOUNTING_LEDGER_CUSTOMERS: `${SOFTPOS_API_BASE}/v2/admin/accounting/ledger/customers`,
    ACCOUNTING_BALANCE_SHEET: `${SOFTPOS_API_BASE}/v2/admin/accounting/reports/balance-sheet`,
    ACCOUNTING_BALANCE_SHEET_EXPORT: `${SOFTPOS_API_BASE}/v2/admin/accounting/reports/balance-sheet/export`,
    ACCOUNTING_PROFIT_LOSS: `${SOFTPOS_API_BASE}/v2/admin/accounting/reports/profit-loss`,
    ACCOUNTING_PROFIT_LOSS_EXPORT: `${SOFTPOS_API_BASE}/v2/admin/accounting/reports/profit-loss/export`,
    ACCOUNTING_TRIAL_BALANCE: `${SOFTPOS_API_BASE}/v2/admin/accounting/reports/trial-balance`,
};

// Admin System Administration Endpoints (AuthService)
export const ADMIN_SYSTEM_ENDPOINTS = {
    // Roles Management
    ROLES: `${AUTH_SERVICE_BASE}/v2/admin/roles`,
    ROLES_DATA: `${AUTH_SERVICE_BASE}/v2/admin/roles/data`,
    ROLES_SELECT: `${AUTH_SERVICE_BASE}/v2/admin/roles/select`,
    ROLES_PERMISSIONS: `${AUTH_SERVICE_BASE}/v2/admin/roles/permissions`,
    ROLE_DETAILS: (id) => `${AUTH_SERVICE_BASE}/v2/admin/roles/${id}`,
    ROLE_BULK_DELETE: `${AUTH_SERVICE_BASE}/v2/admin/roles/bulk-delete`,
    
    // Admins Management
    ADMINS: `${AUTH_SERVICE_BASE}/v2/admin/admins`,
    ADMINS_DATA: `${AUTH_SERVICE_BASE}/v2/admin/admins/data`,
    ADMINS_SELECT: `${AUTH_SERVICE_BASE}/v2/admin/admins/select`,
    ADMIN_DETAILS: (id) => `${AUTH_SERVICE_BASE}/v2/admin/admins/${id}`,
    ADMIN_BULK_DELETE: `${AUTH_SERVICE_BASE}/v2/admin/admins/bulk-delete`,
    ADMIN_CHANGE_STATUS: (id) => `${AUTH_SERVICE_BASE}/v2/admin/admins/${id}/change-status`,
    
    // Countries Management
    COUNTRIES: `${AUTH_SERVICE_BASE}/v2/admin/countries`,
    COUNTRIES_DATA: `${AUTH_SERVICE_BASE}/v2/admin/countries/data`,
    COUNTRIES_SELECT: `${AUTH_SERVICE_BASE}/v2/admin/countries/select`,
    COUNTRY_DETAILS: (id) => `${AUTH_SERVICE_BASE}/v2/admin/countries/${id}`,
    COUNTRY_BULK_DELETE: `${AUTH_SERVICE_BASE}/v2/admin/countries/bulk-delete`,
    COUNTRY_CHANGE_STATUS: (id) => `${AUTH_SERVICE_BASE}/v2/admin/countries/${id}/change-status`,
    
    // Cities Management
    CITIES: `${AUTH_SERVICE_BASE}/v2/admin/cities`,
    CITIES_DATA: `${AUTH_SERVICE_BASE}/v2/admin/cities/data`,
    CITIES_SELECT: `${AUTH_SERVICE_BASE}/v2/admin/cities/select`,
    CITY_DETAILS: (id) => `${AUTH_SERVICE_BASE}/v2/admin/cities/${id}`,
    CITY_BULK_DELETE: `${AUTH_SERVICE_BASE}/v2/admin/cities/bulk-delete`,
    CITY_CHANGE_STATUS: (id) => `${AUTH_SERVICE_BASE}/v2/admin/cities/${id}/change-status`,
    
    // Advertisements Management
    ADVERTISEMENTS: `${AUTH_SERVICE_BASE}/v2/admin/advertisements`,
    ADVERTISEMENTS_DATA: `${AUTH_SERVICE_BASE}/v2/admin/advertisements/data`,
    ADVERTISEMENT_DETAILS: (id) => `${AUTH_SERVICE_BASE}/v2/admin/advertisements/${id}`,
    ADVERTISEMENT_BULK_DELETE: `${AUTH_SERVICE_BASE}/v2/admin/advertisements/bulk-delete`,
    ADVERTISEMENT_CHANGE_STATUS: (id) => `${AUTH_SERVICE_BASE}/v2/admin/advertisements/${id}/change-status`,
    
    // Settings Management - Service Fees
    SERVICE_FEES: `${AUTH_SERVICE_BASE}/v2/admin/settings/service-fees`,
    SERVICE_FEES_DATA: `${AUTH_SERVICE_BASE}/v2/admin/settings/service-fees/data`,
    SERVICE_FEE_DETAILS: (id) => `${AUTH_SERVICE_BASE}/v2/admin/settings/service-fees/${id}`,
    SERVICE_FEE_BULK_DELETE: `${AUTH_SERVICE_BASE}/v2/admin/settings/service-fees/bulk-delete`,
    SERVICE_FEE_IMPORT: `${AUTH_SERVICE_BASE}/v2/admin/settings/service-fees/import`,
    SERVICE_FEE_EXPORT_TEMPLATE: `${AUTH_SERVICE_BASE}/v2/admin/settings/service-fees/export-template`,
    
    // Settings Management - Currencies
    CURRENCIES: `${AUTH_SERVICE_BASE}/v2/admin/settings/currencies`,
    CURRENCIES_DATA: `${AUTH_SERVICE_BASE}/v2/admin/settings/currencies/data`,
    CURRENCIES_SELECT: `${AUTH_SERVICE_BASE}/v2/admin/settings/currencies/select`,
    CURRENCY_DETAILS: (id) => `${AUTH_SERVICE_BASE}/v2/admin/settings/currencies/${id}`,
    CURRENCY_BULK_DELETE: `${AUTH_SERVICE_BASE}/v2/admin/settings/currencies/bulk-delete`,
    
    // Settings Management - Contract Terms
    CONTRACT_TERMS: `${AUTH_SERVICE_BASE}/v2/admin/settings/contract-terms`,
    CONTRACT_TERMS_UPDATE: `${AUTH_SERVICE_BASE}/v2/admin/settings/contract-terms/update`,
    CONTRACT_TERMS_PREVIEW: (lang) => `${AUTH_SERVICE_BASE}/v2/admin/settings/contract-terms/preview/${lang}`,
    CONTRACT_TERMS_DOWNLOAD: (lang) => `${AUTH_SERVICE_BASE}/v2/admin/settings/contract-terms/download/${lang}`,

    NOTIFICATIONS: `${AUTH_SERVICE_BASE}/v2/admin/notifications`,
    NOTIFICATION_DETAILS: (id) => `${AUTH_SERVICE_BASE}/v2/admin/notifications/${id}`,
    NOTIFICATION_RESEND: (id) => `${AUTH_SERVICE_BASE}/v2/admin/notifications/${id}/resend`,
    NOTIFICATION_MERCHANTS_SELECT: `${AUTH_SERVICE_BASE}/v2/admin/notifications/lookups/merchants/select`,
    NOTIFICATION_USERS_BY_MERCHANT: `${AUTH_SERVICE_BASE}/v2/admin/notifications/lookups/users`,
    NOTIFICATION_CUSTOMERS_SELECT: `${AUTH_SERVICE_BASE}/v2/admin/notifications/lookups/customers/select`,
};

// Default Configuration
export const APP_CONFIG = {
    APP_NAME: 'Admin Dashboard',
    DEFAULT_PAGE_SIZE: 10,
    TOKEN_KEY: 'merchant_dashboard_token',
    USER_KEY: 'dashboard_user',
    MERCHANT_KEY: 'admin_dashboard_merchant',
    /** Onboarding-only token — must not be read by login / dashboard auth */
    REGISTRATION_TOKEN_KEY: 'merchant_registration_token',
    REGISTRATION_USER_KEY: 'merchant_registration_user',
};

// Public (unauthenticated) endpoints
export const PUBLIC_ENDPOINTS = {
    PLANS: `${AUTH_SERVICE_BASE}/v2/public/plans`,
    PLAN_DETAILS: (id) => `${AUTH_SERVICE_BASE}/v2/public/plans/${id}`,
};




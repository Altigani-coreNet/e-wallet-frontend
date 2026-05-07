import useAuthStore from '../stores/authStore';

// Central map for resource -> permissions
// Each entry may include: view, create, edit, delete, assign, export, close, void, refund, download, details
export const permissionMap = {
  // POS - Dashboard
  dashboard: {
    view: 'pos.dashboard.view_dashboard',
    statistics: 'pos.dashboard.view_statistics',
    charts: 'pos.dashboard.view_charts',
  },

  // POS - Transactions
  transactions: {
    view: 'pos.transactions.view_transactions',
    create: 'pos.transactions.create_transactions',
    void: 'pos.transactions.void_transactions',
    refund: 'pos.transactions.refund_transactions',
    details: 'pos.transactions.view_transaction_details',
    // export rule: fall back to view if explicit not provided
    // export: 'pos.reports.export_reports', // keep optional
  },

  // POS - Settlements
  settlements: {
    view: 'pos.settlements.view_settlements',
    download: 'pos.settlements.download_settlements', // treated as export-equivalent
  },

  // POS - Batches
  batches: {
    view: 'pos.batches.view_batches',
    close: 'pos.batches.close_batches',
  },

  // POS - Terminals
  terminals: {
    view: 'pos.terminals.view_terminals',
    create: 'pos.terminals.create_terminals',
    edit: 'pos.terminals.edit_terminals',
    delete: 'pos.terminals.delete_terminals',
    assign: 'pos.terminals.assign_terminals',
  },

  // POS - Branches
  branches: {
    view: 'pos.branches.view_branches',
    create: 'pos.branches.create_branches',
    edit: 'pos.branches.edit_branches',
    delete: 'pos.branches.delete_branches',
  },

  // POS - Users
  users: {
    view: 'pos.users.view_users',
    create: 'pos.users.create_users',
    edit: 'pos.users.edit_users',
    delete: 'pos.users.delete_users',
    activate: 'pos.users.activate_users',
    deactivate: 'pos.users.deactivate_users',
  },

  // POS - Roles
  roles: {
    view: 'pos.roles.view_roles',
    create: 'pos.roles.create_roles',
    edit: 'pos.roles.edit_roles',
    delete: 'pos.roles.delete_roles',
    assign: 'pos.roles.assign_roles',
  },

  // POS - Reports (generic)
  reports: {
    view: 'pos.reports.view_reports',
    export: 'pos.reports.export_reports',
  },

  // Merchant - Payment Links (support both short and long form permissions)
  paymentLinks: {
    view: 'pos.payment_links.view_payment_links',
    create: ['pos.payment_links.create_payment_links', 'pos.payment_links.create'],
    edit: ['pos.payment_links.edit_payment_links', 'pos.payment_links.edit'],
    delete: ['pos.payment_links.delete_payment_links', 'pos.payment_links.delete'],
    // export => view fallback
  },

  // Merchant - Service Fees
  serviceFees: {
    // Route uses required="view_services_fees"
    // Allow both explicit and short forms
    view: ['pos.service_fees.view_service_fees', 'view_services_fees'],
    // export => view fallback
  },

  // Merchant - Contract Terms
  contractTerms: {
    view: ['pos.contract_terms.view_contract_terms', 'view_contract_terms'],
  },

  // Merchant - User Groups (route uses short keys)
  userGroups: {
    view: ['pos.user_groups.view_users_groups', 'view_users_groups'],
    create: ['pos.user_groups.create_users_groups', 'create_users_groups'],
    edit: ['pos.user_groups.edit_users_groups', 'edit_users_groups'],
    delete: ['pos.user_groups.delete_users_groups', 'delete_users_groups'],
  },

  // Merchant/Sales - Customers
  customers: {
    // Support both sales and short merchant usage
    view: ['sales.customers.view_customers', 'view_customers'],
    create: ['sales.customers.create_customers', 'create_customers'],
    edit: ['sales.customers.edit_customers', 'edit_customers'],
    delete: ['sales.customers.delete_customers', 'delete_customers'],
    import: ['sales.customers.import_customers'],
    export: ['sales.customers.export_customers'], // will also fallback to view
  },

  // Sales - Products (for completeness if reused)
  products: {
    view: 'sales.products.view_products',
    create: 'sales.products.create_products',
    edit: 'sales.products.edit_products',
    delete: 'sales.products.delete_products',
    import: 'sales.products.import_products',
    export: 'sales.products.export_products',
  },
};

/** Sync with admin `PermissionRoute` for user-groups edit — includes legacy typo keys from older roles. */
export const USER_GROUP_EDIT_PERMISSIONS = [
  'pos.user_groups.edit_users_groups',
  'edit_users_groups',
  'pos.users_groups.edit',
  'pos.user_groups.edit_users_group',
];

function normalizeToArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

export function hasPermission(permission) {
  if (!permission) return false;

  // Prefer existing can() from store if provided
  const storeCan = useAuthStore.getState()?.can;
  if (typeof storeCan === 'function') {
    try {
      return storeCan(permission);
    } catch {
      // fall through to manual check
    }
  }

  const user = useAuthStore.getState()?.user;
  const permissions =
    user?.permissions ||
    user?.scopes ||
    user?.abilities ||
    [];

  const asArray = normalizeToArray(permission);
  if (asArray.length === 0) return false;

  return asArray.some((perm) => permissions?.includes?.(perm));
}

function resolveResourcePermission(resourceKey, actionKey = 'view') {
  const resource = permissionMap[resourceKey];
  if (!resource) return null;
  const entry = resource[actionKey];
  if (!entry) return null;
  return entry;
}

// Hook: useCan('branches.create') or useCan('pos.branches.create_branches') or useCan(['a','b'])
export function useCan(target) {
  // Using store subscription to re-render on auth change
  useAuthStore((s) => s.user); // subscribe to changes

  if (!target) return false;

  // Full permission string or array provided
  if (typeof target === 'string' && target.includes('.')) {
    return hasPermission(target);
  }
  if (Array.isArray(target)) {
    return target.some((perm) => hasPermission(perm));
  }

  // Shorthand "resource.action"
  if (typeof target === 'string') {
    const [resourceKey, actionKey = 'view'] = target.split('.');
    const perm = resolveResourcePermission(resourceKey, actionKey);
    if (!perm) return false;
    return hasPermission(perm);
  }

  return false;
}

// Component guard
export function Can({ anyOf, required, children, fallback = null }) {
  const allowed =
    (required && useCan(required)) ||
    (anyOf && Array.isArray(anyOf) && anyOf.some((rule) => useCan(rule)));
  return allowed ? children : fallback;
}

// Export helper: explicit export permission if present; otherwise, allow when user has view
export function canExport(resourceKey) {
  const resource = permissionMap[resourceKey];
  if (!resource) return false;
  const explicitExport = resource.export || resource.download;
  if (explicitExport) {
    if (hasPermission(explicitExport)) return true;
  }
  const viewPerm = resource.view;
  return hasPermission(viewPerm);
}










import React from 'react';
import { Navigate } from 'react-router-dom';
import useAuthStore from '../../stores/authStore';

const MerchantDefaultRedirect = () => {
  const { merchant } = useAuthStore();

  const merchantScopes = Array.isArray(merchant?.scopes) ? merchant.scopes : [];
  const hasSoftPosScope = merchantScopes.includes('softpos');
  const hasCashierScope = merchantScopes.includes('cashier');

  const planScopes = Array.isArray(merchant?.plan?.plan_scopes) ? merchant.plan.plan_scopes : [];
  const posScopeTypes = ['users', 'branches', 'terminals', 'transactions', 'batches', 'settlements', 'payment_links'];
  const salesScopeTypes = ['categories', 'products', 'customers', 'suppliers', 'purchases', 'sales'];

  const posScopes = planScopes.filter((scope) => scope.module === 'pos' && posScopeTypes.includes(scope.scope_type));
  const salesScopes = planScopes.filter((scope) => scope.module === 'cashier' && salesScopeTypes.includes(scope.scope_type));

  console.log(posScopes , 'posScopes');
  console.log(salesScopes , 'salesScopes');
  const hasAnyPosScopesEnabled =
    planScopes.length === 0
      ? hasSoftPosScope
      : posScopes.length > 0 && posScopes.some((scope) => scope.is_enabled === true);

  const hasAnySalesScopesEnabled =
    planScopes.length === 0
      ? hasCashierScope
      : salesScopes.length > 0 && salesScopes.some((scope) => scope.is_enabled === true);

  if (hasAnyPosScopesEnabled) {
    return <Navigate to="/merchant/dashboard" replace />;
  }

  if (hasAnySalesScopesEnabled) {
    return <Navigate to="/sales/dashboard" replace />;
  }

  // Fallback to merchant dashboard
  return <Navigate to="/merchant/dashboard" replace />;
};

export default MerchantDefaultRedirect;




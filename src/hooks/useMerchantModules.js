import { useMemo } from 'react';
import useAuthStore from '../stores/authStore';

// Define scope types per module (kept in sync with Sidebar)
const POS_SCOPE_TYPES = ['users', 'terminals', 'transactions', 'batches', 'settlements', 'payment_links'];
const SALES_SCOPE_TYPES = ['branches', 'categories', 'products', 'customers', 'suppliers', 'purchases', 'sales'];

/**
 * Centralized helper for merchant module visibility (POS vs Cashier/Sales)
 * Re-uses the same plan-scope logic used in the Sidebar.
 */
const useMerchantModules = () => {
    const merchant = useAuthStore(state => state.merchant);

    // Legacy scopes array on merchant
    const merchantScopes = Array.isArray(merchant?.scopes) ? merchant.scopes : [];
    const hasSoftPosScope = merchantScopes.includes('softpos');
    const hasCashierScope = merchantScopes.includes('cashier');

    // Plan scopes from merchant.plan.plan_scopes
    const planScopes = Array.isArray(merchant?.plan?.plan_scopes) ? merchant.plan.plan_scopes : [];

    const { hasPosModule, hasCashierModule, enabledModules, isScopeEnabled, hasScopeFor } = useMemo(() => {
        const posScopes = planScopes.filter(scope => scope.module === 'pos');
        const salesScopes = planScopes.filter(scope => scope.module === 'cashier');

        const isScopeEnabledFn = (scopeType) => {
            const scope = planScopes.find(s => s.scope_type === scopeType);
            return scope?.is_enabled === true;
        };

        const hasScopeForFn = (scopeType) => {
            return planScopes.some(s => s.scope_type === scopeType);
        };

        const shouldShowModule = (module) => {
            if (planScopes.length === 0) {
                // Fall back to legacy merchant scopes if plan scopes are missing
                if (module === 'pos') return hasSoftPosScope;
                if (module === 'cashier') return hasCashierScope;
                return false;
            }

            if (module === 'pos') {
                const posScopesInPlan = posScopes.filter(scope => POS_SCOPE_TYPES.includes(scope.scope_type));
                if (posScopesInPlan.length > 0) {
                    const allDisabled = posScopesInPlan.every(scope => scope.is_enabled === false);
                    if (allDisabled) return false;
                    return true;
                }
                return hasSoftPosScope;
            }

            if (module === 'cashier') {
                const salesScopesInPlan = salesScopes.filter(scope => SALES_SCOPE_TYPES.includes(scope.scope_type));
                if (salesScopesInPlan.length > 0) {
                    const allDisabled = salesScopesInPlan.every(scope => scope.is_enabled === false);
                    if (allDisabled) return false;
                    return true;
                }
                return hasCashierScope;
            }

            return false;
        };

        const hasPos = shouldShowModule('pos') && hasSoftPosScope;
        const hasCashier = shouldShowModule('cashier') && hasCashierScope;

        const modules = [];
        if (hasPos) modules.push('pos');
        if (hasCashier) modules.push('cashier');

        return {
            hasPosModule: hasPos,
            hasCashierModule: hasCashier,
            enabledModules: modules,
            isScopeEnabled: isScopeEnabledFn,
            hasScopeFor: hasScopeForFn,
        };
    }, [planScopes, hasSoftPosScope, hasCashierScope]);

    return {
        hasPosModule,
        hasCashierModule,
        enabledModules,
        moduleCount: enabledModules.length,
        isScopeEnabled,
        hasScopeFor,
    };
};

export default useMerchantModules;







import { describe, it, expect, beforeEach } from 'vitest';
import { hasPermission, canExport, permissionMap } from '../permissions';
import useAuthStore from '../../stores/authStore';

describe('permissions', () => {
    beforeEach(() => {
        useAuthStore.setState({
            user: { permissions: ['pos.dashboard.view_dashboard', 'view_users'] },
            permissions: ['pos.dashboard.view_dashboard', 'view_users'],
        });
    });

    describe('hasPermission', () => {
        it('returns true when user has exact permission', () => {
            expect(hasPermission('view_users')).toBe(true);
        });

        it('returns false when permission is missing', () => {
            expect(hasPermission('pos.roles.delete_roles')).toBe(false);
        });

        it('returns false for empty permission', () => {
            expect(hasPermission('')).toBe(false);
        });
    });

    describe('canExport', () => {
        it('allows export when view permission exists and no explicit export', () => {
            useAuthStore.setState({
                user: { permissions: ['view_customers'] },
                permissions: ['view_customers'],
            });
            expect(canExport('customers')).toBe(true);
        });

        it('returns false for unknown resource', () => {
            expect(canExport('nonexistent_resource')).toBe(false);
        });
    });

    describe('permissionMap', () => {
        it('defines dashboard permissions', () => {
            expect(permissionMap.dashboard.view).toBe('pos.dashboard.view_dashboard');
        });
    });
});

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import i18n from '../i18n/config';
import { AUTH_ENDPOINTS } from '../utils/constants';
import { get, post, setToken, removeToken, setUser, setMerchant, getToken, getUser, getMerchant } from '../utils/api';
import {
    formatAmountWithSymbol,
    formatRecordCurrency as formatRecordCurrencyAmount,
    getCurrencyLocale as resolveIntlLocale,
    getLanguageCode,
    resolveCurrencySymbol,
    resolveTranslatable,
} from '../utils/currencyUtils';

const extractMerchantData = (user, merchant) => {
    return merchant || user?.merchant || null;
};

const useAuthStore = create(
    devtools(
        persist(
        (set, get) => ({
            // State
            user: null,
            merchant: null,
            token: null,
            roles: [],
            permissions: [],
            custom_region: false,
            regions: [],
            isAuthenticated: false,
            loading: false,
            error: null,
            profileLoading: false,
            profileLoaded: false,
            profileError: null,
            testMode: false, // New test mode state
            currencyLang: getLanguageCode(),

            // Initialize auth from localStorage
            initialize: () => {
                const token = getToken();
                const user = getUser();
                const merchant = getMerchant();
                const storedTestMode = localStorage.getItem('testMode') === 'true';
                
                if (token && user) {
                    const customRegion = user?.custom_region === true || user?.custom_regeon === true;
                    const regionsList = Array.isArray(user?.regions) ? user.regions : [];
                    
                    set({
                        token,
                        user,
                        merchant,
                        roles: Array.isArray(user?.roles) ? user.roles : [],
                        permissions: Array.isArray(user?.permissions) ? user.permissions : [],
                        custom_region: customRegion,
                        regions: regionsList,
                        isAuthenticated: true,
                        profileLoaded: !!(user || merchant),
                        profileError: null,
                        testMode: storedTestMode,
                    });
                }
            },

            // Login action
            login: async (credentials) => {
                set({ loading: true, error: null });
                
                try {
                    const response = await post(AUTH_ENDPOINTS.LOGIN, credentials);
                    
                    // Handle AuthService response format: { status: true, data: { user, token, token_type } }
                    if (response.data.status === true || response.data.success === true) {
                        const { token, access_token, user, merchant, onboarding_completed } = response.data.data;
                        const merchantData = extractMerchantData(user, merchant);
                        const authToken = token || access_token; // Support both formats
                        // Single source of truth for the routing decision.
                        const onboardingCompleted =
                            onboarding_completed
                            ?? user?.onboarding_completed
                            ?? !!(merchantData || user?.merchant_id);

                        setToken(authToken);
                        setUser(user);
                        if (merchantData) {
                            setMerchant(merchantData);
                        }
                        
                        const customRegion = user?.custom_region === true || user?.custom_regeon === true;
                        const regionsList = Array.isArray(user?.regions) ? user.regions : [];
                        
                        set({
                            token: authToken,
                            user,
                            merchant: merchantData,
                            roles: Array.isArray(user?.roles) ? user.roles : [],
                            permissions: Array.isArray(user?.permissions) ? user.permissions : [],
                            custom_region: customRegion,
                            regions: regionsList,
                            isAuthenticated: true,
                            error: null,
                            profileLoaded: false,
                            profileError: null,
                        });

                        // Onboarding not done → go straight to step 2. No need to await
                        // fetchProfile for the routing decision; fire it in the background
                        // so the store still gets populated.
                        if (!onboardingCompleted) {
                            get().fetchProfile().catch(() => {});
                            return {
                                success: true,
                                user,
                                merchant: null,
                                onboarding_completed: false,
                                needsMerchantRegistration: true,
                            };
                        }

                        // Onboarding complete → load full merchant data for the dashboard.
                        try {
                            const profileResult = await get().fetchProfile();
                            return {
                                ...profileResult,
                                onboarding_completed: profileResult.onboarding_completed ?? true,
                            };
                        } catch (profileError) {
                            console.warn('Login profile refresh failed:', profileError);
                            return {
                                success: true,
                                user,
                                merchant: merchantData,
                                onboarding_completed: true,
                                needsMerchantRegistration: false,
                            };
                        }
                    } else {
                        throw new Error(response.data.message || 'Login failed');
                    }
                } catch (error) {
                    const errorMessage = error.response?.data?.message || error.message || 'Login failed';
                    set({ 
                        loading: false, 
                        error: errorMessage,
                        isAuthenticated: false,
                    });
                    throw error;
                }
            },

            /** Complete login after Google OAuth callback (one-time `code` from query string). */
            exchangeGoogleOAuthCode: async (code) => {
                set({ loading: true, error: null });

                try {
                    const response = await post(AUTH_ENDPOINTS.GOOGLE_OAUTH_EXCHANGE, { code });

                    if (response.data.status === true || response.data.success === true) {
                        const { token, access_token, user, merchant, onboarding_completed } = response.data.data;
                        const merchantData = extractMerchantData(user, merchant);
                        const authToken = token || access_token;
                        const onboardingCompleted =
                            onboarding_completed
                            ?? user?.onboarding_completed
                            ?? !!(merchantData || user?.merchant_id);

                        setToken(authToken);
                        setUser(user);
                        if (merchantData) {
                            setMerchant(merchantData);
                        }

                        const customRegion = user?.custom_region === true || user?.custom_regeon === true;
                        const regionsList = Array.isArray(user?.regions) ? user.regions : [];

                        set({
                            token: authToken,
                            user,
                            merchant: merchantData,
                            roles: Array.isArray(user?.roles) ? user.roles : [],
                            permissions: Array.isArray(user?.permissions) ? user.permissions : [],
                            custom_region: customRegion,
                            regions: regionsList,
                            isAuthenticated: true,
                            error: null,
                            profileLoaded: false,
                            profileError: null,
                        });

                        if (!onboardingCompleted) {
                            get().fetchProfile().catch(() => {});
                            return {
                                success: true,
                                user,
                                merchant: null,
                                onboarding_completed: false,
                                needsMerchantRegistration: true,
                            };
                        }

                        try {
                            const profileResult = await get().fetchProfile();
                            return {
                                ...profileResult,
                                onboarding_completed: profileResult.onboarding_completed ?? true,
                            };
                        } catch (profileError) {
                            console.warn('Google OAuth profile refresh failed:', profileError);
                            return {
                                success: true,
                                user,
                                merchant: merchantData,
                                onboarding_completed: true,
                                needsMerchantRegistration: false,
                            };
                        }
                    }

                    throw new Error(response.data.message || 'Google sign-in failed');
                } catch (error) {
                    const errorMessage = error.response?.data?.message || error.message || 'Google sign-in failed';
                    set({
                        loading: false,
                        error: errorMessage,
                        isAuthenticated: false,
                    });
                    throw error;
                }
            },

            // Register action
            register: async (userData) => {
                set({ loading: true, error: null });
                
                try {
                    const response = await post(AUTH_ENDPOINTS.REGISTER, userData);
                    
                    // Handle AuthService response format: { status: true, data: { user, token, token_type } }
                    if (response.data.status === true || response.data.success === true) {
                        const { token, access_token, user, merchant } = response.data.data;
                        const merchantData = merchant || user?.merchant || null;
                        const authToken = token || access_token; // Support both formats
                        
                        // Store in localStorage
                        setToken(authToken);
                        setUser(user);
                        if (merchantData) {
                            setMerchant(merchantData);
                        }
                        
                        // Update store
                        set({
                            token: authToken,
                            user,
                            merchant: merchantData,
                            isAuthenticated: true,
                            loading: false,
                            error: null,
                        });
                        
                        return { success: true, user, merchant };
                    } else {
                        throw new Error(response.data.message || 'Registration failed');
                    }
                } catch (error) {
                    const errorMessage = error.response?.data?.message || error.message || 'Registration failed';
                    set({ 
                        loading: false, 
                        error: errorMessage,
                        isAuthenticated: false,
                    });
                    throw error;
                }
            },

            // Logout action
            logout: async () => {
                set({ loading: true });
                
                try {
                    const token = get().token;
                    if (token) {
                        // Call logout API
                        await post(AUTH_ENDPOINTS.LOGOUT, {});
                    }
                } catch (error) {
                    console.error('Logout API error:', error);
                    // Continue with local logout even if API fails
                } finally {
                    // Clear localStorage
                    removeToken();
                    
                    // Clear store
                    set({
                        user: null,
                        merchant: null,
                        token: null,
                        roles: [],
                        permissions: [],
                        custom_region: false,
                        regions: [],
                        isAuthenticated: false,
                        loading: false,
                        error: null,
                        profileLoading: false,
                        profileLoaded: false,
                        profileError: null,
                    });
                }
            },

            // Force logout (all devices)
            forceLogout: async () => {
                set({ loading: true });
                
                try {
                    const token = get().token;
                    if (token) {
                        await post(AUTH_ENDPOINTS.FORCE_LOGOUT, {});
                    }
                } catch (error) {
                    console.error('Force logout API error:', error);
                } finally {
                    removeToken();
                    set({
                        user: null,
                        merchant: null,
                        token: null,
                        roles: [],
                        permissions: [],
                        custom_region: false,
                        regions: [],
                        isAuthenticated: false,
                        loading: false,
                        error: null,
                        profileLoading: false,
                        profileLoaded: false,
                        profileError: null,
                    });
                }
            },

            // Fetch user profile
            fetchProfile: async () => {
                set({ 
                    profileLoading: true, 
                    profileLoaded: false,
                    error: null,
                    profileError: null 
                });
                
                try {
                    const token = get().token;
                    if (!token) {
                        throw new Error('No authentication token');
                    }
                    
                    const response = await get(AUTH_ENDPOINTS.PROFILE_ME);
                    
                    // Handle AuthService response format
                    if (response.data.status === true || response.data.success === true) {
                        const { user, merchant, onboarding_completed } = response.data.data;
                        const merchantData = extractMerchantData(user, merchant);

                        // Single source of truth: prefer top-level flag, then user.onboarding_completed,
                        // and finally derive from merchant_id (legacy fallback).
                        const onboardingCompleted =
                            onboarding_completed
                            ?? user?.onboarding_completed
                            ?? !!(merchantData || user?.merchant_id);

                        setUser(user);
                        if (merchantData) {
                            setMerchant(merchantData);
                        }
                        
                        // Extract custom_region and regions
                        const customRegion = user?.custom_region === true || user?.custom_regeon === true;
                        const regionsList = Array.isArray(user?.regions) ? user.regions : [];
                        
                        set({
                            user,
                            merchant: merchantData,
                            roles: Array.isArray(user?.roles) ? user.roles : [],
                            permissions: Array.isArray(user?.permissions) ? user.permissions : [],
                            custom_region: customRegion,
                            regions: regionsList,
                            loading: false,
                            profileLoading: false,
                            profileLoaded: true,
                            profileError: null,
                        });

                        return {
                            success: true,
                            user,
                            merchant: merchantData,
                            onboarding_completed: onboardingCompleted,
                            needsMerchantRegistration: !onboardingCompleted,
                        };
                    } else {
                        throw new Error(response.data.message || 'Failed to fetch profile');
                    }
                } catch (error) {
                    const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch profile';
                    set({ 
                        loading: false, 
                        error: errorMessage,
                        profileLoading: false,
                        profileLoaded: false,
                        profileError: errorMessage,
                    });
                    throw error;
                }
            },

            syncProfileData: (user, merchant = null) => {
                const merchantData = extractMerchantData(user, merchant);
                if (user) {
                    setUser(user);
                }
                if (merchantData) {
                    setMerchant(merchantData);
                }
                
                // Extract custom_region and regions from user/admin data
                const customRegion = user?.custom_region === true || user?.custom_regeon === true;
                const regionsList = Array.isArray(user?.regions) ? user.regions : [];
                
                set({
                    user: user ?? null,
                    merchant: merchantData,
                    roles: Array.isArray(user?.roles) ? user.roles : [],
                    permissions: Array.isArray(user?.permissions) ? user.permissions : [],
                    custom_region: customRegion,
                    regions: regionsList,
                    profileLoaded: true,
                    profileLoading: false,
                    profileError: null,
                });
            },

            // Update profile
            updateProfile: async (profileData) => {
                set({ loading: true, error: null });
                
                try {
                    const token = get().token;
                    if (!token) {
                        throw new Error('No authentication token');
                    }
                    
                    const response = await post(AUTH_ENDPOINTS.UPDATE_PROFILE, profileData, {
                        headers: {
                            'Content-Type': 'multipart/form-data',
                        },
                    });
                    
                    // Handle AuthService response format
                    if (response.data.status === true || response.data.success === true) {
                        const { user } = response.data.data;
                        
                        setUser(user);
                        
                        set({
                            user,
                            loading: false,
                        });
                        
                        return { success: true, user };
                    } else {
                        throw new Error(response.data.message || 'Failed to update profile');
                    }
                } catch (error) {
                    const errorMessage = error.response?.data?.message || error.message || 'Failed to update profile';
                    set({ 
                        loading: false, 
                        error: errorMessage,
                    });
                    throw error;
                }
            },

            // Change password
            changePassword: async (passwordData) => {
                set({ loading: true, error: null });
                
                try {
                    const token = get().token;
                    if (!token) {
                        throw new Error('No authentication token');
                    }
                    
                    const response = await post(AUTH_ENDPOINTS.CHANGE_PASSWORD, passwordData);
                    
                    // Handle AuthService response format
                    if (response.data.status === true || response.data.success === true) {
                        set({ loading: false });
                        return { success: true };
                    } else {
                        throw new Error(response.data.message || 'Failed to change password');
                    }
                } catch (error) {
                    const errorMessage = error.response?.data?.message || error.message || 'Failed to change password';
                    set({ 
                        loading: false, 
                        error: errorMessage,
                    });
                    throw error;
                }
            },

            // Check authentication status
            checkAuth: () => {
                const token = getToken();
                const user = getUser();
                return !!(token && user);
            },

            // Check if user is admin
            isAdmin: () => {
                const user = get().user;
                return user && user.is_admin === true;
            },

            // Authorization helpers
            hasRole: (role) => {
                const roles = get().roles || [];
                return roles.includes(role);
            },
            hasAnyRole: (rolesToCheck = []) => {
                const roles = get().roles || [];
                return Array.isArray(rolesToCheck) && rolesToCheck.some(r => roles.includes(r));
            },
            can: (permission) => {
                const permissions = get().permissions || [];
                if (!permission) return false;
                if (permissions.includes(permission)) return true;
                
                // Grant via base/module permission (e.g., 'settlements' implies 'view_settlements', 'edit_settlements', etc.)
                // Strip common action prefixes to get the module/resource name
                const actionPrefixes = [
                    'view_', 'create_', 'edit_', 'delete_', 'assign_', 'request_',
                    'activate_', 'deactivate_', 'reset_', 'void_', 'refund_'
                ];
                let base = permission;
                for (const prefix of actionPrefixes) {
                    if (base.startsWith(prefix)) {
                        base = base.substring(prefix.length);
                        break;
                    }
                }
                // If user has the base permission, allow
                if (permissions.includes(base)) return true;
                
                // If permission is namespaced (e.g., 'module.area.action'),
                // allow if user has the namespace base (e.g., 'module.area')
                const lastDot = permission.lastIndexOf('.');
                if (lastDot > 0) {
                    const namespaceBase = permission.substring(0, lastDot);
                    if (permissions.includes(namespaceBase)) return true;
                }
                
                // Special case: dashboard base implies view_dashboard
                if (permission === 'view_dashboard' && permissions.includes('dashboard')) return true;
                
                return false;
            },
            canAny: (permissionsToCheck = []) => {
                if (!Array.isArray(permissionsToCheck) || permissionsToCheck.length === 0) return false;
                return permissionsToCheck.some(p => get().can(p));
            },

            // Check admin access
            checkAdminAccess: () => {
                const token = getToken();
                const user = getUser();
                return !!(token && user && user.is_admin === true);
            },

            // Clear error
            clearError: () => {
                set({ error: null });
            },

            // Set loading
            setLoading: (loading) => {
                set({ loading });
            },

            // Toggle test mode
            toggleTestMode: () => {
                const currentTestMode = get().testMode;
                const newTestMode = !currentTestMode;
                localStorage.setItem('testMode', newTestMode.toString());
                set({ testMode: newTestMode });
                return newTestMode;
            },

            // Get test mode status
            isTestMode: () => {
                return get().testMode;
            },

            // Currency helpers (locale-aware: en / ar)
            getCurrencyObject: () => {
                const merchant = get().merchant;
                if (!merchant) return null;
                return (
                    merchant.currency ||
                    merchant.currency_object ||
                    merchant.merchantCurrency ||
                    null
                );
            },

            getCurrencyCode: () => {
                const currencyObj = get().getCurrencyObject();
                const code = resolveTranslatable(currencyObj?.currency_code, get().currencyLang);
                if (code) return code;
                const merchant = get().merchant;
                return merchant?.currency_code || 'USD';
            },

            getCurrencyLocale: () => resolveIntlLocale(get().currencyLang),

            getCurrencySymbol: () => {
                const merchant = get().merchant;
                if (typeof merchant?.currency_symbol === 'string' && merchant.currency_symbol.trim()) {
                    return merchant.currency_symbol.trim();
                }
                const currencyObj = get().getCurrencyObject();
                const symbol = resolveCurrencySymbol(currencyObj, get().currencyLang);
                return symbol || '';
            },

            formatCurrency: (amount) => {
                return formatAmountWithSymbol(
                    amount,
                    get().getCurrencySymbol(),
                    get().currencyLang
                );
            },

            formatRecordCurrency: (amount, record) => {
                return formatRecordCurrencyAmount(
                    amount,
                    record,
                    get().currencyLang,
                    get().getCurrencySymbol()
                );
            },
        }),
            {
                name: 'auth-storage',
                partialize: (state) => ({
                    token: state.token,
                    user: state.user,
                    merchant: state.merchant,
                    roles: state.roles,
                    permissions: state.permissions,
                    custom_region: state.custom_region,
                    regions: state.regions,
                    isAuthenticated: state.isAuthenticated,
                    testMode: state.testMode,
                }),
            }
        ),
        { name: 'authStore' }
    )
);

export default useAuthStore;

i18n.on('languageChanged', (lng) => {
    useAuthStore.setState({ currencyLang: getLanguageCode(lng) });
});


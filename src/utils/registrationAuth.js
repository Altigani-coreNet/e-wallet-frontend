import axios from 'axios';
import { AUTH_ENDPOINTS } from './constants';
import {
    clearRegistrationSession,
    getRegistrationToken,
    getToken,
    removeToken,
} from './api';
import useAuthStore from '../stores/authStore';
import useRegistrationStore from '../stores/useRegistrationStore';

/**
 * End registration and allow a fresh merchant login (no auto-redirect to dashboard).
 */
export function releaseRegistrationForLogin() {
    const registrationToken = getRegistrationToken();
    const dashboardToken = getToken();

    clearRegistrationSession();

    // Older builds stored the registration JWT as the dashboard session
    if (dashboardToken && (!registrationToken || dashboardToken === registrationToken)) {
        removeToken();
    }

    localStorage.removeItem('user_data');

    useRegistrationStore.getState().clearRegistration();

    useAuthStore.setState({
        user: null,
        merchant: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        profileLoaded: false,
        profileLoading: false,
        profileError: null,
        error: null,
    });
}

/**
 * Load merchant id during onboarding without promoting the JWT to a dashboard session.
 */
export async function fetchRegistrationProfile(regToken) {
    if (!regToken) return null;

    const response = await axios.get(AUTH_ENDPOINTS.PROFILE_ME, {
        headers: {
            Authorization: `Bearer ${regToken}`,
            Accept: 'application/json',
        },
    });

    if (response.data?.status !== true && response.data?.success !== true) {
        return null;
    }

    const { merchant, user } = response.data.data ?? {};
    return merchant?.id ?? user?.merchant_id ?? null;
}

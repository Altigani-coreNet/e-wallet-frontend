import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { setToken, setUser } from '../utils/api';

const useRegistrationStore = create(
    devtools(
        persist(
            (set, get) => ({
                // Registration state
                registrationToken: null,
                registrationUser: null,
                currentStep: 0,
                formData: {},
                isRegistrationInProgress: false,
                savedProgress: null,

                // Set registration token (received after password setup)
                setRegistrationToken: (token, userData) => {
                    if (token) {
                        // Store in localStorage for API calls
                        setToken(token);
                        if (userData) {
                            setUser(userData);
                            localStorage.setItem('user_data', JSON.stringify(userData));
                        }
                    }
                    set({ 
                        registrationToken: token,
                        registrationUser: userData,
                        isRegistrationInProgress: true
                    });
                },

                // Update registration progress
                updateRegistrationProgress: (step, formData) => {
                    set({ 
                        currentStep: step,
                        formData: formData || {},
                        isRegistrationInProgress: step < 4 // Not completed
                    });
                },

                // Save progress to store
                saveProgress: (step, formData) => {
                    const currentToken = get().registrationToken;
                    const currentUser = get().registrationUser;
                    const progressData = {
                        currentStep: step,
                        formData: formData || {},
                        savedAt: new Date().toISOString(),
                        token: currentToken,
                        user: currentUser
                    };
                    set({ savedProgress: progressData });
                },

                // Load saved progress
                loadProgress: () => {
                    return get().savedProgress;
                },

                // Restore progress
                restoreProgress: (progressData) => {
                    if (progressData) {
                        set({
                            currentStep: progressData.currentStep || 0,
                            formData: progressData.formData || {},
                            registrationToken: progressData.token || null,
                            registrationUser: progressData.user || null,
                            isRegistrationInProgress: true
                        });
                        
                        // Restore token to localStorage if exists
                        if (progressData.token) {
                            setToken(progressData.token);
                        }
                        if (progressData.user) {
                            setUser(progressData.user);
                            localStorage.setItem('user_data', JSON.stringify(progressData.user));
                        }
                    }
                },

                // Clear registration data
                clearRegistration: () => {
                    set({
                        registrationToken: null,
                        registrationUser: null,
                        currentStep: 0,
                        formData: {},
                        isRegistrationInProgress: false,
                        savedProgress: null
                    });
                },

                // Check if registration is in progress
                hasRegistrationProgress: () => {
                    const progress = get().savedProgress;
                    if (!progress) {
                        // Also check if we have current step > 0 or token
                        const currentStep = get().currentStep;
                        const token = get().registrationToken;
                        return currentStep > 0 || !!token;
                    }
                    
                    // Check if progress is recent (within 30 days)
                    const savedDate = new Date(progress.savedAt);
                    const daysSinceSave = (new Date() - savedDate) / (1000 * 60 * 60 * 24);
                    return daysSinceSave < 30;
                }
            }),
            {
                name: 'registration-storage',
                partialize: (state) => ({
                    registrationToken: state.registrationToken,
                    registrationUser: state.registrationUser,
                    currentStep: state.currentStep,
                    formData: state.formData,
                    isRegistrationInProgress: state.isRegistrationInProgress,
                    savedProgress: state.savedProgress,
                }),
            }
        ),
        { name: 'registrationStore' }
    )
);

export default useRegistrationStore;


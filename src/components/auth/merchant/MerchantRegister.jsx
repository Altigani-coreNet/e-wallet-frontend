import React, { useState, useEffect, useRef, useMemo } from 'react';
import classNames from 'classnames';
import Swal from 'sweetalert2';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AUTH_ENDPOINTS, AUTH_SERVICE_BASE } from '../../../utils/constants';
import { validateRegistrationPhone } from '../../../utils/registrationPhoneRules';
import { getToken } from '../../../utils/api';
import useRegistrationStore from '../../../stores/useRegistrationStore';
import useAuthStore from '../../../stores/authStore';

// Step Components
import AccountDetails from './steps/AccountDetails';
import AccountVerification from './steps/AccountVerification';
import MerchantProfile from './steps/MerchantProfile';
import BusinessDocuments from './steps/BusinessDocuments';
import CompletionStep from './steps/CompletionStep';

// LocalStorage key for saving registration progress
const REGISTRATION_STORAGE_KEY = 'merchant_registration_progress';

const MerchantRegister = () => {
    const { t } = useTranslation();
    const steps = useMemo(
        () => [
            {
                title: t('auth.merchantRegister.steps.accountDetails.title'),
                description: t('auth.merchantRegister.steps.accountDetails.description'),
            },
            {
                title: t('auth.merchantRegister.steps.accountVerification.title'),
                description: t('auth.merchantRegister.steps.accountVerification.description'),
            },
            {
                title: t('auth.merchantRegister.steps.merchantProfile.title'),
                description: t('auth.merchantRegister.steps.merchantProfile.description'),
            },
            {
                title: t('auth.merchantRegister.steps.businessDocuments.title'),
                description: t('auth.merchantRegister.steps.businessDocuments.description'),
            },
            {
                title: t('auth.merchantRegister.steps.completed.title'),
                description: t('auth.merchantRegister.steps.completed.description'),
            },
        ],
        [t]
    );
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    // Read plan_id from URL (e.g. ?plan_id=3). If missing, leave null and let backend fall back.
    const planIdFromUrl = searchParams.get('plan_id');
    
    // Use auth store to check if user is logged in
    const { user, merchant, token: authToken, isAuthenticated, fetchProfile } = useAuthStore();
    
    // Use registration store
    const {
        registrationToken,
        registrationUser,
        currentStep: storeCurrentStep,
        formData: storeFormData,
        setRegistrationToken,
        updateRegistrationProgress,
        saveProgress: saveProgressToStore,
        loadProgress: loadProgressFromStore,
        restoreProgress,
        clearRegistration,
        hasRegistrationProgress
    } = useRegistrationStore();

    // State for showing continue modal
    const [showContinueModal, setShowContinueModal] = useState(false);
    const [savedProgressData, setSavedProgressData] = useState(null);

    // Check if step is provided in URL query params (for redirect from login)
    const stepFromUrl = searchParams.get('step');
    
    // Get initial step from store first, then URL, then default to 0
    const storeStep = storeCurrentStep || 0;
    const initialStep = stepFromUrl ? parseInt(stepFromUrl, 10) : storeStep;

    // Initialize state first (before useEffect hooks that reference them)
    const [currentStep, setCurrentStep] = useState(initialStep); // Start at step from URL, store, or 0
    const [fieldErrors, setFieldErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    
    // Ref for AccountVerification's internal previous handler
    const accountVerificationPreviousRef = useRef(null);
    
    // Initialize formData from store if available, otherwise use defaults
    const defaultFormData = {
        // Account Details
        email: '',
        first_name: '',
        last_name: '',
        phone: '',
        nationality: '1',
        // Keep the exact plan from URL if provided; otherwise undefined (backend will default to Free/1)
        plan_id: planIdFromUrl ? Number(planIdFromUrl) : undefined,
        
        // Company Profile Details
        owner_name: '',
        business_name: '',
        business_type: '',
        business_phone: '',
        business_address: '',
        country: '',
        city: '',
        
        // Trade License Details
        trade_license_number: '',
        trade_license_start_date: '',
        trade_license_expired_date: '',
        trade_license_authority: '',
        
        // Tax Details
        tax_number: '',
        tax_certified_number: '',
        tax_id_number: '',
        vat_number: '',
        tax_registration_date: '',
        tax_authority: '',
        annual_turnover: '',
        
        // Document uploads
        company_logo: null,
        trade_license: null,
        tax_certification: null,
        user_id_document: null,
        
        // Terms and Conditions
        accept_terms: false
    };
    
    // Merge store formData with defaults, preserving plan_id from URL if present
    const initialFormData = {
        ...defaultFormData,
        ...(storeFormData || {}),
        // Ensure plan_id from URL takes precedence if provided
        ...(planIdFromUrl ? { plan_id: Number(planIdFromUrl) } : {})
    };
    
    const [formData, setFormData] = useState(initialFormData);

    // Debug: log plan id coming from URL and initial state (do not reset step - respect URL step or store)
    useEffect(() => {
        console.log('MerchantRegister - planIdFromUrl:', planIdFromUrl);
        console.log('MerchantRegister - initial formData.plan_id:', formData.plan_id);
    }, [planIdFromUrl]);

    // Debug: log whenever plan_id changes in formData
    useEffect(() => {
        console.log('MerchantRegister - formData.plan_id changed to:', formData.plan_id);
    }, [formData.plan_id]);

    // Helper function to save progress (both localStorage and store)
    const saveProgress = (step, data) => {
        try {
            // Exclude file objects from saved data (they can't be serialized)
            const dataToSave = {
                ...data,
                company_logo: null,
                trade_license: null,
                tax_certification: null,
                user_id_document: null
            };
            
            const progressData = {
                currentStep: step, // Make sure we save the exact step number
                formData: dataToSave,
                savedAt: new Date().toISOString(),
                token: registrationToken,
                user: registrationUser
            };
            
            console.log('=== SAVING REGISTRATION PROGRESS ===');
            console.log('Step:', step);
            console.log('Step name:', steps[step]?.title || 'Unknown');
            console.log('Has token:', !!registrationToken);
            console.log('Progress data:', progressData);
            console.log('=====================================');
            
            // Save to localStorage (backup)
            localStorage.setItem(REGISTRATION_STORAGE_KEY, JSON.stringify(progressData));
            
            // Save to store
            saveProgressToStore(step, dataToSave);
            updateRegistrationProgress(step, dataToSave);
        } catch (error) {
            console.error('Error saving registration progress:', error);
        }
    };

    // Helper function to clear saved progress (store + both localStorage keys so "Start new" and "Register another" start empty)
    const clearProgress = () => {
        try {
            localStorage.removeItem(REGISTRATION_STORAGE_KEY);
            localStorage.removeItem('registration-storage'); // Zustand persist key so store rehydrates empty
            clearRegistration();
            console.log('Registration progress cleared');
        } catch (error) {
            console.error('Error clearing registration progress:', error);
        }
    };

    // Load saved progress on component mount and restore directly from store
    useEffect(() => {
        // Get current auth state
        const currentAuth = useAuthStore.getState();
        const isUserLoggedIn = currentAuth.isAuthenticated && currentAuth.token && currentAuth.user && !currentAuth.merchant;
        
        // Check if user is logged in but has no merchant (redirected from login)
        if (isUserLoggedIn) {
            const loggedInUser = currentAuth.user;
            const loggedInToken = currentAuth.token;
            
            console.log('=== USER LOGGED IN BUT NO MERCHANT ===');
            console.log('User:', loggedInUser);
            console.log('Starting at step 2 (Merchant Profile)');
            console.log('=====================================');
            
            // Pre-fill form with user data
            const userFormData = {
                email: loggedInUser.email || '',
                first_name: loggedInUser.first_name || loggedInUser.name?.split(' ')[0] || '',
                last_name: loggedInUser.last_name || loggedInUser.name?.split(' ').slice(1).join(' ') || '',
                phone: loggedInUser.phone || '',
                nationality: loggedInUser.nationality || '1',
                // Preserve plan from URL if present when pre-filling from logged-in user
                plan_id: planIdFromUrl ? Number(planIdFromUrl) : formData.plan_id,
                // Leave merchant fields empty for user to fill
                owner_name: '',
                business_name: '',
                business_type: '',
                business_phone: '',
                business_address: '',
                country: '',
                city: '',
                trade_license_number: '',
                trade_license_start_date: '',
                trade_license_expired_date: '',
                trade_license_authority: '',
                tax_number: '',
                tax_certified_number: '',
                tax_id_number: '',
                vat_number: '',
                tax_registration_date: '',
                tax_authority: '',
                annual_turnover: '',
                company_logo: null,
                trade_license: null,
                tax_certification: null,
                user_id_document: null,
                accept_terms: false
            };
            
            // Set form data and step (step 2 = Merchant Profile)
            setFormData(userFormData);
            setCurrentStep(2);
            
            // Seed registrationToken so step-2 API call has a valid Bearer token
            if (loggedInToken) {
                setRegistrationToken(loggedInToken, loggedInUser);
                updateRegistrationProgress(2, userFormData);
                const progressData = {
                    currentStep: 2,
                    formData: userFormData,
                    savedAt: new Date().toISOString(),
                    token: loggedInToken,
                    user: loggedInUser
                };
                saveProgressToStore(2, userFormData);
                localStorage.setItem(REGISTRATION_STORAGE_KEY, JSON.stringify(progressData));
            }
            
            // Show alert with two options: proceed (stay on current step) or start new
            Swal.fire({
                icon: 'info',
                title: t('auth.registration.completeMerchantTitle'),
                text: t('auth.registration.completeMerchantText'),
                showCancelButton: true,
                confirmButtonText: t('auth.registration.proceedToRegister'),
                cancelButtonText: t('auth.common.startNewRegistration'),
            }).then((result) => {
                if (result.dismiss === Swal.DismissReason.cancel) {
                    handleStartNew();
                }
            });
            
            return; // Don't check for saved progress if user is logged in
        }
        
        // Read localStorage first so we can prefer the furthest step when both exist (fix: refresh on step 4 must not restore to step 3)
        let localStorageProgress = null;
        try {
            const savedData = localStorage.getItem(REGISTRATION_STORAGE_KEY);
            if (savedData) localStorageProgress = JSON.parse(savedData);
        } catch (e) {
            console.error('Error loading from localStorage:', e);
        }
        const localStep = localStorageProgress && typeof localStorageProgress.currentStep === 'number' ? localStorageProgress.currentStep : -1;
        const localHasProgress = localStep >= 0 && localStorageProgress && localStorageProgress.formData;

        // If URL has ?step=N, use that step so the user lands on the correct step
        const urlStepParam = searchParams.get('step');
        const urlStepNum = urlStepParam !== null && urlStepParam !== '' ? parseInt(urlStepParam, 10) : null;
        const validUrlStep = urlStepNum !== null && !Number.isNaN(urlStepNum) && urlStepNum >= 0 && urlStepNum < steps.length ? urlStepNum : null;

        // If we have valid progress in store (or localStorage with higher step), restore it
        const storeHasProgress = storeCurrentStep > 0 && storeFormData && Object.keys(storeFormData).length > 0;
        const useLocal = localHasProgress && (localStep > (storeCurrentStep || 0));
        let restoreStep = useLocal ? localStep : (storeCurrentStep || 0);
        const restoreFormData = useLocal ? (localStorageProgress.formData || {}) : (storeFormData || {});
        // URL step takes precedence so e.g. /merchant/register?step=2 opens step 2
        if (validUrlStep !== null) {
            restoreStep = validUrlStep;
        }

        // When we have saved progress (store or localStorage), show the continue modal so user can choose Proceed or Start new
        if (storeHasProgress || localHasProgress) {
            if (restoreStep > 0) {
                const daysSinceSave = localStorageProgress && localStorageProgress.savedAt
                    ? (new Date() - new Date(localStorageProgress.savedAt)) / (1000 * 60 * 60 * 24) : 0;
                if (useLocal && daysSinceSave >= 30) {
                    clearProgress();
                } else {
                    const restoredFormData = {
                        ...restoreFormData,
                        ...(planIdFromUrl && !restoreFormData.plan_id ? { plan_id: Number(planIdFromUrl) } : {}),
                    };
                    const progressForModal = {
                        currentStep: restoreStep,
                        formData: restoredFormData,
                        token: useLocal && localStorageProgress ? localStorageProgress.token : registrationToken,
                        user: useLocal && localStorageProgress ? localStorageProgress.user : registrationUser,
                        savedAt: localStorageProgress && localStorageProgress.savedAt ? localStorageProgress.savedAt : new Date().toISOString(),
                    };
                    console.log('=== FOUND SAVED PROGRESS (showing continue modal) ===');
                    console.log('Step:', restoreStep, steps[restoreStep]?.title || 'Unknown');
                    setSavedProgressData(progressForModal);
                    setShowContinueModal(true);
                    return;
                }
            }
        }

        // Fallback: only localStorage progress and no store (e.g. store not rehydrated yet)
        if (localStorageProgress) {
            const savedDate = new Date(localStorageProgress.savedAt);
            const daysSinceSave = (new Date() - savedDate) / (1000 * 60 * 60 * 24);
            if (daysSinceSave < 30) {
                if (!localStorageProgress.formData?.plan_id && planIdFromUrl) {
                    localStorageProgress.formData = {
                        ...(localStorageProgress.formData || {}),
                        plan_id: Number(planIdFromUrl),
                    };
                }
                setSavedProgressData(localStorageProgress);
                setShowContinueModal(true);
            } else {
                clearProgress();
            }
        }
    }, []); // Run only on mount

    // Handle continue registration
    const handleContinueRegistration = () => {
        if (savedProgressData) {
            // Restore the saved state - use the exact step from saved data
            const step = savedProgressData.currentStep !== undefined ? savedProgressData.currentStep : 0;
            const formDataToRestore = savedProgressData.formData || {};
            
            // Ensure plan_id is preserved from URL if not already present
            const restoredFormData = {
                ...formDataToRestore,
                ...(planIdFromUrl && !formDataToRestore.plan_id ? { plan_id: Number(planIdFromUrl) } : {}),
            };
            
            console.log('=== RESTORING REGISTRATION PROGRESS ===');
            console.log('Saved step:', step);
            console.log('Saved formData:', restoredFormData);
            console.log('Saved token:', savedProgressData.token ? 'Yes' : 'No');
            console.log('========================================');
            
            // Set the step first
            setCurrentStep(step);
            
            // Then restore form data
            setFormData(prev => ({
                ...prev,
                ...restoredFormData
            }));
            
            // Restore token and update store
            if (savedProgressData.token) {
                restoreProgress(savedProgressData);
            } else {
                // Update store with step and form data even if no token
                updateRegistrationProgress(step, formDataToRestore);
            }
            
            // Close modal
            setShowContinueModal(false);
            
            // Show success message with correct step number
            const stepName = steps[step]?.title || t('auth.registration.stepFallback', { n: step + 1 });
            Swal.fire({
                icon: 'success',
                title: t('auth.common.welcomeBack'),
                text: t('auth.registration.continuingFrom', { stepName, stepNumber: step + 1 }),
                timer: 2000,
                showConfirmButton: false,
                toast: true,
                position: 'top-end',
            });
        }
    };

    // Handle start new registration
    const handleStartNew = () => {
        clearProgress();
        setShowContinueModal(false);
        setSavedProgressData(null);
        setCurrentStep(0);
        setFormData({
            email: '',
            first_name: '',
            last_name: '',
            phone: '',
            nationality: '1',
            // When starting new, keep plan from URL if any so user’s choice is not lost
            plan_id: planIdFromUrl ? Number(planIdFromUrl) : undefined,
            owner_name: '',
            business_name: '',
            business_type: '',
            business_phone: '',
            business_address: '',
            country: '',
            city: '',
            trade_license_number: '',
            trade_license_start_date: '',
            trade_license_expired_date: '',
            trade_license_authority: '',
            tax_number: '',
            tax_certified_number: '',
            tax_id_number: '',
            vat_number: '',
            tax_registration_date: '',
            tax_authority: '',
            annual_turnover: '',
            company_logo: null,
            trade_license: null,
            tax_certification: null,
            user_id_document: null,
            accept_terms: false
        });
    };

    // Save progress when step changes
    useEffect(() => {
        // Skip saving on initial mount (when currentStep is 0 and form is empty)
        const hasData = Object.values(formData).some(value => {
            if (value === null || value === false) return false;
            if (typeof value === 'string') return value.trim() !== '';
            return true;
        });
        
        // Don't save step 0 on initial mount with empty form
        if (currentStep === 0 && !hasData) {
            return; // Don't save on initial mount with empty form
        }
        
        // Don't save step 0 if we have data (means user is moving forward, not staying on step 0)
        // Only save step 0 if user is actually on step 0 with data (which shouldn't happen normally)
        // For step 0, we only save when moving to step 1, not while on step 0
        if (currentStep === 0) {
            return; // Don't save step 0, wait until we move to step 1
        }
        
        console.log(`useEffect: Saving progress for step ${currentStep} (${steps[currentStep]?.title || 'Unknown'})`);
        saveProgress(currentStep, formData);
    }, [currentStep]); // Only depend on currentStep to avoid saving on every formData change

    // Save progress before page unload (user closes browser/tab)
    useEffect(() => {
        const handleBeforeUnload = () => {
            const hasData = Object.values(formData).some(value => {
                if (value === null || value === false) return false;
                if (typeof value === 'string') return value.trim() !== '';
                return true;
            });
            
            if (hasData && currentStep < steps.length - 1) {
                // Use synchronous localStorage API for beforeunload
                try {
                    const dataToSave = {
                        ...formData,
                        company_logo: null,
                        trade_license: null,
                        tax_certification: null,
                        user_id_document: null
                    };
                    
                    const progressData = {
                        currentStep: currentStep,
                        formData: dataToSave,
                        savedAt: new Date().toISOString()
                    };
                    
                    localStorage.setItem(REGISTRATION_STORAGE_KEY, JSON.stringify(progressData));
                } catch (error) {
                    console.error('Error saving progress on unload:', error);
                }
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [formData, currentStep]);

    const handleNext = async () => {
        if (currentStep === 0) {
            // Clear previous error
            setFieldErrors({});

            const phoneCheck = validateRegistrationPhone(formData.phone);
            if (!phoneCheck.ok) {
                setFieldErrors({ phone: [phoneCheck.message] });
                await Swal.fire({
                    icon: 'error',
                    title: t('auth.registration.invalidPhoneTitle'),
                    text: phoneCheck.message,
                    confirmButtonText: t('auth.common.ok'),
                });
                return;
            }

            try {
                const response = await fetch(AUTH_ENDPOINTS.REGISTER_VALIDATE, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email: formData.email,
                        first_name: formData.first_name,
                        last_name: formData.last_name,
                        phone: formData.phone,
                        type: 'email'
                    })
                });

                const data = await response.json();

                if (data.success) {
                    const nextStep = currentStep + 1; // This will be step 1
                    console.log(`Step 0 -> Step 1: Moving from step ${currentStep} to step ${nextStep}`);
                    
                    // Save step 1 immediately before changing state
                    saveProgress(nextStep, formData);
                    
                    // Then update the step
                    setCurrentStep(nextStep);
                    
                    // Also save again after state update to be sure
                    setTimeout(() => {
                        console.log(`Step 0 -> Step 1: Confirming save for step ${nextStep}`);
                        saveProgress(nextStep, formData);
                    }, 200);
                } else {
                    if (response.status === 422 && data.errors) {
                        setFieldErrors(data.errors);
                        
                        await Swal.fire({
                            icon: 'error',
                            title: t('auth.common.oops'),
                            text: t('auth.registration.missingFieldsText'),
                            confirmButtonText: t('auth.common.ok'),
                        });
                    } else {
                        await Swal.fire({
                            icon: 'error',
                            title: t('auth.common.error'),
                            text: data.message || t('auth.registration.failedSendCode'),
                        });
                    }
                }
            } catch (error) {
                console.error('Error:', error);
                await Swal.fire({
                    icon: 'error',
                    title: t('auth.common.error'),
                    text: t('auth.registration.genericError'),
                });
            }
        } else if (currentStep === 2) {
            // Company Profile step - Send merchant details before going to Business Documents
            
            // Client-side validation for required fields including accept_terms
            const validationErrors = {};
            
            // Check required fields
            const requiredFields = {
                owner_name: t('auth.merchantRegister.fields.ownerName'),
                business_name: t('auth.merchantRegister.fields.businessName'),
                business_type: t('auth.merchantRegister.fields.businessType'),
                business_phone: t('auth.merchantRegister.fields.businessPhone'),
                business_address: t('auth.merchantRegister.fields.businessAddress'),
                country: t('auth.merchantRegister.fields.country'),
                city: t('auth.merchantRegister.fields.city'),
                trade_license_number: t('auth.merchantRegister.fields.tradeLicenseNumber'),
                trade_license_start_date: t('auth.merchantRegister.fields.tradeLicenseStartDate'),
                trade_license_expired_date: t('auth.merchantRegister.fields.tradeLicenseExpiredDate'),
                tax_number: t('auth.merchantRegister.fields.taxNumber'),
            };

            Object.entries(requiredFields).forEach(([field, label]) => {
                if (!formData[field] || formData[field].toString().trim() === '') {
                    validationErrors[field] = [t('auth.registration.fieldRequired', { label })];
                }
            });

            if (!formData.accept_terms) {
                validationErrors.accept_terms = [t('auth.registration.acceptTermsRequired')];
            }
            
            // If there are validation errors, show them and don't proceed
            if (Object.keys(validationErrors).length > 0) {
                setFieldErrors(validationErrors);
                return; // Don't proceed to API call
            }
            
            // Prevent multiple submissions while the request is in progress
            setIsLoading(true);
            
            try {
                console.log('=== MERCHANT REGISTRATION DEBUG ===');
                console.log('Full formData:', formData);
                console.log('City value:', formData.city);
                console.log('Country value:', formData.country);
                console.log('Business type value:', formData.business_type);
                console.log('Business name:', formData.business_name);
                console.log('Owner name:', formData.owner_name);
                console.log('Accept terms:', formData.accept_terms);
                console.log('=====================================');
                
                // Prefer registrationToken (set during Google OAuth or normal registration),
                // fall back to the auth-store token stored under 'admin_dashboard_token'
                const token = registrationToken || getToken();
                
                const response = await fetch(AUTH_ENDPOINTS.REGISTER_MERCHANT, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': token ? `Bearer ${token}` : ''
                    },
                    body: JSON.stringify({
                        // Account Details
                        email: formData.email,
                        first_name: formData.first_name,
                        last_name: formData.last_name,
                        phone: formData.phone,
                        nationality: formData.nationality,
                        // Send numeric plan_id; if not set on the client, let backend decide default
                        ...(formData.plan_id !== undefined && formData.plan_id !== null
                            ? { plan_id: Number(formData.plan_id) }
                            : {}),
                        
                        // Company Profile Details
                        owner_name: formData.owner_name,
                        business_name: formData.business_name,
                        business_type: formData.business_type,
                        business_phone: formData.business_phone,
                        business_address: formData.business_address,
                        country: formData.country,
                        city: formData.city,
                        
                        // Trade License Details
                        trade_license_number: formData.trade_license_number,
                        trade_license_start_date: formData.trade_license_start_date,
                        trade_license_expired_date: formData.trade_license_expired_date,
                        trade_license_authority: formData.trade_license_authority,
                        
                        // Tax Details
                        tax_number: formData.tax_number,
                        tax_certified_number: formData.tax_certified_number,
                        tax_id_number: formData.tax_id_number,
                        vat_number: formData.vat_number,
                        tax_registration_date: formData.tax_registration_date,
                        tax_authority: formData.tax_authority,
                        annual_turnover: formData.annual_turnover,
                        
                        // Terms and Conditions
                        accept_terms: formData.accept_terms
                    })
                });

                const data = await response.json();
                console.log('Merchant registration response:', data);

                if (data.success || data.status) {
                    // Merchant now exists in DB and user.merchant_id is set. Refresh the
                    // auth store / localStorage so onboarding_completed flips to true
                    // and a later visit to /login routes to the dashboard, not back here.
                    try {
                        await fetchProfile();
                    } catch (profileErr) {
                        console.warn('Profile refresh after merchant create failed:', profileErr);
                    }

                    await Swal.fire({
                        icon: 'success',
                        title: t('auth.common.success'),
                        text: t('auth.registration.merchantSaved'),
                        timer: 2000,
                        showConfirmButton: false,
                    });
                    const nextStep = currentStep + 1;
                    console.log(`Moving from step ${currentStep} to step ${nextStep}`);
                    setCurrentStep(nextStep);
                    // Progress will be saved by useEffect watching currentStep
                    // But also save immediately to ensure it's saved
                    setTimeout(() => {
                        saveProgress(nextStep, formData);
                    }, 100);
                } else {
                    if (response.status === 422 && data.errors) {
                        setFieldErrors(data.errors);
                    } else {
                        await Swal.fire({
                            icon: 'error',
                            title: t('auth.common.error'),
                            text: data.message || t('auth.registration.merchantSaveFailed'),
                        });
                    }
                }
            } catch (error) {
                console.error('Error saving merchant details:', error);
                await Swal.fire({
                    icon: 'error',
                    title: t('auth.common.error'),
                    text: t('auth.registration.merchantSaveError'),
                });
            } finally {
                setIsLoading(false);
            }
        } else if (currentStep === 3) {
            // Business Documents step - Send continuation email before going to Completion
            setIsLoading(true);
            try {
                // Prefer registrationToken (set during Google OAuth or normal registration),
                // fall back to the auth-store token stored under 'admin_dashboard_token'
                const token = registrationToken || getToken();
                
                const response = await fetch(AUTH_ENDPOINTS.REGISTER_SEND_CONTINUATION_EMAIL_MERCHANT, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': token ? `Bearer ${token}` : ''
                    }
                });

                const data = await response.json();

                // Always proceed to next step regardless of email success/failure
                const nextStep = currentStep + 1;
                console.log(`Moving from step ${currentStep} to step ${nextStep}`);
                setCurrentStep(nextStep);
                
                // Save progress immediately
                setTimeout(() => {
                    saveProgress(nextStep, formData);
                }, 100);
                
                // Clear saved progress when reaching completion step
                if (nextStep === steps.length - 1) {
                    clearProgress();
                }
            } catch (error) {
                console.error('Error sending continuation email:', error);
                // Still proceed to next step even if email fails
                const nextStep = currentStep + 1;
                console.log(`Moving from step ${currentStep} to step ${nextStep}`);
                setCurrentStep(nextStep);
                
                // Save progress immediately
                setTimeout(() => {
                    saveProgress(nextStep, formData);
                }, 100);
                
                // Clear saved progress when reaching completion step
                if (nextStep === steps.length - 1) {
                    clearProgress();
                }
            } finally {
                setIsLoading(false);
            }
        } else if (currentStep < steps.length - 1) {
            const nextStep = currentStep + 1;
            console.log(`Moving from step ${currentStep} to step ${nextStep}`);
            setCurrentStep(nextStep);
            
            // Save progress immediately
            setTimeout(() => {
                saveProgress(nextStep, formData);
            }, 100);
            
            // Clear saved progress when reaching completion step
            if (nextStep === steps.length - 1) {
                clearProgress();
            }
        }
    };

    const handlePrevious = () => {
        // If we're on step 1 (AccountVerification), check if it has an internal handler
        if (currentStep === 1 && accountVerificationPreviousRef.current) {
            // AccountVerification will handle going back internally (selection screen -> step 0, or verification -> selection)
            accountVerificationPreviousRef.current();
        } else if (currentStep > 0) {
            // Normal previous: go back one step
            setCurrentStep(currentStep - 1);
        }
    };

    const handleFieldChange = (name, value) => {
        console.log(`=== FORM FIELD CHANGE DEBUG ===`);
        console.log(`Field: ${name}, Value: ${value}`);
        console.log(`Current formData:`, formData);
        console.log(`================================`);
        
        setFormData(prev => {
            const newFormData = {
                ...prev,
                [name]: value
            };
            console.log(`Updated formData:`, newFormData);
            
            // Save progress after form data update (with a small delay to debounce)
            setTimeout(() => {
                saveProgress(currentStep, newFormData);
            }, 500);
            
            return newFormData;
        });
        
        // Clear error for this field when user starts typing
        if (fieldErrors[name]) {
            setFieldErrors(prev => ({
                ...prev,
                [name]: undefined
            }));
        }
    };

    const renderStepContent = () => {
        // Debug current form state
        console.log('=== CURRENT FORM STATE ===');
        console.log('Current step:', currentStep);
        console.log('Form data:', formData);
        console.log('Field errors:', fieldErrors);
        console.log('=========================');
        
        const commonProps = {
            formData,
            setFormData: handleFieldChange,
            fieldErrors
        };

        switch (currentStep) {
            case 0:
                return <AccountDetails {...commonProps} />;
            case 1:
                return (
                    <AccountVerification
                    {...commonProps}
                    variant="merchant"
                    onNextStep={() => {
                        const nextStep = currentStep + 1; // This will be step 2
                        console.log(`AccountVerification: Moving from step ${currentStep} to step ${nextStep}`);
                        setCurrentStep(nextStep);
                        // Save will happen automatically via useEffect, but also save immediately to ensure correct step
                        setTimeout(() => {
                            saveProgress(nextStep, formData);
                        }, 100);
                    }}
                    onPreviousRef={accountVerificationPreviousRef}
                    onPreviousToStep0={() => {
                        // Called when AccountVerification wants to go back to step 0
                        setCurrentStep(0);
                    }}
                    onStartNewRegistration={handleStartNew}
                    />
                );
            case 2:
                return <MerchantProfile {...commonProps} />;
            case 3:
                return <BusinessDocuments {...commonProps} />;
            case 4:
                return <CompletionStep onRegisterAnother={handleStartNew} />;
            default:
                return null;
        }
    };
    document.body.style.width = '100%';
    
    return (
        <>
            {/* Continue Registration Modal */}
            {showContinueModal && savedProgressData && (
                <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">{t('auth.registration.continueModalTitle')}</h5>
                                <button type="button" className="btn-close" onClick={handleStartNew}></button>
                            </div>
                            <div className="modal-body">
                                <div className="text-center mb-4">
                                    <i className="fas fa-info-circle text-primary" style={{ fontSize: '3rem' }}></i>
                                </div>
                                <p className="text-center mb-3">
                                    {t('auth.registration.continueModalFoundPrefix')}{' '}
                                    <strong>
                                        {steps[savedProgressData.currentStep]?.title ||
                                            t('auth.registration.stepFallback', { n: savedProgressData.currentStep + 1 })}
                                    </strong>
                                    .
                                </p>
                                <p className="text-center text-muted">{t('auth.registration.continueModalQuestion')}</p>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={handleStartNew}>
                                    {t('auth.registration.startNewRegistration')}
                                </button>
                                <button type="button" className="btn btn-primary" onClick={handleContinueRegistration}>
                                    {t('auth.registration.continueRegistration')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="d-flex flex-column flex-root min-vh-90" >
            <div className="d-flex flex-column flex-lg-row flex-column-fluid stepper stepper-pills stepper-column min-vh-100 w-100"
                id="kt_create_account_stepper">
                {/* Aside */}
                <div className="d-flex flex-column flex-lg-row-auto w-xl-500px bg-lighten shadow-sm">
                    <div className="d-flex flex-column position-xl-fixed top-0 bottom-0 w-xl-500px scroll-y">
                        <div className="d-flex flex-row-fluid flex-column flex-center p-10 pt-lg-20">
                            <div className="stepper-nav">
                                {steps.map((step, index) => (
                                    <div
                                        key={index}
                                        className={classNames('stepper-item', {
                                            'current': currentStep === index,
                                            'completed': currentStep > index,
                                            'pending': currentStep < index
                                        })}
                                    >
                                        <div className="stepper-line w-40px"></div>
                                        <div className="stepper-icon w-40px h-40px">
                                            <i className="stepper-check fas fa-check"></i>
                                            <span className="stepper-number">{index + 1}</span>
                                        </div>
                                        <div className="stepper-label">
                                            <h3 className="stepper-title">{step.title}</h3>
                                            <div className="stepper-desc fw-bold">{step.description}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="d-flex flex-row-auto bgi-no-repeat bgi-position-x-center bgi-size-contain bgi-position-y-bottom min-h-150px min-h-lg-300px"
                            style={{ backgroundImage: "url(/assets/media/illustrations/sketchy-1/16.png)" }}></div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="d-flex flex-column flex-lg-row-fluid py-10 min-vh-100 min-w-0 overflow-hidden">
                    <div className="d-flex flex-center flex-column flex-column-fluid min-w-0">
                        <div className="w-lg-700px p-5 p-lg-10 p-xl-15 mx-auto w-100" style={{ maxWidth: '100%' }}>
                            <form className="my-auto pb-5" noValidate>
                                {renderStepContent()}

                                {currentStep < steps.length - 1 && (
                                    <div className="d-flex flex-row flex-nowrap justify-content-between align-items-center gap-2 pt-15">
                                        <div>
                                            {currentStep > 0 && (
                                                <button
                                                    type="button"
                                                    className="btn btn-lg btn-light-primary"
                                                    onClick={handlePrevious}
                                                >
                                                    <span className="svg-icon svg-icon-4 me-1">
                                                        <i className="fas fa-arrow-left"></i>
                                                    </span>
                                                    {t('auth.common.previous')}
                                                </button>
                                            )}
                                        </div>
                                        <div>
                                            <button
                                                type="button"
                                                className="btn btn-lg btn-primary"
                                                disabled={currentStep === 1 || isLoading}
                                                onClick={handleNext}
                                            >
                                                {isLoading ? (
                                                    <>
                                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                        {t('auth.common.loadingEllipsis')}
                                                    </>
                                                ) : (
                                                    <>
                                                        {t('auth.common.next')}
                                                        <span className="svg-icon svg-icon-4 ms-1">
                                                            <i className="fas fa-arrow-right"></i>
                                                        </span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        </>
    );
};

export default MerchantRegister;


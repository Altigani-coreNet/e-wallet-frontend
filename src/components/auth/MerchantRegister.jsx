import React, { useState, useEffect } from 'react';
import classNames from 'classnames';
import Swal from 'sweetalert2';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AUTH_ENDPOINTS, AUTH_SERVICE_BASE } from '../../utils/constants';
import useRegistrationStore from '../../stores/useRegistrationStore';
import useAuthStore from '../../stores/authStore';

// Step Components
import AccountDetails from './steps/AccountDetails';
import AccountVerification from './steps/AccountVerification';
import MerchantProfile from './steps/MerchantProfile';
import BusinessDocuments from './steps/BusinessDocuments';
import CompletionStep from './steps/CompletionStep';

const steps = [
    {
        title: 'Account Details',
        description: 'Setup Your Account Details'
    },
    {
        title: 'Account Verification',
        description: 'Verify Your Account & Set Your Passport'
    },
    {
        title: 'Merchant Profile',
        description: 'Setup Your Merchant Profile Details'
    },
    {
        title: 'Business Documents',
        description: 'Attach Documents & Complete Registration'
    },
    {
        title: 'Completed',
        description: 'Woah, we are here'
    }
];

// LocalStorage key for saving registration progress
const REGISTRATION_STORAGE_KEY = 'merchant_registration_progress';

const MerchantRegister = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    // Read plan_id from URL (e.g. ?plan_id=3). If missing, leave null and let backend fall back.
    const planIdFromUrl = searchParams.get('plan_id');
    
    // Use auth store to check if user is logged in
    const { user, merchant, token: authToken, isAuthenticated } = useAuthStore();
    
    // Use registration store
    const {
        registrationToken,
        registrationUser,
        currentStep: storeCurrentStep,
        formData: storeFormData,
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
    const initialStep = stepFromUrl ? parseInt(stepFromUrl, 10) : 0;

    // Initialize state first (before useEffect hooks that reference them)
    const [currentStep, setCurrentStep] = useState(initialStep); // Start at step from URL or 0
    const [fieldErrors, setFieldErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
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
    });

    // Debug: log plan id coming from URL and initial state
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

    // Helper function to clear saved progress
    const clearProgress = () => {
        try {
            localStorage.removeItem(REGISTRATION_STORAGE_KEY);
            clearRegistration();
            console.log('Registration progress cleared');
        } catch (error) {
            console.error('Error clearing registration progress:', error);
        }
    };

    // Load saved progress on component mount and show continue button
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
            
            // Set form data and step
            setFormData(userFormData);
            setCurrentStep(2); // Step 2 = Merchant Profile (index 2)
            
            // Save token to registration store
            if (loggedInToken) {
                updateRegistrationProgress(2, userFormData);
                // Also save to registration store
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
            
            // Show message
            Swal.fire({
                icon: 'info',
                title: 'Complete Your Merchant Registration',
                text: 'Please complete your merchant profile to continue.',
                timer: 3000,
                showConfirmButton: false,
                toast: true,
                position: 'top-end'
            });
            
            return; // Don't check for saved progress if user is logged in
        }
        
        // Check store first
        const storeProgress = loadProgressFromStore();
        
        // Also check localStorage as backup
        let localStorageProgress = null;
        try {
            const savedData = localStorage.getItem(REGISTRATION_STORAGE_KEY);
            if (savedData) {
                localStorageProgress = JSON.parse(savedData);
            }
        } catch (error) {
            console.error('Error loading from localStorage:', error);
        }

        // Use store progress if available, otherwise use localStorage
        const savedProgress = storeProgress || localStorageProgress;
        
        if (savedProgress) {
            // Check if saved progress is recent (within 30 days)
            const savedDate = new Date(savedProgress.savedAt);
            const daysSinceSave = (new Date() - savedDate) / (1000 * 60 * 60 * 24);
            
            if (daysSinceSave < 30) {
                // Ensure plan_id is preserved from URL if not already in saved data
                if (!savedProgress.formData?.plan_id && planIdFromUrl) {
                    savedProgress.formData = {
                        ...(savedProgress.formData || {}),
                        plan_id: Number(planIdFromUrl),
                    };
                }

                console.log('=== FOUND SAVED PROGRESS ===');
                console.log('Saved step:', savedProgress.currentStep);
                console.log('Step name:', steps[savedProgress.currentStep]?.title || 'Unknown');
                console.log('Has token:', !!savedProgress.token);
                console.log('============================');
                
                // Show modal with continue button instead of auto-restoring
                setSavedProgressData(savedProgress);
                setShowContinueModal(true);
            } else {
                // Progress is too old, clear it
                clearProgress();
            }
        } else if (registrationToken || (storeCurrentStep > 0 && Object.keys(storeFormData).length > 0)) {
            // If no saved progress but we have token or step progress from store, create progress data
            const progressData = {
                currentStep: storeCurrentStep || 0,
                formData: {
                    ...(storeFormData || {}),
                    ...(planIdFromUrl ? { plan_id: Number(planIdFromUrl) } : {}),
                },
                savedAt: new Date().toISOString(),
                token: registrationToken,
                user: registrationUser
            };
            console.log('=== CREATING PROGRESS FROM STORE ===');
            console.log('Store step:', storeCurrentStep);
            console.log('Progress data:', progressData);
            console.log('===================================');
            setSavedProgressData(progressData);
            setShowContinueModal(true);
        }
    }, []); // Run only on mount - check for logged-in user first, then saved progress

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
            const stepName = steps[step]?.title || `Step ${step + 1}`;
            Swal.fire({
                icon: 'success',
                title: 'Welcome Back!',
                text: `Continuing from ${stepName} (Step ${step + 1}).`,
                timer: 2000,
                showConfirmButton: false,
                toast: true,
                position: 'top-end'
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
                        const errorMessages = Object.entries(data.errors).map(([field, errors]) => {
                            return `${field.charAt(0).toUpperCase() + field.slice(1)}: ${errors[0]}`;
                        });
                        
                        await Swal.fire({
                            icon: 'error',
                            title: 'Please Fix the Following Errors',
                            html: errorMessages.join('<br>'),
                            confirmButtonText: 'OK'
                        });
                    } else {
                        await Swal.fire({
                            icon: 'error',
                            title: 'Error',
                            text: data.message || 'Failed to send verification code. Please try again.',
                        });
                    }
                }
            } catch (error) {
                console.error('Error:', error);
                await Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'An error occurred. Please try again.',
                });
            }
        } else if (currentStep === 2) {
            // Company Profile step - Send merchant details before going to Business Documents
            
            // Client-side validation for required fields including accept_terms
            const validationErrors = {};
            
            // Check required fields
            const requiredFields = {
                owner_name: 'Owner Name',
                business_name: 'Business Name',
                business_type: 'Business Type',
                business_phone: 'Business Phone',
                business_address: 'Business Address',
                country: 'Country',
                city: 'City',
                trade_license_number: 'Trade License Number',
                trade_license_start_date: 'Trade License Start Date',
                trade_license_expired_date: 'Trade License Expired Date',
                tax_number: 'Tax Number'
            };
            
            // Validate required fields
            Object.entries(requiredFields).forEach(([field, label]) => {
                if (!formData[field] || formData[field].toString().trim() === '') {
                    validationErrors[field] = [`${label} is required.`];
                }
            });
            
            // Validate accept_terms specifically
            if (!formData.accept_terms) {
                validationErrors.accept_terms = ['You must accept the Terms and Conditions to continue.'];
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
                
                // Get bearer token from localStorage or sessionStorage
                const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
                
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
                    await Swal.fire({
                        icon: 'success',
                        title: 'Success!',
                        text: 'Merchant details saved successfully!',
                        timer: 2000,
                        showConfirmButton: false
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
                            title: 'Error',
                            text: data.message || 'Failed to save merchant details. Please try again.',
                        });
                    }
                }
            } catch (error) {
                console.error('Error saving merchant details:', error);
                await Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'An error occurred while saving merchant details. Please try again.',
                });
            } finally {
                setIsLoading(false);
            }
        } else if (currentStep === 3) {
            // Business Documents step - Send continuation email before going to Completion
            setIsLoading(true);
            try {
                // Get bearer token from localStorage or sessionStorage
                const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
                
                const response = await fetch(AUTH_ENDPOINTS.REGISTER_SEND_CONTINUATION_EMAIL, {
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
        if (currentStep > 0) {
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
                return <AccountVerification {...commonProps} onNextStep={() => {
                    const nextStep = currentStep + 1; // This will be step 2
                    console.log(`AccountVerification: Moving from step ${currentStep} to step ${nextStep}`);
                    setCurrentStep(nextStep);
                    // Save will happen automatically via useEffect, but also save immediately to ensure correct step
                    setTimeout(() => {
                        saveProgress(nextStep, formData);
                    }, 100);
                }} />;
            case 2:
                return <MerchantProfile {...commonProps} />;
            case 3:
                return <BusinessDocuments {...commonProps} />;
            case 4:
                return <CompletionStep />;
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
                                <h5 className="modal-title">Continue Registration?</h5>
                                <button type="button" className="btn-close" onClick={handleStartNew}></button>
                            </div>
                            <div className="modal-body">
                                <div className="text-center mb-4">
                                    <i className="fas fa-info-circle text-primary" style={{ fontSize: '3rem' }}></i>
                                </div>
                                <p className="text-center mb-3">
                                    We found your saved registration progress from <strong>{steps[savedProgressData.currentStep]?.title || `Step ${savedProgressData.currentStep + 1}`}</strong>.
                                </p>
                                <p className="text-center text-muted">
                                    Would you like to continue from where you left off?
                                </p>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={handleStartNew}>
                                    Start New Registration
                                </button>
                                <button type="button" className="btn btn-primary" onClick={handleContinueRegistration}>
                                    Continue Registration
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
                <div className="d-flex flex-column flex-lg-row-fluid py-10 min-vh-100">
                    <div className="d-flex flex-center flex-column flex-column-fluid">
                        <div className="w-lg-700px p-10 p-lg-15 mx-auto">
                            <form className="my-auto pb-5" noValidate>
                                {renderStepContent()}

                                {currentStep < steps.length - 1 && (
                                    <div className="d-flex flex-stack pt-15">
                                        <div className="mr-2">
                                            {currentStep > 0 && (
                                                <button
                                                    type="button"
                                                    className="btn btn-lg btn-light-primary me-3"
                                                    disabled={currentStep > 0}
                                                    onClick={handlePrevious}
                                                >
                                                    <span className="svg-icon svg-icon-4 me-1">
                                                        <i className="fas fa-arrow-left"></i>
                                                    </span>
                                                    Previous
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
                                                        {currentStep === 3 ? 'Loading ...' : 'Loading...'}
                                                    </>
                                                ) : (
                                                    <>
                                                        Next
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


import { useState, useEffect, useRef, useMemo } from 'react';
import Swal from 'sweetalert2';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AUTH_ENDPOINTS } from '../utils/constants';
import { validateRegistrationPhone } from '../utils/registrationPhoneRules';
import {
    getRegistrationAuthToken,
    getRegistrationToken,
    getToken,
    post,
    put,
    get,
    removeToken,
    setRegistrationTokenStorage,
} from '../utils/api';
import { fetchRegistrationProfile } from '../utils/registrationAuth';
import useRegistrationStore from '../stores/useRegistrationStore';
import useAuthStore from '../stores/authStore';

const REGISTRATION_STORAGE_KEY = 'merchant_registration_progress';

const defaultFormData = {
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    nationality: '1',
    plan_id: undefined,
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
    accept_terms: false,
};

const useMerchantRegister = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const planIdFromUrl = searchParams.get('plan_id');

    const { user, merchant, isAuthenticated } = useAuthStore();

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
        hasRegistrationProgress,
    } = useRegistrationStore();

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

    const stepFromUrl = searchParams.get('step');
    const storeStep = storeCurrentStep || 0;
    const initialStep = stepFromUrl ? parseInt(stepFromUrl, 10) : storeStep;

    const [currentStep, setCurrentStep] = useState(initialStep);
    const [fieldErrors, setFieldErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [showContinueModal, setShowContinueModal] = useState(false);
    const [savedProgressData, setSavedProgressData] = useState(null);

    // CREATE vs UPDATE on merchant profile step is driven only by isCreatingMerchant:
    // true  → POST register/merchant (first successful profile submit)
    // false → PUT register/merchant/update (after user reached documents step once)
    const readSavedProgress = () => {
        try {
            const raw = localStorage.getItem(REGISTRATION_STORAGE_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    };

    const resolveSavedMerchantId = () => readSavedProgress()?.merchantId ?? null;

    const resolveSavedIsCreatingMerchant = () => {
        const saved = readSavedProgress();
        if (!saved) return true;
        if (typeof saved.isCreatingMerchant === 'boolean') {
            return saved.isCreatingMerchant;
        }
        // legacy saves: already on documents step ⇒ merchant was created
        if (typeof saved.currentStep === 'number' && saved.currentStep >= 3) {
            return false;
        }
        return true;
    };

    const [merchantId, setMerchantId] = useState(
        () =>
            merchant?.id
            ?? user?.merchant_id
            ?? registrationUser?.merchant_id
            ?? resolveSavedMerchantId()
            ?? null,
    );

    const [isCreatingMerchant, setIsCreatingMerchant] = useState(resolveSavedIsCreatingMerchant);

    /** For UPDATE payload only — not used to pick CREATE vs UPDATE. */
    const resolveExistingMerchantId = (overrideId = null) => (
        overrideId
        ?? merchantId
        ?? merchant?.id
        ?? user?.merchant_id
        ?? registrationUser?.merchant_id
        ?? resolveSavedMerchantId()
        ?? null
    );

    const accountVerificationPreviousRef = useRef(null);

    const initialFormData = {
        ...defaultFormData,
        ...(storeFormData || {}),
        ...(planIdFromUrl ? { plan_id: Number(planIdFromUrl) } : {}),
    };
    const [formData, setFormData] = useState(initialFormData);

    // ─── Helpers ────────────────────────────────────────────────────────────────

    const saveProgress = (step, data, overrideMerchantId, overrideIsCreatingMerchant) => {
        try {
            const dataToSave = {
                ...data,
                company_logo: null,
                trade_license: null,
                tax_certification: null,
                user_id_document: null,
            };
            const progressData = {
                currentStep: step,
                formData: dataToSave,
                savedAt: new Date().toISOString(),
                token: registrationToken,
                user: registrationUser,
                isCreatingMerchant:
                    overrideIsCreatingMerchant !== undefined
                        ? overrideIsCreatingMerchant
                        : isCreatingMerchant,
                merchantId: resolveExistingMerchantId(overrideMerchantId),
            };
            localStorage.setItem(REGISTRATION_STORAGE_KEY, JSON.stringify(progressData));
            saveProgressToStore(step, dataToSave);
            updateRegistrationProgress(step, dataToSave);
        } catch (error) {
            console.error('Error saving registration progress:', error);
        }
    };

    const clearProgress = () => {
        try {
            localStorage.removeItem(REGISTRATION_STORAGE_KEY);
            localStorage.removeItem('registration-storage');
            clearRegistration();
        } catch (error) {
            console.error('Error clearing registration progress:', error);
        }
    };

    // ─── Effects ────────────────────────────────────────────────────────────────

    // Migrate legacy sessions that stored the onboarding JWT as the dashboard token
    useEffect(() => {
        const storeToken = useRegistrationStore.getState().registrationToken;
        if (!storeToken) return;

        const regKey = getRegistrationToken();
        const dashKey = getToken();

        if (!regKey) {
            setRegistrationTokenStorage(storeToken);
        }
        if (dashKey && dashKey === storeToken) {
            removeToken();
            useAuthStore.setState({
                token: null,
                isAuthenticated: false,
            });
        }
    }, []);

    useEffect(() => {
        const currentAuth = useAuthStore.getState();
        const isUserLoggedIn =
            currentAuth.isAuthenticated &&
            currentAuth.token &&
            currentAuth.user &&
            !currentAuth.merchant;

        if (isUserLoggedIn) {
            const loggedInUser = currentAuth.user;
            const loggedInToken = currentAuth.token;

            const userFormData = {
                email: loggedInUser.email || '',
                first_name: loggedInUser.first_name || loggedInUser.name?.split(' ')[0] || '',
                last_name:
                    loggedInUser.last_name ||
                    loggedInUser.name?.split(' ').slice(1).join(' ') ||
                    '',
                phone: loggedInUser.phone || '',
                nationality: loggedInUser.nationality || '1',
                plan_id: planIdFromUrl ? Number(planIdFromUrl) : formData.plan_id,
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
                accept_terms: false,
            };

            setFormData(userFormData);
            setCurrentStep(2);

            if (loggedInToken) {
                setRegistrationToken(loggedInToken, loggedInUser, { isDashboardSession: true });
                updateRegistrationProgress(2, userFormData);
                saveProgressToStore(2, userFormData);
                localStorage.setItem(
                    REGISTRATION_STORAGE_KEY,
                    JSON.stringify({
                        currentStep: 2,
                        formData: userFormData,
                        savedAt: new Date().toISOString(),
                        token: loggedInToken,
                        user: loggedInUser,
                    })
                );
            }

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

            return;
        }

        let localStorageProgress = null;
        try {
            const savedData = localStorage.getItem(REGISTRATION_STORAGE_KEY);
            if (savedData) localStorageProgress = JSON.parse(savedData);
        } catch (e) {
            console.error('Error loading from localStorage:', e);
        }

        const localStep =
            localStorageProgress && typeof localStorageProgress.currentStep === 'number'
                ? localStorageProgress.currentStep
                : -1;
        const localHasProgress =
            localStep >= 0 && localStorageProgress && localStorageProgress.formData;

        const urlStepParam = searchParams.get('step');
        const urlStepNum =
            urlStepParam !== null && urlStepParam !== '' ? parseInt(urlStepParam, 10) : null;
        const validUrlStep =
            urlStepNum !== null &&
            !Number.isNaN(urlStepNum) &&
            urlStepNum >= 0 &&
            urlStepNum < steps.length
                ? urlStepNum
                : null;

        const storeHasProgress =
            storeCurrentStep > 0 &&
            storeFormData &&
            Object.keys(storeFormData).length > 0;
        const useLocal = localHasProgress && localStep > (storeCurrentStep || 0);
        let restoreStep = useLocal ? localStep : storeCurrentStep || 0;
        const restoreFormData = useLocal
            ? localStorageProgress.formData || {}
            : storeFormData || {};

        if (validUrlStep !== null) restoreStep = validUrlStep;

        if (storeHasProgress || localHasProgress) {
            if (restoreStep > 0) {
                const daysSinceSave =
                    localStorageProgress && localStorageProgress.savedAt
                        ? (new Date() - new Date(localStorageProgress.savedAt)) /
                          (1000 * 60 * 60 * 24)
                        : 0;

                if (useLocal && daysSinceSave >= 30) {
                    clearProgress();
                } else {
                    const restoredFormData = {
                        ...restoreFormData,
                        ...(planIdFromUrl && !restoreFormData.plan_id
                            ? { plan_id: Number(planIdFromUrl) }
                            : {}),
                    };
                    setSavedProgressData({
                        currentStep: restoreStep,
                        formData: restoredFormData,
                        token: useLocal && localStorageProgress
                            ? localStorageProgress.token
                            : registrationToken,
                        user: useLocal && localStorageProgress
                            ? localStorageProgress.user
                            : registrationUser,
                        merchantId: useLocal && localStorageProgress
                            ? localStorageProgress.merchantId
                            : resolveSavedMerchantId(),
                        isCreatingMerchant: useLocal && localStorageProgress
                            ? (typeof localStorageProgress.isCreatingMerchant === 'boolean'
                                ? localStorageProgress.isCreatingMerchant
                                : localStorageProgress.currentStep >= 3
                                    ? false
                                    : true)
                            : resolveSavedIsCreatingMerchant(),
                        savedAt:
                            localStorageProgress && localStorageProgress.savedAt
                                ? localStorageProgress.savedAt
                                : new Date().toISOString(),
                    });
                    setShowContinueModal(true);
                    return;
                }
            }
        }

        if (localStorageProgress) {
            const daysSinceSave =
                (new Date() - new Date(localStorageProgress.savedAt)) / (1000 * 60 * 60 * 24);
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
    }, []);

    useEffect(() => {
        const hasData = Object.values(formData).some((value) => {
            if (value === null || value === false) return false;
            if (typeof value === 'string') return value.trim() !== '';
            return true;
        });
        if (currentStep === 0 && !hasData) return;
        if (currentStep === 0) return;
        saveProgress(currentStep, formData);
    }, [currentStep]);

    useEffect(() => {
        const handleBeforeUnload = () => {
            const hasData = Object.values(formData).some((value) => {
                if (value === null || value === false) return false;
                if (typeof value === 'string') return value.trim() !== '';
                return true;
            });
            if (hasData && currentStep < steps.length - 1) {
                try {
                    const dataToSave = {
                        ...formData,
                        company_logo: null,
                        trade_license: null,
                        tax_certification: null,
                        user_id_document: null,
                    };
                    const persistedMerchantId = resolveExistingMerchantId();
                    localStorage.setItem(
                        REGISTRATION_STORAGE_KEY,
                        JSON.stringify({
                            currentStep,
                            formData: dataToSave,
                            savedAt: new Date().toISOString(),
                            isCreatingMerchant,
                            ...(persistedMerchantId ? { merchantId: persistedMerchantId } : {}),
                        })
                    );
                } catch (error) {
                    console.error('Error saving progress on unload:', error);
                }
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [formData, currentStep]);

    // ─── Handlers ───────────────────────────────────────────────────────────────

    const handleContinueRegistration = () => {
        if (!savedProgressData) return;

        const step =
            savedProgressData.currentStep !== undefined ? savedProgressData.currentStep : 0;
        const formDataToRestore = savedProgressData.formData || {};
        const restoredFormData = {
            ...formDataToRestore,
            ...(planIdFromUrl && !formDataToRestore.plan_id
                ? { plan_id: Number(planIdFromUrl) }
                : {}),
        };

        setCurrentStep(step);
        setFormData((prev) => ({ ...prev, ...restoredFormData }));

        if (savedProgressData.merchantId) {
            setMerchantId(savedProgressData.merchantId);
        }
        if (typeof savedProgressData.isCreatingMerchant === 'boolean') {
            setIsCreatingMerchant(savedProgressData.isCreatingMerchant);
        } else if (step >= 3) {
            setIsCreatingMerchant(false);
        }

        if (savedProgressData.token) {
            restoreProgress(savedProgressData);
        } else {
            updateRegistrationProgress(step, formDataToRestore);
        }

        setShowContinueModal(false);

        const stepName =
            steps[step]?.title ||
            t('auth.registration.stepFallback', { n: step + 1 });
        Swal.fire({
            icon: 'success',
            title: t('auth.common.welcomeBack'),
            text: t('auth.registration.continuingFrom', { stepName, stepNumber: step + 1 }),
            timer: 2000,
            showConfirmButton: false,
            toast: true,
            position: 'top-end',
        });
    };

    const handleStartNew = () => {
        clearProgress();
        setShowContinueModal(false);
        setSavedProgressData(null);
        setMerchantId(null);
        setIsCreatingMerchant(true);
        setCurrentStep(0);
        setFormData({
            ...defaultFormData,
            plan_id: planIdFromUrl ? Number(planIdFromUrl) : undefined,
        });
    };

    const handleNext = async () => {
        if (currentStep === 0) {
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
                const { data } = await post(AUTH_ENDPOINTS.REGISTER_VALIDATE, {
                    email: formData.email,
                    first_name: formData.first_name,
                    last_name: formData.last_name,
                    phone: formData.phone,
                    type: 'email',
                });

                if (data.success) {
                    const nextStep = currentStep + 1;
                    saveProgress(nextStep, formData);
                    setCurrentStep(nextStep);
                    setTimeout(() => saveProgress(nextStep, formData), 200);
                } else {
                    if (data.errors) {
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
            } catch (err) {
                if (err.response?.status === 422 && err.response.data?.errors) {
                    setFieldErrors(err.response.data.errors);
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
                        text: err.response?.data?.message || t('auth.registration.genericError'),
                    });
                }
            }
            return;
        }

        if (currentStep === 2) {
            // ── Validation ──────────────────────────────────────────────
            const validationErrors = {};
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
            if (Object.keys(validationErrors).length > 0) {
                setFieldErrors(validationErrors);
                await Swal.fire({
                    icon: 'warning',
                    title: t('auth.common.oops'),
                    text: t('auth.registration.missingFieldsText'),
                    confirmButtonText: t('auth.common.ok'),
                });
                return;
            }

            const isUpdate = !isCreatingMerchant;
            const existingMerchantId = isUpdate ? resolveExistingMerchantId() : null;

            if (isUpdate && !existingMerchantId) {
                await Swal.fire({
                    icon: 'error',
                    title: t('auth.common.error'),
                    text: t('auth.registration.merchantSaveError'),
                    confirmButtonText: t('auth.common.ok'),
                });
                return;
            }

            const merchantPayload = {
                owner_name: formData.owner_name,
                business_name: formData.business_name,
                business_type: formData.business_type,
                business_phone: formData.business_phone,
                business_address: formData.business_address,
                country: formData.country,
                city: formData.city,
                trade_license_number: formData.trade_license_number,
                trade_license_start_date: formData.trade_license_start_date,
                trade_license_expired_date: formData.trade_license_expired_date,
                trade_license_authority: formData.trade_license_authority,
                tax_number: formData.tax_number,
                tax_certified_number: formData.tax_certified_number,
                tax_id_number: formData.tax_id_number,
                vat_number: formData.vat_number,
                tax_registration_date: formData.tax_registration_date,
                tax_authority: formData.tax_authority,
                annual_turnover: formData.annual_turnover,
                accept_terms: formData.accept_terms,
            };

            if (isUpdate) {
                // UPDATE: only the columns that exist in the merchants table
                delete merchantPayload.trade_license_authority;
                delete merchantPayload.tax_certified_number;
                delete merchantPayload.tax_id_number;
                delete merchantPayload.vat_number;
                delete merchantPayload.tax_registration_date;
                delete merchantPayload.tax_authority;
                delete merchantPayload.annual_turnover;
                merchantPayload.merchant_id = existingMerchantId;
            } else {
                // CREATE: also send the user's personal details
                merchantPayload.email = formData.email;
                merchantPayload.first_name = formData.first_name;
                merchantPayload.last_name = formData.last_name;
                merchantPayload.phone = formData.phone;
                merchantPayload.nationality = formData.nationality;
                if (formData.plan_id !== undefined && formData.plan_id !== null) {
                    merchantPayload.plan_id = Number(formData.plan_id);
                }
            }

            const endpoint = isUpdate
                ? AUTH_ENDPOINTS.REGISTER_MERCHANT_UPDATE
                : AUTH_ENDPOINTS.REGISTER_MERCHANT;

            setIsLoading(true);
            try {
                const token = getRegistrationAuthToken(registrationToken);
                const authConfig = token
                    ? { headers: { Authorization: `Bearer ${token}` } }
                    : {};
                const response = isUpdate
                    ? await put(endpoint, merchantPayload, authConfig)
                    : await post(endpoint, merchantPayload, authConfig);
                const data = response.data;

                if (data.success || data.status) {
                    let resolvedMerchantId = existingMerchantId;
                    if (isCreatingMerchant) {
                        resolvedMerchantId =
                            data.data?.merchant_id ??
                            data.data?.id ??
                            data.merchant_id ??
                            data.id ??
                            null;
                    }

                    try {
                        const profileMerchantId = await fetchRegistrationProfile(token);
                        if (profileMerchantId) {
                            resolvedMerchantId = profileMerchantId;
                        }
                    } catch (profileErr) {
                        console.warn('Profile refresh after merchant save failed:', profileErr);
                    }

                    if (resolvedMerchantId) {
                        setMerchantId(resolvedMerchantId);
                    }

                    // Reached documents step — next profile submit must UPDATE
                    setIsCreatingMerchant(false);

                    await Swal.fire({
                        icon: 'success',
                        title: t('auth.common.success'),
                        text: t('auth.registration.merchantSaved'),
                        timer: 2000,
                        showConfirmButton: false,
                    });

                    const nextStep = currentStep + 1;
                    setCurrentStep(nextStep);
                    saveProgress(
                        nextStep,
                        formData,
                        resolvedMerchantId ?? resolveExistingMerchantId(),
                        false,
                    );
                } else if (data.errors) {
                    setFieldErrors(data.errors);
                } else {
                    await Swal.fire({
                        icon: 'error',
                        title: t('auth.common.error'),
                        text: data.message || t('auth.registration.merchantSaveFailed'),
                    });
                }
            } catch (err) {
                if (err.response?.status === 422 && err.response.data?.errors) {
                    setFieldErrors(err.response.data.errors);
                } else {
                    await Swal.fire({
                        icon: 'error',
                        title: t('auth.common.error'),
                        text: err.response?.data?.message || t('auth.registration.merchantSaveError'),
                    });
                }
            } finally {
                setIsLoading(false);
            }
            return;
        }

        if (currentStep === 3) {
            setIsLoading(true);
            try {
                const token = getRegistrationAuthToken(registrationToken);
                await get(
                    AUTH_ENDPOINTS.REGISTER_SEND_CONTINUATION_EMAIL_MERCHANT,
                    token ? { headers: { Authorization: `Bearer ${token}` } } : {},
                );
            } catch {
                // intentionally ignored — always proceed
            } finally {
                const nextStep = currentStep + 1;
                setCurrentStep(nextStep);
                setTimeout(() => saveProgress(nextStep, formData), 100);
                if (nextStep === steps.length - 1) clearProgress();
                setIsLoading(false);
            }
            return;
        }

        if (currentStep < steps.length - 1) {
            const nextStep = currentStep + 1;
            setCurrentStep(nextStep);
            setTimeout(() => saveProgress(nextStep, formData), 100);
            if (nextStep === steps.length - 1) clearProgress();
        }
    };

    const handlePrevious = () => {
        if (currentStep === 1 && accountVerificationPreviousRef.current) {
            accountVerificationPreviousRef.current();
        } else if (currentStep > 0) {
            const prevStep = currentStep - 1;
            setCurrentStep(prevStep);
            saveProgress(
                prevStep,
                formData,
                resolveExistingMerchantId(),
                isCreatingMerchant,
            );
        }
    };

    const handleFieldChange = (name, value) => {
        setFormData((prev) => {
            const newFormData = { ...prev, [name]: value };
            setTimeout(() => saveProgress(currentStep, newFormData), 500);
            return newFormData;
        });
        if (fieldErrors[name]) {
            setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
        }
    };

    return {
        steps,
        currentStep,
        setCurrentStep,
        formData,
        fieldErrors,
        isLoading,
        showContinueModal,
        savedProgressData,
        accountVerificationPreviousRef,
        planIdFromUrl,
        handleNext,
        handlePrevious,
        handleFieldChange,
        handleContinueRegistration,
        handleStartNew,
        saveProgress,
    };
};

export default useMerchantRegister;

import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import {
    createNotification,
    getCustomerOptions,
    getMerchantOptions,
    getNotification,
    getUsersByMerchant,
    updateNotification,
} from '../../../services/adminNotificationsService';import { useToolbar } from '../../../contexts/ToolbarContext';

const AdminNotificationForm = ({ isEdit = false }) => {
    const { t, i18n } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();
    const { setTitle, setActions } = useToolbar();

    const topicOptions = useMemo(
        () => [
            { value: 'payments', label: t('admin.notificationsIndex.topicPayments') },
            { value: 'service_updates', label: t('admin.notificationsIndex.topicServiceUpdates') },
            { value: 'logs', label: t('admin.notificationsIndex.topicLogs') },
            { value: 'alert', label: t('admin.notificationsIndex.topicAlert') },
        ],
        [t],
    );

    const targetOptions = useMemo(
        () => [
            { value: 'public', label: t('admin.notificationsIndex.targetPublic') },
            { value: 'merchant', label: t('admin.notificationsIndex.targetMerchant') },
            { value: 'user', label: t('admin.notificationsIndex.targetUser') },
            { value: 'customer', label: t('admin.notificationsIndex.targetCustomer') },
        ],
        [t],
    );

    const [loading, setLoading] = useState(false);
    const [prefillLoading, setPrefillLoading] = useState(isEdit);
    const [errors, setErrors] = useState({});

    const [merchantOptions, setMerchantOptions] = useState([]);
    const [userOptions, setUserOptions] = useState([]);
    const [customerOptions, setCustomerOptions] = useState([]);
    const [merchantSearch, setMerchantSearch] = useState('');
    const [userSearch, setUserSearch] = useState('');
    const [customerSearch, setCustomerSearch] = useState('');
    const [loadingMerchants, setLoadingMerchants] = useState(false);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [loadingCustomers, setLoadingCustomers] = useState(false);
    const [showMerchantList, setShowMerchantList] = useState(false);
    const [showUserList, setShowUserList] = useState(false);
    const [showCustomerList, setShowCustomerList] = useState(false);
    const [selectedMerchant, setSelectedMerchant] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedCustomer, setSelectedCustomer] = useState(null);

    const [form, setForm] = useState({
        topic: 'payments',
        target_type: 'public',
        merchant_id: '',
        user_id: '',
        customer_id: '',
        title: '',
        description: '',
        image: null,
    });

    useEffect(() => {
        setTitle(isEdit ? t('admin.notificationForm.editTitle') : t('admin.notificationForm.createTitle'));
        setActions(null);
        return () => setActions(null);
    }, [isEdit, setActions, setTitle, t, i18n.language]);

    const loadMerchants = async (search = '') => {
        setLoadingMerchants(true);
        try {
            const response = await getMerchantOptions(search);
            setMerchantOptions(response?.data?.data || []);
        } finally {
            setLoadingMerchants(false);
        }
    };

    const loadUsers = async (merchantId, search = '') => {
        if (!merchantId) {
            setUserOptions([]);
            return;
        }
        setLoadingUsers(true);
        try {
            const response = await getUsersByMerchant(merchantId, search);
            setUserOptions(response?.data?.data || []);
        } finally {
            setLoadingUsers(false);
        }
    };

    const loadCustomers = async (search = '') => {
        setLoadingCustomers(true);
        try {
            const response = await getCustomerOptions(search);
            setCustomerOptions(response?.data?.data || []);
        } finally {
            setLoadingCustomers(false);
        }
    };

    useEffect(() => {
        const timeout = setTimeout(() => {
            loadMerchants(merchantSearch).catch(() => {});
        }, 300);
        return () => clearTimeout(timeout);
    }, [merchantSearch]);

    useEffect(() => {
        if (form.target_type === 'user' && form.merchant_id) {
            const timeout = setTimeout(() => {
                loadUsers(form.merchant_id, userSearch).catch(() => {});
            }, 300);
            return () => clearTimeout(timeout);
        } else {
            setUserOptions([]);
        }
    }, [form.target_type, form.merchant_id, userSearch]);

    useEffect(() => {
        if (form.target_type !== 'customer') {
            setCustomerOptions([]);
            return undefined;
        }

        const timeout = setTimeout(() => {
            loadCustomers(customerSearch).catch(() => {});
        }, 300);

        return () => clearTimeout(timeout);
    }, [form.target_type, customerSearch]);

    useEffect(() => {
        if (!isEdit || !id) return;

        (async () => {
            try {
                const response = await getNotification(id);
                const item = response?.data?.data;
                if (!item) return;
                setForm({
                    topic: item.topic || 'payments',
                    target_type: item.target_type || 'public',
                    merchant_id: item.merchant_id || '',
                    user_id: item.user_id || '',
                    customer_id: item.customer_id || '',
                    title: item.title || '',
                    description: item.description || '',
                    image: null,
                });
            } catch (error) {
                toast.error(t('admin.notificationForm.loadFailed'));
            } finally {
                setPrefillLoading(false);
            }
        })();
    }, [id, isEdit, t]);

    useEffect(() => {
        if (!form.merchant_id) {
            setSelectedMerchant(null);
            return;
        }
        const merchant = merchantOptions.find((item) => String(item.id) === String(form.merchant_id));
        if (merchant) setSelectedMerchant(merchant);
    }, [form.merchant_id, merchantOptions]);

    useEffect(() => {
        if (!form.user_id) {
            setSelectedUser(null);
            return;
        }
        const user = userOptions.find((item) => String(item.id) === String(form.user_id));
        if (user) setSelectedUser(user);
    }, [form.user_id, userOptions]);

    useEffect(() => {
        if (!form.customer_id) {
            setSelectedCustomer(null);
            return;
        }
        const customer = customerOptions.find((item) => String(item.id) === String(form.customer_id));
        if (customer) setSelectedCustomer(customer);
    }, [form.customer_id, customerOptions]);

    const shouldShowMerchant = useMemo(
        () => form.target_type === 'merchant' || form.target_type === 'user',
        [form.target_type],
    );

    const shouldShowUser = useMemo(
        () => form.target_type === 'user',
        [form.target_type],
    );

    const shouldShowCustomer = useMemo(
        () => form.target_type === 'customer',
        [form.target_type],
    );

    const onChange = (key, value) => {
        setForm((prev) => ({ ...prev, [key]: value }));
        if (errors[key]) setErrors((prev) => ({ ...prev, [key]: null }));
    };

    const handleMerchantSelect = (merchant) => {
        setSelectedMerchant(merchant);
        setShowMerchantList(false);
        onChange('merchant_id', merchant.id);
        setMerchantSearch('');
    };

    const handleRemoveMerchant = () => {
        setSelectedMerchant(null);
        setSelectedUser(null);
        setShowMerchantList(false);
        setShowUserList(false);
        setMerchantSearch('');
        setUserSearch('');
        setForm((prev) => ({
            ...prev,
            merchant_id: '',
            user_id: '',
        }));
    };

    const handleUserSelect = (user) => {
        setSelectedUser(user);
        setShowUserList(false);
        onChange('user_id', user.id);
        setUserSearch('');
    };

    const handleRemoveUser = () => {
        setSelectedUser(null);
        setShowUserList(false);
        setUserSearch('');
        onChange('user_id', '');
    };

    const handleCustomerSelect = (customer) => {
        setSelectedCustomer(customer);
        setShowCustomerList(false);
        onChange('customer_id', customer.id);
        setCustomerSearch('');
    };

    const handleRemoveCustomer = () => {
        setSelectedCustomer(null);
        setShowCustomerList(false);
        setCustomerSearch('');
        onChange('customer_id', '');
    };

    const buildPayload = () => {
        const payload = new FormData();
        payload.append('topic', form.topic);
        payload.append('target_type', form.target_type);
        payload.append('title', form.title);
        payload.append('description', form.description);
        if (shouldShowMerchant) payload.append('merchant_id', form.merchant_id);
        if (shouldShowUser) payload.append('user_id', form.user_id);
        if (shouldShowCustomer) payload.append('customer_id', form.customer_id);
        if (form.image) payload.append('image', form.image);
        if (isEdit) payload.append('_method', 'PUT');
        return payload;
    };

    const onSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setErrors({});

        try {
            const payload = buildPayload();
            if (isEdit) {
                await updateNotification(id, payload);
                toast.success(t('admin.notificationForm.updateSuccess'));
            } else {
                await createNotification(payload);
                toast.success(t('admin.notificationForm.createSuccess'));
            }
            navigate('/admin/system/notifications');
        } catch (error) {
            if (error?.response?.status === 422) {
                setErrors(error?.response?.data?.errors || {});
                toast.error(error?.response?.data?.message || t('admin.notificationForm.checkFormFields'));
            } else {
                toast.error(error?.response?.data?.message || t('admin.notificationForm.saveFailed'));
            }
        } finally {
            setLoading(false);
        }
    };

    if (prefillLoading) {
        return (
            <div className="text-center py-10">
                <span className="spinner-border text-primary"></span>
            </div>
        );
    }

    return (
        <div className="card">
            <div className="card-header">
                <h3 className="card-title">
                    {isEdit ? t('admin.notificationForm.editTitle') : t('admin.notificationForm.createTitle')}
                </h3>
                <div className="card-toolbar">
                    <Link to="/admin/system/notifications" className="btn btn-sm btn-light">
                        {t('admin.notificationForm.backToNotifications')}
                    </Link>
                </div>
            </div>

            <form onSubmit={onSubmit}>
                <div className="card-body">
                    <div className="row">
                        <div className="col-md-4 mb-7">
                            <label className="form-label fw-bold required">{t('admin.notificationForm.topic')}</label>
                            <select className="form-select" value={form.topic} onChange={(e) => onChange('topic', e.target.value)}>
                                {topicOptions.map((option) => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                            </select>
                        </div>

                        <div className="col-md-4 mb-7">
                            <label className="form-label fw-bold required">{t('admin.notificationForm.target')}</label>
                            <select
                                className="form-select"
                                value={form.target_type}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setForm((prev) => ({
                                        ...prev,
                                        target_type: value,
                                        merchant_id: value === 'public' || value === 'customer' ? '' : prev.merchant_id,
                                        user_id: value === 'user' ? prev.user_id : '',
                                        customer_id: value === 'customer' ? prev.customer_id : '',
                                    }));
                                    if (value === 'public') {
                                        setSelectedMerchant(null);
                                        setSelectedUser(null);
                                        setSelectedCustomer(null);
                                        setShowMerchantList(false);
                                        setShowUserList(false);
                                        setShowCustomerList(false);
                                    }
                                    if (value === 'merchant') {
                                        setSelectedUser(null);
                                        setSelectedCustomer(null);
                                        setShowUserList(false);
                                        setShowCustomerList(false);
                                    }
                                    if (value === 'user') {
                                        setSelectedCustomer(null);
                                        setShowCustomerList(false);
                                    }
                                    if (value === 'customer') {
                                        setSelectedMerchant(null);
                                        setSelectedUser(null);
                                        setShowMerchantList(false);
                                        setShowUserList(false);
                                    }
                                }}
                            >
                                {targetOptions.map((option) => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                            </select>
                        </div>

                        {shouldShowMerchant && (
                            <div className="col-md-3 mb-7">
                                <label className="form-label fw-bold required">{t('admin.notificationForm.merchant')}</label>
                                <div className="position-relative">
                                    <div
                                        className={`form-control h-50px d-flex align-items-center justify-content-between ${errors.merchant_id ? 'is-invalid' : ''}`}
                                        onClick={() => setShowMerchantList((prev) => !prev)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <div className="d-flex align-items-center">
                                            {selectedMerchant ? (
                                                <span className="text-gray-800">{selectedMerchant.text || selectedMerchant.business_name || selectedMerchant.name}</span>
                                            ) : (
                                                <span className="text-muted">{t('admin.notificationForm.selectMerchant')}</span>
                                            )}
                                        </div>
                                        <div className="d-flex align-items-center">
                                            {selectedMerchant && (
                                                <button
                                                    type="button"
                                                    className="btn btn-icon btn-sm btn-light-danger me-2"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleRemoveMerchant();
                                                    }}
                                                >
                                                    <i className="ki-duotone ki-cross fs-2">
                                                        <span className="path1"></span>
                                                        <span className="path2"></span>
                                                    </i>
                                                </button>
                                            )}
                                            <i className={`ki-duotone ki-down fs-2 ${showMerchantList ? 'rotate-180' : ''}`}>
                                                <span className="path1"></span>
                                                <span className="path2"></span>
                                            </i>
                                        </div>
                                    </div>

                                    {showMerchantList && (
                                        <div className="position-absolute top-100 start-0 w-100 bg-white border rounded-3 shadow-sm mt-1" style={{ zIndex: 1000, maxHeight: '250px', overflowY: 'auto' }}>
                                            <div className="p-2">
                                                <input
                                                    type="text"
                                                    className="form-control form-control-sm mb-2"
                                                    placeholder={t('admin.notificationForm.searchMerchants')}
                                                    value={merchantSearch}
                                                    onChange={(e) => setMerchantSearch(e.target.value)}
                                                    onClick={(e) => e.stopPropagation()}
                                                    autoFocus
                                                />
                                            </div>
                                            {loadingMerchants ? (
                                                <div className="p-3">
                                                    <div className="placeholder-glow mb-2"><span className="placeholder col-12 h-20px rounded"></span></div>
                                                    <div className="placeholder-glow mb-2"><span className="placeholder col-10 h-20px rounded"></span></div>
                                                    <div className="placeholder-glow"><span className="placeholder col-11 h-20px rounded"></span></div>
                                                </div>
                                            ) : merchantOptions.length > 0 ? (
                                                merchantOptions.map((merchant) => (
                                                    <div
                                                        key={merchant.id}
                                                        className="p-3 border-bottom cursor-pointer hover-bg-light"
                                                        onMouseDown={(e) => {
                                                            e.preventDefault();
                                                            handleMerchantSelect(merchant);
                                                        }}
                                                        style={{ cursor: 'pointer' }}
                                                    >
                                                        <div className="text-gray-800">{merchant.text || merchant.business_name || merchant.name}</div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="p-3 text-muted text-center">{t('admin.notificationForm.noMerchantsFound')}</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                {errors.merchant_id && <div className="invalid-feedback d-block">{errors.merchant_id}</div>}
                            </div>
                        )}

                        {shouldShowUser && (
                            <div className="col-md-3 mb-7">
                                <label className="form-label fw-bold required">{t('admin.notificationForm.userFromMerchant')}</label>
                                <div className="position-relative">
                                    <div
                                        className={`form-control h-50px d-flex align-items-center justify-content-between ${errors.user_id ? 'is-invalid' : ''}`}
                                        onClick={() => {
                                            if (!form.merchant_id) return;
                                            setShowUserList((prev) => !prev);
                                        }}
                                        style={{ cursor: form.merchant_id ? 'pointer' : 'not-allowed', backgroundColor: form.merchant_id ? undefined : '#f5f8fa' }}
                                    >
                                        <div className="d-flex align-items-center">
                                            {selectedUser ? (
                                                <span className="text-gray-800">{selectedUser.text || selectedUser.name || selectedUser.email}</span>
                                            ) : (
                                                <span className="text-muted">
                                                    {form.merchant_id
                                                        ? t('admin.notificationForm.selectUser')
                                                        : t('admin.notificationForm.selectMerchantFirst')}
                                                </span>
                                            )}
                                        </div>
                                        <div className="d-flex align-items-center">
                                            {selectedUser && (
                                                <button
                                                    type="button"
                                                    className="btn btn-icon btn-sm btn-light-danger me-2"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleRemoveUser();
                                                    }}
                                                >
                                                    <i className="ki-duotone ki-cross fs-2">
                                                        <span className="path1"></span>
                                                        <span className="path2"></span>
                                                    </i>
                                                </button>
                                            )}
                                            <i className={`ki-duotone ki-down fs-2 ${showUserList ? 'rotate-180' : ''}`}>
                                                <span className="path1"></span>
                                                <span className="path2"></span>
                                            </i>
                                        </div>
                                    </div>

                                    {showUserList && form.merchant_id && (
                                        <div className="position-absolute top-100 start-0 w-100 bg-white border rounded-3 shadow-sm mt-1" style={{ zIndex: 1000, maxHeight: '250px', overflowY: 'auto' }}>
                                            <div className="p-2">
                                                <input
                                                    type="text"
                                                    className="form-control form-control-sm mb-2"
                                                    placeholder={t('admin.notificationForm.searchUsers')}
                                                    value={userSearch}
                                                    onChange={(e) => setUserSearch(e.target.value)}
                                                    onClick={(e) => e.stopPropagation()}
                                                    autoFocus
                                                />
                                            </div>
                                            {loadingUsers ? (
                                                <div className="p-3">
                                                    <div className="placeholder-glow mb-2"><span className="placeholder col-12 h-20px rounded"></span></div>
                                                    <div className="placeholder-glow mb-2"><span className="placeholder col-10 h-20px rounded"></span></div>
                                                    <div className="placeholder-glow"><span className="placeholder col-11 h-20px rounded"></span></div>
                                                </div>
                                            ) : userOptions.length > 0 ? (
                                                userOptions.map((user) => (
                                                    <div
                                                        key={user.id}
                                                        className="p-3 border-bottom cursor-pointer hover-bg-light"
                                                        onMouseDown={(e) => {
                                                            e.preventDefault();
                                                            handleUserSelect(user);
                                                        }}
                                                        style={{ cursor: 'pointer' }}
                                                    >
                                                        <div className="text-gray-800">{user.text || user.name || user.email}</div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="p-3 text-muted text-center">{t('admin.notificationForm.noUsersFound')}</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                {errors.user_id && <div className="invalid-feedback d-block">{errors.user_id}</div>}
                            </div>
                        )}

                        {shouldShowCustomer && (
                            <div className="col-md-3 mb-7">
                                <label className="form-label fw-bold required">{t('admin.notificationForm.customer')}</label>
                                <div className="position-relative">
                                    <div
                                        className={`form-control h-50px d-flex align-items-center justify-content-between ${errors.customer_id ? 'is-invalid' : ''}`}
                                        onClick={() => setShowCustomerList((prev) => !prev)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <div className="d-flex align-items-center">
                                            {selectedCustomer ? (
                                                <span className="text-gray-800">{selectedCustomer.text || selectedCustomer.name || selectedCustomer.email}</span>
                                            ) : (
                                                <span className="text-muted">{t('admin.notificationForm.selectCustomer')}</span>
                                            )}
                                        </div>
                                        <div className="d-flex align-items-center">
                                            {selectedCustomer && (
                                                <button
                                                    type="button"
                                                    className="btn btn-icon btn-sm btn-light-danger me-2"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleRemoveCustomer();
                                                    }}
                                                >
                                                    <i className="ki-duotone ki-cross fs-2">
                                                        <span className="path1"></span>
                                                        <span className="path2"></span>
                                                    </i>
                                                </button>
                                            )}
                                            <i className={`ki-duotone ki-down fs-2 ${showCustomerList ? 'rotate-180' : ''}`}>
                                                <span className="path1"></span>
                                                <span className="path2"></span>
                                            </i>
                                        </div>
                                    </div>

                                    {showCustomerList && (
                                        <div className="position-absolute top-100 start-0 w-100 bg-white border rounded-3 shadow-sm mt-1" style={{ zIndex: 1000, maxHeight: '250px', overflowY: 'auto' }}>
                                            <div className="p-2">
                                                <input
                                                    type="text"
                                                    className="form-control form-control-sm mb-2"
                                                    placeholder={t('admin.notificationForm.searchCustomers')}
                                                    value={customerSearch}
                                                    onChange={(e) => setCustomerSearch(e.target.value)}
                                                    onClick={(e) => e.stopPropagation()}
                                                    autoFocus
                                                />
                                            </div>
                                            {loadingCustomers ? (
                                                <div className="p-3">
                                                    <div className="placeholder-glow mb-2"><span className="placeholder col-12 h-20px rounded"></span></div>
                                                    <div className="placeholder-glow mb-2"><span className="placeholder col-10 h-20px rounded"></span></div>
                                                    <div className="placeholder-glow"><span className="placeholder col-11 h-20px rounded"></span></div>
                                                </div>
                                            ) : customerOptions.length > 0 ? (
                                                customerOptions.map((customer) => (
                                                    <div
                                                        key={customer.id}
                                                        className="p-3 border-bottom cursor-pointer hover-bg-light"
                                                        onMouseDown={(e) => {
                                                            e.preventDefault();
                                                            handleCustomerSelect(customer);
                                                        }}
                                                        style={{ cursor: 'pointer' }}
                                                    >
                                                        <div className="text-gray-800">{customer.text || customer.name || customer.email}</div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="p-3 text-muted text-center">{t('admin.notificationForm.noCustomersFound')}</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                {errors.customer_id && <div className="invalid-feedback d-block">{errors.customer_id}</div>}
                            </div>
                        )}

                        <div className="col-md-12 mb-7">
                            <label className="form-label fw-bold required">{t('admin.notificationForm.title')}</label>
                            <input
                                type="text"
                                className={`form-control ${errors.title ? 'is-invalid' : ''}`}
                                value={form.title}
                                onChange={(e) => onChange('title', e.target.value)}
                                placeholder={t('admin.notificationForm.titlePlaceholder')}
                            />
                            {errors.title && <div className="invalid-feedback d-block">{errors.title}</div>}
                        </div>

                        <div className="col-md-12 mb-7">
                            <label className="form-label fw-bold required">{t('admin.notificationForm.description')}</label>
                            <textarea
                                rows={4}
                                className={`form-control ${errors.description ? 'is-invalid' : ''}`}
                                value={form.description}
                                onChange={(e) => onChange('description', e.target.value)}
                                placeholder={t('admin.notificationForm.descriptionPlaceholder')}
                            />
                            {errors.description && <div className="invalid-feedback d-block">{errors.description}</div>}
                        </div>

                        <div className="col-md-6 mb-7">
                            <label className="form-label fw-bold">{t('admin.notificationForm.picture')}</label>
                            <input
                                type="file"
                                className={`form-control ${errors.image ? 'is-invalid' : ''}`}
                                accept="image/*"
                                onChange={(e) => onChange('image', e.target.files?.[0] || null)}
                            />
                            {errors.image && <div className="invalid-feedback d-block">{errors.image}</div>}
                        </div>
                    </div>
                </div>

                <div className="card-footer d-flex justify-content-end py-6 px-9">
                    <Link to="/admin/system/notifications" className="btn btn-light btn-active-light-primary me-2">
                        {t('admin.common.cancel')}
                    </Link>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2"></span>
                                {t('admin.common.saving')}
                            </>
                        ) : (
                            <>{t('admin.notificationForm.saveAndSend')}</>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AdminNotificationForm;

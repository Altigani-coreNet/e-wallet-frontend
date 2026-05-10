import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { useToolbar } from '../../../contexts/ToolbarContext';
import { getApiKeys, generateApiKey, regenerateApiKey } from '../../../services/apiKeysService';

const ApiKeysIndex = () => {
    const { t, i18n } = useTranslation();
    const { setTitle, setBreadcrumbs, setActions } = useToolbar();
    const [apiKeys, setApiKeys] = useState([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState({});
    const [showKeys, setShowKeys] = useState({});

    useEffect(() => {
        setTitle(t('merchant.apiKeys.title'));
        setBreadcrumbs([
            { label: t('merchant.breadcrumbs.dashboard'), path: '/merchant/dashboard' },
            { label: t('merchant.breadcrumbs.developerSettings'), path: '/merchant/api-keys' },
            { label: t('merchant.breadcrumbs.apiKeys'), path: '/merchant/api-keys', active: true }
        ]);
        setActions(null);
        return () => {
            setBreadcrumbs([]);
            setActions(null);
        };
    }, [setTitle, setBreadcrumbs, setActions, t, i18n.language]);

    useEffect(() => {
        fetchApiKeys();
    }, []);

    const fetchApiKeys = async () => {
        setLoading(true);
        try {
            const response = await getApiKeys();
            if (response.success) {
                const data = response.data.data || [];
                setApiKeys(data);
            } else {
                toast.error(response.error || t('merchant.apiKeys.fetchFailed'));
            }
        } catch (error) {
            console.error('Error fetching API keys:', error);
            toast.error(t('merchant.apiKeys.fetchFailed'));
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = async (mode) => {
        setGenerating(prev => ({ ...prev, [mode]: true }));
        try {
            const response = await generateApiKey(mode);
            if (response.success) {
                toast.success(response.data.message || t('merchant.apiKeys.generateSuccess'));
                // Update local state instead of refetching
                const newKey = response.data.data;
                setApiKeys(prev => {
                    const existingIndex = prev.findIndex(k => k.mode === mode);
                    if (existingIndex >= 0) {
                        // Replace existing key
                        const updated = [...prev];
                        updated[existingIndex] = newKey;
                        return updated;
                    } else {
                        // Add new key
                        return [...prev, newKey];
                    }
                });
                // Auto-show the newly generated key
                setShowKeys(prev => ({ ...prev, [mode]: true }));
            } else {
                toast.error(response.error || t('merchant.apiKeys.generateFailed'));
            }
        } catch (error) {
            console.error('Error generating API key:', error);
            toast.error(t('merchant.apiKeys.generateFailed'));
        } finally {
            setGenerating(prev => ({ ...prev, [mode]: false }));
        }
    };

    const handleRegenerate = async (id, mode) => {
        if (!window.confirm(t('merchant.apiKeys.regenerateConfirm'))) {
            return;
        }

        setGenerating(prev => ({ ...prev, [mode]: true }));
        try {
            const response = await regenerateApiKey(id);
            if (response.success) {
                toast.success(response.data.message || t('merchant.apiKeys.regenerateSuccess'));
                // Update local state
                const newKey = response.data.data;
                setApiKeys(prev => prev.map(k => k.id === id ? newKey : k));
                // Auto-show the newly regenerated key
                setShowKeys(prev => ({ ...prev, [mode]: true }));
            } else {
                toast.error(response.error || t('merchant.apiKeys.regenerateFailed'));
            }
        } catch (error) {
            console.error('Error regenerating API key:', error);
            toast.error(t('merchant.apiKeys.regenerateFailed'));
        } finally {
            setGenerating(prev => ({ ...prev, [mode]: false }));
        }
    };

    const formatDt = (d) => (d ? new Date(d).toLocaleString((i18n.language || 'en').toLowerCase().startsWith('ar') ? 'ar-SA' : 'en-US') : '');

    const handleCopy = (text, label) => {
        navigator.clipboard.writeText(text).then(() => {
            toast.success(t('merchant.common.copied', { label }));
        }).catch(() => {
            toast.error(t('merchant.common.copyFailed'));
        });
    };

    const toggleShowKey = (mode) => {
        setShowKeys(prev => ({ ...prev, [mode]: !prev[mode] }));
    };

    // Placeholder skeleton loader component
    const PlaceholderCard = () => (
        <div className="col-md-6">
            <div className="card h-100">
                <div className="card-header border-0 pt-6">
                    <div className="placeholder-glow">
                        <span className="placeholder col-6 mb-2" style={{ height: '24px' }}></span>
                    </div>
                </div>
                <div className="card-body">
                    <div className="placeholder-glow">
                        <span className="placeholder col-4 mb-2" style={{ height: '16px' }}></span>
                        <span className="placeholder col-12 mb-4" style={{ height: '40px' }}></span>
                        <span className="placeholder col-4 mb-2" style={{ height: '16px' }}></span>
                        <span className="placeholder col-12 mb-4" style={{ height: '40px' }}></span>
                    </div>
                </div>
                <div className="card-footer border-0">
                    <div className="placeholder-glow">
                        <span className="placeholder col-4" style={{ height: '40px' }}></span>
                    </div>
                </div>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="row g-5 g-xl-8">
                <PlaceholderCard />
                <PlaceholderCard />
            </div>
        );
    }

    const testKey = apiKeys.find(k => k.mode === 'test');
    const liveKey = apiKeys.find(k => k.mode === 'live');

    return (
        <div className="row g-5 g-xl-8">
            {/* Test Mode Card */}
            <div className="col-md-6">
                <div className="card h-100">
                    <div className="card-header border-0 pt-6">
                        <div className="d-flex align-items-center justify-content-between w-100">
                            <h3 className="card-title fw-bold mb-0">
                                <i className="ki-duotone ki-flask fs-2 text-warning me-2">
                                    <span className="path1"></span>
                                    <span className="path2"></span>
                                </i>
                                {t('merchant.apiKeys.testMode')}
                            </h3>
                            <span className="badge badge-light-warning">{t('merchant.apiKeys.badgeTest')}</span>
                        </div>
                    </div>
                    
                    <div className="card-body">
                        {testKey ? (
                            <>
                                {/* Public Key */}
                                <div className="mb-5">
                                    <label className="form-label fw-semibold">{t('merchant.apiKeys.publicKey')}</label>
                                    <div className="input-group">
                                        <input
                                            type={showKeys.test ? "text" : "password"}
                                            className="form-control form-control-solid"
                                            value={testKey.public_key}
                                            readOnly
                                            style={{ fontFamily: showKeys.test ? 'monospace' : 'inherit' }}
                                        />
                                        <button
                                            className="btn btn-icon btn-light-primary"
                                            onClick={() => toggleShowKey('test')}
                                            title={showKeys.test ? t('merchant.apiKeys.hide') : t('merchant.apiKeys.show')}
                                        >
                                            <i className={`ki-duotone ${showKeys.test ? 'ki-eye-slash' : 'ki-eye'} fs-2`}>
                                                <span className="path1"></span>
                                                <span className="path2"></span>
                                                <span className="path3"></span>
                                            </i>
                                        </button>
                                        <button
                                            className="btn btn-icon btn-light-primary"
                                            onClick={() => handleCopy(testKey.public_key, t('merchant.apiKeys.copyPublicKey'))}
                                            title={t('merchant.apiKeys.copyTitle')}
                                        >
                                            <i className="ki-duotone ki-copy fs-2">
                                                <span className="path1"></span>
                                                <span className="path2"></span>
                                            </i>
                                        </button>
                                    </div>
                                </div>

                                {/* Secret Key */}
                                <div className="mb-5">
                                    <label className="form-label fw-semibold">{t('merchant.apiKeys.secretKey')}</label>
                                    <div className="input-group">
                                        <input
                                            type={showKeys.test ? "text" : "password"}
                                            className="form-control form-control-solid"
                                            value={testKey.secret_key}
                                            readOnly
                                            style={{ fontFamily: showKeys.test ? 'monospace' : 'inherit' }}
                                        />
                                        <button
                                            className="btn btn-icon btn-light-primary"
                                            onClick={() => toggleShowKey('test')}
                                            title={showKeys.test ? t('merchant.apiKeys.hide') : t('merchant.apiKeys.show')}
                                        >
                                            <i className={`ki-duotone ${showKeys.test ? 'ki-eye-slash' : 'ki-eye'} fs-2`}>
                                                <span className="path1"></span>
                                                <span className="path2"></span>
                                                <span className="path3"></span>
                                            </i>
                                        </button>
                                        <button
                                            className="btn btn-icon btn-light-primary"
                                            onClick={() => handleCopy(testKey.secret_key, t('merchant.apiKeys.copySecretKey'))}
                                            title={t('merchant.apiKeys.copyTitle')}
                                        >
                                            <i className="ki-duotone ki-copy fs-2">
                                                <span className="path1"></span>
                                                <span className="path2"></span>
                                            </i>
                                        </button>
                                    </div>
                                </div>

                                {/* Last Used */}
                                {testKey.last_used_at && (
                                    <div className="mb-3">
                                        <span className="text-muted small">
                                            {t('merchant.apiKeys.lastUsed', { date: formatDt(testKey.last_used_at) })}
                                        </span>
                                    </div>
                                )}

                                {/* Created Date */}
                                <div className="mb-3">
                                    <span className="text-muted small">
                                        {t('merchant.apiKeys.createdAt', { date: formatDt(testKey.created_at) })}
                                    </span>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-10">
                                <i className="ki-duotone ki-key fs-5x text-muted mb-5">
                                    <span className="path1"></span>
                                    <span className="path2"></span>
                                </i>
                                <p className="text-muted mb-0">{t('merchant.apiKeys.noTestKey')}</p>
                                <p className="text-muted small">{t('merchant.apiKeys.noTestKeyHint')}</p>
                            </div>
                        )}
                    </div>

                    <div className="card-footer border-0 d-flex justify-content-end gap-3">
                        {testKey ? (
                            <button
                                type="button"
                                className="btn btn-warning"
                                onClick={() => handleRegenerate(testKey.id, 'test')}
                                disabled={generating.test}
                            >
                                {generating.test ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                        {t('merchant.apiKeys.regenerating')}
                                    </>
                                ) : (
                                    <>
                                        <i className="ki-duotone ki-arrows-circle fs-2 me-2">
                                            <span className="path1"></span>
                                            <span className="path2"></span>
                                        </i>
                                        {t('merchant.apiKeys.regenerateKey')}
                                    </>
                                )}
                            </button>
                        ) : (
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={() => handleGenerate('test')}
                                disabled={generating.test}
                            >
                                {generating.test ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                        {t('merchant.apiKeys.generating')}
                                    </>
                                ) : (
                                    <>
                                        <i className="ki-duotone ki-plus fs-2 me-2">
                                            <span className="path1"></span>
                                            <span className="path2"></span>
                                        </i>
                                        {t('merchant.apiKeys.generateKey')}
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Live Mode Card */}
            <div className="col-md-6">
                <div className="card h-100">
                    <div className="card-header border-0 pt-6">
                        <div className="d-flex align-items-center justify-content-between w-100">
                            <h3 className="card-title fw-bold mb-0">
                                <i className="ki-duotone ki-shield-tick fs-2 text-success me-2">
                                    <span className="path1"></span>
                                    <span className="path2"></span>
                                </i>
                                {t('merchant.apiKeys.liveMode')}
                            </h3>
                            <span className="badge badge-light-success">{t('merchant.apiKeys.badgeLive')}</span>
                        </div>
                    </div>
                    
                    <div className="card-body">
                        {liveKey ? (
                            <>
                                {/* Public Key */}
                                <div className="mb-5">
                                    <label className="form-label fw-semibold">{t('merchant.apiKeys.publicKey')}</label>
                                    <div className="input-group">
                                        <input
                                            type={showKeys.live ? "text" : "password"}
                                            className="form-control form-control-solid"
                                            value={liveKey.public_key}
                                            readOnly
                                            style={{ fontFamily: showKeys.live ? 'monospace' : 'inherit' }}
                                        />
                                        <button
                                            className="btn btn-icon btn-light-primary"
                                            onClick={() => toggleShowKey('live')}
                                            title={showKeys.live ? t('merchant.apiKeys.hide') : t('merchant.apiKeys.show')}
                                        >
                                            <i className={`ki-duotone ${showKeys.live ? 'ki-eye-slash' : 'ki-eye'} fs-2`}>
                                                <span className="path1"></span>
                                                <span className="path2"></span>
                                                <span className="path3"></span>
                                            </i>
                                        </button>
                                        <button
                                            className="btn btn-icon btn-light-primary"
                                            onClick={() => handleCopy(liveKey.public_key, t('merchant.apiKeys.copyPublicKey'))}
                                            title={t('merchant.apiKeys.copyTitle')}
                                        >
                                            <i className="ki-duotone ki-copy fs-2">
                                                <span className="path1"></span>
                                                <span className="path2"></span>
                                            </i>
                                        </button>
                                    </div>
                                </div>

                                {/* Secret Key */}
                                <div className="mb-5">
                                    <label className="form-label fw-semibold">{t('merchant.apiKeys.secretKey')}</label>
                                    <div className="input-group">
                                        <input
                                            type={showKeys.live ? "text" : "password"}
                                            className="form-control form-control-solid"
                                            value={liveKey.secret_key}
                                            readOnly
                                            style={{ fontFamily: showKeys.live ? 'monospace' : 'inherit' }}
                                        />
                                        <button
                                            className="btn btn-icon btn-light-primary"
                                            onClick={() => toggleShowKey('live')}
                                            title={showKeys.live ? t('merchant.apiKeys.hide') : t('merchant.apiKeys.show')}
                                        >
                                            <i className={`ki-duotone ${showKeys.live ? 'ki-eye-slash' : 'ki-eye'} fs-2`}>
                                                <span className="path1"></span>
                                                <span className="path2"></span>
                                                <span className="path3"></span>
                                            </i>
                                        </button>
                                        <button
                                            className="btn btn-icon btn-light-primary"
                                            onClick={() => handleCopy(liveKey.secret_key, t('merchant.apiKeys.copySecretKey'))}
                                            title={t('merchant.apiKeys.copyTitle')}
                                        >
                                            <i className="ki-duotone ki-copy fs-2">
                                                <span className="path1"></span>
                                                <span className="path2"></span>
                                            </i>
                                        </button>
                                    </div>
                                </div>

                                {/* Last Used */}
                                {liveKey.last_used_at && (
                                    <div className="mb-3">
                                        <span className="text-muted small">
                                            {t('merchant.apiKeys.lastUsed', { date: formatDt(liveKey.last_used_at) })}
                                        </span>
                                    </div>
                                )}

                                {/* Created Date */}
                                <div className="mb-3">
                                    <span className="text-muted small">
                                        {t('merchant.apiKeys.createdAt', { date: formatDt(liveKey.created_at) })}
                                    </span>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-10">
                                <i className="ki-duotone ki-key fs-5x text-muted mb-5">
                                    <span className="path1"></span>
                                    <span className="path2"></span>
                                </i>
                                <p className="text-muted mb-0">No live API key generated yet</p>
                                <p className="text-muted small">Click the button below to generate your live API keys</p>
                            </div>
                        )}
                    </div>

                    <div className="card-footer border-0 d-flex justify-content-end gap-3">
                        {liveKey ? (
                            <button
                                type="button"
                                className="btn btn-warning"
                                onClick={() => handleRegenerate(liveKey.id, 'live')}
                                disabled={generating.live}
                            >
                                {generating.live ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                        {t('merchant.apiKeys.regenerating')}
                                    </>
                                ) : (
                                    <>
                                        <i className="ki-duotone ki-arrows-circle fs-2 me-2">
                                            <span className="path1"></span>
                                            <span className="path2"></span>
                                        </i>
                                        {t('merchant.apiKeys.regenerateKey')}
                                    </>
                                )}
                            </button>
                        ) : (
                            <button
                                type="button"
                                className="btn btn-success"
                                onClick={() => handleGenerate('live')}
                                disabled={generating.live}
                            >
                                {generating.live ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                        {t('merchant.apiKeys.generating')}
                                    </>
                                ) : (
                                    <>
                                        <i className="ki-duotone ki-plus fs-2 me-2">
                                            <span className="path1"></span>
                                            <span className="path2"></span>
                                        </i>
                                        {t('merchant.apiKeys.generateKey')}
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Information Card */}
            <div className="col-12">
                <div className="card">
                    <div className="card-body">
                        <div className="d-flex align-items-start gap-3">
                            <i className="ki-duotone ki-information-5 fs-2x text-primary">
                                <span className="path1"></span>
                                <span className="path2"></span>
                                <span className="path3"></span>
                            </i>
                            <div>
                                <h4 className="fw-bold mb-3">{t('merchant.apiKeys.importantInfo')}</h4>
                                <ul className="mb-0">
                                    <li className="mb-2">{t('merchant.apiKeys.infoTestMode')}</li>
                                    <li className="mb-2">{t('merchant.apiKeys.infoLiveMode')}</li>
                                    <li className="mb-2">{t('merchant.apiKeys.infoSecurity')}</li>
                                    <li className="mb-2">{t('merchant.apiKeys.infoRegeneration')}</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ApiKeysIndex;


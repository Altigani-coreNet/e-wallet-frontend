import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useToolbar } from '../../../contexts/ToolbarContext';
import { getApiKeys, generateApiKey, regenerateApiKey } from '../../../services/apiKeysService';

const ApiKeysIndex = () => {
    const { setTitle, setBreadcrumbs, setActions } = useToolbar();
    const [apiKeys, setApiKeys] = useState([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState({});
    const [showKeys, setShowKeys] = useState({});

    useEffect(() => {
        setTitle('API Keys');
        setBreadcrumbs([
            { label: 'Dashboard', path: '/merchant/dashboard' },
            { label: 'Developer Settings', path: '/merchant/api-keys' },
            { label: 'API Keys', path: '/merchant/api-keys', active: true }
        ]);
        setActions(null);
        return () => {
            setBreadcrumbs([]);
            setActions(null);
        };
    }, [setTitle, setBreadcrumbs, setActions]);

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
                toast.error(response.error || 'Failed to fetch API keys');
            }
        } catch (error) {
            console.error('Error fetching API keys:', error);
            toast.error('Failed to fetch API keys');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = async (mode) => {
        setGenerating(prev => ({ ...prev, [mode]: true }));
        try {
            const response = await generateApiKey(mode);
            if (response.success) {
                toast.success(response.data.message || 'API key generated successfully');
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
                toast.error(response.error || 'Failed to generate API key');
            }
        } catch (error) {
            console.error('Error generating API key:', error);
            toast.error('Failed to generate API key');
        } finally {
            setGenerating(prev => ({ ...prev, [mode]: false }));
        }
    };

    const handleRegenerate = async (id, mode) => {
        if (!window.confirm('Are you sure you want to regenerate this API key? The old key will be deactivated and cannot be used anymore.')) {
            return;
        }

        setGenerating(prev => ({ ...prev, [mode]: true }));
        try {
            const response = await regenerateApiKey(id);
            if (response.success) {
                toast.success(response.data.message || 'API key regenerated successfully');
                // Update local state
                const newKey = response.data.data;
                setApiKeys(prev => prev.map(k => k.id === id ? newKey : k));
                // Auto-show the newly regenerated key
                setShowKeys(prev => ({ ...prev, [mode]: true }));
            } else {
                toast.error(response.error || 'Failed to regenerate API key');
            }
        } catch (error) {
            console.error('Error regenerating API key:', error);
            toast.error('Failed to regenerate API key');
        } finally {
            setGenerating(prev => ({ ...prev, [mode]: false }));
        }
    };

    const handleCopy = (text, label) => {
        navigator.clipboard.writeText(text).then(() => {
            toast.success(`${label} copied to clipboard`);
        }).catch(() => {
            toast.error('Failed to copy to clipboard');
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
                                Test Mode
                            </h3>
                            <span className="badge badge-light-warning">Test</span>
                        </div>
                    </div>
                    
                    <div className="card-body">
                        {testKey ? (
                            <>
                                {/* Public Key */}
                                <div className="mb-5">
                                    <label className="form-label fw-semibold">Public Key</label>
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
                                            title={showKeys.test ? 'Hide' : 'Show'}
                                        >
                                            <i className={`ki-duotone ${showKeys.test ? 'ki-eye-slash' : 'ki-eye'} fs-2`}>
                                                <span className="path1"></span>
                                                <span className="path2"></span>
                                                <span className="path3"></span>
                                            </i>
                                        </button>
                                        <button
                                            className="btn btn-icon btn-light-primary"
                                            onClick={() => handleCopy(testKey.public_key, 'Public key')}
                                            title="Copy"
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
                                    <label className="form-label fw-semibold">Secret Key</label>
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
                                            title={showKeys.test ? 'Hide' : 'Show'}
                                        >
                                            <i className={`ki-duotone ${showKeys.test ? 'ki-eye-slash' : 'ki-eye'} fs-2`}>
                                                <span className="path1"></span>
                                                <span className="path2"></span>
                                                <span className="path3"></span>
                                            </i>
                                        </button>
                                        <button
                                            className="btn btn-icon btn-light-primary"
                                            onClick={() => handleCopy(testKey.secret_key, 'Secret key')}
                                            title="Copy"
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
                                            Last used: {new Date(testKey.last_used_at).toLocaleString()}
                                        </span>
                                    </div>
                                )}

                                {/* Created Date */}
                                <div className="mb-3">
                                    <span className="text-muted small">
                                        Created: {new Date(testKey.created_at).toLocaleString()}
                                    </span>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-10">
                                <i className="ki-duotone ki-key fs-5x text-muted mb-5">
                                    <span className="path1"></span>
                                    <span className="path2"></span>
                                </i>
                                <p className="text-muted mb-0">No test API key generated yet</p>
                                <p className="text-muted small">Click the button below to generate your test API keys</p>
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
                                        Regenerating...
                                    </>
                                ) : (
                                    <>
                                        <i className="ki-duotone ki-arrows-circle fs-2 me-2">
                                            <span className="path1"></span>
                                            <span className="path2"></span>
                                        </i>
                                        Regenerate Key
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
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <i className="ki-duotone ki-plus fs-2 me-2">
                                            <span className="path1"></span>
                                            <span className="path2"></span>
                                        </i>
                                        Generate Key
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
                                Live Mode
                            </h3>
                            <span className="badge badge-light-success">Live</span>
                        </div>
                    </div>
                    
                    <div className="card-body">
                        {liveKey ? (
                            <>
                                {/* Public Key */}
                                <div className="mb-5">
                                    <label className="form-label fw-semibold">Public Key</label>
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
                                            title={showKeys.live ? 'Hide' : 'Show'}
                                        >
                                            <i className={`ki-duotone ${showKeys.live ? 'ki-eye-slash' : 'ki-eye'} fs-2`}>
                                                <span className="path1"></span>
                                                <span className="path2"></span>
                                                <span className="path3"></span>
                                            </i>
                                        </button>
                                        <button
                                            className="btn btn-icon btn-light-primary"
                                            onClick={() => handleCopy(liveKey.public_key, 'Public key')}
                                            title="Copy"
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
                                    <label className="form-label fw-semibold">Secret Key</label>
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
                                            title={showKeys.live ? 'Hide' : 'Show'}
                                        >
                                            <i className={`ki-duotone ${showKeys.live ? 'ki-eye-slash' : 'ki-eye'} fs-2`}>
                                                <span className="path1"></span>
                                                <span className="path2"></span>
                                                <span className="path3"></span>
                                            </i>
                                        </button>
                                        <button
                                            className="btn btn-icon btn-light-primary"
                                            onClick={() => handleCopy(liveKey.secret_key, 'Secret key')}
                                            title="Copy"
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
                                            Last used: {new Date(liveKey.last_used_at).toLocaleString()}
                                        </span>
                                    </div>
                                )}

                                {/* Created Date */}
                                <div className="mb-3">
                                    <span className="text-muted small">
                                        Created: {new Date(liveKey.created_at).toLocaleString()}
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
                                        Regenerating...
                                    </>
                                ) : (
                                    <>
                                        <i className="ki-duotone ki-arrows-circle fs-2 me-2">
                                            <span className="path1"></span>
                                            <span className="path2"></span>
                                        </i>
                                        Regenerate Key
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
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <i className="ki-duotone ki-plus fs-2 me-2">
                                            <span className="path1"></span>
                                            <span className="path2"></span>
                                        </i>
                                        Generate Key
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
                                <h4 className="fw-bold mb-3">Important Information</h4>
                                <ul className="mb-0">
                                    <li className="mb-2">
                                        <strong>Test Mode:</strong> Use test API keys for development and testing. No real transactions will be processed.
                                    </li>
                                    <li className="mb-2">
                                        <strong>Live Mode:</strong> Use live API keys for production. Real transactions will be processed and charged.
                                    </li>
                                    <li className="mb-2">
                                        <strong>Security:</strong> Keep your secret keys secure and never share them publicly. Treat them like passwords.
                                    </li>
                                    <li className="mb-2">
                                        <strong>Regeneration:</strong> Regenerating a key will deactivate the old key immediately. Update your applications before regenerating.
                                    </li>
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


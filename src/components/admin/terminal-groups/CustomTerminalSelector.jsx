import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { getToken } from '../../../utils/api';
import { ADMIN_ENDPOINTS } from '../../../utils/constants';

const CustomTerminalSelector = ({ 
    selectedTerminals, 
    onTerminalChange,
    merchantId = null,
    className = '' 
}) => {
    const { t } = useTranslation();
    const [terminals, setTerminals] = useState([]);
    const [filteredTerminals, setFilteredTerminals] = useState([]);
    const [brands, setBrands] = useState([]);
    const [models, setModels] = useState([]);
    const [manufacturers, setManufacturers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [apiLoading, setApiLoading] = useState(false);
    const [brandsLoading, setBrandsLoading] = useState(false);
    const [modelsLoading, setModelsLoading] = useState(false);
    const [manufacturersLoading, setManufacturersLoading] = useState(false);
    const [brandsError, setBrandsError] = useState(null);
    const [modelsError, setModelsError] = useState(null);
    const [manufacturersError, setManufacturersError] = useState(null);
    
    // Filter states
    const [selectedBrands, setSelectedBrands] = useState([]);
    const [selectedModels, setSelectedModels] = useState([]);
    const [selectedManufacturers, setSelectedManufacturers] = useState([]);
    
    // UI states
    const [searchTerm, setSearchTerm] = useState('');

    // Load terminals and initial brands
    useEffect(() => {
        if (merchantId) {
            loadTerminals();
            loadBrands();
        }
    }, [merchantId]);

    // Load models when brands selection changes
    useEffect(() => {
        if (selectedBrands.length > 0) {
            loadModelsForBrands(selectedBrands);
        } else {
            setModels([]);
            setSelectedModels([]);
        }
    }, [selectedBrands]);

    // Load manufacturers when models selection changes
    useEffect(() => {
        if (selectedModels.length > 0) {
            loadManufacturersForModels(selectedModels);
        } else {
            setManufacturers([]);
            setSelectedManufacturers([]);
        }
    }, [selectedModels]);

    // Apply filters when selections change
    useEffect(() => {
        applyFilters();
    }, [selectedBrands, selectedModels, selectedManufacturers, searchTerm, terminals]);

    // Fetch filtered terminals from API when filters change
    useEffect(() => {
        if (merchantId && (selectedBrands.length > 0 || selectedModels.length > 0 || selectedManufacturers.length > 0 || searchTerm)) {
            fetchFilteredTerminals();
        } else if (merchantId) {
            loadTerminals();
        }
    }, [selectedBrands, selectedModels, selectedManufacturers, searchTerm, merchantId]);

    const loadTerminals = async () => {
        setLoading(true);
        try {
            const token = getToken();
            const params = merchantId ? { merchant_id: merchantId } : {};
            
            const response = await axios.get(`${ADMIN_ENDPOINTS.TERMINALS}/filters`, {
                params,
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            let terminalsData = [];
            if (response.data && response.data.data) {
                terminalsData = response.data.data;
            } else if (response.data) {
                terminalsData = response.data;
            }
            
            setTerminals(terminalsData);
        } catch (error) {
            console.error('Error loading terminals:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadBrands = async () => {
        setBrandsLoading(true);
        setBrandsError(null);
        try {
            const token = getToken();
            const response = await axios.get(`${ADMIN_ENDPOINTS.TERMINALS.replace('/terminals', '/brands')}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.data && response.data.success && response.data.data) {
                const brandsData = response.data.data;
                setBrands(brandsData);
            } else {
                // Fallback: extract brands from terminals
                const terminalsResponse = await axios.get(`${ADMIN_ENDPOINTS.TERMINALS}/filters`, {
                    params: merchantId ? { merchant_id: merchantId } : {},
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (terminalsResponse.data && terminalsResponse.data.data) {
                    const terminalsData = terminalsResponse.data.data;
                    const uniqueBrands = [...new Set(terminalsData.map(term => term.brand).filter(Boolean))];
                    setBrands(uniqueBrands);
                }
            }
        } catch (error) {
            setBrandsError(error);
            console.error('Error loading brands:', error);
        } finally {
            setBrandsLoading(false);
        }
    };

    const loadModelsForBrands = async (selectedBrands) => {
        setModelsLoading(true);
        setModelsError(null);
        try {
            const token = getToken();
            const response = await axios.post(`${ADMIN_ENDPOINTS.TERMINALS}/models-by-brands`, {
                brands: selectedBrands
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.data && response.data.success && response.data.data) {
                setModels(response.data.data);
            } else {
                // Fallback: filter models from terminals based on selected brands
                const filteredTerminals = terminals.filter(t => selectedBrands.includes(t.brand));
                const uniqueModels = [...new Set(filteredTerminals.map(term => term.model).filter(Boolean))];
                setModels(uniqueModels);
            }
        } catch (error) {
            setModelsError(error);
            console.error('Error loading models for brands:', error);
            // Fallback: filter models from terminals based on selected brands
            const filteredTerminals = terminals.filter(t => selectedBrands.includes(t.brand));
            const uniqueModels = [...new Set(filteredTerminals.map(term => term.model).filter(Boolean))];
            setModels(uniqueModels);
        } finally {
            setModelsLoading(false);
        }
    };

    const loadManufacturersForModels = async (selectedModels) => {
        setManufacturersLoading(true);
        setManufacturersError(null);
        try {
            const token = getToken();
            const response = await axios.post(`${ADMIN_ENDPOINTS.TERMINALS}/manufacturers-by-models`, {
                models: selectedModels
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.data && response.data.success && response.data.data) {
                setManufacturers(response.data.data);
            } else {
                // Fallback: filter manufacturers from terminals based on selected models
                const filteredTerminals = terminals.filter(t => selectedModels.includes(t.model));
                const uniqueManufacturers = [...new Set(filteredTerminals.map(term => term.manufacturer).filter(Boolean))];
                setManufacturers(uniqueManufacturers);
            }
        } catch (error) {
            setManufacturersError(error);
            console.error('Error loading manufacturers for models:', error);
            // Fallback: filter manufacturers from terminals based on selected models
            const filteredTerminals = terminals.filter(t => selectedModels.includes(t.model));
            const uniqueManufacturers = [...new Set(filteredTerminals.map(term => term.manufacturer).filter(Boolean))];
            setManufacturers(uniqueManufacturers);
        } finally {
            setManufacturersLoading(false);
        }
    };

    const fetchFilteredTerminals = async () => {
        setApiLoading(true);
        try {
            // Prepare filter parameters
            const params = {};
            
            if (merchantId) {
                params.merchant_id = merchantId;
            }
            
            if (selectedBrands.length > 0) {
                params.brand = selectedBrands.join(',');
            }
            
            if (selectedModels.length > 0) {
                params.model = selectedModels.join(',');
            }
            
            if (selectedManufacturers.length > 0) {
                params.manufacturer = selectedManufacturers.join(',');
            }
            
            if (searchTerm) {
                params.search = searchTerm;
            }

            // Make API call to get filtered terminals
            const token = getToken();
            const response = await axios.get(`${ADMIN_ENDPOINTS.TERMINALS}/filters`, {
                params,
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            let terminalsData = [];
            if (response.data && response.data.data) {
                terminalsData = response.data.data;
            } else if (response.data) {
                terminalsData = response.data;
            }
            
            setTerminals(terminalsData);
            
        } catch (error) {
            console.error('Error fetching filtered terminals:', error);
            // Fallback to local filtering if API fails
            applyFilters();
        } finally {
            setApiLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...terminals];

        // Apply brand filters
        if (selectedBrands.length > 0) {
            filtered = filtered.filter(terminal => selectedBrands.includes(terminal.brand));
        }

        // Apply model filters
        if (selectedModels.length > 0) {
            filtered = filtered.filter(terminal => selectedModels.includes(terminal.model));
        }

        // Apply manufacturer filters
        if (selectedManufacturers.length > 0) {
            filtered = filtered.filter(terminal => selectedManufacturers.includes(terminal.manufacturer));
        }

        // Apply search filter
        if (searchTerm) {
            filtered = filtered.filter(terminal => 
                terminal.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                terminal.terminal_id?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        setFilteredTerminals(filtered);
    };

    const handleFilterChange = (filterType, value) => {
        switch (filterType) {
            case 'brand':
                const newSelectedBrands = selectedBrands.includes(value) 
                    ? selectedBrands.filter(brand => brand !== value)
                    : [...selectedBrands, value];
                
                setSelectedBrands(newSelectedBrands);
                
                // Clear dependent selections when brands change
                if (newSelectedBrands.length === 0) {
                    setSelectedModels([]);
                    setSelectedManufacturers([]);
                } else if (!newSelectedBrands.includes(value)) {
                    setSelectedModels([]);
                    setSelectedManufacturers([]);
                }
                break;
                
            case 'model':
                const newSelectedModels = selectedModels.includes(value) 
                    ? selectedModels.filter(model => model !== value)
                    : [...selectedModels, value];
                
                setSelectedModels(newSelectedModels);
                
                // Clear dependent selections when models change
                if (newSelectedModels.length === 0) {
                    setSelectedManufacturers([]);
                } else if (!newSelectedModels.includes(value)) {
                    setSelectedManufacturers([]);
                }
                break;
                
            case 'manufacturer':
                setSelectedManufacturers(prev => 
                    prev.includes(value) 
                        ? prev.filter(manufacturer => manufacturer !== value)
                        : [...prev, value]
                );
                break;
                
            default:
                break;
        }
    };

    const clearAllFilters = () => {
        setSelectedBrands([]);
        setSelectedModels([]);
        setSelectedManufacturers([]);
        setSearchTerm('');
        setModels([]);
        setManufacturers([]);
        loadTerminals();
    };

    const handleTerminalToggle = (terminalId) => {
        const newSelection = selectedTerminals.includes(terminalId)
            ? selectedTerminals.filter(id => id !== terminalId)
            : [...selectedTerminals, terminalId];
        
        onTerminalChange(newSelection);
    };

    const handleSelectAll = () => {
        if (selectedTerminals.length === filteredTerminals.length) {
            onTerminalChange([]);
        } else {
            const allFilteredTerminalIds = filteredTerminals.map(terminal => terminal.id);
            onTerminalChange(allFilteredTerminalIds);
        }
    };

    const terminalSelectAllAction = useMemo(
        () =>
            selectedTerminals.length === filteredTerminals.length && filteredTerminals.length > 0
                ? t('admin.selectorCommon.deselectAll')
                : t('admin.selectorCommon.selectAll'),
        [selectedTerminals.length, filteredTerminals.length, t]
    );

    const getActiveFiltersCount = () => {
        return selectedBrands.length + selectedModels.length + selectedManufacturers.length;
    };

    if (!merchantId) {
        return (
            <div className="alert alert-info">
                <i className="ki-duotone ki-information-5 fs-2 me-2">
                    <span className="path1"></span>
                    <span className="path2"></span>
                    <span className="path3"></span>
                </i>
                {t('admin.terminalGroupsUI.terminalSelector.pickMerchantFirst')}
            </div>
        );
    }

    return (
        <div className={`custom-terminal-selector ${className}`}>
            {/* Custom CSS for better styling */}
            <style>{`
                .custom-terminal-selector .brand-model-badge {
                    cursor: pointer;
                    transition: all 0.2s ease;
                    margin: 0.25rem;
                }
                .custom-terminal-selector .brand-model-badge:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                .custom-terminal-selector .brand-model-badge.active {
                    background-color: #0d6efd !important;
                    border-color: #0d6efd !important;
                    color: white !important;
                }
            `}</style>

            {/* Brands and Models Header */}
            <div className="brands-models-header mb-4 p-4 bg-white border rounded shadow-sm">
                <h5 className="mb-3 fw-bold text-primary">
                    <i className="ki-duotone ki-tag fs-4 me-2">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    {t('admin.terminalGroupsUI.terminalSelector.header')}
                </h5>
                
                {brandsLoading ? (
                    <div className="text-center py-3">
                        <div className="spinner-border spinner-border-sm text-primary me-2" role="status">
                            <span className="visually-hidden">{t('admin.selectorCommon.loading')}</span>
                        </div>
                        <span className="text-muted">{t('admin.terminalGroupsUI.terminalSelector.loadingBrands')}</span>
                    </div>
                ) : brandsError ? (
                    <div className="alert alert-warning py-2">
                        <i className="ki-duotone ki-warning fs-5 me-2"></i>
                        <small>{t('admin.terminalGroupsUI.terminalSelector.brandsFallback')}</small>
                    </div>
                ) : (
                    <>
                        {/* Brands Section - Always Visible */}
                        <div className="mb-4">
                            <h6 className="mb-2 fw-semibold text-dark">
                                <i className="ki-duotone ki-star fs-5 me-2 text-warning"></i>
                                {t('admin.terminalGroupsUI.terminalSelector.brandsSection', { count: brands.length })}
                            </h6>
                            <div className="d-flex flex-wrap gap-2">
                                {brands.length > 0 ? (
                                    brands.map(brand => (
                                        <span
                                            key={brand}
                                            className={`brand-model-badge badge ${selectedBrands.includes(brand) ? 'active' : 'bg-light text-dark border'}`}
                                            onClick={() => handleFilterChange('brand', brand)}
                                            title={t('admin.selectorCommon.filterBy', { name: brand })}
                                        >
                                            {brand}
                                        </span>
                                    ))
                                ) : (
                                    <span className="text-muted small">{t('admin.terminalGroupsUI.terminalSelector.noBrands')}</span>
                                )}
                            </div>
                        </div>

                        {/* Models Section - Only visible when brands are selected */}
                        {selectedBrands.length > 0 && (
                            <div className="mb-3">
                                <h6 className="mb-2 fw-semibold text-dark">
                                    <i className="ki-duotone ki-gear fs-5 me-2 text-info"></i>
                                    {t('admin.terminalGroupsUI.terminalSelector.modelsSection', { count: models.length })}
                                </h6>
                                {modelsLoading ? (
                                    <div className="text-center py-2">
                                        <div className="spinner-border spinner-border-sm text-info me-2" role="status">
                                            <span className="visually-hidden">{t('admin.selectorCommon.loading')}</span>
                                        </div>
                                        <span className="text-muted small">{t('admin.terminalGroupsUI.terminalSelector.loadingModels')}</span>
                                    </div>
                                ) : modelsError ? (
                                    <div className="alert alert-warning py-2">
                                        <i className="ki-duotone ki-warning fs-5 me-2"></i>
                                        <small>{t('admin.terminalGroupsUI.terminalSelector.modelsFallback')}</small>
                                    </div>
                                ) : (
                                    <div className="d-flex flex-wrap gap-2">
                                        {models.length > 0 ? (
                                            models.map(model => (
                                                <span
                                                    key={model}
                                                    className={`brand-model-badge badge ${selectedModels.includes(model) ? 'active' : 'bg-light text-dark border'}`}
                                                    onClick={() => handleFilterChange('model', model)}
                                                    title={t('admin.selectorCommon.filterBy', { name: model })}
                                                >
                                                    {model}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-muted small">{t('admin.terminalGroupsUI.terminalSelector.noModelsForBrands')}</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Manufacturers Section - Only visible when models are selected */}
                        {selectedModels.length > 0 && (
                            <div className="mb-3">
                                <h6 className="mb-2 fw-semibold text-dark">
                                    <i className="ki-duotone ki-factory fs-5 me-2 text-success"></i>
                                    Manufacturers for Selected Models ({manufacturers.length})
                                </h6>
                                {manufacturersLoading ? (
                                    <div className="text-center py-2">
                                        <div className="spinner-border spinner-border-sm text-success me-2" role="status">
                                            <span className="visually-hidden">{t('admin.selectorCommon.loading')}</span>
                                        </div>
                                        <span className="text-muted small">{t('admin.terminalGroupsUI.terminalSelector.loadingManufacturers')}</span>
                                    </div>
                                ) : manufacturersError ? (
                                    <div className="alert alert-warning py-2">
                                        <i className="ki-duotone ki-warning fs-5 me-2"></i>
                                        <small>{t('admin.terminalGroupsUI.terminalSelector.manufacturersFallback')}</small>
                                    </div>
                                ) : (
                                    <div className="d-flex flex-wrap gap-2">
                                        {manufacturers.length > 0 ? (
                                            manufacturers.map(manufacturer => (
                                                <span
                                                    key={manufacturer}
                                                    className={`brand-model-badge badge ${selectedManufacturers.includes(manufacturer) ? 'active' : 'bg-light text-dark border'}`}
                                                    onClick={() => handleFilterChange('manufacturer', manufacturer)}
                                                    title={t('admin.selectorCommon.filterBy', { name: manufacturer })}
                                                >
                                                    {manufacturer}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-muted small">{t('admin.terminalGroupsUI.terminalSelector.noManufacturersForModels')}</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}

                {/* Quick Actions */}
                <div className="d-flex gap-2 mt-3">
                    <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => {
                            if (selectedBrands.length > 0 || selectedModels.length > 0 || selectedManufacturers.length > 0) {
                                clearAllFilters();
                            }
                        }}
                        disabled={selectedBrands.length === 0 && selectedModels.length === 0 && selectedManufacturers.length === 0}
                    >
                        <i className="ki-duotone ki-refresh fs-5 me-1">
                            <span className="path1"></span>
                            <span className="path2"></span>
                        </i>
                        Clear Filters
                    </button>
                    <span className="text-muted small align-self-center">
                        Click on any brand or model to filter terminals
                    </span>
                </div>
            </div>

            {/* Filter Top Bar - Shows selected filters */}
            <div className="filter-top-bar mb-3 p-3 bg-light rounded">
                <div className="d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                        <span className="fw-bold">{t('admin.selectorCommon.activeFiltersHeading')}</span>
                        {getActiveFiltersCount() === 0 ? (
                            <span className="text-muted">{t('admin.selectorCommon.noneSelected')}</span>
                        ) : (
                            <>
                                {selectedBrands.length > 0 && (
                                    <span className="badge bg-primary me-2">
                                        {t('admin.selectorCommon.brandsLabel')} {selectedBrands.join(', ')}
                                        <button 
                                            className="btn-close btn-close-white ms-2" 
                                            onClick={() => setSelectedBrands([])}
                                            style={{ fontSize: '0.5rem' }}
                                        />
                                    </span>
                                )}
                                {selectedModels.length > 0 && (
                                    <span className="badge bg-success me-2">
                                        {t('admin.selectorCommon.modelsLabel')} {selectedModels.join(', ')}
                                        <button 
                                            className="btn-close btn-close-white ms-2" 
                                            onClick={() => setSelectedModels([])}
                                            style={{ fontSize: '0.5rem' }}
                                        />
                                    </span>
                                )}
                                {selectedManufacturers.length > 0 && (
                                    <span className="badge bg-info me-2">
                                        {t('admin.selectorCommon.manufacturersLabel')} {selectedManufacturers.join(', ')}
                                        <button 
                                            className="btn-close btn-close-white ms-2" 
                                            onClick={() => setSelectedManufacturers([])}
                                            style={{ fontSize: '0.5rem' }}
                                        />
                                    </span>
                                )}
                            </>
                        )}
                    </div>
                    {getActiveFiltersCount() > 0 && (
                        <button 
                            className="btn btn-sm btn-outline-secondary"
                            onClick={clearAllFilters}
                        >
                            {t('admin.selectorCommon.clearAll')}
                        </button>
                    )}
                </div>
            </div>

            {/* Search Bar */}
            <div className="search-container mb-3">
                <div className="input-group">
                    <span className="input-group-text">
                        <i className="ki-duotone ki-magnifier fs-3">
                            <span className="path1"></span>
                            <span className="path2"></span>
                        </i>
                    </span>
                    <input
                        type="text"
                        className="form-control"
                        placeholder={t('admin.terminalGroupsUI.terminalSelector.searchPlaceholder')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Terminal List */}
            <div className="terminal-selector-container">
                {/* Results Count */}
                <div className="results-count mb-3 p-2 bg-light rounded">
                    <small className="text-muted">
                        {t('admin.terminalGroupsUI.terminalSelector.showingTerminals', { shown: filteredTerminals.length, total: terminals.length })}
                    </small>
                </div>

                <div className="terminal-list">
                    {/* Filter Loading Indicator */}
                    {apiLoading && (selectedBrands.length > 0 || selectedModels.length > 0 || selectedManufacturers.length > 0 || searchTerm) && (
                        <div className="alert alert-info py-2 mb-3">
                            <div className="d-flex align-items-center">
                                <div className="spinner-border spinner-border-sm text-info me-2" role="status">
                                    <span className="visually-hidden">{t('admin.selectorCommon.loading')}</span>
                                </div>
                                <span className="small">{t('admin.terminalGroupsUI.terminalSelector.fetchingTerminals')}</span>
                            </div>
                        </div>
                    )}
                    
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <div className="d-flex align-items-center gap-3">
                            <h6 className="mb-0 fw-bold">
                                {t('admin.terminalGroupsUI.terminalSelector.terminalsHeading', { count: filteredTerminals.length })}
                            </h6>
                            {filteredTerminals.length > 0 && (
                                <div className="d-flex align-items-center gap-2">
                                    <button
                                        className={`btn btn-sm ${selectedTerminals.length === filteredTerminals.length && filteredTerminals.length > 0 ? 'btn-success' : 'btn-outline-primary'}`}
                                        onClick={() => handleSelectAll()}
                                        title={terminalSelectAllAction}
                                    >
                                        <i className={`ki-duotone ${selectedTerminals.length === filteredTerminals.length && filteredTerminals.length > 0 ? 'ki-check' : 'ki-plus'} fs-5 me-1`}>
                                            <span className="path1"></span>
                                            <span className="path2"></span>
                                        </i>
                                        {terminalSelectAllAction}
                                    </button>
                                    {selectedTerminals.length > 0 && selectedTerminals.length < filteredTerminals.length && (
                                        <small className="text-muted">
                                            {t('admin.selectorCommon.ofTotal', { selected: selectedTerminals.length, total: filteredTerminals.length })}
                                        </small>
                                    )}
                                </div>
                            )}
                        </div>
                        <small className="text-muted">
                            {t('admin.selectorCommon.selectedCount', { count: selectedTerminals.length })}
                        </small>
                    </div>

                    {loading ? (
                        <div className="text-center py-4">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">{t('admin.selectorCommon.loading')}</span>
                            </div>
                        </div>
                    ) : filteredTerminals.length === 0 ? (
                        <div className="text-center py-4 text-muted">
                            <i className="ki-duotone ki-search fs-2x mb-2">
                                <span className="path1"></span>
                                <span className="path2"></span>
                            </i>
                            <p>{t('admin.terminalGroupsUI.terminalSelector.noMatch')}</p>
                        </div>
                    ) : (
                        <div className="terminal-grid">
                            {/* Select All Header */}
                            <div className="select-all-header p-2 mb-2 bg-light border rounded">
                                <div className="form-check d-flex align-items-center">
                                    <input
                                        className="form-check-input me-2"
                                        type="checkbox"
                                        checked={selectedTerminals.length === filteredTerminals.length && filteredTerminals.length > 0}
                                        onChange={handleSelectAll}
                                        id="select-all-terminals"
                                    />
                                    <label className="form-check-label fw-semibold mb-0" htmlFor="select-all-terminals">
                                        {t('admin.terminalGroupsUI.terminalSelector.selectAllTerminals', { action: terminalSelectAllAction })}
                                        {selectedTerminals.length > 0 && (
                                            <span className="text-muted ms-2">
                                                {t('admin.selectorCommon.ofTotal', { selected: selectedTerminals.length, total: filteredTerminals.length })}
                                            </span>
                                        )}
                                    </label>
                                </div>
                            </div>
                            
                            {filteredTerminals.map(terminal => (
                                <div 
                                    key={terminal.id} 
                                    className={`terminal-item p-3 border rounded mb-2 cursor-pointer ${
                                        selectedTerminals.includes(terminal.id) 
                                            ? 'border-primary bg-primary bg-opacity-10' 
                                            : 'border-light'
                                    }`}
                                    onClick={() => handleTerminalToggle(terminal.id)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <div className="d-flex align-items-center">
                                        <div className="form-check me-3">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                checked={selectedTerminals.includes(terminal.id)}
                                                onChange={() => handleTerminalToggle(terminal.id)}
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        </div>
                                        <div className="flex-grow-1">
                                            <div className="fw-semibold">{terminal.name}</div>
                                            <div className="row">
                                                <div className="text-muted small col-md-6">
                                                    {t('admin.selectorCommon.labelId')} {terminal.terminal_id}
                                                </div>
                                                {terminal.brand && (
                                                    <div className="text-muted small col-md-6">
                                                        {t('admin.selectorCommon.labelBrand')} {terminal.brand}
                                                    </div>
                                                )}
                                                {terminal.model && (
                                                    <div className="text-muted small col-md-6">
                                                        {t('admin.selectorCommon.labelModel')} {terminal.model}
                                                    </div>
                                                )}
                                                {terminal.manufacturer && (
                                                    <div className="text-muted small col-md-6">
                                                        {t('admin.selectorCommon.labelManufacturer')} {terminal.manufacturer}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Selected Terminals Summary */}
            {selectedTerminals.length > 0 && (
                <div className="selected-summary mt-3 p-3 bg-primary bg-opacity-10 rounded">
                    <h6 className="mb-2 fw-bold">
                        {t('admin.terminalGroupsUI.terminalSelector.selectedTerminalsTitle', { count: selectedTerminals.length })}
                    </h6>
                    <div className="selected-list">
                        {terminals
                            .filter(term => selectedTerminals.includes(term.id))
                            .map(terminal => (
                                <span key={terminal.id} className="badge bg-primary me-2 mb-1">
                                    {terminal.name} ({terminal.terminal_id})
                                </span>
                            ))
                        }
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomTerminalSelector;


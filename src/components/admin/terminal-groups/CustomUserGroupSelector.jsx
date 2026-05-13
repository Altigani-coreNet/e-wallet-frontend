import { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { getToken } from '../../../utils/api';
import { ADMIN_ENDPOINTS } from '../../../utils/constants';

const CustomUserGroupSelector = ({ 
    selectedUserGroups, 
    onUserGroupChange, 
    merchantId = null,
    className = '' 
}) => {
    const { t } = useTranslation();
    const [userGroups, setUserGroups] = useState([]);
    const [filteredUserGroups, setFilteredUserGroups] = useState([]);
    const [loading, setLoading] = useState(false);
    const [apiLoading, setApiLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const previousMerchantIdRef = useRef(undefined);

    // Load user groups on component mount and when merchant changes
    useEffect(() => {
        if (merchantId) {
            loadUserGroups();
        }
    }, [merchantId]);

    // Apply filters when search changes
    useEffect(() => {
        applyFilters();
    }, [searchTerm, userGroups]);

    // Fetch filtered user groups from API when search or merchant changes
    useEffect(() => {
        if (merchantId && searchTerm) {
            fetchFilteredUserGroups();
        } else if (merchantId) {
            loadUserGroups();
        }
    }, [searchTerm, merchantId]);

    const loadUserGroups = async () => {
        setLoading(true);
        try {
            const params = {};
            if (merchantId) params.merchant_id = merchantId;
            
            const token = getToken();
            const response = await axios.get(`${ADMIN_ENDPOINTS.USER_GROUPS}/select`, {
                params,
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            let userGroupsData = [];
            if (response.data && response.data.data) {
                userGroupsData = response.data.data;
            } else if (response.data) {
                userGroupsData = response.data;
            }
            
            setUserGroups(userGroupsData);
        } catch (error) {
            console.error('Error loading user groups:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchFilteredUserGroups = async () => {
        setApiLoading(true);
        try {
            const params = {};
            if (searchTerm) {
                params.search = searchTerm;
            }
            if (merchantId) {
                params.merchant_id = merchantId;
            }

            const token = getToken();
            const response = await axios.get(`${ADMIN_ENDPOINTS.USER_GROUPS}/select`, {
                params,
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            let userGroupsData = [];
            if (response.data && response.data.data) {
                userGroupsData = response.data.data;
            } else if (response.data) {
                userGroupsData = response.data;
            }
            
            setUserGroups(userGroupsData);
            
        } catch (error) {
            console.error('Error fetching filtered user groups:', error);
            // Fallback to local filtering if API fails
            applyFilters();
        } finally {
            setApiLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...userGroups];

        // Apply search filter
        if (searchTerm) {
            filtered = filtered.filter(userGroup => 
                userGroup.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                userGroup.text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                userGroup.group_id?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        setFilteredUserGroups(filtered);
    };

    const handleUserGroupToggle = (userGroupId) => {
        const newSelection = selectedUserGroups.includes(userGroupId)
            ? selectedUserGroups.filter(id => id !== userGroupId)
            : [...selectedUserGroups, userGroupId];
        
        onUserGroupChange(newSelection);
    };

    const handleSelectAll = () => {
        if (selectedUserGroups.length === filteredUserGroups.length) {
            onUserGroupChange([]);
        } else {
            const allFilteredUserGroupIds = filteredUserGroups.map(userGroup => userGroup.id);
            onUserGroupChange(allFilteredUserGroupIds);
        }
    };

    const selectAllAction = useMemo(
        () =>
            selectedUserGroups.length === filteredUserGroups.length && filteredUserGroups.length > 0
                ? t('admin.selectorCommon.deselectAll')
                : t('admin.selectorCommon.selectAll'),
        [selectedUserGroups.length, filteredUserGroups.length, t]
    );

    // Reset selection only when merchant actually changes (e.g. user picks another merchant).
    // Do not clear on first mount — edit forms hydrate user_group_ids from the API and this
    // effect was wiping them and blocking submit/PUT.
    useEffect(() => {
        const prev = previousMerchantIdRef.current;
        if (prev === undefined) {
            previousMerchantIdRef.current = merchantId;
            return;
        }
        if (prev !== merchantId) {
            previousMerchantIdRef.current = merchantId;
            onUserGroupChange([]);
        }
    }, [merchantId]); // eslint-disable-line react-hooks/exhaustive-deps -- only merchantId should trigger reset

    if (!merchantId) {
        return (
            <div className="alert alert-info">
                <i className="ki-duotone ki-information-5 fs-2 me-2">
                    <span className="path1"></span>
                    <span className="path2"></span>
                    <span className="path3"></span>
                </i>
                {t('admin.terminalGroupsUI.userGroupSelector.pickMerchantFirst')}
            </div>
        );
    }

    return (
        <div className={`custom-user-group-selector ${className}`}>
            {/* Custom CSS for better styling */}
            <style>{`
                .custom-user-group-selector .brand-model-badge {
                    cursor: pointer;
                    transition: all 0.2s ease;
                    margin: 0.25rem;
                }
                .custom-user-group-selector .brand-model-badge:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                .custom-user-group-selector .brand-model-badge.active {
                    background-color: #0d6efd !important;
                    border-color: #0d6efd !important;
                }
            `}</style>

            {/* User Groups Header */}
            <div className="brands-models-header mb-4 p-4 bg-white border rounded shadow-sm">
                <h5 className="mb-3 fw-bold text-primary">
                    <i className="ki-duotone ki-users fs-4 me-2">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    {t('admin.terminalGroupsUI.userGroupSelector.header')}
                </h5>
                
                <div className="mb-4">
                    <h6 className="mb-2 fw-semibold text-dark">
                        <i className="ki-duotone ki-user-tick fs-5 me-2 text-warning"></i>
                        {t('admin.terminalGroupsUI.userGroupSelector.userGroupsHeading', { count: userGroups.length })}
                    </h6>
                    <div className="d-flex flex-wrap gap-2">
                        {userGroups.length > 0 ? (
                            <span className="text-muted small">
                                {t('admin.terminalGroupsUI.userGroupSelector.hintHasGroups')}
                            </span>
                        ) : (
                            <span className="text-muted small">{t('admin.terminalGroupsUI.userGroupSelector.noGroups')}</span>
                        )}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="d-flex gap-2 mt-3">
                    <span className="text-muted small align-self-center">
                        {t('admin.terminalGroupsUI.userGroupSelector.searchHelp')}
                    </span>
                </div>
            </div>

            {/* Filter Top Bar - Shows search */}
            <div className="filter-top-bar mb-3 p-3 bg-light rounded">
                <div className="d-flex justify-content-between align-items-center">
                    <div className="input-group w-50">
                        <span className="input-group-text">
                            <i className="ki-duotone ki-magnifier fs-3">
                                <span className="path1"></span>
                                <span className="path2"></span>
                            </i>
                        </span>
                        <input
                            type="text"
                            className="form-control"
                            placeholder={t('admin.terminalGroupsUI.userGroupSelector.searchPlaceholder')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <small className="text-muted">{t('admin.selectorCommon.selectedCount', { count: selectedUserGroups.length })}</small>
                </div>
            </div>

            {/* Main Selector */}
            <div className="terminal-selector-container">
                <div className="p-3">
                    {/* Results Count */}
                    <div className="results-count mb-3 p-2 bg-light rounded">
                        <small className="text-muted">
                            {t('admin.terminalGroupsUI.userGroupSelector.showingGroups', { shown: filteredUserGroups.length, total: userGroups.length })}
                        </small>
                    </div>

                    {/* API Loading Indicator */}
                    {apiLoading && searchTerm && (
                        <div className="alert alert-info py-2 mb-3">
                            <div className="d-flex align-items-center">
                                <div className="spinner-border spinner-border-sm text-info me-2" role="status">
                                    <span className="visually-hidden">{t('admin.selectorCommon.loading')}</span>
                                </div>
                                <span className="small">{t('admin.terminalGroupsUI.userGroupSelector.fetchingGroups')}</span>
                            </div>
                        </div>
                    )}

                    {/* Active Filters Display */}
                    {searchTerm && (
                        <div className="active-filters mb-3 p-2 bg-light border rounded">
                            <small className="text-muted me-2">{t('admin.selectorCommon.activeFilters')}</small>
                            {searchTerm && (
                                <span className="badge bg-warning me-1">{t('admin.selectorCommon.searchBadge', { term: searchTerm })}</span>
                            )}
                        </div>
                    )}
                    
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <div className="d-flex align-items-center gap-3">
                            <h6 className="mb-0 fw-bold">
                                {t('admin.terminalGroupsUI.userGroupSelector.listHeading', { count: filteredUserGroups.length })}
                            </h6>
                            {filteredUserGroups.length > 0 && (
                                <div className="d-flex align-items-center gap-2">
                                    <button
                                        className={`btn btn-sm ${selectedUserGroups.length === filteredUserGroups.length && filteredUserGroups.length > 0 ? 'btn-success' : 'btn-outline-primary'}`}
                                        onClick={() => handleSelectAll()}
                                        title={selectAllAction}
                                    >
                                        <i className={`ki-duotone ${selectedUserGroups.length === filteredUserGroups.length && filteredUserGroups.length > 0 ? 'ki-check' : 'ki-plus'} fs-5 me-1`}>
                                            <span className="path1"></span>
                                            <span className="path2"></span>
                                        </i>
                                        {selectAllAction}
                                    </button>
                                    {selectedUserGroups.length > 0 && selectedUserGroups.length < filteredUserGroups.length && (
                                        <small className="text-muted">
                                            {t('admin.selectorCommon.ofTotal', { selected: selectedUserGroups.length, total: filteredUserGroups.length })}
                                        </small>
                                    )}
                                </div>
                            )}
                        </div>
                        <small className="text-muted">
                            {t('admin.selectorCommon.selectedCount', { count: selectedUserGroups.length })}
                        </small>
                    </div>

                    {loading ? (
                        <div className="text-center py-4">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">{t('admin.selectorCommon.loading')}</span>
                            </div>
                        </div>
                    ) : filteredUserGroups.length === 0 ? (
                        <div className="text-center py-4 text-muted">
                            <i className="ki-duotone ki-search fs-2x mb-2">
                                <span className="path1"></span>
                                <span className="path2"></span>
                            </i>
                            <p>{t('admin.terminalGroupsUI.userGroupSelector.noMatch')}</p>
                        </div>
                    ) : (
                        <div className="terminal-grid">
                            {/* Select All Header */}
                            <div className="select-all-header p-2 mb-2 bg-light border rounded">
                                <div className="form-check d-flex align-items-center">
                                    <input
                                        className="form-check-input me-2"
                                        type="checkbox"
                                        checked={selectedUserGroups.length === filteredUserGroups.length && filteredUserGroups.length > 0}
                                        onChange={handleSelectAll}
                                        id="select-all-user-groups"
                                    />
                                    <label className="form-check-label fw-semibold mb-0" htmlFor="select-all-user-groups">
                                        {t('admin.terminalGroupsUI.userGroupSelector.selectAllLabel', { action: selectAllAction })}
                                        {selectedUserGroups.length > 0 && (
                                            <span className="text-muted ms-2">
                                                {t('admin.selectorCommon.ofTotal', { selected: selectedUserGroups.length, total: filteredUserGroups.length })}
                                            </span>
                                        )}
                                    </label>
                                </div>
                            </div>
                            
                            {/* User Groups List */}
                            {filteredUserGroups.map(userGroup => (
                                <div 
                                    key={userGroup.id} 
                                    className={`terminal-item p-3 border rounded mb-2 cursor-pointer ${
                                        selectedUserGroups.includes(userGroup.id) 
                                            ? 'border-primary bg-primary bg-opacity-10' 
                                            : 'border-light'
                                    }`}
                                    onClick={() => handleUserGroupToggle(userGroup.id)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <div className="d-flex align-items-center">
                                        <div className="form-check me-3">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                checked={selectedUserGroups.includes(userGroup.id)}
                                                onChange={() => handleUserGroupToggle(userGroup.id)}
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        </div>
                                        <div className="flex-grow-1">
                                            <div className="fw-semibold">{userGroup.name || userGroup.text}</div>
                                            <div className="row">
                                                <div className="text-muted small col-md-6">
                                                    {t('admin.selectorCommon.labelId')} {userGroup.group_id}
                                                </div>
                                                {userGroup.merchant_name && (
                                                    <div className="text-muted small col-md-6">
                                                        {t('admin.selectorCommon.labelMerchant')} {userGroup.merchant_name}
                                                    </div>
                                                )}
                                                {userGroup.branch_name && (
                                                    <div className="text-muted small col-md-6">
                                                        {t('admin.selectorCommon.labelBranch')} {userGroup.branch_name}
                                                    </div>
                                                )}
                                                {userGroup.description && (
                                                    <div className="text-muted small col-md-6">
                                                        {t('admin.selectorCommon.labelDescription')} {userGroup.description}
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

            {/* Selected User Groups Summary */}
            {selectedUserGroups.length > 0 && (
                <div className="selected-summary mt-3 p-3 bg-primary bg-opacity-10 rounded">
                    <h6 className="mb-2 fw-bold">
                        {t('admin.terminalGroupsUI.userGroupSelector.selectedTitle', { count: selectedUserGroups.length })}
                    </h6>
                    <div className="selected-list">
                        {userGroups
                            .filter(ug => selectedUserGroups.includes(ug.id))
                            .map(userGroup => (
                                <span key={userGroup.id} className="badge bg-primary me-2 mb-1">
                                    {userGroup.name || userGroup.text} ({userGroup.group_id})
                                </span>
                            ))
                        }
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomUserGroupSelector;


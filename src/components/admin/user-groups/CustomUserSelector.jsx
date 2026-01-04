import { useEffect, useState } from 'react';
import axios from 'axios';
import { ADMIN_ENDPOINTS } from '../../../utils/constants';
import { getToken } from '../../../utils/api';

const CustomUserSelector = ({
    merchantId,
    selectedUsers,
    onUserChange,
    className = '' 
}) => {
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [apiLoading, setApiLoading] = useState(false);

    // Load users when merchant changes
    useEffect(() => {
        if (!merchantId) {
            setUsers([]);
            setFilteredUsers([]);
            return;
        }
        loadUsers(merchantId);
    }, [merchantId]);

    // Client-side filter when search changes
    useEffect(() => {
        applyFilters();
    }, [searchTerm, users]);

    // Server-side filter with debounce
    useEffect(() => {
        const debounce = setTimeout(() => {
            if (!merchantId) return;
            fetchFilteredUsers();
        }, 300);
        return () => clearTimeout(debounce);
    }, [searchTerm, merchantId]);

    const loadUsers = async (merchant) => {
        setLoading(true);
        try {
            const token = getToken();
            const response = await axios.get(ADMIN_ENDPOINTS.USER_GROUP_MERCHANT_USERS, {
                params: { merchant_id: merchant },
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });
            
            const arr = response.data?.data || response.data || [];
            const normalized = arr.map(u => ({
                id: u.id,
                name: u.name,
                email: u.email,
                merchant_name: u.merchant?.name || '',
                branch_name: u.branch?.name || ''
            }));
            setUsers(normalized);
            setFilteredUsers(normalized);
        } catch (e) {
            console.error('Error loading users:', e);
        } finally {
            setLoading(false);
        }
    };

    const fetchFilteredUsers = async () => {
        if (!merchantId) return;
        setApiLoading(true);
        try {
            const token = getToken();
            const params = {
                merchant_id: merchantId
            };
            if (searchTerm) params.search = searchTerm;
            
            const response = await axios.get(ADMIN_ENDPOINTS.USER_GROUP_MERCHANT_USERS, {
                params,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });
            
            const arr = response.data?.data || response.data || [];
            const normalized = arr.map(u => ({
                id: u.id,
                name: u.name,
                email: u.email,
                merchant_name: u.merchant?.name || '',
                branch_name: u.branch?.name || ''
            }));
            setUsers(normalized);
            setFilteredUsers(normalized);
        } catch (e) {
            console.error('Error fetching filtered users:', e);
            applyFilters();
        } finally {
            setApiLoading(false);
        }
    };

    const applyFilters = () => {
        let list = [...users];
        if (searchTerm) {
            const s = searchTerm.toLowerCase();
            list = list.filter(u =>
                (u.name || '').toLowerCase().includes(s) ||
                (u.email || '').toLowerCase().includes(s)
            );
        }
        setFilteredUsers(list);
    };

    const handleToggleUser = (userId) => {
        const next = selectedUsers.includes(userId)
            ? selectedUsers.filter(id => id !== userId)
            : [...selectedUsers, userId];
        onUserChange(next);
    };

    const handleSelectAll = () => {
        if (selectedUsers.length === filteredUsers.length) {
            onUserChange([]);
        } else {
            onUserChange(filteredUsers.map(u => u.id));
        }
    };

    return (
        <div className={`custom-user-selector ${className}`}>
            {/* Users Header */}
            <div className="brands-models-header mb-4 p-4 bg-white border rounded shadow-sm">
                <h5 className="mb-3 fw-bold text-primary">
                    <i className="ki-duotone ki-user fs-4 me-2">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    Available Users
                </h5>
                
                <div className="mb-4">
                    <h6 className="mb-2 fw-semibold text-dark">
                        <i className="ki-duotone ki-users fs-5 me-2 text-warning"></i>
                        Users ({users.length})
                    </h6>
                    <div className="d-flex flex-wrap gap-2">
                        {users.length > 0 ? (
                            <span className="text-muted small">
                                {merchantId ? 'Search and select users for this merchant' : 'Select a merchant to load users'}
                            </span>
                        ) : (
                            <span className="text-muted small">No users available</span>
                        )}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="d-flex gap-2 mt-3">
                    <span className="text-muted small align-self-center">
                        Use search to filter users by name or email
                    </span>
                </div>
            </div>

            {/* Filter Top Bar */}
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
                            placeholder="Search users by name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            disabled={!merchantId}
                        />
                    </div>
                    <small className="text-muted">{selectedUsers.length} selected</small>
                </div>
            </div>

            {/* Main Selector */}
            <div className="terminal-selector-container">
                <div className="p-3">
                    {/* Results Count */}
                    <div className="results-count mb-3 p-2 bg-light rounded">
                        <small className="text-muted">
                            Showing {filteredUsers.length} of {users.length} users
                        </small>
                    </div>

                    {/* API Loading Indicator */}
                    {apiLoading && (
                        <div className="alert alert-info py-2 mb-3">
                            <div className="d-flex align-items-center">
                                <div className="spinner-border spinner-border-sm text-info me-2" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                                <span className="small">Fetching filtered users from server...</span>
                            </div>
                        </div>
                    )}

                    {/* Active Filters Display */}
                    {searchTerm && (
                        <div className="active-filters mb-3 p-2 bg-light border rounded">
                            <small className="text-muted me-2">Active filters:</small>
                            {searchTerm && (
                                <span className="badge bg-warning me-1">Search: "{searchTerm}"</span>
                            )}
                        </div>
                    )}
                    
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <div className="d-flex align-items-center gap-3">
                            <h6 className="mb-0 fw-bold">
                                Users ({filteredUsers.length})
                            </h6>
                            {filteredUsers.length > 0 && (
                                <div className="d-flex align-items-center gap-2">
                                    <button
                                        type="button"
                                        className={`btn btn-sm ${selectedUsers.length === filteredUsers.length ? 'btn-success' : 'btn-outline-primary'}`}
                                        onClick={() => handleSelectAll()}
                                        title={selectedUsers.length === filteredUsers.length ? 'Deselect All' : 'Select All'}
                                    >
                                        <i className={`ki-duotone ${selectedUsers.length === filteredUsers.length ? 'ki-check' : 'ki-plus'} fs-5 me-1`}>
                                            <span className="path1"></span>
                                            <span className="path2"></span>
                                        </i>
                                        {selectedUsers.length === filteredUsers.length ? 'Deselect All' : 'Select All'}
                                    </button>
                                    {selectedUsers.length > 0 && selectedUsers.length < filteredUsers.length && (
                                        <small className="text-muted">
                                            ({selectedUsers.length} of {filteredUsers.length})
                                        </small>
                                    )}
                                </div>
                            )}
                        </div>
                        <small className="text-muted">
                            {selectedUsers.length} selected
                        </small>
                    </div>

                    {loading ? (
                        <div className="text-center py-4">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="text-center py-4 text-muted">
                            <i className="ki-duotone ki-search fs-2x mb-2"></i>
                            <p>No users found matching your criteria</p>
                        </div>
                    ) : (
                        <div className="terminal-grid">
                            {/* Select All Header */}
                            <div className="select-all-header p-2 mb-2 bg-light border rounded">
                                <div className="form-check d-flex align-items-center">
                                    <input
                                        className="form-check-input me-2"
                                        type="checkbox"
                                        checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                                        onChange={handleSelectAll}
                                        id="select-all-users"
                                        disabled={!merchantId}
                                    />
                                    <label className="form-check-label fw-semibold mb-0" htmlFor="select-all-users">
                                        {selectedUsers.length === filteredUsers.length && filteredUsers.length > 0 
                                            ? 'Deselect All' 
                                            : 'Select All'
                                        } Users
                                        {selectedUsers.length > 0 && (
                                            <span className="text-muted ms-2">
                                                ({selectedUsers.length} of {filteredUsers.length})
                                            </span>
                                        )}
                                    </label>
                                </div>
                            </div>

                            {/* Users List */}
                            {filteredUsers.map(u => (
                                <div
                                    key={u.id}
                                    className={`terminal-item p-3 border rounded mb-2 cursor-pointer ${selectedUsers.includes(u.id) ? 'border-primary bg-primary bg-opacity-10' : 'border-light'}`}
                                    onClick={() => handleToggleUser(u.id)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <div className="d-flex align-items-center">
                                        <div className="form-check me-3">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                checked={selectedUsers.includes(u.id)}
                                                onChange={() => handleToggleUser(u.id)}
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        </div>
                                        <div className="flex-grow-1">
                                            <div className="fw-semibold">{u.name}</div>
                                            <div className="row small text-muted">
                                                <div className="col-md-4">Email: {u.email || '-'}</div>
                                                <div className="col-md-4">Company: {u.merchant_name || '-'}</div>
                                                <div className="col-md-4">Branch: {u.branch_name || '-'}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Selected Users Summary */}
            {selectedUsers.length > 0 && (
                <div className="selected-summary mt-3 p-3 bg-primary bg-opacity-10 rounded">
                    <h6 className="mb-2 fw-bold">
                        Selected Users ({selectedUsers.length})
                    </h6>
                    <div className="selected-list">
                        {users
                            .filter(u => selectedUsers.includes(u.id))
                            .map(user => (
                                <span key={user.id} className="badge bg-primary me-2 mb-1">
                                    {user.name}
                                </span>
                            ))
                        }
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomUserSelector;


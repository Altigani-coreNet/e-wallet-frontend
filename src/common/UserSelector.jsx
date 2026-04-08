import React, { useState, useEffect } from 'react';
import { getUsersForSelect } from '../../services/userGroupsService';
import LoadingSpinner from './LoadingSpinner';

const UserSelector = ({ selectedUsers = [], onUserChange, merchantId, className = '' }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true);
            try {
                const response = await getUsersForSelect();
                if (response.success) {
                    const usersData = response.data?.data || response.data || [];
                    setUsers(Array.isArray(usersData) ? usersData : []);
                }
            } catch (err) {
                console.error('Error fetching users:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, [merchantId]);

    const filteredUsers = users.filter(user => {
        if (!searchTerm) return true;
        const search = searchTerm.toLowerCase();
        return (
            user.name?.toLowerCase().includes(search) ||
            user.email?.toLowerCase().includes(search)
        );
    });

    const handleToggleUser = (userId) => {
        const isSelected = selectedUsers.includes(userId);
        let newSelection;
        
        if (isSelected) {
            newSelection = selectedUsers.filter(id => id !== userId);
        } else {
            newSelection = [...selectedUsers, userId];
        }
        
        onUserChange(newSelection);
    };

    const handleRemoveUser = (userId, e) => {
        e.stopPropagation();
        const newSelection = selectedUsers.filter(id => id !== userId);
        onUserChange(newSelection);
    };

    const getSelectedUsersData = () => {
        return users.filter(user => selectedUsers.includes(user.id));
    };

    return (
        <div className={className}>
            {/* Selected Users Display */}
            {selectedUsers.length > 0 && (
                <div className="mb-4">
                    <label className="form-label">Selected Users ({selectedUsers.length})</label>
                    <div className="d-flex flex-wrap gap-2">
                        {getSelectedUsersData().map(user => (
                            <span
                                key={user.id}
                                className="badge badge-light-primary d-flex align-items-center gap-2"
                            >
                                {user.name || user.email}
                                <button
                                    type="button"
                                    className="btn btn-sm btn-icon btn-active-color-primary"
                                    onClick={(e) => handleRemoveUser(user.id, e)}
                                >
                                    <i className="ki-duotone ki-cross fs-6">
                                        <span className="path1"></span>
                                        <span className="path2"></span>
                                    </i>
                                </button>
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Search Input */}
            <div className="mb-3">
                <input
                    type="text"
                    className="form-control"
                    placeholder="Search users by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Users List */}
            <div
                className="border rounded p-3"
                style={{ maxHeight: '300px', overflowY: 'auto' }}
            >
                {loading ? (
                    <LoadingSpinner />
                ) : filteredUsers.length === 0 ? (
                    <div className="text-muted text-center py-4">No users found</div>
                ) : (
                    <div className="d-flex flex-column gap-2">
                        {filteredUsers.map(user => {
                            const isSelected = selectedUsers.includes(user.id);
                            return (
                                <div
                                    key={user.id}
                                    className={`form-check form-check-custom form-check-solid p-3 rounded ${
                                        isSelected ? 'bg-light-primary' : 'bg-light'
                                    }`}
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => handleToggleUser(user.id)}
                                >
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => handleToggleUser(user.id)}
                                        readOnly
                                    />
                                    <label className="form-check-label w-100">
                                        <div className="fw-bold">{user.name || 'N/A'}</div>
                                        <div className="text-muted fs-7">{user.email || ''}</div>
                                    </label>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserSelector;


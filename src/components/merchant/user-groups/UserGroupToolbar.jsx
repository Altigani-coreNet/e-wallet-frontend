import React from 'react';
import { Link } from 'react-router-dom';
import { useCan } from '../../../utils/permissions';

const UserGroupToolbar = ({ onRefresh, loading, statusFilter, onStatusFilter, onToggleFilters, basePath }) => {
    const canCreate = useCan('userGroups.create');
    return (
        <div className="d-flex align-items-center gap-2 gap-lg-3">
            {/* Filter Button */}
            <button
                type="button"
                className="btn btn-sm btn-flex btn-secondary fw-bold"
                onClick={onToggleFilters}
            >
                <i className="ki-duotone ki-filter fs-3">
                    <span className="path1"></span>
                    <span className="path2"></span>
                </i>
                <span className="d-none d-md-inline ms-1">Filter</span>
            </button>

            {/* Status Filter */}
            <select
                className="form-select form-select-sm w-150px"
                value={statusFilter || ''}
                onChange={(e) => onStatusFilter(e.target.value)}
            >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
            </select>

            {/* Refresh Button - Icon only */}
            <button
                type="button"
                className="btn btn-sm btn-icon btn-light"
                onClick={onRefresh}
                disabled={loading}
                title="Refresh"
            >
                <i className="ki-duotone ki-arrows-circle fs-3">
                    <span className="path1"></span>
                    <span className="path2"></span>
                </i>
            </button>

            {/* Create Button */}
            {canCreate && (
                <Link
                    to={`${basePath}/user-groups/create`}
                    className="btn btn-sm fw-bold btn-primary"
                >
                    <i className="ki-duotone ki-plus fs-3">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    <span className="d-none d-md-inline ms-1">Add User Group</span>
                </Link>
            )}
        </div>
    );
};

export default UserGroupToolbar;


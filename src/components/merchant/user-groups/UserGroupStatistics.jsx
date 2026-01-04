import React from 'react';

const UserGroupStatistics = ({ statistics = {} }) => {
    const stats = {
        total: statistics.total || 0,
        active: statistics.active || 0,
        inactive: statistics.inactive || 0,
        total_users: statistics.total_users || 0
    };

    return (
        <div className="row g-5 g-xl-8 mb-5">
            {/* Total User Groups */}
            <div className="col-xl-3">
                <div className="card card-xl-stretch mb-xl-8">
                    <div className="card-body">
                        <div className="d-flex align-items-center mb-2">
                            <div className="symbol symbol-50px me-3">
                                <div className="symbol-label bg-light-primary">
                                    <i className="ki-duotone ki-people fs-2x text-primary">
                                        <span className="path1"></span>
                                        <span className="path2"></span>
                                    </i>
                                </div>
                            </div>
                            <div className="flex-grow-1">
                                <div className="fs-4 text-gray-600 fw-bold">{stats.total}</div>
                                <div className="fs-7 text-gray-500">Total Groups</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Active User Groups */}
            <div className="col-xl-3">
                <div className="card card-xl-stretch mb-xl-8">
                    <div className="card-body">
                        <div className="d-flex align-items-center mb-2">
                            <div className="symbol symbol-50px me-3">
                                <div className="symbol-label bg-light-success">
                                    <i className="ki-duotone ki-check-circle fs-2x text-success">
                                        <span className="path1"></span>
                                        <span className="path2"></span>
                                    </i>
                                </div>
                            </div>
                            <div className="flex-grow-1">
                                <div className="fs-4 text-gray-600 fw-bold">{stats.active}</div>
                                <div className="fs-7 text-gray-500">Active Groups</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Inactive User Groups */}
            <div className="col-xl-3">
                <div className="card card-xl-stretch mb-xl-8">
                    <div className="card-body">
                        <div className="d-flex align-items-center mb-2">
                            <div className="symbol symbol-50px me-3">
                                <div className="symbol-label bg-light-warning">
                                    <i className="ki-duotone ki-information fs-2x text-warning">
                                        <span className="path1"></span>
                                        <span className="path2"></span>
                                        <span className="path3"></span>
                                    </i>
                                </div>
                            </div>
                            <div className="flex-grow-1">
                                <div className="fs-4 text-gray-600 fw-bold">{stats.inactive}</div>
                                <div className="fs-7 text-gray-500">Inactive Groups</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Total Users Assigned */}
            <div className="col-xl-3">
                <div className="card card-xl-stretch mb-xl-8">
                    <div className="card-body">
                        <div className="d-flex align-items-center mb-2">
                            <div className="symbol symbol-50px me-3">
                                <div className="symbol-label bg-light-info">
                                    <i className="ki-duotone ki-profile-user fs-2x text-info">
                                        <span className="path1"></span>
                                        <span className="path2"></span>
                                    </i>
                                </div>
                            </div>
                            <div className="flex-grow-1">
                                <div className="fs-4 text-gray-600 fw-bold">{stats.total_users}</div>
                                <div className="fs-7 text-gray-500">Total Users Assigned</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserGroupStatistics;


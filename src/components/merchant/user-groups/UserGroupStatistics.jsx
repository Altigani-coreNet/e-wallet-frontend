import React from 'react';
import { useTranslation } from 'react-i18next';

const UserGroupStatistics = ({ statistics = {} }) => {
    const { t } = useTranslation();
    const stats = {
        total: statistics.total || 0,
        active: statistics.active || 0,
        inactive: statistics.inactive || 0,
        total_users: statistics.total_users || 0
    };

    return (
        <div className="row g-5 g-xl-8 mb-5">
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
                                <div className="fs-7 text-gray-500">{t('merchant.userGroupsUI.statistics.totalGroups')}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

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
                                <div className="fs-7 text-gray-500">{t('merchant.userGroupsUI.statistics.activeGroups')}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

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
                                <div className="fs-7 text-gray-500">{t('merchant.userGroupsUI.statistics.inactiveGroups')}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

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
                                <div className="fs-7 text-gray-500">{t('merchant.userGroupsUI.statistics.totalUsersAssigned')}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserGroupStatistics;

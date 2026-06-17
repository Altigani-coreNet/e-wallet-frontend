import React from 'react';
import { useTranslation } from 'react-i18next';
import UserTableRow from './UserTableRow';
import Pagination from '../common/Pagination';

const UsersTable = ({ users = [], sortConfig, onSort, onDelete, onStatusChange, pagination, onPageChange, basePath = '/merchant' }) => {
    const { t } = useTranslation();
    const usersArray = Array.isArray(users) ? users : [];

    const renderSortIcon = (column) => {
        if (sortConfig.column !== column) {
            return <i className="ki-duotone ki-up-down fs-5 ms-1 text-muted"></i>;
        }

        return sortConfig.direction === 'asc' ? (
            <i className="ki-duotone ki-arrow-up fs-5 ms-1"></i>
        ) : (
            <i className="ki-duotone ki-arrow-down fs-5 ms-1"></i>
        );
    };

    return (
        <>
            <div className="table-responsive">
                <table className="table align-middle table-row-dashed fs-6 gy-5" id="users_table">
                    <thead>
                        <tr className="text-start text-gray-400 fw-bolder fs-7 text-uppercase gs-0">
                            <th className="text-dark">{t('merchant.users.table.hash')}</th>
                            <th className="min-w-200px text-dark cursor-pointer" onClick={() => onSort('name')}>
                                {t('merchant.users.table.userInfo')}
                                {renderSortIcon('name')}
                            </th>
                            <th className="text-dark">{t('merchant.users.table.phone')}</th>
                            <th className="text-dark">{t('merchant.users.table.userType')}</th>
                            <th className="text-dark">{t('merchant.users.table.branch')}</th>
                            <th className="text-dark">{t('merchant.users.table.roles')}</th>
                            <th className="text-dark cursor-pointer" onClick={() => onSort('status')}>
                                {t('merchant.users.table.status')}
                                {renderSortIcon('status')}
                            </th>
                            <th className="text-end text-dark">{t('merchant.users.table.actions')}</th>
                        </tr>
                    </thead>
                    <tbody className="fw-bold text-gray-600">
                        {usersArray && usersArray.length > 0 ? (
                            usersArray.map((user, index) => (
                                <UserTableRow
                                    key={user.id}
                                    user={user}
                                    index={index + 1 + (pagination.currentPage - 1) * pagination.perPage}
                                    onDelete={onDelete}
                                    onStatusChange={onStatusChange}
                                    basePath={basePath}
                                />
                            ))
                        ) : (
                            <tr>
                                <td colSpan="8" className="text-center py-10">
                                    <div className="text-gray-500 fs-4">{t('merchant.users.table.noUsers')}</div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {usersArray && usersArray.length > 0 && (
                <Pagination
                    currentPage={pagination.currentPage}
                    lastPage={pagination.lastPage}
                    total={pagination.total}
                    perPage={pagination.perPage}
                    onPageChange={onPageChange}
                />
            )}
        </>
    );
};

export default UsersTable;

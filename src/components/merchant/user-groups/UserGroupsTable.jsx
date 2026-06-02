import React from 'react';
import { useTranslation } from 'react-i18next';
import UserGroupTableRow from './UserGroupTableRow';
import Pagination from '../../common/Pagination';

const UserGroupsTable = ({ 
    userGroups = [], 
    selectedIds = [], 
    onSelectChange, 
    onDelete,
    onToggleStatus,
    pagination = {},
    onPageChange,
    basePath
}) => {
    const { t } = useTranslation();
    const safeUserGroups = Array.isArray(userGroups) ? userGroups : [];
    const safeSelectedIds = Array.isArray(selectedIds) ? selectedIds : [];

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            const allIds = safeUserGroups.map(userGroup => userGroup.id);
            onSelectChange(allIds);
        } else {
            onSelectChange([]);
        }
    };

    const handleSelectOne = (id, isSelected) => {
        if (isSelected) {
            onSelectChange([...safeSelectedIds, id]);
        } else {
            onSelectChange(safeSelectedIds.filter(selectedId => selectedId !== id));
        }
    };

    const allSelected = safeUserGroups.length > 0 && safeSelectedIds.length === safeUserGroups.length;

    React.useEffect(() => {
        if (typeof window.KTMenu !== 'undefined' && typeof window.KTMenu.createInstances === 'function') {
            setTimeout(() => {
                window.KTMenu.createInstances();
            }, 100);
        }
    }, [safeUserGroups]);

    return (
        <>
            <div className="table-responsive">
                <table className="table align-middle table-row-dashed fs-6 gy-5" id="user-groups_table">
                    <thead>
                        <tr className="text-start text-gray-400 fw-bolder fs-7 text-uppercase gs-0">
                            <th className="w-10px pe-2">
                                <div className="form-check form-check-sm form-check-custom form-check-solid me-3">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        checked={allSelected}
                                        onChange={handleSelectAll}
                                    />
                                </div>
                            </th>
                            <th className="text-dark">{t('merchant.userGroupsIndex.colId')}</th>
                            <th className="min-w-125px text-dark">{t('merchant.userGroupsIndex.colNameGroupId')}</th>
                            <th className="text-dark">{t('merchant.userGroupsIndex.colBranch')}</th>
                            <th className="text-dark">{t('merchant.userGroupsIndex.colUsers')}</th>
                            <th className="text-dark">{t('merchant.userGroupsIndex.colStatus')}</th>
                            <th className="text-end text-dark">{t('merchant.userGroupsIndex.colActions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {safeUserGroups.length === 0 ? (
                            <tr>
                                <td colSpan="7" className="text-center py-10">
                                    <div className="d-flex flex-column align-items-center">
                                        <i className="ki-duotone ki-file-deleted fs-3x text-gray-400 mb-3">
                                            <span className="path1"></span>
                                            <span className="path2"></span>
                                        </i>
                                        <span className="text-gray-600 fs-5">{t('merchant.userGroupsIndex.noUserGroupsFound')}</span>
                                        <span className="text-gray-400 fs-7 mt-2">{t('merchant.userGroupsIndex.emptyHint')}</span>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            safeUserGroups.map((userGroup) => (
                                <UserGroupTableRow
                                    key={userGroup.id}
                                    userGroup={userGroup}
                                    isSelected={safeSelectedIds.includes(userGroup.id)}
                                    onSelect={handleSelectOne}
                                    onDelete={onDelete}
                                    onToggleStatus={onToggleStatus}
                                    basePath={basePath}
                                />
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {safeUserGroups.length > 0 && (
                <Pagination
                    currentPage={pagination.current_page || pagination.currentPage || 1}
                    lastPage={pagination.last_page || pagination.lastPage || 1}
                    perPage={pagination.per_page || pagination.perPage || 15}
                    total={pagination.total || 0}
                    onPageChange={onPageChange}
                />
            )}
        </>
    );
};

export default UserGroupsTable;

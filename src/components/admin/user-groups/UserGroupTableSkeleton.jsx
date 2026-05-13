import React from 'react';
import { useTranslation } from 'react-i18next';

const UserGroupTableSkeleton = ({ rows = 10 }) => {
    const { t } = useTranslation();
    return (
        <>
            <style>{`
                .skeleton {
                    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                    background-size: 200% 100%;
                    animation: skeleton-loading 1.5s ease-in-out infinite;
                    border-radius: 4px;
                }
                
                @keyframes skeleton-loading {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }
            `}</style>

            <div className="table-responsive">
                <table className="table align-middle table-row-dashed fs-6 gy-5">
                    <thead>
                        <tr className="text-start text-gray-400 fw-bold fs-7 text-uppercase gs-0">
                            <th className="w-10px pe-2">
                                <div className="form-check form-check-sm form-check-custom form-check-solid me-3">
                                    <div className="skeleton" style={{ width: '18px', height: '18px' }}></div>
                                </div>
                            </th>
                            <th className="text-dark">{t('admin.usersIndex.colId')}</th>
                            <th className="min-w-200px text-dark">{t('admin.userGroupsIndex.colGroupInfo')}</th>
                            <th className="min-w-150px text-dark">{t('admin.userGroupsIndex.colMerchant')}</th>
                            <th className="text-dark">{t('admin.userGroupsIndex.colBranch')}</th>
                            <th className="text-dark">{t('admin.userGroupsIndex.colCountry')}</th>
                            <th className="text-dark">{t('admin.userGroupsIndex.colUsers')}</th>
                            <th className="text-dark">{t('admin.usersIndex.colStatus')}</th>
                            <th className="text-dark">{t('admin.usersIndex.colCreatedAt')}</th>
                            <th className="text-end text-dark">{t('admin.usersIndex.colActions')}</th>
                        </tr>
                    </thead>
                    <tbody className="text-gray-600 fw-semibold">
                        {[...Array(rows)].map((_, index) => (
                            <tr key={index}>
                                <td>
                                    <div className="skeleton" style={{ width: '18px', height: '18px' }}></div>
                                </td>
                                <td>
                                    <div className="skeleton" style={{ width: '40px', height: '18px' }}></div>
                                </td>
                                <td>
                                    <div className="d-flex flex-column gap-2">
                                        <div className="skeleton" style={{ width: '150px', height: '18px' }}></div>
                                        <div className="skeleton" style={{ width: '100px', height: '14px' }}></div>
                                    </div>
                                </td>
                                <td>
                                    <div className="d-flex flex-column gap-2">
                                        <div className="skeleton" style={{ width: '140px', height: '18px' }}></div>
                                        <div className="skeleton" style={{ width: '160px', height: '14px' }}></div>
                                    </div>
                                </td>
                                <td>
                                    <div className="skeleton" style={{ width: '100px', height: '18px' }}></div>
                                </td>
                                <td>
                                    <div className="d-flex align-items-center gap-2">
                                        <div className="skeleton" style={{ width: '20px', height: '15px' }}></div>
                                        <div className="skeleton" style={{ width: '100px', height: '18px' }}></div>
                                    </div>
                                </td>
                                <td>
                                    <div className="skeleton" style={{ width: '80px', height: '24px', borderRadius: '12px' }}></div>
                                </td>
                                <td>
                                    <div className="skeleton" style={{ width: '70px', height: '24px', borderRadius: '12px' }}></div>
                                </td>
                                <td>
                                    <div className="skeleton" style={{ width: '100px', height: '18px' }}></div>
                                </td>
                                <td className="text-end">
                                    <div className="skeleton" style={{ width: '40px', height: '32px', marginLeft: 'auto' }}></div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
};

export default UserGroupTableSkeleton;


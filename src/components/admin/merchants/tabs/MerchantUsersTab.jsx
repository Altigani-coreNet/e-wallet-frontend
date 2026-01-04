import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ADMIN_ENDPOINTS } from '../../../../utils/constants';
import { getToken } from '../../../../utils/api';
import PaginationControls from '../../../common/PaginationControls';

const MerchantUsersTab = ({ merchantId }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({
        current_page: 1,
        per_page: 10,
        last_page: 1,
        total: 0
    });

    const fetchUsers = async (page = 1) => {
        if (!merchantId) return;

        try {
            setLoading(true);
            const token = getToken();
            const response = await axios.get(ADMIN_ENDPOINTS.USERS, {
                params: {
                    page,
                    per_page: pagination.per_page,
                    merchant_id: merchantId
                },
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const isSuccess = response.data.success || response.data.status;
            if (isSuccess) {
                const data = response.data.data;
                setUsers(data.data || []);
                setPagination({
                    current_page: data.current_page,
                    per_page: data.per_page,
                    last_page: data.last_page,
                    total: data.total
                });
            }
        } catch (error) {
            toast.error('Failed to load users');
            // eslint-disable-next-line no-console
            console.error('Failed to load users', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [merchantId]);

    return (
        <div className="card">
            <div className="card-header border-0">
                <div className="card-title">
                    <h3 className="fw-bold mb-0">Users</h3>
                </div>
            </div>
            <div className="card-body border-top py-5">
                {/* TODO: Add user filters (search, status) when those options are needed in the UI. */}

                <div className="table-responsive">
                    <table className="table align-middle table-row-dashed fs-6 gy-5">
                        <thead>
                            <tr className="text-start text-gray-400 fw-bold fs-7 text-uppercase gs-0">
                                <th className="min-w-150px">Name</th>
                                <th className="min-w-180px">Email</th>
                                <th className="min-w-120px">Phone</th>
                                <th className="min-w-120px">Role</th>
                                <th className="min-w-120px">Status</th>
                                <th className="text-end min-w-120px">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="fw-semibold text-gray-600">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-10">
                                        <span className="spinner-border spinner-border-sm text-primary"></span>
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-10 text-gray-600">
                                        No users found
                                    </td>
                                </tr>
                            ) : (
                                users.map((user) => (
                                    <tr key={user.id}>
                                        <td className="text-gray-800 fw-semibold">{user.name}</td>
                                        <td className="text-gray-700">{user.email}</td>
                                        <td className="text-gray-700">{user.phone || '—'}</td>
                                        <td className="text-gray-700">{user.roles?.[0]?.name || '—'}</td>
                                        <td>
                                            {(() => {
                                                const rawStatus = user?.status;
                                                const normalizedStatus = typeof rawStatus === 'string' && rawStatus.length > 0
                                                    ? rawStatus.toLowerCase()
                                                    : (user?.is_active ? 'active' : 'inactive');
                                                const badgeClass = normalizedStatus === 'active' ? 'success' : 'secondary';
                                                const label = normalizedStatus.charAt(0).toUpperCase() + normalizedStatus.slice(1);
                                                return (
                                                    <span className={`badge badge-light-${badgeClass}`}>
                                                        {label}
                                                    </span>
                                                );
                                            })()}
                                        </td>
                                        <td className="text-end">
                                            <Link to={`/admin/users/${user.id}`} className="btn btn-sm btn-light-primary">
                                                View
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            <div className="card-footer">
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-center">
                    <div className="text-gray-600 small mb-3 mb-md-0">
                        Showing {(pagination.current_page - 1) * pagination.per_page + (users.length ? 1 : 0)} to {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of {pagination.total} users
                    </div>
                    <PaginationControls
                        pagination={pagination}
                        onPageChange={(page) => fetchUsers(page)}
                        disabled={loading}
                    />
                </div>
            </div>
        </div>
    );
};

export default MerchantUsersTab;

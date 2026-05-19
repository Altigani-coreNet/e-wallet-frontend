import React from 'react';
import useAuthStore from '../../../stores/authStore';

const CustomerStatistics = ({ statistics }) => {
    const { formatCurrency } = useAuthStore();
    const {
        total = 0,
        active = 0,
        total_deposit = 0,
        total_expense = 0,
        by_group = []
    } = statistics || {};

    return (
        <div className="row g-5 g-xl-8 mb-5">
            {/* Total Customers */}
            <div className="col-xl-3">
                <div className="card card-xl-stretch mb-xl-8">
                    <div className="card-body">
                        <div className="d-flex align-items-center">
                            <div className="symbol symbol-50px me-3">
                                <div className="symbol-label bg-light-primary">
                                    <i className="ki-duotone ki-profile-user fs-2x text-primary">
                                        <span className="path1"></span>
                                        <span className="path2"></span>
                                        <span className="path3"></span>
                                        <span className="path4"></span>
                                    </i>
                                </div>
                            </div>
                            <div className="flex-grow-1">
                                <span className="text-gray-400 fw-semibold d-block fs-7">Total Customers</span>
                                <span className="text-gray-800 fw-bold fs-2">{total.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Active Customers */}
            <div className="col-xl-3">
                <div className="card card-xl-stretch mb-xl-8">
                    <div className="card-body">
                        <div className="d-flex align-items-center">
                            <div className="symbol symbol-50px me-3">
                                <div className="symbol-label bg-light-success">
                                    <i className="ki-duotone ki-check-circle fs-2x text-success">
                                        <span className="path1"></span>
                                        <span className="path2"></span>
                                    </i>
                                </div>
                            </div>
                            <div className="flex-grow-1">
                                <span className="text-gray-400 fw-semibold d-block fs-7">Active Customers</span>
                                <span className="text-gray-800 fw-bold fs-2">{active.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Total Deposit */}
            <div className="col-xl-3">
                <div className="card card-xl-stretch mb-xl-8">
                    <div className="card-body">
                        <div className="d-flex align-items-center">
                            <div className="symbol symbol-50px me-3">
                                <div className="symbol-label bg-light-info">
                                    <i className="ki-duotone ki-arrow-down fs-2x text-info">
                                        <span className="path1"></span>
                                        <span className="path2"></span>
                                    </i>
                                </div>
                            </div>
                            <div className="flex-grow-1">
                                <span className="text-gray-400 fw-semibold d-block fs-7">Total Deposit</span>
                                <span className="text-gray-800 fw-bold fs-2">
                                    {formatCurrency(typeof total_deposit === 'number' ? total_deposit : parseFloat(total_deposit || 0))}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Total Expense */}
            <div className="col-xl-3">
                <div className="card card-xl-stretch mb-xl-8">
                    <div className="card-body">
                        <div className="d-flex align-items-center">
                            <div className="symbol symbol-50px me-3">
                                <div className="symbol-label bg-light-warning">
                                    <i className="ki-duotone ki-arrow-up fs-2x text-warning">
                                        <span className="path1"></span>
                                        <span className="path2"></span>
                                    </i>
                                </div>
                            </div>
                            <div className="flex-grow-1">
                                <span className="text-gray-400 fw-semibold d-block fs-7">Total Expense</span>
                                <span className="text-gray-800 fw-bold fs-2">
                                    {formatCurrency(typeof total_expense === 'number' ? total_expense : parseFloat(total_expense || 0))}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomerStatistics;


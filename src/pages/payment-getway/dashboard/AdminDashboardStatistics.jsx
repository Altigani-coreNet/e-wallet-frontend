import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const AdminDashboardStatistics = ({ data, subscriptionData, loading, subscriptionLoading }) => {
    const { t } = useTranslation();
    const stats = data?.statistics || {};
    const subscriptionPayload = subscriptionData?.subscriptionData || subscriptionData || {};
    const subStats = subscriptionPayload?.statistics || subscriptionPayload?.stats || {};

    const getNumber = (sources, keys) => {
        for (const source of sources) {
            if (!source) continue;
            for (const key of keys) {
                const value = source[key];
                if (value !== undefined && value !== null) {
                    const num = Number(value);
                    if (Number.isFinite(num)) return num;
                }
            }
        }
        return 0;
    };

    const partnerCount = getNumber([subStats, subscriptionPayload, stats, data], ['partnerCount', 'partnersCount', 'totalPartners', 'partner_count']);
    const activePartners = getNumber([subStats, subscriptionPayload], ['activePartners', 'active_partners']);
    const totalProducts = getNumber([stats, data, subStats, subscriptionPayload], ['totalProducts', 'productsCount', 'productCount', 'total_products']);
    const activeTransactions = getNumber([subStats, subscriptionPayload, stats], ['activeTransactions', 'totalTransactions', 'transactionsCount', 'total_transactions']);
    const newTransactionsThisMonth = getNumber([subStats, subscriptionPayload], ['newTransactionsThisMonth', 'monthlyTransactions', 'new_transactions_this_month']);
    const totalRevenue = getNumber(
        [subStats, subscriptionPayload, stats, data],
        [
            'totalApprovedAmount',
            'approvedTransactionsAmount',
            'approved_transactions_amount',
            'totalApprovedTransactionsAmount',
            'totalRevenue',
            'revenue',
            'total_revenue',
        ]
    );
    const monthlyRevenue = getNumber([subStats, subscriptionPayload], ['monthlyRevenue', 'revenueThisMonth', 'monthly_revenue']);

    useEffect(() => {
        console.log('AdminDashboardStatistics - Data:', { data, stats, subscriptionData, subStats, loading, subscriptionLoading });
    }, [data, stats, subscriptionData, subStats, loading, subscriptionLoading]);

    return (
        <>
            <style>{`
                .hover-elevate-up {
                    transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
                }
                .hover-elevate-up:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 4px 15px rgba(0,0,0,0.1) !important;
                }
                .skeleton {
                    position: relative;
                    overflow: hidden;
                    background: #f3f4f6;
                    border-radius: 8px;
                }
                .skeleton::after {
                    content: '';
                    position: absolute;
                    inset: 0;
                    transform: translateX(-100%);
                    background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.6) 50%, rgba(255,255,255,0) 100%);
                    animation: skeleton-loading 1.4s infinite;
                }
                @keyframes skeleton-loading {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
            `}</style>
            
            <div className="row gy-5 g-xl-10 mb-5">
                {/* Content Providers */}
                <div className="col-xl-3 mb-xl-10">
                    <Link to="/admin/partners" className="card card-flush h-xl-100 cursor-pointer hover-elevate-up" style={{ textDecoration: 'none' }}>
                    <div className="card-header pt-5">
                        <h3 className="card-title align-items-start flex-column">
                            <span className="card-label fw-bold text-gray-800">{t('admin.dashboard.partners')}</span>
                            <span className="text-gray-500 mt-1 fw-semibold fs-6">{t('admin.dashboard.totalPartners')}</span>
                        </h3>
                    </div>
                    <div className="card-body pt-2">
                        <div className="mb-2">
                            {subscriptionLoading
                                ? <div className="skeleton" style={{ width: '70%', height: '34px' }}></div>
                                : (
                                    <span className="fs-2hx fw-bold d-block text-gray-800 me-2 mb-2 lh-1 ls-n2">
                                        {partnerCount.toLocaleString()}
                                    </span>
                                )}
                        </div>
                        <div className="fw-semibold text-gray-600 fs-6">
                            {subscriptionLoading
                                ? <div className="skeleton mt-2" style={{ width: '50%', height: '16px' }}></div>
                                : <span className="badge badge-light-success">{t('admin.dashboard.activeCount', { count: activePartners.toLocaleString() })}</span>}
                        </div>
                    </div>
                </Link>
            </div>

            {/* Products */}
            <div className="col-xl-3 mb-xl-10">
                <Link to="/admin/services" className="card card-flush h-xl-100 bg-light-info cursor-pointer hover-elevate-up">
                    <div className="card-header pt-5">
                        <h3 className="card-title align-items-start flex-column">
                            <span className="card-label fw-bold text-gray-800">{t('admin.dashboard.products')}</span>
                            <span className="text-gray-500 mt-1 fw-semibold fs-6">{t('admin.dashboard.totalProducts')}</span>
                        </h3>
                    </div>
                    <div className="card-body pt-2">
                        <div className="mb-2">
                            {loading
                                ? <div className="skeleton" style={{ width: '70%', height: '34px' }}></div>
                                : (
                                    <span className="fs-2hx fw-bold d-block text-gray-800 me-2 mb-2 lh-1 ls-n2">
                                        {totalProducts.toLocaleString()}
                                    </span>
                                )}
                        </div>
                    </div>
                </Link>
            </div>

            {/* Total Subscriptions */}
            <div className="col-xl-3 mb-xl-10">
                <div className="card card-flush h-xl-100 bg-light-success cursor-pointer hover-elevate-up">
                    <div className="card-header pt-5">
                        <h3 className="card-title align-items-start flex-column">
                            <span className="card-label fw-bold text-gray-800">{t('admin.dashboard.transactions')}</span>
                            <span className="text-gray-500 mt-1 fw-semibold fs-6">{t('admin.dashboard.activeTransactions')}</span>
                        </h3>
                    </div>
                    <div className="card-body pt-2">
                        <div className="mb-2">
                            {subscriptionLoading
                                ? <div className="skeleton" style={{ width: '70%', height: '34px' }}></div>
                                : (
                                    <span className="fs-2hx fw-bold d-block text-gray-800 me-2 mb-2 lh-1 ls-n2">
                                        {activeTransactions.toLocaleString()}
                                    </span>
                                )}
                        </div>
                        <div className="fw-semibold text-gray-600 fs-6">
                            {subscriptionLoading
                                ? <div className="skeleton mt-2" style={{ width: '50%', height: '16px' }}></div>
                                : (
                                    <span className="badge badge-light-success">
                                        {t('admin.dashboard.thisMonthCount', { count: newTransactionsThisMonth.toLocaleString() })}
                                    </span>
                                )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Total Revenue */}
            <div className="col-xl-3 mb-xl-10">
                <div className="card card-flush h-xl-100 bg-light-primary cursor-pointer hover-elevate-up">
                    <div className="card-header pt-5">
                        <h3 className="card-title align-items-start flex-column">
                            <span className="card-label fw-bold text-gray-800">{t('admin.dashboard.totalRevenue')}</span>
                            <span className="text-gray-500 mt-1 fw-semibold fs-6">{t('admin.dashboard.approvedTransactionsAmount')}</span>
                        </h3>
                    </div>
                    <div className="card-body pt-2">
                        <div className="mb-2">
                            {subscriptionLoading
                                ? <div className="skeleton" style={{ width: '70%', height: '34px' }}></div>
                                : (
                                    <span className="fs-2hx fw-bold d-block text-gray-800 me-2 mb-2 lh-1 ls-n2">
                                        ${totalRevenue.toLocaleString()}
                                    </span>
                                )}
                        </div>
                        <div className="fw-semibold text-gray-600 fs-6">
                            {subscriptionLoading
                                ? <div className="skeleton mt-2" style={{ width: '45%', height: '16px' }}></div>
                                : t('admin.dashboard.thisMonthAmount', { amount: monthlyRevenue.toLocaleString() })}
                        </div>
                    </div>
                </div>
            </div>
            
        </div>
        </>
    );
};

export default AdminDashboardStatistics;




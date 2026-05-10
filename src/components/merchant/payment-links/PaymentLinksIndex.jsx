import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { 
    fetchPaymentLinks, 
    fetchPaymentLinkStatistics,
    bulkDeletePaymentLinks, 
    exportPaymentLinks 
} from '../../../services/paymentLinksService';
import PaymentLinksTable from './PaymentLinksTable';
import PaymentLinksFilters from './PaymentLinksFilters';
import PaymentLinkStatistics from './PaymentLinkStatistics';
import RescheduleModal from './RescheduleModal';
import SendModal from './SendModal';
import { useToolbar } from '../../../contexts/ToolbarContext';
import useAuthStore from '../../../stores/authStore';
import Swal from 'sweetalert2';
import { toast } from 'react-toastify';
import { useCan, canExport } from '../../../utils/permissions';

const PaymentLinksIndex = ({ merchantId: propMerchantId }) => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { user, merchant } = useAuthStore();
    const { setTitle, setBreadcrumbs, setActions } = useToolbar();
    const canCreate = useCan('pos.payment_links.create');
    const canDelete = useCan('pos.payment_links.delete');
    
    // Get merchantId from props, store, or localStorage
    const merchantId = propMerchantId || 
                       merchant?.id ||
                       user?.merchant_id;
    
    const [paymentLinks, setPaymentLinks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statisticsLoading, setStatisticsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedIds, setSelectedIds] = useState([]);
    const [showFilters, setShowFilters] = useState(false);
    const [showRescheduleModal, setShowRescheduleModal] = useState(false);
    const [showSendModal, setShowSendModal] = useState(false);
    const [selectedPaymentLink, setSelectedPaymentLink] = useState(null);
    const [statistics, setStatistics] = useState(null);
    const [pagination, setPagination] = useState({
        current_page: 1,
        per_page: 15,
        total: 0,
        last_page: 1
    });
    const [filters, setFilters] = useState({
        search: '',
        customer: '',
        from_date: '',
        to_date: '',
    });

    // Define handlers before useEffect that uses them
    const handleBulkDelete = useCallback(async () => {
        if (selectedIds.length === 0) return;

        const result = await Swal.fire({
            title: t('merchant.common.areYouSure'),
            text: t('merchant.paymentLinks.bulkDeleteText', { count: selectedIds.length }),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: t('merchant.common.yesDeleteThem'),
            cancelButtonText: t('merchant.common.cancel')
        });

        if (result.isConfirmed) {
            try {
                const response = await bulkDeletePaymentLinks(selectedIds);
                if (response.success) {
                    await Swal.fire({
                        title: t('merchant.common.deleted'),
                        text: t('merchant.paymentLinks.deletedSuccess'),
                        icon: 'success',
                        timer: 2000,
                        showConfirmButton: false
                    });
                    setSelectedIds([]);
                    // Trigger refetch by updating pagination
                    setPagination(prev => ({ ...prev, current_page: prev.current_page }));
                } else {
                    Swal.fire(t('merchant.common.error'), response.error || t('merchant.paymentLinks.deleteFailed'), 'error');
                }
            } catch (error) {
                Swal.fire(t('merchant.common.error'), t('merchant.paymentLinks.unexpectedError'), 'error');
            }
        }
    }, [selectedIds, t]);

    const handleExport = useCallback(async () => {
        try {
            const blob = await exportPaymentLinks({ merchantId, filters });
            
            // Create download link
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = `payment_links_export_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(downloadUrl);
            document.body.removeChild(a);
            
            toast.success(t('merchant.paymentLinks.exportSuccess'));
        } catch (error) {
            console.error('Export error:', error);
            toast.error(t('merchant.paymentLinks.exportFailed'));
        }
    }, [merchantId, filters, t]);

    // Set toolbar title, breadcrumbs and actions
    useEffect(() => {
        setTitle(t('merchant.breadcrumbs.paymentLinks'));
        
        setBreadcrumbs([
            { label: t('merchant.breadcrumbs.dashboard'), path: '/merchant/dashboard' },
            { label: t('merchant.breadcrumbs.paymentLinks'), path: '/merchant/payment-links' },
            { label: t('merchant.breadcrumbs.paymentLinksList'), path: '/merchant/payment-links', active: true }
        ]);
        
        setActions(
            <>
                <button
                    className="btn btn-sm btn-flex btn-secondary fw-bold me-2"
                    onClick={() => setShowFilters(!showFilters)}
                >
                    <i className="ki-duotone ki-filter fs-6 text-muted me-1">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    {t('merchant.common.filter')}
                </button>

                {selectedIds.length > 0 && canDelete && (
                    <button
                        className="btn btn-sm fw-bold btn-danger me-2"
                        onClick={handleBulkDelete}
                    >
                        <i className="ki-duotone ki-trash fs-3">
                            <span className="path1"></span>
                            <span className="path2"></span>
                            <span className="path3"></span>
                            <span className="path4"></span>
                            <span className="path5"></span>
                        </i>
                        {t('merchant.paymentLinks.deleteSelected', { count: selectedIds.length })}
                    </button>
                )}

                {canExport('paymentLinks') && (
                    <button
                        className="btn btn-sm fw-bold btn-success me-2"
                        onClick={handleExport}
                    >
                        <i className="ki-duotone ki-exit-up fs-3">
                            <span className="path1"></span>
                            <span className="path2"></span>
                        </i>
                        {t('merchant.paymentLinks.export')}
                    </button>
                )}

                {canCreate && (
                    <Link
                        to="/merchant/payment-links/create"
                        className="btn btn-sm fw-bold btn-primary"
                    >
                        <i className="ki-duotone ki-plus fs-3">
                            <span className="path1"></span>
                            <span className="path2"></span>
                        </i>
                        {t('merchant.paymentLinks.addNew')}
                    </Link>
                )}
            </>
        );

        return () => {
            setActions(null);
            setBreadcrumbs([]);
        };
    }, [setTitle, setBreadcrumbs, setActions, selectedIds.length, showFilters, handleBulkDelete, handleExport, t, i18n.language, canCreate]);

    // Fetch payment links when dependencies change
    useEffect(() => {
        const loadPaymentLinks = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await fetchPaymentLinks({ 
                    merchantId, 
                    page: pagination.current_page, 
                    perPage: pagination.per_page, 
                    filters 
                });
                
                if (data.success) {
                    const paymentLinksData = Array.isArray(data.data) ? data.data : (data.data?.data || data.data || []);
                    setPaymentLinks(paymentLinksData);
                    
                    if (data.pagination) {
                        setPagination(prev => ({
                            ...prev,
                            ...data.pagination
                        }));
                    }
                } else {
                    setError(data.error || data.message || t('merchant.paymentLinks.fetchFailedGeneric'));
                    toast.error(t('merchant.paymentLinks.loadFailed'));
                }
            } catch (error) {
                console.error('Error fetching payment links:', error);
                setError(error.message || t('merchant.paymentLinks.fetchUnexpected'));
                toast.error(t('merchant.paymentLinks.loadFailed'));
            } finally {
                setLoading(false);
            }
        };

        loadPaymentLinks();
    }, [merchantId, pagination.current_page, pagination.per_page, filters.search, filters.customer, filters.from_date, filters.to_date, t]);

    // Fetch statistics
    useEffect(() => {
        const loadStatistics = async () => {
            setStatisticsLoading(true);
            try {
                const data = await fetchPaymentLinkStatistics(merchantId);
                setStatistics(data);
            } catch (error) {
                console.error('Error fetching payment link statistics:', error);
            } finally {
                setStatisticsLoading(false);
            }
        };

        if (merchantId) {
            loadStatistics();
        }
    }, [merchantId]);

    const handleApplyFilters = () => {
        setPagination(prev => ({ ...prev, current_page: 1 }));
    };

    const handleClearFilters = () => {
        setFilters({
            search: '',
            customer: '',
            from_date: '',
            to_date: '',
        });
        setPagination(prev => ({ ...prev, current_page: 1 }));
    };

    const handlePageChange = (newPage) => {
        setPagination(prev => ({ ...prev, current_page: newPage }));
    };

    const handlePerPageChange = (newPerPage) => {
        setPagination(prev => ({ 
            ...prev, 
            per_page: newPerPage,
            current_page: 1 
        }));
    };

    const handleReschedule = (paymentLink) => {
        setSelectedPaymentLink(paymentLink);
        setShowRescheduleModal(true);
    };

    const handleSend = (paymentLink) => {
        setSelectedPaymentLink(paymentLink);
        setShowSendModal(true);
    };

    const handleRescheduleSuccess = () => {
        setShowRescheduleModal(false);
        setSelectedPaymentLink(null);
        // Trigger refetch
        setPagination(prev => ({ ...prev, current_page: prev.current_page }));
    };

    const handleSendSuccess = () => {
        setShowSendModal(false);
        setSelectedPaymentLink(null);
    };

    return (
        <>
            {/* Statistics */}
            {!statisticsLoading && statistics && (
                <PaymentLinkStatistics statistics={statistics} />
            )}

            {/* Filters */}
            {showFilters && (
                <PaymentLinksFilters
                    filters={filters}
                    setFilters={setFilters}
                    onApply={handleApplyFilters}
                    onClear={handleClearFilters}
                    onClose={() => setShowFilters(false)}
                />
            )}

            {/* Payment Links Table */}
            <div className="card">
                <div className="card-header border-0 pt-6">
                    <div className="card-title">
                        <h3 className="card-label">{t('merchant.paymentLinks.listHeading')}</h3>
                    </div>
                </div>
                <div className="card-body pt-0">
                    <PaymentLinksTable
                        paymentLinks={paymentLinks}
                        selectedIds={selectedIds}
                        setSelectedIds={setSelectedIds}
                        pagination={pagination}
                        onPageChange={handlePageChange}
                        onPerPageChange={handlePerPageChange}
                        onRefresh={() => setPagination(prev => ({ ...prev, current_page: prev.current_page }))}
                        onReschedule={handleReschedule}
                        onSend={handleSend}
                        loading={loading}
                        error={error}
                    />
                </div>
            </div>

            {/* Reschedule Modal */}
            {showRescheduleModal && selectedPaymentLink && (
                <RescheduleModal
                    show={showRescheduleModal}
                    paymentLink={selectedPaymentLink}
                    onClose={() => {
                        setShowRescheduleModal(false);
                        setSelectedPaymentLink(null);
                    }}
                    onSuccess={handleRescheduleSuccess}
                />
            )}

            {/* Send Modal */}
            {showSendModal && selectedPaymentLink && (
                <SendModal
                    show={showSendModal}
                    paymentLink={selectedPaymentLink}
                    onClose={() => {
                        setShowSendModal(false);
                        setSelectedPaymentLink(null);
                    }}
                    onSuccess={handleSendSuccess}
                />
            )}
        </>
    );
};

export default PaymentLinksIndex;


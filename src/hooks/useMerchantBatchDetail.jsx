import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useBatchDetails } from '../services/batchesService';
import { useToolbar } from '../contexts/ToolbarContext';
import { BatchTransactionModel } from '../services/BatchModel';
import { getBatchStatusColor, getBatchStatusLabel } from '../utils/batchHelpers';

const TX_STATUS_COLORS = {
    approved: 'success',
    captured: 'success',
    pending: 'warning',
    declined: 'danger',
    failed: 'danger',
    voided: 'danger',
    refunded: 'danger',
    cancelled: 'danger',
    expired: 'danger',
    reversed: 'danger',
};

export function useMerchantBatchDetail() {
    const { t, i18n } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();
    const { setTitle, setBreadcrumbs, setActions } = useToolbar();
    const { data: batch, isLoading: loading } = useBatchDetails(id);

    useEffect(() => {
        if (!batch) return;

        setTitle(t('merchant.pages.batchDetail', { id: batch.batch_number || id }));

        setBreadcrumbs([
            { label: t('merchant.breadcrumbs.dashboard'), path: '/merchant/dashboard' },
            { label: t('merchant.breadcrumbs.batches'), path: '/merchant/batches' },
            {
                label: batch.batch_number || t('merchant.breadcrumbs.batches'),
                path: `/merchant/batches/${id}`,
                active: true,
            },
        ]);

        setActions(
            <button
                type="button"
                className="btn btn-sm btn-light btn-active-light-primary"
                onClick={() => navigate('/merchant/batches')}
            >
                <i className="ki-duotone ki-arrow-left fs-5">
                    <span className="path1"></span>
                    <span className="path2"></span>
                </i>
                {t('merchant.common.backToBatches')}
            </button>
        );

        return () => {
            setActions(null);
            setBreadcrumbs([]);
        };
    }, [batch, id, navigate, setTitle, setBreadcrumbs, setActions, t, i18n.language]);

    const batchStatusLabel = (status) => getBatchStatusLabel(status, t);

    const getTransactionStatusColor = (status) =>
        TX_STATUS_COLORS[status?.toLowerCase()] || 'secondary';

    const txStatusLabel = (status) => {
        const key = (status || '').toLowerCase();
        const path = `merchant.batches.txStatus.${key}`;
        if (i18n.exists(path)) return t(path);
        return status
            ? status.charAt(0).toUpperCase() + status.slice(1)
            : t('merchant.common.na');
    };

    const formatDate = (date) => {
        if (!date) return t('merchant.common.na');
        const loc = (i18n.language || 'en').toLowerCase().startsWith('ar') ? 'ar-SA' : 'en-US';
        return new Date(date)
            .toLocaleString(loc, {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false,
            })
            .replace(',', '');
    };

    const formatTerminal = (transaction) =>
        BatchTransactionModel.ensure(transaction).getTerminalLabel(t('merchant.common.na'));

    return {
        id,
        batch,
        loading,
        navigate,
        batchStatusLabel,
        getBatchStatusColor,
        getTransactionStatusColor,
        txStatusLabel,
        formatDate,
        formatTerminal,
    };
}

import React, { useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

const DashboardFilters = ({ 
    filters, 
    onFilterChange, 
    onApplyFilters, 
    onClearFilters, 
    isCollapsed 
}) => {
    const { t } = useTranslation();
    const fromDateRef = useRef(null);
    const toDateRef = useRef(null);

    const transactionStatuses = useMemo(() => [
        { value: '', label: t('merchant.common.allStatuses') },
        { value: 'pending', label: t('merchant.filters.statusPending') },
        { value: 'approved', label: t('merchant.filters.statusApproved') },
        { value: 'declined', label: t('merchant.filters.statusDeclined') },
        { value: 'failed', label: t('merchant.filters.statusFailed') },
        { value: 'processed', label: t('merchant.filters.statusProcessed') },
        { value: 'refunded', label: t('merchant.filters.statusRefunded') },
        { value: 'captured', label: t('merchant.filters.statusCaptured') },
        { value: 'voided', label: t('merchant.filters.statusVoided') },
        { value: 'cancelled', label: t('merchant.filters.statusCancelled') },
        { value: 'expired', label: t('merchant.filters.statusExpired') },
        { value: 'reversed', label: t('merchant.filters.statusReversed') },
    ], [t]);

    const handleInputChange = (field, value) => {
        onFilterChange({ [field]: value });
    };

    const handleDateInputClick = (ref) => {
        if (ref && ref.current) {
            // Try to use the showPicker() method if available (modern browsers)
            if (ref.current.showPicker && typeof ref.current.showPicker === 'function') {
                ref.current.showPicker().catch((err) => {
                    // Fallback: if showPicker fails, just focus the input
                    ref.current.focus();
                });
            } else {
                // Fallback for browsers that don't support showPicker()
                ref.current.focus();
                // For some browsers, we need to trigger click after focus
                setTimeout(() => {
                    ref.current.click();
                }, 10);
            }
        }
    };

    if (isCollapsed) {
        return null;
    }

    return (
        <div 
            className="card bg-white card-xl-stretch mb-5 mb-xl-8" 
            id="filters-body"
            style={{
                transition: 'all 0.3s ease'
            }}
        >
            {/* Card header */}
            <div className="card-header border-0 pt-6">
                <div className="card-title">
                    <h3 className="fw-bold m-0">{t('merchant.common.filters')}</h3>
                </div>
                <div className="card-toolbar">
                    <button 
                        type="button" 
                        className="btn btn-sm btn-light-primary" 
                        onClick={onClearFilters}
                    >
                        <i className="ki-duotone ki-refresh fs-2">
                            <span className="path1"></span>
                            <span className="path2"></span>
                        </i>
                        {t('merchant.common.clearFilters')}
                    </button>
                </div>
            </div>
            
            {/* Card body */}
            <div className="card-body">
                <div className="row g-4">
                    {/* DateTime From */}
                    <div className="col-md-4">
                        <label className="form-label fw-bold">{t('merchant.dashboard.fromDateTime')}</label>
                        <input 
                            ref={fromDateRef}
                            type="datetime-local" 
                            className="form-control" 
                            value={filters.datetime_from}
                            onChange={(e) => handleInputChange('datetime_from', e.target.value)}
                            onClick={() => handleDateInputClick(fromDateRef)}
                            onFocus={() => handleDateInputClick(fromDateRef)}
                            placeholder={t('merchant.dashboard.placeholderFrom')}
                        />
                    </div>
                    
                    {/* DateTime To */}
                    <div className="col-md-4">
                        <label className="form-label fw-bold">{t('merchant.dashboard.toDateTime')}</label>
                        <input 
                            ref={toDateRef}
                            type="datetime-local" 
                            className="form-control" 
                            value={filters.datetime_to}
                            onChange={(e) => handleInputChange('datetime_to', e.target.value)}
                            onClick={() => handleDateInputClick(toDateRef)}
                            onFocus={() => handleDateInputClick(toDateRef)}
                            placeholder={t('merchant.dashboard.placeholderTo')}
                        />
                    </div>
                    
                    {/* Transaction Status */}
                    <div className="col-md-4">
                        <label className="form-label fw-bold">{t('merchant.dashboard.transactionStatus')}</label>
                        <select 
                            className="form-select" 
                            value={filters.transaction_status}
                            onChange={(e) => handleInputChange('transaction_status', e.target.value)}
                        >
                            {transactionStatuses.map(status => (
                                <option key={status.value} value={status.value}>
                                    {status.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                
                {/* Action Buttons */}
                <div className="row mt-4">
                    <div className="col-12">
                        <div className="d-flex gap-2">
                            <button 
                                type="button" 
                                className="btn btn-primary" 
                                onClick={onApplyFilters}
                            >
                                <i className="ki-duotone ki-filter fs-2">
                                    <span className="path1"></span>
                                    <span className="path2"></span>
                                </i>
                                {t('merchant.common.applyFilters')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardFilters;

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import Swal from 'sweetalert2';
import { toast } from 'react-toastify';
import { ADMIN_ENDPOINTS, AUTH_ENDPOINTS } from '../../../utils/constants';
import { getToken } from '../../../utils/api';
import { useToolbar } from '../../../contexts/ToolbarContext';
import { exportBatches } from '../../../utils/batchExport';
import useMerchantCountryInfo from '../../../hooks/useMerchantCountryInfo';
import useAdminReferenceData from '../../../hooks/useAdminReferenceData';
import MerchantCountryFilterFields from '../../common/filters/MerchantCountryFilterFields';
import { formatMerchantDateTime, getDisplayLocale } from '../../../utils/dateUtils';
import { getBatchStatusLabel } from '../../../utils/batchHelpers';

const BI_NS = 'admin.batchesIndex';

const AdminBatchesIndex = () => {
    const { t, i18n } = useTranslation();
    const na = t(`${BI_NS}.na`);
    const displayLocale = getDisplayLocale(i18n.language);

    const formatDate = useCallback(
        (date) => (date ? formatMerchantDateTime(date, i18n.language) : na),
        [i18n.language, na]
    );

    const formatCount = useCallback(
        (value) => {
            const numeric = Number(value ?? 0);
            return Number.isNaN(numeric) ? '0' : numeric.toLocaleString(displayLocale);
        },
        [displayLocale]
    );

    const formatAmount = useCallback(
        (value, symbol = '$') => {
            const numeric = Number(value ?? 0);
            const formatted = Number.isNaN(numeric)
                ? '0.00'
                : numeric.toLocaleString(displayLocale, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                  });
            return `${symbol} ${formatted}`;
        },
        [displayLocale]
    );

    const navigate = useNavigate();
    const { setTitle, setActions } = useToolbar();
    
    const [batches, setBatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statisticsLoading, setStatisticsLoading] = useState(false);
    const [statistics, setStatistics] = useState(null);
    const [showFilters, setShowFilters] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);
    
    const {
        merchantsMap,
        countriesMap,
    } = useAdminReferenceData();
    
    const [pagination, setPagination] = useState({
        current_page: 1,
        per_page: 25,
        total: 0,
        last_page: 1
    });
    
    const [filters, setFilters] = useState({
        search: '',
        status: '',
        merchant_id: '',
        country_id: '',
        from_date: '',
        to_date: ''
    });

    // Refs for date inputs
    const fromDateRef = useRef(null);
    const toDateRef = useRef(null);

    useEffect(() => {
        setTitle(t(`${BI_NS}.management`));
        
        setActions(
            <div className="d-flex align-items-center gap-2 gap-lg-3">
                <button
                    className="btn btn-sm btn-flex btn-secondary fw-bold"
                    onClick={() => setShowFilters(!showFilters)}
                >
                    <i className="ki-duotone ki-filter fs-3">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    <span className="d-none d-md-inline ms-1">{t(`${BI_NS}.filter`)}</span>
                </button>

                <button
                    className="btn btn-sm btn-icon btn-light fw-bold"
                    onClick={() => fetchBatches()}
                    disabled={loading}
                    title={t(`${BI_NS}.refreshTitle`)}
                    aria-label={t(`${BI_NS}.refreshTitle`)}
                >
                    <i className="ki-duotone ki-arrows-circle fs-3">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                </button>

                <button
                    className="btn btn-sm btn-flex btn-success fw-bold"
                    onClick={handleExport}
                >
                    <i className="ki-duotone ki-file-down fs-3">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    <span className="d-none d-md-inline ms-1">{t(`${BI_NS}.export`)}</span>
                </button>
            </div>
        );
        return () => setActions(null);
    }, [setTitle, setActions, showFilters, loading, t]);

    useEffect(() => {
        fetchBatches();
    }, [pagination.current_page, pagination.per_page, filters]);

    useEffect(() => {
        fetchStatistics();
    }, [filters.merchant_id, filters.from_date, filters.to_date]);

    const fetchBatches = async () => {
        setLoading(true);
        try {
            const token = getToken();
            const params = {
                page: pagination.current_page,
                per_page: pagination.per_page,
                ...filters
            };

            const response = await axios.get(ADMIN_ENDPOINTS.BATCHES, {
                params,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            if (response.data && response.data.data) {
                const batchesData = response.data.data.data || [];
                setBatches(batchesData);
                setPagination(prev => ({
                    ...prev,
                    total: response.data.data.total || 0,
                    last_page: response.data.data.last_page || 1
                }));
            }
        } catch (error) {
            console.error('Error fetching batches:', error);
            toast.error(t(`${BI_NS}.loadFailed`));
        } finally {
            setLoading(false);
        }
    };

    // Extract merchant IDs from batches
    const batchMerchantIds = useMemo(() => {
        if (!batches.length) return [];
        return [
            ...new Set(
                batches
                    .map((batch) => batch.merchant?.id || batch.merchant_id)
                    .filter((id) => id !== null && id !== undefined && id !== '')
                    .map((id) => String(id))
            ),
        ];
    }, [batches]);

    // Fetch merchant and country info using the hook
    const {
        loading: merchantInfoLoading,
        getMerchantInfoById,
        hasPendingRequest,
    } = useMerchantCountryInfo(batchMerchantIds);

    // Helper function to get merchant info for a batch
    const getMerchantInfo = useCallback(
        (batch) => {
            const merchantId = batch.merchant?.id || batch.merchant_id;
            
            if (!merchantId) {
                return {
                    merchantName: batch.merchant?.business_name || batch.merchant?.name || na,
                    countryName: batch.merchant?.country?.name || na,
                };
            }

            const record = getMerchantInfoById(String(merchantId));

            if (record) {
                return {
                    merchantName: record.name || batch.merchant?.business_name || batch.merchant?.name || na,
                    countryName: record.countryName || na,
                };
            }

            return {
                merchantName: batch.merchant?.business_name || batch.merchant?.name || na,
                countryName: na,
            };
        },
        [getMerchantInfoById, na]
    );


    const fetchStatistics = async () => {
        setStatisticsLoading(true);
        try {
            const token = getToken();
            const params = {
                merchant_id: filters.merchant_id,
                date_from: filters.from_date,
                date_to: filters.to_date
            };

            const response = await axios.get(ADMIN_ENDPOINTS.BATCH_STATISTICS, {
                params,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            setStatistics(response.data.data || response.data);
        } catch (error) {
            console.error('Error fetching statistics:', error);
        } finally {
            setStatisticsLoading(false);
        }
    };

    const handleExport = async () => {
        const filterInfo = Object.values(filters).some((v) => v) ? t(`${BI_NS}.withFilters`) : '';
        
        const result = await Swal.fire({
            title: t(`${BI_NS}.exportTitle`),
            text: t(`${BI_NS}.exportConfirm`, { filterInfo }),
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#28a745',
            cancelButtonColor: '#6c757d',
            confirmButtonText: t(`${BI_NS}.export`),
            cancelButtonText: t('admin.common.cancel'),
        });

        if (result.isConfirmed) {
            try {
                Swal.fire({
                    title: t(`${BI_NS}.exporting`),
                    html: `<div id="export-progress">${t(`${BI_NS}.fetching`)}</div>`,
                    allowOutsideClick: false,
                    allowEscapeKey: false,
                    didOpen: () => {
                        Swal.showLoading();
                    },
                });

                const progressCallback = (message) => {
                    const progressEl = document.getElementById('export-progress');
                    if (progressEl) {
                        progressEl.textContent = message;
                    }
                };

                const exportResult = await exportBatches(filters, {
                    progressCallback,
                    labels: {
                        batchNumber: t(`${BI_NS}.exportColBatchNumber`),
                        merchantName: t(`${BI_NS}.exportColMerchantName`),
                        merchantCountry: t(`${BI_NS}.exportColMerchantCountry`),
                        status: t(`${BI_NS}.exportColStatus`),
                        totalAmount: t(`${BI_NS}.exportColTotalAmount`),
                        currency: t(`${BI_NS}.exportColCurrency`),
                        transactionCount: t(`${BI_NS}.exportColTransactionCount`),
                        createdDate: t(`${BI_NS}.exportColCreatedDate`),
                        updatedDate: t(`${BI_NS}.exportColUpdatedDate`),
                        na,
                    },
                    messages: {
                        authRequired: t(`${BI_NS}.exportAuthRequired`),
                        noData: t(`${BI_NS}.exportNoData`),
                        fetching: t(`${BI_NS}.fetching`),
                        fetchedCount: t(`${BI_NS}.exportFetchedCount`),
                        loadingMerchants: t(`${BI_NS}.exportLoadingMerchants`),
                        preparing: t(`${BI_NS}.exportPreparing`),
                        generating: t(`${BI_NS}.exportGenerating`),
                    },
                    formatDate: (date) => formatMerchantDateTime(date, i18n.language) || na,
                    formatStatus: (status) => getBatchStatusLabel(status, t, BI_NS) || na,
                    formatProgressCount: formatCount,
                });

                Swal.close();
                toast.success(t(`${BI_NS}.exportSuccess`, { count: formatCount(exportResult.count) }));
            } catch (error) {
                console.error('Export error:', error);
                Swal.close();
                toast.error(error.message || t(`${BI_NS}.exportFailed`));
            }
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, current_page: 1 }));
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

    const clearFilters = () => {
        setFilters({
            search: '',
            status: '',
            merchant_id: '',
            country_id: '',
            from_date: '',
            to_date: ''
        });
        setPagination(prev => ({ ...prev, current_page: 1 }));
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(batches.map(b => b.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectRow = (id) => {
        setSelectedIds(prev => {
            if (prev.includes(id)) {
                return prev.filter(i => i !== id);
            } else {
                return [...prev, id];
            }
        });
    };

    const handlePageChange = (page) => {
        if (page >= 1 && page <= pagination.last_page) {
            setPagination(prev => ({ ...prev, current_page: page }));
        }
    };

    const handlePerPageChange = (e) => {
        setPagination(prev => ({
            ...prev,
            per_page: parseInt(e.target.value),
            current_page: 1
        }));
    };

    const getStatusBadgeClass = (status) => {
        const statusMap = {
            'settled': 'badge-light-success',
            'pending': 'badge-light-warning',
            'failed': 'badge-light-danger'
        };
        return statusMap[status?.toLowerCase()] || 'badge-light-secondary';
    };

    const getActiveFiltersCount = () => {
        return Object.values(filters).filter(v => v).length;
    };

    const resolveMerchant = useCallback(
        (id) => merchantsMap[id] || merchantsMap[String(id)] || '',
        [merchantsMap]
    );

    const resolveCountry = useCallback(
        (id) => countriesMap[id] || countriesMap[String(id)] || '',
        [countriesMap]
    );

    const getFilterDetails = useCallback(() => {
        const details = [];
        if (filters.search) {
            details.push(t(`${BI_NS}.filterSummarySearch`, { value: filters.search }));
        }
        if (filters.status) {
            details.push(
                t(`${BI_NS}.filterSummaryStatus`, {
                    value: getBatchStatusLabel(filters.status, t, BI_NS) || filters.status,
                })
            );
        }
        if (filters.merchant_id) {
            const merchantName = resolveMerchant(filters.merchant_id);
            if (merchantName) {
                details.push(t(`${BI_NS}.filterSummaryMerchant`, { value: merchantName }));
            }
        }
        if (filters.country_id) {
            const countryName = resolveCountry(filters.country_id);
            if (countryName) {
                details.push(t(`${BI_NS}.filterSummaryCountry`, { value: countryName }));
            }
        }
        if (filters.from_date) {
            details.push(t(`${BI_NS}.filterSummaryFrom`, { value: filters.from_date }));
        }
        if (filters.to_date) {
            details.push(t(`${BI_NS}.filterSummaryTo`, { value: filters.to_date }));
        }

        return (
            details.slice(0, 2).join(', ') +
            (details.length > 2 ? ` ${t(`${BI_NS}.filterSummaryMore`)}` : '')
        );
    }, [filters, resolveMerchant, resolveCountry, t]);

    return (
        <>
            <style>{`
                #filter-summary {
                    transition: all 0.3s ease;
                }
                #filter-summary:hover {
                    background-color: rgba(0,0,0,0.05);
                    border-radius: 4px;
                    padding: 4px 8px;
                    margin: -4px -8px;
                }
                .is-loading {
                    position: relative;
                    pointer-events: none;
                }
                .is-loading:after {
                    content: "";
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    width: 16px;
                    height: 16px;
                    margin: -8px 0 0 -8px;
                    border: 2px solid #f3f3f3;
                    border-top: 2px solid #3498db;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
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

            {/* Statistics Cards */}
            <div className="row g-5 g-xl-8 mt-4 mb-5">
                <div className="col-md-12 row">
                    <div className="col-sm-3 text-center">
                        <div 
                            className="card bg-light-dark hoverable card-xl-stretch mb-xl-8"
                            style={{ cursor: 'pointer' }}
                            onClick={() => handleFilterChange('status', '')}
                        >
                            <div className="card-body">
                                <div className="text-black fw-bolder fs-2 mb-2 mt-5">
                                    {statisticsLoading ? t(`${BI_NS}.loading`) : formatCount(statistics?.total || 0)}
                                </div>
                                <div className="fw-bold text-black">{t(`${BI_NS}.totalBatches`)}</div>
                            </div>
                        </div>
                    </div>
                    <div className="col-sm-3 text-center">
                        <div 
                            className="card bg-light-success hoverable card-xl-stretch mb-5 mb-xl-8"
                            style={{ cursor: 'pointer' }}
                            onClick={() => handleFilterChange('status', 'settled')}
                        >
                            <div className="card-body">
                                <div className="text-black fw-bolder fs-2 mb-2 mt-5">
                                    {statisticsLoading ? t(`${BI_NS}.loading`) : formatCount(statistics?.settled || 0)}
                                </div>
                                <div className="fw-bold text-black">{t(`${BI_NS}.settled`)}</div>
                            </div>
                        </div>
                    </div>
                    <div className="col-sm-3 text-center">
                        <div 
                            className="card bg-light-warning hoverable card-xl-stretch mb-xl-8"
                            style={{ cursor: 'pointer' }}
                            onClick={() => handleFilterChange('status', 'pending')}
                        >
                            <div className="card-body">
                                <div className="text-black fw-bolder fs-2 mb-2 mt-5">
                                    {statisticsLoading ? t(`${BI_NS}.loading`) : formatCount(statistics?.pending || 0)}
                                </div>
                                <div className="fw-bold text-black">{t(`${BI_NS}.pending`)}</div>
                            </div>
                        </div>
                    </div>
                    <div className="col-sm-3 text-center">
                        <div 
                            className="card bg-light-danger hoverable card-xl-stretch mb-xl-8"
                            style={{ cursor: 'pointer' }}
                            onClick={() => handleFilterChange('status', 'failed')}
                        >
                            <div className="card-body">
                                <div className="text-black fw-bolder fs-2 mb-2 mt-5">
                                    {statisticsLoading ? t(`${BI_NS}.loading`) : formatCount(statistics?.failed || 0)}
                                </div>
                                <div className="fw-bold text-black">{t(`${BI_NS}.failed`)}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters Card */}
            {showFilters && (
                <div className="card bg-white card-xl-stretch mb-5 mb-xl-8">
                    <div className="card-body">
                        <div className="row">
                            <div className="col-md-3">
                                <label className="form-label">{t(`${BI_NS}.search`)}</label>
                                <input
                                    type="text"
                                    name="search"
                                    className="form-control"
                                    placeholder={t(`${BI_NS}.searchPlaceholder`)}
                                    value={filters.search}
                                    onChange={(e) => handleFilterChange('search', e.target.value)}
                                />
                            </div>
                            <div className="col-md-3">
                                <label className="form-label">{t(`${BI_NS}.status`)}</label>
                                <select
                                    name="status"
                                    className="form-select"
                                    value={filters.status}
                                    onChange={(e) => handleFilterChange('status', e.target.value)}
                                >
                                    <option value="">{t(`${BI_NS}.allStatuses`)}</option>
                                    <option value="pending">{t(`${BI_NS}.pending`)}</option>
                                    <option value="settled">{t(`${BI_NS}.settled`)}</option>
                                    <option value="failed">{t(`${BI_NS}.failed`)}</option>
                                </select>
                            </div>
                            <MerchantCountryFilterFields
                                merchantValue={filters.merchant_id}
                                countryValue={filters.country_id}
                                onMerchantChange={(value) => handleFilterChange('merchant_id', value || '')}
                                onCountryChange={(value) => handleFilterChange('country_id', value || '')}
                                merchantLabel={t(`${BI_NS}.merchant`)}
                                countryLabel={t(`${BI_NS}.country`)}
                                merchantPlaceholder={t(`${BI_NS}.allMerchants`)}
                                countryPlaceholder={t(`${BI_NS}.allCountries`)}
                                merchantNameResolver={resolveMerchant}
                                countryNameResolver={resolveCountry}
                                merchantWrapperClassName="col-md-3"
                                countryWrapperClassName="col-md-3"
                            />
                        </div>
                        <div className="row mt-3">
                            <div className="col-md-6">
                                <label className="form-label fw-bold">{t(`${BI_NS}.fromDate`)}</label>
                                <input
                                    ref={fromDateRef}
                                    type="date"
                                    name="from_date"
                                    className="form-control"
                                    value={filters.from_date}
                                    onChange={(e) => handleFilterChange('from_date', e.target.value)}
                                    onClick={() => handleDateInputClick(fromDateRef)}
                                    onFocus={() => handleDateInputClick(fromDateRef)}
                                />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label fw-bold">{t(`${BI_NS}.toDate`)}</label>
                                <input
                                    ref={toDateRef}
                                    type="date"
                                    name="to_date"
                                    className="form-control"
                                    value={filters.to_date}
                                    onChange={(e) => handleFilterChange('to_date', e.target.value)}
                                    onClick={() => handleDateInputClick(toDateRef)}
                                    onFocus={() => handleDateInputClick(toDateRef)}
                                />
                            </div>
                        </div>
                        <div className="row mt-3">
                            <div className="col-8">
                                {getActiveFiltersCount() > 0 && (
                                    <div id="filter-summary" className="text-muted fs-7">
                                        <i className="ki-duotone ki-filter fs-6 text-muted me-1">
                                            <span className="path1"></span>
                                            <span className="path2"></span>
                                        </i>
                                        {t(`${BI_NS}.activeFilters`, { count: formatCount(getActiveFiltersCount()) })}
                                        <span className="ms-2 badge badge-light-primary fs-8" id="filter-details">
                                            {getFilterDetails()}
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div className="col-4 text-end">
                                <button
                                    type="button"
                                    className="btn btn-secondary btn-sm"
                                    id="clear-filters"
                                    onClick={clearFilters}
                                >
                                    <i className="ki-duotone ki-filter-remove fs-3">
                                        <span className="path1"></span>
                                        <span className="path2"></span>
                                    </i>
                                    {t(`${BI_NS}.clearFilters`)}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Table Card */}
            <div className="card">
                <div className="card-header border-0 pt-6">
                    <div className="card-title">
                        <div className="d-flex align-items-center position-relative">
                            <i className="ki-duotone ki-magnifier fs-2 position-absolute ms-4" style={{ zIndex: 10 }}>
                                <span className="path1"></span>
                                <span className="path2"></span>
                            </i>
                            <input
                                type="text"
                                className="form-control form-control-solid w-250px ps-12"
                                placeholder={t(`${BI_NS}.quickSearch`)}
                                value={filters.search}
                                onChange={(e) => handleFilterChange('search', e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="card-toolbar">
                        {selectedIds.length > 0 && (
                            <div className="d-flex justify-content-end align-items-center">
                                <div className="fw-bolder me-5">
                                    <span className="me-2">{t(`${BI_NS}.selected`, { count: formatCount(selectedIds.length) })}</span>
                                </div>
                                <button
                                    type="button"
                                    className="btn btn-danger btn-sm"
                                    onClick={() => toast.info(t(`${BI_NS}.deleteSoon`))}
                                >
                                    {t(`${BI_NS}.deleteSelected`)}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="card-body pt-0">
                    <div className="table-responsive">
                        <table className="table align-middle table-row-dashed fs-7 gy-5">
                            <thead>
                                <tr className="text-start text-gray-400 fw-bolder fs-7 text-uppercase gs-0">
                                    <th className="w-10px pe-2">
                                        <div className="form-check form-check-sm form-check-custom form-check-solid me-3">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                checked={selectedIds.length === batches.length && batches.length > 0}
                                                onChange={handleSelectAll}
                                            />
                                        </div>
                                    </th>
                                    <th className="text-dark">{t(`${BI_NS}.batchNumber`)}</th>
                                    <th className="text-dark">{t(`${BI_NS}.merchant`)}</th>
                                    <th className="min-w-100px text-center text-dark">{t(`${BI_NS}.status`)}</th>
                                    <th className="min-w-100px text-end text-dark">{t(`${BI_NS}.totalAmount`)}</th>
                                    <th className="min-w-100px text-end text-dark">{t(`${BI_NS}.transactionCount`)}</th>
                                    <th className="text-dark">{t(`${BI_NS}.createdAt`)}</th>
                                    <th className="text-dark">{t(`${BI_NS}.country`)}</th>
                                    <th className="text-end text-dark">{t(`${BI_NS}.actions`)}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    [...Array(pagination.per_page)].map((_, index) => (
                                        <tr key={`skeleton-${index}`}>
                                            <td><div className="skeleton" style={{width: '20px', height: '20px'}}></div></td>
                                            <td><div className="skeleton" style={{width: '120px', height: '16px'}}></div></td>
                                            <td><div className="skeleton" style={{width: '150px', height: '16px'}}></div></td>
                                            <td className="text-center"><div className="skeleton" style={{width: '80px', height: '24px', borderRadius: '6px', margin: '0 auto'}}></div></td>
                                            <td className="text-end"><div className="skeleton" style={{width: '80px', height: '16px', marginLeft: 'auto'}}></div></td>
                                            <td className="text-end"><div className="skeleton" style={{width: '60px', height: '16px', marginLeft: 'auto'}}></div></td>
                                            <td><div className="skeleton" style={{width: '140px', height: '16px'}}></div></td>
                                            <td><div className="skeleton" style={{width: '100px', height: '16px'}}></div></td>
                                            <td className="text-end"><div className="skeleton" style={{width: '70px', height: '32px', borderRadius: '6px', marginLeft: 'auto'}}></div></td>
                                        </tr>
                                    ))
                                ) : batches.length === 0 ? (
                                    <tr>
                                        <td colSpan="9" className="text-center py-10">
                                            <div className="text-gray-500">
                                                <i className="ki-duotone ki-file fs-3x mb-3">
                                                    <span className="path1"></span>
                                                    <span className="path2"></span>
                                                </i>
                                                <p className="fw-bold">{t(`${BI_NS}.noBatches`)}</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    batches.map((batch) => (
                                        <tr key={batch.id}>
                                            <td>
                                                <div className="form-check form-check-sm form-check-custom form-check-solid">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        checked={selectedIds.includes(batch.id)}
                                                        onChange={() => handleSelectRow(batch.id)}
                                                    />
                                                </div>
                                            </td>
                                            <td>{batch.batch_number || na}</td>
                                            <td>
                                                {(() => {
                                                    const merchantId = batch.merchant?.id || batch.merchant_id;
                                                    const merchantLoading = Boolean(merchantId) && (merchantInfoLoading || hasPendingRequest(String(merchantId)));
                                                    const info = getMerchantInfo(batch);
                                                    const record = merchantId ? getMerchantInfoById(String(merchantId)) : null;
                                                    
                                                    if (merchantLoading && !record) {
                                                        return <div className="skeleton" style={{width: '120px', height: '16px'}}></div>;
                                                    }
                                                    return info.merchantName;
                                                })()}
                                            </td>
                                            <td className="text-center">
                                                <span className={`badge ${getStatusBadgeClass(batch.status)}`}>
                                                    {getBatchStatusLabel(batch.status, t, BI_NS) || na}
                                                </span>
                                            </td>
                                            <td className="text-end">{formatAmount(batch.total_amount, batch.currency_symbol || '$')}</td>
                                            <td className="text-end">{formatCount(batch.transaction_count || 0)}</td>
                                            <td>{formatDate(batch.created_at)}</td>
                                            <td>
                                                {(() => {
                                                    const merchantId = batch.merchant?.id || batch.merchant_id;
                                                    const countryLoading = Boolean(merchantId) && (merchantInfoLoading || hasPendingRequest(String(merchantId)));
                                                    const info = getMerchantInfo(batch);
                                                    const record = merchantId ? getMerchantInfoById(String(merchantId)) : null;
                                                    
                                                    if (countryLoading && !record) {
                                                        return <div className="skeleton" style={{width: '80px', height: '16px'}}></div>;
                                                    }
                                                    return info.countryName;
                                                })()}
                                            </td>
                                            <td className="text-end">
                                                <button
                                                    className="btn btn-sm btn-light btn-active-light-primary"
                                                    onClick={() => navigate(`/admin/batches/${batch.id}`)}
                                                    title={t(`${BI_NS}.viewTitle`)}
                                                    aria-label={t(`${BI_NS}.viewTitle`)}
                                                >
                                                    {t(`${BI_NS}.view`)}
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {!loading && batches.length > 0 && (
                        <div className="row mt-5">
                            <div className="col-sm-12 col-md-5 d-flex align-items-center">
                                <div className="dataTables_length">
                                    <label className="d-flex align-items-center">
                                        <span className="me-2">{t(`${BI_NS}.show`)}</span>
                                        <select 
                                            className="form-select form-select-sm" 
                                            value={pagination.per_page}
                                            onChange={handlePerPageChange}
                                            style={{ width: '75px' }}
                                        >
                                            <option value="10">10</option>
                                            <option value="25">25</option>
                                            <option value="50">50</option>
                                            <option value="100">100</option>
                                        </select>
                                        <span className="ms-2">{t(`${BI_NS}.entries`)}</span>
                                    </label>
                                </div>
                                <div className="ms-5">
                                    <span className="text-muted">
                                        {t(`${BI_NS}.showingResults`, {
                                            from: formatCount(((pagination.current_page - 1) * pagination.per_page) + 1),
                                            to: formatCount(Math.min(pagination.current_page * pagination.per_page, pagination.total)),
                                            total: formatCount(pagination.total),
                                        })}
                                    </span>
                                </div>
                            </div>
                            <div className="col-sm-12 col-md-7 d-flex align-items-center justify-content-end">
                                <div className="dataTables_paginate">
                                    <ul className="pagination">
                                        <li className={`page-item ${pagination.current_page === 1 ? 'disabled' : ''}`}>
                                            <button 
                                                className="page-link" 
                                                onClick={() => handlePageChange(pagination.current_page - 1)}
                                                disabled={pagination.current_page === 1}
                                            >
                                                {t(`${BI_NS}.previous`)}
                                            </button>
                                        </li>
                                        <li className="page-item active">
                                            <span className="page-link">{formatCount(pagination.current_page)}</span>
                                        </li>
                                        <li className={`page-item ${pagination.current_page === pagination.last_page ? 'disabled' : ''}`}>
                                            <button 
                                                className="page-link" 
                                                onClick={() => handlePageChange(pagination.current_page + 1)}
                                                disabled={pagination.current_page === pagination.last_page}
                                            >
                                                {t(`${BI_NS}.next`)}
                                            </button>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default AdminBatchesIndex;

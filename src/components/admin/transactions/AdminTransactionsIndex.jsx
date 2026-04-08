import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import { toast } from 'react-toastify';
import { ADMIN_ENDPOINTS, AUTH_ENDPOINTS } from '../../../utils/constants';
import { getToken } from '../../../utils/api';
import { useToolbar } from '../../../contexts/ToolbarContext';
import useMerchantCountryInfo from '../../../hooks/useMerchantCountryInfo';
import { exportTransactions } from '../../../utils/transactionExport';

const AdminTransactionsIndex = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { setTitle, setActions } = useToolbar();
    
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statisticsLoading, setStatisticsLoading] = useState(false);
    const [statistics, setStatistics] = useState(null);
    const [showFilters, setShowFilters] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);
    
    // Filter dropdown data
    const [merchantsList, setMerchantsList] = useState([]);
    const [filteredMerchants, setFilteredMerchants] = useState([]);
    const [merchantSearchTerm, setMerchantSearchTerm] = useState('');
    const [showMerchantList, setShowMerchantList] = useState(false);
    const [selectedMerchant, setSelectedMerchant] = useState(null);
    
    const [terminalsList, setTerminalsList] = useState([]);
    const [filteredTerminals, setFilteredTerminals] = useState([]);
    const [terminalSearchTerm, setTerminalSearchTerm] = useState('');
    const [showTerminalList, setShowTerminalList] = useState(false);
    const [selectedTerminal, setSelectedTerminal] = useState(null);
    
    const [countriesList, setCountriesList] = useState([]);
    const [filteredCountries, setFilteredCountries] = useState([]);
    const [countrySearchTerm, setCountrySearchTerm] = useState('');
    const [showCountryList, setShowCountryList] = useState(false);
    const [selectedCountry, setSelectedCountry] = useState(null);
    
    const [dropdownsLoading, setDropdownsLoading] = useState(false);
    const [dropdownsLoaded, setDropdownsLoaded] = useState(false);
    
    const urlType = searchParams.get('type') || '';
    
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
        terminal_id: '',
        country_id: '',
        start_date: '',
        end_date: ''
    });

    // Refs for date inputs
    const startDateRef = useRef(null);
    const endDateRef = useRef(null);

    // Refs for dropdown containers
    const merchantDropdownRef = useRef(null);
    const terminalDropdownRef = useRef(null);
    const countryDropdownRef = useRef(null);

    // Update filters when URL type changes
    useEffect(() => {
        const newType = searchParams.get('type') || '';
        if (newType) {
            setFilters(prev => ({ ...prev, type: newType }));
        }
    }, [searchParams]);

    useEffect(() => {
        const typeLabel = urlType ? ` - ${urlType.charAt(0).toUpperCase() + urlType.slice(1)}` : '';
        setTitle(`Transactions Management${typeLabel}`);
        
        setActions(
            <div className="d-flex align-items-center gap-2 gap-lg-3">
                {/* Filter – icon only on small screens, icon + text on large */}
                <button
                    className="btn btn-sm btn-flex btn-secondary fw-bold"
                    onClick={() => setShowFilters(!showFilters)}
                    aria-label="Toggle filters"
                >
                    <i className="ki-duotone ki-filter fs-3 me-0 me-lg-1">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    <span className="d-none d-lg-inline ms-lg-1">Filter</span>
                </button>

                {/* Export – icon only on small screens, icon + text on large */}
                <button
                    className="btn btn-sm btn-flex btn-success fw-bold"
                    onClick={handleExport}
                    aria-label="Export transactions"
                >
                    <i className="ki-duotone ki-file-down fs-3 me-0 me-lg-1">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    <span className="d-none d-lg-inline ms-lg-1">Export</span>
                </button>
            </div>
        );
        return () => setActions(null);
    }, [setTitle, setActions, showFilters, urlType]);

    useEffect(() => {
        fetchTransactions();
    }, [pagination.current_page, pagination.per_page, filters]);

    useEffect(() => {
        if (!urlType) {
            fetchStatistics();
        }
    }, [urlType, filters]);

    // Fetch filter dropdowns only when filters are shown
    useEffect(() => {
        if (showFilters && !dropdownsLoaded) {
            fetchFilterDropdowns();
        }
    }, [showFilters]);

    // Handle click outside for merchant dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (merchantDropdownRef.current && !merchantDropdownRef.current.contains(event.target)) {
                setShowMerchantList(false);
            }
        };

        if (showMerchantList) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showMerchantList]);

    // Handle click outside for terminal dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (terminalDropdownRef.current && !terminalDropdownRef.current.contains(event.target)) {
                setShowTerminalList(false);
            }
        };

        if (showTerminalList) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showTerminalList]);

    // Handle click outside for country dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target)) {
                setShowCountryList(false);
            }
        };

        if (showCountryList) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showCountryList]);

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const token = getToken();
            const params = {
                page: pagination.current_page,
                per_page: pagination.per_page,
                ...filters
            };
            
            if (urlType) {
                params.type = urlType;
            }

            const response = await axios.get(ADMIN_ENDPOINTS.TRANSACTIONS, {
                params,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            if (response.data && response.data.data) {
                const transactionsData = response.data.data.data || [];
                setTransactions(transactionsData);
                setPagination(prev => ({
                    ...prev,
                    total: response.data.data.total || 0,
                    last_page: response.data.data.last_page || 1
                }));
            }
        } catch (error) {
            console.error('Error fetching transactions:', error);
            toast.error('Failed to load transactions');
        } finally {
            setLoading(false);
        }
    };

    // Extract merchant IDs from transactions
    const transactionMerchantIds = useMemo(() => {
        if (!transactions.length) return [];
        return [
            ...new Set(
                transactions
                    .map((transaction) => transaction.merchant?.id || transaction.merchant_id)
                    .filter((id) => id !== null && id !== undefined && id !== '')
                    .map((id) => String(id))
            ),
        ];
    }, [transactions]);

    // Fetch merchant and country info using the hook
    const {
        loading: merchantInfoLoading,
        getMerchantInfoById,
        hasPendingRequest,
    } = useMerchantCountryInfo(transactionMerchantIds);

    // Helper function to get merchant info for a transaction
    const getMerchantInfo = useCallback(
        (transaction) => {
            const merchantId = transaction.merchant?.id || transaction.merchant_id;
            
            if (!merchantId) {
                return {
                    merchantName: transaction.merchant?.business_name || transaction.merchant?.name || 'N/A',
                    countryName: transaction.merchant?.country?.name || 'N/A',
                };
            }

            const record = getMerchantInfoById(String(merchantId));

            if (record) {
                return {
                    merchantName: record.name || transaction.merchant?.business_name || transaction.merchant?.name || 'N/A',
                    countryName: record.countryName || 'N/A',
                };
            }

            return {
                merchantName: transaction.merchant?.business_name || transaction.merchant?.name || 'N/A',
                countryName: 'N/A',
            };
        },
        [getMerchantInfoById]
    );

    const fetchFilterDropdowns = async () => {
        setDropdownsLoading(true);
        try {
            const token = getToken();
            
            // Fetch all dropdowns in parallel
            const [merchantsRes, terminalsRes, countriesRes] = await Promise.all([
                // Merchants from AuthService (Admin endpoint)
                axios.get(ADMIN_ENDPOINTS.MERCHANTS, {
                    params: { per_page: 1000 },
                    headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
                }).catch(err => {
                    console.error('Error fetching merchants:', err);
                    return { data: { data: [] } };
                }),
                
                // Terminals from AuthService (Admin endpoint)
                axios.get(ADMIN_ENDPOINTS.TERMINALS, {
                    params: { per_page: 1000 },
                    headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
                }).catch(err => {
                    console.error('Error fetching terminals:', err);
                    return { data: { data: [] } };
                }),
                
                // Countries from AuthService
                axios.get(AUTH_ENDPOINTS.COUNTRIES, {
                    headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
                }).catch(err => {
                    console.error('Error fetching countries:', err);
                    return { data: { data: [] } };
                })
            ]);
            
            // Process merchants
            const merchants = merchantsRes.data?.data?.data || merchantsRes.data?.data || [];
            const merchantsArray = Array.isArray(merchants) ? merchants : [];
            setMerchantsList(merchantsArray);
            setFilteredMerchants(merchantsArray);
            
            // Process terminals
            const terminals = terminalsRes.data?.data?.data || terminalsRes.data?.data || [];
            const terminalsArray = Array.isArray(terminals) ? terminals : [];
            setTerminalsList(terminalsArray);
            setFilteredTerminals(terminalsArray);
            
            // Process countries
            const countriesData = countriesRes.data?.data || countriesRes.data || [];
            const countriesArray = Array.isArray(countriesData) ? countriesData : [];
            setCountriesList(countriesArray);
            setFilteredCountries(countriesArray);
            
            setDropdownsLoaded(true);
        } catch (error) {
            console.error('Error fetching filter dropdowns:', error);
            toast.error('Failed to load filter options');
        } finally {
            setDropdownsLoading(false);
        }
    };

    const handleMerchantSearch = (searchTerm) => {
        setMerchantSearchTerm(searchTerm);
        if (searchTerm.trim() === '') {
            setFilteredMerchants(merchantsList);
        } else {
            const filtered = merchantsList.filter(merchant =>
                (merchant.business_name || merchant.name || '').toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredMerchants(filtered);
        }
    };

    const handleMerchantSelect = (merchant) => {
        setSelectedMerchant(merchant);
        setShowMerchantList(false);
        setMerchantSearchTerm('');
        handleFilterChange('merchant_id', merchant.id);
    };

    const handleRemoveMerchant = () => {
        setSelectedMerchant(null);
        handleFilterChange('merchant_id', '');
    };

    const handleTerminalSearch = (searchTerm) => {
        setTerminalSearchTerm(searchTerm);
        if (searchTerm.trim() === '') {
            setFilteredTerminals(terminalsList);
        } else {
            const filtered = terminalsList.filter(terminal =>
                (terminal.name || terminal.terminal_id || '').toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredTerminals(filtered);
        }
    };

    const handleTerminalSelect = (terminal) => {
        setSelectedTerminal(terminal);
        setShowTerminalList(false);
        setTerminalSearchTerm('');
        handleFilterChange('terminal_id', terminal.id);
    };

    const handleRemoveTerminal = () => {
        setSelectedTerminal(null);
        handleFilterChange('terminal_id', '');
    };

    const handleCountrySearch = (searchTerm) => {
        setCountrySearchTerm(searchTerm);
        if (searchTerm.trim() === '') {
            setFilteredCountries(countriesList);
        } else {
            const filtered = countriesList.filter(country => {
                const countryName = typeof country.name === 'object' 
                    ? (country.name.en || country.name.ar || '')
                    : (country.name || country.text || '');
                return countryName.toLowerCase().includes(searchTerm.toLowerCase());
            });
            setFilteredCountries(filtered);
        }
    };

    const handleCountrySelect = (country) => {
        setSelectedCountry(country);
        setShowCountryList(false);
        setCountrySearchTerm('');
        handleFilterChange('country_id', country.id);
    };

    const handleRemoveCountry = () => {
        setSelectedCountry(null);
        handleFilterChange('country_id', '');
    };

    const fetchStatistics = async () => {
        setStatisticsLoading(true);
        try {
            const token = getToken();
            const params = {
                merchant_id: filters.merchant_id,
                date_from: filters.start_date,
                date_to: filters.end_date
            };

            const response = await axios.get(ADMIN_ENDPOINTS.TRANSACTION_STATISTICS, {
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
        const filterInfo = Object.values(filters).some(v => v) ? ' with current filters' : '';
        const exportMessage = `Export transactions${filterInfo}? Maximum 1000 transactions will be exported.`;
        
        const result = await Swal.fire({
            title: 'Export Transactions',
            text: exportMessage,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#28a745',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Export',
            cancelButtonText: 'Cancel'
        });

        if (result.isConfirmed) {
            try {
                // Show loading state with progress
                Swal.fire({
                    title: 'Exporting Transactions...',
                    html: '<div id="export-progress">Fetching transactions...</div>',
                    allowOutsideClick: false,
                    allowEscapeKey: false,
                    didOpen: () => {
                        Swal.showLoading();
                    }
                });

                // Progress callback to update UI
                const progressCallback = (message) => {
                    const progressEl = document.getElementById('export-progress');
                    if (progressEl) {
                        progressEl.textContent = message;
                    }
                };

                // Call export function from separate file
                const result = await exportTransactions(filters, urlType, progressCallback);

                // Close loading and show success
                Swal.close();
                toast.success(`Successfully exported ${result.count} transactions to Excel!`);
            } catch (error) {
                console.error('Export error:', error);
                Swal.close();
                toast.error(error.message || 'Failed to export transactions. Please try again.');
            }
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) {
            toast.warning('Please select records to delete');
            return;
        }

        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'Cancel'
        });

        if (result.isConfirmed) {
            try {
                const token = getToken();
                await axios.post(ADMIN_ENDPOINTS.TRANSACTION_BULK_DELETE || `${ADMIN_ENDPOINTS.TRANSACTIONS}/bulk-delete`, {
                    ids: selectedIds
                }, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json'
                    }
                });
                
                toast.success(`Successfully deleted ${selectedIds.length} transaction(s)`);
                setSelectedIds([]);
                fetchTransactions();
            } catch (error) {
                console.error('Bulk delete error:', error);
                toast.error('Failed to delete transactions');
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
            terminal_id: '',
            country_id: '',
            start_date: '',
            end_date: ''
        });
        setSelectedMerchant(null);
        setSelectedTerminal(null);
        setSelectedCountry(null);
        setPagination(prev => ({ ...prev, current_page: 1 }));
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(transactions.map(t => t.id));
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
            'APPROVED': 'badge-light-success',
            'DECLINED': 'badge-light-danger',
            'PENDING': 'badge-light-warning',
            'FAILED': 'badge-light-danger',
            'VOIDED': 'badge-light-secondary',
            'REFUNDED': 'badge-light-info',
            'PROCESSED': 'badge-light-success',
            'CAPTURED': 'badge-light-info',
            'CANCELLED': 'badge-light-secondary',
            'EXPIRED': 'badge-light-dark',
            'REVERSED': 'badge-light-dark'
        };
        return statusMap[status?.toUpperCase()] || 'badge-light-secondary';
    };

    const getActiveFiltersCount = () => {
        return Object.values(filters).filter(v => v).length;
    };

    const formatCount = (value) => {
        const numeric = Number(value ?? 0);
        return Number.isNaN(numeric) ? '0' : numeric.toLocaleString();
    };

    const formatAmount = (value) => {
        const numeric = Number(value ?? 0);
        return Number.isNaN(numeric)
            ? '0.00'
            : numeric.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    return (
        <>
            <style>{`
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
                .hover-bg-light:hover {
                    background-color: #f5f8fa;
                }
            `}</style>

            {/* Type Alert (for refund/void views) */}
            {urlType && (
                <div className="row g-5 g-xl-8 mb-4">
                    <div className="col-md-12">
                        <div className="alert alert-info d-flex align-items-center p-5">
                            <i className="ki-duotone ki-information fs-2hx text-info me-4">
                                <span className="path1"></span>
                                <span className="path2"></span>
                                <span className="path3"></span>
                            </i>
                            <div className="d-flex flex-column">
                                <h4 className="mb-1">{urlType.charAt(0).toUpperCase() + urlType.slice(1)} Transactions</h4>
                                <span>Showing transactions for type: {urlType}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Statistics Cards (only if no type filter) */}
            {!urlType && (
                <div className="row gy-5 g-xl-10 mb-5">
                    {/* Sale Transactions */}
                    <div className="col-xl-4">
                        <div className="card card-flush h-xl-100 bg-light-success">
                            <div className="card-header pt-5">
                                <h3 className="card-title align-items-start flex-column">
                                    <span className="card-label fw-bold text-gray-800">Sale Transactions</span>
                                    <span className="text-gray-500 mt-1 fw-semibold fs-6">Approved, Pending, Capture</span>
                                </h3>
                            </div>
                            <div className="card-body pt-2 row">
                                <div className="mb-2 col-6">
                                    <span className="fs-2hx fw-bold d-block text-gray-800 me-2 mb-1 lh-1 ls-n2">
                                        {statisticsLoading ? '...' : formatCount(statistics?.sale?.count)}
                                    </span>
                                    <span className="text-gray-500 fs-7 fw-semibold">Count</span>
                                </div>
                                <div className="mb-2 col-6 d-flex flex-column justify-content-center align-items-center">
                                    <span className="fs-2x fw-semibold text-success mb-1">
                                        ${statisticsLoading ? '...' : formatAmount(statistics?.sale?.amount)}
                                    </span>
                                    <span className="text-gray-500 fs-7 fw-semibold">Amount</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Refund Transactions */}
                    <div className="col-xl-4">
                        <div className="card card-flush h-xl-100 bg-light-danger">
                            <div className="card-header pt-5">
                                <h3 className="card-title align-items-start flex-column">
                                    <span className="card-label fw-bold text-gray-800">Refund Transactions</span>
                                    <span className="text-gray-500 mt-1 fw-semibold fs-6">Refunded transactions</span>
                                </h3>
                            </div>
                            <div className="card-body pt-2 row">
                                <div className="mb-2 col-6">
                                    <span className="fs-2hx fw-bold d-block text-gray-800 me-2 mb-1 lh-1 ls-n2">
                                        {statisticsLoading ? '...' : formatCount(statistics?.refund?.count)}
                                    </span>
                                    <span className="text-gray-500 fs-7 fw-semibold">Count</span>
                                </div>
                                <div className="mb-2 col-6 d-flex flex-column justify-content-center align-items-center">
                                    <span className="fs-2x fw-semibold text-danger mb-1">
                                        {statisticsLoading ? '...' : formatAmount(statistics?.refund?.amount)}
                                    </span>
                                    <span className="text-gray-500 fs-7 fw-semibold">Amount</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Void Transactions */}
                    <div className="col-xl-4">
                        <div className="card card-flush h-xl-100 bg-light-dark">
                            <div className="card-header pt-5">
                                <h3 className="card-title align-items-start flex-column">
                                    <span className="card-label fw-bold text-gray-800">Void Transactions</span>
                                    <span className="text-gray-500 mt-1 fw-semibold fs-6">Voided transactions</span>
                                </h3>
                            </div>
                            <div className="card-body pt-2 row">
                                <div className="mb-2 col-6">
                                    <span className="fs-2hx fw-bold d-block text-gray-800 me-2 mb-1 lh-1 ls-n2">
                                        {statisticsLoading ? '...' : formatCount(statistics?.void?.count)}
                                    </span>
                                    <span className="text-gray-500 fs-7 fw-semibold">Count</span>
                                </div>
                                <div className="mb-2 col-6 d-flex flex-column justify-content-center align-items-center">
                                    <span className="fs-2x fw-semibold text-dark mb-1">
                                        {statisticsLoading ? '...' : formatAmount(statistics?.void?.amount)}
                                    </span>
                                    <span className="text-gray-500 fs-7 fw-semibold">Amount</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Filters Card */}
            {showFilters && (
                <div className="card bg-white mb-5">
                    <div className="card-body">
                        <div className="row">
                            <div className="col-md-3 mb-3">
                                <label className="form-label">Search</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Transaction ID, RRN, Auth Code"
                                    value={filters.search}
                                    onChange={(e) => handleFilterChange('search', e.target.value)}
                                />
                            </div>
                            <div className="col-md-3 mb-3">
                                <label className="form-label">Status</label>
                                <select
                                    className="form-select"
                                    value={filters.status}
                                    onChange={(e) => handleFilterChange('status', e.target.value)}
                                >
                                    <option value="">All</option>
                                    <option value="APPROVED">APPROVED</option>
                                    <option value="DECLINED">DECLINED</option>
                                    <option value="PENDING">PENDING</option>
                                    <option value="FAILED">FAILED</option>
                                    <option value="PROCESSED">PROCESSED</option>
                                    <option value="REFUNDED">REFUNDED</option>
                                    <option value="CAPTURED">CAPTURED</option>
                                    <option value="VOIDED">VOIDED</option>
                                    <option value="CANCELLED">CANCELLED</option>
                                    <option value="EXPIRED">EXPIRED</option>
                                    <option value="REVERSED">REVERSED</option>
                                </select>
                            </div>
                            <div className="col-md-3 mb-3">
                                <label className="form-label">Merchant</label>
                                <div className="position-relative" ref={merchantDropdownRef}>
                                    <div 
                                        className="form-control h-50px d-flex align-items-center justify-content-between"
                                        onClick={() => {
                                            if (!dropdownsLoading) {
                                                setShowTerminalList(false);
                                                setShowCountryList(false);
                                                setShowMerchantList(!showMerchantList);
                                            }
                                        }}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <div className="d-flex align-items-center">
                                            {selectedMerchant ? (
                                                <span className="text-gray-800">{selectedMerchant.business_name || selectedMerchant.name}</span>
                                            ) : (
                                                <span className="text-muted">All Merchants</span>
                                            )}
                                        </div>
                                        <div className="d-flex align-items-center">
                                            {selectedMerchant && (
                                                <button 
                                                    type="button"
                                                    className="btn btn-icon btn-sm btn-light-danger me-2"
                                                    onClick={(e) => { e.stopPropagation(); handleRemoveMerchant(); }}
                                                >
                                                    <i className="ki-duotone ki-cross fs-2">
                                                        <span className="path1"></span>
                                                        <span className="path2"></span>
                                                    </i>
                                                </button>
                                            )}
                                            <i className={`ki-duotone ki-down fs-2 ${showMerchantList ? 'rotate-180' : ''}`}>
                                                <span className="path1"></span>
                                                <span className="path2"></span>
                                            </i>
                                        </div>
                                    </div>
                                    
                                    {showMerchantList && (
                                        <div className="position-absolute top-100 start-0 w-100 bg-white border rounded-3 shadow-sm mt-1" style={{ zIndex: 1000, maxHeight: '250px', overflowY: 'auto' }}>
                                            <div className="p-2">
                                                <input 
                                                    type="text" 
                                                    className="form-control form-control-sm mb-2" 
                                                    placeholder="Search merchants..."
                                                    value={merchantSearchTerm}
                                                    onChange={(e) => handleMerchantSearch(e.target.value)}
                                                    onClick={(e) => e.stopPropagation()}
                                                    autoFocus
                                                />
                                            </div>
                                            {filteredMerchants.length > 0 ? (
                                                filteredMerchants.map((merchant) => (
                                                    <div 
                                                        key={merchant.id}
                                                        className="p-3 border-bottom cursor-pointer hover-bg-light"
                                                        onMouseDown={(e) => { e.preventDefault(); handleMerchantSelect(merchant); }}
                                                        style={{ cursor: 'pointer' }}
                                                    >
                                                        <div className="text-gray-800">{merchant.business_name || merchant.name}</div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="p-3 text-muted text-center">
                                                    {dropdownsLoading ? 'Loading...' : 'No merchants found'}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="col-md-3 mb-3">
                                <label className="form-label">Terminal</label>
                                <div className="position-relative" ref={terminalDropdownRef}>
                                    <div 
                                        className="form-control h-50px d-flex align-items-center justify-content-between"
                                        onClick={() => {
                                            if (!dropdownsLoading) {
                                                setShowMerchantList(false);
                                                setShowCountryList(false);
                                                setShowTerminalList(!showTerminalList);
                                            }
                                        }}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <div className="d-flex align-items-center">
                                            {selectedTerminal ? (
                                                <span className="text-gray-800">{selectedTerminal.name || selectedTerminal.terminal_id || `Terminal ${selectedTerminal.id}`}</span>
                                            ) : (
                                                <span className="text-muted">All Terminals</span>
                                            )}
                                        </div>
                                        <div className="d-flex align-items-center">
                                            {selectedTerminal && (
                                                <button 
                                                    type="button"
                                                    className="btn btn-icon btn-sm btn-light-danger me-2"
                                                    onClick={(e) => { e.stopPropagation(); handleRemoveTerminal(); }}
                                                >
                                                    <i className="ki-duotone ki-cross fs-2">
                                                        <span className="path1"></span>
                                                        <span className="path2"></span>
                                                    </i>
                                                </button>
                                            )}
                                            <i className={`ki-duotone ki-down fs-2 ${showTerminalList ? 'rotate-180' : ''}`}>
                                                <span className="path1"></span>
                                                <span className="path2"></span>
                                            </i>
                                        </div>
                                    </div>
                                    
                                    {showTerminalList && (
                                        <div className="position-absolute top-100 start-0 w-100 bg-white border rounded-3 shadow-sm mt-1" style={{ zIndex: 1000, maxHeight: '250px', overflowY: 'auto' }}>
                                            <div className="p-2">
                                                <input 
                                                    type="text" 
                                                    className="form-control form-control-sm mb-2" 
                                                    placeholder="Search terminals..."
                                                    value={terminalSearchTerm}
                                                    onChange={(e) => handleTerminalSearch(e.target.value)}
                                                    onClick={(e) => e.stopPropagation()}
                                                    autoFocus
                                                />
                                            </div>
                                            {filteredTerminals.length > 0 ? (
                                                filteredTerminals.map((terminal) => (
                                                    <div 
                                                        key={terminal.id}
                                                        className="p-3 border-bottom cursor-pointer hover-bg-light"
                                                        onMouseDown={(e) => { e.preventDefault(); handleTerminalSelect(terminal); }}
                                                        style={{ cursor: 'pointer' }}
                                                    >
                                                        <div className="text-gray-800">{terminal.name || terminal.terminal_id || `Terminal ${terminal.id}`}</div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="p-3 text-muted text-center">
                                                    {dropdownsLoading ? 'Loading...' : 'No terminals found'}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="row mt-3">
                            <div className="col-md-3 mb-3">
                                <label className="form-label">Country</label>
                                <div className="position-relative" ref={countryDropdownRef}>
                                    <div 
                                        className="form-control h-50px d-flex align-items-center justify-content-between"
                                        onClick={() => {
                                            if (!dropdownsLoading) {
                                                setShowMerchantList(false);
                                                setShowTerminalList(false);
                                                setShowCountryList(!showCountryList);
                                            }
                                        }}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <div className="d-flex align-items-center">
                                            {selectedCountry ? (
                                                <span className="text-gray-800">
                                                    {typeof selectedCountry.name === 'object' 
                                                        ? (selectedCountry.name.en || selectedCountry.name.ar) 
                                                        : (selectedCountry.name || selectedCountry.text)}
                                                </span>
                                            ) : (
                                                <span className="text-muted">All Countries</span>
                                            )}
                                        </div>
                                        <div className="d-flex align-items-center">
                                            {selectedCountry && (
                                                <button 
                                                    type="button"
                                                    className="btn btn-icon btn-sm btn-light-danger me-2"
                                                    onClick={(e) => { e.stopPropagation(); handleRemoveCountry(); }}
                                                >
                                                    <i className="ki-duotone ki-cross fs-2">
                                                        <span className="path1"></span>
                                                        <span className="path2"></span>
                                                    </i>
                                                </button>
                                            )}
                                            <i className={`ki-duotone ki-down fs-2 ${showCountryList ? 'rotate-180' : ''}`}>
                                                <span className="path1"></span>
                                                <span className="path2"></span>
                                            </i>
                                        </div>
                                    </div>
                                    
                                    {showCountryList && (
                                        <div className="position-absolute top-100 start-0 w-100 bg-white border rounded-3 shadow-sm mt-1" style={{ zIndex: 1000, maxHeight: '250px', overflowY: 'auto' }}>
                                            <div className="p-2">
                                                <input 
                                                    type="text" 
                                                    className="form-control form-control-sm mb-2" 
                                                    placeholder="Search countries..."
                                                    value={countrySearchTerm}
                                                    onChange={(e) => handleCountrySearch(e.target.value)}
                                                    onClick={(e) => e.stopPropagation()}
                                                    autoFocus
                                                />
                                            </div>
                                            {filteredCountries.length > 0 ? (
                                                filteredCountries.map((country) => (
                                                    <div 
                                                        key={country.id}
                                                        className="p-3 border-bottom cursor-pointer hover-bg-light"
                                                        onMouseDown={(e) => { e.preventDefault(); handleCountrySelect(country); }}
                                                        style={{ cursor: 'pointer' }}
                                                    >
                                                        <div className="text-gray-800">
                                                            {typeof country.name === 'object' 
                                                                ? (country.name.en || country.name.ar) 
                                                                : (country.name || country.text)}
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="p-3 text-muted text-center">
                                                    {dropdownsLoading ? 'Loading...' : 'No countries found'}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="col-md-3 mb-3">
                                <label className="form-label">From Date</label>
                                <input
                                    ref={startDateRef}
                                    type="date"
                                    className="form-control"
                                    value={filters.start_date}
                                    onChange={(e) => handleFilterChange('start_date', e.target.value)}
                                    onClick={() => handleDateInputClick(startDateRef)}
                                    onFocus={() => handleDateInputClick(startDateRef)}
                                />
                            </div>
                            <div className="col-md-3 mb-3">
                                <label className="form-label">To Date</label>
                                <input
                                    ref={endDateRef}
                                    type="date"
                                    className="form-control"
                                    value={filters.end_date}
                                    onChange={(e) => handleFilterChange('end_date', e.target.value)}
                                    onClick={() => handleDateInputClick(endDateRef)}
                                    onFocus={() => handleDateInputClick(endDateRef)}
                                />
                            </div>
                            <div className="col-md-3 mb-3 d-flex align-items-end">
                                <button
                                    className="btn btn-secondary w-100"
                                    onClick={clearFilters}
                                >
                                    <i className="ki-duotone ki-filter-remove fs-3 me-1">
                                        <span className="path1"></span>
                                        <span className="path2"></span>
                                    </i>
                                    Clear Filters
                                </button>
                            </div>
                        </div>
                        {getActiveFiltersCount() > 0 && (
                            <div className="row mt-3">
                                <div className="col-12">
                                    <div className="text-muted fs-7">
                                        <i className="ki-duotone ki-filter fs-6 text-muted me-1">
                                            <span className="path1"></span>
                                            <span className="path2"></span>
                                        </i>
                                        <span>{getActiveFiltersCount()} active filter(s)</span>
                                    </div>
                                </div>
                            </div>
                        )}
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
                                placeholder="Quick search: Transaction ID, RRN, Auth Code..."
                                value={filters.search}
                                onChange={(e) => handleFilterChange('search', e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="card-toolbar">
                        {selectedIds.length > 0 && (
                            <div className="d-flex justify-content-end align-items-center">
                                <div className="fw-bolder me-5">
                                    <span className="me-2">{selectedIds.length}</span>Selected
                                </div>
                                <button
                                    type="button"
                                    className="btn btn-danger btn-sm"
                                    onClick={handleBulkDelete}
                                >
                                    Delete Selected
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
                                                checked={selectedIds.length === transactions.length && transactions.length > 0}
                                                onChange={handleSelectAll}
                                            />
                                        </div>
                                    </th>
                                    <th className="text-dark">Transaction ID</th>
                                    <th className="text-dark">Country</th>
                                    <th className="text-dark">Merchant</th>
                                    <th className="text-dark">Service</th>
                                    <th className="text-dark">Payment Type</th>
                                    <th className="text-dark">Payment Method</th>
                                    <th className="text-dark">Status</th>
                                    <th className="text-end text-dark">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    [...Array(pagination.per_page)].map((_, index) => (
                                        <tr key={`skeleton-${index}`}>
                                            <td><div className="skeleton" style={{width: '20px', height: '20px'}}></div></td>
                                            <td><div className="skeleton" style={{width: '80px', height: '16px'}}></div></td>
                                            <td><div className="skeleton" style={{width: '100px', height: '16px'}}></div></td>
                                            <td><div className="skeleton" style={{width: '150px', height: '16px'}}></div></td>
                                            <td><div className="skeleton" style={{width: '80px', height: '16px'}}></div></td>
                                            <td><div className="skeleton" style={{width: '120px', height: '16px'}}></div></td>
                                            <td><div className="skeleton" style={{width: '80px', height: '16px'}}></div></td>
                                            <td><div className="skeleton" style={{width: '80px', height: '24px', borderRadius: '6px'}}></div></td>
                                            <td className="text-end"><div className="skeleton" style={{width: '70px', height: '32px', borderRadius: '6px', marginLeft: 'auto'}}></div></td>
                                        </tr>
                                    ))
                                ) : transactions.length === 0 ? (
                                    <tr>
                                        <td colSpan="9" className="text-center py-10">
                                            <div className="text-gray-500">
                                                <i className="ki-duotone ki-file fs-3x mb-3">
                                                    <span className="path1"></span>
                                                    <span className="path2"></span>
                                                </i>
                                                <p className="fw-bold">No transactions found</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    transactions.map((transaction) => (
                                        <tr key={transaction.id}>
                                            <td>
                                                <div className="form-check form-check-sm form-check-custom form-check-solid">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        checked={selectedIds.includes(transaction.id)}
                                                        onChange={() => handleSelectRow(transaction.id)}
                                                    />
                                                </div>
                                            </td>
                                            <td>{transaction.transaction_id || transaction.id || 'N/A'}</td>
                                            <td>
                                                {(() => {
                                                    const merchantId = transaction.merchant?.id || transaction.merchant_id;
                                                    const countryLoading = Boolean(merchantId) && (merchantInfoLoading || hasPendingRequest(String(merchantId)));
                                                    const info = getMerchantInfo(transaction);
                                                    const record = merchantId ? getMerchantInfoById(String(merchantId)) : null;
                                                    
                                                    if (countryLoading && !record) {
                                                        return <div className="skeleton" style={{width: '80px', height: '16px'}}></div>;
                                                    }
                                                    return info.countryName;
                                                })()}
                                            </td>
                                            <td>
                                                {(() => {
                                                    const merchantId = transaction.merchant?.id || transaction.merchant_id;
                                                    const merchantLoading = Boolean(merchantId) && (merchantInfoLoading || hasPendingRequest(String(merchantId)));
                                                    const info = getMerchantInfo(transaction);
                                                    const record = merchantId ? getMerchantInfoById(String(merchantId)) : null;
                                                    
                                                    if (merchantLoading && !record) {
                                                        return <div className="skeleton" style={{width: '120px', height: '16px'}}></div>;
                                                    }
                                                    return info.merchantName;
                                                })()}
                                            </td>
                                            <td>N/A</td>
                                            <td>{transaction.payment_type || 'N/A'}</td>
                                            <td>{transaction.payment_method?.name || transaction.payment_method || 'N/A'}</td>
                                            <td>
                                                <span className={`badge ${getStatusBadgeClass(transaction.status)}`}>
                                                    {transaction.status || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="text-end">
                                                <button
                                                    className="btn btn-sm btn-light btn-active-light-primary"
                                                    onClick={() => navigate(`/admin/transactions/${transaction.id}`)}
                                                >
                                                    View
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {!loading && transactions.length > 0 && (
                        <div className="row mt-5">
                            <div className="col-sm-12 col-md-5 d-flex align-items-center">
                                <div className="dataTables_length">
                                    <label className="d-flex align-items-center">
                                        <span className="me-2">Show</span>
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
                                        <span className="ms-2">entries</span>
                                    </label>
                                </div>
                                <div className="ms-5">
                                    <span className="text-muted">
                                        Showing {((pagination.current_page - 1) * pagination.per_page) + 1} to {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of {pagination.total} entries
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
                                                Previous
                                            </button>
                                        </li>
                                        {[...Array(Math.min(pagination.last_page, 5))].map((_, i) => {
                                            const page = i + 1;
                                            return (
                                                <li key={page} className={`page-item ${pagination.current_page === page ? 'active' : ''}`}>
                                                    <button 
                                                        className="page-link" 
                                                        onClick={() => handlePageChange(page)}
                                                    >
                                                        {page}
                                                    </button>
                                                </li>
                                            );
                                        })}
                                        <li className={`page-item ${pagination.current_page === pagination.last_page ? 'disabled' : ''}`}>
                                            <button 
                                                className="page-link" 
                                                onClick={() => handlePageChange(pagination.current_page + 1)}
                                                disabled={pagination.current_page === pagination.last_page}
                                            >
                                                Next
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

export default AdminTransactionsIndex;

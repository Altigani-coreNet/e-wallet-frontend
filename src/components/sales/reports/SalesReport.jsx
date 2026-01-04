import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchSalesData } from '../../../services/reportsService';
import { getUsersForSelect } from '../../../services/usersService';
import useUserInfo from '../../../hooks/useUserInfo';
import { toast } from 'react-toastify';
import { useToolbar } from '../../../contexts/ToolbarContext';
import { get, getToken } from '../../../utils/api';
import { POS_ENDPOINTS } from '../../../utils/constants';
import SearchableDropdown from '../../common/filters/SearchableDropdown';

export default function SalesReport() {
    const navigate = useNavigate();
    const { setTitle, setBreadcrumbs, setActions } = useToolbar();
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        per_page: 15,
        total: 0,
    });

    const [sortConfig, setSortConfig] = useState({
        column: 'id',
        direction: 'desc',
    });

    // Filter states - separate temp filters from applied filters
    const [filters, setFilters] = useState({
        from_date: '',
        to_date: '',
        // column-based filters (table headers)
        id: '',
        reference_no: '',
        date: '',
        customer_id: '',
        user_id: '',
        qty: '',
        tax: '',
        total_price: '',
        grand_total: '',
        paid_amount: '',
        due: '',
        payment_method: '',
        payment_status: '',
    });
    const [appliedFilters, setAppliedFilters] = useState({
        from_date: '',
        to_date: '',
        id: '',
        reference_no: '',
        date: '',
        customer_id: '',
        user_id: '',
        qty: '',
        tax: '',
        total_price: '',
        grand_total: '',
        paid_amount: '',
        due: '',
        payment_method: '',
        payment_status: '',
    });
    const [showFilters, setShowFilters] = useState(false);
    // Track which rows are expanded to show extra detail
    const [expandedRows, setExpandedRows] = useState(new Set());
    // Dynamic list of "Filter By" rows so the user can add
    // as many column filters as needed (ID, Reference, Customer, etc.)
    const [filterRows, setFilterRows] = useState([
        { id: 1, column: '' },
    ]);
    
    // Dropdown lists
    const [customers, setCustomers] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [users, setUsers] = useState([]);
    const [loadingCustomers, setLoadingCustomers] = useState(false);
    const [loadingWarehouses, setLoadingWarehouses] = useState(false);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [exporting, setExporting] = useState(false);

    // User info lookup (batch from AuthService)
    const userIds = useMemo(() => {
        if (!sales || !sales.length) return [];
        return [
            ...new Set(
                sales
                    .map(sale =>
                        sale.user_id
                        ?? sale.created_by
                        ?? sale.creator_id
                        ?? sale.staff_id
                        ?? sale.staff?.id
                        ?? sale.user?.id
                        ?? null
                    )
                    .filter(id => id !== null && id !== undefined && id !== '')
                    .map(id => String(id))
            ),
        ];
    }, [sales]);
    // Build available tax values from current sales so the Tax filter
    // select is always in sync with data returned by the API
    const taxOptions = useMemo(() => {
        const values = new Set();
        sales.forEach((sale) => {
            if (sale.tax !== undefined && sale.tax !== null) {
                values.add(String(sale.tax));
            }
        });
        return Array.from(values).sort();
    }, [sales]);
    const {
        loading: userInfoLoading,
        getUserInfoById,
        hasPendingRequest: hasPendingUserRequest,
    } = useUserInfo(userIds);

    // Define server-side export function
    const exportToCSV = useCallback(async () => {
        try {
            setExporting(true);
            // Use shared token helper so we use the same key as the rest of the app
            const token = getToken();

            // If there is no auth token, do not call the export API
            if (!token) {
                setExporting(false);
                toast.error('You must be logged in to export the report.');
                // Optionally redirect to login route if your app uses one
                // navigate('/auth/login');
                return;
            }

            // Build query params, only include non-empty filters
            const params = new URLSearchParams();
            Object.keys(appliedFilters).forEach(key => {
                if (appliedFilters[key]) {
                    params.append(key, appliedFilters[key]);
                }
            });

            const response = await fetch(`${POS_ENDPOINTS.REPORTS_SALES_EXPORT}?${params}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'text/csv',
                },
            });

            if (response.status === 401) {
                // Unauthorized – treat as auth issue instead of generic error
                toast.error('Your session has expired. Please log in again to export the report.');
                // localStorage.removeItem('token'); // uncomment if you clear token on 401 globally
                // navigate('/auth/login');
                return;
            }

            if (!response.ok) {
                throw new Error('Export failed');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `sales-report-${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);
            toast.success('Report exported successfully');
        } catch (err) {
            console.error('Error exporting report:', err);
            toast.error('Failed to export report');
        } finally {
            setExporting(false);
        }
    }, [appliedFilters, navigate]);

    // Set page title and breadcrumbs
    useEffect(() => {
        setTitle('Sales Reports');
        setBreadcrumbs([
            { label: 'Dashboard', path: '/sales/dashboard' },
            { label: 'Reports', path: '#' },
            { label: 'Sales Reports', path: '/sales/reports/sales', active: true }
        ]);

        return () => {
            setBreadcrumbs([]);
        };
    }, [setTitle, setBreadcrumbs]);

    // Set toolbar actions (separate useEffect to avoid initialization order issue)
    useEffect(() => {
        setActions(
            <>
                <button 
                    className="btn btn-sm btn-light-primary" 
                    onClick={() => setShowFilters(!showFilters)}
                >
                    <i className={`bx ${showFilters ? 'bx-hide' : 'bx-filter'} me-1`}></i>
                    {showFilters ? 'Hide Filters' : 'Show Filters'}
                </button>
                <button 
                    className="btn btn-sm btn-success" 
                    onClick={exportToCSV}
                    disabled={exporting}
                >
                    <i className={`bx ${exporting ? 'bx-loader-alt bx-spin' : 'bx-download'} me-1`}></i>
                    {exporting ? 'Exporting...' : 'Export CSV'}
                </button>
            </>
        );

        return () => {
            setActions(null);
        };
    }, [setActions, showFilters, exportToCSV, sales.length]);

    useEffect(() => {
        fetchSales();
    }, [
        appliedFilters.from_date,
        appliedFilters.to_date,
        appliedFilters.customer_id,
        appliedFilters.user_id,
        appliedFilters.payment_status,
        appliedFilters.payment_method,
        pagination.current_page,
        sortConfig.column,
        sortConfig.direction,
    ]);

    // Fetch customers and warehouses lists
    useEffect(() => {
        fetchCustomers();
        fetchWarehouses();
        fetchUsers();
    }, []);

    const fetchCustomers = async () => {
        try {
            setLoadingCustomers(true);
            const response = await get(POS_ENDPOINTS.CUSTOMERS, {
                params: {
                    per_page: 1000, // Get all customers
                }
            });
            // Handle different response structures
            let customersData = [];
            if (response.data?.data) {
                if (Array.isArray(response.data.data)) {
                    customersData = response.data.data;
                } else if (response.data.data.data && Array.isArray(response.data.data.data)) {
                    customersData = response.data.data.data;
                } else if (response.data.data.customers && Array.isArray(response.data.data.customers)) {
                    customersData = response.data.data.customers;
                }
            }
            setCustomers(customersData);
        } catch (err) {
            console.error('Error fetching customers:', err);
        } finally {
            setLoadingCustomers(false);
        }
    };

    const fetchWarehouses = async () => {
        // Warehouses no longer shown in filters; keep silent no-op to avoid breaking calls
        setWarehouses([]);
    };

    const fetchUsers = async () => {
        try {
            setLoadingUsers(true);
            const response = await getUsersForSelect();
            const payload = response?.data;
            const usersData =
                payload?.data?.data ?? // common shape { data: { data: [...] } }
                payload?.data ??
                payload?.users ??
                payload ??
                [];
            setUsers(Array.isArray(usersData) ? usersData : []);
        } catch (err) {
            console.error('Error fetching users:', err);
        } finally {
            setLoadingUsers(false);
        }
    };

    const fetchSales = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await fetchSalesData({
                ...appliedFilters,
                page: pagination.current_page,
                per_page: pagination.per_page,
                sort_by: sortConfig.column,
                sort_direction: sortConfig.direction,
            });

            // Normalize possible response shapes:
            // - { data: { sales: [...], pagination: {...} } }
            // - { data: [...], pagination: {...} }
            // - { data: { data: [...], pagination: {...} } }
            const rawData = response?.data ?? {};
            const salesData =
                rawData.sales ||
                rawData.data?.sales ||
                rawData.data?.data ||
                rawData.data ||
                [];
            const paginationData =
                rawData.pagination ||
                rawData.data?.pagination ||
                pagination;
            
            setSales(Array.isArray(salesData) ? salesData : []);
            setPagination(paginationData);
        } catch (err) {
            console.error('Error fetching sales:', err);
            setError(err.response?.data?.message || 'Failed to load sales');
            toast.error('Failed to load sales data');
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleApplyFilters = () => {
        setAppliedFilters(filters);
        setPagination(prev => ({ ...prev, current_page: 1 }));
    };

    const handleSort = (column) => {
        const newDirection =
            sortConfig.column === column && sortConfig.direction === 'asc'
                ? 'desc'
                : 'asc';
        setSortConfig({ column, direction: newDirection });
        setPagination(prev => ({ ...prev, current_page: 1 }));
    };

    const handlePageChange = (page) => {
        setPagination(prev => ({ ...prev, current_page: page }));
    };

    const getPaymentStatusBadge = (status) => {
        const value = String(status || '').toLowerCase();
        const badges = {
            paid: 'badge bg-success',
            unpaid: 'badge bg-danger',
            partial: 'badge bg-warning',
            pending: 'badge bg-warning',
            cancelled: 'badge bg-secondary',
            canceled: 'badge bg-secondary',
        };
        return badges[value] || 'badge bg-secondary';
    };

    const getCustomerName = (sale) => {
        return sale.customer?.name
            || sale.customer_name
            || sale.customer
            || sale.customer_label
            || '-';
    };

    const getUserName = (sale) => {
        return sale.user?.name
            || sale.created_by?.name
            || sale.staff?.name
            || sale.user_name
            || sale.user
            || '';
    };

    const renderUserCell = (sale) => {
        const userId =
            sale.user_id ??
            sale.created_by ??
            sale.creator_id ??
            sale.staff_id ??
            sale.staff?.id ??
            sale.user?.id;

        const lookup = getUserInfoById(userId);
        if (lookup?.name) {
            return lookup.name;
        }

        const name = getUserName(sale);
        if (name) return name;

        if (userId && (userInfoLoading || hasPendingUserRequest(userId))) {
            return <span className="placeholder col-8 d-inline-block">&nbsp;</span>;
        }

        return '-';
    };

    const getQuantity = (sale) => {
        // Prefer total_qty; fall back to qty field from report payloads and other possibles
        return sale.total_qty
            ?? sale.qty
            ?? sale.total_items
            ?? sale.total_quantity
            ?? sale.quantity
            ?? 0;
    };

    const formatMoney = (value) => {
        const num = Number(value || 0);
        return `$${num.toFixed(2)}`;
    };

    const getPaymentMethod = (sale) => sale.payment_method || sale.payment_type || sale.payment_mode || '-';

    const getPaymentMethodBadgeClass = (methodRaw) => {
        if (!methodRaw) return 'badge bg-light text-muted';
        const method = String(methodRaw).toLowerCase();
        if (method === 'cash') return 'badge bg-light-primary text-primary';
        if (method === 'card') return 'badge bg-light-info text-info';
        if (method.includes('bank') || method.includes('transfer')) return 'badge bg-light-secondary text-secondary';
        if (method.includes('cheque') || method.includes('check')) return 'badge bg-light-warning text-warning';
        return 'badge bg-light text-muted';
    };

    const getSortIcon = (column) => {
        // Neutral: vertical arrow, Active: plain up/down arrows
        const style = { fontSize: '0.95rem', marginLeft: '6px' };
        if (sortConfig.column !== column) {
            return <span style={style} aria-hidden="true">↕</span>;
        }
        return sortConfig.direction === 'asc'
            ? <span style={style} aria-hidden="true">↑</span>
            : <span style={style} aria-hidden="true">↓</span>;
    };

    const toggleRowExpanded = (saleId) => {
        setExpandedRows(prev => {
            const next = new Set(prev);
            if (next.has(saleId)) {
                next.delete(saleId);
            } else {
                next.add(saleId);
            }
            return next;
        });
    };

    return (
        <>
            {/* Filters */}
            {showFilters && (
                <div className="card mb-4">
                    <div className="card-body">
                        {/* First block: From / To date as a 6-column filter with 5/5 inside */}
                        <div className="row g-3 mb-3">
                            <div className="col-md-6">
                                <div className="row g-2 align-items-end">
                                    <div className="col-5">
                                        <label className="form-label">From Date</label>
                                        <input
                                            type="date"
                                            name="from_date"
                                            className="form-control"
                                            value={filters.from_date}
                                            onChange={handleFilterChange}
                                        />
                                    </div>
                                    <div className="col-5">
                                        <label className="form-label">To Date</label>
                                        <input
                                            type="date"
                                            name="to_date"
                                            className="form-control"
                                            value={filters.to_date}
                                            onChange={handleFilterChange}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Dynamic “Filter By” blocks; each is col-md-6 with 5/5/2 inside */}
                            {filterRows.map((row, index) => {
                                const isFirst = index === 0;
                                const rowKey = row.id;
                                const column = row.column;
                                const updateColumn = (newColumn) => {
                                    setFilterRows(prev =>
                                        prev.map(r => (r.id === rowKey ? { ...r, column: newColumn } : r))
                                    );
                                    // Clear the field for that column so user starts fresh
                                    setFilters(prev => ({
                                        ...prev,
                                        ...(newColumn === 'id' ? { id: '' } : {}),
                                        ...(newColumn === 'reference_no' ? { reference_no: '' } : {}),
                                        ...(newColumn === 'date' ? { date: '' } : {}),
                                        ...(newColumn === 'customer' ? { customer_id: '' } : {}),
                                        ...(newColumn === 'user' ? { user_id: '' } : {}),
                                        ...(newColumn === 'qty' ? { qty: '' } : {}),
                                        ...(newColumn === 'tax' ? { tax: '' } : {}),
                                        ...(newColumn === 'total_price' ? { total_price: '' } : {}),
                                        ...(newColumn === 'grand_total' ? { grand_total: '' } : {}),
                                        ...(newColumn === 'paid_amount' ? { paid_amount: '' } : {}),
                                        ...(newColumn === 'due' ? { due: '' } : {}),
                                        ...(newColumn === 'payment_method' ? { payment_method: '' } : {}),
                                        ...(newColumn === 'payment_status' ? { payment_status: '' } : {}),
                                    }));
                                };

                                const clearThisFilter = () => {
                                    // Remove this entire filter row and clear its value from filters
                                    setFilterRows(prev => prev.filter(r => r.id !== rowKey));
                                    setFilters(prev => ({
                                        ...prev,
                                        id: column === 'id' ? '' : prev.id,
                                        reference_no: column === 'reference_no' ? '' : prev.reference_no,
                                        date: column === 'date' ? '' : prev.date,
                                        customer_id: column === 'customer' ? '' : prev.customer_id,
                                        user_id: column === 'user' ? '' : prev.user_id,
                                        qty: column === 'qty' ? '' : prev.qty,
                                        tax: column === 'tax' ? '' : prev.tax,
                                        total_price: column === 'total_price' ? '' : prev.total_price,
                                        grand_total: column === 'grand_total' ? '' : prev.grand_total,
                                        paid_amount: column === 'paid_amount' ? '' : prev.paid_amount,
                                        due: column === 'due' ? '' : prev.due,
                                        payment_method: column === 'payment_method' ? '' : prev.payment_method,
                                        payment_status: column === 'payment_status' ? '' : prev.payment_status,
                                    }));
                                };

                                return (
                                    <div key={rowKey} className="col-md-6">
                                        <div className="row g-2 align-items-end">
                                            <div className="col-5">
                                                <label className="form-label">Filter By</label>
                                                <select
                                                    className="form-select"
                                                    value={column}
                                                    onChange={(e) => updateColumn(e.target.value)}
                                                >
                                                    <option value="">Filter by…</option>
                                                    <option value="id">ID</option>
                                                    <option value="reference_no">Reference</option>
                                                    <option value="date">Date</option>
                                                    <option value="customer">Customer</option>
                                                    <option value="user">User</option>
                                                    <option value="qty">Qty</option>
                                                    <option value="tax">Tax</option>
                                                    <option value="total_price">Total Price</option>
                                                    <option value="grand_total">Grand Total</option>
                                                    <option value="paid_amount">Paid</option>
                                                    <option value="due">Due</option>
                                                    <option value="payment_method">Payment Method</option>
                                                    <option value="payment_status">Payment Status</option>
                                                </select>
                                            </div>

                                            <div className="col-5">
                                                {/* Dynamic field based on what we are filtering by */}
                                                {column === 'id' && (
                                                    <>
                                                        <label className="form-label">ID</label>
                                                        <input
                                                            type="text"
                                                            name="id"
                                                            className="form-control"
                                                            placeholder="Search by ID"
                                                            value={filters.id}
                                                            onChange={handleFilterChange}
                                                        />
                                                    </>
                                                )}

                                                {column === 'reference_no' && (
                                                    <>
                                                        <label className="form-label">Reference</label>
                                                        <input
                                                            type="text"
                                                            name="reference_no"
                                                            className="form-control"
                                                            placeholder="Search by reference"
                                                            value={filters.reference_no}
                                                            onChange={handleFilterChange}
                                                        />
                                                    </>
                                                )}

                                                {column === 'date' && (
                                                    <>
                                                        <label className="form-label">Date</label>
                                                        <input
                                                            type="date"
                                                            name="date"
                                                            className="form-control"
                                                            value={filters.date}
                                                            onChange={handleFilterChange}
                                                        />
                                                    </>
                                                )}

                                                {column === 'customer' && (
                                                    <SearchableDropdown
                                                        label="Customer"
                                                        placeholder="All Customers"
                                                        options={customers.map(customer => ({
                                                            value: customer.id,
                                                            label: customer.name || customer.customer_name || `Customer #${customer.id}`
                                                        }))}
                                                        selected={filters.customer_id || null}
                                                        onSelect={(option) => {
                                                            setFilters(prev => ({ ...prev, customer_id: option.value }));
                                                        }}
                                                        onClear={() => {
                                                            setFilters(prev => ({ ...prev, customer_id: '' }));
                                                        }}
                                                        disabled={loadingCustomers}
                                                        loading={loadingCustomers}
                                                        showClear={true}
                                                        name="customer_id"
                                                    />
                                                )}

                                                {column === 'user' && (
                                                    <SearchableDropdown
                                                        label="User"
                                                        placeholder="All Users"
                                                        options={users.map(user => ({
                                                            value: user.id,
                                                            label: user.name || user.email || `User #${user.id}`
                                                        }))}
                                                        selected={filters.user_id || null}
                                                        onSelect={(option) => {
                                                            setFilters(prev => ({ ...prev, user_id: option.value }));
                                                        }}
                                                        onClear={() => {
                                                            setFilters(prev => ({ ...prev, user_id: '' }));
                                                        }}
                                                        disabled={loadingUsers}
                                                        loading={loadingUsers}
                                                        showClear={true}
                                                        name="user_id"
                                                    />
                                                )}

                                                {column === 'tax' && (
                                                    <>
                                                        <label className="form-label">Tax</label>
                                                        <select
                                                            name="tax"
                                                            className="form-select"
                                                            value={filters.tax}
                                                            onChange={handleFilterChange}
                                                        >
                                                            <option value="">All</option>
                                                            {taxOptions.map((taxValue) => (
                                                                <option key={taxValue} value={taxValue}>
                                                                    {taxValue}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </>
                                                )}

                                                {column === 'payment_status' && (
                                                    <>
                                                        <label className="form-label">Payment Status</label>
                                                        <select
                                                            name="payment_status"
                                                            className="form-select"
                                                            value={filters.payment_status}
                                                            onChange={handleFilterChange}
                                                        >
                                                            <option value="">All</option>
                                                            <option value="paid">Paid</option>
                                                            <option value="unpaid">Unpaid</option>
                                                            <option value="partial">Partial</option>
                                                            <option value="pending">Pending</option>
                                                            <option value="canceled">Canceled</option>
                                                        </select>
                                                    </>
                                                )}

                                                {column === 'payment_method' && (
                                                    <>
                                                        <label className="form-label">Payment Method</label>
                                                        <input
                                                            type="text"
                                                            name="payment_method"
                                                            className="form-control"
                                                            placeholder="e.g. cash, card"
                                                            value={filters.payment_method}
                                                            onChange={handleFilterChange}
                                                        />
                                                    </>
                                                )}

                                                {column === 'qty' && (
                                                    <>
                                                        <label className="form-label">Qty</label>
                                                        <input
                                                            type="text"
                                                            name="qty"
                                                            className="form-control"
                                                            placeholder="Search by quantity"
                                                            value={filters.qty}
                                                            onChange={handleFilterChange}
                                                        />
                                                    </>
                                                )}

                                                {column === 'total_price' && (
                                                    <>
                                                        <label className="form-label">Total Price</label>
                                                        <input
                                                            type="text"
                                                            name="total_price"
                                                            className="form-control"
                                                            placeholder="Search by total price"
                                                            value={filters.total_price}
                                                            onChange={handleFilterChange}
                                                        />
                                                    </>
                                                )}

                                                {column === 'grand_total' && (
                                                    <>
                                                        <label className="form-label">Grand Total</label>
                                                        <input
                                                            type="text"
                                                            name="grand_total"
                                                            className="form-control"
                                                            placeholder="Search by grand total"
                                                            value={filters.grand_total}
                                                            onChange={handleFilterChange}
                                                        />
                                                    </>
                                                )}

                                                {column === 'paid_amount' && (
                                                    <>
                                                        <label className="form-label">Paid</label>
                                                        <input
                                                            type="text"
                                                            name="paid_amount"
                                                            className="form-control"
                                                            placeholder="Search by paid amount"
                                                            value={filters.paid_amount}
                                                            onChange={handleFilterChange}
                                                        />
                                                    </>
                                                )}

                                                {column === 'due' && (
                                                    <>
                                                        <label className="form-label">Due</label>
                                                        <input
                                                            type="text"
                                                            name="due"
                                                            className="form-control"
                                                            placeholder="Search by due"
                                                            value={filters.due}
                                                            onChange={handleFilterChange}
                                                        />
                                                    </>
                                                )}
                                            </div>

                                            <div className="col-2 d-flex align-items-end">
                                                <button
                                                    type="button"
                                                    className="btn btn-outline-secondary w-100"
                                                    onClick={clearThisFilter}
                                                    disabled={!column}
                                                    aria-label="Clear this filter"
                                                >
                                                    <i className="ki-outline ki-cross"></i>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Separate row with "Add filter" and Apply button */}
                        <div className="row align-items-center">
                            <div className="col-md-3 mb-2 mb-md-0">
                                <button
                                    type="button"
                                    className="btn btn-outline-secondary w-100"
                                    onClick={() =>
                                        setFilterRows(prev =>
                                            prev.length >= 4
                                                ? prev
                                                : [...prev, { id: Date.now() + prev.length, column: '' }]
                                        )
                                    }
                                    disabled={filterRows.length >= 4}
                                >
                                    + Add filter
                                </button>
                                {/* Shows up to 4 filter rows as requested */}
                            </div>
                            <div className="col-md-3">
                                <button className="btn btn-primary w-100" onClick={handleApplyFilters}>
                                    <i className="bx bx-check me-1"></i> Apply Filters
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Data Table */}
            <div className="card">
                <div className="card-body">
                    {error && (
                        <div className="alert alert-danger" role="alert">
                            {error}
                        </div>
                    )}
                    
                    <div className="table-responsive position-relative">
                        {loading && (
                            <div
                                className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-white bg-opacity-50"
                                style={{ zIndex: 5 }}
                            >
                                <div className="spinner-border text-primary" role="status" aria-label="Loading table data">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                            </div>
                        )}
                        <table className="table table-hover align-middle">
                            <thead>
                                <tr>
                                    <th style={{ width: '40px' }}></th>
                                    <th role="button" onClick={() => handleSort('id')}>
                                        <span className="d-inline-flex align-items-center">
                                            ID {getSortIcon('id')}
                                        </span>
                                    </th>
                                    <th role="button" onClick={() => handleSort('reference_no')}>
                                        <span className="d-inline-flex align-items-center">
                                            Reference {getSortIcon('reference_no')}
                                        </span>
                                    </th>
                                    <th role="button" onClick={() => handleSort('date')}>
                                        <span className="d-inline-flex align-items-center">
                                            Date {getSortIcon('date')}
                                        </span>
                                    </th>
                                    <th>Customer</th>
                                    <th role="button" onClick={() => handleSort('paid_amount')}>
                                        <span className="d-inline-flex align-items-center">
                                            Sale Amount {getSortIcon('paid_amount')}
                                        </span>
                                    </th>
                                    <th role="button" onClick={() => handleSort('tax')}>
                                        <span className="d-inline-flex align-items-center">
                                            Tax {getSortIcon('tax')}
                                        </span>
                                    </th>
                                    <th role="button" onClick={() => handleSort('grand_total')}>
                                        <span className="d-inline-flex align-items-center">
                                            Grand Total {getSortIcon('grand_total')}
                                        </span>
                                    </th>
                                    <th role="button" onClick={() => handleSort('due')}>
                                        <span className="d-inline-flex align-items-center">
                                            Due {getSortIcon('due')}
                                        </span>
                                    </th>
                                    <th role="button" onClick={() => handleSort('payment_method')}>
                                        <span className="d-inline-flex align-items-center">
                                            Payment Method {getSortIcon('payment_method')}
                                        </span>
                                    </th>
                                    <th role="button" onClick={() => handleSort('payment_status')}>
                                        <span className="d-inline-flex align-items-center">
                                            Status {getSortIcon('payment_status')}
                                        </span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading && sales.length === 0 ? (
                                    [...Array(5)].map((_, index) => (
                                        <tr key={`skeleton-${index}`}>
                                            <td><span className="placeholder col-2"></span></td>
                                            <td><span className="placeholder col-3"></span></td>
                                            <td><span className="placeholder col-6"></span></td>
                                            <td><span className="placeholder col-8"></span></td>
                                            <td><span className="placeholder col-8"></span></td>
                                            <td><span className="placeholder col-6"></span></td>
                                            <td><span className="placeholder col-6"></span></td>
                                            <td><span className="placeholder col-6"></span></td>
                                            <td><span className="placeholder col-7"></span></td>
                                            <td><span className="placeholder col-6"></span></td>
                                        </tr>
                                    ))
                                ) : sales.length > 0 ? (
                                    sales.map(sale => {
                                        const isExpanded = expandedRows.has(sale.id);
                                        return (
                                            <React.Fragment key={sale.id}>
                                                <tr>
                                                    <td>
                                                        <button
                                                            type="button"
                                                            className="btn btn-icon btn-light btn-sm"
                                                            onClick={() => toggleRowExpanded(sale.id)}
                                                            aria-label={isExpanded ? 'Hide details' : 'Show details'}
                                                        >
                                                            <i className={`ki-outline ${isExpanded ? 'ki-minus' : 'ki-plus'}`}></i>
                                                        </button>
                                                    </td>
                                                    <td>{sale.id}</td>
                                                    <td>
                                                        <button
                                                            type="button"
                                                            className="btn btn-link p-0 align-baseline"
                                                            onClick={() => navigate(`/sales/sales-report/${sale.id}`)}
                                                        >
                                                            {sale.reference_no}
                                                        </button>
                                                    </td>
                                                    <td>{sale.sale_date || sale.date}</td>
                                                    <td>{getCustomerName(sale)}</td>
                                                    <td>{formatMoney(sale.paid_amount ?? sale.paid)}</td>
                                                    <td>{formatMoney(sale.tax)}</td>
                                                    <td>{formatMoney(sale.grand_total)}</td>
                                                    <td>{formatMoney(sale.due)}</td>
                                                    <td>
                                                        <span className={getPaymentMethodBadgeClass(sale.payment_method || sale.payment_type)}>
                                                            {getPaymentMethod(sale)}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className={getPaymentStatusBadge(sale.payment_status)}>
                                                            {sale.payment_status || '-'}
                                                        </span>
                                                    </td>
                                                </tr>
                                                {isExpanded && (
                                                    <tr className="table-active">
                                                        <td></td>
                                                        <td colSpan="10">
                                                            <div className="row g-2 small">
                                                                <div className="col-md-3">
                                                                    <strong>Customer</strong>
                                                                    <div>{sale.customer_name || getCustomerName(sale)}</div>
                                                                </div>
                                                                <div className="col-md-3">
                                                                    <strong>User</strong>
                                                                    <div>{renderUserCell(sale)}</div>
                                                                </div>
                                                                <div className="col-md-3">
                                                                    <strong>Biller</strong>
                                                                    <div>{sale.biller || '-'}</div>
                                                                </div>
                                                                <div className="col-md-3">
                                                                    <strong>IDs</strong>
                                                                    <div className="text-muted">
                                                                        Sale ID: {sale.id} · Customer ID: {sale.customer_id ?? '-'}
                                                                    </div>
                                                                </div>
                                                                <div className="col-md-3">
                                                                    <strong>Quantity</strong>
                                                                    <div>{getQuantity(sale)}</div>
                                                                </div>
                                                                <div className="col-md-3">
                                                                    <strong>Total Price</strong>
                                                                    <div>{formatMoney(sale.total_price ?? sale.total_amount ?? sale.total)}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="13" className="text-center py-4">
                                            No sales found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {pagination.last_page > 1 && (
                        <nav className="mt-4">
                            <ul className="pagination justify-content-center">
                                <li className={`page-item ${pagination.current_page === 1 ? 'disabled' : ''}`}>
                                    <button
                                        className="page-link"
                                        onClick={() => handlePageChange(pagination.current_page - 1)}
                                        disabled={pagination.current_page === 1}
                                    >
                                        Previous
                                    </button>
                                </li>
                                {[...Array(pagination.last_page)].map((_, index) => (
                                    <li
                                        key={index + 1}
                                        className={`page-item ${pagination.current_page === index + 1 ? 'active' : ''}`}
                                    >
                                        <button
                                            className="page-link"
                                            onClick={() => handlePageChange(index + 1)}
                                        >
                                            {index + 1}
                                        </button>
                                    </li>
                                ))}
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
                        </nav>
                    )}
                </div>
            </div>
        </>
    );
}


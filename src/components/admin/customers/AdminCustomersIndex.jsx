import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import { ADMIN_ENDPOINTS } from '../../../utils/constants';
import { getToken } from '../../../utils/api';
import { useToolbar } from '../../../contexts/ToolbarContext';
import { useCan } from '../../../utils/permissions';
import useMerchantCountryInfo from '../../../hooks/useMerchantCountryInfo';
import CustomerFiltersPanel from './CustomerFiltersPanel';
import CustomerTableRow from './CustomerTableRow';
import CustomerImportModal from './CustomerImportModal';
import BulkActionBar from '../../common/BulkActionBar';

const AdminCustomersIndex = () => {
    const { setTitle, setActions } = useToolbar();
    const canCreateCustomer = useCan('sales.customers.create_customers');
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);
    const [pagination, setPagination] = useState({
        current_page: 1,
        per_page: 15,
        total: 0,
        last_page: 1
    });
    const [filters, setFilters] = useState({
        search: '',
        status: '',
        merchant_id: '',
        country_id: '',
        date_from: '',
        date_to: ''
    });

    useEffect(() => {
        setTitle('Customers Management');
        setActions(
            <div className="d-flex align-items-center gap-2 gap-lg-3">
                {/* Toggle Filters Button */}
                <button
                    id="filters_button"
                    className="btn btn-sm btn-flex btn-secondary fw-bold"
                    onClick={() => setShowFilters(!showFilters)}
                >
                    <i className={`ki-duotone ki-filter fs-6 text-muted me-1 ${showFilters ? '' : 'rotate-90'}`}>
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    Toggle Filters
                </button>

                {/* Import Button */}
                <button
                    type="button"
                    className="btn btn-sm fw-bold btn-success"
                    onClick={() => setShowImportModal(true)}
                >
                    <i className="ki-duotone ki-file-up fs-3">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    Import Customers
                </button>

                {/* Export Button */}
                <button
                    type="button"
                    className="btn btn-sm fw-bold btn-success"
                    onClick={handleExport}
                >
                    <i className="ki-duotone ki-download fs-3">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    Export
                </button>

                {/* Add Customer Button */}
                {canCreateCustomer && (
                    <Link to="/admin/customers/create" className="btn btn-sm fw-bold btn-primary">
                        <i className="ki-duotone ki-plus fs-3">
                            <span className="path1"></span>
                            <span className="path2"></span>
                        </i>
                        Add Customer
                    </Link>
                )}
            </div>
        );
        return () => setActions(null);
    }, [setTitle, setActions, showFilters]);

    useEffect(() => {
        fetchCustomers();
    }, [pagination.current_page, pagination.per_page]);

    const getShopId = (customer) => {
        if (!customer) return '';
        return (
            customer.shop_id ??
            customer.merchant_id ??
            customer.shopId ??
            customer.merchantId ??
            customer.shop?.id ??
            customer.merchant?.id ??
            ''
        );
    };

    const customerMerchantIds = useMemo(() => {
        if (!customers.length) return [];
        return [
            ...new Set(
                customers
                    .map((customer) => getShopId(customer))
                    .filter((id) => id !== null && id !== undefined && id !== '')
                    .map((id) => String(id))
            ),
        ];
    }, [customers]);

    const {
        loading: merchantInfoLoading,
        getMerchantInfoById,
        hasPendingRequest,
    } = useMerchantCountryInfo(customerMerchantIds);

    const getMerchantInfo = useCallback(
        (shopId, customer) => {
            if (!shopId) {
                return {
                    merchantName: customer?.merchant?.name || customer?.merchant_name || '',
                    countryName: customer?.country?.name || customer?.country_name || '',
                };
            }
            const record = getMerchantInfoById(shopId);
            if (record) {
                return {
                    merchantName: record.name || '',
                    countryName: record.countryName || '',
                };
            }
            return { merchantName: '', countryName: '' };
        },
        [getMerchantInfoById]
    );

    const fetchCustomers = async () => {
        setLoading(true);
        try {
            const token = getToken();
            const params = {
                page: pagination.current_page,
                per_page: pagination.per_page,
                ...filters
            };

            const response = await axios.get(ADMIN_ENDPOINTS.CUSTOMERS, {
                params,
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const isSuccess = response.data.success || response.data.status;
            if (isSuccess) {
                setCustomers(response.data.data.data || []);
                setPagination({
                    current_page: response.data.data.current_page,
                    per_page: response.data.data.per_page,
                    total: response.data.data.total,
                    last_page: response.data.data.last_page
                });
            }
        } catch (error) {
            toast.error('Failed to load customers');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            const token = getToken();
            const response = await axios.get(ADMIN_ENDPOINTS.CUSTOMER_EXPORT, {
                params: filters,
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const isSuccess = response.data.success || response.data.status;
            if (isSuccess && response.data.data) {
                const { data, filename } = response.data.data;
                
                if (!data || data.length === 0) {
                    toast.error('No data to export');
                    return;
                }

                // Convert to CSV
                const headers = Object.keys(data[0]);
                let csvContent = headers.join(',') + '\n';
                
                data.forEach(row => {
                    const values = headers.map(header => {
                        const value = row[header];
                        if (value === null || value === undefined) return '';
                        const stringValue = String(value);
                        if (stringValue.includes(',') || stringValue.includes('"')) {
                            return '"' + stringValue.replace(/"/g, '""') + '"';
                        }
                        return stringValue;
                    });
                    csvContent += values.join(',') + '\n';
                });

                // Download
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.setAttribute('download', filename || 'customers_export.csv');
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(link.href);
                
                toast.success('Export successful!');
            } else {
                toast.error('No data to export');
            }
        } catch (error) {
            toast.error('Export failed');
            console.error(error);
        }
    };

    const handleFilterChange = (newFilters) => {
        setFilters(newFilters);
    };

    const handleClearFilters = () => {
        setFilters({
            search: '',
            status: '',
            merchant_id: '',
            country_id: '',
            date_from: '',
            date_to: ''
        });
        setTimeout(() => fetchCustomers(), 100);
    };

    const handleApplyFilters = () => {
        setPagination({ ...pagination, current_page: 1 });
        fetchCustomers();
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(customers.map(c => c.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (id, checked) => {
        if (checked) {
            setSelectedIds([...selectedIds, id]);
        } else {
            setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;

        if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} customer(s)?`)) {
            return;
        }

        try {
            const token = getToken();
            const response = await axios.post(
                ADMIN_ENDPOINTS.CUSTOMER_BULK_DELETE,
                { ids: selectedIds },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            const isSuccess = response.data.success || response.data.status;
            if (isSuccess) {
                toast.success(`${selectedIds.length} customer(s) deleted successfully`);
                setSelectedIds([]);
                fetchCustomers();
            }
        } catch (error) {
            toast.error('Failed to delete customers');
            console.error(error);
        }
    };

    const handleToggleStatus = async (id) => {
        try {
            const token = getToken();
            const response = await axios.post(
                ADMIN_ENDPOINTS.CUSTOMER_TOGGLE_STATUS(id),
                {},
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            const isSuccess = response.data.success || response.data.status;
            if (isSuccess) {
                toast.success('Customer status updated successfully');
                fetchCustomers();
            }
        } catch (error) {
            toast.error('Failed to update customer status');
            console.error(error);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this customer?')) {
            return;
        }

        try {
            const token = getToken();
            const response = await axios.delete(
                `${ADMIN_ENDPOINTS.CUSTOMERS}/${id}`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            const isSuccess = response.data.success || response.data.status;
            if (isSuccess) {
                toast.success('Customer deleted successfully');
                fetchCustomers();
            }
        } catch (error) {
            toast.error('Failed to delete customer');
            console.error(error);
        }
    };

    return (
        <>
            <div className="post d-flex flex-column-fluid">
                <div id="kt_content_container" className="container-xxl">
                    {/* Filters Panel */}
                    <CustomerFiltersPanel
                        isVisible={showFilters}
                        filters={filters}
                        onFilterChange={handleFilterChange}
                        onClearFilters={handleClearFilters}
                        onApply={handleApplyFilters}
                    />

                    {/* Main Card */}
                    <div className="card">
                        {/* Card Header */}
                        <div className="card-header border-0 pt-6">
                            <div className="card-title"></div>
                            <div className="card-toolbar">
                                {/* Bulk Action Bar */}
                                {selectedIds.length > 0 ? (
                                    <BulkActionBar
                                        selectedCount={selectedIds.length}
                                        onClear={() => setSelectedIds([])}
                                        onDelete={handleBulkDelete}
                                    />
                                ) : null}
                            </div>
                        </div>

                        {/* Card Body */}
                        <div className="card-body pt-0">
                            {loading ? (
                                <div className="text-center py-10">
                                    <span className="spinner-border text-primary"></span>
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table align-middle table-row-dashed fs-6 gy-5">
                                        <thead>
                                            <tr className="text-start text-gray-400 fw-bold fs-7 text-uppercase gs-0">
                                                <th className="w-10px pe-2">
                                                    <div className="form-check form-check-sm form-check-custom form-check-solid me-3">
                                                        <input
                                                            className="form-check-input"
                                                            type="checkbox"
                                                            checked={selectedIds.length === customers.length && customers.length > 0}
                                                            onChange={handleSelectAll}
                                                        />
                                                    </div>
                                                </th>
                                                <th className="text-dark">ID</th>
                                                <th className="min-w-200px text-dark">Customer</th>
                                                <th className="text-dark">Phone</th>
                                                <th className="text-dark">Merchant</th>
                                                <th className="min-w-125px text-dark">Address</th>
                                                <th className="text-dark">Country</th>
                                                <th className="text-dark">Status</th>
                                                <th className="text-dark">Created</th>
                                                <th className="text-end text-dark">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-gray-600 fw-semibold">
                                            {customers.map((customer, index) => {
                                                const shopId = getShopId(customer);
                                                const merchantInfo = getMerchantInfo(shopId, customer);
                                                const merchantLoading = Boolean(shopId) && (merchantInfoLoading || hasPendingRequest(shopId)) && !merchantInfo.merchantName;
                                                const countryLoading = Boolean(shopId) && (merchantInfoLoading || hasPendingRequest(shopId)) && !merchantInfo.countryName;

                                                return (
                                                    <CustomerTableRow
                                                        key={customer.id}
                                                        customer={customer}
                                                        rowNumber={((pagination.current_page - 1) * pagination.per_page) + index + 1}
                                                        isSelected={selectedIds.includes(customer.id)}
                                                        onSelect={handleSelectOne}
                                                        onToggleStatus={handleToggleStatus}
                                                        onDelete={handleDelete}
                                                        merchantInfo={merchantInfo}
                                                        merchantLoading={merchantLoading}
                                                        countryLoading={countryLoading}
                                                    />
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Pagination */}
                            {!loading && customers.length > 0 && (
                                <div className="d-flex flex-stack flex-wrap pt-10">
                                    <div className="fs-6 fw-semibold text-gray-700">
                                        Showing {((pagination.current_page - 1) * pagination.per_page) + 1} to {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of {pagination.total} entries
                                    </div>
                                    <ul className="pagination">
                                        <li className={`page-item ${pagination.current_page === 1 ? 'disabled' : ''}`}>
                                            <button
                                                className="page-link"
                                                onClick={() => setPagination({ ...pagination, current_page: pagination.current_page - 1 })}
                                                disabled={pagination.current_page === 1}
                                            >
                                                Previous
                                            </button>
                                        </li>
                                        {[...Array(pagination.last_page)].map((_, idx) => {
                                            const pageNum = idx + 1;
                                            if (
                                                pageNum === 1 ||
                                                pageNum === pagination.last_page ||
                                                (pageNum >= pagination.current_page - 1 && pageNum <= pagination.current_page + 1)
                                            ) {
                                                return (
                                                    <li key={pageNum} className={`page-item ${pagination.current_page === pageNum ? 'active' : ''}`}>
                                                        <button
                                                            className="page-link"
                                                            onClick={() => setPagination({ ...pagination, current_page: pageNum })}
                                                        >
                                                            {pageNum}
                                                        </button>
                                                    </li>
                                                );
                                            } else if (
                                                pageNum === pagination.current_page - 2 ||
                                                pageNum === pagination.current_page + 2
                                            ) {
                                                return <li key={pageNum} className="page-item disabled"><span className="page-link">...</span></li>;
                                            }
                                            return null;
                                        })}
                                        <li className={`page-item ${pagination.current_page === pagination.last_page ? 'disabled' : ''}`}>
                                            <button
                                                className="page-link"
                                                onClick={() => setPagination({ ...pagination, current_page: pagination.current_page + 1 })}
                                                disabled={pagination.current_page === pagination.last_page}
                                            >
                                                Next
                                            </button>
                                        </li>
                                    </ul>
                                </div>
                            )}

                            {/* No Results */}
                            {!loading && customers.length === 0 && (
                                <div className="text-center py-10">
                                    <p className="text-gray-600 fs-4">No customers found</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Import Modal */}
            <CustomerImportModal
                isOpen={showImportModal}
                onClose={() => setShowImportModal(false)}
                onImportSuccess={fetchCustomers}
            />
        </>
    );
};

export default AdminCustomersIndex;

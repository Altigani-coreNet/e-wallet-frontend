import React, { useState, useEffect, useRef } from 'react';
import Select from 'react-select';
import { searchCustomers } from '../../../services/customersService';
import { getUsersForSelect } from '../../../services/usersService';

const SalesFiltersPanel = ({ filters, setFilters }) => {
    const [customerOptions, setCustomerOptions] = useState([]);
    const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
    const [userOptions, setUserOptions] = useState([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);
    const dateFromRef = useRef(null);
    const dateToRef = useRef(null);

    // Initialize flatpickr for date inputs
    useEffect(() => {
        // Wait for flatpickr to be available and refs to be set
        const initDatePickers = () => {
            if (window.flatpickr && dateFromRef.current && dateToRef.current) {
                // Initialize date from picker
                const dateFromPicker = window.flatpickr(dateFromRef.current, {
                    dateFormat: 'Y-m-d',
                    onChange: (selectedDates, dateStr) => {
                        setFilters(prev => ({
                            ...prev,
                            date_from: dateStr
                        }));
                    }
                });

                // Initialize date to picker
                const dateToPicker = window.flatpickr(dateToRef.current, {
                    dateFormat: 'Y-m-d',
                    onChange: (selectedDates, dateStr) => {
                        setFilters(prev => ({
                            ...prev,
                            date_to: dateStr
                        }));
                    }
                });

                // Cleanup on unmount
                return () => {
                    if (dateFromPicker) dateFromPicker.destroy();
                    if (dateToPicker) dateToPicker.destroy();
                };
            }
        };

        // Try to initialize immediately
        const cleanup = initDatePickers();
        
        // If not ready, try again after a short delay
        if (!cleanup) {
            const timer = setTimeout(() => {
                initDatePickers();
            }, 100);
            return () => clearTimeout(timer);
        }

        return cleanup;
    }, [setFilters]);

    // Load initial customers and users
    useEffect(() => {
        loadCustomers('');
        loadUsers('');
    }, []);

    const loadCustomers = async (searchTerm) => {
        setIsLoadingCustomers(true);
        try {
            const response = await searchCustomers(searchTerm);
            if (response.success && response.data) {
                const customers = Array.isArray(response.data) ? response.data : 
                                response.data.customers || response.data.data || [];
                const options = customers.map(customer => ({
                    value: customer.id,
                    label: customer.name || `${customer.first_name || ''} ${customer.last_name || ''}`.trim()
                }));
                setCustomerOptions(options);
            }
        } catch (err) {
            console.error('Error fetching customers:', err);
        } finally {
            setIsLoadingCustomers(false);
        }
    };

    const loadUsers = async (searchTerm) => {
        setIsLoadingUsers(true);
        try {
            const response = await getUsersForSelect(searchTerm);
            if (response.success && response.data) {
                const users = Array.isArray(response.data) ? response.data : 
                             response.data.users || response.data.data || [];
                const options = users.map(user => ({
                    value: user.id,
                    label: user.name || user.email || `User #${user.id}`
                }));
                setUserOptions(options);
            }
        } catch (err) {
            console.error('Error fetching users:', err);
        } finally {
            setIsLoadingUsers(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleCustomerChange = (selectedOption) => {
        setFilters(prev => ({
            ...prev,
            customer_id: selectedOption ? selectedOption.value : ''
        }));
    };

    const handleCustomerInputChange = (inputValue, { action }) => {
        if (action === 'input-change') {
            loadCustomers(inputValue);
        }
    };

    const handleUserChange = (selectedOption) => {
        setFilters(prev => ({
            ...prev,
            user_id: selectedOption ? selectedOption.value : ''
        }));
    };

    const handleUserInputChange = (inputValue, { action }) => {
        if (action === 'input-change') {
            loadUsers(inputValue);
        }
    };

    return (
        <div className="card card-flush mb-5">
            <div className="card-header pt-5">
                <h3 className="card-title align-items-start flex-column">
                    <span className="card-label fw-bold text-dark">Filters</span>
                    <span className="text-muted mt-1 fw-semibold fs-7">Filter sales by criteria</span>
                </h3>
            </div>
            <div className="card-body pt-0">
                <div className="row g-4">
                    {/* Search */}
                    <div className="col-md-3">
                        <label className="form-label fw-semibold">Product Search</label>
                        <input
                            type="text"
                            name="search"
                            className="form-control form-control-sm"
                            placeholder="Product name or SKU"
                            value={filters.search}
                            onChange={handleInputChange}
                        />
                    </div>

                    {/* Customer */}
                    <div className="col-md-3">
                        <label className="form-label fw-semibold">Customer</label>
                        <Select
                            isClearable
                            isSearchable
                            placeholder="Search customer..."
                            options={customerOptions}
                            value={customerOptions.find(opt => opt.value === filters.customer_id) || null}
                            onChange={handleCustomerChange}
                            onInputChange={handleCustomerInputChange}
                            isLoading={isLoadingCustomers}
                            styles={{
                                control: (base) => ({
                                    ...base,
                                    minHeight: '38px',
                                    fontSize: '0.875rem'
                                }),
                                menu: (base) => ({
                                    ...base,
                                    zIndex: 9999
                                })
                            }}
                            className="react-select-container"
                            classNamePrefix="react-select"
                        />
                    </div>

                    {/* User */}
                    <div className="col-md-3">
                        <label className="form-label fw-semibold">User</label>
                        <Select
                            isClearable
                            isSearchable
                            placeholder="Search user..."
                            options={userOptions}
                            value={userOptions.find(opt => opt.value === filters.user_id) || null}
                            onChange={handleUserChange}
                            onInputChange={handleUserInputChange}
                            isLoading={isLoadingUsers}
                            styles={{
                                control: (base) => ({
                                    ...base,
                                    minHeight: '38px',
                                    fontSize: '0.875rem'
                                }),
                                menu: (base) => ({
                                    ...base,
                                    zIndex: 9999
                                })
                            }}
                            className="react-select-container"
                            classNamePrefix="react-select"
                        />
                    </div>

                    {/* Date From */}
                    <div className="col-md-3">
                        <label className="form-label fw-semibold">Date From</label>
                        <input
                            ref={dateFromRef}
                            type="text"
                            name="date_from"
                            className="form-control form-control-sm"
                            placeholder="Select date"
                            value={filters.date_from}
                            readOnly
                        />
                    </div>

                    {/* Date To */}
                    <div className="col-md-3">
                        <label className="form-label fw-semibold">Date To</label>
                        <input
                            ref={dateToRef}
                            type="text"
                            name="date_to"
                            className="form-control form-control-sm"
                            placeholder="Select date"
                            value={filters.date_to}
                            readOnly
                        />
                    </div>

                    {/* Payment Type */}
                    <div className="col-md-3">
                        <label className="form-label fw-semibold">Payment Type</label>
                        <select
                            name="payment_method"
                            className="form-select form-select-sm"
                            value={filters.payment_method}
                            onChange={handleInputChange}
                        >
                            <option value="">All</option>
                            <option value="cash">Cash</option>
                            <option value="card">Card</option>
                            <option value="payment_link">Payment Link</option>
                            <option value="qr_code">QR Code</option>
                        </select>
                    </div>

                    {/* Payment Status */}
                    <div className="col-md-3">
                        <label className="form-label fw-semibold">Status</label>
                        <select
                            name="payment_status"
                            className="form-select form-select-sm"
                            value={filters.payment_status}
                            onChange={handleInputChange}
                        >
                            <option value="">All</option>
                            <option value="0">Draft</option>
                            <option value="1">Paid</option>
                            <option value="2">Partially Paid</option>
                            <option value="3">Unpaid</option>
                            <option value="5">Canceled</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SalesFiltersPanel;



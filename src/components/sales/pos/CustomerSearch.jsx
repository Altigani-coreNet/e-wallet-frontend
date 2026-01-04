import React, { useState, useCallback, useRef } from 'react';
import usePosStore from '../../../stores/usePosStore';
import CustomerCreateModal from './CustomerCreateModal';

const CustomerSearch = ({ disabled = false }) => {
    const { 
        customers,
        selectedCustomer,
        customersLoading,
        fetchCustomers,
        selectCustomer
    } = usePosStore();

    const [customerSearchTerm, setCustomerSearchTerm] = useState('');
    const [showCustomerList, setShowCustomerList] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const customerSearchRef = useRef(null);

    // Debounce function for customer search
    const debounce = (func, delay) => {
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(null, args), delay);
        };
    };

    // Debounced customer search function
    const debouncedCustomerSearch = useCallback(
        debounce(async (searchTerm) => {
            if (searchTerm.length >= 2) {
                await fetchCustomers(searchTerm);
            } else if (searchTerm.length === 0) {
                await fetchCustomers();
            }
        }, 500), // 500ms delay
        [fetchCustomers]
    );

    const handleCustomerSearch = (searchTerm) => {
        debouncedCustomerSearch(searchTerm);
        setShowCustomerList(true); // Show customer list when searching
    };

    const handleCustomerSelect = (customer) => {
        selectCustomer(customer);
        setCustomerSearchTerm(customer.name);
        setShowCustomerList(false);
    };

    const handleAddNewCustomer = () => {
        setShowCreateModal(true);
    };

    const handleCustomerCreated = (newCustomer) => {
        selectCustomer(newCustomer);
        setTimeout(() => {
            if (customerSearchRef.current) {
                customerSearchRef.current.focus();
            }
        }, 100);
    };

    const handleRemoveCustomer = () => {
        selectCustomer(null);
        setCustomerSearchTerm('');
        setShowCustomerList(false);
        setTimeout(() => {
            if (customerSearchRef.current) {
                customerSearchRef.current.focus();
            }
        }, 100);
    };

    return (
        <div className="customer-section mb-5">
            {/*begin::Customer Selection*/}
            <div className="d-flex flex-column">
                <h4 className="fw-bold text-gray-800 mb-2 fs-5">Customer</h4>
                
                {/*begin::Customer Search and Select*/}
                <div className="d-flex gap-2 mb-2">
                    <div className="flex-grow-1 position-relative">
                        <input 
                            ref={customerSearchRef}
                            type="text" 
                            className={`form-control h-40px ${selectedCustomer ? 'bg-light-success border-success' : ''}`}
                            placeholder="Search customers..."
                            value={customerSearchTerm}
                            onChange={(e) => {
                                const value = e.target.value;
                                setCustomerSearchTerm(value);
                                handleCustomerSearch(value);
                            }}
                            onFocus={() => {
                                if (customers.length > 0) {
                                    setShowCustomerList(true);
                                }
                            }}
                            onBlur={() => {
                                setTimeout(() => {
                                    setShowCustomerList(false);
                                }, 200);
                            }}
                            disabled={customersLoading || disabled}
                        />
                        {selectedCustomer && (
                            <button
                                type="button"
                                className="btn btn-icon btn-sm btn-light-danger position-absolute top-50 end-0 translate-middle-y me-2"
                                onClick={handleRemoveCustomer}
                                style={{ zIndex: 10 }}
                            >
                                <i className="ki-duotone ki-cross fs-3">
                                    <span className="path1"></span>
                                    <span className="path2"></span>
                                </i>
                            </button>
                        )}
                        {customersLoading && (
                            <div className="position-absolute top-50 end-0 translate-middle-y me-3">
                                <div className="spinner-border spinner-border-sm" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                            </div>
                        )}
                        
                        {/*begin::Customer Dropdown*/}
                        {showCustomerList && customers.length > 0 && (
                            <div className="position-absolute top-100 start-0 w-100 bg-white border rounded-3 shadow-sm mt-1" style={{ zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }}>
                                {customers.map((customer) => (
                                    <div 
                                        key={customer.id}
                                        className="p-2 border-bottom cursor-pointer hover-bg-light"
                                        onClick={() => handleCustomerSelect(customer)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <div className="fw-bold text-gray-800 fs-7">{customer.name}</div>
                                        <div className="text-muted fs-8">{customer.email}</div>
                                        {customer.phone && (
                                            <div className="text-muted fs-8">{customer.phone}</div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    
                    <button 
                        type="button"
                        className="btn btn-primary h-40px px-3"
                        onClick={handleAddNewCustomer}
                        disabled={disabled}
                        title="Add New Customer"
                    >
                        <i className="ki-duotone ki-user-edit fs-3">
                            <span className="path1"></span>
                            <span className="path2"></span>
                            <span className="path3"></span>
                        </i>
                    </button>
                </div>
                {/*end::Customer Search and Select*/}
            </div>
            {/*end::Customer Selection*/}
            
            {/* Customer Create Modal */}
            <CustomerCreateModal 
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onCustomerCreated={handleCustomerCreated}
            />
        </div>
    );
};

export default CustomerSearch;


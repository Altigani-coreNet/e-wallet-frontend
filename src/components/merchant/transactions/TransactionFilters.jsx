import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { SOFTPOS_ENDPOINTS } from '../../../utils/constants';
import { getToken } from '../../../utils/api';

const TransactionFilters = ({ filters, onFilterChange, onClearFilters }) => {
    const startDateRef = useRef(null);
    const endDateRef = useRef(null);
    const [terminals, setTerminals] = useState([]);
    const [filteredTerminals, setFilteredTerminals] = useState([]);
    const [terminalSearchTerm, setTerminalSearchTerm] = useState('');
    const [showTerminalList, setShowTerminalList] = useState(false);
    const [selectedTerminal, setSelectedTerminal] = useState(null);
    const [activeFiltersCount, setActiveFiltersCount] = useState(0);
    const terminalDropdownRef = useRef(null);

    useEffect(() => {
        fetchTerminals();
    }, []);

    useEffect(() => {
        // Count active filters
        let count = 0;
        if (filters.search) count++;
        if (filters.status) count++;
        if (filters.payment_type) count++;
        if (filters.terminal_id) count++;
        if (filters.start_date) count++;
        if (filters.end_date) count++;
        setActiveFiltersCount(count);
    }, [filters]);

    // Filter terminals based on search term
    useEffect(() => {
        if (!terminalSearchTerm.trim()) {
            setFilteredTerminals(terminals);
        } else {
            const filtered = terminals.filter(terminal =>
                terminal.name?.toLowerCase().includes(terminalSearchTerm.toLowerCase()) ||
                terminal.terminal_id?.toLowerCase().includes(terminalSearchTerm.toLowerCase()) ||
                terminal.id?.toString().includes(terminalSearchTerm)
            );
            setFilteredTerminals(filtered);
        }
    }, [terminalSearchTerm, terminals]);

    // Set selected terminal when terminal_id filter changes
    useEffect(() => {
        if (filters.terminal_id) {
            const terminal = terminals.find(t => t.id === parseInt(filters.terminal_id));
            setSelectedTerminal(terminal || null);
        } else {
            setSelectedTerminal(null);
        }
    }, [filters.terminal_id, terminals]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (terminalDropdownRef.current && !terminalDropdownRef.current.contains(event.target)) {
                setShowTerminalList(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const fetchTerminals = async () => {
        try {
            const token = getToken();
            const response = await axios.get(SOFTPOS_ENDPOINTS.TERMINALS, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });
            const terminalsData = response.data.data || response.data;
            setTerminals(terminalsData);
            setFilteredTerminals(terminalsData);
        } catch (error) {
            console.error('Error fetching terminals:', error);
        }
    };

    const handleInputChange = (field, value) => {
        onFilterChange({ [field]: value });
    };

    const handleTerminalSearch = (searchTerm) => {
        setTerminalSearchTerm(searchTerm);
        setShowTerminalList(true);
    };

    const handleTerminalSelect = (terminal) => {
        setSelectedTerminal(terminal);
        setTerminalSearchTerm('');
        setShowTerminalList(false);
        handleInputChange('terminal_id', terminal.id);
    };

    const handleRemoveTerminal = () => {
        setSelectedTerminal(null);
        setTerminalSearchTerm('');
        setShowTerminalList(false);
        handleInputChange('terminal_id', '');
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

    const getFilterSummary = () => {
        const details = [];
        if (filters.search) details.push(`Search: "${filters.search}"`);
        if (filters.status) details.push(`Status: ${filters.status}`);
        if (filters.payment_type) details.push(`Payment Type: ${filters.payment_type}`);
        if (filters.terminal_id) {
            const terminal = terminals.find(t => t.id === parseInt(filters.terminal_id));
            details.push(`Terminal: ${terminal?.name || filters.terminal_id}`);
        }
        if (filters.start_date) details.push(`From: ${filters.start_date}`);
        if (filters.end_date) details.push(`To: ${filters.end_date}`);
        return details.join(', ');
    };

    return (
        <>
            <style>{`
                .rotate-180 {
                    transform: rotate(180deg);
                    transition: transform 0.3s ease;
                }
                
                .hover-bg-light:hover {
                    background-color: #f5f8fa !important;
                }
            `}</style>
            <div className="card bg-white card-xl-stretch mb-5 mb-xl-8">
                <div className="card-body">
                <div className="row">
                    {/* Search */}
                    <div className="col-md-3 mb-3">
                        <label htmlFor="search" className="form-label">Search</label>
                        <input
                            type="text"
                            className="form-control"
                            id="search"
                            placeholder="Transaction ID, RRN, Auth Code"
                            value={filters.search}
                            onChange={(e) => handleInputChange('search', e.target.value)}
                        />
                    </div>

                    {/* Status */}
                    <div className="col-md-3 mb-3">
                        <label htmlFor="status" className="form-label">Status</label>
                        <select
                            className="form-select"
                            id="status"
                            value={filters.status}
                            onChange={(e) => handleInputChange('status', e.target.value)}
                        >
                            <option value="">All Statuses</option>
                            <option value="APPROVED">APPROVED</option>
                            <option value="DECLINED">DECLINED</option>
                            <option value="PENDING">PENDING</option>
                            <option value="CAPTURED">CAPTURED</option>
                            <option value="VOIDED">VOIDED</option>
                            <option value="REFUNDED">REFUNDED</option>
                        </select>
                    </div>

                    {/* Payment Type */}
                    <div className="col-md-3 mb-3">
                        <label htmlFor="payment_type" className="form-label">Payment Type</label>
                        <select
                            className="form-select"
                            id="payment_type"
                            value={filters.payment_type}
                            onChange={(e) => handleInputChange('payment_type', e.target.value)}
                        >
                            <option value="">All Types</option>
                            <option value="card">Card</option>
                            <option value="web">Web</option>
                            <option value="bank">Bank</option>
                            <option value="mobile">Mobile</option>
                            <option value="qr">QR</option>
                            <option value="other">Other</option>
                        </select>
                    </div>

                    {/* Terminal - Searchable Dropdown */}
                    <div className="col-md-3 mb-3">
                        <label htmlFor="terminal_id" className="form-label">Terminal</label>
                        <div className="position-relative" ref={terminalDropdownRef}>
                            <div 
                                className="form-control d-flex align-items-center justify-content-between"
                                onClick={() => setShowTerminalList(!showTerminalList)}
                                style={{ cursor: 'pointer', minHeight: '38px' }}
                            >
                                <div className="d-flex align-items-center">
                                    {selectedTerminal ? (
                                        <span className="text-gray-800">
                                            {selectedTerminal.name || selectedTerminal.terminal_id || `Terminal ${selectedTerminal.id}`}
                                        </span>
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
                                <div 
                                    className="position-absolute top-100 start-0 w-100 bg-white border rounded-3 shadow-sm mt-1" 
                                    style={{ zIndex: 1000, maxHeight: '250px', overflowY: 'auto' }}
                                >
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
                                        <>
                                            {!filters.terminal_id && (
                                                <div 
                                                    className="p-3 border-bottom cursor-pointer hover-bg-light"
                                                    onMouseDown={(e) => { e.preventDefault(); handleRemoveTerminal(); }}
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    <div className="text-gray-800">All Terminals</div>
                                                </div>
                                            )}
                                            {filteredTerminals.map((terminal) => (
                                                <div 
                                                    key={terminal.id}
                                                    className="p-3 border-bottom cursor-pointer hover-bg-light"
                                                    onMouseDown={(e) => { e.preventDefault(); handleTerminalSelect(terminal); }}
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    <div className="text-gray-800">
                                                        {terminal.name || terminal.terminal_id || `Terminal ${terminal.id}`}
                                                    </div>
                                                </div>
                                            ))}
                                        </>
                                    ) : (
                                        <div className="p-3 text-muted text-center">
                                            No terminals found
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Date Range */}
                <div className="row mt-3">
                    <div className="col-md-6 mb-3">
                        <label htmlFor="start_date" className="form-label">From Date</label>
                        <input
                            ref={startDateRef}
                            type="date"
                            className="form-control"
                            id="start_date"
                            value={filters.start_date}
                            onChange={(e) => handleInputChange('start_date', e.target.value)}
                            onClick={() => handleDateInputClick(startDateRef)}
                            onFocus={() => handleDateInputClick(startDateRef)}
                        />
                    </div>
                    <div className="col-md-6 mb-3">
                        <label htmlFor="end_date" className="form-label">To Date</label>
                        <input
                            ref={endDateRef}
                            type="date"
                            className="form-control"
                            id="end_date"
                            value={filters.end_date}
                            onChange={(e) => handleInputChange('end_date', e.target.value)}
                            onClick={() => handleDateInputClick(endDateRef)}
                            onFocus={() => handleDateInputClick(endDateRef)}
                        />
                    </div>
                </div>

                {/* Filter Summary */}
                <div className="row mt-3">
                    <div className="col-8">
                        {activeFiltersCount > 0 && (
                            <div className="text-muted fs-7">
                                <i className="ki-duotone ki-filter fs-6 text-muted me-1">
                                    <span className="path1"></span>
                                    <span className="path2"></span>
                                </i>
                                <span className="fw-bold">{activeFiltersCount}</span> active filter{activeFiltersCount !== 1 ? 's' : ''}
                                <span className="ms-2 badge badge-light-primary fs-8" title={getFilterSummary()}>
                                    {getFilterSummary().length > 50 
                                        ? getFilterSummary().substring(0, 50) + '...' 
                                        : getFilterSummary()}
                                </span>
                            </div>
                        )}
                    </div>
                    <div className="col-4 text-end">
                        <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={onClearFilters}
                        >
                            <i className="ki-duotone ki-filter-remove fs-3">
                                <span className="path1"></span>
                                <span className="path2"></span>
                            </i>
                            Clear Filters
                        </button>
                    </div>
                </div>
            </div>
        </div>
        </>
    );
};

export default TransactionFilters;


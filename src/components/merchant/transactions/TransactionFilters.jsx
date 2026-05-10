import React, { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { SOFTPOS_ENDPOINTS } from '../../../utils/constants';
import { getToken } from '../../../utils/api';
import {
    MERCHANT_TRANSACTION_STATUS_FILTER_VALUES,
    getTransactionStatusLabel,
} from '../../../utils/transactionStatusHelpers';

const TransactionFilters = ({ filters, onFilterChange, onClearFilters }) => {
    const { t } = useTranslation();
    const startDateRef = useRef(null);
    const endDateRef = useRef(null);
    const [terminals, setTerminals] = useState([]);
    const [filteredTerminals, setFilteredTerminals] = useState([]);
    const [terminalSearchTerm, setTerminalSearchTerm] = useState('');
    const [showTerminalList, setShowTerminalList] = useState(false);
    const [selectedTerminal, setSelectedTerminal] = useState(null);
    const [activeFiltersCount, setActiveFiltersCount] = useState(0);
    const terminalDropdownRef = useRef(null);

    const paymentTypeLabels = useMemo(() => ({
        card: t('merchant.transactions.typeCard'),
        web: t('merchant.transactions.typeWeb'),
        bank: t('merchant.transactions.typeBank'),
        mobile: t('merchant.transactions.typeMobile'),
        qr: t('merchant.transactions.typeQr'),
        other: t('merchant.transactions.typeOther'),
    }), [t]);

    useEffect(() => {
        fetchTerminals();
    }, []);

    useEffect(() => {
        let count = 0;
        if (filters.search) count++;
        if (filters.status) count++;
        if (filters.payment_type) count++;
        if (filters.terminal_id) count++;
        if (filters.start_date) count++;
        if (filters.end_date) count++;
        setActiveFiltersCount(count);
    }, [filters]);

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

    useEffect(() => {
        if (filters.terminal_id) {
            const terminal = terminals.find(term => term.id === parseInt(filters.terminal_id, 10));
            setSelectedTerminal(terminal || null);
        } else {
            setSelectedTerminal(null);
        }
    }, [filters.terminal_id, terminals]);

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
            if (ref.current.showPicker && typeof ref.current.showPicker === 'function') {
                ref.current.showPicker().catch(() => {
                    ref.current.focus();
                });
            } else {
                ref.current.focus();
                setTimeout(() => {
                    ref.current.click();
                }, 10);
            }
        }
    };

    const getFilterSummary = () => {
        const details = [];
        if (filters.search) details.push(t('merchant.transactions.filterSearch', { q: filters.search }));
        if (filters.status) {
            details.push(
                t('merchant.transactions.filterStatus', {
                    status: statusLabels[filters.status] || filters.status,
                })
            );
        }
        if (filters.payment_type) {
            details.push(t('merchant.transactions.filterPaymentType', {
                type: paymentTypeLabels[filters.payment_type] || filters.payment_type
            }));
        }
        if (filters.terminal_id) {
            const terminal = terminals.find(term => term.id === parseInt(filters.terminal_id, 10));
            details.push(t('merchant.transactions.filterTerminal', {
                name: terminal?.name || filters.terminal_id
            }));
        }
        if (filters.start_date) details.push(t('merchant.transactions.filterFrom', { date: filters.start_date }));
        if (filters.end_date) details.push(t('merchant.transactions.filterTo', { date: filters.end_date }));
        return details.join(', ');
    };

    const filterWord = activeFiltersCount === 1 ? t('merchant.common.filterSingular') : t('merchant.common.filterPlural');

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
                    <div className="col-md-3 mb-3">
                        <label htmlFor="search" className="form-label">{t('merchant.common.search')}</label>
                        <input
                            type="text"
                            className="form-control"
                            id="search"
                            placeholder={t('merchant.transactions.searchPlaceholder')}
                            value={filters.search}
                            onChange={(e) => handleInputChange('search', e.target.value)}
                        />
                    </div>

                    <div className="col-md-3 mb-3">
                        <label htmlFor="status" className="form-label">{t('merchant.common.status')}</label>
                        <select
                            className="form-select"
                            id="status"
                            value={filters.status}
                            onChange={(e) => handleInputChange('status', e.target.value)}
                        >
                            <option value="">{t('merchant.common.allStatuses')}</option>
                            {MERCHANT_TRANSACTION_STATUS_FILTER_VALUES.map((value) => (
                                <option key={value} value={value}>
                                    {getTransactionStatusLabel(value, t)}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="col-md-3 mb-3">
                        <label htmlFor="payment_type" className="form-label">{t('merchant.common.paymentType')}</label>
                        <select
                            className="form-select"
                            id="payment_type"
                            value={filters.payment_type}
                            onChange={(e) => handleInputChange('payment_type', e.target.value)}
                        >
                            <option value="">{t('merchant.common.allTypes')}</option>
                            <option value="card">{paymentTypeLabels.card}</option>
                            <option value="web">{paymentTypeLabels.web}</option>
                            <option value="bank">{paymentTypeLabels.bank}</option>
                            <option value="mobile">{paymentTypeLabels.mobile}</option>
                            <option value="qr">{paymentTypeLabels.qr}</option>
                            <option value="other">{paymentTypeLabels.other}</option>
                        </select>
                    </div>

                    <div className="col-md-3 mb-3">
                        <label htmlFor="terminal_id" className="form-label">{t('merchant.common.terminal')}</label>
                        <div className="position-relative" ref={terminalDropdownRef}>
                            <div 
                                className="form-control d-flex align-items-center justify-content-between"
                                onClick={() => setShowTerminalList(!showTerminalList)}
                                style={{ cursor: 'pointer', minHeight: '38px' }}
                            >
                                <div className="d-flex align-items-center">
                                    {selectedTerminal ? (
                                        <span className="text-gray-800">
                                            {selectedTerminal.name || selectedTerminal.terminal_id || t('merchant.common.terminalNamed', { id: selectedTerminal.id })}
                                        </span>
                                    ) : (
                                        <span className="text-muted">{t('merchant.common.allTerminals')}</span>
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
                                            placeholder={t('merchant.common.searchTerminals')}
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
                                                    <div className="text-gray-800">{t('merchant.common.allTerminals')}</div>
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
                                                        {terminal.name || terminal.terminal_id || t('merchant.common.terminalNamed', { id: terminal.id })}
                                                    </div>
                                                </div>
                                            ))}
                                        </>
                                    ) : (
                                        <div className="p-3 text-muted text-center">
                                            {t('merchant.common.noTerminalsFound')}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="row mt-3">
                    <div className="col-md-6 mb-3">
                        <label htmlFor="start_date" className="form-label">{t('merchant.common.fromDate')}</label>
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
                        <label htmlFor="end_date" className="form-label">{t('merchant.common.toDate')}</label>
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

                <div className="row mt-3">
                    <div className="col-8">
                        {activeFiltersCount > 0 && (
                            <div className="text-muted fs-7">
                                <i className="ki-duotone ki-filter fs-6 text-muted me-1">
                                    <span className="path1"></span>
                                    <span className="path2"></span>
                                </i>
                                <span className="fw-bold">{activeFiltersCount}</span>{' '}{filterWord}
                                <span className="ms-2 badge badge-light-primary fs-8" title={getFilterSummary()}>
                                    {getFilterSummary().length > 50 
                                        ? `${getFilterSummary().substring(0, 50)}...` 
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
                            {t('merchant.common.clearFilters')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
        </>
    );
};

export default TransactionFilters;

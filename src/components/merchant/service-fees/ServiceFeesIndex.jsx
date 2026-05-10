import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { getServiceFees, getServiceFeeTypes } from '../../../services/serviceFeesService';
import ServiceFeesTable from './ServiceFeesTable';
import ServiceFeesFilters from './ServiceFeesFilters';
import LoadingSpinner from '../../common/LoadingSpinner';
import { useToolbar } from '../../../contexts/ToolbarContext';

const ServiceFeesIndex = () => {
    const { t, i18n } = useTranslation();
    const { setTitle, setBreadcrumbs, setActions } = useToolbar();
    const [serviceFees, setServiceFees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);
    const [types, setTypes] = useState([]);
    const [pagination, setPagination] = useState({
        current_page: 1,
        per_page: 15,
        total: 0,
        last_page: 1
    });
    const [filters, setFilters] = useState({
        search: '',
        type: '',
        date_from: '',
        date_to: '',
    });

    // Set toolbar title, breadcrumbs and actions
    useEffect(() => {
        setTitle(t('merchant.serviceFees.title'));

        setBreadcrumbs([
            { label: t('merchant.breadcrumbs.dashboard'), path: '/merchant/dashboard' },
            { label: t('merchant.breadcrumbs.serviceFees'), path: '/merchant/service-fees' },
            {
                label: t('merchant.breadcrumbs.serviceFeesList'),
                path: '/merchant/service-fees',
                active: true,
            },
        ]);

        setActions(
            <button
                onClick={() => setShowFilters(!showFilters)}
                className="btn btn-sm btn-flex btn-secondary fw-bold"
                aria-label={showFilters ? t('merchant.common.hideFilters') : t('merchant.common.showFilters')}
            >
                <i className="ki-duotone ki-filter fs-3 me-0 me-lg-1">
                    <span className="path1"></span>
                    <span className="path2"></span>
                </i>
                <span className="d-none d-lg-inline ms-lg-1">
                    {showFilters ? t('merchant.common.hideFilters') : t('merchant.common.showFilters')}
                </span>
            </button>
        );
    }, [setTitle, setBreadcrumbs, setActions, showFilters, t, i18n.language]);

    const fetchServiceFees = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                page: pagination.current_page,
                per_page: pagination.per_page,
                ...filters
            };

            const response = await getServiceFees(params);
            console.log('Service Fees Response:', response);
            
            if (response.success) {
                const feesData = Array.isArray(response.data) ? response.data : (response.data?.data || response.data || []);
                setServiceFees(feesData);
                if (response.pagination) {
                    setPagination(prev => ({
                        ...prev,
                        ...response.pagination
                    }));
                }
            } else {
                console.error('Failed to fetch service fees:', response.error);
            }
        } catch (error) {
            console.error('Error fetching service fees:', error);
        } finally {
            setLoading(false);
        }
    }, [pagination.current_page, pagination.per_page, filters]);

    useEffect(() => {
        fetchTypes();
    }, []);

    useEffect(() => {
        fetchServiceFees();
    }, [fetchServiceFees]);

    const fetchTypes = async () => {
        try {
            const response = await getServiceFeeTypes();
            if (response.success) {
                setTypes(response.data || []);
            }
        } catch (error) {
            console.error('Error fetching types:', error);
        }
    };

    const handleClearFilters = () => {
        setFilters({
            search: '',
            type: '',
            date_from: '',
            date_to: '',
        });
        setPagination(prev => ({ ...prev, current_page: 1 }));
        // Filters will apply automatically via useEffect
    };

    const handlePageChange = (newPage) => {
        setPagination(prev => ({ ...prev, current_page: newPage }));
    };

    const handlePerPageChange = (newPerPage) => {
        setPagination(prev => ({ ...prev, per_page: newPerPage, current_page: 1 }));
    };

    return (
        <>
            {/* Filters */}
            {showFilters && (
                <ServiceFeesFilters
                    filters={filters}
                    types={types}
                    onFilterChange={(updater) => {
                        setFilters(updater);
                        setPagination((prev) => ({ ...prev, current_page: 1 }));
                    }}
                    onClear={handleClearFilters}
                />
            )}

            {/* Table */}
            <div className="card">
                        <div className="card-header border-0 pt-6">
                            <div className="card-title">
                                <h3>{t('merchant.serviceFees.cardTitle')}</h3>
                            </div>
                        </div>

                        <div className="card-body pt-0">
                            {loading ? (
                                <LoadingSpinner />
                            ) : (
                                <ServiceFeesTable
                                    serviceFees={serviceFees}
                                    pagination={pagination}
                                    onPageChange={handlePageChange}
                                    onPerPageChange={handlePerPageChange}
                                />
                            )}
                        </div>
                    </div>
        </>
    );
};

export default ServiceFeesIndex;


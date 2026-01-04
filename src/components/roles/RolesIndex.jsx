import React, { useState, useEffect } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { getRoles, deleteRole } from '../../services/rolesService';
import RolesTable from './RolesTable';
import RolesSearch from './RolesSearch';
import RolesToolbar from './RolesToolbar';
import { useToolbar } from '../../contexts/ToolbarContext';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorAlert from '../common/ErrorAlert';

const RolesIndex = () => {
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const { setTitle, setBreadcrumbs, setActions } = useToolbar();
    
    // Detect route context (merchant or sales)
    const basePath = location.pathname.startsWith('/merchant') ? '/merchant' : '/sales';
    
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        date_from: '',
        date_to: '',
    });
    const [pagination, setPagination] = useState({
        currentPage: 1,
        perPage: 10,
        total: 0,
        lastPage: 1
    });
    const [sortConfig, setSortConfig] = useState({
        column: 'id',
        direction: 'desc'
    });

    // Get URL parameters for type and parent filtering
    const typeParam = searchParams.get('type');
    const parentParam = searchParams.get('parent');

    // Fetch roles from AuthService API
    const fetchRoles = async (page = 1, search = '', sortBy = 'id', sortDirection = 'desc') => {
        setLoading(true);
        setError(null);

        try {
            const params = {
                page,
                per_page: pagination.perPage,
                search,
                sort_by: sortBy,
                sort_direction: sortDirection
            };

            // Add type and parent filters if they exist
            if (typeParam) {
                params.type = typeParam;
            }
            if (parentParam) {
                params.parent = parentParam;
            }

            // Add additional filters
            if (filters.date_from) {
                params.date_from = filters.date_from;
            }
            if (filters.date_to) {
                params.date_to = filters.date_to;
            }

            const response = await getRoles(params);

            console.log('📦 Full Roles Response:', response);

            if (response.success) {
                // Handle nested response structure: { success: true, data: { data: [...], meta: {...}, status: true } }
                const responseData = response.data || {};
                const rolesData = responseData.data.data || responseData.data.roles || [];
                
                console.log('📋 Extracted roles:', rolesData);
                
                // Ensure it's an array
                setRoles(Array.isArray(rolesData) ? rolesData : []);
                
                // Update pagination from meta
                if (responseData.meta) {
                    setPagination({
                        currentPage: responseData.meta.current_page,
                        perPage: responseData.meta.per_page,
                        total: responseData.meta.total,
                        lastPage: responseData.meta.last_page
                    });
                }
            } else {
                setError(response.error || 'Failed to fetch roles');
                setRoles([]); // Set empty array on error
            }
        } catch (err) {
            console.error('Error fetching roles:', err);
            setError('An unexpected error occurred while fetching roles');
        } finally {
            setLoading(false);
        }
    };

    // Initial load
    useEffect(() => {
        fetchRoles(pagination.currentPage, searchTerm, sortConfig.column, sortConfig.direction);
    }, []);

    // Real-time filtering - fetch when filters change
    useEffect(() => {
        const timer = setTimeout(() => {
            if (!loading) {
                fetchRoles(pagination.currentPage, searchTerm, sortConfig.column, sortConfig.direction);
            }
        }, 500); // Debounce for 500ms

        return () => clearTimeout(timer);
    }, [filters.date_from, filters.date_to]);

    // Handle search
    const handleSearch = (term) => {
        setSearchTerm(term);
        fetchRoles(1, term, sortConfig.column, sortConfig.direction);
    };

    // Handle sort
    const handleSort = (column) => {
        const newDirection = 
            sortConfig.column === column && sortConfig.direction === 'asc' 
                ? 'desc' 
                : 'asc';
        
        setSortConfig({ column, direction: newDirection });
        fetchRoles(pagination.currentPage, searchTerm, column, newDirection);
    };

    // Handle page change
    const handlePageChange = (page) => {
        fetchRoles(page, searchTerm, sortConfig.column, sortConfig.direction);
    };

    // Handle delete role
    const handleDeleteRole = async (roleId) => {
        if (!confirm('Are you sure you want to delete this role?')) {
            return;
        }

        try {
            const response = await deleteRole(roleId);
            
            if (response.success) {
                // Refresh roles list
                fetchRoles(pagination.currentPage, searchTerm, sortConfig.column, sortConfig.direction);
                // You can add a success toast notification here
            } else {
                setError(response.error || 'Failed to delete role');
            }
        } catch (err) {
            console.error('Error deleting role:', err);
            setError('An unexpected error occurred while deleting the role');
        }
    };

    // Handle refresh
    const handleRefresh = () => {
        fetchRoles(pagination.currentPage, searchTerm, sortConfig.column, sortConfig.direction);
    };

    // Reset filters
    const resetFilters = () => {
        setFilters({
            date_from: '',
            date_to: '',
        });
        setSearchTerm('');
    };

    // Get translations from window object or use default
    const pageTitle = window.translations?.roles || 'Roles & Permissions';

    // Set toolbar title and breadcrumbs
    useEffect(() => {
        const breadcrumbs = [
            { label: 'Roles', path: `${basePath}/roles`, active: true }
        ];

        // Add type to breadcrumbs if exists
        if (typeParam) {
            breadcrumbs.push({ label: typeParam, active: true });
        }
        
        setTitle(pageTitle);
        setBreadcrumbs(breadcrumbs);
        setActions(
            <RolesToolbar 
                onRefresh={handleRefresh}
                loading={loading}
                typeParam={typeParam}
                basePath={basePath}
                onToggleFilters={() => setShowFilters(!showFilters)}
            />
        );
        
        return () => {
            setTitle('Dashboard');
            setBreadcrumbs([]);
            setActions(null);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [basePath, pageTitle, typeParam, loading]);

    return (
        <div className="post d-flex flex-column-fluid" id="kt_post">
                <div id="kt_content_container" className="container-fluid">
                    
                    {/* Filter Panel */}
                    {showFilters && (
                        <div className="card mb-5">
                            <div className="card-body">
                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <label className="form-label">Date From</label>
                                        <input 
                                            type="date" 
                                            className="form-control form-control-sm"
                                            value={filters.date_from}
                                            onChange={(e) => setFilters({...filters, date_from: e.target.value})}
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">Date To</label>
                                        <input 
                                            type="date" 
                                            className="form-control form-control-sm"
                                            value={filters.date_to}
                                            onChange={(e) => setFilters({...filters, date_to: e.target.value})}
                                        />
                                    </div>
                                </div>
                                <div className="d-flex justify-content-between align-items-center mt-4">
                                    <div className="text-muted fs-7">
                                        <i className="ki-duotone ki-information fs-5 text-primary me-1">
                                            <span className="path1"></span>
                                            <span className="path2"></span>
                                            <span className="path3"></span>
                                        </i>
                                        Filters apply automatically as you type
                                    </div>
                                    <button onClick={resetFilters} className="btn btn-sm btn-light-primary">
                                        <i className="ki-duotone ki-arrows-circle fs-3">
                                            <span className="path1"></span>
                                            <span className="path2"></span>
                                        </i>
                                        Reset Filters
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="card">
                        {/* Card Header */}
                        <div className="card-header border-0 pt-6">
                            <div className="card-title">
                                <RolesSearch 
                                    onSearch={handleSearch}
                                    searchTerm={searchTerm}
                                />
                            </div>
                        </div>

                        {/* Card Body */}
                        <div className="card-body pt-0">
                            {/* Error Alert */}
                            {error && <ErrorAlert message={error} onClose={() => setError(null)} />}

                            {/* Loading Spinner */}
                            {loading && <LoadingSpinner />}

                            {/* Roles Table */}
                            {!loading && (
                                <RolesTable
                                    roles={roles}
                                    sortConfig={sortConfig}
                                    onSort={handleSort}
                                    onDelete={handleDeleteRole}
                                    pagination={pagination}
                                    onPageChange={handlePageChange}
                                    typeParam={typeParam}
                                    basePath={basePath}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
    );
};

export default RolesIndex;


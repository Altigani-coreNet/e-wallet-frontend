import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import axios from '../../utils/axiosConfig';
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { useToolbar } from "../../contexts/ToolbarContext";
import { ADMIN_ENDPOINTS, AUTH_ENDPOINTS } from "../../utils/constants";
import SearchableDropdown from "../../common/filters/SearchableDropdown";
import { getToken } from "../../utils/api";
import { getPartnersSelect } from "../../services/adminPartnersService";
import { formatDateTime } from "../../utils/helpers";
import ServicesCatalogPreviewModal from "./services/ServicesCatalogPreviewModal";
import useCountryInfoByIds from "../../hooks/useCountryInfoByIds";
import { resolveBackendAssetUrl } from "../../utils/assetUrl";
import { AUTH_SERVICE_BASE } from "../../utils/constants";

const pickServiceCountryId = (service) => service?.country_id ?? service?.country?.id ?? null;

/** Prefer nested country from API; otherwise resolve UUID via Auth countries index (see useCountryInfoByIds). */
const getServiceCountryDisplay = (service, getCountryById, lookupLoading) => {
    const c = service?.country;
    if (c) {
        const n = c.name;
        let label = '';
        if (typeof n === 'string') label = n.trim();
        else if (n && typeof n === 'object') label = (n.en || n.ar || '').trim();
        if (!label && c.short_name) label = String(c.short_name);
        if (label) {
            return { label, code: c.code || c.short_name || null };
        }
    }
    const cid = pickServiceCountryId(service);
    if (!cid) {
        return { label: 'N/A', code: null };
    }
    const r = getCountryById(cid);
    if (r?.name) {
        return { label: r.name, code: r.code || r.short_name || null };
    }
    if (r && !r.name) {
        return { label: 'N/A', code: null };
    }
    if (lookupLoading) {
        return { label: '…', code: null };
    }
    return { label: 'N/A', code: null };
};

const Services = () => {
    const [searchParams] = useSearchParams();
    const tableCardRef = useRef(null);
    const { setTitle, setBreadcrumbs, setActions } = useToolbar();
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const countryIdsForLookup = useMemo(
        () =>
            [
                ...new Set(
                    services
                        .map((s) => pickServiceCountryId(s))
                        .filter((id) => id !== null && id !== undefined && id !== "")
                        .map(String)
                ),
            ],
        [services]
    );

    const { getCountryById, loading: countryLookupLoading } = useCountryInfoByIds(countryIdsForLookup);

    // Pagination state
    const [pagination, setPagination] = useState({
        current_page: 1,
        per_page: 15,
        total: 0,
        last_page: 1
    });
    
    // Filter states
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        status: "",
        is_active: null,
        country_id: "",
        partner_id: "",
        category_id: "",
        service_type: "",
        date_from: "",
        date_to: "",
    });

    const setFilterValue = useCallback((key, value) => {
        setFilters((prev) => ({
            ...prev,
            [key]: value,
        }));
        setPagination((prev) => ({ ...prev, current_page: 1 }));
    }, []);

    // Debounced search term
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
    
    // Debounce search term only (filters apply immediately so status etc. hit the API right away)
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
            setPagination(prev => ({ ...prev, current_page: 1 }));
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Filter options (lazy-loaded)
    const [categories, setCategories] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState(false);
    const [categoriesEnabled, setCategoriesEnabled] = useState(false);
    const [categorySearchTerm, setCategorySearchTerm] = useState("");
    const [selectedCategoryOption, setSelectedCategoryOption] = useState(null);

    const [partners, setPartners] = useState([]);
    const [loadingPartners, setLoadingPartners] = useState(false);
    const [partnersEnabled, setPartnersEnabled] = useState(false);
    const [partnerSearchTerm, setPartnerSearchTerm] = useState("");
    const [selectedPartnerOption, setSelectedPartnerOption] = useState(null);
    const [subPartners, setSubPartners] = useState([]);
    const [loadingSubPartners, setLoadingSubPartners] = useState(false);
    const [subPartnersEnabled, setSubPartnersEnabled] = useState(false);
    const [subPartnerSearchTerm, setSubPartnerSearchTerm] = useState("");
    const [selectedSubPartnerOption, setSelectedSubPartnerOption] = useState(null);

    const [countries, setCountries] = useState([]);
    const [loadingCountries, setLoadingCountries] = useState(false);
    const [countriesEnabled, setCountriesEnabled] = useState(false);
    const [countrySearchTerm, setCountrySearchTerm] = useState("");
    const [selectedCountryOption, setSelectedCountryOption] = useState(null);

    const [selectedServices, setSelectedServices] = useState([]);
    const [selectAll, setSelectAll] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [previewModalOpen, setPreviewModalOpen] = useState(false);

    const previewListParams = useMemo(
        () => ({
            search: debouncedSearchTerm || undefined,
            status: filters.status || undefined,
            is_active: filters.is_active !== null ? filters.is_active : undefined,
            country_id: filters.country_id || undefined,
            partner_id: filters.partner_id || undefined,
            category_id: filters.category_id || undefined,
            service_type: filters.service_type || undefined,
            date_from: filters.date_from || undefined,
            date_to: filters.date_to || undefined,
        }),
        [debouncedSearchTerm, filters]
    );

    const resolveCategoryName = useCallback((service) => {
        const c = service?.category;
        if (!c) return "N/A";
        return c.name_en || c.name_ar || c.code || "N/A";
    }, []);

    const resolveServiceName = useCallback((service) => {
        if (service?.service_name_en || service?.service_name_ar) {
            return service.service_name_en || service.service_name_ar || service.id || "N/A";
        }
        if (service?.service_name_text) return service.service_name_text;
        if (service?.service_name && typeof service.service_name === 'object') {
            return service.service_name.en || service.service_name.ar || service.id || "N/A";
        }
        return service?.service_name || service?.id || "N/A";
    }, []);

    const resolvePartnerDisplayName = useCallback((service) => {
        const partner =
            service?.partner ||
            service?.merchant ||
            service?.contentProvider ||
            null;
        if (!partner) return "N/A";
        const subName = partner?.name || "N/A";
        const parentName = partner?.parent_name || null;
        if (parentName) {
            return `${subName} - ${parentName}`;
        }
        return subName;
    }, []);

    // Apply ?partner_id= from URL (e.g. deep link from partner details)
    useEffect(() => {
        const pid = searchParams.get('partner_id');
        if (!pid) return;
        setFilters((prev) => {
            if (String(prev.partner_id) === String(pid)) return prev;
            return { ...prev, partner_id: pid };
        });
        setShowFilters(true);
    }, [searchParams]);

    // Set toolbar config
    useEffect(() => {
        setTitle("Services Management");
        setBreadcrumbs([
            { label: "Home", path: "/admin" },
            { label: "Services", path: "/admin/services" },
        ]);

        return () => {
            setBreadcrumbs([]);
            setActions(null);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Set toolbar actions
    useEffect(() => {
        setActions(
            <div className="d-flex gap-2">
                <button 
                    onClick={() => setShowFilters(!showFilters)}
                    className="btn btn-sm btn-light"
                >
                    <i className="ki-duotone ki-filter fs-3 me-1">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    {showFilters ? 'Hide Filters' : 'Show Filters'}
                </button>
                <button
                    type="button"
                    onClick={() => setPreviewModalOpen(true)}
                    className="btn btn-sm btn-light-primary"
                >
                    <i className="ki-duotone ki-eye fs-3 me-1">
                        <span className="path1"></span>
                        <span className="path2"></span>
                        <span className="path3"></span>
                    </i>
                    Preview
                </button>
                <button 
                    onClick={handleExport} 
                    className="btn btn-sm btn-success"
                    disabled={exporting}
                >
                    {exporting ? (
                        <>
                            <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                            Exporting...
                        </>
                    ) : (
                        <>
                            <i className="ki-duotone ki-exit-up fs-3 me-1">
                                <span className="path1"></span>
                                <span className="path2"></span>
                            </i>
                            Export
                        </>
                    )}
                </button>
                {selectedServices.length > 0 && (
                    <button
                        type="button"
                        className="btn btn-sm btn-danger"
                        onClick={handleBulkDelete}
                    >
                        <i className="ki-duotone ki-trash fs-3 me-1">
                            <span className="path1"></span>
                            <span className="path2"></span>
                            <span className="path3"></span>
                            <span className="path4"></span>
                            <span className="path5"></span>
                        </i>
                        Delete Selected ({selectedServices.length})
                    </button>
                )}
                <Link to="/admin/services/create/wizard" className="btn btn-sm btn-primary">
                    <i className="ki-duotone ki-plus fs-3 me-1">
                        <span className="path1"></span>
                        <span className="path2"></span>
                        <span className="path3"></span>
                    </i>
                    Add Service
                </Link>
            </div>
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showFilters, exporting, selectedServices.length]);

    // Fetch services
    const fetchServices = useCallback(async () => {
        setLoading(true);
        setIsFetching(true);
        try {
            const params = {
                page: pagination.current_page,
                per_page: pagination.per_page,
                search: debouncedSearchTerm || undefined,
                status: filters.status || undefined,
                is_active: filters.is_active !== null ? filters.is_active : undefined,
                country_id: filters.country_id || undefined,
                partner_id: filters.partner_id || undefined,
                category_id: filters.category_id || undefined,
                service_type: filters.service_type || undefined,
                date_from: filters.date_from || undefined,
                date_to: filters.date_to || undefined,
            };

            // Remove undefined values
            Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

            const response = await axios.get(ADMIN_ENDPOINTS.SERVICES, { params });

            if (response.data.success) {
                const { data, meta } = response.data;
                setServices(data || []);
                setPagination(prev => ({
                    ...prev,
                    current_page: meta?.current_page || 1,
                    total: meta?.total || 0,
                    last_page: meta?.last_page || 1,
                }));
            }
        } catch (error) {
            console.error("Error fetching services:", error);
            toast.error(error.response?.data?.message || "Failed to fetch services");
        } finally {
            setLoading(false);
            setIsFetching(false);
        }
    }, [pagination.current_page, pagination.per_page, debouncedSearchTerm, filters]);

    useEffect(() => {
        fetchServices();
    }, [fetchServices]);

    // Load categories
    const loadCategories = useCallback(
        async (search = '') => {
            try {
                setLoadingCategories(true);
                const params = { per_page: 50, type: 'service' };
                if (search) params.search = search;
                const response = await axios.get(ADMIN_ENDPOINTS.SERVICE_CATEGORIES_ACTIVE, { params });
                if (response.data.success) {
                    const list = response.data.data || [];
                    setCategories(list.map(cat => ({
                        value: cat.id,
                        label: cat.name_en,
                        ...cat,
                    })));
                }
            } catch (error) {
                console.error('Error loading categories:', error);
                setCategories([]);
            } finally {
                setLoadingCategories(false);
            }
        },
        []
    );

    // Partners (content providers) for filter — optional country scope, no operator prerequisite
    const loadPartners = useCallback(
        async (search = '', countryId = null) => {
            try {
                setLoadingPartners(true);
                const params = { per_page: 100 };
                if (search) params.search = search;
                if (countryId) params.country_id = countryId;
                const result = await getPartnersSelect(params);
                if (!result.success) {
                    setPartners([]);
                    return;
                }
                const body = result.data;
                if (body && (body.status === true || body.success === true)) {
                    const list = Array.isArray(body.data) ? body.data : [];
                    setPartners(list.map((cp) => ({
                        value: cp.id,
                        label: cp.name || cp.text || cp.business_name || String(cp.id),
                        ...cp,
                    })));
                } else {
                    setPartners([]);
                }
            } catch (error) {
                console.error('Error loading partners:', error);
                setPartners([]);
            } finally {
                setLoadingPartners(false);
            }
        },
        []
    );

    const loadSubPartners = useCallback(
        async (parentId, search = '') => {
            if (!parentId) {
                setSubPartners([]);
                return;
            }
            try {
                setLoadingSubPartners(true);
                const params = {
                    sub_partners_for_parent: parentId,
                    limit: 100,
                };
                if (search) params.search = search;
                const result = await getPartnersSelect(params);
                if (!result.success) {
                    setSubPartners([]);
                    return;
                }
                const body = result.data;
                if (body && (body.status === true || body.success === true)) {
                    const list = Array.isArray(body.data) ? body.data : [];
                    setSubPartners(
                        list.map((cp) => ({
                            value: cp.id,
                            label: cp.name || cp.text || String(cp.id),
                            ...cp,
                        }))
                    );
                } else {
                    setSubPartners([]);
                }
            } catch (error) {
                console.error('Error loading sub partners:', error);
                setSubPartners([]);
            } finally {
                setLoadingSubPartners(false);
            }
        },
        []
    );

    // Load countries
    const loadCountries = useCallback(
        async (search = '') => {
            try {
                setLoadingCountries(true);
                const token = getToken();
                const url = search 
                    ? `${AUTH_ENDPOINTS.COUNTRIES_SELECT}?search=${encodeURIComponent(search)}`
                    : AUTH_ENDPOINTS.COUNTRIES_SELECT;
                
                const response = await axios.get(url, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (response.data.status) {
                    const list = Array.isArray(response.data.data) ? response.data.data : [];
                    setCountries(list.map(country => ({
                        value: country.id,
                        label: country.text || country.name?.en || country.name,
                        code: country.code || country.short_name || country.code_iso2,
                        ...country
                    })));
                } else {
                    setCountries([]);
                }
            } catch (error) {
                console.error('Error loading countries:', error);
                setCountries([]);
            } finally {
                setLoadingCountries(false);
            }
        },
        []
    );

    const categoryOptions = useMemo(
        () => [
            { value: '', label: 'All Categories' },
            ...categories.map((category) => ({
                value: category.value,
                label: category.label,
            })),
        ],
        [categories]
    );

    const partnerOptions = useMemo(
        () => [
            { value: '', label: 'All Partners' },
            ...partners.map((p) => ({
                value: p.value,
                label: p.label,
                ...p,
            })),
        ],
        [partners]
    );

    const subPartnerOptions = useMemo(
        () => [
            { value: '', label: 'All Sub Partners' },
            ...subPartners.map((p) => ({
                value: p.value,
                label: p.label,
                ...p,
            })),
        ],
        [subPartners]
    );

    const countryOptions = useMemo(
        () => [
            { value: '', label: 'All Countries', code: null },
            ...countries.map((country) => ({
                value: country.value,
                label: country.label,
                code: country.code,
                ...country
            })),
        ],
        [countries]
    );

    useEffect(() => {
        const timer = setTimeout(() => {
            if (!filters.category_id) {
                setSelectedCategoryOption(null);
                return;
            }
            if (selectedCategoryOption && String(selectedCategoryOption.value) === String(filters.category_id)) {
                return;
            }
            const option = categoryOptions.find((item) => String(item.value) === String(filters.category_id));
            if (option) {
                setSelectedCategoryOption(option);
            }
        }, 0);
        return () => clearTimeout(timer);
    }, [filters.category_id, categoryOptions, selectedCategoryOption]);

    // Debounced search for categories
    useEffect(() => {
        if (!categoriesEnabled) return;
        const handler = setTimeout(() => {
            loadCategories(categorySearchTerm);
        }, 300);
        return () => clearTimeout(handler);
    }, [categoriesEnabled, categorySearchTerm, loadCategories]);

    useEffect(() => {
        if (!filters.category_id) return;
        if (categories.length > 0 || loadingCategories) return;
        setCategoriesEnabled(true);
        loadCategories('');
    }, [filters.category_id, categories.length, loadingCategories, loadCategories]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (!filters.partner_id) {
                setSelectedPartnerOption(null);
                return;
            }
            if (selectedPartnerOption && String(selectedPartnerOption.value) === String(filters.partner_id)) {
                return;
            }
            const option = partnerOptions.find((item) => String(item.value) === String(filters.partner_id));
            if (option) {
                setSelectedPartnerOption(option);
            }
        }, 0);
        return () => clearTimeout(timer);
    }, [filters.partner_id, partnerOptions, selectedPartnerOption]);

    useEffect(() => {
        if (!partnersEnabled) return;
        const handler = setTimeout(() => {
            loadPartners(partnerSearchTerm, filters.country_id || null);
        }, 300);
        return () => clearTimeout(handler);
    }, [partnersEnabled, partnerSearchTerm, filters.country_id, loadPartners]);

    useEffect(() => {
        if (!filters.partner_id) return;
        if (partners.length > 0 || loadingPartners) return;
        setPartnersEnabled(true);
        loadPartners('', filters.country_id || null);
    }, [filters.partner_id, partners.length, loadingPartners, filters.country_id, loadPartners]);

    useEffect(() => {
        if (!selectedPartnerOption?.has_sub_partners) {
            setSubPartners([]);
            setSelectedSubPartnerOption(null);
            setSubPartnerSearchTerm('');
            setSubPartnersEnabled(false);
            return;
        }
        if (!subPartnersEnabled) return;
        const handler = setTimeout(() => {
            loadSubPartners(selectedPartnerOption.value, subPartnerSearchTerm);
        }, 300);
        return () => clearTimeout(handler);
    }, [selectedPartnerOption, subPartnersEnabled, subPartnerSearchTerm, loadSubPartners]);

    // Handle delete
    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: "Are you sure?",
            text: "You won't be able to revert this!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Yes, delete it!",
        });

        if (result.isConfirmed) {
            try {
                const response = await axios.delete(ADMIN_ENDPOINTS.SERVICE_DETAILS(id));
                if (response.data.success) {
                    toast.success("Service deleted successfully");
                    fetchServices();
                }
            } catch (error) {
                console.error("Error deleting service:", error);
                toast.error(error.response?.data?.message || "Failed to delete service");
            }
        }
    };

    // Handle bulk delete
    const handleBulkDelete = async () => {
        if (selectedServices.length === 0) {
            toast.warning("Please select services to delete");
            return;
        }

        const result = await Swal.fire({
            title: "Delete Selected Services?",
            text: `You are about to delete ${selectedServices.length} service(s).`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Yes, delete them!",
        });

        if (result.isConfirmed) {
            try {
                const response = await axios.post(ADMIN_ENDPOINTS.SERVICE_BULK_DELETE, {
                    ids: selectedServices,
                });

                if (response.data.success) {
                    toast.success("Services deleted successfully");
                    setSelectedServices([]);
                    setSelectAll(false);
                    fetchServices();
                }
            } catch (error) {
                console.error("Error deleting services:", error);
                toast.error(error.response?.data?.message || "Failed to delete services");
            }
        }
    };

    // Handle toggle active status
    const handleToggleActive = async (id) => {
        try {
            const response = await axios.patch(ADMIN_ENDPOINTS.SERVICE_TOGGLE_STATUS(id));
            if (response.data.success) {
                const current = services.find((s) => s.id === id);
                const responseIsActive = response.data?.data?.is_active;
                const responseActiveNow =
                    responseIsActive !== undefined
                        ? (responseIsActive === true || responseIsActive === 1)
                        : current
                            ? !(current.is_active === true || current.is_active === 1)
                            : null;

                if (responseActiveNow === true) {
                    toast.success("Service is actived");
                } else if (responseActiveNow === false) {
                    toast.success("Service is not activate");
                } else {
                    toast.success("Service active status updated successfully");
                }
                fetchServices();
            }
        } catch (error) {
            console.error("Error toggling active status:", error);
            toast.error(error.response?.data?.message || "Failed to update service active status");
        }
    };

    // Handle select all
    const handleSelectAll = () => {
        if (selectAll) {
            setSelectedServices([]);
        } else {
            setSelectedServices(services.map((service) => service.id));
        }
        setSelectAll(!selectAll);
    };

    // Handle individual selection
    const handleSelectService = (id) => {
        if (selectedServices.includes(id)) {
            setSelectedServices(selectedServices.filter((serviceId) => serviceId !== id));
        } else {
            setSelectedServices([...selectedServices, id]);
        }
    };

    // Export
    const handleExport = async () => {
        try {
            setExporting(true);
            const params = {
                search: debouncedSearchTerm || undefined,
                status: filters.status || undefined,
                is_active: filters.is_active !== null ? filters.is_active : undefined,
                country_id: filters.country_id || undefined,
                partner_id: filters.partner_id || undefined,
                category_id: filters.category_id || undefined,
                service_type: filters.service_type || undefined,
                date_from: filters.date_from || undefined,
                date_to: filters.date_to || undefined,
            };

            Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

            const response = await axios.get(ADMIN_ENDPOINTS.SERVICE_EXPORT, { params });

            if (response.data.success && response.data.data) {
                // Convert to CSV
                const data = response.data.data;
                const headers = Object.keys(data[0] || {});
                const csv = [
                    headers.join(","),
                    ...data.map(row => headers.map(header => `"${row[header] || ""}"`).join(","))
                ].join("\n");

                // Download
                const blob = new Blob([csv], { type: "text/csv" });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `services_${new Date().toISOString().split("T")[0]}.csv`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);

                toast.success("Services exported successfully");
            }
        } catch (error) {
            console.error("Error exporting services:", error);
            toast.error(error.response?.data?.message || "Failed to export services");
        } finally {
            setExporting(false);
        }
    };

    const handlePageChange = (page) => {
        setPagination(prev => ({ ...prev, current_page: page }));
    };

    const handlePerPageChange = (newPerPage) => {
        setPagination(prev => ({ ...prev, per_page: newPerPage, current_page: 1 }));
    };

    const resetFilters = () => {
        setFilters({
            status: "",
            is_active: null,
            country_id: "",
            partner_id: "",
            category_id: "",
            service_type: "",
            date_from: "",
            date_to: "",
        });
        setSearchTerm('');
        setPagination(prev => ({ ...prev, current_page: 1 }));
        setCountrySearchTerm('');
        setCategorySearchTerm('');
        setPartnerSearchTerm('');
        setSubPartnerSearchTerm('');
        setSelectedCountryOption(null);
        setSelectedCategoryOption(null);
        setSelectedPartnerOption(null);
        setSelectedSubPartnerOption(null);
        setCountriesEnabled(false);
        setCategoriesEnabled(false);
        setPartnersEnabled(false);
        setSubPartnersEnabled(false);
        setSubPartners([]);
    };

    const handleCategorySelect = useCallback((option) => {
        if (option && option.value === '') {
            // "All Categories" selected
            setSelectedCategoryOption(null);
            setFilterValue('category_id', '');
        } else {
            setSelectedCategoryOption(option);
            setFilterValue('category_id', option?.value || '');
        }
    }, [setFilterValue]);

    const handleCategoryClear = useCallback(() => {
        setSelectedCategoryOption(null);
        setFilterValue('category_id', '');
    }, [setFilterValue]);

    const handleCategoryOpen = useCallback(() => {
        setCategoriesEnabled(true);
        if (categories.length === 0 && !loadingCategories) {
            loadCategories(categorySearchTerm);
        }
    }, [categories.length, loadingCategories, categorySearchTerm, loadCategories]);

    const handleCategorySearchChange = useCallback((value) => {
        setCategorySearchTerm(value);
        setCategoriesEnabled(true);
    }, []);

    const handlePartnerSelect = useCallback((option) => {
        if (option && option.value === '') {
            setSelectedPartnerOption(null);
            setSelectedSubPartnerOption(null);
            setSubPartners([]);
            setFilterValue('partner_id', '');
        } else {
            setSelectedPartnerOption(option);
            setSelectedSubPartnerOption(null);
            setSubPartnerSearchTerm('');
            if (option?.has_sub_partners) {
                setSubPartnersEnabled(true);
                loadSubPartners(option.value, '');
            } else {
                setSubPartners([]);
                setSubPartnersEnabled(false);
            }
            setFilterValue('partner_id', option?.value || '');
        }
    }, [setFilterValue, loadSubPartners]);

    const handlePartnerClear = useCallback(() => {
        setSelectedPartnerOption(null);
        setSelectedSubPartnerOption(null);
        setSubPartners([]);
        setSubPartnersEnabled(false);
        setFilterValue('partner_id', '');
    }, [setFilterValue]);

    const handlePartnerOpen = useCallback(() => {
        setPartnersEnabled(true);
        if (partners.length === 0 && !loadingPartners) {
            loadPartners(partnerSearchTerm, filters.country_id || null);
        }
    }, [partners.length, loadingPartners, partnerSearchTerm, filters.country_id, loadPartners]);

    const handlePartnerSearchChange = useCallback((value) => {
        setPartnerSearchTerm(value);
        setPartnersEnabled(true);
    }, []);

    const handleSubPartnerSelect = useCallback((option) => {
        if (option && option.value === '') {
            setSelectedSubPartnerOption(null);
            setFilterValue('partner_id', selectedPartnerOption?.value || '');
        } else {
            setSelectedSubPartnerOption(option);
            setFilterValue('partner_id', option?.value || '');
        }
    }, [setFilterValue, selectedPartnerOption]);

    const handleSubPartnerClear = useCallback(() => {
        setSelectedSubPartnerOption(null);
        setFilterValue('partner_id', selectedPartnerOption?.value || '');
    }, [setFilterValue, selectedPartnerOption]);

    const handleSubPartnerOpen = useCallback(() => {
        if (!selectedPartnerOption?.has_sub_partners) return;
        setSubPartnersEnabled(true);
        if (subPartners.length === 0 && !loadingSubPartners) {
            loadSubPartners(selectedPartnerOption.value, subPartnerSearchTerm);
        }
    }, [selectedPartnerOption, subPartners.length, loadingSubPartners, subPartnerSearchTerm, loadSubPartners]);

    const handleSubPartnerSearchChange = useCallback((value) => {
        setSubPartnerSearchTerm(value);
        setSubPartnersEnabled(true);
    }, []);

    const handleCountrySelect = useCallback((option) => {
        if (option && option.value === '') {
            setSelectedCountryOption(null);
            setFilterValue('country_id', '');
            setFilterValue('partner_id', '');
            setSelectedPartnerOption(null);
            setSelectedSubPartnerOption(null);
            setSubPartners([]);
            setSubPartnersEnabled(false);
            setPartners([]);
        } else {
            setSelectedCountryOption(option);
            setFilterValue('country_id', option?.value || '');
            setFilterValue('partner_id', '');
            setSelectedPartnerOption(null);
            setSelectedSubPartnerOption(null);
            setSubPartners([]);
            setSubPartnersEnabled(false);
            setPartners([]);
        }
    }, [setFilterValue]);

    const handleCountryClear = useCallback(() => {
        setSelectedCountryOption(null);
        setFilterValue('country_id', '');
        setFilterValue('partner_id', '');
        setSelectedPartnerOption(null);
        setSelectedSubPartnerOption(null);
        setSubPartners([]);
        setSubPartnersEnabled(false);
        setPartners([]);
    }, [setFilterValue]);

    const handleCountryOpen = useCallback(() => {
        setCountriesEnabled(true);
        if (countries.length === 0 && !loadingCountries) {
            loadCountries(countrySearchTerm);
        }
    }, [countries.length, loadingCountries, countrySearchTerm, loadCountries]);

    const handleCountrySearchChange = useCallback((value) => {
        setCountrySearchTerm(value);
        setCountriesEnabled(true);
    }, []);

    // Debounced search for countries
    useEffect(() => {
        if (!countriesEnabled) return;
        const handler = setTimeout(() => {
            loadCountries(countrySearchTerm);
        }, 300);
        return () => clearTimeout(handler);
    }, [countriesEnabled, countrySearchTerm, loadCountries]);

    useEffect(() => {
        if (!filters.country_id) return;
        if (countries.length > 0 || loadingCountries) return;
        setCountriesEnabled(true);
        loadCountries('');
    }, [filters.country_id, countries.length, loadingCountries, loadCountries]);

    // Sync selected country option with filters
    useEffect(() => {
        const timer = setTimeout(() => {
            if (!filters.country_id) {
                setSelectedCountryOption(null);
                return;
            }
            if (selectedCountryOption && String(selectedCountryOption.value) === String(filters.country_id)) {
                return;
            }
            const option = countryOptions.find((item) => String(item.value) === String(filters.country_id));
            if (option) {
                setSelectedCountryOption(option);
            }
        }, 0);
        return () => clearTimeout(timer);
    }, [filters.country_id, countryOptions, selectedCountryOption]);

    return (
        <>
            {/* Filter Panel - Separate Card */}
            {showFilters && (
                <div className="card mb-4 shadow-sm">
                        <div className="card-header border-0 pt-6 pb-4">
                            <h3 className="card-title align-items-start flex-column">
                                <span className="card-label fw-bold fs-3 mb-1">Filter Services</span>
                                <span className="text-muted mt-1 fw-semibold fs-7">Apply filters to find specific services</span>
                            </h3>
                        </div>
                        <div className="card-body pt-0">
                            <div className="row g-4">
                                <div className="col-md-6 col-lg-3">
                                    <SearchableDropdown
                                        label="Country"
                                        placeholder="All Countries"
                                        options={countryOptions}
                                        selected={selectedCountryOption}
                                        onSelect={handleCountrySelect}
                                        onClear={handleCountryClear}
                                        loading={loadingCountries}
                                        onOpen={handleCountryOpen}
                                        onSearchChange={handleCountrySearchChange}
                                        searchPlaceholder="Search countries..."
                                        renderSelected={(option) => (
                                            option ? (
                                                <div className="d-flex align-items-center">
                                                    {option.code && (
                                                        <img 
                                                            src={`/flags/${option.code?.toLowerCase()}.png`} 
                                                            alt={option.label}
                                                            className="me-2"
                                                            style={{ width: '20px', height: '15px', objectFit: 'cover' }}
                                                            onError={(e) => { e.target.style.display = 'none'; }}
                                                        />
                                                    )}
                                                    <span>{option.label}</span>
                                                </div>
                                            ) : <span className="text-muted fw-semibold">All Countries</span>
                                        )}
                                        renderOption={(option) => {
                                            const isAllSelected = option.value === '' && !selectedCountryOption;
                                            return (
                                                <div className="d-flex align-items-center">
                                                    {(isAllSelected || (selectedCountryOption && String(selectedCountryOption.value) === String(option.value))) && (
                                                        <i className="ki-duotone ki-check fs-5 text-primary me-2">
                                                            <span className="path1"></span>
                                                            <span className="path2"></span>
                                                        </i>
                                                    )}
                                                    {option.code && (
                                                        <img 
                                                            src={`/flags/${option.code?.toLowerCase()}.png`} 
                                                            alt={option.label}
                                                            className="me-3"
                                                            style={{ width: '20px', height: '15px', objectFit: 'cover' }}
                                                            onError={(e) => { e.target.style.display = 'none'; }}
                                                        />
                                                    )}
                                                    <span className={isAllSelected ? 'fw-bold text-primary' : ''}>{option.label}</span>
                                                </div>
                                            );
                                        }}
                                    />
                                </div>
                                <div className="col-md-6 col-lg-3">
                                    <SearchableDropdown
                                        label="Partner"
                                        placeholder="All Partners"
                                        options={partnerOptions}
                                        selected={selectedPartnerOption}
                                        onSelect={handlePartnerSelect}
                                        onClear={handlePartnerClear}
                                        loading={loadingPartners}
                                        onOpen={handlePartnerOpen}
                                        onSearchChange={handlePartnerSearchChange}
                                        searchPlaceholder="Search partners..."
                                        renderOption={(option) => {
                                            const isAllSelected = option.value === '' && !selectedPartnerOption;
                                            return (
                                                <div className="d-flex align-items-center">
                                                    {(isAllSelected || (selectedPartnerOption && String(selectedPartnerOption.value) === String(option.value))) && (
                                                        <i className="ki-duotone ki-check fs-5 text-primary me-2">
                                                            <span className="path1"></span>
                                                            <span className="path2"></span>
                                                        </i>
                                                    )}
                                                    <span className={isAllSelected ? 'fw-bold text-primary' : ''}>{option.label}</span>
                                                </div>
                                            );
                                        }}
                                    />
                                </div>
                                {selectedPartnerOption?.has_sub_partners && (
                                    <div className="col-md-3 col-lg-3">
                                        <SearchableDropdown
                                            label="Sub Partner"
                                            placeholder="All Sub Partners"
                                            options={subPartnerOptions}
                                            selected={selectedSubPartnerOption}
                                            onSelect={handleSubPartnerSelect}
                                            onClear={handleSubPartnerClear}
                                            loading={loadingSubPartners}
                                            onOpen={handleSubPartnerOpen}
                                            onSearchChange={handleSubPartnerSearchChange}
                                            searchPlaceholder="Search sub partners..."
                                            renderOption={(option) => {
                                                const isAllSelected = option.value === '' && !selectedSubPartnerOption;
                                                return (
                                                    <div className="d-flex align-items-center">
                                                        {(isAllSelected || (selectedSubPartnerOption && String(selectedSubPartnerOption.value) === String(option.value))) && (
                                                            <i className="ki-duotone ki-check fs-5 text-primary me-2">
                                                                <span className="path1"></span>
                                                                <span className="path2"></span>
                                                            </i>
                                                        )}
                                                        <span className={isAllSelected ? 'fw-bold text-primary' : ''}>{option.label}</span>
                                                    </div>
                                                );
                                            }}
                                        />
                                    </div>
                                )}
                                <div className="col-md-6 col-lg-3">
                                    <SearchableDropdown
                                        label="Category"
                                        placeholder="All Categories"
                                        options={categoryOptions}
                                        selected={selectedCategoryOption}
                                        onSelect={handleCategorySelect}
                                        onClear={handleCategoryClear}
                                        loading={loadingCategories}
                                        onOpen={handleCategoryOpen}
                                        onSearchChange={handleCategorySearchChange}
                                        searchPlaceholder="Search categories..."
                                        renderOption={(option) => {
                                            const isAllSelected = option.value === '' && !selectedCategoryOption;
                                            return (
                                                <div className="d-flex align-items-center">
                                                    {(isAllSelected || (selectedCategoryOption && String(selectedCategoryOption.value) === String(option.value))) && (
                                                        <i className="ki-duotone ki-check fs-5 text-primary me-2">
                                                            <span className="path1"></span>
                                                            <span className="path2"></span>
                                                        </i>
                                                    )}
                                                    <span className={isAllSelected ? 'fw-bold text-primary' : ''}>{option.label}</span>
                                                </div>
                                            );
                                        }}
                                    />
                                </div>
                                <div className="col-md-6 col-lg-3">
                                    <label className="form-label fw-bold">Service Status</label>
                                    <select 
                                        className="form-select form-select-lg"
                                        value={filters.status}
                                        onChange={(e) => setFilterValue('status', e.target.value)}
                                    >
                                        <option value="">All Status</option>
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                        <option value="pending">Pending</option>
                                        <option value="staging">Staging</option>
                                        <option value="testing">Testing</option>
                                    </select>
                                </div>
                                <div className="col-md-6 col-lg-3">
                                    <label className="form-label fw-bold">Active Status</label>
                                    <select 
                                        className="form-select form-select-lg"
                                        value={filters.is_active === null ? "" : filters.is_active ? "1" : "0"}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setFilterValue('is_active', value === "" ? null : value === "1");
                                        }}
                                    >
                                        <option value="">All</option>
                                        <option value="1">Active Only</option>
                                        <option value="0">Inactive Only</option>
                                    </select>
                                </div>
                                <div className="col-md-6 col-lg-3">
                                    <label className="form-label fw-bold">Date From</label>
                                    <input
                                        type="date"
                                        className="form-control form-control-lg"
                                        value={filters.date_from}
                                        onChange={(e) => setFilterValue('date_from', e.target.value)}
                                    />
                                </div>
                                <div className="col-md-6 col-lg-3">
                                    <label className="form-label fw-bold">Date To</label>
                                    <input
                                        type="date"
                                        className="form-control form-control-lg"
                                        value={filters.date_to}
                                        onChange={(e) => setFilterValue('date_to', e.target.value)}
                                    />
                                </div>
                                <div className="col-12">
                                    <div className="separator separator-dashed my-4"></div>
                                    <div className="d-flex justify-content-end gap-2">
                                        <button 
                                            onClick={resetFilters} 
                                            className="btn btn-light btn-lg"
                                        >
                                            <i className="ki-duotone ki-arrows-circle fs-3 me-2">
                                                <span className="path1"></span>
                                                <span className="path2"></span>
                                            </i>
                                            Reset All Filters
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                tableCardRef.current?.scrollIntoView({
                                                    behavior: "smooth",
                                                    block: "start",
                                                });
                                            }}
                                            className="btn btn-primary btn-lg"
                                        >
                                            <i className="ki-duotone ki-check fs-3 me-2">
                                                <span className="path1"></span>
                                                <span className="path2"></span>
                                            </i>
                                            Apply Filters
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
            )}

            {/* Table Card - Separate Card */}
            <div className="card" ref={tableCardRef}>
                {/* Card Header */}
                <div className="card-header border-0 pt-6">
                    <div className="card-title flex-column flex-lg-row align-items-stretch align-items-lg-center justify-content-between gap-3 w-100">
                        <div className="d-flex flex-column flex-sm-row flex-wrap align-items-stretch align-items-sm-center gap-2 flex-grow-1" style={{ minWidth: 0 }}>
                            <div className="flex-grow-1" style={{ minWidth: '200px', maxWidth: '420px' }}>
                                <label className="form-label mb-1 text-muted fs-7 text-uppercase">Search</label>
                                <div className="d-flex align-items-center position-relative" style={{ minWidth: '250px' }}>
                                    <i className="ki-duotone ki-magnifier fs-2 position-absolute ms-4" style={{ zIndex: 1 }}>
                                        <span className="path1"></span>
                                        <span className="path2"></span>
                                    </i>
                                    <input
                                        type="text"
                                        className="form-control form-control-solid ps-13"
                                        placeholder="Service ID, name, short code…"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        autoComplete="off"
                                        style={{ paddingLeft: '3rem' }}
                                    />
                                    {searchTerm && (
                                        <button
                                            type="button"
                                            className="btn btn-icon btn-sm btn-active-color-primary position-absolute end-0 me-2"
                                            onClick={() => setSearchTerm('')}
                                            style={{ zIndex: 1 }}
                                        >
                                            <i className="ki-duotone ki-cross fs-2">
                                                <span className="path1"></span>
                                                <span className="path2"></span>
                                            </i>
                                        </button>
                                    )}
                                </div>
                            </div>
                           
                        </div>
                        <div className="d-flex align-items-end gap-2 flex-shrink-0">
                            <div className="d-flex align-items-center gap-2">
                                <label className="form-label mb-0 text-nowrap">Per page:</label>
                                <select 
                                    className="form-select form-select-sm" 
                                    style={{width: '80px'}}
                                    value={pagination.per_page}
                                    onChange={(e) => handlePerPageChange(Number(e.target.value))}
                                >
                                    <option value="10">10</option>
                                    <option value="15">15</option>
                                    <option value="25">25</option>
                                    <option value="50">50</option>
                                    <option value="100">100</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Card Body */}
                <div className="card-body pt-0">
                    {/* Loading Bar - Shows on top of existing data when fetching */}
                    {isFetching && !loading && (
                        <div className="mb-4" style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                            <div className="progress" style={{ height: '3px' }}>
                                <div className="progress-bar progress-bar-striped progress-bar-animated bg-primary w-100"></div>
                            </div>
                        </div>
                    )}

                    <div className="table-responsive" style={{ opacity: isFetching ? 0.7 : 1, transition: 'opacity 0.2s' }}>
                    <table className="table align-middle table-row-dashed fs-6 gy-5">
                        <thead>
                            <tr className="text-start text-muted fw-bold fs-7 text-uppercase gs-0">
                                <th className="w-10px pe-2">
                                    <div className="form-check form-check-sm form-check-custom form-check-solid me-3">
                                        <input
                                            className="form-check-input"
                                            type="checkbox"
                                            checked={selectAll}
                                            onChange={handleSelectAll}
                                        />
                                    </div>
                                </th>
                                <th className="min-w-90px">Image</th>
                                <th className="min-w-150px">Country</th>
                                <th className="min-w-125px">Partner</th>
                                <th className="min-w-140px">Category</th>
                                <th className="min-w-150px">Service Name</th>
                                <th className="min-w-100px">Active Status</th>
                                <th className="min-w-140px text-nowrap">Created</th>
                                <th className="text-end min-w-100px">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-600 fw-semibold">
                            {loading && services.length === 0 ? (
                                // Skeleton loading rows
                                Array.from({ length: 10 }).map((_, index) => (
                                    <tr key={`skeleton-${index}`}>
                                            <td colSpan="9">
                                            <div className="placeholder" style={{ width: '100%', height: '40px', borderRadius: '4px', backgroundColor: '#6c757d' }}></div>
                                        </td>
                                    </tr>
                                ))
                            ) : services.length > 0 ? (
                                services.map((service) => {
                                    const { label: countryLabel, code: countryCode } = getServiceCountryDisplay(
                                        service,
                                        getCountryById,
                                        countryLookupLoading
                                    );
                                    return (
                                    <tr key={service.id}>
                                        <td>
                                            <div className="form-check form-check-sm form-check-custom form-check-solid">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    checked={selectedServices.includes(service.id)}
                                                    onChange={() => handleSelectService(service.id)}
                                                />
                                            </div>
                                        </td>
                                        <td>
                                            <div className="symbol symbol-40px">
                                                {resolveBackendAssetUrl(AUTH_SERVICE_BASE, service.image_url || service.image) ? (
                                                    <img
                                                        src={resolveBackendAssetUrl(AUTH_SERVICE_BASE, service.image_url || service.image)}
                                                        alt={resolveServiceName(service)}
                                                        className="rounded"
                                                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                                    />
                                                ) : (
                                                    <div className="symbol-label fs-7 fw-semibold text-primary bg-light-primary">
                                                        {resolveServiceName(service).charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="d-flex align-items-center">
                                                {countryCode && (
                                                    <img 
                                                        src={`/flags/${String(countryCode).toLowerCase()}.png`} 
                                                        alt={countryLabel || 'Country'}
                                                        className="me-2"
                                                        style={{ width: '20px', height: '15px', objectFit: 'cover' }}
                                                        onError={(e) => { e.target.style.display = 'none'; }}
                                                    />
                                                )}
                                                <span className="text-gray-800">
                                                    {countryLabel}
                                                </span>
                                            </div>
                                        </td>
                                        <td>{resolvePartnerDisplayName(service)}</td>
                                        <td>
                                            <span className="text-gray-800">{resolveCategoryName(service)}</span>
                                        </td>
                                        <td>
                                            <div className="text-gray-800 text-hover-primary mb-1">
                                                {resolveServiceName(service)}
                                            </div>
                                            {service.id && (
                                                <div className="text-muted fs-7 text-break">UUID: {service.id}</div>
                                            )}
                                        </td>
                                        <td>
                                            <div className="form-check form-switch form-check-custom form-check-solid d-flex justify-content-center">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    checked={service.is_active === true || service.is_active === 1}
                                                    onChange={() => handleToggleActive(service.id)}
                                                    style={{ cursor: 'pointer' }}
                                                    title={service.is_active ? "Click to deactivate" : "Click to activate"}
                                                />
                                            </div>
                                        </td>
                                        <td>
                                            <span className="text-gray-700 fs-7 text-nowrap">
                                                {service.created_at ? formatDateTime(service.created_at) : '—'}
                                            </span>
                                        </td>
                                        <td className="text-end">
                                            <Link
                                                to={`/admin/services/${service.id}`}
                                                className="btn btn-icon btn-bg-light btn-active-color-info btn-sm me-1"
                                                title="View"
                                            >
                                                <i className="ki-duotone ki-eye fs-2">
                                                    <span className="path1"></span>
                                                    <span className="path2"></span>
                                                    <span className="path3"></span>
                                                </i>
                                            </Link>
                                            <Link
                                                to={`/admin/services/${service.id}/edit`}
                                                className="btn btn-icon btn-bg-light btn-active-color-primary btn-sm me-1"
                                                title="Edit"
                                            >
                                                <i className="ki-duotone ki-pencil fs-2">
                                                    <span className="path1"></span>
                                                    <span className="path2"></span>
                                                </i>
                                            </Link>
                                            <button
                                                className="btn btn-icon btn-bg-light btn-active-color-danger btn-sm"
                                                onClick={() => handleDelete(service.id)}
                                                title="Delete"
                                            >
                                                <i className="ki-duotone ki-trash fs-2">
                                                    <span className="path1"></span>
                                                    <span className="path2"></span>
                                                    <span className="path3"></span>
                                                    <span className="path4"></span>
                                                    <span className="path5"></span>
                                                </i>
                                            </button>
                                        </td>
                                    </tr>
                                );
                                })
                            ) : (
                                <tr>
                                        <td colSpan="9" className="text-center py-5">
                                        No services found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {!loading && pagination.last_page > 1 && (
                    <div className="d-flex justify-content-between align-items-center pt-4">
                        <div className="text-muted">
                            Showing {services.length} of {pagination.total || 0} services
                            {pagination.last_page > 1 && ` (Page ${pagination.current_page} of ${pagination.last_page})`}
                        </div>
                        <nav>
                            <ul className="pagination mb-0">
                                <li className={`page-item ${pagination.current_page === 1 || isFetching ? 'disabled' : ''}`}>
                                    <button
                                        className="page-link"
                                        onClick={() => handlePageChange(Math.max(pagination.current_page - 1, 1))}
                                        disabled={pagination.current_page === 1 || isFetching}
                                    >
                                        Previous
                                    </button>
                                </li>
                                {[...Array(Math.min(pagination.last_page, 10))].map((_, i) => {
                                    const pageNum = i + 1;
                                    return (
                                        <li key={pageNum} className={`page-item ${pagination.current_page === pageNum ? 'active' : ''} ${isFetching ? 'disabled' : ''}`}>
                                            <button
                                                className="page-link"
                                                onClick={() => handlePageChange(pageNum)}
                                                disabled={isFetching}
                                            >
                                                {pageNum}
                                            </button>
                                        </li>
                                    );
                                })}
                                {pagination.last_page > 10 && <li className="page-item disabled"><span className="page-link">...</span></li>}
                                <li className={`page-item ${pagination.current_page === pagination.last_page || isFetching ? 'disabled' : ''}`}>
                                    <button
                                        className="page-link"
                                        onClick={() => handlePageChange(Math.min(pagination.current_page + 1, pagination.last_page))}
                                        disabled={pagination.current_page === pagination.last_page || isFetching}
                                    >
                                        Next
                                    </button>
                                </li>
                            </ul>
                        </nav>
                    </div>
                )}
                </div>
            </div>

            <ServicesCatalogPreviewModal
                show={previewModalOpen}
                onHide={() => setPreviewModalOpen(false)}
                listQueryParams={previewListParams}
            />
        </>
    );
};

export default Services;

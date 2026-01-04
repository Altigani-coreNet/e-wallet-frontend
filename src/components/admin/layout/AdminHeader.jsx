import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ADMIN_ENDPOINTS } from '../../../utils/constants';
import { getToken, removeToken, getUser } from '../../../utils/api';
import { useSidebar } from '../../../contexts/SidebarContext';

const AdminHeader = () => {
    const navigate = useNavigate();
    const user = getUser();
    const { toggleSidebar } = useSidebar();
    const [isSidebarMinimized, setIsSidebarMinimized] = useState(false);

    // Monitor sidebar minimize state
    useEffect(() => {
        const checkSidebarState = () => {
            const isMinimized = 
                document.body.classList.contains('app-sidebar-minimize') || 
                document.body.getAttribute('data-kt-app-sidebar-minimize') === 'on';
            setIsSidebarMinimized(isMinimized);
        };

        // Initial check
        checkSidebarState();

        // Watch for changes
        const observer = new MutationObserver(checkSidebarState);
        observer.observe(document.body, {
            attributes: true,
            attributeFilter: ['class', 'data-kt-app-sidebar-minimize']
        });

        // Listen for toggle events
        const sidebarToggle = document.querySelector('[data-kt-toggle-name="app-sidebar-minimize"]');
        const handleToggle = () => {
            setTimeout(checkSidebarState, 100);
        };
        
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', handleToggle);
        }

        return () => {
            observer.disconnect();
            if (sidebarToggle) {
                sidebarToggle.removeEventListener('click', handleToggle);
            }
        };
    }, []);

    const handleLogout = async () => {
        try {
            const token = getToken();
            if (token) {
                await axios.post(ADMIN_ENDPOINTS.LOGOUT, {}, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            removeToken();
            delete axios.defaults.headers.common['Authorization'];
            toast.success('Logged out successfully');
            navigate('/admin/login');
        }
    };

    // Reinitialize Metronic components after render
    useEffect(() => {
        if (window.KTMenu) {
            window.KTMenu.createInstances();
        }
        if (window.KTThemeMode) {
            window.KTThemeMode.init();
        }
    }, []);

    return (
        <div id="kt_app_header" className="app-header" 
             data-kt-sticky="true" 
             data-kt-sticky-activate="{default: true, lg: true}" 
             data-kt-sticky-name="app-header-minimize" 
             data-kt-sticky-offset="{default: '200px', lg: '0'}" 
             data-kt-sticky-animation="false">
            <div className="app-container container-fluid d-flex align-items-stretch justify-content-between" id="kt_app_header_container">
                {/* Begin::Sidebar mobile toggle */}
                <div className="d-flex align-items-center d-lg-none ms-n3 me-1 me-md-2" title="Show sidebar menu">
                    <button 
                        type="button" 
                        className="btn" 
                        id="kt_app_sidebar_mobile_toggle" 
                        onClick={toggleSidebar}
                        style={{ width: '35px', height: '35px', padding: 0, border: 'none', background: 'transparent' }}
                    >
                        <i className="ki-duotone ki-abstract-14 fs-2 fs-md-1">
                            <span className="path1"></span>
                            <span className="path2"></span>
                        </i>
                    </button>
                </div>
                {/* End::Sidebar mobile toggle */}

                {/* Begin::Mobile logo */}
                <div className="d-flex align-items-center flex-grow-1 flex-lg-grow-0">
                    <Link to="/admin/dashboard" className="d-lg-none">
                        <img alt="Logo" src="/logo.png" className="h-30px" />
                    </Link>
                </div>
                {/* End::Mobile logo */}

                {/* Begin::Header wrapper */}
                <div className="d-flex align-items-stretch justify-content-between flex-lg-grow-1" id="kt_app_header_wrapper">
                    {/* Begin::Menu wrapper */}
                    <div className="app-header-menu app-header-mobile-drawer align-items-stretch" 
                         data-kt-drawer="true" 
                         data-kt-drawer-name="app-header-menu" 
                         data-kt-drawer-activate="{default: true, lg: false}" 
                         data-kt-drawer-overlay="true" 
                         data-kt-drawer-width="250px" 
                         data-kt-drawer-direction="end" 
                         data-kt-drawer-toggle="#kt_app_header_menu_toggle" 
                         data-kt-swapper="true" 
                         data-kt-swapper-mode="{default: 'append', lg: 'prepend'}" 
                         data-kt-swapper-parent="{default: '#kt_app_body', lg: '#kt_app_header_wrapper'}">
                        <div className="menu menu-rounded menu-column menu-lg-row my-5 my-lg-0 align-items-stretch fw-semibold px-2 px-lg-0" 
                             id="kt_app_header_menu" 
                             data-kt-menu="true">
                            <div className="menu-item">
                                <Link to="/admin/dashboard" className="menu-link">
                                    <span className="menu-title">Dashboard</span>
                                </Link>
                            </div>
                        </div>
                    </div>
                    {/* End::Menu wrapper */}

                    {/* Begin::Navbar */}
                    <div className="app-navbar flex-shrink-0">
                       
                        {/* Begin::Search */}
                        <div className="app-navbar-item align-items-stretch ms-1 ms-md-4">
                            <div id="kt_header_search" className="header-search d-flex align-items-stretch">
                                <div className="d-flex align-items-center" id="kt_header_search_toggle">
                                    <div className="btn btn-icon btn-custom btn-icon-muted btn-active-light btn-active-color-primary w-35px h-35px">
                                        <i className="ki-duotone ki-magnifier fs-2">
                                            <span className="path1"></span>
                                            <span className="path2"></span>
                                        </i>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* End::Search */}

                        {/* Begin::Theme mode */}
                        <div className="app-navbar-item ms-1 ms-md-4">
                            <a href="#" className="btn btn-icon btn-custom btn-icon-muted btn-active-light btn-active-color-primary w-35px h-35px" data-kt-menu-trigger="{default:'click', lg: 'hover'}" data-kt-menu-attach="parent" data-kt-menu-placement="bottom-end">
                                <i className="ki-duotone ki-night-day theme-light-show fs-1">
                                    <span className="path1"></span>
                                    <span className="path2"></span>
                                    <span className="path3"></span>
                                    <span className="path4"></span>
                                    <span className="path5"></span>
                                    <span className="path6"></span>
                                    <span className="path7"></span>
                                    <span className="path8"></span>
                                    <span className="path9"></span>
                                    <span className="path10"></span>
                                </i>
                                <i className="ki-duotone ki-moon theme-dark-show fs-1">
                                    <span className="path1"></span>
                                    <span className="path2"></span>
                                </i>
                            </a>
                            {/* Theme mode menu */}
                            <div className="menu menu-sub menu-sub-dropdown menu-column menu-rounded menu-title-gray-700 menu-icon-gray-500 menu-active-bg menu-state-color fw-semibold py-4 fs-base w-150px" data-kt-menu="true" data-kt-element="theme-mode-menu">
                                <div className="menu-item px-3 my-0">
                                    <a href="#" className="menu-link px-3 py-2" data-kt-element="mode" data-kt-value="light">
                                    <span className="menu-icon" data-kt-element="icon">
                                        <i className="ki-duotone ki-night-day fs-2 ">
                                                <span className="path1"></span>
                                                <span className="path2"></span>
                                                <span className="path3"></span>
                                                <span className="path4"></span>
                                                <span className="path5"></span>
                                                <span className="path6"></span>
                                                <span className="path7"></span>
                                                <span className="path8"></span>
                                                <span className="path9"></span>
                                                <span className="path10"></span>
                                            </i>
                                        </span>
                                        <span className="menu-title">Light</span>
                                    </a>
                                </div>
                                <div className="menu-item px-3 my-0">
                                    <a href="#" className="menu-link px-3 py-2" data-kt-element="mode" data-kt-value="dark">
                                        <span className="menu-icon" data-kt-element="icon">
                                            <i className="ki-duotone ki-moon fs-2">
                                                <span className="path1"></span>
                                                <span className="path2"></span>
                                            </i>
                                        </span>
                                        <span className="menu-title">Dark</span>
                                    </a>
                                </div>
                                <div className="menu-item px-3 my-0">
                                    <a href="#" className="menu-link px-3 py-2" data-kt-element="mode" data-kt-value="system">
                                        <span className="menu-icon" data-kt-element="icon">
                                            <i className="ki-duotone ki-screen fs-2">
                                                <span className="path1"></span>
                                                <span className="path2"></span>
                                                <span className="path3"></span>
                                                <span className="path4"></span>
                                            </i>
                                        </span>
                                        <span className="menu-title">System</span>
                                    </a>
                                </div>
                            </div>
                        </div>
                        {/* End::Theme mode */}

                        {/* Begin::User menu */}
                        <div className="app-navbar-item ms-1 ms-md-4" id="kt_header_user_menu_toggle">
                            <div className="cursor-pointer symbol symbol-35px" data-kt-menu-trigger="{default: 'click', lg: 'hover'}" data-kt-menu-attach="parent" data-kt-menu-placement="bottom-end">
                                <div className="symbol-label fs-6 fw-semibold bg-light-primary text-primary">
                                    {user?.name?.charAt(0)?.toUpperCase() || 'A'}
                                </div>
                            </div>

                            {/* User account menu */}
                            <div className="menu menu-sub menu-sub-dropdown menu-column menu-rounded menu-gray-800 menu-state-bg menu-state-color fw-semibold py-4 fs-6 w-275px" data-kt-menu="true">
                                {/* Menu item */}
                                <div className="menu-item px-3">
                                    <div className="menu-content d-flex align-items-center px-3">
                                        <div className="symbol symbol-50px me-5">
                                            <div className="symbol-label fs-3 fw-semibold bg-light-primary text-primary">
                                                {user?.name?.charAt(0)?.toUpperCase() || 'A'}
                                            </div>
                                        </div>
                                        <div className="d-flex flex-column">
                                            <div className="fw-bold d-flex align-items-center fs-5">
                                                {user?.name}
                                                <span className="badge badge-light-danger fw-bold fs-8 px-2 py-1 ms-2">Admin</span>
                                            </div>
                                            <a href="#" className="fw-semibold text-muted text-hover-primary fs-7">
                                                {user?.email}
                                            </a>
                                        </div>
                                    </div>
                                </div>
                                {/* Separator */}
                                <div className="separator my-2"></div>
                                {/* Menu item - Merchant Dashboard */}
                                <div className="menu-item px-5">
                                    <Link to="/merchant/dashboard" className="menu-link px-5">
                                        Switch to Merchant
                                    </Link>
                                </div>
                                {/* Separator */}
                                <div className="separator my-2"></div>
                                {/* Menu item - Sign out */}
                                <div className="menu-item px-5">
                                    <a onClick={handleLogout} className="menu-link px-5" style={{ cursor: 'pointer' }}>
                                        Sign Out
                                    </a>
                                </div>
                            </div>
                        </div>
                        {/* End::User menu */}
                    </div>
                    {/* End::Navbar */}
                </div>
                {/* End::Header wrapper */}
            </div>
        </div>
    );
};

export default AdminHeader;


import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import AdminToolbar from './AdminToolbar';
import '../../layout/MainLayout.css';
import { SidebarProvider } from '../../../contexts/SidebarContext';

const AdminLayout = () => {
    const [isSidebarMinimized, setIsSidebarMinimized] = useState(false);
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    // Reinitialize Metronic components when layout mounts
    useEffect(() => {
        // Initialize theme mode first
        const initTheme = () => {
            var defaultThemeMode = "light";
            var themeMode;
            if (document.documentElement) {
                if (document.documentElement.hasAttribute("data-bs-theme-mode")) {
                    themeMode = document.documentElement.getAttribute("data-bs-theme-mode");
                } else {
                    if (localStorage.getItem("data-bs-theme") !== null) {
                        themeMode = localStorage.getItem("data-bs-theme");
                    } else {
                        themeMode = defaultThemeMode;
                    }
                }
                if (themeMode === "system") {
                    themeMode = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
                }
                document.documentElement.setAttribute("data-bs-theme", themeMode);
            }
        };
        
        initTheme();
        
        // Small delay to ensure DOM is ready
        setTimeout(() => {
            // Reinitialize all Metronic components
            if (window.KTComponents) {
                window.KTComponents.init();
            }
            
            // Reinitialize KTMenu
            if (window.KTMenu) {
                window.KTMenu.createInstances();
            }
            
            // Reinitialize KTDrawer for sidebar
            if (window.KTDrawer) {
                window.KTDrawer.init();
            }
            
            // Reinitialize KTScroll
            if (window.KTScroll) {
                window.KTScroll.init();
            }
            
            // Reinitialize KTSticky for header
            if (window.KTSticky) {
                window.KTSticky.init();
            }
            
            // Initialize KTApp if available
            if (window.KTApp) {
                window.KTApp.init();
            }
            
            // Initialize theme mode switcher
            if (window.KTThemeMode) {
                window.KTThemeMode.init();
            }
        }, 100);
    }, []);

    // Track window width for responsive layout
    useEffect(() => {
        const handleResize = () => {
            setWindowWidth(window.innerWidth);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Monitor sidebar minimize state
    useEffect(() => {
        const checkSidebarState = () => {
            // Check multiple ways the sidebar minimize state might be stored
            const sidebar = document.getElementById('kt_app_sidebar');
            const isMinimized = 
                document.body.classList.contains('app-sidebar-minimize') || 
                document.body.getAttribute('data-kt-app-sidebar-minimize') === 'on' ||
                (sidebar && sidebar.classList.contains('app-sidebar-minimize')) ||
                (sidebar && sidebar.classList.contains('minimize'));
            
            setIsSidebarMinimized(isMinimized);
        };

        // Initial check
        checkSidebarState();

        // Watch for changes using MutationObserver on body
        const bodyObserver = new MutationObserver(checkSidebarState);
        bodyObserver.observe(document.body, {
            attributes: true,
            attributeFilter: ['class', 'data-kt-app-sidebar-minimize']
        });

        // Watch for changes on sidebar element
        const sidebar = document.getElementById('kt_app_sidebar');
        let sidebarObserver = null;
        if (sidebar) {
            sidebarObserver = new MutationObserver(checkSidebarState);
            sidebarObserver.observe(sidebar, {
                attributes: true,
                attributeFilter: ['class']
            });
        }

        // Also listen for sidebar toggle events
        const sidebarToggle = document.querySelector('[data-kt-toggle-name="app-sidebar-minimize"]');
        const handleToggle = () => {
            setTimeout(checkSidebarState, 100); // Small delay to let the class update
        };
        
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', handleToggle);
        }

        return () => {
            bodyObserver.disconnect();
            if (sidebarObserver) {
                sidebarObserver.disconnect();
            }
            if (sidebarToggle) {
                sidebarToggle.removeEventListener('click', handleToggle);
            }
        };
    }, []);

    return (
        <SidebarProvider>
            {/* Begin::App */}
            <div className="d-flex flex-column flex-root app-root" id="kt_app_root" style={{ width: windowWidth <= 1024 ? '100%' : (isSidebarMinimized ? '100%' : '90%') }}>
                {/* Begin::Page */}
                <div className="app-page flex-column flex-column-fluid" id="kt_app_page" style={{ width: windowWidth <= 1024 ? '100%' : (isSidebarMinimized ? '93%' : '90%') }}>
                    {/* Begin::Header */}
                    <AdminHeader />
                    {/* End::Header */}
                    
                    {/* Begin::Wrapper */}
                    <div className="app-wrapper flex-column flex-row-fluid" id="kt_app_wrapper" style={{ width: '100%' }}>
                        {/* Begin::Sidebar */}
                        <AdminSidebar />
                        {/* End::Sidebar */}
                        
                        {/* Begin::Main */}
                        <div className="app-main flex-column flex-row-fluid" id="kt_app_main" style={{ width: '100%' }}>
                            {/* Begin::Content wrapper */}
                            <div className="d-flex flex-column flex-column-fluid" style={{ width: '100%' }}>
                                {/* Begin::Toolbar */}
                                <AdminToolbar />
                                {/* End::Toolbar */}
                                
                                {/* Begin::Content */}
                                <div id="kt_app_content" className="app-content flex-column-fluid" style={{ width: '100%' }}>
                                    {/* Begin::Content container */}
                                    <div id="kt_app_content_container" className="app-container container-fluid" style={{ width: '100%' }}>
                                        <Outlet />
                                    </div>
                                    {/* End::Content container */}
                                </div>
                                {/* End::Content */}
                            </div>
                            {/* End::Content wrapper */}
                            
                            {/* Begin::Footer */}
                            <div id="kt_app_footer" className="app-footer mt-auto">
                                <div className="app-container container-fluid d-flex flex-column flex-md-row flex-center flex-md-stack py-3">
                                    <div className="text-dark order-2 order-md-1">
                                        <span className="text-muted fw-semibold me-1">2025©</span>
                                        <a href="#" className="text-gray-800 text-hover-primary">FastPay - Payment Gateway</a>
                                    </div>
                                    <ul className="menu menu-gray-600 menu-hover-primary fw-semibold order-1">
                                        <li className="menu-item">
                                            <a href="#" className="menu-link px-2">About</a>
                                        </li>
                                        <li className="menu-item">
                                            <a href="#" className="menu-link px-2">Support</a>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                            {/* End::Footer */}
                        </div>
                        {/* End::Main */}
                    </div>
                    {/* End::Wrapper */}
                </div>
                {/* End::Page */}
            </div>
            {/* End::App */}
            
            {/* Begin::Scrolltop */}
            <div id="kt_scrolltop" className="scrolltop" data-kt-scrolltop="true">
                <i className="ki-duotone ki-arrow-up">
                    <span className="path1"></span>
                    <span className="path2"></span>
                </i>
            </div>
            {/* End::Scrolltop */}
        </SidebarProvider>
    );
};

export default AdminLayout;




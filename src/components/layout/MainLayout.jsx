import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import Toolbar from './Toolbar';
import './MainLayout.css';
import { useToolbar } from '../../contexts/ToolbarContext';
import { SidebarProvider, useSidebar } from '../../contexts/SidebarContext';
import useAuthStore from '../../stores/authStore';

const MainLayoutContent = () => {
    const { i18n } = useTranslation();
    const layoutDir = i18n.dir();
    const isArabicLayout = layoutDir === 'rtl';
    const { title, breadcrumbs, actions } = useToolbar();
    const { closeSidebar } = useSidebar();
    const location = useLocation();
    const { 
        token,
        profileLoading,
        profileLoaded,
        profileError,
        fetchProfile
    } = useAuthStore();

    // Close sidebar on route change (mobile only)
    useEffect(() => {
        if (window.innerWidth < 992) {
            closeSidebar();
        }
    }, [location.pathname, closeSidebar]);

    // Ensure merchant profile is fetched after login / refresh
    useEffect(() => {
        if (!token) {
            return;
        }

        if (profileLoading || profileLoaded || profileError) {
            return;
        }

        fetchProfile().catch((err) => {
            console.error('Failed to preload profile:', err);
        });
    }, [token, profileLoading, profileLoaded, profileError, fetchProfile]);

    const showSidebarSkeleton = profileLoading || (!profileLoaded && !profileError);
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

    return (
        <>
            {/* Begin::App */}
            <div
                className={`d-flex flex-column flex-root app-root${isArabicLayout ? ' app-layout-ar' : ''}`}
                id="kt_app_root"
                dir={layoutDir}
                data-app-locale={isArabicLayout ? 'ar' : 'en'}
            >
                {/* Begin::Page */}
                <div
                    className={`app-page flex-column flex-column-fluid${isArabicLayout ? ' app-layout-ar' : ''}`}
                    id="kt_app_page"
                    dir={layoutDir}
                >
                    {/* Begin::Header */}
                    <Header />
                    {/* End::Header */}
                    
                    {/* Begin::Wrapper — dir + app-layout-ar so RTL flex/order mirror reliably */}
                    <div
                        className={`app-wrapper flex-column flex-row-fluid${isArabicLayout ? ' app-layout-ar' : ''}`}
                        id="kt_app_wrapper"
                        dir={layoutDir}
                    >
                        {/* Begin::Sidebar */}
                        <Sidebar isLoading={showSidebarSkeleton} error={profileError} onRetry={fetchProfile} />
                        {/* End::Sidebar */}
                        
                        {/* Begin::Main */}
                        <div className="app-main flex-column flex-row-fluid" id="kt_app_main">
                            {/* Begin::Content wrapper */}
                            <div className="d-flex flex-column flex-column-fluid">
                                {/* Begin::Toolbar */}
                                <Toolbar title={title} breadcrumbs={breadcrumbs} actions={actions} />
                                {/* End::Toolbar */}
                                
                                {/* Begin::Content */}
                                <div id="kt_app_content" className="app-content flex-column-fluid">
                                    {/* Begin::Content container */}
                                    <div id="kt_app_content_container" className="app-container container-fluid">
                                        {profileError && (
                                            <div className="alert alert-danger d-flex align-items-center justify-content-between mb-5" role="alert">
                                                <div>
                                                    <strong>Profile data failed to load.</strong> Some navigation items may be unavailable.
                                                </div>
                                                <button 
                                                    type="button" 
                                                    className="btn btn-sm btn-light-danger"
                                                    onClick={() => fetchProfile().catch(() => {})}
                                                    disabled={profileLoading}
                                                >
                                                    {profileLoading ? 'Retrying...' : 'Retry'}
                                                </button>
                                            </div>
                                        )}
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
                                        <a href="#" className="text-gray-800 text-hover-primary">Corenet Tech</a>
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
        </>
    );
};

const MainLayout = () => {
    return (
        <SidebarProvider>
            <MainLayoutContent />
        </SidebarProvider>
    );
};

export default MainLayout;


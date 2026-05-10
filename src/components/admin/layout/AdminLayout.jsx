import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import AdminToolbar from './AdminToolbar';
import '../../layout/MainLayout.css';
import { SidebarProvider } from '../../../contexts/SidebarContext';

const AdminLayout = () => {
    const { t, i18n } = useTranslation();
    const layoutDir = i18n.dir();
    const isArabicLayout = layoutDir === 'rtl';
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
        <SidebarProvider>
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
                    <AdminHeader />
                    {/* End::Header */}
                    
                    {/* Begin::Wrapper — same RTL hooks as merchant MainLayout */}
                    <div
                        className={`app-wrapper flex-column flex-row-fluid${isArabicLayout ? ' app-layout-ar' : ''}`}
                        id="kt_app_wrapper"
                        dir={layoutDir}
                    >
                        {/* Begin::Sidebar */}
                        <AdminSidebar />
                        {/* End::Sidebar */}
                        
                        {/* Begin::Main */}
                        <div className="app-main flex-column flex-row-fluid" id="kt_app_main">
                            {/* Begin::Content wrapper */}
                            <div className="d-flex flex-column flex-column-fluid">
                                {/* Begin::Toolbar */}
                                <AdminToolbar />
                                {/* End::Toolbar */}
                                
                                {/* Begin::Content */}
                                <div id="kt_app_content" className="app-content flex-column-fluid">
                                    {/* Begin::Content container */}
                                    <div id="kt_app_content_container" className="app-container container-fluid">
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
                                        <span className="text-muted fw-semibold me-1">{t('admin.footer.copyright')}</span>
                                        <a href="#" className="text-gray-800 text-hover-primary">{t('admin.footer.companyName')}</a>
                                    </div>
                                    <ul className="menu menu-gray-600 menu-hover-primary fw-semibold order-1">
                                        <li className="menu-item">
                                            <a href="#" className="menu-link px-2">{t('admin.footer.about')}</a>
                                        </li>
                                        <li className="menu-item">
                                            <a href="#" className="menu-link px-2">{t('admin.footer.support')}</a>
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




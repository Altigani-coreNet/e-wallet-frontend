import React, { createContext, useState, useContext, useMemo, useCallback, useEffect } from 'react';

const SidebarContext = createContext();

export const useSidebar = () => {
    const context = useContext(SidebarContext);
    if (!context) {
        throw new Error('useSidebar must be used within SidebarProvider');
    }
    return context;
};

export const SidebarProvider = ({ children }) => {
    const [isOpen, setIsOpenState] = useState(false);

    const toggleSidebar = useCallback(() => {
        setIsOpenState(prev => !prev);
    }, []);

    const openSidebar = useCallback(() => {
        setIsOpenState(true);
    }, []);

    const closeSidebar = useCallback(() => {
        setIsOpenState(false);
    }, []);

    const createOverlay = useCallback(() => {
        let overlay = document.querySelector('.drawer-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'drawer-overlay';
            overlay.setAttribute('data-kt-drawer-overlay', 'true');
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.3);
                z-index: 104;
                display: none;
            `;
            document.body.appendChild(overlay);
        }
        return overlay;
    }, []);

    // Handle overlay and body classes when sidebar state changes
    useEffect(() => {
        const sidebar = document.getElementById('kt_app_sidebar');
        const overlay = document.querySelector('.drawer-overlay') || createOverlay();

        if (sidebar) {
            if (isOpen) {
                sidebar.classList.add('drawer-on');
                document.body.setAttribute('data-kt-drawer', 'on');
                document.body.setAttribute('data-kt-drawer-name', 'app-sidebar');
                if (overlay) overlay.style.display = 'block';
            } else {
                sidebar.classList.remove('drawer-on');
                document.body.removeAttribute('data-kt-drawer');
                document.body.removeAttribute('data-kt-drawer-name');
                if (overlay) overlay.style.display = 'none';
            }
        }

        // Close sidebar when overlay is clicked
        if (overlay && isOpen) {
            const handleOverlayClick = () => {
                closeSidebar();
            };
            overlay.onclick = handleOverlayClick;
        }

        return () => {
            if (overlay) {
                overlay.onclick = null;
            }
        };
    }, [isOpen, closeSidebar, createOverlay]);

    // Close sidebar on route change (mobile only)
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 992) { // lg breakpoint
                closeSidebar();
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [closeSidebar]);

    const value = useMemo(() => ({
        isOpen,
        toggleSidebar,
        openSidebar,
        closeSidebar
    }), [isOpen, toggleSidebar, openSidebar, closeSidebar]);

    return (
        <SidebarContext.Provider value={value}>
            {children}
        </SidebarContext.Provider>
    );
};


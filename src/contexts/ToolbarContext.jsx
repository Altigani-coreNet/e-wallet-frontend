import React, { createContext, useState, useContext, useMemo, useCallback } from 'react';

/**
 * Toolbar chrome state (title, breadcrumbs, actions) for MainLayout’s <Toolbar />.
 * Layout direction for Arabic is handled in Toolbar.jsx via i18next (dir=rtl + flex),
 * not here — avoid duplicating RTL state in context.
 */
const ToolbarContext = createContext();

export const useToolbar = () => {
    const context = useContext(ToolbarContext);
    if (!context) {
        throw new Error('useToolbar must be used within ToolbarProvider');
    }
    return context;
};

export const ToolbarProvider = ({ children }) => {
    const [title, setTitleState] = useState('Dashboard');
    const [breadcrumbs, setBreadcrumbsState] = useState([]);
    const [actions, setActionsState] = useState(null);

    // Create stable setter functions using useCallback
    const setTitle = useCallback((newTitle) => {
        setTitleState(newTitle);
    }, []);

    const setBreadcrumbs = useCallback((newBreadcrumbs) => {
        setBreadcrumbsState(newBreadcrumbs);
    }, []);

    const setActions = useCallback((newActions) => {
        setActionsState(newActions);
    }, []);

    // Memoize the context value to prevent unnecessary re-renders
    // Only include state values in dependencies, not the setter functions
    const value = useMemo(() => ({
        title, 
        setTitle,
        breadcrumbs, 
        setBreadcrumbs,
        actions, 
        setActions 
    }), [title, breadcrumbs, actions, setTitle, setBreadcrumbs, setActions]);

    return (
        <ToolbarContext.Provider value={value}>
            {children}
        </ToolbarContext.Provider>
    );
};


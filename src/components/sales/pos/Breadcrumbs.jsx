import React, { useEffect } from 'react';
import usePosStore from '../../../stores/usePosStore';

const Breadcrumbs = ({ 
    title = "POS System", 
    breadcrumbs = [
        { text: "Home", href: "/merchant/dashboard" },
        { text: "Sales" }
    ],
    actions = [
        { text: "Recent Orders", href: "/sales/orders", variant: "secondary" },
        { text: "New Product", href: "/sales/products/create", variant: "primary" }
    ]
}) => {
    const { searchTerm, setSearchTerm, isFullscreen, toggleFullscreen } = usePosStore();
    
    // Hide toolbar safely
    useEffect(() => {
        // Cleanup: restore toolbar when component unmounts
        return () => {
            const toolbar = document.getElementById('kt_app_toolbar');
            if (toolbar) {
                toolbar.style.display = '';
            }
        };
    }, []);

    const handleFullscreenToggle = () => {
        toggleFullscreen();
        
        // Toggle fullscreen class on the main app container
        const appContainer = document.getElementById('pos-app');
        if (appContainer) {
            if (!isFullscreen) {
                // Enter fullscreen
                appContainer.classList.add('fullscreen-mode');
                if (document.documentElement.requestFullscreen) {
                    document.documentElement.requestFullscreen();
                } else if (document.documentElement.webkitRequestFullscreen) {
                    document.documentElement.webkitRequestFullscreen();
                } else if (document.documentElement.msRequestFullscreen) {
                    document.documentElement.msRequestFullscreen();
                }
            } else {
                // Exit fullscreen
                appContainer.classList.remove('fullscreen-mode');
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                } else if (document.webkitExitFullscreen) {
                    document.webkitExitFullscreen();
                } else if (document.msExitFullscreen) {
                    document.msExitFullscreen();
                }
            }
        }
    };

    // Handle fullscreen change events (e.g., when user presses ESC)
    useEffect(() => {
        const handleFullscreenChange = () => {
            const isCurrentlyFullscreen = !!(document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement);
            
            if (!isCurrentlyFullscreen && isFullscreen) {
                // User exited fullscreen, update state
                toggleFullscreen();
                const appContainer = document.getElementById('pos-app');
                if (appContainer) {
                    appContainer.classList.remove('fullscreen-mode');
                }
            }
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.addEventListener('msfullscreenchange', handleFullscreenChange);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
            document.removeEventListener('msfullscreenchange', handleFullscreenChange);
        };
    }, [isFullscreen, toggleFullscreen]);

    return (
        <div id="kt_app_toolbar_2" className="app-toolbar py-3 py-lg-6">
            {/* begin::Toolbar container */}
            <div id="kt_app_toolbar_container" className="app-container container-xxl d-flex flex-stack">
                {/* begin::Page title */}
                <div className="page-title d-flex flex-column justify-content-center flex-wrap me-3">
                    {/* begin::Title */}
                    <h1 className="page-heading d-flex text-gray-900 fw-bold fs-3 flex-column justify-content-center my-0">
                        {title}
                    </h1>
                    {/* end::Title */}
                    {/* begin::Breadcrumb */}
                    <ul className="breadcrumb breadcrumb-separatorless fw-semibold fs-7 my-0 pt-1">
                        {breadcrumbs.map((item, index) => (
                            <React.Fragment key={index}>
                                {/* begin::Item */}
                                <li className="breadcrumb-item text-muted">
                                    {item.href ? (
                                        <a href={item.href} className="text-muted text-hover-primary">
                                            {item.text}
                                        </a>
                                    ) : (
                                        item.text
                                    )}
                                </li>
                                {/* end::Item */}
                                {/* begin::Item separator */}
                                {index < breadcrumbs.length - 1 && (
                                    <li className="breadcrumb-item">
                                        <span className="bullet bg-gray-500 w-5px h-2px"></span>
                                    </li>
                                )}
                                {/* end::Item separator */}
                            </React.Fragment>
                        ))}
                    </ul>
                    {/* end::Breadcrumb */}
                </div>
                {/* end::Page title */}
                
                {/* begin::Search */}
                <div className="d-flex align-items-center me-3">
                    <input 
                        type="text" 
                        className="form-control border-gray-200 h-50px bg-body ps-13 fs-7 bill-search" 
                        name="search" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search..." 
                        data-kt-search-element="input"
                        style={{ minWidth: '600px' }}
                    />
                </div>
                {/* end::Search */}
                
                {/* begin::Actions */}
                <div className="d-flex align-items-center gap-2 gap-lg-3">
                    {actions.map((action, index) => (
                        <a 
                            key={index}
                            href={action.href} 
                            className={`btn btn-sm fw-bold btn-${action.variant}`}
                        >
                            {action.text}
                        </a>
                    ))}

                    <button 
                        onClick={handleFullscreenToggle}
                        className={`btn  btn-sm fw-bold ${isFullscreen ? 'btn-light-warning' : 'btn-light-primary'}`}
                    >
                        {isFullscreen ? (
                            <i className="ki-duotone ki-element-7 fs-2">
                                <span className="path1"></span>
                                <span className="path2"></span>
                           </i>
                        ) : (
                            <i className="ki-duotone ki-exit-right-corner fs-2">
                                <span className="path1"></span>
                                <span className="path2"></span>
                            </i>
                        )}
                    </button>
                </div>
                {/* end::Actions */}
            </div>
            {/* end::Toolbar container */}
        </div>
    );
};

export default Breadcrumbs;


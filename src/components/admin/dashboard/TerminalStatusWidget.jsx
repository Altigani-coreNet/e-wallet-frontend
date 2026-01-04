import React, { useState, useEffect } from 'react';

const TerminalStatusWidget = ({ data, loading }) => {
    const [activeTab, setActiveTab] = useState('online');
    
    const terminalStatus = data?.terminalStatus || {};
    const onlineTerminals = terminalStatus.onlineTerminals || [];
    const offlineTerminals = terminalStatus.offlineTerminals || [];
    const testingTerminals = terminalStatus.testingTerminals || [];
    
    useEffect(() => {
        console.log('TerminalStatusWidget - Data:', { 
            terminalStatus, 
            onlineCount: terminalStatus.onlineCount,
            offlineCount: terminalStatus.offlineCount,
            testingCount: terminalStatus.testingCount 
        });
    }, [terminalStatus]);

    const renderTerminalList = (terminals, statusColor) => {
        if (terminals.length === 0) {
            return (
                <div className="m-0 text-center py-10">
                    <div className="text-gray-500 fs-6">No terminals found</div>
                </div>
            );
        }

        return terminals.map((terminal, index) => (
            <div key={terminal.id}>
                <div className="m-0">
                    <div className="timeline timeline-border-dashed">
                        <div className="timeline-item">
                            <div className="timeline-line"></div>
                            <div className="timeline-icon">
                                <i className={`ki-duotone ki-cd fs-2 text-${statusColor}`}>
                                    <span className="path1"></span>
                                    <span className="path2"></span>
                                </i>
                            </div>
                            <div className="timeline-content m-0">
                                <span className={`fs-8 fw-bolder text-${statusColor} text-uppercase`}>Terminal ID</span>
                                <a href="#" className="fs-6 text-gray-800 fw-bold d-block text-hover-primary">
                                    {terminal.terminal_id || 'N/A'}
                                </a>
                                <span className="fw-semibold text-gray-500">{terminal.name || 'Unnamed'}</span>
                            </div>
                        </div>
                    </div>
                </div>
                {index < terminals.length - 1 && (
                    <div className="separator separator-dashed mt-5 mb-4"></div>
                )}
            </div>
        ));
    };

    const renderSkeletonList = () => (
        <div className="px-9">
            {Array.from({ length: 4 }).map((_, index) => (
                <div key={`skeleton-${index}`} className="mb-6">
                    <div className="skeleton skeleton-line mb-2" style={{ width: '60%', height: '16px' }}></div>
                    <div className="skeleton skeleton-line mb-1" style={{ width: '40%', height: '14px' }}></div>
                    <div className="skeleton skeleton-bar" style={{ width: '100%', height: '2px' }}></div>
                </div>
            ))}
        </div>
    );

    return (
        <div className="card card-flush h-xl-100">
            <div className="card-header pt-7">
                <h3 className="card-title align-items-start flex-column">
                    <span className="card-label fw-bold text-gray-800">Terminal Status</span>
                    <span className="text-gray-500 mt-1 fw-semibold fs-6">
                        {loading ? '--' : terminalStatus.onlineCount || 0} terminals in use
                    </span>
                </h3>
            </div>
            <div className="card-body pt-4 px-0" style={{ overflow: loading ? 'hidden' : 'visible' }}>
                <style>{`
                    .skeleton {
                        position: relative;
                        overflow: hidden;
                        background: #f3f4f6;
                        border-radius: 6px;
                    }
                    .skeleton::after {
                        content: '';
                        position: absolute;
                        inset: 0;
                        transform: translateX(-100%);
                        background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.6) 50%, rgba(255,255,255,0) 100%);
                        animation: skeleton-loading 1.4s infinite;
                    }
                    .skeleton-bar {
                        border-radius: 2px;
                    }
                    @keyframes skeleton-loading {
                        0% { transform: translateX(-100%); }
                        100% { transform: translateX(100%); }
                    }
                `}</style>
                <ul className="nav nav-pills nav-pills-custom item position-relative mx-9 mb-9" role="tablist">
                    <li className="nav-item col-4 mx-0 p-0" role="presentation">
                        <a 
                            className={`nav-link active d-flex justify-content-center w-100 border-0 h-100 ${activeTab === 'online' ? 'active' : ''}`}
                            onClick={() => setActiveTab('online')}
                            style={{ cursor: 'pointer' }}
                        >
                            <span className="nav-text text-gray-800 fw-bold fs-6 mb-3">
                                Online ({loading ? '--' : terminalStatus.onlineCount || 0})
                            </span>
                            <span className="bullet-custom position-absolute z-index-2 bottom-0 w-100 h-4px bg-primary rounded"></span>
                        </a>
                    </li>
                    <li className="nav-item col-4 mx-0 px-0" role="presentation">
                        <a 
                            className={`nav-link d-flex justify-content-center w-100 border-0 h-100 ${activeTab === 'offline' ? 'active' : ''}`}
                            onClick={() => setActiveTab('offline')}
                            style={{ cursor: 'pointer' }}
                        >
                            <span className="nav-text text-gray-800 fw-bold fs-6 mb-3">
                                Offline ({loading ? '--' : terminalStatus.offlineCount || 0})
                            </span>
                            <span className="bullet-custom position-absolute z-index-2 bottom-0 w-100 h-4px bg-primary rounded"></span>
                        </a>
                    </li>
                    <li className="nav-item col-4 mx-0 px-0" role="presentation">
                        <a 
                            className={`nav-link d-flex justify-content-center w-100 border-0 h-100 ${activeTab === 'testing' ? 'active' : ''}`}
                            onClick={() => setActiveTab('testing')}
                            style={{ cursor: 'pointer' }}
                        >
                            <span className="nav-text text-gray-800 fw-bold fs-6 mb-3">
                                Testing ({loading ? '--' : terminalStatus.testingCount || 0})
                            </span>
                            <span className="bullet-custom position-absolute z-index-2 bottom-0 w-100 h-4px bg-primary rounded"></span>
                        </a>
                    </li>
                    <span className="position-absolute z-index-1 bottom-0 w-100 h-4px bg-light rounded"></span>
                </ul>

                <div className="tab-content px-9 hover-scroll-overlay-y pe-7 me-3 mb-2" style={{ height: '318px' }}>
                    {loading
                        ? renderSkeletonList()
                        : (
                            <>
                                {activeTab === 'online' && renderTerminalList(onlineTerminals, 'success')}
                                {activeTab === 'offline' && renderTerminalList(offlineTerminals, 'danger')}
                                {activeTab === 'testing' && renderTerminalList(testingTerminals, 'warning')}
                            </>
                        )}
                </div>
            </div>
        </div>
    );
};

export default TerminalStatusWidget;




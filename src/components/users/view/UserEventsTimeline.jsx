import React from 'react';

const labelToClass = (label) => {
    switch (label) {
        case 'success':
            return 'text-success';
        case 'primary':
            return 'text-primary';
        case 'danger':
            return 'text-danger';
        case 'warning':
            return 'text-warning';
        case 'info':
            return 'text-info';
        default:
            return 'text-gray-500';
    }
};

const labelToBadgeClass = (label) => {
    switch (label) {
        case 'success':
            return 'badge-light-success';
        case 'primary':
            return 'badge-light-primary';
        case 'danger':
            return 'badge-light-danger';
        case 'warning':
            return 'badge-light-warning';
        case 'info':
            return 'badge-light-info';
        default:
            return 'badge-light-secondary';
    }
};

const UserEventsTimeline = ({ latestLogs = [] }) => {
    return (
        <div className="row g-5 g-xl-8">
            <div className="col-xl-12">
                <div className="card">
                    <div className="card-header border-0">
                        <div className="card-title m-0">
                            <h3 className="fw-bolder m-0">Recent Activity</h3>
                        </div>
                        <div className="card-toolbar">
                            <span className="badge badge-light-primary">{latestLogs.length} events</span>
                        </div>
                    </div>
                    <div className="card-body pt-5">
                        {latestLogs.length > 0 ? (
                            <div className="timeline timeline-border-dashed">
                                {latestLogs.map((log) => (
                                    <div className="timeline-item" key={log.id}>
                                        <div className="timeline-line"></div>
                                        <div className="timeline-icon">
                                            <i className={`ki-duotone ki-abstract fs-2 ${labelToClass(log.label)}`}>
                                                <span className="path1"></span>
                                                <span className="path2"></span>
                                            </i>
                                        </div>
                                        <div className="timeline-content mb-10 mt-n1">
                                            <div className="d-flex align-items-center justify-content-between mb-3">
                                                <div className="text-gray-800 fw-semibold fs-6">{log.time}</div>
                                                <span className={`badge fw-bold ${labelToBadgeClass(log.label)}`}>
                                                    {log.action?.replace('_', ' ')}
                                                </span>
                                            </div>
                                            <div className="fw-semibold text-gray-600 fs-6">{log.text}</div>
                                            {log.metadata && Object.keys(log.metadata).length > 0 && (
                                                <div className="mt-3 bg-light rounded p-3">
                                                    <pre className="mb-0 text-gray-600 fs-8">
                                                        {JSON.stringify(log.metadata, null, 2)}
                                                    </pre>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-10">
                                <i className="ki-duotone ki-time fs-3x text-gray-400 mb-5">
                                    <span className="path1"></span>
                                    <span className="path2"></span>
                                </i>
                                <h4 className="fw-bold text-gray-800 mb-3">No Activity Logged</h4>
                                <p className="text-gray-500 fs-6 mb-0">
                                    User activity events will appear here once actions are performed.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserEventsTimeline;


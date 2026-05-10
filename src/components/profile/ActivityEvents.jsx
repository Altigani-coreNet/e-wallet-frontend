import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { getUserInfo } from '../../services/profileService';

const ActivityEvents = () => {
    const { t } = useTranslation();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('all'); // all, success, warning, danger, primary

    useEffect(() => {
        fetchActivityLogs();
    }, []);

    const fetchActivityLogs = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await getUserInfo();
            
            if (response.status && response.data) {
                const merchantLogs = response.data.user?.merchant?.LatestLogs || [];
                setLogs(merchantLogs);
            }
        } catch (err) {
            console.error('Error fetching activity logs:', err);
            setError(err.message || t('merchant.profile.activityEvents.loadLogsFailed'));
        } finally {
            setLoading(false);
        }
    };

    const getLabelClass = (label) => {
        const classes = {
            'success': 'text-success',
            'warning': 'text-warning',
            'danger': 'text-danger',
            'primary': 'text-primary',
            'info': 'text-info'
        };
        return classes[label] || 'text-primary';
    };

    const getBadgeClass = (label) => {
        const classes = {
            'success': 'badge-light-success',
            'warning': 'badge-light-warning',
            'danger': 'badge-light-danger',
            'primary': 'badge-light-primary',
            'info': 'badge-light-info'
        };
        return classes[label] || 'badge-light-primary';
    };

    const getIconClass = (label) => {
        const icons = {
            'success': 'bi-check-circle-fill',
            'warning': 'bi-exclamation-triangle-fill',
            'danger': 'bi-x-circle-fill',
            'primary': 'bi-info-circle-fill',
            'info': 'bi-info-circle-fill'
        };
        return icons[label] || 'bi-circle-fill';
    };

    const filteredLogs = filter === 'all' 
        ? logs 
        : logs.filter(log => log.label === filter);

    const filterTypeLabel = useMemo(() => ({
        success: t('merchant.profile.activityEvents.filterSuccess'),
        warning: t('merchant.profile.activityEvents.filterWarning'),
        danger: t('merchant.profile.activityEvents.filterError'),
    }), [t]);

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">{t('merchant.profile.activityEvents.loading')}</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="card">
                <div className="card-body">
                    <div className="alert alert-danger" role="alert">
                        <i className="bi bi-exclamation-triangle me-2"></i>
                        {error}
                    </div>
                    <button className="btn btn-primary" onClick={fetchActivityLogs}>
                        <i className="bi bi-arrow-clockwise me-2"></i>
                        {t('merchant.profile.activityEvents.retry')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="row">
            {/* Timeline Card */}
            <div className="col-lg-8">
                <div className="card card-flush h-lg-100">
                    <div className="card-header pt-7">
                        <h3 className="card-title align-items-start flex-column">
                            <span className="card-label fw-bold text-gray-800">{t('merchant.profile.activityEvents.title')}</span>
                            <span className="text-gray-400 mt-1 fw-semibold fs-6">
                                {filteredLogs.length === 1
                                    ? t('merchant.profile.activityEvents.eventsFoundOne', { count: filteredLogs.length })
                                    : t('merchant.profile.activityEvents.eventsFoundMany', { count: filteredLogs.length })}
                            </span>
                        </h3>
                        
                        {/* Filter Buttons */}
                        <div className="card-toolbar">
                            <div className="btn-group" role="group">
                                <button 
                                    type="button" 
                                    className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-light'}`}
                                    onClick={() => setFilter('all')}
                                >
                                    {t('merchant.profile.activityEvents.filterAll')}
                                </button>
                                <button 
                                    type="button" 
                                    className={`btn btn-sm ${filter === 'success' ? 'btn-success' : 'btn-light'}`}
                                    onClick={() => setFilter('success')}
                                >
                                    {t('merchant.profile.activityEvents.filterSuccess')}
                                </button>
                                <button 
                                    type="button" 
                                    className={`btn btn-sm ${filter === 'warning' ? 'btn-warning' : 'btn-light'}`}
                                    onClick={() => setFilter('warning')}
                                >
                                    {t('merchant.profile.activityEvents.filterWarning')}
                                </button>
                                <button 
                                    type="button" 
                                    className={`btn btn-sm ${filter === 'danger' ? 'btn-danger' : 'btn-light'}`}
                                    onClick={() => setFilter('danger')}
                                >
                                    {t('merchant.profile.activityEvents.filterError')}
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div className="card-body">
                        {filteredLogs.length > 0 ? (
                            <div className="timeline-label">
                                {filteredLogs.map((log, index) => (
                                    <div key={index} className="timeline-item mb-8">
                                        <div className="timeline-label fw-bold text-gray-800 fs-6" style={{ width: '120px' }}>
                                            {log.time}
                                        </div>
                                        
                                        <div className="timeline-badge">
                                            <i className={`bi ${getIconClass(log.label)} ${getLabelClass(log.label)} fs-1`}></i>
                                        </div>
                                        
                                        <div className="timeline-content d-flex">
                                            <span className={`badge ${getBadgeClass(log.label)} fs-8 me-3`}>
                                                {log.label.toUpperCase()}
                                            </span>
                                            <span className="fw-normal text-muted ps-3">
                                                {log.text}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-10">
                                <i className="bi bi-inbox fs-3x text-muted mb-4"></i>
                                <h4 className="text-muted">{t('merchant.profile.activityEvents.noEventsTitle')}</h4>
                                <p className="text-muted">
                                    {filter !== 'all' 
                                        ? t('merchant.profile.activityEvents.noEventsFiltered', { type: filterTypeLabel[filter] || filter })
                                        : t('merchant.profile.activityEvents.noEventsYet')}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Statistics Card */}
            <div className="col-lg-4">
                <div className="card card-flush h-lg-100">
                    <div className="card-header pt-7">
                        <h3 className="card-title align-items-start flex-column">
                            <span className="card-label fw-bold text-gray-800">{t('merchant.profile.activityEvents.statsTitle')}</span>
                            <span className="text-gray-400 mt-1 fw-semibold fs-6">{t('merchant.profile.activityEvents.statsSubtitle')}</span>
                        </h3>
                    </div>
                    
                    <div className="card-body">
                        {/* Total Events */}
                        <div className="d-flex align-items-center mb-7">
                            <div className="symbol symbol-50px me-5">
                                <span className="symbol-label bg-light-primary">
                                    <i className="bi bi-activity text-primary fs-2x"></i>
                                </span>
                            </div>
                            <div className="flex-grow-1">
                                <a href="#" className="text-gray-800 text-hover-primary fs-6 fw-bold">
                                    {t('merchant.profile.activityEvents.statsTotal')}
                                </a>
                                <span className="text-muted fw-semibold d-block fs-7">
                                    {t('merchant.profile.activityEvents.statsAllTimeDesc')}
                                </span>
                            </div>
                            <span className="badge badge-light-primary fs-3">{logs.length}</span>
                        </div>

                        {/* Success Events */}
                        <div className="d-flex align-items-center mb-7">
                            <div className="symbol symbol-50px me-5">
                                <span className="symbol-label bg-light-success">
                                    <i className="bi bi-check-circle-fill text-success fs-2x"></i>
                                </span>
                            </div>
                            <div className="flex-grow-1">
                                <a href="#" className="text-gray-800 text-hover-primary fs-6 fw-bold">
                                    {t('merchant.profile.activityEvents.statsSuccess')}
                                </a>
                                <span className="text-muted fw-semibold d-block fs-7">
                                    {t('merchant.profile.activityEvents.statsSuccessDesc')}
                                </span>
                            </div>
                            <span className="badge badge-light-success fs-3">
                                {logs.filter(log => log.label === 'success').length}
                            </span>
                        </div>

                        {/* Warning Events */}
                        <div className="d-flex align-items-center mb-7">
                            <div className="symbol symbol-50px me-5">
                                <span className="symbol-label bg-light-warning">
                                    <i className="bi bi-exclamation-triangle-fill text-warning fs-2x"></i>
                                </span>
                            </div>
                            <div className="flex-grow-1">
                                <a href="#" className="text-gray-800 text-hover-primary fs-6 fw-bold">
                                    {t('merchant.profile.activityEvents.statsWarnings')}
                                </a>
                                <span className="text-muted fw-semibold d-block fs-7">
                                    {t('merchant.profile.activityEvents.statsWarningsDesc')}
                                </span>
                            </div>
                            <span className="badge badge-light-warning fs-3">
                                {logs.filter(log => log.label === 'warning').length}
                            </span>
                        </div>

                        {/* Danger Events */}
                        <div className="d-flex align-items-center mb-7">
                            <div className="symbol symbol-50px me-5">
                                <span className="symbol-label bg-light-danger">
                                    <i className="bi bi-x-circle-fill text-danger fs-2x"></i>
                                </span>
                            </div>
                            <div className="flex-grow-1">
                                <a href="#" className="text-gray-800 text-hover-primary fs-6 fw-bold">
                                    {t('merchant.profile.activityEvents.statsErrors')}
                                </a>
                                <span className="text-muted fw-semibold d-block fs-7">
                                    {t('merchant.profile.activityEvents.statsErrorsDesc')}
                                </span>
                            </div>
                            <span className="badge badge-light-danger fs-3">
                                {logs.filter(log => log.label === 'danger').length}
                            </span>
                        </div>

                        {/* Info Events */}
                        <div className="d-flex align-items-center">
                            <div className="symbol symbol-50px me-5">
                                <span className="symbol-label bg-light-info">
                                    <i className="bi bi-info-circle-fill text-info fs-2x"></i>
                                </span>
                            </div>
                            <div className="flex-grow-1">
                                <a href="#" className="text-gray-800 text-hover-primary fs-6 fw-bold">
                                    {t('merchant.profile.activityEvents.statsInfo')}
                                </a>
                                <span className="text-muted fw-semibold d-block fs-7">
                                    {t('merchant.profile.activityEvents.statsInfoDesc')}
                                </span>
                            </div>
                            <span className="badge badge-light-info fs-3">
                                {logs.filter(log => log.label === 'primary' || log.label === 'info').length}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ActivityEvents;


import React, { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useToolbar } from '../../../contexts/ToolbarContext';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import { useAdminTerminal, deleteAdminTerminal } from '../../../services/adminTerminalsService';
import useAdminReferenceData from '../../../hooks/useAdminReferenceData';

const AdminTerminalView = () => {
    const { t, i18n } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { setTitle, setBreadcrumbs, setActions } = useToolbar();
    const { merchantsMap, branchesMap, countriesMap } = useAdminReferenceData();

    // Fetch terminal data
    const { data: terminalResponse, isLoading, error } = useAdminTerminal(id);
    const terminal = terminalResponse?.data;

    useEffect(() => {
        setTitle(terminal ? t('admin.terminalView.terminalTitle', { name: terminal.name }) : t('admin.terminalView.title'));
        
        setBreadcrumbs([
            { label: t('admin.header.dashboard'), path: '/admin/dashboard' },
            { label: t('admin.sidebar.terminals'), path: '/admin/terminals' },
            { label: terminal?.name || t('admin.common.view'), path: `/admin/terminals/${id}`, active: true }
        ]);
        
        setActions(
            <div className="d-flex gap-2">
                <Link to={`/admin/terminals/${id}/edit`} className="btn btn-sm btn-primary">
                    <i className="ki-duotone ki-pencil fs-2">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    {t('admin.terminalView.edit')}
                </Link>
                <button 
                    className="btn btn-sm btn-danger"
                    onClick={handleDelete}
                >
                    <i className="ki-duotone ki-trash fs-2">
                        <span className="path1"></span>
                        <span className="path2"></span>
                        <span className="path3"></span>
                        <span className="path4"></span>
                        <span className="path5"></span>
                    </i>
                    {t('admin.terminalView.delete')}
                </button>
                <Link to="/admin/terminals" className="btn btn-sm btn-light-danger">
                    <i className="ki-duotone ki-arrow-left fs-2">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    {t('admin.terminalView.backToList')}
                </Link>
            </div>
        );

        return () => {
            setActions(null);
            setBreadcrumbs([]);
        };
    }, [id, terminal, setTitle, setBreadcrumbs, setActions, t]);

    const handleDelete = async () => {
        const result = await Swal.fire({
            title: t('admin.common.areYouSure'),
            text: t('admin.terminalsIndex.deleteConfirmText', { name: terminal?.name }),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: t('admin.terminalsIndex.yesDelete'),
            cancelButtonText: t('admin.common.cancel')
        });

        if (!result.isConfirmed) return;

        const response = await deleteAdminTerminal(id);
        
        if (response.success) {
            await queryClient.invalidateQueries({ queryKey: ['admin-terminals'] });
            toast.success(response.message);
            navigate('/admin/terminals');
        } else {
            toast.error(response.error);
        }
    };

    const getStatusBadge = (status) => {
        const isActive = status === 'active' || status === 1 || status === '1' || status === true;
        const statusText = isActive ? t('admin.common.active') : t('admin.common.inactive');
        const statusClass = isActive ? 'badge-success' : 'badge-warning';
        
        return <span className={`badge ${statusClass}`}>{statusText}</span>;
    };

    const getTerminalStatusBadge = (terminalStatus) => {
        const statusMap = {
            'online': { text: t('admin.common.online'), class: 'badge-success' },
            'offline': { text: t('admin.common.offline'), class: 'badge-danger' },
            'testing': { text: t('admin.common.testing'), class: 'badge-warning' },
            'maintenance': { text: t('admin.common.maintenance'), class: 'badge-info' }
        };
        
        const status = statusMap[terminalStatus] || { text: t('admin.common.unknown'), class: 'badge-secondary' };
        return <span className={`badge ${status.class}`}>{status.text}</span>;
    };

    const getAddTypeBadge = (addType) => {
        const isAuto = addType === 'auto';
        const text = isAuto ? t('admin.common.auto') : t('admin.common.static');
        const badgeClass = isAuto ? 'badge-success' : 'badge-warning';
        
        return <span className={`badge ${badgeClass}`}>{text}</span>;
    };

    if (isLoading) {
        return (
            <div className="card">
                <div className="card-body text-center py-10">
                    <span className="spinner-border text-primary"></span>
                    <p className="text-muted mt-3">{t('admin.terminalView.loading')}</p>
                </div>
            </div>
        );
    }

    if (error || !terminal) {
        return (
            <div className="card">
                <div className="card-body text-center py-10">
                    <i className="ki-duotone ki-information-5 fs-5x text-danger mb-5">
                        <span className="path1"></span>
                        <span className="path2"></span>
                        <span className="path3"></span>
                    </i>
                    <p className="text-danger fs-4">{t('admin.terminalView.notFound')}</p>
                    <Link to="/admin/terminals" className="btn btn-primary mt-3">
                        {t('admin.terminalView.backToTerminals')}
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <>
            {/* Basic Information */}
            <div className="card mb-5 mb-xl-10">
                <div className="card-header cursor-pointer">
                    <div className="card-title m-0">
                        <h3 className="fw-bolder m-0">{t('admin.terminalView.basicInfo')}</h3>
                    </div>
                </div>
                <div className="card-body p-9">
                    <div className="row mb-7">
                        <label className="col-lg-4 fw-bold text-muted">{t('admin.terminalView.terminalName')}</label>
                        <div className="col-lg-8">
                            <span className="fw-bolder fs-6 text-gray-800">{terminal.name || t('admin.common.na')}</span>
                        </div>
                    </div>
                    <div className="row mb-7">
                        <label className="col-lg-4 fw-bold text-muted">{t('admin.terminalView.terminalId')}</label>
                        <div className="col-lg-8">
                            <span className="fw-bolder fs-6 text-gray-800">{terminal.terminal_id || t('admin.common.na')}</span>
                        </div>
                    </div>
                    <div className="row mb-7">
                        <label className="col-lg-4 fw-bold text-muted">{t('admin.terminalView.deviceId')}</label>
                        <div className="col-lg-8">
                            <span className="fw-bolder fs-6 text-gray-800">{terminal.device_id || t('admin.common.na')}</span>
                        </div>
                    </div>
                    <div className="row mb-7">
                        <label className="col-lg-4 fw-bold text-muted">{t('admin.terminalView.status')}</label>
                        <div className="col-lg-8">
                            {getStatusBadge(terminal.is_active)}
                        </div>
                    </div>
                    <div className="row mb-7">
                        <label className="col-lg-4 fw-bold text-muted">{t('admin.terminalView.terminalStatus')}</label>
                        <div className="col-lg-8">
                            {getTerminalStatusBadge(terminal.terminal_status)}
                        </div>
                    </div>
                    <div className="row mb-7">
                        <label className="col-lg-4 fw-bold text-muted">{t('admin.terminalView.addType')}</label>
                        <div className="col-lg-8">
                            {getAddTypeBadge(terminal.add_type)}
                        </div>
                    </div>
                </div>
            </div>

            {/* Hardware Information */}
            <div className="card mb-5 mb-xl-10">
                <div className="card-header cursor-pointer">
                    <div className="card-title m-0">
                        <h3 className="fw-bolder m-0">{t('admin.terminalView.hardwareInfo')}</h3>
                    </div>
                </div>
                <div className="card-body p-9">
                    <div className="row mb-7">
                        <label className="col-lg-4 fw-bold text-muted">{t('admin.terminalView.brand')}</label>
                        <div className="col-lg-8">
                            <span className="fw-bolder fs-6 text-gray-800">{terminal.brand || t('admin.common.na')}</span>
                        </div>
                    </div>
                    <div className="row mb-7">
                        <label className="col-lg-4 fw-bold text-muted">{t('admin.terminalView.model')}</label>
                        <div className="col-lg-8">
                            <span className="fw-bolder fs-6 text-gray-800">{terminal.model || t('admin.common.na')}</span>
                        </div>
                    </div>
                    <div className="row mb-7">
                        <label className="col-lg-4 fw-bold text-muted">{t('admin.terminalView.manufacturer')}</label>
                        <div className="col-lg-8">
                            <span className="fw-bolder fs-6 text-gray-800">{terminal.manufacturer || t('admin.common.na')}</span>
                        </div>
                    </div>
                    <div className="row mb-7">
                        <label className="col-lg-4 fw-bold text-muted">{t('admin.terminalView.serialNumber')}</label>
                        <div className="col-lg-8">
                            <span className="fw-bolder fs-6 text-gray-800">{terminal.serial_no || t('admin.common.na')}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* SDK Information */}
            <div className="card mb-5 mb-xl-10">
                <div className="card-header cursor-pointer">
                    <div className="card-title m-0">
                        <h3 className="fw-bolder m-0">{t('admin.terminalView.sdkInfo')}</h3>
                    </div>
                </div>
                <div className="card-body p-9">
                    <div className="row mb-7">
                        <label className="col-lg-4 fw-bold text-muted">{t('admin.terminalView.sdkId')}</label>
                        <div className="col-lg-8">
                            <span className="fw-bolder fs-6 text-gray-800">{terminal.sdk_id || t('admin.common.na')}</span>
                        </div>
                    </div>
                    <div className="row mb-7">
                        <label className="col-lg-4 fw-bold text-muted">{t('admin.terminalView.sdkVersion')}</label>
                        <div className="col-lg-8">
                            <span className="fw-bolder fs-6 text-gray-800">{terminal.sdk_version || t('admin.common.na')}</span>
                        </div>
                    </div>
                    <div className="row mb-7">
                        <label className="col-lg-4 fw-bold text-muted">{t('admin.terminalView.androidOs')}</label>
                        <div className="col-lg-8">
                            <span className="fw-bolder fs-6 text-gray-800">{terminal.android_os || t('admin.common.na')}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Merchant & Branch Information */}
            <div className="card mb-5 mb-xl-10">
                <div className="card-header cursor-pointer">
                    <div className="card-title m-0">
                        <h3 className="fw-bolder m-0">{t('admin.terminalView.assignmentInfo')}</h3>
                    </div>
                </div>
                <div className="card-body p-9">
                    <div className="row mb-7">
                        <label className="col-lg-4 fw-bold text-muted">{t('admin.terminalView.merchant')}</label>
                        <div className="col-lg-8">
                            <span className="fw-bolder fs-6 text-gray-800">
                                {terminal.merchant?.business_name ||
                                    terminal.merchant?.name ||
                                    terminal.merchant_name ||
                                    merchantsMap[terminal.merchant_id] ||
                                    terminal.merchant_id ||
                                    t('admin.common.na')}
                            </span>
                        </div>
                    </div>
                    <div className="row mb-7">
                        <label className="col-lg-4 fw-bold text-muted">{t('admin.terminalView.branch')}</label>
                        <div className="col-lg-8">
                            <span className="fw-bolder fs-6 text-gray-800">
                                {terminal.branch?.name ||
                                    terminal.branch_name ||
                                    branchesMap[terminal.branch_id] ||
                                    terminal.branch_id ||
                                    t('admin.common.na')}
                            </span>
                        </div>
                    </div>
                    <div className="row mb-7">
                        <label className="col-lg-4 fw-bold text-muted">{t('admin.terminalView.country')}</label>
                        <div className="col-lg-8">
                            <span className="fw-bolder fs-6 text-gray-800">
                                {(() => {
                                    const country = terminal.country;
                                    if (!country) {
                                        return countriesMap[terminal.country_id] || terminal.country_id || t('admin.common.na');
                                    }
                                    
                                    // Handle multilingual name object
                                    if (country.name && typeof country.name === 'object') {
                                        return country.name[i18n.language] || country.name.en || country.name.ar || countriesMap[terminal.country_id] || terminal.country_id || t('admin.common.na');
                                    }
                                    
                                    return country.name || countriesMap[terminal.country_id] || terminal.country_id || t('admin.common.na');
                                })()}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Timestamps */}
            <div className="card mb-5 mb-xl-10">
                <div className="card-header cursor-pointer">
                    <div className="card-title m-0">
                        <h3 className="fw-bolder m-0">{t('admin.terminalView.timestamps')}</h3>
                    </div>
                </div>
                <div className="card-body p-9">
                    <div className="row mb-7">
                        <label className="col-lg-4 fw-bold text-muted">{t('admin.terminalView.createdAt')}</label>
                        <div className="col-lg-8">
                            <span className="fw-bolder fs-6 text-gray-800">
                                {terminal.created_at ? new Date(terminal.created_at).toLocaleString(i18n.language) : t('admin.common.na')}
                            </span>
                        </div>
                    </div>
                    <div className="row mb-7">
                        <label className="col-lg-4 fw-bold text-muted">{t('admin.terminalView.updatedAt')}</label>
                        <div className="col-lg-8">
                            <span className="fw-bolder fs-6 text-gray-800">
                                {terminal.updated_at ? new Date(terminal.updated_at).toLocaleString(i18n.language) : t('admin.common.na')}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default AdminTerminalView;


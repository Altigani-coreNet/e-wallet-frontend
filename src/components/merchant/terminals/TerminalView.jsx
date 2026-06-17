import React, { useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTerminalDetails, deleteTerminal } from '../../../services/terminalsService';
import { useQueryClient } from '@tanstack/react-query';
import { useToolbar } from '../../../contexts/ToolbarContext';
import Swal from 'sweetalert2';

const MERCHANT_TERMINALS_PATH = '/merchant/terminals';

const TerminalView = () => {
    const { t, i18n } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { setTitle, setBreadcrumbs, setActions } = useToolbar();

    const {
        data: terminalData,
        isLoading: loading,
        error: fetchError,
    } = useTerminalDetails(id);

    const terminal = (() => {
        if (!terminalData) return null;
        const payload = terminalData.data ?? terminalData;
        if (payload && typeof payload === 'object' && payload.id) {
            return payload;
        }
        if (payload?.data && typeof payload.data === 'object') {
            return payload.data;
        }
        return payload;
    })();

    const handleDelete = useCallback(async () => {
        const result = await Swal.fire({
            title: t('merchant.common.areYouSure'),
            text: t('merchant.terminals.deleteOneConfirm', { name: terminal?.name || '' }),
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: t('merchant.common.yesDelete'),
            cancelButtonText: t('merchant.common.cancel'),
        });

        if (!result.isConfirmed) return;

        const response = await deleteTerminal(id);
        if (response.success) {
            queryClient.invalidateQueries({ queryKey: ['terminals'] });
            await Swal.fire({
                title: t('merchant.common.deleted'),
                text: t('merchant.terminals.deletedOne'),
                icon: 'success',
                timer: 2000,
                showConfirmButton: false,
            });
            navigate(MERCHANT_TERMINALS_PATH);
        } else {
            Swal.fire(t('merchant.common.error'), response.error || t('merchant.terminals.deleteOneFailed'), 'error');
        }
    }, [id, terminal?.name, navigate, queryClient, t]);

    const getStatusBadge = (status) => {
        const isActive = status === 'active' || status === 1 || status === '1' || status === true;
        const statusText = isActive ? t('merchant.common.active') : t('merchant.common.inactive');
        const statusClass = isActive ? 'badge-success' : 'badge-warning';
        return <span className={`badge ${statusClass}`}>{statusText}</span>;
    };

    const getTerminalStatusBadge = (terminalStatus) => {
        const statusMap = {
            online: { text: t('merchant.common.online', { defaultValue: 'Online' }), class: 'badge-success' },
            offline: { text: t('merchant.common.offline', { defaultValue: 'Offline' }), class: 'badge-danger' },
            testing: { text: t('merchant.common.testing', { defaultValue: 'Testing' }), class: 'badge-warning' },
            maintenance: { text: t('merchant.common.maintenance', { defaultValue: 'Maintenance' }), class: 'badge-info' },
        };
        const status = statusMap[terminalStatus] || {
            text: t('merchant.common.unknown', { defaultValue: 'Unknown' }),
            class: 'badge-secondary',
        };
        return <span className={`badge ${status.class}`}>{status.text}</span>;
    };

    const getAddTypeBadge = (addType) => {
        const isAuto = addType === 'auto';
        const text = isAuto ? t('merchant.terminalForm.addTypeAuto') : t('merchant.terminalForm.addTypeStatic');
        const badgeClass = isAuto ? 'badge-success' : 'badge-warning';
        return <span className={`badge ${badgeClass}`}>{text}</span>;
    };

    useEffect(() => {
        setTitle(terminal ? terminal.name : t('merchant.breadcrumbs.terminalDetails'));

        setBreadcrumbs([
            { label: t('merchant.breadcrumbs.dashboard'), path: '/merchant/dashboard' },
            { label: t('merchant.breadcrumbs.terminals'), path: MERCHANT_TERMINALS_PATH },
            {
                label: terminal?.name || t('merchant.breadcrumbs.terminalDetails'),
                path: `${MERCHANT_TERMINALS_PATH}/${id}`,
                active: true,
            },
        ]);

        setActions(
            <div className="d-flex gap-2">
                <Link to={`${MERCHANT_TERMINALS_PATH}/${id}/edit`} className="btn btn-sm btn-primary">
                    <i className="ki-duotone ki-pencil fs-2">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    {t('merchant.common.edit')}
                </Link>
                <button type="button" className="btn btn-sm btn-danger" onClick={handleDelete}>
                    <i className="ki-duotone ki-trash fs-2">
                        <span className="path1"></span>
                        <span className="path2"></span>
                        <span className="path3"></span>
                        <span className="path4"></span>
                        <span className="path5"></span>
                    </i>
                    {t('merchant.terminals.delete')}
                </button>
                <Link to={MERCHANT_TERMINALS_PATH} className="btn btn-sm btn-light-danger">
                    <i className="ki-duotone ki-arrow-left fs-2">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    {t('merchant.common.backToList')}
                </Link>
            </div>
        );

        return () => {
            setActions(null);
            setBreadcrumbs([]);
        };
    }, [id, terminal, setTitle, setBreadcrumbs, setActions, handleDelete, t, i18n.language]);

    if (loading) {
        return (
            <div className="card">
                <div className="card-body text-center py-10">
                    <span className="spinner-border text-primary"></span>
                    <p className="text-muted mt-3">{t('merchant.common.loading')}</p>
                </div>
            </div>
        );
    }

    if (fetchError || !terminal) {
        return (
            <div className="card">
                <div className="card-body text-center py-10">
                    <p className="text-danger fs-4">{t('merchant.terminalView.notFound', { defaultValue: 'Terminal not found' })}</p>
                    <Link to={MERCHANT_TERMINALS_PATH} className="btn btn-primary mt-3">
                        {t('merchant.common.backToTerminals')}
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="card mb-5 mb-xl-10">
                <div className="card-header">
                    <h3 className="card-title">{t('merchant.terminalForm.basicInfo', { defaultValue: 'Basic Information' })}</h3>
                </div>
                <div className="card-body p-9">
                    <div className="row mb-7">
                        <label className="col-lg-4 fw-bold text-muted">{t('merchant.terminalForm.terminalName')}</label>
                        <div className="col-lg-8">
                            <span className="fw-bolder fs-6 text-gray-800">{terminal.name || t('merchant.common.na')}</span>
                        </div>
                    </div>
                    <div className="row mb-7">
                        <label className="col-lg-4 fw-bold text-muted">{t('merchant.terminalForm.terminalId')}</label>
                        <div className="col-lg-8">
                            <span className="fw-bolder fs-6 text-gray-800">{terminal.terminal_id || t('merchant.common.na')}</span>
                        </div>
                    </div>
                    <div className="row mb-7">
                        <label className="col-lg-4 fw-bold text-muted">{t('merchant.terminalForm.deviceId', { defaultValue: 'Device ID' })}</label>
                        <div className="col-lg-8">
                            <span className="fw-bolder fs-6 text-gray-800">{terminal.device_id || t('merchant.common.na')}</span>
                        </div>
                    </div>
                    <div className="row mb-7">
                        <label className="col-lg-4 fw-bold text-muted">{t('merchant.terminalForm.status')}</label>
                        <div className="col-lg-8">{getStatusBadge(terminal.is_active)}</div>
                    </div>
                    <div className="row mb-7">
                        <label className="col-lg-4 fw-bold text-muted">{t('merchant.terminalForm.terminalStatus', { defaultValue: 'Terminal Status' })}</label>
                        <div className="col-lg-8">{getTerminalStatusBadge(terminal.terminal_status)}</div>
                    </div>
                    <div className="row mb-7">
                        <label className="col-lg-4 fw-bold text-muted">{t('merchant.terminalForm.addType')}</label>
                        <div className="col-lg-8">{getAddTypeBadge(terminal.add_type)}</div>
                    </div>
                </div>
            </div>

            <div className="card mb-5 mb-xl-10">
                <div className="card-header">
                    <h3 className="card-title">{t('merchant.terminalForm.hardwareInfo', { defaultValue: 'Hardware Information' })}</h3>
                </div>
                <div className="card-body p-9">
                    <div className="row mb-7">
                        <label className="col-lg-4 fw-bold text-muted">{t('merchant.terminalForm.brand', { defaultValue: 'Brand' })}</label>
                        <div className="col-lg-8">
                            <span className="fw-bolder fs-6 text-gray-800">{terminal.brand || t('merchant.common.na')}</span>
                        </div>
                    </div>
                    <div className="row mb-7">
                        <label className="col-lg-4 fw-bold text-muted">{t('merchant.terminalForm.model')}</label>
                        <div className="col-lg-8">
                            <span className="fw-bolder fs-6 text-gray-800">{terminal.model || t('merchant.common.na')}</span>
                        </div>
                    </div>
                    <div className="row mb-7">
                        <label className="col-lg-4 fw-bold text-muted">{t('merchant.terminalForm.manufacturer')}</label>
                        <div className="col-lg-8">
                            <span className="fw-bolder fs-6 text-gray-800">{terminal.manufacturer || t('merchant.common.na')}</span>
                        </div>
                    </div>
                    <div className="row mb-7">
                        <label className="col-lg-4 fw-bold text-muted">{t('merchant.terminalForm.serialNumber')}</label>
                        <div className="col-lg-8">
                            <span className="fw-bolder fs-6 text-gray-800">{terminal.serial_no || t('merchant.common.na')}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="card mb-5 mb-xl-10">
                <div className="card-header">
                    <h3 className="card-title">{t('merchant.terminalForm.sdkInfo', { defaultValue: 'SDK Information' })}</h3>
                </div>
                <div className="card-body p-9">
                    <div className="row mb-7">
                        <label className="col-lg-4 fw-bold text-muted">{t('merchant.terminalForm.sdkId')}</label>
                        <div className="col-lg-8">
                            <span className="fw-bolder fs-6 text-gray-800">{terminal.sdk_id || t('merchant.common.na')}</span>
                        </div>
                    </div>
                    <div className="row mb-7">
                        <label className="col-lg-4 fw-bold text-muted">{t('merchant.terminalForm.sdkVersion')}</label>
                        <div className="col-lg-8">
                            <span className="fw-bolder fs-6 text-gray-800">{terminal.sdk_version || t('merchant.common.na')}</span>
                        </div>
                    </div>
                    <div className="row mb-7">
                        <label className="col-lg-4 fw-bold text-muted">{t('merchant.terminalForm.androidOs')}</label>
                        <div className="col-lg-8">
                            <span className="fw-bolder fs-6 text-gray-800">{terminal.android_os || t('merchant.common.na')}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="card mb-5 mb-xl-10">
                <div className="card-header">
                    <h3 className="card-title">{t('merchant.terminalForm.assignmentInfo', { defaultValue: 'Assignment' })}</h3>
                </div>
                <div className="card-body p-9">
                    <div className="row mb-7">
                        <label className="col-lg-4 fw-bold text-muted">{t('merchant.terminalForm.branch')}</label>
                        <div className="col-lg-8">
                            <span className="fw-bolder fs-6 text-gray-800">
                                {terminal.branch?.name || terminal.branch_name || t('merchant.common.na')}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="card mb-5 mb-xl-10">
                <div className="card-header">
                    <h3 className="card-title">{t('merchant.terminalForm.timestamps', { defaultValue: 'Timestamps' })}</h3>
                </div>
                <div className="card-body p-9">
                    <div className="row mb-7">
                        <label className="col-lg-4 fw-bold text-muted">{t('merchant.terminalForm.createdAt', { defaultValue: 'Created At' })}</label>
                        <div className="col-lg-8">
                            <span className="fw-bolder fs-6 text-gray-800">
                                {terminal.created_at
                                    ? new Date(terminal.created_at).toLocaleString(i18n.language)
                                    : t('merchant.common.na')}
                            </span>
                        </div>
                    </div>
                    <div className="row mb-7">
                        <label className="col-lg-4 fw-bold text-muted">{t('merchant.terminalForm.updatedAt', { defaultValue: 'Updated At' })}</label>
                        <div className="col-lg-8">
                            <span className="fw-bolder fs-6 text-gray-800">
                                {terminal.updated_at
                                    ? new Date(terminal.updated_at).toLocaleString(i18n.language)
                                    : t('merchant.common.na')}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default TerminalView;

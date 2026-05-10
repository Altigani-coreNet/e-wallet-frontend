import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useToolbar } from '../../../contexts/ToolbarContext';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import AdminTerminalForm from './AdminTerminalForm';
import { useAdminTerminal, updateAdminTerminal } from '../../../services/adminTerminalsService';

const AdminTerminalEdit = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { id } = useParams();
    const { setTitle, setBreadcrumbs, setActions } = useToolbar();
    const [loading, setLoading] = useState(false);

    // Fetch terminal data
    const { data: terminalResponse, isLoading, error } = useAdminTerminal(id);
    const terminal = terminalResponse?.data;

    useEffect(() => {
        setTitle(terminal ? `${t('admin.terminalEdit.title')}: ${terminal.name}` : t('admin.terminalEdit.title'));
        
        setBreadcrumbs([
            { label: t('admin.header.dashboard'), path: '/admin/dashboard' },
            { label: t('admin.sidebar.terminals'), path: '/admin/terminals' },
            { label: terminal?.name || t('admin.common.edit'), path: `/admin/terminals/${id}/edit`, active: true }
        ]);
        
        setActions(
            <div className="d-flex gap-2">
                <Link to={`/admin/terminals/${id}`} className="btn btn-sm btn-light-primary">
                    <i className="ki-duotone ki-eye fs-2">
                        <span className="path1"></span>
                        <span className="path2"></span>
                        <span className="path3"></span>
                    </i>
                    {t('admin.common.view')}
                </Link>
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

    const handleSubmit = async (formData) => {
        setLoading(true);

        try {
            const response = await updateAdminTerminal(id, formData);
            
            if (response.success) {
                await Promise.all([
                    queryClient.invalidateQueries({ queryKey: ['admin-terminals'] }),
                    queryClient.invalidateQueries({ queryKey: ['admin-terminal', id] })
                ]);
                await Swal.fire({
                    title: t('admin.common.success'),
                    text: t('admin.terminalEdit.success'),
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                });
                navigate(`/admin/terminals/${id}`);
            } else {
                Swal.fire(t('admin.common.error'), response.error || t('admin.terminalEdit.error'), 'error');
            }
        } catch (err) {
            console.error('Error updating terminal:', err);
            Swal.fire(t('admin.common.error'), t('admin.common.unexpectedError'), 'error');
        } finally {
            setLoading(false);
        }
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
        <AdminTerminalForm
            mode="edit"
            initialData={terminal}
            onSubmit={handleSubmit}
            loading={loading}
        />
    );
};

export default AdminTerminalEdit;


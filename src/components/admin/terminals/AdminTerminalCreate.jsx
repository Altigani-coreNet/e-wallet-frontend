import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useToolbar } from '../../../contexts/ToolbarContext';
import Swal from 'sweetalert2';
import AdminTerminalForm from './AdminTerminalForm';
import { createAdminTerminal } from '../../../services/adminTerminalsService';

const AdminTerminalCreate = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { setTitle, setBreadcrumbs, setActions } = useToolbar();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setTitle(t('admin.terminalCreate.title'));
        
        setBreadcrumbs([
            { label: t('admin.header.dashboard'), path: '/admin/dashboard' },
            { label: t('admin.sidebar.terminals'), path: '/admin/terminals' },
            { label: t('admin.terminalCreate.title'), path: '/admin/terminals/create', active: true }
        ]);
        
        setActions(
            <Link to="/admin/terminals" className="btn btn-sm btn-light-danger">
                <i className="ki-duotone ki-arrow-left fs-2">
                    <span className="path1"></span>
                    <span className="path2"></span>
                </i>
                {t('admin.terminalView.backToList')}
            </Link>
        );

        return () => {
            setActions(null);
            setBreadcrumbs([]);
        };
    }, [setTitle, setBreadcrumbs, setActions, t]);

    const handleSubmit = async (formData) => {
        setLoading(true);

        try {
            const response = await createAdminTerminal(formData);
            
            if (response.success) {
                await queryClient.invalidateQueries({ queryKey: ['admin-terminals'] });
                await Swal.fire({
                    title: t('admin.common.success'),
                    text: t('admin.terminalCreate.success'),
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                });
                navigate('/admin/terminals');
            } else {
                Swal.fire(t('admin.common.error'), response.error || t('admin.terminalCreate.error'), 'error');
            }
        } catch (err) {
            console.error('Error creating terminal:', err);
            Swal.fire(t('admin.common.error'), t('admin.common.unexpectedError'), 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminTerminalForm
            mode="create"
            onSubmit={handleSubmit}
            loading={loading}
        />
    );
};

export default AdminTerminalCreate;


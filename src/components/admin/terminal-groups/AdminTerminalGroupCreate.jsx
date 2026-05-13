import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useToolbar } from '../../../contexts/ToolbarContext';
import Swal from 'sweetalert2';
import AdminTerminalGroupForm from './AdminTerminalGroupForm';
import { createAdminTerminalGroup } from '../../../services/adminTerminalGroupsService';

const AdminTerminalGroupCreate = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { setTitle, setBreadcrumbs, setActions } = useToolbar();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setTitle(t('admin.terminalGroupsUI.pages.createTitle'));
        
        setBreadcrumbs([
            { label: t('admin.terminalGroupsUI.pages.breadcrumbDashboard'), path: '/admin/dashboard' },
            { label: t('admin.terminalGroupsUI.pages.breadcrumbList'), path: '/admin/terminal-groups' },
            { label: t('admin.terminalGroupsUI.pages.breadcrumbCreate'), path: '/admin/terminal-groups/create', active: true }
        ]);
        
        setActions(
            <Link to="/admin/terminal-groups" className="btn btn-sm btn-light-danger">
                <i className="ki-duotone ki-arrow-left fs-2">
                    <span className="path1"></span>
                    <span className="path2"></span>
                </i>
                {t('admin.terminalGroupsUI.pages.backToList')}
            </Link>
        );

        return () => {
            setActions(null);
            setBreadcrumbs([]);
        };
    }, [setTitle, setBreadcrumbs, setActions, t, i18n.language]);

    const handleSubmit = async (formData) => {
        setLoading(true);

        try {
            const response = await createAdminTerminalGroup(formData);
            
            if (response.success) {
                await Swal.fire({
                    title: t('admin.terminalGroupsUI.pages.successTitle'),
                    text: t('admin.terminalGroupsUI.pages.createdMsg'),
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                });
                navigate('/admin/terminal-groups');
            } else {
                Swal.fire(t('admin.terminalGroupsUI.pages.errorTitle'), response.error || t('admin.terminalGroupsUI.pages.errorCreate'), 'error');
            }
        } catch (err) {
            console.error('Error creating terminal group:', err);
            Swal.fire(t('admin.terminalGroupsUI.pages.errorTitle'), t('admin.terminalGroupsUI.pages.errorUnexpected'), 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminTerminalGroupForm
            mode="create"
            onSubmit={handleSubmit}
            loading={loading}
        />
    );
};

export default AdminTerminalGroupCreate;


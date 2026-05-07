import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useToolbar } from '../../../contexts/ToolbarContext';
import Swal from 'sweetalert2';
import AdminTerminalForm from './AdminTerminalForm';
import { createAdminTerminal } from '../../../services/adminTerminalsService';

const AdminTerminalCreate = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { setTitle, setBreadcrumbs, setActions } = useToolbar();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setTitle('Create Terminal');
        
        setBreadcrumbs([
            { label: 'Dashboard', path: '/admin/dashboard' },
            { label: 'Terminals', path: '/admin/terminals' },
            { label: 'Create Terminal', path: '/admin/terminals/create', active: true }
        ]);
        
        setActions(
            <Link to="/admin/terminals" className="btn btn-sm btn-light-danger">
                <i className="ki-duotone ki-arrow-left fs-2">
                    <span className="path1"></span>
                    <span className="path2"></span>
                </i>
                Back to List
            </Link>
        );

        return () => {
            setActions(null);
            setBreadcrumbs([]);
        };
    }, [setTitle, setBreadcrumbs, setActions]);

    const handleSubmit = async (formData) => {
        setLoading(true);

        try {
            const response = await createAdminTerminal(formData);
            
            if (response.success) {
                await queryClient.invalidateQueries({ queryKey: ['admin-terminals'] });
                await Swal.fire({
                    title: 'Success!',
                    text: 'Terminal created successfully.',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                });
                navigate('/admin/terminals');
            } else {
                Swal.fire('Error!', response.error || 'Failed to create terminal.', 'error');
            }
        } catch (err) {
            console.error('Error creating terminal:', err);
            Swal.fire('Error!', 'An unexpected error occurred.', 'error');
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


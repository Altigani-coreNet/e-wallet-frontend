import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useToolbar } from '../../../contexts/ToolbarContext';
import Swal from 'sweetalert2';
import AdminTerminalGroupForm from './AdminTerminalGroupForm';
import { createAdminTerminalGroup } from '../../../services/adminTerminalGroupsService';

const AdminTerminalGroupCreate = () => {
    const navigate = useNavigate();
    const { setTitle, setBreadcrumbs, setActions } = useToolbar();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setTitle('Create Terminal Group');
        
        setBreadcrumbs([
            { label: 'Dashboard', path: '/admin/dashboard' },
            { label: 'Terminal Groups', path: '/admin/terminal-groups' },
            { label: 'Create Terminal Group', path: '/admin/terminal-groups/create', active: true }
        ]);
        
        setActions(
            <Link to="/admin/terminal-groups" className="btn btn-sm btn-light-danger">
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
            const response = await createAdminTerminalGroup(formData);
            
            if (response.success) {
                await Swal.fire({
                    title: 'Success!',
                    text: 'Terminal group created successfully.',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                });
                navigate('/admin/terminal-groups');
            } else {
                Swal.fire('Error!', response.error || 'Failed to create terminal group.', 'error');
            }
        } catch (err) {
            console.error('Error creating terminal group:', err);
            Swal.fire('Error!', 'An unexpected error occurred.', 'error');
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


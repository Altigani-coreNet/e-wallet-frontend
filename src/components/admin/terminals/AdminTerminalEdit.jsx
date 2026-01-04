import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useToolbar } from '../../../contexts/ToolbarContext';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import AdminTerminalForm from './AdminTerminalForm';
import { useAdminTerminal, updateAdminTerminal } from '../../../services/adminTerminalsService';

const AdminTerminalEdit = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { setTitle, setBreadcrumbs, setActions } = useToolbar();
    const [loading, setLoading] = useState(false);

    // Fetch terminal data
    const { data: terminalResponse, isLoading, error } = useAdminTerminal(id);
    const terminal = terminalResponse?.data;

    useEffect(() => {
        setTitle(terminal ? `Edit Terminal: ${terminal.name}` : 'Edit Terminal');
        
        setBreadcrumbs([
            { label: 'Dashboard', path: '/admin/dashboard' },
            { label: 'Terminals', path: '/admin/terminals' },
            { label: terminal?.name || 'Edit', path: `/admin/terminals/${id}/edit`, active: true }
        ]);
        
        setActions(
            <div className="d-flex gap-2">
                <Link to={`/admin/terminals/${id}`} className="btn btn-sm btn-light-primary">
                    <i className="ki-duotone ki-eye fs-2">
                        <span className="path1"></span>
                        <span className="path2"></span>
                        <span className="path3"></span>
                    </i>
                    View
                </Link>
                <Link to="/admin/terminals" className="btn btn-sm btn-light-danger">
                    <i className="ki-duotone ki-arrow-left fs-2">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    Back to List
                </Link>
            </div>
        );

        return () => {
            setActions(null);
            setBreadcrumbs([]);
        };
    }, [id, terminal, setTitle, setBreadcrumbs, setActions]);

    const handleSubmit = async (formData) => {
        setLoading(true);

        try {
            const response = await updateAdminTerminal(id, formData);
            
            if (response.success) {
                await Swal.fire({
                    title: 'Success!',
                    text: 'Terminal updated successfully.',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                });
                navigate(`/admin/terminals/${id}`);
            } else {
                Swal.fire('Error!', response.error || 'Failed to update terminal.', 'error');
            }
        } catch (err) {
            console.error('Error updating terminal:', err);
            Swal.fire('Error!', 'An unexpected error occurred.', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="card">
                <div className="card-body text-center py-10">
                    <span className="spinner-border text-primary"></span>
                    <p className="text-muted mt-3">Loading terminal...</p>
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
                    <p className="text-danger fs-4">Failed to load terminal</p>
                    <Link to="/admin/terminals" className="btn btn-primary mt-3">
                        Back to Terminals
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


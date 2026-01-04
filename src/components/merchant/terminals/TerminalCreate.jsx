import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createTerminal } from '../../../services/terminalsService';
import TerminalForm from './TerminalForm';
import { useToolbar } from '../../../contexts/ToolbarContext';
import Swal from 'sweetalert2';

const TerminalCreate = () => {
    const navigate = useNavigate();
    const { setTitle, setBreadcrumbs, setActions } = useToolbar();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        setTitle('Create Terminal');
        
        setBreadcrumbs([
            { label: 'Dashboard', path: '/merchant/dashboard' },
            { label: 'Terminals', path: '/merchant/terminals' },
            { label: 'Create Terminal', path: '/merchant/terminals/create', active: true }
        ]);
        
        setActions(
            <button
                className="btn btn-sm btn-light btn-active-light-primary"
                onClick={() => navigate('/merchant/terminals')}
            >
                <i className="ki-duotone ki-arrow-left fs-5">
                    <span className="path1"></span>
                    <span className="path2"></span>
                </i>
                Back to Terminals
            </button>
        );

        return () => {
            setActions(null);
            setBreadcrumbs([]);
        };
    }, [setTitle, setBreadcrumbs, setActions, navigate]);

    const handleSubmit = async (formData) => {
        setLoading(true);
        setError(null);

        try {
            const response = await createTerminal(formData);
            
            if (response.success) {
                await Swal.fire({
                    title: 'Success!',
                    text: 'Terminal created successfully.',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                });
                navigate('/merchant/terminals');
            } else {
                setError(response.error || 'Failed to create terminal');
                Swal.fire('Error!', response.error || 'Failed to create terminal.', 'error');
            }
        } catch (err) {
            setError('An unexpected error occurred');
            Swal.fire('Error!', 'An unexpected error occurred.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <TerminalForm
            mode="create"
            onSubmit={handleSubmit}
            loading={loading}
            error={error}
        />
    );
};

export default TerminalCreate;

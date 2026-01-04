import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useToolbar } from '../../../contexts/ToolbarContext';
import Swal from 'sweetalert2';
import AdminTerminalGroupForm from './AdminTerminalGroupForm';
import { useAdminTerminalGroup, updateAdminTerminalGroup } from '../../../services/adminTerminalGroupsService';

const AdminTerminalGroupEdit = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { setTitle, setBreadcrumbs, setActions } = useToolbar();
    const [loading, setLoading] = useState(false);

    // Fetch terminal group data
    const { data: groupResponse, isLoading, error } = useAdminTerminalGroup(id);
    const terminalGroup = groupResponse?.data;

    useEffect(() => {
        setTitle(terminalGroup ? `Edit Terminal Group: ${terminalGroup.name}` : 'Edit Terminal Group');
        
        setBreadcrumbs([
            { label: 'Dashboard', path: '/admin/dashboard' },
            { label: 'Terminal Groups', path: '/admin/terminal-groups' },
            { label: terminalGroup?.name || 'Edit', path: `/admin/terminal-groups/${id}/edit`, active: true }
        ]);
        
        setActions(
            <div className="d-flex gap-2">
                <Link to={`/admin/terminal-groups/${id}`} className="btn btn-sm btn-light-primary">
                    <i className="ki-duotone ki-eye fs-2">
                        <span className="path1"></span>
                        <span className="path2"></span>
                        <span className="path3"></span>
                    </i>
                    View
                </Link>
                <Link to="/admin/terminal-groups" className="btn btn-sm btn-light-danger">
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
    }, [id, terminalGroup, setTitle, setBreadcrumbs, setActions]);

    const handleSubmit = async (formData) => {
        setLoading(true);

        try {
            const response = await updateAdminTerminalGroup(id, formData);
            
            if (response.success) {
                await Swal.fire({
                    title: 'Success!',
                    text: 'Terminal group updated successfully.',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                });
                navigate(`/admin/terminal-groups/${id}`);
            } else {
                Swal.fire('Error!', response.error || 'Failed to update terminal group.', 'error');
            }
        } catch (err) {
            console.error('Error updating terminal group:', err);
            Swal.fire('Error!', 'An unexpected error occurred.', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (isLoading) {
        return (
            <>
                <style>{`
                    .skeleton {
                        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                        background-size: 200% 100%;
                        animation: skeleton-loading 1.5s ease-in-out infinite;
                        border-radius: 4px;
                    }
                    
                    @keyframes skeleton-loading {
                        0% {
                            background-position: 200% 0;
                        }
                        100% {
                            background-position: -200% 0;
                        }
                    }
                `}</style>
                
                <div className="card">
                    <div className="card-header">
                        <div className="card-title">
                            <div className="placeholder-glow">
                                <span className="placeholder col-6" style={{ height: '28px' }}></span>
                            </div>
                        </div>
                    </div>
                    <div className="card-body">
                        {/* Form skeleton */}
                        <div className="row g-6 mb-6">
                            <div className="col-md-6">
                                <div className="placeholder-glow">
                                    <span className="placeholder col-4 mb-2 d-block" style={{ height: '16px' }}></span>
                                    <span className="placeholder col-12" style={{ height: '44px' }}></span>
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="placeholder-glow">
                                    <span className="placeholder col-4 mb-2 d-block" style={{ height: '16px' }}></span>
                                    <span className="placeholder col-12" style={{ height: '44px' }}></span>
                                </div>
                            </div>
                            <div className="col-12">
                                <div className="placeholder-glow">
                                    <span className="placeholder col-4 mb-2 d-block" style={{ height: '16px' }}></span>
                                    <span className="placeholder col-12" style={{ height: '100px' }}></span>
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="placeholder-glow">
                                    <span className="placeholder col-4 mb-2 d-block" style={{ height: '16px' }}></span>
                                    <span className="placeholder col-12" style={{ height: '44px' }}></span>
                                </div>
                            </div>
                        </div>
                        
                        {/* User Groups Selector Skeleton */}
                        <div className="mb-6">
                            <div className="placeholder-glow">
                                <span className="placeholder col-3 mb-2 d-block" style={{ height: '20px' }}></span>
                                <div className="border rounded p-4" style={{ minHeight: '200px' }}>
                                    {[...Array(3)].map((_, idx) => (
                                        <div key={idx} className="mb-3">
                                            <span className="placeholder col-8" style={{ height: '16px' }}></span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        
                        {/* Terminals Selector Skeleton */}
                        <div className="mb-6">
                            <div className="placeholder-glow">
                                <span className="placeholder col-3 mb-2 d-block" style={{ height: '20px' }}></span>
                                <div className="border rounded p-4" style={{ minHeight: '300px' }}>
                                    {[...Array(5)].map((_, idx) => (
                                        <div key={idx} className="mb-3">
                                            <span className="placeholder col-10" style={{ height: '16px' }}></span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        
                        {/* Buttons Skeleton */}
                        <div className="d-flex gap-2">
                            <div className="placeholder-glow">
                                <span className="placeholder" style={{ width: '150px', height: '44px', borderRadius: '6px' }}></span>
                            </div>
                            <div className="placeholder-glow">
                                <span className="placeholder" style={{ width: '100px', height: '44px', borderRadius: '6px' }}></span>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    if (error || !terminalGroup) {
        return (
            <div className="card">
                <div className="card-body text-center py-10">
                    <i className="ki-duotone ki-information-5 fs-5x text-danger mb-5">
                        <span className="path1"></span>
                        <span className="path2"></span>
                        <span className="path3"></span>
                    </i>
                    <p className="text-danger fs-4">Failed to load terminal group</p>
                    <Link to="/admin/terminal-groups" className="btn btn-primary mt-3">
                        Back to Terminal Groups
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <AdminTerminalGroupForm
            mode="edit"
            initialData={terminalGroup}
            onSubmit={handleSubmit}
            loading={loading}
        />
    );
};

export default AdminTerminalGroupEdit;


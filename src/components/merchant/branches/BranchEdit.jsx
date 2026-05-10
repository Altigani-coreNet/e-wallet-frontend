import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { useBranchDetails, updateBranch } from '../../../services/branchesService';
import { useQueryClient } from '@tanstack/react-query';
import BranchForm from './BranchForm';
import { useToolbar } from '../../../contexts/ToolbarContext';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import Swal from 'sweetalert2';

const BranchEdit = () => {
    const { t, i18n } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { setTitle, setBreadcrumbs, setActions } = useToolbar();
    const [submitLoading, setSubmitLoading] = useState(false);
    const [error, setError] = useState(null);

    const { 
        data: branchData, 
        isLoading: loading, 
        error: fetchError 
    } = useBranchDetails(id);

    const branch = branchData?.data || branchData;

    useEffect(() => {
        setTitle(t('merchant.breadcrumbs.editBranch'));
        
        setBreadcrumbs([
            { label: t('merchant.breadcrumbs.dashboard'), path: '/merchant/dashboard' },
            { label: t('merchant.breadcrumbs.branches'), path: '/merchant/branches' },
            { label: branch?.name || t('merchant.breadcrumbs.editBranch'), path: `/merchant/branches/${id}/edit`, active: true }
        ]);
        
        setActions(
            <button
                className="btn btn-sm btn-light btn-active-light-primary"
                onClick={() => navigate(`/merchant/branches/${id}`)}
            >
                <i className="ki-duotone ki-arrow-left fs-5">
                    <span className="path1"></span>
                    <span className="path2"></span>
                </i>
                {t('merchant.common.backToView')}
            </button>
        );

        return () => {
            setActions(null);
            setBreadcrumbs([]);
        };
    }, [setTitle, setBreadcrumbs, setActions, navigate, id, branch?.name, t, i18n.language]);

    const handleSubmit = async (formData) => {
        setSubmitLoading(true);
        setError(null);

        try {
            const response = await updateBranch(id, formData);

            if (response.success) {
                queryClient.invalidateQueries({ queryKey: ['branch-details', id] });
                queryClient.invalidateQueries({ queryKey: ['branches'] });
                
                await Swal.fire({
                    title: 'Success!',
                    text: 'Branch updated successfully!',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                });
                navigate(`/merchant/branches/${id}`);
            } else {
                const errorData = response.error || response.errors || 'Failed to update branch';
                setError(errorData);
                Swal.fire('Error!', errorData, 'error');
            }
        } catch (err) {
            console.error('Error updating branch:', err);
            setError('An unexpected error occurred while updating the branch');
            Swal.fire('Error!', 'An unexpected error occurred.', 'error');
        } finally {
            setSubmitLoading(false);
        }
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    if (fetchError || !branch) {
        return (
            <div className="alert alert-danger">
                <strong>Error:</strong> {fetchError?.message || 'Branch not found'}
                <div className="mt-3">
                    <button className="btn btn-primary" onClick={() => navigate('/merchant/branches')}>
                        Back to Branches
                    </button>
                </div>
            </div>
        );
    }

    return (
        <BranchForm
            mode="edit"
            initialData={branch}
            onSubmit={handleSubmit}
            loading={submitLoading}
            error={error}
        />
    );
};

export default BranchEdit;

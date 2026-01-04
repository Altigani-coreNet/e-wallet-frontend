import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createBranch } from '../../../services/branchesService';
import BranchForm from './BranchForm';
import PlanUpgradeModal from '../../users/PlanUpgradeModal';
import { useToolbar } from '../../../contexts/ToolbarContext';
import Swal from 'sweetalert2';

const BranchCreate = () => {
    const navigate = useNavigate();
    const { setTitle, setBreadcrumbs, setActions } = useToolbar();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showPlanUpgradeModal, setShowPlanUpgradeModal] = useState(false);

    useEffect(() => {
        setTitle('Create Branch');
        
        setBreadcrumbs([
            { label: 'Dashboard', path: '/merchant/dashboard' },
            { label: 'Branches', path: '/merchant/branches' },
            { label: 'Create Branch', path: '/merchant/branches/create', active: true }
        ]);
        
        setActions(
            <button
                className="btn btn-sm btn-light btn-active-light-primary"
                onClick={() => navigate('/merchant/branches')}
            >
                <i className="ki-duotone ki-arrow-left fs-5">
                    <span className="path1"></span>
                    <span className="path2"></span>
                </i>
                Back to Branches
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
            const response = await createBranch(formData);

            if (response.success) {
                await Swal.fire({
                    title: 'Success!',
                    text: 'Branch request submitted successfully! It will be reviewed by administrators.',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                });
                navigate('/merchant/branches');
            } else {
                // Handle plan limit errors (406)
                if (response.statusCode === 406 || response.errorCode === 'PLAN_BRANCHES_LIMIT_REACHED' || response.error?.includes('limit reached')) {
                    // Show the plan upgrade modal instead of just an error message
                    setShowPlanUpgradeModal(true);
                    setError(null);
                } else {
                    const errorData = response.error || response.errors || 'Failed to create branch';
                    setError(errorData);
                    Swal.fire('Error!', errorData, 'error');
                }
            }
        } catch (err) {
            console.error('Error creating branch:', err);
            setError('An unexpected error occurred while creating the branch');
            Swal.fire('Error!', 'An unexpected error occurred.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <BranchForm
                mode="create"
                onSubmit={handleSubmit}
                loading={loading}
                error={error}
            />

            {/* Plan Upgrade Modal */}
            <PlanUpgradeModal
                show={showPlanUpgradeModal}
                onHide={() => setShowPlanUpgradeModal(false)}
                resourceType="branches"
            />
        </>
    );
};

export default BranchCreate;



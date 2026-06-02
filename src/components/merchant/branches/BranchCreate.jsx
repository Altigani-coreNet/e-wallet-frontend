import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { createBranch } from '../../../services/branchesService';
import BranchForm from './BranchForm';
import PlanUpgradeModal from '../../users/PlanUpgradeModal';
import { useToolbar } from '../../../contexts/ToolbarContext';
import Swal from 'sweetalert2';

const BranchCreate = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { setTitle, setBreadcrumbs, setActions } = useToolbar();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showPlanUpgradeModal, setShowPlanUpgradeModal] = useState(false);

    useEffect(() => {
        setTitle(t('merchant.breadcrumbs.createBranch'));
        
        setBreadcrumbs([
            { label: t('merchant.breadcrumbs.dashboard'), path: '/merchant/dashboard' },
            { label: t('merchant.breadcrumbs.branches'), path: '/merchant/branches' },
            { label: t('merchant.breadcrumbs.createBranch'), path: '/merchant/branches/create', active: true }
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
                {t('merchant.common.backToBranches')}
            </button>
        );

        return () => {
            setActions(null);
            setBreadcrumbs([]);
        };
    }, [setTitle, setBreadcrumbs, setActions, navigate, t, i18n.language]);

    const handleSubmit = async (formData) => {
        setLoading(true);
        setError(null);

        try {
            const response = await createBranch(formData);

            if (response.success) {
                await Swal.fire({
                    title: t('merchant.branchForm.requestSuccessTitle'),
                    text: t('merchant.branchForm.requestSuccessText'),
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
                    const errorData = response.error || response.errors || t('merchant.branchForm.createFailed');
                    setError(errorData);
                    Swal.fire(t('merchant.common.error'), errorData, 'error');
                }
            }
        } catch (err) {
            console.error('Error creating branch:', err);
            setError(t('merchant.branchForm.unexpectedError'));
            Swal.fire(t('merchant.common.error'), t('merchant.branchForm.unexpectedError'), 'error');
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



import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { useTerminalDetails, updateTerminal } from '../../../services/terminalsService';
import { useQueryClient } from '@tanstack/react-query';
import TerminalForm from './TerminalForm';
import { useToolbar } from '../../../contexts/ToolbarContext';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import Swal from 'sweetalert2';

const TerminalEdit = () => {
    const { t, i18n } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { setTitle, setBreadcrumbs, setActions } = useToolbar();
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState(null);

    const { 
        data: terminalData, 
        isLoading: loading, 
        error: fetchError 
    } = useTerminalDetails(id);

    const terminal = terminalData?.data || terminalData;

    useEffect(() => {
        setTitle(t('merchant.breadcrumbs.editTerminal'));
        
        setBreadcrumbs([
            { label: t('merchant.breadcrumbs.dashboard'), path: '/merchant/dashboard' },
            { label: t('merchant.breadcrumbs.terminals'), path: '/merchant/terminals' },
            { label: terminal?.name || t('merchant.breadcrumbs.editTerminal'), path: `/merchant/terminals/${id}/edit`, active: true }
        ]);
        
        setActions(
            <button
                className="btn btn-sm btn-light btn-active-light-primary"
                onClick={() => navigate(`/merchant/terminals/${id}`)}
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
    }, [setTitle, setBreadcrumbs, setActions, navigate, id, terminal?.name, t, i18n.language]);

    const handleSubmit = async (formData) => {
        setUpdating(true);
        setError(null);

        try {
            const response = await updateTerminal(id, formData);
            
            if (response.success) {
                queryClient.invalidateQueries({ queryKey: ['terminal-details', id] });
                queryClient.invalidateQueries({ queryKey: ['terminals'] });
                
                await Swal.fire({
                    title: t('merchant.common.success'),
                    text: t('merchant.terminalForm.updateSuccess'),
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                });
                navigate(`/merchant/terminals/${id}`);
            } else {
                setError(response.error || t('merchant.terminalForm.updateFailed'));
                Swal.fire(t('merchant.common.error'), response.error || t('merchant.terminalForm.updateFailed'), 'error');
            }
        } catch (err) {
            setError(t('merchant.terminalForm.unexpectedError'));
            Swal.fire(t('merchant.common.error'), t('merchant.terminalForm.unexpectedError'), 'error');
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    if (fetchError || !terminal) {
        return (
            <div className="alert alert-danger">
                <strong>{t('merchant.branchView.errorPrefix')}</strong> {fetchError?.message || t('merchant.terminalView.notFound')}
                <div className="mt-3">
                    <button className="btn btn-primary" onClick={() => navigate('/merchant/terminals')}>
                        {t('merchant.common.backToTerminals')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <TerminalForm
            mode="edit"
            initialData={terminal}
            onSubmit={handleSubmit}
            loading={updating}
            error={error}
        />
    );
};

export default TerminalEdit;

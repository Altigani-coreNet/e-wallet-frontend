import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTerminalDetails, updateTerminal } from '../../../services/terminalsService';
import { useQueryClient } from '@tanstack/react-query';
import TerminalForm from './TerminalForm';
import { useToolbar } from '../../../contexts/ToolbarContext';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import Swal from 'sweetalert2';

const MERCHANT_TERMINALS_PATH = '/merchant/terminals';

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

    const terminal = (() => {
        if (!terminalData) return null;
        const payload = terminalData.data ?? terminalData;
        if (payload && typeof payload === 'object' && payload.id) {
            return payload;
        }
        if (payload?.data && typeof payload.data === 'object') {
            return payload.data;
        }
        return payload;
    })();

    useEffect(() => {
        setTitle(t('merchant.breadcrumbs.editTerminal'));
        
        setBreadcrumbs([
            { label: t('merchant.breadcrumbs.dashboard'), path: '/merchant/dashboard' },
            { label: t('merchant.breadcrumbs.terminals'), path: MERCHANT_TERMINALS_PATH },
            { label: terminal?.name || t('merchant.breadcrumbs.editTerminal'), path: `${MERCHANT_TERMINALS_PATH}/${id}/edit`, active: true }
        ]);
        
        setActions(
            <Link to={`${MERCHANT_TERMINALS_PATH}/${id}`} className="btn btn-sm btn-light-danger">
                <i className="ki-duotone ki-arrow-left fs-2">
                    <span className="path1"></span>
                    <span className="path2"></span>
                </i>
                {t('merchant.common.backToView')}
            </Link>
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
                navigate(`${MERCHANT_TERMINALS_PATH}/${id}`);
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
                    <button className="btn btn-primary" onClick={() => navigate(MERCHANT_TERMINALS_PATH)}>
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

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { createTerminal } from '../../../services/terminalsService';
import TerminalForm from './TerminalForm';
import { useToolbar } from '../../../contexts/ToolbarContext';
import Swal from 'sweetalert2';

const TerminalCreate = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { setTitle, setBreadcrumbs, setActions } = useToolbar();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        setTitle(t('merchant.breadcrumbs.createTerminal'));
        
        setBreadcrumbs([
            { label: t('merchant.breadcrumbs.dashboard'), path: '/merchant/dashboard' },
            { label: t('merchant.breadcrumbs.terminals'), path: '/merchant/terminals' },
            { label: t('merchant.breadcrumbs.createTerminal'), path: '/merchant/terminals/create', active: true }
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
                {t('merchant.common.backToTerminals')}
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
            const response = await createTerminal(formData);
            
            if (response.success) {
                await Swal.fire({
                    title: t('merchant.common.success'),
                    text: t('merchant.terminalForm.createSuccess'),
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                });
                navigate('/merchant/terminals');
            } else {
                setError(response.error || t('merchant.terminalForm.createFailed'));
                Swal.fire(t('merchant.common.error'), response.error || t('merchant.terminalForm.createFailed'), 'error');
            }
        } catch (err) {
            setError(t('merchant.terminalForm.unexpectedError'));
            Swal.fire(t('merchant.common.error'), t('merchant.terminalForm.unexpectedError'), 'error');
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

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { createTerminal } from '../../../services/terminalsService';
import TerminalForm from './TerminalForm';
import { useToolbar } from '../../../contexts/ToolbarContext';
import Swal from 'sweetalert2';
import { useQueryClient } from '@tanstack/react-query';

const MERCHANT_TERMINALS_PATH = '/merchant/terminals';

const TerminalCreate = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { setTitle, setBreadcrumbs, setActions } = useToolbar();
    const queryClient = useQueryClient();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        setTitle(t('merchant.breadcrumbs.createTerminal'));
        
        setBreadcrumbs([
            { label: t('merchant.breadcrumbs.dashboard'), path: '/merchant/dashboard' },
            { label: t('merchant.breadcrumbs.terminals'), path: MERCHANT_TERMINALS_PATH },
            { label: t('merchant.breadcrumbs.createTerminal'), path: `${MERCHANT_TERMINALS_PATH}/create`, active: true }
        ]);
        
        setActions(
            <Link to={MERCHANT_TERMINALS_PATH} className="btn btn-sm btn-light-danger">
                <i className="ki-duotone ki-arrow-left fs-2">
                    <span className="path1"></span>
                    <span className="path2"></span>
                </i>
                {t('merchant.common.backToList')}
            </Link>
        );

        return () => {
            setActions(null);
            setBreadcrumbs([]);
        };
    }, [setTitle, setBreadcrumbs, setActions, t, i18n.language]);

    const handleSubmit = async (formData) => {
        setLoading(true);
        setError(null);

        try {
            const response = await createTerminal(formData);
            
            if (response.success) {
                await queryClient.invalidateQueries({ queryKey: ['terminals'] });
                await Swal.fire({
                    title: t('merchant.common.success'),
                    text: t('merchant.terminalForm.createSuccess'),
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                });
                navigate(MERCHANT_TERMINALS_PATH);
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

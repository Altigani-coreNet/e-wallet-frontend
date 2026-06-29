import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import {
    fetchNextAccountCode,
    useAccountTypes,
    useChartOfAccountMutations,
} from '../../../services/adminAccountingService';

const AdminChartOfAccountForm = ({ open, account, onClose }) => {
    const { t } = useTranslation();
    const { data: typesData } = useAccountTypes({ enabled: open });
    const { createMutation, updateMutation } = useChartOfAccountMutations();

    const [form, setForm] = useState({
        name: '',
        code: '',
        type_id: '',
        sub_type: '',
        description: '',
        is_enabled: true,
    });

    const types = typesData?.types || [];

    const subTypes = useMemo(() => {
        const selected = types.find((type) => String(type.id) === String(form.type_id));
        return selected?.sub_types || [];
    }, [types, form.type_id]);

    useEffect(() => {
        if (!open) return;

        if (account) {
            setForm({
                name: account.name || '',
                code: String(account.code || ''),
                type_id: String(account.type_id || ''),
                sub_type: String(account.sub_type_id || ''),
                description: account.description || '',
                is_enabled: account.status !== 'inactive',
            });
            return;
        }

        setForm({
            name: '',
            code: '',
            type_id: types[0]?.id ? String(types[0].id) : '',
            sub_type: types[0]?.sub_types?.[0]?.id ? String(types[0].sub_types[0].id) : '',
            description: '',
            is_enabled: true,
        });
    }, [open, account, types]);

    useEffect(() => {
        if (!open || account || !form.type_id) return;

        fetchNextAccountCode(form.type_id)
            .then((result) => {
                setForm((prev) => ({ ...prev, code: String(result.code || '') }));
            })
            .catch(() => {});
    }, [open, account, form.type_id]);

    const handleTypeChange = async (typeId) => {
        const selected = types.find((type) => String(type.id) === String(typeId));
        const firstSubType = selected?.sub_types?.[0]?.id ? String(selected.sub_types[0].id) : '';

        let nextCode = form.code;
        if (!account) {
            try {
                const result = await fetchNextAccountCode(typeId);
                nextCode = String(result.code || '');
            } catch {
                nextCode = '';
            }
        }

        setForm((prev) => ({
            ...prev,
            type_id: typeId,
            sub_type: firstSubType,
            code: nextCode,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const payload = {
            name: form.name.trim(),
            code: Number(form.code),
            sub_type: Number(form.sub_type),
            description: form.description,
            is_enabled: form.is_enabled ? 1 : 0,
        };

        try {
            if (account?.id) {
                await updateMutation.mutateAsync({ id: account.id, ...payload });
                toast.success(t('admin.accounting.form.updated'));
            } else {
                await createMutation.mutateAsync(payload);
                toast.success(t('admin.accounting.form.created'));
            }
            onClose();
        } catch (err) {
            toast.error(err?.response?.data?.message || t('admin.accounting.form.failed'));
        }
    };

    if (!open) return null;

    return (
        <>
            <div className="modal fade show d-block" tabIndex="-1" role="dialog">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <form onSubmit={handleSubmit}>
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    {account ? t('admin.accounting.form.editTitle') : t('admin.accounting.form.createTitle')}
                                </h5>
                                <button type="button" className="btn-close" onClick={onClose} />
                            </div>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <label className="form-label required">{t('admin.accounting.form.name')}</label>
                                    <input
                                        className="form-control"
                                        value={form.name}
                                        onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                                        required
                                    />
                                </div>
                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <label className="form-label required">{t('admin.accounting.form.type')}</label>
                                        <select
                                            className="form-select"
                                            value={form.type_id}
                                            onChange={(e) => handleTypeChange(e.target.value)}
                                            required
                                        >
                                            <option value="">{t('admin.accounting.form.selectType')}</option>
                                            {types.map((type) => (
                                                <option key={type.id} value={type.id}>{type.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label required">{t('admin.accounting.form.subType')}</label>
                                        <select
                                            className="form-select"
                                            value={form.sub_type}
                                            onChange={(e) => setForm((prev) => ({ ...prev, sub_type: e.target.value }))}
                                            required
                                        >
                                            <option value="">{t('admin.accounting.form.selectSubType')}</option>
                                            {subTypes.map((subType) => (
                                                <option key={subType.id} value={subType.id}>{subType.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="mt-3">
                                    <label className="form-label required">{t('admin.accounting.form.code')}</label>
                                    <input
                                        className="form-control"
                                        type="number"
                                        value={form.code}
                                        onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))}
                                        required
                                    />
                                </div>
                                <div className="mt-3">
                                    <label className="form-label">{t('admin.accounting.form.description')}</label>
                                    <textarea
                                        className="form-control"
                                        rows={3}
                                        value={form.description}
                                        onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                                    />
                                </div>
                                <div className="form-check form-switch mt-3">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        checked={form.is_enabled}
                                        onChange={(e) => setForm((prev) => ({ ...prev, is_enabled: e.target.checked }))}
                                        id="coa-enabled"
                                    />
                                    <label className="form-check-label" htmlFor="coa-enabled">
                                        {t('admin.accounting.form.enabled')}
                                    </label>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-light" onClick={onClose}>
                                    {t('common.cancel')}
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={createMutation.isPending || updateMutation.isPending}
                                >
                                    {account ? t('common.save') : t('common.create')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            <div className="modal-backdrop fade show" />
        </>
    );
};

export default AdminChartOfAccountForm;

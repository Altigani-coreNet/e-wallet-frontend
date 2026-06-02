import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getBranchesForSelect } from '../../../services/userGroupsService';
import UserSelector from '../../common/UserSelector';
import ErrorAlert from '../../common/ErrorAlert';
import LoadingSpinner from '../../common/LoadingSpinner';

const UserGroupForm = ({ mode = 'create', initialData = {}, onSubmit, loading, error }) => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({
        name: '',
        branch_id: '',
        description: '',
        user_ids: []
    });

    const [branches, setBranches] = useState([]);
    const [loadingBranches, setLoadingBranches] = useState(true);
    const [validationErrors, setValidationErrors] = useState({});

    useEffect(() => {
        if (mode === 'edit' && initialData) {
            setFormData({
                name: initialData.name || '',
                branch_id: initialData.branch_id || '',
                description: initialData.description || '',
                user_ids: initialData.users?.map(user => user.id) || []
            });
        }
    }, [mode, initialData]);

    useEffect(() => {
        const fetchBranches = async () => {
            setLoadingBranches(true);
            try {
                const response = await getBranchesForSelect();
                if (response.success) {
                    const branchesData = response.data?.data || response.data || [];
                    setBranches(Array.isArray(branchesData) ? branchesData : []);
                }
            } catch (err) {
                console.error('Error fetching branches:', err);
            } finally {
                setLoadingBranches(false);
            }
        };
        fetchBranches();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        
        if (validationErrors[name]) {
            setValidationErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const handleUserChange = (userIds) => {
        setFormData(prev => ({
            ...prev,
            user_ids: userIds
        }));
        
        if (validationErrors.user_ids) {
            setValidationErrors(prev => ({
                ...prev,
                user_ids: ''
            }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        const errors = {};
        if (!formData.name || formData.name.trim() === '') {
            errors.name = t('merchant.userGroupsUI.form.nameRequired');
        }
        if (!formData.user_ids || formData.user_ids.length === 0) {
            errors.user_ids = t('merchant.userGroupsUI.form.usersRequired');
        }
        
        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
            return;
        }
        
        onSubmit(formData);
    };

    return (
        <div className="card">
            <div className="card-header border-0 pt-6">
                <div className="card-title">
                    <h2>
                        {mode === 'create'
                            ? t('merchant.userGroupsUI.form.addTitle')
                            : t('merchant.userGroupsUI.form.editTitle')}
                    </h2>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="card-body">
                    {error && <ErrorAlert error={error} />}

                    <div className="mb-6">
                        <label className="form-label required">{t('merchant.userGroupsUI.form.groupName')}</label>
                        <input
                            type="text"
                            name="name"
                            className={`form-control ${validationErrors.name ? 'is-invalid' : ''}`}
                            placeholder={t('merchant.userGroupsUI.form.groupNamePh')}
                            value={formData.name}
                            onChange={handleChange}
                            required
                            disabled={loading}
                        />
                        {validationErrors.name && (
                            <div className="invalid-feedback">{validationErrors.name}</div>
                        )}
                    </div>

                    <div className="mb-6">
                        <label className="form-label">{t('merchant.userGroupsUI.form.branchOptional')}</label>
                        {loadingBranches ? (
                            <LoadingSpinner />
                        ) : (
                            <select
                                name="branch_id"
                                className="form-select"
                                value={formData.branch_id}
                                onChange={handleChange}
                                disabled={loading}
                            >
                                <option value="">{t('merchant.userGroupsUI.form.selectBranchOptional')}</option>
                                {branches.map(branch => (
                                    <option key={branch.id} value={branch.id}>
                                        {branch.name || branch.text}
                                    </option>
                                ))}
                            </select>
                        )}
                        <div className="form-text">{t('merchant.userGroupsUI.form.branchHint')}</div>
                    </div>

                    <div className="mb-6">
                        <label className="form-label">{t('merchant.userGroupsUI.form.description')}</label>
                        <textarea
                            name="description"
                            className="form-control"
                            rows="3"
                            placeholder={t('merchant.userGroupsUI.form.descriptionPh')}
                            value={formData.description}
                            onChange={handleChange}
                            disabled={loading}
                        />
                    </div>

                    <div className="mb-6">
                        <label className="form-label required">{t('merchant.userGroupsUI.form.selectUsers')}</label>
                        {validationErrors.user_ids && (
                            <div className="text-danger mb-2">{validationErrors.user_ids}</div>
                        )}
                        <UserSelector
                            selectedUsers={formData.user_ids}
                            onUserChange={handleUserChange}
                            className="mt-2"
                        />
                    </div>
                </div>

                <div className="card-footer d-flex justify-content-end gap-2">
                    <a
                        href="/merchant/user-groups"
                        className="btn btn-secondary"
                        disabled={loading}
                    >
                        {t('merchant.userGroupsUI.form.cancel')}
                    </a>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                {mode === 'create'
                                    ? t('merchant.userGroupsUI.form.creating')
                                    : t('merchant.userGroupsUI.form.updating')}
                            </>
                        ) : (
                            <>
                                <i className="ki-duotone ki-check fs-2 me-2">
                                    <span className="path1"></span>
                                    <span className="path2"></span>
                                </i>
                                {mode === 'create'
                                    ? t('merchant.userGroupsUI.form.createGroup')
                                    : t('merchant.userGroupsUI.form.updateGroup')}
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default UserGroupForm;

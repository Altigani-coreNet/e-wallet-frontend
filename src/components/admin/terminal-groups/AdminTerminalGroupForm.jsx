import { useState, useEffect } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { ADMIN_ENDPOINTS } from '../../../utils/constants';
import { getToken } from '../../../utils/api';
import { getTranslatedText } from '../../../utils/helpers';
import CustomTerminalSelector from './CustomTerminalSelector';
import CustomUserGroupSelector from './CustomUserGroupSelector';
import { getParentGroups } from '../../../services/adminTerminalGroupsService';

/**
 * Terminal Group Form Component for Admin Dashboard
 * Exact copy of TerminalGroupForm.jsx from SoftPos but adapted for React Admin Dashboard
 */
const AdminTerminalGroupForm = ({ initialData = {}, mode = 'create', onSubmit, loading: externalLoading }) => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({
        name: initialData.name || '',
        description: initialData.description || '',
        parent_id: initialData.parent_id || '',
        terminal_ids: initialData.terminals?.map(term => term.id) || initialData.terminal_ids || [],
        user_group_ids: initialData.userGroups?.map(ug => ug.id) || initialData.user_groups?.map(ug => ug.id) || initialData.user_group_ids || [],
        merchant_id: initialData.merchant_id || ''
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [parentGroups, setParentGroups] = useState([]);
    const [isSubgroup, setIsSubgroup] = useState(!!initialData.parent_id);
    const [merchantOptions, setMerchantOptions] = useState([]);

    // Load merchants
    useEffect(() => {
        const loadMerchants = async () => {
            try {
                const token = getToken();
                const res = await axios.get(ADMIN_ENDPOINTS.MERCHANTS, {
                    params: { per_page: 100 },
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                const data = res.data;
                const options = data.data?.data || data.data || [];
                setMerchantOptions(options);
            } catch (e) {
                console.error('Failed to load merchants', e);
            }
        };
        loadMerchants();
    }, []);

    // Load parent groups when needed
    useEffect(() => {
        if (isSubgroup && formData.merchant_id) {
            loadParentGroupsData();
        }
    }, [isSubgroup, formData.merchant_id]);

    const loadParentGroupsData = async () => {
        try {
            const response = await getParentGroups(formData.merchant_id);
            if (response.success) {
                const groups = response.data || [];
                // Format for select dropdown
                const formattedGroups = groups.map(g => ({
                    id: g.id,
                    text: `${g.name} (${g.group_id})`,
                    name: g.name,
                    group_id: g.group_id
                }));
                setParentGroups(formattedGroups);
            }
        } catch (error) {
            console.error('Error loading parent groups:', error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        
        // Clear errors when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const handleSelectChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const handleSubgroupChange = (e) => {
        const checked = e.target.checked;
        setIsSubgroup(checked);
        
        if (!checked) {
            // Clear parent_id when unchecking subgroup
            setFormData(prev => ({
                ...prev,
                parent_id: ''
            }));
        }
        
        // Clear parent_id errors
        if (errors.parent_id) {
            setErrors(prev => ({
                ...prev,
                parent_id: ''
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Client-side validation
        const validationErrors = {};
        
        if (!formData.name || formData.name.trim() === '') {
            validationErrors.name = [t('admin.terminalGroupsUI.form.valNameRequired')];
        } else if (formData.name.length > 255) {
            validationErrors.name = [t('admin.terminalGroupsUI.form.valNameMax')];
        }
        
        if (!formData.terminal_ids || formData.terminal_ids.length === 0) {
            validationErrors.terminal_ids = [t('admin.terminalGroupsUI.form.valTerminalsRequired')];
        }
        
        if (!formData.user_group_ids || formData.user_group_ids.length === 0) {
            validationErrors.user_group_ids = [t('admin.terminalGroupsUI.form.valUserGroupsRequired')];
        }

        // Require merchant_id
        if (!formData.merchant_id || formData.merchant_id === '') {
            validationErrors.merchant_id = [t('admin.terminalGroupsUI.form.valMerchantRequired')];
        }
        
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }
        
        setLoading(false);
        setErrors({});
        
        // Call the parent onSubmit
        onSubmit(formData);
    };

    const handleCancel = () => {
        window.history.back();
    };

    return (
        <div className="post d-flex flex-column-fluid" id="kt_post">
            <div id="kt_content_container" className="container-xxl">
                <form onSubmit={handleSubmit}>
                    <div className="row">
                        <div className="row col-md-12">
                            <div className="card">
                                <div className="card-header border-0">
                                    <div className="card-title">
                                        <h2>{mode === 'create' ? t('admin.terminalGroupsUI.form.addTitle') : t('admin.terminalGroupsUI.form.editTitle')}</h2>
                                    </div>
                                </div>
                                
                                <div className="card-body p-3">
                                    <div className="col-md-12">
                                        <div className="">
                                            {Object.keys(errors).length > 0 && (
                                                <div className="alert alert-danger alert-dismissible fade show" role="alert">
                                                    <div className="d-flex">
                                                        <i className="ki-duotone ki-cross-circle fs-2hx text-danger me-4">
                                                            <span className="path1"></span>
                                                            <span className="path2"></span>
                                                        </i>
                                                        <div className="d-flex flex-column">
                                                            <h4 className="mb-1">{t('admin.terminalGroupsUI.form.validationErrors')}</h4>
                                                            <ul className="mb-0">
                                                                {Object.values(errors).flat().map((error, index) => (
                                                                    <li key={index}>{error}</li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    </div>
                                                    <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label={t('admin.terminalGroupsUI.form.close')}></button>
                                                </div>
                                            )}
                                            
                                            <div className="row">
                                                <div className="col-12">
                                                    <h4 className="mb-3">{t('admin.terminalGroupsUI.form.sectionInfo')}</h4>
                                                </div>
                                                
                                                <div className="col-md-12 mb-3">
                                                    <label htmlFor="name" className="form-label">{t('admin.terminalGroupsUI.form.groupName')} <span className="text-danger">*</span></label>
                                                    <input 
                                                        type="text" 
                                                        name="name" 
                                                        id="name" 
                                                        className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                                                        value={formData.name}
                                                        onChange={handleInputChange}
                                                        placeholder={t('admin.terminalGroupsUI.form.namePh')}
                                                        required
                                                    />
                                                    {errors.name && (
                                                        <div className="invalid-feedback">{errors.name[0]}</div>
                                                    )}
                                                </div>
                                                
                                                <div className="col-12 mb-3">
                                                    <div className="form-check">
                                                        <input 
                                                            className="form-check-input" 
                                                            type="checkbox" 
                                                            id="is_subgroup" 
                                                            checked={isSubgroup}
                                                            onChange={handleSubgroupChange}
                                                        />
                                                        <label className="form-check-label" htmlFor="is_subgroup">
                                                            This is a subgroup
                                                        </label>
                                                    </div>
                                                </div>
                                                
                                                {isSubgroup && (
                                                    <div className="col-md-12 mb-3">
                                                        <label htmlFor="parent_id" className="form-label">{t('admin.terminalGroupsUI.form.parentGroup')} <span className="text-danger">*</span></label>
                                                        <select 
                                                            name="parent_id" 
                                                            id="parent_id" 
                                                            className={`form-control ${errors.parent_id ? 'is-invalid' : ''}`}
                                                            value={formData.parent_id}
                                                            onChange={handleSelectChange}
                                                            required={isSubgroup}
                                                        >
                                                            <option value="">{t('admin.terminalGroupsUI.form.selectParent')}</option>
                                                            {parentGroups.map(group => (
                                                                <option key={group.id} value={group.id}>
                                                                    {group.text}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        {errors.parent_id && (
                                                            <div className="invalid-feedback">{errors.parent_id[0]}</div>
                                                        )}
                                                    </div>
                                                )}
                                                
                                                <div className="col-12 mb-3">
                                                    <label htmlFor="description" className="form-label">{t('admin.terminalGroupsUI.form.description')}</label>
                                                    <textarea 
                                                        name="description" 
                                                        id="description" 
                                                        className={`form-control ${errors.description ? 'is-invalid' : ''}`}
                                                        rows="3" 
                                                        placeholder={t('admin.terminalGroupsUI.form.descriptionPh')}
                                                        value={formData.description}
                                                        onChange={handleInputChange}
                                                    ></textarea>
                                                    {errors.description && (
                                                        <div className="invalid-feedback">{errors.description[0]}</div>
                                                    )}
                                                </div>
                                                
                                                <div className="col-12 mb-3">
                                                    <div className="row">
                                                        <div className="col-md-12 mb-3">
                                                            <label htmlFor="merchant_id" className="form-label">{t('admin.terminalGroupsUI.form.merchant')} <span className="text-danger">*</span></label>
                                                            <select
                                                                id="merchant_id"
                                                                name="merchant_id"
                                                                className={`form-control ${errors.merchant_id ? 'is-invalid' : ''}`}
                                                                value={formData.merchant_id}
                                                                onChange={handleSelectChange}
                                                                required
                                                            >
                                                                <option value="">{t('admin.terminalGroupsUI.form.selectMerchant')}</option>
                                                                {merchantOptions.map(opt => (
                                                                    <option key={opt.id} value={opt.id}>
                                                                        {getTranslatedText(opt.business_name) || getTranslatedText(opt.name) || opt.text || opt.name}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                            {errors.merchant_id && (
                                                                <div className="invalid-feedback d-block">{errors.merchant_id[0]}</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="col-12 mb-3">
                                                    <label htmlFor="user_group_ids" className="form-label">
                                                        {t('admin.terminalGroupsUI.form.selectUserGroups')} <span className="text-danger">*</span>
                                                    </label>
                                                    <CustomUserGroupSelector
                                                        selectedUserGroups={formData.user_group_ids}
                                                        onUserGroupChange={(userGroupIds) => {
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                user_group_ids: userGroupIds
                                                            }));
                                                            // Clear errors when user groups are selected
                                                            if (errors.user_group_ids) {
                                                                setErrors(prev => ({
                                                                    ...prev,
                                                                    user_group_ids: ''
                                                                }));
                                                            }
                                                        }}
                                                        merchantId={formData.merchant_id}
                                                        className="mt-2"
                                                    />
                                                    {errors.user_group_ids && (
                                                        <div className="invalid-feedback d-block">{errors.user_group_ids[0]}</div>
                                                    )}
                                                </div>
                                                
                                                <div className="col-12 mb-3">
                                                    <label htmlFor="terminal_ids" className="form-label">
                                                        {t('admin.terminalGroupsUI.form.selectTerminals')} <span className="text-danger">*</span>
                                                    </label>
                                                    <CustomTerminalSelector
                                                        selectedTerminals={formData.terminal_ids}
                                                        onTerminalChange={(terminalIds) => {
                                                            setFormData(prev => ({
                                                                ...prev,
                                                                terminal_ids: terminalIds
                                                            }));
                                                            // Clear errors when terminals are selected
                                                            if (errors.terminal_ids) {
                                                                setErrors(prev => ({
                                                                    ...prev,
                                                                    terminal_ids: ''
                                                                }));
                                                            }
                                                        }}
                                                        merchantId={formData.merchant_id}
                                                        className="mt-2"
                                                    />
                                                    {errors.terminal_ids && (
                                                        <div className="invalid-feedback d-block">{errors.terminal_ids[0]}</div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="card-footer">
                                    <div className="d-flex justify-content-end gap-2">
                                        <button 
                                            type="submit" 
                                            className="btn btn-primary"
                                            disabled={loading || externalLoading}
                                        >
                                            {(loading || externalLoading) ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                    {mode === 'create' ? t('admin.terminalGroupsUI.form.creating') : t('admin.terminalGroupsUI.form.updating')}
                                                </>
                                            ) : (
                                                <>
                                                    <i className="ki-duotone ki-check fs-2">
                                                        <span className="path1"></span>
                                                        <span className="path2"></span>
                                                    </i>
                                                    {mode === 'create' ? t('admin.terminalGroupsUI.form.createBtn') : t('admin.terminalGroupsUI.form.updateBtn')}
                                                </>
                                            )}
                                        </button>
                                        <button 
                                            type="button" 
                                            className="btn btn-secondary"
                                            onClick={handleCancel}
                                        >
                                            <i className="ki-duotone ki-cross fs-2">
                                                <span className="path1"></span>
                                                <span className="path2"></span>
                                            </i>
                                            {t('admin.terminalGroupsUI.form.cancel')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdminTerminalGroupForm;

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useToolbar } from '../../../../contexts/ToolbarContext';
import { getRole, updateRole, getPermissions } from '../../../../services/adminRolesService';

const AdminRoleEdit = () => {
    const { id } = useParams();
    const { setTitle, setActions } = useToolbar();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [permissions, setPermissions] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        permissions: []
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        setTitle('Edit Role');
        setActions(null);
        fetchData();
    }, [id, setTitle, setActions]);

    const fetchData = async () => {
        try {
            const [roleResponse, permissionsResponse] = await Promise.all([
                getRole(id),
                getPermissions()
            ]);

            if (roleResponse.success) {
                const roleData = roleResponse.data.data;
                setFormData({
                    name: roleData.role.name,
                    permissions: roleData.permissions || []
                });
            }

            if (permissionsResponse.success) {
                setPermissions(permissionsResponse.data.data || []);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to fetch role data');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        try {
            const response = await updateRole(id, formData);
            if (response.success) {
                toast.success('Role updated successfully');
                navigate('/admin/system/roles');
            } else {
                if (response.errors) {
                    setErrors(response.errors);
                }
                toast.error(response.error || 'Failed to update role');
            }
        } catch (error) {
            console.error('Error updating role:', error);
            toast.error('Failed to update role');
        } finally {
            setLoading(false);
        }
    };

    // Group permissions by module and category (pos/sales/etc.)
    const grouped = useMemo(() => {
        const map = {};
        const add = (moduleKey, categoryKey, perm) => {
            if (!map[moduleKey]) map[moduleKey] = {};
            if (!map[moduleKey][categoryKey]) map[moduleKey][categoryKey] = [];
            map[moduleKey][categoryKey].push(perm);
        };
        (permissions || []).forEach((p) => {
            const name = p?.name || '';
            const parts = name.split('.');
            if (parts.length >= 3) {
                const [moduleKey, categoryKey] = parts;
                add(moduleKey, categoryKey, p);
            } else {
                add('general', 'general', p);
            }
        });
        return map;
    }, [permissions]);

    const getCategoryIds = (moduleKey, categoryKey) =>
        (grouped[moduleKey]?.[categoryKey] || []).map((p) => p.id);
    const getModuleIds = (moduleKey) =>
        Object.keys(grouped[moduleKey] || {}).flatMap((cat) => getCategoryIds(moduleKey, cat));

    const isAllSelected = (ids) => ids.length > 0 && ids.every((id) => formData.permissions.includes(id));
    const isNoneSelected = (ids) => ids.every((id) => !formData.permissions.includes(id));
    const isSomeSelected = (ids) => !isNoneSelected(ids) && !isAllSelected(ids);

    const toggleIds = (ids, selectAll) => {
        setFormData((prev) => {
            const current = new Set(prev.permissions);
            if (selectAll) {
                ids.forEach((id) => current.add(id));
            } else {
                ids.forEach((id) => current.delete(id));
            }
            return { ...prev, permissions: Array.from(current) };
        });
    };

    const handleToggleModule = (moduleKey) => {
        const ids = getModuleIds(moduleKey);
        const selectAll = !isAllSelected(ids);
        toggleIds(ids, selectAll);
    };

    const handleToggleCategory = (moduleKey, categoryKey) => {
        const ids = getCategoryIds(moduleKey, categoryKey);
        const selectAll = !isAllSelected(ids);
        toggleIds(ids, selectAll);
    };

    const handlePermissionToggle = (permissionId) => {
        setFormData((prev) => ({
            ...prev,
            permissions: prev.permissions.includes(permissionId)
                ? prev.permissions.filter((id) => id !== permissionId)
                : [...prev.permissions, permissionId],
        }));
    };

    const indeterminateRefs = useRef({});
    useEffect(() => {
        Object.keys(grouped).forEach((moduleKey) => {
            const ids = getModuleIds(moduleKey);
            const ref = indeterminateRefs.current[`module-${moduleKey}`];
            if (ref) ref.indeterminate = isSomeSelected(ids);
        });
        Object.entries(grouped).forEach(([moduleKey, cats]) => {
            Object.keys(cats || {}).forEach((categoryKey) => {
                const ids = getCategoryIds(moduleKey, categoryKey);
                const ref = indeterminateRefs.current[`cat-${moduleKey}-${categoryKey}`];
                if (ref) ref.indeterminate = isSomeSelected(ids);
            });
        });
    }, [grouped, formData.permissions]);

    return (
        <div className="card">
            <div className="card-header">
                <h3 className="card-title">Edit Role</h3>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="card-body">
                    <div className="mb-5">
                        <label className="form-label required">Role Name</label>
                        <input
                            type="text"
                            className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                        {errors.name && <div className="invalid-feedback">{errors.name[0]}</div>}
                    </div>

                    <div className="mb-5">
                        <label className="form-label required">Permissions</label>
                        <div className="accordion" id="permissions-accordion">
                            {Object.keys(grouped).sort().map((moduleKey) => {
                                const moduleIds = getModuleIds(moduleKey);
                                const moduleChecked = isAllSelected(moduleIds);
                                return (
                                    <div className="mb-5 border rounded" key={moduleKey}>
                                        <div className="p-3 bg-light d-flex align-items-center justify-content-between">
                                            <div className="form-check">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    id={`module-${moduleKey}`}
                                                    ref={(el) => (indeterminateRefs.current[`module-${moduleKey}`] = el)}
                                                    checked={moduleChecked}
                                                    onChange={() => handleToggleModule(moduleKey)}
                                                />
                                                <label className="form-check-label fw-bold text-uppercase" htmlFor={`module-${moduleKey}`}>
                                                    {moduleKey}
                                                </label>
                                            </div>
                                        </div>
                                        <div className="p-3">
                                            <div className="row">
                                                {Object.keys(grouped[moduleKey] || {}).sort().map((categoryKey) => {
                                                    const categoryIds = getCategoryIds(moduleKey, categoryKey);
                                                    const categoryChecked = isAllSelected(categoryIds);
                                                    return (
                                                        <div className="col-md-6 mb-4" key={`${moduleKey}-${categoryKey}`}>
                                                            <div className="mb-2 d-flex align-items-center justify-content-between">
                                                                <div className="form-check">
                                                                    <input
                                                                        className="form-check-input"
                                                                        type="checkbox"
                                                                        id={`cat-${moduleKey}-${categoryKey}`}
                                                                        ref={(el) => (indeterminateRefs.current[`cat-${moduleKey}-${categoryKey}`] = el)}
                                                                        checked={categoryChecked}
                                                                        onChange={() => handleToggleCategory(moduleKey, categoryKey)}
                                                                    />
                                                                    <label className="form-check-label fw-semibold" htmlFor={`cat-${moduleKey}-${categoryKey}`}>
                                                                        {categoryKey.replace(/_/g, ' ')}
                                                                    </label>
                                                                </div>
                                                            </div>
                                                            <div className="row g-2 ms-6">
                                                                {(grouped[moduleKey][categoryKey] || []).map((perm) => (
                                                                    <div className="col-12" key={perm.id}>
                                                                        <div className="form-check">
                                                                            <input
                                                                                className="form-check-input"
                                                                                type="checkbox"
                                                                                id={`permission-${perm.id}`}
                                                                                checked={formData.permissions.includes(perm.id)}
                                                                                onChange={() => handlePermissionToggle(perm.id)}
                                                                            />
                                                                            <label className="form-check-label" htmlFor={`permission-${perm.id}`}>
                                                                                {perm.display_name || perm.name}
                                                                            </label>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="card-footer d-flex justify-content-end gap-2">
                    <button
                        type="button"
                        className="btn btn-light"
                        onClick={() => navigate('/admin/system/roles')}
                    >
                        Cancel
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Updating...' : 'Update Role'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AdminRoleEdit;



import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { createWarehouse } from '../../../services/inventoryService';
import { useToolbar } from '../../../contexts/ToolbarContext';
import WarehouseForm from './WarehouseForm';

export default function WarehouseCreate() {
    const navigate = useNavigate();
    const { setTitle, setBreadcrumbs } = useToolbar();
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        city: '',
        address: ''
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Set page title and breadcrumbs
    useEffect(() => {
        setTitle('Add Warehouse');
        setBreadcrumbs([
            { label: 'Dashboard', path: '/sales/dashboard' },
            { label: 'Product Management', path: '#' },
            { label: 'Warehouse', path: '/sales/warehouse' },
            { label: 'Add Warehouse', path: '/sales/warehouse/create', active: true }
        ]);

        return () => {
            setBreadcrumbs([]);
        };
    }, [setTitle, setBreadcrumbs]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});
        setIsSubmitting(true);

        try {
            await createWarehouse(formData);
            toast.success('Warehouse created successfully');
            navigate('/sales/warehouse');
        } catch (error) {
            console.error('Error creating warehouse:', error);
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            }
            toast.error(error.response?.data?.message || 'Failed to create warehouse');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        navigate('/sales/warehouse');
    };

    return (
        <div className="card">
            {/* Card Header */}
            <div className="card-header border-0 pt-6">
                <div className="card-title">
                    <h2>Add New Warehouse</h2>
                </div>
                <div className="card-toolbar">
                    <button 
                        className="btn btn-sm btn-light-danger"
                        onClick={handleCancel}
                        disabled={isSubmitting}
                    >
                        <i className="ki-duotone ki-arrow-left fs-5 me-1">
                            <span className="path1"></span>
                            <span className="path2"></span>
                        </i>
                        Back
                    </button>
                </div>
            </div>

            {/* Card Body */}
            <div className="card-body py-4">
                <form onSubmit={handleSubmit}>
                    <WarehouseForm
                        formData={formData}
                        setFormData={setFormData}
                        errors={errors}
                        isSubmitting={isSubmitting}
                    />

                    {/* Form Actions */}
                    <div className="text-end pt-3">
                        <button
                            type="button"
                            className="btn btn-light me-3"
                            onClick={handleCancel}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2"></span>
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <i className="ki-duotone ki-check fs-3 me-1">
                                        <span className="path1"></span>
                                        <span className="path2"></span>
                                    </i>
                                    Save
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}




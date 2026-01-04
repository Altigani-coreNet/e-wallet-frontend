import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useToolbar } from '../../../contexts/ToolbarContext';
import { getWarehouseById } from '../../../services/adminWarehousesService';
import LoadingSpinner from '../../common/LoadingSpinner';
import { getTranslatedText, formatDateTime } from '../../../utils/helpers';

const AdminWarehouseView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { setTitle, setActions } = useToolbar();
    const [warehouse, setWarehouse] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setTitle('Warehouse Details');
        setActions(<button className="btn btn-sm btn-secondary" onClick={() => navigate('/admin/sales/warehouses')}><i className="ki-duotone ki-arrow-left fs-2"><span className="path1"></span><span className="path2"></span></i> Back to List</button>);
        return () => setActions(null);
    }, [setTitle, setActions, navigate]);

    useEffect(() => {
        fetchWarehouse();
    }, [id]);

    const fetchWarehouse = async () => {
        try {
            setLoading(true);
            const response = await getWarehouseById(id);
            if (response.success) setWarehouse(response.data);
        } catch (error) {
            console.error('Error fetching warehouse:', error);
            toast.error('Failed to load warehouse details');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <LoadingSpinner />;
    if (!warehouse) return <div className="card"><div className="card-body text-center py-10"><div className="text-muted">Warehouse not found</div></div></div>;

    return (
        <div className="card">
            <div className="card-header"><h3 className="card-title">Warehouse Information</h3></div>
            <div className="card-body">
                <div className="row mb-7">
                    <label className="col-lg-4 fw-bold text-muted">Warehouse ID</label>
                    <div className="col-lg-8"><span className="fw-bolder fs-6 text-gray-800">{warehouse.id}</span></div>
                </div>
                <div className="row mb-7">
                    <label className="col-lg-4 fw-bold text-muted">Name</label>
                    <div className="col-lg-8"><span className="fw-bolder fs-6 text-gray-800">{getTranslatedText(warehouse.name) || 'N/A'}</span></div>
                </div>
                {warehouse.phone && (
                    <div className="row mb-7">
                        <label className="col-lg-4 fw-bold text-muted">Phone</label>
                        <div className="col-lg-8"><span className="fw-bold fs-6 text-gray-800">{warehouse.phone}</span></div>
                    </div>
                )}
                {warehouse.email && (
                    <div className="row mb-7">
                        <label className="col-lg-4 fw-bold text-muted">Email</label>
                        <div className="col-lg-8"><span className="fw-bold fs-6 text-gray-800">{warehouse.email}</span></div>
                    </div>
                )}
                {warehouse.address && (
                    <div className="row mb-7">
                        <label className="col-lg-4 fw-bold text-muted">Address</label>
                        <div className="col-lg-8"><span className="fw-bold fs-6 text-gray-800">{warehouse.address}</span></div>
                    </div>
                )}
                <div className="row mb-7">
                    <label className="col-lg-4 fw-bold text-muted">Created At</label>
                    <div className="col-lg-8"><span className="fw-bold fs-6 text-gray-800">{formatDateTime(warehouse.created_at) || 'N/A'}</span></div>
                </div>
            </div>
        </div>
    );
};

export default AdminWarehouseView;


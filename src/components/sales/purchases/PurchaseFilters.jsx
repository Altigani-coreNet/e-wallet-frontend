import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { POS_ENDPOINTS } from '../../../utils/constants';
import { getToken } from '../../../utils/api';
import { getSuppliers } from '../../../services/suppliersService';

const PurchaseFilters = ({ filters, onFilterChange, onClearFilters }) => {
    const [warehouses, setWarehouses] = useState([]);
    const [suppliers, setSuppliers] = useState([]);

    useEffect(() => {
        fetchWarehouses();
        fetchSuppliers();
    }, []);

    const fetchWarehouses = async () => {
        try {
            const token = getToken();
            const response = await axios.get(POS_ENDPOINTS.WAREHOUSES, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });
            
            if (response.data?.data) {
                const warehousesData = response.data.data.warehouses || response.data.data || [];
                setWarehouses(warehousesData);
            }
        } catch (error) {
            console.error('Error fetching warehouses:', error);
        }
    };

    const fetchSuppliers = async () => {
        try {
            const response = await getSuppliers({ per_page: 1000 });
            if (response.success) {
                const suppliersData = response.data?.suppliers || response.data?.data || [];
                setSuppliers(suppliersData);
            }
        } catch (error) {
            console.error('Error fetching suppliers:', error);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        onFilterChange({ [name]: value });
    };

    return (
        <div className="card" style={{ marginBottom: '20px' }}>
            <div className="card-header">
                <div className="card-title">
                    <h3 className="card-label">Purchase Filters</h3>
                </div>
                <div className="card-toolbar">
                    <button 
                        type="button" 
                        className="btn btn-sm btn-light-danger" 
                        onClick={onClearFilters}
                    >
                        <i className="ki-duotone ki-trash">
                            <span className="path1"></span>
                            <span className="path2"></span>
                            <span className="path3"></span>
                            <span className="path4"></span>
                            <span className="path5"></span>
                        </i>
                        Reset
                    </button>
                </div>
            </div>
            <div className="card-body">
                <div className="row g-4">
                    <div className="col-md-3">
                        <label className="form-label">Search</label>
                        <input
                            type="text"
                            name="search"
                            className="form-control form-control-solid"
                            placeholder="Reference, supplier..."
                            value={filters.search || ''}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="col-md-3">
                        <label className="form-label">Warehouse</label>
                        <select
                            name="warehouse_id"
                            className="form-select form-select-solid"
                            value={filters.warehouse_id || ''}
                            onChange={handleChange}
                        >
                            <option value="">All Warehouses</option>
                            {warehouses.map((warehouse) => (
                                <option key={warehouse.id} value={warehouse.id}>
                                    {warehouse.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="col-md-3">
                        <label className="form-label">Supplier</label>
                        <select
                            name="supplier_id"
                            className="form-select form-select-solid"
                            value={filters.supplier_id || ''}
                            onChange={handleChange}
                        >
                            <option value="">All Suppliers</option>
                            {suppliers.map((supplier) => (
                                <option key={supplier.id} value={supplier.id}>
                                    {supplier.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="col-md-3">
                        <label className="form-label">From Date</label>
                        <input
                            type="date"
                            name="start_date"
                            className="form-control form-control-solid"
                            value={filters.start_date || ''}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="col-md-3">
                        <label className="form-label">To Date</label>
                        <input
                            type="date"
                            name="end_date"
                            className="form-control form-control-solid"
                            value={filters.end_date || ''}
                            onChange={handleChange}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PurchaseFilters;


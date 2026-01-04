import React from 'react';
import { Link } from 'react-router-dom';
import { deleteServiceFee } from '../../../../services/adminServiceFeesService';
import { toast } from 'react-toastify';

const ServiceFeeTableRow = ({ serviceFee, isSelected, onSelect, onRefresh }) => {
    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this service fee?')) return;
        
        const response = await deleteServiceFee(serviceFee.id);
        if (response.success) {
            toast.success('Service fee deleted successfully');
            onRefresh();
        } else {
            toast.error(response.error || 'Failed to delete service fee');
        }
    };

    return (
        <tr>
            <td>
                <div className="form-check form-check-sm form-check-custom form-check-solid">
                    <input 
                        className="form-check-input" 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={() => onSelect(serviceFee.id)}
                    />
                </div>
            </td>
            <td>{serviceFee.id}</td>
            <td className="fw-bold">{serviceFee.name}</td>
            <td><span className="badge badge-light-primary">{serviceFee.type}</span></td>
            <td>{Number(serviceFee.fees).toFixed(2)}</td>
            <td>{new Date(serviceFee.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}</td>
            <td className="text-end">
                <div className="d-flex justify-content-end flex-shrink-0">
                    <Link 
                        to={`/admin/settings/service-fees/${serviceFee.id}`}
                        className="btn btn-icon btn-bg-light btn-active-color-primary btn-sm me-1"
                        data-bs-toggle="tooltip"
                        title="View"
                    >
                        <i className="ki-duotone ki-eye fs-3">
                            <span className="path1"></span>
                            <span className="path2"></span>
                            <span className="path3"></span>
                        </i>
                    </Link>
                    <Link 
                        to={`/admin/settings/service-fees/${serviceFee.id}/edit`}
                        className="btn btn-icon btn-bg-light btn-active-color-primary btn-sm me-1"
                        data-bs-toggle="tooltip"
                        title="Edit"
                    >
                        <i className="ki-duotone ki-pencil fs-3">
                            <span className="path1"></span>
                            <span className="path2"></span>
                        </i>
                    </Link>
                    <button 
                        onClick={handleDelete}
                        className="btn btn-icon btn-bg-light btn-active-color-danger btn-sm"
                        data-bs-toggle="tooltip"
                        title="Delete"
                    >
                        <i className="ki-duotone ki-trash fs-3">
                            <span className="path1"></span>
                            <span className="path2"></span>
                            <span className="path3"></span>
                            <span className="path4"></span>
                            <span className="path5"></span>
                        </i>
                    </button>
                </div>
            </td>
        </tr>
    );
};

export default ServiceFeeTableRow;



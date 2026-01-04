import React from 'react';
import { Link } from 'react-router-dom';
import { deleteCurrency } from '../../../../services/adminCurrenciesService';
import { toast } from 'react-toastify';
import { useCan } from '../../../../utils/permissions';

const CurrencyTableRow = ({ currency, isSelected, onSelect, onRefresh }) => {
    const canEditCurrency = useCan('pos.currencies.edit_currencies');
    const canDeleteCurrency = useCan('pos.currencies.delete_currencies');
    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this currency?')) return;
        
        const response = await deleteCurrency(currency.id);
        if (response.success) {
            toast.success('Currency deleted successfully');
            onRefresh();
        } else {
            toast.error(response.error || 'Failed to delete currency');
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
                        onChange={() => onSelect(currency.id)}
                    />
                </div>
            </td>
            <td>{currency.id}</td>
            <td className="fw-bold">{currency.country}</td>
            <td>{currency.name}</td>
            <td>{currency.symbol}</td>
            <td><span className="badge badge-light-info">{currency.currency_code}</span></td>
            <td>{new Date(currency.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}</td>
            <td className="text-end">
                <div className="d-flex justify-content-end flex-shrink-0">
                    <Link 
                        to={`/admin/settings/currencies/${currency.id}`}
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
                    {canEditCurrency && (
                        <Link 
                            to={`/admin/settings/currencies/${currency.id}/edit`}
                            className="btn btn-icon btn-bg-light btn-active-color-primary btn-sm me-1"
                            data-bs-toggle="tooltip"
                            title="Edit"
                        >
                            <i className="ki-duotone ki-pencil fs-3">
                                <span className="path1"></span>
                                <span className="path2"></span>
                            </i>
                        </Link>
                    )}
                    {canDeleteCurrency && (
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
                    )}
                </div>
            </td>
        </tr>
    );
};

export default CurrencyTableRow;



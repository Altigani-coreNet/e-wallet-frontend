import React from 'react';
import { Link } from 'react-router-dom';

const ServiceFeeTableRow = ({ serviceFee }) => {
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    };

    const getTypeBadge = (type) => {
        const typeColors = {
            'transaction': 'badge-primary',
            'monthly': 'badge-success',
            'setup': 'badge-info',
            'annual': 'badge-warning'
        };
        return typeColors[type?.toLowerCase()] || 'badge-secondary';
    };

    return (
        <tr>
            <td>
                <span className="text-gray-800 fw-bold">#{serviceFee.sequential_id || serviceFee.id}</span>
            </td>
            <td>
                <Link 
                    to={`/merchant/service-fees/${serviceFee.id}`}
                    className="text-dark fw-bolder d-block fs-6 text-hover-primary"
                >
                    {serviceFee.name}
                </Link>
            </td>
            <td>
                <span className={`badge ${getTypeBadge(serviceFee.type)}`}>
                    {serviceFee.type?.toUpperCase() || 'N/A'}
                </span>
            </td>
            <td>
                <span className="text-dark fw-bold">${formatCurrency(serviceFee.fees)}</span>
            </td>
            <td>
                <span className="text-gray-600">{serviceFee.description || '-'}</span>
            </td>
            <td>
                <span className="text-gray-600">
                    {formatDate(serviceFee.created_at)}
                </span>
            </td>
        </tr>
    );
};

export default ServiceFeeTableRow;


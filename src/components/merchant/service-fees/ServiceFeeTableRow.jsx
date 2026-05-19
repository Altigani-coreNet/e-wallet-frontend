import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../../../stores/authStore';

const ServiceFeeTableRow = ({ serviceFee }) => {
    const { t, i18n } = useTranslation();
    const { formatCurrency } = useAuthStore();
    const formatDate = (dateString) => {
        if (!dateString) return t('merchant.common.na');
        const date = new Date(dateString);
        return date.toLocaleDateString(i18n.language === 'ar' ? 'ar' : 'en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
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
                    {serviceFee.type?.toUpperCase() || t('merchant.common.na')}
                </span>
            </td>
            <td>
                <span className="text-dark fw-bold">{formatCurrency(serviceFee.fees)}</span>
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


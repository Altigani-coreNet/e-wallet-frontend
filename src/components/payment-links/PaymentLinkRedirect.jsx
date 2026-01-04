import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import { apiGet } from '../../utils/apiUtils';
import { SOFTPOS_API_BASE } from '../../utils/constants';

const PaymentLinkRedirect = () => {
    const { uuid } = useParams();
    const [message, setMessage] = useState('Preparing your payment...');

    useEffect(() => {
        const fetchLink = async () => {
            try {
                setMessage('Loading payment link...');
                const res = await apiGet(`${SOFTPOS_API_BASE}/payment-links/uuid/${uuid}`);
                if (!res.success || !res.data) {
                    throw new Error(res.message || 'Payment link not found');
                }

                const linkData = res.data;
                const redirectUrl = linkData.data.link;
                if (!redirectUrl) {
                    throw new Error('Payment link URL is missing');
                }

                setMessage('Redirecting to payment...');
                window.location.assign(redirectUrl);
            } catch (err) {
                console.error('Payment link redirect error:', err);
                setMessage('Unable to load payment link.');
                Swal.fire({
                    title: 'Payment Link Error',
                    text: err.message || 'Unable to load payment link.',
                    icon: 'error',
                    confirmButtonText: 'Close',
                });
            }
        };

        if (uuid) {
            fetchLink();
        } else {
            setMessage('Missing payment link identifier.');
        }
    }, [uuid]);

    return (
        <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '60vh' }}>
            <div className="text-center">
                <div className="spinner-border text-primary mb-3" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
                <div className="fw-bold">{message}</div>
            </div>
        </div>
    );
};

export default PaymentLinkRedirect;


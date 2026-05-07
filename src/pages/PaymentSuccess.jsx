import React, { useMemo, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CheckCircle2, Download, Home, ReceiptText } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import './PaymentSuccess.css';

const formatAmount = (amount, currency) => {
    const parsed = Number(amount);
    const numericAmount = Number.isFinite(parsed) ? parsed : 0;
    return `${currency} ${numericAmount.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
};

const shortReferenceFromUuid = (uuid, fallbackIntent) => {
    if (uuid && typeof uuid === 'string') {
        const trimmed = uuid.trim();
        if (trimmed.includes('-')) {
            const parts = trimmed.split('-').filter(Boolean);
            if (parts.length >= 2) {
                return `${parts[parts.length - 2]}-${parts[parts.length - 1]}`;
            }
        }
        return trimmed.slice(-12);
    }
    return fallbackIntent ? String(fallbackIntent).slice(-12) : 'N/A';
};

const PaymentSuccess = () => {
    const { search } = useLocation();
    const params = useMemo(() => new URLSearchParams(search), [search]);
    const invoiceRef = useRef(null);

    const receipt = {
        merchantName: params.get('merchant') || 'CoreNet Merchant',
        amount: params.get('amount') || '0',
        currency: params.get('currency') || 'USD',
        method: params.get('method') || 'Card',
        uuid: params.get('uuid') || '',
        intentId: params.get('intent') || `pi_${Math.random().toString(36).slice(2, 14)}`,
        date: new Date().toLocaleString(),
    };

    const totalAmount = formatAmount(receipt.amount, receipt.currency);
    const displayReference = shortReferenceFromUuid(receipt.uuid, receipt.intentId);
    const linkInvoiceUrl = receipt.uuid
        ? `${window.location.origin}/link-invoice/${receipt.uuid}`
        : window.location.href;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(linkInvoiceUrl)}`;

    const onDownloadInvoice = async () => {
        if (!invoiceRef.current) return;

        const options = {
            margin: [8, 8, 8, 8],
            filename: `invoice-${displayReference}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
            pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
        };

        await html2pdf().set(options).from(invoiceRef.current).save();
    };

    return (
        <div className="ps-page">
            <div className="ps-receipt-card" ref={invoiceRef}>
                <div className="ps-header">
                    <div className="ps-success-icon">
                        <CheckCircle2 size={52} strokeWidth={2.5} />
                    </div>

                    <div className="ps-header-text">
                        <h1>Payment Success!</h1>
                        <h2>{totalAmount}</h2>
                        <p>Thank you for using our platform. Your payment has been received.</p>
                    </div>
                </div>

                <div className="ps-line" />

                <div className="ps-details">
                    <div className="ps-detail-row">
                        <span>Ref Number</span>
                        <strong>{displayReference}</strong>
                    </div>
                    <div className="ps-detail-row">
                        <span>Payment Time</span>
                        <strong>{receipt.date}</strong>
                    </div>
                    <div className="ps-detail-row">
                        <span>Payment Method</span>
                        <strong>{receipt.method}</strong>
                    </div>
                </div>

                <div className="ps-dash" />

                <div className="ps-amounts">
                    <div className="ps-detail-row">
                        <span>Amount</span>
                        <strong>{totalAmount}</strong>
                    </div>
                </div>

                <div className="ps-qr-block">
                    <div className="ps-qr-title">
                        <ReceiptText size={18} />
                        <span>Receipt QR Code</span>
                    </div>
                    <img src={qrUrl} alt="Receipt QR code" className="ps-qr-image" />
                    <small>Scan to verify this receipt details.</small>
                </div>

                <div className="ps-actions">
                    <button className="ps-btn ps-btn-light" onClick={onDownloadInvoice}>
                        <Download size={16} />
                        Download Receipt
                    </button>
                    <Link className="ps-btn ps-btn-primary" to="/">
                        <Home size={16} />
                        Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default PaymentSuccess;

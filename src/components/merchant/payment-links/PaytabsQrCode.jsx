import React, { useState, useEffect, useRef } from 'react';
import { generateQrCode, checkStatus } from '../../../services/paytabsService';
import { toast } from 'react-toastify';

const PaytabsQrCode = ({ amount }) => {
  const [qrCodeBase64, setQrCodeBase64] = useState(null);
  const [tranRef, setTranRef] = useState(null);
  const [status, setStatus] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const pollingIntervalRef = useRef(null);

  useEffect(() => {
    if (!amount || amount <= 0) {
      setError('Invalid amount. Please provide a valid payment amount.');
      setLoading(false);
      return;
    }

    const initQrCode = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await generateQrCode(amount);
        const data = response.data || response;

        if (data.status === 'success' && data.tran_ref && data.qr_code_base64) {
          const cleanBase64 = data.qr_code_base64.trim().replace(/\s/g, '');
          setQrCodeBase64(cleanBase64);
          setTranRef(data.tran_ref);
          setStatus('pending');
        } else {
          throw new Error('Failed to generate QR code: Invalid response structure');
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to generate QR code.');
        toast.error('Failed to generate QR code');
      } finally {
        setLoading(false);
      }
    };

    initQrCode();
  }, [amount]);

  useEffect(() => {
    if (!tranRef) return;

    const pollStatus = async () => {
      try {
        const response = await checkStatus(tranRef);
        if (response.status) {
          setStatus(response.status);
          if (['completed', 'failed'].includes(response.status)) {
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }
            if (response.status === 'completed') toast.success('Payment completed');
            if (response.status === 'failed') toast.error('Payment failed');
          }
        }
      } catch (err) {
        // silent on polling errors
      }
    };

    pollStatus();
    pollingIntervalRef.current = setInterval(pollStatus, 5000);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [tranRef]);

  const getStatusColor = () => {
    switch (status) {
      case 'completed': return 'bg-success';
      case 'failed': return 'bg-danger';
      default: return 'bg-warning';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'completed': return 'Payment Completed';
      case 'failed': return 'Payment Failed';
      default: return 'Waiting for Payment';
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center p-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <span className="ms-3">Generating QR code...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        <h5 className="alert-heading">Error</h5>
        <p>{error}</p>
      </div>
    );
  }

  if (!qrCodeBase64) {
    return (
      <div className="alert alert-warning" role="alert">
        No QR code available. Please try again.
      </div>
    );
  }

  return (
    <div className="paytabs-qr-code-container">
      <div className="card">
        <div className="card-header">
          <h5 className="card-title mb-0">PayTabs QR Code Payment</h5>
        </div>
        <div className="card-body text-center">
          <div className="mb-3">
            <span className={`badge ${getStatusColor()} fs-6 px-3 py-2`}>
              {getStatusText()}
            </span>
          </div>

          <div className="mb-3 d-flex justify-content-center">
            <div
              style={{
                width: '300px',
                height: '300px',
                border: '2px solid #ddd',
                borderRadius: '8px',
                backgroundColor: '#fff',
                padding: '15px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative'
              }}
            >
              <img
                src={`data:image/png;base64,${qrCodeBase64}`}
                alt="PayTabs QR Code"
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  width: 'auto',
                  height: 'auto',
                  objectFit: 'contain',
                  display: 'block'
                }}
              />
            </div>
          </div>

          {tranRef && (
            <div className="mb-3">
              <small className="text-muted">
                Transaction Reference: <code>{tranRef}</code>
              </small>
            </div>
          )}

          <div className="mb-3">
            <h4 className="text-primary">
              Amount: {amount.toFixed(2)}
            </h4>
          </div>

          <div className="alert alert-info mt-3">
            <small>
              <strong>Instructions:</strong> Scan the QR code with your mobile payment app to complete the payment.
              {status === 'pending' && (
                <span className="d-block mt-2">
                  <i className="bi bi-arrow-repeat"></i> Checking payment status...
                </span>
              )}
            </small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaytabsQrCode;

















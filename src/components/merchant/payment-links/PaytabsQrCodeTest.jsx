import React, { useState } from 'react';
import PaytabsQrCode from './PaytabsQrCode';

const PaytabsQrCodeTest = () => {
  const [amount, setAmount] = useState(100.0);
  const [testAmount, setTestAmount] = useState(null);
  const [isTesting, setIsTesting] = useState(false);

  const handleTest = () => {
    if (!amount || amount <= 0) {
      alert('Please enter a valid amount greater than 0');
      return;
    }
    setTestAmount(amount);
    setIsTesting(true);
  };

  const handleReset = () => {
    setTestAmount(null);
    setIsTesting(false);
    setAmount(100.0);
  };

  return (
    <div className="container-fluid py-5">
      <div className="row justify-content-center">
        <div className="col-lg-8 col-xl-6">
          <div className="card shadow-sm">
            <div className="card-header bg-primary text-white">
              <h3 className="card-title mb-0">
                <i className="bi bi-qr-code me-2"></i>
                PayTabs QR Code Payment - Test Page
              </h3>
            </div>
            <div className="card-body">
              <div className="alert alert-info mb-4">
                <h5 className="alert-heading">
                  <i className="bi bi-info-circle me-2"></i>
                  Testing Instructions
                </h5>
                <ol className="mb-0">
                  <li>Enter a payment amount (minimum 0.01)</li>
                  <li>Click "Generate QR Code" to start the test</li>
                  <li>The QR code will be displayed and polling will start automatically</li>
                  <li>Status updates every 5 seconds until payment is completed or failed</li>
                  <li>Use "Reset Test" to start a new test</li>
                </ol>
              </div>

              {!isTesting && (
                <div className="mb-4">
                  <label htmlFor="amount-input" className="form-label fw-bold">
                    Payment Amount
                  </label>
                  <div className="input-group input-group-lg">
                    <span className="input-group-text">$</span>
                    <input
                      type="number"
                      id="amount-input"
                      className="form-control"
                      min="0.01"
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                      placeholder="Enter amount"
                    />
                  </div>
                  <div className="form-text">
                    Enter the payment amount you want to test (minimum: $0.01)
                  </div>
                  <div className="mt-3">
                    <button
                      className="btn btn-primary btn-lg me-2"
                      onClick={handleTest}
                      disabled={!amount || amount <= 0}
                    >
                      <i className="bi bi-qr-code me-2"></i>
                      Generate QR Code
                    </button>
                  </div>
                </div>
              )}

              {isTesting && testAmount && (
                <div>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="mb-0">QR Code Payment Test</h5>
                    <button
                      className="btn btn-outline-secondary btn-sm"
                      onClick={handleReset}
                    >
                      <i className="bi bi-arrow-counterclockwise me-1"></i>
                      Reset Test
                    </button>
                  </div>
                  <PaytabsQrCode amount={testAmount} />
                </div>
              )}

              <div className="mt-4">
                <div className="card bg-light">
                  <div className="card-header">
                    <h6 className="mb-0">
                      <i className="bi bi-code-square me-2"></i>
                      API Endpoints Used
                    </h6>
                  </div>
                  <div className="card-body">
                    <ul className="list-unstyled mb-0">
                      <li className="mb-2">
                        <strong>POST</strong>{' '}
                        <code>/api/paytabs/generate-qr</code>
                        <br />
                        <small className="text-muted">
                          Generates QR code and returns tran_ref and qr_code_base64
                        </small>
                      </li>
                      <li>
                        <strong>GET</strong>{' '}
                        <code>/api/paytabs/status/{'{tran_ref}'}</code>
                        <br />
                        <small className="text-muted">
                          Checks payment status (polled every 5 seconds)
                        </small>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaytabsQrCodeTest;



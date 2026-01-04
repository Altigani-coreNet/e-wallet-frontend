import React, { useState, useEffect, useCallback } from 'react';
import { getContractTerms } from '../../../services/contractsService';
import LoadingSpinner from '../../common/LoadingSpinner';
import Swal from 'sweetalert2';
import { useToolbar } from '../../../contexts/ToolbarContext';

const ContractView = () => {
    const { setTitle, setBreadcrumbs, setActions } = useToolbar();
    const [contract, setContract] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [locale, setLocale] = useState('en');

    const handleDownloadPDF = useCallback(() => {
        // Using html2pdf library that's already loaded in the original Blade
        const element = document.getElementById('pdf-content');
        const options = {
            margin: [10, 10, 10, 10],
            filename: 'merchant_agreement.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        if (window.html2pdf) {
            window.html2pdf().set(options).from(element).save();
        } else {
            Swal.fire({
                title: 'Error!',
                text: 'PDF library not loaded. Please refresh the page.',
                icon: 'error',
                confirmButtonText: 'OK'
            });
        }
    }, []);

    // Set toolbar title, breadcrumbs and actions
    useEffect(() => {
        setTitle('Contract Agreement');
        
        setBreadcrumbs([
            { label: 'Dashboard', path: '/merchant/dashboard' },
            { label: 'Contracts', path: '/merchant/contracts' },
            { label: 'Contract Agreement', path: '/merchant/contracts', active: true }
        ]);
        
        setActions(
            <div className="d-flex align-items-center gap-2 gap-lg-3">
                {/* Language Switcher */}
                <div className="d-flex align-items-center me-3">
                    <button
                        onClick={() => setLocale('en')}
                        className={`btn btn-sm btn-light-primary me-2 ${locale === 'en' ? 'active' : ''}`}
                    >
                        <i className="ki-duotone ki-abstract-26 fs-6 me-1">
                            <span className="path1"></span>
                            <span className="path2"></span>
                        </i>
                        EN
                    </button>
                    <button
                        onClick={() => setLocale('ar')}
                        className={`btn btn-sm btn-light-primary ${locale === 'ar' ? 'active' : ''}`}
                    >
                        <i className="ki-duotone ki-abstract-26 fs-6 me-1">
                            <span className="path1"></span>
                            <span className="path2"></span>
                        </i>
                        ع
                    </button>
                </div>

                {/* Download Button */}
                <button 
                    onClick={handleDownloadPDF}
                    className="btn btn-sm btn-primary"
                >
                    <i className="ki-duotone ki-document fs-2">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                    Download Contract
                </button>
            </div>
        );
    }, [setTitle, setBreadcrumbs, setActions, locale, handleDownloadPDF]);

    // Load html2pdf library
    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
        script.async = true;
        document.body.appendChild(script);

        return () => {
            // Cleanup: remove script when component unmounts
            if (document.body.contains(script)) {
                document.body.removeChild(script);
            }
        };
    }, []);

    useEffect(() => {
        fetchContract();
    }, []);

    const fetchContract = async () => {
        setLoading(true);
        try {
            const response = await getContractTerms();
            console.log('Contract Response:', response);
            
            if (response.success) {
                // Handle nested data structure (response.data.data or response.data)
                const contractData = response.data?.data || response.data;
                console.log('Contract Data:', contractData);
                setContract(contractData);
            } else {
                setError(response.error || 'Failed to fetch contract');
            }
        } catch (err) {
            console.error('Error fetching contract:', err);
            setError('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="post d-flex flex-column-fluid" id="kt_post">
                <div id="kt_content_container" className="container-xxl">
                    <LoadingSpinner />
                </div>
            </div>
        );
    }

    if (error || !contract) {
        return (
            <div className="post d-flex flex-column-fluid" id="kt_post">
                <div id="kt_content_container" className="container-xxl">
                    <div className="alert alert-danger">
                        <strong>Error:</strong> {error || 'Contract not found'}
                    </div>
                </div>
            </div>
        );
    }

    const merchant = contract.merchant;
    const contractTerms = locale === 'en' ? contract.contract_terms_en : contract.contract_terms_ar;

    return (
        <div className="post d-flex flex-column-fluid" id="kt_post">
                <div id="kt_content_container" className="container-xxl">
                    <div className="card-body">
                        <div className="document" id="pdf-content" style={{
                            background: '#fff',
                            padding: '30px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            position: 'relative'
                        }}>
                            {merchant?.payment_status === 'paid' && (
                                <div style={{
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',
                                    transform: 'translate(-50%, -50%) rotate(-30deg)',
                                    fontSize: '72px',
                                    color: 'rgba(76, 175, 80, 0.3)',
                                    fontWeight: 'bold',
                                    pointerEvents: 'none',
                                    textTransform: 'uppercase',
                                    border: '15px solid rgba(76, 175, 80, 0.3)',
                                    padding: '10px 20px',
                                    borderRadius: '10px'
                                }}>
                                    PAID
                                </div>
                            )}

                            {/* Header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '2px solid #eee' }}>
                                <div style={{ width: '25%' }}>
                                    <h2 style={{ margin: 0, textAlign: 'center', color: 'green' }}>Signed</h2>
                                </div>
                                <div style={{ width: '50%', textAlign: 'center' }}>
                                    <h1 style={{ color: '#1a1a1a', fontSize: '24px', margin: '0 0 10px 0' }}>
                                        Merchant Agreement
                                    </h1>
                                    <h2 style={{ color: '#666', fontSize: '18px', margin: 0 }}>
                                        Contract Number: {contract.contract_number}
                                    </h2>
                                </div>
                                <div style={{ width: '25%', textAlign: 'right' }}>
                                    <img src="/logo_light.jpg" alt="System Logo" style={{ maxWidth: '150px' }} />
                                </div>
                            </div>

                            {/* Contract Date */}
                            <div style={{ textAlign: 'right', marginBottom: '2rem', fontSize: '0.9em', color: '#666' }}>
                                Date: {contract.current_date}
                            </div>

                            {/* Merchant Details Table */}
                            <table style={{ width: '100%', marginBottom: '3rem', borderCollapse: 'collapse' }}>
                                <tbody>
                                    <tr>
                                        <th style={{ padding: '10px', border: '1px solid #ddd', fontWeight: 600, backgroundColor: '#E1E3EA', width: '20%' }}>Merchant Name</th>
                                        <td style={{ padding: '10px', border: '1px solid #ddd', width: '30%' }}>{merchant?.name || merchant?.business_name || merchant?.company_name || 'N/A'}</td>
                                        <th style={{ padding: '10px', border: '1px solid #ddd', fontWeight: 600, backgroundColor: '#E1E3EA', width: '20%' }}>Merchant ID</th>
                                        <td style={{ padding: '10px', border: '1px solid #ddd', width: '30%' }}>{merchant?.merchant_code || merchant?.id || 'N/A'}</td>
                                    </tr>
                                    <tr>
                                        <th style={{ padding: '10px', border: '1px solid #ddd', fontWeight: 600, backgroundColor: '#E1E3EA' }}>CR Number</th>
                                        <td style={{ padding: '10px', border: '1px solid #ddd' }}>{merchant?.cr_number || 'N/A'}</td>
                                        <th style={{ padding: '10px', border: '1px solid #ddd', fontWeight: 600, backgroundColor: '#E1E3EA' }}>Trade License</th>
                                        <td style={{ padding: '10px', border: '1px solid #ddd' }}>{merchant?.trade_license_number || 'N/A'}</td>
                                    </tr>
                                    <tr>
                                        <th style={{ padding: '10px', border: '1px solid #ddd', fontWeight: 600, backgroundColor: '#E1E3EA' }}>VAT Number</th>
                                        <td style={{ padding: '10px', border: '1px solid #ddd' }}>{merchant?.tax_number || merchant?.vat_number || 'N/A'}</td>
                                        <th style={{ padding: '10px', border: '1px solid #ddd', fontWeight: 600, backgroundColor: '#E1E3EA' }}>Country</th>
                                        <td style={{ padding: '10px', border: '1px solid #ddd' }}>{merchant?.country?.name || 'N/A'}</td>
                                    </tr>
                                    <tr>
                                        <th style={{ padding: '10px', border: '1px solid #ddd', fontWeight: 600, backgroundColor: '#E1E3EA' }}>City</th>
                                        <td style={{ padding: '10px', border: '1px solid #ddd' }}>{merchant?.city?.name || 'N/A'}</td>
                                        <th style={{ padding: '10px', border: '1px solid #ddd', fontWeight: 600, backgroundColor: '#E1E3EA' }}>Address</th>
                                        <td style={{ padding: '10px', border: '1px solid #ddd' }}>{merchant?.address || 'N/A'}</td>
                                    </tr>
                                    <tr>
                                        <th style={{ padding: '10px', border: '1px solid #ddd', fontWeight: 600, backgroundColor: '#E1E3EA' }}>Phone</th>
                                        <td style={{ padding: '10px', border: '1px solid #ddd' }}>{merchant?.phone || merchant?.business_phone || 'N/A'}</td>
                                        <th style={{ padding: '10px', border: '1px solid #ddd', fontWeight: 600, backgroundColor: '#E1E3EA' }}>Email</th>
                                        <td style={{ padding: '10px', border: '1px solid #ddd' }}>{merchant?.email || 'N/A'}</td>
                                    </tr>
                                </tbody>
                            </table>

                            {/* Contract Terms */}
                            <div style={{ fontSize: '14px', lineHeight: '1.8', marginTop: '3rem', padding: '20px' }}>
                                <div 
                                    dangerouslySetInnerHTML={{ __html: contractTerms || '<p>No contract terms available</p>' }}
                                />
                            </div>

                            {/* Footer */}
                            <div style={{ textAlign: 'center', fontSize: '12px', color: '#666', paddingTop: '20px', borderTop: '1px solid #eee', marginTop: '2rem' }}>
                                <p>Document generated on {contract.current_date}</p>
                                <p>Page 1 of 1</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
    );
};

export default ContractView;


import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useToolbar } from '../../../contexts/ToolbarContext';
import { getSaleReturnById } from '../../../services/adminReturnsService';
import LoadingSpinner from '../../common/LoadingSpinner';
import useAdminMerchantDetails from '../../../hooks/useAdminMerchantDetails';

const AdminReturnView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { setTitle, setActions } = useToolbar();

    const [saleReturn, setSaleReturn] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setTitle('Sale Return Details');
        setActions(
            <button className="btn btn-sm btn-secondary" onClick={() => navigate('/admin/sales/returns')}>
                <i className="ki-duotone ki-arrow-left fs-2"><span className="path1"></span><span className="path2"></span></i>
                Back to List
            </button>
        );
        return () => setActions(null);
    }, [setTitle, setActions, navigate]);

    useEffect(() => {
        fetchReturn();
    }, [id]);

    const fetchReturn = async () => {
        try {
            setLoading(true);
            const response = await getSaleReturnById(id);
            if (response.success) {
                setSaleReturn(response.data);
            }
        } catch (error) {
            console.error('Error fetching sale return:', error);
            toast.error('Failed to load sale return details');
        } finally {
            setLoading(false);
        }
    };

    const merchantId = saleReturn?.shop_id || saleReturn?.sale?.shop_id;
    const {
        data: merchantData,
        isLoading: isMerchantLoading,
        isFetching: isMerchantFetching,
    } = useAdminMerchantDetails(merchantId);

    const merchantLoading = (isMerchantLoading || isMerchantFetching) && !!merchantId;
    const merchant = merchantData ?? null;

    const formatCurrency = (value) => {
        const amount = Number(value || 0);
        const symbol = saleReturn?.currency_object?.symbol || saleReturn?.currency_symbol || '$';
        return `${symbol}${amount.toFixed(2)}`;
    };

    const merchantInfo = useMemo(() => ({
        business: merchant?.business_name || merchant?.general_settings?.business_name || saleReturn?.sale?.shop?.general_settings?.business_name || saleReturn?.shop?.general_settings?.business_name || saleReturn?.sale?.shop?.name || saleReturn?.shop?.name || 'N/A',
        owner: merchant?.owner_name || merchant?.user?.name || saleReturn?.sale?.shop?.user?.name || saleReturn?.shop?.user?.name || 'N/A',
        email: merchant?.email || merchant?.user?.email || saleReturn?.sale?.shop?.user?.email || saleReturn?.shop?.user?.email || saleReturn?.sale?.shop?.email || saleReturn?.shop?.email || 'N/A',
        phone: merchant?.phone || merchant?.user?.phone || saleReturn?.sale?.shop?.user?.phone || saleReturn?.shop?.user?.phone || saleReturn?.sale?.shop?.phone || saleReturn?.shop?.phone || 'N/A',
        address: merchant?.address || merchant?.business_address || saleReturn?.sale?.shop?.general_settings?.address || saleReturn?.shop?.general_settings?.address || 'N/A'
    }), [merchant, saleReturn?.sale?.shop, saleReturn?.shop]);

    if (loading) return <LoadingSpinner />;

    if (!saleReturn) {
        return (
            <div className="card">
                <div className="card-body text-center py-10">
                    <div className="text-muted">Sale return not found</div>
                </div>
            </div>
        );
    }

    const items = Array.isArray(saleReturn.products) ? saleReturn.products : [];

    return (
        <div className="card">
            <div className="card-header border-0 pt-6">
                <div className="card-title">
                    <h2 className="fw-bold">Sale Return Summary</h2>
                </div>
            </div>

            <div className="card-body pt-0">
                <div className="row g-5 g-xl-10">
                    <div className="col-lg-4">
                        <div className="card card-flush shadow-sm">
                            <div className="card-header border-0 pt-5 pb-0">
                                <h3 className="card-title fw-bold">Return Information</h3>
                            </div>
                            <div className="card-body pb-5">
                                <div className="mb-5">
                                    <span className="text-gray-600 fw-bold d-block mb-1">Return Reference</span>
                                    <span className="text-gray-900 fw-bold">{saleReturn.reference_no || 'N/A'}</span>
                                </div>
                                <div className="mb-5">
                                    <span className="text-gray-600 fw-bold d-block mb-1">Sale Reference</span>
                                    <span className="text-gray-900 fw-bold">{saleReturn.sale_reference || saleReturn.sale?.reference_no || 'N/A'}</span>
                                </div>
                                <div className="mb-5">
                                    <span className="text-gray-600 fw-bold d-block mb-1">Created At</span>
                                    <span className="text-gray-900 fw-bold">{new Date(saleReturn.created_at).toLocaleString()}</span>
                                </div>
                                <div className="mb-0">
                                    <span className="text-gray-600 fw-bold d-block mb-1">Grand Total</span>
                                    <span className="badge badge-light-danger fs-6">{formatCurrency(saleReturn.grand_total)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-lg-4">
                        <div className="card card-flush shadow-sm">
                            <div className="card-header border-0 pt-5 pb-0">
                                <h3 className="card-title fw-bold">Customer Details</h3>
                            </div>
                            <div className="card-body pb-5">
                                <div className="mb-5">
                                    <span className="text-gray-600 fw-bold d-block mb-1">Customer</span>
                                    <span className="text-gray-900 fw-bold">{saleReturn.customer?.name || saleReturn.sale?.customer?.name || 'N/A'}</span>
                                </div>
                                {(saleReturn.customer?.email || saleReturn.sale?.customer?.email) && (
                                    <div className="mb-5">
                                        <span className="text-gray-600 fw-bold d-block mb-1">Email</span>
                                        <span className="text-gray-900 fw-bold">{saleReturn.customer?.email || saleReturn.sale?.customer?.email}</span>
                                    </div>
                                )}
                                {(saleReturn.customer?.phone || saleReturn.sale?.customer?.phone) && (
                                    <div className="mb-0">
                                        <span className="text-gray-600 fw-bold d-block mb-1">Phone</span>
                                        <span className="text-gray-900 fw-bold">{saleReturn.customer?.phone || saleReturn.sale?.customer?.phone}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="col-lg-4">
                        <div className="card card-flush shadow-sm">
                            <div className="card-header border-0 pt-5 pb-0">
                                <h3 className="card-title fw-bold">Merchant Details</h3>
                            </div>
                            <div className="card-body pb-5">
                                {merchantLoading ? (
                                    <div className="placeholder-glow">
                                        <span className="placeholder col-12 mb-3"></span>
                                        <span className="placeholder col-10 mb-3"></span>
                                        <span className="placeholder col-8 mb-3"></span>
                                        <span className="placeholder col-6"></span>
                                    </div>
                                ) : (
                                    <>
                                        <div className="mb-5">
                                            <span className="text-gray-600 fw-bold d-block mb-1">Business</span>
                                            <span className="text-gray-900 fw-bold">{merchantInfo.business}</span>
                                        </div>
                                        <div className="mb-5">
                                            <span className="text-gray-600 fw-bold d-block mb-1">Owner</span>
                                            <span className="text-gray-900 fw-bold">{merchantInfo.owner}</span>
                                        </div>
                                        <div className="mb-5">
                                            <span className="text-gray-600 fw-bold d-block mb-1">Email</span>
                                            <span className="text-gray-900 fw-bold">{merchantInfo.email}</span>
                                        </div>
                                        <div className="mb-0">
                                            <span className="text-gray-600 fw-bold d-block mb-1">Phone</span>
                                            <span className="text-gray-900 fw-bold">{merchantInfo.phone}</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card mt-10 shadow-sm">
                    <div className="card-header border-0 pt-5 pb-0">
                        <h3 className="card-title fw-bold">Returned Products</h3>
                    </div>
                    <div className="card-body pt-3">
                        {items.length > 0 ? (
                            <div className="table-responsive">
                                <table className="table table-bordered align-middle">
                                    <thead className="table-light">
                                        <tr>
                                            <th>#</th>
                                            <th>Product</th>
                                            <th>Qty</th>
                                            <th>Unit Price</th>
                                            <th>Discount</th>
                                            <th>Tax</th>
                                            <th>Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.map((item, index) => (
                                            <tr key={item.id || index}>
                                                <td>{index + 1}</td>
                                                <td>{item.product?.product_name || item.product?.name || 'N/A'}</td>
                                                <td>{item.qty || 0}</td>
                                                <td>{formatCurrency(item.net_unit_price)}</td>
                                                <td>{formatCurrency(item.discount)}</td>
                                                <td>{formatCurrency(item.tax)}</td>
                                                <td>{formatCurrency(item.total)}</td>
                                            </tr>
                                        ))}
                                        <tr className="table-light fw-semibold">
                                            <td colSpan={6} className="text-end">Subtotal</td>
                                            <td>{formatCurrency(saleReturn.total_price)}</td>
                                        </tr>
                                        <tr className="table-light fw-semibold">
                                            <td colSpan={6} className="text-end">Discount</td>
                                            <td>{formatCurrency(saleReturn.total_discount)}</td>
                                        </tr>
                                        <tr className="table-light fw-semibold">
                                            <td colSpan={6} className="text-end">Tax</td>
                                            <td>{formatCurrency(saleReturn.total_tax)}</td>
                                        </tr>
                                        <tr className="table-primary fw-bold">
                                            <td colSpan={6} className="text-end text-white">Grand Total</td>
                                            <td className="text-white">{formatCurrency(saleReturn.grand_total)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-5 text-muted">No products found for this return</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminReturnView;


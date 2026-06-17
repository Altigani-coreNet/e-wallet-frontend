import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getPurchase, updatePurchase } from '../../../services/purchasesService';
import PurchaseForm from './PurchaseForm';
import { useToolbar } from '../../../contexts/ToolbarContext';
import LoadingSpinner from '../../common/LoadingSpinner';
import ErrorAlert from '../../common/ErrorAlert';
import { normalizePurchaseStatus } from '../../../utils/purchaseStatus';

const PurchaseEdit = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { setTitle, setBreadcrumbs, setActions } = useToolbar();
    
    const basePath = location.pathname.startsWith('/sales') ? '/sales' : '/merchant';
    
    const [formData, setFormData] = useState({
        date: '',
        supplier_id: '',
        warehouse_id: '',
        reference_no: '',
        products: [],
        shipping: 0,
        discount_total: 0,
        paid_amount: 0,
        payment_method: 'Cash',
        note: '',
        staff_note: '',
        status: 0
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const breadcrumbs = [
            { label: 'Dashboard', path: `${basePath}/dashboard` },
            { label: 'Purchases', path: `${basePath}/purchases` },
            { label: 'Edit Purchase', path: `${basePath}/purchases/${id}/edit`, active: true }
        ];
        
        setTitle('Edit Purchase');
        setBreadcrumbs(breadcrumbs);
        setActions(null);
        
        return () => {
            setTitle('Dashboard');
            setBreadcrumbs([]);
            setActions(null);
        };
    }, [basePath, id]);

    useEffect(() => {
        fetchPurchase();
    }, [id]);

    const fetchPurchase = async () => {
        try {
            const response = await getPurchase(id);

            if (response.success) {
                const purchase = response.data;
                
                // Map products to form format
                const mappedProducts = (purchase.products || []).map(p => ({
                    id: p.id || Date.now(),
                    product_id: p.product_id,
                    product_name: p.product_name,
                    quantity: p.quantity,
                    unit_price: p.unit_price,
                    unit_name: p.unit_name || '',
                    discount: p.discount || 0,
                    tax_rate: p.tax_rate || 0,
                    batch: p.batch || '',
                    expire_date: p.expire_date || '',
                    serial_numbers: p.serial_numbers || [],
                    is_batch: p.is_batch || false,
                    serial_imei_number: p.serial_imei_number || false
                }));

                setFormData({
                    date: purchase.date || purchase.date_formatted || '',
                    supplier_id: purchase.supplier_id || '',
                    warehouse_id: purchase.warehouse_id || '',
                    reference_no: purchase.reference_no || '',
                    products: mappedProducts,
                    shipping: purchase.shipping || 0,
                    discount_total: purchase.order_discount || purchase.discount_total || 0,
                    paid_amount: purchase.paid_amount || 0,
                    payment_method: purchase.payment_method || 'Cash',
                    account_id: purchase.account_id || '',
                    note: purchase.note || '',
                    staff_note: purchase.staff_note || '',
                    status: normalizePurchaseStatus(purchase.status)
                });
            } else {
                setError(response.error || 'Failed to fetch purchase');
            }
        } catch (err) {
            console.error('Error fetching purchase:', err);
            setError('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (data) => {
        setIsSubmitting(true);
        setErrors({});

        try {
            // Calculate subtotal from products
            let subtotal = 0;
            data.products.forEach(product => {
                const base = product.quantity * product.unit_price;
                const tax = (base * (product.tax_rate || 0)) / 100;
                subtotal += base + tax - (product.discount || 0);
            });

            const grand_total = subtotal + parseFloat(data.shipping || 0) - parseFloat(data.discount_total || 0);

            // Format products with calculated totals (MATCH PurchaseRepository format)
            const formattedProducts = data.products.map(p => {
                const qty = parseFloat(p.quantity) || 1;
                const price = parseFloat(p.unit_price) || 0;
                const disc = parseFloat(p.discount) || 0;
                const taxRate = parseFloat(p.tax_rate) || 0;
                
                const base = qty * price;
                const tax = (base * taxRate) / 100;
                const rowTotal = base + tax - disc;
                
                return {
                    id: p.product_id || p.id,  // Service expects 'id'
                    product_id: p.product_id || p.id,
                    quantity: qty,
                    unit_id: p.unit_id || null,  // Required by service
                    unit_price: price,
                    discount: disc,
                    tax_rate: taxRate,
                    tax: tax,  // Calculated tax amount
                    total: rowTotal,  // Row total
                    batch: p.batch || null,
                    expire_date: p.expire_date || null,
                    serial_or_imei_numbers: p.serial_numbers || []
                };
            });

            const purchaseData = {
                date: data.date,
                supplier_id: data.supplier_id,
                warehouse_id: data.warehouse_id,
                reference_no: data.reference_no,
                payment_method: data.payment_method,
                account_id: data.account_id,
                shipping: parseFloat(data.shipping || 0),
                shipment_cost: parseFloat(data.shipping || 0),
                discount_total: parseFloat(data.discount_total || 0),
                subtotal: subtotal,
                grand_total: grand_total,
                paid_amount: parseFloat(data.paid_amount || 0),
                note: data.note,
                staff_note: data.staff_note,
                status: normalizePurchaseStatus(data.status),
                products: formattedProducts
            };

            const response = await updatePurchase(id, purchaseData);

            if (response.success) {
                toast.success(response.message || 'Purchase updated successfully');
                navigate(`${basePath}/purchases`);
            } else {
                if (response.errors) {
                    setErrors(response.errors);
                }
                toast.error(response.error || 'Failed to update purchase');
            }
        } catch (error) {
            console.error('Error updating purchase:', error);
            toast.error('An unexpected error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="post d-flex flex-column-fluid" id="kt_post">
                <div id="kt_content_container" className="container-fluid">
                    <LoadingSpinner />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="post d-flex flex-column-fluid" id="kt_post">
                <div id="kt_content_container" className="container-fluid">
                    <ErrorAlert error={error} onClose={() => navigate(`${basePath}/purchases`)} />
                </div>
            </div>
        );
    }

    return (
        <div className="post d-flex flex-column-fluid" id="kt_post">
            <div id="kt_content_container" className="container-fluid">
                <PurchaseForm
                    formData={formData}
                    onChange={setFormData}
                    errors={errors}
                    onSubmit={handleSubmit}
                    isSubmitting={isSubmitting}
                    isEdit={true}
                />
            </div>
        </div>
    );
};

export default PurchaseEdit;


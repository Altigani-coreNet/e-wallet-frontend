import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { createPurchase } from '../../../services/purchasesService';
import PurchaseForm from './PurchaseForm';
import { useToolbar } from '../../../contexts/ToolbarContext';

const PurchaseCreate = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { setTitle, setBreadcrumbs, setActions } = useToolbar();
    
    const basePath = location.pathname.startsWith('/sales') ? '/sales' : '/merchant';
    
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        supplier_id: '',
        warehouse_id: '',
        reference_no: '',
        products: [],
        shipping: '',  // Empty string allows deletion
        discount_total: '',  // Empty string allows deletion
        paid_amount: '',  // Empty string allows deletion
        payment_method: 'Cash',
        account_id: '',
        note: '',
        staff_note: '',
        status: 'received'
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const breadcrumbs = [
            { label: 'Dashboard', path: `${basePath}/dashboard` },
            { label: 'Purchases', path: `${basePath}/purchases` },
            { label: 'Create Purchase', path: `${basePath}/purchases/create`, active: true }
        ];
        
        setTitle('Create Purchase');
        setBreadcrumbs(breadcrumbs);
        setActions(null);
        
        return () => {
            setTitle('Dashboard');
            setBreadcrumbs([]);
            setActions(null);
        };
    }, [basePath]);

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
                status: data.status || 'received',
                products: formattedProducts
            };

            const response = await createPurchase(purchaseData);

            if (response.success) {
                toast.success(response.message || 'Purchase created successfully');
                navigate(`${basePath}/purchases`);
            } else {
                if (response.errors) {
                    setErrors(response.errors);
                }
                toast.error(response.error || 'Failed to create purchase');
            }
        } catch (error) {
            console.error('Error creating purchase:', error);
            toast.error('An unexpected error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="post d-flex flex-column-fluid" id="kt_post">
            <div id="kt_content_container" className="container-fluid">
                <PurchaseForm
                    formData={formData}
                    onChange={setFormData}
                    errors={errors}
                    onSubmit={handleSubmit}
                    isSubmitting={isSubmitting}
                    isEdit={false}
                />
            </div>
        </div>
    );
};

export default PurchaseCreate;


import React, { useState } from 'react';
import usePosStore from '../../../stores/usePosStore';
import useAuthStore from '../../../stores/authStore';
import api from '../../../utils/api';
import { apiPost } from '../../../utils/apiUtils';
import { POS_API_BASE, SOFTPOS_API_BASE, FRONTEND_BASE_URL } from '../../../utils/constants';
import CustomerSearch from './CustomerSearch';
import CouponModal from './CouponModal';
import SplitPaymentModal from './SplitPaymentModal';
import PaymentMethodModal from './PaymentMethodModal';
import CustomerInfoModal from './CustomerInfoModal';
import SplitPaymentFlowModal from './SplitPaymentFlowModal';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

const CartSection = ({ disabled = false }) => {
    const { 
        cart, 
        clearCart, 
        updateQuantity, 
        removeFromCart,
        getCartSubtotal,
        discount,
        tax,
        cartTotal,
        paymentMethod,
        setPaymentMethod,
        fetchProducts,
        selectedCustomer,
        merchantCurrency,
        loadMerchantCurrency,
        applyDiscount,
        setAppliedCoupon,
        appliedCoupon,
        clearAppliedCoupon,
        splitPayments,
        setSplitPayments,
        clearSplitPayments
    } = usePosStore();

    const [showCouponModal, setShowCouponModal] = useState(false);
    const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);
    const [showSplitPaymentModal, setShowSplitPaymentModal] = useState(false);
    const [showCustomerInfoModal, setShowCustomerInfoModal] = useState(false);
    const [isDraftPaymentLink, setIsDraftPaymentLink] = useState(false);
    const [splitFlowVisible, setSplitFlowVisible] = useState(false);
    const [splitFlowQueue, setSplitFlowQueue] = useState([]);
    const [splitFlowIndex, setSplitFlowIndex] = useState(0);
    const [splitFlowSaleId, setSplitFlowSaleId] = useState(null);
    const [splitFlowLoading, setSplitFlowLoading] = useState(false);
    const [splitFlowError, setSplitFlowError] = useState(null);

    // Helper function to truncate text by words
    const truncateWords = (text, maxWords = 3) => {
        if (!text) return '';
        const words = text.trim().split(/\s+/);
        if (words.length <= maxWords) {
            return text;
        }
        return words.slice(0, maxWords).join(' ') + '...';
    };

    const handlePaymentMethodChange = (method) => {
        setPaymentMethod(method);
    };

    const handleCompleteSale = () => {
        if (cart.length === 0) {
            Swal.fire({
                title: 'Cart is Empty',
                text: 'Please add items to cart before checkout',
                icon: 'warning',
                confirmButtonText: 'OK'
            });
            return;
        }

        // If split payment is configured, proceed directly
        // Otherwise, show payment method selection modal
        if (Array.isArray(splitPayments) && splitPayments.length > 0) {
            // Use the first split payment method
            processSaleWithMethod(splitPayments[0].method);
        } else {
            // Show payment method selection modal
            setShowPaymentMethodModal(true);
        }
    };

    const handlePaymentMethodSelect = (selectedMethod) => {
        setShowPaymentMethodModal(false);
        setPaymentMethod(selectedMethod);
        
        // If Payment Link is selected, show customer info modal
        if (selectedMethod === '2') {
            setIsDraftPaymentLink(false); // This is for sale, not draft
            setShowCustomerInfoModal(true);
        } else {
            processSaleWithMethod(selectedMethod);
        }
    };

    const processSaleWithMethod = async (method) => {
        // Show loading
        Swal.fire({
            title: 'Processing...',
            text: 'Please wait while we process your sale',
            icon: 'info',
            allowOutsideClick: false,
            showConfirmButton: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        try {
            let currency = merchantCurrency;

            if (!currency || !currency.id) {
                currency = await loadMerchantCurrency();
            }

            console.log('💰 Merchant Currency from Store (Sale):', currency);
            
            if (!currency || !currency.id) {
                Swal.fire({
                    title: 'Error',
                    html: 'Merchant currency not found.<br/><br/>' +
                          'Please ensure your merchant profile has a currency configured.<br/><br/>' +
                          '<small>If the problem persists, try logging out and logging in again.</small>',
                    icon: 'error',
                    confirmButtonText: 'OK',
                    width: 500
                });
                console.error('❌ Currency Check Failed (Sale):', {
                    currency,
                    hasId: currency?.id,
                    checkFailed: !currency || !currency.id
                });
                return;
            }
            
            console.log('✅ Currency ID to send (Sale):', currency.id);

            // Determine payment method for API (split vs single)
            const hasSplit = Array.isArray(splitPayments) && splitPayments.length > 0;
            let paymentMethodApi;
            
            if (hasSplit) {
                // Split payment - API will auto-detect from split_payments array
                paymentMethodApi = 'Split';
            } else {
                // Map method code to API payment method
                paymentMethodApi = mapPaymentMethodToApi(method);
            }

            // Prepare sale data
            const saleData = {
                payment_method: paymentMethodApi,
                type: 'Sale',
                currency_id: currency.id,
                product_ids: cart.map(item => item.id),
                product_variant_ids: cart.map(item => item.variant_id || null),
                product_serial_numbers: cart.map(item => item.serial_imei_number || null),
                qty: cart.map(item => item.quantity),
                price: cart.map(item => item.price),
                paid_amount: cartTotal,
                discount: discount,
                discount_type: discount > 0 ? 'Fixed' : null,
                shipping_cost: 0,
                tax_id: null,
                coupon_id: appliedCoupon?.id || null,
                customer_id: selectedCustomer?.id || null,
                sale_note: null,
                staff_note: null,
                split_payments: hasSplit ? splitPayments : null,
            };

            // Add payment method specific data
            if (paymentMethodApi === 'Card') {
                // TODO: Get transaction data from card reader
                // For now, show error if card is selected without transaction data
                Swal.fire({
                    title: 'Card Payment',
                    text: 'Card transaction data is required. Please integrate card reader to process card payments.',
                    icon: 'warning',
                    confirmButtonText: 'OK'
                });
                return;
            }

            if (paymentMethodApi === 'PaymentLink') {
                // PaymentLink requires customer info - this should be handled via CustomerInfoModal
                // If we reach here, it means customer info wasn't collected
                Swal.fire({
                    title: 'Payment Link Required',
                    text: 'Customer information is required for payment link. Please select Payment Link from payment method selection.',
                    icon: 'warning',
                    confirmButtonText: 'OK'
                });
                return;
            }

            console.log('🧾 Sale payload:', saleData);

            const response = await apiPost(`${POS_API_BASE}/v1/pos/store`, saleData);

            if (response.success) {
                // Handle response data (support both old and new structure)
                const responseData = response.data?.data || response.data || {};
                
                // Extract sale ID - prioritize numeric ID from sale object over encrypted ID
                // The API returns encrypted ID in 'id' field, but numeric ID in 'sale.id'
                const encryptedId = responseData.id || null;
                const numericSaleId = responseData.sale?.id || null;
                
                // Use numeric ID for API calls (receive payment endpoint needs numeric ID)
                // Fallback to encrypted ID only if numeric ID is not available
                const saleIdForApi = numericSaleId || encryptedId;
                
                const createdSplitPayments = responseData.split_payments || responseData.sale?.split_payments || [];

                // When split payment is enabled, guide user through normal modal flow
                // Always use numeric ID for receive payment API calls
                if (hasSplit) {
                    // Prioritize numeric ID from sale object for receive payment API
                    if (numericSaleId) {
                        console.log('✅ Using numeric sale ID for split payment flow:', numericSaleId);
                        startSplitPaymentFlow(numericSaleId, createdSplitPayments);
                    } else if (saleIdForApi) {
                        console.warn('⚠️ Using fallback sale ID (encrypted) for split payment flow:', saleIdForApi);
                        startSplitPaymentFlow(saleIdForApi, createdSplitPayments);
                    } else {
                        console.error('❌ No sale ID found in response');
                    }
                }
                
                clearCart();
                fetchProducts();
                
                // Show success alert
                Swal.fire({
                    title: 'Sale Created',
                    text: hasSplit
                        ? 'Sale created. Please complete split payments.'
                        : 'Your sale has been processed successfully.',
                    icon: 'success',
                    showCancelButton: !hasSplit,
                    confirmButtonText: hasSplit ? 'OK' : 'Done',
                    cancelButtonText: 'Print Invoice',
                    confirmButtonColor: '#3085d6',
                    cancelButtonColor: '#28a745',
                    reverseButtons: true,
                    allowOutsideClick: false
                }).then((result) => {
                    if (!hasSplit && result.dismiss === Swal.DismissReason.cancel) {
                        // Use encrypted ID for invoice URL (if available), otherwise use numeric ID
                        const invoiceId = encryptedId || numericSaleId;
                        if (invoiceId) {
                            // Prefer invoice_pdf_url from response, otherwise build URL
                            const invoiceUrl = responseData.invoice_pdf_url || `/sales/invoice/${invoiceId}`;
                            window.location.href = invoiceUrl;
                        }
                    }
                });
            } else {
                // Show error alert
                Swal.fire({
                    title: 'Sale Failed',
                    text: response.error || response.data?.message || 'Failed to process sale',
                    icon: 'error',
                    confirmButtonText: 'OK'
                });
            }
        } catch (error) {
            console.error('Sale creation error:', error);
            // Show error alert
            Swal.fire({
                title: 'Error',
                text: 'Failed to create sale. Please try again.',
                icon: 'error',
                confirmButtonText: 'OK'
            });
        }
    };

    const startSplitPaymentFlow = (saleId, createdSplits = []) => {
        const queueSource = Array.isArray(createdSplits) && createdSplits.length > 0
            ? createdSplits
            : splitPayments || [];

        const queue = queueSource
            .map((p, idx) => ({
                id: p.id || p.split_payment_id || null,
                amount: Number(p.amount),
                method:
                    p.payment_method ||
                    p.label ||
                    getPaymentMethodLabel(p.method),
                order: idx + 1
            }))
            .filter((p) => !isNaN(p.amount) && p.amount > 0);

        if (queue.length === 0) return;

        // Ensure we're using numeric sale ID for receive payment API
        // saleId should be numeric (from sale.id), not encrypted
        console.log('🔢 Starting split payment flow with sale ID:', saleId, 'Type:', typeof saleId);
        
        setSplitFlowSaleId(saleId);
        setSplitFlowQueue(queue);
        setSplitFlowIndex(0);
        setSplitFlowError(null);
        setSplitFlowVisible(true);
    };

    const handleSplitFlowProceed = async () => {
        const current = splitFlowQueue[splitFlowIndex];
        if (!current || !splitFlowSaleId) return;

        setSplitFlowLoading(true);
        setSplitFlowError(null);

        try {
            // Map payment method label to API format
            const paymentMethodApi = mapPaymentMethodLabelToApi(current.method);
            
            // Prepare receive payment data
            const receivePaymentData = {
                amount: current.amount,
                payment_method: paymentMethodApi,
                split_payment_id: current.id
            };

            // Add transaction data for Card payments
            if (paymentMethodApi === 'Card') {
                // TODO: Get transaction data from card reader
                // For now, show error
                setSplitFlowError('Card transaction data is required. Please integrate card reader.');
                setSplitFlowLoading(false);
                return;
            }

            // Add customer info for PaymentLink
            if (paymentMethodApi === 'PaymentLink') {
                // TODO: Get customer info or use existing customer
                setSplitFlowError('Customer information is required for Payment Link.');
                setSplitFlowLoading(false);
                return;
            }

            // Ensure we're using numeric sale ID (not encrypted) for receive payment API
            // The API endpoint expects numeric ID: /v2/sales/{id}/receive-payment
            const numericSaleId = typeof splitFlowSaleId === 'number' 
                ? splitFlowSaleId 
                : (typeof splitFlowSaleId === 'string' && !isNaN(parseInt(splitFlowSaleId)) 
                    ? parseInt(splitFlowSaleId) 
                    : splitFlowSaleId);
            
            console.log('💳 Receiving payment for sale ID:', numericSaleId, 'Type:', typeof numericSaleId);
            
            const response = await apiPost(`${POS_API_BASE}/v2/sales/${numericSaleId}/receive-payment`, receivePaymentData);

            if (response.success) {
                const nextIndex = splitFlowIndex + 1;
                if (nextIndex >= splitFlowQueue.length) {
                    // All split payments completed!
                    setSplitFlowVisible(false);
                    
                    // Show success alert with Done and Print Invoice buttons
                    Swal.fire({
                        title: 'All Payments Completed!',
                        html: `
                            <div class="text-center">
                                <i class="ki-duotone ki-check-circle text-success" style="font-size: 4rem;">
                                    <span class="path1"></span>
                                    <span class="path2"></span>
                                </i>
                                <p class="mt-3 fs-5">All split payments have been received successfully!</p>
                                <p class="text-muted">The sale is now fully paid.</p>
                            </div>
                        `,
                        icon: 'success',
                        showCancelButton: true,
                        confirmButtonText: 'Done',
                        cancelButtonText: 'Print Invoice',
                        confirmButtonColor: '#3085d6',
                        cancelButtonColor: '#28a745',
                        reverseButtons: true,
                        allowOutsideClick: false
                    }).then((result) => {
                        if (result.dismiss === Swal.DismissReason.cancel) {
                            // Print Invoice - construct invoice URL with numeric sale ID
                            const baseUrl = window.location.origin;
                            const invoiceUrl = `${baseUrl}/sales/invoice/${splitFlowSaleId}`;
                            window.open(invoiceUrl, '_blank');
                        }
                    });
                } else {
                    setSplitFlowIndex(nextIndex);
                }
            } else {
                setSplitFlowError(response.error || 'Failed to receive payment');
            }
        } catch (err) {
            const message =
                err?.response?.data?.message ||
                err?.response?.data?.error ||
                err?.message ||
                'Failed to receive payment';
            setSplitFlowError(message);
        } finally {
            setSplitFlowLoading(false);
        }
    };

    const handleDraftSale = async () => {
        if (cart.length === 0) {
            Swal.fire({
                title: 'Cart is Empty',
                text: 'Please add items to cart before creating draft',
                icon: 'warning',
                confirmButtonText: 'OK'
            });
            return;
        }

        // Check if Payment Link is selected
        if (paymentMethod === '2') {
            // Show customer info modal for payment link draft
            setIsDraftPaymentLink(true);
            setShowCustomerInfoModal(true);
            return;
        }

        // For other payment methods, proceed with normal draft creation
        await processDraftSale();
    };

    const processDraftSale = async () => {
        // Show loading
        Swal.fire({
            title: 'Creating Draft...',
            text: 'Please wait',
            icon: 'info',
            allowOutsideClick: false,
            showConfirmButton: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        try {
            let currency = merchantCurrency;

            if (!currency || !currency.id) {
                currency = await loadMerchantCurrency();
            }

            console.log('💰 Merchant Currency from Store (Draft):', currency);
            
            if (!currency || !currency.id) {
                Swal.fire({
                    title: 'Error',
                    html: 'Merchant currency not found.<br/><br/>' +
                          'Please ensure your merchant profile has a currency configured.<br/><br/>' +
                          '<small>If the problem persists, try logging out and logging in again.</small>',
                    icon: 'error',
                    confirmButtonText: 'OK',
                    width: 500
                });
                console.error('❌ Currency Check Failed (Draft):', {
                    currency,
                    hasId: currency?.id,
                    checkFailed: !currency || !currency.id
                });
                return;
            }
            
            console.log('✅ Currency ID to send (Draft):', currency.id);

            // For drafts we always treat payment as Cash (no card / link / split)
            const hasSplit = false;
            const paymentMethodApi = 'Cash';

            // Build basic sale/draft payload
            const draftData = {
                payment_method: paymentMethodApi,
                type: 'Draft',
                currency_id: currency.id,
                product_ids: cart.map(item => item.id),
                product_variant_ids: cart.map(item => item.variant_id || null),
                product_serial_numbers: cart.map(item => item.serial_imei_number || null),
                qty: cart.map(item => item.quantity),
                price: cart.map(item => item.price),
                paid_amount: cartTotal,
                discount: discount,
                discount_type: discount > 0 ? 'Fixed' : null,
                shipping_cost: 0,
                tax_id: null,
                coupon_id: appliedCoupon?.id || null,
                customer_id: selectedCustomer?.id || null,
                sale_note: null,
                staff_note: null,
                // For draft-as-cash we do not send split payments
                split_payments: null,
            };

            // New API requires a transaction object even for drafts.
            // For now we send a minimal synthetic transaction so validation passes.
            try {
                const merchant = useAuthStore.getState().merchant;
                const merchantId = merchant?.id || merchant?.uuid || null;

                draftData.transaction = {
                    transactionDetails: {
                        amount: Number(cartTotal || 0),
                        currency: currency.currency_code || currency.symbol || 'USD',
                        transactionId: `DRAFT-${Date.now()}`,
                        timestamp: new Date().toISOString(),
                        transactionType: 'Draft',
                    },
                    paymentMethod: {
                        entryMode: 'MANUAL',
                        panToken: 'DRAFT',
                    },
                    merchantDetails: {
                        merchantId: merchantId || 'UNKNOWN_MERCHANT',
                        terminalId: 'WEB-POS',
                    },
                };
            } catch (txError) {
                console.warn('⚠️ Failed to attach synthetic transaction to draft:', txError);
            }

            // Add payment method specific data for PaymentLink
            if (paymentMethodApi === 'PaymentLink') {
                // PaymentLink requires customer info - this should be handled via CustomerInfoModal
                // If we reach here, it means customer info wasn't collected
                Swal.fire({
                    title: 'Payment Link Required',
                    text: 'Customer information is required for payment link draft. Please select Payment Link from payment method selection.',
                    icon: 'warning',
                    confirmButtonText: 'OK'
                });
                return;
            }

            console.log('📝 Draft payload:', draftData);

            const response = await apiPost(`${POS_API_BASE}/v1/pos/store`, draftData);

            if (response.success) {
                clearCart();
                fetchProducts();
                
                Swal.fire({
                    title: 'Draft Created Successfully!',
                    text: 'Your draft has been saved.',
                    icon: 'success',
                    confirmButtonText: 'OK'
                });
            } else {
                Swal.fire({
                    title: 'Draft Failed',
                    text: response.error || 'Draft creation failed',
                    icon: 'error',
                    confirmButtonText: 'OK'
                });
            }
        } catch (error) {
            console.error('Draft creation error:', error);
            Swal.fire({
                title: 'Error',
                text: 'Failed to create draft. Please try again.',
                icon: 'error',
                confirmButtonText: 'OK'
            });
        }
    };

    const handleApplyCoupon = () => {
        if (cart.length === 0) {
            Swal.fire({
                title: 'Cart is Empty',
                text: 'Please add items to cart before applying a coupon',
                icon: 'warning',
                confirmButtonText: 'OK'
            });
            return;
        }

        setShowCouponModal(true);
    };

    const handleCouponApplied = (couponData) => {
        // Apply discount to cart
        applyDiscount(couponData.discount);
        
        // Store coupon info for sale creation
        setAppliedCoupon(couponData);
        
        setShowCouponModal(false);
    };

    const handleSplitPayment = () => {
        if (cart.length === 0) {
            Swal.fire({
                title: 'Cart is Empty',
                text: 'Please add items to cart before splitting payment',
                icon: 'warning',
                confirmButtonText: 'OK'
            });
            return;
        }

        setShowSplitPaymentModal(true);
    };

    const handleSplitConfirm = (payments) => {
        setSplitPayments(payments);

        Swal.fire({
            title: 'Split Payment Saved',
            text: 'Payment has been split successfully.',
            icon: 'success',
            confirmButtonText: 'OK',
            timer: 1500,
        });
    };

    const handleQuantityChange = (itemId, newQuantity) => {
        if (newQuantity <= 0) {
            removeFromCart(itemId);
        } else {
            updateQuantity(itemId, newQuantity);
        }
    };

    const getPaymentMethodLabel = (method) => {
        switch (method) {
            case '0': return 'Cash';
            case '1': return 'Card';
            case '2': return 'Payment Link';
            case '3': return 'QR';
            default: return 'Card';
        }
    };

    // Map payment method code to API format
    const mapPaymentMethodToApi = (method) => {
        switch (method) {
            case '0': return 'Cash';
            case '1': return 'Card';
            case '2': return 'PaymentLink';
            case '3': return 'QR';
            default: return 'Cash';
        }
    };

    // Map payment method label to API format
    const mapPaymentMethodLabelToApi = (label) => {
        const normalizedLabel = (label || '').toLowerCase().trim();
        if (normalizedLabel === 'cash') return 'Cash';
        if (normalizedLabel === 'card') return 'Card';
        if (normalizedLabel === 'payment link' || normalizedLabel === 'paymentlink') return 'PaymentLink';
        if (normalizedLabel === 'qr') return 'QR';
        // Fallback: try to parse as method code
        return mapPaymentMethodToApi(label);
    };

    const handleCustomerInfoConfirm = async (customerInfo, isDraft = false) => {
        // Show loading
        Swal.fire({
            title: isDraft ? 'Creating Draft with Payment Link...' : 'Creating Payment Link...',
            text: 'Please wait while we create the payment link',
            icon: 'info',
            allowOutsideClick: false,
            showConfirmButton: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        try {
            let currency = merchantCurrency;

            if (!currency || !currency.id) {
                currency = await loadMerchantCurrency();
            }

            if (!currency || !currency.id) {
                Swal.fire({
                    title: 'Error',
                    html: 'Merchant currency not found.<br/><br/>' +
                          'Please ensure your merchant profile has a currency configured.',
                    icon: 'error',
                    confirmButtonText: 'OK',
                    width: 500
                });
                return;
            }

            // Get merchant ID from auth store
            const merchant = useAuthStore.getState().merchant;
            const merchantId = merchant?.id || merchant?.uuid || null;

            if (!merchantId) {
                Swal.fire({
                    title: 'Error',
                    text: 'Merchant ID not found. Please try logging out and logging in again.',
                    icon: 'error',
                    confirmButtonText: 'OK'
                });
                return;
            }

            // Prepare payment link data using unified endpoint
            const paymentLinkData = {
                payment_method: 'PaymentLink',
                type: isDraft ? 'Draft' : 'Sale',
                currency_id: currency.id,
                merchant_id: merchantId,
                customer_name: customerInfo.name,
                customer_email: customerInfo.email,
                customer_phone: customerInfo.phone,
                product_ids: cart.map(item => item.id),
                product_variant_ids: cart.map(item => item.variant_id || null),
                product_serial_numbers: cart.map(item => item.serial_imei_number || null),
                qty: cart.map(item => item.quantity),
                price: cart.map(item => item.price),
                paid_amount: cartTotal,
                discount: discount,
                discount_type: discount > 0 ? 'Fixed' : null,
                shipping_cost: 0,
                tax_id: null,
                customer_id: selectedCustomer?.id || null,
                coupon_id: appliedCoupon?.id || null,
                sale_note: null,
                staff_note: null,
            };

            console.log('🔗 Payment Link payload:', paymentLinkData);

            const response = await apiPost(`${POS_API_BASE}/v1/pos/store`, paymentLinkData);

            if (response.success) {
                // Normalize payment link fields (support nested data)
                const resp = response.data || {};
                const payload = resp.data || resp; // handle {data:{...}} or flat

                // Extract payment link info from new API structure
                const paymentLinkInfo = payload.payment_link || {};
                
                const {
                    sale_id,
                    payment_link_url,
                    payment_link_id,
                    payment_link_uuid,
                    public_link,
                    link,
                    url,
                } = {
                    ...payload,
                    ...paymentLinkInfo
                };

                // Prefer public_link from API, then build front-end UUID link, then other url fields
                const uuidLink = payment_link_uuid
                    ? `${FRONTEND_BASE_URL}/payments/${payment_link_uuid}`
                    : null;
                const normalizedLink = public_link || payment_link_url || uuidLink || link || url || '';

                clearCart();
                fetchProducts();
                setShowCustomerInfoModal(false);

                // Show success with payment link
                const title = isDraft ? 'Draft with Payment Link Created!' : 'Payment Link Created!';
                const message = isDraft 
                    ? 'Your draft has been saved with a payment link. The customer can pay later using this link.'
                    : 'Your payment link has been created successfully.';

                Swal.fire({
                    title: title,
                    html: `
                        <div class="text-start">
                            <p class="mb-3">${message}</p>
                            <div class="mb-3">
                                <label class="fw-bold">Payment Link:</label>
                                <div class="d-flex flex-column gap-2">
                                    <a href="${normalizedLink}" target="_blank" rel="noopener" class="fw-bold text-primary" style="word-break: break-all;">
                                        ${normalizedLink}
                                    </a>
                                    <button class="btn btn-light-primary btn-sm" onclick="navigator.clipboard.writeText('${normalizedLink}')">
                                        Copy Link
                                    </button>
                                </div>
                            </div>
                            <small class="text-muted">Share this link with the customer to complete payment</small>
                        </div>
                    `,
                    icon: 'success',
                    showCancelButton: true,
                    confirmButtonText: 'Open Link',
                    cancelButtonText: 'Done',
                    confirmButtonColor: '#3085d6',
                    cancelButtonColor: '#6c757d',
                    reverseButtons: true,
                    allowOutsideClick: false
                }).then((result) => {
                    if (result.isConfirmed && normalizedLink) {
                        window.open(normalizedLink, '_blank');
                    }
                });
            } else {
                Swal.fire({
                    title: isDraft ? 'Draft Failed' : 'Payment Link Failed',
                    text: response.error || (isDraft ? 'Failed to create draft with payment link' : 'Failed to create payment link'),
                    icon: 'error',
                    confirmButtonText: 'OK'
                });
            }
        } catch (error) {
            console.error('Payment link creation error:', error);
            Swal.fire({
                title: 'Error',
                text: 'Failed to create payment link. Please try again.',
                icon: 'error',
                confirmButtonText: 'OK'
            });
        }
    };

    return (
        <div className="flex-row-auto w-100">
            {/*begin::Pos order*/}
            <div className="card card-flush bg-body" id="kt_pos_form">
                {/*begin::Header*/}
                <div className="card-header pt-3">
                    <h3 className="card-title fw-bold text-gray-800 fs-1">Current Order</h3>
                    <div className="card-toolbar">
                        <button 
                            onClick={clearCart}
                            className="btn btn-light-primary btn-sm fs-6 fw-bold py-1"
                            disabled={cart.length === 0 || disabled}
                        >
                            Clear All
                        </button>
                    </div>
                </div>
                {/*end::Header*/}
                
                {/*begin::Body*/}
                <div className="card-body pt-0">
                    <CustomerSearch disabled={disabled} />

                    {/*begin::Table container*/}
                    <div className="table-responsive mb-5">
                        <table className="table align-middle gs-0 gy-2 my-0">
                            <thead>
                                <tr>
                                    <th className="w-175px">Product</th>
                                    <th className="w-125px">Quantity</th>
                                    <th className="w-60px">Price</th>
                                    <th className="w-40px"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {cart.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="text-center text-muted py-5">
                                            <i className="ki-duotone ki-basket fs-1 text-muted mb-2">
                                                <span className="path1"></span>
                                                <span className="path2"></span>
                                                <span className="path3"></span>
                                                <span className="path4"></span>
                                            </i>
                                            <div className="fs-6">Your cart is empty</div>
                                            <div className="fs-8">Add some products to get started</div>
                                        </td>
                                    </tr>
                                ) : (
                                    cart.map((item) => (
                                        <tr key={item.id}>
                                            <td className="pe-0">
                                                <div className="d-flex align-items-center">
                                                    <img 
                                                        src={item.thumbnail || item.image || "assets/media/stock/food/img-2.jpg"} 
                                                        className="w-40px h-40px rounded-3 me-2" 
                                                        alt={item.name}
                                                        onError={(e) => {
                                                            e.target.src = "assets/media/stock/food/img-2.jpg";
                                                        }}
                                                    />
                                                    <div className="d-flex flex-column">
                                                        <span className="fw-bold text-gray-800 cursor-pointer text-hover-primary fs-7 me-1" title={item.name}>
                                                            {truncateWords(item.name, 3)}
                                                        </span>
                                                        {item.code && (
                                                            <small className="text-muted" style={{fontSize: '0.7rem'}}>SKU: {item.code}</small>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="pe-0">
                                                <div className="position-relative d-flex align-items-center">
                                                    <button 
                                                        type="button" 
                                                        className="btn btn-icon btn-sm btn-light btn-icon-gray-500" 
                                                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                                                    >
                                                        <i className="ki-duotone ki-minus fs-2x"></i>
                                                    </button>
                                                    
                                                    <input 
                                                        type="text" 
                                                        className="form-control border-0 text-center px-0 fs-5 fw-bold text-gray-800 w-30px" 
                                                        value={item.quantity}
                                                        readOnly
                                                    />
                                                    
                                                    <button 
                                                        type="button" 
                                                        className="btn btn-icon btn-sm btn-light btn-icon-gray-500" 
                                                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                                                    >
                                                        <i className="ki-duotone ki-plus fs-2x"></i>
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="text-end">
                                                <div className="d-flex flex-column">
                                                    <span className="fw-bold text-primary fs-4">
                                                        ${(item.price * item.quantity).toFixed(2)}
                                                    </span>
                                                    {item.tax > 0 && (
                                                        <small className="text-muted" style={{fontSize: '0.7rem'}}>
                                                            +${(item.tax * item.quantity).toFixed(2)} tax
                                                        </small>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="text-end">
                                                <button 
                                                    type="button" 
                                                    className="btn btn-icon btn-sm btn-light-danger" 
                                                    onClick={() => removeFromCart(item.id)}
                                                >
                                                    <i className="ki-duotone ki-trash fs-4">
                                                        <span className="path1"></span>
                                                        <span className="path2"></span>
                                                        <span className="path3"></span>
                                                        <span className="path4"></span>
                                                        <span className="path5"></span>
                                                    </i>
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    {/*end::Table container*/}
                    
                    {/*begin::Summary*/}
                    <div className="d-flex flex-stack align-items-center bg-success rounded-3 p-4 mb-6">
                        <div className="fs-7 fw-bold text-white">
                            <span className="d-block lh-1 mb-1">Subtotal</span>
                            <span className="d-block mb-1">Discounts</span>
                            <span className="d-block mb-5">Tax</span>
                            <span className="d-block fs-1 lh-1">Total</span>
                        </div>
                        
                        <div className="fs-7 fw-bold text-white text-end">
                            <span className="d-block lh-1 mb-1">
                                ${getCartSubtotal().toFixed(2)}
                            </span>
                            <span className="d-block mb-1">
                                -${discount.toFixed(2)}
                            </span>
                            {appliedCoupon && discount > 0 && (
                                <span
                                    className="d-block mb-1 text-white-75"
                                    style={{ fontSize: '0.75rem' }}
                                >
                                    Coupon
                                    {appliedCoupon.coupon?.name && ` (${appliedCoupon.coupon.name}`}{appliedCoupon.code && !appliedCoupon.coupon?.name && ` (${appliedCoupon.code}`}{(appliedCoupon.coupon?.name || appliedCoupon.code) && ')'}
                                    : -${discount.toFixed(2)}
                                </span>
                            )}
                            <span className="d-block mb-5">
                                ${tax?.toFixed(2)}
                            </span>
                            <span className="d-block fs-1 lh-1">
                                ${cartTotal?.toFixed(2)}
                            </span>

                            {Array.isArray(splitPayments) && splitPayments.length > 0 && (
                                <div className="mt-2 text-white-75" style={{ fontSize: '0.75rem' }}>
                                    {splitPayments.map((p, idx) => (
                                        <div key={idx}>
                                            {p.label || (p.method === '0' ? 'Cash' : p.method === '1' ? 'Card' : p.method)}:{' '}
                                            ${Number(p.amount).toFixed(2)}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    {/*end::Summary*/}
                    
                    {/*begin::Actions*/}
                    {/* Utility actions row */}
                    <div className="d-flex gap-2 mt-2">
                        {appliedCoupon ? (
                            <button 
                                className="btn btn-light-success fs-7 flex-grow-1 py-2"
                                disabled={disabled}
                                onClick={() => {
                                    clearAppliedCoupon();
                                    Swal.fire({
                                        title: 'Coupon Removed',
                                        text: 'Coupon has been removed from your cart.',
                                        icon: 'success',
                                        confirmButtonText: 'OK',
                                        timer: 1500
                                    });
                                }}
                            >
                                <i className="ki-duotone ki-check-circle fs-3 me-2">
                                    <span className="path1"></span>
                                    <span className="path2"></span>
                                </i>
                                <span className="fw-semibold">Remove Coupon</span>
                            </button>
                        ) : (
                            <button 
                                className="btn btn-light-info fs-7 flex-grow-1 py-2"
                                disabled={cart.length === 0 || disabled}
                                onClick={handleApplyCoupon}
                            >
                                <i className="ki-duotone ki-discount fs-3 me-2">
                                    <span className="path1"></span>
                                    <span className="path2"></span>
                                </i>
                                <span className="fw-semibold">Apply Coupon</span>
                            </button>
                        )}

                        <button 
                            className="btn btn-light-primary fs-7 flex-grow-1 py-2"
                            disabled={cart.length === 0 || disabled}
                            onClick={handleDraftSale}
                        >
                            <i className="ki-duotone ki-file fs-3 me-2">
                                <span className="path1"></span>
                                <span className="path2"></span>
                            </i>
                            <span className="fw-semibold">Draft Sale</span>
                        </button>

                        <button 
                            className="btn btn-light-warning fs-7 flex-grow-1 py-2"
                            disabled={cart.length === 0 || disabled}
                            onClick={handleSplitPayment}
                        >
                            <i className="ki-duotone ki-element-equal fs-3 me-2">
                                <span className="path1"></span>
                                <span className="path2"></span>
                            </i>
                            <span className="fw-semibold">
                                {Array.isArray(splitPayments) && splitPayments.length > 0
                                    ? 'Edit Split Payment'
                                    : 'Split Payment'}
                            </span>
                        </button>
                    </div>

                    {/* Main sale action (can be replaced by Sale component later) */}
                    <div className="d-flex mt-3">
                        <button 
                            className="btn btn-primary fs-5 flex-grow-1 py-3"
                            disabled={cart.length === 0 || disabled}
                            onClick={handleCompleteSale}
                        >
                            <i className="ki-duotone ki-dollar fs-2x me-2">
                                <span className="path1"></span>
                                <span className="path2"></span>
                            </i>
                            <span className="fw-bold">
                                Proceed Payment
                                {cart.length > 0 && (
                                    <span className="fw-normal ms-2" style={{ fontSize: '0.85rem' }}>
                                        (
                                        {Array.isArray(splitPayments) && splitPayments.length > 0
                                            ? `First: $${Number(splitPayments[0].amount).toFixed(2)}`
                                            : `Full: $${cartTotal?.toFixed(2)}`}
                                        )
                                    </span>
                                )}
                            </span>
                        </button>
                    </div>
                    {/*end::Actions*/}
                </div>
                {/*end: Card Body*/}
            </div>
            {/*end::Pos order*/}

            {/* Coupon Modal */}
            <CouponModal
                isOpen={showCouponModal}
                onClose={() => setShowCouponModal(false)}
                onApply={handleCouponApplied}
                cartSubtotal={getCartSubtotal()}
            />

            {/* Split Payment Modal */}
            <SplitPaymentModal
                isOpen={showSplitPaymentModal}
                onClose={() => setShowSplitPaymentModal(false)}
                cartTotal={cartTotal}
                onConfirm={handleSplitConfirm}
                existingSplits={splitPayments}
            />

            {/* Payment Method Selection Modal */}
            <PaymentMethodModal
                isOpen={showPaymentMethodModal}
                onClose={() => setShowPaymentMethodModal(false)}
                onSelect={handlePaymentMethodSelect}
                cartTotal={cartTotal}
            />

            {/* Customer Info Modal for Payment Link */}
            <CustomerInfoModal
                isOpen={showCustomerInfoModal}
                onClose={() => {
                    setShowCustomerInfoModal(false);
                    setIsDraftPaymentLink(false);
                }}
                onConfirm={(customerInfo) => {
                    handleCustomerInfoConfirm(customerInfo, isDraftPaymentLink);
                    setIsDraftPaymentLink(false);
                }}
                selectedCustomer={selectedCustomer}
                cartTotal={cartTotal}
            />
            <SplitPaymentFlowModal
                visible={splitFlowVisible}
                queue={splitFlowQueue}
                currentIndex={splitFlowIndex}
                loading={splitFlowLoading}
                error={splitFlowError}
                onClose={() => setSplitFlowVisible(false)}
                onProceed={handleSplitFlowProceed}
            />
        </div>
    );
};

export default CartSection;


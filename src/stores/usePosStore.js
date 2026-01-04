import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { apiGet } from '../utils/apiUtils';
import { getMerchant } from '../utils/api';
import useAuthStore from './authStore';
import CategoryModel from '../models/CategoryModel';
import BrandModel from '../models/BrandModel';
import ProductModel from '../models/ProductModel';
import { POS_API_BASE, POS_ENDPOINTS } from '../utils/constants';
import { getMerchantCurrency as fetchMerchantCurrencyApi } from '../services/merchantService';

const usePosStore = create()(
    devtools(
        persist(
            (set, get) => ({
                // Auth State
                token: null,

                // Merchant State
                merchantCurrency: null,
                // Track which merchant the current cart belongs to
                merchantIdForCart: null,

                // Cart State
                cart: [],
                cartTotal: 0,
                tax: 0,
                discount: 0,
                paymentMethod: '1', // Default to Card payment method
                appliedCoupon: null, // Store applied coupon details
                splitPayments: null, // Store split payment breakdown

                // Product State
                products: [],
                selectedProduct: null,
                productsCurrentPage: 1,
                productsHasMore: true,
                productsLoading: false,
                // Cache last products query to avoid refetch loops
                lastProductsQueryKey: null,
                lastProductsEmpty: false,

                // Category State
                categories: [],
                activeCategory: null,
                categoriesCurrentPage: 1,
                categoriesHasMore: true,
                categoriesLoading: false,
                brands: [],
                activeBrand: null,
                brandsCurrentPage: 1,
                brandsHasMore: true,
                brandsLoading: false,

                // Brand State
                brands: [],
                activeBrand: null,
                brandsCurrentPage: 1,
                brandsHasMore: true,
                brandsLoading: false,

                // Customer State
                customers: [],
                selectedCustomer: null,
                customersLoading: false,
                customerGroups: [],
                customerGroupsLoading: false,

                // Sales State
                sales: [],
                currentSale: null,

                // UI State
                isLoading: false,
                searchTerm: '',
                showCustomerModal: false,
                showProductModal: false,
                navigationType: 'categories', // Default to categories
                isFullscreen: false, // Fullscreen state

                // Cart Actions
                addToCart: (product) => {
                    const cart = get().cart;

                    // Use tax value directly from server (already calculated)
                    const taxAmount = product.tax || 0;
                    const taxType = product.tax_type || 'exclusive'; // Default to exclusive if not specified

                    const existingItem = cart.find(item => item.id === product.id);

                    if (existingItem) {
                        // Update existing item quantity
                        set({
                            cart: cart.map(item =>
                                item.id === product.id
                                    ? { 
                                        ...item, 
                                        quantity: item.quantity + 1,
                                        price: product.price, // Update price in case it changed
                                        tax: taxAmount, // Update tax in case it changed
                                        tax_type: taxType // Update tax_type in case it changed
                                      }
                                    : item
                            )
                        });
                    } else {
                        set({
                            cart: [...cart, { ...product, quantity: 1, tax: taxAmount, tax_type: taxType }]
                        });
                    }

                    get().calculateCartTotal();
                },

                removeFromCart: (productId) => {
                    set({
                        cart: get().cart.filter(item => item.id !== productId)
                    });
                    get().calculateCartTotal();
                },

                updateQuantity: (productId, quantity) => {
                    if (quantity <= 0) {
                        get().removeFromCart(productId);
                        return;
                    }

                    set({
                        cart: get().cart.map(item =>
                            item.id === productId
                                ? { ...item, quantity }
                                : item
                        )
                    });
                    get().calculateCartTotal();
                },

                clearCart: () => {
                    set({
                        cart: [],
                        cartTotal: 0,
                        tax: 0,
                        discount: 0,
                        appliedCoupon: null,
                        splitPayments: null,
                        paymentMethod: '1',
                    });
                },

                calculateCartTotal: () => {
                    const cart = get().cart;
                    
                    let subtotal = 0;
                    let tax = 0;
                    
                    cart.forEach(item => {
                        const itemPrice = item.price || 0;
                        const itemTax = item.tax || 0;
                        const itemQuantity = item.quantity || 0;
                        const taxType = item.tax_type || 'exclusive';
                        
                        if (taxType === 'inclusive') {
                            // Tax is included in price
                            // Subtotal = price - tax (to show base price)
                            // Total = price (tax already included)
                            const basePrice = itemPrice - itemTax;
                            subtotal += basePrice * itemQuantity;
                            tax += itemTax * itemQuantity;
                        } else {
                            // Tax is exclusive (added on top)
                            // Subtotal = price
                            // Total = price + tax
                            subtotal += itemPrice * itemQuantity;
                            tax += itemTax * itemQuantity;
                        }
                    });
                    
                    const discount = get().discount;
                    const total = subtotal + tax - discount;

                    set({
                        cartTotal: total,
                        tax
                    });
                },

                applyDiscount: (discountAmount) => {
                    set({ discount: discountAmount });
                    get().calculateCartTotal();
                },

                setAppliedCoupon: (coupon) => {
                    set({ appliedCoupon: coupon });
                },

                clearAppliedCoupon: () => {
                    set({ appliedCoupon: null, discount: 0 });
                    get().calculateCartTotal();
                },

                setSplitPayments: (payments) => {
                    set({ splitPayments: payments || null });
                },

                clearSplitPayments: () => {
                    set({ splitPayments: null });
                },

                setPaymentMethod: (method) => {
                    set({ paymentMethod: method });
                },

                // Merchant Actions
                setMerchantCurrency: (currency) => {
                    set({ merchantCurrency: currency });
                },

                // Get currency from authStore (always sync with the real source)
                getMerchantCurrencyFromAuth: () => {
                    const authMerchant = useAuthStore.getState().merchant;
                    if (!authMerchant) {
                        return null;
                    }
                    
                    // 1. Check if merchant has currency_id (the primary field from merchant object)
                    if (authMerchant.currency_id) {
                        return { id: authMerchant.currency_id, symbol: '$', currency_code: 'USD' };
                    }
                    
                    // 2. Check if merchant has currency object (relationship loaded)
                    if (authMerchant.merchantCurrency || authMerchant.currency_object) {
                        const currencyObj = authMerchant.merchantCurrency || authMerchant.currency_object;
                        return {
                            id: currencyObj?.id || currencyObj?.uuid,
                            symbol: currencyObj?.symbol || '$',
                            currency_code: currencyObj?.currency_code || 'USD',
                            name: currencyObj?.name,
                            country: currencyObj?.country
                        };
                    }
                    
                    // 3. Fallback: Check if merchant has currency field (legacy)
                    if (authMerchant.currency) {
                        return { id: authMerchant.currency, symbol: '$', currency_code: 'USD' };
                    }
                    
                    return null;
                },

                // Sync currency from authStore to posStore
                syncCurrencyFromAuth: () => {
                    const authCurrency = get().getMerchantCurrencyFromAuth();
                    if (authCurrency?.id) {
                        set({ merchantCurrency: authCurrency });
                        console.log('✅ Currency synced from authStore:', authCurrency);
                        return authCurrency;
                    }
                    return null;
                },

                // Ensure cart data is scoped per-merchant (avoid sharing cart across logins)
                ensureMerchantScopedCart: () => {
                    const state = get();
                    const authMerchant = useAuthStore.getState().merchant;
                    const currentMerchantId = authMerchant?.id || authMerchant?.uuid || null;

                    if (!currentMerchantId) {
                        return;
                    }

                    // First time: just bind cart to this merchant
                    if (!state.merchantIdForCart) {
                        set({ merchantIdForCart: currentMerchantId });
                        return;
                    }

                    // If merchant changed, clear cart-related data
                    if (state.merchantIdForCart !== currentMerchantId) {
                        set({
                            merchantIdForCart: currentMerchantId,
                            cart: [],
                            cartTotal: 0,
                            tax: 0,
                            discount: 0,
                            appliedCoupon: null,
                            splitPayments: null,
                            paymentMethod: '1',
                        });
                    }
                },

                loadMerchantCurrency: async () => {
                    // Before doing anything, make sure cart is scoped to the current merchant
                    get().ensureMerchantScopedCart();

                    try {
                        // 1. PRIMARY SOURCE: Get currency from useAuthStore.merchant (the real source)
                        const authCurrency = get().getMerchantCurrencyFromAuth();
                        
                        if (authCurrency?.id) {
                            // Check if we have full currency details (currency object loaded with symbol)
                            const authMerchant = useAuthStore.getState().merchant;
                            const hasFullCurrencyObject = authMerchant?.merchantCurrency || authMerchant?.currency_object;
                            
                            if (hasFullCurrencyObject && authCurrency.symbol && authCurrency.symbol !== '$') {
                                // We have full currency object with symbol, use it directly
                                set({ merchantCurrency: authCurrency });
                                console.log('✅ Loaded merchant currency from authStore merchant (full object):', authCurrency);
                                return authCurrency;
                            }
                            
                            // We only have currency_id, try to fetch full details from API
                            try {
                                const response = await fetchMerchantCurrencyApi();
                                if (response?.success && response.data) {
                                    const currencyData = response.data;
                                    set({ merchantCurrency: currencyData });
                                    console.log('✅ Merchant currency fetched from API (currency_id:', authCurrency.id, '):', currencyData);
                                    return currencyData;
                                }
                            } catch (apiError) {
                                console.warn('⚠️ API fetch failed for currency_id:', authCurrency.id, '- using ID from authStore');
                            }
                            
                            // If API fails, use the currency from authStore (currency_id)
                            set({ merchantCurrency: authCurrency });
                            console.log('✅ Using currency_id from authStore merchant:', authCurrency);
                            return authCurrency;
                        }

                        // 2. Fallback: Try local merchant from localStorage
                        const localMerchant = getMerchant();
                        if (localMerchant?.currency_id) {
                            const currencyData = { id: localMerchant.currency_id, symbol: '$', currency_code: 'USD' };
                            set({ merchantCurrency: currencyData });
                            console.log('✅ Using currency_id from local merchant:', currencyData);
                            return currencyData;
                        }
                        if (localMerchant?.currency) {
                            const currencyData = { id: localMerchant.currency, symbol: '$', currency_code: 'USD' };
                            set({ merchantCurrency: currencyData });
                            console.log('✅ Using currency from local merchant:', currencyData);
                            return currencyData;
                        }

                        // 3. Try cached value in localStorage (as last resort before API)
                        const cachedCurrency = localStorage.getItem('merchant_currency');
                        if (cachedCurrency) {
                            const parsedCurrency = JSON.parse(cachedCurrency);
                            if (parsedCurrency?.id) {
                                set({ merchantCurrency: parsedCurrency });
                                console.log('⚠️ Using cached currency (authStore not available):', parsedCurrency);
                                return parsedCurrency;
                            }
                        }

                        // 4. Fetch from API as last resort
                        const response = await fetchMerchantCurrencyApi();
                        if (response?.success && response.data) {
                            const currencyData = response.data;
                            set({ merchantCurrency: currencyData });
                            localStorage.setItem('merchant_currency', JSON.stringify(currencyData));
                            console.log('✅ Merchant currency fetched from API (no authStore currency):', currencyData);
                            return currencyData;
                        }

                        throw new Error('Merchant currency not found');
                    } catch (error) {
                        console.error('❌ Failed to load merchant currency:', error);

                        // Final fallback to USD
                        const defaultCurrency = { id: 1, symbol: '$', currency_code: 'USD' };
                        set({ merchantCurrency: defaultCurrency });
                        console.log('⚠️ Using default currency:', defaultCurrency);
                        return defaultCurrency;
                    }
                },

                // Product Actions
                setProducts: (products) => set({ products }),
                selectProduct: (product) => set({ selectedProduct: product }),

                appendProducts: (newProducts) => {
                    const currentProducts = get().products;
                    const uniqueProducts = [...currentProducts];

                    // Add only new products (avoid duplicates)
                    newProducts.forEach(newProduct => {
                        if (!uniqueProducts.some(prod => prod.id === newProduct.id)) {
                            uniqueProducts.push(newProduct);
                        }
                    });

                    set({ products: uniqueProducts });
                },

                // Category Actions
                setCategories: (categories) => set({ categories }),
                setActiveCategory: (category) => set({ activeCategory: category }),

                // Brand Actions
                setBrands: (brands) => set({ brands }),
                setActiveBrand: (brand) => set({ activeBrand: brand }),

                appendCategories: (newCategories) => {
                    const currentCategories = get().categories;
                    const uniqueCategories = [...currentCategories];

                    // Add only new categories (avoid duplicates)
                    newCategories.forEach(newCategory => {
                        if (!uniqueCategories.some(cat => cat.id === newCategory.id)) {
                            uniqueCategories.push(newCategory);
                        }
                    });

                    set({ categories: uniqueCategories });
                },

                appendBrands: (newBrands) => {
                    const currentBrands = get().brands;
                    const uniqueBrands = [...currentBrands];

                    // Add only new brands (avoid duplicates)
                    newBrands.forEach(newBrand => {
                        if (!uniqueBrands.some(brand => brand.id === newBrand.id)) {
                            uniqueBrands.push(newBrand);
                        }
                    });

                    set({ brands: uniqueBrands });
                },

                fetchCategories: async (page = 1, append = false) => {
                    set({ categoriesLoading: true });
                    try {
                        const url = `${POS_ENDPOINTS.CATEGORIES}?page=${page}&per_page=10`;
                        console.log('📡 Fetching categories from:', url);
                        const response = await apiGet(url);
                        console.log('📥 Categories response:', response);
                        if (response.success) {
                            // Map API response using CategoryModel
                            const categoriesData = response.data.data?.categories || [];
                            const mappedCategories = CategoryModel.fromApiResponseArray(categoriesData);
                            
                            if (append) {
                                get().appendCategories(mappedCategories);
                            } else {
                                set({ categories: mappedCategories });
                            }

                            // Calculate pagination info
                            const total = response.data.data?.total || 0;
                            const perPage = 10;
                            const hasMore = (page * perPage) < total;

                            // Update pagination info
                            set({
                                categoriesCurrentPage: page,
                                categoriesHasMore: hasMore
                            });
                        } else {
                            console.error('Failed to fetch categories:', response.error);
                        }
                    } catch (error) {
                        console.error('Error fetching categories:', error);
                    } finally {
                        set({ categoriesLoading: false });
                    }
                },

                fetchMoreCategories: async () => {
                    const { categoriesCurrentPage, categoriesHasMore, categoriesLoading } = get();

                    if (!categoriesHasMore || categoriesLoading) {
                        return;
                    }

                    await get().fetchCategories(categoriesCurrentPage + 1, true);
                },

                fetchBrands: async (page = 1, append = false) => {
                    set({ brandsLoading: true });
                    try {
                        const url = `${POS_ENDPOINTS.BRANDS}?page=${page}&per_page=10`;
                        console.log('📡 Fetching brands from:', url);
                        const response = await apiGet(url);
                        console.log('📥 Brands response:', response);
                        if (response.success) {
                            // Map API response using BrandModel
                            const brandsData = response.data.data?.brands || [];
                            const mappedBrands = BrandModel.fromApiResponseArray(brandsData);

                            if (append) {
                                get().appendBrands(mappedBrands);
                            } else {
                                set({ brands: mappedBrands });
                            }

                            // Calculate pagination info
                            const total = response.data.data?.total || 0;
                            const perPage = 10;
                            const hasMore = (page * perPage) < total;

                            // Update pagination info
                            set({
                                brandsCurrentPage: page,
                                brandsHasMore: hasMore
                            });
                        } else {
                            console.error('Failed to fetch brands:', response.error);
                        }
                    } catch (error) {
                        console.error('Error fetching brands:', error);
                    } finally {
                        set({ brandsLoading: false });
                    }
                },

                fetchMoreBrands: async () => {
                    const { brandsCurrentPage, brandsHasMore, brandsLoading } = get();

                    if (!brandsHasMore || brandsLoading) {
                        return;
                    }

                    await get().fetchBrands(brandsCurrentPage + 1, true);
                },

                fetchProducts: async (page = 1, append = false, search = '', categoryId = null, brandId = null) => {
                    // Build a stable key for this query (page + filters)
                    const queryKey = [
                        page,
                        search || '',
                        categoryId || '',
                        brandId || '',
                    ].join('|');

                    const { lastProductsQueryKey, lastProductsEmpty } = get();

                    // If we already know this exact query returns no products,
                    // avoid calling the API again to prevent fetch loops
                    if (lastProductsQueryKey === queryKey && lastProductsEmpty) {
                        console.log('⏭️ Skipping products fetch (same empty query):', queryKey);
                        return;
                    }

                    set({ productsLoading: true });
                    try {
                        // Build query parameters
                        let queryParams = `page=${page}&per_page=12`;

                        if (search) queryParams += `&search=${encodeURIComponent(search)}`;
                        if (categoryId) queryParams += `&category_id=${categoryId}`;
                        if (brandId) queryParams += `&brand_id=${brandId}`;

                        const url = `${POS_ENDPOINTS.PRODUCTS}?${queryParams}`;
                        console.log('📡 Fetching products from:', url);
                        const response = await apiGet(url);
                        console.log('📥 Products response:', response);

                        if (response.success) {
                            // Map API response using ProductModel
                            const productsData = response.data.data?.products || [];
                            console.log('📦 Raw products from API (first item):', productsData[0]);
                            const mappedProducts = ProductModel.fromApiResponseArray(productsData);
                            console.log('🔄 Mapped products (first item):', mappedProducts[0]);
                            console.log('🔍 Checking for objects in mapped product:', {
                                category: mappedProducts[0]?.category,
                                categoryType: typeof mappedProducts[0]?.category,
                                brand: mappedProducts[0]?.brand,
                                brandType: typeof mappedProducts[0]?.brand,
                                unit: mappedProducts[0]?.unit,
                                unitType: typeof mappedProducts[0]?.unit
                            });

                            if (append) {
                                get().appendProducts(mappedProducts);
                            } else {
                                set({ products: mappedProducts });
                            }

                            // Calculate pagination info
                            const total = response.data.data?.total || 0;
                            const perPage = 12;
                            const hasMore = (page * perPage) < total;

                            // Update pagination info and remember whether this query was empty
                            set({
                                productsCurrentPage: page,
                                productsHasMore: hasMore,
                                lastProductsQueryKey: queryKey,
                                lastProductsEmpty: mappedProducts.length === 0,
                            });

                        } else {
                            console.error('Failed to fetch products:', response.error);
                            // On error, don't mark query as empty to allow retries
                            set({
                                lastProductsQueryKey: queryKey,
                                lastProductsEmpty: false,
                            });
                        }
                    } catch (error) {
                        console.error('Error fetching products:', error);
                        set({
                            lastProductsQueryKey: queryKey,
                            lastProductsEmpty: false,
                        });
                    } finally {
                        set({ productsLoading: false });
                    }
                },

                fetchProductsWithSearch: async (searchTerm, page = 1, append = false) => {
                    set({ productsLoading: true });
                    try {
                        const response = await apiGet(`${POS_ENDPOINTS.PRODUCTS}?page=${page}&per_page=12&search=${encodeURIComponent(searchTerm)}`);
                        if (response.success) {
                            // Map API response using ProductModel
                            const productsData = response.data.data?.products || [];
                            const mappedProducts = ProductModel.fromApiResponseArray(productsData);
                            
                            if (append) {
                                get().appendProducts(mappedProducts);
                            } else {
                                set({ products: mappedProducts });
                            }

                            // Calculate pagination info
                            const total = response.data.data?.total || 0;
                            const perPage = 12;
                            const hasMore = (page * perPage) < total;

                            // Update pagination info
                            set({
                                productsCurrentPage: page,
                                productsHasMore: hasMore
                            });
                        } else {
                            console.error('Failed to fetch products with search:', response.error);
                        }
                    } catch (error) {
                        console.error('Error fetching products with search:', error);
                    } finally {
                        set({ productsLoading: false });
                    }
                },

                fetchMoreProducts: async () => {
                    const { productsCurrentPage, productsHasMore, productsLoading, activeCategory, activeBrand, searchTerm } = get();

                    if (!productsHasMore || productsLoading) {
                        return;
                    }

                    // Get category and brand IDs if they exist
                    const categoryId = activeCategory ? activeCategory.id : null;
                    const brandId = activeBrand ? activeBrand.id : null;

                    await get().fetchProducts(productsCurrentPage + 1, true, searchTerm, categoryId, brandId);
                },

                // Customer Actions
                setCustomers: (customers) => set({ customers }),
                selectCustomer: (customer) => set({ selectedCustomer: customer }),
                setCustomersLoading: (loading) => set({ customersLoading: loading }),

                fetchCustomers: async (search = '') => {
                    set({ customersLoading: true });
                    try {
                        const response = await apiGet(`${POS_ENDPOINTS.CUSTOMER_SEARCH}?search=${encodeURIComponent(search)}`);
                        if (response.success) {
                            set({ customers: response.data.data?.customers || [] });
                        } else {
                            console.error('Failed to fetch customers:', response.error);
                        }
                    } catch (error) {
                        console.error('Error fetching customers:', error);
                    } finally {
                        set({ customersLoading: false });
                    }
                },

                // Customer Groups Actions
                setCustomerGroups: (customerGroups) => set({ customerGroups }),
                setCustomerGroupsLoading: (loading) => set({ customerGroupsLoading: loading }),

                fetchCustomerGroups: async () => {
                    set({ customerGroupsLoading: true });
                    try {
                        const response = await apiGet(POS_ENDPOINTS.CUSTOMER_GROUPS);
                        if (response.success) {
                            set({ customerGroups: response.data.data?.customerGroups || [] });
                        } else {
                            console.error('Failed to fetch customer groups:', response.error);
                        }
                    } catch (error) {
                        console.error('Error fetching customer groups:', error);
                    } finally {
                        set({ customerGroupsLoading: false });
                    }
                },

                // Sales Actions
                processSale: () => {
                    const { cart, cartTotal, selectedCustomer } = get();

                    if (cart.length === 0) {
                        throw new Error('Cart is empty');
                    }

                    const sale = {
                        id: Date.now(),
                        items: cart,
                        total: cartTotal,
                        customer: selectedCustomer,
                        timestamp: new Date().toISOString(),
                        status: 'completed'
                    };

                    set({
                        sales: [...get().sales, sale],
                        currentSale: sale
                    });

                    get().clearCart();
                    return sale;
                },

                // UI Actions
                setLoading: (isLoading) => set({ isLoading }),
                setSearchTerm: (searchTerm) => {
                    // Only update local state; fetching is handled by the products view
                    set({ searchTerm });
                },
                toggleCustomerModal: () => set({ showCustomerModal: !get().showCustomerModal }),
                toggleProductModal: () => set({ showProductModal: !get().showProductModal }),
                setNavigationType: (navigationType) => set({ navigationType }),
                toggleFullscreen: () => set({ isFullscreen: !get().isFullscreen }),

                // Filtered Data
                getFilteredProducts: () => {
                    const { products, searchTerm } = get();
                    if (!searchTerm) return products;

                    return products.filter(product =>
                        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        product.code?.includes(searchTerm)
                    );
                },

                getCartItemCount: () => {
                    return get().cart.reduce((total, item) => total + item.quantity, 0);
                },

                getCartSubtotal: () => {
                    // Calculate subtotal based on tax_type
                    return get().cart.reduce((total, item) => {
                        const itemPrice = item.price || 0;
                        const itemTax = item.tax || 0;
                        const itemQuantity = item.quantity || 0;
                        const taxType = item.tax_type || 'exclusive';
                        
                        if (taxType === 'inclusive') {
                            // For inclusive tax, subtotal = price - tax (base price)
                            return total + ((itemPrice - itemTax) * itemQuantity);
                        } else {
                            // For exclusive tax, subtotal = price
                            return total + (itemPrice * itemQuantity);
                        }
                    }, 0);
                },

                // Reset Store
                reset: () => {
                    set({
                        cart: [],
                        cartTotal: 0,
                        tax: 0,
                        discount: 0,
                        paymentMethod: '1',
                        appliedCoupon: null,
                        splitPayments: null,
                        selectedProduct: null,
                        selectedCustomer: null,
                        customers: [],
                        customersLoading: false,
                        currentSale: null,
                        categories: [],
                        activeCategory: null,
                        categoriesCurrentPage: 1,
                        categoriesHasMore: true,
                        categoriesLoading: false,
                        products: [],
                        productsCurrentPage: 1,
                        productsHasMore: true,
                        productsLoading: false,
                        isLoading: false,
                        searchTerm: '',
                        showCustomerModal: false,
                        showProductModal: false,
                        navigationType: 'categories',
                        isFullscreen: false,
                        // Do not carry cart across merchants
                        merchantIdForCart: null,
                    });
                }
            }),
            {
                name: 'pos-store',
                partialize: (state) => ({
                    cart: state.cart,
                    cartTotal: state.cartTotal,
                    tax: state.tax,
                    discount: state.discount,
                    paymentMethod: state.paymentMethod,
                    selectedCustomer: state.selectedCustomer,
                    sales: state.sales,
                    appliedCoupon: state.appliedCoupon,
                    splitPayments: state.splitPayments,
                })
            }
        )
    )
);

export default usePosStore;


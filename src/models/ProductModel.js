// Product Model for mapping API response
export class ProductModel {
    constructor(data) {
        this.id = data.id || null;
        this.name = data.name || data.product_name || '';
        this.code = data.code || '';
        this.qty = parseInt(data.qty) || parseInt(data.quantity) || 0;
        this.stock = parseInt(data.stock) || parseInt(data.qty) || parseInt(data.quantity) || 0;
        this.thumbnail = data.thumbnail || data.image || 'assets/media/stock/food/img-2.jpg';
        this.image = this.thumbnail; // For backward compatibility
        this.ending_date = data.ending_date || 'N/A';
        this.price = parseFloat(data.price) || parseFloat(data.sale_price) || 0;
        this.cost = parseFloat(data.cost) || parseFloat(data.base_price) || 0;
        this.discount = parseFloat(data.discount) || 0;
        this.tax = parseFloat(data.tax) || 0;
        this.subtotal = parseFloat(data.subtotal) || 0;
        this.cost_tax = parseFloat(data.cost_tax) || 0;
        this.batch = data.batch || false;
        this.serial_imei_number = data.serial_imei_number || false;
        this.tax_rate = parseFloat(data.tax_rate) || 0;
        this.tax_type = data.tax_type || 'inclusive'; // 'inclusive' or 'exclusive'
        this.product_variants = data.product_variants || [];
        this.product_serial_imei_numbers = data.product_serial_imei_numbers || [];
        
        // Additional fields for backward compatibility
        this.barcode = data.barcode || data.sku || data.code || '';
        this.description = data.description || '';
        this.category_id = data.category_id || (typeof data.category === 'object' ? data.category?.id : null) || null;
        this.category = typeof data.category === 'object' ? data.category?.name : data.category || null;
        this.brand_id = data.brand_id || (typeof data.brand === 'object' ? data.brand?.id : null) || null;
        this.brand = typeof data.brand === 'object' ? data.brand?.name : data.brand || null;
        this.unit = typeof data.unit === 'object' ? data.unit?.name : data.unit || 'pcs';
        this.cost_price = this.cost;
        this.selling_price = this.price;
        this.status = data.status || data.product_status || 'active';
        this.created_at = data.created_at || null;
        this.updated_at = data.updated_at || null;
    }

    // Static method to map single product
    static fromApiResponse(apiData) {
        return new ProductModel(apiData);
    }

    // Static method to map array of products
    static fromApiResponseArray(apiDataArray) {
        if (!Array.isArray(apiDataArray)) {
            console.warn('Expected array but got:', typeof apiDataArray);
            return [];
        }
        
        return apiDataArray.map(item => ProductModel.fromApiResponse(item));
    }

    // Method to convert back to plain object
    toPlainObject() {
        return {
            id: this.id,
            name: this.name,
            code: this.code,
            qty: this.qty,
            stock: this.stock,
            thumbnail: this.thumbnail,
            image: this.image,
            ending_date: this.ending_date,
            price: this.price,
            cost: this.cost,
            discount: this.discount,
            tax: this.tax,
            subtotal: this.subtotal,
            cost_tax: this.cost_tax,
            batch: this.batch,
            serial_imei_number: this.serial_imei_number,
            tax_rate: this.tax_rate,
            product_variants: this.product_variants,
            product_serial_imei_numbers: this.product_serial_imei_numbers,
            // Additional fields for backward compatibility
            barcode: this.barcode,
            description: this.description,
            category_id: this.category_id,
            category: this.category,
            brand_id: this.brand_id,
            brand: this.brand,
            unit: this.unit,
            cost_price: this.cost_price,
            selling_price: this.selling_price,
            status: this.status,
            created_at: this.created_at,
            updated_at: this.updated_at
        };
    }

    // Method to check if product is active
    isActive() {
        return this.status === 'active';
    }

    // Method to check if product is in stock
    isInStock() {
        return this.stock > 0;
    }

    // Method to get final price after discount
    getFinalPrice() {
        return this.price - (this.price * this.discount / 100);
    }

    // Method to get tax amount
    getTaxAmount() {
        return this.getFinalPrice() * this.tax_rate / 100;
    }

    // Method to get total price with tax
    getTotalPrice() {
        return this.getFinalPrice() + this.getTaxAmount();
    }

    // Method to get display name with stock info
    getDisplayName() {
        return `${this.name} (${this.stock} ${this.unit})`;
    }

    // Method to check if product has variants
    hasVariants() {
        return this.product_variants && this.product_variants.length > 0;
    }

    // Method to check if product has serial/IMEI numbers
    hasSerialNumbers() {
        return this.product_serial_imei_numbers && this.product_serial_imei_numbers.length > 0;
    }

    // Method to check if product is batch tracked
    isBatchTracked() {
        return this.batch === true;
    }

    // Method to check if product has serial/IMEI tracking
    isSerialTracked() {
        return this.serial_imei_number === true;
    }

    // Method to get cost with tax
    getCostWithTax() {
        return this.cost + this.cost_tax;
    }

    // Method to get profit margin
    getProfitMargin() {
        if (this.cost <= 0) return 0;
        return ((this.price - this.cost) / this.cost) * 100;
    }

    // Method to check if product is expiring soon (within 30 days)
    isExpiringSoon() {
        if (!this.ending_date || this.ending_date === 'N/A') return false;
        const endDate = new Date(this.ending_date);
        const today = new Date();
        const diffTime = endDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 30 && diffDays >= 0;
    }
}

// Export default for convenience
export default ProductModel;


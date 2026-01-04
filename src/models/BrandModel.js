// Brand Model for mapping API response
export class BrandModel {
    constructor(data) {
        this.id = data.id || null;
        this.name = data.name || '';
        this.count = data.total_products || 0;
        this.unit = data.unit || 'Items';
        this.thumbnail = data.thumbnail || 'assets/media/svg/food-icons/default.svg';
        this.description = data.description || '';
        this.created_at = data.created_at || null;
        this.updated_at = data.updated_at || null;
        this.status = data.status || 'active';
    }

    // Static method to map single brand
    static fromApiResponse(apiData) {
        return new BrandModel(apiData);
    }

    // Static method to map array of brands
    static fromApiResponseArray(apiDataArray) {
        if (!Array.isArray(apiDataArray)) {
            console.warn('Expected array but got:', typeof apiDataArray);
            return [];
        }
        
        return apiDataArray.map(item => BrandModel.fromApiResponse(item));
    }

    // Method to convert back to plain object
    toPlainObject() {
        return {
            id: this.id,
            name: this.name,
            count: this.count,
            unit: this.unit,
            icon: this.icon,
            description: this.description,
            status: this.status,
            created_at: this.created_at,
            updated_at: this.updated_at
        };
    }

    // Method to check if brand is active
    isActive() {
        return this.status === 'active';
    }

    // Method to get display name with count
    getDisplayName() {
        return `${this.name} (${this.count})`;
    }
}

// Export default for convenience
export default BrandModel;


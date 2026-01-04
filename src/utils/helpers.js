/**
 * Get text from translation object or return string
 * Handles cases where field might be {ar: "...", en: "..."} or just a string
 * 
 * @param {string|object} value - The value that might be a translation object
 * @param {string} defaultLang - Default language to use (default: 'en')
 * @returns {string} - The text value
 */
export const getTranslatedText = (value, defaultLang = 'en') => {
    if (!value) return '';
    
    if (typeof value === 'object') {
        return value[defaultLang] || value.en || value.ar || '';
    }
    
    return value;
};

/**
 * Format currency with symbol
 * 
 * @param {number} amount - The amount to format
 * @param {string} currency - Currency code (default: 'USD')
 * @param {string} locale - Locale for formatting (default: 'en-US')
 * @returns {string} - Formatted currency string
 */
export const formatCurrency = (amount, currency = 'USD', locale = 'en-US') => {
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency
    }).format(amount);
};

/**
 * Format date to locale string
 * 
 * @param {string|Date} date - The date to format
 * @param {string} locale - Locale for formatting (default: 'en-US')
 * @returns {string} - Formatted date string
 */
export const formatDate = (date, locale = 'en-US') => {
    if (!date) return '';
    return new Date(date).toLocaleDateString(locale);
};

/**
 * Format datetime to locale string
 * 
 * @param {string|Date} date - The datetime to format
 * @param {string} locale - Locale for formatting (default: 'en-US')
 * @returns {string} - Formatted datetime string
 */
export const formatDateTime = (date, locale = 'en-US') => {
    if (!date) return '';
    return new Date(date).toLocaleString(locale);
};

/**
 * Truncate text to specified length
 * 
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} - Truncated text with ellipsis if needed
 */
export const truncateText = (text, maxLength = 50) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
};

/**
 * Get status badge class
 * 
 * @param {string} status - Status value
 * @returns {string} - Bootstrap badge class
 */
export const getStatusBadgeClass = (status) => {
    const statusMap = {
        'active': 'badge-light-success',
        'inactive': 'badge-light-warning',
        'pending': 'badge-light-info',
        'approved': 'badge-light-success',
        'rejected': 'badge-light-danger',
        'suspended': 'badge-light-warning'
    };
    
    return statusMap[status?.toLowerCase()] || 'badge-light-secondary';
};


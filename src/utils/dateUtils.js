/**
 * Format a date string to a readable format
 * @param {string} dateString - ISO date string
 * @param {string} locale - Locale string (default: 'en-US')
 * @returns {string} - Formatted date string
 */
export const formatDate = (dateString, locale = 'en-US') => {
    if (!dateString) return 'N/A';

    try {
        const date = new Date(dateString);
        
        if (isNaN(date.getTime())) {
            return 'Invalid Date';
        }

        return date.toLocaleDateString(locale, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        console.error('Error formatting date:', error);
        return dateString;
    }
};

/**
 * Format a date string to a short format (without time)
 * @param {string} dateString - ISO date string
 * @param {string} locale - Locale string (default: 'en-US')
 * @returns {string} - Formatted date string
 */
export const formatDateShort = (dateString, locale = 'en-US') => {
    if (!dateString) return 'N/A';

    try {
        const date = new Date(dateString);
        
        if (isNaN(date.getTime())) {
            return 'Invalid Date';
        }

        return date.toLocaleDateString(locale, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch (error) {
        console.error('Error formatting date:', error);
        return dateString;
    }
};

/**
 * Get relative time string (e.g., "2 hours ago")
 * @param {string} dateString - ISO date string
 * @returns {string} - Relative time string
 */
export const getRelativeTime = (dateString) => {
    if (!dateString) return 'N/A';

    try {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHour = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHour / 24);

        if (diffSec < 60) {
            return 'Just now';
        } else if (diffMin < 60) {
            return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
        } else if (diffHour < 24) {
            return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
        } else if (diffDay < 7) {
            return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
        } else {
            return formatDateShort(dateString);
        }
    } catch (error) {
        console.error('Error getting relative time:', error);
        return dateString;
    }
};

/**
 * Check if a date is today
 * @param {string} dateString - ISO date string
 * @returns {boolean}
 */
export const isToday = (dateString) => {
    if (!dateString) return false;

    try {
        const date = new Date(dateString);
        const today = new Date();
        
        return date.getDate() === today.getDate() &&
               date.getMonth() === today.getMonth() &&
               date.getFullYear() === today.getFullYear();
    } catch (error) {
        return false;
    }
};


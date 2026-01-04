/**
 * Export utilities for downloading CSV files
 */

/**
 * Convert JSON data to CSV format and trigger download
 * @param {Array} data - Array of objects to export
 * @param {String} filename - Name of the file to download
 */
export const downloadCSV = (data, filename) => {
    if (!data || data.length === 0) {
        console.warn('No data to export');
        return;
    }

    // Extract headers from first object
    const headers = Object.keys(data[0]);
    
    // Create CSV content
    let csvContent = headers.join(',') + '\n';
    
    // Add data rows
    data.forEach(row => {
        const values = headers.map(header => {
            const value = row[header];
            // Handle null/undefined
            if (value === null || value === undefined) {
                return '';
            }
            // Escape quotes and wrap in quotes if contains comma or quote
            const stringValue = String(value);
            if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
                return '"' + stringValue.replace(/"/g, '""') + '"';
            }
            return stringValue;
        });
        csvContent += values.join(',') + '\n';
    });

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
};

/**
 * Download file from URL with authentication token
 * @param {String} url - URL to download from
 * @param {String} filename - Name of the file to download
 * @param {String} token - Authentication token
 */
export const downloadFile = async (url, filename, token) => {
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Download failed');
        }

        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
        console.error('Download error:', error);
        throw error;
    }
};

/**
 * Export data from API response
 * @param {Object} response - Axios response object
 * @param {String} defaultFilename - Default filename if not provided in response
 */
export const handleAPIExport = (response, defaultFilename = 'export.csv') => {
    if (response.data && response.data.data) {
        const filename = response.data.filename || defaultFilename;
        downloadCSV(response.data.data, filename);
        return true;
    }
    return false;
};



/**
 * Export data to Excel (CSV format that Excel can open)
 * @param {Array} data - Array of objects to export
 * @param {String} filename - Name of the file to download
 */
export const exportToExcel = (data, filename = 'export.xlsx') => {
    if (!data || data.length === 0) {
        console.warn('No data to export');
        return;
    }

    // Extract headers from first object
    const headers = Object.keys(data[0]);
    
    // Create CSV content with BOM for UTF-8 encoding
    let csvContent = '\uFEFF'; // BOM for UTF-8
    
    // Add headers
    csvContent += headers.map(header => escapeCSVValue(header)).join(',') + '\n';
    
    // Add data rows
    data.forEach(row => {
        const values = headers.map(header => {
            const value = row[header];
            return escapeCSVValue(value);
        });
        csvContent += values.join(',') + '\n';
    });

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8;' });
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
 * Escape CSV value
 */
const escapeCSVValue = (value) => {
    if (value === null || value === undefined) {
        return '';
    }
    
    const stringValue = String(value);
    
    // If contains comma, quote, or newline, wrap in quotes and escape quotes
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return '"' + stringValue.replace(/"/g, '""') + '"';
    }
    
    return stringValue;
};


/**
 * File handling utility functions
 */

/**
 * Validate file type against allowed types
 * @param {File} file - File object to validate
 * @param {Array} allowedTypes - Array of allowed MIME types or extensions
 * @returns {Boolean} - True if valid, false otherwise
 */
export const validateFileType = (file, allowedTypes) => {
    if (!file) return false;
    
    // Check MIME type
    if (allowedTypes.includes(file.type)) {
        return true;
    }
    
    // Check file extension
    const fileName = file.name.toLowerCase();
    return allowedTypes.some(type => {
        const ext = type.startsWith('.') ? type : `.${type}`;
        return fileName.endsWith(ext);
    });
};

/**
 * Format file size in human-readable format
 * @param {Number} bytes - File size in bytes
 * @returns {String} - Formatted file size
 */
export const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Validate file size
 * @param {File} file - File object to validate
 * @param {Number} maxSizeInMB - Maximum file size in MB
 * @returns {Boolean} - True if valid, false otherwise
 */
export const validateFileSize = (file, maxSizeInMB) => {
    if (!file) return false;
    
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    return file.size <= maxSizeInBytes;
};

/**
 * Get file extension from filename
 * @param {String} filename - Filename to extract extension from
 * @returns {String} - File extension (without dot)
 */
export const getFileExtension = (filename) => {
    if (!filename) return '';
    
    const parts = filename.split('.');
    return parts.length > 1 ? parts.pop().toLowerCase() : '';
};

/**
 * Validate file before upload
 * @param {File} file - File to validate
 * @param {Object} options - Validation options
 * @param {Array} options.allowedTypes - Allowed file types
 * @param {Number} options.maxSizeInMB - Maximum file size in MB
 * @returns {Object} - Validation result { valid: boolean, error: string }
 */
export const validateFile = (file, options = {}) => {
    const {
        allowedTypes = [],
        maxSizeInMB = 10
    } = options;
    
    if (!file) {
        return { valid: false, error: 'No file selected' };
    }
    
    // Validate file type
    if (allowedTypes.length > 0 && !validateFileType(file, allowedTypes)) {
        return { valid: false, error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}` };
    }
    
    // Validate file size
    if (!validateFileSize(file, maxSizeInMB)) {
        return { valid: false, error: `File size exceeds ${maxSizeInMB}MB` };
    }
    
    return { valid: true, error: null };
};

/**
 * Read file as text
 * @param {File} file - File to read
 * @returns {Promise<String>} - File content as text
 */
export const readFileAsText = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsText(file);
    });
};

/**
 * Read file as Data URL
 * @param {File} file - File to read
 * @returns {Promise<String>} - File content as Data URL
 */
export const readFileAsDataURL = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsDataURL(file);
    });
};



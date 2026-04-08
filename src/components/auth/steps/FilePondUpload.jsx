import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FilePond, registerPlugin } from 'react-filepond';
import FilePondPluginFileValidateType from 'filepond-plugin-file-validate-type';
import FilePondPluginFileValidateSize from 'filepond-plugin-file-validate-size';
import FilePondPluginImagePreview from 'filepond-plugin-image-preview';
import { AUTH_SERVICE_BASE, SOFTPOS_API_BASE } from '../../../utils/constants';

// Import FilePond styles
import 'filepond/dist/filepond.min.css';
import 'filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css';

// Register the plugins
registerPlugin(
    FilePondPluginFileValidateType,
    FilePondPluginFileValidateSize,
    FilePondPluginImagePreview
);

const FilePondUpload = ({ 
    title, 
    name, 
    accept, 
    formData, 
    setFormData, 
    merchantCode,
    maxSize = 10 * 1024 * 1024, // 10MB default
    onUploadSuccess,
    onUploadError,
    fieldErrors = {},
    isImage = false
}) => {
    const [files, setFiles] = useState([]);
    const [uploadedFileId, setUploadedFileId] = useState(null);
    const [modalImageUrl, setModalImageUrl] = useState(null);
    const [uploadedFileData, setUploadedFileData] = useState(null);
    const filePondRef = useRef(null);
    const uploadedFileIdRef = useRef(null);

    // Function to convert file extensions to MIME types
    const convertExtensionsToMimeTypes = (extensions) => {
        const extensionToMime = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.pdf': 'application/pdf',
            '.doc': 'application/msword',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            '.txt': 'text/plain'
        };

        return extensions
            .split(',')
            .map(ext => ext.trim())
            .map(ext => extensionToMime[ext.toLowerCase()] || ext)
            .filter(Boolean);
    };

    // Custom file type detection function
    const detectFileType = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onloadend = () => {
                const arr = (new Uint8Array(reader.result)).subarray(0, 4);
                let header = "";
                for (let i = 0; i < arr.length; i++) {
                    header += arr[i].toString(16).padStart(2, '0');
                }

                // Check the file signature (magic numbers)
                switch (header) {
                    case "89504e47":
                        resolve("image/png");
                        break;
                    case "ffd8ffe0":
                    case "ffd8ffe1":
                    case "ffd8ffe2":
                    case "ffd8ffe3":
                    case "ffd8ffe8":
                        resolve("image/jpeg");
                        break;
                    case "47494638":
                        resolve("image/gif");
                        break;
                    case "25504446":
                        resolve("application/pdf");
                        break;
                    default:
                        // Fallback to browser MIME type
                        resolve(file.type || 'unknown');
                }
            };

            reader.onerror = () => {
                console.error('Error reading file for type detection');
                reject("Error reading file");
            };

            reader.readAsArrayBuffer(file.slice(0, 4));
        });
    };

    // Get accepted file types as MIME types
    const getAcceptedFileTypes = (accept) => {
        return convertExtensionsToMimeTypes(accept);
    };

    // Delete file from server
    const handleDeleteFile = async (fileId) => {
        if (!fileId) {
            return;
        }

        try {
            const response = await fetch(`${AUTH_SERVICE_BASE}/delete-merchant-file/${fileId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token') || ''}`
                },
                body: JSON.stringify({
                    field_name: name
                })
            });

            const data = await response.json();
            
            if (!data.success) {
                console.error('Delete failed:', data.message);
            }
        } catch (error) {
            console.error('Delete error:', error);
        }
    };

    // Server configuration
    const isCompanyLogoUpload = name === 'company_logo';
    const uploadUrl = isCompanyLogoUpload
        ? `${SOFTPOS_API_BASE}/upload-partner-compnay/profile`
        : `${AUTH_SERVICE_BASE}/upload-partner-file`;

    const serverConfig = {
        process: {
            url: uploadUrl,
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token') || ''}`
            },
            ondata: (payload) => {
                // Add field name to form data
                payload.append('field_name', name);
                const partnerId = formData?.partner_id || formData?.partnerId || '';
                if (partnerId) {
                    payload.append('partner_id', partnerId);
                    payload.append('parent_id', partnerId);
                }
                return payload;
            },
            onload: (response) => {
                try {
                    const data = JSON.parse(response);
                    
                    if (data.success) {
                        // Save the file ID for deletion
                        const fileId = data.data.id;
                        setUploadedFileId(fileId);
                        uploadedFileIdRef.current = fileId;
                        
                        // Save uploaded file data for modal/viewing
                        setUploadedFileData(data.data);
                        
                        // Update form data with uploaded file info
                        setFormData(prev => ({
                            ...prev,
                            [name]: {
                                serverData: data.data,
                                uploaded: true,
                                fileId: fileId
                            }
                        }));
                        
                        if (onUploadSuccess) {
                            onUploadSuccess(data.data);
                        }
                    } else {
                        throw new Error(data.message || 'Upload failed');
                    }
                } catch (error) {
                    if (onUploadError) {
                        onUploadError(error);
                    }
                }
            },
            onerror: (response) => {
                if (onUploadError) {
                    onUploadError(new Error('Upload failed'));
                }
            }
        },
        revert: async (uniqueFileId, load, error) => {
            try {
                // Delete file from server when user clicks X button
                const fileId = uploadedFileIdRef.current;
                if (fileId) {
                    await handleDeleteFile(fileId);
                }
                
                // Clear local state
                setUploadedFileId(null);
                uploadedFileIdRef.current = null;
                setUploadedFileData(null);
                setFiles([]); // Clear files array to remove from FilePond
                setFormData(prev => ({
                    ...prev,
                    [name]: {
                        serverData: null,
                        uploaded: false,
                        fileId: null
                    }
                }));
                
                // Notify FilePond that revert is complete (this removes the file)
                load();
            } catch (err) {
                // If deletion fails, still notify FilePond to remove the file from UI
                console.error('Revert error:', err);
                load();
            }
        }
    };

    // Handle file click to open in modal or new tab
    const handleFileClick = useCallback(() => {
        if (!uploadedFileData) return;

        // Get file URL from uploaded data
        const fileUrl = uploadedFileData.url || uploadedFileData.path || uploadedFileData.file_url || uploadedFileData.file_path;
        if (!fileUrl) return;

        // Construct full URL
        let fullUrl = fileUrl;
        if (!fileUrl.startsWith('http')) {
            // Remove leading slash if present and construct URL
            const cleanPath = fileUrl.replace(/^\//, '');
            fullUrl = `${AUTH_SERVICE_BASE}/${cleanPath}`;
        }

        // Determine file type
        const fileName = uploadedFileData.original_name || uploadedFileData.name || fileUrl.split('/').pop() || '';
        const fileType = uploadedFileData.type || uploadedFileData.mime_type || '';
        
        // Check if it's a PDF
        const isPdf = fileName.toLowerCase().endsWith('.pdf') || 
                     fileType === 'application/pdf' || 
                     fileType === 'document';

        if (isPdf) {
            // Open PDF in new tab
            window.open(fullUrl, '_blank');
        } else {
            // Check if it's an image
            const isImage = fileType?.startsWith('image/') || 
                          fileType === 'image' ||
                          /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(fileName);
            
            if (isImage) {
                // Open image in modal
                setModalImageUrl(fullUrl);
            } else {
                // For other files, try to open in new tab
                window.open(fullUrl, '_blank');
            }
        }
    }, [uploadedFileData]);

    // Event handlers
    const handleInit = () => {
        // FilePond instance initialized
    };

    // Add click handler to file items after FilePond renders
    useEffect(() => {
        const container = document.querySelector(`#${name}`)?.parentElement;
        if (container && uploadedFileData) {
            const handleFileClickEvent = (e) => {
                // Don't handle clicks on buttons (remove, process, etc.)
                if (e.target.closest('.filepond--file-action-button') || 
                    e.target.closest('.filepond--action-revert-item-processing') ||
                    e.target.closest('button') ||
                    e.target.closest('.filepond--file-status')) {
                    return;
                }
                
                // Only handle clicks on file info area or file wrapper
                if (e.target.closest('.filepond--file-info') || 
                    e.target.closest('.filepond--file-wrapper') ||
                    e.target.closest('.filepond--file')) {
                    e.stopPropagation();
                    handleFileClick();
                }
            };

            container.addEventListener('click', handleFileClickEvent);
            
            return () => {
                container.removeEventListener('click', handleFileClickEvent);
            };
        }
    }, [uploadedFileData, name, handleFileClick]);

    const handleAddFile = (error, file) => {
        if (error) {
            if (onUploadError) {
                onUploadError(new Error(`File validation failed: ${error.message || error}`));
            }
        }
    };

    const handleProcessFile = (error, file) => {
        // File processing
    };

    const handleProcessFileProgress = (file, progress) => {
        // Upload progress
    };

    const handleRemoveFile = (error, file) => {
        // Clean up state when file is removed (this handles cases where revert might not be called)
        setUploadedFileId(null);
        uploadedFileIdRef.current = null;
        setUploadedFileData(null);
        setModalImageUrl(null);
        setFiles([]); // Ensure files array is cleared
        setFormData(prev => ({
            ...prev,
            [name]: {
                serverData: null,
                uploaded: false,
                fileId: null
            }
        }));
    };

    const hasError = fieldErrors[name];

    return (
        <>
            <style>{`
                /* Show full filename - smaller font but no truncation */
                .filepond-container .filepond--file-info-main,
                .filepond-container .filepond--file .filepond--file-info-main {
                    font-size: 14px !important;
                    font-weight: 500 !important;
                    color: #212529 !important;
                    line-height: 1.4 !important;
                    margin-bottom: 4px !important;
                    white-space: normal !important;
                    word-wrap: break-word !important;
                    overflow: visible !important;
                    text-overflow: clip !important;
                    max-width: 100% !important;
                }
                
                .filepond-container .filepond--file-info-sub,
                .filepond-container .filepond--file .filepond--file-info-sub {
                    font-size: 12px !important;
                    color: #6c757d !important;
                    margin-top: 4px !important;
                }
                
                /* Hover effects - make it clearer on hover */
                .filepond-container .filepond--file-wrapper:hover .filepond--file-info-main,
                .filepond-container .filepond--file:hover .filepond--file-info-main {
                    color: #0d6efd !important;
                    font-weight: 600 !important;
                }
                
                .filepond-container .filepond--file-wrapper:hover,
                .filepond-container .filepond--file:hover {
                    background-color: #e7f1ff !important;
                    border-radius: 6px !important;
                    transition: all 0.2s ease !important;
                    cursor: pointer !important;
                }
                
                .filepond-container .filepond--file-info,
                .filepond-container .filepond--file .filepond--file-info {
                    padding: 8px 0 !important;
                }
                
                /* Make file clickable */
                .filepond-container .filepond--file-wrapper {
                    cursor: pointer !important;
                }
                
                /* Ensure file name is visible even when processing */
                .filepond-container .filepond--file-status-main {
                    font-size: 12px !important;
                }
            `}</style>
            
            <div className="card p-4 fv-row">
                <label className="form-label fw-bold mb-3">
                    {title} <span className="text-danger">*</span>
                </label>
                
                <div className={`filepond-container ${hasError ? 'is-invalid' : ''}`}>
                    <FilePond
                    ref={filePondRef}
                    files={files}
                    onupdatefiles={setFiles}
                    server={serverConfig}
                    acceptedFileTypes={getAcceptedFileTypes(accept)}
                    fileValidateTypeDetectType={(file, type) => 
                        detectFileType(file).then((detectedType) => {
                            return detectedType;
                        }).catch(() => {
                            return type;
                        })
                    }
                    maxFileSize={maxSize}
                    allowMultiple={false}
                    allowRevert={true}
                    instantUpload={true}
                    checkValidity={true}
                    imagePreviewHeight={isImage ? 120 : 0}
                    allowImagePreview={isImage}
                    oninit={handleInit}
                    onaddfile={handleAddFile}
                    onprocessfile={handleProcessFile}
                    onprocessfileprogress={handleProcessFileProgress}
                    onremovefile={handleRemoveFile}
                    name="file"
                    id={name}
                    labelIdle={`Drag & Drop your file here or <span class="filepond--label-action">Browse</span>`}
                    labelFileProcessing="Uploading..."
                    labelFileProcessingComplete="Upload complete"
                    labelFileProcessingError="Upload failed"
                    labelButtonRemoveItem="Remove"
                    labelButtonProcessItem="Upload"
                />
            </div>

            {hasError && (
                <div className="alert alert-danger mt-3 mb-0">
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    {fieldErrors[name]}
                </div>
            )}

            <small className="form-text text-muted mt-2">
                <i className="fas fa-info-circle me-1"></i>
                Files are uploaded to the server immediately for processing. Click on the file to view it.
            </small>
            
            </div>

            {/* Image Modal */}
            {modalImageUrl && (
                <div 
                    className="modal fade show" 
                    style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 9999 }}
                    onClick={() => setModalImageUrl(null)}
                >
                    <div 
                        className="modal-dialog modal-dialog-centered"
                        style={{ maxWidth: '95vw', width: '95vw', margin: 'auto' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="modal-content" style={{ backgroundColor: 'transparent', border: 'none' }}>
                            <div className="modal-header" style={{ border: 'none', justifyContent: 'flex-end', padding: '10px' }}>
                                <button 
                                    type="button" 
                                    className="btn-close btn-close-white" 
                                    onClick={() => setModalImageUrl(null)}
                                    aria-label="Close"
                                    style={{ filter: 'invert(1)' }}
                                ></button>
                            </div>
                            <div className="modal-body p-0" style={{ textAlign: 'center', padding: '20px' }}>
                                <img 
                                    src={modalImageUrl} 
                                    alt="Preview" 
                                    style={{ 
                                        maxWidth: '100%', 
                                        maxHeight: '90vh', 
                                        objectFit: 'contain',
                                        borderRadius: '8px',
                                        boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default FilePondUpload;


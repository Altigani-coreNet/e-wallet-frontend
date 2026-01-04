import React, { useState, useEffect } from 'react';

const SerialNumbersModal = ({ show, onClose, onSave, serialNumbers = [] }) => {
    const [serials, setSerials] = useState([]);
    const [inputValue, setInputValue] = useState('');

    useEffect(() => {
        if (show) {
            setSerials([...serialNumbers]);
            setInputValue('');
        }
    }, [show, serialNumbers]);

    const handleAddSerial = () => {
        const trimmed = inputValue.trim();
        if (trimmed) {
            if (serials.includes(trimmed)) {
                alert('Serial number already exists');
                return;
            }
            setSerials([...serials, trimmed]);
            setInputValue('');
        }
    };

    const handleRemoveSerial = (index) => {
        setSerials(serials.filter((_, i) => i !== index));
    };

    const handleSave = () => {
        onSave(serials);
        onClose();
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddSerial();
        }
    };

    if (!show) return null;

    return (
        <>
            <div className={`modal fade ${show ? 'show' : ''}`} style={{ display: show ? 'block' : 'none' }} tabIndex="-1">
                <div className="modal-dialog modal-lg">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h1 className="modal-title fs-5">Manage Serial Numbers</h1>
                            <button type="button" className="btn-close" onClick={onClose}></button>
                        </div>
                        <div className="modal-body">
                            <div className="mb-3">
                                <label className="form-label">Serial Number</label>
                                <div className="input-group">
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Enter serial number"
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                    />
                                    <button
                                        type="button"
                                        className="btn btn-primary"
                                        onClick={handleAddSerial}
                                    >
                                        <i className="ki-duotone ki-plus fs-2"></i>
                                        Add
                                    </button>
                                </div>
                            </div>
                            <div className="table-responsive">
                                <table className="table table-bordered">
                                    <thead>
                                        <tr>
                                            <th>Serial Number</th>
                                            <th width="100">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {serials.length === 0 ? (
                                            <tr>
                                                <td colSpan="2" className="text-center text-muted">
                                                    No serial numbers added
                                                </td>
                                            </tr>
                                        ) : (
                                            serials.map((serial, index) => (
                                                <tr key={index}>
                                                    <td>{serial}</td>
                                                    <td>
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-danger"
                                                            onClick={() => handleRemoveSerial(index)}
                                                        >
                                                            <i className="ki-duotone ki-trash fs-2">
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
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={onClose}>
                                Close
                            </button>
                            <button type="button" className="btn btn-primary" onClick={handleSave}>
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            {show && <div className="modal-backdrop fade show"></div>}
        </>
    );
};

export default SerialNumbersModal;


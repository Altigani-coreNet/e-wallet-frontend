import React, { useState, useEffect } from 'react';

const RolesSearch = ({ onSearch, searchTerm }) => {
    const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm || '');

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (localSearchTerm !== searchTerm) {
                onSearch(localSearchTerm);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [localSearchTerm]);

    const handleChange = (e) => {
        setLocalSearchTerm(e.target.value);
    };

    const handleClear = () => {
        setLocalSearchTerm('');
        onSearch('');
    };

    return (
        <div className="d-flex align-items-center position-relative my-1">
            <i className="ki-duotone ki-magnifier fs-3 position-absolute ms-5">
                <span className="path1"></span>
                <span className="path2"></span>
            </i>
            <input
                type="text"
                value={localSearchTerm}
                onChange={handleChange}
                className="form-control form-control-solid w-250px ps-13"
                placeholder="Search by role name..."
            />
            {localSearchTerm && (
                <button
                    onClick={handleClear}
                    className="btn btn-sm btn-icon btn-active-light-primary position-absolute"
                    style={{ right: '10px' }}
                >
                    <i className="ki-duotone ki-cross fs-2">
                        <span className="path1"></span>
                        <span className="path2"></span>
                    </i>
                </button>
            )}
        </div>
    );
};

export default RolesSearch;


import React, { useState, useEffect } from 'react';

const UsersSearch = ({ onSearch, searchTerm }) => {
    const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm || '');

    useEffect(() => {
        setLocalSearchTerm(searchTerm || '');
    }, [searchTerm]);

    const handleSearch = (e) => {
        const value = e.target.value;
        setLocalSearchTerm(value);
        
        // Debounce search
        const timeoutId = setTimeout(() => {
            onSearch(value);
        }, 500);

        return () => clearTimeout(timeoutId);
    };

    return (
        <div className="d-flex align-items-center position-relative my-1">
            <i className="ki-duotone ki-magnifier fs-3 position-absolute ms-5">
                <span className="path1"></span>
                <span className="path2"></span>
            </i>
            <input
                type="text"
                className="form-control form-control-solid w-250px ps-13"
                placeholder="Search by name or email..."
                value={localSearchTerm}
                onChange={handleSearch}
            />
        </div>
    );
};

export default UsersSearch;


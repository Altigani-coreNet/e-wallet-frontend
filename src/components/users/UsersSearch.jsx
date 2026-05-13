import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

const UsersSearch = ({ onSearch, searchTerm }) => {
    const { t } = useTranslation();
    const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm || '');
    const timeoutRef = useRef(null);

    useEffect(() => {
        setLocalSearchTerm(searchTerm || '');
    }, [searchTerm]);

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    const handleSearch = (e) => {
        const value = e.target.value;
        setLocalSearchTerm(value);
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
            onSearch(value);
        }, 500);
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
                placeholder={t('merchant.users.search.placeholder')}
                value={localSearchTerm}
                onChange={handleSearch}
            />
        </div>
    );
};

export default UsersSearch;

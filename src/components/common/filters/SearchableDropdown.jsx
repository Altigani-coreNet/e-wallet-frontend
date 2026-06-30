import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const defaultFilter = (option, term) =>
    option.label.toLowerCase().includes(term.toLowerCase());

const SearchableDropdown = ({
    label,
    placeholder = 'Select option',
    options = [],
    selected,
    onSelect,
    onClear,
    required = false,
    disabled = false,
    loading = false,
    searchPlaceholder = 'Search...',
    renderSelected,
    renderOption,
    emptyText = 'No results found',
    className = '',
    id,
    name,
    helperText,
    showClear = true,
    filterFn = defaultFilter,
    onOpen,
    onSearchChange,
    size = 'md',
}) => {
    const isSmall = size === 'sm';
    const labelClass = isSmall ? 'form-label fs-7 fw-semibold text-gray-700' : 'form-label fw-bold';
    const controlClass = isSmall ? 'form-control form-control-sm' : 'form-control';
    const controlMinHeight = isSmall ? 31 : 42;
    const containerRef = useRef(null);
    const searchInputRef = useRef(null);
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const selectedOption = useMemo(() => {
        if (!selected) return null;
        if (typeof selected === 'object') return selected;
        return options.find((option) => String(option.value) === String(selected)) || null;
    }, [options, selected]);

    const filteredOptions = useMemo(() => {
        if (!searchTerm) return options;
        return options.filter((option) => filterFn(option, searchTerm));
    }, [options, searchTerm, filterFn]);

    const handleToggle = useCallback(() => {
        if (disabled) return;
        setIsOpen((prev) => {
            const next = !prev;
            // Defer onOpen callback to prevent setState during render
            if (!prev && next && typeof onOpen === 'function') {
                setTimeout(() => {
                    onOpen();
                }, 0);
            }
            return next;
        });
    }, [disabled, onOpen]);

    const handleSelect = useCallback(
        (option) => {
            if (disabled) return;
            onSelect?.(option);
            setIsOpen(false);
            setSearchTerm('');
        },
        [disabled, onSelect]
    );

    const handleClear = useCallback(
        (event) => {
            event?.stopPropagation();
            if (disabled || required || !showClear) return;
            onClear?.();
            setSearchTerm('');
        },
        [disabled, required, onClear, showClear]
    );

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!containerRef.current) return;
            if (!containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isOpen]);

    return (
        <div className={`searchable-dropdown ${className}`} ref={containerRef}>
            {label && (
                <label className={labelClass} htmlFor={id || name}>
                    {label}
                </label>
            )}
            <div
                className={`${controlClass} d-flex align-items-center justify-content-between ${
                    disabled ? 'bg-light text-muted' : ''
                } ${required && !selectedOption ? 'border-danger' : ''}`}
                onClick={handleToggle}
                role="button"
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                tabIndex={disabled ? -1 : 0}
                style={{ minHeight: controlMinHeight, paddingTop: isSmall ? 2 : 6, paddingBottom: isSmall ? 2 : 6 }}
            >
                <div className="d-flex align-items-center gap-2">
                    {selectedOption ? (
                        renderSelected ? (
                            renderSelected(selectedOption)
                        ) : (
                            <span className={isSmall ? 'text-gray-800 fs-7' : 'text-gray-800'}>{selectedOption.label}</span>
                        )
                    ) : loading ? (
                        <span className="spinner-border spinner-border-sm text-primary" role="status" />
                    ) : (
                        <span className={isSmall ? 'text-muted fs-7' : 'text-muted'}>{placeholder}</span>
                    )}
                </div>
                <div className="d-flex align-items-center">
                    {loading && selectedOption && (
                        <span className="spinner-border spinner-border-sm text-primary me-2" role="status" />
                    )}
                    {showClear && selectedOption && !required && !disabled && (
                        <button
                            type="button"
                            className="btn btn-icon btn-sm btn-light-danger me-2"
                            onClick={handleClear}
                            aria-label={`Clear ${label || 'selection'}`}
                        >
                            <i className="ki-duotone ki-cross fs-2">
                                <span className="path1" />
                                <span className="path2" />
                            </i>
                        </button>
                    )}
                    <i className={`ki-duotone ki-down fs-2 ${isOpen ? 'rotate-180' : ''}`}>
                        <span className="path1" />
                        <span className="path2" />
                    </i>
                </div>
            </div>

            {helperText && <small className="text-muted d-block mt-2">{helperText}</small>}

            {isOpen && !disabled && (
                <div
                    className="position-relative"
                >
                    <div
                        className="position-absolute top-0 start-0 w-100 bg-white border rounded-3 shadow-sm mt-1"
                        style={{ zIndex: 1050, maxHeight: '260px', overflow: 'hidden' }}
                    >
                        <div className="p-3 border-bottom">
                            <input
                                ref={searchInputRef}
                                type="text"
                                className="form-control form-control-sm"
                                placeholder={searchPlaceholder}
                                value={searchTerm}
                                onChange={(event) => {
                                    const value = event.target.value;
                                    setSearchTerm(value);
                                    // Defer onSearchChange callback to prevent setState during render
                                    if (typeof onSearchChange === 'function') {
                                        setTimeout(() => {
                                            onSearchChange(value);
                                        }, 0);
                                    }
                                }}
                                onClick={(event) => event.stopPropagation()}
                            />
                        </div>
                        <div style={{ maxHeight: '220px', overflowY: 'auto' }} role="listbox">
                            {filteredOptions.length > 0 ? (
                                filteredOptions.map((option) => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        className={`w-100 text-start p-3 border-bottom bg-white ${
                                            selectedOption && String(selectedOption.value) === String(option.value)
                                                ? 'bg-light-primary'
                                                : 'hover-bg-light'
                                        }`}
                                        onMouseDown={(event) => event.preventDefault()}
                                        onClick={() => handleSelect(option)}
                                        role="option"
                                    >
                                        {renderOption ? renderOption(option) : <div className="text-gray-800">{option.label}</div>}
                                    </button>
                                ))
                            ) : (
                                <div className="p-3 text-muted text-center">{emptyText}</div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SearchableDropdown;


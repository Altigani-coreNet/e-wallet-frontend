import React from 'react';

const PaginationControls = ({ pagination, onPageChange, disabled }) => {
    if (!pagination || pagination.last_page <= 1) {
        return null;
    }

    const { current_page: currentPage = 1, last_page: lastPage = 1 } = pagination;

    const handleChange = (page) => {
        if (disabled || page === currentPage || page < 1 || page > lastPage) return;
        onPageChange?.(page);
    };

    const renderPageButton = (page) => (
        <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
            <button
                type="button"
                className="page-link"
                onClick={() => handleChange(page)}
                disabled={disabled}
            >
                {page}
            </button>
        </li>
    );

    const pages = [];
    for (let page = 1; page <= lastPage; page += 1) {
        if (page === 1 || page === lastPage || Math.abs(page - currentPage) <= 1) {
            pages.push(renderPageButton(page));
        } else if (
            (page === currentPage - 2 && currentPage - 3 > 1) ||
            (page === currentPage + 2 && currentPage + 3 < lastPage)
        ) {
            pages.push(
                <li key={`ellipsis-${page}`} className="page-item disabled">
                    <span className="page-link">...</span>
                </li>
            );
        }
    }

    return (
        <nav>
            <ul className="pagination mb-0">
                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                    <button
                        type="button"
                        className="page-link"
                        onClick={() => handleChange(currentPage - 1)}
                        disabled={disabled || currentPage === 1}
                        aria-label="Previous"
                    >
                        ‹
                    </button>
                </li>
                {pages}
                <li className={`page-item ${currentPage === lastPage ? 'disabled' : ''}`}>
                    <button
                        type="button"
                        className="page-link"
                        onClick={() => handleChange(currentPage + 1)}
                        disabled={disabled || currentPage === lastPage}
                        aria-label="Next"
                    >
                        ›
                    </button>
                </li>
            </ul>
        </nav>
    );
};

export default PaginationControls;



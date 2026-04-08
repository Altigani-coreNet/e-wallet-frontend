import React from 'react';

const Pagination = ({ currentPage, lastPage, total, perPage, onPageChange, onPerPageChange }) => {
    const handlePageChange = (page) => {
        if (page >= 1 && page <= lastPage && page !== currentPage) {
            onPageChange(page);
        }
    };

    const renderPageNumbers = () => {
        const pages = [];
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(lastPage, startPage + maxVisiblePages - 1);

        // Adjust start if we're near the end
        if (endPage - startPage < maxVisiblePages - 1) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        // First page
        if (startPage > 1) {
            pages.push(
                <li key="first" className="page-item">
                    <button
                        className="page-link"
                        onClick={() => handlePageChange(1)}
                    >
                        1
                    </button>
                </li>
            );
            if (startPage > 2) {
                pages.push(
                    <li key="dots-start" className="page-item disabled">
                        <span className="page-link">...</span>
                    </li>
                );
            }
        }

        // Page numbers
        for (let i = startPage; i <= endPage; i++) {
            pages.push(
                <li
                    key={i}
                    className={`page-item ${i === currentPage ? 'active' : ''}`}
                >
                    <button
                        className="page-link"
                        onClick={() => handlePageChange(i)}
                    >
                        {i}
                    </button>
                </li>
            );
        }

        // Last page
        if (endPage < lastPage) {
            if (endPage < lastPage - 1) {
                pages.push(
                    <li key="dots-end" className="page-item disabled">
                        <span className="page-link">...</span>
                    </li>
                );
            }
            pages.push(
                <li key="last" className="page-item">
                    <button
                        className="page-link"
                        onClick={() => handlePageChange(lastPage)}
                    >
                        {lastPage}
                    </button>
                </li>
            );
        }

        return pages;
    };

    const startItem = (currentPage - 1) * perPage + 1;
    const endItem = Math.min(currentPage * perPage, total);

    return (
        <div className="d-flex flex-stack flex-wrap pt-10">
            <div className="fs-6 fw-semibold text-gray-700">
                Showing {startItem} to {endItem} of {total} entries
            </div>

            <ul className="pagination">
                {/* Previous Button */}
                <li className={`page-item previous ${currentPage === 1 ? 'disabled' : ''}`}>
                    <button
                        className="page-link"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                    >
                        <i className="previous"></i>
                    </button>
                </li>

                {/* Page Numbers */}
                {renderPageNumbers()}

                {/* Next Button */}
                <li className={`page-item next ${currentPage === lastPage ? 'disabled' : ''}`}>
                    <button
                        className="page-link"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === lastPage}
                    >
                        <i className="next"></i>
                    </button>
                </li>
            </ul>
        </div>
    );
};

export default Pagination;


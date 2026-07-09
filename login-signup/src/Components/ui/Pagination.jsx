import React from 'react';
import '../../styles/theme.css';
import './Pagination.css';

/**
 * Pagination Component
 * 
 * @param {number} currentPage - Current page number (1-indexed)
 * @param {number} totalPages - Total number of pages
 * @param {number} totalItems - Total number of items
 * @param {number} pageSize - Items per page
 * @param {function} onPageChange - Page change handler
 */
export default function Pagination({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  pageSize = 10,
  onPageChange,
}) {
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  const handlePrev = () => {
    if (currentPage > 1) onPageChange?.(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) onPageChange?.(currentPage + 1);
  };

  return (
    <div className="ad-pagination">
      <span className="ad-pagination__meta">
        Showing {startItem}–{endItem} of {totalItems}
      </span>
      <div className="ad-pagination__controls">
        <button
          className="ad-pagination__btn"
          onClick={handlePrev}
          disabled={currentPage === 1}
          aria-label="Previous page"
        >
          ← Prev
        </button>
        <span className="ad-pagination__info">
          Page {currentPage} of {totalPages}
        </span>
        <button
          className="ad-pagination__btn"
          onClick={handleNext}
          disabled={currentPage === totalPages}
          aria-label="Next page"
        >
          Next →
        </button>
      </div>
    </div>
  );
}

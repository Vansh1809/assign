import React from 'react';
import '../../styles/theme.css';
import './Table.css';

/**
 * Table Component
 * 
 * Reusable data table with sticky headers, pagination, and loading states.
 * 
 * @param {array} columns - Column definitions: [{key, label, render?, sortable?}]
 * @param {array} data - Table rows (required)
 * @param {boolean} loading - Loading state
 * @param {number} loadingRows - Number of skeleton rows when loading (default: 5)
 * @param {string} emptyMessage - Message when table is empty
 * @param {function} onSort - Sort handler (receives column key)
 * @param {string} sortBy - Current sort column
 * @param {string} sortDir - Sort direction: 'asc' | 'desc'
 */
export default function Table({
  columns = [],
  data = [],
  loading = false,
  loadingRows = 5,
  emptyMessage = 'No data available',
  onSort,
  sortBy,
  sortDir,
}) {
  if (!loading && data.length === 0) {
    return (
      <div className="ad-table-empty">
        <p className="ad-table-empty__message">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="ad-table-wrapper">
      <table className="ad-table">
        <thead className="ad-table__head">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={col.sortable ? 'ad-table__th--sortable' : ''}
                onClick={() => col.sortable && onSort?.(col.key)}
                role={col.sortable ? 'button' : undefined}
                tabIndex={col.sortable ? 0 : undefined}
                onKeyPress={(e) => {
                  if (col.sortable && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    onSort?.(col.key);
                  }
                }}
              >
                <span className="ad-table__th-text">{col.label}</span>
                {col.sortable && sortBy === col.key && (
                  <span className="ad-table__sort-indicator" aria-hidden="true">
                    {sortDir === 'asc' ? '▲' : '▼'}
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="ad-table__body">
          {loading ? (
            // Loading skeleton rows
            Array.from({ length: loadingRows }).map((_, idx) => (
              <tr key={`skeleton-${idx}`} aria-hidden="true">
                {columns.map((col) => (
                  <td key={col.key} className="ad-table__td">
                    <div className="ad-table__skeleton" />
                  </td>
                ))}
              </tr>
            ))
          ) : (
            // Data rows
            data.map((row, rowIdx) => (
              <tr key={row.id || rowIdx}>
                {columns.map((col) => (
                  <td key={col.key} className="ad-table__td">
                    {col.render ? col.render(row[col.key], row, rowIdx) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

import React from 'react';
import '../../styles/theme.css';
import './PageHeader.css';

/**
 * PageHeader Component
 * 
 * Standardized page header for all admin pages with:
 * - Page title and subtitle
 * - Primary action buttons
 * - Refresh button
 * - Consistent spacing and layout
 * 
 * @param {string} title - Page title (required)
 * @param {string} subtitle - Page subtitle (optional)
 * @param {ReactNode} actions - Action buttons to display (optional)
 * @param {function} onRefresh - Callback for refresh button (optional)
 * @param {boolean} loading - Loading state (optional)
 */
export default function PageHeader({ title, subtitle, actions, onRefresh, loading = false }) {
  return (
    <div className="ad-page-header">
      <div className="ad-page-header__content">
        <div className="ad-page-header__title-block">
          <h1 className="ad-page-header__title">{title}</h1>
          {subtitle && <p className="ad-page-header__subtitle">{subtitle}</p>}
        </div>
        
        <div className="ad-page-header__actions">
          {onRefresh && (
            <button
              className="ad-page-header__refresh-btn"
              onClick={onRefresh}
              disabled={loading}
              aria-label="Refresh data"
              title="Refresh"
            >
              ⟳
            </button>
          )}
          {actions}
        </div>
      </div>
    </div>
  );
}

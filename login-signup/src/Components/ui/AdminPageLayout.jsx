import React from 'react';
import '../../styles/theme.css';
import './AdminPageLayout.css';

/**
 * AdminPageLayout Component
 * 
 * Standardized layout wrapper for admin pages with:
 * - Page container
 * - Consistent padding and spacing
 * - Automatic max-width and centering
 * 
 * @param {ReactNode} children - Page content
 * @param {string} className - Additional CSS classes
 */
export default function AdminPageLayout({ children, className = '' }) {
  return (
    <div className={`ad-admin-page ${className}`.trim()}>
      <div className="ad-admin-page__container">
        {children}
      </div>
    </div>
  );
}

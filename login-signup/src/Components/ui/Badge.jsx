import React from 'react';
import '../../styles/theme.css';
import './Badge.css';

/**
 * Badge Component
 * 
 * Status badges with color coding.
 * 
 * @param {string} status - Badge type: 'active' | 'inactive' | 'pending' | 'protected' | 'system' | 'success' | 'warning' | 'danger' | 'info'
 * @param {ReactNode} children - Badge content (required)
 * @param {string} icon - Icon/emoji (optional)
 * @param {string} className - Additional CSS classes
 */
export default function Badge({ status = 'info', children, icon, className = '' }) {
  const badgeClass = `ad-badge ad-badge--${status} ${className}`.trim();

  return (
    <span className={badgeClass} role="status">
      {icon && <span className="ad-badge__icon" aria-hidden="true">{icon}</span>}
      <span className="ad-badge__text">{children}</span>
    </span>
  );
}

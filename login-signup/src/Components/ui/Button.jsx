import React from 'react';
import '../../styles/theme.css';
import './Button.css';

/**
 * Button Component
 * 
 * Versatile button component with multiple variants and states.
 * 
 * @param {string} variant - Button style: 'primary' | 'success' | 'danger' | 'secondary' (default: 'secondary')
 * @param {ReactNode} children - Button content (required)
 * @param {ReactNode} icon - Icon element (optional)
 * @param {string} size - Button size: 'sm' | 'md' | 'lg' (default: 'md')
 * @param {boolean} loading - Loading state (optional)
 * @param {boolean} disabled - Disabled state (optional)
 * @param {function} onClick - Click handler (optional)
 * @param {string} className - Additional CSS classes (optional)
 * @param {...rest} props - Other HTML button attributes
 */
export default function Button({
  variant = 'secondary',
  children,
  icon,
  size = 'md',
  loading = false,
  disabled = false,
  onClick,
  className = '',
  ...rest
}) {
  const buttonClass = `ad-btn ad-btn--${variant} ad-btn--${size} ${className}`.trim();

  return (
    <button
      className={buttonClass}
      disabled={disabled || loading}
      onClick={onClick}
      aria-busy={loading}
      {...rest}
    >
      {loading ? (
        <span className="ad-btn__loading-spinner" aria-hidden="true" />
      ) : (
        <>
          {icon && <span className="ad-btn__icon" aria-hidden="true">{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
}

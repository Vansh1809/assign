import React from 'react';
import '../../styles/theme.css';
import './SearchBar.css';

/**
 * SearchBar Component
 * 
 * Search input with icon and consistent styling.
 * 
 * @param {string} placeholder - Placeholder text
 * @param {string} value - Current search value
 * @param {function} onChange - Change handler
 * @param {function} onClear - Clear button handler (optional)
 * @param {string} icon - Icon character/emoji (default: '🔍')
 * @param {string} className - Additional CSS classes
 */
export default function SearchBar({
  placeholder = 'Search...',
  value = '',
  onChange,
  onClear,
  icon = '🔍',
  className = '',
}) {
  const showClear = value && onClear;

  return (
    <div className={`ad-search-bar ${className}`.trim()}>
      <span className="ad-search-bar__icon" aria-hidden="true">{icon}</span>
      <input
        type="text"
        className="ad-search-bar__input"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        aria-label={placeholder}
      />
      {showClear && (
        <button
          type="button"
          className="ad-search-bar__clear"
          onClick={onClear}
          aria-label="Clear search"
        >
          ✕
        </button>
      )}
    </div>
  );
}

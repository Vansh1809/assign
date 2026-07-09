import React from 'react';
import '../../styles/theme.css';
import './FormField.css';

/**
 * TextArea Component
 * 
 * @param {string} label - Field label
 * @param {string} value - Current value
 * @param {function} onChange - Change handler
 * @param {string} placeholder - Placeholder text
 * @param {string} error - Error message
 * @param {boolean} required - Required indicator
 * @param {string} id - Input ID
 * @param {number} rows - Number of rows
 * @param {...rest} props - Other HTML textarea attributes
 */
export default function TextArea({
  label,
  value,
  onChange,
  placeholder,
  error,
  required = false,
  id,
  rows = 4,
  ...rest
}) {
  const textareaId = id || `textarea-${Math.random().toString(36).slice(2)}`;

  return (
    <div className="ad-form-field">
      {label && (
        <label htmlFor={textareaId} className="ad-form-field__label">
          {label}
          {required && <span className="ad-form-field__required">*</span>}
        </label>
      )}
      <textarea
        id={textareaId}
        className={`ad-form-field__input ad-form-field__textarea ${
          error ? 'ad-form-field__input--error' : ''
        }`}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        aria-invalid={!!error}
        aria-describedby={error ? `${textareaId}-error` : undefined}
        {...rest}
      />
      {error && (
        <p id={`${textareaId}-error`} className="ad-form-field__error">
          {error}
        </p>
      )}
    </div>
  );
}

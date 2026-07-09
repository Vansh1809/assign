import React from 'react';
import '../../styles/theme.css';
import './FormField.css';

/**
 * FormField Component
 * 
 * Wrapper for form inputs with label and error message.
 * 
 * @param {string} label - Field label
 * @param {string} type - Input type (text, email, password, etc.)
 * @param {string} value - Current value
 * @param {function} onChange - Change handler
 * @param {string} placeholder - Placeholder text
 * @param {string} error - Error message
 * @param {boolean} required - Required indicator
 * @param {string} id - Input ID
 * @param {...rest} props - Other HTML input attributes
 */
export default function FormField({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  required = false,
  id,
  ...rest
}) {
  const inputId = id || `field-${Math.random().toString(36).slice(2)}`;

  return (
    <div className="ad-form-field">
      {label && (
        <label htmlFor={inputId} className="ad-form-field__label">
          {label}
          {required && <span className="ad-form-field__required">*</span>}
        </label>
      )}
      <input
        id={inputId}
        type={type}
        className={`ad-form-field__input ${error ? 'ad-form-field__input--error' : ''}`}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : undefined}
        {...rest}
      />
      {error && (
        <p id={`${inputId}-error`} className="ad-form-field__error">
          {error}
        </p>
      )}
    </div>
  );
}

import React, { useEffect, useRef } from 'react';
import '../../styles/theme.css';
import './Modal.css';

/**
 * Modal Component
 * 
 * Accessible modal dialog with keyboard support and backdrop.
 * 
 * @param {boolean} open - Whether modal is open
 * @param {string} title - Modal title (required if open)
 * @param {string} description - Modal description (optional)
 * @param {function} onClose - Close handler (required)
 * @param {ReactNode} children - Modal body content
 * @param {ReactNode} footer - Modal footer content (optional)
 * @param {string} size - Modal size: 'sm' | 'md' | 'lg' (default: 'md')
 */
export default function Modal({
  open,
  title,
  description,
  onClose,
  children,
  footer,
  size = 'md',
}) {
  const panelRef = useRef(null);

  // Handle Escape key
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  // Focus management
  useEffect(() => {
    if (!open) return;
    setTimeout(() => panelRef.current?.focus?.(), 0);
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="ad-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onMouseDown={onClose}
    >
      <div
        className={`ad-modal ad-modal--${size}`}
        ref={panelRef}
        tabIndex={-1}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="ad-modal__header">
          <div>
            <h2 className="ad-modal__title">{title}</h2>
            {description && (
              <p className="ad-modal__description">{description}</p>
            )}
          </div>
          <button
            type="button"
            className="ad-modal__close"
            onClick={onClose}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <div className="ad-modal__body">{children}</div>

        {footer && <div className="ad-modal__footer">{footer}</div>}
      </div>
    </div>
  );
}

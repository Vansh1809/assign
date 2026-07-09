import React from 'react';
import '../../styles/theme.css';
import './Card.css';

/**
 * Card Component
 * 
 * Wrapper component for card-based content.
 * 
 * @param {ReactNode} children - Card content
 * @param {string} className - Additional CSS classes
 * @param {boolean} hoverable - Add hover effect
 * @param {...rest} props - Other HTML div attributes
 */
export default function Card({ children, className = '', hoverable = false, ...rest }) {
  const cardClass = `ad-card ${hoverable ? 'ad-card--hoverable' : ''} ${className}`.trim();

  return (
    <div className={cardClass} {...rest}>
      {children}
    </div>
  );
}

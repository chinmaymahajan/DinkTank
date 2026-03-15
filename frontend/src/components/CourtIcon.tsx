import React from 'react';

interface CourtIconProps {
  size?: number;
  className?: string;
}

/** Inline SVG pickleball court icon */
const CourtIcon: React.FC<CourtIconProps> = ({ size = 20, className }) => (
  <svg
    width={size}
    height={size * 0.6}
    viewBox="0 0 100 60"
    className={className}
    aria-hidden="true"
    style={{ display: 'inline-block', verticalAlign: 'middle' }}
  >
    {/* Court background */}
    <rect x="0" y="0" width="100" height="60" rx="3" fill="#1e3a5f" />
    {/* Playing surface */}
    <rect x="5" y="5" width="90" height="50" fill="#4a80b4" stroke="#fff" strokeWidth="2" />
    {/* Center net */}
    <line x1="50" y1="5" x2="50" y2="55" stroke="#fff" strokeWidth="2" />
    {/* Kitchen lines (non-volley zones) */}
    <line x1="30" y1="5" x2="30" y2="55" stroke="#fff" strokeWidth="1.5" />
    <line x1="70" y1="5" x2="70" y2="55" stroke="#fff" strokeWidth="1.5" />
    {/* Center service lines */}
    <line x1="5" y1="30" x2="30" y2="30" stroke="#fff" strokeWidth="1.5" />
    <line x1="70" y1="30" x2="95" y2="30" stroke="#fff" strokeWidth="1.5" />
  </svg>
);

export default CourtIcon;

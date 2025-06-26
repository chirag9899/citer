import React from 'react';

// Note: This logo component is for inline use only. For favicon, use a static SVG file with all colors hardcoded.

const Logo: React.FC = () => (
  <svg width="90" height="90" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" fill="none" aria-label="CITER Logo">
    <rect width="200" height="200" fill="black"/>
    <text x="30" y="100" fontFamily="Arial, sans-serif" fontWeight="bold" fontSize="90" fill="white">C</text>
    <rect x="95" y="40" width="40" height="10" fill="#FF6A00"/>
    <rect x="95" y="60" width="50" height="10" fill="#FF6A00"/>
    <rect x="95" y="80" width="60" height="10" fill="#FF6A00"/>
    <text x="50" y="150" fontFamily="Arial, sans-serif" fontSize="20" fontWeight="bold" fill="white">CITER</text>
  </svg>
);

export default Logo; 
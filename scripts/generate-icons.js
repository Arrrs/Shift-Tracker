// Simple script to create placeholder icons
// You can replace these with proper branded icons later

const fs = require('fs');
const path = require('path');

// Create a simple base64 encoded PNG placeholder
// This is a blue square with a clock icon
const icon192Base64 = 'data:image/svg+xml;base64,' + Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192" viewBox="0 0 192 192">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1d4ed8;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="192" height="192" rx="30" fill="url(#grad)"/>
  <circle cx="96" cy="96" r="55" fill="none" stroke="white" stroke-width="8"/>
  <line x1="96" y1="96" x2="96" y2="50" stroke="white" stroke-width="7" stroke-linecap="round"/>
  <line x1="96" y1="96" x2="125" y2="75" stroke="white" stroke-width="5" stroke-linecap="round"/>
  <circle cx="96" cy="96" r="4" fill="white"/>
</svg>
`).toString('base64');

const icon512Base64 = 'data:image/svg+xml;base64,' + Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1d4ed8;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="80" fill="url(#grad)"/>
  <circle cx="256" cy="256" r="150" fill="none" stroke="white" stroke-width="20"/>
  <line x1="256" y1="256" x2="256" y2="130" stroke="white" stroke-width="18" stroke-linecap="round"/>
  <line x1="256" y1="256" x2="340" y2="200" stroke="white" stroke-width="14" stroke-linecap="round"/>
  <circle cx="256" cy="256" r="12" fill="white"/>
</svg>
`).toString('base64');

console.log('PWA icon placeholders ready. For production, replace with proper branded icons.');
console.log('Icons will be served from the SVG file at /public/icon.svg');

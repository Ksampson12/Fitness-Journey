/**
 * Generate placeholder app icons for PWA
 * Run: node scripts/generate-icons.js
 * 
 * For production, replace these with properly designed icons
 */

const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

const createSVG = (size, maskable = false) => {
  const padding = maskable ? size * 0.2 : 0;
  const innerSize = size - padding * 2;
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0f172a"/>
      <stop offset="100%" style="stop-color:#1e293b"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#10b981"/>
      <stop offset="100%" style="stop-color:#06b6d4"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#bg)" rx="${size * 0.15}"/>
  <g transform="translate(${padding + innerSize * 0.2}, ${padding + innerSize * 0.2})">
    <path d="M${innerSize * 0.3} ${innerSize * 0.1} 
             L${innerSize * 0.3} ${innerSize * 0.5}
             M${innerSize * 0.15} ${innerSize * 0.25} 
             L${innerSize * 0.45} ${innerSize * 0.25}
             M${innerSize * 0.35} ${innerSize * 0.55}
             Q${innerSize * 0.5} ${innerSize * 0.45} ${innerSize * 0.5} ${innerSize * 0.3}
             Q${innerSize * 0.5} ${innerSize * 0.15} ${innerSize * 0.35} ${innerSize * 0.15}" 
          stroke="url(#accent)" 
          stroke-width="${Math.max(3, size * 0.03)}" 
          fill="none" 
          stroke-linecap="round"
          stroke-linejoin="round"/>
  </g>
</svg>`;
};

const iconsDir = path.join(__dirname, '..', 'client', 'public', 'icons');

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

sizes.forEach(size => {
  const svg = createSVG(size, false);
  fs.writeFileSync(path.join(iconsDir, `icon-${size}x${size}.svg`), svg);
  console.log(`Generated icon-${size}x${size}.svg`);
});

[192, 512].forEach(size => {
  const svg = createSVG(size, true);
  fs.writeFileSync(path.join(iconsDir, `icon-maskable-${size}x${size}.svg`), svg);
  console.log(`Generated icon-maskable-${size}x${size}.svg`);
});

console.log('\nPlaceholder icons generated!');
console.log('For production, convert these to PNG or replace with designed icons.');
console.log('You can use tools like sharp or imagemagick to convert SVG to PNG.');

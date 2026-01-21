import sharp from 'sharp';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(__dirname, '../public');

// Read the favicon SVG
const svgContent = readFileSync(resolve(publicDir, 'favicon.svg'), 'utf-8');

// Background color (dark theme - matches --background: 30 6% 9% from index.css)
const BG_COLOR = '#181614';

// Sizes needed for PWA
const sizes = [192, 512];

async function generateIcons() {
  console.log('Generating PWA icons with dark background...');
  
  for (const size of sizes) {
    // Calculate padding to center the icon (icon is 64x64 in viewBox)
    const iconSize = Math.round(size * 0.6); // Icon takes 60% of the space
    const padding = Math.round((size - iconSize) / 2);
    
    // Create SVG with background
    const svgWithBg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
        <rect width="${size}" height="${size}" fill="${BG_COLOR}" rx="${Math.round(size * 0.15)}"/>
        <g transform="translate(${padding}, ${padding}) scale(${iconSize / 64})">
          ${svgContent.replace(/<\?xml[^?]*\?>|<svg[^>]*>|<\/svg>/gi, '')}
        </g>
      </svg>
    `;
    
    await sharp(Buffer.from(svgWithBg))
      .png()
      .toFile(resolve(publicDir, `pwa-${size}x${size}.png`));
    
    console.log(`✓ Generated pwa-${size}x${size}.png`);
  }
  
  // Generate apple-touch-icon (180x180)
  const appleSize = 180;
  const appleIconSize = Math.round(appleSize * 0.6);
  const applePadding = Math.round((appleSize - appleIconSize) / 2);
  
  const appleSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${appleSize}" height="${appleSize}" viewBox="0 0 ${appleSize} ${appleSize}">
      <rect width="${appleSize}" height="${appleSize}" fill="${BG_COLOR}" rx="${Math.round(appleSize * 0.15)}"/>
      <g transform="translate(${applePadding}, ${applePadding}) scale(${appleIconSize / 64})">
        ${svgContent.replace(/<\?xml[^?]*\?>|<svg[^>]*>|<\/svg>/gi, '')}
      </g>
    </svg>
  `;
  
  await sharp(Buffer.from(appleSvg))
    .png()
    .toFile(resolve(publicDir, 'apple-touch-icon.png'));
  
  console.log('✓ Generated apple-touch-icon.png');
  
  console.log('\nAll PWA icons generated successfully!');
  console.log('\n📸 Screenshots needed (replace manually in public/):');
  console.log('   - screenshot-desktop.png: 1280x720 (wide format)');
  console.log('   - screenshot-mobile.png: 750x1334 (narrow/mobile format)');
}

generateIcons().catch(console.error);

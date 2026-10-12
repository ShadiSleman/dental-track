// Generate generic DentalTrack PNG icons from SVG
// Run: node scripts/generateIcons.js
import sharp from 'sharp'
import { createRequire } from 'module'
import path   from 'path'
import { fileURLToPath } from 'url'
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Inline SVG — tooth on navy gradient background, same as LoginPage inline logo
const svg = (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0f2244"/>
      <stop offset="100%" stop-color="#1e3a8a"/>
    </linearGradient>
  </defs>
  <!-- Background -->
  <rect width="${size}" height="${size}" rx="${size * 0.22}" fill="url(#bg)"/>
  <!-- Tooth (centered, scaled to 62% of icon) -->
  <g transform="translate(${size * 0.19}, ${size * 0.08}) scale(${size * 0.62 / 100})">
    <path d="M50 8 C32 8,16 22,16 40 C16 54,21 63,26 73 C29 81,31 94,33 105 C35 114,39 118,44 118 C48 118,50 110,50 110 C50 110,52 118,56 118 C61 118,65 114,67 105 C69 94,71 81,74 73 C79 63,84 54,84 40 C84 22,68 8,50 8Z"
      fill="white" opacity="0.95"/>
    <line x1="50" y1="90" x2="50" y2="118" stroke="rgba(37,99,235,0.4)" stroke-width="2"/>
    <line x1="50" y1="24" x2="50" y2="38" stroke="#60a5fa" stroke-width="4" stroke-linecap="round"/>
    <line x1="43" y1="31" x2="57" y2="31" stroke="#60a5fa" stroke-width="4" stroke-linecap="round"/>
  </g>
</svg>`

const PUBLIC = path.resolve(__dirname, '../public')

async function main() {
  console.log('🎨 Generating DentalTrack icons…')
  const sizes = [
    { file: 'logo-192.png',          size: 192 },
    { file: 'logo-192-maskable.png', size: 192 },
    { file: 'logo-512.png',          size: 512 },
    { file: 'logo-512-maskable.png', size: 512 },
    { file: 'favicon.png',           size: 64  },
    { file: 'favicon-32.png',        size: 32  },
  ]
  for (const { file, size } of sizes) {
    await sharp(Buffer.from(svg(size)))
      .png()
      .toFile(path.join(PUBLIC, file))
    console.log(`  ✅ ${file} (${size}×${size})`)
  }
  console.log('🎉 Done!')
}

main().catch(e => { console.error(e); process.exit(1) })

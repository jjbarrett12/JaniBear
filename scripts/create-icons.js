/**
 * Icon Generation Script
 * 
 * This script helps generate PWA icons from an existing logo.
 * 
 * Requirements:
 * - Node.js
 * - sharp package: npm install sharp
 * 
 * Usage:
 * node scripts/create-icons.js [path-to-logo]
 * 
 * Example:
 * node scripts/create-icons.js public/janibear-logo.png
 */

const fs = require('fs');
const path = require('path');

async function generateIcons(logoPath) {
  try {
    // Check if sharp is available
    let sharp;
    try {
      sharp = require('sharp');
    } catch (e) {
      console.error('❌ Error: sharp package not found.');
      console.log('📦 Install it with: npm install sharp');
      console.log('\n📝 Manual Instructions:');
      console.log('1. Open your logo in an image editor');
      console.log('2. Create square versions:');
      console.log('   - 512x512 pixels → save as public/icon-512.png');
      console.log('   - 192x192 pixels → save as public/icon-192.png');
      console.log('3. Ensure icons have transparent or solid background');
      return;
    }

    if (!fs.existsSync(logoPath)) {
      console.error(`❌ Logo not found: ${logoPath}`);
      console.log('\n💡 Place your logo in the public folder and run:');
      console.log(`   node scripts/create-icons.js ${logoPath}`);
      return;
    }

    const publicDir = path.join(process.cwd(), 'public');
    const sizes = [
      { size: 192, name: 'icon-192.png' },
      { size: 512, name: 'icon-512.png' },
    ];

    console.log('🎨 Generating PWA icons...\n');

    for (const { size, name } of sizes) {
      const outputPath = path.join(publicDir, name);
      
      await sharp(logoPath)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .png()
        .toFile(outputPath);

      console.log(`✅ Created ${name} (${size}x${size})`);
    }

    console.log('\n✨ Icons generated successfully!');
    console.log('📱 Icons are ready for PWA installation.');
    
  } catch (error) {
    console.error('❌ Error generating icons:', error.message);
    console.log('\n📝 Manual Instructions:');
    console.log('1. Use an online tool like favicon.io or realfavicongenerator.net');
    console.log('2. Or use image editing software to create:');
    console.log('   - public/icon-192.png (192x192)');
    console.log('   - public/icon-512.png (512x512)');
  }
}

// Get logo path from command line or use default
const logoPath = process.argv[2] || 'public/janibear-logo.png';
generateIcons(logoPath);

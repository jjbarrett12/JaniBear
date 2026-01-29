# Icon Generation Guide

## Required Icons

You need to create two icon files in the `/public` directory:
- `icon-192.png` - 192x192 pixels
- `icon-512.png` - 512x512 pixels

## Option 1: Using Online Tools

### Recommended Tools:
1. **Favicon.io** (https://favicon.io/)
   - Upload your logo
   - Generate all sizes automatically
   - Download and place in `/public`

2. **RealFaviconGenerator** (https://realfavicongenerator.net/)
   - Upload your logo
   - Configure for PWA
   - Download generated files

3. **PWA Asset Generator** (https://github.com/onderceylan/pwa-asset-generator)
   - Command-line tool
   - Generates all required sizes

## Option 2: Using Image Editing Software

1. Open your logo in Photoshop, GIMP, or similar
2. Create a square canvas (512x512 for the large icon)
3. Center your logo with padding
4. Export as PNG:
   - `icon-512.png` at 512x512
   - `icon-192.png` at 192x192 (resize from 512x512)

## Option 3: Using Your Existing Logo

If you have `/public/janibear-logo.png`:

1. Use an online resizer or image editor
2. Create square versions with transparent or colored background
3. Ensure icons are recognizable at small sizes
4. Save as PNG with transparency

## Icon Design Guidelines

### Best Practices:
- **Simple & Recognizable**: Should be clear at small sizes
- **Square Format**: Icons should be square (1:1 aspect ratio)
- **Padding**: Leave 10-20% padding around edges
- **Colors**: Use your brand colors
- **No Text**: Avoid small text that won't be readable
- **High Contrast**: Ensure visibility on various backgrounds

### Technical Requirements:
- Format: PNG with transparency (or solid background)
- Size: Exactly 192x192 and 512x512 pixels
- File size: Keep under 500KB each
- Colors: sRGB color space

## Quick Start (Using Node.js)

If you have ImageMagick installed:

```bash
# Convert existing logo to icons
convert janibear-logo.png -resize 512x512 -background white -gravity center -extent 512x512 public/icon-512.png
convert janibear-logo.png -resize 192x192 -background white -gravity center -extent 192x192 public/icon-192.png
```

## Verification

After creating icons, verify:
1. Files exist in `/public/icon-192.png` and `/public/icon-512.png`
2. Files are correct dimensions (check file properties)
3. Icons display correctly in browser
4. PWA install shows correct icon

## Testing

1. Open your app in browser
2. Check browser console for icon loading errors
3. Try installing as PWA
4. Verify icon appears in app launcher/home screen

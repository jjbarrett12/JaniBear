# App Icon Creation Guide

## Required Icons

You need to create two icon files in the `/public` directory:

1. **icon-192.png** - 192x192 pixels
2. **icon-512.png** - 512x512 pixels

## Icon Requirements

### Design Guidelines
- **Format**: PNG with transparency
- **Shape**: Square (will be automatically masked on devices)
- **Content**: Your Janibear logo or company logo
- **Background**: Transparent or solid color
- **Padding**: Leave 10-15% padding around edges for safe area

### Technical Specs
- **icon-192.png**: 192x192 pixels, optimized for small displays
- **icon-512.png**: 512x512 pixels, high resolution for app stores
- **Format**: PNG-24 with alpha channel
- **File Size**: Keep under 500KB each

## Quick Creation Options

### Option 1: Online Tools
1. Visit https://realfavicongenerator.net/
2. Upload your logo
3. Generate all sizes
4. Download and place in `/public`

### Option 2: Image Editor
1. Open your logo in Photoshop/GIMP/Figma
2. Create 192x192 and 512x512 canvases
3. Center your logo with padding
4. Export as PNG
5. Save to `/public` as `icon-192.png` and `icon-512.png`

### Option 3: Command Line (if you have ImageMagick)
```bash
# Convert existing logo to icons
convert logo.png -resize 192x192 public/icon-192.png
convert logo.png -resize 512x512 public/icon-512.png
```

## Testing Icons

After creating icons:
1. Restart your dev server
2. Open browser DevTools → Application → Manifest
3. Verify icons are loading
4. Check icon previews

## Apple Touch Icons (Optional)

For better iOS support, also create:
- `apple-touch-icon.png` (180x180)

Add to `src/app/layout.tsx`:
```tsx
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
```

---

**Note**: Icons are required for PWA installation. The app will work without them, but installation prompts may not appear.

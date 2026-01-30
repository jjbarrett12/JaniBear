# Favicon Setup - Bear Head from Logo

## Quick Setup

To use the bear head from your logo as the favicon:

1. **Open your logo** (`janibear-logo.png`) in an image editor (Photoshop, GIMP, Figma, or online tool)

2. **Crop the bear head** portion from the logo (the geometric bear icon on the left side)

3. **Create these files** in the `/public` directory:

   - **favicon.ico** - 32x32 pixels (or 16x16, 48x48 multi-size ICO)
   - **favicon.png** - 32x32 pixels (PNG fallback)
   - **apple-touch-icon.png** - 180x180 pixels (for iOS)

4. **Save them** to `/public/` with these exact names:
   - `favicon.ico`
   - `favicon.png`
   - `apple-touch-icon.png`

## Online Tools

- **Favicon Generator**: https://realfavicongenerator.net/
  - Upload your logo
  - Crop to the bear head
  - Generate all sizes
  - Download and place in `/public`

- **ICO Converter**: https://convertio.co/png-ico/
  - Convert your PNG to ICO format

## Manual Creation

### Using ImageMagick (command line):
```bash
# Extract bear head from logo and create favicon sizes
convert janibear-logo.png -crop 100x100+0+0 -resize 32x32 public/favicon.png
convert public/favicon.png public/favicon.ico
convert janibear-logo.png -crop 100x100+0+0 -resize 180x180 public/apple-touch-icon.png
```

### Using Photoshop/GIMP:
1. Open `janibear-logo.png`
2. Select the bear head portion
3. Crop to square (centered on bear head)
4. Resize to 32x32 → Save as `favicon.png`
5. Export as ICO → Save as `favicon.ico`
6. Resize to 180x180 → Save as `apple-touch-icon.png`

## Testing

After creating the files:
1. Restart your dev server
2. Check browser tab - favicon should appear
3. Test on mobile - Apple touch icon should work

## Current Setup

The layout (`src/app/layout.tsx`) is already configured to use:
- `/favicon.ico` - Standard favicon
- `/favicon.png` - PNG fallback
- `/apple-touch-icon.png` - iOS home screen icon

Just create these files from the bear head portion of your logo!

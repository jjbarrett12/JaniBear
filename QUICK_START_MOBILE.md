# Quick Start: Mobile App & Icons

## 🎯 Immediate Actions

### 1. Create App Icons (5 minutes)

**Easiest Method:**
1. Go to https://favicon.io/favicon-generator/
2. Upload your logo OR create text-based icon
3. Download the package
4. Copy these files to `/public`:
   - `android-chrome-192x192.png` → rename to `icon-192.png`
   - `android-chrome-512x512.png` → rename to `icon-512.png`

**Or use your existing logo:**
1. Go to https://www.iloveimg.com/resize-image
2. Upload `public/janibear-logo.png`
3. Resize to 512x512 (maintain aspect ratio)
4. Download as `icon-512.png`
5. Repeat for 192x192 → `icon-192.png`
6. Place both in `/public`

### 2. Verify Icons

```bash
# Check files exist
ls -la public/icon-*.png

# Should see:
# public/icon-192.png
# public/icon-512.png
```

### 3. Test PWA Installation

1. **Start your dev server**:
   ```bash
   npm run dev
   ```

2. **Open in Chrome**:
   - Navigate to `http://localhost:3000`
   - Look for install icon in address bar
   - Or: Menu (3 dots) → "Install Janibear"

3. **Test on Mobile**:
   - Open on your phone's browser
   - Look for "Add to Home Screen" prompt
   - Or: Share → "Add to Home Screen"

## 📱 Mobile Device Testing

### iOS Testing (iPhone/iPad)

1. **Connect device to Mac**
2. **Enable Web Inspector**:
   - iPhone: Settings → Safari → Advanced → Web Inspector
   - Mac: Safari → Preferences → Advanced → Show Develop menu
3. **Open app on iPhone**
4. **Debug on Mac**: Safari → Develop → [Your iPhone] → [Your App]

### Android Testing

1. **Enable USB Debugging**:
   - Settings → About Phone → Tap "Build Number" 7 times
   - Settings → Developer Options → USB Debugging
2. **Connect to computer**
3. **Open Chrome on computer**
4. **Navigate to**: `chrome://inspect`
5. **Select your device** and open your app

## 🚀 React Native App Setup (Future)

### When Ready to Build Native App:

1. **Create Expo project**:
   ```bash
   npx create-expo-app@latest janibear-mobile
   cd janibear-mobile
   ```

2. **Install dependencies**:
   ```bash
   npm install @supabase/supabase-js @react-navigation/native expo-camera expo-location
   ```

3. **Start development**:
   ```bash
   npm start
   ```

4. **Run on device**:
   - Scan QR code with Expo Go app
   - Or: `npm run ios` / `npm run android`

### Code Sharing Strategy

**Recommended: Monorepo**
```
janibear/
├── apps/
│   ├── web/          # Your Next.js app
│   └── mobile/       # React Native app
├── packages/
│   └── shared/       # Shared code
└── package.json
```

**Shared Code:**
- Business logic
- API services (Supabase)
- Utilities
- Types
- Validation schemas

**Platform-Specific:**
- UI components
- Navigation
- Native features

## ✅ Testing Checklist

### Icons
- [ ] `icon-192.png` exists (192x192)
- [ ] `icon-512.png` exists (512x512)
- [ ] Icons display in browser
- [ ] Icons appear in PWA install

### PWA
- [ ] Install prompt appears
- [ ] App installs successfully
- [ ] Standalone mode works
- [ ] Icons show correctly
- [ ] Offline caching works

### Mobile Web
- [ ] Hamburger menu works
- [ ] Bottom navigation works
- [ ] Forms are touch-friendly
- [ ] Camera access works
- [ ] No horizontal scroll
- [ ] Safe area respected

### Native App (Future)
- [ ] Expo project created
- [ ] Navigation set up
- [ ] Supabase connected
- [ ] Core screens built
- [ ] Native features working

## 🐛 Troubleshooting

### Icons not showing?
- Check file names match manifest exactly
- Verify files are in `/public` folder
- Clear browser cache
- Check file sizes are correct

### PWA not installing?
- Must use HTTPS (or localhost)
- Check manifest.json is valid
- Verify service worker registered
- Ensure all icons exist

### Mobile layout issues?
- Test on actual device (not just emulator)
- Check viewport meta tag
- Verify responsive breakpoints
- Test in both orientations

## 📚 Resources

- **Icon Generation**: https://favicon.io/
- **PWA Testing**: Chrome DevTools → Application tab
- **Expo Docs**: https://docs.expo.dev/
- **React Navigation**: https://reactnavigation.org/
- **Supabase Mobile**: https://supabase.com/docs/guides/getting-started/tutorials/with-expo-react-native

---

**You're all set!** 🎉

1. Create icons (5 min)
2. Test PWA installation
3. Test on mobile devices
4. When ready, start React Native app

See `REACT_NATIVE_SETUP.md` for detailed mobile app development guide.

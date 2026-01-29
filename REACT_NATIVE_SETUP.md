# React Native App Setup Guide

## 🎯 Overview

This guide will help you create a React Native mobile app that shares code and patterns with your Next.js web app.

## 📦 Recommended Approach: Expo + React Native

### Why Expo?
- ✅ Share business logic with web
- ✅ Easy deployment
- ✅ Built-in camera, GPS, notifications
- ✅ Over-the-air updates
- ✅ No native code required initially

## 🚀 Setup Steps

### 1. Install Expo CLI

```bash
npm install -g expo-cli
# or
npx create-expo-app@latest janibear-mobile
```

### 2. Project Structure

```
janibear-mobile/
├── src/
│   ├── components/        # Shared UI components
│   ├── screens/          # Mobile screens
│   ├── navigation/       # React Navigation
│   ├── services/         # API services (shared with web)
│   ├── hooks/           # Custom hooks
│   └── utils/           # Shared utilities
├── assets/              # Images, fonts
├── app.json            # Expo config
└── package.json
```

### 3. Shared Code Strategy

#### Option A: Monorepo (Recommended)
```
janibear/
├── apps/
│   ├── web/           # Next.js app
│   └── mobile/        # React Native app
├── packages/
│   ├── shared/        # Shared code
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── utils/
│   │   └── services/
│   └── types/         # TypeScript types
└── package.json
```

#### Option B: Separate Repos with Shared Package
- Publish shared code as npm package
- Import in both web and mobile apps

### 4. Key Dependencies

```json
{
  "dependencies": {
    "@react-navigation/native": "^6.x",
    "@react-navigation/bottom-tabs": "^6.x",
    "@react-navigation/stack": "^6.x",
    "@supabase/supabase-js": "^2.x",
    "expo": "~50.x",
    "expo-camera": "~14.x",
    "expo-location": "~16.x",
    "expo-notifications": "~0.27.x",
    "react-native": "0.73.x",
    "react-native-gesture-handler": "~2.x",
    "react-native-reanimated": "~3.x",
    "react-native-safe-area-context": "~4.x"
  }
}
```

## 🎨 Component Sharing Strategy

### Web Components → Mobile Components

#### Example: Button Component

**Web (Next.js):**
```tsx
// src/components/ui/button.tsx
export function Button({ children, ...props }) {
  return <button className="..." {...props}>{children}</button>
}
```

**Mobile (React Native):**
```tsx
// src/components/ui/button.tsx
import { TouchableOpacity, Text } from 'react-native';

export function Button({ children, ...props }) {
  return (
    <TouchableOpacity style={styles.button} {...props}>
      <Text style={styles.text}>{children}</Text>
    </TouchableOpacity>
  );
}
```

### Shared Business Logic

**Shared Service:**
```typescript
// packages/shared/services/supabase.ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

// Shared functions
export async function getLocations(orgId: string) {
  return supabase
    .from('locations')
    .select('*')
    .eq('org_id', orgId);
}
```

## 📱 Mobile-Specific Features

### 1. Navigation

```typescript
// src/navigation/AppNavigator.tsx
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

const Tab = createBottomTabNavigator();

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator>
        <Tab.Screen name="Dashboard" component={DashboardScreen} />
        <Tab.Screen name="Inspections" component={InspectionsScreen} />
        <Tab.Screen name="Issues" component={IssuesScreen} />
        <Tab.Screen name="Locations" component={LocationsScreen} />
        <Tab.Screen name="Settings" component={SettingsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
```

### 2. Camera Integration

```typescript
// src/screens/InspectionCameraScreen.tsx
import { Camera } from 'expo-camera';

export function InspectionCameraScreen() {
  const [hasPermission, setHasPermission] = useState(null);
  const cameraRef = useRef(null);

  const takePicture = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync();
      // Upload to Supabase Storage
    }
  };

  return (
    <Camera
      ref={cameraRef}
      style={styles.camera}
      type={Camera.Constants.Type.back}
    >
      <Button onPress={takePicture}>Capture</Button>
    </Camera>
  );
}
```

### 3. GPS/Location

```typescript
// src/hooks/useLocation.ts
import * as Location from 'expo-location';

export function useLocation() {
  const [location, setLocation] = useState(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setLocation(location);
      }
    })();
  }, []);

  return location;
}
```

### 4. Push Notifications

```typescript
// src/services/notifications.ts
import * as Notifications from 'expo-notifications';

export async function registerForPushNotifications() {
  const { status } = await Notifications.requestPermissionsAsync();
  
  if (status === 'granted') {
    const token = await Notifications.getExpoPushTokenAsync();
    // Send token to your backend
    return token;
  }
}
```

## 🎯 Screen Mapping

### Web Routes → Mobile Screens

| Web Route | Mobile Screen | Component |
|-----------|--------------|-----------|
| `/app/dashboard` | `DashboardScreen` | `src/screens/DashboardScreen.tsx` |
| `/app/inspections` | `InspectionsScreen` | `src/screens/InspectionsScreen.tsx` |
| `/app/inspections/start` | `StartInspectionScreen` | `src/screens/StartInspectionScreen.tsx` |
| `/app/issues` | `IssuesScreen` | `src/screens/IssuesScreen.tsx` |
| `/app/locations` | `LocationsScreen` | `src/screens/LocationsScreen.tsx` |
| `/app/tasks` | `TasksScreen` | `src/screens/TasksScreen.tsx` |
| `/app/settings` | `SettingsScreen` | `src/screens/SettingsScreen.tsx` |

## 🔄 State Management

### Option 1: React Context (Simple)
```typescript
// src/context/AppContext.tsx
export const AppContext = createContext();

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [org, setOrg] = useState(null);
  
  return (
    <AppContext.Provider value={{ user, org, setUser, setOrg }}>
      {children}
    </AppContext.Provider>
  );
}
```

### Option 2: Zustand (Recommended)
```typescript
// src/store/useAuthStore.ts
import create from 'zustand';

export const useAuthStore = create((set) => ({
  user: null,
  org: null,
  setUser: (user) => set({ user }),
  setOrg: (org) => set({ org }),
}));
```

## 📦 Shared Packages Structure

```
packages/shared/
├── components/
│   ├── Button/
│   │   ├── Button.web.tsx
│   │   ├── Button.native.tsx
│   │   └── index.ts
│   └── Card/
├── hooks/
│   ├── useAuth.ts
│   ├── useLocations.ts
│   └── useInspections.ts
├── services/
│   ├── supabase.ts
│   ├── locations.ts
│   └── inspections.ts
├── utils/
│   ├── formatDate.ts
│   └── validation.ts
└── types/
    └── index.ts
```

## 🚀 Development Workflow

### 1. Start Development Server
```bash
cd janibear-mobile
npm start
# or
expo start
```

### 2. Run on Device
```bash
# iOS
expo start --ios

# Android
expo start --android

# Web (for testing)
expo start --web
```

### 3. Build for Production
```bash
# iOS
eas build --platform ios

# Android
eas build --platform android
```

## 📱 Mobile-Specific Optimizations

### 1. Offline Support
- Use React Query with offline persistence
- Local SQLite database (expo-sqlite)
- Sync when online

### 2. Performance
- Use React.memo for expensive components
- Implement virtual lists (FlatList)
- Lazy load screens
- Optimize images

### 3. Native Features
- Biometric authentication
- Background location tracking
- Push notifications
- File system access

## 🔐 Authentication Flow

```typescript
// src/screens/LoginScreen.tsx
import { useAuthStore } from '@/store/useAuthStore';
import { supabase } from '@/services/supabase';

export function LoginScreen() {
  const { setUser } = useAuthStore();
  
  const handleLogin = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (data.user) {
      setUser(data.user);
      // Navigate to dashboard
    }
  };
  
  // Render login form
}
```

## 📊 Analytics & Monitoring

### Recommended Tools:
- **Sentry**: Error tracking
- **Amplitude/Mixpanel**: User analytics
- **Firebase Analytics**: Usage metrics

## 🧪 Testing

### Unit Tests
```bash
npm install --save-dev jest @testing-library/react-native
```

### E2E Tests
```bash
npm install --save-dev detox
```

## 📝 Next Steps

1. **Set up Expo project**
   ```bash
   npx create-expo-app@latest janibear-mobile
   ```

2. **Install dependencies**
   ```bash
   cd janibear-mobile
   npm install @supabase/supabase-js @react-navigation/native expo-camera
   ```

3. **Set up navigation**
   - Install React Navigation
   - Create navigator structure
   - Map web routes to screens

4. **Share code**
   - Set up monorepo or shared package
   - Extract shared utilities
   - Create platform-specific components

5. **Implement screens**
   - Start with authentication
   - Build dashboard
   - Add inspection flow
   - Implement camera integration

6. **Test on devices**
   - iOS Simulator
   - Android Emulator
   - Physical devices

## 🎯 Key Differences: Web vs Mobile

| Feature | Web | Mobile |
|---------|-----|--------|
| Navigation | Next.js Router | React Navigation |
| Styling | Tailwind CSS | StyleSheet / Styled Components |
| Forms | React Hook Form | React Hook Form (same!) |
| Images | Next.js Image | Expo Image |
| Storage | Supabase Storage | Supabase Storage + Local |
| Notifications | Web Push | Expo Notifications |
| Camera | HTML Input | Expo Camera |

## 💡 Best Practices

1. **Code Sharing**: Share business logic, not UI
2. **Platform Detection**: Use Platform.OS for platform-specific code
3. **Performance**: Optimize for mobile constraints
4. **UX**: Follow platform design guidelines (iOS HIG, Material Design)
5. **Testing**: Test on real devices, not just simulators

---

**Ready to build your React Native app!** 🚀📱

Start with Expo, share your business logic, and create a native experience that matches your web app.

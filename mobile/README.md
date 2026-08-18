# NutriAI Mobile App (React Native / Expo)

Standalone mobile application for NutriAI built with React Native (Expo) in pure JavaScript (`.js` / `.jsx`).

## 🚀 Installation & Setup

### 1. Install Dependencies
In Node.js / React Native, dependencies are managed via `package.json`. Run:

```bash
cd mobile
npm install
```

Or install all core packages manually:

```bash
npm install @react-navigation/native @react-navigation/bottom-tabs @react-navigation/native-stack react-native-screens react-native-safe-area-context @react-native-async-storage/async-storage lucide-react-native react-native-svg expo-image-picker axios --legacy-peer-deps
```

### 2. Environment Configuration
Create or edit `.env` inside `mobile/`:

```env
EXPO_PUBLIC_API_URL=http://10.0.2.2:8000
```
- For **Android Emulator**: `http://10.0.2.2:8000`
- For **Physical Phone**: `http://<YOUR_LOCAL_IP>:8000` (e.g. `http://192.168.1.100:8000`)

### 3. Start Development Server

```bash
npx expo start
```

- Press `a` to open in Android Emulator
- Press `i` to open in iOS Simulator (macOS only)
- Scan QR code with **Expo Go** app on your physical mobile device

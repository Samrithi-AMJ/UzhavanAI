# UzhavanAI Mobile App Guide

UzhavanAI supports two ways to run on your mobile device:
1. **PWA (Instant Mobile App — No APK, No Android Studio needed)** ⭐️ *(Recommended for instant testing)*
2. **Capacitor Native Android APK**

---

## ⚡ Method 1: Instant Mobile Install (No APK Needed — Via PWA)

Since the dev server is running on your laptop, `localhost` only exists on the laptop. To download/install the app directly onto your mobile phone:

### Step 1: Connect Phone to the Same Wi-Fi
Ensure your mobile phone and your laptop are connected to the **same Wi-Fi network**.

### Step 2: Open the URL in Your Mobile Browser
Open **Google Chrome** (on Android) or **Safari** (on iPhone) on your phone, and visit:
```text
http://172.16.160.32:5173
```
*(Your laptop's current local Wi-Fi IP is `172.16.160.32`).*

### Step 3: Install onto Your Home Screen
- **On Android (Google Chrome)**:
  - Tap the green **"Install UzhavanAI App"** banner at the bottom of the screen.
  - Or tap Chrome's **3 dots (⋮)** menu at top-right ➔ tap **"Add to Home screen"** or **"Install app"**.
  - Tap **Install**.
- **On iPhone (Safari)**:
  - Tap the **Share** button (the square with an arrow pointing up at the bottom).
  - Scroll down and tap **"Add to Home Screen"**.
  - Tap **Add** at the top right.

The **UzhavanAI** app icon will now appear on your phone's home screen. Tapping it opens full-screen without browser address bars!

> [!TIP]
> **Enabling Microphone & Camera over Wi-Fi on Android**:
> Mobile browsers restrict microphone and camera access on plain HTTP local network IPs. If your phone asks for a secure context:
> 1. In mobile Chrome, open: `chrome://flags`
> 2. Search for: `Insecure origins treated as secure`
> 3. Enter: `http://172.16.160.32:5173,http://172.16.160.32:8787`
> 4. Switch the dropdown to **Enabled** and tap **Relaunch**.

---

## 📱 Method 2: Capacitor Native Android APK (Optional)

1. **Capacitor Core & Android Platform**:
   - Configuration file: [`capacitor.config.ts`](./capacitor.config.ts)
   - Native Android project directory: [`android/`](./android/)
2. **Native Hardware Permissions** configured in [`AndroidManifest.xml`](./android/app/src/main/AndroidManifest.xml):
   - 🎤 **Microphone & Audio**: `RECORD_AUDIO`, `MODIFY_AUDIO_SETTINGS` (for the AI voice search & TTS read aloud)
   - 📷 **Camera**: `CAMERA` (for the crop disease photo scanner)
   - 📍 **GPS & Location**: `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION` (for weather forecasts and farm boundary mapping)
   - 🌐 **Network**: `INTERNET`
3. **Automated Sync Workflow Scripts**:
   - `npm run mobile:sync`: Rebuilds the frontend and syncs all assets into the native Android project.
   - `npm run mobile:open`: Opens the native project directly inside Android Studio.

---

## 🚀 How to Build the Android APK (Step-by-Step)

### Step 1: Open the Project in Android Studio
Run the following command in your terminal:
```bash
npm run mobile:open
```
*(Or launch Android Studio and choose **Open an existing project**, then select the `android` folder inside this repository).*

### Step 2: Let Gradle Sync
When Android Studio opens the project for the first time, it will automatically download the necessary Android Gradle plugins and SDK dependencies.

### Step 3: Generate the APK
- In the top menu of Android Studio, click:
  **Build** ➔ **Build Bundle(s) / APK(s)** ➔ **Build APK(s)**.
- Once finished, a notification popup will appear at the bottom right with a **"locate"** link.
- Click **locate** to find your compiled APK file:
  `android/app/build/outputs/apk/debug/app-debug.apk`

### Step 4: Install and Test on a Mobile Device
- Connect your Android phone to your computer via USB (with **USB Debugging** enabled in Developer Options).
- Press the green **Run (▶)** button in Android Studio, or transfer the `.apk` file to your phone and tap to install!

---

## 🌐 Connecting to the Backend from a Physical Phone

When testing on a physical phone:
1. `localhost` refers to the phone itself, not your PC.
2. Ensure your computer and phone are connected to the same Wi-Fi network.
3. Update `.env` (or run your dev servers with host `0.0.0.0`):
   ```env
   VITE_BACKEND_URL=http://<YOUR_PC_LOCAL_IP>:8787
   ```
   *(Find your IP by running `ipconfig` on Windows, e.g. `192.168.1.5`)*.
4. Run `npm run mobile:sync` after changing `.env`.
5. For production release, deploy the backend (`server/index.js` and `ai-service`) to a cloud host (Render, Railway, Fly.io, etc.) and set `VITE_BACKEND_URL` to your live domain.

---

## 🍎 Want an iOS App as Well?

To add iOS support (requires a Mac with Xcode):
```bash
npm install -D @capacitor/ios
npx cap add ios
npx cap open ios
```

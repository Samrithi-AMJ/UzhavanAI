# UzhavanAI — Instant Mobile App (No APK Needed)

UzhavanAI has been configured as a **Progressive Web App (PWA)**. 

This means **you do NOT need to build an APK, install Android Studio, or sign any app**. Anyone can install it directly onto their Android phone or iPhone straight from their mobile browser with one tap.

---

## 🌟 How It Works

1. **Standalone Fullscreen Experience**:  
   When opened from the phone's home screen, it runs without any browser URL bar or navigation buttons — looking and behaving **100% like a native mobile app**.
2. **Hardware Features Active**:  
   - 🎤 **Voice Search & TTS**: Works with the phone's microphone and speaker.
   - 📷 **Crop Disease Camera**: Opens the phone's native camera or gallery.
   - 📍 **Farm GPS & Weather**: Uses the phone's GPS for location and farm boundaries.
3. **Zero Storage Clutter**:  
   Installs in under 2 seconds, updates automatically whenever code changes, and requires no APK downloading or "Unknown Sources" security warnings.

---

## 📲 How to Install on Your Phone Right Now (Local Testing)

### Step 1: Connect Phone & PC to the Same Wi-Fi
Make sure your computer and mobile phone are connected to the same Wi-Fi router or hotspot.

### Step 2: Find Your PC's Local IP Address
Open PowerShell or Command Prompt on your PC and run:
```powershell
ipconfig
```
Look for **IPv4 Address** (for example: `192.168.1.15`).

### Step 3: Run the Vite Dev Server with `--host`
In your terminal, start the frontend exposed to your network:
```powershell
npm run dev -- --host
```
Vite will show a Network URL like:  
`http://192.168.1.15:5173/`

### Step 4: Open and Install on Phone

#### On Android (Chrome / Brave / Edge / Samsung Internet):
1. Open the Network URL in your mobile browser: `http://<YOUR_PC_IP>:5173`
2. You will see the **"Install UzhavanAI App"** banner at the bottom.
3. Tap **"Install"** (or tap the 3-dots browser menu ➔ **"Install App"** / **"Add to Home Screen"**).
4. UzhavanAI is now installed on your home screen! Tap the green sprout icon to open it full screen.

#### On iPhone (Apple Safari):
1. Open the URL in Safari: `http://<YOUR_PC_IP>:5173`
2. Tap the **Share** button (box with arrow pointing up ⬆️ at the bottom).
3. Scroll down and tap **"Add to Home Screen"** (➕).
4. Tap **"Add"** in the top right.
5. The UzhavanAI icon is now on your iPhone home screen!

---

## 🌐 Deploying to the Web (Free & Works Anywhere)

For people to install it from anywhere without needing your PC:
1. Deploy the frontend to **Vercel**, **Netlify**, or **Cloudflare Pages** for free.
2. Share your link (e.g. `https://uzhavan-ai.vercel.app`).
3. Anyone opening the link on their phone will see the **"Install App"** prompt and can install it instantly without an APK!

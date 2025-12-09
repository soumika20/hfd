# REACH 

R.E.A.C.H. (Rapid Emergency, Access, Care, and Help Anytime, Anywhere) is a human-centered emergency response system designed to bridge the critical gap before first responders arrive. The platform allows bystanders to report incidents through images, videos and location data while automatically generating AI-based summaries for dispatchers as well as bystanders. It also notifies nearby volunteers, provides routing to emergency services, displays weather and government alerts, and supports communication even in low-connectivity conditions.

This repository contains the complete codebase for the web application and mobile-adapted interface, including frontend components, backend integrations with Firebase, and the AI processing pipeline. The project was developed as part of the Human Factors in Design course (ED3010).

By Team 13 <br>
Karthiga, Soumika, Vibhaa

---

Deployment: https://reach-hfd.vercel.app/ <br>
check the above uploaded files for the Android APK
On Android, every time you open the app, tap the map icon and press “Grant Permission” on the pop-up to allow location access.
Check the reach_llm folder for llm files

## Contributions

| Member     | Key Responsibilities                                      
|------------|-----------------------------------------------------------
| Soumika    | Frontend UI/UX, React frontend, Firebase integration,TailwindCSS, Vercel deployment, Android APK 
| Karthiga   | Frontend UI/UX, React frontend, Google Maps integration, AI incident summarization and fake media detection
| Vibhaa     | LLM prompt engineering, AI fake media detection    
---

## 🚨 Important Notice

Please contact emergency services **only in genuine emergency situations**.

This platform is a prototype and has been done as a course project (ED3010 - Human factors in Design).

---

## Getting Started - Local Development Setup

Follow these instructions to run the project on your laptop.

Before you begin, ensure you have the following installed on your system:
- **Node.js** (v14 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn** (instructions here are given for npm)
- **Git** - [Download here](https://git-scm.com/)
- **Visual Studio Code** (recommended) - [Download here](https://code.visualstudio.com/)

### Step 1: Clone the Repository
```bash
git clone https://github.com/soumika20/hfd.git
cd hfd
```

### Step 2: Open in VS Code

Open VS Code
File → Open Folder → Select the hfd folder

### Step 3: Install Dependencies
Open a new terminal in VS Code - Command prompt (default powershell throws permission errors)
In the terminal (Ctrl + `): 
```bash
npm install
```
This will install all required packages including:
- `react` - Frontend framework
- `react-dom` - React DOM rendering
- `react-leaflet` - Map components
- `leaflet` - Mapping library
- `lucide-react` - Icon library
- `firebase` - Backend services (Firestore, Storage, Auth)
- `@capacitor/core` - Native app capabilities
- `@capacitor/geolocation` - Location services
- `@capacitor/push-notifications` - Push notifications
- `@capacitor/local-notifications` - Local notifications


### 4. Run the Development Server

Start the app in development mode:
```bash
npm start
```

The app will open automatically in your browser at `http://localhost:3000`

**What you should see:**
- The app splash screen with R.E.A.C.H logo
- Home screen with emergency services options
- Map showing your current location (after granting permission)

### 5. Build for Production

To create an optimized production build:
```bash
npm run build
```

This creates a `build` folder with production-ready files.


## Available Scripts

- `npm start` - Runs development server
- `npm run build` - Creates production build
- `npm test` - Runs tests
- `npm run eject` - Ejects from Create React App (irreversible)

## Project Structure
```
reach_emergency_ai_dispatch/
├── android/              # Android native files (Capacitor)
├── public/              # Static files
│   ├── index.html
│   └── emergency procedure images/
├── src/
│   ├── App.js          # Main application component
│   └── index.js        # Entry point
├── .env.local          # Environment variables (create this)
├── .firebaserc         # Firebase project config
├── firebase.json       # Firebase hosting config
├── firestore.rules     # Firestore security rules
├── firestore.indexes.json
└── package.json        # Dependencies and scripts
```

## Getting Started with the Reach LLM project

### Step 1: Install Dependencies (If Not Done)

In your terminal (Command Prompt or VS Code integrated terminal):
```bash
npm install
```

* This installs React, TypeScript, Vite, and other packages from package.json.
* If it fails (e.g., due to cache), try: `npm install --legacy-peer-deps` or clear cache: `npm cache clean --force`.

### Step 2: Run the Development Server

Instead of npm start, use:
```bash
npm run dev
```

* **What happens:** Vite starts a hot-reloading server (faster than CRA). It auto-compiles TypeScript to JS in the background.
* **Output:** Something like:
```text
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
➜  press h to show help
```

* Open the URL (e.g., http://localhost:5173) in your browser. Your app should load!


## Troubleshooting

### Port Already in Use
If port 3000 is already in use:
```bash
# Kill the process using port 3000
npx kill-port 3000
# Or run on different port
PORT=3001 npm start
```

### Location Not Working
- Grant browser location permissions
- For HTTPS deployment, location APIs require secure context
- Check browser console for geolocation errors

### Map Not Displaying
- Verify Leaflet CSS is imported in `App.js`
- Check that OpenStreetMap tiles are accessible
- Clear browser cache and reload

## Features

-  Real-time location tracking 📍
-  Interactive maps with emergency resources 🗺️
-  Emergency event creation and management 🚨
-  Real-time chat for events 💬 
-  Media upload (photos, videos, audio) 📸
-  Weather alerts 🌤️ 
-  Quick emergency call access 📞
-  Resource request system 🆘
-  Firebase backend integration 🔥

## Technologies Used

- **React 18** - Frontend framework
- **Firebase** - Backend (Firestore, Storage, Auth)
- **Leaflet/React-Leaflet** - Interactive maps
- **Capacitor** - Native mobile capabilities
- **Lucide React** - Icon library
- **OpenStreetMap** - Map tiles
- **OSRM** - Route calculation


---
Thank you for using REACH 

Built with ❤️ for emergency response coordination

# 🖥️ Clair Desktop (Electron App)

Desktop application for Clair - Next-Gen P2P Video Calling built with Electron.

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+)
- The Clair web app running on `http://localhost:3000`

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase and signaling server credentials
   ```

3. **Run in development mode**:
   ```bash
   npm run dev
   ```

## 📦 Building

Build for your current platform:
```bash
npm run build
```

Build for specific platforms:
```bash
npm run build:mac    # macOS
npm run build:win    # Windows
npm run build:linux  # Linux
```

## 🏗️ Architecture

### Main Process (`main.js`)
- Creates and manages the application window
- Handles app lifecycle events
- Provides IPC handlers for renderer process communication
- Manages electron-store for persistent data

### Preload Script (`preload.js`)
- Secure bridge between main and renderer processes
- Exposes safe APIs via `contextBridge`
- Provides access to:
  - Storage API (electron-store)
  - Notification API
  - App information (version, platform)

### Renderer Process
- Loads the Next.js web application
- In development: connects to `http://localhost:3000`
- In production: loads bundled static files

## 🔧 Available APIs

The Electron app exposes the following APIs to the web application via `window.electronAPI`:

### Storage
```javascript
// Get a value
const value = await window.electronAPI.store.get('key');

// Set a value
await window.electronAPI.store.set('key', 'value');

// Delete a value
await window.electronAPI.store.delete('key');
```

### Notifications
```javascript
await window.electronAPI.notification.show({
  title: 'Incoming Call',
  body: 'John Doe is calling...',
  onClick: true
});
```

### App Info
```javascript
const version = await window.electronAPI.app.getVersion();
const platform = await window.electronAPI.app.getPlatform();
await window.electronAPI.app.focusWindow();
```

## 🔐 Security

- **Context Isolation**: Enabled for security
- **Node Integration**: Disabled in renderer
- **Remote Module**: Disabled
- **Preload Script**: Only safe APIs exposed via contextBridge

## 📝 Development Workflow

1. Start the Next.js dev server in the `web` folder:
   ```bash
   cd ../web
   npm run dev
   ```

2. Start the Electron app:
   ```bash
   npm run dev
   ```

3. The Electron window will load the Next.js app from `http://localhost:3000`

## 🎨 Customization

- **Window settings**: Edit `main.js` → `createWindow()`
- **Exposed APIs**: Edit `preload.js` → `contextBridge.exposeInMainWorld()`
- **Build configuration**: Edit `package.json` → `build` section

## 📄 License
MIT

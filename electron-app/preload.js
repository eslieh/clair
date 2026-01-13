const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Storage API
  store: {
    get: (key) => ipcRenderer.invoke('store-get', key),
    set: (key, value) => ipcRenderer.invoke('store-set', key, value),
    delete: (key) => ipcRenderer.invoke('store-delete', key)
  },
  
  // Notification API
  notification: {
    show: (options) => ipcRenderer.invoke('show-notification', options)
  },
  
  // App info
  app: {
    getVersion: () => ipcRenderer.invoke('get-app-version'),
    getPlatform: () => ipcRenderer.invoke('get-platform'),
    focusWindow: () => ipcRenderer.invoke('focus-window')
  },
  
  // Platform detection
  isElectron: true,
  platform: process.platform
});

// Expose Supabase environment variables
contextBridge.exposeInMainWorld('env', {
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  SIGNALING_SERVER_URL: process.env.NEXT_PUBLIC_SIGNALING_SERVER_URL || '',
  IS_ELECTRON: true
});

console.log('Preload script loaded successfully');

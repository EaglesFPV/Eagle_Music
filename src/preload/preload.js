const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('musicAPI', {
  // Recherche
  searchYouTube: (query) => ipcRenderer.invoke('search-youtube', query),
  getStreamUrl: (videoId) => ipcRenderer.invoke('get-stream-url', videoId),

  // Téléchargements
  downloadTrack: (track) => ipcRenderer.invoke('download-track', track),

  // Fichiers locaux
  addLocalFiles: () => ipcRenderer.invoke('add-local-files'),

  // Bibliothèque
  getLibrary: () => ipcRenderer.invoke('get-library'),
  saveLibrary: (library) => ipcRenderer.invoke('save-library', library),

  // Contrôle fenêtre
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
});

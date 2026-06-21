const { app, BrowserWindow, ipcMain, dialog, session } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');

let mainWindow;
const DOWNLOADS_DIR = path.join(app.getPath('userData'), 'downloads');
const LIBRARY_FILE = path.join(app.getPath('userData'), 'library.json');

// Créer le dossier de téléchargements si nécessaire
if (!fs.existsSync(DOWNLOADS_DIR)) fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });

function loadLibrary() {
  if (fs.existsSync(LIBRARY_FILE)) {
    return JSON.parse(fs.readFileSync(LIBRARY_FILE, 'utf8'));
  }
  return { tracks: [], playlists: [] };
}

function saveLibrary(library) {
  fs.writeFileSync(LIBRARY_FILE, JSON.stringify(library, null, 2));
}

function createWindow() {
  // Bloquer les pubs YouTube au niveau réseau
  session.defaultSession.webRequest.onBeforeRequest(
    { urls: ['*://googleads.g.doubleclick.net/*', '*://static.doubleclick.net/*', '*://www.google-analytics.com/*', '*://pagead2.googlesyndication.com/*', '*://ads.youtube.com/*'] },
    (details, callback) => callback({ cancel: true })
  );

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#0f0f14',
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false,
    },
    icon: path.join(__dirname, '../../assets/icon.png'),
  });

  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  // Garder actif en arrière-plan
  mainWindow.on('close', (e) => {
    if (!app.isQuitting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('before-quit', () => { app.isQuitting = true; });

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ──────────────── IPC HANDLERS ────────────────

// Recherche YouTube via youtube-sr
ipcMain.handle('search-youtube', async (_, query) => {
  try {
    const YouTube = require('youtube-sr').default;
    const results = await YouTube.search(query, { limit: 15, type: 'video' });
    return results.map(v => ({
      id: v.id,
      title: v.title,
      artist: v.channel?.name || 'Inconnu',
      duration: v.duration,
      durationFormatted: v.durationFormatted,
      thumbnail: v.thumbnail?.url || '',
      url: `https://www.youtube.com/watch?v=${v.id}`,
      source: 'youtube',
    }));
  } catch (err) {
    console.error('Erreur recherche:', err);
    return [];
  }
});

// Stream audio YouTube sans pub via ytdl-core
ipcMain.handle('get-stream-url', async (_, videoId) => {
  try {
    const ytdl = require('ytdl-core');
    const info = await ytdl.getInfo(`https://www.youtube.com/watch?v=${videoId}`);
    const formats = ytdl.filterFormats(info.formats, 'audioonly');
    // Choisir la meilleure qualité audio
    const best = formats.sort((a, b) => (b.audioBitrate || 0) - (a.audioBitrate || 0))[0];
    return { url: best?.url || null, title: info.videoDetails.title, artist: info.videoDetails.author.name };
  } catch (err) {
    console.error('Erreur stream:', err);
    return { url: null };
  }
});

// Téléchargement offline
ipcMain.handle('download-track', async (_, track) => {
  try {
    const ytdl = require('ytdl-core');
    const safeName = track.title.replace(/[^a-zA-Z0-9\s-]/g, '').trim().substring(0, 60);
    const filePath = path.join(DOWNLOADS_DIR, `${safeName}.mp3`);

    if (fs.existsSync(filePath)) {
      return { success: true, filePath, cached: true };
    }

    await new Promise((resolve, reject) => {
      const stream = ytdl(`https://www.youtube.com/watch?v=${track.id}`, {
        quality: 'highestaudio',
        filter: 'audioonly',
      });
      const output = fs.createWriteStream(filePath);
      stream.pipe(output);
      stream.on('error', reject);
      output.on('finish', resolve);
      output.on('error', reject);
    });

    // Sauvegarder dans la bibliothèque
    const library = loadLibrary();
    const existing = library.tracks.find(t => t.id === track.id);
    if (!existing) {
      library.tracks.push({ ...track, localPath: filePath, downloadedAt: Date.now() });
      saveLibrary(library);
    }

    return { success: true, filePath };
  } catch (err) {
    console.error('Erreur téléchargement:', err);
    return { success: false, error: err.message };
  }
});

// Obtenir la progression du téléchargement
ipcMain.handle('get-download-progress', async (_, videoId) => {
  try {
    const ytdl = require('ytdl-core');
    const info = await ytdl.getInfo(`https://www.youtube.com/watch?v=${videoId}`);
    return { title: info.videoDetails.title };
  } catch {
    return null;
  }
});

// Ajouter des fichiers locaux
ipcMain.handle('add-local-files', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections'],
    filters: [{ name: 'Audio', extensions: ['mp3', 'flac', 'wav', 'ogg', 'm4a', 'aac', 'opus'] }],
  });
  if (result.canceled) return [];

  const mm = require('music-metadata');
  const tracks = [];

  for (const filePath of result.filePaths) {
    try {
      const meta = await mm.parseFile(filePath);
      tracks.push({
        id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: meta.common.title || path.basename(filePath, path.extname(filePath)),
        artist: meta.common.artist || 'Inconnu',
        album: meta.common.album || '',
        duration: Math.round(meta.format.duration || 0) * 1000,
        durationFormatted: formatDuration(Math.round(meta.format.duration || 0) * 1000),
        localPath: filePath,
        source: 'local',
        thumbnail: '',
      });
    } catch (e) {
      tracks.push({
        id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: path.basename(filePath, path.extname(filePath)),
        artist: 'Inconnu',
        localPath: filePath,
        source: 'local',
        duration: 0,
        durationFormatted: '0:00',
        thumbnail: '',
      });
    }
  }

  // Sauvegarder dans la bibliothèque
  const library = loadLibrary();
  tracks.forEach(t => {
    if (!library.tracks.find(lt => lt.localPath === t.localPath)) {
      library.tracks.push(t);
    }
  });
  saveLibrary(library);

  return tracks;
});

// Récupérer la bibliothèque
ipcMain.handle('get-library', () => loadLibrary());
ipcMain.handle('save-library', (_, library) => saveLibrary(library));

// Contrôle fenêtre
ipcMain.on('window-minimize', () => mainWindow.minimize());
ipcMain.on('window-maximize', () => mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize());
ipcMain.on('window-close', () => mainWindow.hide());

function formatDuration(ms) {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

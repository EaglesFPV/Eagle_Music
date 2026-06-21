# 🦅 Eagle Music

> Lecteur de musique personnel — YouTube + fichiers locaux, sans pub, offline.

![Version](https://img.shields.io/badge/version-1.0.0-6c63ff?style=flat-square)
![Platform](https://img.shields.io/badge/platform-Windows-blue?style=flat-square)
![Electron](https://img.shields.io/badge/Electron-28-47848f?style=flat-square)

---

## ✨ Fonctionnalités

- 🔍 **Recherche YouTube** sans pub
- ▶️ **Stream audio haute qualité** via ytdl-core
- ⬇️ **Téléchargement offline** en MP3
- 🎵 **Fichiers locaux** — MP3, FLAC, WAV, OGG, M4A, AAC
- 📋 **File d'attente** avec shuffle et répétition
- 🔄 **Lecture en arrière-plan** (fermer ≠ quitter)

---

## 🚀 Installation (développement)

```bash
npm install
npm start
```

## 📦 Build Windows

```bash
npm run build
# → dist/Eagle-Music-Setup-1.0.0.exe
```

---

## 📁 Structure

```
eagle-music/
├── .github/workflows/
│   ├── build.yml       ← Build automatique sur push
│   └── release.yml     ← Release manuelle avec version
├── assets/
│   └── icon.ico        ← Icône de l'application
├── src/
│   ├── main/
│   │   └── main.js     ← Processus principal Electron
│   ├── preload/
│   │   └── preload.js  ← Bridge IPC sécurisé
│   └── renderer/
│       ├── index.html  ← Interface principale
│       ├── style.css   ← Thème sombre
│       └── app.js      ← Logique lecteur
├── popup.html          ← Fenêtre "À propos"
├── .gitattributes
├── .gitignore
├── LICENSE
├── package.json
└── README.md
```

---

## 🔧 Dépannage

**YouTube ne lit pas :**
```bash
npm update ytdl-core
```

**Les fichiers téléchargés sont dans :**
`%APPDATA%\eagle-music\downloads\`

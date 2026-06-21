// ═══════════════════════════════════════════
//   MyMusic — Renderer (app.js)
// ═══════════════════════════════════════════

const audio = document.getElementById('audio-player');

// ─── État global ───
let state = {
  queue: [],
  currentIndex: -1,
  isPlaying: false,
  shuffle: false,
  repeat: 'none', // 'none' | 'one' | 'all'
  library: { tracks: [], playlists: [] },
  currentTrack: null,
  likes: new Set(),
};

// ─── Init ───
async function init() {
  state.library = await window.musicAPI.getLibrary();
  renderLibrary();
  renderDownloads();
  renderQueue();
  setupSearch();
}

// ─── Navigation ───
function showView(name, btn) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(`view-${name}`).classList.add('active');
  btn.classList.add('active');
  if (name === 'library') renderLibrary();
  if (name === 'downloads') renderDownloads();
  if (name === 'queue') renderQueue();
}

// ─── Recherche ───
function setupSearch() {
  document.getElementById('search-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') performSearch();
  });
}

async function performSearch() {
  const query = document.getElementById('search-input').value.trim();
  if (!query) return;
  const container = document.getElementById('search-results');
  container.innerHTML = `<div class="loading-state"><div class="spinner"></div>Recherche en cours...</div>`;
  const results = await window.musicAPI.searchYouTube(query);
  if (!results.length) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">🔇</div><p>Aucun résultat trouvé</p></div>`;
    return;
  }
  container.innerHTML = '';
  results.forEach(track => {
    container.appendChild(buildTrackItem(track, ['play', 'queue', 'download']));
  });
}

// ─── Bibliothèque ───
function renderLibrary() {
  const list = document.getElementById('library-list');
  const count = document.getElementById('library-count');
  const tracks = state.library.tracks;
  count.textContent = `${tracks.length} titre${tracks.length !== 1 ? 's' : ''}`;
  if (!tracks.length) {
    list.innerHTML = `<div class="empty-state"><div class="empty-icon">🎵</div><p>Ajoutez des fichiers locaux ou téléchargez des morceaux</p></div>`;
    return;
  }
  list.innerHTML = '';
  tracks.forEach(track => {
    list.appendChild(buildTrackItem(track, track.localPath ? ['play', 'queue'] : ['play', 'queue', 'download']));
  });
}

function renderDownloads() {
  const list = document.getElementById('downloads-list');
  const downloaded = state.library.tracks.filter(t => t.localPath && t.source === 'youtube');
  if (!downloaded.length) {
    list.innerHTML = `<div class="empty-state"><div class="empty-icon">⬇️</div><p>Aucun titre téléchargé</p></div>`;
    return;
  }
  list.innerHTML = '';
  downloaded.forEach(track => {
    list.appendChild(buildTrackItem(track, ['play', 'queue']));
  });
}

function renderQueue() {
  const list = document.getElementById('queue-list');
  if (!state.queue.length) {
    list.innerHTML = `<div class="empty-state"><div class="empty-icon">📋</div><p>La file d'attente est vide</p></div>`;
    return;
  }
  list.innerHTML = '';
  state.queue.forEach((track, i) => {
    const item = buildTrackItem(track, ['play']);
    if (i === state.currentIndex) item.classList.add('playing');
    list.appendChild(item);
  });
}

function clearQueue() {
  state.queue = [];
  state.currentIndex = -1;
  renderQueue();
  showToast('File d\'attente vidée');
}

// ─── Builder de piste ───
function buildTrackItem(track, actions = []) {
  const div = document.createElement('div');
  div.className = 'track-item';
  if (state.currentTrack?.id === track.id) div.classList.add('playing');

  const thumb = track.thumbnail
    ? `<img src="${track.thumbnail}" alt="" onerror="this.parentElement.innerHTML='♪'" />`
    : '♪';

  const isOffline = !!track.localPath;
  const badge = track.source === 'local'
    ? `<span class="source-badge local">LOCAL</span>`
    : isOffline
      ? `<span class="source-badge offline">OFFLINE</span>`
      : `<span class="source-badge yt">YT</span>`;

  const duration = track.durationFormatted || formatMs(track.duration);

  const actionBtns = actions.map(a => {
    if (a === 'play') return `<button class="action-btn" onclick="playTrack(${JSON.stringify(JSON.stringify(track))})" title="Lire">▶</button>`;
    if (a === 'queue') return `<button class="action-btn queue" onclick="addToQueue(${JSON.stringify(JSON.stringify(track))})" title="File d'attente">+</button>`;
    if (a === 'download') return `<button class="action-btn download" onclick="downloadTrack(${JSON.stringify(JSON.stringify(track))}, this)" title="Télécharger">⬇</button>`;
    return '';
  }).join('');

  div.innerHTML = `
    <div class="track-thumb">${thumb}</div>
    <div class="track-meta">
      <div class="track-title">${escHtml(track.title)}</div>
      <div class="track-artist">${escHtml(track.artist || '—')}</div>
    </div>
    ${badge}
    <div class="track-duration">${duration}</div>
    <div class="track-actions">${actionBtns}</div>
  `;
  div.ondblclick = () => playTrackObj(track);
  return div;
}

// ─── Lecture ───
async function playTrack(jsonStr) {
  const track = JSON.parse(jsonStr);
  await playTrackObj(track);
}

async function playTrackObj(track) {
  state.currentTrack = track;
  updatePlayerUI(track);

  // Si fichier local
  if (track.localPath) {
    audio.src = `file://${track.localPath.replace(/\\/g, '/')}`;
    audio.play().catch(e => console.error(e));
    return;
  }

  // YouTube → stream sans pub
  showToast('Chargement…');
  const result = await window.musicAPI.getStreamUrl(track.id);
  if (result?.url) {
    audio.src = result.url;
    audio.play().catch(e => {
      showToast('Erreur de lecture. Essayez de télécharger d\'abord.');
    });
  } else {
    showToast('Impossible de lire ce titre. Téléchargez-le en offline.');
  }
}

function updatePlayerUI(track) {
  document.getElementById('player-title').textContent = track.title;
  document.getElementById('player-artist').textContent = track.artist || '—';
  const thumb = document.getElementById('player-thumb');
  if (track.thumbnail) {
    thumb.innerHTML = `<img src="${track.thumbnail}" alt="" onerror="this.parentElement.innerHTML='♪'" />`;
  } else {
    thumb.innerHTML = '♪';
  }
  // Marquer la piste active dans les listes
  document.querySelectorAll('.track-item').forEach(el => el.classList.remove('playing'));
}

function addToQueue(jsonStr) {
  const track = JSON.parse(jsonStr);
  state.queue.push(track);
  showToast(`"${track.title}" ajouté à la file`);
  renderQueue();
}

// ─── Contrôles audio ───
function togglePlay() {
  if (audio.paused) { audio.play(); state.isPlaying = true; }
  else { audio.pause(); state.isPlaying = false; }
  updatePlayBtn();
}

function updatePlayBtn() {
  document.getElementById('play-btn').textContent = audio.paused ? '▶' : '⏸';
}

function prevTrack() {
  if (state.currentIndex > 0) {
    state.currentIndex--;
    playTrackObj(state.queue[state.currentIndex]);
  }
}

function nextTrack() {
  if (state.shuffle) {
    state.currentIndex = Math.floor(Math.random() * state.queue.length);
  } else if (state.currentIndex < state.queue.length - 1) {
    state.currentIndex++;
  } else if (state.repeat === 'all') {
    state.currentIndex = 0;
  } else return;
  playTrackObj(state.queue[state.currentIndex]);
}

function toggleShuffle() {
  state.shuffle = !state.shuffle;
  document.getElementById('btn-shuffle').classList.toggle('active', state.shuffle);
  showToast(state.shuffle ? 'Lecture aléatoire activée' : 'Lecture aléatoire désactivée');
}

function toggleRepeat() {
  const modes = ['none', 'all', 'one'];
  const icons = ['↻', '↻', '↩'];
  state.repeat = modes[(modes.indexOf(state.repeat) + 1) % 3];
  const btn = document.getElementById('btn-repeat');
  btn.textContent = icons[modes.indexOf(state.repeat)];
  btn.classList.toggle('active', state.repeat !== 'none');
  showToast({ none: 'Répétition off', all: 'Répéter tout', one: 'Répéter ce titre' }[state.repeat]);
}

function toggleLike() {
  if (!state.currentTrack) return;
  const id = state.currentTrack.id;
  const btn = document.getElementById('like-btn');
  if (state.likes.has(id)) { state.likes.delete(id); btn.classList.remove('liked'); btn.textContent = '♡'; }
  else { state.likes.add(id); btn.classList.add('liked'); btn.textContent = '♥'; }
}

function seekTo(e) {
  const bar = document.getElementById('progress-bar');
  const ratio = e.offsetX / bar.offsetWidth;
  audio.currentTime = ratio * audio.duration;
}

function setVolume(val) {
  audio.volume = val / 100;
}

// ─── Téléchargement ───
async function downloadTrack(jsonStr, btn) {
  const track = JSON.parse(jsonStr);
  btn.textContent = '…';
  btn.disabled = true;
  showToast(`Téléchargement de "${track.title}"…`);
  const result = await window.musicAPI.downloadTrack(track);
  if (result.success) {
    showToast('✓ Téléchargement terminé !');
    btn.textContent = '✓';
    // Rafraîchir bibliothèque
    state.library = await window.musicAPI.getLibrary();
    renderDownloads();
    renderLibrary();
  } else {
    showToast('Erreur de téléchargement');
    btn.textContent = '⬇';
    btn.disabled = false;
  }
}

// ─── Fichiers locaux ───
async function addLocalFiles() {
  const tracks = await window.musicAPI.addLocalFiles();
  if (tracks.length) {
    state.library = await window.musicAPI.getLibrary();
    renderLibrary();
    showToast(`${tracks.length} fichier${tracks.length > 1 ? 's' : ''} ajouté${tracks.length > 1 ? 's' : ''}`);
  }
}

// ─── Événements audio ───
audio.addEventListener('play', updatePlayBtn);
audio.addEventListener('pause', updatePlayBtn);
audio.addEventListener('timeupdate', () => {
  if (!audio.duration) return;
  const pct = (audio.currentTime / audio.duration) * 100;
  document.getElementById('progress-fill').style.width = `${pct}%`;
  document.getElementById('current-time').textContent = formatSec(audio.currentTime);
  document.getElementById('total-time').textContent = formatSec(audio.duration);
});
audio.addEventListener('ended', () => {
  if (state.repeat === 'one') { audio.play(); return; }
  nextTrack();
});

// ─── Utilitaires ───
function formatMs(ms) {
  if (!ms) return '0:00';
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
function formatSec(s) {
  if (!s || isNaN(s)) return '0:00';
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
}
function escHtml(str) {
  return String(str).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

let toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.add('hidden'), 2800);
}

// ─── Lancement ───
init();

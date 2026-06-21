// ═══════════════════════════════════════════════
//   Eagle Music — app.js
// ═══════════════════════════════════════════════

const audio = document.getElementById('audio');

// ── STATE ──
const S = {
  page: 'home',
  track: null,
  queue: [],
  qIdx: -1,
  playing: false,
  shuffle: false,
  repeat: 'none',   // none | all | one
  muted: false,
  liked: new Set(),
  library: { tracks: [], playlists: [] },
  searchQuery: '',
  libTab: 'playlists',
  exploreTab: 'new',
  queueOpen: false,
};

// ── HOME SECTIONS DATA ──
const HOME_SECTIONS = [
  {
    eyebrow: 'MUSIC THROUGH THE DECADES',
    title: 'Happy music day !',
    items: [
      { title: "The Hits: '80s", sub: 'Michael Jackson, Madonna, Prince...', emoji: '🕺', color: '#b71c1c' },
      { title: "The Hits: '00s", sub: 'Rihanna, Katy Perry, Shakira,...', emoji: '💿', color: '#4a148c' },
      { title: 'Hits 2010', sub: 'Soprano, Stromae, GIMS, Rihanna', emoji: '🎤', color: '#1b5e20' },
      { title: 'Hits 80', sub: 'Téléphone, Renaud, Daniel...', emoji: '🎸', color: '#e65100' },
      { title: "The Hits: '90s", sub: 'Mariah Carey, Michael Jackson...', emoji: '🎵', color: '#006064' },
      { title: "The Hits: '50s", sub: 'Elvis Presley, Bobby Darin, Ray...', emoji: '🎷', color: '#37474f' },
    ]
  },
  {
    eyebrow: 'THE BIGGEST HITS OF ALL TIMES!',
    title: 'All hits',
    items: [
      { title: 'Rap Français', sub: 'Playlist', emoji: '🎙️', color: '#880e4f' },
      { title: 'Hip Hop', sub: 'Playlist', emoji: '🎧', color: '#0d47a1' },
      { title: 'Culture', sub: 'Playlist', emoji: '🌍', color: '#4a148c' },
      { title: 'Classiques du Rap', sub: 'Playlist', emoji: '👑', color: '#1a237e' },
      { title: 'R&B Hits', sub: 'Playlist', emoji: '💜', color: '#4a0080' },
      { title: 'Pop Hits', sub: 'Playlist', emoji: '⭐', color: '#b71c1c' },
    ]
  },
  {
    eyebrow: 'YOUR VIBE',
    title: 'Made for you',
    items: [
      { title: 'Discover Mix', sub: 'Eagle Music', emoji: '🔮', color: '#37474f' },
      { title: 'New Release Mix', sub: 'Eagle Music', emoji: '✨', color: '#1b5e20' },
      { title: 'Deep Cuts', sub: 'Eagle Music', emoji: '💎', color: '#006064' },
      { title: 'Your Favorites', sub: 'Eagle Music', emoji: '❤️', color: '#880e4f' },
    ]
  },
];

const EXPLORE_NEW = [
  { title: 'BYAKUGAN', sub: 'Album · Kaaris', emoji: '🖤', color: '#1a1a2e' },
  { title: 'ENERGY', sub: 'Album · Franglish & KeBlack', emoji: '⚡', color: '#2d1b00' },
  { title: 'En Croix', sub: 'Album · Lagui', emoji: '✝️', color: '#0a0a0a' },
  { title: 'EX-VOTO', sub: 'Album · Kalash', emoji: '🌊', color: '#001233' },
  { title: 'JEUNESSE DORÉE MUSIC', sub: 'Album · Guy2Bezbar', emoji: '🌙', color: '#1a0a2e' },
  { title: 'Chérie coco', sub: 'Single · Leto', emoji: '🌴', color: '#002244' },
];

const MOODS = [
  { label: 'Chill', color: '#1565C0' }, { label: 'Focus', color: '#2E7D32' },
  { label: 'Sad', color: '#4527A0' }, { label: 'African', color: '#E65100' },
  { label: 'Classical', color: '#37474F' }, { label: 'Family', color: '#AD1457' },
  { label: 'Commute', color: '#00695C' }, { label: 'Gaming', color: '#283593' },
  { label: 'Sleep', color: '#1A237E' }, { label: 'Arabic', color: '#558B2F' },
  { label: 'Country & Americana', color: '#4E342E' }, { label: 'Folk & acoustic', color: '#6D4C41' },
  { label: 'Party', color: '#C62828' }, { label: 'Workout', color: '#F57F17' },
  { label: 'Romance', color: '#880E4F' }, { label: 'Feel good', color: '#1B5E20' },
];

// ══════════════════════
//  NAVIGATION
// ══════════════════════
function navigate(page) {
  S.page = page;
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const pg = document.getElementById(`page-${page}`);
  const nav = document.getElementById(`nav-${page}`);
  if (pg) pg.classList.add('active');
  if (nav) nav.classList.add('active');

  if (page === 'home') renderHome();
  if (page === 'explore') renderExplore();
  if (page === 'library') renderLibrary();
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('collapsed');
}

// ══════════════════════
//  HOME
// ══════════════════════
function renderHome() {
  const container = document.getElementById('home-sections');
  container.innerHTML = '';
  HOME_SECTIONS.forEach(sec => {
    container.appendChild(buildSection(sec));
  });

  // Mood chips interaction
  document.querySelectorAll('.mood-chips .chip').forEach(chip => {
    chip.onclick = function () {
      document.querySelectorAll('.mood-chips .chip').forEach(c => c.classList.remove('active'));
      this.classList.add('active');
    };
  });
}

function buildSection(sec) {
  const div = document.createElement('div');
  div.className = 'section';

  const row = document.createElement('div');
  row.className = 'cards-row';

  sec.items.forEach(item => {
    const card = buildCard(item);
    row.appendChild(card);
  });

  div.innerHTML = `
    <div class="section-header">
      <div>
        <div class="section-eyebrow">${sec.eyebrow}</div>
        <div class="section-title">${sec.title}</div>
      </div>
      <div class="section-navs">
        <button class="section-nav-btn" onclick="scrollRow(this, -1)">‹</button>
        <button class="section-nav-btn" onclick="scrollRow(this, 1)">›</button>
      </div>
    </div>
  `;
  div.appendChild(row);
  return div;
}

function scrollRow(btn, dir) {
  const section = btn.closest('.section');
  const row = section.querySelector('.cards-row');
  row.scrollBy({ left: dir * 350, behavior: 'smooth' });
}

function buildCard(item) {
  const card = document.createElement('div');
  card.className = 'card';
  card.onclick = () => playItem(item);
  card.innerHTML = `
    <div class="card-art" style="background: ${item.color || '#1a1a1a'}">
      ${item.img ? `<img src="${item.img}" alt="" />` : `<div class="card-emoji">${item.emoji || '🎵'}</div>`}
      <button class="card-play" onclick="event.stopPropagation(); playItem(${JSON.stringify(JSON.stringify(item))})">
        <svg viewBox="0 0 24 24" width="20" height="20"><path fill="white" d="M8 5v14l11-7z"/></svg>
      </button>
    </div>
    <div class="card-title">${esc(item.title)}</div>
    <div class="card-sub">${esc(item.sub || '')}</div>
  `;
  return card;
}

// ══════════════════════
//  EXPLORE
// ══════════════════════
function renderExplore() {
  setExploreTab(S.exploreTab);
}

function setExploreTab(tab) {
  S.exploreTab = tab;
  const c = document.getElementById('explore-content');
  c.innerHTML = '';

  if (tab === 'new') {
    const sec = { eyebrow: 'JUST DROPPED', title: 'New albums & singles', items: EXPLORE_NEW };
    c.appendChild(buildSection(sec));

    const moodsSec = {
      eyebrow: 'DISCOVER', title: 'Moods & genres',
      items: MOODS.map(m => ({ title: m.label, sub: 'Playlist', emoji: '🎵', color: m.color }))
    };
    c.appendChild(buildSection(moodsSec));
  }

  if (tab === 'charts') {
    const items = [
      { title: 'Top 100 France', sub: 'Charts · France', emoji: '🇫🇷', color: '#001f6b' },
      { title: 'Global Top 50', sub: 'Charts · Global', emoji: '🌍', color: '#0d2137' },
      { title: 'Trending Hip Hop', sub: 'Charts', emoji: '🎤', color: '#1a0033' },
      { title: 'Viral 50', sub: 'Charts · France', emoji: '📈', color: '#002233' },
    ];
    c.appendChild(buildSection({ eyebrow: 'TRENDING NOW', title: 'Charts', items }));
  }

  if (tab === 'moods') {
    const grid = document.createElement('div');
    grid.className = 'moods-grid';
    MOODS.forEach(m => {
      const el = document.createElement('div');
      el.className = 'mood-card';
      el.style.borderLeftColor = m.color;
      el.textContent = m.label;
      el.onclick = () => showToast(`🎵 ${m.label}`);
      grid.appendChild(el);
    });
    c.appendChild(grid);
  }
}

// ══════════════════════
//  LIBRARY
// ══════════════════════
async function renderLibrary() {
  S.library = await window.musicAPI.getLibrary();
  setLibTab(S.libTab, null);
}

function setLibTab(tab, btn) {
  S.libTab = tab;
  if (btn) {
    document.querySelectorAll('.lib-chips .chip').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
  }
  const grid = document.getElementById('library-grid');
  grid.innerHTML = '';

  const playlists = S.library.playlists || [];
  const tracks = S.library.tracks || [];

  if (tab === 'playlists') {
    if (!playlists.length && !tracks.length) {
      grid.innerHTML = `<div class="empty" style="grid-column:1/-1"><div class="empty-icon">📚</div><p>Aucune playlist. Créez-en une !</p></div>`;
      return;
    }
    [...playlists, ...tracks.filter(t=>t.source==='local')].forEach(item => {
      grid.appendChild(buildCard({ title: item.name || item.title, sub: item.description || item.artist || 'Playlist', emoji: '🎵' }));
    });
  }

  if (tab === 'songs') {
    const songs = tracks;
    if (!songs.length) {
      grid.innerHTML = `<div class="empty" style="grid-column:1/-1"><div class="empty-icon">🎵</div><p>Aucun titre. Ajoutez des fichiers locaux.</p></div>`;
      return;
    }
    // Switch to list view for songs
    grid.style.display = 'flex';
    grid.style.flexDirection = 'column';
    grid.style.gap = '2px';
    songs.forEach(t => {
      const el = document.createElement('div');
      el.className = 'result-item';
      el.innerHTML = `
        <div class="ri-art">${t.thumbnail ? `<img src="${t.thumbnail}" />` : '🎵'}</div>
        <div class="ri-info">
          <div class="ri-title">${esc(t.title)}</div>
          <div class="ri-sub">${esc(t.artist || '—')} · ${t.durationFormatted || '—'}</div>
        </div>
      `;
      el.ondblclick = () => playTrack(t);
      grid.appendChild(el);
    });
    return;
  }

  grid.style.display = '';
  grid.style.flexDirection = '';
}

function toggleLibSort() {
  showToast('Tri par activité récente');
}

// ══════════════════════
//  SEARCH
// ══════════════════════
let searchTimeout;

function onSearchInput(val) {
  S.searchQuery = val;
  const clear = document.getElementById('search-clear');
  val ? clear.classList.remove('hidden') : clear.classList.add('hidden');

  clearTimeout(searchTimeout);
  if (val.length > 1) {
    searchTimeout = setTimeout(() => buildSuggestions(val), 180);
  } else {
    hideSuggestions();
  }
}

function onSearchKey(e) {
  if (e.key === 'Enter') {
    const q = document.getElementById('search-input').value.trim();
    if (q) performSearch(q);
  }
  if (e.key === 'Escape') { hideSuggestions(); clearSearch(); }
}

function buildSuggestions(q) {
  const panel = document.getElementById('suggestions-panel');
  const list = document.getElementById('suggestions-list');
  const suffixes = ['', ' remix', ' the neighbourhood', ' slowed', ' lyrics', ' sped up'];
  list.innerHTML = suffixes.map(s => `
    <div class="sugg-item" onclick="performSearch('${esc(q+s)}')">
      <svg class="sugg-icon" viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
      <span class="sugg-text"><em>${esc(q)}</em>${esc(s)}</span>
    </div>
  `).join('');
  panel.classList.remove('hidden');
}

function showSuggestions() {
  const q = document.getElementById('search-input').value;
  if (q.length > 1) buildSuggestions(q);
}

function hideSuggestions() {
  document.getElementById('suggestions-panel').classList.add('hidden');
}

function clearSearch() {
  document.getElementById('search-input').value = '';
  document.getElementById('search-clear').classList.add('hidden');
  hideSuggestions();
  S.searchQuery = '';
}

async function performSearch(query) {
  hideSuggestions();
  document.getElementById('search-input').value = query;
  document.getElementById('search-clear').classList.remove('hidden');
  S.searchQuery = query;
  navigate('search');

  const container = document.getElementById('search-results-content');
  container.innerHTML = `<div class="loading"><div class="spinner"></div> Recherche...</div>`;

  const results = await window.musicAPI.searchYouTube(query);

  if (!results.length) {
    container.innerHTML = `<div class="empty"><div class="empty-icon">🔇</div><p>Aucun résultat pour "${esc(query)}"</p></div>`;
    return;
  }

  renderSearchResults(results);
}

function renderSearchResults(results) {
  const container = document.getElementById('search-results-content');
  container.innerHTML = '';

  // Top result
  const top = results[0];
  const topEl = document.createElement('div');
  topEl.className = 'top-result';
  topEl.innerHTML = `
    <div class="top-result-art">${top.thumbnail ? `<img src="${top.thumbnail}" />` : '🎵'}</div>
    <div class="top-result-info">
      <div class="top-result-title">${esc(top.title)}</div>
      <div class="top-result-sub">Video · ${esc(top.artist)} · ${top.durationFormatted || ''}</div>
    </div>
    <div class="top-result-btns">
      <button class="tr-btn play" onclick="playTrack(${JSON.stringify(JSON.stringify(top))})">
        <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>
        Play
      </button>
      <button class="tr-btn save" onclick="saveToLibrary(${JSON.stringify(JSON.stringify(top))})">
        <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z"/></svg>
        Save
      </button>
      <button class="tr-btn save" style="padding:8px 10px">
        <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
      </button>
    </div>
  `;
  topEl.ondblclick = () => playTrack(top);
  container.appendChild(topEl);

  // Rest
  const list = document.createElement('div');
  list.className = 'result-list';
  results.slice(1).forEach(r => {
    const el = document.createElement('div');
    el.className = 'result-item';
    el.innerHTML = `
      <div class="ri-art">${r.thumbnail ? `<img src="${r.thumbnail}" />` : '🎵'}</div>
      <div class="ri-info">
        <div class="ri-title">${esc(r.title)}</div>
        <div class="ri-sub">Video · ${esc(r.artist)} · ${r.durationFormatted || ''}</div>
      </div>
      <div class="ri-actions">
        <button class="ri-action-btn" onclick="event.stopPropagation(); addToQueue(${JSON.stringify(JSON.stringify(r))})" title="Ajouter à la file">
          <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
        </button>
        <button class="ri-action-btn" onclick="event.stopPropagation(); downloadTrack(${JSON.stringify(JSON.stringify(r))}, this)" title="Télécharger">
          <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
        </button>
        <button class="ri-action-btn" onclick="event.stopPropagation(); saveToLibrary(${JSON.stringify(JSON.stringify(r))})" title="Sauvegarder">
          <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z"/></svg>
        </button>
      </div>
    `;
    el.ondblclick = () => playTrack(r);
    list.appendChild(el);
  });
  container.appendChild(list);
}

function setSearchTab(tab, btn) {
  document.querySelectorAll('.stab').forEach(s => s.classList.remove('active'));
  btn.classList.add('active');
  showToast(`Filtre : ${tab}`);
}

// ══════════════════════
//  PLAYBACK
// ══════════════════════
function playItem(itemOrJson) {
  const item = typeof itemOrJson === 'string' ? JSON.parse(itemOrJson) : itemOrJson;
  const track = {
    id: item.id || `local_${Date.now()}`,
    title: item.title,
    artist: item.sub || item.artist || '—',
    thumbnail: item.img || item.thumbnail || '',
    source: item.source || 'youtube',
    localPath: item.localPath,
    durationFormatted: item.durationFormatted || '',
  };
  playTrackObj(track);
}

function playTrack(trackOrJson) {
  const track = typeof trackOrJson === 'string' ? JSON.parse(trackOrJson) : trackOrJson;
  playTrackObj(track);
}

async function playTrackObj(track) {
  S.track = track;
  updatePlayerInfo(track);

  if (track.localPath) {
    audio.src = `file://${track.localPath.replace(/\\/g, '/')}`;
    audio.play();
    return;
  }

  if (track.source === 'youtube' || track.id && !track.localPath) {
    const res = await window.musicAPI.getStreamUrl(track.id);
    if (res?.url) {
      audio.src = res.url;
      audio.play();
    } else {
      showToast('⚠️ Lecture impossible. Télécharge ce titre d\'abord.');
    }
  }
}

function updatePlayerInfo(track) {
  document.getElementById('player-title').textContent = track.title || '—';
  document.getElementById('player-artist').textContent = track.artist || '—';
  const art = document.getElementById('player-art');
  art.innerHTML = track.thumbnail
    ? `<img src="${track.thumbnail}" onerror="this.parentElement.innerHTML='🎵'" />`
    : '🎵';
  document.getElementById('player-like').classList.toggle('liked', S.liked.has(track.id));
}

function addToQueue(jsonOrTrack) {
  const t = typeof jsonOrTrack === 'string' ? JSON.parse(jsonOrTrack) : jsonOrTrack;
  S.queue.push(t);
  renderQueuePanel();
  showToast(`Ajouté à la file`, 'Afficher', () => { if (!S.queueOpen) toggleQueue(); });
}

function addToQueueAndPlay(tracks) {
  S.queue = tracks;
  S.qIdx = 0;
  playTrackObj(tracks[0]);
}

function prevTrack() {
  if (S.qIdx > 0) { S.qIdx--; playTrackObj(S.queue[S.qIdx]); }
  else { audio.currentTime = 0; }
}

function nextTrack() {
  if (S.shuffle) {
    S.qIdx = Math.floor(Math.random() * S.queue.length);
  } else if (S.qIdx < S.queue.length - 1) {
    S.qIdx++;
  } else if (S.repeat === 'all') {
    S.qIdx = 0;
  } else return;
  if (S.queue[S.qIdx]) playTrackObj(S.queue[S.qIdx]);
}

function togglePlay() {
  audio.paused ? audio.play() : audio.pause();
}

function toggleShuffle() {
  S.shuffle = !S.shuffle;
  document.getElementById('btn-shuffle').classList.toggle('active', S.shuffle);
  showToast(S.shuffle ? '🔀 Aléatoire activé' : 'Aléatoire désactivé');
}

function toggleRepeat() {
  const modes = ['none', 'all', 'one'];
  S.repeat = modes[(modes.indexOf(S.repeat) + 1) % 3];
  const btn = document.getElementById('btn-repeat');
  btn.classList.toggle('active', S.repeat !== 'none');
  const labels = { none: 'Répétition désactivée', all: '🔁 Répéter tout', one: '🔂 Répéter ce titre' };
  showToast(labels[S.repeat]);
}

function toggleLike() {
  if (!S.track) return;
  const id = S.track.id;
  const btn = document.getElementById('player-like');
  if (S.liked.has(id)) { S.liked.delete(id); btn.classList.remove('liked'); }
  else { S.liked.add(id); btn.classList.add('liked'); showToast('❤️ Ajouté aux titres aimés'); }
}

function toggleMute() {
  S.muted = !S.muted;
  audio.muted = S.muted;
}

function setVolume(val) {
  audio.volume = val / 100;
  S.muted = false;
  audio.muted = false;
}

function seekTo(e) {
  const bar = document.getElementById('p-bar');
  audio.currentTime = (e.offsetX / bar.offsetWidth) * audio.duration;
}

// ── Download ──
async function downloadTrack(jsonOrTrack, btn) {
  const track = typeof jsonOrTrack === 'string' ? JSON.parse(jsonOrTrack) : jsonOrTrack;
  if (btn) { btn.innerHTML = '<div class="spinner"></div>'; btn.disabled = true; }
  showToast(`⬇️ Téléchargement de "${track.title}"…`);
  const res = await window.musicAPI.downloadTrack(track);
  if (res.success) {
    showToast('✓ Téléchargé !', 'Bibliothèque', () => navigate('library'));
    S.library = await window.musicAPI.getLibrary();
  } else {
    showToast('⚠️ Erreur de téléchargement');
    if (btn) { btn.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>'; btn.disabled = false; }
  }
}

function toggleDownload() {
  if (!S.track) return;
  downloadTrack(S.track, null);
}

// ── Save ──
async function saveToLibrary(jsonOrTrack) {
  const track = typeof jsonOrTrack === 'string' ? JSON.parse(jsonOrTrack) : jsonOrTrack;
  S.library.tracks = S.library.tracks || [];
  if (!S.library.tracks.find(t => t.id === track.id)) {
    S.library.tracks.push(track);
    await window.musicAPI.saveLibrary(S.library);
  }
  showToast('Enregistré dans la bibliothèque', 'Afficher', () => navigate('library'));
}

// ── New Playlist ──
function newPlaylist() {
  const name = prompt('Nom de la playlist :');
  if (!name) return;
  S.library.playlists = S.library.playlists || [];
  S.library.playlists.push({ id: `pl_${Date.now()}`, name, tracks: [], description: 'Playlist' });
  window.musicAPI.saveLibrary(S.library);
  renderSidebarPlaylists();
  showToast(`✓ Playlist "${name}" créée`);
}

function renderSidebarPlaylists() {
  const container = document.getElementById('sidebar-playlists');
  container.innerHTML = '';
  (S.library.playlists || []).forEach(pl => {
    const el = document.createElement('div');
    el.className = 'sidebar-pl-item';
    el.innerHTML = `<span class="sidebar-pl-name">${esc(pl.name)}</span><span class="sidebar-pl-sub">Playlist · Auto</span>`;
    el.onclick = () => navigate('library');
    container.appendChild(el);
  });
  // Default
  const def = document.createElement('div');
  def.className = 'sidebar-pl-item';
  def.innerHTML = `<span class="sidebar-pl-name">Episodes for Later</span><span class="sidebar-pl-sub">Auto playlist</span>`;
  container.appendChild(def);
}

// ── Queue Panel ──
function toggleQueue() {
  S.queueOpen = !S.queueOpen;
  const panel = document.getElementById('queue-panel');
  panel.classList.toggle('hidden', !S.queueOpen);
  document.getElementById('btn-queue').classList.toggle('active', S.queueOpen);
}

function renderQueuePanel() {
  const list = document.getElementById('qp-list');
  list.innerHTML = '';
  if (!S.queue.length) {
    list.innerHTML = `<div class="empty"><div class="empty-icon">📋</div><p>File vide</p></div>`;
    return;
  }
  S.queue.forEach((t, i) => {
    const el = document.createElement('div');
    el.className = `qp-item${i === S.qIdx ? ' playing' : ''}`;
    el.innerHTML = `
      <div class="qp-art">${t.thumbnail ? `<img src="${t.thumbnail}" />` : '🎵'}</div>
      <div class="qp-meta">
        <div class="qp-title">${esc(t.title)}</div>
        <div class="qp-artist">${esc(t.artist || '—')}</div>
      </div>
    `;
    el.onclick = () => { S.qIdx = i; playTrackObj(t); };
    list.appendChild(el);
  });
}

// ── Toast ──
let toastTimer;
function showToast(msg, actionLabel, actionFn) {
  const t = document.getElementById('toast');
  const m = document.getElementById('toast-msg');
  const a = document.getElementById('toast-action');
  m.textContent = msg;
  if (actionLabel && actionFn) {
    a.textContent = actionLabel;
    a.onclick = actionFn;
    a.classList.remove('hidden');
  } else {
    a.classList.add('hidden');
  }
  t.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(hideToast, 3500);
}
function hideToast() {
  document.getElementById('toast').classList.add('hidden');
}

// ── Audio events ──
audio.addEventListener('play', () => {
  S.playing = true;
  document.getElementById('icon-play').classList.add('hidden');
  document.getElementById('icon-pause').classList.remove('hidden');
});
audio.addEventListener('pause', () => {
  S.playing = false;
  document.getElementById('icon-play').classList.remove('hidden');
  document.getElementById('icon-pause').classList.add('hidden');
});
audio.addEventListener('timeupdate', () => {
  if (!audio.duration) return;
  const pct = (audio.currentTime / audio.duration) * 100;
  document.getElementById('p-fill').style.width = `${pct}%`;
  document.getElementById('p-thumb').style.right = `${100 - pct}%`;
  document.getElementById('p-current').textContent = fmtSec(audio.currentTime);
  document.getElementById('p-total').textContent = fmtSec(audio.duration);
});
audio.addEventListener('ended', () => {
  if (S.repeat === 'one') { audio.play(); return; }
  nextTrack();
});

// Close suggestions on outside click
document.addEventListener('click', e => {
  if (!document.getElementById('search-wrap').contains(e.target)) hideSuggestions();
});

// ── Utils ──
function fmtSec(s) {
  if (!s || isNaN(s)) return '0:00';
  return `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;
}
function esc(s) {
  return String(s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

// ── INIT ──
async function init() {
  S.library = await window.musicAPI.getLibrary();
  renderHome();
  renderSidebarPlaylists();
  renderQueuePanel();

  // Add local files shortcut
  document.addEventListener('keydown', e => {
    if (e.ctrlKey && e.key === 'o') addLocalFiles();
    if (e.key === ' ' && document.activeElement.tagName !== 'INPUT') { e.preventDefault(); togglePlay(); }
    if (e.key === 'ArrowRight' && e.ctrlKey) nextTrack();
    if (e.key === 'ArrowLeft' && e.ctrlKey) prevTrack();
  });
}

async function addLocalFiles() {
  const tracks = await window.musicAPI.addLocalFiles();
  if (tracks.length) {
    S.library = await window.musicAPI.getLibrary();
    showToast(`✓ ${tracks.length} fichier(s) ajouté(s)`, 'Bibliothèque', () => navigate('library'));
    renderSidebarPlaylists();
  }
}

init();

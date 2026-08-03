let currentUser = null;
let activeCommentArtworkId = null;
let searchTimeout = null;
let currentSearchTab = 'artworks';
let currentPublicProfileUsername = null;

const feedContainer = document.getElementById('feedContainer');
const userResultsContainer = document.getElementById('userResultsContainer');
const uploadModal = document.getElementById('uploadModal');
const commentModal = document.getElementById('commentModal');
const profileModal = document.getElementById('profileModal');
const publicProfileModal = document.getElementById('publicProfileModal');
const followListModal = document.getElementById('followListModal');

// ===== Inject ikon statis =====
function injectStaticIcons() {
  document.getElementById('iconLogo').innerHTML = Icons.logo + '<span>Gallery</span>';
  document.getElementById('uploadBtn').innerHTML = Icons.plus;
  document.getElementById('iconSearch').innerHTML = Icons.search;
  document.getElementById('closeUploadBtn').innerHTML = Icons.close;
  document.getElementById('closeCommentBtn').innerHTML = Icons.close;
  document.getElementById('cameraIconWrap').innerHTML = Icons.camera;
  document.getElementById('sendCommentBtn').innerHTML = Icons.send;
  document.getElementById('closeProfileBtn').innerHTML = Icons.close;
  document.getElementById('iconEditBadge').innerHTML = Icons.edit;
  document.getElementById('iconSwitch').innerHTML = Icons.switchAccount;
  document.getElementById('iconLogout').innerHTML = Icons.logout;
  document.getElementById('backFromPublicProfileBtn').innerHTML = Icons.back;
  document.getElementById('closePublicProfileBtn').innerHTML = Icons.close;
  document.getElementById('closeFollowListBtn').innerHTML = Icons.close;
  document.getElementById('iconGridPP').innerHTML = Icons.grid;
  document.getElementById('ppBioIcon').innerHTML = Icons.info;
}
injectStaticIcons();

// ===== Auth Modal (inline, tanpa redirect) =====
const authModal = document.getElementById('authModal');
const authLoginView = document.getElementById('authLoginView');
const authRegisterView = document.getElementById('authRegisterView');
const alertBox = document.getElementById('alertBox');
const regAlertBox = document.getElementById('regAlertBox');

const authForgotView = document.getElementById('authForgotView');
const forgotAlertBox = document.getElementById('forgotAlertBox');
const forgotStep1 = document.getElementById('forgotStep1');
const forgotStep2 = document.getElementById('forgotStep2');
const forgotStep3 = document.getElementById('forgotStep3');
let forgotEmailValue = '';
let forgotCodeValue = '';

function showAuthModal() {
  document.getElementById('authLogo').innerHTML = Icons.logo + '<span>Masuk</span>';
  authModal.style.display = 'flex';
  authLoginView.style.display = 'block';
  authRegisterView.style.display = 'none';
  authForgotView.style.display = 'none';
}
function hideAuthModal() {
  authModal.style.display = 'none';
}
function goHome() {
  window.location.href = '/';
}
function resetForgotFlow() {
  forgotStep1.style.display = 'block';
  forgotStep2.style.display = 'none';
  forgotStep3.style.display = 'none';
  forgotAlertBox.style.display = 'none';
  document.getElementById('forgotStep1Form').reset();
  document.getElementById('forgotStep2Form').reset();
  document.getElementById('forgotStep3Form').reset();
  forgotEmailValue = '';
  forgotCodeValue = '';
}

document.getElementById('closeAuthBtn').addEventListener('click', goHome);
document.getElementById('cancelLoginBtn').addEventListener('click', goHome);
document.getElementById('cancelRegisterBtn').addEventListener('click', goHome);
document.getElementById('showRegisterBtn').addEventListener('click', () => {
  authLoginView.style.display = 'none';
  authRegisterView.style.display = 'block';
  authForgotView.style.display = 'none';
  regAlertBox.style.display = 'none';
});
document.getElementById('showLoginBtn').addEventListener('click', () => {
  authRegisterView.style.display = 'none';
  authForgotView.style.display = 'none';
  authLoginView.style.display = 'block';
  alertBox.style.display = 'none';
});
document.getElementById('showForgotBtn').addEventListener('click', () => {
  authLoginView.style.display = 'none';
  authForgotView.style.display = 'block';
  resetForgotFlow();
});
document.getElementById('backToLoginFromForgotBtn').addEventListener('click', () => {
  authForgotView.style.display = 'none';
  authLoginView.style.display = 'block';
  alertBox.style.display = 'none';
});

// Tahap 1: kirim kode ke email
document.getElementById('forgotStep1Form').addEventListener('submit', async (e) => {
  e.preventDefault();
  forgotAlertBox.style.display = 'none';
  const email = document.getElementById('forgotEmail').value.trim();
  try {
    const res = await fetch('/api/forgot-password/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    if (!res.ok) {
      forgotAlertBox.textContent = data.error || 'Gagal mengirim kode';
      forgotAlertBox.style.display = 'block';
      return;
    }
    forgotEmailValue = email;
    document.getElementById('forgotEmailDisplay').textContent = email;
    forgotStep1.style.display = 'none';
    forgotStep2.style.display = 'block';
  } catch (err) {
    forgotAlertBox.textContent = 'Terjadi kesalahan koneksi';
    forgotAlertBox.style.display = 'block';
  }
});

// Tahap 2: verifikasi kode
document.getElementById('forgotStep2Form').addEventListener('submit', async (e) => {
  e.preventDefault();
  forgotAlertBox.style.display = 'none';
  const code = document.getElementById('forgotCode').value.trim();
  try {
    const res = await fetch('/api/forgot-password/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: forgotEmailValue, code })
    });
    const data = await res.json();
    if (!res.ok) {
      forgotAlertBox.textContent = data.error || 'Kode salah';
      forgotAlertBox.style.display = 'block';
      return;
    }
    forgotCodeValue = code;
    forgotStep2.style.display = 'none';
    forgotStep3.style.display = 'block';
  } catch (err) {
    forgotAlertBox.textContent = 'Terjadi kesalahan koneksi';
    forgotAlertBox.style.display = 'block';
  }
});

document.getElementById('forgotResendBtn').addEventListener('click', async () => {
  forgotAlertBox.style.display = 'none';
  try {
    const res = await fetch('/api/forgot-password/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: forgotEmailValue })
    });
    const data = await res.json();
    if (!res.ok) {
      forgotAlertBox.textContent = data.error || 'Gagal mengirim ulang kode';
      forgotAlertBox.style.display = 'block';
      return;
    }
    forgotAlertBox.textContent = 'Kode baru sudah dikirim.';
    forgotAlertBox.style.display = 'block';
  } catch (err) {
    forgotAlertBox.textContent = 'Terjadi kesalahan koneksi';
    forgotAlertBox.style.display = 'block';
  }
});

// Tahap 3: set password baru
document.getElementById('forgotStep3Form').addEventListener('submit', async (e) => {
  e.preventDefault();
  forgotAlertBox.style.display = 'none';
  const newPassword = document.getElementById('forgotNewPassword').value;
  try {
    const res = await fetch('/api/forgot-password/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: forgotEmailValue, code: forgotCodeValue, newPassword })
    });
    const data = await res.json();
    if (!res.ok) {
      forgotAlertBox.textContent = data.error || 'Gagal menyimpan password';
      forgotAlertBox.style.display = 'block';
      return;
    }
    authForgotView.style.display = 'none';
    authLoginView.style.display = 'block';
    alertBox.textContent = 'Password berhasil diubah. Silakan masuk dengan password baru.';
    alertBox.style.display = 'block';
    resetForgotFlow();
  } catch (err) {
    forgotAlertBox.textContent = 'Terjadi kesalahan koneksi';
    forgotAlertBox.style.display = 'block';
  }
});

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  alertBox.style.display = 'none';
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) {
      alertBox.textContent = data.error || 'Gagal masuk';
      alertBox.style.display = 'block';
      return;
    }
    currentUser = data.user;
    hideAuthModal();
    renderNavUser();
    loadArtworks();
  } catch (err) {
    alertBox.textContent = 'Terjadi kesalahan koneksi';
    alertBox.style.display = 'block';
  }
});

document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  regAlertBox.style.display = 'none';
  const username = document.getElementById('regUsername').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;
  try {
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });
    const data = await res.json();
    if (!res.ok) {
      regAlertBox.textContent = data.error || 'Gagal mendaftar';
      regAlertBox.style.display = 'block';
      return;
    }
    currentUser = data.user;
    hideAuthModal();
    renderNavUser();
    loadArtworks();
  } catch (err) {
    regAlertBox.textContent = 'Terjadi kesalahan koneksi';
    regAlertBox.style.display = 'block';
  }
});

// ===== Init =====
async function init() {
  const meRes = await fetch('/api/me');
  const meData = await meRes.json();
  if (!meData.user) {
    showAuthModal();
    return;
  }
  currentUser = meData.user;
  renderNavUser();
  loadArtworks();
}
init();

function avatarUrl(filename) {
  return filename ? `/assets/avatars/${filename}` : null;
}

function renderNavUser() {
  document.getElementById('navUsername').textContent = currentUser.display_name || currentUser.username;
  const img = document.getElementById('navAvatarImg');
  const fallback = document.getElementById('navAvatarFallback');
  const url = avatarUrl(currentUser.avatar);
  if (url) {
    img.src = url;
    img.style.display = 'block';
    fallback.style.display = 'none';
  } else {
    img.style.display = 'none';
    fallback.style.display = 'flex';
    fallback.textContent = (currentUser.display_name || currentUser.username).charAt(0).toUpperCase();
  }
}

// ===== Search =====
const searchTabsEl = document.getElementById('searchTabs');

document.getElementById('searchInput').addEventListener('input', (e) => {
  clearTimeout(searchTimeout);
  const q = e.target.value;
  searchTabsEl.style.display = q.trim() ? 'flex' : 'none';
  searchTimeout = setTimeout(() => runSearch(q), 300);
});

document.querySelectorAll('.search-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.search-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    currentSearchTab = tab.dataset.tab;
    runSearch(document.getElementById('searchInput').value);
  });
});

function runSearch(q) {
  if (currentSearchTab === 'users' && q.trim()) {
    userResultsContainer.style.display = 'flex';
    feedContainer.style.display = 'none';
    searchUsers(q);
  } else {
    userResultsContainer.style.display = 'none';
    feedContainer.style.display = 'flex';
    loadArtworks(q);
  }
}

// ===== Load Feed =====
let activeTagFilter = 'Semua';

async function loadArtworks(query = '') {
  const params = new URLSearchParams();
  if (query) params.set('q', query);
  if (activeTagFilter && activeTagFilter !== 'Semua') params.set('tag', activeTagFilter);
  const qs = params.toString();
  const res = await fetch('/api/artworks' + (qs ? `?${qs}` : ''));
  const artworks = await res.json();
  renderFeed(artworks);
}

// ===== Render chip filter tag di header feed =====
async function renderTagFilterRow() {
  const row = document.getElementById('tagFilterRow');
  if (!row) return;
  let tags = [];
  try {
    const res = await fetch('/api/tags');
    const data = await res.json();
    tags = data.tags || [];
  } catch (err) { tags = []; }

  const allTags = ['Semua', ...tags];
  row.innerHTML = allTags.map(t =>
    `<button type="button" class="tag-filter-chip ${t === activeTagFilter ? 'active' : ''}" data-tag="${t}">${t}</button>`
  ).join('');

  row.querySelectorAll('.tag-filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      activeTagFilter = chip.dataset.tag;
      row.querySelectorAll('.tag-filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      loadArtworks(document.getElementById('searchInput').value);
    });
  });
}
renderTagFilterRow();

// ===== Search Users =====
async function searchUsers(query) {
  if (!query.trim()) {
    userResultsContainer.innerHTML = '';
    return;
  }
  const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
  const users = await res.json();
  renderUserResults(users);
}

function renderUserResults(users) {
  userResultsContainer.innerHTML = '';
  if (users.length === 0) {
    userResultsContainer.innerHTML = '<div class="empty-feed">Tidak ada akun yang cocok</div>';
    return;
  }
  users.forEach(u => {
    const card = document.createElement('div');
    card.className = 'user-result-card';
    card.innerHTML = `
      ${avatarHtml(u)}
      <div class="user-result-info">
        <div class="user-result-name">${escapeHtml(u.display_name)}</div>
        <div class="user-result-username">@${escapeHtml(u.username)}</div>
        <div class="user-result-followers">${u.followers_count} pengikut · ${u.artworks_count} karya</div>
      </div>
      ${u.is_self ? '' : `<button class="user-follow-btn ${u.is_following ? 'following' : ''}" data-username="${escapeHtml(u.username)}">${u.is_following ? 'Mengikuti' : 'Ikuti'}</button>`}
    `;
    card.addEventListener('click', (e) => {
      if (e.target.closest('.user-follow-btn')) return;
      openPublicProfile(u.username);
    });
    const followBtn = card.querySelector('.user-follow-btn');
    if (followBtn) {
      followBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        await toggleFollow(u.username, followBtn.classList.contains('following'));
        searchUsers(document.getElementById('searchInput').value);
      });
    }
    userResultsContainer.appendChild(card);
  });
}

function avatarHtml(art, sizeClass) {
  const url = avatarUrl(art.avatar);
  if (url) {
    return `<div class="avatar-circle ${sizeClass || ''}"><img src="${url}"></div>`;
  }
  const initial = (art.display_name || art.username).charAt(0).toUpperCase();
  return `<div class="avatar-circle ${sizeClass || ''}">${initial}</div>`;
}

function renderFeed(artworks) {
  feedContainer.innerHTML = '';
  if (artworks.length === 0) {
    feedContainer.innerHTML = '<div class="empty-feed">Belum ada karya yang cocok</div>';
    return;
  }

  artworks.forEach(art => {
    const card = document.createElement('div');
    card.className = 'artwork-card';

    const isOwner = currentUser && currentUser.id === art.user_id;
    const likeColor = art.my_reaction === 'like' ? '#00b4ff' : '';
    const dislikeColor = art.my_reaction === 'dislike' ? '#ff3860' : '';

    const filenames = art.filenames && art.filenames.length ? art.filenames : (art.filename ? [art.filename] : []);
    const tags = art.tags || [];

    card.innerHTML = `
      <div class="artwork-card-header">
        <div class="artwork-user clickable" data-username="${escapeHtml(art.username)}">
          ${avatarHtml(art)}
          <span>${escapeHtml(art.display_name || art.username)}</span>
        </div>
        ${isOwner ? `<button class="delete-btn" data-id="${art.id}">${Icons.trash}</button>` : ''}
      </div>
      ${renderCarousel(filenames, art.title, art.id)}
      <div class="artwork-actions">
        <button class="action-btn like-btn" data-id="${art.id}" style="color:${likeColor}">
          ${art.my_reaction === 'like' ? Icons.thumbsUpFilled : Icons.thumbsUp} <span class="count">${art.likes}</span>
        </button>
        <button class="action-btn dislike-btn" data-id="${art.id}" style="color:${dislikeColor}">
          ${art.my_reaction === 'dislike' ? Icons.thumbsDownFilled : Icons.thumbsDown} <span class="count">${art.dislikes}</span>
        </button>
        <button class="action-btn comment-btn" data-id="${art.id}">
          ${Icons.comment} <span class="count">${art.comments_count}</span>
        </button>
      </div>
      <div class="artwork-body">
        <div class="artwork-title">${escapeHtml(art.title)}</div>
        ${art.description ? `<div class="artwork-desc">${escapeHtml(art.description)}</div>` : ''}
        ${tags.length ? `<div class="artwork-tags">${tags.map(t => `<span class="artwork-tag-badge">${escapeHtml(t)}</span>`).join('')}</div>` : ''}
        <div class="artwork-meta">${formatDate(art.created_at)}</div>
      </div>
    `;
    feedContainer.appendChild(card);
  });

  document.querySelectorAll('.like-btn').forEach(btn => btn.addEventListener('click', () => react(btn.dataset.id, 'like')));
  document.querySelectorAll('.dislike-btn').forEach(btn => btn.addEventListener('click', () => react(btn.dataset.id, 'dislike')));
  document.querySelectorAll('.comment-btn').forEach(btn => btn.addEventListener('click', () => openComments(btn.dataset.id)));
  document.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', (e) => { e.stopPropagation(); deleteArtwork(btn.dataset.id); }));
  document.querySelectorAll('.artwork-user.clickable').forEach(el => el.addEventListener('click', () => openPublicProfile(el.dataset.username)));
  initCarousels();
}

// ===== Carousel gambar (mendukung banyak gambar per karya) =====
function renderCarousel(filenames, title, artId) {
  if (filenames.length === 0) {
    return `<div class="artwork-carousel"></div>`;
  }
  if (filenames.length === 1) {
    return `<div class="artwork-carousel"><div class="artwork-carousel-track"><img src="/assets/${filenames[0]}" alt="${escapeHtml(title)}"></div></div>`;
  }
  const imgs = filenames.map(fn => `<img src="/assets/${fn}" alt="${escapeHtml(title)}">`).join('');
  const dots = filenames.map((_, i) => `<span class="${i === 0 ? 'active' : ''}"></span>`).join('');
  return `
    <div class="artwork-carousel" data-artwork-carousel="${artId}" data-current="0" data-total="${filenames.length}">
      <div class="artwork-carousel-track">${imgs}</div>
      <button type="button" class="artwork-carousel-nav prev">&#8249;</button>
      <button type="button" class="artwork-carousel-nav next">&#8250;</button>
      <div class="artwork-carousel-dots">${dots}</div>
      <div class="artwork-carousel-count">1/${filenames.length}</div>
    </div>`;
}

function initCarousels() {
  document.querySelectorAll('[data-artwork-carousel]').forEach(carousel => {
    const track = carousel.querySelector('.artwork-carousel-track');
    const dots = carousel.querySelectorAll('.artwork-carousel-dots span');
    const countLabel = carousel.querySelector('.artwork-carousel-count');
    const total = Number(carousel.dataset.total);

    function goTo(idx) {
      idx = Math.max(0, Math.min(total - 1, idx));
      carousel.dataset.current = idx;
      track.style.transform = `translateX(-${idx * 100}%)`;
      dots.forEach((d, i) => d.classList.toggle('active', i === idx));
      countLabel.textContent = `${idx + 1}/${total}`;
    }

    carousel.querySelector('.artwork-carousel-nav.prev').addEventListener('click', (e) => {
      e.stopPropagation();
      goTo(Number(carousel.dataset.current) - 1);
    });
    carousel.querySelector('.artwork-carousel-nav.next').addEventListener('click', (e) => {
      e.stopPropagation();
      goTo(Number(carousel.dataset.current) + 1);
    });

    // Swipe di layar sentuh
    let touchStartX = 0;
    carousel.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; }, { passive: true });
    carousel.addEventListener('touchend', (e) => {
      const diff = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(diff) > 40) {
        goTo(Number(carousel.dataset.current) + (diff < 0 ? 1 : -1));
      }
    }, { passive: true });
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'Z');
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ===== React (like/dislike) =====
async function react(artworkId, type) {
  const res = await fetch(`/api/artworks/${artworkId}/react`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type })
  });
  if (res.ok) {
    loadArtworks(document.getElementById('searchInput').value);
  }
}

// ===== Delete =====
async function deleteArtwork(id) {
  if (!confirm('Hapus karya ini?')) return;
  const res = await fetch(`/api/artworks/${id}`, { method: 'DELETE' });
  if (res.ok) loadArtworks(document.getElementById('searchInput').value);
}

// ===== Upload Modal =====
document.getElementById('uploadBtn').addEventListener('click', () => {
  uploadModal.style.display = 'flex';
});
document.getElementById('closeUploadBtn').addEventListener('click', () => {
  uploadModal.style.display = 'none';
  resetUploadForm();
});

const imageInput = document.getElementById('imageInput');
const previewArea = document.getElementById('previewArea');
const fileDrop = document.getElementById('fileDrop');
const imageThumbStrip = document.getElementById('imageThumbStrip');
const tagPicker = document.getElementById('tagPicker');
const MAX_IMAGES = 5;
const MAX_TAGS = 5;

let selectedFiles = [];   // array of File
let selectedTags = [];    // array of string
let availableTags = [];

// ===== Muat daftar tag dari server, render sebagai chip yang bisa dipilih =====
async function loadTagPicker() {
  try {
    const res = await fetch('/api/tags');
    const data = await res.json();
    availableTags = data.tags || [];
  } catch (err) {
    availableTags = [];
  }
  tagPicker.innerHTML = availableTags.map(t =>
    `<button type="button" class="tag-chip" data-tag="${t}">${t}</button>`
  ).join('');
  tagPicker.querySelectorAll('.tag-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const tag = chip.dataset.tag;
      if (selectedTags.includes(tag)) {
        selectedTags = selectedTags.filter(t => t !== tag);
        chip.classList.remove('selected');
      } else {
        if (selectedTags.length >= MAX_TAGS) return;
        selectedTags.push(tag);
        chip.classList.add('selected');
      }
    });
  });
}
loadTagPicker();

// ===== Render ulang thumbnail strip berdasarkan selectedFiles =====
function renderThumbStrip() {
  if (selectedFiles.length === 0) {
    imageThumbStrip.style.display = 'none';
    imageThumbStrip.innerHTML = '';
    previewArea.style.display = 'flex';
    return;
  }
  previewArea.style.display = 'none';
  imageThumbStrip.style.display = 'flex';
  imageThumbStrip.innerHTML = selectedFiles.map((file, idx) => {
    const url = URL.createObjectURL(file);
    return `<div class="image-thumb-item">
      <img src="${url}">
      ${idx === 0 ? '<span class="thumb-cover-badge">SAMPUL</span>' : ''}
      <button type="button" class="thumb-remove" data-idx="${idx}">&times;</button>
    </div>`;
  }).join('') + (selectedFiles.length < MAX_IMAGES ? `<div class="image-thumb-add" id="addMoreImagesBtn">+</div>` : '');

  imageThumbStrip.querySelectorAll('.thumb-remove').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = Number(btn.dataset.idx);
      selectedFiles.splice(idx, 1);
      renderThumbStrip();
    });
  });
  const addBtn = document.getElementById('addMoreImagesBtn');
  if (addBtn) addBtn.addEventListener('click', () => imageInput.click());
}

function addFiles(fileList) {
  const files = Array.from(fileList).filter(f => f.type.startsWith('image/'));
  const room = MAX_IMAGES - selectedFiles.length;
  if (room <= 0) {
    alert(`Maksimal ${MAX_IMAGES} gambar per karya`);
    return;
  }
  selectedFiles = selectedFiles.concat(files.slice(0, room));
  renderThumbStrip();
}

imageInput.addEventListener('change', () => {
  addFiles(imageInput.files);
  imageInput.value = ''; // reset supaya bisa pilih file yang sama lagi
});

// ===== Drag & drop =====
['dragenter', 'dragover'].forEach(evt => {
  fileDrop.addEventListener(evt, (e) => {
    e.preventDefault();
    fileDrop.classList.add('drag-active');
  });
});
['dragleave', 'drop'].forEach(evt => {
  fileDrop.addEventListener(evt, (e) => {
    e.preventDefault();
    fileDrop.classList.remove('drag-active');
  });
});
fileDrop.addEventListener('drop', (e) => {
  if (e.dataTransfer && e.dataTransfer.files) {
    addFiles(e.dataTransfer.files);
  }
});

// ===== Submit upload dengan progress bar (XHR, karena fetch belum support upload progress) =====
document.getElementById('uploadForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const title = document.getElementById('titleInput').value.trim();
  const description = document.getElementById('descInput').value.trim();

  if (selectedFiles.length === 0 || !title) {
    alert('Minimal 1 gambar dan judul wajib diisi');
    return;
  }

  const formData = new FormData();
  selectedFiles.forEach(f => formData.append('images', f));
  formData.append('title', title);
  formData.append('description', description);
  selectedTags.forEach(t => formData.append('tags', t));

  const submitBtn = document.getElementById('uploadSubmitBtn');
  const progressWrap = document.getElementById('uploadProgressWrap');
  const progressFill = document.getElementById('uploadProgressFill');
  const progressLabel = document.getElementById('uploadProgressLabel');

  submitBtn.disabled = true;
  submitBtn.textContent = 'Mengunggah...';
  progressWrap.style.display = 'flex';
  progressFill.style.width = '0%';
  progressLabel.textContent = '0%';

  const xhr = new XMLHttpRequest();
  xhr.open('POST', '/api/artworks');

  xhr.upload.addEventListener('progress', (evt) => {
    if (evt.lengthComputable) {
      const pct = Math.round((evt.loaded / evt.total) * 100);
      progressFill.style.width = pct + '%';
      progressLabel.textContent = pct + '%';
    }
  });

  xhr.addEventListener('load', () => {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Bagikan';
    progressWrap.style.display = 'none';
    let data = {};
    try { data = JSON.parse(xhr.responseText); } catch (err) {}
    if (xhr.status >= 200 && xhr.status < 300) {
      uploadModal.style.display = 'none';
      resetUploadForm();
      loadArtworks();
    } else {
      alert(data.error || 'Gagal upload');
    }
  });

  xhr.addEventListener('error', () => {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Bagikan';
    progressWrap.style.display = 'none';
    alert('Terjadi kesalahan koneksi saat upload');
  });

  xhr.send(formData);
});

function resetUploadForm() {
  document.getElementById('uploadForm').reset();
  selectedFiles = [];
  selectedTags = [];
  tagPicker.querySelectorAll('.tag-chip.selected').forEach(c => c.classList.remove('selected'));
  renderThumbStrip();
  previewArea.innerHTML = `<div id="cameraIconWrap">${Icons.camera}</div><span>Klik atau seret gambar ke sini (maks. 5)</span>`;
}

// ===== Comment Modal =====
async function openComments(artworkId) {
  activeCommentArtworkId = artworkId;
  commentModal.style.display = 'flex';
  await loadComments(artworkId);
}

document.getElementById('closeCommentBtn').addEventListener('click', () => {
  commentModal.style.display = 'none';
  activeCommentArtworkId = null;
});

async function loadComments(artworkId) {
  const res = await fetch(`/api/artworks/${artworkId}/comments`);
  const comments = await res.json();
  const list = document.getElementById('commentList');
  list.innerHTML = '';

  if (comments.length === 0) {
    list.innerHTML = '<div class="comment-empty">Belum ada komentar. Jadilah yang pertama!</div>';
    return;
  }

  comments.forEach(c => {
    const item = document.createElement('div');
    item.className = 'comment-item';
    item.innerHTML = `
      <div class="comment-user-click" data-username="${escapeHtml(c.username)}">${avatarHtml(c, 'small')}</div>
      <div class="comment-text"><b class="comment-user-click" data-username="${escapeHtml(c.username)}">${escapeHtml(c.display_name || c.username)}</b>${escapeHtml(c.content)}</div>
    `;
    list.appendChild(item);
  });
  list.scrollTop = list.scrollHeight;
  document.querySelectorAll('#commentList .comment-user-click').forEach(el => {
    el.addEventListener('click', () => {
      commentModal.style.display = 'none';
      openPublicProfile(el.dataset.username);
    });
  });
}

document.getElementById('commentForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const input = document.getElementById('commentInput');
  const content = input.value.trim();
  if (!content || !activeCommentArtworkId) return;

  const res = await fetch(`/api/artworks/${activeCommentArtworkId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content })
  });

  if (res.ok) {
    input.value = '';
    await loadComments(activeCommentArtworkId);
    loadArtworks(document.getElementById('searchInput').value);
  }
});

// ===== Profile Modal =====
document.getElementById('profileBtn').addEventListener('click', openProfileModal);
document.getElementById('closeProfileBtn').addEventListener('click', () => {
  profileModal.style.display = 'none';
});

function renderProfileModal() {
  document.getElementById('profileUsernameLabel').textContent = '@' + currentUser.username;
  document.getElementById('displayNameInput').value = currentUser.display_name || '';
  document.getElementById('bioInput').value = currentUser.bio || '';

  const img = document.getElementById('profileAvatarImg');
  const fallback = document.getElementById('profileAvatarFallback');
  const url = avatarUrl(currentUser.avatar);
  if (url) {
    img.src = url;
    img.style.display = 'block';
    fallback.style.display = 'none';
  } else {
    img.style.display = 'none';
    fallback.style.display = 'flex';
    fallback.textContent = (currentUser.display_name || currentUser.username).charAt(0).toUpperCase();
  }
}

function openProfileModal() {
  renderProfileModal();
  document.getElementById('profileAlert').style.display = 'none';
  profileModal.style.display = 'flex';
}

document.getElementById('avatarClickArea').addEventListener('click', () => {
  document.getElementById('avatarInput').click();
});

document.getElementById('avatarInput').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('avatar', file);

  const res = await fetch('/api/profile/avatar', { method: 'POST', body: formData });
  const data = await res.json();
  const alertBox = document.getElementById('profileAlert');

  if (!res.ok) {
    alertBox.textContent = data.error || 'Gagal upload avatar';
    alertBox.style.display = 'block';
    return;
  }

  currentUser = data.user;
  renderProfileModal();
  renderNavUser();
  loadArtworks(document.getElementById('searchInput').value);
});

document.getElementById('profileForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const display_name = document.getElementById('displayNameInput').value;
  const bio = document.getElementById('bioInput').value;
  const alertBox = document.getElementById('profileAlert');
  alertBox.style.display = 'none';

  const submitBtn = e.target.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Menyimpan...';

  try {
    const res = await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ display_name, bio })
    });
    const data = await res.json();
    if (!res.ok) {
      alertBox.textContent = data.error || 'Gagal menyimpan';
      alertBox.style.display = 'block';
      return;
    }
    currentUser = data.user;
    renderNavUser();
    loadArtworks(document.getElementById('searchInput').value);
    profileModal.style.display = 'none';
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Simpan Perubahan';
  }
});

document.getElementById('logoutBtn').addEventListener('click', async () => {
  await fetch('/api/logout', { method: 'POST' });
  window.location.href = '/';
});

document.getElementById('switchAccountBtn').addEventListener('click', async () => {
  await fetch('/api/logout', { method: 'POST' });
  currentUser = null;
  showAuthModal();
});

// ===== Profil Publik (kunjungi profil user lain / lihat karya + follow) =====
async function openPublicProfile(username) {
  if (!username) return;
  currentPublicProfileUsername = username;
  publicProfileModal.style.display = 'flex';
  document.getElementById('publicProfileBody').style.opacity = '0.4';

  const res = await fetch(`/api/users/${encodeURIComponent(username)}`);
  if (!res.ok) {
    publicProfileModal.style.display = 'none';
    alert('User tidak ditemukan');
    return;
  }
  const { profile, artworks } = await res.json();
  renderPublicProfile(profile, artworks);
  document.getElementById('publicProfileBody').style.opacity = '1';
}

function renderPublicProfile(profile, artworks) {
  document.getElementById('publicProfileTitleUsername').textContent = '@' + profile.username;
  document.getElementById('ppUsernameLabel').textContent = '@' + profile.username;
  document.getElementById('ppDisplayName').textContent = profile.display_name;

  const img = document.getElementById('ppAvatarImg');
  const fallback = document.getElementById('ppAvatarFallback');
  const url = avatarUrl(profile.avatar);
  if (url) {
    img.src = url;
    img.style.display = 'block';
    fallback.style.display = 'none';
  } else {
    img.style.display = 'none';
    fallback.style.display = 'flex';
    fallback.textContent = profile.display_name.charAt(0).toUpperCase();
  }

  document.getElementById('ppArtworksCount').textContent = profile.artworks_count;
  document.getElementById('ppFollowersCount').textContent = profile.followers_count;
  document.getElementById('ppFollowingCount').textContent = profile.following_count;

  const bioBox = document.getElementById('ppBioBox');
  if (profile.bio) {
    bioBox.style.display = 'flex';
    document.getElementById('ppBioText').textContent = profile.bio;
  } else {
    bioBox.style.display = 'none';
  }

  document.getElementById('ppJoined').innerHTML = `${Icons.calendar} Bergabung ${formatDate(profile.created_at)}`;

  const followBtn = document.getElementById('ppFollowBtn');
  if (profile.is_self) {
    followBtn.style.display = 'none';
  } else {
    followBtn.style.display = 'block';
    followBtn.textContent = profile.is_following ? 'Mengikuti' : 'Ikuti';
    followBtn.className = 'btn-primary pp-follow-btn' + (profile.is_following ? ' following' : '');
    followBtn.onclick = async () => {
      followBtn.disabled = true;
      await toggleFollow(profile.username, profile.is_following);
      await openPublicProfile(profile.username);
      followBtn.disabled = false;
    };
  }

  const grid = document.getElementById('ppArtworkGrid');
  grid.innerHTML = '';
  if (artworks.length === 0) {
    grid.innerHTML = '<div class="pp-empty-artworks">Belum ada karya yang diunggah</div>';
  } else {
    artworks.forEach(a => {
      const thumb = document.createElement('div');
      thumb.className = 'pp-artwork-thumb';
      const coverFile = (a.filenames && a.filenames[0]) || a.filename || '';
      thumb.innerHTML = `<img src="/assets/${coverFile}" alt="${escapeHtml(a.title)}">`;
      thumb.addEventListener('click', () => {
        publicProfileModal.style.display = 'none';
        openComments(a.id);
      });
      grid.appendChild(thumb);
    });
  }
}

async function toggleFollow(username, isCurrentlyFollowing) {
  const endpoint = isCurrentlyFollowing ? 'unfollow' : 'follow';
  const res = await fetch(`/api/users/${encodeURIComponent(username)}/${endpoint}`, { method: 'POST' });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    alert(data.error || 'Gagal memproses follow');
    return;
  }
  // refresh currentUser jika kita follow/unfollow sendiri terpengaruh (mis. following count)
  const meRes = await fetch('/api/me');
  const meData = await meRes.json();
  if (meData.user) currentUser = meData.user;
}

document.getElementById('closePublicProfileBtn').addEventListener('click', () => {
  publicProfileModal.style.display = 'none';
  currentPublicProfileUsername = null;
});
document.getElementById('backFromPublicProfileBtn').addEventListener('click', () => {
  publicProfileModal.style.display = 'none';
  currentPublicProfileUsername = null;
});

// Klik nama sendiri di navbar -> tetap buka modal edit profil (bukan profil publik)
// Tapi tambahkan cara melihat profil publik diri sendiri lewat statistik pada modal edit profil
document.getElementById('profileUsernameLabel').style.cursor = 'pointer';
document.getElementById('profileUsernameLabel').title = 'Lihat sebagai profil publik';
document.getElementById('profileUsernameLabel').addEventListener('click', () => {
  profileModal.style.display = 'none';
  openPublicProfile(currentUser.username);
});

// ===== Followers / Following List =====
document.getElementById('ppFollowersStat').addEventListener('click', () => openFollowList('followers'));
document.getElementById('ppFollowingStat').addEventListener('click', () => openFollowList('following'));

async function openFollowList(type) {
  if (!currentPublicProfileUsername) return;
  const res = await fetch(`/api/users/${encodeURIComponent(currentPublicProfileUsername)}/${type}`);
  const users = await res.json();
  document.getElementById('followListTitle').textContent = type === 'followers' ? 'Pengikut' : 'Mengikuti';
  const body = document.getElementById('followListBody');
  body.innerHTML = '';

  if (users.length === 0) {
    body.innerHTML = `<div class="follow-list-empty">${type === 'followers' ? 'Belum ada pengikut' : 'Belum mengikuti siapa pun'}</div>`;
  } else {
    users.forEach(u => {
      const item = document.createElement('div');
      item.className = 'follow-list-item';
      item.innerHTML = `
        ${avatarHtml(u, 'small')}
        <div class="fl-info">
          <div class="fl-name">${escapeHtml(u.display_name)}</div>
          <div class="fl-username">@${escapeHtml(u.username)}</div>
        </div>
      `;
      item.addEventListener('click', () => {
        followListModal.style.display = 'none';
        openPublicProfile(u.username);
      });
      body.appendChild(item);
    });
  }
  followListModal.style.display = 'flex';
}

document.getElementById('closeFollowListBtn').addEventListener('click', () => {
  followListModal.style.display = 'none';
});

// Close modals saat klik di luar area card
[uploadModal, commentModal, profileModal, publicProfileModal, followListModal].forEach(modal => {
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.style.display = 'none';
    }
  });
});

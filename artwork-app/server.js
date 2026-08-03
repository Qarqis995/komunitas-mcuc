const express = require('express');
const session = require('express-session');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('./db');
require('dotenv').config();
const mailer = require('./mailer');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// ==== Direktori ====
const ROOT_DIR = __dirname;
const DATA_DIR = path.join(__dirname, 'data');
const ASSETS_DIR = path.join(__dirname, 'assets');
const AVATAR_DIR = path.join(__dirname, 'assets', 'avatars');
const SITE_ASSETS_DIR = path.join(ROOT_DIR, 'assets');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(ASSETS_DIR)) fs.mkdirSync(ASSETS_DIR, { recursive: true });
if (!fs.existsSync(AVATAR_DIR)) fs.mkdirSync(AVATAR_DIR, { recursive: true });

// ==== Middleware ====
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/assets', express.static(ASSETS_DIR));
// Aset bersama halaman utama (foto grup, icon, manifest, dll)
app.use('/site-assets', express.static(SITE_ASSETS_DIR));
// Webmaker disajikan dari origin yang sama supaya session cookie login tetap berlaku
app.use('/webmaker', express.static(path.join(ROOT_DIR, 'Webmaker')));
app.use(session({
  secret: 'artwork-gallery-secret-key-ganti-jika-perlu',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 } // 7 hari
}));

function requireLogin(req, res, next) {
  if (!req.session.user) return res.status(401).json({ error: 'Belum login' });
  next();
}

function publicUser(u) {
  return {
    id: u.id,
    username: u.username,
    email: u.email || null,
    display_name: u.display_name || u.username,
    bio: u.bio || '',
    avatar: u.avatar || null
  };
}

// Profil publik lengkap dengan statistik follow & karya, tanpa password
function publicProfile(data, u, viewerId) {
  const followers = data.follows.filter(f => f.following_id === u.id).length;
  const following = data.follows.filter(f => f.follower_id === u.id).length;
  const artworksCount = data.artworks.filter(a => a.user_id === u.id).length;
  const isFollowing = viewerId
    ? !!data.follows.find(f => f.follower_id === viewerId && f.following_id === u.id)
    : false;
  return {
    id: u.id,
    username: u.username,
    display_name: u.display_name || u.username,
    bio: u.bio || '',
    avatar: u.avatar || null,
    created_at: u.created_at,
    followers_count: followers,
    following_count: following,
    artworks_count: artworksCount,
    is_following: isFollowing,
    is_self: viewerId === u.id
  };
}

// ==== Multer untuk upload gambar karya ====
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, ASSETS_DIR),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const ok = allowed.test(path.extname(file.originalname).toLowerCase());
    cb(ok ? null : new Error('Format file tidak didukung'), ok);
  }
});

// ==== Multer untuk upload foto profil ====
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, AVATAR_DIR),
  filename: (req, file, cb) => {
    const unique = 'avatar-' + Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});
const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const ok = allowed.test(path.extname(file.originalname).toLowerCase());
    cb(ok ? null : new Error('Format file tidak didukung'), ok);
  }
});

// ================= AUTH =================
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

app.post('/api/register', (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) return res.status(400).json({ error: 'Username, email & password wajib diisi' });
  if (username.length < 3) return res.status(400).json({ error: 'Username minimal 3 karakter' });
  if (!EMAIL_REGEX.test(email)) return res.status(400).json({ error: 'Format email tidak valid' });
  if (password.length < 4) return res.status(400).json({ error: 'Password minimal 4 karakter' });

  const data = db.load();
  const usernameTaken = data.users.find(u => u.username.toLowerCase() === username.toLowerCase());
  if (usernameTaken) return res.status(409).json({ error: 'Username sudah dipakai' });
  const emailTaken = data.users.find(u => u.email && u.email.toLowerCase() === email.toLowerCase());
  if (emailTaken) return res.status(409).json({ error: 'Email sudah terdaftar' });

  const newUser = {
    id: db.nextId(data, 'users'),
    username,
    email,
    password, // tanpa enkripsi sesuai permintaan
    display_name: username,
    bio: '',
    avatar: null,
    created_at: new Date().toISOString()
  };
  data.users.push(newUser);
  db.save(data);

  req.session.user = { id: newUser.id, username: newUser.username };
  res.json({ success: true, user: publicUser(newUser) });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const data = db.load();
  const user = data.users.find(u => u.username === username);
  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Username atau password salah' });
  }
  req.session.user = { id: user.id, username: user.username };
  res.json({ success: true, user: publicUser(user) });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => res.json({ success: true }));
});

// ================= FORGOT PASSWORD (kode 6 digit via email) =================
const RESET_CODE_TTL_MS = 10 * 60 * 1000; // 10 menit
const RESET_CODE_MIN_INTERVAL_MS = 60 * 1000; // minimal jeda 60 detik antar kirim ulang (anti-spam)

function generateResetCode() {
  // 6 digit angka, termasuk kemungkinan diawali 0 (mis. "004521")
  return String(crypto.randomInt(0, 1000000)).padStart(6, '0');
}

// Langkah 1: user masukkan email -> sistem kirim kode 6 digit
app.post('/api/forgot-password/request', async (req, res) => {
  const { email } = req.body;
  if (!email || !EMAIL_REGEX.test(email)) {
    return res.status(400).json({ error: 'Masukkan alamat email yang valid' });
  }

  const data = db.load();
  const user = data.users.find(u => u.email && u.email.toLowerCase() === email.toLowerCase());

  // Demi keamanan, selalu balas sukses walau email tidak ditemukan
  // (supaya orang luar tidak bisa "menebak" email mana yang terdaftar).
  if (!user) {
    return res.json({ success: true, message: 'Jika email terdaftar, kode reset sudah dikirim.' });
  }

  // Cegah spam kirim ulang terlalu cepat
  const recent = data.resetCodes
    .filter(r => r.email.toLowerCase() === email.toLowerCase())
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
  if (recent && (Date.now() - new Date(recent.created_at).getTime()) < RESET_CODE_MIN_INTERVAL_MS) {
    return res.status(429).json({ error: 'Tunggu sebentar sebelum minta kode baru' });
  }

  const code = generateResetCode();
  const now = new Date();
  // Hapus kode lama untuk email ini biar gak numpuk
  data.resetCodes = data.resetCodes.filter(r => r.email.toLowerCase() !== email.toLowerCase());
  data.resetCodes.push({
    email: user.email,
    code,
    created_at: now.toISOString(),
    expires_at: new Date(now.getTime() + RESET_CODE_TTL_MS).toISOString(),
    verified: false
  });
  db.save(data);

  try {
    await mailer.sendResetCode(user.email, code, user.username);
  } catch (err) {
    console.error('[forgot-password] gagal kirim email:', err.message);
    return res.status(500).json({ error: 'Gagal mengirim email. Coba lagi nanti.' });
  }

  res.json({ success: true, message: 'Jika email terdaftar, kode reset sudah dikirim.' });
});

// Langkah 2: user masukkan kode 6 digit -> verifikasi
app.post('/api/forgot-password/verify', (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) return res.status(400).json({ error: 'Email & kode wajib diisi' });

  const data = db.load();
  const entry = data.resetCodes.find(r => r.email.toLowerCase() === email.toLowerCase());
  if (!entry) return res.status(400).json({ error: 'Kode tidak ditemukan, minta kode baru' });
  if (new Date(entry.expires_at).getTime() < Date.now()) {
    return res.status(400).json({ error: 'Kode sudah kadaluarsa, minta kode baru' });
  }
  if (entry.code !== String(code).trim()) {
    return res.status(400).json({ error: 'Kode salah' });
  }

  entry.verified = true;
  db.save(data);
  res.json({ success: true });
});

// Langkah 3: setelah kode terverifikasi -> user set password baru
app.post('/api/forgot-password/reset', (req, res) => {
  const { email, code, newPassword } = req.body;
  if (!email || !code || !newPassword) return res.status(400).json({ error: 'Data tidak lengkap' });
  if (newPassword.length < 4) return res.status(400).json({ error: 'Password minimal 4 karakter' });

  const data = db.load();
  const entry = data.resetCodes.find(r => r.email.toLowerCase() === email.toLowerCase());
  if (!entry || !entry.verified || entry.code !== String(code).trim()) {
    return res.status(400).json({ error: 'Verifikasi kode belum selesai atau tidak valid' });
  }
  if (new Date(entry.expires_at).getTime() < Date.now()) {
    return res.status(400).json({ error: 'Kode sudah kadaluarsa, minta kode baru' });
  }

  const user = data.users.find(u => u.email && u.email.toLowerCase() === email.toLowerCase());
  if (!user) return res.status(404).json({ error: 'Akun tidak ditemukan' });

  user.password = newPassword; // tanpa enkripsi, konsisten dengan skema yang ada
  // Kode reset sekali pakai -> hapus setelah dipakai
  data.resetCodes = data.resetCodes.filter(r => r.email.toLowerCase() !== email.toLowerCase());
  db.save(data);

  res.json({ success: true, message: 'Password berhasil diubah, silakan login.' });
});

app.get('/api/me', (req, res) => {
  if (!req.session.user) return res.json({ user: null });
  const data = db.load();
  const user = data.users.find(u => u.id === req.session.user.id);
  if (!user) return res.json({ user: null });
  res.json({ user: publicProfile(data, user, user.id) });
});

// ================= USER PROFILE (PUBLIC) & FOLLOW =================

// Cari user berdasarkan username (untuk fitur search user)
app.get('/api/users/search', (req, res) => {
  const { q } = req.query;
  const data = db.load();
  const viewerId = req.session.user ? req.session.user.id : 0;
  if (!q || q.trim() === '') return res.json([]);

  const qLower = q.toLowerCase();
  const rows = data.users
    .filter(u => u.username.toLowerCase().includes(qLower) || (u.display_name || '').toLowerCase().includes(qLower))
    .slice(0, 20)
    .map(u => publicProfile(data, u, viewerId));

  res.json(rows);
});

// Ambil profil publik lengkap + daftar karya milik user berdasarkan username
app.get('/api/users/:username', (req, res) => {
  const data = db.load();
  const viewerId = req.session.user ? req.session.user.id : 0;
  const user = data.users.find(u => u.username.toLowerCase() === req.params.username.toLowerCase());
  if (!user) return res.status(404).json({ error: 'User tidak ditemukan' });

  const artworks = data.artworks
    .filter(a => a.user_id === user.id)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .map(a => {
      const likes = data.reactions.filter(r => r.artwork_id === a.id && r.type === 'like').length;
      const dislikes = data.reactions.filter(r => r.artwork_id === a.id && r.type === 'dislike').length;
      const commentsCount = data.comments.filter(c => c.artwork_id === a.id).length;
      const myReaction = viewerId ? data.reactions.find(r => r.artwork_id === a.id && r.user_id === viewerId) : null;
      return {
        ...a,
        username: user.username,
        display_name: user.display_name || user.username,
        avatar: user.avatar,
        likes,
        dislikes,
        comments_count: commentsCount,
        my_reaction: myReaction ? myReaction.type : null
      };
    });

  res.json({ profile: publicProfile(data, user, viewerId), artworks });
});

// Daftar followers / following seseorang (untuk ditampilkan di profil)
app.get('/api/users/:username/followers', (req, res) => {
  const data = db.load();
  const viewerId = req.session.user ? req.session.user.id : 0;
  const user = data.users.find(u => u.username.toLowerCase() === req.params.username.toLowerCase());
  if (!user) return res.status(404).json({ error: 'User tidak ditemukan' });

  const followerIds = data.follows.filter(f => f.following_id === user.id).map(f => f.follower_id);
  const rows = data.users.filter(u => followerIds.includes(u.id)).map(u => publicProfile(data, u, viewerId));
  res.json(rows);
});

app.get('/api/users/:username/following', (req, res) => {
  const data = db.load();
  const viewerId = req.session.user ? req.session.user.id : 0;
  const user = data.users.find(u => u.username.toLowerCase() === req.params.username.toLowerCase());
  if (!user) return res.status(404).json({ error: 'User tidak ditemukan' });

  const followingIds = data.follows.filter(f => f.follower_id === user.id).map(f => f.following_id);
  const rows = data.users.filter(u => followingIds.includes(u.id)).map(u => publicProfile(data, u, viewerId));
  res.json(rows);
});

// Follow user
app.post('/api/users/:username/follow', requireLogin, (req, res) => {
  const data = db.load();
  const target = data.users.find(u => u.username.toLowerCase() === req.params.username.toLowerCase());
  if (!target) return res.status(404).json({ error: 'User tidak ditemukan' });
  if (target.id === req.session.user.id) return res.status(400).json({ error: 'Tidak bisa follow diri sendiri' });

  const already = data.follows.find(f => f.follower_id === req.session.user.id && f.following_id === target.id);
  if (!already) {
    data.follows.push({
      id: db.nextId(data, 'follows'),
      follower_id: req.session.user.id,
      following_id: target.id,
      created_at: new Date().toISOString()
    });
    db.save(data);
  }

  const fresh = db.load();
  res.json({ success: true, profile: publicProfile(fresh, target, req.session.user.id) });
});

// Unfollow user
app.post('/api/users/:username/unfollow', requireLogin, (req, res) => {
  const data = db.load();
  const target = data.users.find(u => u.username.toLowerCase() === req.params.username.toLowerCase());
  if (!target) return res.status(404).json({ error: 'User tidak ditemukan' });

  data.follows = data.follows.filter(f => !(f.follower_id === req.session.user.id && f.following_id === target.id));
  db.save(data);

  const fresh = db.load();
  res.json({ success: true, profile: publicProfile(fresh, target, req.session.user.id) });
});

// ================= PROFILE =================
app.put('/api/profile', requireLogin, (req, res) => {
  const { display_name, bio } = req.body;
  const data = db.load();
  const user = data.users.find(u => u.id === req.session.user.id);
  if (!user) return res.status(404).json({ error: 'User tidak ditemukan' });

  if (display_name !== undefined) {
    const trimmed = display_name.trim();
    user.display_name = trimmed === '' ? user.username : trimmed.slice(0, 50);
  }
  if (bio !== undefined) {
    user.bio = bio.trim().slice(0, 150);
  }
  db.save(data);
  res.json({ success: true, user: publicUser(user) });
});

app.post('/api/profile/avatar', requireLogin, uploadAvatar.single('avatar'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'File avatar wajib diisi' });
  const data = db.load();
  const user = data.users.find(u => u.id === req.session.user.id);
  if (!user) return res.status(404).json({ error: 'User tidak ditemukan' });

  // hapus avatar lama jika ada
  if (user.avatar) {
    const oldPath = path.join(AVATAR_DIR, user.avatar);
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
  }

  user.avatar = req.file.filename;
  db.save(data);
  res.json({ success: true, user: publicUser(user) });
});

// ================= ARTWORKS =================
const ALLOWED_TAGS = ['Fanart', 'Original', 'Digital', 'Traditional', 'Sketch', 'Roleplay', 'Lainnya'];

app.post('/api/artworks', requireLogin, upload.array('images', 5), (req, res) => {
  const { title, description } = req.body;
  let tags = req.body.tags;
  if (!title || !req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'Judul & minimal 1 gambar wajib diisi' });
  }

  // tags bisa datang sebagai string tunggal atau array (tergantung berapa kali field dikirim)
  if (!tags) tags = [];
  else if (!Array.isArray(tags)) tags = [tags];
  tags = tags.filter(t => ALLOWED_TAGS.includes(t)).slice(0, 5);

  const data = db.load();
  const artwork = {
    id: db.nextId(data, 'artworks'),
    user_id: req.session.user.id,
    title,
    description: description || '',
    filenames: req.files.map(f => f.filename),
    tags,
    created_at: new Date().toISOString()
  };
  data.artworks.push(artwork);
  db.save(data);

  res.json({ success: true, id: artwork.id });
});

app.get('/api/tags', (req, res) => {
  res.json({ tags: ALLOWED_TAGS });
});

app.get('/api/artworks', (req, res) => {
  const { q, tag } = req.query;
  const data = db.load();
  const userId = req.session.user ? req.session.user.id : 0;

  let rows = [...data.artworks];
  if (q && q.trim() !== '') {
    const qLower = q.toLowerCase();
    rows = rows.filter(a => a.title.toLowerCase().includes(qLower));
  }
  if (tag && tag.trim() !== '' && tag !== 'Semua') {
    rows = rows.filter(a => Array.isArray(a.tags) && a.tags.includes(tag));
  }
  rows.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const result = rows.map(a => {
    const user = data.users.find(u => u.id === a.user_id);
    const likes = data.reactions.filter(r => r.artwork_id === a.id && r.type === 'like').length;
    const dislikes = data.reactions.filter(r => r.artwork_id === a.id && r.type === 'dislike').length;
    const commentsCount = data.comments.filter(c => c.artwork_id === a.id).length;
    const myReaction = userId ? data.reactions.find(r => r.artwork_id === a.id && r.user_id === userId) : null;

    return {
      ...a,
      username: user ? user.username : 'unknown',
      display_name: user ? (user.display_name || user.username) : 'unknown',
      avatar: user ? user.avatar : null,
      likes,
      dislikes,
      comments_count: commentsCount,
      my_reaction: myReaction ? myReaction.type : null
    };
  });

  res.json(result);
});

app.delete('/api/artworks/:id', requireLogin, (req, res) => {
  const artworkId = parseInt(req.params.id);
  const data = db.load();
  const art = data.artworks.find(a => a.id === artworkId);
  if (!art) return res.status(404).json({ error: 'Tidak ditemukan' });
  if (art.user_id !== req.session.user.id) return res.status(403).json({ error: 'Bukan milikmu' });

  data.artworks = data.artworks.filter(a => a.id !== artworkId);
  data.reactions = data.reactions.filter(r => r.artwork_id !== artworkId);
  data.comments = data.comments.filter(c => c.artwork_id !== artworkId);
  db.save(data);

  const filesToDelete = art.filenames || (art.filename ? [art.filename] : []);
  filesToDelete.forEach(fn => {
    const filePath = path.join(ASSETS_DIR, fn);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  });

  res.json({ success: true });
});

// ================= REACTIONS (like/dislike) =================
app.post('/api/artworks/:id/react', requireLogin, (req, res) => {
  const { type } = req.body;
  if (!['like', 'dislike'].includes(type)) return res.status(400).json({ error: 'Tipe tidak valid' });

  const artworkId = parseInt(req.params.id);
  const userId = req.session.user.id;
  const data = db.load();

  const existingIdx = data.reactions.findIndex(r => r.artwork_id === artworkId && r.user_id === userId);

  if (existingIdx !== -1 && data.reactions[existingIdx].type === type) {
    data.reactions.splice(existingIdx, 1);
  } else if (existingIdx !== -1) {
    data.reactions[existingIdx].type = type;
  } else {
    data.reactions.push({
      id: db.nextId(data, 'reactions'),
      artwork_id: artworkId,
      user_id: userId,
      type
    });
  }
  db.save(data);

  const likes = data.reactions.filter(r => r.artwork_id === artworkId && r.type === 'like').length;
  const dislikes = data.reactions.filter(r => r.artwork_id === artworkId && r.type === 'dislike').length;
  const my = data.reactions.find(r => r.artwork_id === artworkId && r.user_id === userId);

  res.json({ likes, dislikes, my_reaction: my ? my.type : null });
});

// ================= COMMENTS =================
app.get('/api/artworks/:id/comments', (req, res) => {
  const artworkId = parseInt(req.params.id);
  const data = db.load();
  const rows = data.comments
    .filter(c => c.artwork_id === artworkId)
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    .map(c => {
      const user = data.users.find(u => u.id === c.user_id);
      return {
        ...c,
        username: user ? user.username : 'unknown',
        display_name: user ? (user.display_name || user.username) : 'unknown',
        avatar: user ? user.avatar : null
      };
    });
  res.json(rows);
});

app.post('/api/artworks/:id/comments', requireLogin, (req, res) => {
  const { content } = req.body;
  if (!content || content.trim() === '') return res.status(400).json({ error: 'Komentar kosong' });

  const artworkId = parseInt(req.params.id);
  const data = db.load();
  const comment = {
    id: db.nextId(data, 'comments'),
    artwork_id: artworkId,
    user_id: req.session.user.id,
    content: content.trim(),
    created_at: new Date().toISOString()
  };
  data.comments.push(comment);
  db.save(data);

  const user = data.users.find(u => u.id === req.session.user.id);
  res.json({ ...comment, username: user.username, display_name: user.display_name, avatar: user.avatar });
});

// ================= KEEP-ALIVE =================
// Endpoint ringan untuk dipanggil bot/cron eksternal supaya server (di Render dsb)
// tidak di-sleep karena idle. Sengaja tidak menyentuh db.json biar responsnya cepat & murah.
app.get('/api/ping', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// ================= PAGES =================
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'views', 'login.html')));

// Halaman utama situs (landing page) disajikan di root domain.
app.get('/', (req, res) => res.sendFile(path.join(ROOT_DIR, 'halaman-utama.html')));

// Galeri karya (artwork-app) dipindah ke /gallery agar tidak bentrok dengan halaman utama.
app.get('/gallery', (req, res) => res.sendFile(path.join(__dirname, 'views', 'index.html')));

// Halaman tentang komunitas.
app.get('/tentang', (req, res) => res.sendFile(path.join(ROOT_DIR, 'tentang.html')));

// Webmaker (redirect ke folder statisnya agar path rapi tanpa trailing slash wajib)
app.get('/webmaker', (req, res) => res.sendFile(path.join(ROOT_DIR, 'Webmaker', 'index.html')));

// Halaman deteksi malware (frontend disajikan dari sini, tapi API scan-nya
// jalan di server Python terpisah — lihat deteksi-malware/server.py)
app.get('/deteksi-malware', (req, res) => res.sendFile(path.join(ROOT_DIR, 'deteksi-malware', 'file_deteksi.html')));

app.listen(PORT, () => {
  console.log(`Server jalan di http://localhost:${PORT}`);
  console.log(`Assets tersimpan di: ${ASSETS_DIR}`);
  console.log(`Database tersimpan di: ${db.DB_FILE}`);
  startSelfPing();
});

// ================= SELF-PING (KEEP-ALIVE) =================
// Ping diri sendiri tiap 14 menit supaya platform hosting (mis. Render free tier,
// yang men-sleep service setelah 15 menit tanpa traffic) menganggap server masih aktif.
// Catatan: ini HANYA mencegah server tidur selagi dia masih hidup. Kalau server sudah
// benar-benar sleep/restart, self-ping ini tidak bisa membangunkannya sendiri — untuk itu
// tetap perlu ping dari LUAR (mis. cron-job.org / UptimeRobot) sebagai lapisan kedua.
function startSelfPing() {
  // URL publik server ini. WAJIB diisi di environment variable SELF_URL saat deploy,
  // contoh: SELF_URL=https://nama-app-kamu.onrender.com
  // Kalau kosong, self-ping otomatis dilewati (misal saat development lokal).
  const SELF_URL = process.env.SELF_URL;
  if (!SELF_URL) {
    console.log('[keep-alive] SELF_URL tidak diset, self-ping dilewati (mode lokal).');
    return;
  }

  const PING_INTERVAL_MS = 14 * 60 * 1000; // 14 menit

  setInterval(async () => {
    try {
      const res = await fetch(`${SELF_URL.replace(/\/$/, '')}/api/ping`);
      console.log(`[keep-alive] self-ping ${res.status} pada ${new Date().toISOString()}`);
    } catch (err) {
      console.error('[keep-alive] self-ping gagal:', err.message);
    }
  }, PING_INTERVAL_MS);

  console.log(`[keep-alive] self-ping aktif, target: ${SELF_URL} setiap 14 menit`);
}

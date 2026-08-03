const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'data', 'db.json');

function defaultData() {
  return {
    users: [],       // { id, username, email, password, display_name, bio, avatar, created_at }
    // artworks: { id, user_id, title, description, filenames: [], tags: [], created_at }
    // filenames = array (mendukung banyak gambar per karya / carousel)
    // tags = array string kategori, mis. ["Fanart", "Digital"]
    artworks: [],
    reactions: [],    // { id, artwork_id, user_id, type }
    comments: [],     // { id, artwork_id, user_id, content, created_at }
    follows: [],      // { id, follower_id, following_id, created_at }
    // Kode reset password. Disimpan terpisah (bukan di dalam user) supaya gampang
    // dibersihkan/kadaluarsa tanpa nyentuh data user. { email, code, expires_at, verified }
    resetCodes: [],
    nextId: { users: 1, artworks: 1, reactions: 1, comments: 1, follows: 1 }
  };
}

function load() {
  if (!fs.existsSync(DB_FILE)) {
    save(defaultData());
  }
  const raw = fs.readFileSync(DB_FILE, 'utf-8');
  try {
    const data = JSON.parse(raw);
    // migrasi ringan: pastikan field baru ada di user lama
    data.users.forEach(u => {
      if (u.display_name === undefined) u.display_name = u.username;
      if (u.bio === undefined) u.bio = '';
      if (u.avatar === undefined) u.avatar = null;
      if (u.email === undefined) u.email = null; // user lama sebelum fitur email ditambahkan
    });
    // Migrasi karya lama: filename tunggal -> filenames array, tambah tags kosong kalau belum ada
    data.artworks.forEach(a => {
      if (a.filenames === undefined) {
        a.filenames = a.filename ? [a.filename] : [];
      }
      if (a.tags === undefined) a.tags = [];
    });
    if (data.follows === undefined) data.follows = [];
    if (data.nextId.follows === undefined) data.nextId.follows = 1;
    if (data.resetCodes === undefined) data.resetCodes = [];
    return data;
  } catch (e) {
    const fresh = defaultData();
    save(fresh);
    return fresh;
  }
}

function save(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

function nextId(data, table) {
  return data.nextId[table]++;
}

module.exports = { load, save, nextId, DB_FILE };

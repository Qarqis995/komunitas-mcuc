# Komunitas Kami — Website Gabungan

Semua bagian website (halaman utama, tentang, galeri karya, web creator) sekarang
disajikan dari **satu server Node.js** supaya session login tetap nyambung di semua halaman.

## Struktur

```
/
├── halaman-utama.html     # Landing page (dark theme, foto event, pop-up login)
├── tentang.html            # Placeholder halaman tentang komunitas (isi masih perlu dilengkapi)
├── assets/
│   └── foto-grup/          # Foto 4 grup komunitas (dubbing, showart, roblox, RP)
├── Webmaker/
│   ├── index.html          # Web Creator v5.0 (dari WebCreator.html)
│   ├── manifest.json       # PWA manifest khusus Web Creator
│   ├── sw.js                # Service worker Web Creator
│   └── icon.svg
└── artwork-app/            # Server Node.js (Express) — WAJIB dijalankan untuk seluruh situs
    ├── server.js            # Menyajikan SEMUA halaman + API auth/artwork
    ├── db.js
    ├── package.json
    ├── data/
    │   └── db.json          # Database JSON (users, artworks, dst)
    ├── public/               # CSS/JS galeri
    └── views/
        ├── index.html        # Galeri karya (/gallery)
        └── login.html         # Halaman login fallback (/login)
```

## Routing

| URL          | Isi                                             |
|--------------|--------------------------------------------------|
| `/`          | `halaman-utama.html` (landing page)              |
| `/tentang`   | `tentang.html`                                   |
| `/gallery`   | Galeri karya (artwork-app)                       |
| `/webmaker`  | Web Creator                                      |
| `/login`     | Form login terpisah (fallback, biasanya pakai pop-up di halaman utama) |
| `/api/...`   | Semua endpoint API (login, register, artworks, dst) |

## Cara Menjalankan (lokal)

```bash
cd artwork-app
npm install
npm start
```

Lalu buka `http://localhost:3000`.

## ⚠️ Sebelum Deploy ke Publik

1. **Ganti password default.** `artwork-app/data/db.json` berisi akun contoh dengan
   password tersimpan dalam bentuk teks biasa (tidak di-hash). Ganti atau hapus akun
   ini sebelum situs online, dan pertimbangkan menambahkan hashing password (mis. `bcrypt`)
   jika akan dipakai banyak orang.
2. **Ganti `session secret`** di `artwork-app/server.js` (baris `secret: 'artwork-gallery-secret-key-ganti-jika-perlu'`)
   dengan string acak yang panjang.
3. **Lengkapi `tentang.html`** — saat ini masih placeholder.
4. **Tambahkan foto event** ke `assets/foto-event.jpg` untuk ditampilkan di hero halaman utama
   (jika belum ada, hero akan tampil kosong tanpa foto).

## Hosting

Karena `artwork-app` adalah server Node.js dengan database file (`db.json`) dan upload
gambar (avatar & karya) yang disimpan di disk, situs ini **tidak bisa** di-hosting di
Netlify (Netlify hanya untuk file statis + serverless function, tanpa penyimpanan disk
persisten). Lihat rekomendasi hosting dari asisten untuk pilihan yang cocok.

## Keep-Alive (biar server gratis tidak "ditidurkan")

Banyak platform hosting gratis (Render, dsb) men-**sleep** service setelah ~15 menit
tanpa kunjungan, dan request pertama setelahnya jadi lambat (30-60 detik). Project ini
sudah dilengkapi 2 lapis "bot" ping supaya server tetap aktif:

### Lapis 1 - Self-ping (sudah otomatis di server.js)
Server ping dirinya sendiri tiap 14 menit ke endpoint `/api/ping`. Ini mencegah server
sleep **selama dia masih hidup**, tapi tidak bisa membangunkan server yang sudah
benar-benar sleep/restart.

Aktifkan dengan mengisi environment variable `SELF_URL` saat deploy, contoh:
```
SELF_URL=https://nama-app-kamu.onrender.com
```
Kalau `SELF_URL` tidak diisi, self-ping otomatis dilewati (aman untuk development lokal).

### Lapis 2 - Ping eksternal (WAJIB disetel manual, di luar kode)
Self-ping saja tidak cukup karena kalau server sempat sleep/restart duluan (misal
platform hosting-nya redeploy), tidak ada yang bisa membangunkannya dari dalam. Karena
itu perlu layanan cron eksternal yang ping dari luar:

1. Daftar gratis di **cron-job.org** (tanpa kartu kredit)
2. Buat cronjob baru:
   - URL: `https://nama-app-kamu.onrender.com/api/ping`
   - Interval: setiap 14 menit (atau custom schedule `*/14 * * * *`)
3. Simpan - cron-job.org otomatis mengirim request ke server setiap 14 menit, 24/7

Endpoint `/api/ping` sengaja dibuat sangat ringan (tidak membaca/menulis `db.json`)
supaya ping ini murah dan cepat, tidak membebani server.

> Catatan: keep-alive ini menjaga server **tetap terjaga**, bukan solusi untuk masalah
> disk yang tidak persisten di sebagian platform gratis. Data (`db.json`, avatar, karya)
> tetap bisa hilang saat redeploy di platform seperti Render free tier - itu masalah
> terpisah yang perlu solusi database/storage eksternal jika dibutuhkan.

## Versi 1 - Perbaikan & Fitur Baru

### Bug fix
1. **Logo WhatsApp di halaman Tentang** — SVG lama tampil berantakan/glitch, sudah diganti
   dengan logo resmi yang bersih dan proporsional.
2. **Pop-up login stuck saat batal** — sebelumnya, klik "Upload Karya" saat belum login akan
   redirect ke halaman `/login` terpisah, dan tombol back browser bisa membuat user "nyangkut"
   di loop redirect. Sekarang login/register muncul sebagai modal inline (baik di beranda
   maupun di galeri), dengan tombol "Batal, kembali ke beranda" yang selalu mengarah balik
   ke `/` secara eksplisit — tidak lagi bergantung pada riwayat browser.

### Fitur baru

**1. Lupa Password (kode 6 digit via email)**
- Alur 3 tahap: masukkan email -> terima kode 6 digit -> verifikasi -> set password baru
- Kode berlaku 10 menit, sekali pakai, dan ada jeda 60 detik sebelum bisa kirim ulang
- Field `email` sekarang **wajib** diisi saat daftar akun (dibutuhkan untuk fitur ini)
- Pengirim email: `xyzfarx995775@gmail.com` — isi App Password Gmail di
  `artwork-app/.env` (lihat `.env.example` untuk formatnya)

**2. Halaman Deteksi Malware** (folder `deteksi-malware/`)
- Server Python terpisah (`server.py`) yang jadi proxy ke VirusTotal, Hybrid Analysis,
  dan MetaDefender — sengaja dipisah dari server Node.js karena logic-nya sudah matang
  di Python dan migrasi ulang ke Node.js berisiko menambah bug baru
- **Cara jalanin di Termux**: buka 2 sesi (bisa pakai `tmux`), satu untuk
  `node server.js` (artwork-app) dan satu untuk `python server.py` (deteksi-malware)
- Isi API key kamu sendiri di `deteksi-malware/.env` (salin dari `.env.example`) —
  **jangan commit file `.env` asli ke git**
- Halaman diakses lewat `/deteksi-malware` di server Node.js utama, tapi proses
  scan file sesungguhnya jalan lewat `server.py` di `localhost:8080`

**3. Cropper foto profil 1:1**
- Saat ganti foto profil, muncul modal crop dengan area lingkaran, bisa digeser (drag)
  dan diperbesar/perkecil (slider atau scroll)
- Hasil crop otomatis diproses jadi persegi 512x512 sebelum diunggah ke server
- Dibangun pakai Canvas API murni, tanpa library eksternal

**4. Upload Karya yang lebih kompleks**
- **Multi-gambar per karya** (maks. 5), tampil sebagai carousel yang bisa digeser/swipe
  di galeri (gambar pertama otomatis jadi sampul)
- **Kategori/tag** (Fanart, Original, Digital, Traditional, Sketch, Roleplay, Lainnya),
  bisa pilih hingga 5 tag per karya, dan bisa difilter di halaman galeri
- **Drag & drop** file langsung ke area upload, dengan preview thumbnail yang bisa
  dihapus satu per satu sebelum upload
- **Progress bar** upload real-time (pakai XMLHttpRequest, karena `fetch` belum
  mendukung progress upload secara native)

## ⚠️ Keamanan — Perlu Ditindaklanjuti

- **API key deteksi malware**: kamu sempat mengirim file `.env` berisi API key asli
  (VirusTotal, Hybrid Analysis, MetaDefender) lewat chat. File itu **tidak disertakan**
  dalam paket ini (cuma `.env.example` template) supaya tidak dobel. Kalau khawatir key
  itu sudah terekspos, regenerate dari dashboard masing-masing layanan.
- **App Password Gmail**: setelah dibuat, simpan baik-baik di `.env`, jangan share atau
  commit ke git publik.
- **Password user tersimpan tanpa enkripsi** di `db.json` — ini keputusan yang sudah ada
  sejak awal project, di luar scope perbaikan saat ini. Pertimbangkan menambahkan hashing
  (mis. `bcrypt`) sebelum situs dipakai banyak orang.

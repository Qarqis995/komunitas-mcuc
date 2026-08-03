document.getElementById('loginLogo').innerHTML = Icons.logo + '<span>Gallery</span>';
document.getElementById('registerLogo').innerHTML = Icons.logo + '<span>Gallery</span>';

const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const alertBox = document.getElementById('alertBox');
const regAlertBox = document.getElementById('regAlertBox');
const registerModal = document.getElementById('registerModal');

function showAlert(box, msg) {
  box.textContent = msg;
  box.style.display = 'block';
}
function hideAlert(box) {
  box.style.display = 'none';
}

// Cek jika sudah login, redirect ke halaman utama
fetch('/api/me').then(r => r.json()).then(data => {
  if (data.user) window.location.href = '/gallery';
});

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideAlert(alertBox);
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;

  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) return showAlert(alertBox, data.error || 'Gagal masuk');
    window.location.href = '/gallery';
  } catch (err) {
    showAlert(alertBox, 'Terjadi kesalahan koneksi');
  }
});

document.getElementById('showRegisterBtn').addEventListener('click', () => {
  registerModal.style.display = 'flex';
});
document.getElementById('closeRegisterBtn').addEventListener('click', () => {
  registerModal.style.display = 'none';
});

registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideAlert(regAlertBox);
  const username = document.getElementById('regUsername').value.trim();
  const password = document.getElementById('regPassword').value;

  try {
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) return showAlert(regAlertBox, data.error || 'Gagal mendaftar');
    window.location.href = '/gallery';
  } catch (err) {
    showAlert(regAlertBox, 'Terjadi kesalahan koneksi');
  }
});

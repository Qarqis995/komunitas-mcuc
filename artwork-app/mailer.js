const nodemailer = require('nodemailer');

// Kredensial diambil dari environment variable, JANGAN hardcode di sini.
// Isi di file .env:
//   EMAIL_USER=xyzfarx995775@gmail.com
//   EMAIL_APP_PASSWORD=xxxxxxxxxxxxxxxx   (App Password Gmail, 16 karakter, BUKAN password akun biasa)
const EMAIL_USER = process.env.EMAIL_USER || '';
const EMAIL_APP_PASSWORD = process.env.EMAIL_APP_PASSWORD || '';

let transporter = null;

function getTransporter() {
  if (!EMAIL_USER || !EMAIL_APP_PASSWORD) {
    return null; // belum dikonfigurasi
  }
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_APP_PASSWORD
      }
    });
  }
  return transporter;
}

function isConfigured() {
  return !!(EMAIL_USER && EMAIL_APP_PASSWORD);
}

/**
 * Kirim email berisi kode reset password 6 digit.
 * @param {string} toEmail - alamat email tujuan
 * @param {string} code - kode 6 digit
 * @param {string} username - untuk personalisasi email
 */
async function sendResetCode(toEmail, code, username) {
  const t = getTransporter();
  if (!t) {
    throw new Error('Email belum dikonfigurasi di server (EMAIL_USER / EMAIL_APP_PASSWORD kosong)');
  }

  const html = `
  <div style="font-family: -apple-system, Segoe UI, Roboto, Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #0a0e17; color: #dbe6f0; padding: 32px 24px; border-radius: 16px;">
    <div style="text-align:center; margin-bottom: 24px;">
      <span style="color:#4fd8ff; font-weight:700; font-size: 18px;">Komunitas Kami</span>
    </div>
    <h2 style="color:#dbe6f0; font-size: 18px; margin-bottom: 8px;">Reset Password</h2>
    <p style="color:#6b7d94; font-size: 14px; line-height: 1.6;">
      Halo <strong>${escapeHtml(username)}</strong>, kami menerima permintaan reset password untuk akunmu.
      Gunakan kode berikut untuk melanjutkan:
    </p>
    <div style="background:#121a27; border:1px solid #1c2634; border-radius: 12px; padding: 20px; text-align:center; margin: 20px 0;">
      <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color:#00b4ff;">${code}</span>
    </div>
    <p style="color:#6b7d94; font-size: 13px; line-height: 1.6;">
      Kode ini berlaku selama <strong>10 menit</strong>. Jangan bagikan kode ini ke siapa pun.
      Kalau kamu tidak merasa meminta reset password, abaikan saja email ini.
    </p>
  </div>`;

  await t.sendMail({
    from: `"Komunitas Kami" <${EMAIL_USER}>`,
    to: toEmail,
    subject: `${code} adalah kode reset password kamu`,
    html
  });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

module.exports = { sendResetCode, isConfigured };

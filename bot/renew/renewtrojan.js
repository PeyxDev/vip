const axios = require('axios');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.db');

async function renewtrojan(username, exp, quota, limitip, serverId) {
  console.log(`Renewing Trojan account for ${username} with expiry ${exp} days, quota ${quota} GB, limit IP ${limitip} on server ${serverId}`);
  
  // Validasi username
  if (/\s/.test(username) || /[^a-zA-Z0-9]/.test(username)) {
    return '❌ Username tidak valid. Mohon gunakan hanya huruf dan angka tanpa spasi.';
  }

  // Ambil domain dari database
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM Server WHERE id = ?', [serverId], (err, server) => {
      if (err) {
        console.error('Error fetching server:', err.message);
        return resolve('❌ Server tidak ditemukan. Silakan coba lagi.');
      }

      if (!server) return resolve('❌ Server tidak ditemukan. Silakan coba lagi.');

      const domain = server.domain;
      const auth = server.auth;
      const param = `:5888/renewtrojan?user=${username}&exp=${exp}&quota=${quota}&iplimit=${limitip}&auth=${auth}`;
      const url = `http://${domain}${param}`;
      axios.get(url)
        .then(response => {
          if (response.data.status === "success") {
            const trojanData = response.data.data;
            const msg = `
🌟 *RENEW TROJAN PREMIUM* 🌟

🔹 *Informasi Akun*
┌─────────────────────────────
│ Username: \`${username}\`
│ Kadaluarsa: \`${trojanData.exp}\`
│ Kuota: \`${trojanData.quota}\`
│ Batas IP: \`${trojanData.limitip} IP\`
└─────────────────────────────
✅ Akun ${username} berhasil diperbarui
✨ Selamat menggunakan layanan kami! ✨
`;
         
              console.log('Trojan account renewed successfully');
              return resolve(msg);
            } else {
              console.log('Error renewing Trojan account');
              return resolve(`❌ Terjadi kesalahan: ${response.data.message}`);
            }
          })
        .catch(error => {
          console.error('Error saat memperbarui Trojan:', error);
          return resolve('❌ Terjadi kesalahan saat memperbarui Trojan. Silakan coba lagi nanti.');
        });
    });
  });
}

module.exports = { renewtrojan };

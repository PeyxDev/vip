const axios = require('axios');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.db');

async function createtrojan(username, exp, quota, limitip, serverId) {
  console.log(`Creating Trojan account for ${username} with expiry ${exp} days, quota ${quota} GB, limit IP ${limitip} on server ${serverId}`);
  
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
      const param = `:5888/createtrojan?user=${username}&exp=${exp}&quota=${quota}&iplimit=${limitip}&auth=${auth}`;
      const url = `http://${domain}${param}`;
      axios.get(url)
        .then(response => {
          if (response.data.status === "success") {
            const trojanData = response.data.data;
            const msg = `
🌟 *AKUN TROJAN PREMIUM* 🌟

🔹 *Informasi Akun*
┌─────────────────────
│ *Username* : \`${trojanData.username}\`
│ *Domain*   : \`${trojanData.domain}\`
│ *Port TLS* : \`443\`
│ *Port HTTP*: \`80\`
│ *Security* : \`Auto\`
│ *Network*  : \`Websocket (WS)\`
│ *Path*     : \`/trojan-ws\`
│ *Path GRPC*: \`trojan-grpc\`
└─────────────────────
🔐 *URL TROJAN TLS*
\`\`\`
${trojanData.trojan_tls_link}
\`\`\`
🔒 *URL TROJAN GRPC*
\`\`\`
${trojanData.trojan_grpc_link}
\`\`\`
🔒 *PUBKEY*
\`\`\`
${trojanData.pubkey}
\`\`\`
┌─────────────────────
│ Expiry: \`${trojanData.expired}\`
│ Quota: \`${trojanData.quota === '0 GB' ? 'Unlimited' : trojanData.quota}\`
│ IP Limit: \`${trojanData.ip_limit === '0' ? 'Unlimited' : trojanData.ip_limit} IP\`
└─────────────────────
Save Account Link: [Save Account](https://${trojanData.domain}:81/trojan-${trojanData.username}.txt)
✨ Selamat menggunakan layanan kami! ✨
`;
              console.log('Trojan account created successfully');
              return resolve(msg);
            } else {
              console.log('Error creating Trojan account');
              return resolve(`❌ Terjadi kesalahan: ${response.data.message}`);
            }
          })
        .catch(error => {
          console.error('Error saat membuat Trojan:', error);
          return resolve('❌ Terjadi kesalahan saat membuat Trojan. Silakan coba lagi nanti.');
        });
    });
  });
}

module.exports = { createtrojan };

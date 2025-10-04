const axios = require('axios');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.db');

async function createshadowsocks(username, exp, quota, limitip, serverId) {
  console.log(`Creating Shadowsocks account for ${username} with expiry ${exp} days, quota ${quota} GB, limit IP ${limitip} on server ${serverId}`);
  
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
      const param = `:5888/createshadowsocks?user=${username}&exp=${exp}&quota=${quota}&iplimit=${limitip}&auth=${auth}`;
      const url = `http://${domain}${param}`;
      axios.get(url)
        .then(response => {
          if (response.data.status === "success") {
            const shadowsocksData = response.data.data;
            const msg = `
🌟 *AKUN SHADOWSOCKS PREMIUM* 🌟

🔹 *Informasi Akun*
┌─────────────────────
│ *Username* : \`${shadowsocksData.username}\`
│ *Domain*   : \`${shadowsocksData.domain}\`
│ *Port TLS* : \`443\`
│ *Port HTTP*: \`80\`
│ *Alter ID* : \`0\`
│ *Security* : \`Auto\`
│ *Network*  : \`Websocket (WS)\`
│ *Path*     : \`/shadowsocks\`
│ *Path GRPC*: \`shadowsocks-grpc\`
└─────────────────────
🔐 *URL SHADOWSOCKS TLS*
\`\`\`
${shadowsocksData.ss_link_ws}
\`\`\`
🔒 *URL SHADOWSOCKS GRPC*
\`\`\`
${shadowsocksData.ss_link_grpc}
\`\`\`
🔒 *PUBKEY*
\`\`\`
${shadowsocksData.pubkey}
\`\`\`
┌─────────────────────
│ Expiry: \`${shadowsocksData.expired}\`
│ Quota: \`${shadowsocksData.quota === '0 GB' ? 'Unlimited' : shadowsocksData.quota}\`
│ IP Limit: \`${shadowsocksData.ip_limit === '0' ? 'Unlimited' : shadowsocksData.ip_limit} IP\`
└─────────────────────
Save Account Link: [Save Account](https://${shadowsocksData.domain}:81/shadowsocks-${shadowsocksData.username}.txt)
✨ Selamat menggunakan layanan kami! ✨
`;
              console.log('Shadowsocks account created successfully');
              return resolve(msg);
            } else {
              console.log('Error creating Shadowsocks account');
              return resolve(`❌ Terjadi kesalahan: ${response.data.message}`);
            }
          })
        .catch(error => {
          console.error('Error saat membuat Shadowsocks:', error);
          return resolve('❌ Terjadi kesalahan saat membuat Shadowsocks. Silakan coba lagi nanti.');
        });
    });
  });
}

module.exports = { createshadowsocks };

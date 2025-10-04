const axios = require('axios');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.db');

async function createssh(username, password, exp, iplimit, serverId) {
  console.log(`Creating SSH account for ${username} with expiry ${exp} days, IP limit ${iplimit}, and password ${password}`);
  
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
      const param = `:5888/createssh?user=${username}&password=${password}&exp=${exp}&iplimit=${iplimit}&auth=${auth}`;
      const url = `http://${domain}${param}`;
      axios.get(url)
        .then(response => {
          if (response.data.status === "success") {
            const sshData = response.data.data;
            const msg = `
🌟 *AKUN SSH PREMIUM* 🌟

🔹 *Informasi Akun*
┌─────────────────────
│ *Username* : \`${sshData.username}\`
│ *Password* : \`${sshData.password}\`
└─────────────────────
┌─────────────────────
│ *Domain*   : \`${sshData.domain}\`
│ *Port TLS* : \`443\`
│ *Port HTTP*: \`80\`
│ *OpenSSH*  : \`22\`
│ *UdpSSH*   : \`1-65535\`
│ *DNS*      : \`443, 53, 22\`
│ *Dropbear* : \`443, 109\`
│ *SSH WS*   : \`80\`
│ *SSH SSL WS*: \`443\`
│ *SSL/TLS*  : \`443\`
│ *OVPN SSL* : \`443\`
│ *OVPN TCP* : \`1194\`
│ *OVPN UDP* : \`2200\`
│ *BadVPN UDP*: \`7100, 7300, 7300\`
└─────────────────────
🔒 *PUBKEY*
\`\`\`
${sshData.pubkey}
\`\`\`
🔗 *Link dan Payload*
───────────────────────
WSS Payload      : 
\`\`\`
GET wss://BUG.COM/ HTTP/1.1
Host: ${sshData.domain}
Upgrade: websocket
\`\`\`
OpenVPN Link     : [Download OpenVPN](https://${sshData.domain}:81/allovpn.zip)
Save Account Link: [Save Account](https://${sshData.domain}:81/ssh-${sshData.username}.txt)
───────────────────────
┌─────────────────────
│ Expires: \`${sshData.expired}\`
│ IP Limit: \`${sshData.ip_limit}\`
└─────────────────────

✨ Selamat menggunakan layanan kami! ✨
`;
              console.log('SSH account created successfully');
              return resolve(msg);
            } else {
              console.log('Error creating SSH account');
              return resolve(`❌ Terjadi kesalahan: ${response.data.message}`);
            }
          })
        .catch(error => {
          console.error('Error saat membuat SSH:', error);
          return resolve('❌ Terjadi kesalahan saat membuat SSH. Silakan coba lagi nanti.');
        });
    });
  });
}

module.exports = { createssh };
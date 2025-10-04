const sqlite3 = require('sqlite3').verbose();
const { Telegraf, Scenes, session } = require('telegraf');
const moment = require('moment');
const fs = require('fs');
const os = require('os');
const axios = require('axios');
const { exec, execSync } = require('child_process');
const { createvmess } = require('./create/createvmess');
const { createvless } = require('./create/createvless');
const { createtrojan } = require('./create/createtrojan');
const { createshadowsocks } = require('./create/createshadowsocks');
// import create modules
const { createssh } = require('./create/createssh');
const { checkvmess } = require('./check/checkvmess');
const { checkvless } = require('./check/checkvless');
const { checktrojan } = require('./check/checktrojan');
const { checkshadowsocks } = require('./check/checkshadowsock');
const { checkssh } = require('./check/checkssh');
// import renew modules
const { renewvmess } = require('./renew/renewvmess');
const { renewvless } = require('./renew/renewvless');
const { renewtrojan } = require('./renew/renewtrojan');
const { renewshadowsocks } = require('./renew/renewshadowsocks');
const { renewssh } = require('./renew/renewssh');
// import delete modules
const { deletevmess } = require('./delete/deletevmess');
const { deletevless } = require('./delete/deletevless');
const { deletetrojan } = require('./delete/deletetrojan');
const { deleteshadowsocks } = require('./delete/deleteshadowsocks');
const { deletessh } = require('./delete/deletessh');

const { BOT_TOKEN, ADMIN } = require('/root/.bot/.vars.json');
const bot = new Telegraf(BOT_TOKEN);
// Daftar ID admin yang diizinkan
const adminIds = ADMIN; // Ganti dengan ID admin yang diizinkan
console.log('Bot initialized');

// Koneksi ke SQLite3
const db = new sqlite3.Database('./database.db', (err) => {
  if (err) {
    console.error('Kesalahan koneksi SQLite3:', err.message);
  } else {
    console.log('Terhubung ke SQLite3');
  }
});

// Buat tabel Server jika belum ada
db.run(`CREATE TABLE IF NOT EXISTS Server (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  domain TEXT,
  auth TEXT
)`, (err) => {
  if (err) {
    console.error('Kesalahan membuat tabel Server:', err.message);
  } else {
    console.log('Server table created or already exists');
  }
});

// Menyimpan state pengguna
const userState = {};
console.log('User state initialized');
// Step 2: Tangkap pilihan protokol
const userSelections = {};

// Tambahkan command menu dan start
bot.command('menu', async (ctx) => {
  console.log('Menu command received');
  await sendMainMenu(ctx);
});

bot.command('start', async (ctx) => {
  console.log('Start command received');
  await sendMainMenu(ctx);
});

bot.command('admin', async (ctx) => {
  console.log('Admin menu requested');
  
  if (!adminIds.includes(ctx.from.id)) {
    await ctx.reply('Anda tidak memiliki izin untuk mengakses menu admin.');
    return;
  }

  await sendAdminMenu(ctx);
});

function countLines(file) {
  try {
    if (!fs.existsSync(file)) return 0;
    const data = fs.readFileSync(file, 'utf8').trim();
    if (!data) return 0;
    return data.split('\n').filter(line => line.trim() !== '').length;
  } catch {
    return 0;
  }
}

async function sendMainMenu(ctx) {
  const keyboard = [
  [
    { text: 'Service Create', callback_data: 'service_create' },
    { text: 'Service Delete', callback_data: 'service_delete' },
  ],
  [
    { text: 'Service Renew', callback_data: 'service_renew' },
    { text: 'Service Check', callback_data: 'service_check' }
  ],
  [
    { text: 'Service Trial', callback_data: 'trial_menu' }
  ],
  [
    { text: 'List Semua Member', callback_data: 'list_all_members' } // tombol baru
  ]
];

  // Hitung jumlah akun
  const sshCount = countLines('/etc/ssh/.ssh.db');
  const ssCount = countLines('/etc/xray/shadowsocks/.shadowsocks.db');
  const trojanCount = countLines('/etc/xray/trojan/.trojan.db');
  const vlessCount = countLines('/etc/xray/vless/.vless.db');
  const vmessCount = countLines('/etc/xray/vmess/.vmess.db');
  const totalAccounts = sshCount + ssCount + trojanCount + vlessCount + vmessCount;

  // Info server
  const ip = execSync('curl -s ipv4.icanhazip.com').toString().trim();
  const isp = execSync(`curl -s ipinfo.io/org || echo "Unknown ISP"`).toString().trim();
  const domain = fs.existsSync('/etc/xray/domain') ? fs.readFileSync('/etc/xray/domain', 'utf8').trim() : os.hostname();
  const city = fs.existsSync('/etc/xray/city') ? fs.readFileSync('/etc/xray/city', 'utf8').trim() : 'Unknown';
  const currentTime = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });

  const messageText = `╔═══════════════════════╗
     📊  𝗗𝗔𝗦𝗛𝗕𝗢𝗔𝗥𝗗 𝗠𝗘𝗡𝗨 𝗕𝗢𝗧  
╚═══════════════════════╝
 🌐 *Server Info*
 ━━━━━━━━━━━━━━━━━━━━
 🖥 OS  : ${execSync('lsb_release -d | cut -f2').toString().trim()}
 🏢 ISP : ${isp}
 📍 Location  : ${city}
 🌎 Domain  : ${domain}
 🔑 IP  : ${ip}
 👥 *Account Summary*
 ━━━━━━━━━━━━━━━━━━━━
 🛡 SSH  : ${sshCount} akun
 🧿 VMess  : ${vmessCount} akun
 🔏 VLess  : ${vlessCount} akun
 ⚔️ Trojan  : ${trojanCount} akun
 📡 Shadowsocks  : ${ssCount} akun

 📦 *Total Accounts* : ${totalAccounts} akun
 ━━━━━━━━━━━━━━━━━━━━
`;

  try {
    await ctx.editMessageText(messageText, {
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: keyboard }
    });
    console.log('Main menu sent');
  } catch (error) {
    if (error.response && error.response.error_code === 400) {
      await ctx.reply(messageText, {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: keyboard }
      });
      console.log('Main menu sent as new message');
    } else {
      console.error('Error saat mengirim menu utama:', error);
    }
  }
}

/// Fungsi untuk menangani semua jenis layanan
async function handleServiceAction(ctx, action) {
  let keyboard;
if (action === 'create') {
  keyboard = [
    [{ text: 'Create SSH', callback_data: 'create_ssh' }],
    [{ text: 'Create Vmess', callback_data: 'create_vmess' }],
    [{ text: 'Create Vless', callback_data: 'create_vless' }],
    [{ text: 'Create Trojan', callback_data: 'create_trojan' }],
    [{ text: 'Create Shadowsocks', callback_data: 'create_shadowsocks' }],
    [{ text: '🔙 Kembali', callback_data: 'send_main_menu' }]
  ];
} else if (action === 'delete') {
  keyboard = [
    [{ text: 'Delete SSH', callback_data: 'delete_ssh' }],
    [{ text: 'Delete Vmess', callback_data: 'delete_vmess' }],
    [{ text: 'Delete Vless', callback_data: 'delete_vless' }],
    [{ text: 'Delete Trojan', callback_data: 'delete_trojan' }],
    [{ text: 'Delete Shadowsocks', callback_data: 'delete_shadowsocks' }],
    [{ text: '🔙 Kembali', callback_data: 'send_main_menu' }]
  ];
} else if (action === 'renew') {
  keyboard = [
    [{ text: 'Renew SSH', callback_data: 'renew_ssh' }],
    [{ text: 'Renew Vmess', callback_data: 'renew_vmess' }],
    [{ text: 'Renew Vless', callback_data: 'renew_vless' }],
    [{ text: 'Renew Trojan', callback_data: 'renew_trojan' }],
    [{ text: 'Renew Shadowsocks', callback_data: 'renew_shadowsocks' }],
    [{ text: '🔙 Kembali', callback_data: 'send_main_menu' }]
  ];
} else if (action === 'check') {
  keyboard = [
    [{ text: 'Check SSH', callback_data: 'check_ssh' }],
    [{ text: 'Check Vmess', callback_data: 'check_vmess' }],
    [{ text: 'Check Vless', callback_data: 'check_vless' }],
    [{ text: 'Check Trojan', callback_data: 'check_trojan' }],
    [{ text: 'Check Shadowsocks', callback_data: 'check_shadowsocks' }],
    [{ text: '🔙 Kembali', callback_data: 'send_main_menu' }]
  ];
} else if (action === 'trial') {
  keyboard = [
    [{ text: 'Trial SSH', callback_data: 'trial_select_ssh' }],
    [{ text: 'Trial Vmess', callback_data: 'trial_select_vmess' }],
    [{ text: 'Trial VLess', callback_data: 'trial_select_vless' }],
    [{ text: 'Trial Trojan', callback_data: 'trial_select_trojan' }],
    [{ text: 'Trial Shadowsocks', callback_data: 'trial_select_ss' }],
    [{ text: '🔙 Kembali', callback_data: 'send_main_menu' }]
  ];
}

  try {
    await ctx.editMessageReplyMarkup({
      inline_keyboard: keyboard
    });
    console.log(`${action} service menu sent`);
  } catch (error) {
    if (error.response && error.response.error_code === 400) {
      // Jika pesan tidak dapat diedit, kirim pesan baru
      await ctx.reply(`Pilih jenis layanan yang ingin Anda ${action}:`, {
        reply_markup: {
          inline_keyboard: keyboard
        }
      });
      console.log(`${action} service menu sent as new message`);
    } else {
      console.error(`Error saat mengirim menu ${action}:`, error);
    }
  }
}

async function sendAdminMenu(ctx) {
  const adminKeyboard = [
    [{ text: '➕ Tambah Server', callback_data: 'addserver' }],
    [{ text: '❌ Hapus Server', callback_data: 'deleteserver' }],   
    [{ text: '📜 List Server', callback_data: 'listserver' }],     
    [{ text: '🗑️ Reset Server', callback_data: 'resetdb' }],
    [{ text: '🔙 Kembali', callback_data: 'send_main_menu' }]
  ];

  try {
    await ctx.editMessageReplyMarkup({
      inline_keyboard: adminKeyboard
    });
    console.log('Admin menu sent');
  } catch (error) {
    if (error.response && error.response.error_code === 400) {
      // Jika pesan tidak dapat diedit, kirim pesan baru
      await ctx.reply('Menu Admin:', {
        reply_markup: {
          inline_keyboard: adminKeyboard
        }
      });
      console.log('Admin menu sent as new message');
    } else {
      console.error('Error saat mengirim menu admin:', error);
    }
  }
}

// Function to start selecting a server (tidak diubah)
async function startSelectServer(ctx, action, type) {
  try {
    console.log(`Memulai proses ${action} untuk ${type}`);
    db.all('SELECT * FROM Server', [], (err, servers) => {
      if (err) {
        console.error('Error fetching servers:', err.message);
        return ctx.reply('⚠️ PERHATIAN! Tidak ada server yang tersedia saat ini. Coba lagi nanti!');
      }
      if (servers.length === 0) {
        return ctx.reply('⚠️ PERHATIAN! Tidak ada server yang tersedia saat ini. Coba lagi nanti!');
      }
      const keyboard = servers.map(server => {
        return [{ text: server.domain, callback_data: `${action}_username_${type}_${server.id}` }];
      });
      keyboard.push([{ text: '🔙 Kembali ke Menu Utama', callback_data: 'send_main_menu' }]);
      ctx.answerCbQuery();
      ctx.deleteMessage();
      ctx.reply('Pilih server:', {
        reply_markup: { inline_keyboard: keyboard }
      });
      userState[ctx.chat.id] = { step: `${action}_username_${type}` };
    });
  } catch (error) {
    console.error(`Error saat memulai proses ${action} untuk ${type}:`, error);
    await ctx.reply(`❌ GAGAL! Terjadi kesalahan saat memproses permintaan Anda.`);
  }
}


async function startSelectServerMembers(ctx) {
  try {
    console.log(`Memulai proses melihat member`);
    db.all('SELECT * FROM Server', [], (err, servers) => {
      if (err) {
        console.error('Error fetching servers:', err.message);
        return ctx.reply('⚠️ PERHATIAN! Tidak ada server yang tersedia saat ini. Coba lagi nanti!');
      }
      if (servers.length === 0) {
        return ctx.reply('⚠️ PERHATIAN! Tidak ada server yang tersedia saat ini. Coba lagi nanti!');
      }

      const keyboard = servers.map(server => {
        return [{ text: server.domain, callback_data: `member_${server.id}` }];
      });

      keyboard.push([{ text: '🔙 Kembali ke Menu Utama', callback_data: 'send_main_menu' }]);

      ctx.answerCbQuery();
      ctx.deleteMessage();
      ctx.reply('Pilih server untuk melihat member:', {
        reply_markup: { inline_keyboard: keyboard }
      });

    });
  } catch (error) {
    console.error(`Error saat memulai proses melihat member:`, error);
    await ctx.reply(`❌ GAGAL! Terjadi kesalahan saat memproses permintaan Anda.`);
  }
}

// === Trigger tombol list_all_members ===
bot.action('list_all_members', async (ctx) => {
  await startSelectServerMembers(ctx);
});

// === Handler untuk callback member_[id] ===
bot.action(/member_(\d+)/, async (ctx) => {
  try {
    const serverId = ctx.match[1];
    ctx.answerCbQuery();
    await ctx.reply('⏳ Mengambil daftar member...');

    db.get('SELECT * FROM Server WHERE id = ?', [serverId], (err, server) => {
      if (err || !server) {
        return ctx.reply('❌ Server tidak ditemukan.');
      }

      const listProtocols = [
        { name: 'SSH', path: '/etc/ssh/.ssh.db' },
        { name: 'VMess', path: '/etc/xray/vmess/.vmess.db' },
        { name: 'VLess', path: '/etc/xray/vless/.vless.db' },
        { name: 'Trojan', path: '/etc/xray/trojan/.trojan.db' },
        { name: 'Shadowsocks', path: '/etc/xray/shadowsocks/.shadowsocks.db' }
      ];

      let reply = `📋 *Daftar Member - ${server.domain}*\n────────────────────\n`;

      for (const proto of listProtocols) {
        reply += `\n💠 *${proto.name}*:\n`;

        if (fs.existsSync(proto.path)) {
          const data = fs.readFileSync(proto.path, 'utf8').trim();
          if (data) {
            const users = data.split('\n');
            users.forEach((user, index) => {
              reply += `${index + 1}. ${user}\n`;
            });
            reply += `📌 _Total ${proto.name}: ${users.length} akun_\n`;
          } else {
            reply += `_Tidak ada akun_\n`;
          }
        } else {
          reply += `_Database tidak ditemukan_\n`;
        }
      }

      ctx.reply(reply, { parse_mode: 'Markdown' });
    });
  } catch (error) {
    console.error('Error show members:', error);
    ctx.reply('❌ Terjadi kesalahan saat mengambil daftar member.');
  }
});
// Action handlers untuk semua jenis layanan
bot.action('trial_menu', async (ctx) => {
  await handleServiceAction(ctx, 'trial');
});

bot.action('service_create', async (ctx) => {
  await handleServiceAction(ctx, 'create');
});

bot.action('service_delete', async (ctx) => {
  await handleServiceAction(ctx, 'delete');
});

bot.action('service_renew', async (ctx) => {
  await handleServiceAction(ctx, 'renew');
});

bot.action('service_check', async (ctx) => {
  await handleServiceAction(ctx, 'check');
});

// Action handler untuk kembali ke menu utama
bot.action('send_main_menu', async (ctx) => {
  await sendMainMenu(ctx);
});

// Action handlers for creating accounts
bot.action('create_vmess', async (ctx) => {
  await startSelectServer(ctx, 'create', 'vmess');
});

bot.action('create_vless', async (ctx) => {
  await startSelectServer(ctx, 'create', 'vless');
});

bot.action('create_trojan', async (ctx) => {
  await startSelectServer(ctx, 'create', 'trojan');
});

bot.action('create_shadowsocks', async (ctx) => {
  await startSelectServer(ctx, 'create', 'shadowsocks');
});

bot.action('create_ssh', async (ctx) => {
  await startSelectServer(ctx, 'create', 'ssh');
});

// Action handlers for deleting accounts
bot.action('delete_vmess', async (ctx) => {
  await startSelectServer(ctx, 'delete', 'vmess');
});

bot.action('delete_vless', async (ctx) => {
  await startSelectServer(ctx, 'delete', 'vless');
});

bot.action('delete_trojan', async (ctx) => {
  await startSelectServer(ctx, 'delete', 'trojan');
});

bot.action('delete_shadowsocks', async (ctx) => {
  await startSelectServer(ctx, 'delete', 'shadowsocks');
});

bot.action('delete_ssh', async (ctx) => {
  await startSelectServer(ctx, 'delete', 'ssh');
});

// Action handlers for renewing accounts
bot.action('renew_vmess', async (ctx) => {
  await startSelectServer(ctx, 'renew', 'vmess');
});

bot.action('renew_vless', async (ctx) => {
  await startSelectServer(ctx, 'renew', 'vless');
});

bot.action('renew_trojan', async (ctx) => {
  await startSelectServer(ctx, 'renew', 'trojan');
});

bot.action('renew_shadowsocks', async (ctx) => {
  await startSelectServer(ctx, 'renew', 'shadowsocks');
});

bot.action('renew_ssh', async (ctx) => {
  await startSelectServer(ctx, 'renew', 'ssh');
});
// Action handlers for checking accounts
bot.action('check_vmess', async (ctx) => {
  await startSelectServer(ctx, 'check', 'vmess');
});

bot.action('check_vless', async (ctx) => {
  await startSelectServer(ctx, 'check', 'vless');
});

bot.action('check_trojan', async (ctx) => {
  await startSelectServer(ctx, 'check', 'trojan');
});

bot.action('check_shadowsocks', async (ctx) => {
  await startSelectServer(ctx, 'check', 'shadowsocks');
});

bot.action('check_ssh', async (ctx) => {
  await startSelectServer(ctx, 'check', 'ssh');
});

// Action trial protocol -> pilih server
bot.action('trial_select_ssh', async (ctx) => {
  await startSelectServer(ctx, 'trial', 'ssh');
});

bot.action('trial_select_vmess', async (ctx) => {
  await startSelectServer(ctx, 'trial', 'vmess');
});

bot.action('trial_select_vless', async (ctx) => {
  await startSelectServer(ctx, 'trial', 'vless');
});

bot.action('trial_select_trojan', async (ctx) => {
  await startSelectServer(ctx, 'trial', 'trojan');
});

bot.action('trial_select_ss', async (ctx) => {
  await startSelectServer(ctx, 'trial', 'ss');
});


// Setelah pilih server untuk trial → minta durasi
bot.action(/trial_username_(vmess|vless|trojan|ss|ssh)_(.+)/, async (ctx) => {
  const type = ctx.match[1];
  const serverId = ctx.match[2];
  userState[ctx.chat.id] = { step: `trial_duration_${type}`, serverId, type };
  await ctx.reply(`Masukkan durasi trial ${type.toUpperCase()} (menit):`);
});

// Handle server selection untuk create/delete/renew/check
bot.action(/(create|delete|renew|check)_username_(vmess|vless|trojan|shadowsocks|ssh)_(.+)/, async (ctx) => {
  const action = ctx.match[1];
  const type = ctx.match[2];
  const serverId = ctx.match[3];
  userState[ctx.chat.id] = { step: `username_${action}_${type}`, serverId, type, action };
  if (action === 'check') {
    let msg;
    if (type === 'vmess') msg = await checkvmess(serverId);
    else if (type === 'vless') msg = await checkvless(serverId);
    else if (type === 'trojan') msg = await checktrojan(serverId);
    else if (type === 'shadowsocks') msg = await checkshadowsocks(serverId);
    else if (type === 'ssh') msg = await checkssh(serverId);
    await ctx.reply(msg, { parse_mode: 'Markdown' });
    delete userState[ctx.chat.id];
  } else {
    await ctx.reply('👤 Masukkan username:');
  }
});

// === Hapus handler lama yang bentrok ===
// bot.action(/^trial_select_(.+)$/, ...)  <-- DIHAPUS

// Handle text input
bot.on('text', async (ctx) => {
  const chatId = ctx.chat.id;
  const state = userState[chatId]; // dipindah ke awal supaya bisa dipakai langsung

  // ==== FLOW TRIAL ====
  if (state && state.step.startsWith('trial_duration_')) {
    const duration = parseInt(ctx.message.text.trim());
    if (isNaN(duration) || duration <= 0) {
      return ctx.reply('❌ Durasi harus angka menit yang valid!');
    }

    const { type, serverId } = state;
    delete userState[chatId];

    const scriptMap = {
      ssh: '/usr/bin/apitrial-ssh',
      vmess: '/usr/bin/apitrial-vmess',
      vless: '/usr/bin/apitrial-vless',
      trojan: '/usr/bin/apitrial-trojan',
      ss: '/usr/bin/apitrial-shadowsocks'
    };

    ctx.reply(`⏳ Membuat akun trial *${type}* selama *${duration} menit*...`, { parse_mode: 'Markdown' });

    exec(`${scriptMap[type]} ${duration} ${serverId}`, (error, stdout) => {
      if (error) {
        console.error("Script error:", error);
        return ctx.reply('❌ Gagal membuat akun trial.');
      }
      try {
        const json = JSON.parse(stdout.trim());
        if (json.status !== 'success') {
          return ctx.reply('❌ Gagal membuat akun trial.');
        }
        let reply = `⚡ *TRIAL ${json.protocol?.toUpperCase() || type.toUpperCase()}*\n\n`;
reply += `👤 User: \`${json.username}\`\n`;
if (json.uuid) reply += `🆔 UUID: \`${json.uuid}\`\n`;
if (json.password) reply += `🔑 Password: \`${json.password}\`\n`;
reply += `🌍 Domain: \`${json.domain}\`\n`;
reply += `🏙️ Kota: \`${json.city}\`\n`;
reply += `📆 Expired: ${json.expiration}\n\n`;

// === SSH ===
if (type === 'ssh' && json.ports) {
  reply += `📡 *Ports:*\n`;
  for (let key in json.ports) reply += `   • ${key}: ${json.ports[key]}\n`;
  reply += `\n`;
  if (json.wss_payload) reply += `💬 *WSS Payload:*\n\`${json.wss_payload}\`\n\n`;
}

// === VMESS ===
if (type === 'vmess') {
  if (json.link_tls) reply += `🔗 *TLS Link:*\n\`${json.link_tls}\`\n\n`;
  if (json.link_ntls) reply += `🔗 *Non-TLS Link:*\n\`${json.link_ntls}\`\n\n`;
  if (json.link_grpc) reply += `🔗 *gRPC Link:*\n\`${json.link_grpc}\`\n\n`;
  if (json.link_ws) reply += `🔗 *WebSocket Link:*\n\`${json.link_ws}\`\n\n`;
}

// === VLESS ===
if (type === 'vless') {
  if (json.link_tls) reply += `🔗 *TLS Link:*\n\`${json.link_tls}\`\n\n`;
  if (json.link_ntls) reply += `🔗 *Non-TLS Link:*\n\`${json.link_ntls}\`\n\n`;
  if (json.link_grpc) reply += `🔗 *gRPC Link:*\n\`${json.link_grpc}\`\n\n`;
  if (json.link_ws) reply += `🔗 *WebSocket Link:*\n\`${json.link_ws}\`\n\n`;
}

// === TROJAN ===
if (type === 'trojan') {
  if (json.link_tls) reply += `🔗 *TLS Link:*\n\`${json.link_tls}\`\n\n`;
  if (json.link_grpc) reply += `🔗 *gRPC Link:*\n\`${json.link_grpc}\`\n\n`;
  if (json.link_ws) reply += `🔗 *WebSocket Link:*\n\`${json.link_ws}\`\n\n`;
}

// === SHADOWSOCKS ===
if (type === 'ss') {
  if (json.method) reply += `⚙️ Method: \`${json.method}\`\n`;
  if (json.password) reply += `🔑 Password: \`${json.password}\`\n`;
  if (json.ss_uri) reply += `🔗 *SS URI:*\n\`${json.ss_uri}\`\n\n`;
  if (json.ss_qr) reply += `🖼 *QR Code:*\n${json.ss_qr}\n\n`;
}

// === Link umum (kalau ada) ===
if (json.openvpn_link) reply += `🔗 OpenVPN: ${json.openvpn_link}\n`;
if (json.save_link) reply += `💾 Save Link: ${json.save_link}\n`;
        ctx.reply(reply, { parse_mode: 'Markdown', disable_web_page_preview: true });
      } catch (e) {
        console.error("Parsing error:", e);
        ctx.reply('❌ Output tidak valid dari script trial.');
      }
    });
    return;
  }
    
  if (!state) return; // Jika tidak ada state, abaikan pesan

  if (state.step.startsWith('username_')) {
    state.username = ctx.message.text;
    const { username, serverId, type, action } = state;
    let msg;
    if (action === 'create') {
      if (type === 'ssh') {
        state.step = `password_${state.action}_${state.type}`;
        await ctx.reply('🔑 Masukkan password:');
      } else {
        state.step = `exp_${state.action}_${state.type}`;
        await ctx.reply('⏳ Masukkan masa aktif (hari):');
      }
    } else if (action === 'renew') {
      state.step = `exp_${state.action}_${state.type}`;
      await ctx.reply('⏳ Masukkan masa aktif (hari):');
    } else if (action === 'delete') {
      if (type === 'vmess') {
        msg = await deletevmess(username, serverId);
      } else if (type === 'vless') {
        msg = await deletevless(username, serverId);
      } else if (type === 'trojan') {
        msg = await deletetrojan(username, serverId);
      } else if (type === 'shadowsocks') {
        msg = await deleteshadowsocks(username, serverId);
      } else if (type === 'ssh') {
        msg = await deletessh(username, serverId);
      }
      await ctx.reply(msg, { parse_mode: 'Markdown' });
      delete userState[ctx.chat.id];
    }
  } else if (state.step.startsWith('password_')) {
    state.password = ctx.message.text;
    state.step = `exp_${state.action}_${state.type}`;
    await ctx.reply('⏳ Masukkan masa aktif (hari):');
  } else if (state.step.startsWith('exp_')) {
    if (!/^\d+$/.test(ctx.message.text)) {
      await ctx.reply('❌ PERHATIAN! Masukkan HANYA ANGKA untuk masa berlaku akun!');
      return;
    }
    state.exp = ctx.message.text;
    if (state.type === 'ssh') {
      state.step = `limitip_${state.action}_${state.type}`;
      await ctx.reply('🔢 Masukkan limit IP:');
    } else {
      state.step = `quota_${state.action}_${state.type}`;
      await ctx.reply('📊 Masukkan quota (GB):');
    }
  } else if (state.step.startsWith('quota_')) {
    if (!/^\d+$/.test(ctx.message.text)) {
      await ctx.reply('❌ PERHATIAN! Masukkan HANYA ANGKA untuk quota!');
      return;
    }
    state.quota = ctx.message.text;
    state.step = `limitip_${state.action}_${state.type}`;
    await ctx.reply('🔢 Masukkan limit IP:');
  } else if (state.step.startsWith('limitip_')) {
    if (!/^\d+$/.test(ctx.message.text)) {
      await ctx.reply('❌ PERHATIAN! Masukkan HANYA ANGKA untuk limit IP!');
      return;
    }
    state.limitip = ctx.message.text;
    const { username, password, exp, quota, limitip, serverId, type, action } = state;
    let msg;
    if (action === 'create') {
      if (type === 'vmess') {
        msg = await createvmess(username, exp, quota, limitip, serverId);
      } else if (type === 'vless') {
        msg = await createvless(username, exp, quota, limitip, serverId);
      } else if (type === 'trojan') {
        msg = await createtrojan(username, exp, quota, limitip, serverId);
      } else if (type === 'shadowsocks') {
        msg = await createshadowsocks(username, exp, quota, limitip, serverId);
      } else if (type === 'ssh') {
        msg = await createssh(username, password, exp, limitip, serverId);
      }
    } else if (action === 'renew') {
      if (type === 'vmess') {
        msg = await renewvmess(username, exp, quota, limitip, serverId);
      } else if (type === 'vless') {
        msg = await renewvless(username, exp, quota, limitip, serverId);
      } else if (type === 'trojan') {
        msg = await renewtrojan(username, exp, quota, limitip, serverId);
      } else if (type === 'shadowsocks') {
        msg = await renewshadowsocks(username, exp, quota, limitip, serverId);
      } else if (type === 'ssh') {
        msg = await renewssh(username, exp, limitip, serverId);
      }
    }
    await ctx.reply(msg, { parse_mode: 'Markdown' });
    delete userState[ctx.chat.id];
  } else if (state.step === 'addserver') {
    const domain = ctx.message.text.trim();
    if (!domain) {
      await ctx.reply('⚠️ Domain tidak boleh kosong. Silakan masukkan domain server yang valid.');
      return;
    }

    state.step = 'addserver_auth';
    state.domain = domain;
    await ctx.reply('🔑 Silakan masukkan auth server:');
  } else if (state.step === 'addserver_auth') {
    const auth = ctx.message.text.trim();
    if (!auth) {
      await ctx.reply('⚠️ Auth tidak boleh kosong. Silakan masukkan auth server yang valid.');
      return;
    }

    const { domain } = state;

    try {
      db.run('INSERT INTO Server (domain, auth) VALUES (?, ?)', [domain, auth], function(err) {
        if (err) {
          console.error('Error saat menambahkan server:', err.message);
          ctx.reply('❌ Terjadi kesalahan saat menambahkan server baru.');
        } else {
          ctx.reply(`✅ Server baru dengan domain ${domain} telah berhasil ditambahkan.`);
        }
      });
    } catch (error) {
      console.error('Error saat menambahkan server:', error);
      await ctx.reply('❌ Terjadi kesalahan saat menambahkan server baru.');
    }
    delete userState[ctx.chat.id];
  }
});
//ADMIN
bot.action('deleteserver', async (ctx) => {
  try {
    console.log('Delete server process started');
    await ctx.answerCbQuery();
    
    db.all('SELECT * FROM Server', [], (err, servers) => {
      if (err) {
        console.error('Error fetching servers:', err.message);
        return ctx.reply('⚠️ PERHATIAN! Terjadi kesalahan saat mengambil daftar server.');
      }

      if (servers.length === 0) {
        console.log('Tidak ada server yang tersedia');
        return ctx.reply('⚠️ PERHATIAN! Tidak ada server yang tersedia saat ini.');
      }

      const keyboard = servers.map(server => {
        return [{ text: server.domain, callback_data: `confirm_delete_server_${server.id}` }];
      });
      keyboard.push([{ text: '🔙 Kembali ke Menu Utama', callback_data: 'send_main_menu' }]);

      ctx.reply('Pilih server yang ingin dihapus:', {
        reply_markup: {
          inline_keyboard: keyboard
        }
      });
    });
  } catch (error) {
    console.error('Kesalahan saat memulai proses hapus server:', error);
    await ctx.reply('❌ GAGAL! Terjadi kesalahan saat memproses permintaan Anda. Silakan coba lagi nanti.');
  }
});

bot.action(/confirm_delete_server_(\d+)/, async (ctx) => {
  try {
    db.run('DELETE FROM Server WHERE id = ?', [ctx.match[1]], function(err) {
      if (err) {
        console.error('Error deleting server:', err.message);
        return ctx.reply('⚠️ PERHATIAN! Terjadi kesalahan saat menghapus server.');
      }

      if (this.changes === 0) {
        console.log('Server tidak ditemukan');
        return ctx.reply('⚠️ PERHATIAN! Server tidak ditemukan.');
      }

      console.log(`Server dengan ID ${ctx.match[1]} berhasil dihapus`);
      ctx.reply('✅ Server berhasil dihapus.');
    });
  } catch (error) {
    console.error('Kesalahan saat menghapus server:', error);
    await ctx.reply('❌ GAGAL! Terjadi kesalahan saat memproses permintaan Anda. Silakan coba lagi nanti.');
  }
});

bot.action('addserver', async (ctx) => {
  try {
    console.log('Add server process started');
    await ctx.answerCbQuery();
    await ctx.reply('🌐 Silakan masukkan domain/ip server:');
    userState[ctx.chat.id] = { step: 'addserver' };
  } catch (error) {
    console.error('Kesalahan saat memulai proses tambah server:', error);
    await ctx.reply('❌ GAGAL! Terjadi kesalahan saat memproses permintaan Anda. Silakan coba lagi nanti.');
  }
});

bot.action('listserver', async (ctx) => {
  try {
    console.log('List server process started');
    await ctx.answerCbQuery();
    
    db.all('SELECT * FROM Server', [], (err, servers) => {
      if (err) {
        console.error('Error fetching servers:', err.message);
        return ctx.reply('⚠️ PERHATIAN! Terjadi kesalahan saat mengambil daftar server.');
      }

      if (servers.length === 0) {
        console.log('Tidak ada server yang tersedia');
        return ctx.reply('⚠️ PERHATIAN! Tidak ada server yang tersedia saat ini.');
      }

      let serverList = '📜 *Daftar Server* 📜\n\n';
      servers.forEach((server, index) => {
        serverList += `${index + 1}. ${server.domain}\n`;
      });

      ctx.reply(serverList, { parse_mode: 'Markdown' });
    });
  } catch (error) {
    console.error('Kesalahan saat mengambil daftar server:', error);
    await ctx.reply('❌ GAGAL! Terjadi kesalahan saat memproses permintaan Anda. Silakan coba lagi nanti.');
  }
});

bot.action('resetdb', async (ctx) => {
  try {
    await ctx.answerCbQuery();
    db.run('DELETE FROM Server', (err) => {
      if (err) {
        console.error('Error saat mereset tabel Server:', err.message);
        ctx.reply('❗️ PERHATIAN! Terjadi KESALAHAN SERIUS saat mereset database. Harap segera hubungi administrator!');
      }
    });
    await ctx.reply('🚨 PERHATIAN! Database telah DIRESET SEPENUHNYA. Semua server telah DIHAPUS TOTAL.');
  } catch (error) {
    console.error('Error saat mereset database:', error);
    await ctx.reply('❗️ PERHATIAN! Terjadi KESALAHAN SERIUS saat mereset database. Harap segera hubungi administrator!');
  }
});

// Mulai bot
bot.launch().then(() => {
  console.log('Bot telah dimulai');
}).catch((error) => {
  console.error('Error saat memulai bot:', error);
});
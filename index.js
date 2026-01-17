const { Client } = require('discord.js-selfbot-v13');
const express = require('express');
const fetch = require('node-fetch');

console.log('🚀 Discord Bump Bot Starting...');

// ==================== CONFIG ====================
const USER_TOKEN = process.env.USER_TOKEN;
const TARGET_SERVER_ID = '1447204367089270874';
const TARGET_CHANNEL_ID = '1447213878030237696';
const DISBOARD_BOT_ID = '302050872383242240';
const BUMP_COMMAND_ID = '947088344167366698';

// ==================== VALIDATION ====================
if (!USER_TOKEN) {
  console.error('❌ USER_TOKEN missing');
  process.exit(1);
}

console.log('✅ Config loaded');
console.log('⚠️  Educational use only');

// ==================== CLIENT ====================
const client = new Client({
  checkUpdate: false
});

let isConnected = false;

// ==================== BUMP FUNCTION ====================
async function sendBump() {
  try {
    console.log('🔄 Sending /bump command...');
    
    const response = await fetch('https://discord.com/api/v9/interactions', {
      method: 'POST',
      headers: {
        'Authorization': USER_TOKEN,
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0'
      },
      body: JSON.stringify({
        type: 2,
        application_id: DISBOARD_BOT_ID,
        guild_id: TARGET_SERVER_ID,
        channel_id: TARGET_CHANNEL_ID,
        data: {
          id: BUMP_COMMAND_ID,
          name: "bump",
          type: 1
        }
      })
    });

    if (response.ok) {
      console.log('✅ Bump sent successfully!');
      console.log('⏰ Next bump in 2 hours');
      return true;
    } else {
      console.log('❌ Bump failed:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
    return false;
  }
}

// ==================== CLIENT EVENTS ====================
client.on('ready', () => {
  console.log(`✅ Connected as ${client.user.tag}`);
  isConnected = true;
  
  // Send first bump
  sendBump();
  
  // Schedule bumps every 2 hours
  setInterval(() => {
    sendBump();
  }, 7200000);
});

// ==================== WEB SERVER ====================
const app = express();

app.get('/', (req, res) => {
  res.json({
    status: isConnected ? 'online' : 'connecting',
    user: client.user?.tag || 'Not connected'
  });
});

app.get('/health', (req, res) => {
  res.send('OK');
});

// ==================== START ====================
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`🌐 Web server on port ${PORT}`);
});

client.login(USER_TOKEN).catch(error => {
  console.error('❌ Login failed:', error.message);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  client.destroy();
  process.exit(0);
});

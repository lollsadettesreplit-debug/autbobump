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
  checkUpdate: false,
  ws: {
    properties: {
      $os: 'linux',
      $browser: 'chrome',
      $device: 'desktop'
    }
  }
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
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      body: JSON.stringify({
        type: 2,
        application_id: DISBOARD_BOT_ID,
        guild_id: TARGET_SERVER_ID,
        channel_id: TARGET_CHANNEL_ID,
        data: {
          id: BUMP_COMMAND_ID,
          name: "bump",
          type: 1,
          options: []
        },
        nonce: Date.now().toString()
      })
    });

    if (response.ok) {
      console.log('✅ Bump sent successfully!');
      console.log('⏰ Next bump in 2 hours');
      return true;
    } else {
      const text = await response.text();
      console.log(`❌ Bump failed (${response.status}): ${text.substring(0, 100)}`);
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
  console.log(`🆔 User ID: ${client.user.id}`);
  isConnected = true;
  
  // Send first bump immediately
  setTimeout(() => sendBump(), 5000);
  
  // Schedule bumps every 2 hours (7200000 ms)
  setInterval(() => {
    sendBump();
  }, 7200000);
});

client.on('disconnect', () => {
  console.log('🔌 Disconnected from Discord');
  isConnected = false;
});

// ==================== WEB SERVER ====================
const app = express();
const PORT = process.env.PORT || 10000;

app.get('/', (req, res) => {
  res.json({
    status: isConnected ? 'online' : 'connecting',
    service: 'discord-bump-bot',
    connected_as: client.user?.tag || 'Not connected',
    next_bump: 'Every 2 hours',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// ==================== STARTUP ====================
async function start() {
  try {
    // Start web server first
    app.listen(PORT, () => {
      console.log(`🌐 Web server on port ${PORT}`);
      console.log(`📊 Health: http://localhost:${PORT}`);
    });
    
    // Connect to Discord
    console.log('🔑 Connecting to Discord...');
    await client.login(USER_TOKEN);
    
  } catch (error) {
    console.error('❌ Failed to start:', error.message);
    process.exit(1);
  }
}

// ==================== GRACEFUL SHUTDOWN ====================
process.on('SIGTERM', () => {
  console.log('🛑 Shutting down gracefully...');
  client.destroy();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Shutting down...');
  client.destroy();
  process.exit(0);
});

// ==================== START ====================
start();

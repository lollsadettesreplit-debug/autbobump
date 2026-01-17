const { Client } = require('discord.js-selfbot-v13');
const express = require('express');
const fetch = require('node-fetch');

console.log('🚀 Discord Utility Service Starting...');

// ==================== CONFIGURATION ====================
const USER_TOKEN = process.env.USER_TOKEN;
const TARGET_SERVER_ID = '1447204367089270874';
const TARGET_CHANNEL_ID = '1447213878030237696';
const DISBOARD_BOT_ID = '302050872383242240';
const BUMP_COMMAND_ID = '947088344167366698';
const BUMP_INTERVAL = 2 * 60 * 60 * 1000; // 2 hours
const RANDOM_DELAY_MIN = 5 * 60 * 1000; // 5 minutes
const RANDOM_DELAY_MAX = 10 * 60 * 1000; // 10 minutes

// ==================== VALIDATION ====================
if (!USER_TOKEN) {
  console.error('❌ ERROR: USER_TOKEN environment variable is required');
  console.error('   Set it in Render dashboard → Environment');
  process.exit(1);
}

console.log(`✅ Configuration loaded`);
console.log(`📊 Server: ${TARGET_SERVER_ID}`);
console.log(`📊 Channel: ${TARGET_CHANNEL_ID}`);
console.log(`⚠️  EDUCATIONAL PURPOSE ONLY`);

// ==================== CLIENT SETUP ====================
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

let bumpInterval = null;
let nextBumpTime = null;

// ==================== UTILITY FUNCTIONS ====================
function getRandomDelay() {
  return Math.floor(Math.random() * (RANDOM_DELAY_MAX - RANDOM_DELAY_MIN + 1)) + RANDOM_DELAY_MIN;
}

function formatTime(ms) {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
}

async function triggerSlashCommand() {
  try {
    console.log(`🔧 Attempting to trigger /bump command...`);
    
    const response = await fetch('https://discord.com/api/v9/interactions', {
      method: 'POST',
      headers: {
        'Authorization': USER_TOKEN,
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      body: JSON.stringify({
        type: 2,
        application_id: DISBOARD_BOT_ID,
        guild_id: TARGET_SERVER_ID,
        channel_id: TARGET_CHANNEL_ID,
        session_id: client.sessionId,
        data: {
          version: BUMP_COMMAND_ID,
          id: BUMP_COMMAND_ID,
          name: "bump",
          type: 1,
          options: []
        },
        nonce: (Date.now() * 1000).toString()
      })
    });

    if (response.ok) {
      console.log(`✅ Successfully triggered /bump command`);
      return true;
    } else {
      const errorText = await response.text();
      console.error(`❌ API Error ${response.status}: ${errorText.substring(0, 100)}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Network error: ${error.message}`);
    return false;
  }
}

function scheduleNextBump() {
  const delay = getRandomDelay();
  nextBumpTime = Date.now() + delay;
  
  console.log(`⏰ Next /bump scheduled in ${formatTime(delay)}`);
  
  setTimeout(async () => {
    console.log(`🔄 Executing scheduled /bump...`);
    const success = await triggerSlashCommand();
    
    if (success) {
      console.log(`✅ Bump completed successfully`);
    } else {
      console.log(`⚠️  Bump attempt failed, will retry next cycle`);
    }
    
    // Schedule next bump
    scheduleNextBump();
  }, delay);
}

// ==================== DISCORD CLIENT EVENTS ====================
client.on('ready', () => {
  console.log(`✅ Connected as ${client.user.tag}`);
  console.log(`🆔 User ID: ${client.user.id}`);
  console.log(`📅 Starting bump scheduler...`);
  
  // Start the bump cycle
  scheduleNextBump();
});

client.on('disconnect', () => {
  console.log('🔌 Disconnected from Discord');
  if (bumpInterval) {
    clearInterval(bumpInterval);
    bumpInterval = null;
  }
});

client.on('error', (error) => {
  console.error('❌ Discord client error:', error.message);
});

// ==================== EXPRESS SERVER (FOR RENDER) ====================
const app = express();
const PORT = process.env.PORT || 3000;

// Simple health check endpoint
app.get('/', (req, res) => {
  const status = {
    status: 'online',
    service: 'discord-utility',
    timestamp: new Date().toISOString(),
    user: client.user ? client.user.tag : 'connecting',
    next_bump: nextBumpTime ? new Date(nextBumpTime).toISOString() : null,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    note: 'Educational purposes only'
  };
  
  res.json(status);
});

// Health endpoint for Render
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

app.listen(PORT, () => {
  console.log(`🌐 Web server listening on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}`);
});

// ==================== STARTUP ====================
async function start() {
  try {
    console.log('🔑 Attempting to connect to Discord...');
    await client.login(USER_TOKEN);
  } catch (error) {
    console.error('❌ Failed to connect:', error.message);
    console.error('   Check your USER_TOKEN environment variable');
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  if (bumpInterval) clearInterval(bumpInterval);
  client.destroy();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down...');
  if (bumpInterval) clearInterval(bumpInterval);
  client.destroy();
  process.exit(0);
});

// Start the application
start();

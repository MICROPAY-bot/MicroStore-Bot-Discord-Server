const express = require('express');
const fs = require('fs');
const settingsRepo = require('../repositories/settingsRepo');
const productRepo = require('../repositories/productRepo');
const orderRepo = require('../repositories/orderRepo');
const paymentRepo = require('../repositories/paymentRepo');
const logRepo = require('../repositories/logRepo');
const transcriptRepo = require('../repositories/transcriptRepo');
const youtubeChannelRepo = require('../repositories/youtubeChannelRepo');
const youtubeVideoRepo = require('../repositories/youtubeVideoRepo');
const AnalyticsService = require('../services/AnalyticsService');
const BackupService = require('../services/BackupService');

const router = express.Router();

// The Discord bot client is injected from server.js after login, so this
// module can read live guild data (channel/role lists) for the Settings UI.
let discordClient = null;
function setClient(client) {
  discordClient = client;
}

// Auth: requires a valid Discord OAuth2 session (see src/dashboard/session.js
// and src/dashboard/authRoutes.js). Replaces the old DISCORD_TOKEN bearer
// check from Phase 1/MVP now that Phase 2 login is in place.
function authMiddleware(req, res, next) {
  if (!req.session) {
    return res.status(401).json({ error: 'Belum login. Silakan login lewat Discord.' });
  }
  next();
}

router.use(authMiddleware);
router.use(express.json());

// Runs for every route with a :guildId param — confirms the logged-in user
// actually has Manage Server (or Administrator) permission in that guild,
// so one dashboard user can never read/edit another guild's data.
router.param('guildId', (req, res, next, guildId) => {
  const access = req.session.guilds?.find((g) => g.id === guildId && g.canManage);
  if (!access) {
    return res.status(403).json({ error: 'Anda tidak punya akses admin di server ini.' });
  }
  next();
});

// --- GUILD META (channels & roles, for Settings UI dropdowns) ---

router.get('/guilds/:guildId/meta', (req, res) => {
  const guild = discordClient?.guilds.cache.get(req.params.guildId);
  if (!guild) {
    return res.status(404).json({ error: 'Bot belum bergabung ke server ini.' });
  }

  const channels = guild.channels.cache
    .filter((c) => c.isTextBased() && !c.isThread())
    .map((c) => ({ id: c.id, name: c.name, type: c.type }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const roles = guild.roles.cache
    .filter((r) => r.id !== guild.id) // exclude @everyone
    .map((r) => ({ id: r.id, name: r.name, color: r.hexColor }))
    .sort((a, b) => a.name.localeCompare(b.name));

  res.json({ guildName: guild.name, guildIcon: guild.iconURL(), channels, roles });
});

// --- SETTINGS API ---

router.get('/guilds/:guildId/settings', (req, res) => {
  const settings = settingsRepo.get(req.params.guildId) || settingsRepo.ensure(req.params.guildId);
  res.json(settings || {});
});

router.put('/guilds/:guildId/settings', (req, res) => {
  const { guildId } = req.params;
  const { welcome_message, welcome_role, welcome_channel, verify_channel, verify_role, buyer_role, admin_role, log_channel, qris_image_url } =
    req.body;

  settingsRepo.ensure(guildId);
  if (welcome_message !== undefined) settingsRepo.setWelcomeMessage(guildId, welcome_message);
  if (welcome_role !== undefined) settingsRepo.setWelcomeRole(guildId, welcome_role);
  if (welcome_channel !== undefined || welcome_message !== undefined || welcome_role !== undefined) {
    const current = settingsRepo.get(guildId);
    settingsRepo.setWelcome(
      guildId,
      welcome_channel !== undefined ? welcome_channel : current.welcome_channel,
      welcome_message !== undefined ? welcome_message : current.welcome_message,
      welcome_role !== undefined ? welcome_role : current.welcome_role
    );
  }
  if (verify_channel !== undefined && verify_role !== undefined) settingsRepo.setVerify(guildId, verify_channel, verify_role);
  if (buyer_role !== undefined) settingsRepo.setBuyerRole(guildId, buyer_role);
  if (admin_role !== undefined) settingsRepo.setAdminRole(guildId, admin_role);
  if (log_channel !== undefined) settingsRepo.setLogChannel(guildId, log_channel);
  if (qris_image_url !== undefined) settingsRepo.setQrisImage(guildId, qris_image_url);

  res.json(settingsRepo.get(guildId));
});

// --- PRODUCTS API ---

router.get('/guilds/:guildId/products', (req, res) => {
  const products = productRepo.listActive(req.params.guildId);
  res.json(products);
});

router.post('/guilds/:guildId/products', (req, res) => {
  const { name, price, type, description, delivery_content } = req.body;
  if (!name || !price) {
    return res.status(400).json({ error: 'name and price required' });
  }

  const product = productRepo.add(req.params.guildId, {
    name,
    price: Number(price),
    type: type || 'general',
    description: description || '',
    deliveryContent: delivery_content || '',
  });
  res.json(product);
});

// --- ORDERS API ---

router.get('/guilds/:guildId/orders', (req, res) => {
  const orders = orderRepo.listByGuild(req.params.guildId);
  res.json(orders);
});

// --- PAYMENTS API ---

router.get('/guilds/:guildId/payments', (req, res) => {
  const payments = paymentRepo.listByGuild(req.params.guildId);
  res.json(payments);
});

// --- LOGS API ---

router.get('/guilds/:guildId/logs', (req, res) => {
  const { type } = req.query; // ?type=payment&type=ticket&type=verification&type=transcript
  const logs = logRepo.getByGuild(req.params.guildId, type);
  res.json(logs);
});

// --- TRANSCRIPTS API ---

router.get('/guilds/:guildId/transcripts', (req, res) => {
  const transcripts = transcriptRepo.listByGuild(req.params.guildId);
  res.json(transcripts);
});

router.get('/transcripts/:transcriptId/download', (req, res) => {
  const transcript = transcriptRepo.getById(req.params.transcriptId);
  if (!transcript || !fs.existsSync(transcript.file_path)) {
    return res.status(404).json({ error: 'Transcript not found' });
  }

  res.setHeader('Content-Disposition', `attachment; filename="transcript-${transcript.channel_name}.txt"`);
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  fs.createReadStream(transcript.file_path).pipe(res);
});

// --- YOUTUBE API ---

router.get('/guilds/:guildId/youtube/channels', (req, res) => {
  const channels = youtubeChannelRepo.listByGuild(req.params.guildId);
  res.json(channels);
});

router.post('/guilds/:guildId/youtube/channels', (req, res) => {
  const { discord_channel_id, youtube_channel_id, youtube_channel_name } = req.body;
  if (!discord_channel_id || !youtube_channel_id || !youtube_channel_name) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const channel = youtubeChannelRepo.add(req.params.guildId, discord_channel_id, youtube_channel_id, youtube_channel_name);
  res.json(channel);
});

router.delete('/youtube/channels/:channelId', (req, res) => {
  youtubeChannelRepo.remove(req.params.channelId);
  res.json({ success: true });
});

router.get('/guilds/:guildId/youtube/videos', (req, res) => {
  const videos = youtubeVideoRepo.listByGuild(req.params.guildId);
  res.json(videos);
});

// --- ANALYTICS API (Phase 3) ---

router.get('/guilds/:guildId/analytics', (req, res) => {
  const summary = AnalyticsService.getSummary(req.params.guildId);
  res.json(summary);
});

router.get('/guilds/:guildId/analytics/timeline', (req, res) => {
  const days = req.query.days ? Number(req.query.days) : 30;
  const timeline = AnalyticsService.getRevenueTimeline(req.params.guildId, days);
  res.json(timeline);
});

router.get('/guilds/:guildId/analytics/recent-sales', (req, res) => {
  const limit = req.query.limit ? Number(req.query.limit) : 10;
  const sales = AnalyticsService.getRecentSales(req.params.guildId, limit);
  res.json(sales);
});

// --- BACKUP API (Phase 3) ---
// NOTE: backups cover the entire shared database file (all guilds), so
// these routes are intentionally not guild-scoped.

router.get('/backups', (req, res) => {
  const backups = BackupService.listBackups();
  res.json(backups);
});

router.post('/backups', async (req, res) => {
  try {
    const backup = await BackupService.createBackup(req.body?.triggeredBy || 'dashboard');
    BackupService.pruneOldBackups();
    res.json(backup);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/backups/:filename/download', (req, res) => {
  const filePath = BackupService.getBackupPath(req.params.filename);
  if (!filePath) {
    return res.status(404).json({ error: 'Backup not found' });
  }

  res.setHeader('Content-Disposition', `attachment; filename="${req.params.filename}"`);
  res.setHeader('Content-Type', 'application/octet-stream');
  fs.createReadStream(filePath).pipe(res);
});

module.exports = router;
module.exports.setClient = setClient;
